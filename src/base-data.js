// ============================================
// توابع کمکی برای base_data
// ============================================

import { toShamsi } from "./date.js";

/**
 * ساخت کد خودکار برای ردیف جدید
 */
export async function generateNextCode(
  env,
  { section, type, parent_id, digit_count = 3, prefix = null }
) {
  let parentCode = "";

  if (parent_id) {
    const parent = await env.DB.prepare(
      "SELECT code, level FROM base_data WHERE id = ?"
    )
      .bind(parent_id)
      .first();

    if (!parent) {
      throw new Error("والد یافت نشد");
    }

    parentCode = parent.code;
  }

  // آخرین فرزند رو پیدا کن
  let lastChild = null;

  if (parent_id) {
    lastChild = await env.DB.prepare(
      `SELECT code FROM base_data 
             WHERE parent_id = ? 
             ORDER BY code DESC 
             LIMIT 1`
    )
      .bind(parent_id)
      .first();
  } else {
    let query =
      "SELECT code FROM base_data WHERE parent_id IS NULL AND section = ?";
    const params = [section];

    if (type) {
      query += " AND type = ?";
      params.push(type);
    }

    query += " ORDER BY code DESC LIMIT 1";

    lastChild = await env.DB.prepare(query)
      .bind(...params)
      .first();
  }

  let nextNumber = 1;

  if (lastChild) {
    const parentCodeLength = parentCode.length;
    let lastChildSuffix = lastChild.code.substring(parentCodeLength);

    // اگه پیشوند داشت (مثل 'س-')، حذفش کن
    if (lastChildSuffix.includes("-")) {
      lastChildSuffix = lastChildSuffix.split("-").pop();
    }

    nextNumber = parseInt(lastChildSuffix, 10) + 1;
  }

  const paddedNumber = nextNumber.toString().padStart(digit_count, "0");

  // ✅ اصلاح: پیشوند فقط اگه parentCode خالی باشه (سطح ۰)
  let newCode;
  if (parentCode) {
    // زیرشاخه: کد والد (که از قبل پیشوند داره) + عدد جدید
    newCode = parentCode + paddedNumber;
  } else {
    // سطح ۰: پیشوند + عدد
    newCode = prefix ? `${prefix}-${paddedNumber}` : paddedNumber;
  }

  return newCode;
}

/**
 * ساخت درخت از لیست تخت
 */
export function buildTree(items) {
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

  const sortFn = (a, b) => {
    if (a.sort_order !== b.sort_order) {
      return (a.sort_order || 0) - (b.sort_order || 0);
    }
    return a.code.localeCompare(b.code);
  };

  const sortRecursive = (nodes) => {
    nodes.sort(sortFn);
    nodes.forEach((n) => sortRecursive(n.children));
  };

  sortRecursive(roots);

  return roots;
}

/**
 * لاگ کردن عملیات base_data
 */
export async function logBaseDataAction(
  env,
  request,
  userData,
  action,
  entityId,
  details
) {
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const userAgent = request.headers.get("User-Agent") || "unknown";

    await env.DB.prepare(
      `
            INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
    )
      .bind(
        userData ? userData.userId : null,
        userData ? userData.username : null,
        action,
        "base_data",
        entityId,
        details ? JSON.stringify(details) : null,
        ip,
        userAgent
      )
      .run();
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
