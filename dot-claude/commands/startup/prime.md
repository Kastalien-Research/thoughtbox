# Prime

Quick project priming command that provides essential project context and setup information.

## Command Structure

```bash
/prime [project_type]
```

## Parameters

- `project_type`: Optional project type (node, python, rust, general)

## Execution

### Basic Project Analysis

```bash
# Basic listing
ls -la --color=auto

# Find key configuration files
find . -maxdepth 2 -name "*.json" -o -name "*.toml" -o -name "*.yaml" -o -name "*.yml" | head -10

# Project structure overview
ls -R | grep ":$" | sed -e 's/://' -e 's/[^-][^\/]*\//--/g' -e 's/^/ /' -e 's/-/|/'
```

### Essential File Reading

```bash
# Read key project files
@README.md
@package.json
@Cargo.toml
@pyproject.toml
@src/index.ts
@src/server.ts
@src/main.py
@src/lib.rs
@src/tools/index.ts
```

### Project Context

Provides quick overview of:
- Project structure and key files
- Main entry points and configuration
- Available scripts and commands
- Dependencies and requirements
- Development workflow hints

## Example Usage

```bash
# Basic project priming
/prime

# Node.js project priming
/prime node

# Python project priming
/prime python

# Rust project priming
/prime rust
```

## Output Information

### Project Structure
- Directory layout and organization
- Key configuration files
- Source code entry points
- Documentation files

### Development Setup
- Available npm/yarn scripts
- Python virtual environment setup
- Rust cargo commands
- Docker configuration

### Quick Start Reminders
- How to run the development server
- Testing commands
- Build and deployment steps
- Common development tasks

## Project Type Specifics

### Node.js Projects
- Read package.json for scripts and dependencies
- Identify TypeScript/JavaScript entry points
- Show available npm/yarn commands
- Check for common frameworks

### Python Projects
- Read pyproject.toml, setup.py, requirements.txt
- Identify virtual environment setup
- Show pip/poetry commands
- Check for Django/Flask/FastAPI

### Rust Projects
- Read Cargo.toml for dependencies and metadata
- Identify main.rs or lib.rs entry points
- Show cargo commands
- Check for workspace configuration

### General Projects
- Identify project type from files
- Show generic project structure
- List configuration files
- Provide general development hints

## Integration with Other Commands

```bash
# Prime then analyze
/prime
/knowledge-graph "src/" --depth=2

# Prime then implement
/prime
/implement-spec "specs/feature-plan.md"

# Prime then debug
/prime
/systematic-debug "build failure"
```

## Best Practices

1. **Run Early**: Use at start of working on new projects
2. **Project Context**: Understand structure before making changes
3. **Development Workflow**: Learn the established patterns
4. **Documentation**: Read README and key files first
5. **Configuration**: Understand project configuration

## Learning Integration

The prime command learns to:
- Recognize project patterns more accurately
- Provide more relevant context
- Identify common issues faster
- Suggest better development workflows
- Remember project-specific preferences

This creates a smarter project onboarding experience that gets better at quickly providing the most relevant context for each project type.