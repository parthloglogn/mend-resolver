# Version Conflict Check Skill

## Overview

Reusable skill for checking dependency conflicts before applying version upgrades. Critical for multi-module projects.

## When to Use

Called before EVERY version change during CVE resolution to ensure the upgrade doesn't introduce conflicts.

## Purpose

- Check for conflicts with direct dependencies
- Check for conflicts with sub-dependencies (modules)
- Check for conflicts with transitive dependencies
- Identify version convergence issues

## Inputs

- `dependencyCoordinates`: groupId:artifactId
- `proposedVersion`: New version to check
- `currentVersion`: Current version in the project
- `projectDependencies`: Full dependency tree from dependency-collector

## Outputs

- Conflict report: list of conflicts found
- Resolution suggestions

## API Reference

Uses the `mend-check-conflicts` MCP tool:

```json
{
  "tool": "mend-check-conflicts",
  "params": {
    "dependency": "com.example:library",
    "proposedVersion": "1.2.5",
    "currentVersion": "1.2.3",
    "projectDeps": { ... }
  }
}
```

## Response Format

```json
{
  "hasConflicts": true,
  "conflicts": [
    {
      "type": "transitive",
      "dependency": "org.springframework:spring-core",
      "requiredBy": "com.other:library:3.0.0",
      "requiredVersion": "6.1.0",
      "proposedVersion": "7.0.0",
      "severity": "high"
    }
  ],
  "recommendations": [
    "Add explicit spring-core version 7.0.0 to dependencyManagement"
  ]
}
```

## Resolution Strategies

1. **Add explicit version in dependencyManagement**: Force the desired version
2. **Upgrade the conflicting dependency**: Find a version compatible with both
3. **Add exclusion**: Exclude the conflicting transitive dependency
4. **Report as unresolvable**: If no compatible version exists

## Rules
- ALWAYS check conflicts before applying version changes
- For multi-module projects, check ALL modules
- Prefer resolution strategy 1 (explicit version) for controlled upgrades
- Document all conflicts and resolutions
- If conflict cannot be resolved without downgrading, report to coordinator
