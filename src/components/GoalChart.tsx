'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GoalChartProps {
  targetAmount: number;   // 목표 금액
  monthlySaving: number;  // 월 저축액
  term: number;           // 기간 (개월)
  interestRate: number;   // 선택된 상품의 금리 (%)
}

export default function GoalChart({ targetAmount, monthlySaving, term, interestRate }: GoalChartProps) {
  // 1. 원금 계산
  const principal = monthlySaving * term;
  
  // 2. 이자 계산 (단리 기준)
  const beforeTaxInterest = principal * (interestRate / 100) * (term / 12);
  
  // 3. 세금 계산 (이자소득세 15.4%)
  const tax = beforeTaxInterest * 0.154;
  
  // 4. 세후 수령액 (원금 + 세후 이자)
  const total = principal + (beforeTaxInterest - tax);

  // 달성률 계산
  const achievementRate = ((total / targetAmount) * 100).toFixed(1);
  const isSuccess = total >= targetAmount;

  // 차트 데이터 구성 (라벨을 '세후 수령액'으로 변경하여 명확히 함)
  const data = [
    { name: '목표 금액', amount: targetAmount },
    { name: '세후 수령액', amount: Math.floor(total) }, // 원 단위 절사
  ];

  return (
    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
      <div className="mb-2 flex justify-between items-end">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400 block">예상 달성률 (세후 기준)</span>
          <span className="text-xs text-gray-400">이자소득세 15.4% 차감</span>
        </div>
        <span className={`text-2xl font-black ${isSuccess ? 'text-green-500' : 'text-orange-500'}`}>
          {achievementRate}%
        </span>
      </div>
      
      <div className="h-32 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={24}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={70} 
              tick={{fontSize: 12, fill: '#9ca3af'}} 
            />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              formatter={(value: number | string | Array<number | string>|undefined) => {
                if (typeof value === 'number') {
                  return [`${value.toLocaleString()}원`, '금액'];
                }
                return [value, '금액'];
              }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#1f2937'
              }}
            />
            <Bar dataKey="amount" radius={[0, 6, 6, 0]} animationDuration={1000}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#cbd5e1' : (isSuccess ? '#22c55e' : '#f97316')} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 하단 피드백 메시지 */}
      {!isSuccess && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
          💡 목표까지 <b>{(targetAmount - total).toLocaleString()}원</b> 부족해요.<br/>
          월 <b>{Math.ceil((targetAmount - total) / term).toLocaleString()}원</b>을 더 저축하면 달성 가능!
        </div>
      )}
    </div>
  );
}