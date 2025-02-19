// chat.ts
import type { Message, MessageCreateParams, ContentBlock } from '@anthropic-ai/sdk/resources/messages';
import { Client } from './client';
import { ChatOptions, contents } from './types'

type Role = 'user' | 'assistant';

export class Chat {
  private client: Client;
  private history: Message[] = [];
  private systemPrompt: string;
  private tools?: any[];
  private temperature: number;
  private continuePrompt?: string;
  private cache: boolean;

  constructor({
    model,
    client,
    systemPrompt = '',
    tools = [],
    temperature = 0,
    continuePrompt,
    cache = false
  }: ChatOptions) {
    this.client = client || new Client({ model, cache });
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.temperature = temperature;
    this.continuePrompt = continuePrompt;
    this.cache = cache;
  }

  get cost(): number {
    return this.client.cost;
  }

  private async appendPrompt(prompt?: string) {
    const prevRole = this.history.length ? 
      this.history[this.history.length - 1].role as Role : 
      'assistant';

    if (prompt && prevRole === 'user') {
      await this.send();
    }

    if (prompt === undefined && prevRole === 'assistant') {
      if (!this.continuePrompt) {
        throw new Error('Prompt must be given after assistant completion, or use continuePrompt');
      }
      prompt = this.continuePrompt;
    }

    if (prompt) {
      // Create a partial message - the API will fill in the rest
      const message = {
        role: 'user',
        content: [{
          type: 'text',
          text: prompt
        }] as ContentBlock[]
      };
      this.history.push(message as unknown as Message);
    }
  }

  async send(
    prompt?: string,
    {
      temperature,
      max_tokens = 4096,
      stream = false,
      tool_choice,
      ...other
    }: Partial<MessageCreateParams> = {}
  ): Promise<Message> {
    await this.appendPrompt(prompt);

    const params: MessageCreateParams = {
      messages: this.history,
      model: this.client.model,
      max_tokens,
      system: this.systemPrompt,
      temperature: temperature ?? this.temperature,
      stream,
      ...other
    };

    if (this.tools?.length) {
      params.tools = this.tools;
    }

    if (tool_choice) {
      params.tool_choice = tool_choice;
    }

    const response = await this.client.createMessage(params);
    this.history.push(response);
    return response;
  }

  toString(): string {
    const result = this.client.result;
    if (!result) return 'No results yet';

    const lastMessage = contents(result);
    const history = this.history
      .map(m => `**${m.role}**: ${contents(m)}`)
      .join('\n\n');

    return `${lastMessage}\n\nHistory:\n${history}\n\nCost: $${this.cost.toFixed(6)}`;
  }
}