import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import type { ModeConfig } from './modes';

let googleClient: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function getGoogleClient() {
  if (!googleClient) {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    googleClient = createGoogleGenerativeAI({ apiKey });
  }
  return googleClient;
}

export function getModelForMode(mode: ModeConfig): LanguageModel {
  return getGoogleClient()(mode.model) as LanguageModel;
}

export function getFastTitleModel(): LanguageModel {
  return getGoogleClient()('gemini-3.6-flash') as LanguageModel;
}