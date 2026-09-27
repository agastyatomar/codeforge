import type { Exercise } from '@codeforge/core/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule {
  name: string;
  validate: (code: string, exercise: Exercise) => { valid: boolean; error?: string; warning?: string };
}

export const validationRules: ValidationRule[] = [
  {
    name: 'no-eval',
    validate: (code) => {
      if (/\beval\s*\(/.test(code)) {
        return { valid: false, error: 'Use of eval() is not allowed' };
      }
      return { valid: true };
    },
  },
  {
    name: 'no-function-constructor',
    validate: (code) => {
      if (/new\s+Function\s*\(/.test(code)) {
        return { valid: false, error: 'Use of Function constructor is not allowed' };
      }
      return { valid: true };
    },
  },
  {
    name: 'no-with-statement',
    validate: (code) => {
      if (/\bwith\s*\(/.test(code)) {
        return { valid: false, error: 'Use of with statement is not allowed' };
      }
      return { valid: true };
    },
  },
  {
    name: 'max-nesting-depth',
    validate: (code, exercise) => {
      const maxDepth = exercise.metadata?.maxNestingDepth || 4;
      let depth = 0;
      let max = 0;

      for (const char of code) {
        if (char === '{') {
          depth++;
          max = Math.max(max, depth);
        } else if (char === '}') {
          depth--;
        }
      }

      if (max > maxDepth) {
        return { valid: false, error: `Maximum nesting depth exceeded (${max}/${maxDepth})` };
      }
      return { valid: true };
    },
  },
  {
    name: 'max-function-length',
    validate: (code, exercise) => {
      const maxLines = exercise.metadata?.maxFunctionLines || 50;
      const functions = code.match(/function\s+\w*\s*\([^)]*\)\s*\{/g) || [];

      for (const fn of functions) {
        const start = code.indexOf(fn);
        const bodyStart = code.indexOf('{', start);
        let braceCount = 1;
        let end = bodyStart + 1;

        while (braceCount > 0 && end < code.length) {
          if (code[end] === '{') braceCount++;
          else if (code[end] === '}') braceCount--;
          end++;
        }

        const fnCode = code.slice(start, end);
        const lines = fnCode.split('\n').length;
        if (lines > maxLines) {
          return { valid: false, error: `Function exceeds maximum length (${lines}/${maxLines} lines)` };
        }
      }
      return { valid: true };
    },
  },
  {
    name: 'no-console-log',
    validate: (code, exercise) => {
      if (exercise.metadata?.allowConsoleLog === false && /console\.log/.test(code)) {
        return { valid: true, warning: 'console.log() usage detected - consider removing for production' };
      }
      return { valid: true };
    },
  },
  {
    name: 'no-var',
    validate: (code, exercise) => {
      if (exercise.metadata?.disallowVar && /\bvar\s+/.test(code)) {
        return { valid: false, error: 'Use of var is not allowed, use const or let' };
      }
      return { valid: true };
    },
  },
  {
    name: 'require-strict-mode',
    validate: (code, exercise) => {
      if (exercise.metadata?.requireStrictMode && !/^['"]use strict['"]/.test(code.trim())) {
        return { valid: true, warning: 'Strict mode not enabled' };
      }
      return { valid: true };
    },
  },
];

export function validateCode(code: string, exercise: Exercise): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of validationRules) {
    const result = rule.validate(code, exercise);
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
    if (result.warning) {
      warnings.push(result.warning);
    }
  }

  if (exercise.metadata?.blockedPatterns) {
    for (const pattern of exercise.metadata.blockedPatterns) {
      const regex = new RegExp(pattern);
      if (regex.test(code)) {
        errors.push(`Forbidden pattern detected: ${pattern}`);
      }
    }
  }

  if (exercise.metadata?.requiredPatterns) {
    for (const pattern of exercise.metadata.requiredPatterns) {
      const regex = new RegExp(pattern);
      if (!regex.test(code)) {
        errors.push(`Required pattern missing: ${pattern}`);
      }
    }
  }

  if (exercise.metadata?.maxLines) {
    const lines = code.split('\n').length;
    if (lines > exercise.metadata.maxLines) {
      errors.push(`Code exceeds maximum lines (${lines}/${exercise.metadata.maxLines})`);
    }
  }

  if (exercise.metadata?.maxCharacters) {
    if (code.length > exercise.metadata.maxCharacters) {
      errors.push(`Code exceeds maximum characters (${code.length}/${exercise.metadata.maxCharacters})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function createValidator(customRules: ValidationRule[] = []) {
  const allRules = [...validationRules, ...customRules];

  return function validate(code: string, exercise: Exercise): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of allRules) {
      const result = rule.validate(code, exercise);
      if (!result.valid && result.error) {
        errors.push(result.error);
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  };
}

export const languageValidators: Record<string, (code: string) => ValidationResult> = {
  python: (code) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      eval(`compile(${JSON.stringify(code)}, '<string>', 'exec')`);
    } catch (e) {
      errors.push(`Syntax error: ${e}`);
    }

    if (/exec\s*\(|eval\s*\(/.test(code)) {
      errors.push('Use of exec() or eval() is not allowed');
    }

    return { valid: errors.length === 0, errors, warnings };
  },
  javascript: (code) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      new Function(code);
    } catch (e) {
      errors.push(`Syntax error: ${e}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  },
  typescript: (code) => {
    return languageValidators.javascript(code);
  },
};

export function validateForLanguage(code: string, language: string): ValidationResult {
  const validator = languageValidators[language.toLowerCase()];
  if (validator) {
    return validator(code);
  }
  return { valid: true, errors: [], warnings: [] };
}