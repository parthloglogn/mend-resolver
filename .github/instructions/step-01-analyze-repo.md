# Step 1: Analyze the Repository

## Objective

Scan and understand the project structure to determine the build system, module layout, Spring versions, and Java version.

## Prerequisites

- Project root directory is accessible
- Mend Resolver workspace is initialized (via pre-analysis hook)

## Steps

### 1.1 Detect Build Tool

Check for build files in the project root:

```bash
# Check for Maven
ls pom.xml

# Check for Gradle
ls build.gradle build.gradle.kts

# Check for wrappers
ls mvnw mvnw.cmd gradlew gradlew.bat
```

**Decision:**
- If `pom.xml` exists → **Maven project**
- If `build.gradle` or `build.gradle.kts` exists → **Gradle project**
- If neither exists → **ERROR**: Not a recognized Java project

### 1.2 Detect Module Structure

For **Maven** projects, read the root `pom.xml`:

```xml
<!-- Look for modules section -->
<modules>
    <module>module-a</module>
    <module>module-b</module>
</modules>
```

- If `<modules>` found → **Multi-module project**
- If no `<modules>` → **Single-module project**

For **Gradle** projects, check `settings.gradle`:

```groovy
include 'module-a'
include 'module-b'
```

List all modules and their paths.

### 1.3 Detect Spring Boot Version

Read root `pom.xml` for Maven:

```xml
<!-- Method 1: Parent POM -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>  <!-- Spring Boot version -->
</parent>

<!-- Method 2: Version property -->
<properties>
    <spring-boot.version>3.2.0</spring-boot.version>
</properties>

<!-- Method 3: BOM import -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

For Gradle, read `build.gradle`:

```groovy
plugins {
    id 'org.springframework.boot' version '3.2.0'
}
```

### 1.4 Detect Spring Framework Version

Check `pom.xml` properties:

```xml
<properties>
    <spring-framework.version>6.1.0</spring-framework.version>
</properties>
```

Or check the dependency tree for `spring-core`, `spring-context` versions.

### 1.5 Detect Java Version

Read `pom.xml`:

```xml
<properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <maven.compiler.release>17</maven.compiler.release>
    <java.version>17</java.version>
</properties>
```

Or read `build.gradle`:

```groovy
sourceCompatibility = '17'
targetCompatibility = '17'
```

### 1.6 Detect Build Tool Version

For Maven, check wrapper properties:

```properties
# .mvn/wrapper/maven-wrapper.properties
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip
```

Or check `pom.xml` for maven-enforcer-plugin:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-enforcer-plugin</artifactId>
    <configuration>
        <rules>
            <requireMavenVersion>
                <version>3.9.0</version>
            </requireMavenVersion>
        </rules>
    </configuration>
</plugin>
```

### 1.7 Generate Analysis Report

Write findings to `.github/mend-resolver/analysis-report.md` using the template in the `analysis-coordinator` agent definition.

## Output

- Analysis report: `.github/mend-resolver/analysis-report.md`
- Summary returned to orchestrator

## Next Step

→ [Step 2: Collect Dependencies](step-02-collect-dependencies.md)
