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
  // اگه operational بود، منطق خاص
  if (section === "operational") {
    return generateOperationalCode(env, { type, parent_id });
  }

  // ✅ بخش کالا و خدمات (goods)
  if (section === "goods") {
    return generateGoodsCode(env, { parent_id, digit_count });
  }

  // برای بقیه بخش‌ها، منطق معمولی
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

    query += " ORDER BY code DESC LIMIT 1";

    lastChild = await env.DB.prepare(query)
      .bind(...params)
      .first();
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

/**
 * کد خودکار برای بخش عملیاتی (operational)
 * قوانین:
 *   - مأموریت (سطح ۰): 001, 002, ...
 *   - برنامه (سطح ۱، زیر مأموریت): والد + 001, 002, ...
 *   - خدمت (سطح ۲، زیر برنامه): والد + 00001, 00002, ... (تا 49999)
 *   - طرح (سطح ۲، زیر برنامه): والد + 50000, 50001, ... (تا 99999)
 *   - فعالیت (سطح ۳، زیر خدمت): والد + 001, 002, ...
 *   - پروژه (سطح ۳، زیر طرح): والد + 001, 002, ...
 */
async function generateOperationalCode(env, { type, parent_id }) {
  // ۱. سطح ۰: مأموریت (بدون والد)
  if (!parent_id) {
    const last = await env.DB.prepare(
      `SELECT code FROM base_data 
             WHERE section = 'operational' AND parent_id IS NULL AND type = 'mission'
             ORDER BY code DESC LIMIT 1`
    ).first();

    const nextNum = last
      ? parseInt(last.code.substring(last.code.length - 3), 10) + 1
      : 1;

    return nextNum.toString().padStart(3, "0");
  }

  // ۲. والد رو بگیر
  const parent = await env.DB.prepare(
    "SELECT code, type FROM base_data WHERE id = ?"
  )
    .bind(parent_id)
    .first();

  if (!parent) {
    throw new Error("والد یافت نشد");
  }

  const parentCode = parent.code;

  // ۳. زیر برنامه: خدمت یا طرح
  if (parent.type === "program") {
    if (type === "service") {
      // خدمت: از 00001
      const last = await env.DB.prepare(
        `SELECT code FROM base_data 
                 WHERE parent_id = ? AND type = 'service'
                 ORDER BY code DESC LIMIT 1`
      )
        .bind(parent_id)
        .first();

      const nextNum = last
        ? parseInt(last.code.substring(parentCode.length), 10) + 1
        : 1;

      return parentCode + nextNum.toString().padStart(5, "0");
    }

    if (type === "plan") {
      // طرح: از 50000
      const last = await env.DB.prepare(
        `SELECT code FROM base_data 
                 WHERE parent_id = ? AND type = 'plan'
                 ORDER BY code DESC LIMIT 1`
      )
        .bind(parent_id)
        .first();

      const nextNum = last
        ? parseInt(last.code.substring(parentCode.length), 10) + 1
        : 50000;

      return parentCode + nextNum.toString().padStart(5, "0");
    }

    throw new Error("زیر برنامه فقط خدمت یا طرح مجاز است");
  }

  // ۴. زیر خدمت: فعالیت
  if (parent.type === "service") {
    if (type !== "activity") {
      throw new Error("زیر خدمت فقط فعالیت مجاز است");
    }

    const last = await env.DB.prepare(
      `SELECT code FROM base_data 
             WHERE parent_id = ? AND type = 'activity'
             ORDER BY code DESC LIMIT 1`
    )
      .bind(parent_id)
      .first();

    const nextNum = last
      ? parseInt(last.code.substring(parentCode.length), 10) + 1
      : 1;

    return parentCode + nextNum.toString().padStart(3, "0");
  }

  // ۵. زیر طرح: پروژه
  if (parent.type === "plan") {
    if (type !== "project") {
      throw new Error("زیر طرح فقط پروژه مجاز است");
    }

    const last = await env.DB.prepare(
      `SELECT code FROM base_data 
             WHERE parent_id = ? AND type = 'project'
             ORDER BY code DESC LIMIT 1`
    )
      .bind(parent_id)
      .first();

    const nextNum = last
      ? parseInt(last.code.substring(parentCode.length), 10) + 1
      : 1;

    return parentCode + nextNum.toString().padStart(3, "0");
  }

  // ۶. زیر مأموریت: برنامه
  if (parent.type === "mission") {
    if (type !== "program") {
      throw new Error("زیر مأموریت فقط برنامه مجاز است");
    }

    const last = await env.DB.prepare(
      `SELECT code FROM base_data 
             WHERE parent_id = ? AND type = 'program'
             ORDER BY code DESC LIMIT 1`
    )
      .bind(parent_id)
      .first();

    const nextNum = last
      ? parseInt(last.code.substring(parentCode.length), 10) + 1
      : 1;

    return parentCode + nextNum.toString().padStart(3, "0");
  }

  throw new Error("نوع والد نامعتبر برای عملیاتی");
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

/**
 * کد خودکار برای بخش کالا و خدمات (goods)
 * قوانین:
 *   - سطح ۱ (گروه اصلی): 1, 2, 3, ... (بدون پیشوند)
 *   - سطح ۲+ (گروه فرعی و پایین‌تر): کد والد + 3 رقم جدید
 */
async function generateGoodsCode(env, { parent_id, digit_count = 3 }) {
  // سطح ۱
  if (!parent_id) {
    const last = await env.DB.prepare(
      `SELECT code FROM base_data 
       WHERE section = 'goods' AND parent_id IS NULL
       ORDER BY CAST(code AS INTEGER) DESC LIMIT 1`
    ).first();
    const nextNum = last ? parseInt(last.code, 10) + 1 : 1;
    return nextNum.toString();
  }

  // سطح ۲+
  const parent = await env.DB.prepare(
    "SELECT code, level FROM base_data WHERE id = ?"
  )
    .bind(parent_id)
    .first();

  if (!parent) throw new Error("والد یافت نشد");

  const parentCode = parent.code;
  const parentLevel = parent.level;

  // تعداد رقم برای سطح جدید = سطح + 1
  // سطح ۱: 1 رقم، سطح ۲: 2 رقم، سطح ۳: 3 رقم
  const childDigitCount = parentLevel + 1;

  const last = await env.DB.prepare(
    `SELECT code FROM base_data 
     WHERE parent_id = ? 
     ORDER BY code DESC LIMIT 1`
  )
    .bind(parent_id)
    .first();

  let nextNum = 1;
  if (last) {
    const suffix = last.code.substring(parentCode.length);
    nextNum = parseInt(suffix, 10) + 1;
  }

  return parentCode + nextNum.toString().padStart(childDigitCount, "0");
}



/**
 * کد خودکار برای اشخاص (persons)
 * ساختار ۱۰ رقمی: [۱ رقم گروه][۳ رقم زیرگروه][۳ رقم دسته][۳ رقم شخص]
 * 
 * مثال:
 *   1000000000  ← کارکنان (گروه اصلی)
 *   1001000000  ← رسمی (زیرگروه)
 *   1001001000  ← دسته (سطح ۳)
 *   1001001001  ← شخص (سطح ۴)
 */
export async function generatePersonCode(env, { person_type, parent_id }) {
  // ============================================
  // سطح ۱: بدون والد (گروه اصلی)
  // ============================================
  if (!parent_id) {
    // بر اساس person_type، prefix رو تعیین کن
    const typePrefix = {
      employee: "1",
      citizen: "2",
      legal: "3",
      foreigner: "4",
    };

    const prefix = typePrefix[person_type];
    if (!prefix) {
      throw new Error("نوع شخص نامعتبر");
    }

    // چک کن اگه گروه اصلی با این prefix وجود داره
    const exists = await env.DB.prepare(
      `SELECT id FROM persons 
       WHERE parent_id IS NULL AND code LIKE ?`
    )
      .bind(prefix + "%")
      .first();

    if (exists) {
      throw new Error(
        "گروه اصلی این نوع شخص از قبل وجود دارد. لطفاً زیرگروه بسازید."
      );
    }

    return prefix + "000000000";
  }

  // ============================================
  // سطح ۲+ (زیرگروه)
  // ============================================
  const parent = await env.DB.prepare(
    "SELECT code, level FROM persons WHERE id = ?"
  )
    .bind(parent_id)
    .first();

  if (!parent) {
    throw new Error("والد یافت نشد");
  }

  const parentCode = parent.code;
  const level = parent.level;

  // آخرین فرزند والد
  const last = await env.DB.prepare(
    `SELECT code FROM persons 
     WHERE parent_id = ? 
     ORDER BY code DESC LIMIT 1`
  )
    .bind(parent_id)
    .first();

  // ============================================
  // سطح ۲: X YYY 000 000
  // ============================================
  if (level === 1) {
    const prefix = parentCode.substring(0, 1); // X
    const lastSuffix = last ? parseInt(last.code.substring(1, 4), 10) : 0;
    const nextNum = lastSuffix + 1;

    if (nextNum > 999) {
      throw new Error("حداکثر ۹۹۹ زیرگروه برای هر گروه اصلی مجاز است");
    }

    return prefix + nextNum.toString().padStart(3, "0") + "000000";
  }

  // ============================================
  // سطح ۳: X YYY ZZZ 000
  // ============================================
  if (level === 2) {
    const prefix = parentCode.substring(0, 4); // X YYY
    const lastSuffix = last ? parseInt(last.code.substring(4, 7), 10) : 0;
    const nextNum = lastSuffix + 1;

    if (nextNum > 999) {
      throw new Error("حداکثر ۹۹۹ دسته برای هر زیرگروه مجاز است");
    }

    return prefix + nextNum.toString().padStart(3, "0") + "000";
  }

  // ============================================
  // سطح ۴: X YYY ZZZ WWW
  // ============================================
  if (level === 3) {
    const prefix = parentCode.substring(0, 7); // X YYY ZZZ
    const lastSuffix = last ? parseInt(last.code.substring(7, 10), 10) : 0;
    const nextNum = lastSuffix + 1;

    if (nextNum > 999) {
      throw new Error("حداکثر ۹۹۹ شخص برای هر دسته مجاز است");
    }

    return prefix + nextNum.toString().padStart(3, "0");
  }

  throw new Error("حداکثر عمق مجاز ۴ سطح است");
}
