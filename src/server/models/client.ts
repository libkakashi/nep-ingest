import type {z} from 'zod';
import jju from 'jju';

import {
  type CoreMessage,
  type ToolSet,
  type LanguageModelV1,
  generateText,
} from 'ai';

import {google} from '@ai-sdk/google';
import {openai} from '@ai-sdk/openai';
import {anthropic} from '@ai-sdk/anthropic';

import {
  type ChatModel,
  isClaudeModel,
  isGeminiModel,
  isLlamaModel,
  isOpenAIModel,
} from './models';
import {groq} from '@ai-sdk/groq';

const getModel = (modelName: ChatModel) => {
  if (isGeminiModel(modelName)) {
    return google(modelName);
  } else if (isClaudeModel(modelName)) {
    return anthropic(modelName);
  } else if (isOpenAIModel(modelName)) {
    return openai(modelName);
  } else if (isLlamaModel(modelName)) {
    return groq(modelName);
  }
  throw new Error('Invalid model');
};

class LLMClient {
  model: LanguageModelV1;
  #temp: number;
  #tools: ToolSet = {};

  constructor(model: ChatModel, temp?: number) {
    this.model = getModel(model);
    this.#temp = temp ?? 0.5;
  }

  addTools(tools: ToolSet) {
    this.#tools = tools;
  }

  async genText(messages: CoreMessage[] | string, temp?: number) {
    messages =
      typeof messages === 'string'
        ? [{role: 'user', content: messages}]
        : messages;

    const response = await generateText({
      model: this.model,
      messages,
      temperature: temp ?? this.#temp,
      maxTokens: 65536,
      tools: this.#tools,
      maxSteps: 100,
    });
    return response.text;
  }

  async genJson<T extends z.ZodType>(
    messages: CoreMessage[] | string,
    schema?: T,
    temp?: number,
  ): Promise<z.infer<T>> {
    messages =
      typeof messages === 'string'
        ? [{role: 'user', content: messages}]
        : messages;

    const {text} = await generateText({
      model: this.model,
      messages,
      temperature: temp ?? this.#temp,
      maxTokens: 32768,
      tools: this.#tools,
      maxSteps: 100,
    });
    const start = text.trim().indexOf('{');
    const end = text.trim().endsWith('```') ? -3 : text.length;

    const parsed: unknown = jju.parse(text.trim().slice(start, end));

    if (schema) {
      return schema.parse(parsed);
    }
    return parsed as z.infer<T>;
  }

  getTools() {
    return this.#tools;
  }
}

export default LLMClient;
