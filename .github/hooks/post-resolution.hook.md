# Post-Resolution Hook

## Overview

This hook runs AFTER the CVE resolution phase completes. It validates the resolution results and prepares for build verification.

## Trigger

Automatically invoked by the resolver orchestrator after `cve-resolution-coordinator` returns.

## Steps

### 1. Validate Resolution Report
- Check `.github/mend-resolver/resolution-report.md` exists
- Verify it contains:
  - CVE fix entries
  - Dependency change summary
  - Constraints compliance checklist
- If report is missing, log error

### 2. Verify Constraints Compliance

Re-verify all hard constraints were respected:

```
Post-Resolution Constraint Verification:
□ No downgrades applied — check all old → new versions
□ JDK 17 compatibility maintained
□ Spring Boot versions aligned with 4.x series
□ Spring Framework versions aligned with 7.x series
□ All versions verified on Maven Central
□ No dependency conflicts introduced
□ All multi-module POMs updated consistently
```

### 3. Validate File Modifications
- Compare modified `pom.xml` files with backups
- Verify only expected changes were made
- Ensure no unintended modifications
- Verify XML syntax is valid in all modified files

### 4. Check for Pending Spring Upgrade
- If Spring Boot/Framework upgrade is needed, note it
- Ensure `spring-upgrade-log.md` is created if Spring versions changed

### 5. Log Hook Execution

```
[POST-RESOLUTION HOOK] <timestamp>
✅ Resolution report validated
✅ Constraints verified: All passed
✅ File modifications: N files changed as expected
✅ XML syntax: Valid in all modified files
✅ Spring upgrade: Required / Not needed
→ Proceeding to Build Verification phase
```

## Output

- Hook status written to `.github/mend-resolver/logs/post-resolution-hook.log`
- Returns: `proceed`, `warn-and-proceed`, or `stop` to orchestrator
