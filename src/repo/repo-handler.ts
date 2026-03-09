import * as fs from 'node:fs';
import { execSync } from 'node:child_process';
import {
    cloneRepository,
    getRepository,
    resolveSafePath
} from './git-manager.js';
import {
    CloneArgsSchema,
    ReadFileArgsSchema,
    ListDirectoryArgsSchema,
    GrepSearchArgsSchema,
} from './operations.js';

export class RepoHandler {

    async handle(args: { operation: string; args?: Record<string, unknown> }): Promise<{
        content: Array<{ type: 'text'; text: string }>;
        isError?: boolean;
    }> {
        try {
            switch (args.operation) {
                case 'clone':
                    return await this.handleClone(args.args);
                case 'read_file':
                    return await this.handleReadFile(args.args);
                case 'list_directory':
                    return await this.handleListDirectory(args.args);
                case 'grep_search':
                    return await this.handleGrepSearch(args.args);
                default:
                    return {
                        content: [{ type: 'text', text: `Unknown operation: ${args.operation}` }],
                        isError: true,
                    };
            }
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
    }

    private async handleClone(args?: Record<string, unknown>) {
        const data = CloneArgsSchema.parse(args || {});
        console.error(`[RepoHandler] Initiating clone for ${data.url}`);

        const repo = await cloneRepository(data.url, data.branch);

        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify({
                    repoId: repo.id,
                    message: `Repository cloned into memory successfully. Use this repoId for subsequent file operations.`,
                    branch: repo.branch,
                    url: repo.url.replace(/:[^:@]+@github/g, ':***@github'), // Scrub token in response
                }, null, 2)
            }]
        };
    }

    private async handleReadFile(args?: Record<string, unknown>) {
        const data = ReadFileArgsSchema.parse(args || {});
        const targetPath = resolveSafePath(data.repoId, data.path);

        if (!fs.existsSync(targetPath)) {
            throw new Error(`File not found: ${data.path}`);
        }

        const stat = fs.statSync(targetPath);
        if (!stat.isFile()) {
            throw new Error(`${data.path} is not a file.`);
        }

        // Limit read size to prevent crashing the response (e.g. 1MB max)
        if (stat.size > 1024 * 1024) {
            throw new Error(`File too large (${stat.size} bytes). Maximum size is 1MB.`);
        }

        const fileContent = fs.readFileSync(targetPath, 'utf-8');

        return {
            content: [{
                type: 'text' as const,
                text: fileContent
            }]
        };
    }

    private async handleListDirectory(args?: Record<string, unknown>) {
        const data = ListDirectoryArgsSchema.parse(args || {});
        const repo = getRepository(data.repoId);

        if (!repo) {
            throw new Error(`Invalid or expired repoId: ${data.repoId}`);
        }

        const targetPath = resolveSafePath(data.repoId, data.path);

        // We use standard find/ls to list up to a certain depth for visibility 
        // instead of a simple fs.readdir to see the project shape better.
        try {
            const output = execSync(`find . -maxdepth 2 -not -path '*/.git/*' | sort`, {
                cwd: targetPath,
                encoding: 'utf-8',
                timeout: 5000
            });

            return {
                content: [{
                    type: 'text' as const,
                    text: `Directory Listing for ${data.path}:\n${output}`
                }]
            };
        } catch (e: any) {
            // Fallback to basic fs readdir if find fails
            const items = fs.readdirSync(targetPath);
            return {
                content: [{
                    type: 'text' as const,
                    text: `Directory Listing for ${data.path}:\n` + items.join('\n')
                }]
            };
        }
    }

    private async handleGrepSearch(args?: Record<string, unknown>) {
        const data = GrepSearchArgsSchema.parse(args || {});
        const repo = getRepository(data.repoId);

        if (!repo) {
            throw new Error(`Invalid or expired repoId: ${data.repoId}`);
        }

        const searchRoot = resolveSafePath(data.repoId, data.path);

        try {
            // Use egrep (grep -E) format.
            const flags = `-rnE ${data.ignoreCase ? '-i' : ''}`;
            const excludeFlag = `--exclude-dir=.git`; // skip the massive .git folder

            const cmd = `grep ${flags} ${excludeFlag} "${data.pattern}" .`;

            console.error(`[RepoHandler] Executing: ${cmd} in ${searchRoot}`);

            const output = execSync(cmd, {
                cwd: searchRoot,
                encoding: 'utf-8',
                // Allow failure to just return empty string instead of throw 
                stdio: ['pipe', 'pipe', 'ignore'],
                timeout: 10000
            });

            return {
                content: [{
                    type: 'text' as const,
                    text: output || 'No matches found.'
                }]
            };
        } catch (e: any) {
            if (e.status === 1) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: 'No matches found.'
                    }]
                };
            }
            throw new Error(`Grep search failed: ${e.message}`);
        }
    }
}
