require('dotenv').config();

console.log('Environment Variables Check:');
console.log('============================');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✓ SET (length: ' + process.env.ANTHROPIC_API_KEY.length + ')' : '✗ NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ SET (length: ' + process.env.OPENAI_API_KEY.length + ')' : '✗ NOT SET');
console.log('AGENTOPS_LLM_PROVIDER:', process.env.AGENTOPS_LLM_PROVIDER || '✗ NOT SET');
console.log('AGENTOPS_LLM_MODEL:', process.env.AGENTOPS_LLM_MODEL || '✗ NOT SET');
console.log('LANGSMITH_API_KEY:', process.env.LANGSMITH_API_KEY ? '✓ SET (optional)' : '✗ NOT SET (optional)');
