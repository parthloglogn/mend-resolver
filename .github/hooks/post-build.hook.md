# Post-Build Hook

## Overview

Runs AFTER the build verification phase. Finalizes the workflow.

## Steps

1. Validate build report exists
2. Generate `FINAL_SUMMARY.md` with complete workflow results
3. Commit changes if git available
4. Cleanup temporary files

## Output

- Hook status: `.github/mend-resolver/logs/post-build-hook.log`
- Final summary: `.github/mend-resolver/FINAL_SUMMARY.md`
- Returns: `complete`
