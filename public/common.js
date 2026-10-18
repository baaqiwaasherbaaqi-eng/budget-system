// ============================================
// توابع مشترک سامانه بودجه
// ============================================


// تبدیل اعداد فارسی به انگلیسی
function toEnglishNumbers(str) {
  if (str === null || str === undefined) return "";
  return str.toString().replace(/[\u06F0-\u06F9]/g, function (d) {
    return "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9".indexOf(d);
  });
}

// تبدیل اعداد انگلیسی به فارسی (فارسی استاندارد - U+06F0 تا U+06F9)
function toPersianNumbers(str) {
  if (str === null || str === undefined) return "";
  const persianDigits = ["\u06F0", "\u06F1", "\u06F2", "\u06F3", "\u06F4", "\u06F5", "\u06F6", "\u06F7", "\u06F8", "\u06F9"];
  return str.toString().replace(/\d/g, function (d) {
    return persianDigits[parseInt(d)];
  });
}

// فرمت مبلغ با کاما و اعداد فارسی (برای نمایش)
function formatAmount(amount) {
  if (!amount && amount !== 0) return "۰";
  const num = Math.round(Number(amount));
  return toPersianNumbers(num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
}

// راه‌اندازی فیلد مبلغ با فرمت خودکار
function setupAmountInput(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener("input", function (e) {
    let value = e.target.value;
    value = toEnglishNumbers(value);
    value = value.replace(/,/g, "");
    value = value.replace(/[^\d]/g, "");

    if (value === "") {
      e.target.value = "";
      e.target.dataset.value = "";
      return;
    }

    const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    e.target.value = toPersianNumbers(formatted);
    e.target.dataset.value = value;
  });
}

// گرفتن مقدار عددی از فیلد مبلغ
function getAmountValue(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return 0;

  let value = input.dataset.value || input.value;
  value = toEnglishNumbers(value);
  value = value.replace(/,/g, "");
  value = value.replace(/[^\d]/g, "");

  return value === "" ? 0 : Number(value);
}

// پاک کردن فیلد مبلغ
function clearAmountInput(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.value = "";
  input.dataset.value = "";
}

// بررسی اعتبار توکن
function isTokenValid() {
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
}

// ============================================
// ساخت HTML Context Menu برای اطلاعات پایه
// ============================================
function buildContextMenuHTML(node, options = {}) {
    const {
        maxLevel = 99,
        hasAddChild = true,
        hasAddSibling = true,
    } = options;

    let html = '';

    // افزودن زیرشاخه (اگه عمق مجاز باشه)
    if (hasAddChild && node.level < maxLevel) {
        html += `<button onclick="ctxAction('add-child')">➕ افزودن زیرشاخه</button>`;
    }

    // افزودن هم‌سطح (اگه والد داره)
    if (hasAddSibling && node.parent_id) {
        html += `<button onclick="ctxAction('add-sibling')">➕ افزودن هم‌سطح</button>`;
    }

    // خط جداکننده (اگه دکمه افزودن داشتیم)
    if (html !== '') {
        html += '<div class="divider"></div>';
    }

    // ویرایش
    html += `<button onclick="ctxAction('edit')">✏️ ویرایش</button>`;

    // تغییر وضعیت
    html += `<button onclick="ctxAction('toggle')">${node.is_active ? '🔄 غیرفعال کردن' : '🔄 فعال کردن'}</button>`;

    // حذف
    html += '<div class="divider"></div>';
    html += `<button class="danger" onclick="ctxAction('delete')">🗑️ حذف</button>`;

    return html;
}




// ============================================
// جابجایی هم‌سطح (در ctxAction استفاده بشه)
// ============================================
function getParentForSibling(node, flatData) {
    if (!node.parent_id) return null;
    return flatData.find(n => n.id === node.parent_id) || null;
}

window.buildContextMenuHTML = buildContextMenuHTML;
window.getParentForSibling = getParentForSibling;

// ============================================
// اتصال توابع به window (برای دسترسی global)
// ============================================
window.toEnglishNumbers = toEnglishNumbers;
window.toPersianNumbers = toPersianNumbers;
window.formatAmount = formatAmount;
window.setupAmountInput = setupAmountInput;
window.getAmountValue = getAmountValue;
window.clearAmountInput = clearAmountInput;
window.isTokenValid = isTokenValid;
