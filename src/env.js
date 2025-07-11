import {createEnv} from '@t3-oss/env-nextjs';
import {z} from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']),
    SHOPIFY_ACCESS_TOKEN: z.string(),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
  },

  client: {},

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
    SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
