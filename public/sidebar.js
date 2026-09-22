// ============================================
// Sidebar مشترک سامانه بودجه
// ============================================
// بررسی اعتبار توکن (اگه توی common.js نبود)
if (typeof isTokenValid === 'undefined') {
  window.isTokenValid = function () {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const parts = token.split('.');
      if (parts.length < 2) return false;

      const payload = JSON.parse(atob(parts[0]));

      if (payload.exp && payload.exp < Date.now()) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };
}

function renderSidebar() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentPath = window.location.pathname;
  // بررسی اعتبار توکن
  if (!isTokenValid()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
    return;
  }
  const allMenus = [
    {
      icon: "🏠",
      title: "داشبورد",
      url: "/dashboard.html",
      roles: ["admin", "manager", "expert", "viewer", "province", "ministry"],
    },
    { icon: '📂', title: 'اطلاعات پایه', url: '/base-info.html', roles: ['admin', 'manager', 'expert', 'viewer'] },
 
    {
      icon: "💰",
      title: "بودجه پیشنهادی",
      url: "/budget-proposals.html",
      roles: ["admin", "manager", "expert", "viewer"],
    },
    {
      icon: "💳",
      title: "تخصیص اعتبار",
      url: "/allocations.html",
      roles: ["admin", "manager"],
    },
    {
      icon: "💸",
      title: "تامین اعتبار",
      url: "/executions.html",
      roles: ["admin", "manager", "expert"],
    },
    {
      icon: "🔄",
      title: "اصلاح بودجه",
      url: "/revisions.html",
      roles: ["admin", "manager"],
    },
    {
      icon: "📈",
      title: "گزارشات",
      url: "/reports.html",
      roles: ["admin", "manager", "expert", "viewer", "province", "ministry"],
    },
    {
      icon: "📊",
      title: "گزارش پیشرفته",
      url: "/advanced-reports.html",
      roles: ["admin", "manager", "viewer", "province", "ministry"],
    },
    {
      icon: "📋",
      title: "تفریغ بودجه",
      url: "/tafriq.html",
      roles: ["admin", "manager", "viewer"],
    },
    {
      icon: "📅",
      title: "سال مالی",
      url: "/fiscal-years.html",
      roles: ["admin"],
    },
    {
      icon: "👥",
      title: "مدیریت کاربران",
      url: "/users.html",
      roles: ["admin"],
    },
    {
      icon: "📜",
      title: "لاگ سیستم",
      url: "/audit-log.html",
      roles: ["admin"],
    },
  ];

  // فیلتر بر اساس نقش
  let visibleMenus = allMenus.filter((m) => m.roles.includes(user.role));

  // برای province و ministry فقط گزارشات
  if (user.role === "province" || user.role === "ministry") {
    visibleMenus = allMenus.filter(
      (m) =>
        m.url === "/reports.html" ||
        m.url === "/advanced-reports.html" ||
        m.url === "/dashboard.html"
    );
  }

  // ساخت HTML
  const sidebarHTML = `
        <button class="sidebar-toggle" onclick="toggleSidebar()" id="sidebar-toggle">☰</button>
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <h3>💰 سامانه بودجه</h3>
                <button class="sidebar-close" onclick="toggleSidebar()">✕</button>
            </div>
            <div class="sidebar-user">
                <div class="user-name">${user.full_name || ""}</div>
                <div class="user-role">${getRoleLabel(user.role)}</div>
            </div>
            <nav class="sidebar-nav">
                ${visibleMenus
      .map(
        (menu) => `
                    <a href="${menu.url}" class="sidebar-link ${currentPath === menu.url ? "active" : ""
          }">
                        <span class="sidebar-icon">${menu.icon}</span>
                        <span class="sidebar-text">${menu.title}</span>
                    </a>
                `
      )
      .join("")}
            </nav>
            <div class="sidebar-footer">
                <button class="sidebar-logout" onclick="sidebarLogout()">
                    🚪 خروج
                </button>
            </div>
        </div>
        <div class="sidebar-overlay" onclick="toggleSidebar()" id="sidebar-overlay"></div>
    `;

  // اضافه به body
  document.body.insertAdjacentHTML("afterbegin", sidebarHTML);
}

function getRoleLabel(role) {
  const labels = {
    admin: "مدیر سیستم",
    manager: "مدیر",
    expert: "کارشناس",
    viewer: "بازدیدکننده",
    province: "استانداری",
    ministry: "وزارت کشور",
  };
  return labels[role] || role;
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const toggleBtn = document.getElementById("sidebar-toggle");

  sidebar.classList.toggle("open");
  overlay.classList.toggle("open");

  if (sidebar.classList.contains("open")) {
    toggleBtn.style.display = "none";
  } else {
    toggleBtn.style.display = "block";
  }
}

function sidebarLogout() {
  if (confirm("مطمئن هستید خارج می‌شوید؟")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
  }
}

// راه‌اندازی موقع لود
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderSidebar);
} else {
  renderSidebar();
}

// ============================================
// Breadcrumb - نمایش مسیر
// ============================================

function renderBreadcrumb() {
  const currentPath = window.location.pathname;
  
  // نقشه مسیرها
  const pathMap = {
      '/dashboard.html': { icon: '🏠', title: 'داشبورد', parent: null },
      '/base-info.html': { icon: '📂', title: 'اطلاعات پایه', parent: '/dashboard.html' },
      '/municipality-info.html': { icon: '🏛️', title: 'مشخصات شهرداری', parent: '/base-info.html' },
      '/fiscal-years.html': { icon: '📅', title: 'سال مالی', parent: '/dashboard.html' },
      '/economic-classifications.html': { icon: '💰', title: 'طبقه‌بندی اقتصادی', parent: '/base-info.html' },
      '/organizations.html': { icon: '🏢', title: 'ساختار سازمانی', parent: '/base-info.html' },
      '/budget-proposals.html': { icon: '💰', title: 'بودجه پیشنهادی', parent: '/dashboard.html' },
      '/reports.html': { icon: '📈', title: 'گزارشات', parent: '/dashboard.html' },
      '/allocations.html': { icon: '💳', title: 'تخصیص اعتبار', parent: '/dashboard.html' },
      '/executions.html': { icon: '💸', title: 'تامین اعتبار', parent: '/dashboard.html' },
      '/users.html': { icon: '👥', title: 'مدیریت کاربران', parent: '/dashboard.html' },
      '/revisions.html': { icon: '🔄', title: 'اصلاح بودجه', parent: '/dashboard.html' },
      '/advanced-reports.html': { icon: '📊', title: 'گزارش پیشرفته', parent: '/dashboard.html' },
      '/tafriq.html': { icon: '📋', title: 'تفریغ بودجه', parent: '/dashboard.html' },
      '/audit-log.html': { icon: '📜', title: 'لاگ سیستم', parent: '/dashboard.html' }
  };
  
  const current = pathMap[currentPath];
  
  // اگه صفحه داشبورد یا ناشناخته بود، breadcrumb نشون نده
  if (!current || currentPath === '/dashboard.html') {
      return;
  }
  
  // ساخت مسیر از ریشه تا صفحه فعلی
  const breadcrumbs = [];
  let path = currentPath;
  
  while (path) {
      const item = pathMap[path];
      if (!item) break;
      breadcrumbs.unshift({ path, ...item });
      path = item.parent;
  }
  
  // ساخت HTML
  const breadcrumbHTML = `
      <div class="breadcrumb">
          ${breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              
              if (isLast) {
                  return `<span class="breadcrumb-item current">
                      <span>${item.icon}</span>
                      <span>${item.title}</span>
                  </span>`;
              } else {
                  return `<a href="${item.path}" class="breadcrumb-item">
                      <span>${item.icon}</span>
                      <span>${item.title}</span>
                  </a>
                  <span class="breadcrumb-separator">◄</span>`;
              }
          }).join('')}
      </div>
  `;
  
  // اضافه کردن به صفحه
  const container = document.querySelector('.container');
  if (container) {
      // چک کن که قبلاً اضافه نشده باشه
      const existing = container.querySelector('.breadcrumb');
      if (existing) existing.remove();
      
      container.insertAdjacentHTML('afterbegin', breadcrumbHTML);
  }
}

// ============================================
// Breadcrumb - نمایش مسیر
// ============================================

function renderBreadcrumb() {
  let currentPath = window.location.pathname;
  
  // اگه بدون .html بود، اضافه کن
  if (!currentPath.endsWith('.html') && currentPath !== '/') {
      currentPath = currentPath + '.html';
  }
  
  // نقشه مسیرها
  const pathMap = {
      '/dashboard.html': { icon: '🏠', title: 'داشبورد', parent: null },
      '/base-info.html': { icon: '📂', title: 'اطلاعات پایه', parent: '/dashboard.html' },
      '/municipality-info.html': { icon: '🏛️', title: 'مشخصات شهرداری', parent: '/base-info.html' },
      '/fiscal-years.html': { icon: '📅', title: 'سال مالی', parent: '/dashboard.html' },
      '/economic-classifications.html': { icon: '💰', title: 'طبقه‌بندی اقتصادی', parent: '/base-info.html' },
      '/organizations.html': { icon: '🏢', title: 'ساختار سازمانی', parent: '/base-info.html' },
      '/budget-proposals.html': { icon: '💰', title: 'بودجه پیشنهادی', parent: '/dashboard.html' },
      '/reports.html': { icon: '📈', title: 'گزارشات', parent: '/dashboard.html' },
      '/allocations.html': { icon: '💳', title: 'تخصیص اعتبار', parent: '/dashboard.html' },
      '/executions.html': { icon: '💸', title: 'تامین اعتبار', parent: '/dashboard.html' },
      '/users.html': { icon: '👥', title: 'مدیریت کاربران', parent: '/dashboard.html' },
      '/revisions.html': { icon: '🔄', title: 'اصلاح بودجه', parent: '/dashboard.html' },
      '/advanced-reports.html': { icon: '📊', title: 'گزارش پیشرفته', parent: '/dashboard.html' },
      '/tafriq.html': { icon: '📋', title: 'تفریغ بودجه', parent: '/dashboard.html' },
      '/audit-log.html': { icon: '📜', title: 'لاگ سیستم', parent: '/dashboard.html' }
  };
  
  const current = pathMap[currentPath];
  
  // اگه صفحه داشبورد یا ناشناخته بود، breadcrumb نشون نده
  if (!current || currentPath === '/dashboard.html') {
      return;
  }
  
  // ساخت مسیر از ریشه تا صفحه فعلی
  const breadcrumbs = [];
  let path = currentPath;
  
  while (path) {
      const item = pathMap[path];
      if (!item) break;
      breadcrumbs.unshift({ path, ...item });
      path = item.parent;
  }
  
  // ساخت HTML
  const breadcrumbHTML = `
      <div class="breadcrumb">
          ${breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              
              if (isLast) {
                  return `<span class="breadcrumb-item current">
                      <span>${item.icon}</span>
                      <span>${item.title}</span>
                  </span>`;
              } else {
                  return `<a href="${item.path}" class="breadcrumb-item">
                      <span>${item.icon}</span>
                      <span>${item.title}</span>
                  </a>
                  <span class="breadcrumb-separator">◄</span>`;
              }
          }).join('')}
      </div>
  `;
  

    // اضافه کردن به صفحه
    const header = document.querySelector('.header');
    const container = document.querySelector('.container');
    
    // چک کن که قبلاً اضافه نشده باشه
    const existing = document.querySelector('.breadcrumb');
    if (existing) existing.remove();
    
    if (header) {
        // بعد از هدر اضافه کن
        header.insertAdjacentHTML('afterend', breadcrumbHTML);
    } else if (container) {
        // اگه هدر نبود، اول container
        container.insertAdjacentHTML('afterbegin', breadcrumbHTML);
    }
}

// راه‌اندازی breadcrumb بعد از sidebar
window.addEventListener('load', function() {
  setTimeout(renderBreadcrumb, 200);
});
