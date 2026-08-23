import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        // Aproximação para telas de TV muito grandes (100"+) — normalmente
        // rodando em resoluções de largura maior; ajuste se necessário
        // após testar no seu modelo real de LG webOS.
        tv: '2560px'
      },
      colors: {
        base: '#000000',
        panel: '#0A0A0C',
        card: '#151519',
        cardhover: '#1D1D22',
        border: '#2A2A2E',
        accent: {
          DEFAULT: '#1D4E7A',
          hover: '#256093',
          soft: '#0A0E14'
        },
        gold: {
          DEFAULT: '#E8C97A',
          soft: '#3A2E10'
        },
        textmuted: '#7A7A82'
      },
      borderRadius: {
        card: '8px'
      }
    }
  },
  plugins: []
};

export default config;
