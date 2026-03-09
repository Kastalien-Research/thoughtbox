import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';

// Get base dir, fall back to OS temp dir
const REPO_BASE_DIR = process.env.THOUGHTBOX_TMP_DIR || path.join(os.tmpdir(), 'thoughtbox-repos');

export interface ClonedRepo {
    id: string;      // A generated hash of the URL to keep things mapped uniquely
    path: string;    // The absolute path in /tmp
    url: string;     // The source URL
    branch: string;  // The branch cloned
    createdAt: Date; // Keep track of age to cleanup
}

const activeRepos = new Map<string, ClonedRepo>();

/**
 * Ensures the base temporary directory exists.
 */
function ensureBaseDir() {
    if (!fs.existsSync(REPO_BASE_DIR)) {
        fs.mkdirSync(REPO_BASE_DIR, { recursive: true });
    }
}

/**
 * Generate a safe ID for the repository path.
 */
function generateRepoId(url: string, branch: string): string {
    return crypto.createHash('sha256').update(`${url}:${branch}`).digest('hex').substring(0, 12);
}

/**
 * Shallow clones a repository into the ephemeral storage.
 * 
 * @param url The full git URL (can include PAT in the URL: https://oauth2:token@github.com/org/repo.git)
 * @param branch Optional branch name to clone instead of default
 * @returns The ClonedRepo metadata
 */
export async function cloneRepository(url: string, branch?: string): Promise<ClonedRepo> {
    ensureBaseDir();

    // Prevent SSRF: Only allow HTTP/HTTPS, reject file://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error(`Invalid URL scheme. Only http:// and https:// are supported.`);
    }

    // Scrub URL for safe logging (remove username/password/PAT)
    const scrubbedUrl = url.replace(/:\/\/[^@]+@/, '://***@');

    // Clean up if we are holding too many repos in memory
    enforceCapacityLimit(5);

    const safeBranch = branch || 'main'; // Assume main but git clone will naturally default if we just omit it, though we pass it explicitly here if provided.
    const id = generateRepoId(url, safeBranch);
    const repoPath = path.join(REPO_BASE_DIR, id);

    // If we already have this exact url+branch cloned, just return it (hot cache).
    if (activeRepos.has(id) && fs.existsSync(repoPath)) {
        console.error(`[GitManager] Repo ${id} already cloned. Using cache.`);
        // Update timestamp to keep it alive
        activeRepos.get(id)!.createdAt = new Date();
        return activeRepos.get(id)!;
    }

    // Clear directory just in case there's stale data that wasn't tracked
    if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
    }

    console.error(`[GitManager] Cloning ${scrubbedUrl} (branch: ${safeBranch}) into ${repoPath}`);

    try {
        const args = ['clone', '--depth', '1', '--single-branch'];
        if (branch) {
            args.push('--branch', branch);
        }
        args.push(url, repoPath);

        // We execute sync using execFileSync to avoid shell injection
        execFileSync('git', args, {
            stdio: 'pipe', // Pipe so we don't spam stdout unless error
            timeout: 60000 // 60s max for shallow clone
        });

        const repoRef: ClonedRepo = {
            id,
            path: repoPath,
            url,
            branch: safeBranch,
            createdAt: new Date(),
        };

        activeRepos.set(id, repoRef);
        return repoRef;

    } catch (error: any) {
        // If clone fails, ensure we clean up partial directories
        if (fs.existsSync(repoPath)) {
            fs.rmSync(repoPath, { recursive: true, force: true });
        }

        // Attempt to scrub tokens from error output using a general regex
        const safeError = (error.message || '').replace(/:\/\/[^@]+@/, '://***@');
        console.error(`[GitManager] Failed to clone ${scrubbedUrl}: ${safeError}`);
        throw new Error(`Git clone failed for ${scrubbedUrl}`);
    }
}

/**
 * Gets currently cloned repository metadata by id.
 */
export function getRepository(id: string): ClonedRepo | undefined {
    return activeRepos.get(id);
}

/**
 * Removes the oldest repositories if we exceed the capacity limit 
 * to prevent exhausting Cloud Run memory or disk space.
 */
function enforceCapacityLimit(maxRepos: number) {
    if (activeRepos.size >= maxRepos) {
        // Find the oldest
        let oldestId: string | null = null;

        for (const [id, repo] of activeRepos.entries()) {
            if (!oldestId || repo.createdAt < activeRepos.get(oldestId)!.createdAt) {
                oldestId = id;
            }
        }

        if (oldestId) {
            removeRepository(oldestId);
        }
    }
}

/**
 * Deletes a repository from the disk and tracking map.
 */
export function removeRepository(id: string) {
    const repo = activeRepos.get(id);
    if (repo) {
        try {
            if (fs.existsSync(repo.path)) {
                fs.rmSync(repo.path, { recursive: true, force: true });
            }
            activeRepos.delete(id);
            console.error(`[GitManager] Removed repository ${id} to free space.`);
        } catch (e) {
            console.error(`[GitManager] Failed to remove repo ${id}:`, e);
        }
    }
}

/**
 * Safely resolves a path strictly within a cloned repository boundary.
 * Prevents directory traversal attacks ('../../.env').
 */
export function resolveSafePath(repoId: string, targetPath: string): string {
    const repo = activeRepos.get(repoId);
    if (!repo) {
        throw new Error(`Repository ${repoId} is not initialized or has been purged.`);
    }

    // Best defense: do not allow '..' anywhere in the requested path segment.
    // This is safer than relying solely on path.resolve since path.resolve processes '..'
    // internally and might hide a traversal attack if the path segment doesn't exist yet.
    if (targetPath.includes('..')) {
        throw new Error(`Path traversal denied: '..' is not allowed in paths.`);
    }

    const repoRealpath = fs.realpathSync(repo.path);
    let absoluteTarget = path.resolve(repoRealpath, targetPath);

    // If the file exists, we can use realpath to resolve any symlink tricks.
    if (fs.existsSync(absoluteTarget)) {
        absoluteTarget = fs.realpathSync(absoluteTarget);
    }

    // Ensure it's still within the repo path. 
    // Add path.sep to prevent partial string matches (e.g. /tmp/repo vs /tmp/repo-malicious)
    const repoBoundary = repoRealpath.endsWith(path.sep) ? repoRealpath : repoRealpath + path.sep;

    // We allow reading the exact root directory of the repo, or anything inside it.
    if (absoluteTarget !== repoRealpath && !absoluteTarget.startsWith(repoBoundary)) {
        throw new Error(`Path traversal denied: Target must be within the cloned repository.`);
    }

    return absoluteTarget;
}
