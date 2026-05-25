# Build Verification Skill

## Overview

Reusable skill for verifying the project builds successfully after dependency upgrades. Runs the appropriate build command and handles any failures.

## When to Use

Invoked by the `build-verification` agent after all CVE fixes and Spring upgrades are applied.

## Inputs

- `projectRoot`: Absolute path to project root
- `buildTool`: maven | gradle
- `hasWrapper`: true | false
- `javaHome`: Path to JDK 17

## Outputs

- Build report at `.github/mend-resolver/build-report.md`
- Build output logs

## Build Commands

### Maven with Wrapper
```bash
cd <projectRoot>
JAVA_HOME=<jdk17> ./mvnw clean install
```

### Maven without Wrapper
```bash
cd <projectRoot>
JAVA_HOME=<jdk17> mvn clean install
```

### Gradle with Wrapper
```bash
cd <projectRoot>
JAVA_HOME=<jdk17> ./gradlew clean build
```

## Build Verification Steps

1. Set `JAVA_HOME` to JDK 17
2. Run clean build command
3. Capture exit code and full output
4. If failed, analyze errors and apply fixes
5. Re-run (max 10 attempts)
6. Generate build report

## Failure Categories and Resolution

| Error Type | Resolution Approach |
|------------|-------------------|
| Compilation error | Fix source code for new API |
| Dependency not found | Verify on Maven Central, adjust version |
| Class version mismatch | Find JDK 17 compatible dependency version |
| Version conflict | Add explicit version or exclusion |
| Test failure | Update test for breaking changes |
| Plugin error | Update plugin version |

## Report Format

```markdown
# Build Report
- Status: ✅ Passed / ❌ Failed
- Command: mvn clean install
- Attempts: N
- Duration: N min

## Compilation
- Main: ✅ / ❌
- Test: ✅ / ❌

## Tests
- Total: N | Passed: N | Failed: N | Skipped: N

## Issues Fixed
| # | Issue | Fix | File |

## Remaining Issues
| # | Issue | Severity | Recommendation |
```

## Rules
- Preserve all CVE fixes — never revert to fix build
- Never downgrade dependencies
- Only make minimal necessary changes
- Max 10 build attempts
