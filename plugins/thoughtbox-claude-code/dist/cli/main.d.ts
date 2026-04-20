type FetchLike = typeof fetch;
export interface CliRuntime {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    fetchImpl?: FetchLike;
    stdinText?: string;
    writeStdout?: (line: string) => void;
    writeStderr?: (line: string) => void;
}
export declare function runCli(argv: string[], runtime?: CliRuntime): Promise<number | null>;
export {};
