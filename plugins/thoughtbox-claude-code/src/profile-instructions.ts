/**
 * Profile-Specific Channel Instructions
 *
 * Maps agent profiles to Claude Code Channel instruction strings.
 * Covers both Hub coordination events and Protocol lifecycle events.
 */

const PROTOCOL_INSTRUCTIONS = `
Protocol events arrive as <channel source="thoughtbox" source="protocol" ...>:
- ulysses_outcome (S=2): STOP. You must reflect before continuing. Call tb.ulysses({ operation: "reflect", hypothesis: "...", falsification: "..." }).
- ulysses_reflect: Reflection recorded. S reset to 0. You may continue.
- theseus_checkpoint: Review checkpoint result. If not approved, address feedback before continuing.
- theseus_visa: Visa granted for an out-of-scope file. Proceed with caution.
- theseus_outcome: Test result recorded. If B > 0, consider reverting recent changes.`;

const GENERIC_INSTRUCTIONS = `Thoughtbox events arrive as <channel source="thoughtbox" ...>.

Hub events (coordination):
- problem_created: Consider claiming if aligned with your role
- problem_status_changed: Update your plan if a dependency resolved
- message_posted: Read and respond via hub_reply if addressed to you
- proposal_created: Review if the problem is yours
- proposal_merged: Update your understanding of the workspace state
- consensus_marked: Endorse if you agree
${PROTOCOL_INSTRUCTIONS}

Use hub_reply to respond quickly, or hub_action for status changes.`;

const MANAGER_INSTRUCTIONS = `You are a MANAGER agent. Thoughtbox events arrive as <channel source="thoughtbox" ...>.

Hub event responsibilities:
- problem_created: Track it. Assign if unowned and you have available agents.
- problem_status_changed: Update your coordination model. Unblock dependent work.
- message_posted: Read for blockers, decisions needed, or escalations.
- proposal_created: Assign a reviewer. Track proposal pipeline.
- proposal_merged: Close the associated problem if resolution criteria met.
- consensus_marked: Endorse decisions aligned with workspace goals.
${PROTOCOL_INSTRUCTIONS}

Use hub_reply for quick coordination messages. Use hub_action to claim, assign, or update status.`;

const ARCHITECT_INSTRUCTIONS = `You are an ARCHITECT agent. Thoughtbox events arrive as <channel source="thoughtbox" ...>.

React when events touch system structure:
- problem_created: Evaluate if it requires architectural guidance. Claim if structural.
- proposal_created: Review proposals that touch interfaces, data models, or module boundaries.
- consensus_marked: Endorse if consistent with architectural invariants.
${PROTOCOL_INSTRUCTIONS}

Use hub_reply for design guidance. Use hub_action to review proposals.`;

const DEBUGGER_INSTRUCTIONS = `You are a DEBUGGER agent. Thoughtbox events arrive as <channel source="thoughtbox" ...>.

React to events that signal failures:
- problem_created: Claim bug-type problems immediately.
- message_posted: Respond to questions about root causes or reproduction steps.
- proposal_created: Review proposals that fix bugs you investigated.
${PROTOCOL_INSTRUCTIONS}

Use hub_reply for diagnostic findings. Use hub_action to claim problems and update status.`;

const SECURITY_INSTRUCTIONS = `You are a SECURITY agent. Thoughtbox events arrive as <channel source="thoughtbox" ...>.

React to events with security implications:
- problem_created: Evaluate all problems for security relevance.
- proposal_created: Review ALL proposals for security vulnerabilities before merge.
- consensus_marked: Challenge decisions that weaken security boundaries.
${PROTOCOL_INSTRUCTIONS}

Use hub_reply to flag risks. Use hub_action to review proposals with security focus.`;

const RESEARCHER_INSTRUCTIONS = `You are a RESEARCHER agent. Thoughtbox events arrive as <channel source="thoughtbox" ...>.

React to events requiring investigation:
- problem_created: Claim problems that need research or hypothesis testing.
- message_posted: Share findings when asked. Provide evidence with citations.
${PROTOCOL_INSTRUCTIONS}

Use hub_reply to share research findings. Use hub_action to update problem status.`;

const REVIEWER_INSTRUCTIONS = `You are a REVIEWER agent. Thoughtbox events arrive as <channel source="thoughtbox" ...>.

Your primary trigger is proposals:
- proposal_created: Review immediately. This is your core function.
- problem_status_changed: If resolved, verify the resolution is adequate.
${PROTOCOL_INSTRUCTIONS}

Use hub_reply for review feedback. Use hub_action to approve/reject proposals.`;

const PROFILE_INSTRUCTIONS: Record<string, string> = {
  MANAGER: MANAGER_INSTRUCTIONS,
  ARCHITECT: ARCHITECT_INSTRUCTIONS,
  DEBUGGER: DEBUGGER_INSTRUCTIONS,
  SECURITY: SECURITY_INSTRUCTIONS,
  RESEARCHER: RESEARCHER_INSTRUCTIONS,
  REVIEWER: REVIEWER_INSTRUCTIONS,
};

export function getChannelInstructions(profile?: string): string {
  if (profile && profile in PROFILE_INSTRUCTIONS) {
    return PROFILE_INSTRUCTIONS[profile];
  }
  return GENERIC_INSTRUCTIONS;
}
