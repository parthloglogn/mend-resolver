# Pre-Resolution Hook

## Overview

Runs BEFORE the CVE resolution phase. Validates prerequisites.

## Steps

1. Validate dependency map exists
2. Validate Mend report is loaded with topFix data
3. Confirm constraint checklist
4. Create git branch for changes: `mend-resolver/cve-fixes-<timestamp>`
5. Backup original POMs

## Output

- Hook status: `.github/mend-resolver/logs/pre-resolution-hook.log`
- Returns: `proceed`, `warn-and-proceed`, or `stop`
