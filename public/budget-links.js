// ============================================
// budget-links.js — کامپوننت مشترک ارتباطات بودجه
// ============================================

// ============================================
// باز کردن مودال انتخاب درخت (اقتصادی/سازمانی)
// ============================================
async function openTreePickerModal(config) {
    // config = { targetType: 'economic'|'organization', economicType: 'expense'|'resource', onConfirm: function(selectedIds) }

    const { targetType, economicType, onConfirm } = config;

    // ساخت مودال
    let modal = document.getElementById('tree-picker-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'tree-picker-modal';
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
        <div class="modal" style="max-width: 700px;">
            <h3 id="tree-picker-title">انتخاب ${targetType === 'economic' ? 'طبقه‌بندی اقتصادی' : 'سازمان مدیریت‌کننده'}</h3>
            
            <div style="margin-bottom: 15px;">
                <input type="text" id="tree-picker-search" placeholder="جستجو..." 
                       style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; font-family:'Vazirmatn';" />
            </div>
            
            <div id="tree-picker-info" style="background:#e7f3ff; border-right:4px solid #17a2b8; padding:10px 15px; border-radius:6px; margin-bottom:15px; font-size:12px; color:#0c5460;">
                💡 فقط <b>برگ‌ها</b> (ردیف‌های بدون فرزند) قابل انتخاب هستند. با انتخاب یک گروه، همه زیرمجموعه‌های برگ آن نیز اضافه می‌شوند.
            </div>
            
            <div id="tree-picker-container" style="max-height: 400px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; background: #f8f9fa;">
                <div style="text-align:center; padding:40px; color:#999;">در حال بارگذاری...</div>
            </div>
            
            <div class="modal-actions" style="margin-top:20px;">
                <button class="btn-cancel" onclick="document.getElementById('tree-picker-modal').remove()">انصراف</button>
                <button class="btn-save" id="tree-picker-confirm" style="background:#28a745;">✅ تایید و افزودن</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // لود درخت
    let allItems = [];
    try {
        let apiUrl;
        if (targetType === 'economic') {
            apiUrl = `/api/base-data?section=economic&type=${economicType || 'expense'}`;
        } else {
            apiUrl = `/api/base-data?section=organization`;
        }

        const res = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allItems = await res.json();
    } catch (e) {
        document.getElementById('tree-picker-container').innerHTML = 
            `<div style="text-align:center; padding:20px; color:#dc3545;">خطا در بارگذاری: ${e.message}</div>`;
        return;
    }

    // ساخت درخت
    const tree = buildPickerTree(allItems);
    const selectedIds = new Set();

    const renderPickerTree = (nodes, container, depth = 0) => {
        nodes.forEach(node => {
            const hasChildren = node.children && node.children.length > 0;

            const row = document.createElement('div');
            row.style.cssText = `display:flex; align-items:center; padding:8px 12px; margin-bottom:4px; border-radius:6px; background:white; border-right:3px solid ${hasChildren ? '#999' : '#28a745'}; cursor:${hasChildren ? 'default' : 'pointer'}; transition:all 0.15s;`;
            row.style.marginRight = (depth * 20) + 'px';

            const isLeaf = !hasChildren;
            const isSelected = selectedIds.has(node.id);

            row.innerHTML = `
                <input type="checkbox" data-id="${node.id}" data-leaf="${isLeaf}" 
                       ${isSelected ? 'checked' : ''} 
                       ${isLeaf ? '' : 'disabled'}
                       style="margin-left:10px; width:18px; height:18px; ${isLeaf ? 'cursor:pointer;' : 'cursor:not-allowed; opacity:0.3;'}" />
                <span style="margin-left:6px;">${hasChildren ? '📁' : '📄'}</span>
                <span style="flex:1; font-size:13px; ${isLeaf ? 'font-weight:bold;' : 'color:#666;'}">${node.title}</span>
                <span style="font-family:monospace; font-size:11px; color:#667eea; background:#f0f2f5; padding:2px 8px; border-radius:10px;">${node.code}</span>
            `;

            if (isLeaf) {
                row.addEventListener('click', (e) => {
                    if (e.target.type === 'checkbox') return;
                    const cb = row.querySelector('input[type="checkbox"]');
                    cb.checked = !cb.checked;
                    if (cb.checked) selectedIds.add(node.id);
                    else selectedIds.delete(node.id);
                });

                const cb = row.querySelector('input[type="checkbox"]');
                cb.addEventListener('change', () => {
                    if (cb.checked) selectedIds.add(node.id);
                    else selectedIds.delete(node.id);
                });
            }

            container.appendChild(row);

            if (hasChildren) {
                renderPickerTree(node.children, container, depth + 1);
            }
        });
    };

    const container = document.getElementById('tree-picker-container');
    container.innerHTML = '';
    renderPickerTree(tree, container);

    // جستجو
    const searchInput = document.getElementById('tree-picker-search');
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        container.querySelectorAll('div').forEach(row => {
            if (!row.querySelector('input[type="checkbox"]')) return;
            const text = row.textContent.toLowerCase();
            row.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
        });
    });

    // تایید
    document.getElementById('tree-picker-confirm').addEventListener('click', () => {
        if (selectedIds.size === 0) {
            alert('حداقل یک مورد انتخاب کنید');
            return;
        }
        const ids = Array.from(selectedIds);
        document.getElementById('tree-picker-modal').remove();
        onConfirm(ids);
    });
}

// ساخت درخت از لیست تخت
function buildPickerTree(items) {
    const map = {};
    const roots = [];
    items.forEach(item => { map[item.id] = { ...item, children: [] }; });
    items.forEach(item => {
        if (item.parent_id && map[item.parent_id]) {
            map[item.parent_id].children.push(map[item.id]);
        } else {
            roots.push(map[item.id]);
        }
    });
    const sortRecursive = (nodes) => {
        nodes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.code.localeCompare(b.code));
        nodes.forEach(n => sortRecursive(n.children));
    };
    sortRecursive(roots);
    return roots;
}

// ============================================
// رندر لیست ارتباطات
// ============================================
async function renderBudgetLinksList(containerId, sourceType, sourceId, targetType, refreshCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">در حال بارگذاری...</div>';

    try {
        const res = await fetch(`/api/budget-links?source_type=${sourceType}&source_id=${sourceId}&target_type=${targetType}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const items = await res.json();

        if (items.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">هنوز ارتباطی ثبت نشده</div>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8f9fa; padding:10px 15px; border-radius:6px; margin-bottom:6px; border-right:3px solid #667eea;">
                <div style="flex:1;">
                    <div style="font-size:13px; font-weight:bold; color:#333;">${item.target_title || '—'}</div>
                    <div style="font-size:11px; color:#888; margin-top:3px;">
                        کد: ${item.target_code_full || item.target_code || '—'}
                        ${item.is_primary === 1 ? '<span style="background:#28a745; color:white; padding:2px 8px; border-radius:10px; font-size:10px; margin-right:8px;">⭐ اصلی</span>' : ''}
                    </div>
                </div>
                <button onclick="deleteBudgetLink(${item.id}, '${refreshCallback}')" 
                        style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:11px;">🗑️</button>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:#dc3545;">خطا: ${e.message}</div>`;
    }
}

// ============================================
// حذف ارتباط
// ============================================
async function deleteBudgetLink(linkId, refreshCallbackName) {
    if (!confirm('مطمئن هستید این ارتباط حذف شود؟')) return;
    try {
        const res = await fetch(`/api/budget-links/${linkId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        showToast('با موفقیت حذف شد');
        if (window[refreshCallbackName]) window[refreshCallbackName]();
    } catch (e) {
        showToast('خطا در حذف', 'error');
    }
}