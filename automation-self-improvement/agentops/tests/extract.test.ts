/**
 * JSON extraction tests
 */

import { test, expect } from 'vitest';
import { extractProposals, extractImplementationMeta } from '../runner/lib/template.js';

test('extractProposals finds AGENTOPS_META_BEGIN block', () => {
  const issueBody = `
# Test Issue

Some content here.

<!-- AGENTOPS_META_BEGIN
{
  "run_id": "test-run",
  "job_name": "test-job"
}
AGENTOPS_META_END -->

<details>
  <summary>Proposals</summary>

\`\`\`json
{
  "run_id": "test-run",
  "repo_ref": "main",
  "git_sha": "abc123",
  "generated_at": "2026-01-28T12:00:00Z",
  "proposals": []
}
\`\`\`

</details>
`;

  const result = extractProposals(issueBody);

  expect(result.run_id).toBe('test-run');
  expect(result.repo_ref).toBe('main');
  expect(Array.isArray(result.proposals)).toBe(true);
});

test('extractProposals throws on missing meta block', () => {
  const issueBody = `
# Test Issue

No meta block here.

\`\`\`json
{"proposals": []}
\`\`\`
`;

  expect(() => extractProposals(issueBody)).toThrow(/No AGENTOPS_META_BEGIN block found/);
});

test('extractProposals throws on missing JSON block', () => {
  const issueBody = `
# Test Issue

<!-- AGENTOPS_META_BEGIN
{"run_id": "test"}
AGENTOPS_META_END -->

No JSON block here.
`;

  expect(() => extractProposals(issueBody)).toThrow(/No proposals.json code block found/);
});

test('extractImplementationMeta finds AGENTOPS_IMPL_META_BEGIN block', () => {
  const commentBody = `
# Implementation Evidence

Some evidence here.

<!-- AGENTOPS_IMPL_META_BEGIN
{
  "run_id": "impl-run",
  "proposal_id": "proposal-1",
  "status": "SUCCEEDED"
}
AGENTOPS_IMPL_META_END -->
`;

  const result = extractImplementationMeta(commentBody);

  expect(result.run_id).toBe('impl-run');
  expect(result.proposal_id).toBe('proposal-1');
  expect(result.status).toBe('SUCCEEDED');
});

test('extractImplementationMeta throws on missing meta block', () => {
  const commentBody = `
# Implementation Evidence

No meta block here.
`;

  expect(() => extractImplementationMeta(commentBody)).toThrow(/No AGENTOPS_IMPL_META_BEGIN block found/);
});
