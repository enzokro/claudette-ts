import { Chat } from '../chat.js';
import type { Tool } from '../types.js';

async function sample_usage() {
  // Simple usage
  const chat = new Chat({ 
    model: 'claude-3-opus-20240229',
    systemPrompt: 'You are a helpful assistant.'
  });

  // Send a message
  const response = await chat.send('Hello, how are you?');
  console.log('Basic chat response:', response);
  console.log('Chat history cost:', chat.cost);

  // With tools
  const options = [
    "Option 1",
    "Option 2",
    "Option 3"
  ];

  function list_options(input: any) {
    console.log("Calling list_options with input:", input);
    return options.join('\n');
  }

  const listOptionsTool: Tool = {
    name: 'list_options',
    description: 'Lists all available options. Use this tool when the user asks about what options are available or wants to see the list of options.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  };

  const chatWithTools = new Chat({
    model: 'claude-3-opus-20240229',
    tools: [listOptionsTool],
    systemPrompt: 'You are a helpful assistant with tools. When asked about options, use the list_options tool to show them.'
  });

  // Register the tool implementation
  chatWithTools.registerTool('list_options', list_options);

  // Example of using toolloop with tracing
  console.log('\nTesting toolloop functionality:');
  const toolLoopResponse = await chatWithTools.toolloop(
    'What options are available? After listing them, tell me which one you like best.',
    {
      traceFunc: (messages) => {
        console.log('Tool interaction step:', 
          messages.map(m => m.content.map(c => 
            'text' in c ? c.text : JSON.stringify(c)
          ).join('\n'))
        );
      }
    }
  );
  
  console.log('\nToolloop final response:', toolLoopResponse);
  console.log('Tool chat final cost:', chatWithTools.cost);
}

sample_usage().catch(console.error);