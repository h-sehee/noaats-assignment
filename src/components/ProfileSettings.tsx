'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { X, Save, Building } from 'lucide-react';

interface ProfileSettingsProps {
  onClose: () => void;
}

const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행", 
  "기업은행", "카카오뱅크", "토스뱅크", "케이뱅크", "새마을금고", 
  "부산은행", "대구은행", "광주은행", "전북은행", "제주은행", "기타"
];

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [mainBank, setMainBank] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setMainBank(data.mainBank || '');
        } else {
          setName(user.displayName || user.email?.split('@')[0] || '');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name,
        mainBank,
        updatedAt: new Date(),
        email: user.email
      }, { merge: true });
      setMessage('성공적으로 저장되었습니다! ✅');
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage('저장에 실패했습니다. ❌');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-500" />
            개인 설정
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-500">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              이름 (닉네임)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="홍길동"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <Building size={14} />
              주거래 은행
            </label>
            <select
              value={mainBank}
              onChange={(e) => setMainBank(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition appearance-none"
            >
              <option value="">은행을 선택해주세요</option>
              {BANKS.map((bank) => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>
          <div className="pt-2">
            {message && <p className="text-center text-sm font-medium text-blue-600 mb-3 animate-pulse">{message}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '저장 중...' : (
                <>
                  <Save size={18} />
                  저장하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}