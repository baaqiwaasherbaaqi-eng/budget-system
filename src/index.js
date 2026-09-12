import { hashPassword, verifyPassword, generateToken, verifyToken } from './auth';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json; charset=utf-8'
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      // ========== ورود ==========
      if (url.pathname === '/api/login' && request.method === 'POST') {
        const { username, password } = await request.json();

        // پیدا کردن کاربر
        const user = await env.DB.prepare(
          'SELECT * FROM users WHERE username = ? AND is_active = 1'
        ).bind(username).first();

        if (!user) {
          return new Response(JSON.stringify({
            error: 'نام کاربری یا رمز عبور اشتباه است'
          }), { status: 401, headers });
        }

        // بررسی پسورد
        const validPassword = await verifyPassword(password, user.password_hash);
        if (!validPassword) {
          return new Response(JSON.stringify({
            error: 'نام کاربری یا رمز عبور اشتباه است'
          }), { status: 401, headers });
        }

        // ساخت توکن
        const token = await generateToken(user.id, user.username, user.role, env.JWT_SECRET);

        return new Response(JSON.stringify({
          token,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            organization: user.organization
          }
        }), { status: 200, headers });
      }

      // ========== تست ==========
      if (url.pathname === '/api/hello') {
        return new Response(JSON.stringify({
          message: 'سلام! سامانه بودجه شهرداری آماده است'
        }), { status: 200, headers });
      }

      if (url.pathname === '/api/test-db') {
        const result = await env.DB.prepare('SELECT 1 as test').first();
        return new Response(JSON.stringify({
          message: 'دیتابیس کار میکنه',
          result: result
        }), { status: 200, headers });
      }

      // ========== مدیریت سال مالی ==========

      // دریافت لیست سال‌های مالی
      if (url.pathname === '/api/fiscal-years' && request.method === 'GET') {
        const years = await env.DB.prepare(
          'SELECT * FROM fiscal_years ORDER BY year DESC'
        ).all();

        return new Response(JSON.stringify(years.results), { status: 200, headers });
      }

      // ساخت سال مالی جدید
      if (url.pathname === '/api/fiscal-years' && request.method === 'POST') {
        const { year, start_date, end_date } = await request.json();

        // اعتبارسنجی
        if (!year || !start_date || !end_date) {
          return new Response(JSON.stringify({ error: 'همه فیلدها الزامی است' }), {
            status: 400, headers
          });
        }

        try {
          const result = await env.DB.prepare(
            'INSERT INTO fiscal_years (year, start_date, end_date) VALUES (?, ?, ?)'
          ).bind(year, start_date, end_date).run();

          return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id
          }), { status: 201, headers });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'این سال قبلاً ثبت شده' }), {
            status: 400, headers
          });
        }
      }

      // فعال کردن سال مالی
      if (url.pathname === '/api/fiscal-years/activate' && request.method === 'PUT') {
        const { year } = await request.json();

        // غیرفعال کردن همه
        await env.DB.prepare(
          'UPDATE fiscal_years SET is_active = 0'
        ).run();

        // فعال کردن سال مورد نظر
        await env.DB.prepare(
          'UPDATE fiscal_years SET is_active = 1, status = ? WHERE year = ?'
        ).bind('active', year).run();

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      // حذف سال مالی
      if (url.pathname.startsWith('/api/fiscal-years/') && request.method === 'DELETE') {
        const year = url.pathname.split('/').pop();

        await env.DB.prepare(
          'DELETE FROM fiscal_years WHERE year = ?'
        ).bind(year).run();

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      // ویرایش سال مالی
      if (url.pathname.startsWith('/api/fiscal-years/edit/') && request.method === 'PUT') {
        const year = url.pathname.split('/').pop();
        const { start_date, end_date } = await request.json();
        
        await env.DB.prepare(
          'UPDATE fiscal_years SET start_date = ?, end_date = ? WHERE year = ?'
        ).bind(start_date, end_date, year).run();
        
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }


      // ========== طبقه‌بندی اقتصادی ==========

      // دریافت لیست طبقه‌بندی‌ها
      if (url.pathname === '/api/economic-classifications' && request.method === 'GET') {
        const fiscalYearId = url.searchParams.get('fiscal_year_id');
        const type = url.searchParams.get('type');

        let query = 'SELECT * FROM economic_classifications WHERE 1=1';
        const params = [];

        if (fiscalYearId) {
          query += ' AND fiscal_year_id = ?';
          params.push(fiscalYearId);
        }

        if (type) {
          query += ' AND type = ?';
          params.push(type);
        }

        query += ' ORDER BY main_code, chapter_code, sub_code';

        const items = await env.DB.prepare(query).bind(...params).all();

        return new Response(JSON.stringify(items.results), { status: 200, headers });
      }

      // ساخت طبقه‌بندی جدید
      if (url.pathname === '/api/economic-classifications' && request.method === 'POST') {
        const { fiscal_year_id, type, category, main_code, chapter_code, sub_code, title, parent_id } = await request.json();

        // اعتبارسنجی
        if (!fiscal_year_id || !type || !category || !main_code || !chapter_code || !sub_code || !title) {
          return new Response(JSON.stringify({ error: 'همه فیلدها الزامی است' }), {
            status: 400, headers
          });
        }

        try {
          const result = await env.DB.prepare(`
            INSERT INTO economic_classifications 
            (fiscal_year_id, type, category, main_code, chapter_code, sub_code, title, parent_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(fiscal_year_id, type, category, main_code, chapter_code, sub_code, title, parent_id || null).run();

          return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id
          }), { status: 201, headers });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'خطا در ثبت' }), {
            status: 400, headers
          });
        }
      }

      // حذف طبقه‌بندی
      if (url.pathname.startsWith('/api/economic-classifications/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();

        await env.DB.prepare(
          'DELETE FROM economic_classifications WHERE id = ?'
        ).bind(id).run();

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }


      // ========== ساختار سازمانی ==========
      
      // دریافت لیست سازمان‌ها
      if (url.pathname === '/api/organizations' && request.method === 'GET') {
        const fiscalYearId = url.searchParams.get('fiscal_year_id');
        
        let query = 'SELECT * FROM organizations';
        const params = [];
        
        if (fiscalYearId) {
          query += ' WHERE fiscal_year_id = ?';
          params.push(fiscalYearId);
        }
        
        query += ' ORDER BY name';
        
        const items = await env.DB.prepare(query).bind(...params).all();
        
        return new Response(JSON.stringify(items.results), { status: 200, headers });
      }

      // ساخت سازمان جدید
      if (url.pathname === '/api/organizations' && request.method === 'POST') {
        const { fiscal_year_id, name, type, manager_name, finance_manager_name, parent_id, is_cost_center } = await request.json();
        
        if (!fiscal_year_id || !name || !type) {
          return new Response(JSON.stringify({ error: 'همه فیلدهای الزامی را پر کنید' }), {
            status: 400, headers
          });
        }
        
        try {
          const result = await env.DB.prepare(`
            INSERT INTO organizations 
            (fiscal_year_id, name, type, manager_name, finance_manager_name, parent_id, is_cost_center)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            fiscal_year_id, 
            name, 
            type, 
            manager_name || null, 
            finance_manager_name || null, 
            parent_id || null, 
            is_cost_center ? 1 : 0
          ).run();
          
          return new Response(JSON.stringify({ 
            success: true, 
            id: result.meta.last_row_id 
          }), { status: 201, headers });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'خطا در ثبت' }), {
            status: 400, headers
          });
        }
      }

      // حذف سازمان
      if (url.pathname.startsWith('/api/organizations/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        
        await env.DB.prepare(
          'DELETE FROM organizations WHERE id = ?'
        ).bind(id).run();
        
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      
      // Serve static files
      if (url.pathname === '/login.html' || url.pathname === '/' || url.pathname === '/dashboard.html' || url.pathname === '/fiscal-years.html' || url.pathname === '/economic-classifications.html' || url.pathname === '/organizations.html') {
        return await env.ASSETS.fetch(request);
      }

      return new Response(JSON.stringify({ error: 'مسیر پیدا نشد' }), {
        status: 404,
        headers
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'خطای داخلی سرور' }), {
        status: 500,
        headers
      });
    }
  }
};