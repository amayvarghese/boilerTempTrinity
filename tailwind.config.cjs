/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      
      fontFamily:{
        Work: ["Work Sans", "sans-serif"] ,
        factum: ["Faktum Test", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        inter:['Inter', 'sans-serif'],
        WhyteRegular:["WhyteInktrap-Regular" , "sans-serif"],
        WhyteMedI:["WhyteInktrap-MediumItalic" , "sans-serif"],
        WhyteMed:["WhyteInktrap-Medium" , "sans-serif"],
        WhyteBold:["WhyteInktrap-Bold" , "sans-serif"],
        Whyte:["WhyteInktrap-Heavy" , "sans-serif"],
    
      },
      colors: {
        'black-3':'#14171F',
        'blue': '#858EAD',
        'out':'#E0E3EB',
        'sky':'#2947A9',
        'white':'#FFFFFF',
        'blue-2':'#2947A9',
        'salt':'#F6F8F7',
        'blue-3':'#667299',
        'black-2':'#292E3D',
        'brown':'#C2C7D6',
        'earth':'#A3AAC2',
        'orange':'#F9995D',
        'red':'#ED6565',
        'navcls': '#F5F5F5',
        'gray': '#525B7A',
        'neutral':'#E0E3EB'
      },
      boxShadow:{
        '2xl': '0px 20px 24px -4px rgba(17, 24, 39, 0.1), 0px 8px 8px -4px rgba(17, 24, 39, 0.04);',
        '3xl':'0px 20px 24px -4px rgba(17, 24, 39, 0.1), 0px 8px 8px -4px rgba(17, 24, 39, 0.04);',
        '4xl':' 0px 0px 7.96163px rgba(105, 185, 157, 0.58)',
        '5xl': ' 0px 0px 37px -2px rgba(17, 24, 39, 0.05)',
        '6xl':' 0px 12px 16px -4px rgba(17, 24, 39, 0.1), 0px 4px 6px -2px rgba(17, 24, 39, 0.05)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
      
    },
  },
  plugins: [],
}