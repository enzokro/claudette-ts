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

## Advanced Features

### Streaming Support

```typescript
const response = await chat.send('Tell me a story', { 
  stream: true 
});
```

### Cache Support

```typescript
const chat = new Chat({ 
  model: 'claude-3-opus-20240229',
  cache: true  // Enable conversation caching
});
```

### Custom Tool Implementation

```typescript
interface Calculator {
  add(a: number, b: number): number;
}

const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Performs calculations',
  input_schema: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['a', 'b']
  }
};

const calculator: Calculator = {
  add(a: number, b: number) {
    return a + b;
  }
};

chat.registerTool('calculator', calculator.add.bind(calculator));
```

### Cost Tracking

```typescript
// Track costs across conversations
console.log(`Current conversation cost: $${chat.cost}`);

// Get detailed usage information
console.log(chat.toString());
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
