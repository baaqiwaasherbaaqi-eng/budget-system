// ============================================
// Footer مشترک — نسخه امن مطلق
// ============================================

(function () {
  "use strict";

  // اگه قبلاً اضافه شده، کاری نکن
  if (document.getElementById("site-footer")) return;

  function createFooter() {
    const footer = document.createElement("footer");
    footer.id = "site-footer";
    footer.style.cssText = `
            display: block;
            width: auto;
            margin: 40px 20px 20px 20px;
            padding: 16px 20px;
            border-top: 1px solid #e9ecef;
            font-family: 'Vazirmatn', Tahoma, sans-serif;
            direction: rtl;
            text-align: center;
            box-sizing: border-box;
        `;

    // محتوای داخلی با flex فقط برای چیدمان خود footer
    const inner = document.createElement("div");
    inner.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
        `;

    const logo = document.createElement("img");
    logo.src = "/Logo.png";
    logo.alt = "داده کاوان هوشمند";
    logo.style.cssText =
      "width: 34px; height: 34px; object-fit: contain; flex-shrink: 0;";
    logo.onerror = function () {
      this.style.display = "none";
    };

    const textDiv = document.createElement("div");
    textDiv.style.cssText = "text-align: right; line-height: 1.5;";

    const copyLine = document.createElement("div");
    copyLine.style.cssText = "font-size: 12px; color: #666;";
    copyLine.innerHTML =
      '© ۱۴۰۵ - تمامی حقوق برای <strong style="color:#667eea;">«داده کاوان هوشمند»</strong> محفوظ است.';

    const latinLine = document.createElement("div");
    latinLine.style.cssText =
      "font-size: 10px; color: #999; letter-spacing: 1.5px; margin-top: 2px;";
    latinLine.textContent = "SmartDadehKavan";

    textDiv.appendChild(copyLine);
    textDiv.appendChild(latinLine);

    inner.appendChild(logo);
    inner.appendChild(textDiv);
    footer.appendChild(inner);

    document.body.appendChild(footer);
  }

  // چک تم دارک
  function applyDarkMode() {
    const footer = document.getElementById("site-footer");
    if (!footer) return;
    if (document.body.classList.contains("dark")) {
      footer.style.borderTopColor = "#4a5568";
    } else {
      footer.style.borderTopColor = "#e9ecef";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      createFooter();
      applyDarkMode();
    });
  } else {
    createFooter();
    applyDarkMode();
  }

  // هر بار تم عوض شد، دوباره چک کن
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.attributeName === "class") {
        applyDarkMode();
      }
    });
  });
  observer.observe(document.body, { attributes: true });
})();
