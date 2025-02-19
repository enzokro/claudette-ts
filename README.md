# claudette-ts

A TypeScript wrapper for Anthropic's Node.js SDK that makes Claude API interactions simpler and more ergonomic.

## Features

- Stateful chat interface with history tracking
- Automatic token usage and cost calculation
- Streaming support
- Simple tool use integration
- Environment variable configuration

## Installation

```bash
npm install claudette-ts
```

You'll need to set the `ANTHROPIC_API_KEY` environment variable to your Anthropic API key.

## Getting Started

```typescript
import { Chat } from 'claudette-ts';

// Basic usage
const chat = new Chat({ 
  model: 'claude-3-opus-20240229',
  systemPrompt: 'You are a helpful assistant.'
});

// Send a message
const response = await chat.send('Hello, how are you?');
console.log(response);

// With streaming
const streamingResponse = await chat.send('Tell me a story', { stream: true });
console.log(streamingResponse);
```

## Tool Use

Claudette-ts makes it easy to use Claude's function calling capabilities:

```typescript
const options = [
  "Option 1",
  "Option 2",
  "Option 3"
];

function list_options() {
  console.log("Calling list_options");
  options.forEach(option => {
    console.log(option);
  });
}

// With tools
const chatWithTools = new Chat({
  model: 'claude-3-opus-20240229',
  tools: [list_options],
  systemPrompt: 'You are a helpful assistant with tools, show me the options.'
});

const toolResponse = await chatWithTools.send('Show me the available options', {
  tool_choice: { type: 'any' }
});
console.log(toolResponse);
```

## Cost Tracking

The Chat class automatically tracks token usage and calculates costs based on the current model's pricing:

```typescript
console.log(chat.cost); // Shows current cost in USD
```

## Environment Variables

Create a `.env` file in your project root:

```
ANTHROPIC_API_KEY=your-api-key-here
```

## Supported Models

- claude-3-opus-20240229
- claude-3-5-sonnet-20241022
- claude-3-haiku-20240307
- claude-3-5-haiku-20241022

## License

MIT
