// ============================================
// توابع مشترک سامانه بودجه
// ============================================

// تبدیل اعداد فارسی به انگلیسی
function toEnglishNumbers(str) {
  if (str === null || str === undefined) return "";
  return str.toString().replace(/[۰-۹]/g, function (d) {
    return "۰۱۲۳۴۵۶۷۸۹".indexOf(d);
  });
}

// تبدیل اعداد انگلیسی به فارسی
function toPersianNumbers(str) {
  if (str === null || str === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
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

// ============================================
// اتصال توابع به window (برای دسترسی global)
// ============================================
window.toEnglishNumbers = toEnglishNumbers;
window.toPersianNumbers = toPersianNumbers;
window.formatAmount = formatAmount;
window.setupAmountInput = setupAmountInput;
window.getAmountValue = getAmountValue;
window.clearAmountInput = clearAmountInput;
