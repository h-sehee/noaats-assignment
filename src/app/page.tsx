'use client';

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/dashboard'); // 로그인 성공 시 대시보드로 이동
  }, [user, router]);

  if (loading) return <div className="flex h-screen items-center justify-center">로딩 중...</div>;

  return (
    <main className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="mb-8 text-4xl font-bold text-blue-600">Goal-Driven Saver</h1>
      <p className="mb-12 text-gray-600 text-lg">나만의 저축 목표를 세우고 최적의 금융 상품을 찾으세요.</p>
      
      <button
        onClick={login}
        className="flex items-center gap-3 rounded-lg bg-white px-8 py-4 font-semibold text-gray-700 shadow-md transition-all hover:bg-gray-100 active:scale-95"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.png" alt="Google" className="w-6" />
        Google 계정으로 시작하기
      </button>
    </main>
  );
}