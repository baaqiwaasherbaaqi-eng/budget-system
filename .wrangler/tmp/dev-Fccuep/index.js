var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-5dGox0/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/auth.js
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hash) {
  const newHash = await hashPassword(password);
  return newHash === hash;
}
__name(verifyPassword, "verifyPassword");
async function generateToken(userId, username, role, secret) {
  const payload = JSON.stringify({
    userId,
    username,
    role,
    exp: Date.now() + 24 * 60 * 60 * 1e3
    // 24 ساعت
  });
  const encodedPayload = btoa(payload);
  const signature = await hashPassword(encodedPayload + secret);
  return `${encodedPayload}.${signature}`;
}
__name(generateToken, "generateToken");
async function verifyToken(token, secret) {
  try {
    const [encodedPayload, signature] = token.split(".");
    const expectedSignature = await hashPassword(encodedPayload + secret);
    if (signature !== expectedSignature) {
      return null;
    }
    const payload = JSON.parse(atob(encodedPayload));
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
__name(verifyToken, "verifyToken");

// src/date.js
function toShamsi(date = /* @__PURE__ */ new Date()) {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    const tehranTime = new Date(d.getTime() + 3.5 * 60 * 60 * 1e3);
    const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC"
    });
    const parts = formatter.formatToParts(tehranTime);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    const pad = /* @__PURE__ */ __name((n) => n.toString().padStart(2, "0"), "pad");
    return `${year}/${pad(month)}/${pad(day)}`;
  } catch (error) {
    console.error("toShamsi error:", error);
    return null;
  }
}
__name(toShamsi, "toShamsi");

// src/base-data.js
async function generateNextCode(env, { section, type, parent_id, digit_count = 3, prefix = null }) {
  let parentCode = "";
  if (parent_id) {
    const parent = await env.DB.prepare(
      "SELECT code, level FROM base_data WHERE id = ?"
    ).bind(parent_id).first();
    if (!parent) {
      throw new Error("\u0648\u0627\u0644\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F");
    }
    parentCode = parent.code;
  }
  let lastChild = null;
  if (parent_id) {
    lastChild = await env.DB.prepare(
      `SELECT code FROM base_data 
             WHERE parent_id = ? 
             ORDER BY code DESC 
             LIMIT 1`
    ).bind(parent_id).first();
  } else {
    let query = "SELECT code FROM base_data WHERE parent_id IS NULL AND section = ?";
    const params = [section];
    if (type) {
      query += " AND type = ?";
      params.push(type);
    }
    query += " ORDER BY code DESC LIMIT 1";
    lastChild = await env.DB.prepare(query).bind(...params).first();
  }
  let nextNumber = 1;
  if (lastChild) {
    const parentCodeLength = parentCode.length;
    let lastChildSuffix = lastChild.code.substring(parentCodeLength);
    if (lastChildSuffix.includes("-")) {
      lastChildSuffix = lastChildSuffix.split("-").pop();
    }
    nextNumber = parseInt(lastChildSuffix, 10) + 1;
  }
  const paddedNumber = nextNumber.toString().padStart(digit_count, "0");
  let newCode = parentCode + paddedNumber;
  if (prefix) {
    newCode = `${prefix}-${newCode}`;
  }
  return newCode;
}
__name(generateNextCode, "generateNextCode");
function buildTree(items) {
  const map = {};
  const roots = [];
  items.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });
  items.forEach((item) => {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  const sortFn = /* @__PURE__ */ __name((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
    return a.code.localeCompare(b.code);
  }, "sortFn");
  const sortRecursive = /* @__PURE__ */ __name((nodes) => {
    nodes.sort(sortFn);
    nodes.forEach((n) => sortRecursive(n.children));
  }, "sortRecursive");
  sortRecursive(roots);
  return roots;
}
__name(buildTree, "buildTree");
async function logBaseDataAction(env, request, userData, action, entityId, details) {
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const userAgent = request.headers.get("User-Agent") || "unknown";
    await env.DB.prepare(
      `
            INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
    ).bind(
      userData ? userData.userId : null,
      userData ? userData.username : null,
      action,
      "base_data",
      entityId,
      details ? JSON.stringify(details) : null,
      ip,
      userAgent
    ).run();
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
__name(logBaseDataAction, "logBaseDataAction");

// src/index.js
function toEnglishNumbers(str) {
  if (!str) return str;
  return str.toString().replace(/[۰-۹]/g, function(d) {
    return "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9".indexOf(d);
  });
}
__name(toEnglishNumbers, "toEnglishNumbers");
async function logAction(env, request, userData, action, entityType, entityId, details) {
  try {
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
    const userAgent = request.headers.get("User-Agent") || "unknown";
    await env.DB.prepare(
      `
      INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).bind(
      userData ? userData.userId : null,
      userData ? userData.username : null,
      action,
      entityType || null,
      entityId || null,
      details ? JSON.stringify(details) : null,
      ip,
      userAgent
    ).run();
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
__name(logAction, "logAction");
async function checkRateLimit(env, ip, action, maxRequests = 10, windowSeconds = 60) {
  try {
    const windowStart = new Date(
      Date.now() - windowSeconds * 1e3
    ).toISOString();
    const result = await env.DB.prepare(
      `
      SELECT COUNT(*) as count FROM audit_log
      WHERE ip_address = ? AND action = ? AND created_at > ?
    `
    ).bind(ip, action, windowStart).first();
    return (result.count || 0) < maxRequests;
  } catch {
    return true;
  }
}
__name(checkRateLimit, "checkRateLimit");
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json; charset=utf-8"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    try {
      if (url.pathname === "/api/login" && request.method === "POST") {
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const allowed = await checkRateLimit(env, ip, "login_attempt", 10, 60);
        if (!allowed) {
          return new Response(
            JSON.stringify({
              error: "\u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u0634\u0645\u0627 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u06CC\u06A9 \u062F\u0642\u06CC\u0642\u0647 \u0635\u0628\u0631 \u06A9\u0646\u06CC\u062F."
            }),
            { status: 429, headers }
          );
        }
        const { username, password } = await request.json();
        const user = await env.DB.prepare(
          "SELECT * FROM users WHERE username = ? AND is_active = 1"
        ).bind(username).first();
        if (!user || !await verifyPassword(password, user.password_hash)) {
          ctx.waitUntil(
            logAction(env, request, null, "login_failed", "user", null, {
              username,
              reason: !user ? "user_not_found" : "wrong_password"
            })
          );
          return new Response(
            JSON.stringify({
              error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A"
            }),
            { status: 401, headers }
          );
        }
        const token = await generateToken(
          user.id,
          user.username,
          user.role,
          env.JWT_SECRET
        );
        ctx.waitUntil(
          logAction(
            env,
            request,
            { userId: user.id, username: user.username },
            "login",
            "user",
            user.id,
            { success: true }
          )
        );
        return new Response(
          JSON.stringify({
            token,
            user: {
              id: user.id,
              username: user.username,
              full_name: user.full_name,
              role: user.role,
              organization: user.organization
            }
          }),
          { status: 200, headers }
        );
      }
      if (url.pathname === "/api/hello") {
        return new Response(
          JSON.stringify({
            message: "\u0633\u0644\u0627\u0645! \u0633\u0627\u0645\u0627\u0646\u0647 \u0628\u0648\u062F\u062C\u0647 \u0634\u0647\u0631\u062F\u0627\u0631\u06CC \u0622\u0645\u0627\u062F\u0647 \u0627\u0633\u062A"
          }),
          { status: 200, headers }
        );
      }
      if (url.pathname === "/api/test-db") {
        const result = await env.DB.prepare("SELECT 1 as test").first();
        return new Response(
          JSON.stringify({
            message: "\u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u06A9\u0627\u0631 \u0645\u06CC\u06A9\u0646\u0647",
            result
          }),
          { status: 200, headers }
        );
      }
      if (url.pathname === "/api/fiscal-years" && request.method === "GET") {
        const years = await env.DB.prepare(
          "SELECT * FROM fiscal_years ORDER BY year DESC"
        ).all();
        return new Response(JSON.stringify(years.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/fiscal-years" && request.method === "POST") {
        const body = await request.json();
        const year = parseInt(toEnglishNumbers(body.year.toString()));
        const start_date = toEnglishNumbers(body.start_date);
        const end_date = toEnglishNumbers(body.end_date);
        if (!year || !start_date || !end_date) {
          return new Response(
            JSON.stringify({ error: "\u0647\u0645\u0647 \u0641\u06CC\u0644\u062F\u0647\u0627 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
            {
              status: 400,
              headers
            }
          );
        }
        try {
          const result = await env.DB.prepare(
            "INSERT INTO fiscal_years (year, start_date, end_date) VALUES (?, ?, ?)"
          ).bind(year, start_date, end_date).run();
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id
            }),
            { status: 201, headers }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "\u0627\u06CC\u0646 \u0633\u0627\u0644 \u0642\u0628\u0644\u0627\u064B \u062B\u0628\u062A \u0634\u062F\u0647" }),
            {
              status: 400,
              headers
            }
          );
        }
      }
      if (url.pathname === "/api/fiscal-years/activate" && request.method === "PUT") {
        const body = await request.json();
        const year = parseInt(toEnglishNumbers(body.year.toString()));
        console.log("Activating year:", year);
        await env.DB.prepare("UPDATE fiscal_years SET is_active = 0").run();
        await env.DB.prepare(
          "UPDATE fiscal_years SET is_active = 1, status = ? WHERE year = ?"
        ).bind("active", year).run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname.startsWith("/api/fiscal-years/") && request.method === "DELETE") {
        const rawYear = decodeURIComponent(url.pathname.split("/").pop());
        const year = parseInt(toEnglishNumbers(rawYear));
        await env.DB.prepare("DELETE FROM fiscal_years WHERE year = ?").bind(year).run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname.startsWith("/api/fiscal-years/edit/") && request.method === "PUT") {
        try {
          const rawYear = decodeURIComponent(url.pathname.split("/").pop());
          const year = parseInt(toEnglishNumbers(rawYear));
          const { start_date, end_date } = await request.json();
          console.log("=== EDIT YEAR ===");
          console.log("Year:", year, "Start:", start_date, "End:", end_date);
          if (!start_date || !end_date) {
            return new Response(
              JSON.stringify({ error: "\u062A\u0627\u0631\u06CC\u062E\u200C\u0647\u0627 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
              {
                status: 400,
                headers
              }
            );
          }
          const result = await env.DB.prepare(
            "UPDATE fiscal_years SET start_date = ?, end_date = ? WHERE year = ?"
          ).bind(start_date, end_date, year).run();
          console.log("Update result:", JSON.stringify(result));
          return new Response(
            JSON.stringify({
              success: true,
              changes: result.meta.changes
            }),
            { status: 200, headers }
          );
        } catch (error) {
          console.error("Edit year error:", error.message);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/economic-classifications" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        const type = url.searchParams.get("type");
        let query = "SELECT * FROM economic_classifications WHERE 1=1";
        const params = [];
        if (fiscalYearId) {
          query += " AND fiscal_year_id = ?";
          params.push(fiscalYearId);
        }
        if (type) {
          query += " AND type = ?";
          params.push(type);
        }
        query += " ORDER BY main_code, chapter_code, sub_code";
        const items = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/economic-classifications" && request.method === "POST") {
        const {
          fiscal_year_id,
          type,
          category,
          main_code,
          chapter_code,
          sub_code,
          title,
          parent_id
        } = await request.json();
        if (!fiscal_year_id || !type || !category || !main_code || !chapter_code || !sub_code || !title) {
          return new Response(
            JSON.stringify({ error: "\u0647\u0645\u0647 \u0641\u06CC\u0644\u062F\u0647\u0627 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
            {
              status: 400,
              headers
            }
          );
        }
        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO economic_classifications 
            (fiscal_year_id, type, category, main_code, chapter_code, sub_code, title, parent_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).bind(
            fiscal_year_id,
            type,
            category,
            main_code,
            chapter_code,
            sub_code,
            title,
            parent_id || null
          ).run();
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id
            }),
            { status: 201, headers }
          );
        } catch (error) {
          return new Response(JSON.stringify({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A" }), {
            status: 400,
            headers
          });
        }
      }
      if (url.pathname.startsWith("/api/economic-classifications/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare(
          "DELETE FROM economic_classifications WHERE id = ?"
        ).bind(id).run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/organizations" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        let query = "SELECT * FROM organizations";
        const params = [];
        if (fiscalYearId) {
          query += " WHERE fiscal_year_id = ?";
          params.push(fiscalYearId);
        }
        query += " ORDER BY name";
        const items = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/organizations" && request.method === "POST") {
        const {
          fiscal_year_id,
          name,
          type,
          manager_name,
          finance_manager_name,
          parent_id,
          is_cost_center
        } = await request.json();
        if (!fiscal_year_id || !name || !type) {
          return new Response(
            JSON.stringify({ error: "\u0647\u0645\u0647 \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0631\u0627 \u067E\u0631 \u06A9\u0646\u06CC\u062F" }),
            {
              status: 400,
              headers
            }
          );
        }
        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO organizations 
            (fiscal_year_id, name, type, manager_name, finance_manager_name, parent_id, is_cost_center)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `
          ).bind(
            fiscal_year_id,
            name,
            type,
            manager_name || null,
            finance_manager_name || null,
            parent_id || null,
            is_cost_center ? 1 : 0
          ).run();
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id
            }),
            { status: 201, headers }
          );
        } catch (error) {
          return new Response(JSON.stringify({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A" }), {
            status: 400,
            headers
          });
        }
      }
      if (url.pathname.startsWith("/api/organizations/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare("DELETE FROM organizations WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/budget-proposals" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        let query = `
          SELECT bp.*, 
                 o.name as organization_name,
                 ec.title as economic_title,
                 ec.sub_code as economic_sub_code,
                 u.full_name as proposer_name
          FROM budget_proposals bp
          LEFT JOIN organizations o ON bp.organization_id = o.id
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          LEFT JOIN users u ON bp.proposed_by = u.id
        `;
        const params = [];
        if (fiscalYearId) {
          query += " WHERE bp.fiscal_year_id = ?";
          params.push(fiscalYearId);
        }
        query += " ORDER BY bp.created_at DESC";
        const items = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/budget-proposals" && request.method === "POST") {
        const {
          fiscal_year_id,
          organization_id,
          economic_class_id,
          title,
          amount,
          description
        } = await request.json();
        if (!fiscal_year_id || !organization_id || !economic_class_id || !title || !amount) {
          return new Response(
            JSON.stringify({ error: "\u0647\u0645\u0647 \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0631\u0627 \u067E\u0631 \u06A9\u0646\u06CC\u062F" }),
            {
              status: 400,
              headers
            }
          );
        }
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData) {
          return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
            status: 401,
            headers
          });
        }
        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO budget_proposals 
            (fiscal_year_id, organization_id, economic_class_id, title, amount, description, proposed_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `
          ).bind(
            fiscal_year_id,
            organization_id,
            economic_class_id,
            title,
            amount,
            description || null,
            userData.userId
          ).run();
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id
            }),
            { status: 201, headers }
          );
        } catch (error) {
          return new Response(JSON.stringify({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A" }), {
            status: 400,
            headers
          });
        }
      }
      if (url.pathname.startsWith("/api/budget-proposals/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare("DELETE FROM budget_proposals WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/budget-proposals/change-status" && request.method === "PUT") {
        const { id, new_status, comment } = await request.json();
        if (!id || !new_status) {
          return new Response(JSON.stringify({ error: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0646\u0627\u0642\u0635" }), {
            status: 400,
            headers
          });
        }
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData) {
          return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
            status: 401,
            headers
          });
        }
        const current = await env.DB.prepare(
          "SELECT status FROM budget_proposals WHERE id = ?"
        ).bind(id).first();
        if (!current) {
          return new Response(JSON.stringify({ error: "\u0628\u0648\u062F\u062C\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
            status: 404,
            headers
          });
        }
        if (current.status === new_status) {
          return new Response(
            JSON.stringify({
              error: "\u0627\u06CC\u0646 \u0628\u0648\u062F\u062C\u0647 \u062F\u0631 \u062D\u0627\u0644 \u062D\u0627\u0636\u0631 \u062F\u0631 \u0627\u06CC\u0646 \u0648\u0636\u0639\u06CC\u062A \u0627\u0633\u062A"
            }),
            { status: 400, headers }
          );
        }
        if (current.status === new_status) {
          return new Response(
            JSON.stringify({
              error: "\u0627\u06CC\u0646 \u0628\u0648\u062F\u062C\u0647 \u062F\u0631 \u062D\u0627\u0644 \u062D\u0627\u0636\u0631 \u062F\u0631 \u0627\u06CC\u0646 \u0648\u0636\u0639\u06CC\u062A \u0627\u0633\u062A"
            }),
            { status: 400, headers }
          );
        }
        const statusPermissions = {
          submitted: ["expert", "manager", "admin"],
          manager_approved: ["manager", "admin"],
          finance_approved: ["manager", "admin"],
          approved: ["admin"],
          rejected: ["manager", "admin"],
          draft: ["admin"]
        };
        if (userData.role !== "admin") {
          const allowedRoles = statusPermissions[new_status] || [];
          if (!allowedRoles.includes(userData.role)) {
            return new Response(
              JSON.stringify({
                error: "\u0634\u0645\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0627\u06CC\u0646 \u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A \u0631\u0627 \u0646\u062F\u0627\u0631\u06CC\u062F"
              }),
              { status: 403, headers }
            );
          }
        }
        try {
          await env.DB.prepare(
            `
            INSERT INTO approval_history 
            (budget_proposal_id, from_status, to_status, action_by, comment)
            VALUES (?, ?, ?, ?, ?)
          `
          ).bind(
            id,
            current.status,
            new_status,
            userData.userId,
            comment || null
          ).run();
        } catch (historyError) {
          return new Response(
            JSON.stringify({
              error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u062A\u0627\u0631\u06CC\u062E\u0686\u0647: " + historyError.message,
              details: {
                id,
                from_status: current.status,
                to_status: new_status,
                action_by: userData.userId
              }
            }),
            { status: 500, headers }
          );
        }
        await env.DB.prepare(
          "UPDATE budget_proposals SET status = ? WHERE id = ?"
        ).bind(new_status, id).run();
        ctx.waitUntil(
          logAction(
            env,
            request,
            userData,
            "budget_status_changed",
            "budget_proposal",
            id,
            { from: current.status, to: new_status, comment }
          )
        );
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname.startsWith("/api/approval-history/") && request.method === "GET") {
        const budgetId = url.pathname.split("/").pop();
        const history = await env.DB.prepare(
          `
          SELECT ah.*, u.full_name as action_by_name
          FROM approval_history ah
          LEFT JOIN users u ON ah.action_by = u.id
          WHERE ah.budget_proposal_id = ?
          ORDER BY ah.action_at DESC
        `
        ).bind(budgetId).all();
        return new Response(JSON.stringify(history.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/reports/summary" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        if (!fiscalYearId) {
          return new Response(
            JSON.stringify({ error: "\u0633\u0627\u0644 \u0645\u0627\u0644\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
            {
              status: 400,
              headers
            }
          );
        }
        const byStatus = await env.DB.prepare(
          `
          SELECT status, COUNT(*) as count, SUM(amount) as total
          FROM budget_proposals
          WHERE fiscal_year_id = ?
          GROUP BY status
        `
        ).bind(fiscalYearId).all();
        const byOrganization = await env.DB.prepare(
          `
          SELECT o.name as organization_name, COUNT(*) as count, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN organizations o ON bp.organization_id = o.id
          WHERE bp.fiscal_year_id = ?
          GROUP BY bp.organization_id
          ORDER BY total DESC
        `
        ).bind(fiscalYearId).all();
        const byType = await env.DB.prepare(
          `
          SELECT ec.type, COUNT(*) as count, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ?
          GROUP BY ec.type
        `
        ).bind(fiscalYearId).all();
        const total = await env.DB.prepare(
          `
          SELECT SUM(amount) as total_amount, COUNT(*) as total_count
          FROM budget_proposals
          WHERE fiscal_year_id = ?
        `
        ).bind(fiscalYearId).first();
        return new Response(
          JSON.stringify({
            total,
            byStatus: byStatus.results,
            byOrganization: byOrganization.results,
            byType: byType.results
          }),
          { status: 200, headers }
        );
      }
      if (url.pathname === "/api/reports/detailed" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        if (!fiscalYearId) {
          return new Response(
            JSON.stringify({ error: "\u0633\u0627\u0644 \u0645\u0627\u0644\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
            {
              status: 400,
              headers
            }
          );
        }
        const items = await env.DB.prepare(
          `
          SELECT bp.*, 
                 o.name as organization_name,
                 ec.title as economic_title,
                 ec.sub_code as economic_sub_code,
                 ec.type as economic_type,
                 u.full_name as proposer_name
          FROM budget_proposals bp
          LEFT JOIN organizations o ON bp.organization_id = o.id
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          LEFT JOIN users u ON bp.proposed_by = u.id
          WHERE bp.fiscal_year_id = ?
          ORDER BY bp.created_at DESC
        `
        ).bind(fiscalYearId).all();
        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/allocations" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        const organizationId = url.searchParams.get("organization_id");
        let query = `
          SELECT ba.*, 
                 bp.title as budget_title,
                 bp.amount as budget_amount,
                 o.name as organization_name
          FROM budget_allocations ba
          LEFT JOIN budget_proposals bp ON ba.approved_budget_id = bp.id
          LEFT JOIN organizations o ON ba.organization_id = o.id
        `;
        const params = [];
        if (fiscalYearId || organizationId) {
          query += " WHERE 1=1";
          if (fiscalYearId) {
            query += " AND bp.fiscal_year_id = ?";
            params.push(fiscalYearId);
          }
          if (organizationId) {
            query += " AND ba.organization_id = ?";
            params.push(organizationId);
          }
        }
        query += " ORDER BY ba.created_at DESC";
        const items = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/allocations" && request.method === "POST") {
        const {
          approved_budget_id,
          organization_id,
          amount,
          percentage,
          allocation_date
        } = await request.json();
        if (!approved_budget_id || !organization_id || !amount) {
          return new Response(
            JSON.stringify({ error: "\u0647\u0645\u0647 \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0631\u0627 \u067E\u0631 \u06A9\u0646\u06CC\u062F" }),
            {
              status: 400,
              headers
            }
          );
        }
        const budget = await env.DB.prepare(
          "SELECT amount FROM budget_proposals WHERE id = ?"
        ).bind(approved_budget_id).first();
        if (!budget) {
          return new Response(JSON.stringify({ error: "\u0628\u0648\u062F\u062C\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
            status: 404,
            headers
          });
        }
        const previousAllocations = await env.DB.prepare(
          "SELECT SUM(amount) as total FROM budget_allocations WHERE approved_budget_id = ?"
        ).bind(approved_budget_id).first();
        const totalAllocated = (previousAllocations.total || 0) + parseFloat(amount);
        if (totalAllocated > budget.amount) {
          return new Response(
            JSON.stringify({
              error: `\u0645\u062C\u0645\u0648\u0639 \u062A\u062E\u0635\u06CC\u0635 (${totalAllocated}) \u0627\u0632 \u0633\u0642\u0641 \u0628\u0648\u062F\u062C\u0647 (${budget.amount}) \u0628\u06CC\u0634\u062A\u0631 \u0627\u0633\u062A`
            }),
            { status: 400, headers }
          );
        }
        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO budget_allocations 
            (approved_budget_id, organization_id, amount, percentage, allocation_date)
            VALUES (?, ?, ?, ?, ?)
          `
          ).bind(
            approved_budget_id,
            organization_id,
            amount,
            percentage || null,
            allocation_date || null
          ).run();
          ctx.waitUntil(
            logAction(
              env,
              request,
              null,
              "allocation_created",
              "budget_allocation",
              result.meta.last_row_id,
              { amount, organization_id }
            )
          );
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id
            }),
            { status: 201, headers }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A: " + error.message }),
            {
              status: 400,
              headers
            }
          );
        }
      }
      if (url.pathname.startsWith("/api/allocations/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare("DELETE FROM budget_allocations WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/executions" && request.method === "GET") {
        const allocationId = url.searchParams.get("allocation_id");
        let query = `
          SELECT be.*, 
                 ba.amount as allocation_amount,
                 bp.title as budget_title,
                 o.name as organization_name
          FROM budget_executions be
          LEFT JOIN budget_allocations ba ON be.allocation_id = ba.id
          LEFT JOIN budget_proposals bp ON ba.approved_budget_id = bp.id
          LEFT JOIN organizations o ON ba.organization_id = o.id
        `;
        const params = [];
        if (allocationId) {
          query += " WHERE be.allocation_id = ?";
          params.push(allocationId);
        }
        query += " ORDER BY be.created_at DESC";
        const items = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/executions" && request.method === "POST") {
        const {
          allocation_id,
          technical_code,
          amount,
          description,
          execution_date,
          accounting_doc_no
        } = await request.json();
        if (!allocation_id || !technical_code || !amount) {
          return new Response(
            JSON.stringify({ error: "\u0647\u0645\u0647 \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0631\u0627 \u067E\u0631 \u06A9\u0646\u06CC\u062F" }),
            {
              status: 400,
              headers
            }
          );
        }
        const allocation = await env.DB.prepare(
          "SELECT amount FROM budget_allocations WHERE id = ?"
        ).bind(allocation_id).first();
        if (!allocation) {
          return new Response(JSON.stringify({ error: "\u062A\u062E\u0635\u06CC\u0635 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
            status: 404,
            headers
          });
        }
        const previousExecutions = await env.DB.prepare(
          "SELECT SUM(amount) as total FROM budget_executions WHERE allocation_id = ?"
        ).bind(allocation_id).first();
        const totalExecuted = (previousExecutions.total || 0) + parseFloat(amount);
        if (totalExecuted > allocation.amount) {
          const remaining = allocation.amount - (previousExecutions.total || 0);
          return new Response(
            JSON.stringify({
              error: `\u0645\u0628\u0644\u063A \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u06CC \u0627\u0632 \u0645\u0627\u0646\u062F\u0647 \u062A\u062E\u0635\u06CC\u0635 \u0628\u06CC\u0634\u062A\u0631 \u0627\u0633\u062A. \u0645\u0627\u0646\u062F\u0647: ${remaining} \u0631\u06CC\u0627\u0644`
            }),
            { status: 400, headers }
          );
        }
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData) {
          return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
            status: 401,
            headers
          });
        }
        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO budget_executions 
            (allocation_id, technical_code, amount, description, execution_date, accounting_doc_no)
            VALUES (?, ?, ?, ?, ?, ?)
          `
          ).bind(
            allocation_id,
            technical_code,
            amount,
            description || null,
            execution_date || null,
            accounting_doc_no || null
          ).run();
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id
            }),
            { status: 201, headers }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A: " + error.message }),
            {
              status: 400,
              headers
            }
          );
        }
      }
      if (url.pathname.startsWith("/api/executions/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare("DELETE FROM budget_executions WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname.startsWith("/api/allocations/balance/") && request.method === "GET") {
        const allocationId = url.pathname.split("/").pop();
        const allocation = await env.DB.prepare(
          "SELECT amount FROM budget_allocations WHERE id = ?"
        ).bind(allocationId).first();
        if (!allocation) {
          return new Response(JSON.stringify({ error: "\u062A\u062E\u0635\u06CC\u0635 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
            status: 404,
            headers
          });
        }
        const executed = await env.DB.prepare(
          "SELECT SUM(amount) as total FROM budget_executions WHERE allocation_id = ?"
        ).bind(allocationId).first();
        const totalExecuted = executed.total || 0;
        const remaining = allocation.amount - totalExecuted;
        return new Response(
          JSON.stringify({
            total: allocation.amount,
            executed: totalExecuted,
            remaining
          }),
          { status: 200, headers }
        );
      }
      if (url.pathname === "/api/users" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }),
            {
              status: 401,
              headers
            }
          );
        }
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData || userData.role !== "admin") {
          return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
            status: 403,
            headers
          });
        }
        const users = await env.DB.prepare(
          "SELECT id, username, full_name, role, organization, is_active, created_at FROM users ORDER BY created_at DESC"
        ).all();
        return new Response(JSON.stringify(users.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/users" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }),
            {
              status: 401,
              headers
            }
          );
        }
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData || userData.role !== "admin") {
          return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
            status: 403,
            headers
          });
        }
        const { username, password, full_name, role, organization } = await request.json();
        if (!username || !password || !full_name || !role) {
          return new Response(
            JSON.stringify({ error: "\u0647\u0645\u0647 \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0631\u0627 \u067E\u0631 \u06A9\u0646\u06CC\u062F" }),
            {
              status: 400,
              headers
            }
          );
        }
        const password_hash = await hashPassword(password);
        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO users (username, password_hash, full_name, role, organization)
            VALUES (?, ?, ?, ?, ?)
          `
          ).bind(
            username,
            password_hash,
            full_name,
            role,
            organization || null
          ).run();
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id
            }),
            { status: 201, headers }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062A\u06A9\u0631\u0627\u0631\u06CC \u0627\u0633\u062A" }),
            {
              status: 400,
              headers
            }
          );
        }
      }
      if (url.pathname.startsWith("/api/users/") && request.method === "PUT") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }),
            {
              status: 401,
              headers
            }
          );
        }
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData || userData.role !== "admin") {
          return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
            status: 403,
            headers
          });
        }
        const id = url.pathname.split("/").pop();
        const { full_name, role, organization, is_active, password } = await request.json();
        if (password) {
          const password_hash = await hashPassword(password);
          await env.DB.prepare(
            `
            UPDATE users SET full_name = ?, role = ?, organization = ?, is_active = ?, password_hash = ?
            WHERE id = ?
          `
          ).bind(
            full_name,
            role,
            organization || null,
            is_active ? 1 : 0,
            password_hash,
            id
          ).run();
        } else {
          await env.DB.prepare(
            `
            UPDATE users SET full_name = ?, role = ?, organization = ?, is_active = ?
            WHERE id = ?
          `
          ).bind(full_name, role, organization || null, is_active ? 1 : 0, id).run();
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname.startsWith("/api/users/") && request.method === "DELETE") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }),
              {
                status: 401,
                headers
              }
            );
          }
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);
          if (!userData || userData.role !== "admin") {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const id = url.pathname.split("/").pop();
          if (parseInt(id) === userData.userId) {
            return new Response(
              JSON.stringify({ error: "\u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u062E\u0648\u062F\u062A\u0627\u0646 \u0631\u0627 \u062D\u0630\u0641 \u06A9\u0646\u06CC\u062F" }),
              {
                status: 400,
                headers
              }
            );
          }
          const dependencies = await env.DB.prepare(
            `
            SELECT 
              (SELECT COUNT(*) FROM budget_proposals WHERE proposed_by = ?) as budget_count,
              (SELECT COUNT(*) FROM approval_history WHERE action_by = ?) as approval_count,
              (SELECT COUNT(*) FROM budget_revisions WHERE created_by = ?) as revision_count,
              (SELECT COUNT(*) FROM budget_executions WHERE id IN (
                SELECT id FROM budget_executions LIMIT 1
              )) as exec_check,
              (SELECT COUNT(*) FROM audit_log WHERE user_id = ?) as audit_count
          `
          ).bind(id, id, id, id).first();
          if (dependencies.budget_count > 0 || dependencies.approval_count > 0 || dependencies.revision_count > 0 || dependencies.audit_count > 0) {
            await env.DB.prepare("UPDATE users SET is_active = 0 WHERE id = ?").bind(id).run();
            return new Response(
              JSON.stringify({
                success: true,
                message: "\u06A9\u0627\u0631\u0628\u0631 \u0628\u0647 \u062F\u0644\u06CC\u0644 \u062F\u0627\u0634\u062A\u0646 \u0633\u0648\u0627\u0628\u0642\u060C \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u0634\u062F",
                deactivated: true
              }),
              { status: 200, headers }
            );
          }
          await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
          return new Response(
            JSON.stringify({
              success: true,
              message: "\u06A9\u0627\u0631\u0628\u0631 \u062D\u0630\u0641 \u0634\u062F",
              deleted: true
            }),
            { status: 200, headers }
          );
        } catch (error) {
          console.error("Delete user error:", error.message);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/revisions" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        let query = `
          SELECT br.*, 
                 bp.title as budget_title,
                 u1.full_name as creator_name,
                 u2.full_name as approver_name
          FROM budget_revisions br
          LEFT JOIN budget_proposals bp ON br.budget_proposal_id = bp.id
          LEFT JOIN users u1 ON br.created_by = u1.id
          LEFT JOIN users u2 ON br.approved_by = u2.id
        `;
        const params = [];
        if (fiscalYearId) {
          query += " WHERE br.fiscal_year_id = ?";
          params.push(fiscalYearId);
        }
        query += " ORDER BY br.created_at DESC";
        const items = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/revisions" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData) {
          return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
            status: 401,
            headers
          });
        }
        const {
          fiscal_year_id,
          budget_proposal_id,
          revision_type,
          new_amount,
          reason
        } = await request.json();
        if (!fiscal_year_id || !revision_type || !reason) {
          return new Response(
            JSON.stringify({ error: "\u0647\u0645\u0647 \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0631\u0627 \u067E\u0631 \u06A9\u0646\u06CC\u062F" }),
            {
              status: 400,
              headers
            }
          );
        }
        let old_amount = 0;
        let difference = 0;
        if (revision_type !== "add") {
          if (!budget_proposal_id) {
            return new Response(
              JSON.stringify({ error: "\u0628\u0648\u062F\u062C\u0647 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F" }),
              {
                status: 400,
                headers
              }
            );
          }
          const budget = await env.DB.prepare(
            "SELECT amount FROM budget_proposals WHERE id = ?"
          ).bind(budget_proposal_id).first();
          if (!budget) {
            return new Response(JSON.stringify({ error: "\u0628\u0648\u062F\u062C\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          old_amount = budget.amount;
          if (revision_type === "increase") {
            if (!new_amount || new_amount <= 0) {
              return new Response(
                JSON.stringify({ error: "\u0645\u0628\u0644\u063A \u0627\u0641\u0632\u0627\u06CC\u0634 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
                {
                  status: 400,
                  headers
                }
              );
            }
            difference = parseFloat(new_amount);
          } else if (revision_type === "decrease") {
            if (!new_amount || new_amount <= 0) {
              return new Response(
                JSON.stringify({ error: "\u0645\u0628\u0644\u063A \u06A9\u0627\u0647\u0634 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
                {
                  status: 400,
                  headers
                }
              );
            }
            difference = -parseFloat(new_amount);
          } else if (revision_type === "remove") {
            difference = -old_amount;
          } else if (revision_type === "add") {
            difference = parseFloat(new_amount);
          }
        } else {
          if (!new_amount || new_amount <= 0) {
            return new Response(JSON.stringify({ error: "\u0645\u0628\u0644\u063A \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }), {
              status: 400,
              headers
            });
          }
          difference = parseFloat(new_amount);
        }
        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO budget_revisions 
            (fiscal_year_id, budget_proposal_id, revision_type, old_amount, new_amount, difference, reason, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).bind(
            fiscal_year_id,
            budget_proposal_id || null,
            revision_type,
            old_amount,
            new_amount || null,
            difference,
            reason,
            userData.userId
          ).run();
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id
            }),
            { status: 201, headers }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A: " + error.message }),
            {
              status: 400,
              headers
            }
          );
        }
      }
      if (url.pathname === "/api/revisions/approve" && request.method === "PUT") {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData || !["admin", "manager"].includes(userData.role)) {
          return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
            status: 403,
            headers
          });
        }
        const { id, status } = await request.json();
        if (!id || !["approved", "rejected"].includes(status)) {
          return new Response(JSON.stringify({ error: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0646\u0627\u0642\u0635" }), {
            status: 400,
            headers
          });
        }
        if (status === "approved") {
          const revision = await env.DB.prepare(
            "SELECT * FROM budget_revisions WHERE id = ?"
          ).bind(id).first();
          if (!revision) {
            return new Response(JSON.stringify({ error: "\u0627\u0635\u0644\u0627\u062D \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          if (revision.status !== "pending") {
            return new Response(
              JSON.stringify({ error: "\u0627\u06CC\u0646 \u0627\u0635\u0644\u0627\u062D \u0642\u0628\u0644\u0627\u064B \u0628\u0631\u0631\u0633\u06CC \u0634\u062F\u0647" }),
              {
                status: 400,
                headers
              }
            );
          }
          if (revision.revision_type === "add") {
            await env.DB.prepare(
              `
              INSERT INTO budget_proposals 
              (fiscal_year_id, organization_id, economic_class_id, title, amount, status, proposed_by)
              VALUES (?, ?, ?, ?, ?, 'approved', ?)
            `
            ).bind(
              revision.fiscal_year_id,
              1,
              // پیش‌فرض
              1,
              // پیش‌فرض
              "\u0631\u062F\u06CC\u0641 \u062C\u062F\u06CC\u062F (\u0627\u0635\u0644\u0627\u062D \u0628\u0648\u062F\u062C\u0647)",
              revision.new_amount,
              revision.created_by
            ).run();
          } else if (revision.revision_type === "increase") {
            const currentBudget = await env.DB.prepare(
              "SELECT amount FROM budget_proposals WHERE id = ?"
            ).bind(revision.budget_proposal_id).first();
            const newTotal = currentBudget.amount + revision.new_amount;
            await env.DB.prepare(
              `
              UPDATE budget_proposals SET amount = ? WHERE id = ?
            `
            ).bind(newTotal, revision.budget_proposal_id).run();
          } else if (revision.revision_type === "decrease") {
            const currentBudget = await env.DB.prepare(
              "SELECT amount FROM budget_proposals WHERE id = ?"
            ).bind(revision.budget_proposal_id).first();
            const newTotal = currentBudget.amount - revision.new_amount;
            await env.DB.prepare(
              `
              UPDATE budget_proposals SET amount = ? WHERE id = ?
            `
            ).bind(newTotal, revision.budget_proposal_id).run();
          }
        }
        await env.DB.prepare(
          `
          UPDATE budget_revisions 
          SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
        ).bind(status, userData.userId, id).run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/reports/detailed-form" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        if (!fiscalYearId) {
          return new Response(
            JSON.stringify({ error: "\u0633\u0627\u0644 \u0645\u0627\u0644\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
            {
              status: 400,
              headers
            }
          );
        }
        const fiscalYear = await env.DB.prepare(
          "SELECT * FROM fiscal_years WHERE id = ?"
        ).bind(fiscalYearId).first();
        const byType = await env.DB.prepare(
          `
          SELECT ec.type, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ? AND bp.status = 'approved'
          GROUP BY ec.type
        `
        ).bind(fiscalYearId).all();
        const byMainCode = await env.DB.prepare(
          `
          SELECT ec.main_code, ec.chapter_code, ec.sub_code, ec.title, 
                 ec.type, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ? AND bp.status = 'approved'
          GROUP BY ec.sub_code
          ORDER BY ec.main_code, ec.chapter_code, ec.sub_code
        `
        ).bind(fiscalYearId).all();
        const byOrganization = await env.DB.prepare(
          `
          SELECT o.name as organization_name, 
                 SUM(bp.amount) as total,
                 COUNT(*) as count
          FROM budget_proposals bp
          LEFT JOIN organizations o ON bp.organization_id = o.id
          WHERE bp.fiscal_year_id = ? AND bp.status = 'approved'
          GROUP BY bp.organization_id
          ORDER BY total DESC
        `
        ).bind(fiscalYearId).all();
        const grandTotal = await env.DB.prepare(
          `
          SELECT SUM(amount) as total, COUNT(*) as count
          FROM budget_proposals
          WHERE fiscal_year_id = ? AND status = 'approved'
        `
        ).bind(fiscalYearId).first();
        return new Response(
          JSON.stringify({
            fiscalYear,
            byType: byType.results,
            byMainCode: byMainCode.results,
            byOrganization: byOrganization.results,
            grandTotal
          }),
          { status: 200, headers }
        );
      }
      if (url.pathname === "/api/reports/projects" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        if (!fiscalYearId) {
          return new Response(
            JSON.stringify({ error: "\u0633\u0627\u0644 \u0645\u0627\u0644\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
            {
              status: 400,
              headers
            }
          );
        }
        const projects = await env.DB.prepare(
          `
          SELECT bp.*, 
                 o.name as organization_name,
                 ec.title as economic_title,
                 ec.sub_code as economic_sub_code,
                 ec.type as economic_type
          FROM budget_proposals bp
          LEFT JOIN organizations o ON bp.organization_id = o.id
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ? AND bp.status = 'approved'
          ORDER BY bp.amount DESC
        `
        ).bind(fiscalYearId).all();
        return new Response(JSON.stringify(projects.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/reports/comparison" && request.method === "GET") {
        const fiscalYear1 = url.searchParams.get("year1");
        const fiscalYear2 = url.searchParams.get("year2");
        if (!fiscalYear1 || !fiscalYear2) {
          return new Response(
            JSON.stringify({ error: "\u062F\u0648 \u0633\u0627\u0644 \u0645\u0627\u0644\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
            {
              status: 400,
              headers
            }
          );
        }
        const year1Total = await env.DB.prepare(
          `
          SELECT SUM(amount) as total, COUNT(*) as count
          FROM budget_proposals
          WHERE fiscal_year_id = ? AND status = 'approved'
        `
        ).bind(fiscalYear1).first();
        const year2Total = await env.DB.prepare(
          `
          SELECT SUM(amount) as total, COUNT(*) as count
          FROM budget_proposals
          WHERE fiscal_year_id = ? AND status = 'approved'
        `
        ).bind(fiscalYear2).first();
        const year1Details = await env.DB.prepare(
          `
          SELECT ec.sub_code, ec.title, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ? AND bp.status = 'approved'
          GROUP BY ec.sub_code
          ORDER BY ec.sub_code
        `
        ).bind(fiscalYear1).all();
        const year2Details = await env.DB.prepare(
          `
          SELECT ec.sub_code, ec.title, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ? AND bp.status = 'approved'
          GROUP BY ec.sub_code
          ORDER BY ec.sub_code
        `
        ).bind(fiscalYear2).all();
        return new Response(
          JSON.stringify({
            year1: { total: year1Total, details: year1Details.results },
            year2: { total: year2Total, details: year2Details.results }
          }),
          { status: 200, headers }
        );
      }
      if (url.pathname === "/api/reports/tafriq" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        if (!fiscalYearId) {
          return new Response(
            JSON.stringify({ error: "\u0633\u0627\u0644 \u0645\u0627\u0644\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
            {
              status: 400,
              headers
            }
          );
        }
        const budgets = await env.DB.prepare(
          `
          SELECT bp.id, bp.title, bp.amount as approved_amount,
                 o.name as organization_name,
                 ec.sub_code, ec.title as economic_title, ec.type as economic_type
          FROM budget_proposals bp
          LEFT JOIN organizations o ON bp.organization_id = o.id
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ? AND bp.status = 'approved'
          ORDER BY bp.id
        `
        ).bind(fiscalYearId).all();
        const details = [];
        let totalApproved = 0;
        let totalAllocated = 0;
        let totalExecuted = 0;
        for (const budget of budgets.results) {
          const allocation = await env.DB.prepare(
            `
            SELECT SUM(amount) as total FROM budget_allocations
            WHERE approved_budget_id = ?
          `
          ).bind(budget.id).first();
          const allocatedAmount = allocation.total || 0;
          const execution = await env.DB.prepare(
            `
            SELECT SUM(be.amount) as total 
            FROM budget_executions be
            LEFT JOIN budget_allocations ba ON be.allocation_id = ba.id
            WHERE ba.approved_budget_id = ?
          `
          ).bind(budget.id).first();
          const executedAmount = execution.total || 0;
          details.push({
            id: budget.id,
            title: budget.title,
            organization_name: budget.organization_name,
            economic_sub_code: budget.sub_code,
            economic_title: budget.economic_title,
            economic_type: budget.economic_type,
            approved_amount: budget.approved_amount,
            allocated_amount: allocatedAmount,
            executed_amount: executedAmount,
            remaining_amount: budget.approved_amount - executedAmount,
            allocation_percentage: budget.approved_amount > 0 ? (allocatedAmount / budget.approved_amount * 100).toFixed(2) : 0,
            execution_percentage: budget.approved_amount > 0 ? (executedAmount / budget.approved_amount * 100).toFixed(2) : 0
          });
          totalApproved += budget.approved_amount;
          totalAllocated += allocatedAmount;
          totalExecuted += executedAmount;
        }
        return new Response(
          JSON.stringify({
            details,
            summary: {
              total_approved: totalApproved,
              total_allocated: totalAllocated,
              total_executed: totalExecuted,
              total_remaining: totalApproved - totalExecuted,
              overall_execution_percentage: totalApproved > 0 ? (totalExecuted / totalApproved * 100).toFixed(2) : 0
            }
          }),
          { status: 200, headers }
        );
      }
      if (url.pathname === "/api/fiscal-years/close" && request.method === "PUT") {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData || userData.role !== "admin") {
          return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
            status: 403,
            headers
          });
        }
        const { year } = await request.json();
        await env.DB.prepare(
          `
          UPDATE fiscal_years SET status = 'closed' WHERE year = ?
        `
        ).bind(year).run();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/audit-log" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData || userData.role !== "admin") {
          return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
            status: 403,
            headers
          });
        }
        const action = url.searchParams.get("action");
        let query = "SELECT * FROM audit_log";
        const params = [];
        if (action) {
          query += " WHERE action = ?";
          params.push(action);
        }
        query += " ORDER BY created_at DESC LIMIT 500";
        const logs = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(logs.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/municipality-info" && request.method === "GET") {
        const info = await env.DB.prepare(
          "SELECT * FROM municipality_info ORDER BY id DESC LIMIT 1"
        ).first();
        return new Response(JSON.stringify(info || {}), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/municipality-info" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }),
            {
              status: 401,
              headers
            }
          );
        }
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData || userData.role !== "admin") {
          return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
            status: 403,
            headers
          });
        }
        const body = await request.json();
        const {
          province,
          county,
          city,
          title,
          grade,
          address,
          postal_code,
          economic_code,
          national_id,
          mayor_name,
          mayor_details,
          finance_signers,
          treasury_signers,
          allocation_signers,
          execution_signers
        } = body;
        if (!title) {
          return new Response(
            JSON.stringify({ error: "\u0639\u0646\u0648\u0627\u0646 \u0634\u0647\u0631\u062F\u0627\u0631\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
            {
              status: 400,
              headers
            }
          );
        }
        const existing = await env.DB.prepare(
          "SELECT id FROM municipality_info LIMIT 1"
        ).first();
        if (existing) {
          await env.DB.prepare(
            `
            UPDATE municipality_info SET
              province = ?, county = ?, city = ?,
              title = ?, grade = ?, address = ?, postal_code = ?, 
              economic_code = ?, national_id = ?,
              mayor_name = ?, mayor_details = ?,
              finance_signers = ?, treasury_signers = ?, 
              allocation_signers = ?, execution_signers = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
          ).bind(
            province || null,
            county || null,
            city || null,
            title,
            grade || null,
            address || null,
            postal_code || null,
            economic_code || null,
            national_id || null,
            mayor_name || null,
            mayor_details || null,
            finance_signers || null,
            treasury_signers || null,
            allocation_signers || null,
            execution_signers || null,
            existing.id
          ).run();
          ctx.waitUntil(
            logAction(
              env,
              request,
              userData,
              "municipality_info_updated",
              "municipality_info",
              existing.id,
              { title }
            )
          );
          return new Response(
            JSON.stringify({
              success: true,
              id: existing.id,
              action: "updated"
            }),
            {
              status: 200,
              headers
            }
          );
        } else {
          const result = await env.DB.prepare(
            `
            INSERT INTO municipality_info (
              province, county, city,
              title, grade, address, postal_code, economic_code, national_id,
              mayor_name, mayor_details,
              finance_signers, treasury_signers, allocation_signers, execution_signers
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).bind(
            province || null,
            county || null,
            city || null,
            title,
            grade || null,
            address || null,
            postal_code || null,
            economic_code || null,
            national_id || null,
            mayor_name || null,
            mayor_details || null,
            finance_signers || null,
            treasury_signers || null,
            allocation_signers || null,
            execution_signers || null
          ).run();
          ctx.waitUntil(
            logAction(
              env,
              request,
              userData,
              "municipality_info_created",
              "municipality_info",
              result.meta.last_row_id,
              { title }
            )
          );
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
              action: "created"
            }),
            {
              status: 201,
              headers
            }
          );
        }
      }
      if (url.pathname === "/api/base-data" && request.method === "GET") {
        const section = url.searchParams.get("section");
        const type = url.searchParams.get("type");
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        const parentId = url.searchParams.get("parent_id");
        const isActive = url.searchParams.get("is_active");
        let query = "SELECT * FROM base_data WHERE 1=1";
        const params = [];
        if (section) {
          query += " AND section = ?";
          params.push(section);
        }
        if (type) {
          query += " AND type = ?";
          params.push(type);
        }
        if (fiscalYearId) {
          query += " AND (fiscal_year_id = ? OR fiscal_year_id IS NULL)";
          params.push(fiscalYearId);
        }
        if (parentId === "null") {
          query += " AND parent_id IS NULL";
        } else if (parentId) {
          query += " AND parent_id = ?";
          params.push(parentId);
        }
        if (isActive !== null && isActive !== void 0 && isActive !== "") {
          query += " AND is_active = ?";
          params.push(isActive === "1" || isActive === "true" ? 1 : 0);
        }
        query += " ORDER BY section, type, code";
        const items = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/base-data/tree" && request.method === "GET") {
        const section = url.searchParams.get("section");
        const type = url.searchParams.get("type");
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        let query = "SELECT * FROM base_data WHERE is_active = 1";
        const params = [];
        if (section) {
          query += " AND section = ?";
          params.push(section);
        }
        if (type) {
          query += " AND type = ?";
          params.push(type);
        }
        if (fiscalYearId) {
          query += " AND (fiscal_year_id = ? OR fiscal_year_id IS NULL)";
          params.push(fiscalYearId);
        }
        query += " ORDER BY code";
        const items = await env.DB.prepare(query).bind(...params).all();
        const tree = buildTree(items.results);
        return new Response(JSON.stringify(tree), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/base-data/next-code" && request.method === "GET") {
        try {
          const section = url.searchParams.get("section");
          const type = url.searchParams.get("type");
          const parentId = url.searchParams.get("parent_id");
          const digitCount = parseInt(
            url.searchParams.get("digit_count") || "3"
          );
          const prefix = url.searchParams.get("prefix");
          if (!section) {
            return new Response(
              JSON.stringify({ error: "section \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
              { status: 400, headers }
            );
          }
          const nextCode = await generateNextCode(env, {
            section,
            type,
            parent_id: parentId ? parseInt(parentId) : null,
            digit_count: digitCount,
            prefix
          });
          return new Response(JSON.stringify({ next_code: nextCode }), {
            status: 200,
            headers
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers
          });
        }
      }
      if (url.pathname === "/api/base-data" && request.method === "POST") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }),
              { status: 401, headers }
            );
          }
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const body = await request.json();
          const {
            section,
            type,
            prefix,
            title,
            parent_id,
            digit_count,
            level_name,
            description,
            extra_data,
            sort_order,
            fiscal_year_id
          } = body;
          if (!section || !title) {
            return new Response(
              JSON.stringify({ error: "section \u0648 title \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
              { status: 400, headers }
            );
          }
          const digitCount = digit_count || 3;
          const code = await generateNextCode(env, {
            section,
            type,
            parent_id: parent_id || null,
            digit_count: digitCount,
            prefix
          });
          let level = 0;
          if (parent_id) {
            const parent = await env.DB.prepare(
              "SELECT level FROM base_data WHERE id = ?"
            ).bind(parent_id).first();
            if (!parent) {
              return new Response(JSON.stringify({ error: "\u0648\u0627\u0644\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
                status: 404,
                headers
              });
            }
            level = parent.level + 1;
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          const result = await env.DB.prepare(
            `
            INSERT INTO base_data 
            (fiscal_year_id, section, type, prefix, code, digit_count, level, level_name, title, parent_id, description, extra_data, sort_order, created_at_shamsi, updated_at_shamsi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).bind(
            fiscal_year_id || null,
            section,
            type || null,
            prefix || null,
            code,
            digitCount,
            level,
            level_name || null,
            title,
            parent_id || null,
            description || null,
            extra_data ? JSON.stringify(extra_data) : null,
            sort_order || 0,
            nowShamsi,
            nowShamsi
          ).run();
          ctx.waitUntil(
            logBaseDataAction(
              env,
              request,
              userData,
              "base_data_created",
              result.meta.last_row_id,
              { section, type, code, title }
            )
          );
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
              code,
              level
            }),
            { status: 201, headers }
          );
        } catch (error) {
          console.error("Base data POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/base-data\/\d+$/) && request.method === "PUT") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }),
              { status: 401, headers }
            );
          }
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const id = url.pathname.split("/").pop();
          const body = await request.json();
          const {
            title,
            description,
            extra_data,
            sort_order,
            is_active,
            level_name
          } = body;
          if (!title) {
            return new Response(JSON.stringify({ error: "title \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }), {
              status: 400,
              headers
            });
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          const result = await env.DB.prepare(
            `
            UPDATE base_data SET
                title = ?,
                description = ?,
                extra_data = ?,
                sort_order = ?,
                is_active = ?,
                level_name = ?,
                updated_at = CURRENT_TIMESTAMP,
                updated_at_shamsi = ?
            WHERE id = ?
          `
          ).bind(
            title,
            description || null,
            extra_data ? JSON.stringify(extra_data) : null,
            sort_order || 0,
            is_active !== void 0 ? is_active ? 1 : 0 : 1,
            level_name || null,
            nowShamsi,
            id
          ).run();
          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "\u0631\u062F\u06CC\u0641 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          ctx.waitUntil(
            logBaseDataAction(
              env,
              request,
              userData,
              "base_data_updated",
              parseInt(id),
              {
                title
              }
            )
          );
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Base data PUT error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/base-data\/\d+$/) && request.method === "DELETE") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }),
              { status: 401, headers }
            );
          }
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const id = url.pathname.split("/").pop();
          const children = await env.DB.prepare(
            "SELECT COUNT(*) as count FROM base_data WHERE parent_id = ?"
          ).bind(id).first();
          if (children.count > 0) {
            return new Response(
              JSON.stringify({
                error: `\u0627\u06CC\u0646 \u0631\u062F\u06CC\u0641 ${children.count} \u0632\u06CC\u0631\u0634\u0627\u062E\u0647 \u062F\u0627\u0631\u062F. \u0627\u0628\u062A\u062F\u0627 \u0632\u06CC\u0631\u0634\u0627\u062E\u0647\u200C\u0647\u0627 \u0631\u0627 \u062D\u0630\u0641 \u06A9\u0646\u06CC\u062F.`,
                children_count: children.count
              }),
              { status: 400, headers }
            );
          }
          const result = await env.DB.prepare(
            "DELETE FROM base_data WHERE id = ?"
          ).bind(id).run();
          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "\u0631\u062F\u06CC\u0641 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          ctx.waitUntil(
            logBaseDataAction(
              env,
              request,
              userData,
              "base_data_deleted",
              parseInt(id),
              {}
            )
          );
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Base data DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      const staticPaths = [
        "/",
        "/login.html",
        "/dashboard.html",
        "/fiscal-years.html",
        "/economic-classifications.html",
        "/organizations.html",
        "/budget-proposals.html",
        "/reports.html",
        "/allocations.html",
        "/executions.html",
        "/users.html",
        "/revisions.html",
        "/advanced-reports.html",
        "/tafriq.html",
        "/audit-log.html",
        "/municipality-info.html",
        "/base-info.html",
        "/common.js",
        "/sidebar.js",
        "/sidebar.css"
      ];
      if (staticPaths.includes(url.pathname)) {
        return await env.ASSETS.fetch(request);
      }
      return new Response(JSON.stringify({ error: "\u0645\u0633\u06CC\u0631 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F" }), {
        status: 404,
        headers
      });
    } catch (error) {
      console.error("Error:", error);
      return new Response(JSON.stringify({ error: "\u062E\u0637\u0627\u06CC \u062F\u0627\u062E\u0644\u06CC \u0633\u0631\u0648\u0631" }), {
        status: 500,
        headers
      });
    }
  }
};

// C:/Users/User/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// C:/Users/User/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-5dGox0/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// C:/Users/User/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-5dGox0/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
