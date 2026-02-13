"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";

export default function GoalForm({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    monthlySaving: "",
    term: "12",
  });
  // 에러 메시지 상태 추가
  const [error, setError] = useState<string | null>(null);

  // 입력값 검증 함수
  const validateForm = () => {
    if (!formData.title.trim()) return "목표 명칭을 입력해주세요.";
    if (!formData.targetAmount) return "목표 금액을 입력해주세요.";
    if (!formData.monthlySaving) return "월 저축액을 입력해주세요.";

    const target = Number(formData.targetAmount);
    const monthly = Number(formData.monthlySaving);

    if (target <= 0) {
      return "목표 금액은 0원보다 커야 합니다.";
    }
    if (monthly <= 0) {
      return "월 저축액은 0원보다 커야 합니다.";
    }
    if (monthly > target) {
      return "월 저축액이 목표 금액보다 클 수 없습니다.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // 1. 유효성 검사 실행
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return; // 검증 실패 시 중단
    }

    try {
      await addDoc(collection(db, "goals"), {
        userId: user.uid,
        title: formData.title.trim(), // 공백 제거
        targetAmount: Number(formData.targetAmount),
        monthlySaving: Number(formData.monthlySaving),
        term: Number(formData.term),
        createdAt: serverTimestamp(),
      });

      onComplete();

      // 폼 초기화 및 에러 초기화
      setFormData({
        title: "",
        targetAmount: "",
        monthlySaving: "",
        term: "12",
      });
      setError(null);
    } catch (error) {
      console.error("Error adding goal: ", error);
      setError("목표 저장 중 오류가 발생했습니다.");
    }
  };

  // 입력 변경 핸들러 (입력 시 에러 메시지 지움)
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="
      space-y-4 p-6
      bg-white dark:bg-gray-800
      rounded-xl shadow-lg
      border border-gray-100 dark:border-gray-700"
    >
      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
        새 저축 목표 설정
      </h2>

      {/* 에러 메시지 표시 영역 */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400 font-medium">
          ⚠️ {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          목표 명칭
        </label>
        <input
          required
          type="text"
          placeholder="예: 유럽 여행"
          className="
          mt-1 block w-full p-2
          border rounded-md border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-700
          text-gray-900 dark:text-white
          focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            목표 금액 (원)
          </label>
          <input
            required
            type="number"
            min="1000" // 최소 금액 설정 (UX상 1000원 단위 등 추천)
            placeholder="5000000"
            className="
            mt-1 block w-full p-2
            border rounded-md border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-700
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.targetAmount}
            onChange={(e) => handleChange("targetAmount", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            월 저축액 (원)
          </label>
          <input
            required
            type="number"
            min="1" // 음수 방지
            placeholder="500000"
            className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.monthlySaving}
            onChange={(e) => handleChange("monthlySaving", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          저축 기간 (개월)
        </label>
        <select
          className="mt-1 block w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={formData.term}
          onChange={(e) => handleChange("term", e.target.value)}
        >
          <option value="6">6개월</option>
          <option value="12">12개월</option>
          <option value="24">24개월</option>
          <option value="36">36개월</option>
          <option value="48">48개월</option>
          <option value="60">60개월</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition shadow-md active:scale-[0.98]"
      >
        목표 추가하기
      </button>
    </form>
  );
}
