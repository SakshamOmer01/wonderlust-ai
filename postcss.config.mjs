/**
 * PostCSS configuration.
 *
 * Tailwind CSS v4 is wired in as a PostCSS plugin. Without this the utility
 * classes in the components are never generated and every page renders
 * unstyled.
 */

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
