---
name: thoughtbox-team
description: Spawn an Agent Team with a background Thoughtbox analyst teammate. The analyst monitors your reasoning sessions for evolution candidates, contradictions, and generates periodic digests. Use this at the start of any deep Thoughtbox reasoning session, when you're about to record many thoughts and want background analysis. Triggers on "start thoughtbox team", "I want a session analyst", "monitor my reasoning", or at the start of any session where you plan to use Thoughtbox extensively.
argument-hint: [optional session ID to monitor]
user-invocable: true
---

# Thoughtbox Team

Spawn a 2-agent team: you (lead) + a background analyst teammate that monitors your Thoughtbox session.

## When to Use

Use this when you're about to do significant Thoughtbox reasoning — sessions where you'll record 10+ thoughts and want background analysis of contradictions, evolution candidates, and session digests without having to orchestrate it yourself.

Don't use this for quick 1-3 thought sessions — the coordination overhead isn't worth it.

## How to Spawn

Tell Claude Code you want to create a team. The analyst teammate should be configured with:

- **Name**: `analyst`
- **Role**: Read the agent definition at `.claude/agents/thoughtbox-analyst.md` and use it as the teammate's instructions
- **Model**: Haiku (cost-efficient for background monitoring)
- **Focus**: Monitor the Thoughtbox session specified by $ARGUMENTS, or the most recent active session

Example spawn prompt:

```
Create an agent team with one teammate:
- Name: analyst
- Instructions: [contents of .claude/agents/thoughtbox-analyst.md]
- Task: Monitor Thoughtbox session [SESSION_ID] for evolution candidates and contradictions. Message me when you find thoughts that should be revised. Generate a digest every 20 thoughts.
```

## Working with the Analyst

Once the team is running:

1. **Do your work normally.** Record thoughts via `thoughtbox_execute` as usual.
2. **Watch for messages.** The analyst will message you when it finds evolution candidates.
3. **Respond to evolution signals.** When the analyst says "Thought 55 may contradict thoughts 5, 24", you decide whether to revise.
4. **Request digests.** Message the analyst: "Give me a digest of where we are."

## What the Analyst Does

- Periodically checks the session for new thoughts
- Runs deterministic evolution candidate detection (word overlap, structural heuristics)
- Flags `assumption_update` and `decision_frame` thoughts for special attention
- Generates compressed digests at milestones (~every 20 thoughts)
- Messages you with concise, actionable findings

## What the Analyst Does NOT Do

- Write code or modify files
- Apply revisions (it surfaces candidates, you decide)
- Interrupt for low-signal findings (only messages when overlap > 15%)
- Access anything outside Thoughtbox sessions

## Ending the Session

When your reasoning session is done, ask the analyst for a final digest, then dismiss the team. The digest can be used for session handoff or cross-session context injection.
