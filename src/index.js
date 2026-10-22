import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from "./auth";

import { toShamsi } from "./date.js";
import { generateNextCode, buildTree, logBaseDataAction } from "./base-data.js";
import { generatePersonCode } from "./base-data.js";

import * as XLSX from "xlsx";

// تبدیل اعداد فارسی به انگلیسی
function toEnglishNumbers(str) {
  if (!str) return str;
  return str.toString().replace(/[۰-۹]/g, function (d) {
    return "۰۱۲۳۴۵۶۷۸۹".indexOf(d);
  });
}

// ثبت لاگ
async function logAction(
  env,
  request,
  userData,
  action,
  entityType,
  entityId,
  details,
) {
  try {
    const ip =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      "unknown";
    const userAgent = request.headers.get("User-Agent") || "unknown";

    await env.DB.prepare(
      `
      INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
      .bind(
        userData ? userData.userId : null,
        userData ? userData.username : null,
        action,
        entityType || null,
        entityId || null,
        details ? JSON.stringify(details) : null,
        ip,
        userAgent,
      )
      .run();
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

// Rate Limiting ساده
async function checkRateLimit(
  env,
  ip,
  action,
  maxRequests = 10,
  windowSeconds = 60,
) {
  try {
    const windowStart = new Date(
      Date.now() - windowSeconds * 1000,
    ).toISOString();

    const result = await env.DB.prepare(
      `
      SELECT COUNT(*) as count FROM audit_log
      WHERE ip_address = ? AND action = ? AND created_at > ?
    `,
    )
      .bind(ip, action, windowStart)
      .first();

    return (result.count || 0) < maxRequests;
  } catch {
    return true; // در صورت خطا، اجازه بده
  }
}

// چک Permission
async function checkPermission(env, userId, permissionKey) {
  try {
    // گرفتن نقش کاربر
    const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?")
      .bind(userId)
      .first();

    if (!user) return false;

    // admin همیشه دسترسی داره
    if (user.role === "admin") return true;

    // چک user_permissions (override)
    const userPerm = await env.DB.prepare(
      "SELECT granted FROM user_permissions WHERE user_id = ? AND permission_key = ?",
    )
      .bind(userId, permissionKey)
      .first();

    if (userPerm) {
      return userPerm.granted === 1;
    }

    // چک role_permissions
    const rolePerm = await env.DB.prepare(
      "SELECT granted FROM role_permissions WHERE role = ? AND permission_key = ?",
    )
      .bind(user.role, permissionKey)
      .first();

    if (rolePerm) {
      return rolePerm.granted === 1;
    }

    return false;
  } catch (error) {
    console.error("checkPermission error:", error);
    return false;
  }
}

// ============================================
// تعیین نقش کاربر بر اساس پست سازمانی
// ============================================
function getRoleFromPosition(position) {
  if (!position) return "viewer";

  const pos = position.trim();

  // نقش‌های manager
  const managerKeywords = ["شهردار", "معاون", "مدیر", "رئیس", "سرپرست"];
  for (const kw of managerKeywords) {
    if (pos.includes(kw)) return "manager";
  }

  // نقش‌های expert
  const expertKeywords = ["کارشناس", "مسئول", "کارشناس ارشد", "مشاور"];
  for (const kw of expertKeywords) {
    if (pos.includes(kw)) return "expert";
  }

  // سایر → viewer
  return "viewer";
}

// ============================================
// تولید پسورد تصادفی
// ============================================
function generateRandomPassword(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json; charset=utf-8",
    };

    // هدایت خودکار مسیر ریشه به صفحه لاگین
    if (url.pathname === "/" || url.pathname === "") {
      return Response.redirect(url.origin + "/login", 302);
    }

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    try {
      // ============================================
      // POST: درخواست کد لاگین (OTP)
      // ============================================
      if (
        url.pathname === "/api/login/request-otp" &&
        request.method === "POST"
      ) {
        try {
          const body = await request.json();
          const nationalId = body.national_id;

          if (!nationalId) {
            return new Response(
              JSON.stringify({ error: "کد ملی الزامی است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          // چک کاربر
          const user = await env.DB.prepare(
            `SELECT u.id, u.username, u.full_name, u.role, u.organization, 
                    u.is_active, u.mobile,
                    p.mobile as person_mobile
             FROM users u
             LEFT JOIN persons p ON p.user_id = u.id
             WHERE u.username = ?`,
          )
            .bind(nationalId)
            .first();

          if (!user) {
            return new Response(
              JSON.stringify({
                error:
                  "کاربری با این کد ملی یافت نشد. لطفاً با مدیر سیستم تماس بگیرید.",
              }),
              {
                status: 404,
                headers,
              },
            );
          }

          if (!user.is_active) {
            return new Response(
              JSON.stringify({ error: "حساب کاربری غیرفعال است" }),
              {
                status: 403,
                headers,
              },
            );
          }

          // شماره موبایل
          const mobile = user.mobile || user.person_mobile;

          if (!mobile) {
            return new Response(
              JSON.stringify({
                error:
                  "شماره موبایل شما ثبت نشده است. لطفاً با مدیر سیستم تماس بگیرید.",
              }),
              {
                status: 400,
                headers,
              },
            );
          }

          // تولید کد ۶ رقمی
          const otpCode = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();

          // تاریخ انقضا: ۵ دقیقه بعد
          const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

          const nowShamsi = toShamsi(new Date());

          // حذف OTP های قبلی pending
          await env.DB.prepare(
            "UPDATE login_otp SET status = 'expired' WHERE user_id = ? AND status = 'pending'",
          )
            .bind(user.id)
            .run();

          // ثبت OTP جدید
          const result = await env.DB.prepare(
            `INSERT INTO login_otp 
             (user_id, username, mobile, otp_code, otp_expires_at, ip_address, status, created_at_shamsi)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
          )
            .bind(
              user.id,
              user.username,
              mobile,
              otpCode,
              expiresAt,
              request.headers.get("CF-Connecting-IP") || null,
              nowShamsi,
            )
            .run();

          // ============================================
          // Mock SMS
          // ============================================
          console.log(`📱 [MOCK SMS] کد لاگین به ${mobile}:`);
          console.log(`   کد: ${otpCode}`);

          return new Response(
            JSON.stringify({
              success: true,
              otp_id: result.meta.last_row_id,
              mobile_masked:
                mobile.substring(0, 4) +
                "***" +
                mobile.substring(mobile.length - 3),
              message: "کد تایید به موبایل شما ارسال شد",
              // ⚠️ فقط در حالت mock
              mock_otp: otpCode,
              full_name: user.full_name,
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("Request OTP error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // POST: تأیید OTP و ورود
      // ============================================
      if (
        url.pathname === "/api/login/verify-otp" &&
        request.method === "POST"
      ) {
        try {
          const body = await request.json();
          const { otp_id, otp_code } = body;

          if (!otp_id || !otp_code) {
            return new Response(
              JSON.stringify({ error: "کد و شناسه الزامی است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const otp = await env.DB.prepare(
            `SELECT * FROM login_otp WHERE id = ?`,
          )
            .bind(otp_id)
            .first();

          if (!otp) {
            return new Response(JSON.stringify({ error: "کد نامعتبر" }), {
              status: 404,
              headers,
            });
          }

          if (otp.status !== "pending") {
            return new Response(
              JSON.stringify({ error: "این کد قبلاً استفاده یا منقضی شده" }),
              {
                status: 400,
                headers,
              },
            );
          }

          // چک انقضا
          if (new Date(otp.otp_expires_at) < new Date()) {
            await env.DB.prepare(
              "UPDATE login_otp SET status = 'expired' WHERE id = ?",
            )
              .bind(otp_id)
              .run();

            return new Response(
              JSON.stringify({ error: "کد منقضی شده است. دوباره تلاش کنید" }),
              {
                status: 400,
                headers,
              },
            );
          }

          // چک تعداد تلاش
          if (otp.attempts >= 5) {
            await env.DB.prepare(
              "UPDATE login_otp SET status = 'failed' WHERE id = ?",
            )
              .bind(otp_id)
              .run();

            return new Response(
              JSON.stringify({ error: "تعداد تلاش بیش از حد مجاز" }),
              {
                status: 400,
                headers,
              },
            );
          }

          // چک کد
          if (otp.otp_code !== otp_code) {
            await env.DB.prepare(
              "UPDATE login_otp SET attempts = attempts + 1 WHERE id = ?",
            )
              .bind(otp_id)
              .run();

            return new Response(JSON.stringify({ error: "کد اشتباه است" }), {
              status: 400,
              headers,
            });
          }

          // موفق → getUser
          const user = await env.DB.prepare(
            "SELECT * FROM users WHERE id = ? AND is_active = 1",
          )
            .bind(otp.user_id)
            .first();

          if (!user) {
            return new Response(
              JSON.stringify({ error: "کاربر یافت نشد یا غیرفعال است" }),
              {
                status: 404,
                headers,
              },
            );
          }

          // آپدیت OTP
          await env.DB.prepare(
            "UPDATE login_otp SET status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE id = ?",
          )
            .bind(otp_id)
            .run();

          // توکن
          const token = await generateToken(
            user.id,
            user.username,
            user.role,
            env.JWT_SECRET,
          );

          // لاگ
          ctx.waitUntil(
            logAction(
              env,
              request,
              { userId: user.id, username: user.username },
              "login",
              "user",
              user.id,
              { method: "otp" },
            ),
          );

          return new Response(
            JSON.stringify({
              token,
              user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
                organization: user.organization,
              },
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("Verify OTP error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ========== ورود ==========

      if (url.pathname === "/api/login" && request.method === "POST") {
        // بررسی Rate Limit
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const allowed = await checkRateLimit(env, ip, "login_attempt", 10, 60);

        if (!allowed) {
          return new Response(
            JSON.stringify({
              error:
                "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً یک دقیقه صبر کنید.",
            }),
            { status: 429, headers },
          );
        }

        const { username, password } = await request.json();

        const user = await env.DB.prepare(
          "SELECT * FROM users WHERE username = ? AND is_active = 1",
        )
          .bind(username)
          .first();

        if (!user || !(await verifyPassword(password, user.password_hash))) {
          // ثبت لاگ ورود ناموفق
          ctx.waitUntil(
            logAction(env, request, null, "login_failed", "user", null, {
              username: username,
              reason: !user ? "user_not_found" : "wrong_password",
            }),
          );

          return new Response(
            JSON.stringify({
              error: "نام کاربری یا رمز عبور اشتباه است",
            }),
            { status: 401, headers },
          );
        }

        const token = await generateToken(
          user.id,
          user.username,
          user.role,
          env.JWT_SECRET,
        );

        // ثبت لاگ ورود موفق
        ctx.waitUntil(
          logAction(
            env,
            request,
            { userId: user.id, username: user.username },
            "login",
            "user",
            user.id,
            { success: true },
          ),
        );

        return new Response(
          JSON.stringify({
            token,
            user: {
              id: user.id,
              username: user.username,
              full_name: user.full_name,
              role: user.role,
              organization: user.organization,
            },
          }),
          { status: 200, headers },
        );
      }

      // ========== تست ==========
      if (url.pathname === "/api/hello") {
        return new Response(
          JSON.stringify({
            message: "سلام! سامانه بودجه شهرداری آماده است",
          }),
          { status: 200, headers },
        );
      }

      if (url.pathname === "/api/test-db") {
        const result = await env.DB.prepare("SELECT 1 as test").first();
        return new Response(
          JSON.stringify({
            message: "دیتابیس کار میکنه",
            result: result,
          }),
          { status: 200, headers },
        );
      }

      // ========== مدیریت سال مالی ==========

      // دریافت لیست سال‌های مالی
      if (url.pathname === "/api/fiscal-years" && request.method === "GET") {
        const years = await env.DB.prepare(
          "SELECT * FROM fiscal_years ORDER BY year DESC",
        ).all();

        return new Response(JSON.stringify(years.results), {
          status: 200,
          headers,
        });
      }

      // ساخت سال مالی جدید
      if (url.pathname === "/api/fiscal-years" && request.method === "POST") {
        const body = await request.json();
        const year = parseInt(toEnglishNumbers(body.year.toString()));
        const start_date = toEnglishNumbers(body.start_date);
        const end_date = toEnglishNumbers(body.end_date);

        // اعتبارسنجی
        if (!year || !start_date || !end_date) {
          return new Response(
            JSON.stringify({ error: "همه فیلدها الزامی است" }),
            {
              status: 400,
              headers,
            },
          );
        }

        try {
          const result = await env.DB.prepare(
            "INSERT INTO fiscal_years (year, start_date, end_date) VALUES (?, ?, ?)",
          )
            .bind(year, start_date, end_date)
            .run();

          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
            }),
            { status: 201, headers },
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "این سال قبلاً ثبت شده" }),
            {
              status: 400,
              headers,
            },
          );
        }
      }

      // فعال کردن سال مالی
      if (
        url.pathname === "/api/fiscal-years/activate" &&
        request.method === "PUT"
      ) {
        const body = await request.json();
        const year = parseInt(toEnglishNumbers(body.year.toString()));

        console.log("Activating year:", year);

        await env.DB.prepare("UPDATE fiscal_years SET is_active = 0").run();

        await env.DB.prepare(
          "UPDATE fiscal_years SET is_active = 1, status = ? WHERE year = ?",
        )
          .bind("active", year)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // حذف سال مالی
      if (
        url.pathname.startsWith("/api/fiscal-years/") &&
        request.method === "DELETE"
      ) {
        const rawYear = decodeURIComponent(url.pathname.split("/").pop());
        const year = parseInt(toEnglishNumbers(rawYear));

        await env.DB.prepare("DELETE FROM fiscal_years WHERE year = ?")
          .bind(year)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // ویرایش سال مالی
      if (
        url.pathname.startsWith("/api/fiscal-years/edit/") &&
        request.method === "PUT"
      ) {
        try {
          const rawYear = decodeURIComponent(url.pathname.split("/").pop());
          const year = parseInt(toEnglishNumbers(rawYear));
          const { start_date, end_date } = await request.json();

          console.log("=== EDIT YEAR ===");
          console.log("Year:", year, "Start:", start_date, "End:", end_date);

          if (!start_date || !end_date) {
            return new Response(
              JSON.stringify({ error: "تاریخ‌ها الزامی است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const result = await env.DB.prepare(
            "UPDATE fiscal_years SET start_date = ?, end_date = ? WHERE year = ?",
          )
            .bind(start_date, end_date, year)
            .run();

          console.log("Update result:", JSON.stringify(result));

          return new Response(
            JSON.stringify({
              success: true,
              changes: result.meta.changes,
            }),
            { status: 200, headers },
          );
        } catch (error) {
          console.error("Edit year error:", error.message);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ========== اشخاص (Persons) ==========

      // GET: لیست اشخاص
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
        if (isActive !== null && isActive !== undefined && isActive !== "") {
          query += " AND is_active = ?";
          params.push(isActive === "1" || isActive === "true" ? 1 : 0);
        }

               query += " ORDER BY sort_order, code";

        const items = await env.DB.prepare(query)
          .bind(...params)
          .all();

        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers,
        });
      }

      // GET: درخت اشخاص
      if (url.pathname === "/api/persons/tree" && request.method === "GET") {
        const personType = url.searchParams.get("person_type");

        let query = "SELECT * FROM persons WHERE is_active = 1";
        const params = [];

        if (personType) {
          query += " AND person_type = ?";
          params.push(personType);
        }

                query += " ORDER BY sort_order, code";

        const items = await env.DB.prepare(query)
          .bind(...params)
          .all();
        const tree = buildTree(items.results);

        return new Response(JSON.stringify(tree), {
          status: 200,
          headers,
        });
      }

      // GET: کد بعدی
      if (
        url.pathname === "/api/persons/next-code" &&
        request.method === "GET"
      ) {
        try {
          const personType = url.searchParams.get("person_type");
          const parentId = url.searchParams.get("parent_id");

          const nextCode = await generatePersonCode(env, {
            person_type: personType,
            parent_id: parentId ? parseInt(parentId) : null,
          });

          return new Response(JSON.stringify({ next_code: nextCode }), {
            status: 200,
            headers,
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers,
          });
        }
      }

      // POST: افزودن شخص
      if (url.pathname === "/api/persons" && request.method === "POST") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            const newPersonId = result.meta.last_row_id;

            // ============================================
            // ساخت خودکار کاربر (فقط برای سطح ۴ - اشخاص واقعی)
            // ============================================
            if (level === 4 && national_id) {
              try {
                // چک: کاربر قبلاً هست؟
                const existingUser = await env.DB.prepare(
                  "SELECT id FROM users WHERE username = ?",
                )
                  .bind(national_id)
                  .first();

                if (!existingUser) {
                  // پیش‌فرض viewer
                  const role = person_type === "employee" ? "viewer" : "viewer";

                  const userResult = await env.DB.prepare(
                    `INSERT INTO users 
                   (username, password_hash, full_name, role, organization, is_active, mobile)
                   VALUES (?, ?, ?, ?, ?, 1, ?)`,
                  )
                    .bind(
                      national_id,
                      "OTP_ONLY", // پسورد نداره، فقط OTP
                      full_name,
                      role,
                      null,
                      mobile || null,
                    )
                    .run();

                  const userId = userResult.meta.last_row_id;

                  // آپدیت person.user_id
                  await env.DB.prepare(
                    "UPDATE persons SET user_id = ? WHERE id = ?",
                  )
                    .bind(userId, newPersonId)
                    .run();

                  console.log(
                    `✅ کاربر خودکار ساخته شد: ${national_id} (${role})`,
                  );
                }
              } catch (userError) {
                console.error("Auto-create user error:", userError);
                // ادامه بده، خطای کاربر نباید مانع ساخت شخص بشه
              }
            }

            return new Response(
              JSON.stringify({
                success: true,
                id: newPersonId,
                code: code,
              }),
              { status: 201, headers },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
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
            extra_data,
          } = body;

          if (!person_type || !full_name) {
            return new Response(
              JSON.stringify({ error: "نوع شخص و نام کامل الزامی است" }),
              { status: 400, headers },
            );
          }

          // ⚠️ برای اشخاص واقعی (سطح ۴)، کد ملی و موبایل اجباری
          // (سطح ۴ = شخص نهایی، نه گروه)
          // این چک در انتهای API بعد از محاسبه level انجام می‌شه

          const validTypes = ["employee", "citizen", "legal", "foreigner"];
          if (!validTypes.includes(person_type)) {
            return new Response(JSON.stringify({ error: "نوع شخص نامعتبر" }), {
              status: 400,
              headers,
            });
          }

          const code = await generatePersonCode(env, {
            person_type,
            parent_id: parent_id || null,
          });

          let level = 1;
          if (parent_id) {
            const parent = await env.DB.prepare(
              "SELECT level FROM persons WHERE id = ?",
            )
              .bind(parent_id)
              .first();
            if (parent) level = parent.level + 1;
          }

          // چک اجباری بودن کد ملی و موبایل برای سطح ۴
          if (level === 4) {
            if (!national_id) {
              return new Response(
                JSON.stringify({ error: "کد ملی برای اشخاص الزامی است" }),
                { status: 400, headers },
              );
            }
            if (!mobile) {
              return new Response(
                JSON.stringify({ error: "شماره موبایل برای اشخاص الزامی است" }),
                { status: 400, headers },
              );
            }
          }

          const nowShamsi = toShamsi(new Date());

          const result = await env.DB.prepare(
            `INSERT INTO persons 
            (person_type, code, parent_id, level, level_name, full_name, 
             first_name, last_name, national_id, economic_code, registration_number, 
             father_name, mother_name, id_number, birth_date_shamsi, birth_place, gender, nationality,
             phone, mobile, address, postal_code, email,
             bank_name, bank_account, iban,
             notes, extra_data, created_at_shamsi, updated_at_shamsi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
            .bind(
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
              nationality || "ایرانی",
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
              nowShamsi,
            )
            .run();

          const newPersonId = result.meta.last_row_id;

          // ساخت خودکار کاربر (فقط اشخاص واقعی سطح ۴)
          if (level === 4 && national_id) {
            try {
              const existingUser = await env.DB.prepare(
                "SELECT id FROM users WHERE username = ?",
              )
                .bind(national_id)
                .first();

              let userId;
              if (existingUser) {
                userId = existingUser.id;
              } else {
                const userResult = await env.DB.prepare(
                  `INSERT INTO users 
                   (username, password_hash, full_name, role, organization, is_active, mobile)
                   VALUES (?, 'OTP_ONLY', ?, 'viewer', NULL, 1, ?)`,
                )
                  .bind(national_id, full_name, mobile || null)
                  .run();

                userId = userResult.meta.last_row_id;
              }

              await env.DB.prepare(
                "UPDATE persons SET user_id = ? WHERE id = ?",
              )
                .bind(userId, newPersonId)
                .run();
            } catch (userError) {
              console.error("Auto-create user error:", userError);
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              id: newPersonId,
              code: code,
            }),
            { status: 201, headers },
          );
        } catch (error) {
          console.error("Person POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // PUT: ویرایش شخص
      if (
        url.pathname.match(/^\/api\/persons\/\d+$/) &&
        request.method === "PUT"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
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
            level_name,
          } = body;

          if (!full_name) {
            return new Response(
              JSON.stringify({ error: "نام کامل الزامی است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const nowShamsi = toShamsi(new Date());

          const result = await env.DB.prepare(
            `UPDATE persons SET
              full_name = ?, first_name = ?, last_name = ?, national_id = ?, economic_code = ?, registration_number = ?,
              father_name = ?, mother_name = ?, id_number = ?, birth_date_shamsi = ?, birth_place = ?, gender = ?, nationality = ?,
              phone = ?, mobile = ?, address = ?, postal_code = ?, email = ?,
              bank_name = ?, bank_account = ?, iban = ?,
              notes = ?, extra_data = ?, is_active = ?, level_name = ?,
              updated_at = CURRENT_TIMESTAMP, updated_at_shamsi = ?
            WHERE id = ?`,
          )
            .bind(
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
              nationality || "ایرانی",
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
              is_active !== undefined ? (is_active ? 1 : 0) : 1,
              level_name || null,
              nowShamsi,
              id,
            )
            .run();

          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "شخص یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // DELETE: حذف شخص
      if (
        url.pathname.match(/^\/api\/persons\/\d+$/) &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const id = url.pathname.split("/").pop();

          // چک فرزندان
          const children = await env.DB.prepare(
            "SELECT COUNT(*) as count FROM persons WHERE parent_id = ?",
          )
            .bind(id)
            .first();

          if (children.count > 0) {
            return new Response(
              JSON.stringify({
                error: `این شخص ${children.count} زیرمجموعه دارد. ابتدا آن‌ها را حذف کنید.`,
              }),
              { status: 400, headers },
            );
          }

          const result = await env.DB.prepare(
            "DELETE FROM persons WHERE id = ?",
          )
            .bind(id)
            .run();

          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "شخص یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ========== طبقه‌بندی اقتصادی ==========

      // دریافت لیست طبقه‌بندی‌ها (از base_data)
      if (
        url.pathname === "/api/economic-classifications" &&
        request.method === "GET"
      ) {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");
        const type = url.searchParams.get("type");

        let query =
          "SELECT * FROM base_data WHERE section = 'economic' AND is_active = 1";
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

        const items = await env.DB.prepare(query)
          .bind(...params)
          .all();

        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers,
        });
      }

      // ساخت طبقه‌بندی جدید
      if (
        url.pathname === "/api/economic-classifications" &&
        request.method === "POST"
      ) {
        const {
          fiscal_year_id,
          type,
          category,
          main_code,
          chapter_code,
          sub_code,
          title,
          parent_id,
        } = await request.json();

        // اعتبارسنجی
        if (
          !fiscal_year_id ||
          !type ||
          !category ||
          !main_code ||
          !chapter_code ||
          !sub_code ||
          !title
        ) {
          return new Response(
            JSON.stringify({ error: "همه فیلدها الزامی است" }),
            {
              status: 400,
              headers,
            },
          );
        }

        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO economic_classifications 
            (fiscal_year_id, type, category, main_code, chapter_code, sub_code, title, parent_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          )
            .bind(
              fiscal_year_id,
              type,
              category,
              main_code,
              chapter_code,
              sub_code,
              title,
              parent_id || null,
            )
            .run();

          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
            }),
            { status: 201, headers },
          );
        } catch (error) {
          return new Response(JSON.stringify({ error: "خطا در ثبت" }), {
            status: 400,
            headers,
          });
        }
      }

      // حذف طبقه‌بندی
      if (
        url.pathname.startsWith("/api/economic-classifications/") &&
        request.method === "DELETE"
      ) {
        const id = url.pathname.split("/").pop();

        await env.DB.prepare(
          "DELETE FROM economic_classifications WHERE id = ?",
        )
          .bind(id)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // ========== ساختار سازمانی ==========

      // دریافت لیست سازمان‌ها (از base_data)
      if (url.pathname === "/api/organizations" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");

        let query =
          "SELECT * FROM base_data WHERE section = 'organization' AND is_active = 1";
        const params = [];

        if (fiscalYearId) {
          query += " AND (fiscal_year_id = ? OR fiscal_year_id IS NULL)";
          params.push(fiscalYearId);
        }

        query += " ORDER BY code";

        const items = await env.DB.prepare(query)
          .bind(...params)
          .all();

        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers,
        });
      }

      // ساخت سازمان جدید
      if (url.pathname === "/api/organizations" && request.method === "POST") {
        const {
          fiscal_year_id,
          name,
          type,
          manager_name,
          finance_manager_name,
          parent_id,
          is_cost_center,
        } = await request.json();

        if (!fiscal_year_id || !name || !type) {
          return new Response(
            JSON.stringify({ error: "همه فیلدهای الزامی را پر کنید" }),
            {
              status: 400,
              headers,
            },
          );
        }

        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO organizations 
            (fiscal_year_id, name, type, manager_name, finance_manager_name, parent_id, is_cost_center)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          )
            .bind(
              fiscal_year_id,
              name,
              type,
              manager_name || null,
              finance_manager_name || null,
              parent_id || null,
              is_cost_center ? 1 : 0,
            )
            .run();

          const newPoId = result.meta.last_row_id;

          // ============================================
          // آپدیت نقش کاربر (اگه سازمان اصلی بود)
          // ============================================
          if (is_primary && role) {
            try {
              const person = await env.DB.prepare(
                "SELECT user_id FROM persons WHERE id = ?",
              )
                .bind(personId)
                .first();

              if (person && person.user_id) {
                const newRole = getRoleFromPosition(role);

                await env.DB.prepare(
                  "UPDATE users SET role = ?, organization = ? WHERE id = ?",
                )
                  .bind(newRole, role, person.user_id)
                  .run();

                console.log(`✅ نقش کاربر آپدیت شد: ${newRole} (پست: ${role})`);
              }
            } catch (roleError) {
              console.error("Update role error:", roleError);
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              id: newPoId,
            }),
            {
              status: 201,
              headers,
            },
          );
        } catch (error) {
          return new Response(JSON.stringify({ error: "خطا در ثبت" }), {
            status: 400,
            headers,
          });
        }
      }

      // حذف سازمان
      if (
        url.pathname.startsWith("/api/organizations/") &&
        request.method === "DELETE"
      ) {
        const id = url.pathname.split("/").pop();

        await env.DB.prepare("DELETE FROM organizations WHERE id = ?")
          .bind(id)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // ========== بودجه پیشنهادی ==========

      // دریافت لیست بودجه‌ها
      if (
        url.pathname === "/api/budget-proposals" &&
        request.method === "GET"
      ) {
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

        const items = await env.DB.prepare(query)
          .bind(...params)
          .all();

        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers,
        });
      }

      // ثبت بودجه جدید
      if (
        url.pathname === "/api/budget-proposals" &&
        request.method === "POST"
      ) {
        const {
          fiscal_year_id,
          organization_id,
          economic_class_id,
          title,
          amount,
          description,
        } = await request.json();

        if (
          !fiscal_year_id ||
          !organization_id ||
          !economic_class_id ||
          !title ||
          !amount
        ) {
          return new Response(
            JSON.stringify({ error: "همه فیلدهای الزامی را پر کنید" }),
            {
              status: 400,
              headers,
            },
          );
        }

        // گرفتن userId از توکن
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData) {
          return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
            status: 401,
            headers,
          });
        }

        // اعتبارسنجی: organization_id و economic_class_id باید توی base_data باشن
        const org = await env.DB.prepare(
          "SELECT id FROM base_data WHERE id = ? AND section = 'organization'",
        )
          .bind(organization_id)
          .first();

        if (!org) {
          return new Response(
            JSON.stringify({ error: "سازمان انتخاب شده معتبر نیست" }),
            { status: 400, headers },
          );
        }

        const econ = await env.DB.prepare(
          "SELECT id FROM base_data WHERE id = ? AND section = 'economic'",
        )
          .bind(economic_class_id)
          .first();

        if (!econ) {
          return new Response(
            JSON.stringify({
              error: "طبقه‌بندی اقتصادی انتخاب شده معتبر نیست",
            }),
            { status: 400, headers },
          );
        }

        try {
          const nowShamsi = toShamsi(new Date());

          const result = await env.DB.prepare(
            `
                  INSERT INTO budget_proposals 
                  (fiscal_year_id, organization_id, economic_class_id, title, amount, description, proposed_by, created_at_shamsi)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
          )
            .bind(
              fiscal_year_id,
              organization_id,
              economic_class_id,
              title,
              amount,
              description || null,
              userData.userId,
              nowShamsi,
            )
            .run();

          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
            }),
            { status: 201, headers },
          );
        } catch (error) {
          console.error("Budget proposal POST error:", error);
          return new Response(
            JSON.stringify({ error: "خطا در ثبت: " + error.message }),
            { status: 400, headers },
          );
        }
      }

      // حذف بودجه
      if (
        url.pathname.startsWith("/api/budget-proposals/") &&
        request.method === "DELETE"
      ) {
        const id = url.pathname.split("/").pop();

        await env.DB.prepare("DELETE FROM budget_proposals WHERE id = ?")
          .bind(id)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // ========== تایید و تصویب بودجه ==========

      // تغییر وضعیت بودجه
      if (
        url.pathname === "/api/budget-proposals/change-status" &&
        request.method === "PUT"
      ) {
        const { id, new_status, comment } = await request.json();

        if (!id || !new_status) {
          return new Response(JSON.stringify({ error: "اطلاعات ناقص" }), {
            status: 400,
            headers,
          });
        }

        // گرفتن userId از توکن
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData) {
          return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
            status: 401,
            headers,
          });
        }

        // دریافت وضعیت فعلی
        const current = await env.DB.prepare(
          "SELECT status FROM budget_proposals WHERE id = ?",
        )
          .bind(id)
          .first();

        if (!current) {
          return new Response(JSON.stringify({ error: "بودجه یافت نشد" }), {
            status: 404,
            headers,
          });
        }

        // جلوگیری از تغییر وضعیت تکراری
        if (current.status === new_status) {
          return new Response(
            JSON.stringify({
              error: "این بودجه در حال حاضر در این وضعیت است",
            }),
            { status: 400, headers },
          );
        }

        // جلوگیری از تغییر وضعیت تکراری
        if (current.status === new_status) {
          return new Response(
            JSON.stringify({
              error: "این بودجه در حال حاضر در این وضعیت است",
            }),
            { status: 400, headers },
          );
        }

        // بررسی دسترسی بر اساس وضعیت جدید
        const statusPermissions = {
          submitted: ["expert", "manager", "admin"],
          manager_approved: ["manager", "admin"],
          finance_approved: ["manager", "admin"],
          approved: ["admin"],
          rejected: ["manager", "admin"],
          draft: ["admin"],
        };

        // ادمین همیشه دسترسی داره
        if (userData.role !== "admin") {
          const allowedRoles = statusPermissions[new_status] || [];
          if (!allowedRoles.includes(userData.role)) {
            return new Response(
              JSON.stringify({
                error: "شما دسترسی این تغییر وضعیت را ندارید",
              }),
              { status: 403, headers },
            );
          }
        }

        // ثبت در تاریخچه
        try {
          await env.DB.prepare(
            `
            INSERT INTO approval_history 
            (budget_proposal_id, from_status, to_status, action_by, comment)
            VALUES (?, ?, ?, ?, ?)
          `,
          )
            .bind(
              id,
              current.status,
              new_status,
              userData.userId,
              comment || null,
            )
            .run();
        } catch (historyError) {
          return new Response(
            JSON.stringify({
              error: "خطا در ثبت تاریخچه: " + historyError.message,
              details: {
                id: id,
                from_status: current.status,
                to_status: new_status,
                action_by: userData.userId,
              },
            }),
            { status: 500, headers },
          );
        }

        // آپدیت وضعیت
        await env.DB.prepare(
          "UPDATE budget_proposals SET status = ? WHERE id = ?",
        )
          .bind(new_status, id)
          .run();

        // ثبت لاگ
        ctx.waitUntil(
          logAction(
            env,
            request,
            userData,
            "budget_status_changed",
            "budget_proposal",
            id,
            { from: current.status, to: new_status, comment: comment },
          ),
        );

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // دریافت تاریخچه تایید یک بودجه
      if (
        url.pathname.startsWith("/api/approval-history/") &&
        request.method === "GET"
      ) {
        const budgetId = url.pathname.split("/").pop();

        const history = await env.DB.prepare(
          `
          SELECT ah.*, u.full_name as action_by_name
          FROM approval_history ah
          LEFT JOIN users u ON ah.action_by = u.id
          WHERE ah.budget_proposal_id = ?
          ORDER BY ah.action_at DESC
        `,
        )
          .bind(budgetId)
          .all();

        return new Response(JSON.stringify(history.results), {
          status: 200,
          headers,
        });
      }

      // ========== گزارشات ==========

      // گزارش خلاصه بودجه
      if (url.pathname === "/api/reports/summary" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");

        if (!fiscalYearId) {
          return new Response(
            JSON.stringify({ error: "سال مالی الزامی است" }),
            {
              status: 400,
              headers,
            },
          );
        }

        // جمع کل بر اساس وضعیت
        const byStatus = await env.DB.prepare(
          `
          SELECT status, COUNT(*) as count, SUM(amount) as total
          FROM budget_proposals
          WHERE fiscal_year_id = ?
          GROUP BY status
        `,
        )
          .bind(fiscalYearId)
          .all();

        // جمع کل بر اساس سازمان
        const byOrganization = await env.DB.prepare(
          `
          SELECT o.name as organization_name, COUNT(*) as count, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN organizations o ON bp.organization_id = o.id
          WHERE bp.fiscal_year_id = ?
          GROUP BY bp.organization_id
          ORDER BY total DESC
        `,
        )
          .bind(fiscalYearId)
          .all();

        // جمع کل بر اساس نوع (منابع/مصارف)
        const byType = await env.DB.prepare(
          `
          SELECT ec.type, COUNT(*) as count, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ?
          GROUP BY ec.type
        `,
        )
          .bind(fiscalYearId)
          .all();

        // جمع کل
        const total = await env.DB.prepare(
          `
          SELECT SUM(amount) as total_amount, COUNT(*) as total_count
          FROM budget_proposals
          WHERE fiscal_year_id = ?
        `,
        )
          .bind(fiscalYearId)
          .first();

        return new Response(
          JSON.stringify({
            total: total,
            byStatus: byStatus.results,
            byOrganization: byOrganization.results,
            byType: byType.results,
          }),
          { status: 200, headers },
        );
      }

      // گزارش تفصیلی
      if (
        url.pathname === "/api/reports/detailed" &&
        request.method === "GET"
      ) {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");

        if (!fiscalYearId) {
          return new Response(
            JSON.stringify({ error: "سال مالی الزامی است" }),
            {
              status: 400,
              headers,
            },
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
        `,
        )
          .bind(fiscalYearId)
          .all();

        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers,
        });
      }

      // ========== تخصیص اعتبار ==========

      // دریافت لیست تخصیص‌ها
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

        const items = await env.DB.prepare(query)
          .bind(...params)
          .all();

        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers,
        });
      }

      // ثبت تخصیص جدید
      if (url.pathname === "/api/allocations" && request.method === "POST") {
        const {
          approved_budget_id,
          organization_id,
          amount,
          percentage,
          allocation_date,
        } = await request.json();

        if (!approved_budget_id || !organization_id || !amount) {
          return new Response(
            JSON.stringify({ error: "همه فیلدهای الزامی را پر کنید" }),
            {
              status: 400,
              headers,
            },
          );
        }

        // بررسی سقف بودجه
        const budget = await env.DB.prepare(
          "SELECT amount FROM budget_proposals WHERE id = ?",
        )
          .bind(approved_budget_id)
          .first();

        if (!budget) {
          return new Response(JSON.stringify({ error: "بودجه یافت نشد" }), {
            status: 404,
            headers,
          });
        }

        // جمع تخصیص‌های قبلی
        const previousAllocations = await env.DB.prepare(
          "SELECT SUM(amount) as total FROM budget_allocations WHERE approved_budget_id = ?",
        )
          .bind(approved_budget_id)
          .first();

        const totalAllocated =
          (previousAllocations.total || 0) + parseFloat(amount);

        if (totalAllocated > budget.amount) {
          return new Response(
            JSON.stringify({
              error: `مجموع تخصیص (${totalAllocated}) از سقف بودجه (${budget.amount}) بیشتر است`,
            }),
            { status: 400, headers },
          );
        }

        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO budget_allocations 
            (approved_budget_id, organization_id, amount, percentage, allocation_date)
            VALUES (?, ?, ?, ?, ?)
          `,
          )
            .bind(
              approved_budget_id,
              organization_id,
              amount,
              percentage || null,
              allocation_date || null,
            )
            .run();

          // ثبت لاگ
          ctx.waitUntil(
            logAction(
              env,
              request,
              null,
              "allocation_created",
              "budget_allocation",
              result.meta.last_row_id,
              { amount: amount, organization_id: organization_id },
            ),
          );

          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
            }),
            { status: 201, headers },
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "خطا در ثبت: " + error.message }),
            {
              status: 400,
              headers,
            },
          );
        }
      }

      // حذف تخصیص
      if (
        url.pathname.startsWith("/api/allocations/") &&
        request.method === "DELETE"
      ) {
        const id = url.pathname.split("/").pop();

        await env.DB.prepare("DELETE FROM budget_allocations WHERE id = ?")
          .bind(id)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // ========== تامین اعتبار (اجرای بودجه) ==========

      // دریافت لیست اجراها
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

        const items = await env.DB.prepare(query)
          .bind(...params)
          .all();

        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers,
        });
      }

      // ثبت تامین اعتبار جدید
      if (url.pathname === "/api/executions" && request.method === "POST") {
        const {
          allocation_id,
          technical_code,
          amount,
          description,
          execution_date,
          accounting_doc_no,
        } = await request.json();

        if (!allocation_id || !technical_code || !amount) {
          return new Response(
            JSON.stringify({ error: "همه فیلدهای الزامی را پر کنید" }),
            {
              status: 400,
              headers,
            },
          );
        }

        // بررسی سقف تخصیص
        const allocation = await env.DB.prepare(
          "SELECT amount FROM budget_allocations WHERE id = ?",
        )
          .bind(allocation_id)
          .first();

        if (!allocation) {
          return new Response(JSON.stringify({ error: "تخصیص یافت نشد" }), {
            status: 404,
            headers,
          });
        }

        // جمع اجراهای قبلی
        const previousExecutions = await env.DB.prepare(
          "SELECT SUM(amount) as total FROM budget_executions WHERE allocation_id = ?",
        )
          .bind(allocation_id)
          .first();

        const totalExecuted =
          (previousExecutions.total || 0) + parseFloat(amount);

        if (totalExecuted > allocation.amount) {
          const remaining = allocation.amount - (previousExecutions.total || 0);
          return new Response(
            JSON.stringify({
              error: `مبلغ درخواستی از مانده تخصیص بیشتر است. مانده: ${remaining} ریال`,
            }),
            { status: 400, headers },
          );
        }

        // گرفتن userId
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData) {
          return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
            status: 401,
            headers,
          });
        }

        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO budget_executions 
            (allocation_id, technical_code, amount, description, execution_date, accounting_doc_no)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          )
            .bind(
              allocation_id,
              technical_code,
              amount,
              description || null,
              execution_date || null,
              accounting_doc_no || null,
            )
            .run();

          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
            }),
            { status: 201, headers },
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "خطا در ثبت: " + error.message }),
            {
              status: 400,
              headers,
            },
          );
        }
      }

      // حذف اجرا
      if (
        url.pathname.startsWith("/api/executions/") &&
        request.method === "DELETE"
      ) {
        const id = url.pathname.split("/").pop();

        await env.DB.prepare("DELETE FROM budget_executions WHERE id = ?")
          .bind(id)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // دریافت مانده تخصیص
      if (
        url.pathname.startsWith("/api/allocations/balance/") &&
        request.method === "GET"
      ) {
        const allocationId = url.pathname.split("/").pop();

        const allocation = await env.DB.prepare(
          "SELECT amount FROM budget_allocations WHERE id = ?",
        )
          .bind(allocationId)
          .first();

        if (!allocation) {
          return new Response(JSON.stringify({ error: "تخصیص یافت نشد" }), {
            status: 404,
            headers,
          });
        }

        const executed = await env.DB.prepare(
          "SELECT SUM(amount) as total FROM budget_executions WHERE allocation_id = ?",
        )
          .bind(allocationId)
          .first();

        const totalExecuted = executed.total || 0;
        const remaining = allocation.amount - totalExecuted;

        return new Response(
          JSON.stringify({
            total: allocation.amount,
            executed: totalExecuted,
            remaining: remaining,
          }),
          { status: 200, headers },
        );
      }

      // ========== Permissions ==========

      // GET: لیست کلیدهای دسترسی
      if (
        url.pathname === "/api/permissions/keys" &&
        request.method === "GET"
      ) {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "احراز هویت لازم است" }),
            {
              status: 401,
              headers,
            },
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData) {
          return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
            status: 401,
            headers,
          });
        }

        // دسته‌بندی کلیدها
        const groups = [
          {
            title: "اطلاعات پایه",
            icon: "📂",
            keys: [
              { key: "base_info.view", label: "مشاهده اطلاعات پایه" },
              { key: "base_info.edit", label: "ویرایش اطلاعات پایه" },
            ],
          },

          {
            title: "بودجه",
            icon: "💰",
            keys: [
              { key: "budget.view", label: "مشاهده بودجه" },
              { key: "budget.add", label: "افزودن بودجه" },
              { key: "budget.submit", label: "ارسال بودجه" },
              { key: "budget.approve_manager", label: "تایید مدیر" },
              { key: "budget.approve_finance", label: "تایید مالی" },
              { key: "budget.approve_final", label: "تصویب نهایی" },
            ],
          },
          {
            title: "تخصیص و تامین اعتبار",
            icon: "💳",
            keys: [
              { key: "allocations.view", label: "مشاهده تخصیص" },
              { key: "allocations.add", label: "افزودن تخصیص" },
              { key: "executions.view", label: "مشاهده تامین اعتبار" },
              { key: "executions.add", label: "افزودن تامین اعتبار" },
            ],
          },
          {
            title: "گزارشات",
            icon: "📈",
            keys: [
              { key: "reports.view", label: "مشاهده گزارشات ساده" },
              { key: "reports.advanced", label: "مشاهده گزارشات پیشرفته" },
              { key: "reports.tafriq", label: "مشاهده تفریغ بودجه" },
              { key: "reports.export", label: "خروجی Excel" },
            ],
          },
          {
            title: "مدیریت کاربران",
            icon: "👤",
            keys: [
              { key: "users.view", label: "مشاهده کاربران" },
              { key: "users.add", label: "افزودن کاربر" },
              { key: "users.edit", label: "ویرایش کاربر" },
              { key: "users.delete", label: "حذف کاربر" },
              { key: "users.permissions", label: "مدیریت دسترسی‌ها" },
            ],
          },
          {
            title: "سیستم",
            icon: "⚙️",
            keys: [
              { key: "fiscal_years.view", label: "مشاهده سال مالی" },
              { key: "fiscal_years.manage", label: "مدیریت سال مالی" },
              { key: "audit_log.view", label: "مشاهده لاگ سیستم" },
              { key: "municipality_info.view", label: "مشاهده مشخصات شهرداری" },
              { key: "municipality_info.edit", label: "ویرایش مشخصات شهرداری" },
            ],
          },
        ];

        return new Response(JSON.stringify(groups), { status: 200, headers });
      }

      // GET: Permission های یک کاربر
      if (
        url.pathname.match(/^\/api\/users\/\d+\/permissions$/) &&
        request.method === "GET"
      ) {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "احراز هویت لازم است" }),
            {
              status: 401,
              headers,
            },
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData || !["admin", "manager"].includes(userData.role)) {
          return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
            status: 403,
            headers,
          });
        }

        const userId = url.pathname.split("/")[3];

        // گرفتن کاربر
        const user = await env.DB.prepare(
          "SELECT id, username, full_name, role FROM users WHERE id = ?",
        )
          .bind(userId)
          .first();

        if (!user) {
          return new Response(JSON.stringify({ error: "کاربر یافت نشد" }), {
            status: 404,
            headers,
          });
        }

        // Permission های نقش
        const rolePerms = await env.DB.prepare(
          "SELECT permission_key, granted FROM role_permissions WHERE role = ?",
        )
          .bind(user.role)
          .all();

        // Permission های اختصاصی
        const userPerms = await env.DB.prepare(
          "SELECT permission_key, granted FROM user_permissions WHERE user_id = ?",
        )
          .bind(userId)
          .all();

        return new Response(
          JSON.stringify({
            user: user,
            role_permissions: rolePerms.results,
            user_permissions: userPerms.results,
          }),
          { status: 200, headers },
        );
      }

      // POST: ذخیره Permission های یک کاربر
      if (
        url.pathname.match(/^\/api\/users\/\d+\/permissions$/) &&
        request.method === "POST"
      ) {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "احراز هویت لازم است" }),
            {
              status: 401,
              headers,
            },
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData || userData.role !== "admin") {
          return new Response(
            JSON.stringify({
              error: "فقط مدیر سیستم می‌تواند دسترسی‌ها را تغییر دهد",
            }),
            {
              status: 403,
              headers,
            },
          );
        }

        const userId = url.pathname.split("/")[3];
        const { permissions } = await request.json();

        // چک کاربر
        const user = await env.DB.prepare("SELECT id FROM users WHERE id = ?")
          .bind(userId)
          .first();

        if (!user) {
          return new Response(JSON.stringify({ error: "کاربر یافت نشد" }), {
            status: 404,
            headers,
          });
        }

        // پاک کردن permission های قبلی
        await env.DB.prepare("DELETE FROM user_permissions WHERE user_id = ?")
          .bind(userId)
          .run();

        // درج permission های جدید
        for (const perm of permissions) {
          // اگه granted === null، یعنی کاربر می‌خواد به «پیش‌فرض» برگرده → حذف از user_permissions
          if (perm.granted === null || perm.granted === undefined) {
            // حذف از user_permissions (به پیش‌فرض برمی‌گرده)
            await env.DB.prepare(
              `DELETE FROM user_permissions WHERE user_id = ? AND permission_key = ?`,
            )
              .bind(userId, perm.permission_key)
              .run();
          } else {
            // درج/آپدیت
            await env.DB.prepare(
              `INSERT OR REPLACE INTO user_permissions (user_id, permission_key, granted, granted_by)
               VALUES (?, ?, ?, ?)`,
            )
              .bind(
                userId,
                perm.permission_key,
                perm.granted ? 1 : 0,
                userData.userId,
              )
              .run();
          }
        }

        // ثبت لاگ
        ctx.waitUntil(
          logAction(
            env,
            request,
            userData,
            "permissions_changed",
            "user",
            parseInt(userId),
            {
              count: permissions.length,
            },
          ),
        );

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // GET: چک کردن permission کاربر فعلی
      if (url.pathname === "/api/me/permissions" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "احراز هویت لازم است" }),
            {
              status: 401,
              headers,
            },
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData) {
          return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
            status: 401,
            headers,
          });
        }

        // گرفتن نقش کاربر
        const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?")
          .bind(userData.userId)
          .first();

        if (!user) {
          return new Response(JSON.stringify({ error: "کاربر یافت نشد" }), {
            status: 404,
            headers,
          });
        }

        // Permission های نقش
        const rolePerms = await env.DB.prepare(
          "SELECT permission_key, granted FROM role_permissions WHERE role = ? AND granted = 1",
        )
          .bind(user.role)
          .all();

        // Permission های اختصاصی کاربر
        const userPerms = await env.DB.prepare(
          "SELECT permission_key, granted FROM user_permissions WHERE user_id = ?",
        )
          .bind(userData.userId)
          .all();

        // ترکیب (user_permissions روی role_permissions override می‌کنه)
        const permissions = {};
        rolePerms.results.forEach(
          (p) => (permissions[p.permission_key] = true),
        );
        userPerms.results.forEach(
          (p) => (permissions[p.permission_key] = p.granted === 1),
        );

        return new Response(JSON.stringify({ permissions }), {
          status: 200,
          headers,
        });
      }

      // ============================================
      // جستجوی شخص بر اساس کد ملی
      // ============================================
      if (url.pathname === "/api/persons/search" && request.method === "GET") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const nationalId = url.searchParams.get("national_id");

          if (!nationalId) {
            return new Response(
              JSON.stringify({ error: "کد ملی الزامی است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          // جستجو در همه انواع اشخاص
          const person = await env.DB.prepare(
            `SELECT id, national_id, code, full_name, first_name, last_name, 
                    person_type, level, parent_id, is_active, mobile
             FROM persons 
             WHERE national_id = ? AND level = 4`,
          )
            .bind(nationalId)
            .first();

          if (!person) {
            return new Response(
              JSON.stringify({
                error: "شخصی با این کد ملی یافت نشد",
                found: false,
              }),
              {
                status: 404,
                headers,
              },
            );
          }

          return new Response(
            JSON.stringify({
              found: true,
              person: person,
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("Search error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Employees API
      // ============================================

      // GET: اطلاعات استخدامی یک شخص
      if (
        url.pathname.match(/^\/api\/employees\/\d+$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const personId = url.pathname.split("/").pop();

          const employee = await env.DB.prepare(
            `SELECT * FROM employees WHERE person_id = ?`,
          )
            .bind(personId)
            .first();

          // اطلاعات شخص
          const person = await env.DB.prepare(
            `SELECT * FROM persons WHERE id = ?`,
          )
            .bind(personId)
            .first();

          if (!person) {
            return new Response(JSON.stringify({ error: "شخص یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          return new Response(
            JSON.stringify({
              person: person,
              employee: employee || null,
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("Employee GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST/PUT: ذخیره اطلاعات استخدامی
      if (
        url.pathname.match(/^\/api\/employees\/\d+$/) &&
        (request.method === "POST" || request.method === "PUT")
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
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
            notes,
          } = body;

          const nowShamsi = toShamsi(new Date());

          // چک کن اگه کارمند وجود داره
          const existing = await env.DB.prepare(
            `SELECT id FROM employees WHERE person_id = ?`,
          )
            .bind(personId)
            .first();

          if (existing) {
            // UPDATE
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
              WHERE person_id = ?`,
            )
              .bind(
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
                personId,
              )
              .run();
          } else {
            // INSERT
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
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
              .bind(
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
                nowShamsi,
              )
              .run();
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Employee POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Employee Tasks API
      // ============================================

      // GET: وظایف یک کارمند
      if (
        url.pathname.match(/^\/api\/employees\/\d+\/tasks$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const personId = url.pathname.split("/")[3];

          const tasks = await env.DB.prepare(
            `SELECT * FROM employee_tasks WHERE person_id = ? ORDER BY id`,
          )
            .bind(personId)
            .all();

          return new Response(JSON.stringify(tasks.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Tasks GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: ذخیره وظایف یک کارمند
      if (
        url.pathname.match(/^\/api\/employees\/\d+\/tasks$/) &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const personId = url.pathname.split("/")[3];
          const { tasks } = await request.json();

          if (!Array.isArray(tasks)) {
            return new Response(
              JSON.stringify({ error: "tasks باید آرایه باشد" }),
              {
                status: 400,
                headers,
              },
            );
          }

          // چک جمع درصد
          const totalPercentage = tasks.reduce(
            (sum, t) => sum + (t.percentage || 0),
            0,
          );
          if (totalPercentage > 100) {
            return new Response(
              JSON.stringify({
                error: `جمع درصدها (${totalPercentage}) نباید از ۱۰۰ بیشتر باشد`,
              }),
              {
                status: 400,
                headers,
              },
            );
          }

          const nowShamsi = toShamsi(new Date());

          // حذف وظایف قبلی
          await env.DB.prepare("DELETE FROM employee_tasks WHERE person_id = ?")
            .bind(personId)
            .run();

          // درج وظایف جدید
          for (const t of tasks) {
            if (!t.task_id || !t.task_type) continue;

            await env.DB.prepare(
              `INSERT INTO employee_tasks 
               (person_id, task_type, task_id, task_title, percentage, notes, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            )
              .bind(
                personId,
                t.task_type,
                t.task_id,
                t.task_title || null,
                t.percentage || 0,
                t.notes || null,
                nowShamsi,
                nowShamsi,
              )
              .run();
          }

          return new Response(
            JSON.stringify({
              success: true,
              total: totalPercentage,
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("Tasks POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // GET: لیست طبقه‌بندی عملیاتی (برای dropdown)
      if (
        url.pathname === "/api/operational-tree" &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const items = await env.DB.prepare(
            `SELECT id, code, title, type, parent_id, level FROM base_data 
             WHERE section = 'operational' AND is_active = 1 
             ORDER BY code`,
          ).all();

          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Operational tree error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // GET: فرزندان یک گره در طبقه‌بندی عملیاتی
      // ============================================
      if (
        url.pathname === "/api/operational-children" &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const parentId = url.searchParams.get("parent_id");

          let items;
          if (parentId === "null" || parentId === "" || parentId === null) {
            // سطح ۱: مأموریت‌ها (بدون والد)
            items = await env.DB.prepare(
              `SELECT id, code, title, type, level, parent_id 
               FROM base_data
               WHERE section = 'operational' 
                 AND parent_id IS NULL 
                 AND is_active = 1
               ORDER BY code`,
            ).all();
          } else {
            items = await env.DB.prepare(
              `SELECT id, code, title, type, level, parent_id 
               FROM base_data
               WHERE section = 'operational' 
                 AND parent_id = ? 
                 AND is_active = 1
               ORDER BY code`,
            )
              .bind(parentId)
              .all();
          }

          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Operational children error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Dependents API
      // ============================================

      // GET: افراد تحت تکفل یک کارمند
      if (
        url.pathname.match(/^\/api\/employees\/\d+\/dependents$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const personId = url.pathname.split("/")[3];

          const deps = await env.DB.prepare(
            `SELECT * FROM dependents WHERE employee_person_id = ? ORDER BY id`,
          )
            .bind(personId)
            .all();

          return new Response(JSON.stringify(deps.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Dependents GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: افزودن/ویرایش فرد تحت تکفل
      if (
        url.pathname.match(/^\/api\/employees\/\d+\/dependents$/) &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
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
            notes,
          } = body;

          const nowShamsi = toShamsi(new Date());

          // چک کد ملی تکراری
          if (national_id) {
            const existing = await env.DB.prepare(
              `SELECT id FROM dependents WHERE employee_person_id = ? AND national_id = ? AND id != ?`,
            )
              .bind(personId, national_id, id || 0)
              .first();

            if (existing) {
              return new Response(
                JSON.stringify({
                  error: "این کد ملی قبلاً برای این کارمند ثبت شده است",
                }),
                {
                  status: 400,
                  headers,
                },
              );
            }
          }

          if (id) {
            // UPDATE
            await env.DB.prepare(
              `UPDATE dependents SET
                national_id = ?, relation_type = ?,
                first_name = ?, last_name = ?, full_name = ?, father_name = ?,
                id_number = ?, birth_date_shamsi = ?, gender = ?, mobile = ?,
                education_status = ?, military_status = ?, marital_status = ?, marriage_date_shamsi = ?,
                is_disabled = ?, notes = ?,
                updated_at = CURRENT_TIMESTAMP, updated_at_shamsi = ?
              WHERE id = ? AND employee_person_id = ?`,
            )
              .bind(
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
                personId,
              )
              .run();

            return new Response(JSON.stringify({ success: true, id: id }), {
              status: 200,
              headers,
            });
          } else {
            // INSERT
            const result = await env.DB.prepare(
              `INSERT INTO dependents 
               (employee_person_id, national_id, relation_type, first_name, last_name, full_name,
                father_name, id_number, birth_date_shamsi, gender, mobile,
                education_status, military_status, marital_status, marriage_date_shamsi,
                is_disabled, notes, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
              .bind(
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
                nowShamsi,
              )
              .run();

            return new Response(
              JSON.stringify({
                success: true,
                id: result.meta.last_row_id,
              }),
              {
                status: 201,
                headers,
              },
            );
          }
        } catch (error) {
          console.error("Dependent POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // DELETE: حذف فرد تحت تکفل
      if (
        url.pathname.match(/^\/api\/dependents\/\d+$/) &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const dependentId = url.pathname.split("/").pop();

          await env.DB.prepare("DELETE FROM dependents WHERE id = ?")
            .bind(dependentId)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Dependent DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }
      // ============================================
      // Decrees API (احکام کارگزینی)
      // ============================================

      // ============================================
      // POST: امضای مدیر
      // ============================================
      if (
        url.pathname.match(/^\/api\/decrees\/\d+\/sign-manager$/) &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const decreeId = url.pathname.split("/")[3];

          await env.DB.prepare(
            `UPDATE decrees SET signed_by_manager = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          )
            .bind(decreeId)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // POST: امضای شهردار
      // ============================================
      if (
        url.pathname.match(/^\/api\/decrees\/\d+\/sign-mayor$/) &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || userData.role !== "admin") {
            return new Response(
              JSON.stringify({ error: "فقط شهردار (مدیر سیستم) دسترسی دارد" }),
              { status: 403, headers },
            );
          }

          const decreeId = url.pathname.split("/")[3];

          await env.DB.prepare(
            `UPDATE decrees SET signed_by_mayor = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          )
            .bind(decreeId)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // GET: آیتم‌های حقوق بر اساس نوع حکم
      if (url.pathname === "/api/decree-items" && request.method === "GET") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const decreeType = url.searchParams.get("decree_type");

          if (!decreeType) {
            return new Response(
              JSON.stringify({ error: "decree_type الزامی است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const items = await env.DB.prepare(
            `SELECT * FROM decree_items WHERE decree_type = ? AND is_active = 1 ORDER BY sort_order`,
          )
            .bind(decreeType)
            .all();

          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Decree items error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // GET: لیست احکام یک کارمند
      if (
        url.pathname.match(/^\/api\/employees\/\d+\/decrees$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const personId = url.pathname.split("/")[3];

          const decrees = await env.DB.prepare(
            `SELECT * FROM decrees WHERE employee_person_id = ? ORDER BY id DESC`,
          )
            .bind(personId)
            .all();

          return new Response(JSON.stringify(decrees.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Decrees GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // GET: یک حکم خاص
      if (
        url.pathname.match(/^\/api\/decrees\/\d+$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const decreeId = url.pathname.split("/").pop();

          const decree = await env.DB.prepare(
            `SELECT * FROM decrees WHERE id = ?`,
          )
            .bind(decreeId)
            .first();

          if (!decree) {
            return new Response(JSON.stringify({ error: "حکم یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          // آیتم‌ها رو parse کن
          if (decree.items) {
            try {
              decree.items_parsed = JSON.parse(decree.items);
            } catch (e) {
              decree.items_parsed = [];
            }
          }

          return new Response(JSON.stringify(decree), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Decree GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: افزودن/ویرایش حکم
      if (
        url.pathname.match(/^\/api\/employees\/\d+\/decrees$/) &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
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
            notes,
          } = body;

          if (!decree_type) {
            return new Response(
              JSON.stringify({ error: "نوع حکم الزامی است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const nowShamsi = toShamsi(new Date());
          const itemsJson = items ? JSON.stringify(items) : null;

          if (id) {
            // UPDATE
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
              WHERE id = ? AND employee_person_id = ?`,
            )
              .bind(
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
                personId,
              )
              .run();

            return new Response(JSON.stringify({ success: true, id: id }), {
              status: 200,
              headers,
            });
          } else {
            // INSERT
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
              )`,
            )
              .bind(
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
                nowShamsi,
              )
              .run();

            return new Response(
              JSON.stringify({
                success: true,
                id: result.meta.last_row_id,
              }),
              {
                status: 201,
                headers,
              },
            );
          }
        } catch (error) {
          console.error("Decree POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // DELETE: حذف حکم
      if (
        url.pathname.match(/^\/api\/decrees\/\d+$/) &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const decreeId = url.pathname.split("/").pop();

          await env.DB.prepare("DELETE FROM decrees WHERE id = ?")
            .bind(decreeId)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Decree DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Signatures API (امضای دیجیتال - Mock SMS)
      // ============================================

      // POST: ارسال OTP (mock)
      if (
        url.pathname === "/api/signatures/send-otp" &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const body = await request.json();
          const { entity_type, entity_id, employee_person_id, mobile } = body;

          if (!entity_type || !entity_id || !employee_person_id || !mobile) {
            return new Response(JSON.stringify({ error: "اطلاعات ناقص" }), {
              status: 400,
              headers,
            });
          }

          // تولید OTP تصادفی ۶ رقمی
          const otpCode = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();

          const nowShamsi = toShamsi(new Date());

          // ثبت در جدول signatures
          const result = await env.DB.prepare(
            `INSERT INTO signatures 
             (entity_type, entity_id, employee_person_id, mobile, otp_code, otp_sent_at, status, created_at_shamsi)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'sent', ?)`,
          )
            .bind(
              entity_type,
              entity_id,
              employee_person_id,
              mobile,
              otpCode,
              nowShamsi,
            )
            .run();

          // ثبت در لاگ SMS (mock)
          await env.DB.prepare(
            `INSERT INTO sms_log 
             (mobile, message, message_type, provider, status, entity_type, entity_id, employee_person_id, sent_at_shamsi)
             VALUES (?, ?, 'otp', 'mock', 'sent', ?, ?, ?, ?)`,
          )
            .bind(
              mobile,
              `کد تایید امضای دیجیتال شما: ${otpCode}`,
              entity_type,
              entity_id,
              employee_person_id,
              nowShamsi,
            )
            .run();

          // در production واقعی، اینجا SMS ارسال می‌شه
          console.log(`🔐 [MOCK SMS] OTP برای ${mobile}: ${otpCode}`);

          return new Response(
            JSON.stringify({
              success: true,
              signature_id: result.meta.last_row_id,
              // ⚠️ فقط در حالت mock، OTP رو برمی‌گردونیم
              mock_otp: otpCode,
              message: "کد تایید ارسال شد (mock)",
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("Send OTP error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: تایید OTP و امضا
      if (
        url.pathname === "/api/signatures/verify" &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const body = await request.json();
          const { signature_id, otp_code } = body;

          if (!signature_id || !otp_code) {
            return new Response(JSON.stringify({ error: "اطلاعات ناقص" }), {
              status: 400,
              headers,
            });
          }

          // چک کد
          const signature = await env.DB.prepare(
            `SELECT * FROM signatures WHERE id = ? AND status = 'sent'`,
          )
            .bind(signature_id)
            .first();

          if (!signature) {
            return new Response(
              JSON.stringify({ error: "امضا یافت نشد یا منقضی شده" }),
              {
                status: 404,
                headers,
              },
            );
          }

          // چک تعداد تلاش
          if (signature.otp_attempts >= 5) {
            await env.DB.prepare(
              `UPDATE signatures SET status = 'failed' WHERE id = ?`,
            )
              .bind(signature_id)
              .run();

            return new Response(
              JSON.stringify({ error: "تعداد تلاش بیش از حد مجاز" }),
              {
                status: 400,
                headers,
              },
            );
          }

          if (signature.otp_code !== otp_code) {
            // افزایش تعداد تلاش
            await env.DB.prepare(
              `UPDATE signatures SET otp_attempts = otp_attempts + 1 WHERE id = ?`,
            )
              .bind(signature_id)
              .run();

            return new Response(
              JSON.stringify({ error: "کد تایید اشتباه است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          // تایید موفق
          await env.DB.prepare(
            `UPDATE signatures 
             SET status = 'verified', 
                 otp_verified_at = CURRENT_TIMESTAMP,
                 signed_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
          )
            .bind(signature_id)
            .run();

          // آپدیت حکم/قرارداد
          if (signature.entity_type === "decree") {
            await env.DB.prepare(
              `UPDATE decrees 
               SET status = 'signed', 
                   signed_at = CURRENT_TIMESTAMP,
                   signed_by_employee = 1
               WHERE id = ?`,
            )
              .bind(signature.entity_id)
              .run();
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: "امضا با موفقیت ثبت شد",
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("Verify OTP error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // GET: وضعیت امضاهای یک حکم
      if (
        url.pathname.match(/^\/api\/signatures\/\w+\/\d+$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const parts = url.pathname.split("/");
          const entityType = parts[3];
          const entityId = parts[4];

          const signatures = await env.DB.prepare(
            `SELECT id, entity_type, entity_id, mobile, status, otp_sent_at, otp_verified_at, signed_at
             FROM signatures 
             WHERE entity_type = ? AND entity_id = ?
             ORDER BY id DESC`,
          )
            .bind(entityType, entityId)
            .all();

          return new Response(JSON.stringify(signatures.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Signatures GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Payroll Settings API
      // ============================================

      // GET: تنظیمات محاسبات
      if (
        url.pathname === "/api/payroll-settings" &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
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

          const items = await env.DB.prepare(query)
            .bind(...params)
            .all();

          // دسته‌بندی
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
              grouped: grouped,
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("Payroll settings GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // PUT: آپدیت تنظیمات (چندتایی)
      if (
        url.pathname === "/api/payroll-settings" &&
        request.method === "PUT"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || userData.role !== "admin") {
            return new Response(
              JSON.stringify({
                error: "فقط مدیر سیستم می‌تواند تنظیمات را تغییر دهد",
              }),
              {
                status: 403,
                headers,
              },
            );
          }

          const body = await request.json();
          const { settings, fiscal_year_id } = body;

          if (!Array.isArray(settings)) {
            return new Response(
              JSON.stringify({ error: "settings باید آرایه باشد" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const nowShamsi = toShamsi(new Date());

          for (const s of settings) {
            if (!s.setting_key) continue;

            const existing = await env.DB.prepare(
              `SELECT id FROM payroll_settings WHERE setting_key = ? AND (fiscal_year_id = ? OR (fiscal_year_id IS NULL AND ? IS NULL))`,
            )
              .bind(
                s.setting_key,
                fiscal_year_id || null,
                fiscal_year_id || null,
              )
              .first();

            if (existing) {
              await env.DB.prepare(
                `UPDATE payroll_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              )
                .bind(s.setting_value || null, existing.id)
                .run();
            } else {
              await env.DB.prepare(
                `INSERT INTO payroll_settings (fiscal_year_id, setting_key, setting_value, setting_type, description, category, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
              )
                .bind(
                  fiscal_year_id || null,
                  s.setting_key,
                  s.setting_value || null,
                  s.setting_type || "number",
                  s.description || null,
                  s.category || "general",
                  s.sort_order || 0,
                )
                .run();
            }
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Payroll settings PUT error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // GET: آیتم‌های حقوق پایه
      if (url.pathname === "/api/payroll-items" && request.method === "GET") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const items = await env.DB.prepare(
            "SELECT * FROM payroll_items WHERE is_active = 1 ORDER BY sort_order",
          ).all();

          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Payroll items GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // PUT: آپدیت آیتم حقوقی (مشمولیت‌ها)
      if (
        url.pathname.match(/^\/api\/payroll-items\/\d+$/) &&
        request.method === "PUT"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || userData.role !== "admin") {
            return new Response(JSON.stringify({ error: "فقط مدیر سیستم" }), {
              status: 403,
              headers,
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
            notes,
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
            WHERE id = ?`,
          )
            .bind(
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
              is_active !== undefined ? (is_active ? 1 : 0) : 1,
              sort_order || 0,
              notes || null,
              itemId,
            )
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Payroll item PUT error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Payroll Calculations API
      // ============================================

      // GET: لیست محاسبات
      if (
        url.pathname === "/api/payroll-calculations" &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
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

          query +=
            " ORDER BY pc.period_year DESC, pc.period_month DESC, pc.id DESC LIMIT 200";

          const items = await env.DB.prepare(query)
            .bind(...params)
            .all();

          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Payroll calc GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // GET: یک محاسبه خاص
      if (
        url.pathname.match(/^\/api\/payroll-calculations\/\d+$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const id = url.pathname.split("/").pop();

          const calc = await env.DB.prepare(
            `SELECT pc.*, p.full_name, p.national_id, p.code as person_code, p.mobile
             FROM payroll_calculations pc
             LEFT JOIN persons p ON pc.employee_person_id = p.id
             WHERE pc.id = ?`,
          )
            .bind(id)
            .first();

          if (!calc) {
            return new Response(JSON.stringify({ error: "محاسبه یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          // Parse JSON fields
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
            headers,
          });
        } catch (error) {
          console.error("Payroll calc GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: محاسبه و ذخیره حقوق
      if (
        url.pathname === "/api/payroll-calculations/calculate" &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const body = await request.json();
          const {
            employee_person_id,
            period_year,
            period_month,
            fiscal_year_id,
            decree_id,
          } = body;

          if (!employee_person_id || !period_year || !period_month) {
            return new Response(JSON.stringify({ error: "اطلاعات ناقص" }), {
              status: 400,
              headers,
            });
          }

          // لود حکم
          let decree;
          if (decree_id) {
            decree = await env.DB.prepare(`SELECT * FROM decrees WHERE id = ?`)
              .bind(decree_id)
              .first();
          } else {
            decree = await env.DB.prepare(
              `SELECT * FROM decrees 
               WHERE employee_person_id = ? AND status IN ('signed', 'active', 'issued')
               ORDER BY id DESC LIMIT 1`,
            )
              .bind(employee_person_id)
              .first();
          }

          if (!decree) {
            return new Response(
              JSON.stringify({ error: "حکم فعالی برای این کارمند یافت نشد" }),
              {
                status: 404,
                headers,
              },
            );
          }

          // Parse آیتم‌های حکم
          let decreeItems = [];
          try {
            decreeItems = JSON.parse(decree.items || "[]");
          } catch (e) {
            decreeItems = [];
          }

          // لود payroll_items برای مشمولیت‌ها
          const payrollItemsData = await env.DB.prepare(
            "SELECT * FROM payroll_items WHERE is_active = 1",
          ).all();

          const payrollItemsMap = {};
          payrollItemsData.results.forEach((p) => {
            payrollItemsMap[p.title] = p;
          });

          // لود تنظیمات
          const settingsData = await env.DB.prepare(
            "SELECT setting_key, setting_value FROM payroll_settings WHERE fiscal_year_id IS NULL",
          ).all();

          const settings = {};
          settingsData.results.forEach((s) => {
            settings[s.setting_key] = s.setting_value;
          });

          // ============================================
          // لود حضور و غیاب
          // ============================================
          const attendance = await env.DB.prepare(
            `SELECT * FROM attendance 
             WHERE employee_person_id = ? 
               AND period_year = ? 
               AND period_month = ?
               AND status IN ('draft', 'submitted', 'manager_approved', 'mayor_approved')`,
          )
            .bind(employee_person_id, period_year, period_month)
            .first();

          const baseSalaryItem = decreeItems.find(
            (i) => i.title === "حقوق مبنا" || i.title === "مزد شغل",
          );
          const baseSalary = baseSalaryItem
            ? parseFloat(baseSalaryItem.amount)
            : 0;
          const hourlyRate = baseSalary > 0 ? baseSalary / 220 : 0;

          // ============================================
          // آیتم‌های اضافه‌کاری (بر اساس حضور و غیاب)
          // ============================================
          if (attendance) {
            const overtimeRate =
              parseFloat(settings.overtime_rate || "140") / 100;
            const holidayRate =
              parseFloat(settings.holiday_rate || "140") / 100;
            const nightshiftRate =
              parseFloat(settings.nightshift_rate || "35") / 100;
            const missionRate =
              parseFloat(settings.mission_rate || "100") / 100;

            // اضافه‌کاری
            if (attendance.overtime_hours > 0 && hourlyRate > 0) {
              const overtimeAmount = Math.round(
                attendance.overtime_hours * hourlyRate * overtimeRate,
              );
              decreeItems.push({
                code: "ض",
                title: "اضافه کاری",
                amount: overtimeAmount,
                is_insurance_subject: true,
                is_tax_subject: true,
              });
            }

            // تعطیل‌کاری
            if (attendance.holiday_hours > 0 && hourlyRate > 0) {
              const holidayAmount = Math.round(
                attendance.holiday_hours * hourlyRate * holidayRate,
              );
              decreeItems.push({
                code: "ط",
                title: "تعطیل کاری",
                amount: holidayAmount,
                is_insurance_subject: true,
                is_tax_subject: true,
              });
            }

            // نوبت‌کاری
            if (attendance.nightshift_hours > 0 && hourlyRate > 0) {
              const nightshiftAmount = Math.round(
                attendance.nightshift_hours * hourlyRate * nightshiftRate,
              );
              decreeItems.push({
                code: "ظ",
                title: "فوق العاده نوبت کاری",
                amount: nightshiftAmount,
                is_insurance_subject: true,
                is_tax_subject: true,
              });
            }

            // مأموریت
            if (
              attendance.mission_days_with_stay > 0 ||
              attendance.mission_days_without_stay > 0
            ) {
              const dailyRate = baseSalary / 30;
              const totalMissionDays =
                (attendance.mission_days_with_stay || 0) +
                (attendance.mission_days_without_stay || 0);

              if (totalMissionDays > 0) {
                const missionAmount = Math.round(
                  totalMissionDays * dailyRate * missionRate,
                );
                decreeItems.push({
                  code: "ع",
                  title: "مأموریت",
                  amount: missionAmount,
                  is_insurance_subject: true,
                  is_tax_subject: true,
                });
              }
            }
          }

          // محاسبه
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
              amount: amount,
              is_insurance: isInsurance,
              is_tax: isTax,
            };
          });

          // محاسبه بیمه
          const insuranceRateEmployee =
            parseFloat(settings.insurance_rate_employee || "7") / 100;
          const insuranceRateEmployer =
            parseFloat(settings.insurance_rate_employer || "23") / 100;
          const insuranceEmployee = Math.round(
            totalInsuranceSubject * insuranceRateEmployee,
          );
          const insuranceEmployer = Math.round(
            totalInsuranceSubject * insuranceRateEmployer,
          );

          // محاسبه مالیات (ساده - پله‌ای)
          const taxExemption = parseFloat(
            settings.tax_exemption_monthly || "120000000",
          );
          const taxBase = Math.max(0, totalTaxSubject - taxExemption);

          // نرخ‌های پله‌ای
          const rates = [
            parseFloat(settings.tax_rate_1 || "10") / 100,
            parseFloat(settings.tax_rate_2 || "15") / 100,
            parseFloat(settings.tax_rate_3 || "20") / 100,
            parseFloat(settings.tax_rate_4 || "25") / 100,
          ];

          // محاسبه ساده مالیات (فقط پله اول برای الان)
          const taxAmount = Math.round(taxBase * rates[0]);

          // ============================================
          // کسورات: وام‌ها + سایر کسورات
          // ============================================
          let loanInstallments = 0;
          let otherDeductions = 0;
          const appliedDeductions = [];

          // ۱. وام‌های فعال
          const activeLoans = await env.DB.prepare(
            `SELECT * FROM loans 
             WHERE employee_person_id = ? 
               AND status = 'active' 
               AND is_active = 1
               AND paid_installments < installments_count
             ORDER BY id`,
          )
            .bind(employee_person_id)
            .all();

          for (const loan of activeLoans.results) {
            const installmentAmt = parseFloat(loan.installment_amount) || 0;
            if (installmentAmt > 0) {
              loanInstallments += installmentAmt;
              appliedDeductions.push({
                type: "loan",
                loan_id: loan.id,
                title: `${loan.lender_name || "وام"} - قسط ${loan.paid_installments + 1
                  }`,
                amount: installmentAmt,
              });
            }
          }

          // ۲. سایر کسورات فعال
          const activeDeductions = await env.DB.prepare(
            `SELECT ed.*, dt.title as type_title
             FROM employee_deductions ed
             LEFT JOIN deduction_types dt ON ed.deduction_type_id = dt.id
             WHERE ed.employee_person_id = ? 
               AND ed.status = 'active' 
               AND ed.is_active = 1`,
          )
            .bind(employee_person_id)
            .all();
          // ۲.۵. کسور غیبت (از حضور و غیاب)
          if (attendance && attendance.absence_days > 0 && baseSalary > 0) {
            const dailyRate = baseSalary / 30;
            const absenceAmount = Math.round(
              attendance.absence_days * dailyRate,
            );

            if (absenceAmount > 0) {
              otherDeductions += absenceAmount;
              appliedDeductions.push({
                type: "absence",
                title: `کسر غیبت (${toPersianNumbers(
                  attendance.absence_days,
                )} روز)`,
                amount: absenceAmount,
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
                amount: amt,
              });
            }
          }

          // جمع کسورات
          const totalDeductions =
            insuranceEmployee + taxAmount + loanInstallments + otherDeductions;

          // خالص
          const netPay = totalGross - totalDeductions;

          // تنظیمات اضافه برای snapshot
          const extendedSettings = {
            ...settings,
            applied_deductions: appliedDeductions,
            loan_installments: loanInstallments,
            other_deductions: otherDeductions,
          };

          const nowShamsi = toShamsi(new Date());

          // ذخیره
          const result = await env.DB.prepare(
            `INSERT INTO payroll_calculations 
             (employee_person_id, fiscal_year_id, period_year, period_month,
              decree_id, items, total_gross, total_insurance_subject, total_tax_subject,
              insurance_employee, insurance_employer, tax_amount, other_deductions,
              total_deductions, net_pay, settings_snapshot, status,
              calculated_by, calculated_at_shamsi, created_at_shamsi, updated_at_shamsi)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'calculated', ?, ?, ?, ?)`,
          )
            .bind(
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
              otherDeductions + loanInstallments, // ← مجموع کسورات غیر بیمه/مالیات
              totalDeductions,
              netPay,
              JSON.stringify(extendedSettings), // ← settings با applied_deductions
              userData.userId,
              nowShamsi,
              nowShamsi,
              nowShamsi,
            )
            .run();

          // ============================================
          // ثبت پرداخت اقساط وام
          // ============================================
          const calculationId = result.meta.last_row_id;

          for (const loan of activeLoans.results) {
            const installmentAmt = parseFloat(loan.installment_amount) || 0;
            if (installmentAmt <= 0) continue;

            const nextInstallmentNumber = (loan.paid_installments || 0) + 1;

            // ثبت پرداخت
            await env.DB.prepare(
              `INSERT INTO loan_payments 
               (loan_id, employee_person_id, installment_number, amount,
                period_year, period_month, payroll_calculation_id,
                status, created_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?)`,
            )
              .bind(
                loan.id,
                employee_person_id,
                nextInstallmentNumber,
                installmentAmt,
                period_year,
                period_month,
                calculationId,
                nowShamsi,
              )
              .run();

            // آپدیت وام
            const newPaidInstallments = (loan.paid_installments || 0) + 1;
            const newPaidAmount = (loan.paid_amount || 0) + installmentAmt;
            const newRemaining = (loan.total_amount || 0) - newPaidAmount;
            const newStatus =
              newPaidInstallments >= loan.installments_count
                ? "completed"
                : "active";

            await env.DB.prepare(
              `UPDATE loans SET
                paid_installments = ?,
                paid_amount = ?,
                remaining_amount = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP,
                updated_at_shamsi = ?
              WHERE id = ?`,
            )
              .bind(
                newPaidInstallments,
                newPaidAmount,
                newRemaining,
                newStatus,
                nowShamsi,
                loan.id,
              )
              .run();
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
                loan_installments: loanInstallments, // ← جدید
                other_deductions: otherDeductions, // ← جدید
                total_deductions: totalDeductions,
                net_pay: netPay,
                items: calculatedItems,
                applied_deductions: appliedDeductions, // ← جدید
              },
            }),
            {
              status: 201,
              headers,
            },
          );
        } catch (error) {
          console.error("Payroll calculate error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: لغو محاسبه (به جای حذف)
      if (
        url.pathname.match(/^\/api\/payroll-calculations\/\d+\/cancel$/) &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const id = url.pathname.split("/")[3];
          const body = await request.json();
          const { reason } = body;

          // چک کن محاسبه وجود داره
          const calc = await env.DB.prepare(
            `SELECT * FROM payroll_calculations WHERE id = ?`,
          )
            .bind(id)
            .first();

          if (!calc) {
            return new Response(JSON.stringify({ error: "محاسبه یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          if (calc.status === "cancelled") {
            return new Response(
              JSON.stringify({ error: "این محاسبه قبلاً لغو شده" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const nowShamsi = toShamsi(new Date());

          // ۱. بازگرداندن اقساط وام
          const loanPayments = await env.DB.prepare(
            `SELECT * FROM loan_payments 
             WHERE payroll_calculation_id = ? AND status = 'paid'`,
          )
            .bind(id)
            .all();

          for (const payment of loanPayments.results) {
            const loan = await env.DB.prepare(
              `SELECT * FROM loans WHERE id = ?`,
            )
              .bind(payment.loan_id)
              .first();

            if (loan) {
              const newPaidInstallments = Math.max(
                0,
                (loan.paid_installments || 0) - 1,
              );
              const newPaidAmount = Math.max(
                0,
                (loan.paid_amount || 0) - payment.amount,
              );
              const newRemaining = (loan.total_amount || 0) - newPaidAmount;

              // اگه قبلاً completed بود، به active برگردون
              let newStatus = loan.status;
              if (
                loan.status === "completed" &&
                newPaidInstallments < loan.installments_count
              ) {
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
                WHERE id = ?`,
              )
                .bind(
                  newPaidInstallments,
                  newPaidAmount,
                  newRemaining,
                  newStatus,
                  nowShamsi,
                  loan.id,
                )
                .run();
            }
          }

          // ۲. علامت‌گذاری پرداخت‌ها به عنوان cancelled
          await env.DB.prepare(
            `UPDATE loan_payments SET status = 'cancelled' 
             WHERE payroll_calculation_id = ?`,
          )
            .bind(id)
            .run();

          // ۳. لغو محاسبه
          await env.DB.prepare(
            `UPDATE payroll_calculations SET
              status = 'cancelled',
              cancelled_at = CURRENT_TIMESTAMP,
              cancelled_by = ?,
              cancelled_reason = ?,
              updated_at = CURRENT_TIMESTAMP,
              updated_at_shamsi = ?
            WHERE id = ?`,
          )
            .bind(userData.userId, reason || null, nowShamsi, id)
            .run();

          return new Response(
            JSON.stringify({
              success: true,
              message: "محاسبه لغو شد و اقساط وام بازگردانده شدند",
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("Payroll cancel error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // DELETE: حذف کامل (فقط admin و فقط اگه cancelled باشه)
      if (
        url.pathname.match(/^\/api\/payroll-calculations\/\d+$/) &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || userData.role !== "admin") {
            return new Response(JSON.stringify({ error: "فقط مدیر سیستم" }), {
              status: 403,
              headers,
            });
          }

          const id = url.pathname.split("/").pop();

          // چک کن status
          const calc = await env.DB.prepare(
            `SELECT status FROM payroll_calculations WHERE id = ?`,
          )
            .bind(id)
            .first();

          if (!calc) {
            return new Response(JSON.stringify({ error: "محاسبه یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          if (calc.status !== "cancelled") {
            return new Response(
              JSON.stringify({
                error: "فقط محاسبات لغو شده قابل حذف کامل هستند",
              }),
              {
                status: 400,
                headers,
              },
            );
          }

          // حذف پرداخت‌های وام
          await env.DB.prepare(
            "DELETE FROM loan_payments WHERE payroll_calculation_id = ?",
          )
            .bind(id)
            .run();

          // حذف محاسبه
          await env.DB.prepare("DELETE FROM payroll_calculations WHERE id = ?")
            .bind(id)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Payroll calc DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // GET: لیست کارکنان (برای dropdown)
      if (url.pathname === "/api/employees/list" && request.method === "GET") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          // کارکنانی که حکم دارن
          const employees = await env.DB.prepare(
            `SELECT DISTINCT p.id, p.code, p.full_name, p.national_id, p.mobile,
                    (SELECT COUNT(*) FROM decrees d WHERE d.employee_person_id = p.id AND d.status IN ('signed', 'active', 'issued')) as decrees_count
             FROM persons p
             INNER JOIN decrees d ON d.employee_person_id = p.id
             WHERE p.person_type = 'employee' AND p.is_active = 1
             ORDER BY p.full_name`,
          ).all();

          return new Response(JSON.stringify(employees.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Employees list error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Deduction Types API (انواع کسورات)
      // ============================================

      // GET: لیست انواع کسورات
      if (url.pathname === "/api/deduction-types" && request.method === "GET") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const items = await env.DB.prepare(
            "SELECT * FROM deduction_types WHERE is_active = 1 ORDER BY sort_order",
          ).all();

          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Deduction types error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Loans API (وام‌ها)
      // ============================================

      // GET: لیست وام‌های یک کارمند
      if (
        url.pathname.match(/^\/api\/employees\/\d+\/loans$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const personId = url.pathname.split("/")[3];

          const loans = await env.DB.prepare(
            `SELECT * FROM loans WHERE employee_person_id = ? ORDER BY id DESC`,
          )
            .bind(personId)
            .all();

          return new Response(JSON.stringify(loans.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Loans GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // GET: یک وام خاص
      if (
        url.pathname.match(/^\/api\/loans\/\d+$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const loanId = url.pathname.split("/").pop();

          const loan = await env.DB.prepare(`SELECT * FROM loans WHERE id = ?`)
            .bind(loanId)
            .first();

          if (!loan) {
            return new Response(JSON.stringify({ error: "وام یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          // پرداخت‌ها
          const payments = await env.DB.prepare(
            `SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY installment_number`,
          )
            .bind(loanId)
            .all();

          return new Response(
            JSON.stringify({
              loan: loan,
              payments: payments.results,
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("Loan GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: افزودن/ویرایش وام
      if (
        url.pathname.match(/^\/api\/employees\/\d+\/loans$/) &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
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
            notes,
          } = body;

          if (!total_amount || !installments_count) {
            return new Response(
              JSON.stringify({ error: "مبلغ کل و تعداد اقساط الزامی است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const nowShamsi = toShamsi(new Date());
          const installmentAmt =
            installment_amount || Math.round(total_amount / installments_count);
          const remaining = total_amount; // هنگام درج، مانده = کل

          if (id) {
            // UPDATE
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
              WHERE id = ? AND employee_person_id = ?`,
            )
              .bind(
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
                personId,
              )
              .run();

            return new Response(JSON.stringify({ success: true, id: id }), {
              status: 200,
              headers,
            });
          } else {
            // INSERT
            const result = await env.DB.prepare(
              `INSERT INTO loans 
               (employee_person_id, loan_type, lender_name, loan_number,
                total_amount, paid_amount, remaining_amount,
                installments_count, installment_amount, paid_installments,
                start_date_shamsi, end_date_shamsi, first_installment_shamsi,
                status, notes, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?, ?, ?, 'active', ?, ?, ?)`,
            )
              .bind(
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
                nowShamsi,
              )
              .run();

            return new Response(
              JSON.stringify({
                success: true,
                id: result.meta.last_row_id,
              }),
              {
                status: 201,
                headers,
              },
            );
          }
        } catch (error) {
          console.error("Loan POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // DELETE: حذف وام
      if (
        url.pathname.match(/^\/api\/loans\/\d+$/) &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const loanId = url.pathname.split("/").pop();

          await env.DB.prepare("DELETE FROM loans WHERE id = ?")
            .bind(loanId)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Loan DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Employee Deductions API (کسورات غیر وام)
      // ============================================

      // GET: لیست کسورات یک کارمند
      if (
        url.pathname.match(/^\/api\/employees\/\d+\/deductions$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const personId = url.pathname.split("/")[3];

          const ded = await env.DB.prepare(
            `SELECT ed.*, dt.title as type_title, dt.code as type_code, dt.category as type_category
             FROM employee_deductions ed
             LEFT JOIN deduction_types dt ON ed.deduction_type_id = dt.id
             WHERE ed.employee_person_id = ?
             ORDER BY ed.id DESC`,
          )
            .bind(personId)
            .all();

          return new Response(JSON.stringify(ded.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Deductions GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: افزودن/ویرایش کسور
      if (
        url.pathname.match(/^\/api\/employees\/\d+\/deductions$/) &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
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
            notes,
          } = body;

          if (!title || !amount) {
            return new Response(
              JSON.stringify({ error: "عنوان و مبلغ الزامی است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const nowShamsi = toShamsi(new Date());

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
              WHERE id = ? AND employee_person_id = ?`,
            )
              .bind(
                deduction_type_id || null,
                title,
                amount,
                start_date_shamsi || null,
                end_date_shamsi || null,
                remaining_count || null,
                notes || null,
                nowShamsi,
                id,
                personId,
              )
              .run();

            return new Response(JSON.stringify({ success: true, id: id }), {
              status: 200,
              headers,
            });
          } else {
            const result = await env.DB.prepare(
              `INSERT INTO employee_deductions 
               (employee_person_id, deduction_type_id, title, amount,
                start_date_shamsi, end_date_shamsi, remaining_count,
                status, notes, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
            )
              .bind(
                personId,
                deduction_type_id || null,
                title,
                amount,
                start_date_shamsi || null,
                end_date_shamsi || null,
                remaining_count || null,
                notes || null,
                nowShamsi,
                nowShamsi,
              )
              .run();

            return new Response(
              JSON.stringify({
                success: true,
                id: result.meta.last_row_id,
              }),
              {
                status: 201,
                headers,
              },
            );
          }
        } catch (error) {
          console.error("Deduction POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // DELETE: حذف کسور
      if (
        url.pathname.match(/^\/api\/employee-deductions\/\d+$/) &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const id = url.pathname.split("/").pop();

          await env.DB.prepare("DELETE FROM employee_deductions WHERE id = ?")
            .bind(id)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Deduction DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // GET: پرداخت‌های وام
      if (
        url.pathname.match(/^\/api\/loans\/\d+\/payments$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const loanId = url.pathname.split("/")[3];

          const payments = await env.DB.prepare(
            `SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY installment_number`,
          )
            .bind(loanId)
            .all();

          return new Response(JSON.stringify(payments.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Loan payments GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // جستجوی کارکنان (بر اساس کد ملی یا نام)
      // ============================================
      if (
        url.pathname === "/api/employees/search" &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const query = url.searchParams.get("q") || "";
          const limit = parseInt(url.searchParams.get("limit") || "20");

          if (!query || query.length < 2) {
            return new Response(
              JSON.stringify({
                error: "حداقل ۲ کاراکتر وارد کنید",
                results: [],
              }),
              {
                status: 400,
                headers,
              },
            );
          }

          // جستجو بر اساس کد ملی یا نام
          const searchPattern = `%${query}%`;

          const employees = await env.DB.prepare(
            `SELECT DISTINCT p.id, p.code, p.full_name, p.national_id, p.mobile,
                    (SELECT COUNT(*) FROM decrees d 
                     WHERE d.employee_person_id = p.id) as decrees_count
             FROM persons p
             WHERE p.person_type = 'employee' 
               AND p.level = 4
               AND p.is_active = 1
               AND (
                 p.national_id LIKE ? 
                 OR p.full_name LIKE ?
                 OR p.code LIKE ?
               )
             ORDER BY p.full_name
             LIMIT ?`,
          )
            .bind(searchPattern, searchPattern, searchPattern, limit)
            .all();

          return new Response(
            JSON.stringify({
              results: employees.results,
              count: employees.results.length,
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("Employees search error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Attendance API (حضور و غیاب)
      // ============================================

      // GET: لیست حضور و غیاب
      if (url.pathname === "/api/attendance" && request.method === "GET") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
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

          query +=
            " ORDER BY a.period_year DESC, a.period_month DESC, a.id DESC LIMIT 200";

          const items = await env.DB.prepare(query)
            .bind(...params)
            .all();

          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Attendance GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // GET: یک رکورد حضور و غیاب
      if (
        url.pathname.match(/^\/api\/attendance\/\d+$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const id = url.pathname.split("/").pop();

          const item = await env.DB.prepare(
            `SELECT a.*, p.full_name, p.code as person_code, p.national_id
             FROM attendance a
             LEFT JOIN persons p ON a.employee_person_id = p.id
             WHERE a.id = ?`,
          )
            .bind(id)
            .first();

          if (!item) {
            return new Response(JSON.stringify({ error: "رکورد یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          return new Response(JSON.stringify(item), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Attendance GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: افزودن/ویرایش حضور و غیاب
      if (url.pathname === "/api/attendance" && request.method === "POST") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (
            !userData ||
            !["admin", "manager", "expert"].includes(userData.role)
          ) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
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
            notes,
          } = body;

          if (!employee_person_id || !period_year || !period_month) {
            return new Response(JSON.stringify({ error: "اطلاعات ناقص" }), {
              status: 400,
              headers,
            });
          }

          const nowShamsi = toShamsi(new Date());

          if (id) {
            // UPDATE
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
              WHERE id = ?`,
            )
              .bind(
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
                id,
              )
              .run();

            return new Response(JSON.stringify({ success: true, id: id }), {
              status: 200,
              headers,
            });
          } else {
            // INSERT
            const result = await env.DB.prepare(
              `INSERT INTO attendance 
               (employee_person_id, period_year, period_month,
                working_days, absence_days, leave_days, sick_leave_days,
                overtime_hours, holiday_hours, nightshift_hours,
                mission_days_with_stay, mission_days_without_stay,
                status, notes, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`,
            )
              .bind(
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
                nowShamsi,
              )
              .run();

            return new Response(
              JSON.stringify({
                success: true,
                id: result.meta.last_row_id,
              }),
              {
                status: 201,
                headers,
              },
            );
          }
        } catch (error) {
          console.error("Attendance POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // PUT: تأیید حضور و غیاب
      if (
        url.pathname.match(/^\/api\/attendance\/\d+\/approve$/) &&
        request.method === "PUT"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const id = url.pathname.split("/")[3];
          const body = await request.json();
          const { approve_type, approved } = body;

          if (!["manager", "mayor"].includes(approve_type)) {
            return new Response(
              JSON.stringify({ error: "نوع تأیید نامعتبر" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const nowShamsi = toShamsi(new Date());

          if (approve_type === "manager") {
            await env.DB.prepare(
              `UPDATE attendance SET
                manager_approved = ?,
                manager_approved_by = ?,
                manager_approved_at = CURRENT_TIMESTAMP,
                status = ?,
                updated_at_shamsi = ?
              WHERE id = ?`,
            )
              .bind(
                approved ? 1 : 0,
                userData.userId,
                approved ? "manager_approved" : "rejected",
                nowShamsi,
                id,
              )
              .run();
          } else {
            await env.DB.prepare(
              `UPDATE attendance SET
                mayor_approved = ?,
                mayor_approved_by = ?,
                mayor_approved_at = CURRENT_TIMESTAMP,
                status = ?,
                updated_at_shamsi = ?
              WHERE id = ?`,
            )
              .bind(
                approved ? 1 : 0,
                userData.userId,
                approved ? "mayor_approved" : "rejected",
                nowShamsi,
                id,
              )
              .run();
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Attendance approve error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // DELETE: حذف رکورد
      if (
        url.pathname.match(/^\/api\/attendance\/\d+$/) &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const id = url.pathname.split("/").pop();

          await env.DB.prepare("DELETE FROM attendance WHERE id = ?")
            .bind(id)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Attendance DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Council Members API (اعضای شورای شهر)
      // ============================================

      // GET: لیست اعضای شورا
      if (url.pathname === "/api/council-members" && request.method === "GET") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const items = await env.DB.prepare(
            `SELECT * FROM council_members ORDER BY position_order, id`,
          ).all();

          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Council members GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: افزودن/ویرایش عضو شورا
      if (
        url.pathname === "/api/council-members" &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || userData.role !== "admin") {
            return new Response(JSON.stringify({ error: "فقط مدیر سیستم" }), {
              status: 403,
              headers,
            });
          }

          const body = await request.json();
          const {
            id,
            full_name,
            national_id,
            mobile,
            phone,
            position,
            position_order,
            start_date_shamsi,
            end_date_shamsi,
            address,
            email,
            notes,
            is_active,
          } = body;

          if (!full_name) {
            return new Response(JSON.stringify({ error: "نام الزامی است" }), {
              status: 400,
              headers,
            });
          }

          const nowShamsi = toShamsi(new Date());

          // municipality_info_id
          const mInfo = await env.DB.prepare(
            `SELECT id FROM municipality_info ORDER BY id DESC LIMIT 1`,
          ).first();

          const municipalityId = mInfo ? mInfo.id : null;

          if (id) {
            // UPDATE
            await env.DB.prepare(
              `UPDATE council_members SET
                full_name = ?,
                national_id = ?,
                mobile = ?,
                phone = ?,
                position = ?,
                position_order = ?,
                start_date_shamsi = ?,
                end_date_shamsi = ?,
                address = ?,
                email = ?,
                notes = ?,
                is_active = ?,
                updated_at = CURRENT_TIMESTAMP,
                updated_at_shamsi = ?
              WHERE id = ?`,
            )
              .bind(
                full_name,
                national_id || null,
                mobile || null,
                phone || null,
                position || null,
                position_order || 0,
                start_date_shamsi || null,
                end_date_shamsi || null,
                address || null,
                email || null,
                notes || null,
                is_active !== undefined ? (is_active ? 1 : 0) : 1,
                nowShamsi,
                id,
              )
              .run();

            return new Response(JSON.stringify({ success: true, id: id }), {
              status: 200,
              headers,
            });
          } else {
            // INSERT
            const result = await env.DB.prepare(
              `INSERT INTO council_members 
               (municipality_info_id, full_name, national_id, mobile, phone,
                position, position_order, start_date_shamsi, end_date_shamsi,
                address, email, notes, is_active, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
              .bind(
                municipalityId,
                full_name,
                national_id || null,
                mobile || null,
                phone || null,
                position || null,
                position_order || 0,
                start_date_shamsi || null,
                end_date_shamsi || null,
                address || null,
                email || null,
                notes || null,
                is_active !== undefined ? (is_active ? 1 : 0) : 1,
                nowShamsi,
                nowShamsi,
              )
              .run();

            return new Response(
              JSON.stringify({
                success: true,
                id: result.meta.last_row_id,
              }),
              {
                status: 201,
                headers,
              },
            );
          }
        } catch (error) {
          console.error("Council member POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // DELETE: حذف عضو شورا
      if (
        url.pathname.match(/^\/api\/council-members\/\d+$/) &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || userData.role !== "admin") {
            return new Response(JSON.stringify({ error: "فقط مدیر سیستم" }), {
              status: 403,
              headers,
            });
          }

          const id = url.pathname.split("/").pop();

          await env.DB.prepare("DELETE FROM council_members WHERE id = ?")
            .bind(id)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Council member DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Person-Organization Link API
      // ============================================

      // GET: سازمان‌های یک شخص
      if (
        url.pathname.match(/^\/api\/persons\/\d+\/organizations$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const personId = url.pathname.split("/")[3];

          const items = await env.DB.prepare(
            `SELECT po.*, bd.title as organization_title, bd.code as organization_code
             FROM person_organizations po
             LEFT JOIN base_data bd ON po.organization_id = bd.id
             WHERE po.person_id = ?
             ORDER BY po.is_primary DESC, po.id DESC`,
          )
            .bind(personId)
            .all();

          return new Response(JSON.stringify(items.results), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Person orgs GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: اتصال شخص به سازمان
      if (
        url.pathname.match(/^\/api\/persons\/\d+\/organizations$/) &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const personId = url.pathname.split("/")[3];
          const body = await request.json();
          const {
            id,
            organization_id,
            position_id,
            role,
            is_primary,
            start_date_shamsi,
            end_date_shamsi,
            notes,
          } = body;

          if (!organization_id) {
            return new Response(
              JSON.stringify({ error: "سازمان الزامی است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const nowShamsi = toShamsi(new Date());

          // اگه is_primary = true، بقیه رو false کن
          if (is_primary) {
            await env.DB.prepare(
              "UPDATE person_organizations SET is_primary = 0 WHERE person_id = ?",
            )
              .bind(personId)
              .run();
          }

          if (id) {
            // UPDATE
            await env.DB.prepare(
              `UPDATE person_organizations SET
                organization_id = ?,
                position_id = ?,
                role = ?,
                is_primary = ?,
                start_date_shamsi = ?,
                end_date_shamsi = ?,
                notes = ?
              WHERE id = ? AND person_id = ?`,
            )
              .bind(
                organization_id,
                position_id || null,
                role || null,
                is_primary ? 1 : 0,
                start_date_shamsi || null,
                end_date_shamsi || null,
                notes || null,
                id,
                personId,
              )
              .run();

            // آپدیت نقش کاربر
            if (is_primary && role) {
              try {
                const person = await env.DB.prepare(
                  "SELECT user_id FROM persons WHERE id = ?",
                )
                  .bind(personId)
                  .first();

                if (person && person.user_id) {
                  const newRole = getRoleFromPosition(role);
                  await env.DB.prepare(
                    "UPDATE users SET role = ?, organization = ? WHERE id = ?",
                  )
                    .bind(newRole, role, person.user_id)
                    .run();
                }
              } catch (roleError) {
                console.error("Update role error:", roleError);
              }
            }

            return new Response(JSON.stringify({ success: true, id: id }), {
              status: 200,
              headers,
            });
          } else {
            // INSERT
            const result = await env.DB.prepare(
              `INSERT INTO person_organizations
               (person_id, organization_id, position_id, role, is_primary,
                start_date_shamsi, end_date_shamsi, notes, created_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
              .bind(
                personId,
                organization_id,
                position_id || null,
                role || null,
                is_primary ? 1 : 0,
                start_date_shamsi || null,
                end_date_shamsi || null,
                notes || null,
                nowShamsi,
              )
              .run();

            const newPoId = result.meta.last_row_id;

            // آپدیت نقش کاربر
            if (is_primary && role) {
              try {
                const person = await env.DB.prepare(
                  "SELECT user_id FROM persons WHERE id = ?",
                )
                  .bind(personId)
                  .first();

                if (person && person.user_id) {
                  const newRole = getRoleFromPosition(role);
                  await env.DB.prepare(
                    "UPDATE users SET role = ?, organization = ? WHERE id = ?",
                  )
                    .bind(newRole, role, person.user_id)
                    .run();
                }
              } catch (roleError) {
                console.error("Update role error:", roleError);
              }
            }

            return new Response(
              JSON.stringify({
                success: true,
                id: newPoId,
              }),
              {
                status: 201,
                headers,
              },
            );
          }
        } catch (error) {
          console.error("Person org POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // DELETE: حذف اتصال
      if (
        url.pathname.match(/^\/api\/person-organizations\/\d+$/) &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const id = url.pathname.split("/").pop();

          await env.DB.prepare("DELETE FROM person_organizations WHERE id = ?")
            .bind(id)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Person org DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // POST: ساخت کاربر برای شخص (Mock SMS)
      // ============================================
      if (
        url.pathname.match(/^\/api\/persons\/\d+\/create-user$/) &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const personId = url.pathname.split("/")[3];

          // لود شخص
          const person = await env.DB.prepare(
            "SELECT id, full_name, national_id, mobile FROM persons WHERE id = ?",
          )
            .bind(personId)
            .first();

          if (!person) {
            return new Response(JSON.stringify({ error: "شخص یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          if (!person.national_id) {
            return new Response(JSON.stringify({ error: "کد ملی ثبت نشده" }), {
              status: 400,
              headers,
            });
          }

          if (!person.mobile) {
            return new Response(
              JSON.stringify({ error: "شماره موبایل ثبت نشده" }),
              {
                status: 400,
                headers,
              },
            );
          }

          // چک: کاربر قبلاً ساخته شده؟
          const existingUser = await env.DB.prepare(
            "SELECT id FROM users WHERE username = ?",
          )
            .bind(person.national_id)
            .first();

          if (existingUser) {
            return new Response(
              JSON.stringify({ error: "این کاربر قبلاً ساخته شده" }),
              {
                status: 400,
                headers,
              },
            );
          }

          // پست سازمانی اصلی
          const primaryOrg = await env.DB.prepare(
            `SELECT role FROM person_organizations 
             WHERE person_id = ? AND is_primary = 1 LIMIT 1`,
          )
            .bind(personId)
            .first();

          const position = primaryOrg ? primaryOrg.role : null;
          const role = getRoleFromPosition(position);

          // پسورد تصادفی
          const tempPassword = generateRandomPassword(8);

          // ساخت کاربر
          const passwordHash = await hashPassword(tempPassword);

          const nowShamsi = toShamsi(new Date());

          const result = await env.DB.prepare(
            `INSERT INTO users (username, password_hash, full_name, role, organization, is_active)
             VALUES (?, ?, ?, ?, ?, 1)`,
          )
            .bind(
              person.national_id,
              passwordHash,
              person.full_name,
              role,
              position || null,
            )
            .run();

          const userId = result.meta.last_row_id;

          // آپدیت person.user_id
          await env.DB.prepare("UPDATE persons SET user_id = ? WHERE id = ?")
            .bind(userId, personId)
            .run();

          // ثبت در log (mock SMS)
          await env.DB.prepare(
            `INSERT INTO user_creation_log
             (person_id, national_id, username, temp_password, mobile, status, created_at_shamsi)
             VALUES (?, ?, ?, ?, ?, 'created', ?)`,
          )
            .bind(
              personId,
              person.national_id,
              person.national_id,
              tempPassword,
              person.mobile,
              nowShamsi,
            )
            .run();

          // ============================================
          // Mock SMS: نمایش پسورد
          // ============================================
          console.log(`📱 [MOCK SMS] به ${person.mobile}:`);
          console.log(`   نام کاربری: ${person.national_id}`);
          console.log(`   رمز عبور: ${tempPassword}`);
          console.log(`   نقش: ${role}`);

          return new Response(
            JSON.stringify({
              success: true,
              user_id: userId,
              username: person.national_id,
              temp_password: tempPassword, // ⚠️ فقط در حالت mock
              role: role,
              position: position,
              mobile: person.mobile,
              message: "کاربر ساخته شد و رمز (mock) به موبایل ارسال شد",
            }),
            {
              status: 201,
              headers,
            },
          );
        } catch (error) {
          console.error("Create user error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // GET: آیا این شخص کاربر داره؟
      // ============================================
      if (
        url.pathname.match(/^\/api\/persons\/\d+\/user-status$/) &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const personId = url.pathname.split("/")[3];

          const person = await env.DB.prepare(
            `SELECT p.id, p.national_id, p.user_id,
                    u.username, u.role, u.is_active
             FROM persons p
             LEFT JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
          )
            .bind(personId)
            .first();

          if (!person) {
            return new Response(JSON.stringify({ error: "شخص یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          // آخرین log
          const lastLog = await env.DB.prepare(
            `SELECT * FROM user_creation_log 
             WHERE person_id = ? 
             ORDER BY id DESC LIMIT 1`,
          )
            .bind(personId)
            .first();

          return new Response(
            JSON.stringify({
              has_user: !!person.user_id,
              user_id: person.user_id,
              username: person.username,
              role: person.role,
              is_active: person.is_active,
              last_creation: lastLog,
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          console.error("User status error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // ساخت کاربر برای یه شخص خاص
      // ============================================
      if (
        url.pathname.match(/^\/api\/persons\/\d+\/fix-user$/) &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || userData.role !== "admin") {
            return new Response(JSON.stringify({ error: "فقط مدیر سیستم" }), {
              status: 403,
              headers,
            });
          }

          const personId = url.pathname.split("/")[3];

          const person = await env.DB.prepare(
            "SELECT id, full_name, national_id, mobile FROM persons WHERE id = ?",
          )
            .bind(personId)
            .first();

          if (!person) {
            return new Response(JSON.stringify({ error: "شخص یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          if (!person.national_id) {
            return new Response(JSON.stringify({ error: "کد ملی ثبت نشده" }), {
              status: 400,
              headers,
            });
          }

          // چک وجود کاربر
          const existing = await env.DB.prepare(
            "SELECT id FROM users WHERE username = ?",
          )
            .bind(person.national_id)
            .first();

          let userId;
          if (existing) {
            userId = existing.id;
          } else {
            const result = await env.DB.prepare(
              `INSERT INTO users 
               (username, password_hash, full_name, role, organization, is_active, mobile)
               VALUES (?, 'OTP_ONLY', ?, 'viewer', NULL, 1, ?)`,
            )
              .bind(person.national_id, person.full_name, person.mobile || null)
              .run();

            userId = result.meta.last_row_id;
          }

          // link
          await env.DB.prepare("UPDATE persons SET user_id = ? WHERE id = ?")
            .bind(userId, personId)
            .run();

          return new Response(
            JSON.stringify({
              success: true,
              user_id: userId,
              username: person.national_id,
              message: "کاربر با موفقیت ساخته/لینک شد",
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // Org Positions API (پست‌های سازمانی)
      // ============================================

      // GET: پست‌های یک سازمان
      if (url.pathname === "/api/org-positions" && request.method === "GET") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          const orgId = url.searchParams.get("organization_id");

          let query = `SELECT op.*, bd.title as org_title, bd.code as org_code
                       FROM org_positions op
                       LEFT JOIN base_data bd ON op.organization_id = bd.id
                       WHERE op.is_active = 1`;
          const params = [];

          if (orgId) {
            query += " AND op.organization_id = ?";
            params.push(orgId);
          }

          query += " ORDER BY op.organization_id, op.position_order, op.id";

          const items = await env.DB.prepare(query)
            .bind(...params)
            .all();

          // برای هر پست، شخص متصل رو بگیر
          const enriched = [];
          for (const pos of items.results) {
            const assignment = await env.DB.prepare(
              `SELECT po.id as po_id, po.person_id, p.full_name, p.national_id
               FROM person_organizations po
               LEFT JOIN persons p ON po.person_id = p.id
               WHERE po.organization_id = ? AND po.position_id = ?
               LIMIT 1`,
            )
              .bind(pos.organization_id, pos.id)
              .first();

            enriched.push({
              ...pos,
              assigned_person: assignment || null,
            });
          }

          return new Response(JSON.stringify(enriched), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Org positions GET error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // POST: افزودن/ویرایش پست
      if (url.pathname === "/api/org-positions" && request.method === "POST") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const body = await request.json();
          const {
            id,
            organization_id,
            position_code,
            position_title,
            position_level,
            position_order,
            is_primary,
            description,
            is_active,
          } = body;

          if (!organization_id || !position_title) {
            return new Response(
              JSON.stringify({ error: "سازمان و عنوان پست الزامی است" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const nowShamsi = toShamsi(new Date());

          if (id) {
            await env.DB.prepare(
              `UPDATE org_positions SET
                organization_id = ?,
                position_code = ?,
                position_title = ?,
                position_level = ?,
                position_order = ?,
                is_primary = ?,
                description = ?,
                is_active = ?,
                updated_at = CURRENT_TIMESTAMP,
                updated_at_shamsi = ?
              WHERE id = ?`,
            )
              .bind(
                organization_id,
                position_code || null,
                position_title,
                position_level || 0,
                position_order || 0,
                is_primary ? 1 : 0,
                description || null,
                is_active !== undefined ? (is_active ? 1 : 0) : 1,
                nowShamsi,
                id,
              )
              .run();

            return new Response(JSON.stringify({ success: true, id: id }), {
              status: 200,
              headers,
            });
          } else {
            const result = await env.DB.prepare(
              `INSERT INTO org_positions 
               (organization_id, position_code, position_title, position_level,
                position_order, is_primary, description, is_active, created_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
              .bind(
                organization_id,
                position_code || null,
                position_title,
                position_level || 0,
                position_order || 0,
                is_primary ? 1 : 0,
                description || null,
                is_active !== undefined ? (is_active ? 1 : 0) : 1,
                nowShamsi,
              )
              .run();

            return new Response(
              JSON.stringify({
                success: true,
                id: result.meta.last_row_id,
              }),
              {
                status: 201,
                headers,
              },
            );
          }
        } catch (error) {
          console.error("Org position POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // DELETE: حذف پست
      if (
        url.pathname.match(/^\/api\/org-positions\/\d+$/) &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const id = url.pathname.split("/").pop();

          // چک: شخصی به این پست وصله؟
          const assigned = await env.DB.prepare(
            "SELECT COUNT(*) as cnt FROM person_organizations WHERE position_id = ?",
          )
            .bind(id)
            .first();

          if (assigned.cnt > 0) {
            return new Response(
              JSON.stringify({
                error: `این پست ${assigned.cnt} شخص متصل دارد. ابتدا اتصال‌ها را حذف کنید.`,
              }),
              {
                status: 400,
                headers,
              },
            );
          }

          await env.DB.prepare("DELETE FROM org_positions WHERE id = ?")
            .bind(id)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Org position DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // GET: فلوچارت سازمانی (کامل)
      // ============================================
      if (
        url.pathname === "/api/organizations-chart" &&
        request.method === "GET"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData) {
            return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
              status: 401,
              headers,
            });
          }

          // ۱. همه سازمان‌ها
          const orgs = await env.DB.prepare(
            `SELECT id, code, title, parent_id, level, level_name, sort_order
             FROM base_data 
             WHERE section = 'organization' AND is_active = 1
             ORDER BY code`,
          ).all();

          // ۲. همه پست‌ها
          const positions = await env.DB.prepare(
            `SELECT * FROM org_positions WHERE is_active = 1 ORDER BY position_order, id`,
          ).all();

          // ۳. همه اتصالات (شخص به سازمان+پست)
          const assignments = await env.DB.prepare(
            `SELECT po.id as po_id, po.person_id, po.organization_id, po.position_id,
                    po.role, po.is_primary,
                    p.full_name, p.national_id, p.mobile, p.code as person_code
             FROM person_organizations po
             LEFT JOIN persons p ON po.person_id = p.id`,
          ).all();

          // ۴. ساختار درختی + پست‌ها
          const orgMap = {};
          const roots = [];

          orgs.results.forEach((org) => {
            orgMap[org.id] = {
              ...org,
              positions: [],
              children: [],
            };
          });

          // تخصیص پست‌ها به سازمان‌ها
          positions.results.forEach((pos) => {
            if (orgMap[pos.organization_id]) {
              // شخص متصل به این پست
              const assigned = assignments.results.find(
                (a) =>
                  a.organization_id === pos.organization_id &&
                  a.position_id === pos.id,
              );

              orgMap[pos.organization_id].positions.push({
                id: pos.id,
                position_code: pos.position_code,
                position_title: pos.position_title,
                position_level: pos.position_level,
                position_order: pos.position_order,
                is_primary: pos.is_primary,
                assigned_person: assigned
                  ? {
                    person_id: assigned.person_id,
                    full_name: assigned.full_name,
                    national_id: assigned.national_id,
                    person_code: assigned.person_code,
                    mobile: assigned.mobile,
                  }
                  : null,
              });
            }
          });

          // ساخت درخت
          orgs.results.forEach((org) => {
            if (org.parent_id && orgMap[org.parent_id]) {
              orgMap[org.parent_id].children.push(orgMap[org.id]);
            } else {
              roots.push(orgMap[org.id]);
            }
          });

          return new Response(JSON.stringify(roots), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Org chart error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // PUT: اتصال شخص به پست خاص
      // ============================================
      if (
        url.pathname === "/api/person-organizations/assign-position" &&
        request.method === "PUT"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const body = await request.json();
          const { person_id, organization_id, position_id, role } = body;

          if (!person_id || !organization_id || !position_id) {
            return new Response(JSON.stringify({ error: "اطلاعات ناقص" }), {
              status: 400,
              headers,
            });
          }

          // چک: پست قبلاً به کسی داده شده؟
          const existing = await env.DB.prepare(
            `SELECT id FROM person_organizations 
             WHERE organization_id = ? AND position_id = ? AND person_id != ?`,
          )
            .bind(organization_id, position_id, person_id)
            .first();

          if (existing) {
            return new Response(
              JSON.stringify({
                error: "این پست قبلاً به شخص دیگری اختصاص یافته است",
              }),
              {
                status: 400,
                headers,
              },
            );
          }

          // چک: این شخص قبلاً به این سازمان+پست وصله؟
          const already = await env.DB.prepare(
            `SELECT id FROM person_organizations 
             WHERE person_id = ? AND organization_id = ? AND position_id = ?`,
          )
            .bind(person_id, organization_id, position_id)
            .first();

          if (already) {
            // فقط role رو آپدیت کن
            await env.DB.prepare(
              "UPDATE person_organizations SET role = ? WHERE id = ?",
            )
              .bind(role || null, already.id)
              .run();

            return new Response(
              JSON.stringify({ success: true, id: already.id }),
              {
                status: 200,
                headers,
              },
            );
          }

          const nowShamsi = toShamsi(new Date());

          const result = await env.DB.prepare(
            `INSERT INTO person_organizations 
             (person_id, organization_id, position_id, role, is_primary, created_at_shamsi)
             VALUES (?, ?, ?, ?, 0, ?)`,
          )
            .bind(
              person_id,
              organization_id,
              position_id,
              role || null,
              nowShamsi,
            )
            .run();

          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
            }),
            {
              status: 201,
              headers,
            },
          );
        } catch (error) {
          console.error("Assign position error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // PUT: حذف اتصال شخص از پست
      // ============================================
      if (
        url.pathname.match(/^\/api\/person-organizations\/\d+\/unassign$/) &&
        request.method === "PUT"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const poId = url.pathname.split("/")[3];

          await env.DB.prepare(
            "UPDATE person_organizations SET position_id = NULL WHERE id = ?",
          )
            .bind(poId)
            .run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Unassign error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ========== مدیریت کاربران ==========

      // دریافت لیست کاربران
      if (url.pathname === "/api/users" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "احراز هویت لازم است" }),
            {
              status: 401,
              headers,
            },
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData) {
          return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
            status: 401,
            headers,
          });
        }

        // چک Permission
        const hasAccess = await checkPermission(
          env,
          userData.userId,
          "users.view",
        );
        if (!hasAccess) {
          return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
            status: 403,
            headers,
          });
        }

        const users = await env.DB.prepare(
          "SELECT id, username, full_name, role, organization, is_active, created_at FROM users ORDER BY created_at DESC",
        ).all();

        return new Response(JSON.stringify(users.results), {
          status: 200,
          headers,
        });
      }

      // ساخت کاربر جدید
      if (url.pathname === "/api/users" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "احراز هویت لازم است" }),
            {
              status: 401,
              headers,
            },
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData || userData.role !== "admin") {
          return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
            status: 403,
            headers,
          });
        }

        const { username, password, full_name, role, organization } =
          await request.json();

        if (!username || !password || !full_name || !role) {
          return new Response(
            JSON.stringify({ error: "همه فیلدهای الزامی را پر کنید" }),
            {
              status: 400,
              headers,
            },
          );
        }

        // هش پسورد
        const password_hash = await hashPassword(password);

        try {
          const result = await env.DB.prepare(
            `
            INSERT INTO users (username, password_hash, full_name, role, organization)
            VALUES (?, ?, ?, ?, ?)
          `,
          )
            .bind(
              username,
              password_hash,
              full_name,
              role,
              organization || null,
            )
            .run();

          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
            }),
            { status: 201, headers },
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "نام کاربری تکراری است" }),
            {
              status: 400,
              headers,
            },
          );
        }
      }

      // ویرایش کاربر
      if (url.pathname.startsWith("/api/users/") && request.method === "PUT") {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "احراز هویت لازم است" }),
            {
              status: 401,
              headers,
            },
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData || userData.role !== "admin") {
          return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
            status: 403,
            headers,
          });
        }

        const id = url.pathname.split("/").pop();
        const { full_name, role, organization, is_active, password } =
          await request.json();

        if (password) {
          const password_hash = await hashPassword(password);
          await env.DB.prepare(
            `
            UPDATE users SET full_name = ?, role = ?, organization = ?, is_active = ?, password_hash = ?
            WHERE id = ?
          `,
          )
            .bind(
              full_name,
              role,
              organization || null,
              is_active ? 1 : 0,
              password_hash,
              id,
            )
            .run();
        } else {
          await env.DB.prepare(
            `
            UPDATE users SET full_name = ?, role = ?, organization = ?, is_active = ?
            WHERE id = ?
          `,
          )
            .bind(full_name, role, organization || null, is_active ? 1 : 0, id)
            .run();
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // حذف کاربر
      if (
        url.pathname.startsWith("/api/users/") &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              {
                status: 401,
                headers,
              },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || userData.role !== "admin") {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const id = url.pathname.split("/").pop();

          // جلوگیری از حذف خود
          if (parseInt(id) === userData.userId) {
            return new Response(
              JSON.stringify({ error: "نمی‌توانید خودتان را حذف کنید" }),
              {
                status: 400,
                headers,
              },
            );
          }

          // بررسی وابستگی‌ها
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
          `,
          )
            .bind(id, id, id, id)
            .first();

          // اگه وابستگی داره، فقط غیرفعال کن
          if (
            dependencies.budget_count > 0 ||
            dependencies.approval_count > 0 ||
            dependencies.revision_count > 0 ||
            dependencies.audit_count > 0
          ) {
            await env.DB.prepare("UPDATE users SET is_active = 0 WHERE id = ?")
              .bind(id)
              .run();

            return new Response(
              JSON.stringify({
                success: true,
                message: "کاربر به دلیل داشتن سوابق، غیرفعال شد",
                deactivated: true,
              }),
              { status: 200, headers },
            );
          }

          // اگه وابستگی نداره، حذف کن
          await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();

          return new Response(
            JSON.stringify({
              success: true,
              message: "کاربر حذف شد",
              deleted: true,
            }),
            { status: 200, headers },
          );
        } catch (error) {
          console.error("Delete user error:", error.message);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ========== اصلاح بودجه ==========

      // دریافت لیست اصلاحات
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

        const items = await env.DB.prepare(query)
          .bind(...params)
          .all();

        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers,
        });
      }

      // ثبت اصلاح جدید
      if (url.pathname === "/api/revisions" && request.method === "POST") {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData) {
          return new Response(JSON.stringify({ error: "توکن نامعتبر" }), {
            status: 401,
            headers,
          });
        }

        const {
          fiscal_year_id,
          budget_proposal_id,
          revision_type,
          new_amount,
          reason,
        } = await request.json();

        if (!fiscal_year_id || !revision_type || !reason) {
          return new Response(
            JSON.stringify({ error: "همه فیلدهای الزامی را پر کنید" }),
            {
              status: 400,
              headers,
            },
          );
        }

        let old_amount = 0;
        let difference = 0;

        // برای increase/decrease/remove باید budget_proposal_id باشه
        if (revision_type !== "add") {
          if (!budget_proposal_id) {
            return new Response(
              JSON.stringify({ error: "بودجه را انتخاب کنید" }),
              {
                status: 400,
                headers,
              },
            );
          }

          const budget = await env.DB.prepare(
            "SELECT amount FROM budget_proposals WHERE id = ?",
          )
            .bind(budget_proposal_id)
            .first();

          if (!budget) {
            return new Response(JSON.stringify({ error: "بودجه یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          old_amount = budget.amount;

          if (revision_type === "increase") {
            if (!new_amount || new_amount <= 0) {
              return new Response(
                JSON.stringify({ error: "مبلغ افزایش الزامی است" }),
                {
                  status: 400,
                  headers,
                },
              );
            }
            difference = parseFloat(new_amount);
          } else if (revision_type === "decrease") {
            if (!new_amount || new_amount <= 0) {
              return new Response(
                JSON.stringify({ error: "مبلغ کاهش الزامی است" }),
                {
                  status: 400,
                  headers,
                },
              );
            }
            difference = -parseFloat(new_amount);
          } else if (revision_type === "remove") {
            difference = -old_amount;
          } else if (revision_type === "add") {
            difference = parseFloat(new_amount);
          }
        } else {
          // add
          if (!new_amount || new_amount <= 0) {
            return new Response(JSON.stringify({ error: "مبلغ الزامی است" }), {
              status: 400,
              headers,
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
          `,
          )
            .bind(
              fiscal_year_id,
              budget_proposal_id || null,
              revision_type,
              old_amount,
              new_amount || null,
              difference,
              reason,
              userData.userId,
            )
            .run();

          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
            }),
            { status: 201, headers },
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "خطا در ثبت: " + error.message }),
            {
              status: 400,
              headers,
            },
          );
        }
      }

      // تایید یا رد اصلاح
      if (
        url.pathname === "/api/revisions/approve" &&
        request.method === "PUT"
      ) {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData || !["admin", "manager"].includes(userData.role)) {
          return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
            status: 403,
            headers,
          });
        }

        const { id, status } = await request.json();

        if (!id || !["approved", "rejected"].includes(status)) {
          return new Response(JSON.stringify({ error: "اطلاعات ناقص" }), {
            status: 400,
            headers,
          });
        }

        // اگر تایید شد، تغییرات رو اعمال کن
        if (status === "approved") {
          const revision = await env.DB.prepare(
            "SELECT * FROM budget_revisions WHERE id = ?",
          )
            .bind(id)
            .first();

          if (!revision) {
            return new Response(JSON.stringify({ error: "اصلاح یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          if (revision.status !== "pending") {
            return new Response(
              JSON.stringify({ error: "این اصلاح قبلاً بررسی شده" }),
              {
                status: 400,
                headers,
              },
            );
          }

          // اعمال تغییرات
          if (revision.revision_type === "add") {
            // ردیف جدید اضافه کن
            await env.DB.prepare(
              `
              INSERT INTO budget_proposals 
              (fiscal_year_id, organization_id, economic_class_id, title, amount, status, proposed_by)
              VALUES (?, ?, ?, ?, ?, 'approved', ?)
            `,
            )
              .bind(
                revision.fiscal_year_id,
                1, // پیش‌فرض
                1, // پیش‌فرض
                "ردیف جدید (اصلاح بودجه)",
                revision.new_amount,
                revision.created_by,
              )
              .run();
          } else if (revision.revision_type === "increase") {
            // مبلغ جدید = مبلغ فعلی بودجه + مبلغ افزایش
            const currentBudget = await env.DB.prepare(
              "SELECT amount FROM budget_proposals WHERE id = ?",
            )
              .bind(revision.budget_proposal_id)
              .first();

            const newTotal = currentBudget.amount + revision.new_amount;
            await env.DB.prepare(
              `
              UPDATE budget_proposals SET amount = ? WHERE id = ?
            `,
            )
              .bind(newTotal, revision.budget_proposal_id)
              .run();
          } else if (revision.revision_type === "decrease") {
            // مبلغ جدید = مبلغ فعلی بودجه - مبلغ کاهش
            const currentBudget = await env.DB.prepare(
              "SELECT amount FROM budget_proposals WHERE id = ?",
            )
              .bind(revision.budget_proposal_id)
              .first();

            const newTotal = currentBudget.amount - revision.new_amount;
            await env.DB.prepare(
              `
              UPDATE budget_proposals SET amount = ? WHERE id = ?
            `,
            )
              .bind(newTotal, revision.budget_proposal_id)
              .run();
          }
        }

        // آپدیت وضعیت
        await env.DB.prepare(
          `
          UPDATE budget_revisions 
          SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        )
          .bind(status, userData.userId, id)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // ========== گزارش پیشرفته ==========

      // گزارش مبسوط
      if (
        url.pathname === "/api/reports/detailed-form" &&
        request.method === "GET"
      ) {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");

        if (!fiscalYearId) {
          return new Response(
            JSON.stringify({ error: "سال مالی الزامی است" }),
            {
              status: 400,
              headers,
            },
          );
        }

        // اطلاعات سال مالی
        const fiscalYear = await env.DB.prepare(
          "SELECT * FROM fiscal_years WHERE id = ?",
        )
          .bind(fiscalYearId)
          .first();

        // جمع کل بر اساس نوع
        const byType = await env.DB.prepare(
          `
          SELECT ec.type, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ? AND bp.status = 'approved'
          GROUP BY ec.type
        `,
        )
          .bind(fiscalYearId)
          .all();

        // بر اساس طبقه‌بندی اقتصادی (سرفصل)
        const byMainCode = await env.DB.prepare(
          `
          SELECT ec.main_code, ec.chapter_code, ec.sub_code, ec.title, 
                 ec.type, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ? AND bp.status = 'approved'
          GROUP BY ec.sub_code
          ORDER BY ec.main_code, ec.chapter_code, ec.sub_code
        `,
        )
          .bind(fiscalYearId)
          .all();

        // بر اساس سازمان
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
        `,
        )
          .bind(fiscalYearId)
          .all();

        // جمع کل
        const grandTotal = await env.DB.prepare(
          `
          SELECT SUM(amount) as total, COUNT(*) as count
          FROM budget_proposals
          WHERE fiscal_year_id = ? AND status = 'approved'
        `,
        )
          .bind(fiscalYearId)
          .first();

        return new Response(
          JSON.stringify({
            fiscalYear,
            byType: byType.results,
            byMainCode: byMainCode.results,
            byOrganization: byOrganization.results,
            grandTotal,
          }),
          { status: 200, headers },
        );
      }

      // گزارش تفصیلی پروژه‌ها
      if (
        url.pathname === "/api/reports/projects" &&
        request.method === "GET"
      ) {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");

        if (!fiscalYearId) {
          return new Response(
            JSON.stringify({ error: "سال مالی الزامی است" }),
            {
              status: 400,
              headers,
            },
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
        `,
        )
          .bind(fiscalYearId)
          .all();

        return new Response(JSON.stringify(projects.results), {
          status: 200,
          headers,
        });
      }

      // گزارش مقایسه‌ای (دو سال مالی)
      if (
        url.pathname === "/api/reports/comparison" &&
        request.method === "GET"
      ) {
        const fiscalYear1 = url.searchParams.get("year1");
        const fiscalYear2 = url.searchParams.get("year2");

        if (!fiscalYear1 || !fiscalYear2) {
          return new Response(
            JSON.stringify({ error: "دو سال مالی الزامی است" }),
            {
              status: 400,
              headers,
            },
          );
        }

        // جمع کل هر سال
        const year1Total = await env.DB.prepare(
          `
          SELECT SUM(amount) as total, COUNT(*) as count
          FROM budget_proposals
          WHERE fiscal_year_id = ? AND status = 'approved'
        `,
        )
          .bind(fiscalYear1)
          .first();

        const year2Total = await env.DB.prepare(
          `
          SELECT SUM(amount) as total, COUNT(*) as count
          FROM budget_proposals
          WHERE fiscal_year_id = ? AND status = 'approved'
        `,
        )
          .bind(fiscalYear2)
          .first();

        // جزئیات هر سال
        const year1Details = await env.DB.prepare(
          `
          SELECT ec.sub_code, ec.title, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ? AND bp.status = 'approved'
          GROUP BY ec.sub_code
          ORDER BY ec.sub_code
        `,
        )
          .bind(fiscalYear1)
          .all();

        const year2Details = await env.DB.prepare(
          `
          SELECT ec.sub_code, ec.title, SUM(bp.amount) as total
          FROM budget_proposals bp
          LEFT JOIN economic_classifications ec ON bp.economic_class_id = ec.id
          WHERE bp.fiscal_year_id = ? AND bp.status = 'approved'
          GROUP BY ec.sub_code
          ORDER BY ec.sub_code
        `,
        )
          .bind(fiscalYear2)
          .all();

        return new Response(
          JSON.stringify({
            year1: { total: year1Total, details: year1Details.results },
            year2: { total: year2Total, details: year2Details.results },
          }),
          { status: 200, headers },
        );
      }

      // ========== تفریغ بودجه ==========

      // گزارش تفریغ
      if (url.pathname === "/api/reports/tafriq" && request.method === "GET") {
        const fiscalYearId = url.searchParams.get("fiscal_year_id");

        if (!fiscalYearId) {
          return new Response(
            JSON.stringify({ error: "سال مالی الزامی است" }),
            {
              status: 400,
              headers,
            },
          );
        }

        // دریافت همه بودجه‌های مصوب
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
        `,
        )
          .bind(fiscalYearId)
          .all();

        // برای هر بودجه، تخصیص و تامین اعتبار رو حساب کن
        const details = [];
        let totalApproved = 0;
        let totalAllocated = 0;
        let totalExecuted = 0;

        for (const budget of budgets.results) {
          // جمع تخصیص‌ها
          const allocation = await env.DB.prepare(
            `
            SELECT SUM(amount) as total FROM budget_allocations
            WHERE approved_budget_id = ?
          `,
          )
            .bind(budget.id)
            .first();

          const allocatedAmount = allocation.total || 0;

          // جمع تامین اعتبارها (از طریق تخصیص)
          const execution = await env.DB.prepare(
            `
            SELECT SUM(be.amount) as total 
            FROM budget_executions be
            LEFT JOIN budget_allocations ba ON be.allocation_id = ba.id
            WHERE ba.approved_budget_id = ?
          `,
          )
            .bind(budget.id)
            .first();

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
            allocation_percentage:
              budget.approved_amount > 0
                ? ((allocatedAmount / budget.approved_amount) * 100).toFixed(2)
                : 0,
            execution_percentage:
              budget.approved_amount > 0
                ? ((executedAmount / budget.approved_amount) * 100).toFixed(2)
                : 0,
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
              overall_execution_percentage:
                totalApproved > 0
                  ? ((totalExecuted / totalApproved) * 100).toFixed(2)
                  : 0,
            },
          }),
          { status: 200, headers },
        );
      }

      // بستن سال مالی (تغییر وضعیت)
      if (
        url.pathname === "/api/fiscal-years/close" &&
        request.method === "PUT"
      ) {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData || userData.role !== "admin") {
          return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
            status: 403,
            headers,
          });
        }

        const { year } = await request.json();

        await env.DB.prepare(
          `
          UPDATE fiscal_years SET status = 'closed' WHERE year = ?
        `,
        )
          .bind(year)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers,
        });
      }

      // ========== لاگ سیستم ==========

      // دریافت لاگ‌ها
      if (url.pathname === "/api/audit-log" && request.method === "GET") {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        if (!userData || !["admin", "manager"].includes(userData.role)) {
          return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
            status: 403,
            headers,
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

        const logs = await env.DB.prepare(query)
          .bind(...params)
          .all();

        return new Response(JSON.stringify(logs.results), {
          status: 200,
          headers,
        });
      }

      // ========== مشخصات شهرداری ==========

      // دریافت مشخصات
      if (
        url.pathname === "/api/municipality-info" &&
        request.method === "GET"
      ) {
        const info = await env.DB.prepare(
          "SELECT * FROM municipality_info ORDER BY id DESC LIMIT 1",
        ).first();

        return new Response(JSON.stringify(info || {}), {
          status: 200,
          headers,
        });
      }

      // ذخیره مشخصات (ثبت یا ویرایش)
      if (
        url.pathname === "/api/municipality-info" &&
        request.method === "POST"
      ) {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "احراز هویت لازم است" }),
            {
              status: 401,
              headers,
            },
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const userData = await verifyToken(token, env.JWT_SECRET);

        const hasAccess = await checkPermission(
          env,
          userData.userId,
          "municipality_info.edit",
        );
        if (!hasAccess) {
          return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
            status: 403,
            headers,
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
          execution_signers,
        } = body;

        if (!title) {
          return new Response(
            JSON.stringify({ error: "عنوان شهرداری الزامی است" }),
            {
              status: 400,
              headers,
            },
          );
        }

        // بررسی وجود رکورد
        const existing = await env.DB.prepare(
          "SELECT id FROM municipality_info LIMIT 1",
        ).first();

        if (existing) {
          // ویرایش
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
          `,
          )
            .bind(
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
              existing.id,
            )
            .run();

          // ثبت لاگ
          ctx.waitUntil(
            logAction(
              env,
              request,
              userData,
              "municipality_info_updated",
              "municipality_info",
              existing.id,
              { title },
            ),
          );

          return new Response(
            JSON.stringify({
              success: true,
              id: existing.id,
              action: "updated",
            }),
            {
              status: 200,
              headers,
            },
          );
        } else {
          // ثبت جدید
          const result = await env.DB.prepare(
            `
            INSERT INTO municipality_info (
              province, county, city,
              title, grade, address, postal_code, economic_code, national_id,
              mayor_name, mayor_details,
              finance_signers, treasury_signers, allocation_signers, execution_signers
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          )
            .bind(
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
            )
            .run();

          // ثبت لاگ
          ctx.waitUntil(
            logAction(
              env,
              request,
              userData,
              "municipality_info_created",
              "municipality_info",
              result.meta.last_row_id,
              { title },
            ),
          );

          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
              action: "created",
            }),
            {
              status: 201,
              headers,
            },
          );
        }
      }

      // ========== Base Data (ساختارهای درختی) ==========

      // GET: لیست با فیلتر
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
        if (isActive !== null && isActive !== undefined && isActive !== "") {
          query += " AND is_active = ?";
          params.push(isActive === "1" || isActive === "true" ? 1 : 0);
        }

        query += " ORDER BY section, type, code";

        const items = await env.DB.prepare(query)
          .bind(...params)
          .all();

        return new Response(JSON.stringify(items.results), {
          status: 200,
          headers,
        });
      }

      // GET: درخت
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

        const items = await env.DB.prepare(query)
          .bind(...params)
          .all();
        const tree = buildTree(items.results);

        return new Response(JSON.stringify(tree), {
          status: 200,
          headers,
        });
      }

      // GET: کد بعدی
      if (
        url.pathname === "/api/base-data/next-code" &&
        request.method === "GET"
      ) {
        try {
          const section = url.searchParams.get("section");
          const type = url.searchParams.get("type");
          const parentId = url.searchParams.get("parent_id");
          const digitCount = parseInt(
            url.searchParams.get("digit_count") || "3",
          );
          const prefix = url.searchParams.get("prefix");

          if (!section) {
            return new Response(
              JSON.stringify({ error: "section الزامی است" }),
              { status: 400, headers },
            );
          }

          const nextCode = await generateNextCode(env, {
            section,
            type,
            parent_id: parentId ? parseInt(parentId) : null,
            digit_count: digitCount,
            prefix,
          });

          return new Response(JSON.stringify({ next_code: nextCode }), {
            status: 200,
            headers,
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers,
          });
        }
      }

      // ============================================
      // POST: ایمپورت فایل اکسل مستقیم
      // ============================================
      if (
        url.pathname === "/api/base-data/import-excel" &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              { status: 401, headers },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const formData = await request.formData();
          const file = formData.get("file");
          const section = formData.get("section");
          const type = formData.get("type"); // 'resource' یا 'expense'

          if (!file || !section || !type) {
            return new Response(
              JSON.stringify({ error: "فایل یا اطلاعات ناقص است" }),
              { status: 400, headers },
            );
          }

          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });

          // ✅ اعتبارسنجی ۱: آیا فایل شیت داره؟
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            return new Response(
              JSON.stringify({ error: "فایل اکسل خالی است یا معتبر نیست." }),
              { status: 400, headers },
            );
          }

          // ✅ اعتبارسنجی ۲: آیا شیت متناسب با نوع پیدا میشه؟
          let sheetsToRead = [];
          if (type === "resource") {
            sheetsToRead = workbook.SheetNames.filter((n) =>
              n.includes("منابع"),
            );
          } else {
            sheetsToRead = workbook.SheetNames.filter((n) =>
              n.includes("مصارف"),
            );
          }

          if (sheetsToRead.length === 0) {
            return new Response(
              JSON.stringify({
                error: `هیچ شیتی با کلمه «${type === "resource" ? "منابع" : "مصارف"
                  }» در فایل پیدا نشد. لطفاً از فایل نمونه استفاده کنید.`,
              }),
              { status: 400, headers },
            );
          }

          // ✅ اعتبارسنجی ۳: آیا شیت‌ها ساختار درست (۲ ستون) دارن؟
          for (const sheetName of sheetsToRead) {
            const ws = workbook.Sheets[sheetName];
            const testRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
            if (
              !testRows ||
              testRows.length < 2 ||
              !testRows[0] ||
              testRows[0].length < 2
            ) {
              return new Response(
                JSON.stringify({
                  error: `ساختار شیت «${sheetName}» نامعتبر است. ستون‌ها باید شامل «کد طبقه‌بندی» و «عنوان» باشند.`,
                }),
                { status: 400, headers },
              );
            }
          }

          // استخراج داده‌ها
          let rawItems = [];
          for (const sheetName of sheetsToRead) {
            const ws = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (row && row.length >= 2 && row[0] && row[1]) {
                let code = row[0].toString().trim();
                if (
                  code.includes("جمع") ||
                  code === "" ||
                  isNaN(parseInt(toEnglishNumbers(code)))
                )
                  continue;

                code = toEnglishNumbers(code);
                const title = row[1].toString().trim();
                if (code !== "" && title !== "") {
                  rawItems.push({ code, title });
                }
              }
            }
          }

          if (rawItems.length === 0) {
            return new Response(
              JSON.stringify({ error: "هیچ داده معتبری در فایل یافت نشد" }),
              { status: 400, headers },
            );
          }

          const nowShamsi = toShamsi(new Date());

          // مرتب‌سازی بر اساس طول کد
          rawItems.sort((a, b) => a.code.length - b.code.length);

          // پاک کردن داده‌های قبلی
          await env.DB.prepare(
            "DELETE FROM base_data WHERE section = ? AND type = ?",
          )
            .bind(section, type)
            .run();

          let insertedCount = 0;
          const insertedNodes = {};
          const siblingCounters = {};

          for (const item of rawItems) {
            let parentId = null;
            let parentLevel = -1;
            let parentCode = "";

            // پیدا کردن والد بر اساس پیشوند عددی
            let bestMatchCode = "";
            let bestMatchLength = 0;

            for (const existingExcelCode in insertedNodes) {
              let commonLength = 0;
              const minLength = Math.min(
                item.code.length,
                existingExcelCode.length,
              );

              for (let i = 0; i < minLength; i++) {
                if (item.code[i] === existingExcelCode[i]) {
                  commonLength++;
                } else {
                  break;
                }
              }

              if (commonLength > 0 && commonLength < item.code.length) {
                if (commonLength > bestMatchLength) {
                  bestMatchLength = commonLength;
                  bestMatchCode = existingExcelCode;
                }
              }
            }

            if (bestMatchCode) {
              parentId = insertedNodes[bestMatchCode].id;
              parentLevel = insertedNodes[bestMatchCode].level;
              parentCode = insertedNodes[bestMatchCode].code;
            }

            let level = parentLevel === -1 ? 0 : parentLevel + 1;
            let levelName = "گروه";
            if (level === 0) levelName = "گروه";
            else if (level === 1) levelName = "سرفصل";
            else if (level === 2) levelName = "بند";
            else if (level === 3) levelName = "جزء";

            let newCode = "";

            if (level === 0) {
              const key = "ROOT_" + type;
              if (!siblingCounters[key]) siblingCounters[key] = 1;
              newCode = siblingCounters[key].toString().padStart(3, "0");
              siblingCounters[key]++;
            } else {
              const key = parentId;
              if (!siblingCounters[key]) siblingCounters[key] = 1;
              newCode =
                parentCode + siblingCounters[key].toString().padStart(3, "0");
              siblingCounters[key]++;
            }

            const result = await env.DB.prepare(
              `
                  INSERT INTO base_data 
                  (section, type, code, title, parent_id, level, level_name, digit_count, extra_data, created_at_shamsi, updated_at_shamsi)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
            )
              .bind(
                section,
                type,
                newCode,
                item.title,
                parentId,
                level,
                levelName,
                3,
                JSON.stringify({ original_excel_code: item.code }),
                nowShamsi,
                nowShamsi,
              )
              .run();

            insertedNodes[item.code] = {
              id: result.meta.last_row_id,
              level: level,
              code: newCode,
            };
            insertedCount++;
          }

          return new Response(
            JSON.stringify({ success: true, count: insertedCount }),
            { status: 200, headers },
          );
        } catch (error) {
          console.error("Import error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // POST: ایمپورت اکسل عملیاتی (۳ شیت: تملک سرمایه‌ای + تملک مالی + خدمت)
      // ============================================
      if (
        url.pathname === "/api/base-data/import-operational-excel" &&
        request.method === "POST"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              { status: 401, headers },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const formData = await request.formData();
          const file = formData.get("file");

          if (!file) {
            return new Response(
              JSON.stringify({ error: "فایلی ارسال نشده است" }),
              { status: 400, headers },
            );
          }

          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            return new Response(
              JSON.stringify({ error: "فایل اکسل خالی است یا معتبر نیست." }),
              { status: 400, headers },
            );
          }

          // ============================================
          // تشخیص ۳ شیت اصلی (فقط شیت‌های «عملیاتی»)
          // ============================================
          const findSheet = (mainKeyword, subKeyword) => {
            return workbook.SheetNames.find(
              (n) => n.includes(mainKeyword) && n.includes(subKeyword),
            );
          };

          // فقط شیت‌هایی که «عملیاتی» دارن
          const sheetCapital =
            findSheet("عملیاتی", "تملک سرمایه") ||
            findSheet("عملیاتی", "سرمایه ای") ||
            findSheet("عملیاتی", "سرمایه‌ای");

          const sheetFinancial =
            findSheet("عملیاتی", "تملک مالی") || findSheet("عملیاتی", "مالی");

          const sheetService = findSheet("عملیاتی", "خدمت");

          if (!sheetCapital && !sheetFinancial && !sheetService) {
            return new Response(
              JSON.stringify({
                error:
                  "هیچ شیت عملیاتی معتبری یافت نشد. شیت‌ها باید شامل «عملیاتی» و یکی از «تملک سرمایه ای»، «تملک مالی» یا «خدمت» باشند.",
              }),
              { status: 400, headers },
            );
          }

          console.log("✅ Sheets found:", {
            capital: sheetCapital,
            financial: sheetFinancial,
            service: sheetService,
          });

          // ============================================
          // استخراج داده از یک شیت
          // ============================================
          const extractSheet = (sheetName) => {
            if (!sheetName) return [];
            const ws = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const items = [];

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length < 2) continue;

              let code = row[0] ? row[0].toString().trim() : "";
              let title = row[1] ? row[1].toString().trim() : "";

              if (!code || !title) continue;
              if (code.includes("جمع") || title.includes("جمع")) continue;

              code = toEnglishNumbers(code);

              if (!/^\d+$/.test(code)) continue;

              items.push({ code, title });
            }

            return items;
          };

          const capitalItems = extractSheet(sheetCapital);
          const financialItems = extractSheet(sheetFinancial);
          const serviceItems = extractSheet(sheetService);

          console.log("=== IMPORT DEBUG ===");
          console.log("Sheet names:", workbook.SheetNames);
          console.log(
            "Capital sheet:",
            sheetCapital,
            "→ items:",
            capitalItems.length,
          );
          console.log(
            "Financial sheet:",
            sheetFinancial,
            "→ items:",
            financialItems.length,
          );
          console.log(
            "Service sheet:",
            sheetService,
            "→ items:",
            serviceItems.length,
          );
          console.log("Capital items (first 10):", capitalItems.slice(0, 10));
          console.log(
            "Financial items (first 10):",
            financialItems.slice(0, 10),
          );
          console.log("Service items (first 10):", serviceItems.slice(0, 10));

          if (
            capitalItems.length === 0 &&
            financialItems.length === 0 &&
            serviceItems.length === 0
          ) {
            return new Response(
              JSON.stringify({ error: "هیچ داده معتبری در شیت‌ها یافت نشد" }),
              { status: 400, headers },
            );
          }

          const nowShamsi = toShamsi(new Date());

          // پاک کردن داده‌های قبلی
          await env.DB.prepare(
            "DELETE FROM base_data WHERE section = 'operational'",
          ).run();

          // map: excelCode → { id, code, level, type }
          const insertedNodes = {};
          let totalCount = 0;

          // ============================================
          // ساخت statement برای درج نود (بدون اجرا)
          // ============================================
          const buildNodeStatement = (
            normalizedCode,
            title,
            type,
            level,
            levelName,
            parentId,
            rawCode,
            nextCode,
          ) => {
            const stmt = env.DB.prepare(
              `
              INSERT INTO base_data 
              (section, type, code, title, parent_id, level, level_name, digit_count, extra_data, created_at_shamsi, updated_at_shamsi)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            ).bind(
              "operational",
              type,
              nextCode,
              title,
              parentId,
              level,
              levelName,
              3,
              JSON.stringify({
                original_excel_code: rawCode || normalizedCode,
              }),
              nowShamsi,
              nowShamsi,
            );

            return {
              stmt,
              key: `${type}:${normalizedCode}`,
              nextCode,
              level,
              type,
            };
          };

          const processSheet = async (items, leafType) => {
            if (items.length === 0) return;

            const _sheetStart = Object.keys(insertedNodes).length;

            const normalizedItems = items.map((item) => {
              const normalized = item.code.replace(/^0+/, "") || "0";
              return {
                ...item,
                normalizedCode: normalized,
                normalizedLen: normalized.length,
              };
            });

            normalizedItems.sort((a, b) => a.normalizedLen - b.normalizedLen);

            // شمارنده‌های کد بعدی (in-memory)
            const codeCounters = {};
            let missionCounter = 0;

            // کش برای آخرین کد والد (برای محاسبه کد بعدی)
            const getNextCode = async (type, parentId, parent) => {
              if (!parentId) {
                missionCounter++;
                return String(missionCounter).padStart(3, "0");
              }

              const key = `${type}:${parentId}`;
              if (codeCounters[key] === undefined) {
                const last = await env.DB.prepare(
                  `SELECT code FROM base_data WHERE parent_id = ? AND type = ? ORDER BY code DESC LIMIT 1`,
                )
                  .bind(parentId, type)
                  .first();

                if (last) {
                  const suffix = last.code.substring(parent.code.length);
                  codeCounters[key] = parseInt(suffix, 10) || 0;
                } else {
                  codeCounters[key] = type === "plan" ? 49999 : 0;
                }
              }

              codeCounters[key]++;

              let padLen = 3;
              if (type === "service" || type === "plan") padLen = 5;

              return (
                parent.code + String(codeCounters[key]).padStart(padLen, "0")
              );
            };

            // ============================================
            // اجرای یک سطح به‌صورت batch
            // ============================================
            const runLevel = async (
              levelItems,
              type,
              level,
              levelName,
              parentResolver,
            ) => {
              const stmts = [];

              for (const item of levelItems) {
                const parent = parentResolver(item);
                if (parent === null) continue;

                const key = `${type}:${item.normalizedCode}`;

                // اگه قبلاً (از شیت قبلی) ساخته شده و id داره، skip
                if (insertedNodes[key] && insertedNodes[key].id) continue;

                const nextCode = await getNextCode(
                  type,
                  parent ? parent.id : null,
                  parent,
                );

                const stmt = env.DB.prepare(
                  `INSERT INTO base_data 
                   (section, type, code, title, parent_id, level, level_name, digit_count, extra_data, created_at_shamsi, updated_at_shamsi)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                ).bind(
                  "operational",
                  type,
                  nextCode,
                  item.title,
                  parent ? parent.id : null,
                  level,
                  levelName,
                  3,
                  JSON.stringify({ original_excel_code: item.code }),
                  nowShamsi,
                  nowShamsi,
                );

                stmts.push({ stmt, key, nextCode, type, level });
              }

              // اجرای batch
              const BATCH_SIZE = 50;
              for (let i = 0; i < stmts.length; i += BATCH_SIZE) {
                const chunk = stmts.slice(i, i + BATCH_SIZE);
                const results = await env.DB.batch(chunk.map((c) => c.stmt));

                chunk.forEach((b, idx) => {
                  const result = results[idx];
                  const id =
                    result && result.meta ? result.meta.last_row_id : null;

                  if (id) {
                    insertedNodes[b.key] = {
                      id: id,
                      code: b.nextCode,
                      level: b.level,
                      type: b.type,
                    };
                    totalCount++;
                  } else {
                    console.warn(
                      `[INSERT FAILED] ${b.key} (code: ${b.nextCode})`,
                    );
                  }
                });
              }
            };

            // ============================================
            // سطح ۰: مأموریت
            // ============================================
            const missions = normalizedItems.filter(
              (i) => i.normalizedLen === 1,
            );
            await runLevel(missions, "mission", 0, "مأموریت", (item) => {
              const key = `mission:${item.normalizedCode}`;
              if (insertedNodes[key]) return null; // قبلاً ساخته شده
              return { id: null, code: null }; // والد نداره
            });

            // ============================================
            // سطح ۱: برنامه
            // ============================================
            const programs = normalizedItems.filter(
              (i) => i.normalizedLen === 3,
            );
            await runLevel(programs, "program", 1, "برنامه", (item) => {
              const parentCode = item.normalizedCode.substring(0, 1);
              return insertedNodes[`mission:${parentCode}`] || null;
            });

            // ============================================
            // سطح ۲: طرح یا خدمت
            // ============================================
            const level2Type = leafType === "activity" ? "service" : "plan";
            const level2Name = leafType === "activity" ? "خدمت" : "طرح";
            const level2Items = normalizedItems.filter(
              (i) => i.normalizedLen === 5,
            );

            await runLevel(level2Items, level2Type, 2, level2Name, (item) => {
              const parentCode = item.normalizedCode.substring(0, 3);
              return insertedNodes[`program:${parentCode}`] || null;
            });

            // ============================================
            // سطح ۳: پروژه یا فعالیت
            // ============================================
            const leafName =
              leafType === "project_capital"
                ? "پروژه (تملک سرمایه‌ای)"
                : leafType === "project_financial"
                  ? "پروژه (تملک مالی)"
                  : "فعالیت";

            const parent2Type = leafType === "activity" ? "service" : "plan";
            const leafItems = normalizedItems.filter(
              (i) => i.normalizedLen > 5,
            );

            await runLevel(leafItems, leafType, 3, leafName, (item) => {
              const parentCode = item.normalizedCode.substring(0, 5);
              return insertedNodes[`${parent2Type}:${parentCode}`] || null;
            });

            const _sheetEnd = Object.keys(insertedNodes).length;
            console.log(
              `[SHEET ${leafType}] items=${items.length
              } | before=${_sheetStart} | after=${_sheetEnd} | new=${_sheetEnd - _sheetStart
              }`,
            );
          };
          // ============================================
          // پردازش به ترتیب
          // ============================================
          // ۱. تملک سرمایه‌ای (اول چون مأموریت/برنامه/طرح رو می‌سازه)
          await processSheet(capitalItems, "project_capital");

          // ۲. تملک مالی (فقط پروژه‌های جدید؛ مأموریت/برنامه/طرح موجود رو استفاده می‌کنه)
          await processSheet(financialItems, "project_financial");

          // ۳. خدمت (فقط خدمت/فعالیت جدید؛ مأموریت/برنامه موجود رو استفاده می‌کنه)
          await processSheet(serviceItems, "activity");

          return new Response(
            JSON.stringify({
              success: true,
              count: totalCount,
              sheets: {
                capital: { name: sheetCapital, found: capitalItems.length },
                financial: {
                  name: sheetFinancial,
                  found: financialItems.length,
                },
                service: { name: sheetService, found: serviceItems.length },
              },
            }),
            { status: 200, headers },
          );
        } catch (error) {
          console.error("Operational import error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // ============================================
      // POST: ایمپورت اکسل فعالیت‌ها (زیر خدمت‌های موجود)
      // ============================================
      if (url.pathname === "/api/base-data/import-activities-excel" && request.method === "POST") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "احراز هویت لازم است" }), { status: 401, headers });
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), { status: 403, headers });
          }

          const formData = await request.formData();
          const file = formData.get("file");

          if (!file) {
            return new Response(JSON.stringify({ error: "فایلی ارسال نشده است" }), { status: 400, headers });
          }

          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            return new Response(JSON.stringify({ error: "فایل اکسل خالی است" }), { status: 400, headers });
          }

          const ws = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

          if (!rows || rows.length < 2) {
            return new Response(JSON.stringify({ error: "شیت خالی است" }), { status: 400, headers });
          }

          // ============================================
          // استخراج فقط فعالیت‌ها (کد ۸ رقمی)
          // ============================================
          const activityItems = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 5) continue;

            const codeRaw = row[0];
            const programTitle = row[2] ? row[2].toString().trim() : "";
            const serviceTitle = row[3] ? row[3].toString().trim() : "";
            const activityTitle = row[4] ? row[4].toString().trim() : "";

            if (!codeRaw) continue;

            let code = codeRaw.toString().trim();
            code = toEnglishNumbers(code);

            if (!/^\d+$/.test(code)) continue;

            // فقط فعالیت‌ها: کد ۸ رقمی
            if (code.length === 8) {
              // عنوان فعالیت از ستون E (اگه نبود، ستون B)
              let title = activityTitle;
              if (!title && row[1]) title = row[1].toString().trim();
              
              if (!title) continue;
              if (title.includes("جمع")) continue;

              // کد خدمت والد = ۵ رقم اول
              const parentServiceExcelCode = code.substring(0, 5);

              activityItems.push({
                code,
                title,
                parentServiceExcelCode,
              });
            }
          }

          if (activityItems.length === 0) {
            return new Response(JSON.stringify({ error: "هیچ فعالیتی (کد ۸ رقمی) در فایل یافت نشد" }), { status: 400, headers });
          }

          const nowShamsi = toShamsi(new Date());

          // ============================================
          // برای هر فعالیت: پیدا کردن خدمت والد
          // ============================================
          const pendingStmts = [];
          let totalCount = 0;
          let notFoundCount = 0;
          const notFoundCodes = [];

          // کش برای خدمت‌ها (برای جلوگیری از کوئری تکراری)
          const serviceCache = {};
          // شمارنده کد بعدی برای هر خدمت
          const activityCounters = {};

          for (const item of activityItems) {
            const serviceExcelCode = item.parentServiceExcelCode;

            // چک کش
            let parentService = serviceCache[serviceExcelCode];

            if (parentService === undefined) {
              // از دیتابیس بپرس
              parentService = await env.DB.prepare(
                `SELECT id, code FROM base_data 
                 WHERE section = 'operational' 
                   AND type = 'service'
                   AND json_extract(extra_data, '$.original_excel_code') = ?
                 LIMIT 1`
              ).bind(serviceExcelCode).first();

              serviceCache[serviceExcelCode] = parentService; // null یا آبجکت
            }

            if (!parentService) {
              console.warn(`خدمت والد برای ${item.code} (کد خدمت: ${serviceExcelCode}) یافت نشد`);
              notFoundCount++;
              if (notFoundCodes.length < 10) notFoundCodes.push(serviceExcelCode);
              continue;
            }

            // کد بعدی فعالیت
            if (activityCounters[parentService.id] === undefined) {
              const lastActivity = await env.DB.prepare(
                `SELECT code FROM base_data 
                 WHERE parent_id = ? AND type = 'activity' 
                 ORDER BY code DESC LIMIT 1`
              ).bind(parentService.id).first();

              if (lastActivity) {
                const suffix = lastActivity.code.substring(parentService.code.length);
                activityCounters[parentService.id] = parseInt(suffix, 10) || 0;
              } else {
                activityCounters[parentService.id] = 0;
              }
            }

            activityCounters[parentService.id]++;
            const nextCode = parentService.code + String(activityCounters[parentService.id]).padStart(3, "0");

            const stmt = env.DB.prepare(
              `INSERT INTO base_data 
               (section, type, code, title, parent_id, level, level_name, digit_count, extra_data, created_at_shamsi, updated_at_shamsi)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              "operational",
              "activity",
              nextCode,
              item.title,
              parentService.id,
              3,
              "فعالیت",
              3,
              JSON.stringify({ original_excel_code: item.code }),
              nowShamsi,
              nowShamsi
            );

            pendingStmts.push(stmt);
          }

          // ============================================
          // اجرای batch
          // ============================================
          const BATCH_SIZE = 50;
          for (let i = 0; i < pendingStmts.length; i += BATCH_SIZE) {
            const chunk = pendingStmts.slice(i, i + BATCH_SIZE);
            await env.DB.batch(chunk);
            totalCount += chunk.length;
          }

          return new Response(JSON.stringify({
            success: true,
            count: totalCount,
            not_found: notFoundCount,
            not_found_samples: notFoundCodes,
            total_found: activityItems.length,
          }), { status: 200, headers });

        } catch (error) {
          console.error("Activities import error:", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
      }

      // POST: افزودن ردیف جدید
      if (url.pathname === "/api/base-data" && request.method === "POST") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              { status: 401, headers },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
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
            fiscal_year_id,
          } = body;

          if (!section || !title) {
            return new Response(
              JSON.stringify({ error: "section و title الزامی است" }),
              { status: 400, headers },
            );
          }

          const digitCount = digit_count || 3;

          const code = await generateNextCode(env, {
            section,
            type,
            parent_id: parent_id || null,
            digit_count: digitCount,
            prefix,
          });

          let level = 0;
          if (parent_id) {
            const parent = await env.DB.prepare(
              "SELECT level FROM base_data WHERE id = ?",
            )
              .bind(parent_id)
              .first();

            if (!parent) {
              return new Response(JSON.stringify({ error: "والد یافت نشد" }), {
                status: 404,
                headers,
              });
            }

            level = parent.level + 1;
          }

          const nowShamsi = toShamsi(new Date());

          const result = await env.DB.prepare(
            `
            INSERT INTO base_data 
            (fiscal_year_id, section, type, prefix, code, digit_count, level, level_name, title, parent_id, description, extra_data, sort_order, created_at_shamsi, updated_at_shamsi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          )
            .bind(
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
              nowShamsi,
            )
            .run();

          ctx.waitUntil(
            logBaseDataAction(
              env,
              request,
              userData,
              "base_data_created",
              result.meta.last_row_id,
              { section, type, code, title },
            ),
          );

          return new Response(
            JSON.stringify({
              success: true,
              id: result.meta.last_row_id,
              code: code,
              level: level,
            }),
            { status: 201, headers },
          );
        } catch (error) {
          console.error("Base data POST error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // PUT: ویرایش
      if (
        url.pathname.match(/^\/api\/base-data\/\d+$/) &&
        request.method === "PUT"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              { status: 401, headers },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
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
            level_name,
          } = body;

          if (!title) {
            return new Response(JSON.stringify({ error: "title الزامی است" }), {
              status: 400,
              headers,
            });
          }

          const nowShamsi = toShamsi(new Date());

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
          `,
          )
            .bind(
              title,
              description || null,
              extra_data ? JSON.stringify(extra_data) : null,
              sort_order || 0,
              is_active !== undefined ? (is_active ? 1 : 0) : 1,
              level_name || null,
              nowShamsi,
              id,
            )
            .run();

          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "ردیف یافت نشد" }), {
              status: 404,
              headers,
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
                title,
              },
            ),
          );

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Base data PUT error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }

      // DELETE: حذف
      if (
        url.pathname.match(/^\/api\/base-data\/\d+$/) &&
        request.method === "DELETE"
      ) {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "احراز هویت لازم است" }),
              { status: 401, headers },
            );
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), {
              status: 403,
              headers,
            });
          }

          const id = url.pathname.split("/").pop();

          const children = await env.DB.prepare(
            "SELECT COUNT(*) as count FROM base_data WHERE parent_id = ?",
          )
            .bind(id)
            .first();

          if (children.count > 0) {
            return new Response(
              JSON.stringify({
                error: `این ردیف ${children.count} زیرشاخه دارد. ابتدا زیرشاخه‌ها را حذف کنید.`,
                children_count: children.count,
              }),
              { status: 400, headers },
            );
          }

          const result = await env.DB.prepare(
            "DELETE FROM base_data WHERE id = ?",
          )
            .bind(id)
            .run();

          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "ردیف یافت نشد" }), {
              status: 404,
              headers,
            });
          }

          ctx.waitUntil(
            logBaseDataAction(
              env,
              request,
              userData,
              "base_data_deleted",
              parseInt(id),
              {},
            ),
          );

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("Base data DELETE error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
          });
        }
      }




      // ============================================
      // PUT: جابجایی ردیف‌ها (فقط sort_order)
      // ============================================
      if (url.pathname === "/api/base-data/reorder" && request.method === "PUT") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader) {
            return new Response(JSON.stringify({ error: "احراز هویت لازم است" }), { status: 401, headers });
          }

          const token = authHeader.replace("Bearer ", "");
          const userData = await verifyToken(token, env.JWT_SECRET);

          if (!userData || !["admin", "manager"].includes(userData.role)) {
            return new Response(JSON.stringify({ error: "دسترسی غیرمجاز" }), { status: 403, headers });
          }

          const body = await request.json();
          const { items } = body;

          if (!Array.isArray(items) || items.length === 0) {
            return new Response(JSON.stringify({ error: "لیست ردیف‌ها الزامی است" }), { status: 400, headers });
          }

          const nowShamsi = toShamsi(new Date());
          const stmts = [];

          for (const item of items) {
            if (!item.id || item.sort_order === undefined) continue;

            stmts.push(
              env.DB.prepare(
                `UPDATE base_data SET sort_order = ?, updated_at = CURRENT_TIMESTAMP, updated_at_shamsi = ? WHERE id = ?`
              ).bind(item.sort_order, nowShamsi, item.id)
            );
          }

          if (stmts.length === 0) {
            return new Response(JSON.stringify({ error: "هیچ ردیف معتبری یافت نشد" }), { status: 400, headers });
          }

          // اجرای batch
          const BATCH_SIZE = 50;
          for (let i = 0; i < stmts.length; i += BATCH_SIZE) {
            const chunk = stmts.slice(i, i + BATCH_SIZE);
            await env.DB.batch(chunk);
          }

          return new Response(JSON.stringify({ success: true, count: stmts.length }), { status: 200, headers });
        } catch (error) {
          console.error("Reorder error:", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
      }




      // Serve static files
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
        "/attendance.html",
      ];

      if (staticPaths.includes(url.pathname)) {
        return await env.ASSETS.fetch(request);
      }

      return new Response(JSON.stringify({ error: "مسیر پیدا نشد" }), {
        status: 404,
        headers,
      });
    } catch (error) {
      console.error("Error:", error);
      return new Response(JSON.stringify({ error: "خطای داخلی سرور" }), {
        status: 500,
        headers,
      });
    }
  },
};
