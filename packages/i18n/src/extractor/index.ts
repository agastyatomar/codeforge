import i18next from 'i18next';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface ExtractionOptions {
  srcDir: string;
  outputDir: string;
  patterns: string[];
  functions: string[];
  namespaces: string[];
  defaultLocale: string;
  supportedLocales: string[];
}

export interface ExtractionResult {
  locale: string;
  namespace: string;
  keys: number;
  keysAdded: number;
  keysRemoved: number;
}

export class I18nExtractor {
  private options: ExtractionOptions;
  private extractedKeys = new Map<string, Set<string>>();

  constructor(options: Partial<ExtractionOptions> = {}) {
    this.options = {
      srcDir: 'src',
      outputDir: 'locales',
      patterns: ['**/*.{ts,tsx,js,jsx}'],
      functions: ['t', 'i18n.t', 'useTranslation().t'],
      namespaces: ['common'],
      defaultLocale: 'en',
      supportedLocales: ['en'],
      ...options,
    };
  }

  async extract(): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];

    // Find all source files
    const files = await this.findSourceFiles();
    console.log(`Found ${files.length} source files to scan`);

    // Extract keys from source files
    for (const file of files) {
      await this.extractFromFile(file);
    }

    // Load existing translations
    await this.loadExistingTranslations();

    // Generate updated translation files
    const results = await this.generateTranslationFiles();

    return results;
  }

  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    for (const pattern of this.options.patterns) {
      const matches = await glob(pattern, {
        cwd: this.options.srcDir,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts'],
      });
      files.push(...matches);
    }
    return [...new Set(files)];
  }

  private async extractFromFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(this.options.srcDir, filePath);

    // Extract t('key') calls
    const regex = /t\(['"`]([^'"`]+)['"`](?:\s*,\s*\{[^}]*\})?\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const key = match[1];
      this.addKey('common', key);
    }

    // Extract i18n.t('key') calls
    const regex2 = /i18n\.t\(['"`]([^'"`]+)['"`](?:\s*,\s*\{[^}]*\})?\)/g;
    while ((match = regex2.exec(content)) !== null) {
      const key = match[1];
      this.addKey('common', key);
    }

    // Extract useTranslation().t('key') calls
    const regex3 = /useTranslation\(\)\.t\(['"`]([^'"`]+)['"`](?:\s*,\s*\{[^}]*\})?\)/g;
    while ((match = regex3.exec(content)) !== null) {
      const key = match[1];
      this.addKey('common', key);
    }

    // Extract Trans components
    const transRegex = /<Trans[^>]*>([\s\S]*?)<\/Trans>/g;
    while ((match = transRegex.exec(content)) !== null) {
      // Extract text content from Trans component
      const textContent = match[1].replace(/<[^>]*>/g, '').trim();
      if (textContent) {
        // Generate key from content
        const key = this.generateKeyFromText(textContent);
        this.addKey('common', key);
      }
    }

    // Extract pluralization
    const pluralRegex = /t\(['"`]([^'"`]+)['"`],\s*\{[^}]*count\s*:\s*\w+\s*\}\)/g;
    while ((match = pluralRegex.exec(content)) !== null) {
      const key = match[1];
      this.addKey('common', key + '_singular');
      this.addKey('common', key + '_plural');
    }
  }

  private addKey(namespace: string, key: string): void {
    if (!this.extractedKeys.has(namespace)) {
      this.extractedKeys.set(namespace, new Set());
    }
    this.extractedKeys.get(namespace)!.add(key);
  }

  private generateKeyFromText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 100);
  }

  private async loadExistingTranslations(): Promise<void> {
    for (const locale of this.options.supportedLocales) {
      for (const namespace of this.options.namespaces) {
        const filePath = path.join(this.options.outputDir, locale, `${namespace}.json`);
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            this.flattenKeys(data, '', namespace);
          } catch (error) {
            console.warn(`Failed to load ${filePath}:`, error);
          }
        }
      }
    }
  }

  private flattenKeys(obj: any, prefix: string, namespace: string): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') {
        this.addKey(namespace, fullKey);
      } else if (typeof value === 'object' && value !== null) {
        this.flattenKeys(value, fullKey, namespace);
      }
    }
  }

  private async generateTranslationFiles(): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];

    for (const locale of this.options.supportedLocales) {
      for (const namespace of this.options.namespaces) {
        const extractedKeys = this.extractedKeys.get(namespace) || new Set();
        const outputDir = path.join(this.options.outputDir, locale);
        const filePath = path.join(outputDir, `${namespace}.json`);

        // Load existing translations
        let existingData: Record<string, any> = {};
        if (fs.existsSync(filePath)) {
          try {
            existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          } catch (error) {
            console.warn(`Failed to parse ${filePath}:`, error);
          }
        }

        // Get existing keys
        const existingKeys = new Set<string>();
        this.flattenKeys(existingData, '', '').forEach(key => existingKeys.add(key));

        // Calculate changes
        const keysAdded = [...extractedKeys].filter(k => !existingKeys.has(k));
        const keysRemoved = [...existingKeys].filter(k => !extractedKeys.has(k));

        // Build updated translation object
        const updatedData = this.buildTranslationObject(extractedKeys, existingData);

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write updated translations
        fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));

        results.push({
          locale,
          namespace,
          keys: extractedKeys.size,
          keysAdded: keysAdded.length,
          keysRemoved: keysRemoved.length,
        });

        console.log(`Generated ${filePath}: ${extractedKeys.size} keys (${keysAdded.length} added, ${keysRemoved.length} removed)`);
      }
    }

    return results;
  }

  private buildTranslationObject(extractedKeys: Set<string>, existingData: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key of extractedKeys) {
      const value = this.getNestedValue(existingData, key) || key; // Use key as default value
      this.setNestedValue(result, key, value);
    }

    return result;
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], obj);
  }

  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
}

export async function runExtraction(options?: Partial<ExtractionOptions>): Promise<void> {
  const extractor = new I18nExtractor(options);
  await extractor.extract();
  console.log('Extraction complete!');
}

export async function runCompilation(outputDir: string, supportedLocales: string[]): Promise<void> {
  // Compile translations for production (bundle them)
  console.log('Compiling translations...');
  // Implementation would bundle translations for production
}