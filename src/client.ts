// client.ts
import { Anthropic } from '@anthropic-ai/sdk';
import type { Message, MessageCreateParams } from '@anthropic-ai/sdk/resources/messages/index.js';
import { ClientOptions, MODEL_TYPES, PRICING, calculateCost, contents, findBlock } from './types.js';

import dotenv from 'dotenv'; 
dotenv.config();  // Load environment variables from .env file

export class Client {
  private _model: string;
  private client: Anthropic;
  private usage: any = { input_tokens: 0, output_tokens: 0 };
  private log: any[] | null;
  private cache: boolean;
  private _result?: Message;

  constructor({ model, client, log = false, cache = false }: ClientOptions) {
    this._model = model;
    this.client = client || new Anthropic({
      defaultHeaders: { 'anthropic-beta': 'prompt-caching-2024-07-31' }
    });
    this.log = log ? [] : null;
    this.cache = cache;
  }

  get model(): string {
    return this._model;
  }

  get result(): Message | undefined {
    return this._result;
  }

  private updateUsage(response: Message) {
    if (response.usage) {
      this.usage.input_tokens += response.usage.input_tokens;
      this.usage.output_tokens += response.usage.output_tokens;
      if (response.usage.cache_creation_input_tokens) {
        this.usage.cache_creation_input_tokens = (this.usage.cache_creation_input_tokens || 0) + 
          response.usage.cache_creation_input_tokens;
      }
      if (response.usage.cache_read_input_tokens) {
        this.usage.cache_read_input_tokens = (this.usage.cache_read_input_tokens || 0) + 
          response.usage.cache_read_input_tokens;
      }
    }
  }

  get cost(): number {
    const modelType = MODEL_TYPES[this._model];
    return calculateCost(this.usage, PRICING[modelType]);
  }

  async createMessage(params: MessageCreateParams): Promise<Message> {
    // Handle streaming
    if (params.stream) {
      const stream = await this.client.messages.stream(params);
      let finalMessage: Message;
      
      for await (const message of stream) {
        if (message.type === 'message_start') {
          // Handle start
        } else if (message.type === 'content_block_start') {
          // Handle block start
        } else if (message.type === 'content_block_delta') {
          // Handle content delta
        } else if (message.type === 'message_delta') {
          // Handle message delta
        } else if (message.type === 'message_stop') {
          finalMessage = await stream.finalMessage();
        }
      }

      this._result = finalMessage!;
      this.updateUsage(finalMessage!);
      return finalMessage!;
    }

    // Non-streaming case
    const response = await this.client.messages.create(params);
    this._result = response;
    this.updateUsage(response);
    
    if (this.log) {
      this.log.push({
        params,
        result: response,
        usage: this.usage
      });
    }

    return response;
  }

  toString(): string {
    if (!this._result) return 'No results yet';
    
    const lastMessage = contents(this._result);
    const usage = this.usage;
    
    return `${lastMessage}\n\nUsage: Input tokens: ${usage.input_tokens}, Output tokens: ${usage.output_tokens}, Cost: $${this.cost.toFixed(6)}`;
  }
}