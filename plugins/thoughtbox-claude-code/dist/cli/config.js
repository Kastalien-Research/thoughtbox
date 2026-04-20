import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
export const DEFAULT_BASE_URL = 'https://mcp.kastalienresearch.ai';
export const DEFAULT_SERVER_NAME = 'thoughtbox';
function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function ensureObject(value, fieldName) {
    if (value === undefined)
        return {};
    if (!isPlainObject(value)) {
        throw new Error(`${fieldName} must be an object to merge safely`);
    }
    return { ...value };
}
function ensureArray(value, fieldName) {
    if (value === undefined)
        return [];
    if (!Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array to merge safely`);
    }
    return [...value];
}
async function readJsonObject(filePath) {
    try {
        const raw = await readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!isPlainObject(parsed)) {
            throw new Error(`${filePath} must contain a JSON object`);
        }
        return parsed;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}
async function writeJsonObject(filePath, value) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
export function normalizeBaseUrl(baseUrl) {
    return baseUrl.replace(/\/+$/, '');
}
export function getThoughtboxConfigPaths(cwd) {
    const claudeDir = path.join(cwd, '.claude');
    return {
        claudeDir,
        settingsLocalPath: path.join(claudeDir, 'settings.local.json'),
        gitignorePath: path.join(cwd, '.gitignore'),
    };
}
export async function loadLocalThoughtboxConfig(cwd) {
    const paths = getThoughtboxConfigPaths(cwd);
    return {
        settingsLocal: await readJsonObject(paths.settingsLocalPath),
        paths,
    };
}
export async function saveLocalThoughtboxConfig(config) {
    await writeJsonObject(config.paths.settingsLocalPath, config.settingsLocal);
}
export function mergeThoughtboxInitConfig(input) {
    const baseUrl = normalizeBaseUrl(input.baseUrl);
    const settingsLocal = { ...input.settingsLocal };
    const mcpServers = ensureObject(settingsLocal.mcpServers, 'mcpServers');
    mcpServers[DEFAULT_SERVER_NAME] = {
        type: 'http',
        url: `${baseUrl}/mcp?key=${input.apiKey}`,
    };
    settingsLocal.mcpServers = mcpServers;
    const env = ensureObject(settingsLocal.env, 'env');
    env.OTEL_EXPORTER_OTLP_PROTOCOL = 'http/json';
    env.OTEL_EXPORTER_OTLP_ENDPOINT = baseUrl;
    env.OTEL_EXPORTER_OTLP_HEADERS = `Authorization=Bearer ${input.apiKey}`;
    env.OTEL_METRICS_EXPORTER = 'otlp';
    env.OTEL_LOGS_EXPORTER = 'otlp';
    settingsLocal.env = env;
    return { settingsLocal };
}
export async function warnIfClaudeDirNotGitignored(cwd) {
    const gitignorePath = path.join(cwd, '.gitignore');
    try {
        const raw = await readFile(gitignorePath, 'utf8');
        const ignored = raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && !line.startsWith('#'));
        const hasClaudeIgnore = ignored.some((line) => {
            return line === '.claude'
                || line === '.claude/'
                || line === '/.claude'
                || line === '/.claude/';
        });
        return hasClaudeIgnore
            ? null
            : 'warning: .claude/ is not gitignored in this repository';
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return 'warning: .gitignore does not exist, so .claude/ is not ignored';
        }
        throw error;
    }
}
export function findThoughtboxMcpUrl(settingsLocal) {
    const mcpServers = ensureObject(settingsLocal.mcpServers, 'mcpServers');
    const server = mcpServers[DEFAULT_SERVER_NAME];
    if (!isPlainObject(server))
        return null;
    const url = server.url;
    return typeof url === 'string' ? url : null;
}
export function findOtelEndpoint(settingsLocal) {
    const env = ensureObject(settingsLocal.env, 'env');
    const endpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT;
    return typeof endpoint === 'string' ? endpoint : null;
}
export function extractApiKeyFromLocalConfig(settingsLocal) {
    const env = ensureObject(settingsLocal.env, 'env');
    const headers = env.OTEL_EXPORTER_OTLP_HEADERS;
    if (typeof headers === 'string') {
        const match = headers.match(/Authorization=Bearer\s+([^,\s]+)/);
        if (match?.[1])
            return match[1];
    }
    const mcpUrl = findThoughtboxMcpUrl(settingsLocal);
    if (!mcpUrl)
        return null;
    try {
        const url = new URL(mcpUrl);
        return url.searchParams.get('key');
    }
    catch {
        return null;
    }
}
export function hasRequiredOtelConfig(settingsLocal) {
    const env = ensureObject(settingsLocal.env, 'env');
    return typeof env.OTEL_EXPORTER_OTLP_ENDPOINT === 'string'
        && typeof env.OTEL_EXPORTER_OTLP_HEADERS === 'string'
        && env.OTEL_EXPORTER_OTLP_PROTOCOL === 'http/json'
        && env.OTEL_METRICS_EXPORTER === 'otlp'
        && env.OTEL_LOGS_EXPORTER === 'otlp';
}
