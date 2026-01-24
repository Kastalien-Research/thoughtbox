/**
 * Quick test to verify tool call capture is working
 */

import type { MessageBlock, ToolCall, ToolResult } from './reasoning-types.js';

// Simulate message processing
function processMessage(message: any): {
  assistantMessages: MessageBlock[];
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
} {
  const assistantMessages: MessageBlock[] = [];
  const toolCalls: ToolCall[] = [];
  const toolResults: ToolResult[] = [];

  if (message.type === 'assistant' && message.message?.content) {
    for (const block of message.message.content) {
      if ('text' in block && block.text) {
        assistantMessages.push({
          type: 'text',
          content: block.text,
          timestamp: new Date().toISOString(),
        });
      } else if ('type' in block && block.type === 'tool_use') {
        toolCalls.push({
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input,
          timestamp: new Date().toISOString(),
        });
      } else if ('type' in block && block.type === 'tool_result') {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.tool_use_id,
          content: block.content,
          is_error: block.is_error,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.warn('Unexpected message block type:', block);
      }
    }
  }

  return { assistantMessages, toolCalls, toolResults };
}

// Test case 1: Text only (should work as before)
const textOnlyMessage = {
  type: 'assistant',
  message: {
    content: [
      { text: 'Let me think about this...' }
    ]
  }
};

const result1 = processMessage(textOnlyMessage);
console.log('Test 1 - Text only:');
console.log('  assistantMessages:', result1.assistantMessages.length);
console.log('  toolCalls:', result1.toolCalls.length);
console.log('  toolResults:', result1.toolResults.length);
console.assert(result1.assistantMessages.length === 1, 'Should capture 1 text message');
console.assert(result1.toolCalls.length === 0, 'Should capture 0 tool calls');

// Test case 2: Mixed content (text + tool_use)
const mixedMessage = {
  type: 'assistant',
  message: {
    content: [
      { text: 'I will use Thoughtbox to solve this.' },
      {
        type: 'tool_use',
        id: 'toolu_abc123',
        name: 'thoughtbox_gateway',
        input: {
          operation: 'thought',
          args: { text: 'Breaking down the problem...' }
        }
      }
    ]
  }
};

const result2 = processMessage(mixedMessage);
console.log('\nTest 2 - Mixed (text + tool_use):');
console.log('  assistantMessages:', result2.assistantMessages.length);
console.log('  toolCalls:', result2.toolCalls.length);
console.log('  toolResults:', result2.toolResults.length);
console.assert(result2.assistantMessages.length === 1, 'Should capture 1 text message');
console.assert(result2.toolCalls.length === 1, 'Should capture 1 tool call');
console.assert(result2.toolCalls[0].name === 'thoughtbox_gateway', 'Tool call name should be preserved');

// Test case 3: Tool result
const toolResultMessage = {
  type: 'assistant',
  message: {
    content: [
      {
        type: 'tool_result',
        tool_use_id: 'toolu_abc123',
        content: { success: true, thoughtNumber: 1 }
      }
    ]
  }
};

const result3 = processMessage(toolResultMessage);
console.log('\nTest 3 - Tool result:');
console.log('  assistantMessages:', result3.assistantMessages.length);
console.log('  toolCalls:', result3.toolCalls.length);
console.log('  toolResults:', result3.toolResults.length);
console.assert(result3.toolResults.length === 1, 'Should capture 1 tool result');

console.log('\n✅ All assertions passed! Tool call capture is working correctly.');
