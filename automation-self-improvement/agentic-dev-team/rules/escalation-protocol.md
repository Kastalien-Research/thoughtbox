## Escalation Protocol

When hitting an escalation threshold, format the escalation as a structured decision request — not an open-ended question. Present the situation, options, and tradeoffs. Ask the human to *decide*, not *diagnose*.

Escalation thresholds (escalate to user when any apply):
- Scope change: any change to what the product does or doesn't do
- Prioritization conflict: competing tasks on the critical path
- External dependency failure: tool/API/spec doesn't work as documented
- Timeline impact: blocker shifts a ship date
- Irreversible action: deleting data, publishing, merging to main, deploying
- Cost exceeding budget: token/API/compute costs over threshold
- Repeated failure: same task failing >3 attempts with different approaches
- Shippability assessment: work believed complete

Format:
1. **Situation**: What happened (1-2 sentences)
2. **Impact**: What this means for the current plan
3. **What was tried**: What the system already attempted
4. **Options**: At least 2 options, each with label, description, tradeoff, and risk level
5. **Recommendation**: Which option and why (if applicable)
