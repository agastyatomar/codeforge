export * from './ollama';
export * from './transformers';
export * from './context';
export * from './completion';
export * from './explanation';
export * from './debugging';

import { OllamaClient, createOllamaClient } from './ollama';
import { TransformersClient, createTransformersClient } from './transformers';
import { ContextManager, createContextManager } from './context';
import { CompletionEngine, createCompletionEngine } from './completion';
import { ExplanationEngine, createExplanationEngine } from './explanation';
import { DebuggingEngine, createDebuggingEngine } from './debugging';

export {
  OllamaClient,
  createOllamaClient,
  TransformersClient,
  createTransformersClient,
  ContextManager,
  createContextManager,
  CompletionEngine,
  createCompletionEngine,
  ExplanationEngine,
  createExplanationEngine,
  DebuggingEngine,
  createDebuggingEngine,
};

export type { OllamaConfig, GenerateRequest, GenerateResponse, ChatMessage, ChatRequest, ChatResponse } from './ollama';
export type { TransformersConfig, ModelInfo } from './transformers';
export type { CodeContext, ProjectStructure, FileInfo, DependencyInfo, GitStatus, RecentEdit } from './context';
export type { CompletionRequest, CompletionResult, InlineCompletionItem } from './completion';
export type { ExplanationRequest, ExplanationResult, ExplanationSection } from './explanation';
export type { DebugRequest, DebugResult, DebugAction } from './debugging';