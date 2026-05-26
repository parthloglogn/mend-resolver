# Step 4: Resolve CVEs

## Objective

Resolve ALL CVEs from the Mend report by upgrading dependencies one by one. Use Mend's **topFix** as the primary target version. Follow severity order (CRITICAL first). Confirm each fix with Maven Central and conflict checks.

## Hard Constraints (NEVER Violate)

| # | Constraint | Detail |
|---|-----------|--------|
| 1 | **TOP FIX FIRST** | Use Mend's topFix as the primary target version |
| 2 | **NO DOWNGRADES** | Never reduce a dependency version |
| 3 | **JDK 17 Compatible** | Check javaVersion from Maven Central response |
| 4 | **Spring Boot 4.x.x** | Target Spring Boot 4.x.x series |
| 5 | **Spring Framework 7.x.x** | Target Spring Framework 7.x.x series |
| 6 | **Maven 3.9.x** | Use Maven 3.9.x |
| 7 | **Conflict Check** | Check conflicts before every upgrade |
| 8 | **Maven Central** | Verify every version on Maven Central |
| 9 | **Multi-Module** | Check all POMs before changing shared dependency |
| 10 | **One by One** | Process CVEs individually, not in batch |

## Prerequisites

- Steps 1-3 complete
- `.github/mend-resolver/mend-report-parsed.json` available with topFix data
- `.github/mend-resolver/dependency-map.json` available with file counts

## Steps

### 4.1 Sort CVEs by Severity

Process ONE BY ONE in this order:
1. **CRITICAL** -- highest priority
2. **HIGH**
3. **MEDIUM**
4. **LOW**

### 4.2 For Each CVE, Execute These Steps:

#### Step A: Identify Target Version (Top Fix First)

```
Get topFix.fixResolution from Mend report
  |
  IF topFix exists AND topFix >= current:
      targetVersion = topFix
      source = "Mend topFix"
  |
  ELIF topFix exists AND topFix < current:
      # Mend top fix would be a downgrade -- NOT ALLOWED
      targetVersion = find lowest version >= current that fixes CVE
      source = "Modified (topFix was downgrade)"
      Flag: "Note: Mend top fix was lower than current; used higher compatible version"
  |
  ELSE (no topFix):
      targetVersion = lookup latest stable on Maven Central
      source = "Maven Central (no topFix)"
```

#### Step B: Find All Affected Files (from Dependency Map)

From the dependency map, get ALL declaring files for this dependency:
```
CVE: org.springframework:spring-web
- Affected Files: 3
  1. root/pom.xml (property ${spring-web.version})
  2. service-a/pom.xml (direct version)
  3. service-b/pom.xml (direct version)
- Most Efficient Strategy: Update property in root (fixes all 3)
```

#### Step C: Verify on Maven Central

Call `maven-central-lookup`:
```
maven-central-lookup {
    "groupId": "org.springframework",
    "artifactId": "spring-web",
    "version": "6.0.19"
}
```

Checks:
- `exists: true` -> proceed
- `exists: false` -> find next higher version
- `javaVersion` in response -> must be <= 17

#### Step D: Native No-Downgrade Check

```
COMPARE SEMVER:
  targetVersion >= currentVersion ?
  
  EXAMPLES:
    1.2.5 >= 1.2.3 -> YES, proceed
    1.2.3 >= 1.2.5 -> NO, reject (would be downgrade)
    2.0.0 >= 1.9.0 -> YES, proceed
```

This is done natively by the agent -- no MCP call needed.

#### Step E: Native JDK 17 Check

From maven-central-lookup response:
```
IF result.javaVersion exists AND result.javaVersion > 17:
    REJECT -- find older version on Maven Central
    IF none available:
        Flag as "cannot fix -- requires Java > 17"
```

This is done natively by the agent -- no MCP call needed.

#### Step F: Check Dependency Conflicts

Call `mend-check-conflicts`:
```
mend-check-conflicts {
    "dependency": "org.springframework:spring-web",
    "proposedVersion": "6.0.19",
    "currentVersion": "6.0.8",
    "projectDeps": { ...dependency map... }
}
```

- No conflicts -> proceed to apply
- Conflicts found -> try alternative version

#### Step G: Apply the Version Change (One by One)

**Most efficient strategy first:**

1. **Property update** (if dependency uses ${property} across multiple modules):
   ```xml
   <properties>
       <spring-web.version>6.0.19</spring-web.version>  <!-- Fix CVE-2024-22262 -->
   </properties>
   ```
   -> Updates all modules that reference this property

2. **dependencyManagement update** (if managed in root):
   ```xml
   <dependencyManagement>
       <dependencies>
           <dependency>
               <groupId>org.springframework</groupId>
               <artifactId>spring-web</artifactId>
               <version>6.0.19</version>  <!-- Fix CVE-2024-22262 -->
           </dependency>
       </dependencies>
   </dependencyManagement>
   ```

3. **Direct version update** (if no property or dependencyManagement):
   Update EACH affected file individually

#### Step H: Log the Change

```markdown
## Fix: CVE-2024-22262 | org.springframework:spring-web | 6.0.8 -> 6.0.19
- **Severity**: CRITICAL
- **Target Source**: Mend topFix (6.0.19)
- **Files Affected**: N files across M modules
- **Files Modified**: list of files
- **Change Strategy**: property update / dependencyManagement / direct
- **Maven Central**: Verified (exists, JDK 17 compatible)
- **Conflict Check**: No conflicts
- **Applied**: timestamp
```

### 4.3 Handle Special Cases

#### Case: Multiple CVEs on Same Dependency
If multiple CVEs affect the same dependency:
- Use the HIGHEST topFix version among all CVEs
- Apply ONCE for all CVEs on that dependency
- Log all CVE IDs in the change entry

#### Case: CVE in Spring Boot-Managed Dependency
If CVE is in a dependency managed by Spring Boot BOM:
- If >= 3 Boot-managed CVEs: upgrade Spring Boot parent/BOM
- If < 3: add explicit versions in dependencyManagement

#### Case: Top Fix is Downgrade
```
IF topFix < currentVersion:
    Log: "Mend topFix X.Y.Z is lower than current A.B.C -- finding compatible upgrade"
    targetVersion = lowest version >= currentVersion that fixes CVE
    Verify on Maven Central
    Apply
```

#### Case: Cannot Fix
```markdown
## Cannot Fix: CVE-2024-XXXXX | groupId:artifactId
- **Severity**: HIGH
- **Reason**: No patched version available that meets all constraints
- **Details**: Latest version X.Y.Z requires Java 21 (JDK 17 incompatible)
- **Recommendation**: Monitor for updates or consider alternative library
```

### 4.4 Generate Resolution Report

Write `.github/mend-resolver/resolution-report.md`:

```markdown
# CVE Resolution Report

## Summary
- **Total CVEs in Mend Report**: 8
- **Fixed**: 6 (CRITICAL: 1, HIGH: 2, MEDIUM: 2, LOW: 1)
- **Cannot Fix**: 2 (HIGH: 1, LOW: 1)
- **Dependencies Changed**: 5
- **Total Files Modified**: N
- **Top Fix Used**: 6 / 8 (2 modified due to downgrade avoidance)

## CVE Fixes Applied (one by one, severity order)
...

## Constraints Compliance
- [x] Mend topFix used as primary target
- [x] No downgrades applied
- [x] All changes JDK 17 compatible
- [x] All versions verified on Maven Central
- [x] Conflict checked for each change
- [x] Multi-module POMs checked
```

## Output

- Resolution report: `.github/mend-resolver/resolution-report.md`
- Change log: `.github/mend-resolver/change-log.md`
- Modified `pom.xml` / `build.gradle` files

## Next Step

-> [Step 5: Clean & Build](step-05-clean-build.md)
