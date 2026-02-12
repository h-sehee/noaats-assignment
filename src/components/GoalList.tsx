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
import GoalChart from "./GoalChart";

export default function GoalList() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);

  const [userMainBank, setUserMainBank] = useState<string>("");
  const [showOnlyMainBank, setShowOnlyMainBank] = useState(false);

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
        recommendations: [], // 초기엔 빈 배열
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

    try {
      const results = await getSavingProducts(term);
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, recommendations: results, isLoading: false }
            : g,
        ),
      );
      // ✅ 데이터 로딩 완료 시, 첫 번째 상품(인덱스 0)의 차트를 기본으로 엽니다.
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
                      <span className="animate-pulse">검색 중...</span>
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

                        return displayList.map((prod: any, idx: number) => {
                          const isMainBank =
                            userMainBank &&
                            prod.bankName.includes(userMainBank);
                          const uniqueChartKey = `${goal.id}-${idx}`;
                          const isChartOpen =
                            selectedChartId === uniqueChartKey;

                          return (
                            <div
                              key={uniqueChartKey} // 고유 키값 보장
                              onClick={() =>
                                setSelectedChartId(
                                  isChartOpen ? null : uniqueChartKey,
                                )
                              }
                              className={`rounded-xl overflow-hidden transition-all border
                  ${
                    isMainBank
                      ? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800 shadow-sm"
                      : "bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300"
                  }
                `}
                            >
                              <div className="flex justify-between items-center p-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    {/* 배지 표시 */}
                                    {isMainBank && (
                                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        🏆 주거래 우대
                                      </span>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {prod.bankName}
                                    </p>
                                  </div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {prod.productName}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-400 mb-1">
                                    최대 금리
                                  </p>
                                  <p
                                    className={`text-xl font-black ${isMainBank ? "text-blue-600 dark:text-blue-400" : "text-orange-500"}`}
                                  >
                                    {prod.maxInterestRate}%
                                  </p>
                                </div>
                              </div>

                              {/* 리스트의 첫 번째 항목(가장 우선순위 높은 것)에만 시뮬레이션 차트 표시 */}
                              {isChartOpen && (
                                <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-600/50 animate-in slide-in-from-top-1 duration-200">
                                  <GoalChart
                                    targetAmount={goal.targetAmount}
                                    monthlySaving={goal.monthlySaving}
                                    term={goal.term}
                                    interestRate={prod.maxInterestRate}
                                  />
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
    </div>
  );
}
