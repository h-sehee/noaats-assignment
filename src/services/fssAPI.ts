export async function getSavingProducts(term: number) {
  try {
    // 내부 API Route 호출
    const response = await fetch(`/api/products?term=${term}`);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();

    // 금융감독원 에러 코드 확인
    if (data.result && data.result.err_cd !== '000') {
      throw new Error(data.result.err_msg || 'FSS API Error');
    }

    return data; 

  } catch (error) {
    console.error("FSS API Error:", error);
    return { result: { baseList: [], optionList: [] } };
  }
}