# Mend MCP Server API

## Overview

The Mend MCP Server provides 3 essential tools for CVE resolution:

1. `maven-central-lookup` -- Verify artifacts on Maven Central
2. `mend-parse-report` -- Parse Mend vulnerability reports with topFix
3. `mend-check-conflicts` -- Check dependency conflicts

## Tools

### 1. maven-central-lookup

Verify an artifact version exists on Maven Central and extract metadata.

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
  "javaVersion": 17,
  "url": "https://repo1.maven.org/maven2/org/springframework/spring-web/6.0.19"
}
```

**JDK Check:** Read `javaVersion` from response. If > 17, reject for JDK 17 projects.

---

### 2. mend-parse-report

Parse a Mend vulnerability report and extract CVEs with topFix recommendations.

**Input:**
```json
{
  "reportContent": "<Mend report JSON string>",
  "reportFormat": "json"
}
```

**Output:**
```json
{
  "totalCves": 8,
  "cvesBySeverity": { "CRITICAL": 1, "HIGH": 3, "MEDIUM": 2, "LOW": 2 },
  "cves": [
    {
      "cveId": "CVE-2024-22262",
      "severity": "CRITICAL",
      "groupId": "org.springframework",
      "artifactId": "spring-web",
      "currentVersion": "6.0.8",
      "fixedVersion": "6.0.19",
      "topFix": {
        "fixResolution": "6.0.19",
        "origin": "MEND",
        "url": "https://..."
      }
    }
  ]
}
```

**Key Field:** `topFix.fixResolution` -- Mend's recommended fix version. Use this as the primary target.

---

### 3. mend-check-conflicts

Check for dependency conflicts before upgrading a version.

**Input:**
```json
{
  "dependency": "org.springframework:spring-web",
  "proposedVersion": "6.0.19",
  "currentVersion": "6.0.8",
  "projectDeps": {
    "direct": [...],
    "transitive": [...]
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

## Constraint Enforcement

Hard constraints (no downgrades, JDK 17, Spring alignment) are enforced **natively by the agents**, not by MCP tools. This design:

- Reduces MCP tool complexity
- Eliminates unnecessary API calls
- Keeps constraint logic visible in agent definitions
- Makes the system easier to audit and modify

## Removed Tools (v1.0 -> v1.1)

| Tool | Reason for Removal |
|------|-------------------|
| `mend-validate-version` | Constraint checks (no-downgrade, JDK 17) are done natively by agents |
| `mend-get-cve-details` | Mend report already contains CVE descriptions and severity |
