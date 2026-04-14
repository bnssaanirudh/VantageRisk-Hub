/**
 * IncomeLens AI — Brand Design Tokens
 * ==========================================
 * Standardized color palette and visual tokens for the "Winning" aesthetic.
 * These are used across the landing page and dashboard components.
 */

export const BRAND_CONFIG = {
  name: "IncomeLens AI",
  tagline: "Enterprise Risk & Intelligence Platform",
  colors: {
    background: "#080B14",
    surface: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.1)",
    primary: {
      from: "#3B82F6", // Electric Blue
      to: "#8B5CF6",   // Vibrant Purple
      glow: "rgba(59, 130, 246, 0.5)",
    },
    success: {
      text: "#10B981", // Neon Emerald
      bg: "rgba(16, 185, 129, 0.1)",
    },
    danger: {
      text: "#EF4444", // Soft Red
      bg: "rgba(239, 68, 68, 0.1)",
    },
    warning: {
      text: "#F59E0B", // Amber
      bg: "rgba(245, 158, 11, 0.1)",
    },
  },
  animations: {
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};
