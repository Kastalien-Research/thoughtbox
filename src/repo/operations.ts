import { z } from 'zod';

/**
 * Defines the schema for the `thoughtbox_repo` MCP tool.
 * Provides operations to interact with the ephemeral cloned source code.
 */
export const repoToolInputSchema = {
    operation: z.enum([
        'clone',
        'read_file',
        'list_directory',
        'grep_search',
    ]),
    args: z.record(z.string(), z.unknown()).optional(),
};

export type RepoToolInput = z.infer<z.ZodObject<typeof repoToolInputSchema>>;

// Operation specific schemas
export const CloneArgsSchema = z.object({
    url: z.string().describe("The HTTPS git URL to clone. Include Personal Access Tokens inline if private (https://user:token@github.com/org/repo)."),
    branch: z.string().optional().describe("Branch name to clone explicitly (defaults to repo default, usually 'main')."),
});

export const ReadFileArgsSchema = z.object({
    repoId: z.string().describe("The ID of the cloned repository returned by the 'clone' operation."),
    path: z.string().describe("Relative path to the file inside the repo to read."),
});

export const ListDirectoryArgsSchema = z.object({
    repoId: z.string().describe("The ID of the cloned repository returned by the 'clone' operation."),
    path: z.string().default('.').describe("Relative path to the directory to list (e.g. '.', 'src/')."),
});

export const GrepSearchArgsSchema = z.object({
    repoId: z.string().describe("The ID of the cloned repository returned by the 'clone' operation."),
    pattern: z.string().describe("The regex pattern to search for (using egrep syntax)."),
    path: z.string().default('.').describe("Relative path to limit search (defaults to root '.')"),
    ignoreCase: z.boolean().default(true).describe("Whether to ignore case"),
});
