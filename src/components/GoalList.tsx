"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import ProfileSettings from "./ProfileSettings";
import GoalCard from "./GoalCard";
import { useGoalsData } from "@/hooks/useGoalsData";
import { useRecommendations } from "@/hooks/useRecommendations";

export default function GoalList() {
  const { user } = useAuth();
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const [showOnlyMainBankByGoal, setShowOnlyMainBankByGoal] = useState<
    Record<string, boolean>
  >({});

  // 수정 모드 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    targetAmount: 0,
    monthlySaving: 0,
    term: 6,
  });

  // 데이터 hook
  const {
    goals,
    setGoals,
    userMainBank,
    showProfileSettings,
    setShowProfileSettings,
    isNewUser,
    setIsNewUser,
    handleDelete,
    saveEdit,
    updateGoalRecommendations,
    setGoalLoading,
  } = useGoalsData(user?.uid);

  // 추천 hook
  const { fetchRecommendations } = useRecommendations({
    goals,
    userMainBank,
    expandedGoalId,
    onRecommendationsReady: (goalId, recommendations) => {
      updateGoalRecommendations(goalId, recommendations);
    },
    onLoadingStart: (goalId) => setGoalLoading(goalId, true),
    onLoadingEnd: (goalId) => setGoalLoading(goalId, false),
  });

  const handleFetchRecommendations = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !user) return;

    // 닫기 로직
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null);
      setSelectedChartId(null);
      return;
    }

    // 열기 로직
    setExpandedGoalId(goalId);
    await fetchRecommendations(goalId, goal.term, user.uid);
  };

  const handleSaveEdit = async (goalId: string) => {
    return await saveEdit(goalId, editFormData);
  };

  return (
    <div className="mt-8 grid gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">나의 저축 목표</h2>
      </div>

      <div
        className="
      flex flex-wrap gap-6 
      pb-6 px-1 
      items-start
      custom-scrollbar-horizontal
      lg:flex-nowrap lg:flex-row lg:overflow-x-auto lg:overflow-y-hidden lg:snap-x lg:snap-mandatory
    "
      >
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            editingId={editingId}
            editFormData={editFormData}
            setEditingId={setEditingId}
            setEditFormData={setEditFormData}
            onSaveEdit={handleSaveEdit}
            onDelete={handleDelete}
            onFetchRecommendations={handleFetchRecommendations}
            userMainBank={userMainBank}
            showOnlyMainBankByGoal={showOnlyMainBankByGoal}
            onToggleMainBankFilter={(goalId, checked) =>
              setShowOnlyMainBankByGoal((prev) => ({
                ...prev,
                [goalId]: checked,
              }))
            }
            expandedGoalId={expandedGoalId}
            setExpandedGoalId={setExpandedGoalId}
            selectedChartId={selectedChartId}
            setSelectedChartId={setSelectedChartId}
          />
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
              setIsNewUser(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
