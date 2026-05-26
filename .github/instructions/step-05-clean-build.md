# Step 5: Clean & Build

## Objective

Run `mvn clean install` (or Gradle equivalent) to verify the project builds successfully after all CVE fixes. Confirm all CVE fixes are preserved in the build.

## Prerequisites

- Steps 1-4 complete
- All CVE fixes applied one by one
- Pre-build hook passed

## Steps

### 5.1 Environment Setup

```bash
# Verify JDK 17
export JAVA_HOME=/path/to/jdk-17
java -version  # Should show Java 17

# Verify Maven 3.9.x
mvn --version

# Check for wrapper
ls mvnw  # Prefer wrapper if present
```

### 5.2 Run Clean Build

**Maven with Wrapper (preferred):**
```bash
cd <project-root>
JAVA_HOME=/path/to/jdk-17 ./mvnw clean install
```

**Maven without Wrapper:**
```bash
cd <project-root>
JAVA_HOME=/path/to/jdk-17 mvn clean install
```

**Gradle:**
```bash
cd <project-root>
JAVA_HOME=/path/to/jdk-17 ./gradlew clean build
```

### 5.3 Build Options

```bash
# Skip tests initially (run tests after compilation passes)
./mvnw clean install -DskipTests

# Then run tests separately
./mvnw test

# Parallel build for multi-module
./mvnw clean install -T 4
```

### 5.4 Handle Build Failures (Max 10 Attempts)

**For each failure:**

1. **Read the error** -- identify error type
2. **Categorize**:
   - Compilation error
   - Dependency resolution error
   - Test failure
   - Plugin error
3. **Apply minimal fix**
4. **Rebuild**

**Common Errors and Fixes:**

| Error Type | Example | Fix |
|------------|---------|-----|
| Compilation error | `cannot find symbol class X` | Update code to use new API |
| Package not found | `package org.springframework.X does not exist` | Update imports |
| Class version mismatch | `class file has wrong version 61.0` | Find JDK 17-compatible version |
| Dependency not found | `Could not find artifact X:Y:Z` | Verify version on Maven Central |
| Version conflict | `omitted for conflict with X.Y.Z` | Add dependencyManagement entry |
| Test failure | `Assertion failed` | Update test for behavior changes |
| Plugin error | `Plugin X not found` | Update plugin version |

**Fix Rules:**
- Keep changes MINIMAL -- only fix what's needed
- Preserve ALL CVE fixes -- never revert a CVE fix to fix build
- Maintain JDK 17 compatibility
- Verify any new dependency on Maven Central
- Run conflict check before adding dependencies
- NEVER downgrade to fix the build
- NEVER revert Spring Boot/Framework upgrades

### 5.5 Generate Build Report

Write `.github/mend-resolver/build-report.md`:

```markdown
# Build Verification Report

## Build Summary
- **Status**: Passed / Failed
- **Command**: mvn clean install
- **Attempts**: N
- **Duration**: N minutes

## Environment
- **JDK**: 17
- **Maven**: 3.9.6

## Compilation
- **Main sources**: Passed / Failed
- **Test sources**: Passed / Failed
- **Errors**: N
- **Warnings**: N

## Tests
- **Total**: N
- **Passed**: N
- **Failed**: N
- **Skipped**: N

## Issues Fixed During Build
| # | Issue | Fix Applied | File |
|---|-------|-------------|------|
| 1 | Compilation error: removed API | Updated to new API | Foo.java |

## Remaining Issues (if any)
| # | Issue | Severity | Recommendation |
|---|-------|----------|----------------|
| 1 | ... | ... | ... |

## Final Status
- **Build**: Passing / Failing
- **All CVE Fixes Preserved**: Yes / No
- **JDK 17 Compatible**: Yes
- **Ready for Review**: Yes / No
```

### 5.6 Final Confirmation Checklist

Before marking complete:

```
[x] Clean build executed (mvn clean install)
[x] Compilation successful (main sources)
[x] Compilation successful (test sources)
[x] All CVE fixes preserved in POMs
[x] No dependency versions were downgraded
[x] JDK 17 compatibility maintained
[x] All changes logged in change-log.md
[x] Build report generated
```

### 5.7 If Build Still Fails After 10 Attempts

Document remaining issues:

```markdown
## Build Status: Failed After 10 Attempts

### Remaining Errors
1. **Error**: [description]
   **File**: [file]
   **Recommendation**: [suggested fix for user]

### Preserved Changes
- All CVE fixes are preserved in the modified POMs
- Build errors are in source code, not dependency versions
```

## Output

- Build report: `.github/mend-resolver/build-report.md`
- Build logs (if saved)
- Summary returned to orchestrator

## Next Step

-> Post-build hook finalizes the workflow and generates `FINAL_SUMMARY.md`
