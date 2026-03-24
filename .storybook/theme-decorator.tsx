import React, { useEffect } from "react";
import type { Decorator } from "@storybook/react";

export const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme || "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Also set the body bg so the Storybook canvas background responds
    document.body.style.backgroundColor = "var(--bg-primary)";
    document.body.style.color = "var(--text-primary)";
  }, [theme]);

  return <Story />;
};
