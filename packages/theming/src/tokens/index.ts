export interface DesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  transitions: TransitionTokens;
  breakpoints: BreakpointTokens;
  zIndex: ZIndexTokens;
}

export interface ColorTokens {
  // Base colors
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  danger: ColorScale;
  info: ColorScale;

  // Neutral colors
  neutral: ColorScale;
  
  // Semantic colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  foreground: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  border: {
    light: string;
    medium: string;
    dark: string;
    focus: string;
  };
  
  // Interactive colors
  interactive: {
    hover: string;
    active: string;
    focus: string;
    disabled: string;
  };
  
  // Status colors
  status: {
    online: string;
    away: string;
    busy: string;
    offline: string;
  };
  
  // Code syntax colors
  syntax: {
    keyword: string;
    string: string;
    number: string;
    function: string;
    comment: string;
    variable: string;
    operator: string;
    punctuation: string;
  };
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface SpacingTokens {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  64: string;
  80: string;
  96: string;
}

export interface TypographyTokens {
  fontFamilies: {
    sans: string[];
    mono: string[];
    serif: string[];
    display: string[];
  };
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeights: {
    thin: number;
    extralight: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };
  lineHeights: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacings: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

export interface BorderRadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface ShadowTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  focus: string;
}

export interface TransitionTokens {
  fast: string;
  normal: string;
  slow: string;
  easings: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface BreakpointTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ZIndexTokens {
  hide: number;
  base: number;
  dropdown: number;
  sticky: number;
  fixed: number;
  modalBackdrop: number;
  modal: number;
  popover: number;
  tooltip: number;
  toast: number;
}

// Default Light Theme Tokens
export const lightTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
      400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
      800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
    },
    secondary: {
      50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
      400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
      800: '#1e293b', 900: '#0f172a', 950: '#020617',
    },
    success: {
      50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
      400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
      800: '#166534', 900: '#14532d', 950: '#052e16',
    },
    warning: {
      50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
      400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
      800: '#92400e', 900: '#78350f', 950: '#451a03',
    },
    danger: {
      50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
      400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
      800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
    },
    info: {
      50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
      400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
      800: '#075985', 900: '#0c4a6e', 950: '#082f49',
    },
    neutral: {
      50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
      400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040',
      800: '#262626', 900: '#171717', 950: '#0a0a0a',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      inverse: '#0d1117',
    },
    foreground: {
      primary: '#0d1117',
      secondary: '#404040',
      tertiary: '#737373',
      inverse: '#ffffff',
    },
    border: {
      light: '#e5e5e5',
      medium: '#d4d4d4',
      dark: '#a3a3a3',
      focus: '#3b82f6',
    },
    interactive: {
      hover: '#f1f5f9',
      active: '#e2e8f0',
      focus: '#bfdbfe',
      disabled: '#f5f5f5',
    },
    status: {
      online: '#22c55e',
      away: '#f59e0b',
      busy: '#ef4444',
      offline: '#737373',
    },
    syntax: {
      keyword: '#9333ea',
      string: '#22c55e',
      number: '#f59e0b',
      function: '#3b82f6',
      comment: '#737373',
      variable: '#8b5cf6',
      operator: '#ef4444',
      punctuation: '#64748b',
    },
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    64: '16rem',
    80: '20rem',
    96: '24rem',
  },
  typography: {
    fontFamilies: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      serif: ['Georgia', 'serif'],
      display: ['Cal Sans', 'Inter', 'sans-serif'],
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeights: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeights: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacings: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    focus: '0 0 0 3px rgb(59 130 246 / 0.4)',
  },
  transitions: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    easings: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
    toast: 1700,
  },
};

// Default Dark Theme Tokens
export const darkTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
      400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
      800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
    },
    secondary: {
      50: '#0d1117', 100: '#161b22', 200: '#21262d', 300: '#30363d',
      400: '#484f58', 500: '#6e7681', 600: '#8b949e', 700: '#c9d1d9',
      800: '#e6edf3', 900: '#f0f6fc', 950: '#ffffff',
    },
    success: {
      50: '#052e16', 100: '#14532d', 200: '#166534', 300: '#15803d',
      400: '#16a34a', 500: '#22c55e', 600: '#16a34a', 700: '#4ade80',
      800: '#86efac', 900: '#bbf7d0', 950: '#dcfce7',
    },
    warning: {
      50: '#451a03', 100: '#78350f', 200: '#92400e', 300: '#b45309',
      400: '#d97706', 500: '#f59e0b', 600: '#fbbf24', 700: '#fcd34d',
      800: '#fde68a', 900: '#fef3c7', 950: '#fffbeb',
    },
    danger: {
      50: '#450a0a', 100: '#7f1d1d', 200: '#991b1b', 300: '#b91c1c',
      400: '#dc2626', 500: '#ef4444', 600: '#f87171', 700: '#fca5a5',
      800: '#fecaca', 900: '#fee2e2', 950: '#fef2f2',
    },
    info: {
      50: '#082f49', 100: '#0c4a6e', 200: '#075985', 300: '#0369a1',
      400: '#0284c7', 500: '#0ea5e9', 600: '#38bdf8', 700: '#7dd3fc',
      800: '#bae6fd', 900: '#e0f2fe', 950: '#f0f9ff',
    },
    neutral: {
      50: '#0a0a0a', 100: '#171717', 200: '#262626', 300: '#404040',
      400: '#525252', 500: '#737373', 600: '#a3a3a3', 700: '#d4d4d4',
      800: '#e5e5e5', 900: '#f5f5f5', 950: '#fafafa',
    },
    background: {
      primary: '#0d1117',
      secondary: '#161b22',
      tertiary: '#21262d',
      inverse: '#ffffff',
    },
    foreground: {
      primary: '#f0f6fc',
      secondary: '#c9d1d9',
      tertiary: '#8b949e',
      inverse: '#0d1117',
    },
    border: {
      light: '#30363d',
      medium: '#484f58',
      dark: '#6e7681',
      focus: '#58a6ff',
    },
    interactive: {
      hover: '#161b22',
      active: '#21262d',
      focus: '#1d3a5c',
      disabled: '#30363d',
    },
    status: {
      online: '#3fb950',
      away: '#d29922',
      busy: '#f85149',
      offline: '#8b949e',
    },
    syntax: {
      keyword: '#d2a8ff',
      string: '#3fb950',
      number: '#d29922',
      function: '#58a6ff',
      comment: '#8b949e',
      variable: '#d2a8ff',
      operator: '#f85149',
      punctuation: '#8b949e',
    },
  },
  spacing: lightTokens.spacing,
  typography: lightTokens.typography,
  borderRadius: lightTokens.borderRadius,
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.3)',
    focus: '0 0 0 3px rgb(88 166 255 / 0.4)',
  },
  transitions: lightTokens.transitions,
  breakpoints: lightTokens.breakpoints,
  zIndex: lightTokens.zIndex,
};

// High Contrast Theme Tokens
export const highContrastTokens: DesignTokens = {
  ...darkTokens,
  colors: {
    ...darkTokens.colors,
    background: {
      primary: '#000000',
      secondary: '#1a1a1a',
      tertiary: '#333333',
      inverse: '#ffffff',
    },
    foreground: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
      tertiary: '#cccccc',
      inverse: '#000000',
    },
    border: {
      light: '#ffffff',
      medium: '#ffffff',
      dark: '#ffffff',
      focus: '#ffff00',
    },
    primary: {
      50: '#ffff00', 100: '#ffff00', 200: '#ffff00', 300: '#ffff00',
      400: '#ffff00', 500: '#ffff00', 600: '#ffff00', 700: '#ffff00',
      800: '#ffff00', 900: '#ffff00', 950: '#ffff00',
    },
  },
};

// Sepia Theme Tokens
export const sepiaTokens: DesignTokens = {
  ...lightTokens,
  colors: {
    ...lightTokens.colors,
    background: {
      primary: '#fdf6e3',
      secondary: '#eee8d5',
      tertiary: '#ddd0b8',
      inverse: '#0d1117',
    },
    foreground: {
      primary: '#3c2f1f',
      secondary: '#5c4a3a',
      tertiary: '#7a6a5a',
      inverse: '#fdf6e3',
    },
    border: {
      light: '#d4c4a8',
      medium: '#b8a890',
      dark: '#9c8c70',
      focus: '#8b6914',
    },
    primary: {
      50: '#fef9f0', 100: '#fdf3e1', 200: '#fce7c3', 300: '#fbdb94',
      400: '#f9ca5a', 500: '#f7bf2e', 600: '#e6a81e', 700: '#d49a1a',
      800: '#b87e16', 900: '#965d13', 950: '#562e0a',
    },
  },
};

// Nord Theme Tokens
export const nordTokens: DesignTokens = {
  ...darkTokens,
  colors: {
    ...darkTokens.colors,
    background: {
      primary: '#2e3440',
      secondary: '#3b4252',
      tertiary: '#434c5e',
      inverse: '#eceff4',
    },
    foreground: {
      primary: '#eceff4',
      secondary: '#d8dee9',
      tertiary: '#b4bdc9',
      inverse: '#2e3440',
    },
    border: {
      light: '#4c566a',
      medium: '#5e6a7a',
      dark: '#6d7a8a',
      focus: '#88c0d0',
    },
    primary: {
      50: '#ebf5fb', 100: '#d7ecfa', 200: '#afd8f5', 300: '#85c1eb',
      400: '#5ab0e0', 500: '#88c0d0', 600: '#4c9fc0', 700: '#3a7ca5',
      800: '#2f6386', 900: '#2a5272', 950: '#203c51',
    },
  },
};

export const THEME_PRESETS = {
  light: lightTokens,
  dark: darkTokens,
  'high-contrast': highContrastTokens,
  sepia: sepiaTokens,
  nord: nordTokens,
} as const;

export type ThemePreset = keyof typeof THEME_PRESETS;

export function getThemeTokens(preset: ThemePreset): DesignTokens {
  return THEME_PRESETS[preset];
}

export function createCustomTheme(base: DesignTokens, overrides: Partial<DesignTokens>): DesignTokens {
  return deepMerge(base, overrides);
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== undefined) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}