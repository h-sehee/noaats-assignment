'use client';

import { Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    // 1. 가장 바깥쪽은 w-full로 화면 끝까지 채우고 배경색을 입힙니다.
    <footer className="w-full py-8 mt-16 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-300">
      
      {/* 2. 내부 콘텐츠만 max-w-4xl과 mx-auto로 중앙에 모아줍니다. */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Save<span className="text-blue-600">Mate</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              © {currentYear} SaveMate. All rights reserved.
            </p>
          </div>

          <div className="flex gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition">서비스 소개</a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition">이용약관</a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition">개인정보처리방침</a>
          </div>

          <div className="flex gap-4">
            <a href="#" className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition"><Github size={18} /></a>
            <a href="#" className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition"><Twitter size={18} /></a>
            <a href="#" className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition"><Mail size={18} /></a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            본 서비스는 금융감독원 오픈 API를 사용하여 실제 금융 상품 정보를 제공합니다.<br/>
            금융 상품 가입 전 반드시 해당 금융사의 약관을 확인하시기 바랍니다.
          </p>
        </div>
      </div>
    </footer>
  );
}