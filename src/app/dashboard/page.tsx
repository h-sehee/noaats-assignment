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
    <div className="min-h-screen">
      <div className="p-8">
        <div className="max-w-4xl mx-auto w-full px-6">
          <Header />
        </div>

        <main className="flex-1 w-full max-w-4xl mx-auto px-6 pb-4">
          <div className="max-w-md mx-auto">
            <GoalForm onComplete={() => alert("목표가 저장되었습니다!")} />
            <GoalList />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
