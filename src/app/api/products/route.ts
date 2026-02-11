import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term');
  const apiKey = process.env.NEXT_PUBLIC_FSS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ result: { err_msg: "API Key missing" } }, { status: 500 });
  }

  // 1. URLSearchParams를 사용하여 안전하게 URL 생성
  const params = new URLSearchParams({
    auth: apiKey,
    topFinGrpNo: '020000', // 저축은행
    pageNo: '1'
  });

  const BASE_URL = 'https://finlife.fss.or.kr/finlifeapi/savingProductsSearch.json';
  const targetUrl = `${BASE_URL}?${params.toString()}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finlife.fss.or.kr/' // 금감원 도메인으로 출처 위장
      },
      cache: 'no-store' // 실시간 데이터 보장
    });

    const text = await response.text(); // 먼저 텍스트로 받아서 확인

    // 2. 응답이 HTML인지 확인 (보통 <!DOCTYPE 또는 <html로 시작함)
    if (text.trim().startsWith('<')) {
      console.error("FSS Blocked Request. Response starts with HTML.");
      return NextResponse.json({ 
        result: { err_msg: "금감원 방화벽에 의해 차단되었습니다. IP 등록이나 키 유효성을 확인하세요." } 
      }, { status: 502 });
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Fetch Error:", error.message);
    return NextResponse.json({ result: { err_msg: "통신 중 오류 발생: " + error.message } }, { status: 500 });
  }
}