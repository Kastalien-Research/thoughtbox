export interface HookCommand {
  type: "command";
  command: string;
}

export interface HookEntry {
  matcher: string;
  hooks: HookCommand[];
}

export interface Settings {
  hooks?: {
    PostToolUse?: HookEntry[];
    [key: string]: unknown;
  };
  env?: Record<string, string>;
  [key: string]: unknown;
}
