# Post-Build Hook

## Overview

This hook runs AFTER the build verification phase completes. It finalizes the Mend Resolver workflow and generates the final summary.

## Trigger

Automatically invoked by the resolver orchestrator after `build-verification` agent returns.

## Steps

### 1. Validate Build Report
- Check `.github/mend-resolver/build-report.md` exists
- Verify build status is recorded

### 2. Generate Final Summary

Write `.github/mend-resolver/FINAL_SUMMARY.md`:

```markdown
# Mend Resolver — Final Summary

## Workflow Results

### Repository Analysis
- **Status**: ✅ Complete
- **Project**: [project name]
- **Type**: Maven/Gradle, Single/Multi-module (N modules)
- **Java**: [version]
- **Spring Boot**: [old] → [new]
- **Spring Framework**: [old] → [new]

### Dependency Collection
- **Status**: ✅ Complete
- **Total Dependencies**: N
- **Explicit Version Overrides**: N (high-risk for CVEs)

### Mend Report
- **Status**: ✅ Loaded
- **Total CVEs**: N
- **CRITICAL**: N | **HIGH**: N | **MEDIUM**: N | **LOW**: N

### CVE Resolution
- **Status**: ✅ Complete
- **CVEs Fixed**: N / N
- **Dependencies Changed**: N
- **Constraints Violated**: 0

### Build Verification
- **Status**: ✅ Passed / ❌ Failed
- **Attempts**: N
- **Tests**: N passed, N failed, N skipped

## Files Modified
| File | Change Description |
|------|-------------------|
| pom.xml | Upgraded Spring Boot to 4.x.x |
| ... | ... |

## Hard Constraints Compliance
| Constraint | Status |
|------------|--------|
| No Downgrades | ✅ Passed |
| JDK 17 Compatible | ✅ Passed |
| Spring Boot 4.x | ✅ Passed |
| Spring Framework 7.x | ✅ Passed |
| Maven Central Verified | ✅ Passed |
| Conflict Checked | ✅ Passed |
| Multi-Module Aware | ✅ Passed |

## Next Steps
- [ ] Review changes in git branch: `mend-resolver/cve-fixes-<timestamp>`
- [ ] Run integration tests
- [ ] Deploy to staging environment
- [ ] Create pull request with changes

## Reports
- Full analysis: `.github/mend-resolver/analysis-report.md`
- Dependency map: `.github/mend-resolver/dependency-map.json`
- Resolution report: `.github/mend-resolver/resolution-report.md`
- Change log: `.github/mend-resolver/change-log.md`
- Build report: `.github/mend-resolver/build-report.md`
```

### 3. Commit Changes (if git available)
- Stage all modified `pom.xml` / `build.gradle` files
- Commit with message:
  ```
  mend-resolver: Resolve CVEs and upgrade Spring Boot

  - Resolved N CVEs from Mend report
  - Upgraded Spring Boot to 4.x.x
  - Upgraded Spring Framework to 7.x.x
  - All versions verified on Maven Central
  - Build: passing
  ```

### 4. Cleanup
- Remove temporary files
- Keep reports and logs for reference

### 5. Log Hook Execution

```
[POST-BUILD HOOK] <timestamp>
✅ Build report validated
✅ Final summary generated: .github/mend-resolver/FINAL_SUMMARY.md
✅ Changes committed: [commit hash]
✅ Cleanup complete
→ Mend Resolver workflow complete
```

## Output

- Hook status written to `.github/mend-resolver/logs/post-build-hook.log`
- Final summary at `.github/mend-resolver/FINAL_SUMMARY.md`
- Returns: `complete` to orchestrator
