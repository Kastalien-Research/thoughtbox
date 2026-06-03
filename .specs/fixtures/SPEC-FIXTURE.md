---
spec_id: SPEC-FIXTURE
title: Validator Fixture Spec
status: active
date: 2026-06-02
claims:
  - id: c1
    statement: validate:pr resolves spec_claim_id references against spec frontmatter claims
    type: implementation
    behavioral: false
    required_evidence: Running validate:pr against a PR referencing SPEC-FIXTURE:c1 exits zero
  - id: c2
    statement: Behavioral spec claims require agentic_test or human_attestation evidence in PR JSON
    type: behavioral
    behavioral: true
    required_evidence: PR with behavioral spec claim and unit_test evidence_type fails validation
---

# Validator Fixture Spec

This spec exists only to exercise the spec-frontmatter PR validation pipeline. Do not use it for product planning.
