'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, Moon, Sun, User, ChevronDown } from 'lucide-react';
import ProfileSettings from './ProfileSettings'; // ProfileSettings 컴포넌트 임포트

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();
  
  // 상태 관리
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false); // 프로필 설정 모달 상태

  // 다크 모드 초기화 및 감지
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // 테마 토글 핸들러
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <>
      <header className="flex justify-between items-center mb-8 py-4">
        {/* 로고 영역 */}
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Save<span className="text-blue-600">Mate</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            스마트한 금융 목표 관리
          </p>
        </div>

        {/* 사용자 메뉴 영역 */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-xs text-gray-400">환영합니다</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
              {user?.displayName || user?.email?.split('@')[0]}님
            </p>
          </div>

          <div className="relative">
            {/* 설정 메뉴 토글 버튼 */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 p-1 pr-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {user?.email?.[0].toUpperCase()}
              </div>
              <Settings size={18} className="text-gray-500 dark:text-gray-400" />
            </button>

            {/* 드롭다운 메뉴 */}
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Signed in as</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.email}</p>
                  </div>

                  <div className="p-2 space-y-1">
                    {/* 다크 모드 버튼 */}
                    <button 
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3">
                        {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                        <span>{isDarkMode ? '다크 모드' : '라이트 모드'}</span>
                      </div>
                    </button>
                    
                    {/* 내 정보 수정 버튼 */}
                    <button 
                        onClick={() => {
                            setShowProfileSettings(true);
                            setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-left"
                    >
                        <User size={18} className="text-gray-400" />
                        <span>내 정보</span>
                    </button>
                  </div>

                  <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2"></div>

                  {/* 로그아웃 버튼 */}
                  <div className="p-2">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
                      <LogOut size={18} />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 설정 모달 팝업 */}
      {showProfileSettings && (
        <ProfileSettings onClose={() => setShowProfileSettings(false)} />
      )}
    </>
  );
}