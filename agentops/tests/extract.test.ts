/**
 * JSON extraction tests
 */

import { test } from 'node:test';
import assert from 'node:assert';
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

  assert.strictEqual(result.run_id, 'test-run');
  assert.strictEqual(result.repo_ref, 'main');
  assert.ok(Array.isArray(result.proposals));
});

test('extractProposals throws on missing meta block', () => {
  const issueBody = `
# Test Issue

No meta block here.

\`\`\`json
{"proposals": []}
\`\`\`
`;

  assert.throws(
    () => extractProposals(issueBody),
    /No AGENTOPS_META_BEGIN block found/
  );
});

test('extractProposals throws on missing JSON block', () => {
  const issueBody = `
# Test Issue

<!-- AGENTOPS_META_BEGIN
{"run_id": "test"}
AGENTOPS_META_END -->

No JSON block here.
`;

  assert.throws(
    () => extractProposals(issueBody),
    /No proposals.json code block found/
  );
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

  assert.strictEqual(result.run_id, 'impl-run');
  assert.strictEqual(result.proposal_id, 'proposal-1');
  assert.strictEqual(result.status, 'SUCCEEDED');
});

test('extractImplementationMeta throws on missing meta block', () => {
  const commentBody = `
# Implementation Evidence

No meta block here.
`;

  assert.throws(
    () => extractImplementationMeta(commentBody),
    /No AGENTOPS_IMPL_META_BEGIN block found/
  );
});

console.log('✅ All extraction tests passed');
