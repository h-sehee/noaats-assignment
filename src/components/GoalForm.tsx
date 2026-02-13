'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';

export default function GoalForm({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    monthlySaving: '',
    term: '12', 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'goals'), {
        userId: user.uid,
        title: formData.title,
        targetAmount: Number(formData.targetAmount),
        monthlySaving: Number(formData.monthlySaving),
        term: Number(formData.term),
        createdAt: serverTimestamp(),
      });
      
      onComplete(); 
      
      // 폼 초기화
      setFormData({ title: '', targetAmount: '', monthlySaving: '', term: '12' });
    } catch (error) {
      console.error("Error adding goal: ", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 "
    >
      <h2 className="text-xl font-bold text-gray-800 dark:text-white">새 저축 목표 설정</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">목표 명칭</label>
        <input
          required
          type="text"
          placeholder="예: 유럽 여행"
          className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">목표 금액 (원)</label>
          <input
            required
            type="number"
            placeholder="5000000"
            className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            value={formData.targetAmount}
            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">월 저축액 (원)</label>
          <input
            required
            type="number"
            placeholder="500000"
            className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            value={formData.monthlySaving}
            onChange={(e) => setFormData({ ...formData, monthlySaving: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">저축 기간 (개월)</label>
        <select
          className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
          value={formData.term}
          onChange={(e) => setFormData({ ...formData, term: e.target.value })}
        >
          <option value="6">6개월</option>
          <option value="12">12개월</option>
          <option value="24">24개월</option>
          <option value="36">36개월</option>
        </select>
      </div>
      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition shadow-md">
        목표 추가하기
      </button>
    </form>
  );
}