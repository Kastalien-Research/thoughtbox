 # Mental Models
 
 The mental models toolhost serves structured reasoning frameworks as prompts and browsable resources.
 
 ## Operations
 
 - `get_model`: retrieve a model by name
 - `list_models`: list models (optionally filter by tags, AND logic)
 - `list_tags`: list tag taxonomy
 - `get_capability_graph`: emit a capability graph for knowledge graph initialization
 
 ## Tags
 
 - `debugging` — finding and fixing issues
 - `planning` — breakdown and sequencing
 - `decision-making` — choices under uncertainty
 - `risk-analysis` — what could go wrong
 - `estimation` — order-of-magnitude guesses
 - `prioritization` — impact vs effort
 - `communication` — explaining to humans
 - `architecture` — system design
 - `validation` — verifying assumptions
 
 ## Models
 
 - `rubber-duck` — Rubber Duck Debugging (debugging, communication)
 - `five-whys` — Five Whys (debugging, validation)
 - `pre-mortem` — Pre-mortem Analysis (risk-analysis, planning)
 - `assumption-surfacing` — Assumption Surfacing (validation, planning)
 - `steelmanning` — Steelmanning (decision-making, validation)
 - `trade-off-matrix` — Trade-off Matrix (decision-making, prioritization)
 - `fermi-estimation` — Fermi Estimation (estimation)
 - `abstraction-laddering` — Abstraction Laddering (architecture, communication)
 - `decomposition` — Decomposition (planning, architecture)
 - `adversarial-thinking` — Adversarial Thinking (risk-analysis, validation)
 - `opportunity-cost` — Opportunity Cost Analysis (decision-making, prioritization)
 - `constraint-relaxation` — Constraint Relaxation (planning, architecture)
 - `time-horizon-shifting` — Time Horizon Shifting (planning, decision-making)
 - `impact-effort-grid` — Impact/Effort Grid (prioritization)
 - `inversion` — Inversion (risk-analysis, planning)
 
 ## Resource browsing
 
 - `thoughtbox://mental-models` — root directory
 - `thoughtbox://mental-models/{tag}` — list by tag
 - `thoughtbox://mental-models/{tag}/{model}` — model content
 - `thoughtbox://mental-models/operations` — operations catalog
 
 ## Behavioral tests
 
 - `test-mental-models` / `thoughtbox://tests/mental-models`
