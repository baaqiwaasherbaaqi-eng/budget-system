// ============================================
// Sidebar مشترک سامانه بودجه
// ============================================

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
      icon: "📊",
      title: "طبقه‌بندی اقتصادی",
      url: "/economic-classifications.html",
      roles: ["admin", "manager"],
    },
    {
      icon: "🏢",
      title: "ساختار سازمانی",
      url: "/organizations.html",
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
                    <a href="${menu.url}" class="sidebar-link ${
                      currentPath === menu.url ? "active" : ""
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
