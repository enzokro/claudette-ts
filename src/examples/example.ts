import { Chat } from '../chat.js';

async function sample_usage() {
  // Simple usage
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

  const options = [
    "Option 1",
    "Option 2",
    "Option 3"
  ]

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

  const toolResponse = await chatWithTools.send('Use the calculator tool', {
    tool_choice: { type: 'any' }
  });
  console.log(toolResponse);
}

sample_usage();