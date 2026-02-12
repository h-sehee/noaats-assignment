"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  X,
  Save,
  User,
  Building,
  CreditCard,
  Briefcase,
  MapPin,
  Smartphone,
  Shield,
  Coins,
} from "lucide-react";

const KOREAN_BANKS = [
  "KB국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "NH농협은행",
  "IBK기업은행",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "SC제일은행",
  "부산은행",
  "대구은행",
  "광주은행",
  "전북은행",
  "경남은행",
  "제주은행",
  "수협은행",
  "우체국",
  "새마을금고",
  "신협",
];

export default function ProfileSettings({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    location: "",
    jobType: "직장인",
    mainBank: "",         // ✅ 추가: 주거래 은행
    monthlySpending: 0,
    incomeLevel: "",      // ✅ 추가: 소득 구간 (서민금융 상품용)
    isFirstCustomer: false,
    hasHousingSubscription: false,
    isSoldier: false,     // ✅ 추가: 군인 여부
    preferOnline: true,   // ✅ 추가: 비대면 선호 여부
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData((prev) => ({
          ...prev,
          ...data,
          // DB에 없는 필드가 있을 경우 기본값 유지
        }));
      } else {
        setFormData((prev) => ({ ...prev, name: user.displayName || "" }));
      }
    };
    fetchUserData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...formData,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      // 저장 후 잠시 대기했다가 닫기 (UX)
      setTimeout(() => {
        alert("개인 맞춤 설정이 저장되었습니다!");
        onClose();
      }, 500);
    } catch (error) {
      console.error(error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-md rounded-t-3xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <User className="text-blue-600" size={24} />
              금융 프로필 설정
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              정확한 정보를 입력할수록 AI 추천 정확도가 올라갑니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <X className="text-gray-500" />
          </button>
        </div>

        {/* 폼 영역 (스크롤 가능) */}
        <form onSubmit={handleSave} className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* 1. 기본 인적 사항 */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2 border-b pb-2 dark:border-gray-700">
              <User size={16} /> 기본 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">생년월일</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">거주 지역</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="예: 충남 아산시"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. 경제 활동 정보 */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2 border-b pb-2 dark:border-gray-700">
              <Briefcase size={16} /> 경제 활동
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">직업 유형</label>
                <select
                  value={formData.jobType}
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                >
                  <option value="학생">학생 (대학생 포함)</option>
                  <option value="직장인">직장인 (급여소득자)</option>
                  <option value="자영업">개인사업자/프리랜서</option>
                  <option value="군인">군인 (사회복무요원 포함)</option>
                  <option value="주부">주부</option>
                  <option value="무직">기타/무직</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">연 소득 수준)</label>
                <select
                  value={formData.incomeLevel}
                  onChange={(e) => setFormData({ ...formData, incomeLevel: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                >
                  <option value="">선택 안 함</option>
                  <option value="2500만원 이하">2,500만원 이하</option>
                  <option value="3500만원 이하">3,500만원 이하</option>
                  <option value="5000만원 이하">5,000만원 이하</option>
                  <option value="5000만원 초과">5,000만원 초과</option>
                </select>
              </div>
            </div>
          </section>

          {/* 3. 금융 거래 패턴 */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2 border-b pb-2 dark:border-gray-700">
              <CreditCard size={16} /> 금융 거래 패턴
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">주거래 은행</label>
                <div className="relative">
                  <Building className="absolute left-3 top-3.5 text-gray-400" size={16} />
                  <select
                    value={formData.mainBank}
                    onChange={(e) => setFormData({ ...formData, mainBank: e.target.value })}
                    className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="">선택하세요</option>
                    {KOREAN_BANKS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">월 평균 카드 사용액</label>
                <div className="relative">
                  <span className="absolute right-4 top-3.5 text-gray-400 text-sm">원</span>
                  <input
                    type="number"
                    value={formData.monthlySpending}
                    onChange={(e) => setFormData({ ...formData, monthlySpending: Number(e.target.value) })}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* 체크박스 그룹 */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition group">
                <input
                  type="checkbox"
                  checked={formData.preferOnline}
                  onChange={(e) => setFormData({ ...formData, preferOnline: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Smartphone size={18} className="text-gray-400 group-hover:text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">스마트폰/비대면 가입을 선호합니다</span>
                </div>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition group">
                  <input
                    type="checkbox"
                    checked={formData.hasHousingSubscription}
                    onChange={(e) => setFormData({ ...formData, hasHousingSubscription: e.target.checked })}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Building size={18} className="text-gray-400 group-hover:text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">주택청약 보유</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition group">
                  <input
                    type="checkbox"
                    checked={formData.isFirstCustomer}
                    onChange={(e) => setFormData({ ...formData, isFirstCustomer: e.target.checked })}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Coins size={18} className="text-gray-400 group-hover:text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">첫 거래 우대 대상</span>
                  </div>
                </label>
              </div>

              {/* 군인 전용 옵션 */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-green-50/50 dark:hover:bg-green-900/10 transition group">
                <input
                  type="checkbox"
                  checked={formData.isSoldier}
                  onChange={(e) => setFormData({ ...formData, isSoldier: e.target.checked })}
                  className="w-5 h-5 rounded text-green-600 focus:ring-green-500"
                />
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-gray-400 group-hover:text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    현재 복무 중인 군인/입영 예정자입니다 (장병적금 대상)
                  </span>
                </div>
              </label>
            </div>
          </section>

        </form>

        {/* 푸터 (저장 버튼) */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-3xl">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.01] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="animate-pulse">저장 중...</span>
            ) : (
              <>
                <Save size={20} />
                프로필 업데이트
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}