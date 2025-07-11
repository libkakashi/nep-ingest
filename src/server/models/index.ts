import LLMClient from './client';
import {ClaudeChatModel, GeminiChatModel, LlamaChatModel} from './models';

export const major = new LLMClient(ClaudeChatModel.OPUS);
export const minor = new LLMClient(GeminiChatModel.FLASH);
export const extraMinor = new LLMClient(LlamaChatModel.SCOUT);
