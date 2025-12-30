/**
 * Thick Read Tool - Grothendieck's "Schemes & Nilpotents" for Code Comprehension
 *
 * Reads files with their git context (history, blame, commit messages).
 * The file content is the "geometric point"; the git context is the "nilpotent fuzz"
 * that explains WHY the code exists.
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

// Types

export type ThickReadDepth = "shallow" | "standard" | "deep";

export interface LineRange {
  start: number; // 1-indexed
  end: number; // 1-indexed, inclusive
}

export interface Commit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  ticketRefs?: string[];
}

export interface BlameLine {
  lineNumber: number;
  commit: string;
  author: string;
  date: string;
  content: string;
}

export interface BlameSummary {
  authorCount: number;
  oldestLine: { date: string; commit: string };
  newestLine: { date: string; commit: string };
  topAuthors: Array<{ author: string; lineCount: number; percentage: number }>;
}

export interface ThickReadResult {
  // Core content
  path: string;
  content: string;
  lineCount: number;

  // Git availability
  isGitRepo: boolean;
  gitWarning?: string;

  // Commit history (nilpotent: temporal context)
  recentCommits?: Commit[];

  // Blame information (nilpotent: authorship context)
  blame?: {
    summary: BlameSummary;
    lines?: BlameLine[]; // Only in 'deep' mode
  };

  // Metadata
  depth: ThickReadDepth;
  generatedAt: string;
}

export interface ThickReadInput {
  path: string;
  depth?: ThickReadDepth;
  lineRange?: LineRange;
  maxCommits?: number;
}

// Ticket/PR reference patterns
const TICKET_PATTERNS = [
  /GH-(\d+)/gi, // GitHub: GH-123
  /#(\d+)/g, // GitHub: #123
  /[A-Z]+-\d+/g, // JIRA: PROJ-123
  /fixes?:?\s*#?(\d+)/gi, // "Fixes #123" or "Fix: 123"
  /closes?:?\s*#?(\d+)/gi, // "Closes #123"
];

/**
 * Extract ticket/PR references from a commit message
 */
function extractTicketRefs(message: string): string[] {
  const refs = new Set<string>();
  for (const pattern of TICKET_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(message)) !== null) {
      refs.add(match[0]);
    }
  }
  return Array.from(refs);
}

/**
 * Check if a path is inside a git repository
 */
async function isGitRepo(filePath: string): Promise<boolean> {
  try {
    const dir = path.dirname(filePath);
    await execAsync("git rev-parse --is-inside-work-tree", { cwd: dir });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if git is installed
 */
async function isGitInstalled(): Promise<boolean> {
  try {
    await execAsync("git --version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get recent commits for a file
 */
async function getRecentCommits(
  filePath: string,
  maxCount: number
): Promise<Commit[]> {
  try {
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath);

    // Format: hash<NUL>author<NUL>date<NUL>subject<NUL>body<NUL><NUL>
    const format = "%H%x00%an%x00%ai%x00%s%x00%b%x00";
    const { stdout } = await execAsync(
      `git log -n ${maxCount} --format="${format}" -- "${filename}"`,
      { cwd: dir, maxBuffer: 1024 * 1024 }
    );

    if (!stdout.trim()) {
      return [];
    }

    const commits: Commit[] = [];
    // Split by double NUL (end of each commit)
    const entries = stdout.split("\x00\x00").filter((e) => e.trim());

    for (const entry of entries) {
      const parts = entry.split("\x00");
      if (parts.length >= 4) {
        const [hash, author, date, subject, body = ""] = parts;
        const fullMessage = body ? `${subject}\n\n${body}` : subject;
        commits.push({
          hash: hash.trim(),
          shortHash: hash.trim().substring(0, 7),
          author: author.trim(),
          date: date.trim().split(" ")[0], // Just the date part
          message: fullMessage.trim(),
          ticketRefs: extractTicketRefs(fullMessage),
        });
      }
    }

    return commits;
  } catch (error) {
    // Git log failed - file might be new or not tracked
    return [];
  }
}

/**
 * Parse git blame --line-porcelain output
 */
function parseBlameOutput(output: string): BlameLine[] {
  const lines: BlameLine[] = [];
  const blocks = output.split(/(?=^[a-f0-9]{40} )/m);

  for (const block of blocks) {
    if (!block.trim()) continue;

    const blockLines = block.split("\n");
    const headerMatch = blockLines[0]?.match(/^([a-f0-9]{40}) (\d+) (\d+)/);
    if (!headerMatch) continue;

    const commit = headerMatch[1];
    const lineNumber = parseInt(headerMatch[3], 10);

    let author = "";
    let date = "";
    let content = "";

    for (const line of blockLines) {
      if (line.startsWith("author ")) {
        author = line.substring(7);
      } else if (line.startsWith("author-time ")) {
        const timestamp = parseInt(line.substring(12), 10);
        date = new Date(timestamp * 1000).toISOString().split("T")[0];
      } else if (line.startsWith("\t")) {
        content = line.substring(1);
      }
    }

    if (lineNumber && commit) {
      lines.push({ lineNumber, commit: commit.substring(0, 7), author, date, content });
    }
  }

  return lines.sort((a, b) => a.lineNumber - b.lineNumber);
}

/**
 * Get blame information for a file
 */
async function getBlame(
  filePath: string,
  lineRange?: LineRange
): Promise<BlameLine[]> {
  try {
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath);

    let cmd = `git blame --line-porcelain "${filename}"`;
    if (lineRange) {
      cmd = `git blame -L ${lineRange.start},${lineRange.end} --line-porcelain "${filename}"`;
    }

    const { stdout } = await execAsync(cmd, {
      cwd: dir,
      maxBuffer: 10 * 1024 * 1024, // 10MB for large files
    });

    return parseBlameOutput(stdout);
  } catch (error) {
    // Blame failed - file might not be tracked
    return [];
  }
}

/**
 * Generate blame summary from blame lines
 */
function generateBlameSummary(blameLines: BlameLine[]): BlameSummary {
  if (blameLines.length === 0) {
    return {
      authorCount: 0,
      oldestLine: { date: "", commit: "" },
      newestLine: { date: "", commit: "" },
      topAuthors: [],
    };
  }

  // Count lines per author
  const authorCounts = new Map<string, number>();
  for (const line of blameLines) {
    authorCounts.set(line.author, (authorCounts.get(line.author) || 0) + 1);
  }

  // Sort by line count descending
  const topAuthors = Array.from(authorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([author, lineCount]) => ({
      author,
      lineCount,
      percentage: Math.round((lineCount / blameLines.length) * 1000) / 10,
    }));

  // Find oldest and newest lines by date
  const sortedByDate = [...blameLines].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return {
    authorCount: authorCounts.size,
    oldestLine: {
      date: sortedByDate[0].date,
      commit: sortedByDate[0].commit,
    },
    newestLine: {
      date: sortedByDate[sortedByDate.length - 1].date,
      commit: sortedByDate[sortedByDate.length - 1].commit,
    },
    topAuthors,
  };
}

/**
 * Main thick_read function
 */
export async function thickRead(input: ThickReadInput): Promise<ThickReadResult> {
  const {
    path: filePath,
    depth = "standard",
    lineRange,
    maxCommits = 5,
  } = input;

  // Resolve absolute path
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  // Check if file exists
  try {
    await fs.access(absolutePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  // Check if it's a binary file (simple heuristic)
  const content = await fs.readFile(absolutePath, "utf-8");
  if (content.includes("\0")) {
    throw new Error(
      `Binary file detected: ${filePath}. Use a different tool for binary files.`
    );
  }

  const lines = content.split("\n");
  const lineCount = lines.length;

  // Apply line range if specified
  let filteredContent = content;
  if (lineRange) {
    const start = Math.max(0, lineRange.start - 1);
    const end = Math.min(lineCount, lineRange.end);
    filteredContent = lines.slice(start, end).join("\n");
  }

  // Check git availability
  const gitInstalled = await isGitInstalled();
  if (!gitInstalled) {
    return {
      path: filePath,
      content: filteredContent,
      lineCount,
      isGitRepo: false,
      gitWarning: "Git is not installed. Returning file content only.",
      depth,
      generatedAt: new Date().toISOString(),
    };
  }

  const inGitRepo = await isGitRepo(absolutePath);
  if (!inGitRepo) {
    return {
      path: filePath,
      content: filteredContent,
      lineCount,
      isGitRepo: false,
      gitWarning:
        "File is not in a git repository. Returning file content only.",
      depth,
      generatedAt: new Date().toISOString(),
    };
  }

  // Build result based on depth
  const result: ThickReadResult = {
    path: filePath,
    content: filteredContent,
    lineCount,
    isGitRepo: true,
    depth,
    generatedAt: new Date().toISOString(),
  };

  // All depths include recent commits
  const commits = await getRecentCommits(
    absolutePath,
    depth === "shallow" ? 3 : maxCommits
  );
  if (commits.length > 0) {
    result.recentCommits = commits;
  }

  // Standard and deep include blame summary
  if (depth === "standard" || depth === "deep") {
    const blameLines = await getBlame(absolutePath, lineRange);
    if (blameLines.length > 0) {
      result.blame = {
        summary: generateBlameSummary(blameLines),
      };

      // Deep includes full blame lines
      if (depth === "deep") {
        result.blame.lines = blameLines;
      }
    }
  }

  return result;
}

/**
 * Tool definition for MCP registration
 */
export const THICK_READ_TOOL = {
  name: "thick_read",
  description: `Read a file with its git context (history, blame, commit messages). Implements Grothendieck's 'Schemes' concept - the file content is the geometric point, the git context is the nilpotent 'fuzz' that explains WHY the code exists.

Use this tool when you need to understand:
- Why a piece of code exists (not just what it does)
- Who wrote it and when
- What changes led to the current state
- Whether a "hack" is intentional and necessary

Depth levels:
- shallow: content + 3 recent commits (fastest)
- standard: + blame summary with top authors (default)
- deep: + full per-line blame (most comprehensive)`,
  inputSchema: {
    type: "object" as const,
    properties: {
      path: {
        type: "string",
        description: "Path to the file (absolute or relative to working directory)",
      },
      depth: {
        type: "string",
        enum: ["shallow", "standard", "deep"],
        default: "standard",
        description:
          "shallow: content + 3 recent commits. standard: + blame summary. deep: + full blame",
      },
      lineRange: {
        type: "object",
        properties: {
          start: { type: "number", description: "Start line (1-indexed)" },
          end: { type: "number", description: "End line (1-indexed, inclusive)" },
        },
        description: "Optional line range to focus on",
      },
      maxCommits: {
        type: "number",
        default: 5,
        description: "Maximum number of recent commits to include",
      },
    },
    required: ["path"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};
