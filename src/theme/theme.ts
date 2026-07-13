import type { ThemeConfig } from 'antd';

/**
 * Aegis design tokens layered onto Ant Design. This is the "custom design system on a component
 * library" approach: antd gives us robust tables/forms/modals; these tokens + the shell components
 * give a distinctive, ownable, Okta-like look rather than stock antd.
 */
export const colors = {
  primary: '#3b5bdb',
  primaryHover: '#4c6ef5',
  navy: '#0f1b3d',
  navyMuted: '#1b2a52',
  sidebarText: '#c7d0e8',
  success: '#2f9e44',
  warning: '#e8590c',
  danger: '#e03131',
  bg: '#f4f6fb',
} as const;

export const aegisTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorLink: colors.primary,
    colorInfo: colors.primary,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.danger,
    borderRadius: 8,
    fontFamily:
      "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    controlHeight: 38,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 60,
      bodyBg: colors.bg,
      siderBg: colors.navy,
    },
    Menu: {
      darkItemBg: colors.navy,
      darkSubMenuItemBg: colors.navy,
      darkItemSelectedBg: colors.navyMuted,
      darkItemColor: colors.sidebarText,
      darkItemHoverColor: '#ffffff',
      itemBorderRadius: 8,
    },
    Button: {
      primaryShadow: 'none',
      fontWeight: 600,
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#475569',
      rowHoverBg: '#f8fafc',
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
};
