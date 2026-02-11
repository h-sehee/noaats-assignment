'use client';

import { useAuth } from "@/components/AuthProvider";
import GoalForm from "@/components/GoalForm";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-300">{user?.displayName}님의 대시보드</h1>
        <button onClick={logout} className="text-sm text-red-500 underline">로그아웃</button>
      </header>
      
      <div className="max-w-md mx-auto">
        <GoalForm onComplete={() => alert('목표가 저장되었습니다!')} />
      </div>
      
      {/* 여기에 나중에 저장된 목표 리스트와 API 매칭 결과를 보여줄 것입니다 */}
    </div>
  );
}