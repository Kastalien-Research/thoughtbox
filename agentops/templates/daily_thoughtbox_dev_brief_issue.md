<!--
    TEMPLATE: Daily Thoughtbox Dev Brief Issue
    This file is meant to be rendered by an automation job and posted as a GitHub Issue body.
    
    REQUIRED PLACEHOLDERS TO REPLACE:
    - {{DATE_LOCAL}}            e.g. 2026-01-28 (America/Chicago)
    - {{RUN_ID}}                unique id
    - {{JOB_NAME}}              e.g. thoughtbox_daily_proposals
    - {{JOB_VERSION}}           e.g. 0.1.0
    - {{GIT_SHA}}               repo SHA scanned
    - {{REPO_REF}}              e.g. main
    - {{TRACE_URL}}             LangSmith trace/experiment link (optional but recommended)
    - {{ARTIFACT_INDEX_URL}}    link to artifact listing (or “see workflow artifacts”)
    - {{BUDGET_SUMMARY}}        “max_cost=$10, max_minutes=30”
    - {{SOURCES_SUMMARY}}       brief list of sources scanned
    - {{DIGEST_BULLETS}}        bullet list (8–12)
    - {{PROPOSALS_SUMMARY}}     human-readable proposal sections (2–3)
    - {{PROPOSALS_JSON}}        machine-readable JSON payload (must be valid JSON)
    -->
    
    # 🧠 Thoughtbox Dev Brief — {{DATE_LOCAL}}
    
    **Run:** `{{RUN_ID}}`  
    **Job:** `{{JOB_NAME}}@{{JOB_VERSION}}`  
    **Repo ref:** `{{REPO_REF}}` @ `{{GIT_SHA}}`  
    **Budgets:** {{BUDGET_SUMMARY}}  
    **Trace:** {{TRACE_URL}}  
    **Artifacts:** {{ARTIFACT_INDEX_URL}}
    
    ---
    
    ## 1) Digest (ecosystem + signals)
    
    **Sources scanned (summary):**
    {{SOURCES_SUMMARY}}
    
    **Key items:**
    {{DIGEST_BULLETS}}
    
    ---
    
    ## 2) Proposals (choose 0–3)
    
    > Approval mechanism: apply label(s)  
    > - `approved:proposal-1`  
    > - `approved:proposal-2`  
    > - `approved:proposal-3`  
    >
    > To stop the pipeline: apply `hold` or `rejected`.
    
    {{PROPOSALS_SUMMARY}}
    
    ---
    
    ## 3) Notes / Questions for Human (only if needed)
    
    - _If none, write “None.”_
    - {{HUMAN_QUESTIONS_OR_NONE}}
    
    ---
    
    ## 4) Machine-readable payload (do not edit manually)
    
    This section is used by the label-trigger workflow to locate proposal specs deterministically.
    
    <!-- AGENTOPS_META_BEGIN
    {
      "run_id": "{{RUN_ID}}",
      "job_name": "{{JOB_NAME}}",
      "job_version": "{{JOB_VERSION}}",
      "repo_ref": "{{REPO_REF}}",
      "git_sha": "{{GIT_SHA}}",
      "date_local": "{{DATE_LOCAL}}"
    }
    AGENTOPS_META_END -->
    
    <details>
      <summary><strong>proposals.json</strong> (for automation)</summary>

    ```json
{{PROPOSALS_JSON}}
    ```
    </details>