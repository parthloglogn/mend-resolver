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
- `projectDependencies`: Full dependency tree from dependency-collector
- `declaringFiles`: All files where this dependency is declared

## Outputs

- Conflict report: list of conflicts found
- Resolution suggestions

## Conflict Types

### Direct Dependency Conflicts
Another direct dependency requires a different version of the same artifact.

Example:
- Module A uses `jackson-databind:2.15.0`
- Proposing upgrade to `2.16.0`
- But Module B explicitly depends on `jackson-databind:2.14.0`

### Transitive Dependency Conflicts
Upgrading a dependency causes a transitive dependency version mismatch.

Example:
- Upgrading `spring-boot-starter-web` from 3.2.0 to 4.0.0
- This brings in `spring-core:7.0.0` transitively
- But another dependency explicitly requires `spring-core:6.1.0`

### Sub-Module Conflicts
A child module overrides a version that conflicts with the parent's managed version.

## API Reference

This skill uses the Mend MCP Server's `mend-check-conflicts` tool:

```json
{
  "tool": "mend-check-conflicts",
  "params": {
    "dependency": "com.example:library",
    "proposedVersion": "1.2.5",
    "currentVersion": "1.2.3",
    "projectRoot": "/path/to/project",
    "allModules": ["module-a", "module-b", "module-c"]
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
    "Add explicit spring-core version 7.0.0 to dependencyManagement",
    "Upgrade com.other:library to version 3.1.0 which supports spring-core 7.0.0"
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
