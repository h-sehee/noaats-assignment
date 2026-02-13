import { useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getSavingProducts } from "@/services/fssAPI";

interface FilterAndSortInput {
  baseList: any[];
  optionList: any[];
  goal: any;
  applyBankFilter: boolean;
  userMainBank: string;
}

interface UseRecommendationsParams {
  goals: any[];
  userMainBank: string;
  expandedGoalId: string | null;
  onRecommendationsReady: (goalId: string, recommendations: any[]) => void;
  onLoadingStart: (goalId: string) => void;
  onLoadingEnd: (goalId: string) => void;
}

export function useRecommendations(params: UseRecommendationsParams) {
  const {
    goals,
    userMainBank,
    expandedGoalId,
    onRecommendationsReady,
    onLoadingStart,
    onLoadingEnd,
  } = params;

  // 상품 필터링 및 정렬
  const filterAndSortSimple = useCallback(
    (input: FilterAndSortInput) => {
      const { baseList, optionList, goal, applyBankFilter, userMainBank } =
        input;

      // 1. [병합] 기본 정보 + 금리 옵션 합치기
      const mergedProducts = baseList
        .map((base) => {
          const matchOption = optionList.find(
            (opt) =>
              opt.fin_co_no === base.fin_co_no &&
              opt.fin_prdt_cd === base.fin_prdt_cd &&
              opt.save_trm === goal.term.toString()
          );
          return matchOption ? { ...base, ...matchOption } : null;
        })
        .filter((p) => p !== null);

      // 2. [필터] 한도 및 은행 필터 적용
      const validProducts = mergedProducts.filter((p) => {
        if (p.max_limit !== null && p.max_limit < goal.monthlySaving) {
          return false;
        }
        if (applyBankFilter && userMainBank) {
          if (!p.kor_co_nm.includes(userMainBank)) {
            return false;
          }
        }
        return true;
      });

      // 3. [정렬] 가중치 기반 스코어링
      const sortedProducts = validProducts.sort((a, b) => {
        const baseA = a.intr_rate || 0;
        const maxA = a.intr_rate2 || baseA;

        const baseB = b.intr_rate || 0;
        const maxB = b.intr_rate2 || baseB;

        const scoreA = baseA * 0.4 + maxA * 0.6;
        const scoreB = baseB * 0.4 + maxB * 0.6;

        return scoreB - scoreA;
      });

      // 4. [추출] 상위 15개만 반환
      return sortedProducts.slice(0, 15).map((p) => ({
        bankName: p.kor_co_nm,
        productName: p.fin_prdt_nm,
        baseRate: p.intr_rate,
        maxRate: p.intr_rate2,
        condition: p.spcl_cnd,
        joinWay: p.join_way,
        note: p.etc_note,
      }));
    },
    []
  );

  // 추천 데이터 가져오기
  const fetchRecommendations = useCallback(
    async (goalId: string, term: number, userId: string | undefined) => {
      // 이미 열려있으면 닫기
      if (expandedGoalId === goalId) {
        return null;
      }

      if (!userId) return;

      try {
        onLoadingStart(goalId);

        const goal = goals.find((g) => g.id === goalId);
        if (!goal) return;

        // 1. 금감원 데이터 가져오기
        const rawProducts = await getSavingProducts(term);

        // 2. 사용자 정보 가져오기
        const userDoc = await getDoc(doc(db, "users", userId));
        const fullUserData = userDoc.data();

        // 3. AI 준비용 데이터 필터링
        const aiReadyData = filterAndSortSimple({
          baseList: rawProducts.result.baseList,
          optionList: rawProducts.result.optionList,
          goal: { term, monthlySaving: goal.monthlySaving },
          applyBankFilter: false,
          userMainBank,
        });

        if (aiReadyData.length === 0) {
          alert("조건에 맞는 상품이 없습니다.");
          onLoadingEnd(goalId);
          return;
        }

        // 4. 사용자 나이 계산
        let userAge = 20;
        if (fullUserData?.birthDate) {
          const today = new Date();
          const birthDate = new Date(fullUserData.birthDate);

          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
          userAge = age;
        }

        // 5. Gemini API 호출
        const aiResponse = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userData: {
              ...fullUserData,
              age: userAge,
              targetAmount: goal.targetAmount,
              monthlySaving: goal.monthlySaving,
              term,
            },
            productList: aiReadyData,
          }),
        });

        const finalData = await aiResponse.json();

        onRecommendationsReady(goalId, finalData.recommendations);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        onLoadingEnd(goalId);
      }
    },
    [goals, userMainBank, expandedGoalId, filterAndSortSimple, onRecommendationsReady, onLoadingStart, onLoadingEnd]
  );

  return { fetchRecommendations, filterAndSortSimple };
}
