/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'status-active': '#22c55e',    // 진행중 - 초록색
        'status-planned': '#3b82f6',   // 예정 - 파란색
        'status-completed': '#6b7280', // 완료 - 회색
        'status-makeup': '#ef4444',    // 보강 - 빨간색
      },
    },
  },
  plugins: [],
} 