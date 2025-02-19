# claudette-ts

Inspired by the claudette library from Answer.ai. A TypeScript library for using Anthropic models with tool-loop support.

## Installation

```bash
npm install claudette-ts
```

## Quick Start

```typescript
import { Chat } from 'claudette-ts';

// Basic chat without tools
const chat = new Chat({ 
  model: 'claude-3-haiku-20240307',
  systemPrompt: 'You are a helpful assistant.'
});

// Send a simple message
const response = await chat.send('Hello, how are you?');
console.log(response);

// Check the cost
console.log(`Cost so far: $${chat.cost}`);
```

## Tool Usage

```typescript
import { Chat, Tool } from 'claudette-ts';

// Define your tool
const listOptionsTool: Tool = {
  name: 'list_options',
  description: 'Lists all available options.',
  input_schema: {
    type: 'object',
    properties: {},
    required: []
  }
};

// Create a chat with tools
const chatWithTools = new Chat({
  model: 'claude-3-opus-20240229',
  tools: [listOptionsTool],
  systemPrompt: 'You are a helpful assistant with tools.'
});

// Implement the tool
function list_options(input: any) {
  const options = ["Option 1", "Option 2", "Option 3"];
  return options.join('\n');
}

// Register the tool implementation
chatWithTools.registerTool('list_options', list_options);

// Use toolloop for multi-step tool interactions
const response = await chatWithTools.toolloop(
  'What options are available? After listing them, tell me which one you like best.',
  {
    traceFunc: (messages) => {
      console.log('Tool interaction:', messages);
    }
  }
);
```

## Other Features

### Streaming Requests

```typescript
const response = await chat.send('Tell me a story', { 
  stream: true 
});
```

### Prompt Caching

```typescript
const chat = new Chat({ 
  model: 'claude-3-opus-20240229',
  cache: true  // Enable prompt caching
});
```

### Custom Tool Implementation

```typescript
// Define the tool implementation function
function sum(input: { a: number, b: number }) {
  console.log("Calling sum with input:", input);
  return input.a + input.b;
}

// Define the tool schema
const sumTool: Tool = {
  name: 'sum',
  description: 'Adds two numbers together. Use this tool when the user wants to add two numbers.',
  input_schema: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['a', 'b']
  }
};

// Create a chat instance with the tool
const chatWithTools = new Chat({
  model: 'claude-3-opus-20240229',
  tools: [sumTool],
  systemPrompt: 'You are a helpful assistant with tools. When asked to add numbers, use the sum tool.'
});

// Register the tool implementation
chatWithTools.registerTool('sum', sum);

// Example usage with toolloop and tracing
const response = await chatWithTools.toolloop(
  'What is 11 plus 5 plus 7?',
  {
    traceFunc: (messages) => {
      console.log('Tool interaction:', messages);
    }
  }
);

console.log('\nFinal response:', response);
console.log('Tool chat cost:', chatWithTools.cost);
```

### Cost Tracking

```typescript
// Track costs across conversations
console.log(`Current conversation cost: $${chat.cost}`);

// Get detailed usage information
console.log(chat.toString());
```

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## License

MIT
