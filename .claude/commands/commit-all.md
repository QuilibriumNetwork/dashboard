---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
description: Generate detailed, well-structured commit messages from code changes
---

## Context (gathered upfront)

- Git status: !`git status --short`
- All changes: !`git diff HEAD`

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

Based on the context above, commit ALL modified files in a single commit:

```bash
git add -A && git commit -m "$(cat <<'EOF'
<type>: <summary>

<description>
EOF
)"
```

You MUST execute this in a SINGLE message. No additional file reads needed - use the context above.

**Execute now.**
