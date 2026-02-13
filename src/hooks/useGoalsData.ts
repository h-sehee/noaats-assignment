import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  monthlySaving: number;
  term: number;
  recommendations: any[];
  isLoading: boolean;
  createdAt: any;
}

export function useGoalsData(userId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userMainBank, setUserMainBank] = useState<string>("");
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // 1. 프로필 확인
    const checkUserProfile = async () => {
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!data.jobType || !data.mainBank || !data.birthDate) {
            setIsNewUser(true);
            setShowProfileSettings(true);
          }
        } else {
          setIsNewUser(true);
          setShowProfileSettings(true);
        }
      } catch (error) {
        console.error("프로필 확인 실패:", error);
      }
    };
    checkUserProfile();

    // 2. 목표 리스트 구독
    const q = query(
      collection(db, "goals"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        recommendations: (doc.data() as any).recommendations || [],
        isLoading: false,
      })) as Goal[];
      setGoals(goalData);
    });

    // 3. 주거래 은행 정보 가져오기
    const fetchUserBank = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists() && userDoc.data().mainBank) {
          setUserMainBank(userDoc.data().mainBank);
        }
      } catch (error) {
        console.error("Error fetching user bank:", error);
      }
    };
    fetchUserBank();

    return () => unsubscribe();
  }, [userId]);

  // 삭제 기능
  const handleDelete = async (id: string) => {
    if (window.confirm("정말 이 목표를 삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "goals", id));
    }
  };

  // 수정 저장
  const saveEdit = async (id: string, editFormData: any) => {
    try {
      await updateDoc(doc(db, "goals", id), {
        title: editFormData.title,
        targetAmount: Number(editFormData.targetAmount),
        monthlySaving: Number(editFormData.monthlySaving),
        term: Number(editFormData.term),
      });
      return true;
    } catch (error) {
      console.error("Update failed:", error);
      alert("수정 중 오류가 발생했습니다.");
      return false;
    }
  };

  // 추천 결과 업데이트
  const updateGoalRecommendations = (
    goalId: string,
    recommendations: any[]
  ) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, recommendations, isLoading: false } : g
      )
    );
  };

  // 로딩 상태 업데이트
  const setGoalLoading = (goalId: string, isLoading: boolean) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, isLoading } : g))
    );
  };

  return {
    goals,
    setGoals,
    userMainBank,
    showProfileSettings,
    setShowProfileSettings,
    isNewUser,
    setIsNewUser,
    handleDelete,
    saveEdit,
    updateGoalRecommendations,
    setGoalLoading,
  };
}
