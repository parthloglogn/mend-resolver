# Step 3: Load the Mend Report

## Objective

Accept the Mend vulnerability report provided by the user, parse CVEs, affected libraries, and severity, then map each CVE to the responsible dependencies.

## Prerequisites

- Step 1 (Repository Analysis) is complete
- Step 2 (Dependency Collection) is complete — dependency map available

## Important Rules

- **DO NOT attempt to discover vulnerabilities manually**
- **Only work from the user-provided Mend report**
- **The Mend report is the single source of truth for CVEs**

## Steps

### 3.1 Accept Mend Report

The Mend report can be provided in several ways:
- File path to a Mend report file (JSON, XML, or PDF)
- Direct content pasted by the user
- File uploaded to the workspace

**Supported Mend Report Formats:**
- Mend (formerly WhiteSource) JSON report
- Mend XML report
- Mend Unified Agent scan results
- CSV/Excel export from Mend portal

### 3.2 Parse the Mend Report

Extract the following fields for each CVE entry:

| Field | Description | Example |
|-------|-------------|---------|
| `cveId` | CVE identifier | CVE-2024-22262 |
| `severity` | Severity level | CRITICAL, HIGH, MEDIUM, LOW |
| `libraryName` | Affected library name | spring-web |
| `groupId` | Maven group ID | org.springframework |
| `artifactId` | Maven artifact ID | spring-web |
| `currentVersion` | Current version in project | 6.0.8 |
| `fixedVersion` | Version that fixes the CVE | 6.0.19 |
| `description` | CVE description | "..." |
| `cvssScore` | CVSS score (if available) | 7.5 |

### 3.3 Map CVEs to Dependencies

For each CVE in the Mend report:

1. Look up the affected library in the dependency map
2. Find ALL `pom.xml` files where this dependency is declared
3. Note the version source for each declaration
4. Cross-reference with explicit version overrides

**Mapping output format:**

```json
{
  "mendReportLoaded": "2026-01-15T10:35:00Z",
  "totalCves": 8,
  "cvesBySeverity": {
    "CRITICAL": 1,
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 2
  },
  "cveMappings": [
    {
      "cveId": "CVE-2024-22262",
      "severity": "CRITICAL",
      "library": {
        "name": "spring-web",
        "coordinates": "org.springframework:spring-web",
        "currentVersion": "6.0.8"
      },
      "mendFixedVersion": "6.0.19",
      "declaredIn": [
        {
          "file": "service-a/pom.xml",
          "versionSource": "parent-bom",
          "hasExplicitVersionOverride": false
        }
      ],
      "description": "Spring Framework URL Parsing Vulnerability"
    }
  ]
}
```

### 3.4 Validate Mappings

For each mapping:
- ✅ Confirm the dependency exists in the project
- ✅ Confirm the current version matches what's in the pom.xml
- ✅ Confirm the declaring files are correct
- ⚠️ If a CVE maps to a dependency NOT found in the project, flag for review

### 3.5 Write Parsed Report

Save parsed results to `.github/mend-resolver/mend-report-parsed.json`:

```json
{
  "parsedAt": "2026-01-15T10:35:00Z",
  "sourceReport": "/path/to/mend-report.json",
  "totalCves": 8,
  "cveMappings": [ ... ],
  "statistics": {
    "bySeverity": { "CRITICAL": 1, "HIGH": 3, "MEDIUM": 2, "LOW": 2 },
    "byVersionSource": {
      "parent-bom": 3,
      "explicit-version": 2,
      "property": 2,
      "dependencyManagement": 1
    }
  },
  "unmappedCves": []
}
```

### 3.6 Present to User

Show the parsed CVE summary:

```
Mend Report Loaded Successfully

📊 CVE Summary:
   CRITICAL: 1 | HIGH: 3 | MEDIUM: 2 | LOW: 2
   Total: 8 CVEs

📁 Top Affected Dependencies:
   - org.springframework:spring-web (1 CVE)
   - com.fasterxml.jackson.core:jackson-databind (2 CVEs)
   - ...

⚠️ Dependencies with explicit version overrides (high-risk):
   - jackson-databind: 2.14.0 (overrides Boot BOM 2.15.3)

→ Ready to proceed to CVE Resolution
```

## Error Handling

| Issue | Action |
|-------|--------|
| Mend report file not found | Ask user to check the path and re-provide |
| Invalid Mend report format | Ask user to export in a supported format |
| CVE maps to dependency not in project | Flag as unmapped, continue with others |
| Mend report contains 0 CVEs | Inform user, ask if they want to proceed with Spring upgrade only |

## Output

- Parsed report: `.github/mend-resolver/mend-report-parsed.json`
- Summary presented to user

## Next Step

→ [Step 4: Resolve CVEs](step-04-resolve-cves.md)
