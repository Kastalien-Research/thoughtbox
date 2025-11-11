# Thoughtbox Templates

This directory contains pre-structured notebook templates that provide scaffolding and guidance for common workflows.

## Available Templates

### sequential-feynman-template.src.md

A comprehensive template for the Sequential Feynman learning workflow. Guides agents through:
- Research and synthesis
- Feynman-style explanation (teach it simply)
- Three cycles of refinement
- Expert re-encoding of patterns
- Meta-reflection and validation

**Use when:** Learning complex technical concepts that require deep validation before creating skills or documentation.

**Instantiate with:**
```javascript
create_notebook({
  path: "notebooks/feynman-[topic].src.md",
  template: "sequential-feynman",
  topic: "Your Topic Name"
})
```

## Template Format

Templates are written in the `.src.md` notebook format used by Thoughtbox. They contain:
- Pre-structured markdown and code cells
- Embedded prompts and guidance
- Progress tracking mechanisms
- Placeholders for topic-specific content (e.g., `[TOPIC]`)

## Creating New Templates

1. Design the template structure and cell sequence
2. Write template as `.src.md` file in this directory
3. Use placeholders like `[TOPIC]`, `[DATE]` for substitution
4. Update notebook tool to recognize the template name
5. Document the template in this README