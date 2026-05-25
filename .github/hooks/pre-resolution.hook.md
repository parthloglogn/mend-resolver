# Pre-Resolution Hook

## Overview

This hook runs BEFORE the CVE resolution phase begins. It validates that all prerequisites are met and prepares the workspace for resolution.

## Trigger

Automatically invoked by the resolver orchestrator before delegating to `cve-resolution-coordinator`.

## Steps

### 1. Validate Dependency Collection Results
- Check `.github/mend-resolver/dependency-map.json` exists
- Verify it contains dependency entries
- If missing or empty, report error and STOP

### 2. Validate Mend Report
- Check Mend report is loaded and parsed
- Verify `.github/mend-resolver/mend-report-parsed.json` exists
- Confirm CVE entries are present
- If no CVEs found, log warning and ask user if they want to proceed with Spring upgrade only

### 3. Validate Constraint Compliance Checklist

Before resolution starts, verify:

```
Pre-Resolution Constraint Checklist:
□ No downgrades policy acknowledged
□ JDK 17 compatibility will be enforced
□ Spring Boot 4.x target noted
□ Spring Framework 7.x target noted
□ Maven Central verification will be performed
□ Conflict checks will be performed
□ Multi-module awareness confirmed
```

### 4. Create Git Branch for Changes (if git available)
- Check if git repository
- If yes, create branch: `mend-resolver/cve-fixes-<timestamp>`
- This isolates all changes for review

### 5. Backup Original POMs
- Create `.github/mend-resolver/backups/` directory
- Copy all `pom.xml` files that will be modified:
  ```bash
  # For each pom.xml that contains a dependency with a CVE
  cp module-a/pom.xml .github/mend-resolver/backups/module-a-pom.xml
  ```

### 6. Log Hook Execution

```
[PRE-RESOLUTION HOOK] <timestamp>
✅ Dependency map validated: N dependencies across M modules
✅ Mend report validated: N CVEs to resolve
✅ Constraint checklist: All confirmed
✅ Git branch: mend-resolver/cve-fixes-20260115103000
✅ POM backups: N files backed up
→ Proceeding to CVE Resolution phase
```

## Output

- Hook status written to `.github/mend-resolver/logs/pre-resolution-hook.log`
- Returns: `proceed`, `warn-and-proceed`, or `stop` to orchestrator

## Error Handling

| Condition | Action |
|-----------|--------|
| No dependency map | Report error, STOP |
| No CVEs in Mend report | Log warning, ask user to proceed with Spring upgrade only |
| Git branch creation fails | Log warning, proceed without branch |
| POM backup fails | Log warning, proceed with caution |
