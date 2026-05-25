# Step 5: Clean & Build

## Objective

Run `mvn clean install` (or Gradle equivalent) to verify the project builds successfully after all CVE fixes and Spring upgrades.

## Prerequisites

- Steps 1-4 complete
- All CVE fixes applied
- Pre-build hook passed

## Steps

### 5.1 Environment Setup

Ensure the build environment is correctly configured:

```bash
# Verify JDK 17
export JAVA_HOME=/path/to/jdk-17
java -version  # Should show Java 17

# Verify Maven 3.9.x
mvn --version  # Should show Apache Maven 3.9.x

# Check for wrapper
ls mvnw  # Prefer wrapper if present
```

### 5.2 Run Clean Build

#### Maven with Wrapper (preferred)

```bash
cd <project-root>
JAVA_HOME=/path/to/jdk-17 ./mvnw clean install
```

#### Maven without Wrapper

```bash
cd <project-root>
JAVA_HOME=/path/to/jdk-17 mvn clean install
```

#### Gradle with Wrapper

```bash
cd <project-root>
JAVA_HOME=/path/to/jdk-17 ./gradlew clean build
```

### 5.3 Build Options

For large multi-module projects, you may want to use:

```bash
# Skip tests initially (run tests after compilation passes)
./mvnw clean install -DskipTests

# Then run tests separately
./mvnw test

# Parallel build for multi-module projects
./mvnw clean install -T 4

# Offline mode (if dependencies are already cached)
./mvnw clean install -o
```

### 5.4 Handle Build Failures

If the build fails, follow this process:

#### Attempt 1-10: Fix and Rebuild

**For each failure:**

1. **Read the error** — identify error type
2. **Categorize**:
   - Compilation error
   - Dependency resolution error
   - Test failure
   - Plugin error
3. **Apply minimal fix**
4. **Rebuild**

**Maximum 10 attempts.**

#### Common Errors and Fixes

| Error Type | Example | Fix |
|------------|---------|-----|
| **Compilation error** | `cannot find symbol class X` | Update code to use new API from upgraded dependency |
| **Package not found** | `package org.springframework.X does not exist` | Check if package was relocated; update imports |
| **Class version mismatch** | `class file has wrong version 61.0` | Find JDK 17-compatible version on Maven Central |
| **Dependency not found** | `Could not find artifact X:Y:Z` | Verify version exists on Maven Central; use existing version |
| **Version conflict** | `omitted for conflict with X.Y.Z` | Add explicit version in dependencyManagement |
| **Test failure** | `Assertion failed: expected X, got Y` | Update test for behavior changes in new dependency version |
| **Plugin error** | `Plugin X not found` | Update plugin version in `<build><plugins>` |

#### Fix Rules

When fixing build errors:
- ✅ Keep changes MINIMAL — only fix what's needed
- ✅ Preserve ALL CVE fixes — never revert a CVE fix to fix the build
- ✅ Maintain JDK 17 compatibility
- ✅ Verify any new dependency on Maven Central
- ✅ Run conflict check before adding dependencies

- ❌ NEVER downgrade to fix the build
- ❌ NEVER revert Spring Boot/Framework upgrades
- ❌ NEVER introduce dependencies requiring Java > 17

#### Example Fix: Compilation Error

```java
// BEFORE (old API, now removed)
import org.springframework.util.Base64Utils;
String encoded = Base64Utils.encodeToString(bytes);

// AFTER (new API)
import java.util.Base64;
String encoded = Base64.getEncoder().encodeToString(bytes);
```

### 5.5 Generate Build Report

Write results to `.github/mend-resolver/build-report.md`:

```markdown
# Build Verification Report

## Build Summary
- **Status**: ✅ Passed / ❌ Failed
- **Command**: mvn clean install
- **Attempts**: N
- **Duration**: N minutes

## Environment
- **JDK**: 17
- **Maven**: 3.9.6

## Compilation
- **Main sources**: ✅ / ❌
- **Test sources**: ✅ / ❌
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

## Remaining Issues
| # | Issue | Severity | Recommendation |
|---|-------|----------|----------------|
| 1 | ... | ... | ... |

## Final Status
- **Build**: ✅ Passing / ❌ Failing
- **All CVE Fixes Preserved**: Yes
- **JDK 17 Compatible**: Yes
- **Ready for Review**: Yes / No
```

### 5.6 If Build Still Fails After 10 Attempts

Document remaining issues:

```markdown
## Build Status: ❌ Failed After 10 Attempts

### Remaining Errors
1. **Error**: [description]
   **File**: [file]
   **Recommendation**: [suggested fix for user]

### Preserved Changes
- All CVE fixes are preserved in the modified POMs
- Build errors are in source code, not dependency versions
- User may need to manually fix remaining compilation issues
```

## Output

- Build report: `.github/mend-resolver/build-report.md`
- Build logs (if saved)
- Summary returned to orchestrator

## Next Step

→ Post-build hook finalizes the workflow and generates `FINAL_SUMMARY.md`
