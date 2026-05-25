# mend-resolver

> Autonomous CVE resolution and Spring Boot modernization using multi-agent orchestration with Mend vulnerability reports.

## Overview

**mend-resolver** is an MCP-based GitHub agent framework that autonomously resolves CVE vulnerabilities using Mend (formerly WhiteSource) reports and upgrades Spring Boot & Spring Framework to their latest compatible versions.

Unlike general-purpose modernization tools, **mend-resolver** is strictly focused on:
- Upgrading **Spring Boot** to the **4.x.x** series
- Upgrading **Spring Framework** to the **7.x.x** series
- Resolving **CVE vulnerabilities** from a user-provided Mend report
- Ensuring the project **builds successfully** after all changes

## Features

- **Repository Analysis** — Automatically scans and understands project structure (single/multi-module Maven/Gradle)
- **Dependency Collection** — External skill that maps every dependency to its declaring files across all modules
- **Mend Report Integration** — Parses Mend vulnerability reports and maps CVEs to dependencies
- **CVE Resolution** — Applies targeted upgrades with strict constraint enforcement
- **Spring Upgrade** — Upgrades Spring Boot and Spring Framework to target series
- **Build Verification** — Runs `mvn clean install` and fixes compilation issues
- **Multi-Agent Orchestration** — Specialized agents handle each phase with automatic routing

## Hard Constraints (Never Violated)

| Constraint | Rule |
|------------|------|
| **No Downgrades** | Never reduce a dependency version under any circumstance |
| **JDK 17** | Every dependency change must be compatible with JDK 17 |
| **Spring Boot 4.x** | Target the Spring Boot 4.x.x series |
| **Spring Framework 7.x** | Target the Spring Framework 7.x.x series |
| **Maven 3.9.x** | Compatible with Maven 3.9.x |
| **Conflict Check** | Before changing any version, check for conflicts with all direct, sub-, and transitive dependencies |
| **Maven Central** | Always verify the latest compatible version on Maven Central before applying any upgrade |
| **Multi-Module** | Check all POMs before changing a shared dependency |
| **Mend Report Only** | Only work from the user-provided Mend report — no manual CVE hunting |

## Architecture

```
mend-resolver/
├── .github/
│   ├── agents/                          # Agent definitions
│   │   ├── resolver.agent.md            # Main orchestrator
│   │   ├── analysis-coordinator.agent.md # Repository analysis
│   │   ├── cve-resolution-coordinator.agent.md  # CVE resolution
│   │   ├── spring-upgrade.agent.md      # Spring version upgrades
│   │   ├── build-verification.agent.md  # Build verification
│   │   └── mend-cve-fix.agent.md        # Individual CVE fix executor
│   ├── skills/                          # Reusable skills
│   │   ├── dependency-collector/        # External skill — collect all dependencies
│   │   ├── cve-resolution/              # CVE resolution skill
│   │   ├── build-verification/          # Build verification skill
│   │   ├── spring-upgrade/              # Spring upgrade skill
│   │   ├── maven-central-check/         # Maven Central verification skill
│   │   └── version-conflict-check/      # Conflict detection skill
│   ├── hooks/                           # Pre/post action hooks
│   │   ├── pre-analysis.hook.md
│   │   ├── post-analysis.hook.md
│   │   ├── pre-resolution.hook.md
│   │   ├── post-resolution.hook.md
│   │   ├── pre-build.hook.md
│   │   └── post-build.hook.md
│   └── instructions/                    # Step-by-step instructions
│       ├── step-01-analyze-repo.md
│       ├── step-02-collect-dependencies.md
│       ├── step-03-load-mend-report.md
│       ├── step-04-resolve-cves.md
│       └── step-05-clean-build.md
├── mcp/                                 # MCP server
│   ├── src/
│   │   └── server.js                    # MCP server implementation
│   ├── config/
│   │   └── mcp-server-config.json       # MCP server configuration
│   ├── docs/
│   │   └── API.md                       # API documentation
│   ├── package.json
│   └── .env.example
└── README.md
```

## Workflow

```
User provides: target repository + Mend vulnerability report

Step 1: Analyze Repository
  └─ Detect project type, modules, Spring versions, Java version

Step 2: Collect Dependencies (External Skill)
  └─ Map all dependencies to their declaring files across all modules

Step 3: Load Mend Report
  └─ Parse CVEs, affected libraries, severity
  └─ Map each CVE to dependency and declaring files

Step 4: Resolve CVEs
  └─ For each CVE (CRITICAL → HIGH → MEDIUM → LOW):
      1. Identify vulnerable dependency
      2. Find all declaring files
      3. Determine target version (no downgrades)
      4. Verify on Maven Central
      5. Check JDK 17 compatibility
      6. Check dependency conflicts
      7. Check Spring alignment
      8. Apply version change
      9. Log the change

Step 5: Clean & Build
  └─ Run mvn clean install (or Gradle equivalent)
  └─ Fix any compilation errors (max 10 attempts)
  └─ Confirm successful build
```

## Agent Hierarchy

```
resolver (orchestrator)
├── analysis-coordinator
├── dependency-collector (skill)
├── cve-resolution-coordinator
│   ├── spring-upgrade (agent)
│   └── mend-cve-fix (agent)
└── build-verification (agent)
```

The orchestrator detects user intent and routes through the appropriate workflow. All actual work is delegated to specialized agents — the orchestrator never edits files or runs builds directly.

## MCP Server

The included MCP server (`mcp/`) provides tools for:

| Tool | Purpose |
|------|---------|
| `maven-central-lookup` | Verify artifact versions on Maven Central |
| `mend-check-conflicts` | Check dependency conflicts before upgrades |
| `mend-validate-version` | Validate versions against hard constraints |
| `mend-parse-report` | Parse Mend vulnerability reports |
| `mend-get-cve-details` | Get CVE details from NVD |

### Running the MCP Server

```bash
cd mcp/
npm install
npm start
```

## Installation

1. Clone or copy this repository to your project
2. Configure the MCP server in your agent environment
3. Provide the Mend vulnerability report
4. Run the resolver workflow

## Usage

### Starting the Workflow

Invoke the resolver agent with your project and Mend report:

```
"Resolve CVEs in my project using this Mend report: /path/to/mend-report.json"
```

### Workflow Phases

The resolver will automatically guide you through:
1. Repository analysis
2. Dependency collection
3. Mend report loading
4. CVE resolution
5. Build verification

Each phase presents results and proceeds to the next. The orchestrator handles all delegation to specialized agents.

## What This Agent Does NOT Do

- **No Azure migration** — This agent does not migrate applications to Azure
- **No manual CVE hunting** — Only works from the provided Mend report
- **No dependency downgrades** — Never reduces any version
- **No .NET support** — Java/Maven/Gradle projects only
- **No architectural changes** — Only version upgrades and minimal compilation fixes

## Report Outputs

After completion, find all reports in `.github/mend-resolver/`:

| Report | Contents |
|--------|----------|
| `analysis-report.md` | Project structure, versions, module layout |
| `dependency-map.json` | All dependencies mapped to declaring files |
| `mend-report-parsed.json` | Parsed Mend CVE data |
| `resolution-report.md` | CVE fixes applied, constraints compliance |
| `change-log.md` | Detailed log of every version change |
| `spring-upgrade-log.md` | Spring Boot/Framework upgrade details |
| `build-report.md` | Build results, test status |
| `FINAL_SUMMARY.md` | Complete workflow summary |

## Requirements

- **JDK 17** — Target Java version for all dependency compatibility
- **Maven 3.9.x** — Build tool version
- **Node.js 18+** — For MCP server (if using included server)
- **Mend Report** — User-provided vulnerability report

## License

MIT
