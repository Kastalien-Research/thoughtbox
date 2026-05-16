import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const AGENTOPS_ROOT = path.resolve(__dirname, '../..');
export const REPO_ROOT = path.resolve(AGENTOPS_ROOT, '../..');

export function agentopsPath(...parts: string[]): string {
  return path.join(AGENTOPS_ROOT, ...parts);
}

export function repoPath(...parts: string[]): string {
  return path.join(REPO_ROOT, ...parts);
}
