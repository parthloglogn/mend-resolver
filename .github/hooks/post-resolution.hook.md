# Post-Resolution Hook

## Overview

Runs AFTER the CVE resolution phase. Validates resolution results.

## Steps

1. Validate resolution report exists
2. Verify constraints compliance (no downgrades, JDK 17, etc.)
3. Compare modified POMs with backups
4. Check for pending Spring upgrade

## Output

- Hook status: `.github/mend-resolver/logs/post-resolution-hook.log`
- Returns: `proceed`, `warn-and-proceed`, or `stop`
