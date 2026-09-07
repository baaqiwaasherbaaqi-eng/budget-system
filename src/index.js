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

      // Serve static files
      if (url.pathname === '/login.html' || url.pathname === '/' || url.pathname === '/dashboard.html') {
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