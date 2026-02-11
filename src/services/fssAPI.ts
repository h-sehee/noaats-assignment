export async function getSavingProducts(term: number) {
  try {
    // 내부 API Route 호출 (CORS 발생 안 함)
    const response = await fetch(`/api/products?term=${term}`);
    const data = await response.json();

    if (!data.result || data.result.err_cd !== '000') {
      throw new Error(data.result?.err_msg || 'Unknown error');
    }

    const products = data.result.baseList;
    const options = data.result.optionList;

    const matchedProducts = options
      .filter((opt: any) => Number(opt.save_trm) === term)
      .map((opt: any) => {
        const base = products.find((p: any) => p.fin_prdt_cd === opt.fin_prdt_cd);
        return {
          bankName: base?.kor_co_nm,
          productName: base?.fin_prdt_nm,
          interestRate: opt.intr_rate,
          maxInterestRate: opt.intr_rate2,
        };
      })
      .sort((a: any, b: any) => b.maxInterestRate - a.maxInterestRate);

    return matchedProducts.slice(0, 3);
  } catch (error) {
    console.error("FSS API Error:", error);
    return [];
  }
}