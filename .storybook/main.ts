import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-links",
  ],
  framework: {
    name: "@storybook/nextjs-vite",
    options: { strictMode: false },
  },
  staticDirs: ["../public"],
  core: {
    builder: '@storybook/builder-vite',
    disableTelemetry: true,
  },
};

export default config;
