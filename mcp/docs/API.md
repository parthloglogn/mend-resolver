# Mend MCP Server API Documentation

## Overview

The Mend MCP Server provides tools for the mend-resolver agent framework to:
- Look up Maven artifacts on Maven Central
- Check for dependency conflicts before upgrades
- Validate versions against hard constraints
- Parse Mend vulnerability reports
- Retrieve CVE details from NVD

## Tools

### 1. maven-central-lookup

Look up an artifact on Maven Central.

**Input:**
```json
{
  "groupId": "org.springframework",
  "artifactId": "spring-web",
  "version": "6.0.19"
}
```

**Output:**
```json
{
  "exists": true,
  "version": "6.0.19",
  "packaging": "jar",
  "jdkCompatible": true,
  "javaVersion": 17,
  "url": "https://repo1.maven.org/maven2/org/springframework/spring-web/6.0.19/"
}
```

**Without version (gets latest):**
```json
{
  "groupId": "org.springframework.boot",
  "artifactId": "spring-boot-starter-parent"
}
```

### 2. mend-check-conflicts

Check for dependency conflicts when upgrading.

**Input:**
```json
{
  "dependency": "org.springframework:spring-web",
  "proposedVersion": "6.0.19",
  "currentVersion": "6.0.8",
  "projectDeps": {
    "direct": [
      {
        "coordinates": "org.springframework:spring-web",
        "version": "6.0.8",
        "file": "pom.xml"
      }
    ],
    "transitive": [
      {
        "coordinates": "org.springframework:spring-core",
        "requiredVersion": "6.0.8",
        "requiredBy": "org.springframework:spring-web:6.0.8"
      }
    ]
  }
}
```

**Output:**
```json
{
  "hasConflicts": false,
  "conflicts": [],
  "recommendations": []
}
```

### 3. mend-validate-version

Validate a version against hard constraints.

**Input:**
```json
{
  "currentVersion": "6.0.8",
  "proposedVersion": "6.0.19",
  "groupId": "org.springframework"
}
```

**Output:**
```json
{
  "valid": true,
  "errors": []
}
```

**Invalid (downgrade):**
```json
{
  "currentVersion": "6.0.19",
  "proposedVersion": "6.0.8",
  "groupId": "org.springframework"
}
```

**Output:**
```json
{
  "valid": false,
  "errors": ["Downgrade detected: 6.0.19 → 6.0.8"]
}
```

### 4. mend-parse-report

Parse a Mend vulnerability report.

**Input (JSON):**
```json
{
  "reportContent": "{\"vulnerabilities\": [{\"name\": \"CVE-2024-22262\", \"severity\": \"CRITICAL\"}]}",
  "reportFormat": "json"
}
```

**Output:**
```json
{
  "totalCves": 1,
  "cvesBySeverity": {
    "CRITICAL": 1
  },
  "cves": [
    {
      "cveId": "CVE-2024-22262",
      "severity": "CRITICAL"
    }
  ]
}
```

### 5. mend-get-cve-details

Get CVE details from NVD.

**Input:**
```json
{
  "cveId": "CVE-2024-22262"
}
```

**Output:**
```json
{
  "found": true,
  "cveId": "CVE-2024-22262",
  "description": "Spring Framework URL Parsing Vulnerability...",
  "severity": "HIGH",
  "cvssScore": 7.5,
  "published": "2024-03-01T00:00:00.000",
  "references": ["https://..."]
}
```

## Hard Constraints

The server enforces these constraints:

| Constraint | Enforcement |
|------------|-------------|
| JDK 17 | `jdkCompatible: false` for Java > 17 dependencies |
| No Downgrades | `mend-validate-version` rejects downgrades |
| Spring Boot 4.x | Conflict check flags non-4.x Spring Boot versions |
| Spring Framework 7.x | Conflict check flags non-7.x Spring Framework versions |

## Caching

Maven Central lookups are cached in memory with configurable TTL (default: 1 hour).

## Installation

```bash
cd mcp/
npm install
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MAVEN_CENTRAL_CACHE_TTL` | `3600` | Cache TTL in seconds |
| `LOG_LEVEL` | `info` | Server log level |
| `MEND_API_KEY` | - | Optional Mend API key |

## License

MIT
