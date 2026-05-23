/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        alipay: {
          blue: '#1677ff',
          dark: '#0056d6',
          light: '#e6f2ff',
        },
        wechat: {
          green: '#07c160',
          dark: '#06ad56',
          light: '#e6f7ed',
        },
        union: {
          red: '#e60012',
          dark: '#c4000f',
          light: '#ffe6e8',
        },
        energy: {
          green: '#52c41a',
          light: '#f6ffed',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
      },
      boxShadow: {
        'alipay': '0 8px 32px rgba(22, 119, 255, 0.25)',
        'wechat': '0 8px 32px rgba(7, 193, 96, 0.25)',
        'union': '0 8px 32px rgba(230, 0, 18, 0.25)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 40px rgba(22, 119, 255, 0.15)',
      }
    },
  },
  plugins: [],
}
