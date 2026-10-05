module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: '#003087',
          'blue-dark': '#00205B',
          'blue-light': '#0052CC',
          'blue-50': '#EBF0FF',
          'blue-100': '#C7D7FF',
          saffron: '#FF6B00',
          'saffron-light': '#FF8C00',
          green: '#138808',
          'green-light': '#19A80A',
          gold: '#C8A951',
          'navy': '#001F5B',
          'slate': '#F0F4FF',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 16px rgba(0,48,135,0.08)',
        'card-hover': '0 8px 32px rgba(0,48,135,0.16)',
        'nav': '0 1px 0 rgba(0,48,135,0.1)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #00205B 0%, #003087 40%, #0052CC 100%)',
        'card-gradient': 'linear-gradient(135deg, #EBF0FF 0%, #F8FAFF 100%)',
        'saffron-gradient': 'linear-gradient(90deg, #FF6B00, #FF8C00)',
        'tricolor': 'linear-gradient(to right, #FF6B00 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%)',
      }
    },
  },
  plugins: [],
}
