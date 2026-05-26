# Pre-Build Hook

## Overview

Runs BEFORE the build verification phase. Ensures environment is ready.

## Steps

1. Validate environment (JAVA_HOME=JDK 17, Maven 3.9.x)
2. Clean workspace (remove `target/` directories)
3. Validate modified POMs have valid XML syntax
4. Check disk space

## Output

- Hook status: `.github/mend-resolver/logs/pre-build-hook.log`
- Returns: `proceed` or `stop`
