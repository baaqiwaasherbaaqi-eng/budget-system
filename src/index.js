export default {
    async fetch(request, env) {
      const url = new URL(request.url);
  
      // تست ساده
      if (url.pathname === '/api/hello') {
        return new Response(JSON.stringify({
          message: 'سلام! سامانه بودجه شهرداری آماده است',
          time: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
  
      // تست دیتابیس
      if (url.pathname === '/api/test-db') {
        try {
          const result = await env.DB.prepare('SELECT 1 as test').first();
          return new Response(JSON.stringify({
            message: 'دیتابیس کار میکنه',
            result: result
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            error: error.message
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
  
      return new Response('سلام! این سامانه بودجه شهرداری است', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  };