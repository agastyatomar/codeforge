import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { z } from 'zod';

export const SupportedLocaleSchema = z.enum([
  'en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru', 'ar', 'hi',
  'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id', 'sv', 'no', 'da', 'fi',
]);

export type SupportedLocale = z.infer<typeof SupportedLocaleSchema>;

export const LocaleConfigSchema = z.object({
  locale: SupportedLocaleSchema,
  fallbackLocale: SupportedLocaleSchema.default('en'),
  supportedLocales: z.array(SupportedLocaleSchema).default(['en']),
  rtlLocales: z.array(SupportedLocaleSchema).default(['ar', 'he']),
  namespace: z.string().default('common'),
  fallbackNamespace: z.string().default('common'),
  interpolation: z.object({
    escapeValue: z.boolean().default(false),
    formatSeparator: z.string().default(','),
  }).default({}),
  react: z.object({
    useSuspense: z.boolean().default(false),
    transSupportBasicHtmlNodes: z.boolean().default(true),
    transKeepBasicHtmlNodesFor: z.array(z.string()).default(['br', 'strong', 'i', 'em']),
  }).default({}),
});

export type LocaleConfig = z.infer<typeof LocaleConfigSchema>;

export interface TranslationResource {
  [key: string]: string | TranslationResource;
}

export interface LocaleMetadata {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  rtl: boolean;
  pluralRules: 'one' | 'two' | 'few' | 'many' | 'other';
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    precision: number;
  };
  currency: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
  };
}

export const LOCALE_METADATA: Record<SupportedLocale, LocaleMetadata> = {
  en: { code: 'en', name: 'English', nativeName: 'English', rtl: false, pluralRules: 'one', dateFormat: 'MM/DD/YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', precision: 2 }, currency: { code: 'USD', symbol: '$', position: 'before' } },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false, pluralRules: 'one', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', precision: 2 }, currency: { code: 'EUR', symbol: '€', position: 'after' } },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', rtl: false, pluralRules: 'one', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', precision: 2 }, currency: { code: 'EUR', symbol: '€', position: 'after' } },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false, pluralRules: 'one', dateFormat: 'DD.MM.YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', precision: 2 }, currency: { code: 'EUR', symbol: '€', position: 'after' } },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false, pluralRules: 'other', dateFormat: 'YYYY年MM月DD日', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', precision: 2 }, currency: { code: 'CNY', symbol: '¥', position: 'before' } },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false, pluralRules: 'other', dateFormat: 'YYYY年MM月DD日', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', precision: 0 }, currency: { code: 'JPY', symbol: '¥', position: 'before' } },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false, pluralRules: 'other', dateFormat: 'YYYY년 MM월 DD일', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', precision: 0 }, currency: { code: 'KRW', symbol: '₩', position: 'before' } },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false, pluralRules: 'one', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', precision: 2 }, currency: { code: 'BRL', symbol: 'R$', position: 'before' } },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false, pluralRules: 'few', dateFormat: 'DD.MM.YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', precision: 2 }, currency: { code: 'RUB', symbol: '₽', position: 'after' } },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true, pluralRules: 'many', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', precision: 2 }, currency: { code: 'SAR', symbol: 'ر.س', position: 'before' } },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false, pluralRules: 'many', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', precision: 2 }, currency: { code: 'INR', symbol: '₹', position: 'before' } },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false, pluralRules: 'one', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', precision: 2 }, currency: { code: 'EUR', symbol: '€', position: 'after' } },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', rtl: false, pluralRules: 'one', dateFormat: 'DD-MM-YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', precision: 2 }, currency: { code: 'EUR', symbol: '€', position: 'after' } },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', rtl: false, pluralRules: 'few', dateFormat: 'DD.MM.YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', precision: 2 }, currency: { code: 'PLN', symbol: 'zł', position: 'after' } },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false, pluralRules: 'one', dateFormat: 'DD.MM.YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', precision: 2 }, currency: { code: 'TRY', symbol: '₺', position: 'before' } },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false, pluralRules: 'other', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', precision: 2 }, currency: { code: 'VND', symbol: '₫', position: 'after' } },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', rtl: false, pluralRules: 'other', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', precision: 2 }, currency: { code: 'THB', symbol: '฿', position: 'before' } },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false, pluralRules: 'other', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', precision: 2 }, currency: { code: 'IDR', symbol: 'Rp', position: 'before' } },
  sv: { code: 'sv', name: 'Swedish', nativeName: 'Svenska', rtl: false, pluralRules: 'one', dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', precision: 2 }, currency: { code: 'SEK', symbol: 'kr', position: 'after' } },
  no: { code: 'no', name: 'Norwegian', nativeName: 'Norsk', rtl: false, pluralRules: 'one', dateFormat: 'DD.MM.YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', precision: 2 }, currency: { code: 'NOK', symbol: 'kr', position: 'after' } },
  da: { code: 'da', name: 'Danish', nativeName: 'Dansk', rtl: false, pluralRules: 'one', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', precision: 2 }, currency: { code: 'DKK', symbol: 'kr', position: 'after' } },
  fi: { code: 'fi', name: 'Finnish', nativeName: 'Suomi', rtl: false, pluralRules: 'one', dateFormat: 'DD.MM.YYYY', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', precision: 2 }, currency: { code: 'EUR', symbol: '€', position: 'after' } },
};

export class I18nManager {
  private i18n: i18next.i18n;
  private config: LocaleConfig;
  private resources = new Map<string, TranslationResource>();

  constructor(config: Partial<LocaleConfig> = {}) {
    this.config = LocaleConfigSchema.parse(config);
    this.i18n = i18next.createInstance();
  }

  async initialize(): Promise<void> {
    await this.i18n
      .use(initReactI18next)
      .use(LanguageDetector)
      .use(HttpBackend)
      .init({
        lng: this.config.locale,
        fallbackLng: this.config.fallbackLocale,
        supportedLngs: this.config.supportedLocales,
        ns: [this.config.namespace],
        defaultNS: this.config.namespace,
        fallbackNS: this.config.fallbackNamespace,
        interpolation: this.config.interpolation,
        react: this.config.react,
        backend: {
          loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        detection: {
          order: ['localStorage', 'navigator', 'htmlTag'],
          caches: ['localStorage'],
        },
      });

    // Load initial resources
    for (const locale of this.config.supportedLocales) {
      await this.loadLocale(locale);
    }
  }

  async loadLocale(locale: SupportedLocale): Promise<void> {
    if (this.resources.has(locale)) return;

    try {
      const response = await fetch(`/locales/${locale}/${this.config.namespace}.json`);
      if (response.ok) {
        const resources = await response.json();
        this.resources.set(locale, resources);
        this.i18n.addResourceBundle(locale, this.config.namespace, resources, true, true);
      }
    } catch (error) {
      console.warn(`Failed to load locale ${locale}:`, error);
    }
  }

  async changeLanguage(locale: SupportedLocale): Promise<void> {
    if (!this.config.supportedLocales.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    await this.i18n.changeLanguage(locale);
    
    // Update document direction
    const metadata = LOCALE_METADATA[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = metadata.rtl ? 'rtl' : 'ltr';
    
    // Store preference
    localStorage.setItem('codeforge-locale', locale);
  }

  getCurrentLocale(): SupportedLocale {
    return this.i18n.language as SupportedLocale;
  }

  getSupportedLocales(): SupportedLocale[] {
    return this.config.supportedLocales;
  }

  getLocaleMetadata(locale: SupportedLocale): LocaleMetadata {
    return LOCALE_METADATA[locale];
  }

  isRTL(locale?: SupportedLocale): boolean {
    const localeToCheck = locale || this.getCurrentLocale();
    return LOCALE_METADATA[localeToCheck].rtl;
  }

  t(key: string, options?: Record<string, unknown>): string {
    return this.i18n.t(key, options);
  }

  tRich(key: string, options?: Record<string, unknown>): React.ReactElement {
    return this.i18n.t(key, { ...options, returnObjects: true }) as React.ReactElement;
  }

  addResource(locale: SupportedLocale, namespace: string, resources: TranslationResource): void {
    this.i18n.addResourceBundle(locale, namespace, resources, true, true);
    
    const existing = this.resources.get(locale) || {};
    this.resources.set(locale, this.deepMerge(existing, resources));
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  formatDate(date: Date, locale?: SupportedLocale, options?: Intl.DateTimeFormatOptions): string {
    const localeToUse = locale || this.getCurrentLocale();
    return new Intl.DateTimeFormat(localeToUse, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    }).format(date);
  }

  formatNumber(value: number, locale?: SupportedLocale, options?: Intl.NumberFormatOptions): string {
    const localeToUse = locale || this.getCurrentLocale();
    return new Intl.NumberFormat(localeToUse, options).format(value);
  }

  formatCurrency(value: number, currency?: string, locale?: SupportedLocale): string {
    const localeToUse = locale || this.getCurrentLocale();
    const currencyCode = currency || LOCALE_METADATA[localeToUse].currency.code;
    return new Intl.NumberFormat(localeToUse, {
      style: 'currency',
      currency: currencyCode,
    }).format(value);
  }

  formatRelativeTime(date: Date, locale?: SupportedLocale): string {
    const localeToUse = locale || this.getCurrentLocale();
    const rtf = new Intl.RelativeTimeFormat(localeToUse, { numeric: 'auto' });
    const diff = date.getTime() - Date.now();
    const absDiff = Math.abs(diff);
    
    if (absDiff < 60000) return rtf.format(Math.round(diff / 1000), 'second');
    if (absDiff < 3600000) return rtf.format(Math.round(diff / 60000), 'minute');
    if (absDiff < 86400000) return rtf.format(Math.round(diff / 3600000), 'hour');
    if (absDiff < 604800000) return rtf.format(Math.round(diff / 86400000), 'day');
    if (absDiff < 2592000000) return rtf.format(Math.round(diff / 604800000), 'week');
    if (absDiff < 31536000000) return rtf.format(Math.round(diff / 2592000000), 'month');
    return rtf.format(Math.round(diff / 31536000000), 'year');
  }

  pluralize(count: number, locale?: SupportedLocale): 'zero' | 'one' | 'two' | 'few' | 'many' | 'other' {
    const localeToUse = locale || this.getCurrentLocale();
    const pr = new Intl.PluralRules(localeToUse);
    return pr.select(count);
  }

  getResource(locale: SupportedLocale): TranslationResource | undefined {
    return this.resources.get(locale);
  }

  getAllResources(): Record<string, TranslationResource> {
    const result: Record<string, TranslationResource> = {};
    for (const [locale, resources] of this.resources) {
      result[locale] = resources;
    }
    return result;
  }
}

export function createI18nManager(config?: Partial<LocaleConfig>): I18nManager {
  return new I18nManager(config);
}

// React hook for i18n
export function useTranslation(namespace?: string) {
  const { t, i18n } = require('react-i18next').useTranslation(namespace);
  return { t, i18n, locale: i18n.language, changeLanguage: i18n.changeLanguage };
}