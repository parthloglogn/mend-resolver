# Pre-Build Hook

## Overview

This hook runs BEFORE the build verification phase. It ensures the environment is ready for a clean build.

## Trigger

Automatically invoked by the resolver orchestrator before delegating to `build-verification` agent.

## Steps

### 1. Environment Validation
- Verify `JAVA_HOME` is set to JDK 17
- Verify Maven 3.9.x is available
- Check for Maven wrapper preference

### 2. Clean Workspace
- Remove any previous build artifacts:
  ```bash
  rm -rf target/ */target/ */*/target/
  rm -rf build/ */build/
  ```
- Remove Maven local cache for modified dependencies (optional, for clean resolution):
  ```bash
  rm -rf ~/.m2/repository/<modified-groupId>/<modified-artifactId>/
  ```

### 3. Validate Modified POMs
- Run XML syntax check on all modified `pom.xml` files
- Ensure no malformed XML was introduced during resolution

### 4. Check Disk Space
- Ensure sufficient disk space for build (at least 1GB recommended)

### 5. Log Hook Execution

```
[PRE-BUILD HOOK] <timestamp>
✅ Environment: JAVA_HOME=JDK17, Maven=3.9.x
✅ Workspace cleaned: target/ directories removed
✅ POM validation: All N modified files valid XML
✅ Disk space: X GB available
→ Proceeding to Build Verification phase
```

## Output

- Hook status written to `.github/mend-resolver/logs/pre-build-hook.log`
- Returns: `proceed` or `stop` to orchestrator
