# Pre-Analysis Hook

## Overview

Runs BEFORE the repository analysis phase. Performs validation and setup.

## Steps

1. Validate project directory contains build files (`pom.xml` or `build.gradle`)
2. Check for Git repository
3. Initialize `.github/mend-resolver/` workspace
4. Validate Mend report if provided upfront

## Output

- Hook status: `.github/mend-resolver/logs/pre-analysis-hook.log`
- Returns: `proceed` or `stop`
