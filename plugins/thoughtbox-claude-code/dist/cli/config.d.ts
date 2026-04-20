export declare const DEFAULT_BASE_URL = "https://mcp.kastalienresearch.ai";
export declare const DEFAULT_SERVER_NAME = "thoughtbox";
type JsonObject = Record<string, unknown>;
export interface ThoughtboxConfigPaths {
    claudeDir: string;
    settingsLocalPath: string;
    gitignorePath: string;
}
export interface LocalThoughtboxConfig {
    settingsLocal: JsonObject;
    paths: ThoughtboxConfigPaths;
}
export declare function normalizeBaseUrl(baseUrl: string): string;
export declare function getThoughtboxConfigPaths(cwd: string): ThoughtboxConfigPaths;
export declare function loadLocalThoughtboxConfig(cwd: string): Promise<LocalThoughtboxConfig>;
export declare function saveLocalThoughtboxConfig(config: LocalThoughtboxConfig): Promise<void>;
export declare function mergeThoughtboxInitConfig(input: {
    settingsLocal: JsonObject;
    baseUrl: string;
    apiKey: string;
}): {
    settingsLocal: JsonObject;
};
export declare function warnIfClaudeDirNotGitignored(cwd: string): Promise<string | null>;
export declare function findThoughtboxMcpUrl(settingsLocal: JsonObject): string | null;
export declare function findOtelEndpoint(settingsLocal: JsonObject): string | null;
export declare function extractApiKeyFromLocalConfig(settingsLocal: JsonObject): string | null;
export declare function hasRequiredOtelConfig(settingsLocal: JsonObject): boolean;
export {};
