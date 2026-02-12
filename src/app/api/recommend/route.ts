import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

const schema: any = {
  description: "Bank product recommendations",
  type: SchemaType.OBJECT,
  properties: {
    recommendations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          productName: { type: SchemaType.STRING },
          bankName: { type: SchemaType.STRING },
          maxInterestRate: { type: SchemaType.NUMBER },
          isCompound: { type: SchemaType.BOOLEAN },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING },description: "Must include at least 2 keywords, e.g., #비대면우대, #직장인맞춤, #지역우대" },
          reason: { type: SchemaType.STRING },
          limitWarning: { type: SchemaType.STRING },
          managementTip: { type: SchemaType.STRING },
        },
        required: ["productName", "bankName", "maxInterestRate", "reason"],
      },
    },
  },
};

export async function POST(request: Request) {
  try {
    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is missing in .env.local");
      return NextResponse.json({ error: "API 키 설정 오류" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { userData, productList } = await request.json();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.0,
      },
    });

    // 2. 프롬프트
    const prompt = `
  너는 대한민국 최고의 1:1 맞춤형 금융 비서이자 데이터 분석가야. 
제공된 [유저 정보]와 [상품 리스트(JSON)]를 바탕으로, 유저가 실제로 받을 수 있는 '현실적 최고 금리'를 계산하고 유저 상황에 맞는 최적의 상품 TOP 3를 추천해줘.

[유저 정보]
- 현재 날짜: ${Date.now()}
- 생년월일: ${userData.birthDate} (만 나이를 정확히 계산하여 join_member 조건과 대조할 것)
- 직업: ${userData.jobType} (급여이체 우대 및 직업 제한 상품 확인용)
- 거주지: ${userData.location} (지방 은행의 지역민 우대 금리 확인용)
- 주거래 은행: ${userData.mainBank} (주거래 우대 금리 확인용)
- 월 저축 가능액: ${userData.monthlySaving}원
- 목표 저축 기간: ${userData.term}개월 (save_trm과 일치하는 옵션만 분석할 것)
- 선호 가입 방식: ${userData.preferOnline ? "비대면" : "대면"} (join_way와 대조)
- 소득 수준: ${userData.incomeLevel} (join_deny: 2 서민전용 상품 가입 자격 확인용)
- 월 카드 사용액: ${userData.monthlySpending}원 (spcl_cnd의 카드 실적 조건과 대조)
- 첫 거래 여부: ${userData.isFirstCustomer ? "예" : "아니오"} (최초 가입 우대 확인용)
- 청약 보유: ${userData.hasHousingSubscription ? "예" : "아니오"} (청약 연계 우대 확인용)

[분석 지침 - 필독]
1. 가입 자격 필터링: 'join_deny'와 'join_member'를 분석하여 유저가 대상이 아니면 무조건 제외해. 가입 대상이 아닌 상품은 즉시 무시할 것. join_deny의 값은 1:제한없음, 2:서민전용, 3:일부제한이야.
2. 한도 검증: 'max_limit' 필드뿐만 아니라 'etc_note'에 적힌 "월 XX만원 이내" 문구를 텍스트 마이닝하여 유저의 월 저축액과 비교해. 한도 초과 시 해당 상품은 즉시 무시할 것.
3. 실질 금리 계산: 'intr_rate'(기본금리)에 'spcl_cnd'(우대조건) 중 유저가 만족하는 조건만 찾아 합산해. 'intr_rate2'(최고우대금리)를 무조건 믿지 말고 유저 정보와 대조된 '예상 금리'를 직접 산출해.
4. 수익성 가중치: 'intr_rate_type_nm'이 '복리'인 경우 단리보다 높은 점수를 부여해.
5. 가입 편의성: 유저가 비대면을 선호할 때 'join_way'에 스마트폰/인터넷이 없으면 점수를 깎고, 비대면 우대 금리가 있다면 가산점을 줘.
6. 만기 관리: 'mtrt_int'를 읽고 만기 후 금리가 급격히 낮아지는 경우 추천 이유에 관리 팁을 포함해.

[답변 형식 (JSON)]
{
  "recommendations": [
    {
      "productName": "...",
      "bankName": "...",
      "maxInterestRate": "숫자(AI가 계산한 예상 실질 금리)",
      "isCompound": "true/false",
      "tags": ["#비대면우대", "#직장인맞춤", "#지역우대"] 주거래 우대는 굳이 태그로 표시하지 않음,
      "reason": "왜 이 금리를 받을 수 있는지 유저의 나이, 직업, 거주지 등을 근거로 상세 설명하되 최대한 간결하게 작성",
      "limitWarning": "한도 관련 주의사항 (예: 월 최대 50만원까지만 저축 가능)",
      "managementTip": "mtrt_int를 바탕으로 한 만기 후 관리 조언"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("AI가 유효한 JSON 형식을 반환하지 않았습니다.");
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error: any) {
    console.error("Gemini Error Details:", error);
    return NextResponse.json(
      { error: "AI 추천 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
