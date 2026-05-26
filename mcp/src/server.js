#!/usr/bin/env node
/**
 * Mend MCP Server — Optimized
 *
 * An MCP (Model Context Protocol) server providing essential tools for:
 * - Maven Central artifact lookups and version validation
 * - Mend vulnerability report parsing
 * - Dependency conflict checking
 *
 * Constraint enforcement is handled natively by the agents using the
 * documented hard constraints. Only essential MCP tools are exposed.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} = require('@modelcontextprotocol/sdk/types.js');

const axios = require('axios');
const xml2js = require('xml2js');

// -- Configuration -----------------------------------------------------------

const CONFIG = {
  mavenCentralUrl: 'https://search.maven.org/solrsearch/select',
  mavenCentralArtifactUrl: 'https://repo1.maven.org/maven2',
  cacheTtl: parseInt(process.env.MAVEN_CENTRAL_CACHE_TTL || '3600', 10) * 1000
};

const cache = new Map();

// -- Cache Helpers -----------------------------------------------------------

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CONFIG.cacheTtl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// -- Maven Central API -------------------------------------------------------

/**
 * Look up an artifact on Maven Central.
 */
async function mavenCentralLookup(groupId, artifactId, version) {
  const cacheKey = `lookup:${groupId}:${artifactId}:${version || 'latest'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    if (version) {
      const path = `${groupId.replace(/\./g, '/')}/${artifactId}/${version}/${artifactId}-${version}.pom`;
      const url = `${CONFIG.mavenCentralArtifactUrl}/${path}`;

      try {
        const response = await axios.head(url, { timeout: 10000 });
        const result = {
          exists: response.status === 200,
          version,
          url: url.replace('.pom', '')
        };

        // Extract java version from POM if available
        try {
          const pomResponse = await axios.get(url, { timeout: 10000 });
          const parser = new xml2js.Parser();
          const pom = await parser.parseStringPromise(pomResponse.data);

          if (pom.project && pom.project.properties) {
            const props = pom.project.properties[0];
            if (props['java.version']) {
              result.javaVersion = parseInt(props['java.version'][0], 10);
            }
            if (props['maven.compiler.source']) {
              result.javaVersion = result.javaVersion || parseInt(props['maven.compiler.source'][0], 10);
            }
            if (props['maven.compiler.release']) {
              result.javaVersion = result.javaVersion || parseInt(props['maven.compiler.release'][0], 10);
            }
          }
        } catch {
          // POM parsing failed, but artifact exists
        }

        setCached(cacheKey, result);
        return result;
      } catch (err) {
        if (err.response && err.response.status === 404) {
          const result = { exists: false, version };
          setCached(cacheKey, result);
          return result;
        }
        throw err;
      }
    } else {
      // Search for latest version
      const searchUrl = `${CONFIG.mavenCentralUrl}?q=g:${groupId}+AND+a:${artifactId}&rows=1&core=gav&sort=v+desc`;
      const response = await axios.get(searchUrl, { timeout: 10000 });
      const docs = response.data?.response?.docs || [];

      if (docs.length === 0) {
        return { exists: false, error: 'Artifact not found on Maven Central' };
      }

      const latest = docs[0];
      const result = {
        exists: true,
        version: latest.v,
        latestVersion: latest.v,
        packaging: latest.p || 'jar',
        timestamp: latest.timestamp
      };

      setCached(cacheKey, result);
      return result;
    }
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Maven Central lookup failed: ${error.message}`
    );
  }
}

/**
 * Get all versions of an artifact from Maven Central.
 */
async function getAllVersions(groupId, artifactId) {
  const cacheKey = `versions:${groupId}:${artifactId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const searchUrl = `${CONFIG.mavenCentralUrl}?q=g:${groupId}+AND+a:${artifactId}&rows=50&core=gav&sort=v+desc`;
    const response = await axios.get(searchUrl, { timeout: 10000 });
    const docs = response.data?.response?.docs || [];

    const versions = docs.map(doc => ({
      version: doc.v,
      packaging: doc.p,
      timestamp: doc.timestamp
    }));

    const result = { versions };
    setCached(cacheKey, result);
    return result;
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to fetch versions: ${error.message}`
    );
  }
}

// -- Mend Report Parsing -----------------------------------------------------

/**
 * Parse a Mend vulnerability report.
 * Extracts CVE entries including the "topFix" recommendation from Mend.
 */
async function parseMendReport(reportContent, reportFormat = 'json') {
  try {
    let cves = [];

    if (reportFormat === 'json') {
      const report = typeof reportContent === 'string' ? JSON.parse(reportContent) : reportContent;

      // Handle Mend JSON report with topFix field
      if (report.vulnerabilities) {
        cves = report.vulnerabilities.map(v => {
          const topFix = v.topFix || {};
          return {
            cveId: v.name || v.cveId,
            severity: v.severity || 'UNKNOWN',
            libraryName: v.library?.name,
            groupId: v.library?.groupId,
            artifactId: v.library?.artifactId,
            currentVersion: v.library?.version,
            // topFix is Mend's recommended fix — use this as primary target version
            fixedVersion: topFix.fixResolution || v.fixedVersion,
            topFix: {
              fixResolution: topFix.fixResolution,
              origin: topFix.origin,
              url: topFix.url,
              date: topFix.date
            },
            description: v.description,
            cvssScore: v.cvss3Score || v.cvssScore
          };
        });
      } else if (Array.isArray(report)) {
        cves = report.map(v => ({
          cveId: v.cveId || v.name,
          severity: v.severity || 'UNKNOWN',
          libraryName: v.libraryName,
          groupId: v.groupId,
          artifactId: v.artifactId,
          currentVersion: v.currentVersion,
          fixedVersion: v.topFix?.fixResolution || v.fixedVersion,
          topFix: v.topFix || null,
          description: v.description,
          cvssScore: v.cvssScore
        }));
      }
    } else if (reportFormat === 'xml') {
      const parser = new xml2js.Parser();
      const parsed = await parser.parseStringPromise(reportContent);
      const vulns = parsed?.report?.vulnerabilities?.[0]?.vulnerability || [];
      cves = vulns.map(v => ({
        cveId: v.$.name,
        severity: v.$.severity,
        libraryName: v.library?.[0]?._,
        groupId: v.library?.[0]?.$?.groupId,
        artifactId: v.library?.[0]?.$?.artifactId,
        currentVersion: v.library?.[0]?.$?.version,
        fixedVersion: v.fix?.[0]?.$?.version || v.topFix?.[0]?.$?.fixResolution,
        description: v.description?.[0]
      }));
    } else if (reportFormat === 'csv') {
      const lines = reportContent.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      cves = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const entry = {};
        headers.forEach((h, i) => { entry[h] = values[i]; });
        return {
          cveId: entry.cveId || entry.CVE || entry.Name,
          severity: entry.severity || entry.Severity || 'UNKNOWN',
          libraryName: entry.libraryName || entry.Library,
          groupId: entry.groupId || entry.GroupId,
          artifactId: entry.artifactId || entry.ArtifactId,
          currentVersion: entry.currentVersion || entry.Version,
          fixedVersion: entry.fixedVersion || entry.FixVersion || entry.TopFix,
          description: entry.description || entry.Description,
          cvssScore: entry.cvssScore || entry.CVSS
        };
      });
    }

    return {
      totalCves: cves.length,
      cvesBySeverity: cves.reduce((acc, cve) => {
        acc[cve.severity] = (acc[cve.severity] || 0) + 1;
        return acc;
      }, {}),
      cves
    };
  } catch (error) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Failed to parse Mend report: ${error.message}`
    );
  }
}

// -- Conflict Checking -------------------------------------------------------

/**
 * Check for dependency conflicts when upgrading a dependency version.
 */
async function checkConflicts(dependency, proposedVersion, currentVersion, projectDeps) {
  const conflicts = [];

  const [groupId, artifactId] = dependency.split(':');

  // Direct dependency conflicts
  for (const dep of projectDeps.direct || []) {
    if (dep.coordinates === dependency && dep.version && dep.version !== proposedVersion) {
      if (dep.version !== currentVersion) {
        conflicts.push({
          type: 'direct',
          dependency: dep.coordinates,
          conflictingVersion: dep.version,
          proposedVersion,
          location: dep.file || 'unknown',
          severity: 'high'
        });
      }
    }
  }

  // Transitive dependency conflicts
  for (const dep of projectDeps.transitive || []) {
    if (dep.coordinates === dependency && dep.requiredVersion) {
      const requiredMajor = parseInt(dep.requiredVersion.split('.')[0], 10);
      const proposedMajor = parseInt(proposedVersion.split('.')[0], 10);

      if (requiredMajor > proposedMajor) {
        conflicts.push({
          type: 'transitive',
          dependency: dep.coordinates,
          requiredBy: dep.requiredBy,
          requiredVersion: dep.requiredVersion,
          proposedVersion,
          severity: 'medium'
        });
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    recommendations: generateRecommendations(conflicts)
  };
}

function generateRecommendations(conflicts) {
  const recommendations = [];
  for (const conflict of conflicts) {
    switch (conflict.type) {
      case 'direct':
        recommendations.push(
          `Update explicit version in ${conflict.location} to ${conflict.proposedVersion} for consistency`
        );
        break;
      case 'transitive':
        recommendations.push(
          `Add ${conflict.dependency}:${conflict.proposedVersion} to dependencyManagement to force version`
        );
        break;
    }
  }
  return recommendations;
}

// -- MCP Server Setup --------------------------------------------------------

const server = new Server(
  { name: 'mend-mcp-server', version: '1.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'maven-central-lookup',
        description: 'Look up an artifact version on Maven Central. Verifies existence and extracts Java version from POM.',
        inputSchema: {
          type: 'object',
          properties: {
            groupId: {
              type: 'string',
              description: 'Maven group ID (e.g., org.springframework)'
            },
            artifactId: {
              type: 'string',
              description: 'Maven artifact ID (e.g., spring-web)'
            },
            version: {
              type: 'string',
              description: 'Specific version to check (optional, returns latest if omitted)'
            }
          },
          required: ['groupId', 'artifactId']
        }
      },
      {
        name: 'mend-parse-report',
        description: 'Parse a Mend vulnerability report (JSON/XML/CSV). Extracts CVE entries with topFix recommendations.',
        inputSchema: {
          type: 'object',
          properties: {
            reportContent: {
              type: 'string',
              description: 'The report content as a string'
            },
            reportFormat: {
              type: 'string',
              enum: ['json', 'xml', 'csv'],
              description: 'Format of the Mend report',
              default: 'json'
            }
          },
          required: ['reportContent']
        }
      },
      {
        name: 'mend-check-conflicts',
        description: 'Check for dependency conflicts (direct/transitive/sub-module) before upgrading.',
        inputSchema: {
          type: 'object',
          properties: {
            dependency: {
              type: 'string',
              description: 'Dependency coordinates (groupId:artifactId)'
            },
            proposedVersion: {
              type: 'string',
              description: 'Proposed new version'
            },
            currentVersion: {
              type: 'string',
              description: 'Current version in the project'
            },
            projectDeps: {
              type: 'object',
              description: 'Project dependencies structure with direct and transitive arrays'
            }
          },
          required: ['dependency', 'proposedVersion', 'currentVersion', 'projectDeps']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'maven-central-lookup': {
        const { groupId, artifactId, version } = args;
        const result = await mavenCentralLookup(groupId, artifactId, version);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      case 'mend-parse-report': {
        const { reportContent, reportFormat } = args;
        const result = await parseMendReport(reportContent, reportFormat);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      case 'mend-check-conflicts': {
        const { dependency, proposedVersion, currentVersion, projectDeps } = args;
        const result = await checkConflicts(dependency, proposedVersion, currentVersion, projectDeps);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) throw error;
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
  }
});

// -- Server Startup ----------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Mend MCP Server v1.1.0 started (optimized — 3 tools)');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
