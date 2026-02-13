"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { getSavingProducts } from "@/services/fssAPI";
import ProfileSettings from "./ProfileSettings";
import GoalChart from "./GoalChart";
import { AlertCircle, ExternalLink, Sparkles } from "lucide-react";

export default function GoalList() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);

  const [userMainBank, setUserMainBank] = useState<string>("");
  const [showOnlyMainBank, setShowOnlyMainBank] = useState(false);

  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // 수정 모드 상태 관리
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    targetAmount: 0,
    monthlySaving: 0,
    term: 6,
  });

  useEffect(() => {
    if (!user) return;

    const checkUserProfile = async () => {
      if (!user) return;

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        console.log("프로필 데이터:", docSnap.data());

        if (docSnap.exists()) {
          const data = docSnap.data();
          // 💡 핵심: 필수 정보(예: 직업, 주거래은행)가 하나라도 없으면 '미완성 프로필'로 간주
          if (!data.jobType || !data.mainBank || !data.birthDate) {
            setIsNewUser(true);
            setShowProfileSettings(true);
          }
        } else {
          // 아예 문서가 없으면(완전 신규) 무조건 오픈
          setIsNewUser(true);
          setShowProfileSettings(true);
        }
      } catch (error) {
        console.error("프로필 확인 실패:", error);
      }
    };
    checkUserProfile();

    // 1. 목표 리스트 구독
    const q = query(
      collection(db, "goals"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        recommendations: (doc.data() as any).recommendations || [],
        isLoading: false,
      }));
      setGoals(goalData);
    });

    // ✅ 2. 주거래 은행 정보 가져오기
    const fetchUserBank = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().mainBank) {
          setUserMainBank(userDoc.data().mainBank);
        }
      } catch (error) {
        console.error("Error fetching user bank:", error);
      }
    };
    fetchUserBank();

    return () => unsubscribe();
  }, [user]);

  const fetchRecommendations = async (goalId: string, term: number) => {
    // 목표를 닫는 경우
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null);
      setSelectedChartId(null); // 차트 선택 상태도 초기화
      return;
    }

    // 목표를 여는 경우
    setExpandedGoalId(goalId);
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, isLoading: true } : g)),
    );

    // 유저의 목표(기간, 금액)에 맞는 상품만 골라내서 정렬하는 함수
    const filterAndSortSimple = (
      baseList: any[],
      optionList: any[],
      goal: any,
    ) => {
      // 1. [병합] 기본 정보 + 금리 옵션 합치기 (기간 맞는 것만!)
      const mergedProducts = baseList
        .map((base) => {
          // 유저가 선택한 기간(예: 12개월)과 일치하는 옵션을 찾습니다.
          const matchOption = optionList.find(
            (opt) =>
              opt.fin_co_no === base.fin_co_no &&
              opt.fin_prdt_cd === base.fin_prdt_cd &&
              opt.save_trm === goal.term.toString(),
          );
          // 옵션이 없으면(해당 기간 상품 아님) null 반환
          return matchOption ? { ...base, ...matchOption } : null;
        })
        .filter((p) => p !== null); // null 제거

      // 2. [필터] 숫자 한도(max_limit)만 체크
      const validProducts = mergedProducts.filter((p) => {
        // API에 'max_limit' 숫자가 명시되어 있고, 그게 내 저축액보다 작으면 제외
        // (null인 경우는 한도 없음으로 간주하고 통과시킴)
        if (p.max_limit !== null && p.max_limit < goal.monthlySaving) {
          return false;
        }
        return true;
      });

      // 3. [정렬] 가중치 기반 스코어링 (Weighted Scoring)
      // 전략: 최고 금리(Potential) 60% + 기본 금리(Stability) 40% 반영
      const sortedProducts = validProducts.sort((a, b) => {
        // null 방지 (API 데이터가 없을 경우 0 처리)
        const baseA = a.intr_rate || 0;
        const maxA = a.intr_rate2 || baseA; // 최고 금리 없으면 기본 금리로

        const baseB = b.intr_rate || 0;
        const maxB = b.intr_rate2 || baseB;

        // ⚖️ 가중치 점수 계산 (Weight Calculation)
        // 기본 금리가 탄탄한 상품이 상위권에 오르도록 유도합니다.
        const scoreA = baseA * 0.4 + maxA * 0.6;
        const scoreB = baseB * 0.4 + maxB * 0.6;

        // 점수가 높은 순서대로 내림차순 정렬
        return scoreB - scoreA;
      });

      // 4. [추출] 상위 15개만 뽑아서 데이터 다이어트 (AI에게 보낼 것들)
      return sortedProducts.slice(0, 15).map((p) => ({
        bankName: p.kor_co_nm,
        productName: p.fin_prdt_nm,
        baseRate: p.intr_rate, // 기본금리
        maxRate: p.intr_rate2, // 최고 우대금리
        condition: p.spcl_cnd, // 우대조건 (AI 분석용)
        joinWay: p.join_way, // 가입방법
        note: p.etc_note, // 기타 유의사항 (혹시 모르니 AI에게 넘겨줌)
      }));
    };

    try {
      // 1. 금감원 데이터 가져오기
      const rawProducts = await getSavingProducts(term);

      if (!user) return;

      // 2. Firestore에서 방금 설정한 확장된 유저 정보 가져오기
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const fullUserData = userDoc.data();
      const currentGoal = goals.find((g) => g.id === goalId);

      const aiReadyData = filterAndSortSimple(
        rawProducts.result.baseList,
        rawProducts.result.optionList,
        { term: term, monthlySaving: currentGoal.monthlySaving },
      );

      if (aiReadyData.length === 0) {
        alert("조건에 맞는 상품이 없습니다.");
        return;
      }

      console.log("AI에게 보낼 데이터:", aiReadyData);

      // 3. Gemini API 호출
      const aiResponse = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userData: {
            ...fullUserData, // 나이, 직업, 카드사용액, 첫거래여부 등 포함
            targetAmount: goals.find((g) => g.id === goalId)?.targetAmount,
            monthlySaving: goals.find((g) => g.id === goalId)?.monthlySaving,
            term: term,
          },
          productList: aiReadyData,
        }),
      });

      const finalData = await aiResponse.json();

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                recommendations: finalData.recommendations,
                isLoading: false,
              }
            : g,
        ),
      );
      setSelectedChartId(`${goalId}-0`);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, isLoading: false } : g)),
      );
    }
  };

  // 삭제 기능
  const handleDelete = async (id: string) => {
    if (window.confirm("정말 이 목표를 삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "goals", id));
    }
  };

  // 수정 모드 진입
  const startEdit = (goal: any) => {
    setEditingId(goal.id);
    setEditFormData({
      title: goal.title,
      targetAmount: goal.targetAmount,
      monthlySaving: goal.monthlySaving,
      term: goal.term,
    });
  };

  // 수정 저장
  const saveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, "goals", id), {
        title: editFormData.title,
        targetAmount: Number(editFormData.targetAmount),
        monthlySaving: Number(editFormData.monthlySaving),
        term: Number(editFormData.term),
      });
      setEditingId(null);
    } catch (error) {
      console.error("Update failed:", error);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="mt-8 grid gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">나의 저축 목표</h2>

        {/* ✅ 상단 필터 (주거래 은행이 있을 때만 표시) */}
        {userMainBank && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyMainBank}
              onChange={(e) => setShowOnlyMainBank(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {userMainBank} 상품만 보기
            </span>
          </label>
        )}
      </div>

      {goals.map((goal) => (
        <div
          key={goal.id}
          className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl"
        >
          {editingId === goal.id ? (
            // [수정 모드 UI] - 기존 코드 유지
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  목표 명칭
                </label>
                <input
                  type="text"
                  className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    목표 금액
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={editFormData.targetAmount}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        targetAmount: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    월 저축액
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={editFormData.monthlySaving}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        monthlySaving: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  기간 (개월)
                </label>
                <select
                  className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editFormData.term}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      term: Number(e.target.value),
                    })
                  }
                >
                  <option value="6">6개월</option>
                  <option value="12">12개월</option>
                  <option value="24">24개월</option>
                  <option value="36">36개월</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded"
                >
                  취소
                </button>
                <button
                  onClick={() => saveEdit(goal.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            // [일반 조회 모드 UI]
            <>
              <div className="flex justify-between items-start mb-4">
                <div className="group relative">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {goal.title}
                    {/* 수정/삭제 버튼 그룹 */}
                    <div className="flex gap-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(goal)}
                        className="hover:text-blue-500 p-1"
                        title="수정"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="hover:text-red-500 p-1"
                        title="삭제"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </h3>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>
                      🎯 목표:{" "}
                      <span className="font-semibold">
                        {goal.targetAmount.toLocaleString()}원
                      </span>
                    </p>
                    <p>💰 월 저축: {goal.monthlySaving.toLocaleString()}원</p>
                    <p>⏳ 기간: {goal.term}개월</p>
                  </div>
                </div>

                {/* 상품 찾기 버튼 */}
                {goal.recommendations.length === 0 && (
                  <button
                    onClick={() => fetchRecommendations(goal.id, goal.term)}
                    disabled={goal.isLoading}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition flex items-center gap-2"
                  >
                    {goal.isLoading ? (
                      <span className="animate-pulse">분석 중...</span>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        상품 찾기
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 추천 상품 리스트 영역 */}
              {goal.recommendations.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
                  <div
                    className="flex justify-between items-center cursor-pointer group select-none"
                    onClick={() =>
                      setExpandedGoalId(
                        expandedGoalId === goal.id ? null : goal.id,
                      )
                    }
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        추천 상품
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedGoalId === goal.id ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {expandedGoalId === goal.id && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      {(() => {
                        // 1. 전체 상품 데이터
                        const allProducts = goal.recommendations;

                        // 2. 주거래 은행 상품만 찾기 (금리 무관)
                        const myBankProducts = userMainBank
                          ? allProducts.filter((p: any) =>
                              p.bankName.includes(userMainBank),
                            )
                          : [];

                        // 3. 주거래 은행을 제외한 나머지 중 금리 높은 순 TOP 3
                        const topRateProducts = allProducts
                          .filter(
                            (p: any) =>
                              !userMainBank ||
                              !p.bankName.includes(userMainBank),
                          )
                          .sort(
                            (a: any, b: any) =>
                              b.maxInterestRate - a.maxInterestRate,
                          )
                          .slice(0, 3);

                        // 4. 최종 리스트: [주거래 상품들] + [나머지 TOP 3]
                        // '주거래만 보기' 필터가 켜져 있으면 주거래 상품만 보여줌
                        const displayList = showOnlyMainBank
                          ? myBankProducts
                          : [...myBankProducts, ...topRateProducts];

                        if (displayList.length === 0) {
                          return (
                            <div className="text-center py-6 text-gray-500 text-sm">
                              조건에 맞는 추천 상품이 없습니다.
                            </div>
                          );
                        }

                        // ... (기본 fetch 로직은 이전과 동일하며, 렌더링 부분 위주로 수정)

                        return displayList.map((prod: any, idx: number) => {
                          if (!prod) return null;
                          const isMainBank =
                            userMainBank &&
                            prod.bankName.includes(userMainBank);
                          const uniqueChartKey = `${goal.id}-${idx}`;
                          const isChartOpen =
                            selectedChartId === uniqueChartKey;

                          return (
                            <div
                              key={uniqueChartKey}
                              className={`rounded-2xl border mb-4 overflow-hidden transition-all ${isChartOpen ? "ring-2 ring-blue-500" : ""}`}
                            >
                              {/* 카드 헤더 */}
                              <div
                                className="p-5 cursor-pointer bg-white dark:bg-gray-800"
                                onClick={() =>
                                  setSelectedChartId(
                                    isChartOpen ? null : uniqueChartKey,
                                  )
                                }
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      {isMainBank && (
                                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold">
                                          🏆 주거래 우대
                                        </span>
                                      )}
                                      {/* AI가 생성한 태그들 */}
                                      {prod.tags?.map((tag: string) => (
                                        <span
                                          key={tag}
                                          className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md font-bold"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                      {prod.productName}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      {prod.bankName}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-gray-400">
                                      AI 예상 금리
                                    </p>
                                    <p className="text-2xl font-black text-blue-600">
                                      {prod.maxInterestRate}%
                                    </p>
                                  </div>
                                </div>

                                {/* 한도 경고 (있을 경우만) */}
                                {prod.limitWarning && (
                                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded-lg flex items-center gap-2">
                                    <AlertCircle size={14} />{" "}
                                    {prod.limitWarning}
                                  </div>
                                )}
                              </div>

                              {/* 펼쳐지는 상세 영역 */}
                              {isChartOpen && (
                                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                                  <GoalChart
                                    targetAmount={goal.targetAmount}
                                    monthlySaving={goal.monthlySaving}
                                    term={goal.term}
                                    interestRate={prod.maxInterestRate}
                                  />

                                  <div className="mt-6 space-y-4">
                                    <div>
                                      <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        <Sparkles
                                          size={16}
                                          className="text-blue-500"
                                        />{" "}
                                        AI의 추천 분석
                                      </h5>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                                        {prod.reason}
                                      </p>
                                    </div>

                                    {prod.managementTip && (
                                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <h5 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                                          💡 가입 전 꿀팁
                                        </h5>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                          {prod.managementTip}
                                        </p>
                                      </div>
                                    )}

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const query = encodeURIComponent(
                                          `${prod.bankName} ${prod.productName}`,
                                        );
                                        window.open(
                                          `https://www.google.com/search?q=${query}`,
                                          "_blank",
                                        );
                                      }}
                                      className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition"
                                    >
                                      상품 정보 확인하러 가기{" "}
                                      <ExternalLink size={16} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* 목표가 없을 때 안내 문구 */}
      {goals.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            아직 등록된 목표가 없습니다.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            위에서 새로운 저축 목표를 추가해보세요! 🚀
          </p>
        </div>
      )}

      {showProfileSettings && (
        <ProfileSettings 
          onClose={() => {
            setShowProfileSettings(false);
            setIsNewUser(false); // 닫으면 신규 유저 모드 해제
          }} 
        />
      )}
    </div>
  );
}
