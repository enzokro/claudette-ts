// client.ts
import Anthropic from '@anthropic-ai/sdk';
import type { ClientOptions } from './types.js';
import { MODEL_TYPES, PRICING, calculateCost } from './types.js';

import dotenv from 'dotenv'; 
dotenv.config();  // Load environment variables from .env file

export class Client {
  private anthropic: Anthropic;
  private _model: string;
  private _lastMessage?: Anthropic.Message;
  private _usage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };

  constructor({ model, apiKey, client }: ClientOptions) {
    this._model = model;
    this.anthropic = client || new Anthropic({ apiKey });
  }

  get model(): string {
    return this._model;
  }

  get lastMessage(): Anthropic.Message | undefined {
    return this._lastMessage;
  }

  get cost(): number {
    const modelType = MODEL_TYPES[this._model];
    return calculateCost(this._usage, PRICING[modelType]);
  }

  private updateUsage(message: Anthropic.Message) {
    if (!message.usage) return;
    this._usage.input_tokens += message.usage.input_tokens;
    this._usage.output_tokens += message.usage.output_tokens;
    if (message.usage.cache_creation_input_tokens) {
      this._usage.cache_creation_input_tokens += message.usage.cache_creation_input_tokens;
    }
    if (message.usage.cache_read_input_tokens) {
      this._usage.cache_read_input_tokens += message.usage.cache_read_input_tokens;
    }
  }

  async createMessage(params: Anthropic.MessageCreateParams): Promise<Anthropic.Message> {
    if (params.stream) {
      const stream = await this.anthropic.messages.stream(params);
      const message = await stream.finalMessage();
      this._lastMessage = message;
      this.updateUsage(message);
      return message;
    }

    const message = await this.anthropic.messages.create(params);
    this._lastMessage = message;
    this.updateUsage(message);
    return message;
  }

  toString(): string {
    if (!this._lastMessage) return 'No results yet';
    
    const usage = this._usage;
    
    return `Usage: Input tokens: ${usage.input_tokens}, Output tokens: ${usage.output_tokens}, Cost: $${this.cost.toFixed(6)}`;
  }
}