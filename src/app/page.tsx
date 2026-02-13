"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image"; // Next.js Image 컴포넌트 사용 (선택 사항)

export default function Home() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/dashboard"); // 로그인 성공 시 대시보드로 이동
  }, [user, router]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
        로딩 중...
      </div>
    );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-900">
      {/* 왼쪽: 로그인 폼 영역 */}
      <div className="flex w-full flex-col justify-center px-8 py-12 md:w-1/2 lg:px-12 xl:px-24">
        <main className="mx-auto w-full max-w-sm lg:max-w-md text-center">
          <h1 className="mb-6 text-4xl font-bold mx-auto">
            Save<span className="text-blue-600">Mate</span>
          </h1>
          <p className="mb-8 text-gray-500 dark:text-gray-400 text-lg mx-auto">
            <span className="block lg:inline">나만의 저축 목표를 세우고</span>
            <span className="block lg:inline"> 최적의 금융 상품을 찾으세요.</span>
          </p>

          <div className="flex justify-center">
            <button className="gsi-material-button mx-auto block" onClick={login}>
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: "block" }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents">
                Sign in with Google
              </span>
              <span style={{ display: "none" }}>Sign in with Google</span>
            </div>
            </button>
          </div>
          <div className="mt-8 text-center text-xs text-gray-400">
            &copy; 2026 SaveMate. All rights reserved.
          </div>
        </main>
      </div>

      {/* 오른쪽: 이미지 영역 (모바일 숨김) */}
      <div className="hidden w-4/5 bg-gray-100 md:block relative">
        <img
          src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop"
          alt="Finance Background"
          className="h-full w-full object-cover"
        />
        {/* 이미지 출처 */}
        <div className="absolute bottom-4 right-6 text-xs text-white/60 bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
          <a
            href="https://unsplash.com/photos/money-plant-coins-stack-on-table-Save-money-concept-quantitatives-6njoE_LkMWY"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Photo by Unsplash
          </a>
        </div>
      </div>
    </div>
  );
}
