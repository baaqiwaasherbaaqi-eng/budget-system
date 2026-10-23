// ============================================
// کلید میانبر Ctrl+S / Cmd+S برای ذخیره فرم‌ها
// ============================================
(function () {
    'use strict';

    // جلوگیری از کلیک تکراری
    let isSaving = false;

    function findActiveSaveButton() {
        // ۱. اول ببین مدال بازی هست؟
        const modals = document.querySelectorAll(
            '.modal-overlay.open, .dependent-modal-overlay.open, .modal-overlay.show, .modal.show'
        );

        for (const modal of modals) {
            // دکمه ذخیره رو داخل مدال پیدا کن
            const btn = modal.querySelector(
                '.btn-save:not([disabled]), button[onclick*="save"]:not([disabled]), button[onclick*="Save"]:not([disabled]), [data-save-btn]:not([disabled])'
            );
            if (btn && isVisible(btn)) return btn;
        }

        // ۲. اگه توی تب هستیم (مثل employee-profile)
        const activePanel = document.querySelector('.tab-panel.active, .tab-content .active');
        if (activePanel) {
            const btn = activePanel.querySelector('.btn-save:not([disabled])');
            if (btn && isVisible(btn)) return btn;
        }

        // ۳. آخرین تلاش: دکمه ذخیره مرئی توی صفحه
        const allSaveBtns = document.querySelectorAll(
            '.btn-save:not([disabled]), .btn-success:not([disabled]), [data-save-btn]:not([disabled])'
        );
        for (const btn of allSaveBtns) {
            if (isVisible(btn)) return btn;
        }

        return null;
    }

    function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function handleCtrlS(e) {
        // Ctrl+S یا Cmd+S
        const isCtrlS = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S');
        if (!isCtrlS) return;

        // جلوگیری از رفتار پیش‌فرض مرورگر (Save Page)
        e.preventDefault();
        e.stopPropagation();

        // اگه قبلاً داره ذخیره می‌کنه، دوباره نزن
        if (isSaving) {
            console.log('[Ctrl+S] در حال ذخیره، صبر کنید...');
            return;
        }

        const saveBtn = findActiveSaveButton();

        if (!saveBtn) {
            console.log('[Ctrl+S] دکمه ذخیره‌ای پیدا نشد');
            return;
        }

        isSaving = true;
        console.log('[Ctrl+S] کلیک روی دکمه ذخیره:', saveBtn);

        saveBtn.click();

        // بعد از ۸۰۰ms آزاد کن (تا دکمه از disabled دربیاد)
        setTimeout(() => {
            isSaving = false;
        }, 800);
    }

    // ثبت listener روی document (capture: true برای اطمینان)
    document.addEventListener('keydown', handleCtrlS, true);

    console.log('[Ctrl+S] کلید میانبر ذخیره فعال شد ✅');
})();