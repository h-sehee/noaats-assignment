"use client";

import { useAuth } from "@/components/AuthProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoalForm from "@/components/GoalForm";
import GoalList from "@/components/GoalList";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="min-h-screen lg:h-screen">
      <div className="p-8">
        <div className="w-full px-6">
          <Header />
        </div>

        <div className="max-w-7xl mx-auto w-full px-6">
          <main className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-center lg:min-h-0">
            {/* 1. 왼쪽: 목표 추가 폼 (고정 width) */}
            <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col scrollbar-hide pb-4 lg:pb-0 relative z-10 pr-4">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 ">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white ">
                  ✨ 목표 추가
                </h2>
                <GoalForm onComplete={() => alert("목표가 저장되었습니다!")} />
              </div>
            </div>

            {/* 2. 오른쪽: 목표 리스트 (flexible scroll area) */}
            <div className="w-full flex-1 min-w-0 overflow-hidden relative z-0">
              <GoalList />
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
