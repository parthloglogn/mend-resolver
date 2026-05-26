# Step 2: Collect Dependencies

## Objective

Collect ALL dependencies from across the entire project and map each dependency to every `pom.xml` or `build.gradle` file where it is declared.

## Prerequisites

- Step 1 (Repository Analysis) is complete
- Project type (Maven/Gradle) and module list are known

## Steps

### 2.1 Run Dependency Commands

**Maven:**
```bash
./mvnw dependency:list -DoutputAbsoluteArtifactFilename=true
./mvnw dependency:tree -DoutputFile=.github/mend-resolver/dependency-tree.txt
```

**Gradle:**
```bash
./gradlew dependencies --configuration compileClasspath > .github/mend-resolver/dependency-tree.txt
```

### 2.2 Parse Dependency Output

Extract for each entry:
- `groupId:artifactId:version`
- Scope (compile, test, provided, runtime)
- Module the dependency belongs to

### 2.3 Map Dependencies to Declaring Files

For EACH dependency, scan ALL `pom.xml` files to find declarations:

**Check for:**
- A. Direct dependency with explicit version
- B. BOM-managed (no version tag)
- C. Property-managed version (`${property}`)
- D. dependencyManagement-managed

### 2.4 Identify Version Override Patterns

Flag dependencies with explicit `<version>` tags overriding Spring Boot BOM:
```json
{
  "highRiskDependencies": [
    {
      "coordinates": "com.fasterxml.jackson.core:jackson-databind",
      "explicitVersion": "2.14.0",
      "bootManagedVersion": "2.15.3",
      "declaringFile": "service-b/pom.xml"
    }
  ]
}
```

### 2.5 Generate Dependency Map

Write to `.github/mend-resolver/dependency-map.json`:

```json
{
  "generatedAt": "2026-01-15T10:30:00Z",
  "projectRoot": "/path/to/project",
  "buildTool": "maven",
  "totalModules": 3,
  "totalDependencies": 85,
  "dependencies": [
    {
      "coordinates": "com.fasterxml.jackson.core:jackson-databind",
      "version": "2.14.0",
      "declaredIn": [
        { "file": "pom.xml", "versionSource": "dependencyManagement" },
        { "file": "service-b/pom.xml", "versionSource": "direct-version" }
      ]
    }
  ]
}
```

## Multi-Module Critical Notes

- A dependency MAY be declared differently in different modules
- ALWAYS check EVERY `pom.xml` in the project
- A version change in root `pom.xml` `<properties>` may affect multiple modules

## Output

- Dependency map: `.github/mend-resolver/dependency-map.json`
- Dependency tree: `.github/mend-resolver/dependency-tree.txt`

## Next Step

-> [Step 3: Load the Mend Report](step-03-load-mend-report.md)
