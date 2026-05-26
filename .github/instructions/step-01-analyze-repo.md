# Step 1: Analyze the Repository

## Objective

Scan and understand the project structure to determine the build system, module layout, Spring versions, and Java version.

## Prerequisites

- Project root directory is accessible
- Mend Resolver workspace is initialized (via pre-analysis hook)

## Steps

### 1.1 Detect Build Tool

- If `pom.xml` exists -> **Maven project**
- If `build.gradle` or `build.gradle.kts` exists -> **Gradle project**

### 1.2 Detect Module Structure

**Maven:** Check root `pom.xml` for `<modules>` section
**Gradle:** Check `settings.gradle` for `include` statements

### 1.3 Detect Spring Boot Version

- Check `<parent>`: `spring-boot-starter-parent` version
- Check `<properties>`: `spring-boot.version`
- Check `<dependencyManagement>` for Spring BOM imports

### 1.4 Detect Spring Framework Version

- Check `<properties>`: `spring-framework.version`
- Or check dependency tree for `spring-core`, `spring-context`

### 1.5 Detect Java Version

- Check `pom.xml`: `<maven.compiler.source>`, `<java.version>`, `<maven.compiler.release>`

### 1.6 Detect Build Tool Version

- Maven: check `.mvn/wrapper/maven-wrapper.properties`
- Or `maven-enforcer-plugin` in `pom.xml`

### 1.7 Generate Analysis Report

Write to `.github/mend-resolver/analysis-report.md`

## Output

- Analysis report: `.github/mend-resolver/analysis-report.md`

## Next Step

-> [Step 2: Collect Dependencies](step-02-collect-dependencies.md)
