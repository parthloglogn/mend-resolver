# mend-resolver

> Autonomous CVE resolution using Mend vulnerability reports with topFix guidance and multi-agent orchestration.

## Overview

**mend-resolver** is a GitHub agent framework that autonomously resolves CVE vulnerabilities using Mend (formerly WhiteSource) reports. It uses Mend's **topFix** recommendation as the primary target version for each migration.

Key capabilities:
- **Mend Report Parsing** -- Extracts CVEs with topFix recommendations
- **Dependency Tree Comparison** -- Counts exactly how many places need changes per CVE
- **One-by-One Migration** -- Processes CVEs individually in severity order
- **Build Verification** -- Confirms clean build after all changes

## Features

- **Repository Analysis** -- Detects project type, modules, Spring versions, Java version
- **Dependency Collection** -- Maps every dependency to all declaring files across modules
- **Mend Report Integration** -- Parses CVEs and uses **topFix** as primary target version
- **Affected File Counting** -- Reports exactly "how many places need changes" per CVE
- **CVE Resolution** -- Applies targeted one-by-one upgrades using topFix guidance
- **Build Verification** -- Runs `mvn clean install` and confirms clean build

## Hard Constraints (Never Violated)

| Constraint | Rule |
|------------|------|
| **Top Fix First** | Use Mend's topFix as the primary target version |
| **No Downgrades** | Never reduce a dependency version |
| **JDK 17** | Every change must be compatible with JDK 17 |
| **Spring Boot 4.x** | Target the Spring Boot 4.x.x series |
| **Spring Framework 7.x** | Target the Spring Framework 7.x.x series |
| **Maven 3.9.x** | Compatible with Maven 3.9.x |
| **Conflict Check** | Check conflicts before every upgrade |
| **Maven Central** | Verify every version on Maven Central |
| **Multi-Module** | Check all POMs before changing shared dependencies |

## Architecture

```
mend-resolver/
.github/
  agents/
    resolver.agent.md                    # Main orchestrator
    analysis-coordinator.agent.md         # Repository analysis
    cve-resolution-coordinator.agent.md   # CVE resolution with topFix
    mend-cve-fix.agent.md                 # Individual CVE fix executor
    spring-upgrade.agent.md               # Spring version upgrades
    build-verification.agent.md           # Build verification
  skills/
    dependency-collector/                 # Collect all dependencies
    cve-resolution/                       # CVE resolution with topFix
    build-verification/                   # Build verification
    spring-upgrade/                       # Spring upgrade skill
    maven-central-check/                  # Maven Central verification
    version-conflict-check/               # Conflict detection
  hooks/
    pre-analysis.hook.md                  # Pre-analysis validation
    post-analysis.hook.md                 # Post-analysis validation
    pre-resolution.hook.md                # Pre-resolution setup
    post-resolution.hook.md               # Post-resolution validation
    pre-build.hook.md                     # Pre-build environment check
    post-build.hook.md                    # Post-build finalization
  instructions/
    step-01-analyze-repo.md               # Step 1: Analyze repository
    step-02-collect-dependencies.md       # Step 2: Collect dependencies
    step-03-load-mend-report.md           # Step 3: Load Mend report (with topFix)
    step-04-resolve-cves.md               # Step 4: Resolve CVEs (one by one)
    step-05-clean-build.md                # Step 5: Clean build verification
mcp/                                      # MCP server (3 essential tools)
  src/
    server.js                             # MCP server implementation
  config/
    mcp-server-config.json                # MCP configuration
  docs/
    API.md                                # API documentation
  package.json
  .env.example
README.md
```

## Workflow

```
User provides: target repository + Mend vulnerability report

Step 1: Analyze Repository
  - Detect project type, modules, Spring versions, Java version

Step 2: Collect Dependencies
  - Map all dependencies to declaring files across all modules

Step 3: Load Mend Report
  - Parse CVEs using mend-parse-report MCP
  - Extract topFix as primary target version for each CVE
  - Count how many files/modules each CVE affects

Step 4: Resolve CVEs (ONE BY ONE)
  - For each CVE (CRITICAL -> HIGH -> MEDIUM -> LOW):
    1. Get topFix from Mend report as target version
    2. Count affected files from dependency map
    3. Verify on Maven Central via maven-central-lookup
    4. Check JDK 17 compatibility (native check)
    5. Enforce no-downgrade rule (native check)
    6. Check dependency conflicts via mend-check-conflicts
    7. Apply version change using most efficient strategy
    8. Log the change

Step 5: Clean Build
  - Run mvn clean install
  - Fix any compilation errors (max 10 attempts)
  - Confirm all CVE fixes preserved
  - Confirm successful build
```

## Agent Hierarchy

```
resolver (orchestrator)
  - analysis-coordinator
  - dependency-collector (skill)
  - cve-resolution-coordinator
    - mend-cve-fix (agent -- one by one)
  - spring-upgrade (agent)
  - build-verification (agent)
```

## MCP Server (Simplified)

The MCP server exposes only 3 essential tools:

| Tool | Purpose |
|------|---------|
| `maven-central-lookup` | Verify artifact versions on Maven Central, extract Java version |
| `mend-parse-report` | Parse Mend reports, extract CVEs with topFix recommendations |
| `mend-check-conflicts` | Check dependency conflicts before upgrades |

**Removed tools (not needed):**
- `mend-validate-version` -- replaced by native constraint checks in agents
- `mend-get-cve-details` -- Mend report already contains CVE descriptions

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

Invoke the resolver agent:

```
"Resolve CVEs in my project using this Mend report: /path/to/mend-report.json"
```

The resolver will:
1. Analyze your repository
2. Collect all dependencies
3. Load the Mend report and extract topFix versions
4. Count affected files per CVE
5. Resolve CVEs one by one using topFix guidance
6. Verify clean build

## Report Outputs

After completion, find all reports in `.github/mend-resolver/`:

| Report | Contents |
|--------|----------|
| `analysis-report.md` | Project structure, versions, module layout |
| `dependency-map.json` | All dependencies mapped to declaring files |
| `mend-report-parsed.json` | Parsed Mend CVE data with topFix |
| `resolution-report.md` | CVE fixes applied, topFix usage, constraints |
| `change-log.md` | Detailed log of every version change |
| `build-report.md` | Build results, test status |
| `FINAL_SUMMARY.md` | Complete workflow summary |

## What This Agent Does NOT Do

- **No Azure migration** -- Only CVE resolution and Spring upgrades
- **No manual CVE hunting** -- Only works from the provided Mend report
- **No dependency downgrades** -- Never reduces any version
- **No .NET support** -- Java/Maven/Gradle projects only
- **No unnecessary MCP tools** -- Only 3 essential tools exposed

## Requirements

- **JDK 17** -- Target Java version
- **Maven 3.9.x** -- Build tool version
- **Node.js 18+** -- For MCP server
- **Mend Report** -- User-provided vulnerability report (JSON/XML/CSV)

## License

MIT
