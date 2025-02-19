// chat.ts
import Anthropic from '@anthropic-ai/sdk';
import { Client } from './client.js';
import type { ChatOptions, ToolLoopOptions } from './types.js';

export class Chat {
  private client: Client;
  private history: Anthropic.MessageParam[] = [];
  private systemPrompt?: string;
  private tools?: Anthropic.Tool[];
  private toolImplementations: Map<string, Function> = new Map();
  private temperature: number;

  constructor({
    model,
    client,
    systemPrompt,
    tools,
    temperature = 0,
    ...options
  }: ChatOptions) {
    this.client = client ?? new Client({ model, ...options });
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.temperature = temperature;
  }

  registerTool(name: string, implementation: Function) {
    this.toolImplementations.set(name, implementation);
  }

  private async executeTool(toolUseBlock: Anthropic.ToolUseBlock): Promise<string> {
    const implementation = this.toolImplementations.get(toolUseBlock.name);
    if (!implementation) {
      throw new Error(`No implementation found for tool: ${toolUseBlock.name}`);
    }

    try {
      const result = await implementation(toolUseBlock.input);
      return String(result);
    } catch (error) {
      console.error(`Error executing tool ${toolUseBlock.name}:`, error);
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  get cost(): number {
    return this.client.cost;
  }

  async send(
    prompt?: string,
    options: Partial<Anthropic.MessageCreateParams> = {}
  ): Promise<Anthropic.Message> {
    if (prompt) {
      this.history.push({
        role: 'user',
        content: prompt
      });
    }

    const params: Anthropic.MessageCreateParams = {
      messages: this.history,
      model: this.client.model,
      max_tokens: options.max_tokens ?? 4096,
      temperature: options.temperature ?? this.temperature,
      ...options
    };

    if (this.systemPrompt) {
      params.system = this.systemPrompt;
    }

    if (this.tools?.length) {
      params.tools = this.tools;
    }

    const response = await this.client.createMessage(params);
    this.history.push({
      role: response.role,
      content: response.content
    });
    return response;
  }

  async toolloop(
    prompt?: string,
    {
      maxSteps = 10,
      traceFunc,
      contFunc = () => true,
      ...options
    }: ToolLoopOptions & Partial<Anthropic.MessageCreateParams> = {}
  ): Promise<Anthropic.Message> {
    const startHistoryLength = this.history.length;
    let response = await this.send(prompt, options);

    for (let i = 0; i < maxSteps; i++) {
      // Check if the response indicates tool use is needed
      const toolUseBlocks = response.content.filter(block => 
        'type' in block && block.type === 'tool_use'
      ) as Anthropic.ToolUseBlock[];
      
      if (!toolUseBlocks.length) break;

      if (traceFunc) {
        const messages = this.client.lastMessage ? [this.client.lastMessage] : [];
        traceFunc(messages);
      }

      // Check if we should continue based on the previous message
      const prevMessage = this.client.lastMessage;
      if (prevMessage && !contFunc(prevMessage)) break;

      // Execute tools and create tool results
      const toolResults = await Promise.all(toolUseBlocks.map(async block => ({
        type: 'tool_result' as const,
        tool_use_id: block.id,
        content: await this.executeTool(block)
      })));

      // Add tool results as a user message
      this.history.push({
        role: 'user',
        content: toolResults
      });

      response = await this.send(undefined, options);
    }

    if (traceFunc) {
      const messages = this.client.lastMessage ? [this.client.lastMessage] : [];
      traceFunc(messages);
    }

    return response;
  }

  toString(): string {
    const lastMessage = this.client.lastMessage;
    if (!lastMessage) return 'No messages yet';

    const text = lastMessage.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return `${text}\n\nCost: $${this.cost.toFixed(6)}`;
  }
}