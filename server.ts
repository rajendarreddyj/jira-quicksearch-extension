import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

function isLikelyJql(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  return (
    /order\s+by/i.test(q) ||
    /[=~()]/.test(q) ||
    /\b(and|or|in|is|not|status|project|assignee|reporter|issuetype|priority|labels|issuekey)\b/i.test(q)
  );
}

function splitOrderByClause(query: string): { criteria: string; orderBy: string } {
  const orderMatch = /\border\s+by\b/i.exec(query);
  if (!orderMatch || orderMatch.index < 0) {
    return { criteria: query.trim(), orderBy: "" };
  }

  const criteria = query.slice(0, orderMatch.index).trim();
  const orderBy = query.slice(orderMatch.index).trim();
  return { criteria, orderBy };
}

function buildJql(projectKey: string, query: string): string {
  let jql = "";
  if (projectKey) {
    const keys = projectKey.split(",").map((k) => k.trim()).filter(Boolean);
    if (keys.length === 1) {
      jql = `project = "${keys[0]}"`;
    } else if (keys.length > 1) {
      jql = `project IN (${keys.map((k) => `"${k}"`).join(",")})`;
    }
  }

  const trimmed = (query || "").trim();
  if (trimmed) {
    if (isLikelyJql(trimmed)) {
      const { criteria, orderBy } = splitOrderByClause(trimmed);
      if (criteria) {
        jql = jql ? `(${jql}) AND ${criteria}` : criteria;
      }
      if (orderBy) {
        jql = jql ? `${jql} ${orderBy}` : orderBy;
      }
    } else if (/^[A-Z0-9]+-\d+$/i.test(trimmed)) {
      jql = `issueKey = "${trimmed.toUpperCase()}"`;
    } else {
      const textCondition = `(summary ~ "${trimmed}*" OR text ~ "${trimmed}*")`;
      jql = jql ? `${jql} AND ${textCondition}` : textCondition;
    }
  }

  if (!jql) {
    return "ORDER BY updated DESC";
  }
  if (!/order\s+by/i.test(jql)) {
    return `${jql} ORDER BY updated DESC`;
  }
  return jql;
}

function sanitizeOrderByParentheses(jql: string): string {
  // Defensive normalization: Jira rejects ORDER BY inside a parenthesized condition block.
  // Example fix: (reporter = currentUser() ORDER BY created DESC) -> reporter = currentUser() ORDER BY created DESC
  return jql.replace(/\(\s*([^()]+?)\s+(ORDER\s+BY\b[^)]*)\)/gi, '$1 $2');
}

function toPlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value.map((item) => toPlainText(item)).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (typeof record.value === "string") return record.value;
    if (record.content != null) return toPlainText(record.content);
    return "";
  }
  return String(value);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Test Jira API connection proxy
  app.post("/api/jira/test-connection", async (req, res) => {
    const { jiraUrl, email, apiToken } = req.body;

    if (!jiraUrl) {
      res.status(400).json({ success: false, message: "Jira URL is required" });
      return;
    }

    try {
      // Normalize URL
      const cleanUrl = jiraUrl.replace(/\/+$/, "");
      const targetUrl = `${cleanUrl}/rest/api/2/myself`;

      const headers: Record<string, string> = {
        "Accept": "application/json",
      };

      if (email && apiToken) {
        const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
        headers["Authorization"] = `Basic ${auth}`;
      }

      const response = await fetch(targetUrl, { headers });

      if (response.ok) {
        const user = await response.json();
        res.json({
          success: true,
          message: `Connected successfully as ${user.displayName || user.emailAddress || 'Jira User'}`,
          user: {
            displayName: user.displayName,
            emailAddress: user.emailAddress,
            avatar: user.avatarUrls?.['48x48'] || user.avatarUrls?.['32x32'],
          },
        });
      } else {
        const errorText = await response.text();
        res.status(response.status).json({
          success: false,
          message: `Jira returned status ${response.status}: ${response.statusText}`,
          details: errorText,
        });
      }
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to reach Jira instance",
      });
    }
  });

  // Proxy Jira search request
  app.post("/api/jira/search", async (req, res) => {
    const { jiraUrl, email, apiToken, projectKey, query, maxResults = 50 } = req.body;

    if (!jiraUrl || (!email || !apiToken)) {
      // If credentials missing, let front-end handle mock fallback response
      res.status(400).json({
        useMock: true,
        message: "Missing Jira credentials. Using mock engine.",
      });
      return;
    }

    try {
      const cleanUrl = jiraUrl.replace(/\/+$/, "");
      const jql = sanitizeOrderByParentheses(buildJql(projectKey || "", query || ""));

      const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
      const fields = [
        "summary",
        "status",
        "priority",
        "issuetype",
        "assignee",
        "reporter",
        "created",
        "updated",
        "description",
        "components",
        "labels",
        "comment",
      ];

      const requests: Array<{ url: string; init: RequestInit; label: string }> = [
        {
          label: "v3-search",
          url: `${cleanUrl}/rest/api/3/search`,
          init: {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "Authorization": `Basic ${auth}`,
            },
            body: JSON.stringify({ jql, maxResults, fields }),
          },
        },
        {
          label: "v3-search-jql",
          url: `${cleanUrl}/rest/api/3/search/jql`,
          init: {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "Authorization": `Basic ${auth}`,
            },
            body: JSON.stringify({ jql, maxResults, fields }),
          },
        },
        {
          label: "v2-search",
          url: `${cleanUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=${encodeURIComponent(String(maxResults))}&fields=${encodeURIComponent(fields.join(","))}`,
          init: {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Authorization": `Basic ${auth}`,
            },
          },
        },
      ];

      let data: any = null;
      let finalErrorStatus = 500;
      let finalErrorStatusText = "Unknown Error";
      let finalErrorDetails = "";
      let finalErrorEndpoint = "";

      for (const request of requests) {
        const response = await fetch(request.url, request.init);
        if (response.ok) {
          data = await response.json();
          break;
        }

        finalErrorStatus = response.status;
        finalErrorStatusText = response.statusText;
        finalErrorDetails = await response.text();
        finalErrorEndpoint = request.label;
      }

      if (!data) {
        res.status(finalErrorStatus).json({
          error: true,
          message: `Jira search error (${finalErrorStatus}): ${finalErrorStatusText}`,
          requestJql: jql,
          endpoint: finalErrorEndpoint,
          details: finalErrorDetails,
        });
        return;
      }

      res.json({
        total: data.total || (data.issues ? data.issues.length : 0),
        issues: (data.issues || []).map((issue: any) => ({
          key: issue.key,
          summary: issue.fields?.summary || "No Summary",
          status: {
            name: issue.fields?.status?.name || "To Do",
            category: (issue.fields?.status?.statusCategory?.key || "new") === "done" ? "done" :
                      (issue.fields?.status?.statusCategory?.key === "indeterminate" ? "in-progress" : "to-do")
          },
          priority: {
            name: issue.fields?.priority?.name || "Medium",
            icon: issue.fields?.priority?.iconUrl || "",
          },
          issueType: {
            name: issue.fields?.issuetype?.name || "Task",
            icon: issue.fields?.issuetype?.iconUrl || "",
          },
          assignee: issue.fields?.assignee ? {
            name: issue.fields.assignee.displayName,
            avatar: issue.fields.assignee.avatarUrls?.['48x48'] || issue.fields.assignee.avatarUrls?.['32x32'],
            email: issue.fields.assignee.emailAddress || "",
          } : { name: "Unassigned", avatar: "", email: "" },
          reporter: issue.fields?.reporter ? {
            name: issue.fields.reporter.displayName,
            avatar: issue.fields.reporter.avatarUrls?.['48x48'],
          } : { name: "System", avatar: "" },
          description: toPlainText(issue.fields?.description) || "No description provided.",
          created: issue.fields?.created || new Date().toISOString(),
          updated: issue.fields?.updated || new Date().toISOString(),
          components: (issue.fields?.components || []).map((c: any) => c.name),
          labels: issue.fields?.labels || [],
          comments: (issue.fields?.comment?.comments || []).map((cmt: any) => ({
            id: cmt.id,
            author: cmt.author?.displayName || "User",
            body: toPlainText(cmt.body),
            created: cmt.created,
          })),
          url: `${cleanUrl}/browse/${issue.key}`,
        })),
      });

    } catch (err: any) {
      res.status(500).json({
        error: true,
        message: err.message || "Failed to query Jira server",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
