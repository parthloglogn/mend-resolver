# Step 2: Collect Dependencies

## Objective

Collect ALL dependencies from across the entire project and map each dependency to every `pom.xml` or `build.gradle` file where it is declared.

## Prerequisites

- Step 1 (Repository Analysis) is complete
- Project type (Maven/Gradle) and module list are known

## Steps

### 2.1 Run Dependency List Command

#### Maven Projects

Run from the project root:

```bash
# Using wrapper (preferred)
./mvnw dependency:list -DoutputAbsoluteArtifactFilename=true

# Without wrapper
mvn dependency:list -DoutputAbsoluteArtifactFilename=true
```

For multi-module projects, also get the full tree:

```bash
./mvnw dependency:tree -DoutputFile=.github/mend-resolver/dependency-tree.txt
```

**Save output** to `.github/mend-resolver/dependency-list.txt`.

#### Gradle Projects

```bash
# Using wrapper
./gradlew dependencies --configuration compileClasspath --configuration testCompileClasspath

# Save output
./gradlew dependencies --configuration compileClasspath > .github/mend-resolver/dependency-list.txt
```

### 2.2 Parse Dependency List

Parse the output to extract dependency entries. Maven output format:

```
[INFO]    com.example:library:jar:1.2.3:compile:/path/to/library-1.2.3.jar
[INFO]    org.springframework.boot:spring-boot-starter-web:jar:3.2.0:compile
```

For each entry, extract:
- `groupId:artifactId`
- `version`
- `scope` (compile, test, provided, runtime)
- `type` (jar, pom, etc.)

### 2.3 Map Dependencies to Declaring Files

For EACH dependency found, scan ALL `pom.xml` files in the project to find where it is declared.

#### Check Each pom.xml For:

**A. Direct dependency with explicit version:**
```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>library</artifactId>
    <version>1.2.3</version>  <!-- EXPLICIT VERSION -->
</dependency>
```
→ **Flag**: `hasExplicitVersionOverride: true`

**B. Direct dependency without version (BOM-managed):**
```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>library</artifactId>
    <!-- No version = managed by Spring Boot BOM or parent -->
</dependency>
```
→ **Flag**: `hasExplicitVersionOverride: false, versionSource: "parent-bom"`

**C. Property-managed version:**
```xml
<properties>
    <library.version>1.2.3</library.version>
</properties>

<dependency>
    <groupId>com.example</groupId>
    <artifactId>library</artifactId>
    <version>${library.version}</version>
</dependency>
```
→ **Flag**: `versionSource: "property", propertyName: "library.version"`

**D. dependencyManagement-managed:**
```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>library</artifactId>
            <version>1.2.3</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```
→ **Flag**: `versionSource: "dependencyManagement"`

### 2.4 Identify Version Override Patterns

**⚠️ CRITICAL**: Dependencies with explicit `<version>` tags overriding the Spring Boot BOM are the MOST COMMON source of missed CVE vulnerabilities.

Create a separate list of these high-risk dependencies:

```json
{
  "highRiskDependencies": [
    {
      "coordinates": "com.fasterxml.jackson.core:jackson-databind",
      "explicitVersion": "2.14.0",
      "bootManagedVersion": "2.15.3",
      "declaringFile": "service-b/pom.xml",
      "risk": "Explicit version overrides Boot BOM — may contain known CVEs"
    }
  ]
}
```

### 2.5 Generate Dependency Map

Write the complete map to `.github/mend-resolver/dependency-map.json`:

```json
{
  "generatedAt": "2026-01-15T10:30:00Z",
  "projectRoot": "/path/to/project",
  "buildTool": "maven",
  "totalModules": 3,
  "totalDependencies": 85,
  "dependencies": [
    {
      "coordinates": "org.springframework.boot:spring-boot-starter-web",
      "version": "3.2.0",
      "declaredIn": [
        {
          "module": "service-a",
          "file": "service-a/pom.xml",
          "versionSource": "parent-bom",
          "hasExplicitVersionOverride": false
        }
      ]
    },
    {
      "coordinates": "com.fasterxml.jackson.core:jackson-databind",
      "version": "2.14.0",
      "declaredIn": [
        {
          "module": "root",
          "file": "pom.xml",
          "versionSource": "dependencyManagement",
          "hasExplicitVersionOverride": true,
          "versionProperty": "jackson.version"
        },
        {
          "module": "service-b",
          "file": "service-b/pom.xml",
          "versionSource": "direct-version",
          "hasExplicitVersionOverride": true,
          "directVersion": "2.14.0"
        }
      ]
    }
  ],
  "statistics": {
    "bomManaged": 45,
    "explicitVersionOverride": 12,
    "propertyManaged": 18,
    "dependencyManagement": 10
  },
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

## Multi-Module Critical Notes

- A dependency MAY be declared differently in different modules
- ALWAYS check EVERY `pom.xml` in the project
- A version change in the root `pom.xml` `<properties>` may affect multiple modules
- A version change in `<dependencyManagement>` affects all child modules

## Output

- Dependency map: `.github/mend-resolver/dependency-map.json`
- Dependency tree: `.github/mend-resolver/dependency-tree.txt` (if generated)
- Summary returned to orchestrator

## Next Step

→ [Step 3: Load the Mend Report](step-03-load-mend-report.md)
