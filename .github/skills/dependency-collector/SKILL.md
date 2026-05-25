# Dependency Collector Skill

## Overview

This is an **external skill** invoked by the resolver orchestrator to collect all dependencies from across the entire project. It is critical for multi-module projects — a version change in one place may affect many modules.

## Purpose

- Scan the entire project for all dependencies
- For each dependency, identify every `pom.xml` or `build.gradle` file where it is declared
- Build a complete dependency map that spans all modules
- Distinguish between Spring Boot BOM-managed dependencies and explicitly versioned dependencies

## When to Use

This skill is invoked during the **Collect** phase of the resolver workflow, after repository analysis is complete and before the Mend report is loaded.

## Invocation

```
Skill: dependency-collector
Input:
  - projectRoot: <absolute path to project root>
  - buildTool: <maven | gradle>
  - modules: <list of module paths from analysis>
Output:
  - dependencyMap: full mapping of dependencies to their declaring files
  - bomManagedDeps: list of dependencies managed by Spring Boot BOM
  - explicitVersionDeps: list of dependencies with explicit version overrides
  - outputPath: .github/mend-resolver/dependency-map.json
```

## Execution Steps

### Step 1: Run Dependency List Command

For Maven projects, run in the project root:

```bash
# With wrapper
./mvnw dependency:list -DoutputAbsoluteArtifactFilename=true -pl '<module1>,<module2>,...' -am

# Without wrapper
mvn dependency:list -DoutputAbsoluteArtifactFilename=true -pl '<module1>,<module2>,...' -am
```

For multi-module projects, also run:
```bash
./mvnw dependency:tree -DoutputFile=.github/mend-resolver/dependency-tree.txt
```

For Gradle projects:
```bash
./gradlew dependencies --configuration compileClasspath > .github/mend-resolver/dependency-tree.txt
```

### Step 2: Parse Dependency Output

Parse the dependency list to extract:
- groupId:artifactId:version
- Scope (compile, test, provided, runtime)
- Whether the version is from BOM or explicitly declared
- Which module the dependency belongs to

### Step 3: Map Dependencies to Declaring Files

For each dependency found, scan ALL `pom.xml` files to find where it is declared:

```xml
<!-- Check for direct dependency declaration -->
<dependency>
    <groupId>...</groupId>
    <artifactId>...</artifactId>
    <version>X.Y.Z</version>  <!-- Explicit version -->
</dependency>

<!-- Check for dependencyManagement declaration -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>...</groupId>
            <artifactId>...</artifactId>
            <version>X.Y.Z</version>  <!-- Managed version -->
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- Check for property reference -->
<properties>
    <lib.version>X.Y.Z</lib.version>  <!-- Version property -->
</properties>

<dependency>
    <groupId>...</groupId>
    <artifactId>...</artifactId>
    <version>${lib.version}</version>
</dependency>

<!-- Check for BOM/no version (Boot managed) -->
<dependency>
    <groupId>...</groupId>
    <artifactId>...</artifactId>
    <!-- No version = managed by Spring Boot BOM -->
</dependency>
```

### Step 4: Identify Version Override Patterns

Flag dependencies that have explicit `<version>` tags overriding the Spring Boot BOM. These are the most common source of missed CVE vulnerabilities.

### Step 5: Generate Dependency Map

Write the dependency map to `.github/mend-resolver/dependency-map.json`:

```json
{
  "generatedAt": "2026-01-15T10:30:00Z",
  "projectRoot": "/path/to/project",
  "buildTool": "maven",
  "totalModules": 5,
  "totalDependencies": 127,
  "dependencies": [
    {
      "coordinates": "org.springframework.boot:spring-boot-starter-web",
      "version": "3.2.0",
      "declaredIn": [
        {
          "file": "service-a/pom.xml",
          "versionSource": "parent-bom",
          "hasExplicitVersionOverride": false
        }
      ]
    },
    {
      "coordinates": "com.fasterxml.jackson.core:jackson-databind",
      "version": "2.15.0",
      "declaredIn": [
        {
          "file": "root/pom.xml",
          "versionSource": "dependencyManagement",
          "hasExplicitVersionOverride": true,
          "versionProperty": "jackson.version"
        },
        {
          "file": "service-b/pom.xml",
          "versionSource": "direct-version",
          "hasExplicitVersionOverride": true,
          "directVersion": "2.14.0"
        }
      ]
    }
  ],
  "bomManaged": 89,
  "explicitVersionOverride": 12,
  "propertyManaged": 26
}
```

## Output Format

Return a summary to the orchestrator:

```
Dependency Collection Complete

- **Total Dependencies**: N across M modules
- **BOM-Managed (Spring Boot)**: N
- **Explicit Version Overrides**: N (⚠️ high-risk for CVEs)
- **Property-Managed**: N
- **Output**: .github/mend-resolver/dependency-map.json

⚠️ Dependencies with explicit version overrides (CVE risk):
  - groupId:artifactId = X.Y.Z in service-b/pom.xml
  - ...
```

## Critical Notes

1. **Multi-module awareness**: A dependency may be declared in multiple modules with DIFFERENT version sources. Track each separately.
2. **Explicit version overrides**: These bypass Spring Boot BOM management and are the most common source of CVEs. Always flag these.
3. **Property references**: When a version is set via `${property.name}`, track which POM defines the property and which POMs reference it.
4. **Transitive dependencies**: The dependency list includes transitive deps, but we only map the DECLARING files for direct dependencies. Transitive versions are managed by BOM or explicit declarations.

## Error Handling

- If `mvn dependency:list` fails, try `mvn dependency:tree` as fallback
- If a module fails, note the error and continue with other modules
- If Gradle project lacks the `dependencies` task output, use `gradle dependencies --all`
