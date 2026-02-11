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
    term: '12', // 기본값 12개월
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
      onComplete(); // 성공 시 리스트 갱신 등을 위한 콜백
      setFormData({ title: '', targetAmount: '', monthlySaving: '', term: '12' });
    } catch (error) {
      console.error("Error adding goal: ", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
      <h2 className="text-xl font-bold text-gray-800">새 저축 목표 설정</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">목표 명칭</label>
        <input
          required
          type="text"
          placeholder="예: 해외 여행"
          className="mt-1 block w-full border rounded-md p-2"
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
            placeholder="5,000,000"
            className="mt-1 block w-full border rounded-md p-2"
            value={formData.targetAmount}
            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">월 저축액 (원)</label>
          <input
            required
            type="number"
            placeholder="500,000"
            className="mt-1 block w-full border rounded-md p-2"
            value={formData.monthlySaving}
            onChange={(e) => setFormData({ ...formData, monthlySaving: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">저축 기간 (개월)</label>
        <select
          className="mt-1 block w-full border rounded-md p-2 dark:bg-gray-700"
          value={formData.term}
          onChange={(e) => setFormData({ ...formData, term: e.target.value })}
        >
          <option value="6">6개월</option>
          <option value="12">12개월</option>
          <option value="24">24개월</option>
          <option value="36">36개월</option>
        </select>
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 transition">
        목표 추가하기
      </button>
    </form>
  );
}