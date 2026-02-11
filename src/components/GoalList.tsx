'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';

export default function GoalList() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // 내 목표만 최신순으로 가져오기
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoals(goalData);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="mt-8 grid gap-4">
      <h2 className="text-xl font-bold">나의 저축 목표</h2>
      {goals.length === 0 ? (
        <p className="text-gray-500">등록된 목표가 없습니다.</p>
      ) : (
        goals.map((goal) => (
          <div key={goal.id} className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold">{goal.title}</h3>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <p>목표 금액: {goal.targetAmount.toLocaleString()}원</p>
              <p>월 저축액: {goal.monthlySaving.toLocaleString()}원</p>
              <p>기간: {goal.term}개월</p>
            </div>
            {/* 여기에 곧 API 추천 상품 버튼이 들어갑니다! */}
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
               <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                 맞춤 금융 상품 찾기 →
               </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}