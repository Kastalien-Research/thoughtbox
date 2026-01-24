# Research Papers

This folder contains research papers relevant to the Thoughtbox project.

## Papers

### 1. Meta-Prompt Optimization for LLM-Based Sequential Decision Making
**Authors:** Mingze Kong, Zhiyong Wang, Yao Shu, Zhongxiang Dai  
**Affiliation:** CUHK Shenzhen, CUHK, HKUST (Guangzhou)  
**File:** `expo-meta-prompt-optimization.md`  
**URL:** https://openreview.net/pdf?id=JPYOjDuZg8

**Key Ideas:**
- Automatically optimizes meta-prompts for LLM-based agents in sequential decision-making
- Handles non-stationary reward observations using adversarial bandit algorithms
- EXPO algorithm optimizes task description and meta-instruction
- EXPO-ES extends to optimize exemplar selection and ordering
- Significantly improves LLM-based Bayesian optimization and multi-armed bandits

**Relevance to Thoughtbox:**
- Meta-prompt optimization could improve Thoughtbox's system prompts and instructions
- Adversarial bandit approach applicable to optimizing mental model selection
- Exemplar selection relevant to thought history management

---

### 2. Efficient Sequential Decision Making with Large Language Models
**Authors:** Dingyang Chen, Qi Zhang, Yinglun Zhu  
**Affiliation:** University of South Carolina, UC Riverside  
**Conference:** EMNLP 2024  
**File:** `efficient-sequential-decision-making-llms.md`  
**URL:** https://aclanthology.org/2024.emnlp-main.517.pdf

**Key Ideas:**
- Leverages online model selection to balance LLM agents and traditional algorithms
- Avoids expensive fine-tuning by using off-the-shelf pretrained LLMs
- Calls LLMs in only 1.5-6% of time steps while achieving 6x performance gain
- Uses log-barrier online mirror descent (CORRAL) for adaptive balancing
- Demonstrates effectiveness with models as small as 80M parameters

**Relevance to Thoughtbox:**
- Efficient LLM usage patterns applicable to Thoughtbox's tool usage
- Online model selection approach could optimize when to use different reasoning strategies
- Demonstrates that smaller models can be effective with proper algorithmic support

---

## Notes

Papers scraped using Firecrawl MCP on 2026-01-24.
