# Dependency Collector Skill

## Overview

External skill invoked by the resolver orchestrator to collect all dependencies from across the entire project and map each dependency to every declaring file.

## Purpose

- Scan the entire project for all dependencies
- For each dependency, identify every `pom.xml` or `build.gradle` file where it is declared
- Build a complete dependency map that spans all modules
- Enable counting of "how many places need changes" per CVE

## When to Use

Invoked during the **Collect** phase of the resolver workflow, after repository analysis and before Mend report loading.

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

### Step 1: Run Dependency Commands

**Maven:**
```bash
./mvnw dependency:list -DoutputAbsoluteArtifactFilename=true
./mvnw dependency:tree -DoutputFile=.github/mend-resolver/dependency-tree.txt
```

**Gradle:**
```bash
./gradlew dependencies --configuration compileClasspath > .github/mend-resolver/dependency-tree.txt
```

### Step 2: Parse Output
Extract: groupId:artifactId:version, scope, module

### Step 3: Map Dependencies to Declaring Files

For EACH dependency, scan ALL `pom.xml` files to find declarations:

**A. Direct dependency with explicit version:**
```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>library</artifactId>
    <version>1.2.3</version>
</dependency>
```

**B. BOM-managed (no version):**
```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>library</artifactId>
    <!-- No version = managed by Spring Boot BOM -->
</dependency>
```

**C. Property-managed:**
```xml
<properties>
    <library.version>1.2.3</library.version>
</properties>
<dependency>
    <version>${library.version}</version>
</dependency>
```

**D. dependencyManagement-managed:**
```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <version>1.2.3</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### Step 4: Generate Dependency Map

Write to `.github/mend-resolver/dependency-map.json`:

```json
{
  "generatedAt": "2026-01-15T10:30:00Z",
  "projectRoot": "/path/to/project",
  "buildTool": "maven",
  "totalModules": 5,
  "totalDependencies": 127,
  "dependencies": [
    {
      "coordinates": "com.fasterxml.jackson.core:jackson-databind",
      "version": "2.14.0",
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
          "hasExplicitVersionOverride": true
        }
      ]
    }
  ],
  "statistics": {
    "bomManaged": 89,
    "explicitVersionOverride": 12,
    "propertyManaged": 26
  }
}
```

## Critical Notes

1. **Count declaring files per dependency**: This count tells us "how many places need changes" when a CVE affects this dependency.
2. **Multi-module awareness**: A dependency may be declared differently in different modules.
3. **Explicit version overrides**: These bypass Spring Boot BOM and are the most common source of CVEs.
4. **Property references**: Track which POM defines the property and which POMs reference it.

## Output Format

Return to orchestrator:

```
Dependency Collection Complete

- **Total Dependencies**: N across M modules
- **BOM-Managed (Spring Boot)**: N
- **Explicit Version Overrides**: N (high-risk for CVEs)
- **Property-Managed**: N
- **Output**: .github/mend-resolver/dependency-map.json
```
