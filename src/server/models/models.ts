export enum ClaudeChatModel {
  OPUS = 'claude-opus-4-20250514',
  SONNET = 'claude-sonnet-4-20250514',
}

export enum GeminiChatModel {
  PRO = 'gemini-2.5-pro-preview-05-06',
  FLASH_LITE = 'gemini-2.5-flash-lite-preview-06-17',
  FLASH = 'gemini-2.5-flash',
}

export enum OpenAIChatModel {
  GPT41 = 'gpt-4.1-2025-04-14',
}

export enum LlamaChatModel {
  SCOUT = 'meta-llama/llama-4-scout-17b-16e-instruct',
}

export type ChatModel =
  | OpenAIChatModel
  | ClaudeChatModel
  | GeminiChatModel
  | LlamaChatModel;

export function isOpenAIModel(model: ChatModel): model is OpenAIChatModel {
  return Object.values(OpenAIChatModel).includes(model as OpenAIChatModel);
}

export function isClaudeModel(model: ChatModel): model is ClaudeChatModel {
  return Object.values(ClaudeChatModel).includes(model as ClaudeChatModel);
}

export function isGeminiModel(model: ChatModel): model is GeminiChatModel {
  return Object.values(GeminiChatModel).includes(model as GeminiChatModel);
}

export function isLlamaModel(model: ChatModel): model is LlamaChatModel {
  return Object.values(LlamaChatModel).includes(model as LlamaChatModel);
}
