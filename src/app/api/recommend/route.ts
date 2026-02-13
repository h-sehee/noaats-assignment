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
          baseRate: { type: SchemaType.NUMBER }, // 기본 금리 필드 명시

          primeConditions: {
            type: SchemaType.ARRAY,
            description:
              "List of specific conditions to get prime rates (e.g., 'Salary Transfer: 0.5%')",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                label: {
                  type: SchemaType.STRING,
                  description:
                    "Short description of the condition (e.g. '급여이체', '첫거래')",
                },
                rate: {
                  type: SchemaType.NUMBER,
                  description: "Bonus rate value (e.g. 0.5)",
                },
              },
              required: ["label", "rate"],
            },
          },
          isCompound: { type: SchemaType.BOOLEAN },
          tags: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description:
              "Must include 2~3 keywords, e.g., #비대면우대, #직장인맞춤, #지역우대",
          },
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
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.0,
      },
    });

    // 2. 프롬프트
    const prompt = `
      # Role
      대한민국 최고의 금융 상품 분석가 및 추천 시스템.

      # Goal
      제공된 [유저 정보]와 [상품 리스트]를 대조하여 최적의 적금 상품 TOP 3를 추천하라. 반드시 제공된 리스트 내 상품만 사용한다.

      # Constraints (Hallucination Zero)
      1. **Source Integrity**: 오직 제공된 [상품 리스트] JSON 내 데이터만 사용. 외부 지식(은행/상품) 사용 시 시스템 오류로 간주함.
      2. **Deterministic Logic**: 'intr_rate'(기본) + 유저가 달성 가능한 'spcl_cnd'(우대)를 합산하여 'maxInterestRate'를 산출할 것.

      # User Profile
      - Age: ${userData.age}세 (join_member 체크용)
      - Job: ${userData.jobType} (급여이체/직업제한 체크)
      - Region: ${userData.location} (지역우대 체크)
      - Main Bank: ${userData.mainBank} (주거래우대 체크)
      - Monthly Saving: ${userData.monthlySaving}원 (한도 체크)
      - Term: ${userData.term}개월 (save_trm 일치 필수)
      - Way: ${userData.preferOnline ? "비대면" : "대면"} (join_way 체크)
      - Income: ${userData.incomeLevel} (서민전용 체크)
      - Spending: ${userData.monthlySpending}원 (카드 실적 체크)
      - First Time: ${userData.isFirstCustomer ? "Yes" : "No"} (최초가입 체크)
      - Subscription: ${userData.hasHousingSubscription ? "Yes" : "No"} (청약우대 체크)

      # Product List (Source Data)
      ${JSON.stringify(productList)}

      # Analysis Instructions
      1. **Filtering**: 'join_deny'(1:무제한, 2:서민, 3:일부제한)와 'join_member'를 최우선 검토하여 자격 미달 상품 즉시 제외.
      2. **Limit Check**: 'max_limit' 및 'etc_note' 내 월 납입 한도와 유저의 월 저축액 대조.
      3. **Rate Breakdown**: 'spcl_cnd' 텍스트에서 유저가 충족 가능한 항목(예: 급여이체, 첫거래 등)을 추출하여 수치화.
      4. **Scoring**: '복리'(intr_rate_type_nm) 상품 및 비대면 선호 시 '스마트폰' 가입 상품에 가중치 부여.

      # Output Format (JSON Only)
      Schema를 준수하여 recommendations 배열을 반환하라.
      {
        "recommendations": [
          {
            "productName": "상품명",
            "bankName": "은행명",
            "maxInterestRate": 0.0,
            "baseRate": 0.0,
            "primeConditions": [{ "label": "항목명", "rate": 0.0 }],
            "isCompound": true/false,
            "tags": ["#태그1", "#태그2"] 주거래 우대는 제외하고 적립유형은 필수로 넣을것,
            "reason": "나이, 직업, 은행 거래 패턴에 근거한 추천 이유(간결하게)",
            "limitWarning": "한도 관련 주의사항",
            "managementTip": "만기 후 관리 조언"
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
