import axeCore from 'axe-core';

export interface A11yViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: A11yNode[];
  tags: string[];
}

export interface A11yNode {
  target: string[];
  html: string;
  failureSummary: string;
  any: A11yCheck[];
  all: A11yCheck[];
  none: A11yCheck[];
}

export interface A11yCheck {
  id: string;
  data: any;
  relatedNodes: any[];
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  message: string;
}

export interface A11yAuditResult {
  violations: A11yViolation[];
  passes: A11yCheck[];
  incomplete: A11yCheck[];
  inapplicable: A11yCheck[];
  timestamp: number;
  url: string;
  userAgent: string;
  toolVersion: string;
}

export interface A11yReport {
  summary: {
    totalViolations: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    passes: number;
    incomplete: number;
  };
  violations: A11yViolation[];
  score: number; // 0-100
  passed: boolean;
}

export class A11yAuditor {
  private static instance: A11yAuditor;
  private axe: typeof axeCore;

  private constructor() {
    this.axe = axeCore;
  }

  static getInstance(): A11yAuditor {
    if (!A11yAuditor.instance) {
      A11yAuditor.instance = new A11yAuditor();
    }
    return A11yAuditor.instance;
  }

  async audit(context?: Document | Element, options?: axeCore.RunOptions): Promise<A11yAuditResult> {
    const results = await this.axe.run(context || document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
      },
      ...options,
    });

    return {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      toolVersion: this.axe.version,
    };
  }

  generateReport(auditResult: A11yAuditResult): A11yReport {
    const violationCounts = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    };

    for (const violation of auditResult.violations) {
      violationCounts[violation.impact]++;
    }

    const totalViolations = auditResult.violations.length;
    const totalChecks = totalViolations + auditResult.passes.length + auditResult.incomplete.length;
    const score = totalChecks > 0 ? Math.round((auditResult.passes.length / totalChecks) * 100) : 100;

    return {
      summary: {
        totalViolations,
        critical: violationCounts.critical,
        serious: violationCounts.serious,
        moderate: violationCounts.moderate,
        minor: violationCounts.minor,
        passes: auditResult.passes.length,
        incomplete: auditResult.incomplete.length,
      },
      violations: auditResult.violations,
      score,
      passed: violationCounts.critical === 0 && violationCounts.serious === 0,
    };
  }

  async runFullAudit(): Promise<A11yReport> {
    const auditResult = await this.audit();
    return this.generateReport(auditResult);
  }

  async auditElement(element: Element): Promise<A11yAuditResult> {
    return this.audit(element);
  }

  getRules(): axeCore.RuleMetadata[] {
    return this.axe.getRules();
  }

  getRule(ruleId: string): axeCore.RuleMetadata | undefined {
    return this.axe.getRules().find(r => r.id === ruleId);
  }
}

export const a11yAuditor = A11yAuditor.getInstance();

// React hooks for accessibility
export function useA11yAudit() {
  const [report, setReport] = React.useState<A11yReport | null>(null);
  const [loading, setLoading] = React.useState(false);

  const runAudit = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await a11yAuditor.runFullAudit();
      setReport(result);
    } catch (error) {
      console.error('A11y audit failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { report, loading, runAudit };
}

// Keyboard navigation utilities
export function useKeyboardNavigation(
  onEscape?: () => void,
  onEnter?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void,
  onTab?: (shiftKey: boolean) => void
) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onEscape?.();
          break;
        case 'Enter':
          onEnter?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onArrowRight?.();
          break;
        case 'Tab':
          onTab?.(event.shiftKey);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]);
}

// Focus management
export function useFocusTrap(enabled = true) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleTab);
  }, [enabled]);

  return containerRef;
}

// Announcer for screen readers
export function useAnnouncer() {
  const announcerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!announcerRef.current) {
      announcerRef.current = document.createElement('div');
      announcerRef.current.setAttribute('role', 'status');
      announcerRef.current.setAttribute('aria-live', 'polite');
      announcerRef.current.setAttribute('aria-atomic', 'true');
      announcerRef.current.className = 'sr-only';
      announcerRef.current.style.position = 'absolute';
      announcerRef.current.style.left = '-10000px';
      announcerRef.current.style.width = '1px';
      announcerRef.current.style.height = '1px';
      announcerRef.current.style.overflow = 'hidden';
      document.body.appendChild(announcerRef.current);
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
        announcerRef.current = null;
      }
    };
  }, []);

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return { announce };
}

// Color contrast utilities
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(c => {
      const c255 = c / 255;
      return c255 <= 0.03928 ? c255 / 12.92 : Math.pow((c255 + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function meetsContrastRatio(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const threshold = level === 'AAA' 
    ? (size === 'large' ? 4.5 : 7)
    : (size === 'large' ? 3 : 4.5);
  
  return ratio >= threshold;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ] : null;
}

// ARIA utilities
export function generateId(prefix = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

export function setAriaAttributes(element: HTMLElement, attributes: Record<string, string | boolean>): void {
  for (const [key, value] of Object.entries(attributes)) {
    if (value === false || value === undefined || value === null) {
      element.removeAttribute(`aria-${key}`);
    } else {
      element.setAttribute(`aria-${key}`, String(value));
    }
  }
}

export function createAriaLiveRegion(priority: 'polite' | 'assertive' = 'polite'): HTMLElement {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  region.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
  return region;
}

// Skip link component
export function SkipLink({ target, children = 'Skip to main content' }: { target: string; children?: string }) {
  return (
    <a
      href={target}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
    >
      {children}
    </a>
  );
}

// Reduced motion detection
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// High contrast detection
export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setPrefersHighContrast(mediaQuery.matches);
    
    const handler = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersHighContrast;
}