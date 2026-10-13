var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-Bp5eqA/checked-fetch.js
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
  if (section === "operational") {
    return generateOperationalCode(env, { type, parent_id });
  }
  if (section === "goods") {
    return generateGoodsCode(env, { parent_id, digit_count });
  }
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
  let newCode;
  if (parentCode) {
    newCode = parentCode + paddedNumber;
  } else {
    newCode = prefix ? `${prefix}-${paddedNumber}` : paddedNumber;
  }
  return newCode;
}
__name(generateNextCode, "generateNextCode");
async function generateOperationalCode(env, { type, parent_id }) {
  if (!parent_id) {
    const last = await env.DB.prepare(
      `SELECT code FROM base_data 
             WHERE section = 'operational' AND parent_id IS NULL AND type = 'mission'
             ORDER BY code DESC LIMIT 1`
    ).first();
    const nextNum = last ? parseInt(last.code.substring(last.code.length - 3), 10) + 1 : 1;
    return nextNum.toString().padStart(3, "0");
  }
  const parent = await env.DB.prepare(
    "SELECT code, type FROM base_data WHERE id = ?"
  ).bind(parent_id).first();
  if (!parent) {
    throw new Error("\u0648\u0627\u0644\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F");
  }
  const parentCode = parent.code;
  if (parent.type === "program") {
    if (type === "service") {
      const last = await env.DB.prepare(
        `SELECT code FROM base_data 
                 WHERE parent_id = ? AND type = 'service'
                 ORDER BY code DESC LIMIT 1`
      ).bind(parent_id).first();
      const nextNum = last ? parseInt(last.code.substring(parentCode.length), 10) + 1 : 1;
      return parentCode + nextNum.toString().padStart(5, "0");
    }
    if (type === "plan") {
      const last = await env.DB.prepare(
        `SELECT code FROM base_data 
                 WHERE parent_id = ? AND type = 'plan'
                 ORDER BY code DESC LIMIT 1`
      ).bind(parent_id).first();
      const nextNum = last ? parseInt(last.code.substring(parentCode.length), 10) + 1 : 5e4;
      return parentCode + nextNum.toString().padStart(5, "0");
    }
    throw new Error("\u0632\u06CC\u0631 \u0628\u0631\u0646\u0627\u0645\u0647 \u0641\u0642\u0637 \u062E\u062F\u0645\u062A \u06CC\u0627 \u0637\u0631\u062D \u0645\u062C\u0627\u0632 \u0627\u0633\u062A");
  }
  if (parent.type === "service") {
    if (type !== "activity") {
      throw new Error("\u0632\u06CC\u0631 \u062E\u062F\u0645\u062A \u0641\u0642\u0637 \u0641\u0639\u0627\u0644\u06CC\u062A \u0645\u062C\u0627\u0632 \u0627\u0633\u062A");
    }
    const last = await env.DB.prepare(
      `SELECT code FROM base_data 
             WHERE parent_id = ? AND type = 'activity'
             ORDER BY code DESC LIMIT 1`
    ).bind(parent_id).first();
    const nextNum = last ? parseInt(last.code.substring(parentCode.length), 10) + 1 : 1;
    return parentCode + nextNum.toString().padStart(3, "0");
  }
  if (parent.type === "plan") {
    if (type !== "project") {
      throw new Error("\u0632\u06CC\u0631 \u0637\u0631\u062D \u0641\u0642\u0637 \u067E\u0631\u0648\u0698\u0647 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A");
    }
    const last = await env.DB.prepare(
      `SELECT code FROM base_data 
             WHERE parent_id = ? AND type = 'project'
             ORDER BY code DESC LIMIT 1`
    ).bind(parent_id).first();
    const nextNum = last ? parseInt(last.code.substring(parentCode.length), 10) + 1 : 1;
    return parentCode + nextNum.toString().padStart(3, "0");
  }
  if (parent.type === "mission") {
    if (type !== "program") {
      throw new Error("\u0632\u06CC\u0631 \u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u0641\u0642\u0637 \u0628\u0631\u0646\u0627\u0645\u0647 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A");
    }
    const last = await env.DB.prepare(
      `SELECT code FROM base_data 
             WHERE parent_id = ? AND type = 'program'
             ORDER BY code DESC LIMIT 1`
    ).bind(parent_id).first();
    const nextNum = last ? parseInt(last.code.substring(parentCode.length), 10) + 1 : 1;
    return parentCode + nextNum.toString().padStart(3, "0");
  }
  throw new Error("\u0646\u0648\u0639 \u0648\u0627\u0644\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0628\u0631\u0627\u06CC \u0639\u0645\u0644\u06CC\u0627\u062A\u06CC");
}
__name(generateOperationalCode, "generateOperationalCode");
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
async function generateGoodsCode(env, { parent_id, digit_count = 3 }) {
  if (!parent_id) {
    const last2 = await env.DB.prepare(
      `SELECT code FROM base_data 
       WHERE section = 'goods' AND parent_id IS NULL
       ORDER BY CAST(code AS INTEGER) DESC LIMIT 1`
    ).first();
    const nextNum2 = last2 ? parseInt(last2.code, 10) + 1 : 1;
    return nextNum2.toString();
  }
  const parent = await env.DB.prepare(
    "SELECT code, level FROM base_data WHERE id = ?"
  ).bind(parent_id).first();
  if (!parent) throw new Error("\u0648\u0627\u0644\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F");
  const parentCode = parent.code;
  const parentLevel = parent.level;
  const childDigitCount = parentLevel + 1;
  const last = await env.DB.prepare(
    `SELECT code FROM base_data 
     WHERE parent_id = ? 
     ORDER BY code DESC LIMIT 1`
  ).bind(parent_id).first();
  let nextNum = 1;
  if (last) {
    const suffix = last.code.substring(parentCode.length);
    nextNum = parseInt(suffix, 10) + 1;
  }
  return parentCode + nextNum.toString().padStart(childDigitCount, "0");
}
__name(generateGoodsCode, "generateGoodsCode");
async function generatePersonCode(env, { person_type, parent_id }) {
  if (!parent_id) {
    const typePrefix = {
      employee: "1",
      citizen: "2",
      legal: "3",
      foreigner: "4"
    };
    const prefix = typePrefix[person_type];
    if (!prefix) {
      throw new Error("\u0646\u0648\u0639 \u0634\u062E\u0635 \u0646\u0627\u0645\u0639\u062A\u0628\u0631");
    }
    const exists = await env.DB.prepare(
      `SELECT id FROM persons 
       WHERE parent_id IS NULL AND code LIKE ?`
    ).bind(prefix + "%").first();
    if (exists) {
      throw new Error(
        "\u06AF\u0631\u0648\u0647 \u0627\u0635\u0644\u06CC \u0627\u06CC\u0646 \u0646\u0648\u0639 \u0634\u062E\u0635 \u0627\u0632 \u0642\u0628\u0644 \u0648\u062C\u0648\u062F \u062F\u0627\u0631\u062F. \u0644\u0637\u0641\u0627\u064B \u0632\u06CC\u0631\u06AF\u0631\u0648\u0647 \u0628\u0633\u0627\u0632\u06CC\u062F."
      );
    }
    return prefix + "000000000";
  }
  const parent = await env.DB.prepare(
    "SELECT code, level FROM persons WHERE id = ?"
  ).bind(parent_id).first();
  if (!parent) {
    throw new Error("\u0648\u0627\u0644\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F");
  }
  const parentCode = parent.code;
  const level = parent.level;
  const last = await env.DB.prepare(
    `SELECT code FROM persons 
     WHERE parent_id = ? 
     ORDER BY code DESC LIMIT 1`
  ).bind(parent_id).first();
  if (level === 1) {
    const prefix = parentCode.substring(0, 1);
    const lastSuffix = last ? parseInt(last.code.substring(1, 4), 10) : 0;
    const nextNum = lastSuffix + 1;
    if (nextNum > 999) {
      throw new Error("\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F9\u06F9\u06F9 \u0632\u06CC\u0631\u06AF\u0631\u0648\u0647 \u0628\u0631\u0627\u06CC \u0647\u0631 \u06AF\u0631\u0648\u0647 \u0627\u0635\u0644\u06CC \u0645\u062C\u0627\u0632 \u0627\u0633\u062A");
    }
    return prefix + nextNum.toString().padStart(3, "0") + "000000";
  }
  if (level === 2) {
    const prefix = parentCode.substring(0, 4);
    const lastSuffix = last ? parseInt(last.code.substring(4, 7), 10) : 0;
    const nextNum = lastSuffix + 1;
    if (nextNum > 999) {
      throw new Error("\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F9\u06F9\u06F9 \u062F\u0633\u062A\u0647 \u0628\u0631\u0627\u06CC \u0647\u0631 \u0632\u06CC\u0631\u06AF\u0631\u0648\u0647 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A");
    }
    return prefix + nextNum.toString().padStart(3, "0") + "000";
  }
  if (level === 3) {
    const prefix = parentCode.substring(0, 7);
    const lastSuffix = last ? parseInt(last.code.substring(7, 10), 10) : 0;
    const nextNum = lastSuffix + 1;
    if (nextNum > 999) {
      throw new Error("\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F9\u06F9\u06F9 \u0634\u062E\u0635 \u0628\u0631\u0627\u06CC \u0647\u0631 \u062F\u0633\u062A\u0647 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A");
    }
    return prefix + nextNum.toString().padStart(3, "0");
  }
  throw new Error("\u062D\u062F\u0627\u06A9\u062B\u0631 \u0639\u0645\u0642 \u0645\u062C\u0627\u0632 \u06F4 \u0633\u0637\u062D \u0627\u0633\u062A");
}
__name(generatePersonCode, "generatePersonCode");

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
async function checkPermission(env, userId, permissionKey) {
  try {
    const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(userId).first();
    if (!user) return false;
    if (user.role === "admin") return true;
    const userPerm = await env.DB.prepare(
      "SELECT granted FROM user_permissions WHERE user_id = ? AND permission_key = ?"
    ).bind(userId, permissionKey).first();
    if (userPerm) {
      return userPerm.granted === 1;
    }
    const rolePerm = await env.DB.prepare(
      "SELECT granted FROM role_permissions WHERE role = ? AND permission_key = ?"
    ).bind(user.role, permissionKey).first();
    if (rolePerm) {
      return rolePerm.granted === 1;
    }
    return false;
  } catch (error) {
    console.error("checkPermission error:", error);
    return false;
  }
}
__name(checkPermission, "checkPermission");
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
      if (url.pathname === "/api/persons" && request.method === "GET") {
        const personType = url.searchParams.get("person_type");
        const parentId = url.searchParams.get("parent_id");
        const isActive = url.searchParams.get("is_active");
        let query = "SELECT * FROM persons WHERE 1=1";
        const params = [];
        if (personType) {
          query += " AND person_type = ?";
          params.push(personType);
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
        query += " ORDER BY code";
        const items = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/persons/tree" && request.method === "GET") {
        const personType = url.searchParams.get("person_type");
        let query = "SELECT * FROM persons WHERE is_active = 1";
        const params = [];
        if (personType) {
          query += " AND person_type = ?";
          params.push(personType);
        }
        query += " ORDER BY code";
        const items = await env.DB.prepare(query).bind(...params).all();
        const tree = buildTree(items.results);
        return new Response(JSON.stringify(tree), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/persons/next-code" && request.method === "GET") {
        try {
          const personType = url.searchParams.get("person_type");
          const parentId = url.searchParams.get("parent_id");
          const nextCode = await generatePersonCode(env, {
            person_type: personType,
            parent_id: parentId ? parseInt(parentId) : null
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
      if (url.pathname === "/api/persons" && request.method === "POST") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const body = await request.json();
          const {
            person_type,
            full_name,
            first_name,
            last_name,
            national_id,
            economic_code,
            registration_number,
            father_name,
            mother_name,
            id_number,
            birth_date_shamsi,
            birth_place,
            gender,
            nationality,
            phone,
            mobile,
            address,
            postal_code,
            email,
            bank_name,
            bank_account,
            iban,
            parent_id,
            level_name,
            notes,
            extra_data
          } = body;
          if (!person_type || !full_name) {
            return new Response(
              JSON.stringify({ error: "\u0646\u0648\u0639 \u0634\u062E\u0635 \u0648 \u0646\u0627\u0645 \u06A9\u0627\u0645\u0644 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
              { status: 400, headers }
            );
          }
          const validTypes = ["employee", "citizen", "legal", "foreigner"];
          if (!validTypes.includes(person_type)) {
            return new Response(JSON.stringify({ error: "\u0646\u0648\u0639 \u0634\u062E\u0635 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 400,
              headers
            });
          }
          const code = await generatePersonCode(env, {
            person_type,
            parent_id: parent_id || null
          });
          let level = 1;
          if (parent_id) {
            const parent = await env.DB.prepare(
              "SELECT level FROM persons WHERE id = ?"
            ).bind(parent_id).first();
            if (parent) level = parent.level + 1;
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          const result = await env.DB.prepare(
            `INSERT INTO persons 
            (person_type, code, parent_id, level, level_name, full_name, 
             first_name, last_name, national_id, economic_code, registration_number, 
             father_name, mother_name, id_number, birth_date_shamsi, birth_place, gender, nationality,
             phone, mobile, address, postal_code, email,
             bank_name, bank_account, iban,
             notes, extra_data, created_at_shamsi, updated_at_shamsi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            person_type,
            code,
            parent_id || null,
            level,
            level_name || null,
            full_name,
            first_name || null,
            last_name || null,
            national_id || null,
            economic_code || null,
            registration_number || null,
            father_name || null,
            mother_name || null,
            id_number || null,
            birth_date_shamsi || null,
            birth_place || null,
            gender || null,
            nationality || "\u0627\u06CC\u0631\u0627\u0646\u06CC",
            phone || null,
            mobile || null,
            address || null,
            postal_code || null,
            email || null,
            bank_name || null,
            bank_account || null,
            iban || null,
            notes || null,
            extra_data ? JSON.stringify(extra_data) : null,
            nowShamsi,
            nowShamsi
          ).run();
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
              code
            }),
            { status: 201, headers }
          );
        } catch (error) {
          console.error("Person POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/persons\/\d+$/) && request.method === "PUT") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const id = url.pathname.split("/").pop();
          const body = await request.json();
          const {
            full_name,
            first_name,
            last_name,
            national_id,
            economic_code,
            registration_number,
            father_name,
            mother_name,
            id_number,
            birth_date_shamsi,
            birth_place,
            gender,
            nationality,
            phone,
            mobile,
            address,
            postal_code,
            email,
            bank_name,
            bank_account,
            iban,
            notes,
            extra_data,
            is_active,
            level_name
          } = body;
          if (!full_name) {
            return new Response(
              JSON.stringify({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0645\u0644 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
              {
                status: 400,
                headers
              }
            );
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          const result = await env.DB.prepare(
            `UPDATE persons SET
              full_name = ?, first_name = ?, last_name = ?, national_id = ?, economic_code = ?, registration_number = ?,
              father_name = ?, mother_name = ?, id_number = ?, birth_date_shamsi = ?, birth_place = ?, gender = ?, nationality = ?,
              phone = ?, mobile = ?, address = ?, postal_code = ?, email = ?,
              bank_name = ?, bank_account = ?, iban = ?,
              notes = ?, extra_data = ?, is_active = ?, level_name = ?,
              updated_at = CURRENT_TIMESTAMP, updated_at_shamsi = ?
            WHERE id = ?`
          ).bind(
            full_name,
            first_name || null,
            last_name || null,
            national_id || null,
            economic_code || null,
            registration_number || null,
            father_name || null,
            mother_name || null,
            id_number || null,
            birth_date_shamsi || null,
            birth_place || null,
            gender || null,
            nationality || "\u0627\u06CC\u0631\u0627\u0646\u06CC",
            phone || null,
            mobile || null,
            address || null,
            postal_code || null,
            email || null,
            bank_name || null,
            bank_account || null,
            iban || null,
            notes || null,
            extra_data ? JSON.stringify(extra_data) : null,
            is_active !== void 0 ? is_active ? 1 : 0 : 1,
            level_name || null,
            nowShamsi,
            id
          ).run();
          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "\u0634\u062E\u0635 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/persons\/\d+$/) && request.method === "DELETE") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const id = url.pathname.split("/").pop();
          const children = await env.DB.prepare(
            "SELECT COUNT(*) as count FROM persons WHERE parent_id = ?"
          ).bind(id).first();
          if (children.count > 0) {
            return new Response(
              JSON.stringify({
                error: `\u0627\u06CC\u0646 \u0634\u062E\u0635 ${children.count} \u0632\u06CC\u0631\u0645\u062C\u0645\u0648\u0639\u0647 \u062F\u0627\u0631\u062F. \u0627\u0628\u062A\u062F\u0627 \u0622\u0646\u200C\u0647\u0627 \u0631\u0627 \u062D\u0630\u0641 \u06A9\u0646\u06CC\u062F.`
              }),
              { status: 400, headers }
            );
          }
          const result = await env.DB.prepare(
            "DELETE FROM persons WHERE id = ?"
          ).bind(id).run();
          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "\u0634\u062E\u0635 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/economic-classifications" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        const type = url.searchParams.get("type");
        let query = "SELECT * FROM base_data WHERE section = 'economic' AND is_active = 1";
        const params = [];
        if (fiscalYearId) {
          query += " AND (fiscal_year_id = ? OR fiscal_year_id IS NULL)";
          params.push(fiscalYearId);
        }
        if (type) {
          query += " AND type = ?";
          params.push(type);
        }
        query += " ORDER BY code";
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
        let query = "SELECT * FROM base_data WHERE section = 'organization' AND is_active = 1";
        const params = [];
        if (fiscalYearId) {
          query += " AND (fiscal_year_id = ? OR fiscal_year_id IS NULL)";
          params.push(fiscalYearId);
        }
        query += " ORDER BY code";
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
                     org.title as organization_name,
                     ec.title as economic_title,
                     ec.code as economic_sub_code,
                     ec.type as economic_type,
                     u.full_name as proposer_name
              FROM budget_proposals bp
              LEFT JOIN base_data org ON bp.organization_id = org.id
              LEFT JOIN base_data ec ON bp.economic_class_id = ec.id
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
        const org = await env.DB.prepare(
          "SELECT id FROM base_data WHERE id = ? AND section = 'organization'"
        ).bind(organization_id).first();
        if (!org) {
          return new Response(
            JSON.stringify({ error: "\u0633\u0627\u0632\u0645\u0627\u0646 \u0627\u0646\u062A\u062E\u0627\u0628 \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A" }),
            { status: 400, headers }
          );
        }
        const econ = await env.DB.prepare(
          "SELECT id FROM base_data WHERE id = ? AND section = 'economic'"
        ).bind(economic_class_id).first();
        if (!econ) {
          return new Response(
            JSON.stringify({
              error: "\u0637\u0628\u0642\u0647\u200C\u0628\u0646\u062F\u06CC \u0627\u0642\u062A\u0635\u0627\u062F\u06CC \u0627\u0646\u062A\u062E\u0627\u0628 \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A"
            }),
            { status: 400, headers }
          );
        }
        try {
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          const result = await env.DB.prepare(
            `
                  INSERT INTO budget_proposals 
                  (fiscal_year_id, organization_id, economic_class_id, title, amount, description, proposed_by, created_at_shamsi)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `
          ).bind(
            fiscal_year_id,
            organization_id,
            economic_class_id,
            title,
            amount,
            description || null,
            userData.userId,
            nowShamsi
          ).run();
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id
            }),
            { status: 201, headers }
          );
        } catch (error) {
          console.error("Budget proposal POST error:", error);
          return new Response(
            JSON.stringify({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A: " + error.message }),
            { status: 400, headers }
          );
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
      if (url.pathname === "/api/permissions/keys" && request.method === "GET") {
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
        if (!userData) {
          return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
            status: 401,
            headers
          });
        }
        const groups = [
          {
            title: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u067E\u0627\u06CC\u0647",
            icon: "\u{1F4C2}",
            keys: [
              { key: "base_info.view", label: "\u0645\u0634\u0627\u0647\u062F\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u067E\u0627\u06CC\u0647" },
              { key: "base_info.edit", label: "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u067E\u0627\u06CC\u0647" }
            ]
          },
          {
            title: "\u0628\u0648\u062F\u062C\u0647",
            icon: "\u{1F4B0}",
            keys: [
              { key: "budget.view", label: "\u0645\u0634\u0627\u0647\u062F\u0647 \u0628\u0648\u062F\u062C\u0647" },
              { key: "budget.add", label: "\u0627\u0641\u0632\u0648\u062F\u0646 \u0628\u0648\u062F\u062C\u0647" },
              { key: "budget.submit", label: "\u0627\u0631\u0633\u0627\u0644 \u0628\u0648\u062F\u062C\u0647" },
              { key: "budget.approve_manager", label: "\u062A\u0627\u06CC\u06CC\u062F \u0645\u062F\u06CC\u0631" },
              { key: "budget.approve_finance", label: "\u062A\u0627\u06CC\u06CC\u062F \u0645\u0627\u0644\u06CC" },
              { key: "budget.approve_final", label: "\u062A\u0635\u0648\u06CC\u0628 \u0646\u0647\u0627\u06CC\u06CC" }
            ]
          },
          {
            title: "\u062A\u062E\u0635\u06CC\u0635 \u0648 \u062A\u0627\u0645\u06CC\u0646 \u0627\u0639\u062A\u0628\u0627\u0631",
            icon: "\u{1F4B3}",
            keys: [
              { key: "allocations.view", label: "\u0645\u0634\u0627\u0647\u062F\u0647 \u062A\u062E\u0635\u06CC\u0635" },
              { key: "allocations.add", label: "\u0627\u0641\u0632\u0648\u062F\u0646 \u062A\u062E\u0635\u06CC\u0635" },
              { key: "executions.view", label: "\u0645\u0634\u0627\u0647\u062F\u0647 \u062A\u0627\u0645\u06CC\u0646 \u0627\u0639\u062A\u0628\u0627\u0631" },
              { key: "executions.add", label: "\u0627\u0641\u0632\u0648\u062F\u0646 \u062A\u0627\u0645\u06CC\u0646 \u0627\u0639\u062A\u0628\u0627\u0631" }
            ]
          },
          {
            title: "\u06AF\u0632\u0627\u0631\u0634\u0627\u062A",
            icon: "\u{1F4C8}",
            keys: [
              { key: "reports.view", label: "\u0645\u0634\u0627\u0647\u062F\u0647 \u06AF\u0632\u0627\u0631\u0634\u0627\u062A \u0633\u0627\u062F\u0647" },
              { key: "reports.advanced", label: "\u0645\u0634\u0627\u0647\u062F\u0647 \u06AF\u0632\u0627\u0631\u0634\u0627\u062A \u067E\u06CC\u0634\u0631\u0641\u062A\u0647" },
              { key: "reports.tafriq", label: "\u0645\u0634\u0627\u0647\u062F\u0647 \u062A\u0641\u0631\u06CC\u063A \u0628\u0648\u062F\u062C\u0647" },
              { key: "reports.export", label: "\u062E\u0631\u0648\u062C\u06CC Excel" }
            ]
          },
          {
            title: "\u0645\u062F\u06CC\u0631\u06CC\u062A \u06A9\u0627\u0631\u0628\u0631\u0627\u0646",
            icon: "\u{1F464}",
            keys: [
              { key: "users.view", label: "\u0645\u0634\u0627\u0647\u062F\u0647 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646" },
              { key: "users.add", label: "\u0627\u0641\u0632\u0648\u062F\u0646 \u06A9\u0627\u0631\u0628\u0631" },
              { key: "users.edit", label: "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0627\u0631\u0628\u0631" },
              { key: "users.delete", label: "\u062D\u0630\u0641 \u06A9\u0627\u0631\u0628\u0631" },
              { key: "users.permissions", label: "\u0645\u062F\u06CC\u0631\u06CC\u062A \u062F\u0633\u062A\u0631\u0633\u06CC\u200C\u0647\u0627" }
            ]
          },
          {
            title: "\u0633\u06CC\u0633\u062A\u0645",
            icon: "\u2699\uFE0F",
            keys: [
              { key: "fiscal_years.view", label: "\u0645\u0634\u0627\u0647\u062F\u0647 \u0633\u0627\u0644 \u0645\u0627\u0644\u06CC" },
              { key: "fiscal_years.manage", label: "\u0645\u062F\u06CC\u0631\u06CC\u062A \u0633\u0627\u0644 \u0645\u0627\u0644\u06CC" },
              { key: "audit_log.view", label: "\u0645\u0634\u0627\u0647\u062F\u0647 \u0644\u0627\u06AF \u0633\u06CC\u0633\u062A\u0645" },
              { key: "municipality_info.view", label: "\u0645\u0634\u0627\u0647\u062F\u0647 \u0645\u0634\u062E\u0635\u0627\u062A \u0634\u0647\u0631\u062F\u0627\u0631\u06CC" },
              { key: "municipality_info.edit", label: "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u0645\u0634\u062E\u0635\u0627\u062A \u0634\u0647\u0631\u062F\u0627\u0631\u06CC" }
            ]
          }
        ];
        return new Response(JSON.stringify(groups), { status: 200, headers });
      }
      if (url.pathname.match(/^\/api\/users\/\d+\/permissions$/) && request.method === "GET") {
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
        if (!userData || !["admin", "manager"].includes(userData.role)) {
          return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
            status: 403,
            headers
          });
        }
        const userId = url.pathname.split("/")[3];
        const user = await env.DB.prepare(
          "SELECT id, username, full_name, role FROM users WHERE id = ?"
        ).bind(userId).first();
        if (!user) {
          return new Response(JSON.stringify({ error: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
            status: 404,
            headers
          });
        }
        const rolePerms = await env.DB.prepare(
          "SELECT permission_key, granted FROM role_permissions WHERE role = ?"
        ).bind(user.role).all();
        const userPerms = await env.DB.prepare(
          "SELECT permission_key, granted FROM user_permissions WHERE user_id = ?"
        ).bind(userId).all();
        return new Response(
          JSON.stringify({
            user,
            role_permissions: rolePerms.results,
            user_permissions: userPerms.results
          }),
          { status: 200, headers }
        );
      }
      if (url.pathname.match(/^\/api\/users\/\d+\/permissions$/) && request.method === "POST") {
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
          return new Response(
            JSON.stringify({
              error: "\u0641\u0642\u0637 \u0645\u062F\u06CC\u0631 \u0633\u06CC\u0633\u062A\u0645 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062F\u0633\u062A\u0631\u0633\u06CC\u200C\u0647\u0627 \u0631\u0627 \u062A\u063A\u06CC\u06CC\u0631 \u062F\u0647\u062F"
            }),
            {
              status: 403,
              headers
            }
          );
        }
        const userId = url.pathname.split("/")[3];
        const { permissions } = await request.json();
        const user = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(userId).first();
        if (!user) {
          return new Response(JSON.stringify({ error: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
            status: 404,
            headers
          });
        }
        await env.DB.prepare("DELETE FROM user_permissions WHERE user_id = ?").bind(userId).run();
        for (const perm of permissions) {
          if (perm.granted === null || perm.granted === void 0) {
            await env.DB.prepare(
              `DELETE FROM user_permissions WHERE user_id = ? AND permission_key = ?`
            ).bind(userId, perm.permission_key).run();
          } else {
            await env.DB.prepare(
              `INSERT OR REPLACE INTO user_permissions (user_id, permission_key, granted, granted_by)
               VALUES (?, ?, ?, ?)`
            ).bind(
              userId,
              perm.permission_key,
              perm.granted ? 1 : 0,
              userData.userId
            ).run();
          }
        }
        ctx.waitUntil(
          logAction(
            env,
            request,
            userData,
            "permissions_changed",
            "user",
            parseInt(userId),
            {
              count: permissions.length
            }
          )
        );
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/me/permissions" && request.method === "GET") {
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
        if (!userData) {
          return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
            status: 401,
            headers
          });
        }
        const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(userData.userId).first();
        if (!user) {
          return new Response(JSON.stringify({ error: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
            status: 404,
            headers
          });
        }
        const rolePerms = await env.DB.prepare(
          "SELECT permission_key, granted FROM role_permissions WHERE role = ? AND granted = 1"
        ).bind(user.role).all();
        const userPerms = await env.DB.prepare(
          "SELECT permission_key, granted FROM user_permissions WHERE user_id = ?"
        ).bind(userData.userId).all();
        const permissions = {};
        rolePerms.results.forEach(
          (p) => permissions[p.permission_key] = true
        );
        userPerms.results.forEach(
          (p) => permissions[p.permission_key] = p.granted === 1
        );
        return new Response(JSON.stringify({ permissions }), {
          status: 200,
          headers
        });
      }
      if (url.pathname === "/api/persons/search" && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const nationalId = url.searchParams.get("national_id");
          if (!nationalId) {
            return new Response(
              JSON.stringify({ error: "\u06A9\u062F \u0645\u0644\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
              {
                status: 400,
                headers
              }
            );
          }
          const person = await env.DB.prepare(
            `SELECT id, national_id, code, full_name, first_name, last_name, 
                    person_type, level, parent_id, is_active, mobile
             FROM persons 
             WHERE national_id = ? AND level = 4`
          ).bind(nationalId).first();
          if (!person) {
            return new Response(
              JSON.stringify({
                error: "\u0634\u062E\u0635\u06CC \u0628\u0627 \u0627\u06CC\u0646 \u06A9\u062F \u0645\u0644\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F",
                found: false
              }),
              {
                status: 404,
                headers
              }
            );
          }
          return new Response(
            JSON.stringify({
              found: true,
              person
            }),
            {
              status: 200,
              headers
            }
          );
        } catch (error) {
          console.error("Search error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+$/) && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const personId = url.pathname.split("/").pop();
          const employee = await env.DB.prepare(
            `SELECT * FROM employees WHERE person_id = ?`
          ).bind(personId).first();
          const person = await env.DB.prepare(
            `SELECT * FROM persons WHERE id = ?`
          ).bind(personId).first();
          if (!person) {
            return new Response(JSON.stringify({ error: "\u0634\u062E\u0635 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          return new Response(
            JSON.stringify({
              person,
              employee: employee || null
            }),
            {
              status: 200,
              headers
            }
          );
        } catch (error) {
          console.error("Employee GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+$/) && (request.method === "POST" || request.method === "PUT")) {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const personId = url.pathname.split("/").pop();
          const body = await request.json();
          const {
            contract_type,
            contract_start_shamsi,
            contract_end_shamsi,
            hire_date_shamsi,
            decree_type,
            employment_type,
            position,
            department,
            unit_start_shamsi,
            personnel_code,
            years_of_service,
            insurance_history_months,
            insurance_number,
            education_level,
            education_field,
            education_university,
            education_year_shamsi,
            specialties,
            experience_years,
            experience_description,
            birthday_shamsi,
            other_occasion_shamsi,
            other_occasion_title,
            notes
          } = body;
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          const existing = await env.DB.prepare(
            `SELECT id FROM employees WHERE person_id = ?`
          ).bind(personId).first();
          if (existing) {
            await env.DB.prepare(
              `UPDATE employees SET
                contract_type = ?,
                contract_start_shamsi = ?,
                contract_end_shamsi = ?,
                hire_date_shamsi = ?,
                decree_type = ?,
                employment_type = ?,
                position = ?,
                department = ?,
                                unit_start_shamsi = ?,
                personnel_code = ?,
                years_of_service = ?,
                insurance_history_months = ?,
                insurance_number = ?,
                education_level = ?,
                education_field = ?,
                education_university = ?,
                education_year_shamsi = ?,
                specialties = ?,
                experience_years = ?,
                experience_description = ?,
                birthday_shamsi = ?,
                other_occasion_shamsi = ?,
                other_occasion_title = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP,
                updated_at_shamsi = ?
              WHERE person_id = ?`
            ).bind(
              contract_type || null,
              contract_start_shamsi || null,
              contract_end_shamsi || null,
              hire_date_shamsi || null,
              decree_type || null,
              employment_type || null,
              position || null,
              department || null,
              unit_start_shamsi || null,
              personnel_code || null,
              years_of_service || 0,
              insurance_history_months || 0,
              insurance_number || null,
              education_level || null,
              education_field || null,
              education_university || null,
              education_year_shamsi || null,
              specialties ? JSON.stringify(specialties) : null,
              experience_years || 0,
              experience_description || null,
              birthday_shamsi || null,
              other_occasion_shamsi || null,
              other_occasion_title || null,
              notes || null,
              nowShamsi,
              personId
            ).run();
          } else {
            await env.DB.prepare(
              `INSERT INTO employees (
                person_id, contract_type, contract_start_shamsi, contract_end_shamsi,
                hire_date_shamsi, decree_type, employment_type, position, department,
                unit_start_shamsi, personnel_code,
                years_of_service, insurance_history_months, insurance_number,
                education_level, education_field, education_university, education_year_shamsi,
                specialties, experience_years, experience_description,
                birthday_shamsi, other_occasion_shamsi, other_occasion_title,
                notes, created_at_shamsi, updated_at_shamsi
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              personId,
              contract_type || null,
              contract_start_shamsi || null,
              contract_end_shamsi || null,
              hire_date_shamsi || null,
              decree_type || null,
              employment_type || null,
              position || null,
              department || null,
              unit_start_shamsi || null,
              personnel_code || null,
              years_of_service || 0,
              insurance_history_months || 0,
              insurance_number || null,
              education_level || null,
              education_field || null,
              education_university || null,
              education_year_shamsi || null,
              specialties ? JSON.stringify(specialties) : null,
              experience_years || 0,
              experience_description || null,
              birthday_shamsi || null,
              other_occasion_shamsi || null,
              other_occasion_title || null,
              notes || null,
              nowShamsi,
              nowShamsi
            ).run();
          }
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Employee POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+\/tasks$/) && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const personId = url.pathname.split("/")[3];
          const tasks = await env.DB.prepare(
            `SELECT * FROM employee_tasks WHERE person_id = ? ORDER BY id`
          ).bind(personId).all();
          return new Response(JSON.stringify(tasks.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Tasks GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+\/tasks$/) && request.method === "POST") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const personId = url.pathname.split("/")[3];
          const { tasks } = await request.json();
          if (!Array.isArray(tasks)) {
            return new Response(
              JSON.stringify({ error: "tasks \u0628\u0627\u06CC\u062F \u0622\u0631\u0627\u06CC\u0647 \u0628\u0627\u0634\u062F" }),
              {
                status: 400,
                headers
              }
            );
          }
          const totalPercentage = tasks.reduce(
            (sum, t) => sum + (t.percentage || 0),
            0
          );
          if (totalPercentage > 100) {
            return new Response(
              JSON.stringify({
                error: `\u062C\u0645\u0639 \u062F\u0631\u0635\u062F\u0647\u0627 (${totalPercentage}) \u0646\u0628\u0627\u06CC\u062F \u0627\u0632 \u06F1\u06F0\u06F0 \u0628\u06CC\u0634\u062A\u0631 \u0628\u0627\u0634\u062F`
              }),
              {
                status: 400,
                headers
              }
            );
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          await env.DB.prepare("DELETE FROM employee_tasks WHERE person_id = ?").bind(personId).run();
          for (const t of tasks) {
            if (!t.task_id || !t.task_type) continue;
            await env.DB.prepare(
              `INSERT INTO employee_tasks 
               (person_id, task_type, task_id, task_title, percentage, notes, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              personId,
              t.task_type,
              t.task_id,
              t.task_title || null,
              t.percentage || 0,
              t.notes || null,
              nowShamsi,
              nowShamsi
            ).run();
          }
          return new Response(
            JSON.stringify({
              success: true,
              total: totalPercentage
            }),
            {
              status: 200,
              headers
            }
          );
        } catch (error) {
          console.error("Tasks POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/operational-tree" && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const items = await env.DB.prepare(
            `SELECT id, code, title, type, parent_id, level FROM base_data 
             WHERE section = 'operational' AND is_active = 1 
             ORDER BY code`
          ).all();
          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Operational tree error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+\/dependents$/) && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const personId = url.pathname.split("/")[3];
          const deps = await env.DB.prepare(
            `SELECT * FROM dependents WHERE employee_person_id = ? ORDER BY id`
          ).bind(personId).all();
          return new Response(JSON.stringify(deps.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Dependents GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+\/dependents$/) && request.method === "POST") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const personId = url.pathname.split("/")[3];
          const body = await request.json();
          const {
            id,
            national_id,
            relation_type,
            first_name,
            last_name,
            full_name,
            father_name,
            id_number,
            birth_date_shamsi,
            gender,
            mobile,
            education_status,
            military_status,
            marital_status,
            marriage_date_shamsi,
            is_disabled,
            notes
          } = body;
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          if (national_id) {
            const existing = await env.DB.prepare(
              `SELECT id FROM dependents WHERE employee_person_id = ? AND national_id = ? AND id != ?`
            ).bind(personId, national_id, id || 0).first();
            if (existing) {
              return new Response(
                JSON.stringify({
                  error: "\u0627\u06CC\u0646 \u06A9\u062F \u0645\u0644\u06CC \u0642\u0628\u0644\u0627\u064B \u0628\u0631\u0627\u06CC \u0627\u06CC\u0646 \u06A9\u0627\u0631\u0645\u0646\u062F \u062B\u0628\u062A \u0634\u062F\u0647 \u0627\u0633\u062A"
                }),
                {
                  status: 400,
                  headers
                }
              );
            }
          }
          if (id) {
            await env.DB.prepare(
              `UPDATE dependents SET
                national_id = ?, relation_type = ?,
                first_name = ?, last_name = ?, full_name = ?, father_name = ?,
                id_number = ?, birth_date_shamsi = ?, gender = ?, mobile = ?,
                education_status = ?, military_status = ?, marital_status = ?, marriage_date_shamsi = ?,
                is_disabled = ?, notes = ?,
                updated_at = CURRENT_TIMESTAMP, updated_at_shamsi = ?
              WHERE id = ? AND employee_person_id = ?`
            ).bind(
              national_id || null,
              relation_type,
              first_name || null,
              last_name || null,
              full_name,
              father_name || null,
              id_number || null,
              birth_date_shamsi || null,
              gender || null,
              mobile || null,
              education_status || null,
              military_status || null,
              marital_status || null,
              marriage_date_shamsi || null,
              is_disabled ? 1 : 0,
              notes || null,
              nowShamsi,
              id,
              personId
            ).run();
            return new Response(JSON.stringify({ success: true, id }), {
              status: 200,
              headers
            });
          } else {
            const result = await env.DB.prepare(
              `INSERT INTO dependents 
               (employee_person_id, national_id, relation_type, first_name, last_name, full_name,
                father_name, id_number, birth_date_shamsi, gender, mobile,
                education_status, military_status, marital_status, marriage_date_shamsi,
                is_disabled, notes, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              personId,
              national_id || null,
              relation_type,
              first_name || null,
              last_name || null,
              full_name,
              father_name || null,
              id_number || null,
              birth_date_shamsi || null,
              gender || null,
              mobile || null,
              education_status || null,
              military_status || null,
              marital_status || null,
              marriage_date_shamsi || null,
              is_disabled ? 1 : 0,
              notes || null,
              nowShamsi,
              nowShamsi
            ).run();
            return new Response(
              JSON.stringify({
                success: true,
                id: result.meta.last_row_id
              }),
              {
                status: 201,
                headers
              }
            );
          }
        } catch (error) {
          console.error("Dependent POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/dependents\/\d+$/) && request.method === "DELETE") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const dependentId = url.pathname.split("/").pop();
          await env.DB.prepare("DELETE FROM dependents WHERE id = ?").bind(dependentId).run();
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Dependent DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/decree-items" && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const decreeType = url.searchParams.get("decree_type");
          if (!decreeType) {
            return new Response(
              JSON.stringify({ error: "decree_type \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
              {
                status: 400,
                headers
              }
            );
          }
          const items = await env.DB.prepare(
            `SELECT * FROM decree_items WHERE decree_type = ? AND is_active = 1 ORDER BY sort_order`
          ).bind(decreeType).all();
          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Decree items error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+\/decrees$/) && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const personId = url.pathname.split("/")[3];
          const decrees = await env.DB.prepare(
            `SELECT * FROM decrees WHERE employee_person_id = ? ORDER BY id DESC`
          ).bind(personId).all();
          return new Response(JSON.stringify(decrees.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Decrees GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/decrees\/\d+$/) && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const decreeId = url.pathname.split("/").pop();
          const decree = await env.DB.prepare(
            `SELECT * FROM decrees WHERE id = ?`
          ).bind(decreeId).first();
          if (!decree) {
            return new Response(JSON.stringify({ error: "\u062D\u06A9\u0645 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          if (decree.items) {
            try {
              decree.items_parsed = JSON.parse(decree.items);
            } catch (e) {
              decree.items_parsed = [];
            }
          }
          return new Response(JSON.stringify(decree), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Decree GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+\/decrees$/) && request.method === "POST") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const personId = url.pathname.split("/")[3];
          const body = await request.json();
          const {
            id,
            decree_type,
            decree_number,
            decree_date_shamsi,
            execution_date_shamsi,
            contract_start_shamsi,
            contract_end_shamsi,
            description,
            organization_unit,
            service_location,
            position_title,
            job_group,
            job_rank,
            job_class,
            employment_type,
            employment_duration,
            person_first_name,
            person_last_name,
            person_father_name,
            person_national_id,
            person_id_number,
            person_birth_date_shamsi,
            person_birth_place,
            person_education_level,
            person_education_field,
            person_marital_status,
            person_children_count,
            person_military_status,
            person_employment_date_shamsi,
            service_history_years,
            service_history_months,
            service_history_days,
            experience_years,
            experience_months,
            experience_days,
            items,
            total_amount,
            total_in_words,
            extra_data,
            notes
          } = body;
          if (!decree_type) {
            return new Response(
              JSON.stringify({ error: "\u0646\u0648\u0639 \u062D\u06A9\u0645 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
              {
                status: 400,
                headers
              }
            );
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          const itemsJson = items ? JSON.stringify(items) : null;
          if (id) {
            await env.DB.prepare(
              `UPDATE decrees SET
                decree_type = ?,
                decree_number = ?,
                decree_date_shamsi = ?,
                execution_date_shamsi = ?,
                contract_start_shamsi = ?,
                contract_end_shamsi = ?,
                description = ?,
                organization_unit = ?,
                service_location = ?,
                position_title = ?,
                job_group = ?,
                job_rank = ?,
                job_class = ?,
                employment_type = ?,
                employment_duration = ?,
                person_first_name = ?,
                person_last_name = ?,
                person_father_name = ?,
                person_national_id = ?,
                person_id_number = ?,
                person_birth_date_shamsi = ?,
                person_birth_place = ?,
                person_education_level = ?,
                person_education_field = ?,
                person_marital_status = ?,
                person_children_count = ?,
                person_military_status = ?,
                person_employment_date_shamsi = ?,
                service_history_years = ?,
                service_history_months = ?,
                service_history_days = ?,
                experience_years = ?,
                experience_months = ?,
                experience_days = ?,
                items = ?,
                total_amount = ?,
                total_in_words = ?,
                extra_data = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP,
                updated_at_shamsi = ?
              WHERE id = ? AND employee_person_id = ?`
            ).bind(
              decree_type,
              decree_number || null,
              decree_date_shamsi || null,
              execution_date_shamsi || null,
              contract_start_shamsi || null,
              contract_end_shamsi || null,
              description || null,
              organization_unit || null,
              service_location || null,
              position_title || null,
              job_group || null,
              job_rank || null,
              job_class || null,
              employment_type || null,
              employment_duration || null,
              person_first_name || null,
              person_last_name || null,
              person_father_name || null,
              person_national_id || null,
              person_id_number || null,
              person_birth_date_shamsi || null,
              person_birth_place || null,
              person_education_level || null,
              person_education_field || null,
              person_marital_status || null,
              person_children_count || 0,
              person_military_status || null,
              person_employment_date_shamsi || null,
              service_history_years || 0,
              service_history_months || 0,
              service_history_days || 0,
              experience_years || 0,
              experience_months || 0,
              experience_days || 0,
              itemsJson,
              total_amount || 0,
              total_in_words || null,
              extra_data ? JSON.stringify(extra_data) : null,
              notes || null,
              nowShamsi,
              id,
              personId
            ).run();
            return new Response(JSON.stringify({ success: true, id }), {
              status: 200,
              headers
            });
          } else {
            const result = await env.DB.prepare(
              `INSERT INTO decrees (
                employee_person_id, decree_type, decree_number, decree_date_shamsi,
                execution_date_shamsi, contract_start_shamsi, contract_end_shamsi,
                description, organization_unit, service_location, position_title,
                job_group, job_rank, job_class, employment_type, employment_duration,
                person_first_name, person_last_name, person_father_name, person_national_id,
                person_id_number, person_birth_date_shamsi, person_birth_place,
                person_education_level, person_education_field, person_marital_status,
                person_children_count, person_military_status, person_employment_date_shamsi,
                service_history_years, service_history_months, service_history_days,
                experience_years, experience_months, experience_days,
                items, total_amount, total_in_words, extra_data, notes,
                created_at_shamsi, updated_at_shamsi
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
              )`
            ).bind(
              personId,
              decree_type,
              decree_number || null,
              decree_date_shamsi || null,
              execution_date_shamsi || null,
              contract_start_shamsi || null,
              contract_end_shamsi || null,
              description || null,
              organization_unit || null,
              service_location || null,
              position_title || null,
              job_group || null,
              job_rank || null,
              job_class || null,
              employment_type || null,
              employment_duration || null,
              person_first_name || null,
              person_last_name || null,
              person_father_name || null,
              person_national_id || null,
              person_id_number || null,
              person_birth_date_shamsi || null,
              person_birth_place || null,
              person_education_level || null,
              person_education_field || null,
              person_marital_status || null,
              person_children_count || 0,
              person_military_status || null,
              person_employment_date_shamsi || null,
              service_history_years || 0,
              service_history_months || 0,
              service_history_days || 0,
              experience_years || 0,
              experience_months || 0,
              experience_days || 0,
              itemsJson,
              total_amount || 0,
              total_in_words || null,
              extra_data ? JSON.stringify(extra_data) : null,
              notes || null,
              nowShamsi,
              nowShamsi
            ).run();
            return new Response(
              JSON.stringify({
                success: true,
                id: result.meta.last_row_id
              }),
              {
                status: 201,
                headers
              }
            );
          }
        } catch (error) {
          console.error("Decree POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/decrees\/\d+$/) && request.method === "DELETE") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const decreeId = url.pathname.split("/").pop();
          await env.DB.prepare("DELETE FROM decrees WHERE id = ?").bind(decreeId).run();
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Decree DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/signatures/send-otp" && request.method === "POST") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const body = await request.json();
          const { entity_type, entity_id, employee_person_id, mobile } = body;
          if (!entity_type || !entity_id || !employee_person_id || !mobile) {
            return new Response(JSON.stringify({ error: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0646\u0627\u0642\u0635" }), {
              status: 400,
              headers
            });
          }
          const otpCode = Math.floor(
            1e5 + Math.random() * 9e5
          ).toString();
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          const result = await env.DB.prepare(
            `INSERT INTO signatures 
             (entity_type, entity_id, employee_person_id, mobile, otp_code, otp_sent_at, status, created_at_shamsi)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'sent', ?)`
          ).bind(
            entity_type,
            entity_id,
            employee_person_id,
            mobile,
            otpCode,
            nowShamsi
          ).run();
          await env.DB.prepare(
            `INSERT INTO sms_log 
             (mobile, message, message_type, provider, status, entity_type, entity_id, employee_person_id, sent_at_shamsi)
             VALUES (?, ?, 'otp', 'mock', 'sent', ?, ?, ?, ?)`
          ).bind(
            mobile,
            `\u06A9\u062F \u062A\u0627\u06CC\u06CC\u062F \u0627\u0645\u0636\u0627\u06CC \u062F\u06CC\u062C\u06CC\u062A\u0627\u0644 \u0634\u0645\u0627: ${otpCode}`,
            entity_type,
            entity_id,
            employee_person_id,
            nowShamsi
          ).run();
          console.log(`\u{1F510} [MOCK SMS] OTP \u0628\u0631\u0627\u06CC ${mobile}: ${otpCode}`);
          return new Response(
            JSON.stringify({
              success: true,
              signature_id: result.meta.last_row_id,
              // ⚠️ فقط در حالت mock، OTP رو برمی‌گردونیم
              mock_otp: otpCode,
              message: "\u06A9\u062F \u062A\u0627\u06CC\u06CC\u062F \u0627\u0631\u0633\u0627\u0644 \u0634\u062F (mock)"
            }),
            {
              status: 200,
              headers
            }
          );
        } catch (error) {
          console.error("Send OTP error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/signatures/verify" && request.method === "POST") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const body = await request.json();
          const { signature_id, otp_code } = body;
          if (!signature_id || !otp_code) {
            return new Response(JSON.stringify({ error: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0646\u0627\u0642\u0635" }), {
              status: 400,
              headers
            });
          }
          const signature = await env.DB.prepare(
            `SELECT * FROM signatures WHERE id = ? AND status = 'sent'`
          ).bind(signature_id).first();
          if (!signature) {
            return new Response(
              JSON.stringify({ error: "\u0627\u0645\u0636\u0627 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647" }),
              {
                status: 404,
                headers
              }
            );
          }
          if (signature.otp_attempts >= 5) {
            await env.DB.prepare(
              `UPDATE signatures SET status = 'failed' WHERE id = ?`
            ).bind(signature_id).run();
            return new Response(
              JSON.stringify({ error: "\u062A\u0639\u062F\u0627\u062F \u062A\u0644\u0627\u0634 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632" }),
              {
                status: 400,
                headers
              }
            );
          }
          if (signature.otp_code !== otp_code) {
            await env.DB.prepare(
              `UPDATE signatures SET otp_attempts = otp_attempts + 1 WHERE id = ?`
            ).bind(signature_id).run();
            return new Response(
              JSON.stringify({ error: "\u06A9\u062F \u062A\u0627\u06CC\u06CC\u062F \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A" }),
              {
                status: 400,
                headers
              }
            );
          }
          await env.DB.prepare(
            `UPDATE signatures 
             SET status = 'verified', 
                 otp_verified_at = CURRENT_TIMESTAMP,
                 signed_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          ).bind(signature_id).run();
          if (signature.entity_type === "decree") {
            await env.DB.prepare(
              `UPDATE decrees 
               SET status = 'signed', 
                   signed_at = CURRENT_TIMESTAMP,
                   signed_by_employee = 1
               WHERE id = ?`
            ).bind(signature.entity_id).run();
          }
          return new Response(
            JSON.stringify({
              success: true,
              message: "\u0627\u0645\u0636\u0627 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062B\u0628\u062A \u0634\u062F"
            }),
            {
              status: 200,
              headers
            }
          );
        } catch (error) {
          console.error("Verify OTP error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/signatures\/\w+\/\d+$/) && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const parts = url.pathname.split("/");
          const entityType = parts[3];
          const entityId = parts[4];
          const signatures = await env.DB.prepare(
            `SELECT id, entity_type, entity_id, mobile, status, otp_sent_at, otp_verified_at, signed_at
             FROM signatures 
             WHERE entity_type = ? AND entity_id = ?
             ORDER BY id DESC`
          ).bind(entityType, entityId).all();
          return new Response(JSON.stringify(signatures.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Signatures GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/payroll-settings" && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const fiscalYearId = url.searchParams.get("fiscal_year_id");
          let query = "SELECT * FROM payroll_settings WHERE 1=1";
          const params = [];
          if (fiscalYearId) {
            query += " AND (fiscal_year_id = ? OR fiscal_year_id IS NULL)";
            params.push(fiscalYearId);
          } else {
            query += " AND fiscal_year_id IS NULL";
          }
          query += " ORDER BY category, sort_order";
          const items = await env.DB.prepare(query).bind(...params).all();
          const grouped = {};
          items.results.forEach((item) => {
            if (!grouped[item.category]) {
              grouped[item.category] = [];
            }
            grouped[item.category].push(item);
          });
          return new Response(
            JSON.stringify({
              items: items.results,
              grouped
            }),
            {
              status: 200,
              headers
            }
          );
        } catch (error) {
          console.error("Payroll settings GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/payroll-settings" && request.method === "PUT") {
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
            return new Response(
              JSON.stringify({
                error: "\u0641\u0642\u0637 \u0645\u062F\u06CC\u0631 \u0633\u06CC\u0633\u062A\u0645 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0631\u0627 \u062A\u063A\u06CC\u06CC\u0631 \u062F\u0647\u062F"
              }),
              {
                status: 403,
                headers
              }
            );
          }
          const body = await request.json();
          const { settings, fiscal_year_id } = body;
          if (!Array.isArray(settings)) {
            return new Response(
              JSON.stringify({ error: "settings \u0628\u0627\u06CC\u062F \u0622\u0631\u0627\u06CC\u0647 \u0628\u0627\u0634\u062F" }),
              {
                status: 400,
                headers
              }
            );
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          for (const s of settings) {
            if (!s.setting_key) continue;
            const existing = await env.DB.prepare(
              `SELECT id FROM payroll_settings WHERE setting_key = ? AND (fiscal_year_id = ? OR (fiscal_year_id IS NULL AND ? IS NULL))`
            ).bind(
              s.setting_key,
              fiscal_year_id || null,
              fiscal_year_id || null
            ).first();
            if (existing) {
              await env.DB.prepare(
                `UPDATE payroll_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
              ).bind(s.setting_value || null, existing.id).run();
            } else {
              await env.DB.prepare(
                `INSERT INTO payroll_settings (fiscal_year_id, setting_key, setting_value, setting_type, description, category, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
              ).bind(
                fiscal_year_id || null,
                s.setting_key,
                s.setting_value || null,
                s.setting_type || "number",
                s.description || null,
                s.category || "general",
                s.sort_order || 0
              ).run();
            }
          }
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Payroll settings PUT error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/payroll-items" && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const items = await env.DB.prepare(
            "SELECT * FROM payroll_items WHERE is_active = 1 ORDER BY sort_order"
          ).all();
          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Payroll items GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/payroll-items\/\d+$/) && request.method === "PUT") {
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
            return new Response(JSON.stringify({ error: "\u0641\u0642\u0637 \u0645\u062F\u06CC\u0631 \u0633\u06CC\u0633\u062A\u0645" }), {
              status: 403,
              headers
            });
          }
          const itemId = url.pathname.split("/").pop();
          const body = await request.json();
          const {
            title,
            category,
            calc_type,
            default_formula,
            is_insurance_subject,
            is_tax_subject,
            is_overtime_subject,
            is_holiday_subject,
            is_nightshift_subject,
            is_mission_subject,
            is_family_allowance_subject,
            is_child_allowance_subject,
            is_active,
            sort_order,
            notes
          } = body;
          await env.DB.prepare(
            `UPDATE payroll_items SET
              title = ?,
              category = ?,
              calc_type = ?,
              default_formula = ?,
              is_insurance_subject = ?,
              is_tax_subject = ?,
              is_overtime_subject = ?,
              is_holiday_subject = ?,
              is_nightshift_subject = ?,
              is_mission_subject = ?,
              is_family_allowance_subject = ?,
              is_child_allowance_subject = ?,
              is_active = ?,
              sort_order = ?,
              notes = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).bind(
            title,
            category || null,
            calc_type || "fixed",
            default_formula || null,
            is_insurance_subject ? 1 : 0,
            is_tax_subject ? 1 : 0,
            is_overtime_subject ? 1 : 0,
            is_holiday_subject ? 1 : 0,
            is_nightshift_subject ? 1 : 0,
            is_mission_subject ? 1 : 0,
            is_family_allowance_subject ? 1 : 0,
            is_child_allowance_subject ? 1 : 0,
            is_active !== void 0 ? is_active ? 1 : 0 : 1,
            sort_order || 0,
            notes || null,
            itemId
          ).run();
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Payroll item PUT error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/payroll-calculations" && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const employeeId = url.searchParams.get("employee_person_id");
          const year = url.searchParams.get("year");
          const month = url.searchParams.get("month");
          let query = `SELECT pc.*, p.full_name, p.national_id, p.code as person_code
                       FROM payroll_calculations pc
                       LEFT JOIN persons p ON pc.employee_person_id = p.id
                       WHERE 1=1`;
          const params = [];
          if (employeeId) {
            query += " AND pc.employee_person_id = ?";
            params.push(employeeId);
          }
          if (year) {
            query += " AND pc.period_year = ?";
            params.push(year);
          }
          if (month) {
            query += " AND pc.period_month = ?";
            params.push(month);
          }
          query += " ORDER BY pc.period_year DESC, pc.period_month DESC, pc.id DESC LIMIT 200";
          const items = await env.DB.prepare(query).bind(...params).all();
          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Payroll calc GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/payroll-calculations\/\d+$/) && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const id = url.pathname.split("/").pop();
          const calc = await env.DB.prepare(
            `SELECT pc.*, p.full_name, p.national_id, p.code as person_code, p.mobile
             FROM payroll_calculations pc
             LEFT JOIN persons p ON pc.employee_person_id = p.id
             WHERE pc.id = ?`
          ).bind(id).first();
          if (!calc) {
            return new Response(JSON.stringify({ error: "\u0645\u062D\u0627\u0633\u0628\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          try {
            calc.items_parsed = JSON.parse(calc.items || "[]");
          } catch (e) {
            calc.items_parsed = [];
          }
          try {
            calc.settings_parsed = JSON.parse(calc.settings_snapshot || "{}");
          } catch (e) {
            calc.settings_parsed = {};
          }
          return new Response(JSON.stringify(calc), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Payroll calc GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/payroll-calculations/calculate" && request.method === "POST") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const body = await request.json();
          const {
            employee_person_id,
            period_year,
            period_month,
            fiscal_year_id,
            decree_id
          } = body;
          if (!employee_person_id || !period_year || !period_month) {
            return new Response(JSON.stringify({ error: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0646\u0627\u0642\u0635" }), {
              status: 400,
              headers
            });
          }
          let decree;
          if (decree_id) {
            decree = await env.DB.prepare(`SELECT * FROM decrees WHERE id = ?`).bind(decree_id).first();
          } else {
            decree = await env.DB.prepare(
              `SELECT * FROM decrees 
               WHERE employee_person_id = ? AND status IN ('signed', 'active', 'issued')
               ORDER BY id DESC LIMIT 1`
            ).bind(employee_person_id).first();
          }
          if (!decree) {
            return new Response(
              JSON.stringify({ error: "\u062D\u06A9\u0645 \u0641\u0639\u0627\u0644\u06CC \u0628\u0631\u0627\u06CC \u0627\u06CC\u0646 \u06A9\u0627\u0631\u0645\u0646\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }),
              {
                status: 404,
                headers
              }
            );
          }
          let decreeItems = [];
          try {
            decreeItems = JSON.parse(decree.items || "[]");
          } catch (e) {
            decreeItems = [];
          }
          const payrollItemsData = await env.DB.prepare(
            "SELECT * FROM payroll_items WHERE is_active = 1"
          ).all();
          const payrollItemsMap = {};
          payrollItemsData.results.forEach((p) => {
            payrollItemsMap[p.title] = p;
          });
          const settingsData = await env.DB.prepare(
            "SELECT setting_key, setting_value FROM payroll_settings WHERE fiscal_year_id IS NULL"
          ).all();
          const settings = {};
          settingsData.results.forEach((s) => {
            settings[s.setting_key] = s.setting_value;
          });
          const attendance = await env.DB.prepare(
            `SELECT * FROM attendance 
             WHERE employee_person_id = ? 
               AND period_year = ? 
               AND period_month = ?
               AND status IN ('draft', 'submitted', 'manager_approved', 'mayor_approved')`
          ).bind(employee_person_id, period_year, period_month).first();
          const baseSalaryItem = decreeItems.find((i) => i.title === "\u062D\u0642\u0648\u0642 \u0645\u0628\u0646\u0627" || i.title === "\u0645\u0632\u062F \u0634\u063A\u0644");
          const baseSalary = baseSalaryItem ? parseFloat(baseSalaryItem.amount) : 0;
          const hourlyRate = baseSalary > 0 ? baseSalary / 220 : 0;
          if (attendance) {
            const overtimeRate = parseFloat(settings.overtime_rate || "140") / 100;
            const holidayRate = parseFloat(settings.holiday_rate || "140") / 100;
            const nightshiftRate = parseFloat(settings.nightshift_rate || "35") / 100;
            const missionRate = parseFloat(settings.mission_rate || "100") / 100;
            if (attendance.overtime_hours > 0 && hourlyRate > 0) {
              const overtimeAmount = Math.round(attendance.overtime_hours * hourlyRate * overtimeRate);
              decreeItems.push({
                code: "\u0636",
                title: "\u0627\u0636\u0627\u0641\u0647 \u06A9\u0627\u0631\u06CC",
                amount: overtimeAmount,
                is_insurance_subject: true,
                is_tax_subject: true
              });
            }
            if (attendance.holiday_hours > 0 && hourlyRate > 0) {
              const holidayAmount = Math.round(attendance.holiday_hours * hourlyRate * holidayRate);
              decreeItems.push({
                code: "\u0637",
                title: "\u062A\u0639\u0637\u06CC\u0644 \u06A9\u0627\u0631\u06CC",
                amount: holidayAmount,
                is_insurance_subject: true,
                is_tax_subject: true
              });
            }
            if (attendance.nightshift_hours > 0 && hourlyRate > 0) {
              const nightshiftAmount = Math.round(attendance.nightshift_hours * hourlyRate * nightshiftRate);
              decreeItems.push({
                code: "\u0638",
                title: "\u0641\u0648\u0642 \u0627\u0644\u0639\u0627\u062F\u0647 \u0646\u0648\u0628\u062A \u06A9\u0627\u0631\u06CC",
                amount: nightshiftAmount,
                is_insurance_subject: true,
                is_tax_subject: true
              });
            }
            if (attendance.mission_days_with_stay > 0 || attendance.mission_days_without_stay > 0) {
              const dailyRate = baseSalary / 30;
              const totalMissionDays = (attendance.mission_days_with_stay || 0) + (attendance.mission_days_without_stay || 0);
              if (totalMissionDays > 0) {
                const missionAmount = Math.round(totalMissionDays * dailyRate * missionRate);
                decreeItems.push({
                  code: "\u0639",
                  title: "\u0645\u0623\u0645\u0648\u0631\u06CC\u062A",
                  amount: missionAmount,
                  is_insurance_subject: true,
                  is_tax_subject: true
                });
              }
            }
          }
          let totalGross = 0;
          let totalInsuranceSubject = 0;
          let totalTaxSubject = 0;
          const calculatedItems = decreeItems.map((di) => {
            const pi = payrollItemsMap[di.title] || {};
            const amount = parseFloat(di.amount) || 0;
            const isInsurance = pi.is_insurance_subject === 1;
            const isTax = pi.is_tax_subject === 1;
            totalGross += amount;
            if (isInsurance) totalInsuranceSubject += amount;
            if (isTax) totalTaxSubject += amount;
            return {
              code: di.code,
              title: di.title,
              amount,
              is_insurance: isInsurance,
              is_tax: isTax
            };
          });
          const insuranceRateEmployee = parseFloat(settings.insurance_rate_employee || "7") / 100;
          const insuranceRateEmployer = parseFloat(settings.insurance_rate_employer || "23") / 100;
          const insuranceEmployee = Math.round(
            totalInsuranceSubject * insuranceRateEmployee
          );
          const insuranceEmployer = Math.round(
            totalInsuranceSubject * insuranceRateEmployer
          );
          const taxExemption = parseFloat(
            settings.tax_exemption_monthly || "120000000"
          );
          const taxBase = Math.max(0, totalTaxSubject - taxExemption);
          const rates = [
            parseFloat(settings.tax_rate_1 || "10") / 100,
            parseFloat(settings.tax_rate_2 || "15") / 100,
            parseFloat(settings.tax_rate_3 || "20") / 100,
            parseFloat(settings.tax_rate_4 || "25") / 100
          ];
          const taxAmount = Math.round(taxBase * rates[0]);
          let loanInstallments = 0;
          let otherDeductions = 0;
          const appliedDeductions = [];
          const activeLoans = await env.DB.prepare(
            `SELECT * FROM loans 
             WHERE employee_person_id = ? 
               AND status = 'active' 
               AND is_active = 1
               AND paid_installments < installments_count
             ORDER BY id`
          ).bind(employee_person_id).all();
          for (const loan of activeLoans.results) {
            const installmentAmt = parseFloat(loan.installment_amount) || 0;
            if (installmentAmt > 0) {
              loanInstallments += installmentAmt;
              appliedDeductions.push({
                type: "loan",
                loan_id: loan.id,
                title: `${loan.lender_name || "\u0648\u0627\u0645"} - \u0642\u0633\u0637 ${loan.paid_installments + 1}`,
                amount: installmentAmt
              });
            }
          }
          const activeDeductions = await env.DB.prepare(
            `SELECT ed.*, dt.title as type_title
             FROM employee_deductions ed
             LEFT JOIN deduction_types dt ON ed.deduction_type_id = dt.id
             WHERE ed.employee_person_id = ? 
               AND ed.status = 'active' 
               AND ed.is_active = 1`
          ).bind(employee_person_id).all();
          if (attendance && attendance.absence_days > 0 && baseSalary > 0) {
            const dailyRate = baseSalary / 30;
            const absenceAmount = Math.round(attendance.absence_days * dailyRate);
            if (absenceAmount > 0) {
              otherDeductions += absenceAmount;
              appliedDeductions.push({
                type: "absence",
                title: `\u06A9\u0633\u0631 \u063A\u06CC\u0628\u062A (${toPersianNumbers(attendance.absence_days)} \u0631\u0648\u0632)`,
                amount: absenceAmount
              });
            }
          }
          for (const ded of activeDeductions.results) {
            const amt = parseFloat(ded.amount) || 0;
            if (amt > 0) {
              otherDeductions += amt;
              appliedDeductions.push({
                type: "deduction",
                deduction_id: ded.id,
                title: ded.title,
                amount: amt
              });
            }
          }
          const totalDeductions = insuranceEmployee + taxAmount + loanInstallments + otherDeductions;
          const netPay = totalGross - totalDeductions;
          const extendedSettings = {
            ...settings,
            applied_deductions: appliedDeductions,
            loan_installments: loanInstallments,
            other_deductions: otherDeductions
          };
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          const result = await env.DB.prepare(
            `INSERT INTO payroll_calculations 
             (employee_person_id, fiscal_year_id, period_year, period_month,
              decree_id, items, total_gross, total_insurance_subject, total_tax_subject,
              insurance_employee, insurance_employer, tax_amount, other_deductions,
              total_deductions, net_pay, settings_snapshot, status,
              calculated_by, calculated_at_shamsi, created_at_shamsi, updated_at_shamsi)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'calculated', ?, ?, ?, ?)`
          ).bind(
            employee_person_id,
            fiscal_year_id || null,
            period_year,
            period_month,
            decree.id,
            JSON.stringify(calculatedItems),
            totalGross,
            totalInsuranceSubject,
            totalTaxSubject,
            insuranceEmployee,
            insuranceEmployer,
            taxAmount,
            otherDeductions + loanInstallments,
            // ← مجموع کسورات غیر بیمه/مالیات
            totalDeductions,
            netPay,
            JSON.stringify(extendedSettings),
            // ← settings با applied_deductions
            userData.userId,
            nowShamsi,
            nowShamsi,
            nowShamsi
          ).run();
          const calculationId = result.meta.last_row_id;
          for (const loan of activeLoans.results) {
            const installmentAmt = parseFloat(loan.installment_amount) || 0;
            if (installmentAmt <= 0) continue;
            const nextInstallmentNumber = (loan.paid_installments || 0) + 1;
            await env.DB.prepare(
              `INSERT INTO loan_payments 
               (loan_id, employee_person_id, installment_number, amount,
                period_year, period_month, payroll_calculation_id,
                status, created_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?)`
            ).bind(
              loan.id,
              employee_person_id,
              nextInstallmentNumber,
              installmentAmt,
              period_year,
              period_month,
              calculationId,
              nowShamsi
            ).run();
            const newPaidInstallments = (loan.paid_installments || 0) + 1;
            const newPaidAmount = (loan.paid_amount || 0) + installmentAmt;
            const newRemaining = (loan.total_amount || 0) - newPaidAmount;
            const newStatus = newPaidInstallments >= loan.installments_count ? "completed" : "active";
            await env.DB.prepare(
              `UPDATE loans SET
                paid_installments = ?,
                paid_amount = ?,
                remaining_amount = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP,
                updated_at_shamsi = ?
              WHERE id = ?`
            ).bind(
              newPaidInstallments,
              newPaidAmount,
              newRemaining,
              newStatus,
              nowShamsi,
              loan.id
            ).run();
          }
          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
              calculation: {
                total_gross: totalGross,
                total_insurance_subject: totalInsuranceSubject,
                total_tax_subject: totalTaxSubject,
                insurance_employee: insuranceEmployee,
                insurance_employer: insuranceEmployer,
                tax_amount: taxAmount,
                loan_installments: loanInstallments,
                // ← جدید
                other_deductions: otherDeductions,
                // ← جدید
                total_deductions: totalDeductions,
                net_pay: netPay,
                items: calculatedItems,
                applied_deductions: appliedDeductions
                // ← جدید
              }
            }),
            {
              status: 201,
              headers
            }
          );
        } catch (error) {
          console.error("Payroll calculate error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/payroll-calculations\/\d+\/cancel$/) && request.method === "POST") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }), {
              status: 401,
              headers
            });
          }
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const id = url.pathname.split("/")[3];
          const body = await request.json();
          const { reason } = body;
          const calc = await env.DB.prepare(
            `SELECT * FROM payroll_calculations WHERE id = ?`
          ).bind(id).first();
          if (!calc) {
            return new Response(JSON.stringify({ error: "\u0645\u062D\u0627\u0633\u0628\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          if (calc.status === "cancelled") {
            return new Response(JSON.stringify({ error: "\u0627\u06CC\u0646 \u0645\u062D\u0627\u0633\u0628\u0647 \u0642\u0628\u0644\u0627\u064B \u0644\u063A\u0648 \u0634\u062F\u0647" }), {
              status: 400,
              headers
            });
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          const loanPayments = await env.DB.prepare(
            `SELECT * FROM loan_payments 
             WHERE payroll_calculation_id = ? AND status = 'paid'`
          ).bind(id).all();
          for (const payment of loanPayments.results) {
            const loan = await env.DB.prepare(
              `SELECT * FROM loans WHERE id = ?`
            ).bind(payment.loan_id).first();
            if (loan) {
              const newPaidInstallments = Math.max(0, (loan.paid_installments || 0) - 1);
              const newPaidAmount = Math.max(0, (loan.paid_amount || 0) - payment.amount);
              const newRemaining = (loan.total_amount || 0) - newPaidAmount;
              let newStatus = loan.status;
              if (loan.status === "completed" && newPaidInstallments < loan.installments_count) {
                newStatus = "active";
              }
              await env.DB.prepare(
                `UPDATE loans SET
                  paid_installments = ?,
                  paid_amount = ?,
                  remaining_amount = ?,
                  status = ?,
                  updated_at = CURRENT_TIMESTAMP,
                  updated_at_shamsi = ?
                WHERE id = ?`
              ).bind(
                newPaidInstallments,
                newPaidAmount,
                newRemaining,
                newStatus,
                nowShamsi,
                loan.id
              ).run();
            }
          }
          await env.DB.prepare(
            `UPDATE loan_payments SET status = 'cancelled' 
             WHERE payroll_calculation_id = ?`
          ).bind(id).run();
          await env.DB.prepare(
            `UPDATE payroll_calculations SET
              status = 'cancelled',
              cancelled_at = CURRENT_TIMESTAMP,
              cancelled_by = ?,
              cancelled_reason = ?,
              updated_at = CURRENT_TIMESTAMP,
              updated_at_shamsi = ?
            WHERE id = ?`
          ).bind(
            userData.userId,
            reason || null,
            nowShamsi,
            id
          ).run();
          return new Response(JSON.stringify({
            success: true,
            message: "\u0645\u062D\u0627\u0633\u0628\u0647 \u0644\u063A\u0648 \u0634\u062F \u0648 \u0627\u0642\u0633\u0627\u0637 \u0648\u0627\u0645 \u0628\u0627\u0632\u06AF\u0631\u062F\u0627\u0646\u062F\u0647 \u0634\u062F\u0646\u062F"
          }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Payroll cancel error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/payroll-calculations\/\d+$/) && request.method === "DELETE") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }), {
              status: 401,
              headers
            });
          }
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);
          if (!userData || userData.role !== "admin") {
            return new Response(JSON.stringify({ error: "\u0641\u0642\u0637 \u0645\u062F\u06CC\u0631 \u0633\u06CC\u0633\u062A\u0645" }), {
              status: 403,
              headers
            });
          }
          const id = url.pathname.split("/").pop();
          const calc = await env.DB.prepare(
            `SELECT status FROM payroll_calculations WHERE id = ?`
          ).bind(id).first();
          if (!calc) {
            return new Response(JSON.stringify({ error: "\u0645\u062D\u0627\u0633\u0628\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          if (calc.status !== "cancelled") {
            return new Response(JSON.stringify({
              error: "\u0641\u0642\u0637 \u0645\u062D\u0627\u0633\u0628\u0627\u062A \u0644\u063A\u0648 \u0634\u062F\u0647 \u0642\u0627\u0628\u0644 \u062D\u0630\u0641 \u06A9\u0627\u0645\u0644 \u0647\u0633\u062A\u0646\u062F"
            }), {
              status: 400,
              headers
            });
          }
          await env.DB.prepare("DELETE FROM loan_payments WHERE payroll_calculation_id = ?").bind(id).run();
          await env.DB.prepare("DELETE FROM payroll_calculations WHERE id = ?").bind(id).run();
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Payroll calc DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/employees/list" && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const employees = await env.DB.prepare(
            `SELECT DISTINCT p.id, p.code, p.full_name, p.national_id, p.mobile,
                    (SELECT COUNT(*) FROM decrees d WHERE d.employee_person_id = p.id AND d.status IN ('signed', 'active', 'issued')) as decrees_count
             FROM persons p
             INNER JOIN decrees d ON d.employee_person_id = p.id
             WHERE p.person_type = 'employee' AND p.is_active = 1
             ORDER BY p.full_name`
          ).all();
          return new Response(JSON.stringify(employees.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Employees list error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/deduction-types" && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const items = await env.DB.prepare(
            "SELECT * FROM deduction_types WHERE is_active = 1 ORDER BY sort_order"
          ).all();
          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Deduction types error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+\/loans$/) && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const personId = url.pathname.split("/")[3];
          const loans = await env.DB.prepare(
            `SELECT * FROM loans WHERE employee_person_id = ? ORDER BY id DESC`
          ).bind(personId).all();
          return new Response(JSON.stringify(loans.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Loans GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/loans\/\d+$/) && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const loanId = url.pathname.split("/").pop();
          const loan = await env.DB.prepare(`SELECT * FROM loans WHERE id = ?`).bind(loanId).first();
          if (!loan) {
            return new Response(JSON.stringify({ error: "\u0648\u0627\u0645 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          const payments = await env.DB.prepare(
            `SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY installment_number`
          ).bind(loanId).all();
          return new Response(
            JSON.stringify({
              loan,
              payments: payments.results
            }),
            {
              status: 200,
              headers
            }
          );
        } catch (error) {
          console.error("Loan GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+\/loans$/) && request.method === "POST") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const personId = url.pathname.split("/")[3];
          const body = await request.json();
          const {
            id,
            loan_type,
            lender_name,
            loan_number,
            total_amount,
            installments_count,
            installment_amount,
            start_date_shamsi,
            end_date_shamsi,
            first_installment_shamsi,
            notes
          } = body;
          if (!total_amount || !installments_count) {
            return new Response(
              JSON.stringify({ error: "\u0645\u0628\u0644\u063A \u06A9\u0644 \u0648 \u062A\u0639\u062F\u0627\u062F \u0627\u0642\u0633\u0627\u0637 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
              {
                status: 400,
                headers
              }
            );
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          const installmentAmt = installment_amount || Math.round(total_amount / installments_count);
          const remaining = total_amount;
          if (id) {
            await env.DB.prepare(
              `UPDATE loans SET
                loan_type = ?,
                lender_name = ?,
                loan_number = ?,
                total_amount = ?,
                installments_count = ?,
                installment_amount = ?,
                start_date_shamsi = ?,
                end_date_shamsi = ?,
                first_installment_shamsi = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP,
                updated_at_shamsi = ?
              WHERE id = ? AND employee_person_id = ?`
            ).bind(
              loan_type || null,
              lender_name || null,
              loan_number || null,
              total_amount,
              installments_count,
              installmentAmt,
              start_date_shamsi || null,
              end_date_shamsi || null,
              first_installment_shamsi || null,
              notes || null,
              nowShamsi,
              id,
              personId
            ).run();
            return new Response(JSON.stringify({ success: true, id }), {
              status: 200,
              headers
            });
          } else {
            const result = await env.DB.prepare(
              `INSERT INTO loans 
               (employee_person_id, loan_type, lender_name, loan_number,
                total_amount, paid_amount, remaining_amount,
                installments_count, installment_amount, paid_installments,
                start_date_shamsi, end_date_shamsi, first_installment_shamsi,
                status, notes, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?, ?, ?, 'active', ?, ?, ?)`
            ).bind(
              personId,
              loan_type || null,
              lender_name || null,
              loan_number || null,
              total_amount,
              remaining,
              installments_count,
              installmentAmt,
              start_date_shamsi || null,
              end_date_shamsi || null,
              first_installment_shamsi || null,
              notes || null,
              nowShamsi,
              nowShamsi
            ).run();
            return new Response(
              JSON.stringify({
                success: true,
                id: result.meta.last_row_id
              }),
              {
                status: 201,
                headers
              }
            );
          }
        } catch (error) {
          console.error("Loan POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/loans\/\d+$/) && request.method === "DELETE") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const loanId = url.pathname.split("/").pop();
          await env.DB.prepare("DELETE FROM loans WHERE id = ?").bind(loanId).run();
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Loan DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+\/deductions$/) && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const personId = url.pathname.split("/")[3];
          const ded = await env.DB.prepare(
            `SELECT ed.*, dt.title as type_title, dt.code as type_code, dt.category as type_category
             FROM employee_deductions ed
             LEFT JOIN deduction_types dt ON ed.deduction_type_id = dt.id
             WHERE ed.employee_person_id = ?
             ORDER BY ed.id DESC`
          ).bind(personId).all();
          return new Response(JSON.stringify(ded.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Deductions GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employees\/\d+\/deductions$/) && request.method === "POST") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const personId = url.pathname.split("/")[3];
          const body = await request.json();
          const {
            id,
            deduction_type_id,
            title,
            amount,
            start_date_shamsi,
            end_date_shamsi,
            remaining_count,
            notes
          } = body;
          if (!title || !amount) {
            return new Response(
              JSON.stringify({ error: "\u0639\u0646\u0648\u0627\u0646 \u0648 \u0645\u0628\u0644\u063A \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" }),
              {
                status: 400,
                headers
              }
            );
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          if (id) {
            await env.DB.prepare(
              `UPDATE employee_deductions SET
                deduction_type_id = ?,
                title = ?,
                amount = ?,
                start_date_shamsi = ?,
                end_date_shamsi = ?,
                remaining_count = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP,
                updated_at_shamsi = ?
              WHERE id = ? AND employee_person_id = ?`
            ).bind(
              deduction_type_id || null,
              title,
              amount,
              start_date_shamsi || null,
              end_date_shamsi || null,
              remaining_count || null,
              notes || null,
              nowShamsi,
              id,
              personId
            ).run();
            return new Response(JSON.stringify({ success: true, id }), {
              status: 200,
              headers
            });
          } else {
            const result = await env.DB.prepare(
              `INSERT INTO employee_deductions 
               (employee_person_id, deduction_type_id, title, amount,
                start_date_shamsi, end_date_shamsi, remaining_count,
                status, notes, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`
            ).bind(
              personId,
              deduction_type_id || null,
              title,
              amount,
              start_date_shamsi || null,
              end_date_shamsi || null,
              remaining_count || null,
              notes || null,
              nowShamsi,
              nowShamsi
            ).run();
            return new Response(
              JSON.stringify({
                success: true,
                id: result.meta.last_row_id
              }),
              {
                status: 201,
                headers
              }
            );
          }
        } catch (error) {
          console.error("Deduction POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/employee-deductions\/\d+$/) && request.method === "DELETE") {
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
          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const id = url.pathname.split("/").pop();
          await env.DB.prepare("DELETE FROM employee_deductions WHERE id = ?").bind(id).run();
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Deduction DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/loans\/\d+\/payments$/) && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const loanId = url.pathname.split("/")[3];
          const payments = await env.DB.prepare(
            `SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY installment_number`
          ).bind(loanId).all();
          return new Response(JSON.stringify(payments.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Loan payments GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/employees/search" && request.method === "GET") {
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
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const query = url.searchParams.get("q") || "";
          const limit = parseInt(url.searchParams.get("limit") || "20");
          if (!query || query.length < 2) {
            return new Response(
              JSON.stringify({
                error: "\u062D\u062F\u0627\u0642\u0644 \u06F2 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F",
                results: []
              }),
              {
                status: 400,
                headers
              }
            );
          }
          const searchPattern = `%${query}%`;
          const employees = await env.DB.prepare(
            `SELECT DISTINCT p.id, p.code, p.full_name, p.national_id, p.mobile,
                    (SELECT COUNT(*) FROM decrees d 
                     WHERE d.employee_person_id = p.id 
                       AND d.status IN ('signed', 'active', 'issued')) as decrees_count
             FROM persons p
             INNER JOIN decrees d ON d.employee_person_id = p.id
             WHERE p.person_type = 'employee' 
               AND p.is_active = 1
               AND (
                 p.national_id LIKE ? 
                 OR p.full_name LIKE ?
                 OR p.code LIKE ?
               )
             ORDER BY p.full_name
             LIMIT ?`
          ).bind(searchPattern, searchPattern, searchPattern, limit).all();
          return new Response(
            JSON.stringify({
              results: employees.results,
              count: employees.results.length
            }),
            {
              status: 200,
              headers
            }
          );
        } catch (error) {
          console.error("Employees search error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/attendance" && request.method === "GET") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }), {
              status: 401,
              headers
            });
          }
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const employeeId = url.searchParams.get("employee_person_id");
          const year = url.searchParams.get("year");
          const month = url.searchParams.get("month");
          let query = `SELECT a.*, p.full_name, p.code as person_code, p.national_id
                       FROM attendance a
                       LEFT JOIN persons p ON a.employee_person_id = p.id
                       WHERE 1=1`;
          const params = [];
          if (employeeId) {
            query += " AND a.employee_person_id = ?";
            params.push(employeeId);
          }
          if (year) {
            query += " AND a.period_year = ?";
            params.push(year);
          }
          if (month) {
            query += " AND a.period_month = ?";
            params.push(month);
          }
          query += " ORDER BY a.period_year DESC, a.period_month DESC, a.id DESC LIMIT 200";
          const items = await env.DB.prepare(query).bind(...params).all();
          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Attendance GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/attendance\/\d+$/) && request.method === "GET") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }), {
              status: 401,
              headers
            });
          }
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const id = url.pathname.split("/").pop();
          const item = await env.DB.prepare(
            `SELECT a.*, p.full_name, p.code as person_code, p.national_id
             FROM attendance a
             LEFT JOIN persons p ON a.employee_person_id = p.id
             WHERE a.id = ?`
          ).bind(id).first();
          if (!item) {
            return new Response(JSON.stringify({ error: "\u0631\u06A9\u0648\u0631\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" }), {
              status: 404,
              headers
            });
          }
          return new Response(JSON.stringify(item), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Attendance GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname === "/api/attendance" && request.method === "POST") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }), {
              status: 401,
              headers
            });
          }
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);
          if (!userData || !["admin", "manager", "expert"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" }), {
              status: 403,
              headers
            });
          }
          const body = await request.json();
          const {
            id,
            employee_person_id,
            period_year,
            period_month,
            working_days,
            absence_days,
            leave_days,
            sick_leave_days,
            overtime_hours,
            holiday_hours,
            nightshift_hours,
            mission_days_with_stay,
            mission_days_without_stay,
            notes
          } = body;
          if (!employee_person_id || !period_year || !period_month) {
            return new Response(JSON.stringify({ error: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0646\u0627\u0642\u0635" }), {
              status: 400,
              headers
            });
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          if (id) {
            await env.DB.prepare(
              `UPDATE attendance SET
                working_days = ?,
                absence_days = ?,
                leave_days = ?,
                sick_leave_days = ?,
                overtime_hours = ?,
                holiday_hours = ?,
                nightshift_hours = ?,
                mission_days_with_stay = ?,
                mission_days_without_stay = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP,
                updated_at_shamsi = ?
              WHERE id = ?`
            ).bind(
              working_days || 0,
              absence_days || 0,
              leave_days || 0,
              sick_leave_days || 0,
              overtime_hours || 0,
              holiday_hours || 0,
              nightshift_hours || 0,
              mission_days_with_stay || 0,
              mission_days_without_stay || 0,
              notes || null,
              nowShamsi,
              id
            ).run();
            return new Response(JSON.stringify({ success: true, id }), {
              status: 200,
              headers
            });
          } else {
            const result = await env.DB.prepare(
              `INSERT INTO attendance 
               (employee_person_id, period_year, period_month,
                working_days, absence_days, leave_days, sick_leave_days,
                overtime_hours, holiday_hours, nightshift_hours,
                mission_days_with_stay, mission_days_without_stay,
                status, notes, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`
            ).bind(
              employee_person_id,
              period_year,
              period_month,
              working_days || 0,
              absence_days || 0,
              leave_days || 0,
              sick_leave_days || 0,
              overtime_hours || 0,
              holiday_hours || 0,
              nightshift_hours || 0,
              mission_days_with_stay || 0,
              mission_days_without_stay || 0,
              notes || null,
              nowShamsi,
              nowShamsi
            ).run();
            return new Response(JSON.stringify({
              success: true,
              id: result.meta.last_row_id
            }), {
              status: 201,
              headers
            });
          }
        } catch (error) {
          console.error("Attendance POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/attendance\/\d+\/approve$/) && request.method === "PUT") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }), {
              status: 401,
              headers
            });
          }
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);
          if (!userData) {
            return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 401,
              headers
            });
          }
          const id = url.pathname.split("/")[3];
          const body = await request.json();
          const { approve_type, approved } = body;
          if (!["manager", "mayor"].includes(approve_type)) {
            return new Response(JSON.stringify({ error: "\u0646\u0648\u0639 \u062A\u0623\u06CC\u06CC\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
              status: 400,
              headers
            });
          }
          const nowShamsi = toShamsi(/* @__PURE__ */ new Date());
          if (approve_type === "manager") {
            await env.DB.prepare(
              `UPDATE attendance SET
                manager_approved = ?,
                manager_approved_by = ?,
                manager_approved_at = CURRENT_TIMESTAMP,
                status = ?,
                updated_at_shamsi = ?
              WHERE id = ?`
            ).bind(
              approved ? 1 : 0,
              userData.userId,
              approved ? "manager_approved" : "rejected",
              nowShamsi,
              id
            ).run();
          } else {
            await env.DB.prepare(
              `UPDATE attendance SET
                mayor_approved = ?,
                mayor_approved_by = ?,
                mayor_approved_at = CURRENT_TIMESTAMP,
                status = ?,
                updated_at_shamsi = ?
              WHERE id = ?`
            ).bind(
              approved ? 1 : 0,
              userData.userId,
              approved ? "mayor_approved" : "rejected",
              nowShamsi,
              id
            ).run();
          }
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Attendance approve error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
      }
      if (url.pathname.match(/^\/api\/attendance\/\d+$/) && request.method === "DELETE") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A" }), {
              status: 401,
              headers
            });
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
          await env.DB.prepare("DELETE FROM attendance WHERE id = ?").bind(id).run();
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers
          });
        } catch (error) {
          console.error("Attendance DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
          });
        }
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
        if (!userData) {
          return new Response(JSON.stringify({ error: "\u062A\u0648\u06A9\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" }), {
            status: 401,
            headers
          });
        }
        const hasAccess = await checkPermission(
          env,
          userData.userId,
          "users.view"
        );
        if (!hasAccess) {
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
        if (!userData || !["admin", "manager"].includes(userData.role)) {
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
        const hasAccess = await checkPermission(
          env,
          userData.userId,
          "municipality_info.edit"
        );
        if (!hasAccess) {
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
        "/sidebar.css",
        "/footer.js",
        "/Logo.png",
        "/strategic-plan.html",
        "/operational-classifications.html",
        "/accounting.html",
        "/budget-types.html",
        "/goods.html",
        "/persons.html",
        "/permissions.html",
        "/employee-profile.html",
        "/payroll-settings.html",
        "/payroll-calculate.html",
        "/employee-deductions.html",
        "/attendance.html"
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

// C:/Users/YAHOO/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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

// C:/Users/YAHOO/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
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

// .wrangler/tmp/bundle-Bp5eqA/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// C:/Users/YAHOO/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-Bp5eqA/middleware-loader.entry.ts
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
