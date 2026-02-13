"use client";

import { useState } from "react";
import { AlertCircle, ExternalLink, Sparkles } from "lucide-react";
import GoalChart from "./GoalChart";

interface GoalCardProps {
  goal: any;
  editingId: string | null;
  editFormData: any;
  setEditingId: (id: string | null) => void;
  setEditFormData: (data: any) => void;
  onSaveEdit: (id: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  onFetchRecommendations: (goalId: string) => void;
  userMainBank: string;
  showOnlyMainBankByGoal: Record<string, boolean>;
  onToggleMainBankFilter: (goalId: string, checked: boolean) => void;
  expandedGoalId: string | null;
  setExpandedGoalId: (id: string | null) => void;
  selectedChartId: string | null;
  setSelectedChartId: (id: string | null) => void;
}

export default function GoalCard({
  goal,
  editingId,
  editFormData,
  setEditingId,
  setEditFormData,
  onSaveEdit,
  onDelete,
  onFetchRecommendations,
  userMainBank,
  showOnlyMainBankByGoal,
  onToggleMainBankFilter,
  expandedGoalId,
  setExpandedGoalId,
  selectedChartId,
  setSelectedChartId,
}: GoalCardProps) {
  const isEditing = editingId === goal.id;
  const [editError, setEditError] = useState<string | null>(null);

  const handleSaveClick = async () => {
    const target = Number(editFormData.targetAmount);
    const monthly = Number(editFormData.monthlySaving);

    // 검사 1: 음수나 0원 입력 방지
    if (target <= 0) {
      setEditError("목표 금액은 0원보다 커야 합니다.");
      return; // ❌ 여기서 함수 종료 (onSaveEdit 실행 안 됨)
    }
    if (monthly <= 0) {
      setEditError("월 저축액은 0원보다 커야 합니다.");
      return; // ❌
    }
    // 검사 2: 논리적 오류 방지
    if (monthly > target) {
      setEditError("월 저축액이 목표 금액보다 클 수 없습니다.");
      return; // ❌
    }
    try {
      const success = await onSaveEdit(goal.id);

      if (success) {
        setEditingId(null);
        setEditError(null); // 성공하면 에러 메시지 초기화
      }
    } catch (error) {
      console.error("Save failed", error);
      setEditError("저장 중 오류가 발생했습니다.");
    }
  };

  const handleEditChange = (field: string, value: string | number) => {
    setEditFormData((prev: any) => ({ ...prev, [field]: value }));
    if (editError) setEditError(null); // 수정 시작하면 에러 메시지 삭제
  };

  return (
    <div
      className="
      p-6
      bg-white dark:bg-gray-800
      rounded-2xl shadow-lg
      border border-gray-100 dark:border-gray-700
      transition-all hover:shadow-xl
      overflow-hidden lg:overflow-y-auto hide-scrollbar
      w-full lg:w-[500px] flex-shrink-0
      h-auto lg:max-h-[60vh]
      "
    >
      {isEditing ? (
        // [수정 모드 UI]
        <div className="space-y-4">
          {editError && (
            <div className="p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400 font-medium">
              ⚠️ {editError}
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">
              목표 명칭
            </label>
            <input
              type="text"
              className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={editFormData.title}
              onChange={(e) => handleEditChange("title", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">
                목표 금액
              </label>
              <input
                type="number"
                min="1000"
                className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={editFormData.targetAmount}
                onChange={(e) => handleEditChange("targetAmount", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">
                월 저축액
              </label>
              <input
                type="number"
                min="1" // 음수 방지
                className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={editFormData.monthlySaving}
                onChange={(e) => handleEditChange("monthlySaving", Number(e.target.value))}
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
              onChange={(e) => handleEditChange("term", Number(e.target.value))}
            >
              <option value="6">6개월</option>
              <option value="12">12개월</option>
              <option value="24">24개월</option>
              <option value="36">36개월</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setEditingId(null);
                setEditError(null); // 취소 시 에러도 초기화
              }}
              className="px-3 py-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded"
            >
              취소
            </button>
            <button
              onClick={handleSaveClick}
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mr-3 min-w-40">
                {goal.title}
                {/* 수정/삭제 버튼 그룹 */}
                <div className="flex gap-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingId(goal.id);
                      setEditFormData({
                        title: goal.title,
                        targetAmount: goal.targetAmount,
                        monthlySaving: goal.monthlySaving,
                        term: goal.term,
                      });
                    }}
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
                    onClick={() => onDelete(goal.id)}
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
            <div
              className="
            flex flex-wrap
            justify-between items-start gap-4 mb-6 p-4
            bg-gray-50/50 dark:bg-gray-900/30
            rounded-2xl border border-gray-100 dark:border-gray-800
            w-full md:w-[360px] lg:w-[360px]"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-tight">
                  {goal.recommendations.length > 0
                    ? "맞춤 추천 결과"
                    : "AI 상품 분석"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                {/* 주거래 은행 필터 */}
                {userMainBank && (
                  <label className="flex items-center gap-2 cursor-pointer select-none group/filter">
                    <input
                      type="checkbox"
                      checked={!!showOnlyMainBankByGoal[goal.id]}
                      onChange={(e) =>
                        onToggleMainBankFilter(goal.id, e.target.checked)
                      }
                      disabled={
                        !!(expandedGoalId && goal.recommendations?.length > 0)
                      }
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span
                      className="
                    text-xs font-semibold text-gray-500 dark:text-gray-400
                    group-hover/filter:text-blue-500 transition-colors"
                    >
                      {userMainBank}만 보기
                    </span>
                  </label>
                )}

                {/* 실행 버튼 */}
                <button
                  onClick={() => onFetchRecommendations(goal.id)}
                  disabled={goal.isLoading}
                  className="
                  w-full md:w-auto
                  px-4 py-2
                  bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400
                  rounded-xl text-xs font-bold
                  hover:shadow-md transition
                  flex items-center justify-center gap-2
                  border border-blue-100 dark:border-gray-700
                  disabled:opacity-50
                  "
                >
                  {goal.isLoading ? (
                    <span className="animate-pulse flex items-center gap-2">
                      분석 중...
                    </span>
                  ) : (
                    <>
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {goal.recommendations.length > 0
                        ? "다시 분석하기"
                        : "상품 찾기"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 추천 상품 리스트 영역 */}
          {goal.recommendations.length > 0 && !goal.isLoading && (
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
              <div
                className="flex justify-between items-center cursor-pointer group select-none"
                onClick={() =>
                  setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)
                }
              >
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    추천 상품
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                    expandedGoalId === goal.id ? "rotate-180" : ""
                  }`}
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
                    const allProducts = goal.recommendations;
                    const myBankProducts = userMainBank
                      ? allProducts.filter((p: any) =>
                          p.bankName.includes(userMainBank),
                        )
                      : [];

                    const topRateProducts = allProducts
                      .filter(
                        (p: any) =>
                          !userMainBank || !p.bankName.includes(userMainBank),
                      )
                      .sort(
                        (a: any, b: any) =>
                          b.maxInterestRate - a.maxInterestRate,
                      )
                      .slice(0, 3);

                    const showOnly = !!showOnlyMainBankByGoal[goal.id];
                    const displayList = showOnly
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
                      if (!prod) return null;
                      const isMainBank =
                        userMainBank && prod.bankName.includes(userMainBank);
                      const uniqueChartKey = `${goal.id}-${idx}`;
                      const isChartOpen = selectedChartId === uniqueChartKey;

                      return (
                        <div
                          key={uniqueChartKey}
                          className={`rounded-2xl border mb-4 overflow-hidden transition-all ${
                            isChartOpen ? "ring-2 ring-blue-500" : ""
                          }`}
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
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                      prod.isCompound
                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                        : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300"
                                    }`}
                                  >
                                    {prod.isCompound ? "복리" : "단리"}
                                  </span>
                                  {prod.tags?.map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="
                                      text-[10px] px-2 py-0.5
                                      bg-gray-100 dark:bg-gray-700
                                      text-gray-600 dark:text-gray-300
                                      rounded-md font-bold"
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
                                  예상 금리
                                </p>
                                <div
                                  className={`relative group inline-block ${
                                    isChartOpen ? "cursor-help" : ""
                                  }`}
                                >
                                  <span
                                    className={`
                                        text-2xl font-black text-blue-600 dark:text-blue-400
                                        decoration-dotted underline-offset-4 ${
                                          isChartOpen
                                            ? "group-hover:underline"
                                            : ""
                                        } transition-all`}
                                  >
                                    {prod.maxInterestRate}%
                                  </span>

                                  {isChartOpen && (
                                    <div
                                      className="
                                    absolute
                                    right-0 top-full mt-2 w-52 p-4
                                    bg-gray-900/95 text-white text-xs
                                    rounded-xl shadow-2xl opacity-0 invisible
                                    group-hover:opacity-100 group-hover:visible
                                    transition-all duration-200
                                    z-[99] backdrop-blur-sm
                                    border border-gray-700
                                    pointer-events-none
                                    transform translate-y-1
                                    group-hover:translate-y-0"
                                    >
                                      <div className="font-bold text-gray-300 mb-2 border-b border-gray-700 pb-1">
                                        금리 구성 상세
                                      </div>

                                      <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-400">
                                            기본 금리
                                          </span>
                                          <span className="font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-200">
                                            {prod.baseRate || 0}%
                                          </span>
                                        </div>

                                        {prod.primeConditions &&
                                        prod.primeConditions.length > 0 ? (
                                          <div className="py-2 border-t border-b border-gray-700/50 my-1 space-y-1">
                                            <div className="text-[10px] text-gray-500 mb-1">
                                              우대 조건 달성 시
                                            </div>

                                            {prod.primeConditions.map(
                                              (cond: any, idx: number) => (
                                                <div
                                                  key={idx}
                                                  className="flex justify-between items-center text-xs"
                                                >
                                                  <span className="text-gray-300 truncate max-w-[120px]">
                                                    • {cond.label}
                                                  </span>
                                                  <span className="font-mono text-blue-300">
                                                    +{cond.rate.toFixed(1)}%
                                                  </span>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex justify-between items-center text-blue-300">
                                            <span>우대 금리 (최대)</span>
                                            <span className="font-mono bg-blue-900/40 px-2 py-0.5 rounded text-blue-200">
                                              +
                                              {(
                                                (prod.maxRate || 0) -
                                                (prod.baseRate || 0)
                                              ).toFixed(2)}
                                              %
                                            </span>
                                          </div>
                                        )}

                                        <div className="flex justify-between items-center font-bold text-white text-sm">
                                          <span>최고 적용 금리</span>
                                          <span className="font-mono text-blue-400 text-lg">
                                            {prod.maxInterestRate}%
                                          </span>
                                        </div>
                                      </div>

                                      <div
                                        className="
                                      absolute
                                      -top-1.5 right-6 w-3 h-3
                                      bg-gray-900 rotate-45
                                      border-l border-t border-gray-700"
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {prod.limitWarning && (
                              <div
                                className="
                              mt-3 p-2
                              bg-amber-50 dark:bg-amber-900/20
                              text-amber-700 dark:text-amber-400 text-xs
                              rounded-lg flex items-center gap-2"
                              >
                                <AlertCircle size={14} /> {prod.limitWarning}
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
                                isCompound={prod.isCompound}
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
                                  <p
                                    className="
                                  text-sm text-gray-600 dark:text-gray-400
                                  leading-relaxed
                                  bg-white dark:bg-gray-800
                                  p-4 rounded-xl shadow-sm"
                                  >
                                    {prod.reason}
                                  </p>
                                </div>

                                {prod.managementTip && (
                                  <div
                                    className="p-4
                                  bg-blue-50 dark:bg-blue-900/20
                                  rounded-xl border border-blue-100 dark:border-blue-800"
                                  >
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
                                  className="
                                  w-full py-3
                                  bg-gray-900 text-white
                                  rounded-xl font-bold
                                  flex items-center justify-center gap-2
                                  hover:bg-black transition"
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

          {goal.isLoading && (
            <div className="py-12 text-center text-gray-400 text-sm animate-pulse">
              정보를 바탕으로 최적의 상품을 계산하고 있습니다...
            </div>
          )}
        </>
      )}
    </div>
  );
}
