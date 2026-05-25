# Step 4: Resolve CVEs

## Objective

Resolve ALL CVEs from the Mend report by upgrading dependencies, strictly following all hard constraints.

## Hard Constraints (NEVER Violate)

| # | Constraint | Detail |
|---|-----------|--------|
| 1 | **NO DOWNGRADES** | Never reduce a dependency version under any circumstance |
| 2 | **JDK 17 Compatible** | Every dependency change must be compatible with JDK 17 |
| 3 | **Spring Boot 4.x.x** | Target Spring Boot 4.x.x series |
| 4 | **Spring Framework 7.x.x** | Target Spring Framework 7.x.x series |
| 5 | **Maven 3.9.x** | Use Maven 3.9.x |
| 6 | **Conflict Check** | Before changing any version, check for conflicts with all direct, sub-, and transitive dependencies |
| 7 | **Maven Central** | Always verify the latest compatible version on Maven Central before applying any upgrade |
| 8 | **Multi-Module** | Check all POMs before changing a shared dependency |

## Prerequisites

- Step 1-3 complete
- `.github/mend-resolver/mend-report-parsed.json` available
- `.github/mend-resolver/dependency-map.json` available
- Pre-resolution hook passed

## Steps

### 4.1 Sort CVEs by Severity

Process in this order:
1. **CRITICAL** — highest priority
2. **HIGH**
3. **MEDIUM**
4. **LOW**

### 4.2 For Each CVE, Execute These Steps:

#### Step A: Identify the Vulnerable Dependency

From the Mend report mapping:
- Get `groupId:artifactId`
- Get current version from the project
- Get Mend-recommended fixed version

#### Step B: Find All Declaring Files

From the dependency map:
- List ALL `pom.xml` files where this dependency is declared
- Note the version source for each (property, direct, BOM, parent)

#### Step C: Determine Target Version

**Rule**: Target version MUST be >= current version (NO DOWNGRADES)

```
IF mendFixedVersion >= currentVersion:
    targetVersion = mendFixedVersion
ELIF mendFixedVersion < currentVersion:
    # Mend suggests a downgrade — NOT ALLOWED
    targetVersion = currentVersion  # Keep current, flag as cannot-fix
    reason = "Mend-recommended version would be a downgrade"
ELSE:
    # No fixed version from Mend
    targetVersion = lookupLatestCompatibleVersion(groupId, artifactId)
```

#### Step D: Verify on Maven Central

Call `maven-central-lookup(groupId, artifactId, targetVersion)`:

```
maven-central-lookup {
    "groupId": "org.springframework",
    "artifactId": "spring-web",
    "version": "6.0.19"
}
```

**Check response:**
- `exists: true` → proceed
- `exists: false` → find next higher version that exists
- `jdkCompatible: true` → proceed
- `jdkCompatible: false` → reject, find alternative

#### Step E: Check JDK 17 Compatibility

Verify the target version requires Java <= 17:

```
IF dependency.javaVersion > 17:
    REJECT — find older compatible version
    IF no compatible version exists:
        Flag as "cannot fix — requires Java > 17"
```

#### Step F: Check Spring Alignment (for Spring deps)

For Spring ecosystem dependencies:

```
IF dependency.groupId starts with "org.springframework":
    IF upgrading Spring Boot parent/BOM:
        Ensure target aligns with Boot 4.x
    IF explicit Spring Framework version:
        Ensure target aligns with Framework 7.x
```

#### Step G: Check Dependency Conflicts

Call `mend-check-conflicts(dependency, targetVersion, allProjectDeps)`:

```
mend-check-conflicts {
    "dependency": "org.springframework:spring-web",
    "proposedVersion": "6.0.19",
    "currentVersion": "6.0.8",
    "projectRoot": "/path/to/project",
    "allModules": ["module-a", "module-b", "module-c"]
}
```

**Handle conflicts:**
- No conflicts → proceed to apply
- Conflicts found → try alternative compatible version
- If no compatible version resolves both CVE and conflicts → flag as "cannot fix — unresolved conflicts"

#### Step H: Apply the Version Change

Based on version source type:

**Property-managed (preferred for multi-module):**
```xml
<!-- In root pom.xml -->
<properties>
    <!-- BEFORE -->
    <spring-web.version>6.0.8</spring-web.version>
    <!-- AFTER -->
    <spring-web.version>6.0.19</spring-web.version>  <!-- Fix CVE-2024-22262 -->
</properties>
```

**Direct version:**
```xml
<!-- In module pom.xml -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-web</artifactId>
    <!-- BEFORE -->
    <version>6.0.8</version>
    <!-- AFTER -->
    <version>6.0.19</version>  <!-- Fix CVE-2024-22262 -->
</dependency>
```

**dependencyManagement:**
```xml
<!-- In root pom.xml -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-web</artifactId>
            <!-- BEFORE -->
            <version>6.0.8</version>
            <!-- AFTER -->
            <version>6.0.19</version>  <!-- Fix CVE-2024-22262 -->
        </dependency>
    </dependencies>
</dependencyManagement>
```

**Spring Boot BOM/Parent:**
If multiple CVEs are in Boot-managed dependencies, consider upgrading the Boot parent/BOM version instead of individual dependencies.

#### Step I: Log the Change

Record in `.github/mend-resolver/change-log.md`:

```markdown
## Fix: CVE-2024-22262 | org.springframework:spring-web | 6.0.8 → 6.0.19
- **Severity**: CRITICAL
- **Files Modified**:
  - root/pom.xml (property `spring-web.version`)
- **Maven Central**: ✅ Verified (exists, JDK 17 compatible)
- **Conflict Check**: ✅ No conflicts
- **Spring Alignment**: ✅ Compatible with Framework 7.x
- **Applied**: 2026-01-15T10:40:00Z
- **Reasoning**: Mend-recommended fixed version, all constraints verified
```

### 4.3 Handle Special Cases

#### Case: CVE in Spring Boot-Managed Dependency

If the CVE is in a dependency managed by Spring Boot BOM:
- Option 1: Upgrade Spring Boot parent/BOM (preferred if multiple CVEs)
- Option 2: Add explicit version in dependencyManagement

**Decision rule:**
```
IF count(Boot-managed CVEs) >= 3:
    Upgrade Spring Boot parent to latest 4.x.x
ELIF count(Boot-managed CVEs) < 3:
    Add explicit versions in dependencyManagement for each
```

#### Case: No Fix Version from Mend

If Mend doesn't provide a fixed version:
1. Look up latest stable version on Maven Central
2. Verify it fixes the CVE (check CVE databases)
3. Apply if all constraints pass

#### Case: Cannot Fix

If a CVE cannot be fixed due to constraints:

```markdown
## Cannot Fix: CVE-2024-XXXXX | groupId:artifactId
- **Severity**: HIGH
- **Reason**: No patched version available that meets all constraints
- **Details**: Latest version X.Y.Z requires Java 21 (JDK 17 incompatible)
- **Recommendation**: Monitor for updates; consider alternative library
```

### 4.4 Generate Resolution Report

After all CVEs are processed, write `.github/mend-resolver/resolution-report.md`:

```markdown
# CVE Resolution Report

## Summary
- **Total CVEs in Mend Report**: 8
- **Fixed**: 6 (CRITICAL: 1, HIGH: 2, MEDIUM: 2, LOW: 1)
- **Cannot Fix**: 2 (HIGH: 1, LOW: 1)
- **Dependencies Changed**: 5

## CVE Fixes Applied
...

## CVEs That Could Not Be Fixed
...

## Dependency Changes Summary
| Dependency | Old Version | New Version | Files Modified |
|------------|-------------|-------------|----------------|
| ... | ... | ... | ... |

## Constraints Compliance
- [x] No downgrades applied
- [x] All changes JDK 17 compatible
- [x] Spring Boot 4.x aligned
- [x] Spring Framework 7.x aligned
- [x] All versions verified on Maven Central
- [x] No dependency conflicts introduced
- [x] Multi-module POMs checked
```

## Output

- Resolution report: `.github/mend-resolver/resolution-report.md`
- Change log: `.github/mend-resolver/change-log.md`
- Modified `pom.xml` / `build.gradle` files
- Summary returned to orchestrator

## Next Step

→ [Step 5: Clean & Build](step-05-clean-build.md)
