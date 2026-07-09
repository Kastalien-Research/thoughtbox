import process from 'node:process';
import { DEFAULT_BASE_URL, loadLocalThoughtboxConfig, mergeThoughtboxInitConfig, saveLocalThoughtboxConfig, warnIfClaudeDirNotGitignored, } from './config.js';
import { runHookCommand } from './hooks.js';
function createDefaultWriter(stream) {
    return (line) => {
        stream.write(`${line}\n`);
    };
}
function flagValue(args, flag) {
    const index = args.indexOf(flag);
    if (index === -1)
        return undefined;
    return args[index + 1];
}
function printHelp(writeStdout) {
    writeStdout('thoughtbox init --key <api_key>');
    writeStdout('thoughtbox hook <capture-user-turn|surface-decisions|promote-to-decision|audit-response>');
    writeStdout('  (drift-prevention hooks; read a Claude Code hook payload from stdin)');
}
async function handleInit(args, runtime) {
    const apiKey = flagValue(args, '--key');
    if (!apiKey) {
        runtime.writeStderr('error: thoughtbox init requires --key <api_key>');
        return 1;
    }
    const baseUrl = DEFAULT_BASE_URL;
    const config = await loadLocalThoughtboxConfig(runtime.cwd);
    const merged = mergeThoughtboxInitConfig({
        settingsLocal: config.settingsLocal,
        baseUrl,
        apiKey,
    });
    config.settingsLocal = merged.settingsLocal;
    await saveLocalThoughtboxConfig(config);
    const gitignoreWarning = await warnIfClaudeDirNotGitignored(runtime.cwd);
    runtime.writeStdout('configured local Thoughtbox settings');
    runtime.writeStdout(`mcp: ${baseUrl}/mcp?key=...`);
    runtime.writeStdout(`otel: ${baseUrl}/v1/logs`);
    if (gitignoreWarning) {
        runtime.writeStderr(gitignoreWarning);
    }
    runtime.writeStdout('next: restart your Claude Code session to load the Thoughtbox MCP server');
    return 0;
}
export async function runCli(argv, runtime = {}) {
    const command = argv[0];
    const writeStdout = runtime.writeStdout ?? createDefaultWriter(process.stdout);
    const writeStderr = runtime.writeStderr ?? createDefaultWriter(process.stderr);
    if (!command)
        return null;
    if (command === '--help' || command === '-h' || command === 'help') {
        printHelp(writeStdout);
        return 0;
    }
    const shared = {
        cwd: runtime.cwd ?? process.cwd(),
        env: runtime.env ?? process.env,
        fetchImpl: runtime.fetchImpl ?? fetch,
        writeStdout,
        writeStderr,
    };
    switch (command) {
        case 'init':
            return handleInit(argv.slice(1), shared);
        case 'hook':
            return runHookCommand(argv.slice(1), {
                ...shared,
                ...(runtime.stdinText !== undefined
                    ? { stdinText: runtime.stdinText }
                    : {}),
            });
        default:
            writeStderr(`error: unknown command "${command}"`);
            printHelp(writeStdout);
            return 1;
    }
}
