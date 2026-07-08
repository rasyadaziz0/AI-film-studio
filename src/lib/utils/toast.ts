import { gooeyToast } from "goey-toast";

const DEFAULT_TOAST_STYLES = {
  borderColor: "transparent",
  borderWidth: 0,
  preset: "bouncy" as const,
  bounce: 0.6,
  showTimestamp: true,
};

/**
 * Global centralized toast utility using goey-toast with custom bouncy design.
 */
export const toast = {
  success: (title: string, description?: string) => {
    if (typeof window === "undefined") return;
    gooeyToast.success(title, {
      ...DEFAULT_TOAST_STYLES,
      duration: 4000,
      description,
    });
  },

  error: (title: string, description?: string) => {
    if (typeof window === "undefined") return;
    gooeyToast.error(title, {
      ...DEFAULT_TOAST_STYLES,
      duration: 5000,
      description,
    });
  },

  info: (title: string, description?: string) => {
    if (typeof window === "undefined") return;
    gooeyToast.info(title, {
      ...DEFAULT_TOAST_STYLES,
      duration: 4000,
      description,
    });
  },

  warning: (title: string, description?: string) => {
    if (typeof window === "undefined") return;
    gooeyToast.warning(title, {
      ...DEFAULT_TOAST_STYLES,
      duration: 4500,
      description,
    });
  },
};
