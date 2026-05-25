# Spring Upgrade Skill

## Overview

Reusable skill for upgrading Spring Boot and Spring Framework to target series (Boot 4.x, Framework 7.x).

## When to Use

Invoked by the `spring-upgrade` agent or `cve-resolution-coordinator` when Spring ecosystem CVEs are detected.

## Target Versions

| Component | Target | Notes |
|-----------|--------|-------|
| Spring Boot | 4.x.x (latest patch) | Requires JDK 17+ |
| Spring Framework | 7.x.x (latest patch) | Bundled with Boot 4.x |
| Maven | 3.9.x | Compatible with Spring Boot 4.x |

## Upgrade Points

### 1. Spring Boot Starter Parent
In root `pom.xml`:
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.X.X</version>
    <relativePath/>
</parent>
```

### 2. Spring Boot Version Property
```xml
<properties>
    <spring-boot.version>4.X.X</spring-boot.version>
</properties>
```

### 3. Spring Boot BOM Import
```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>4.X.X</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 4. Spring Framework Version Property
```xml
<properties>
    <spring-framework.version>7.X.X</spring-framework.version>
</properties>
```

## Verification Steps

1. Look up latest 4.x.x version on Maven Central
2. Check which Framework version it includes
3. Verify JDK 17 compatibility
4. Check for explicit version overrides that may conflict
5. Apply upgrade
6. Run conflict check

## Rollback Protection
- Never downgrade Spring versions
- If current is already 4.x, only upgrade patch version
- Document all changes
