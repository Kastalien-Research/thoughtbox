-- Seed workflows for the MAP-Elites library
-- These provide initial coverage of the behavioral space
-- Run after schema.sql: sqlite3 workflows.db < seed.sql

-- ============ EXPLORATORY WORKFLOWS ============

INSERT INTO workflows (id, name, description, status, coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity, archetype)
VALUES ('workflow-seed-landscape-scan', 'Quick Landscape Scan', '15-minute overview of a new area. Breadth over depth. Goal: understand the shape of the space, key players, and recent developments.', 'seed', 4, 1, 3, 2, 1, 'exploratory');

INSERT INTO workflow_steps (workflow_id, step_order, name, description, rationale, tools_required, skip_condition, outputs) VALUES
('workflow-seed-landscape-scan', 1, 'Broad search', 'Run 3-5 varied queries covering the topic from different angles', 'Diverse queries prevent tunnel vision from a single framing', 'WebSearch, web_search_exa', NULL, 'List of 15-20 relevant sources'),
('workflow-seed-landscape-scan', 2, 'Key player identification', 'Identify the top 5-10 people/orgs active in this space', 'Knowing who is working on what reveals the real structure of the field', 'web_search_advanced_exa', NULL, 'Player map with recent activity'),
('workflow-seed-landscape-scan', 3, 'Recency filter', 'Focus on what changed in the last 6 months', 'Stale information is the default; recency reveals trajectory', 'WebSearch', 'Topic is mature/stable with no recent changes', 'Timeline of recent developments'),
('workflow-seed-landscape-scan', 4, 'Compress', 'Write a 3-paragraph summary: what exists, what is moving, what is missing', 'Forces synthesis and reveals gaps in understanding', NULL, NULL, 'Landscape summary');

INSERT INTO workflows (id, name, description, status, coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity, archetype)
VALUES ('workflow-seed-deep-review', 'Deep Literature Review', 'Comprehensive survey of a mature field. Goal: map the consensus, identify open questions, and find the frontier.', 'seed', 5, 2, 4, 3, 4, 'exploratory');

INSERT INTO workflow_steps (workflow_id, step_order, name, description, rationale, tools_required, skip_condition, outputs) VALUES
('workflow-seed-deep-review', 1, 'Anchor papers', 'Find 3-5 highly-cited foundational papers or surveys', 'Anchor papers define the conceptual vocabulary and key debates', 'web_search_advanced_exa', NULL, 'List of anchor papers with key claims'),
('workflow-seed-deep-review', 2, 'Citation chain', 'Follow citations forward from anchors to find recent work that builds on them', 'Forward citations reveal where the field went after the foundations', 'web_search_exa, WebFetch', NULL, 'Citation map with 10-20 papers'),
('workflow-seed-deep-review', 3, 'Dissent mapping', 'Explicitly search for disagreements, failed replications, and contrarian takes', 'Consensus views are easy to find; understanding disagreements reveals the real frontier', 'WebSearch, web_search_advanced_exa', NULL, 'Map of contested claims'),
('workflow-seed-deep-review', 4, 'Gap analysis', 'Identify what is NOT being studied — the white space', 'Absence of work is harder to detect than presence but often more valuable', NULL, NULL, 'List of unexplored or under-explored areas'),
('workflow-seed-deep-review', 5, 'Synthesis', 'Write a structured review: consensus, open questions, frontier, gaps', 'Forces integration of everything learned into a coherent model', NULL, NULL, 'Structured literature review');

INSERT INTO workflows (id, name, description, status, coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity, archetype)
VALUES ('workflow-seed-trend-detection', 'Trend Detection', 'Identify what is gaining momentum in a domain. Goal: early signal of directional shifts.', 'seed', 3, 1, 3, 4, 2, 'exploratory');

INSERT INTO workflow_steps (workflow_id, step_order, name, description, rationale, tools_required, skip_condition, outputs) VALUES
('workflow-seed-trend-detection', 1, 'Signal scan', 'Search for recent activity: new repos, blog posts, conference talks, funding announcements', 'Activity volume and recency are leading indicators of momentum', 'WebSearch, web_search_exa, GitHub search', NULL, 'Raw signal list with timestamps'),
('workflow-seed-trend-detection', 2, 'Velocity estimation', 'Compare current activity level to 6-month and 12-month baselines', 'Absolute activity means less than rate of change', 'WebSearch', 'No historical baseline available', 'Velocity estimates per signal'),
('workflow-seed-trend-detection', 3, 'Driver analysis', 'For the top 3 signals, identify WHY momentum is building now', 'Understanding drivers lets you predict whether a trend will sustain or fizzle', 'WebFetch, web_search_exa', NULL, 'Causal analysis per trend'),
('workflow-seed-trend-detection', 4, 'Counter-signal check', 'Actively search for reasons these trends might stall or reverse', 'Confirmation bias makes trends look stronger than they are', 'WebSearch', NULL, 'Counter-signals and risk factors');

-- ============ CONFIRMATORY WORKFLOWS ============

INSERT INTO workflows (id, name, description, status, coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity, archetype)
VALUES ('workflow-seed-fact-check', 'Fact-Checking Pipeline', 'Verify specific claims against primary sources. Goal: determine whether a stated fact is true, with confidence scoring.', 'seed', 1, 1, 5, 1, 5, 'confirmatory');

INSERT INTO workflow_steps (workflow_id, step_order, name, description, rationale, tools_required, skip_condition, outputs) VALUES
('workflow-seed-fact-check', 1, 'Claim decomposition', 'Break the claim into atomic, independently verifiable sub-claims', 'Complex claims often mix true and false components; atomic verification prevents contamination', NULL, 'Claim is already atomic', 'List of atomic claims'),
('workflow-seed-fact-check', 2, 'Source hierarchy', 'For each sub-claim, identify the most authoritative source (primary > secondary > tertiary)', 'Source authority determines ceiling on verification confidence', 'WebSearch, web_search_exa', NULL, 'Source list ranked by authority'),
('workflow-seed-fact-check', 3, 'Direct verification', 'Check each sub-claim against its primary source', 'Direct verification beats inference from secondary sources', 'WebFetch, firecrawl_scrape', NULL, 'Verification status per sub-claim'),
('workflow-seed-fact-check', 4, 'Corroboration', 'For sub-claims verified from one source, seek independent corroboration', 'Single-source verification is fragile; corroboration increases confidence', 'WebSearch', 'Sub-claim already has 2+ independent sources', 'Corroboration evidence'),
('workflow-seed-fact-check', 5, 'Confidence scoring', 'Assign confidence scores: HIGH (0.9+), MEDIUM (0.6-0.9), LOW (0.3-0.6), UNVERIFIED (<0.3)', 'Explicit confidence prevents false precision', NULL, NULL, 'Scored claim with evidence chain');

INSERT INTO workflows (id, name, description, status, coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity, archetype)
VALUES ('workflow-seed-consensus-map', 'Consensus Mapping', 'Map what experts agree and disagree on. Goal: understand the distribution of expert opinion, not just the majority view.', 'seed', 3, 2, 4, 2, 4, 'confirmatory');

INSERT INTO workflow_steps (workflow_id, step_order, name, description, rationale, tools_required, skip_condition, outputs) VALUES
('workflow-seed-consensus-map', 1, 'Expert identification', 'Find 5-10 credible voices with published positions on the topic', 'Expert selection determines the quality of the map', 'web_search_exa, WebSearch', NULL, 'Expert list with credentials and positions'),
('workflow-seed-consensus-map', 2, 'Position extraction', 'For each expert, extract their specific claims and reasoning', 'Positions without reasoning are useless for understanding disagreement', 'WebFetch, web_search_advanced_exa', NULL, 'Position matrix'),
('workflow-seed-consensus-map', 3, 'Disagreement clustering', 'Group disagreements by root cause: different data, different models, different values', 'The type of disagreement determines how resolvable it is', NULL, NULL, 'Categorized disagreements'),
('workflow-seed-consensus-map', 4, 'Synthesis', 'Map: areas of strong consensus, areas of productive disagreement, areas of confusion', 'Distinguishing these three categories is the core value of consensus mapping', NULL, NULL, 'Consensus map');

-- ============ ANALYTICAL WORKFLOWS ============

INSERT INTO workflows (id, name, description, status, coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity, archetype)
VALUES ('workflow-seed-compare-contrast', 'Compare and Contrast', 'Systematic comparison of N approaches or tools. Goal: structured decision support.', 'seed', 2, 1, 4, 2, 4, 'analytical');

INSERT INTO workflow_steps (workflow_id, step_order, name, description, rationale, tools_required, skip_condition, outputs) VALUES
('workflow-seed-compare-contrast', 1, 'Criteria definition', 'Define the evaluation dimensions BEFORE looking at candidates', 'Pre-defining criteria prevents the comparison from being biased toward whichever option was investigated first', NULL, NULL, 'Evaluation rubric'),
('workflow-seed-compare-contrast', 2, 'Candidate research', 'For each candidate, gather information along every criterion', 'Systematic coverage prevents spotlight effect where well-known options get more thorough treatment', 'WebSearch, web_search_exa, WebFetch', NULL, 'Data per candidate per criterion'),
('workflow-seed-compare-contrast', 3, 'Normalization', 'Convert findings to comparable formats (same units, same scale)', 'Raw data in different formats makes comparison unreliable', NULL, NULL, 'Normalized comparison matrix'),
('workflow-seed-compare-contrast', 4, 'Tradeoff analysis', 'Identify which criteria are in tension — what you gain from one option, you lose from another', 'Real decisions are about tradeoffs, not absolute winners', NULL, NULL, 'Tradeoff map'),
('workflow-seed-compare-contrast', 5, 'Recommendation', 'Recommend based on stated priorities, with sensitivity analysis on those priorities', 'The best option depends on what you value; make that dependency explicit', NULL, NULL, 'Conditional recommendation');

INSERT INTO workflows (id, name, description, status, coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity, archetype)
VALUES ('workflow-seed-root-cause', 'Root Cause Analysis', 'Investigate why something happened or does not work. Goal: identify the actual cause, not just symptoms.', 'seed', 2, 1, 5, 1, 4, 'analytical');

INSERT INTO workflow_steps (workflow_id, step_order, name, description, rationale, tools_required, skip_condition, outputs) VALUES
('workflow-seed-root-cause', 1, 'Symptom catalog', 'List all observed symptoms without interpreting them', 'Premature interpretation narrows the hypothesis space too early', NULL, NULL, 'Complete symptom list'),
('workflow-seed-root-cause', 2, 'Hypothesis generation', 'Generate 3-5 plausible root causes that could explain ALL symptoms', 'Multiple hypotheses prevent anchoring on the first plausible explanation', NULL, NULL, 'Hypothesis list with predicted symptoms'),
('workflow-seed-root-cause', 3, 'Discriminating test', 'For each hypothesis, identify a test that would distinguish it from the others', 'The most valuable test is one that eliminates multiple hypotheses at once', 'Bash, WebSearch', NULL, 'Test plan'),
('workflow-seed-root-cause', 4, 'Execute and eliminate', 'Run tests, eliminate hypotheses that fail, refine survivors', 'Elimination is more reliable than confirmation', 'Bash, WebSearch, WebFetch', NULL, 'Surviving hypothesis with evidence'),
('workflow-seed-root-cause', 5, 'Verify', 'Confirm the surviving hypothesis explains all symptoms and predict a consequence that can be checked', 'A good root cause analysis makes testable predictions beyond the original symptoms', 'Bash', NULL, 'Verified root cause with prediction');

-- ============ GENERATIVE WORKFLOWS ============

INSERT INTO workflows (id, name, description, status, coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity, archetype)
VALUES ('workflow-seed-cross-domain', 'Cross-Domain Transfer', 'Find solutions in field B for problems in field A. Goal: import proven techniques from analogous problems.', 'seed', 3, 5, 3, 3, 2, 'generative');

INSERT INTO workflow_steps (workflow_id, step_order, name, description, rationale, tools_required, skip_condition, outputs) VALUES
('workflow-seed-cross-domain', 1, 'Structure extraction', 'Abstract the problem to its structural essentials — strip domain-specific language', 'Domain-specific framing prevents finding structural analogues in other fields', NULL, NULL, 'Abstract problem structure'),
('workflow-seed-cross-domain', 2, 'Analogy search', 'Search for the abstract structure in unrelated domains', 'Semantic search across domains finds structural matches that keyword search misses', 'web_search_advanced_exa', NULL, 'Candidate analogies from other fields'),
('workflow-seed-cross-domain', 3, 'Transfer viability', 'For each analogy, assess whether the solution technique actually transfers — what assumptions does it depend on?', 'Not all structural similarities are deep enough for technique transfer', 'WebFetch, WebSearch', NULL, 'Viability assessment per analogy'),
('workflow-seed-cross-domain', 4, 'Adaptation design', 'For viable transfers, design the adaptation needed to apply the technique in the original domain', 'Pure transfer is rare; adaptation is the creative step', NULL, NULL, 'Adapted technique descriptions'),
('workflow-seed-cross-domain', 5, 'Novelty check', 'Verify that the transfer hasn''t already been made by someone else', 'Rediscovering known transfers wastes effort; finding them is still valuable (validates the approach)', 'WebSearch, web_search_exa', NULL, 'Novelty assessment');

INSERT INTO workflows (id, name, description, status, coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity, archetype)
VALUES ('workflow-seed-adversarial', 'Adversarial Stress-Test', 'Find the strongest objections to a proposal or claim. Goal: identify fatal flaws before investing resources.', 'seed', 2, 2, 3, 2, 3, 'generative');

INSERT INTO workflow_steps (workflow_id, step_order, name, description, rationale, tools_required, skip_condition, outputs) VALUES
('workflow-seed-adversarial', 1, 'Steelman', 'State the proposal in its strongest possible form', 'Attacking a weak version is useless; steelmanning ensures objections are meaningful', NULL, NULL, 'Steelmanned proposal'),
('workflow-seed-adversarial', 2, 'Attack surfaces', 'Identify every assumption the proposal depends on', 'Each assumption is a potential failure point', NULL, NULL, 'Assumption list'),
('workflow-seed-adversarial', 3, 'Strongest objections', 'For each assumption, generate the most compelling counter-argument or counter-evidence', 'The goal is to find the objection that the proposer would find hardest to answer', 'WebSearch, web_search_exa', NULL, 'Ranked objections with evidence'),
('workflow-seed-adversarial', 4, 'Survivability assessment', 'Which objections are fatal? Which are survivable? Which reveal something useful?', 'Not all objections are equal; triage by impact', NULL, NULL, 'Survivability matrix'),
('workflow-seed-adversarial', 5, 'Recommendation', 'If survivable: what needs to change? If fatal: what''s salvageable?', 'Even killed proposals often contain reusable sub-ideas', NULL, NULL, 'Conditional recommendation');

-- ============ APPLIED WORKFLOWS ============

INSERT INTO workflows (id, name, description, status, coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity, archetype)
VALUES ('workflow-seed-feasibility', 'Technical Feasibility Assessment', 'Determine if something can be built with current tools and reasonable effort. Goal: go/no-go decision with evidence.', 'seed', 2, 1, 5, 1, 4, 'applied');

INSERT INTO workflow_steps (workflow_id, step_order, name, description, rationale, tools_required, skip_condition, outputs) VALUES
('workflow-seed-feasibility', 1, 'Requirements decomposition', 'Break the proposed system into its minimal required capabilities', 'Feasibility is determined at the component level; the whole is feasible iff the parts are', NULL, NULL, 'Capability list'),
('workflow-seed-feasibility', 2, 'Existence check', 'For each capability, determine: does a ready-made solution exist?', 'Build-vs-buy at the component level is the first filter', 'WebSearch, web_search_exa, GitHub search', NULL, 'Availability matrix'),
('workflow-seed-feasibility', 3, 'Integration risk', 'For capabilities with existing solutions, assess integration complexity', 'Available components that don''t integrate are effectively unavailable', 'WebFetch, GitHub search', NULL, 'Integration risk per component'),
('workflow-seed-feasibility', 4, 'Gap analysis', 'For capabilities with no existing solution, estimate build effort', 'Gaps are where the real cost lives', NULL, NULL, 'Build effort estimates per gap'),
('workflow-seed-feasibility', 5, 'Verdict', 'Feasible / feasible with caveats / not feasible — with evidence for each capability', 'The verdict must be traceable back to specific capabilities', NULL, NULL, 'Structured feasibility verdict');

INSERT INTO workflows (id, name, description, status, coord_scope, coord_domain_structure, coord_evidence_type, coord_time_horizon, coord_fidelity, archetype)
VALUES ('workflow-seed-build-vs-buy', 'Build vs. Buy Analysis', 'Decide whether to build a capability in-house or adopt an existing solution. Goal: minimize total cost of ownership.', 'seed', 2, 1, 4, 3, 3, 'applied');

INSERT INTO workflow_steps (workflow_id, step_order, name, description, rationale, tools_required, skip_condition, outputs) VALUES
('workflow-seed-build-vs-buy', 1, 'Requirements', 'Define what the capability must do (functional) and how well (non-functional)', 'Requirements scope the search and prevent comparing unlike things', NULL, NULL, 'Requirement spec'),
('workflow-seed-build-vs-buy', 2, 'Option scan', 'Find existing solutions: open source, commercial, managed services', 'Comprehensive option scan prevents premature commitment to building', 'WebSearch, web_search_exa, GitHub search', NULL, 'Option list with basic profiles'),
('workflow-seed-build-vs-buy', 3, 'Fit assessment', 'For each option, score against requirements — what fits, what gaps remain', 'Gaps in existing solutions are the build cost of the "buy" path', 'WebFetch, firecrawl_scrape', NULL, 'Fit matrix'),
('workflow-seed-build-vs-buy', 4, 'Total cost comparison', 'Estimate: build cost + maintenance vs. buy cost + integration + lock-in risk', 'Upfront cost is misleading without maintenance and lock-in considerations', NULL, NULL, 'Cost comparison'),
('workflow-seed-build-vs-buy', 5, 'Recommendation', 'Recommend with explicit assumptions — what would change the recommendation?', 'Making assumptions explicit allows the recommendation to be updated as facts change', NULL, NULL, 'Conditional recommendation');
