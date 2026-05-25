# Maven Central Check Skill

## Overview

Reusable skill for verifying dependency versions on Maven Central before applying upgrades.

## When to Use

Called before EVERY version change during CVE resolution and Spring upgrades.

## Purpose

- Confirm a version exists on Maven Central
- Verify JDK compatibility metadata
- Check for known vulnerabilities in the target version
- Get the latest available version in a series

## Inputs

- `groupId`: Maven group ID
- `artifactId`: Maven artifact ID
- `version`: Version to check (optional — returns latest if omitted)
- `checkLatest`: Whether to find the latest version

## Outputs

- Exists: true/false
- JDK compatibility info
- Latest version in series
- Known CVEs in target version

## Usage Pattern

```
Before upgrading groupId:artifactId from X.Y.Z to A.B.C:
1. maven-central-check(groupId, artifactId, A.B.C)
2. If exists and JDK 17 compatible → proceed
3. If not exists → find alternative version
4. If not JDK 17 compatible → reject and find alternative
```

## API Reference

This skill uses the Mend MCP Server's `maven-central-lookup` tool:

```json
{
  "tool": "maven-central-lookup",
  "params": {
    "groupId": "com.example",
    "artifactId": "library",
    "version": "1.2.5"
  }
}
```

## Response Format

```json
{
  "exists": true,
  "version": "1.2.5",
  "packaging": "jar",
  "javaVersion": "17",
  "jdkCompatible": true,
  "uploaded": "2024-03-15T10:00:00Z",
  "knownCves": []
}
```

## Rules
- ALWAYS check before applying any version change
- If version doesn't exist, find the closest higher version
- If JDK incompatible, reject and find alternative
- Cache results to avoid duplicate lookups
