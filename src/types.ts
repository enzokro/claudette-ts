// types.ts
import Anthropic from '@anthropic-ai/sdk';
import { Client } from './client.js';

export type ModelType = 'opus' | 'sonnet' | 'haiku-3' | 'haiku-3-5';

export const MODEL_TYPES: Record<string, ModelType> = {
  'claude-3-opus-20240229': 'opus',
  'claude-3-5-sonnet-20241022': 'sonnet', 
  'claude-3-haiku-20240307': 'haiku-3',
  'claude-3-5-haiku-20241022': 'haiku-3-5'
};

export const PRICING: Record<ModelType, [number, number, number, number]> = {
  'opus': [15, 75, 18.75, 1.5],
  'sonnet': [3, 15, 3.75, 0.3],
  'haiku-3': [0.25, 1.25, 0.3, 0.03],
  'haiku-3-5': [1, 3, 1.25, 0.1]
};

export type Tool = Anthropic.Tool;
export type Message = Anthropic.Message;
export type MessageParam = Anthropic.MessageParam;

export interface ClientOptions {
  model: string;
  apiKey?: string;
  client?: Anthropic;
}

export interface ChatOptions {
  model: string;
  apiKey?: string;
  client?: Client;
  systemPrompt?: string;
  tools?: Anthropic.Tool[];
  temperature?: number;
}

export interface ToolLoopOptions {
  maxSteps?: number;
  traceFunc?: (messages: Message[]) => void;
  contFunc?: (message: Message) => boolean;
}

// Helper functions
export const findBlock = (response: Message, blockType?: 'text' | 'content' | 'tool' | 'usage'): Message['content'][number] | undefined => {
  if (!blockType) return response.content[0];
  return response.content.find(block => {
    if (blockType === 'text') return 'text' in block;
    if (blockType === 'content') return 'content' in block;
    if (blockType === 'tool') return 'source' in block;
    if (blockType === 'usage') return 'usage' in block;
    return false;
  });
};

export const contents = (response: Message): string => {
  const block = findBlock(response);
  if (!block) return '';
  
  if ('text' in block && typeof block.text === 'string') return block.text.trim();
  if ('content' in block && typeof block.content === 'string') return block.content.trim();
  if ('source' in block && 'type' in block) return `*Media Type - ${block.type}*`;
  
  return String(block);
};

export function calculateCost(usage: Anthropic.Message['usage'], costs: [number, number, number, number]): number {
  if (!usage) return 0;
  return (
    (usage.input_tokens * costs[0] + 
     usage.output_tokens * costs[1] + 
     (usage.cache_creation_input_tokens || 0) * costs[2] + 
     (usage.cache_read_input_tokens || 0) * costs[3]) / 1e6
  );
}