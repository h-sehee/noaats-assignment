"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="
    w-full py-8 mt-16
    border-t border-gray-200 dark:border-gray-800
    bg-white dark:bg-gray-900
    transition-colors duration-300
    "
    >
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            본 서비스는 금융감독원 오픈 API를 사용하여 실제 금융 상품 정보를
            제공합니다.
            <br />
            금융 상품 가입 전 반드시 해당 금융사의 약관을 확인하시기 바랍니다.
          </p>
        </div>

        <div
          className="
        mt-4 pt-8
        border-t border-gray-100 dark:border-gray-800
        text-center
        "
        >
          <div className="text-center md:text-center">
            <h2
              className="
            text-xl
            font-black text-gray-900 dark:text-white
            tracking-tight
            "
            >
              Save<span className="text-blue-600">Mate</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              © {currentYear} SaveMate. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
