import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
    console.log('Connecting to Thoughtbox via Stdio...');

    // Connect to the compiled dist/index.js using the THOUGHTBOX_TRANSPORT=stdio env var
    const transport = new StdioClientTransport({
        command: 'node',
        args: [path.join(__dirname, '..', 'dist', 'index.js')],
        env: {
            ...process.env,
            THOUGHTBOX_TRANSPORT: 'stdio'
        }
    });

    const client = new Client({
        name: 'test-client',
        version: '1.0.0'
    }, {
        capabilities: {}
    });

    await client.connect(transport);
    console.log('Connected via Stdio.');

    try {
        console.log('\n--- Test 1: Cloning expressjs/express ---');
        const cloneResult = await client.callTool({
            name: 'thoughtbox_repo',
            arguments: {
                operation: 'clone',
                args: {
                    url: 'https://github.com/expressjs/express.git',
                    branch: 'master'
                }
            }
        });

        const parsedCloneResult = JSON.parse(cloneResult.content[0].text);
        const repoId = parsedCloneResult.repoId;
        console.log(`Success! Repo cloned into memory. ID: ${repoId}`);

        if (!repoId) {
            throw new Error('No repoId returned!');
        }

        console.log(`\n--- Test 2: Listing Directory ---`);
        const listResult = await client.callTool({
            name: 'thoughtbox_repo',
            arguments: {
                operation: 'list_directory',
                args: { repoId, path: '.' }
            }
        });
        console.log(listResult.content[0].text.substring(0, 300) + '...\n(truncated)');

        console.log(`\n--- Test 3: Reading index.js ---`);
        const readResult = await client.callTool({
            name: 'thoughtbox_repo',
            arguments: {
                operation: 'read_file',
                args: { repoId, path: 'index.js' }
            }
        });
        console.log(readResult.content[0].text.substring(0, 200) + '...\n(truncated)');

        console.log(`\n--- Test 4: Grep Searching for "express" ---`);
        const grepResult = await client.callTool({
            name: 'thoughtbox_repo',
            arguments: {
                operation: 'grep_search',
                args: { repoId, pattern: 'function createApplication' }
            }
        });
        console.log(grepResult.content[0].text.substring(0, 200) + '...');

        console.log(`\n--- Test 5: Path Traversal Protection ---`);
        try {
            await client.callTool({
                name: 'thoughtbox_repo',
                arguments: {
                    operation: 'read_file',
                    args: { repoId, path: '../../.env' }
                }
            });
            console.error('❌ FAILED: Path traversal succeeded (it should not have).');
        } catch (e: any) {
            console.log('✅ SUCCESS: Path traversal blocked as expected.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        process.exit(0);
    }
}

runTest();
