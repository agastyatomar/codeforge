export { PythonRuntime, createPythonRuntime } from './python';
export { JavaScriptRuntime, createJavaScriptRuntime } from './javascript';
export { WebContainerRuntime, createWebContainerRuntime } from './webcontainer';
export { RustRuntime, createRustRuntime } from './rust';
export { GoRuntime, createGoRuntime } from './go';
export { CppRuntime, createCppRuntime } from './cpp';

import { PythonRuntime } from './python';
import { JavaScriptRuntime } from './javascript';
import { WebContainerRuntime } from './webcontainer';
import { RustRuntime } from './rust';
import { GoRuntime } from './go';
import { CppRuntime } from './cpp';
import { Runtime, RuntimeConfig } from '../index';

export async function createAllRuntimes(config: RuntimeConfig = {}) {
  const runtimes = [
    new PythonRuntime(config),
    new JavaScriptRuntime(config),
    new WebContainerRuntime(config),
    new RustRuntime(config),
    new GoRuntime(config),
    new CppRuntime(config),
  ];

  await Promise.all(runtimes.map((r) => r.initialize().catch((e) => console.warn(`Failed to init ${r.name}:`, e))));

  return runtimes;
}

export function getRuntimeByLanguage(language: string, runtimes: Runtime[]): Runtime | undefined {
  return runtimes.find((r) => r.supportedLanguages.includes(language.toLowerCase()));
}