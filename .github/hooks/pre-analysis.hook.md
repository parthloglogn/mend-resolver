# Pre-Analysis Hook

## Overview

This hook runs BEFORE the repository analysis phase begins. It performs validation and setup tasks to ensure the analysis can proceed smoothly.

## Trigger

Automatically invoked by the resolver orchestrator before delegating to `analysis-coordinator`.

## Steps

### 1. Validate Project Directory
- Confirm the project root directory exists
- Confirm it contains build files (`pom.xml` or `build.gradle`)
- If no build files found, report error and STOP

### 2. Check for Git Repository
- Verify `.git` directory exists
- If not a git repo, note this (not a blocker, but changes won't be version-controlled)

### 3. Check for Existing Mend Resolver State
- Look for `.github/mend-resolver/` directory
- If exists from previous run, backup old results:
  - Rename to `.github/mend-resolver-backup-<timestamp>/`
- Create fresh `.github/mend-resolver/` directory structure:
  ```
  .github/mend-resolver/
  ├── logs/
  ├── analysis-report.md
  ├── dependency-map.json
  ├── mend-report-parsed.json
  ├── resolution-report.md
  ├── change-log.md
  ├── spring-upgrade-log.md
  └── build-report.md
  ```

### 4. Validate Mend Report (if provided upfront)
- If user provided Mend report path, verify file exists
- Verify it's a valid Mend report format
- If invalid, report error and STOP

### 5. Log Hook Execution

```
[PRE-ANALYSIS HOOK] <timestamp>
✅ Project directory valid
✅ Build files found: pom.xml
✅ Git repository: Yes/No
✅ Workspace initialized: .github/mend-resolver/
✅ Mend report: Valid / Not provided yet
→ Proceeding to Analysis phase
```

## Error Handling

| Condition | Action |
|-----------|--------|
| No build files | Report error, STOP |
| Invalid Mend report format | Report error, ask user to provide valid report |
| Cannot create workspace | Report error, check permissions |
| Mend report file not found | Report error, ask user to check path |

## Output

- Hook status written to `.github/mend-resolver/logs/pre-analysis-hook.log`
- Returns: `proceed` or `stop` to orchestrator
