module.exports = {
  plugins: [
    require('postcss-nesting'), // <-- add this BEFORE tailwindcss
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
