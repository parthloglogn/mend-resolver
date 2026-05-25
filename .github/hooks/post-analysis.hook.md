# Post-Analysis Hook

## Overview

This hook runs AFTER the repository analysis phase completes. It validates the analysis results and prepares for dependency collection.

## Trigger

Automatically invoked by the resolver orchestrator after `analysis-coordinator` returns.

## Steps

### 1. Validate Analysis Report
- Check `.github/mend-resolver/analysis-report.md` exists
- Verify report contains required sections:
  - Project type (Maven/Gradle)
  - Module structure
  - Spring versions
  - Java version
- If report is incomplete, log warning

### 2. Validate Project Constraints

Check against hard constraints:

| Constraint | Check | Action if Violated |
|------------|-------|-------------------|
| JDK 17 | Java version must be <= 17 | If > 17, note incompatibility |
| Maven 3.9.x | Maven version should be 3.9.x | If different, note in report |
| Spring Boot | Any version is fine (will be upgraded) | No action needed |
| Spring Framework | Any version is fine (will be upgraded) | No action needed |

### 3. Prepare for Dependency Collection
- Ensure `.github/mend-resolver/dependency-map.json` path is ready
- Note the build tool type for the dependency-collector skill
- List module paths for multi-module projects

### 4. Log Hook Execution

```
[POST-ANALYSIS HOOK] <timestamp>
✅ Analysis report validated
✅ Project constraints checked
   - JDK: 17 (✅ compatible)
   - Maven: 3.9.6 (✅ compatible)
   - Spring Boot: 3.2.0 (will upgrade to 4.x)
   - Modules: 3 modules detected
→ Proceeding to Dependency Collection phase
```

## Output

- Hook status written to `.github/mend-resolver/logs/post-analysis-hook.log`
- Returns: `proceed` or `warn-and-proceed` to orchestrator
