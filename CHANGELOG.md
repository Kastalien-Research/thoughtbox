# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- OODA loops available as MCP resources (`thoughtbox://loops/{category}/{name}`) with automatic usage analytics that enable codebase learning over time
- Specification workflow prompts for systematic spec design, validation, and multi-spec orchestration
- `/mcp__thoughtbox__spec-designer` - Design specs from prompts using OODA loops
- `/mcp__thoughtbox__spec-validator` - Validate specs against codebase architecture
- `/mcp__thoughtbox__spec-orchestrator` - Implement multi-spec projects with OR principles
- `/mcp__thoughtbox__specification-suite` - Full design → validate → orchestrate lifecycle
- Loop catalog API at `thoughtbox://loops/catalog` with metadata, classification, and composition rules
- Analytics refresh endpoint at `thoughtbox://loops/analytics/refresh` for on-demand metrics aggregation
- ClaudeFolderIntegration class for `.claude/` folder integration with graceful degradation
- Expand cipher as protocol layer with domain vocabulary ([8d38b7b](../../commit/8d38b7b153ea35da6bb04cbe18832a6caaf98afe))
- Make gateway the sole MCP entry point ([1755b7f](../../commit/1755b7f79f85c9f882afb39b08d29f44180d33b7))
- **gateway**: Add always-on routing tool for streaming HTTP clients ([6fe6f94](../../commit/6fe6f947fb09f1ea3b86b8e7e4304e29f676f332))
- **init**: Add init workflow and state management ([ee09197](../../commit/ee09197f0a9fc85a44d85f8ecab43609879ec654))
- **tools**: Add progressive disclosure system ([b12936e](../../commit/b12936e66b2bc30ea60ba3446e80462acaf910a6))
- **persistence**: Add FileSystemStorage with atomic writes ([d6a18c0](../../commit/d6a18c03ccc5016b2667b7be661e3e0a5cd10da2))
- complete nuanced frameworks in skill ([175225a](../../commit/175225a9b25912a965a0daadfc1c29d7080df0e9))
- add thoughtbox-cognitive Claude skill ([67ee12d](../../commit/67ee12d1a95be3e3fc49c0eddf564d8b90c0b31c))
- Add specification workflows, OODA loops MCP, and automated changelog ([f336a0d](../../commit/f336a0de7d6c805b95a8c05e1c0ae013b2da493b))
- **sil**: Implement SIL bootstrap specs (100-104) ([d18589c](../../commit/d18589cffc0df312d0dba53fd0c38b9869f0e03b))
- **observatory**: Add semantic anchors, revision tracking, and event emission ([ba78b70](../../commit/ba78b70192cf05144fd64471675157b3da3c4883))
- **persistence**: Add RevisionMetadata and revisionAnalysis to export ([273d6df](../../commit/273d6df590f01a63bcf8510a8d4b986d866e7d81))
- **persistence**: Add revision metadata and linked thought store enhancements ([e9c15ed](../../commit/e9c15ed7b178dc5a78ebb3da5a4c2628533d5997))
- **benchmarks**: Add SIL benchmark harness components ([39c0542](../../commit/39c0542be750b41f66be77ecb23417b5b3309b5a))

### Changed
- Build pipeline now includes OODA loop embedding step (`npm run embed-loops`)
- Loop catalog automatically sorted by usage frequency when `.claude/thoughtbox/hot-loops.json` available
- Build scripts consolidated to `npm run embed` (runs both template and loop embedding)
- Added `gray-matter` dependency for YAML frontmatter parsing in loop embedding
- Created `scripts/embed-loops.ts` for build-time loop catalog generation
- Created `src/claude-folder-integration.ts` for usage analytics with atomic append operations
- Loop usage recorded to `.claude/thoughtbox/loop-usage.jsonl` with three aggregation triggers
- Remove retry delays, direct users to gateway instead ([d2957ef](../../commit/d2957ef12ecbfa0adf7725196966062ab02ea06f))
- **server**: Consolidate server factory and handlers ([cd37ef4](../../commit/cd37ef4342a6da09915595091970cc471abfaf83))
- **server**: Consolidate server factory and handlers ([5e83a29](../../commit/5e83a29ab28697f711c3251e10dce986c50264e7))
- modularize skill into small-world network ([ba92f8b](../../commit/ba92f8b55ac704d533b874d4a1dd1c0c1f38e2e1))
- optimize skill - remove 94% redundancy ([bf3c293](../../commit/bf3c29304358051214f0b1bd451535fd8d73dd39))
- **tests**: Move test files from src/ to tests/unit/ ([dfd094e](../../commit/dfd094ed37bcc2d842f33879f62fd15840771dd5))

### Fixed
- Support tag array filtering in mental models list_models ([7ed978e](../../commit/7ed978e40132cf395968fc8844296c1c471bc26e))
- Restore gateway-only architecture ([d69d633](../../commit/d69d63397bf35f6f111d9f30e0c221ec7a568822))
- Add missing imports in server-factory.ts ([22fad66](../../commit/22fad6635c6e9c0919f5b21976093056bbfa28d3))
- Enforce branchId requires branchFromThought ([87b8691](../../commit/87b86918efff2501a088c27ed07aabceb83a5ab2))
- **init**: Add missing await keywords and fix interface violation ([28f901e](../../commit/28f901eebde40b019019dde30408aec164e74f32))
- **benchmark**: Correct start_new args in test configs ([dd90077](../../commit/dd900774611d034ab1ab338447a50782237c49d0))
- **imports**: Update Logger import path in claude-folder-integration ([f5ae62c](../../commit/f5ae62cc7da4bbd2e5ddcd1ffc2ef281901c3289))
- **changelog**: Add required permissions for PR comments in GitHub Action ([5b7c2da](../../commit/5b7c2daf041182a49c163ba32711ebc3e200eca3))
- **thought-handler**: Fix queue error handling to prevent retry loops ([79d057c](../../commit/79d057c675c98e85e283e87cca5fbb6d3554b8c9))
- **thought-handler**: Serialize concurrent thought processing to prevent race condition ([22d6cc1](../../commit/22d6cc16aba64a01235eab621228ad3faecc4062))
- **persistence**: Use index map for most-revised thought lookup ([4f948ce](../../commit/4f948ce0e73acb692e97a2b1ad91ba42eb68375a))
- **persistence**: Fix revision analysis bugs and add missing modules ([b256915](../../commit/b2569151eb9a07befdd7d96a4e54c1474342d169))
- **docs**: Remove reference to non-existent .claude/rules/RULES.md ([3f91b85](../../commit/3f91b8501ad30609ddb0348497a688762cab5675))
## [1.2.2] - 2026-01-15

### Added
- Gateway tool as sole MCP entry point for progressive disclosure
- Mental models tag array filtering support

### Fixed
- branchId validation now enforces branchFromThought requirement to prevent orphan nodes
- Gateway-only architecture restored after regression
- Missing imports in server-factory.ts

### Changed
- Cipher expanded as protocol layer with domain vocabulary
- Removed unused folders and obsolete thick_read test suite

## [1.2.1] - 2026-01-10

### Fixed
- Session recovery improvements
- Export format corrections

## [1.2.0] - 2026-01-08

### Added
- Progressive disclosure system with tool registry
- Session analysis capabilities
- Behavioral testing framework

### Changed
- Refactored server-factory for better modularity
- Improved thought handler architecture

## [1.1.0] - 2025-12-20

### Added
- Mental models tool with tag-based filtering
- Notebook tool with template support
- Session persistence to filesystem

### Changed
- Migrated from in-memory to file-based storage
- Improved cipher notation system

## [1.0.0] - 2025-12-01

### Added
- Initial release of Thoughtbox MCP server
- Thought tool for structured reasoning
- Cipher notation for token efficiency
- Basic session management
- HTTP and stdio transport support

---

## Versioning Guidelines

This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR** version (X.0.0): Incompatible API changes
- **MINOR** version (0.X.0): New functionality (backwards compatible)
- **PATCH** version (0.0.X): Bug fixes (backwards compatible)

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: New feature (→ Added section, MINOR version bump)
- `fix`: Bug fix (→ Fixed section, PATCH version bump)
- `perf`: Performance improvement (→ Changed section, PATCH)
- `refactor`: Code refactor (→ Changed section, PATCH)
- `docs`: Documentation (→ omitted or Changed, no version bump)
- `test`: Tests (→ omitted, no version bump)
- `chore`: Maintenance (→ omitted, no version bump)
- `security`: Security fix (→ Security section, PATCH or MINOR)
- `breaking` or `!` suffix: Breaking change (→ MAJOR version bump)

**Examples**:
```bash
# New feature (MINOR bump)
git commit -m "feat(loops): Add OODA loops MCP integration"

# Bug fix (PATCH bump)
git commit -m "fix(analytics): Resolve concurrent write issue"

# Breaking change (MAJOR bump)
git commit -m "feat!: Remove deprecated thoughtbox_v1 tool"

# With scope and body
git commit -m "perf(catalog): Cache hot-loops.json" -m "Reduces catalog generation time by 80%"
```

## For Agents Creating Commits

**IMPORTANT**: When creating git commits, you MUST use Conventional Commits format.

**Quick Reference**:
- New feature? `feat(scope): description`
- Bug fix? `fix(scope): description`
- Breaking change? Add `!` after type: `feat!: description`

See [Conventional Commits](https://www.conventionalcommits.org/) for full specification.
