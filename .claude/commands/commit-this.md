---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
description: Generate detailed, well-structured commit messages from code changes
---

## Context (gathered upfront)

- Git status: !`git status --short`
- Staged changes: !`git diff --cached`
- Unstaged changes: !`git diff`

## Commit Guidelines

CRITICAL: NEVER mention Claude, AI, LLM, Anthropic, or add any AI attribution.

User notes: $ARGUMENTS

**Types:**
feat | fix | chore | style | refactor | test | build | perf | doc | task | i18n

**Format:**
```
<type>: <summary max 50 chars>

<description max 700 chars - bullet points, what + why>
```

## Your Task

Based on the context above:
1. If nothing staged, stage relevant files (use `git add -p` patterns or specific files)
2. Create commit with appropriate message using HEREDOC format
3. You MUST do all steps in a SINGLE message with parallel/chained tool calls

For i18n files, batch add: `git add src/i18n/ar/* src/i18n/cs/* ...` then commit separately.

**Execute now - no additional reads needed.**
