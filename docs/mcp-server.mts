import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readdir, readFile } from "fs/promises";
import { join, relative } from "path";
import { fileURLToPath } from "url";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import MiniSearch from "minisearch";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const SEARCH_DIRS = [join(__dirname, "docs"), join(__dirname, "examples")];

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .md files under a directory.
 */
async function collectMarkdownFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const results = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Index — built once at startup
// ---------------------------------------------------------------------------

/**
 * @typedef {{ id: string, path: string, filename: string, content: string }} DocRecord
 */

const miniSearch = new MiniSearch({
  fields: ["filename", "content"],
  storeFields: ["path", "content"],
  searchOptions: {
    boost: { filename: 2 }, // filename matches rank higher
    fuzzy: 0.2, // allow up to 20 % edit-distance per term
    prefix: true, // also match term prefixes
  },
});

/** @type {Map<string, string>} path → raw content (for snippet extraction) */
const docStore = new Map();

async function buildIndex() {
  const allFiles = (await Promise.all(SEARCH_DIRS.map(collectMarkdownFiles))).flat();

  const records = [];
  for (const filePath of allFiles) {
    let content;
    try {
      content = await readFile(filePath, "utf-8");
    } catch {
      continue;
    }
    const path = relative(__dirname, filePath).replace(/\\/g, "/");
    const filename = path.split("/").pop() ?? path;
    docStore.set(path, content);
    records.push({ id: path, path, filename, content });
  }

  miniSearch.addAll(records);
  return records.length;
}

// ---------------------------------------------------------------------------
// Snippet extraction
// ---------------------------------------------------------------------------

/**
 * Return up to `maxSnippets` context windows around lines matching any of
 * the given terms (case-insensitive). Falls back to the first N lines when
 * no match is found (e.g. pure filename match).
 */
function extractSnippets(content: string, terms: string[], contextLines = 3, maxSnippets = 5): string[] {
  const lines = content.split("\n");
  const lowerTerms = terms.map((t) => t.toLowerCase());
  const snippets = [];
  const usedLines = new Set<number>();

  for (let i = 0; i < lines.length && snippets.length < maxSnippets; i++) {
    const lower = lines[i].toLowerCase();
    if (!lowerTerms.some((t) => lower.includes(t))) continue;
    const start = Math.max(0, i - contextLines);
    const end = Math.min(lines.length - 1, i + contextLines);
    if ([...usedLines].some((l) => l >= start && l <= end)) continue;
    for (let l = start; l <= end; l++) usedLines.add(l);
    snippets.push(lines.slice(start, end + 1).join("\n"));
  }

  // Fallback: return the first few lines so the AI always has some context.
  if (snippets.length === 0) {
    snippets.push(lines.slice(0, Math.min(10, lines.length)).join("\n"));
  }

  return snippets;
}

// ---------------------------------------------------------------------------
// MCP server
// ---------------------------------------------------------------------------

function createServer() {
  const server = new McpServer({
    name: "Emile Docs MCP Server",
    version: "1.0.0",
  });

  server.tool(
    "searchDocs",
    "Search the Emile documentation and examples. Supports fuzzy matching and prefix search. Returns ranked file paths with relevant text snippets. It is recommended to keep maxResults small and then refining the search based on the results, if required.",
    {
      query: z.string().describe("The search term or phrase"),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(20)
        .default(5)
        .describe("Maximum number of results to return (default 5, max 20)"),
    },
    async ({ query, maxResults }) => {
      const results = miniSearch.search(query).slice(0, maxResults);

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: `No documentation found for query: "${query}"` }],
        };
      }

      const sections = results.map((result) => {
        const content = docStore.get(result.path) ?? "";
        // result.terms contains the tokenised query terms that matched
        const snippets = extractSnippets(content, result.terms ?? [query]);
        return `### ${result.path} (score: ${result.score.toFixed(2)})\n\n${snippets.map((s) => `\`\`\`\n${s}\n\`\`\``).join("\n\n")}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `Found ${results.length} result(s) for "${query}":\n\n${sections.join("\n\n---\n\n")}`,
          },
        ],
      };
    },
  );

  return server;
}

// ---------------------------------------------------------------------------
// Boot: index first, then start accepting connections
// ---------------------------------------------------------------------------

const docCount = await buildIndex();
process.stderr.write(`[mcp-server] Indexed ${docCount} documentation files.\n`);

const PORT = Number(process.env.PORT ?? 3100);

const app = createMcpExpressApp();

app.post("/mcp", async (req, res) => {
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — new transport per request
  });
  const server = createServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => {
  process.stderr.write(`[mcp-server] Listening on http://localhost:${PORT}/mcp\n`);
});
