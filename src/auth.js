// هش کردن پسورد با Web Crypto API
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // بررسی پسورد
  export async function verifyPassword(password, hash) {
    const newHash = await hashPassword(password);
    return newHash === hash;
  }
  
  // ساخت توکن ساده
  export async function generateToken(userId, username, role, secret) {
    const payload = JSON.stringify({
      userId,
      username,
      role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 ساعت
    });
    
    const encodedPayload = btoa(payload);
    const signature = await hashPassword(encodedPayload + secret);
    
    return `${encodedPayload}.${signature}`;
  }
  
  // تایید توکن
  export async function verifyToken(token, secret) {
    try {
      const [encodedPayload, signature] = token.split('.');
      
      // بررسی امضا
      const expectedSignature = await hashPassword(encodedPayload + secret);
      if (signature !== expectedSignature) {
        return null;
      }
      
      // رمزگشایی payload
      const payload = JSON.parse(atob(encodedPayload));
      
      // بررسی انقضا
      if (payload.exp < Date.now()) {
        return null;
      }
      
      return payload;
    } catch {
      return null;
    }
  }
  
  // بررسی دسترسی
  export function checkPermission(user, requiredRole) {
    const roleHierarchy = {
      'viewer': 1,
      'expert': 2,
      'manager': 3,
      'admin': 4
    };
    
    if (user.role === 'admin') return true;
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }