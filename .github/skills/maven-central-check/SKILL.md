# Maven Central Check Skill

## Overview

Reusable skill for verifying dependency versions on Maven Central before applying upgrades.

## When to Use

Called before EVERY version change during CVE resolution and Spring upgrades.

## Purpose

- Confirm a version exists on Maven Central
- Extract Java version from POM for JDK compatibility check
- Check for known issues in the target version

## Inputs

- `groupId`: Maven group ID
- `artifactId`: Maven artifact ID
- `version`: Version to check (optional -- returns latest if omitted)

## Outputs

- Exists: true/false
- Java version (from POM if available)
- Artifact URL

## Usage Pattern

```
Before upgrading groupId:artifactId from X.Y.Z to A.B.C:
1. maven-central-lookup(groupId, artifactId, A.B.C)
2. If exists AND (javaVersion <= 17 or not specified) -> proceed
3. If not exists -> find alternative version
4. If javaVersion > 17 -> reject and find alternative
```

## API Reference

Uses the `maven-central-lookup` MCP tool:

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

## JDK Compatibility Check

After receiving the response, check `javaVersion`:
```
IF result.javaVersion exists AND result.javaVersion > 17:
    REJECT -- find older compatible version on Maven Central
```

This native check replaces the removed `mend-validate-version` MCP tool.

## Rules
- ALWAYS check before applying any version change
- Check JDK compatibility from the response
- If version doesn't exist, find the closest higher version
- Cache results to avoid duplicate lookups
