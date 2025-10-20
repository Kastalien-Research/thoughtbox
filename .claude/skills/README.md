# Skills

Skills are folders of instructions, scripts, and resources that Claude loads dynamically to improve performance on specialized tasks. Skills teach Claude how to complete specific tasks in a repeatable way, whether that's creating documents with your company's brand guidelines, analyzing data using your organization's specific workflows, or automating personal tasks.

For more information, check out:
- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- [How to create custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)
- [Equipping agents for the real world with Agent Skills](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

# About This Repository

This repository contains example skills that demonstrate what's possible with Claude's skills system. These examples range from creative applications (art, music, design) to technical tasks (testing web apps, MCP server generation) to enterprise workflows (communications, branding, etc.).

Each skill is self-contained in its own directory with a `SKILL.md` file containing the instructions and metadata that Claude uses. Browse through these examples to get inspiration for your own skills or to understand different patterns and approaches.

# Skills List

This repository includes a mix of development workflow skills, MCP-specific skills, and example skills demonstrating different capabilities:

## Development Workflows
- **brainstorming** - Refine rough ideas into fully-formed designs through structured Socratic questioning and alternative exploration
- **executing-plans** - Execute implementation plans in controlled batches with review checkpoints
- **finishing-a-development-branch** - Complete development work with proper testing, verification, and merge procedures
- **receiving-code-review** - Respond to code review feedback effectively
- **requesting-code-review** - Request code reviews with proper context and information
- **subagent-driven-development** - Execute plans by dispatching fresh subagents per task with code review between tasks
- **writing-plans** - Create comprehensive implementation plans with exact file paths and verification steps
- **using-git-worktrees** - Set up isolated workspaces for parallel development using git worktrees

## Testing & Quality
- **test-driven-development** - Write tests first, watch them fail, write minimal code to pass
- **testing-anti-patterns** - Common testing mistakes and how to avoid them
- **testing-skills-with-subagents** - Verify skills work under pressure by testing with subagents
- **verification-before-completion** - Verify all requirements are met before marking work complete

## Debugging & Problem Solving
- **systematic-debugging** - Four-phase framework ensuring root cause investigation before fixes
- **root-cause-tracing** - Backward tracing technique for deep call stack errors
- **condition-based-waiting** - Replace arbitrary timeouts with condition polling for reliable async tests
- **defense-in-depth** - Add validation at multiple layers for robust systems

## Collaboration & Communication
- **dispatching-parallel-agents** - Coordinate multiple agents working on independent tasks
- **sharing-skills** - Share and distribute skills effectively

## MCP Development
- **mcp-builder** - Guide for creating high-quality MCP servers to integrate external APIs and services
- **mcp-client-builder** - Guide for creating high-quality MCP clients to consume external capabilities through Model Context Protocol
- **model-enhancement-mcp** - Guide for creating non-wrapper MCP servers that provide structured workspaces for Claude to track reasoning workflows and memory

## Enterprise & Communication
- **internal-comms** - Write internal communications like status reports, newsletters, and FAQs

## Web Testing
- **webapp-testing** - Toolkit for interacting with and testing local web applications using Playwright

## Meta Skills
- **skill-creator** - Guide for creating effective skills that extend Claude's capabilities
- **writing-skills** - Apply TDD to skill creation by testing with subagents before deployment
- **template-skill** - A basic template to use as a starting point for new skills

# Document Skills

The `document-skills/` subdirectory contains skills that Anthropic developed to help Claude create various document file formats. These skills demonstrate advanced patterns for working with complex file formats and binary data:

- **docx** - Create, edit, and analyze Word documents with support for tracked changes, comments, formatting preservation, and text extraction
- **pdf** - Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms
- **pptx** - Create, edit, and analyze PowerPoint presentations with support for layouts, templates, charts, and automated slide generation
- **xlsx** - Create, edit, and analyze Excel spreadsheets with support for formulas, formatting, data analysis, and visualization

# Try in Claude Code

## Claude Code
You can register this repository as a Claude Code Plugin marketplace by running the following command in Claude Code:
```
/plugin marketplace add anthropics/skills
```

Then, to install a specific set of skills:
1. Select `Browse and install plugins`
2. Select `anthropic-agent-skills`
3. Select `document-skills` or `example-skills`
4. Select `Install now`

Alternatively, directly install either Plugin via:
```
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

After installing the plugin, you can use the skill by just mentioning it. For instance, if you install the `document-skills` plugin from the marketplace, you can ask Claude Code to do something like: "Use the PDF skill to extract the form fields from path/to/some-file.pdf"


# Creating a Basic Skill

Skills are simple to create - just a folder with a `SKILL.md` file containing YAML frontmatter and instructions. You can use the **template-skill** in this repository as a starting point:

```markdown
---
name: my-skill-name
description: A clear description of what this skill does and when to use it
---

# My Skill Name

[Add your instructions here that Claude will follow when this skill is active]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2
```

The frontmatter requires only two fields:
- `name` - A unique identifier for your skill (lowercase, hyphens for spaces)
- `description` - A complete description of what the skill does and when to use it