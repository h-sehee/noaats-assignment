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
} from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { getSavingProducts } from "@/services/fssAPI";
import GoalChart from "./GoalChart";

export default function GoalList() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

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
      <h2 className="text-2xl font-bold">나의 저축 목표</h2>
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
        >
          {editingId === goal.id ? (
            // [수정 모드 UI]
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">목표 명칭</label>
                <input
                  type="text"
                  className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">목표 금액</label>
                  <input
                    type="number"
                    className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white"
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
                  <label className="text-xs text-gray-500">월 저축액</label>
                  <input
                    type="number"
                    className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white"
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
                <label className="text-xs text-gray-500">기간 (개월)</label>
                <select
                  className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white"
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
                  className="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded"
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
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    {goal.title}
                    <div className="flex gap-1 text-gray-400">
                      <button
                        onClick={() => startEdit(goal)}
                        className="hover:text-blue-500 p-1"
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
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>목표 금액: {goal.targetAmount.toLocaleString()}원</p>
                    <p>월 저축액: {goal.monthlySaving.toLocaleString()}원</p>
                    <p>기간: {goal.term}개월</p>
                  </div>
                </div>
                {goal.recommendations.length == 0 && <button
                  onClick={() => fetchRecommendations(goal.id, goal.term)}
                  disabled={goal.isLoading}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
                >
                  {goal.isLoading ? "찾는 중..." : "상품 찾기"}
                </button>}
              </div>

              {goal.recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
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
                        <div
                          key={idx}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden"
                        >
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
            </>
          )}
        </div>
      ))}
    </div>
  );
}
