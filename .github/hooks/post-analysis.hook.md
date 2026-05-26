# Post-Analysis Hook

## Overview

Runs AFTER the repository analysis phase. Validates analysis results.

## Steps

1. Validate analysis report exists and is complete
2. Check constraints (JDK 17 compatibility, Maven version)
3. Prepare for dependency collection

## Output

- Hook status: `.github/mend-resolver/logs/post-analysis-hook.log`
- Returns: `proceed` or `warn-and-proceed`
