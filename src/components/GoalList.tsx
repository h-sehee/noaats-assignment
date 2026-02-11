"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { getSavingProducts } from "@/services/fssAPI";
import GoalChart from "./GoalChart";

export default function GoalList() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // 내 목표만 최신순으로 가져오기
    const q = query(
      collection(db, "goals"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        recommendations: [],
        isLoading: false,
      }));
      setGoals(goalData);
    });

    return () => unsubscribe();
  }, [user]);

  const fetchRecommendations = async (goalId: string, term: number) => {
    setExpandedGoalId(goalId);
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, isLoading: true } : g)),
    );

    const results = await getSavingProducts(term);

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, recommendations: results, isLoading: false }
          : g,
      ),
    );
  };

  return (
    <div className="mt-8 grid gap-4">
      <h2 className="text-xl font-bold">나의 저축 목표</h2>
      {goals.length === 0 ? (
        <p className="text-gray-500">등록된 목표가 없습니다.</p>
      ) : (
        goals.map((goal) => (
          <div
            key={goal.id}
            className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold">{goal.title}</h3>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <p>목표 금액: {goal.targetAmount.toLocaleString()}원</p>
              <p>월 저축액: {goal.monthlySaving.toLocaleString()}원</p>
              <p>기간: {goal.term}개월</p>
            </div>
            {expandedGoalId !== goal.id && (
              <button
                onClick={() => fetchRecommendations(goal.id, goal.term)}
                disabled={goal.isLoading}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
              >
                {goal.isLoading ? "찾는 중..." : "맞춤 상품 찾기"}
              </button>
            )}
            {expandedGoalId === goal.id && goal.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div
                  className="flex justify-between items-center cursor-pointer group"
                  onClick={() =>
                    setExpandedGoalId(
                      expandedGoalId === goal.id ? null : goal.id,
                    )
                  }
                >
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    추천 상품 TOP 3
                  </p>

                  {/* 얇은 화살표 아이콘 (상태에 따라 회전) */}
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
                  <div className="mt-3 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    {goal.recommendations.map((prod: any, idx: number) => (
                      // 각 추천 상품을 감싸는 컨테이너에 배경색과 패딩을 적용하여 하나의 카드처럼 보이게 함
                      <div
                        key={idx}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden"
                      >
                        {/* 1. 상품 기본 정보 영역 (항상 보임) */}
                        <div className="flex justify-between items-center p-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {prod.bankName}
                            </p>
                            <p className="text-sm font-bold dark:text-gray-100">
                              {prod.productName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 mb-1">
                              최대 금리
                            </p>
                            <p className="text-xl font-black text-orange-500">
                              {prod.maxInterestRate}%
                            </p>
                          </div>
                        </div>

                        {/* 2. 시뮬레이션 차트 영역 (1위 상품에만 표시, 상품 정보 아래에 배치) */}
                        {idx === 0 && (
                          <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <GoalChart
                              targetAmount={goal.targetAmount}
                              monthlySaving={goal.monthlySaving}
                              term={goal.term}
                              interestRate={prod.maxInterestRate}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
