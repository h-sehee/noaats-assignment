"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface GoalChartProps {
  targetAmount: number; // 목표 금액
  monthlySaving: number; // 월 저축액
  term: number; // 기간 (개월)
  interestRate: number; // 선택된 상품의 금리 (%)
  isCompound?: boolean; // 복리 여부
}

export default function GoalChart({
  targetAmount,
  monthlySaving,
  term,
  interestRate,
  isCompound = false,
}: GoalChartProps) {
  // 1. 원금 계산
  const totalPrincipal = monthlySaving * term;

  // 2. 이자 계산 (단리 기준)
  let beforeTaxInterest = 0;
  const rate = interestRate / 100;

  if (isCompound) {
    // 📈 월복리 적금 공식
    // 총액 = 월납입액 * (1+r/12) * ((1+r/12)^n - 1) / (r/12)
    const monthlyRate = rate / 12;
    const compoundTotal =
      monthlySaving *
      (1 + monthlyRate) *
      ((Math.pow(1 + monthlyRate, term) - 1) / monthlyRate);
    beforeTaxInterest = compoundTotal - totalPrincipal;
  } else {
    // 🧮 단리 적금 공식
    // 이자 = 월납입액 * (n(n+1)/2) * (r/12)
    const interestFactor = (term * (term + 1)) / 2;
    beforeTaxInterest = monthlySaving * interestFactor * (rate / 12);
  }

  // 3. 세금 계산 (이자소득세 15.4%)
  const tax = Math.floor((beforeTaxInterest * 0.154) / 10) * 10;

  // 4. 세후 수령액
  const afterTaxInterest = Math.floor(beforeTaxInterest - tax);
  const totalReceipt = totalPrincipal + afterTaxInterest;

  // 달성률 계산
  const achievementRate = ((totalReceipt / targetAmount) * 100).toFixed(1);
  const isSuccess = totalReceipt >= targetAmount;

  // 차트 데이터 구성 (라벨을 '세후 수령액'으로 변경하여 명확히 함)
  const data = [
    { name: "목표 금액", amount: targetAmount },
    { name: "예상 수령액", amount: Math.floor(totalReceipt) }, // 원 단위 절사
  ];

  return (
    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
      <div className="mb-2 flex justify-between items-start">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400 block">
            예상 달성률 (세후 기준)
          </span>
          <span className="block text-xs text-gray-400 mt-1">
            원금 {totalPrincipal.toLocaleString()}원
          </span>
          <span className="block text-xs text-blue-500/80 dark:text-blue-400/80">
            + 세후 이자 {afterTaxInterest.toLocaleString()}원
          </span>
        </div>
        <span
          className={`text-2xl font-black ${isSuccess ? "text-green-500" : "text-orange-500"}`}
        >
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
              tick={{ fontSize: 12, fill: "#9ca3af" }}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              formatter={(
                value: number | string | Array<number | string> | undefined,
              ) => {
                if (typeof value === "number") {
                  return [`${value.toLocaleString()}원`, "금액"];
                }
                return [value, "금액"];
              }}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                color: "#1f2937",
              }}
            />
            <Bar
              dataKey="amount"
              radius={[0, 6, 6, 0]}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === 0 ? "#cbd5e1" : isSuccess ? "#22c55e" : "#f97316"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 하단 피드백 메시지 */}
      {!isSuccess && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
          💡 목표까지 <b>{(targetAmount - totalReceipt).toLocaleString()}원</b>{" "}
          부족해요.
          <br />월{" "}
          <b>
            {Math.ceil((targetAmount - totalReceipt) / term).toLocaleString()}원
          </b>
          을 더 저축하면 달성 가능!
        </div>
      )}
    </div>
  );
}
