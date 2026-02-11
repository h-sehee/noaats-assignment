'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { getSavingProducts } from '@/services/fssAPI';

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
        ...doc.data(),
        recommendations: [],
        isLoading: false
      }));
      setGoals(goalData);
    });

    return () => unsubscribe();
  }, [user]);

  const fetchRecommendations = async (goalId: string, term: number) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, isLoading: true } : g));
    
    const results = await getSavingProducts(term);
    
    setGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, recommendations: results, isLoading: false } : g
    ));
  };

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
            <button 
                onClick={() => fetchRecommendations(goal.id, goal.term)}
                disabled={goal.isLoading}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
              >
                {goal.isLoading ? '찾는 중...' : '맞춤 상품 찾기'}
              </button>
              {/* 추천 상품 리스트 표시 섹션 */}
            {goal.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">추천 상품 TOP 3</p>
                {goal.recommendations.map((prod: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{prod.bankName}</p>
                      <p className="text-sm font-medium dark:text-gray-200">{prod.productName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">최대 금리</p>
                      <p className="text-lg font-bold text-orange-500">{prod.maxInterestRate}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}