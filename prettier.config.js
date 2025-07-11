import gtsConfig from 'gts/.prettierrc.json' with {type: 'json'};

/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  ...gtsConfig,
  plugins: [...(gtsConfig.plugins || []), 'prettier-plugin-tailwindcss'],
};

export default config;
