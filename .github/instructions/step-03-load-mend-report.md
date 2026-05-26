# Step 3: Load the Mend Report

## Objective

Accept the Mend vulnerability report provided by the user, parse CVEs, affected libraries, and severity, then map each CVE to responsible dependencies. Use Mend's **topFix** as the primary target version for migration. Count how many places (files/modules) each CVE affects.

## Prerequisites

- Step 1 (Repository Analysis) is complete
- Step 2 (Dependency Collection) is complete -- dependency map available

## Important Rules

- **DO NOT attempt to discover vulnerabilities manually**
- **Only work from the user-provided Mend report**
- **Use Mend's topFix as the primary target version**
- **Count affected files per CVE** to know "how many places need changes"

## Steps

### 3.1 Accept Mend Report

The Mend report can be provided as:
- File path to a Mend report file (JSON, XML, or CSV)
- Direct content pasted by the user
- File uploaded to the workspace

**Supported Formats:**
- Mend JSON report (with topFix field)
- Mend XML report
- Mend Unified Agent scan results
- CSV/Excel export from Mend portal

### 3.2 Parse the Mend Report (via MCP)

Call `mend-parse-report` MCP tool to parse the report:

```
mend-parse-report {
    "reportContent": "<report JSON/XML content>",
    "reportFormat": "json"
}
```

Extract these fields for each CVE:

| Field | Description | Source |
|-------|-------------|--------|
| `cveId` | CVE identifier | Mend report |
| `severity` | CRITICAL, HIGH, MEDIUM, LOW | Mend report |
| `libraryName` | Affected library | Mend report |
| `groupId` | Maven group ID | Mend report |
| `artifactId` | Maven artifact ID | Mend report |
| `currentVersion` | Current version in project | Mend report |
| **topFix** | **Mend's recommended fix version** | **Mend report `topFix.fixResolution`** |
| `description` | CVE description | Mend report |
| `cvssScore` | CVSS score | Mend report |

### 3.3 Map CVEs to Dependencies & Count Affected Files

For each CVE in the Mend report:

1. Look up the affected library in the dependency map
2. **Count HOW MANY `pom.xml` files declare this dependency**
3. Find ALL declaring files with their version source
4. Cross-reference with explicit version overrides

**Example mapping output:**

```json
{
  "cveMappings": [
    {
      "cveId": "CVE-2024-22262",
      "severity": "CRITICAL",
      "library": {
        "name": "spring-web",
        "coordinates": "org.springframework:spring-web",
        "currentVersion": "6.0.8"
      },
      "topFix": {
        "fixResolution": "6.0.19",
        "origin": "MEND",
        "url": "https://..."
      },
      "declaredIn": [
        {
          "file": "root/pom.xml",
          "versionSource": "parent-bom",
          "hasExplicitVersionOverride": false
        }
      ],
      "affectedFilesCount": 1,
      "description": "Spring Framework URL Parsing Vulnerability"
    },
    {
      "cveId": "CVE-2024-XXXXX",
      "severity": "HIGH",
      "library": {
        "name": "jackson-databind",
        "coordinates": "com.fasterxml.jackson.core:jackson-databind",
        "currentVersion": "2.14.0"
      },
      "topFix": {
        "fixResolution": "2.15.3",
        "origin": "MEND",
        "url": "https://..."
      },
      "declaredIn": [
        {
          "file": "root/pom.xml",
          "versionSource": "dependencyManagement",
          "hasExplicitVersionOverride": true,
          "versionProperty": "jackson.version"
        },
        {
          "file": "service-a/pom.xml",
          "versionSource": "direct-version",
          "hasExplicitVersionOverride": true
        },
        {
          "file": "service-b/pom.xml",
          "versionSource": "direct-version",
          "hasExplicitVersionOverride": true
        }
      ],
      "affectedFilesCount": 3,
      "description": "Jackson Deserialization Vulnerability"
    }
  ]
}
```

### 3.4 Summarize "How Many Places Need Changes"

Present to user:

```
Mend Report Loaded Successfully

CVE Summary:
   CRITICAL: 1 | HIGH: 3 | MEDIUM: 2 | LOW: 2
   Total: 8 CVEs

Top Fix Versions Identified:
   CVE-2024-22262 (CRITICAL) -> spring-web 6.0.19 (topFix)
   CVE-2024-XXXXX (HIGH) -> jackson-databind 2.15.3 (topFix)
   ...

Places Requiring Changes per CVE:
   - jackson-databind: 3 files (root/pom.xml property, service-a/pom.xml, service-b/pom.xml)
   - spring-web: 1 file (Boot BOM managed)
   - ...

Strategy: Update root property for jackson (fixes 3 modules at once)
```

### 3.5 Write Parsed Report

Save to `.github/mend-resolver/mend-report-parsed.json`:

```json
{
  "parsedAt": "2026-01-15T10:35:00Z",
  "sourceReport": "/path/to/mend-report.json",
  "totalCves": 8,
  "cveMappings": [ ... ],
  "statistics": {
    "bySeverity": { "CRITICAL": 1, "HIGH": 3, "MEDIUM": 2, "LOW": 2 },
    "byVersionSource": { "parent-bom": 3, "explicit-version": 2, "property": 2, "dependencyManagement": 1 },
    "totalAffectedFiles": 15,
    "topFixUsage": { "used": 7, "downgradeAvoided": 1 }
  }
}
```

## Error Handling

| Issue | Action |
|-------|--------|
| Mend report file not found | Ask user to check path |
| Invalid format | Ask user to export in supported format |
| CVE maps to dependency not in project | Flag as unmapped, continue |
| No CVEs found | Ask if they want Spring upgrade only |
| topFix missing | Will use Maven Central lookup as fallback |

## Next Step

-> [Step 4: Resolve CVEs](step-04-resolve-cves.md)
