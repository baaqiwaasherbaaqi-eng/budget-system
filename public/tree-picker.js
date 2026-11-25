/* ============================================
   TreePicker Component v1.1
   انتخابگر درختی با CRUD داخلی
   ============================================ */

   (function (global) {
    'use strict';

    // ============================================
    // API Adapterها
    // ============================================
    const ADAPTERS = {
        persons: {
            tree: async (params) => {
                const qs = new URLSearchParams(params || {}).toString();
                const res = await fetch(`/api/persons/tree${qs ? '?' + qs : ''}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (!res.ok) throw new Error('خطا در بارگذاری درخت');
                const data = await res.json();
                
                // ✅ API nested tree می‌ده → flatten می‌کنیم
                const flat = [];
                const walk = (nodes) => {
                    if (!Array.isArray(nodes)) return;
                    nodes.forEach(n => {
                        const children = n.children || [];
                        const { children: _ignore, ...item } = n;
                        flat.push(item);
                        if (children.length > 0) walk(children);
                    });
                };
                walk(data);
                
                console.log('🌳 Flattened:', flat.length, 'items | ریشه‌ها:', data.length);
                return flat;
            },

            nextCode: async (parentId, params) => {
                const q = { ...(params || {}) };
                if (parentId) q.parent_id = parentId;
                const res = await fetch(`/api/persons/next-code?${new URLSearchParams(q)}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                return data.next_code || '';
            },

            create: async (data) => {
                const res = await fetch('/api/persons', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'خطا در افزودن');
                return result;
            },

            update: async (id, data) => {
                const res = await fetch(`/api/persons/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'خطا در ویرایش');
                return result;
            },

            remove: async (id) => {
                const res = await fetch('/api/persons/bulk-delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ ids: [id] })
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'خطا در حذف');
                if (result.errors && result.errors.length > 0) {
                    throw new Error(result.errors[0].reason);
                }
                return result;
            },

            getId: (n) => n.id,
            getParentId: (n) => n.parent_id,
            getCode: (n) => n.code,
            getTitle: (n) => n.full_name || n.title || '-',
            getLevel: (n) => n.level,
            getIsActive: (n) => n.is_active,

            levelNames: { 1: 'گروه اصلی', 2: 'گروه فرعی', 3: 'دسته', 4: 'شخص' },
            levelIcons: { 1: '📁', 2: '📂', 3: '🏷️', 4: '👤' },

            isSelectable: (n, config) => {
                const levels = config.selectableLevels || [4];
                return levels.includes(n.level);
            },

            isAddable: (n) => n.level < 4,

            buildForm: ({ item, level, isEdit, parent }) => {
                if (level === 4) {
                    return {
                        title: isEdit
                            ? `✏️ ویرایش سریع شخص: ${item.full_name}`
                            : `➕ افزودن شخص جدید`,
                        info: isEdit
                            ? `کد: <b>${item.code}</b>`
                            : parent
                                ? `زیر مجموعه: <b>${parent.full_name}</b> (${parent.code})`
                                : '',
                        fields: [
                            { name: 'first_name', label: 'نام', type: 'text', required: true, value: item?.first_name || '' },
                            { name: 'last_name', label: 'نام خانوادگی', type: 'text', required: true, value: item?.last_name || '' },
                            { name: 'national_id', label: 'کد ملی', type: 'text', required: true, maxLength: 10, dir: 'ltr', value: item?.national_id || '' },
                            { name: 'mobile', label: 'موبایل', type: 'text', required: true, maxLength: 11, dir: 'ltr', value: item?.mobile || '' },
                        ],
                        extraBtn: isEdit ? {
                            label: '📝 تکمیل اطلاعات در پرونده کامل',
                            onClick: () => {
                                window.open(`/persons.html#edit-${item.id}`, '_blank');
                            }
                        } : null,
                    };
                }

                return {
                    title: isEdit ? `✏️ ویرایش: ${item.full_name}` : `➕ افزودن ${ADAPTERS.persons.levelNames[level] || 'شاخه جدید'}`,
                    info: !isEdit && parent
                        ? `زیر مجموعه: <b>${parent.full_name}</b> (${parent.code})`
                        : isEdit ? `کد: <b>${item.code}</b>` : '',
                    fields: [
                        { name: 'full_name', label: 'نام / عنوان', type: 'text', required: true, value: item?.full_name || '' },
                        { name: 'notes', label: 'توضیحات', type: 'textarea', required: false, value: item?.notes || '' },
                    ],
                };
            },

            buildPayload: ({ formData, item, level, parent, extraParams }) => {
                if (level === 4) {
                    const fullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim();
                    return {
                        person_type: parent?.person_type || item?.person_type || extraParams?.person_type || 'employee',
                        full_name: fullName,
                        first_name: formData.first_name || null,
                        last_name: formData.last_name || null,
                        national_id: formData.national_id || null,
                        mobile: formData.mobile || null,
                        parent_id: item?.parent_id || parent?.id || null,
                    };
                }
                return {
                    person_type: parent?.person_type || item?.person_type || extraParams?.person_type || 'employee',
                    full_name: formData.full_name || null,
                    notes: formData.notes || null,
                    parent_id: item?.parent_id || parent?.id || null,
                };
            },
        },
    };

    // ============================================
    // استایل خودکار
    // ============================================
    function ensureStyles() {
        if (document.getElementById('tree-picker-css')) return;
        const link = document.createElement('link');
        link.id = 'tree-picker-css';
        link.rel = 'stylesheet';
        link.href = '/tree-picker.css';
        document.head.appendChild(link);
    }

    // ============================================
    // State
    // ============================================
    const state = {
        config: null,
        adapter: null,
        allItems: [],
        selectedIds: new Set(),
        expandedIds: new Set(),
        treeEl: null,
        overlayEl: null,
        searchTerm: '',
        originalSelection: null,
    };

    // ============================================
    // Helpers
    // ============================================
    function toast(msg, type = 'success') {
        let el = document.getElementById('tp-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'tp-toast';
            el.className = 'tp-toast';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.className = `tp-toast ${type} show`;
        clearTimeout(el._timer);
        el._timer = setTimeout(() => el.classList.remove('show'), 3000);
    }

    function buildTree(items) {
        const map = {};
        const roots = [];
        items.forEach(item => {
            const id = state.adapter.getId(item);
            map[id] = { ...item, children: [] };
        });
        items.forEach(item => {
            const id = state.adapter.getId(item);
            const pid = state.adapter.getParentId(item);
            if (pid && map[pid]) map[pid].children.push(map[id]);
            else roots.push(map[id]);
        });
        const sortRecursive = (nodes) => {
            nodes.sort((a, b) => {
                const sa = Number(a.sort_order) || 0;
                const sb = Number(b.sort_order) || 0;
                if (sa !== sb) return sa - sb;
                return String(state.adapter.getCode(a) || '').localeCompare(
                    String(state.adapter.getCode(b) || '')
                );
            });
            nodes.forEach(n => sortRecursive(n.children));
        };
        sortRecursive(roots);
        return roots;
    }

    // ============================================
    // Render
    // ============================================
    function renderTree() {
        const container = state.treeEl;
        if (!container) return;

        if (!state.allItems.length) {
            container.innerHTML = `<div class="tp-empty">📭 موردی یافت نشد</div>`;
            return;
        }

        const tree = buildTree(state.allItems);
        const term = state.searchTerm.trim().toLowerCase();
        container.innerHTML = '';

        const renderNode = (node, depth) => {
            const id = state.adapter.getId(node);
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = state.expandedIds.has(id);
            const level = state.adapter.getLevel(node);
            const code = state.adapter.getCode(node);
            const title = state.adapter.getTitle(node);
            const isActive = state.adapter.getIsActive(node) !== 0;
            const isSelected = state.selectedIds.has(id);
            const isSelectable = state.adapter.isSelectable(node, state.config);
            const isAddable = state.config.canAdd && state.adapter.isAddable(node);

            // فیلتر جستجو
            if (term) {
                const selfMatch =
                    String(title).toLowerCase().includes(term) ||
                    String(code).toLowerCase().includes(term);
                if (!selfMatch) {
                    const hasMatchInSubtree = (n) => {
                        if (String(state.adapter.getTitle(n)).toLowerCase().includes(term)) return true;
                        if (String(state.adapter.getCode(n)).toLowerCase().includes(term)) return true;
                        return (n.children || []).some(hasMatchInSubtree);
                    };
                    if (!hasMatchInSubtree(node)) return;
                }
            }

            const icon = (state.adapter.levelIcons && state.adapter.levelIcons[level]) || '•';
            const levelName = (state.adapter.levelNames && state.adapter.levelNames[level]) || `سطح ${level}`;

            const nodeEl = document.createElement('div');
            nodeEl.className = 'tp-node';
            if (isSelected) nodeEl.classList.add('selected');
            if (!isActive) nodeEl.classList.add('disabled');
            nodeEl.style.paddingRight = (8 + depth * 20) + 'px';

            let checkboxHtml = '';
            if (state.config.mode === 'multi' && isSelectable) {
                checkboxHtml = `<input type="checkbox" ${isSelected ? 'checked' : ''} data-role="select" />`;
            } else if (state.config.mode === 'single' && isSelectable) {
                checkboxHtml = `<input type="radio" name="tp-single" ${isSelected ? 'checked' : ''} data-role="select" />`;
            } else {
                checkboxHtml = `<span style="width:16px; display:inline-block;"></span>`;
            }

            const toggleHtml = hasChildren
                ? `<button class="tp-toggle" data-role="toggle">${isExpanded ? '▼' : '◀'}</button>`
                : `<button class="tp-toggle empty">•</button>`;

            const actions = [];
            if (state.config.canEdit && isActive) {
                actions.push(`<button class="tp-action-btn" data-role="edit" title="ویرایش">✏️</button>`);
            }
            if (isAddable) {
                actions.push(`<button class="tp-action-btn" data-role="add" title="افزودن زیرشاخه">➕</button>`);
            }
            if (state.config.canDelete) {
                actions.push(`<button class="tp-action-btn danger" data-role="delete" title="حذف">🗑️</button>`);
            }

            nodeEl.innerHTML = `
                ${toggleHtml}
                ${checkboxHtml}
                <span class="tp-icon">${icon}</span>
                <span class="tp-code">${code}</span>
                <span class="tp-title">${title}${!isActive ? ' (غیرفعال)' : ''}</span>
                <span class="tp-level-badge">${levelName}</span>
                <span class="tp-actions">${actions.join('')}</span>
            `;

            // ✅ رویدادها — با استفاده از closest برای دقت
            nodeEl.addEventListener('click', (e) => {
                const roleBtn = e.target.closest('[data-role]');
                const role = roleBtn ? roleBtn.dataset.role : null;

                if (role === 'toggle') {
                    e.stopPropagation();
                    if (state.expandedIds.has(id)) state.expandedIds.delete(id);
                    else state.expandedIds.add(id);
                    renderTree();
                    return;
                }
                if (role === 'edit') {
                    e.stopPropagation();
                    openCrudForm('edit', node, null);   // ✅ اصلاح شد
                    return;
                }
                if (role === 'add') {
                    e.stopPropagation();
                    openCrudForm('add', null, node);    // ✅ اصلاح شد
                    return;
                }
                if (role === 'delete') {
                    e.stopPropagation();
                    handleDelete(node);
                    return;
                }
                if (role === 'select') {
                    e.stopPropagation();
                    handleSelect(node);
                    return;
                }

                // کلیک روی خود ردیف
                if (isSelectable && isActive) {
                    handleSelect(node);
                }
            });

            container.appendChild(nodeEl);

            if (hasChildren && isExpanded) {
                node.children.forEach(child => renderNode(child, depth + 1));
            }
        };

        tree.forEach(root => renderNode(root, 0));
    }

    function handleSelect(node) {
        const id = state.adapter.getId(node);
        if (state.config.mode === 'single') {
            state.selectedIds.clear();
            state.selectedIds.add(id);
        } else {
            if (state.selectedIds.has(id)) state.selectedIds.delete(id);
            else state.selectedIds.add(id);
        }
        renderTree();
        updateFooterCount();
    }

    function updateFooterCount() {
        const countEl = state.overlayEl?.querySelector('.tp-footer-count');
        if (!countEl) return;
        if (state.config.mode === 'single') {
            const id = Array.from(state.selectedIds)[0];
            if (!id) {
                countEl.innerHTML = 'هیچ موردی انتخاب نشده';
                return;
            }
            const item = state.allItems.find(x => state.adapter.getId(x) === id);
            countEl.innerHTML = `انتخاب‌شده: <b>${item ? state.adapter.getTitle(item) : '-'}</b>`;
        } else {
            countEl.innerHTML = `<b>${state.selectedIds.size}</b> مورد انتخاب شده`;
        }
    }

    // ============================================
    // CRUD
    // ============================================
    function openCrudForm(mode, item, parent) {
        const level = mode === 'edit'
            ? state.adapter.getLevel(item)
            : (parent ? state.adapter.getLevel(parent) + 1 : 1);

        const form = state.adapter.buildForm({ item, parent, level, isEdit: mode === 'edit' });

        const overlay = document.createElement('div');
        overlay.className = 'tp-crud-overlay open';
        overlay.innerHTML = `
            <div class="tp-crud-modal">
                <h3>${form.title}</h3>
                ${form.info ? `<div class="tp-crud-info">${form.info}</div>` : ''}
                <div class="tp-form-fields">
                    ${form.fields.map(f => {
                        const req = f.required ? '<span class="required">*</span>' : '';
                        const val = f.value != null ? String(f.value).replace(/"/g, '&quot;') : '';
                        if (f.type === 'textarea') {
                            return `
                                <div class="tp-form-group">
                                    <label>${f.label} ${req}</label>
                                    <textarea name="${f.name}" ${f.required ? 'required' : ''}>${val}</textarea>
                                </div>`;
                        }
                        return `
                            <div class="tp-form-group">
                                <label>${f.label} ${req}</label>
                                <input type="${f.type || 'text'}"
                                       name="${f.name}"
                                       value="${val}"
                                       ${f.required ? 'required' : ''}
                                       ${f.maxLength ? `maxlength="${f.maxLength}"` : ''}
                                       ${f.dir ? `dir="${f.dir}"` : ''} />
                            </div>`;
                    }).join('')}
                </div>
                <div class="tp-crud-actions">
                    ${form.extraBtn ? `<button class="tp-btn" data-role="extra" style="background:#6f42c1; color:white; margin-left:auto;">${form.extraBtn.label}</button>` : ''}
                    <button class="tp-btn tp-btn-cancel" data-role="cancel">انصراف</button>
                    <button class="tp-btn tp-btn-confirm" data-role="save">ذخیره</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('[data-role="cancel"]').onclick = close;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        if (form.extraBtn) {
            overlay.querySelector('[data-role="extra"]').onclick = () => form.extraBtn.onClick();
        }

        overlay.querySelector('[data-role="save"]').onclick = async () => {
            const formData = {};
            let hasError = false;
            form.fields.forEach(f => {
                const input = overlay.querySelector(`[name="${f.name}"]`);
                const val = input.value.trim();
                if (f.required && !val) {
                    input.style.borderColor = '#ef4444';
                    hasError = true;
                } else {
                    input.style.borderColor = '';
                }
                formData[f.name] = val;
            });

            if (hasError) {
                toast('فیلدهای ستاره‌دار الزامی هستند', 'error');
                return;
            }

            const saveBtn = overlay.querySelector('[data-role="save"]');
            saveBtn.disabled = true;
            saveBtn.textContent = 'در حال ذخیره...';

            try {
                const payload = state.adapter.buildPayload({
                    formData, item, parent, level, extraParams: state.config.params
                });

                if (mode === 'edit') {
                    await state.adapter.update(state.adapter.getId(item), {
                        ...payload,
                        is_active: state.adapter.getIsActive(item) ? 1 : 0,
                    });
                    toast('با موفقیت ویرایش شد');
                } else {
                    await state.adapter.create(payload);
                    toast('با موفقیت افزوده شد');
                }

                close();
                await reloadTree();


// ===== DEBUG: ببین داده‌ها چطور میان =====
console.log('🌳 TreePicker DEBUG:');
console.log('  - تعداد آیتم‌ها:', state.allItems.length);
console.log('  - نمونه آیتم:', state.allItems[0]);
console.log('  - سطح‌ها:', [...new Set(state.allItems.map(x => x.level))]);
console.log('  - parents:', [...new Set(state.allItems.map(x => x.parent_id))]);
console.log('  - person_types:', [...new Set(state.allItems.map(x => x.person_type))]);

                if (parent) state.expandedIds.add(state.adapter.getId(parent));
                renderTree();
                updateFooterCount();
            } catch (err) {
                toast(err.message || 'خطا در ذخیره', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = 'ذخیره';
            }
        };
    }

    async function handleDelete(node) {
        const id = state.adapter.getId(node);
        const title = state.adapter.getTitle(node);

        const descendants = state.allItems.filter(x => {
            let p = x;
            let guard = 0;
            while (p && state.adapter.getParentId(p) && guard++ < 100) {
                const pid = state.adapter.getParentId(p);
                if (pid === id) return true;
                p = state.allItems.find(y => state.adapter.getId(y) === pid);
            }
            return false;
        });

        let msg = `مطمئن هستید "${title}" حذف شود؟`;
        if (descendants.length > 0) {
            msg = `⚠️ "${title}" دارای ${descendants.length} زیرمجموعه است.\n\nبا تأیید، همه زیرمجموعه‌ها هم حذف می‌شوند.\n\nمطمئن هستید؟`;
        }
        if (!confirm(msg)) return;

        try {
            await state.adapter.remove(id);
            toast('با موفقیت حذف شد');
            state.selectedIds.delete(id);
            descendants.forEach(d => state.selectedIds.delete(state.adapter.getId(d)));
            await reloadTree();
            renderTree();
            updateFooterCount();
        } catch (err) {
            toast(err.message || 'خطا در حذف', 'error');
        }
    }

    // ============================================
    // Load
    // ============================================
    async function reloadTree() {
        const items = await state.adapter.tree(state.config.params || {});
        state.allItems = Array.isArray(items) ? items : [];
    }

    // ============================================
    // Main Open
    // ============================================
    async function open(config) {
        ensureStyles();

        const adapter = ADAPTERS[config.source];
        if (!adapter) {
            toast('منبع نامعتبر: ' + config.source, 'error');
            return;
        }

        config.mode = config.mode || 'single';
        config.selectableLevels = config.selectableLevels || [4];
        config.canAdd = config.canAdd !== false;
        config.canEdit = config.canEdit !== false;
        config.canDelete = config.canDelete !== false;

        state.config = config;
        state.adapter = adapter;
        state.selectedIds = new Set(config.selectedIds || []);
        state.originalSelection = new Set(config.selectedIds || []);
        state.expandedIds = new Set();
        state.searchTerm = '';

        const overlay = document.createElement('div');
        overlay.className = 'tp-overlay open';
        overlay.innerHTML = `
            <div class="tp-modal">
                <div class="tp-header">
                    <h3>${config.title || 'انتخاب'}</h3>
                    <button class="tp-close" data-role="close">✕</button>
                </div>
                <div class="tp-toolbar">
                    <input type="text" class="tp-search" placeholder="🔍 جستجو در کد یا عنوان..." data-role="search" />
                    ${config.canAdd ? `<button class="tp-btn-add-root" data-role="add-root">➕ افزودن ریشه</button>` : ''}
                </div>
                <div class="tp-body">
                    <div class="tp-tree">
                        <div class="tp-loading">
                            <div class="tp-spinner"></div>
                            <div>در حال بارگذاری...</div>
                        </div>
                    </div>
                </div>
                <div class="tp-footer">
                    <div class="tp-footer-count">هیچ موردی انتخاب نشده</div>
                    <div class="tp-footer-actions">
                        <button class="tp-btn tp-btn-cancel" data-role="cancel">انصراف</button>
                        <button class="tp-btn tp-btn-confirm" data-role="confirm">✓ تأیید</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        state.overlayEl = overlay;
        state.treeEl = overlay.querySelector('.tp-tree');

        const close = () => {
            overlay.remove();
            state.overlayEl = null;
            state.treeEl = null;
        };

        overlay.querySelector('[data-role="close"]').onclick = close;
        overlay.querySelector('[data-role="cancel"]').onclick = () => {
            state.selectedIds = new Set(state.originalSelection);
            close();
        };
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        overlay.querySelector('[data-role="search"]').oninput = (e) => {
            state.searchTerm = e.target.value || '';
            renderTree();
        };

        const addRootBtn = overlay.querySelector('[data-role="add-root"]');
        if (addRootBtn) {
            addRootBtn.onclick = () => openCrudForm('add', null, null);
        }

        overlay.querySelector('[data-role="confirm"]').onclick = () => {
            const selected = state.allItems.filter(x =>
                state.selectedIds.has(state.adapter.getId(x))
            );
            if (typeof config.onConfirm === 'function') config.onConfirm(selected);
            close();
        };

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        try {
            await reloadTree();
            state.allItems
                .filter(x => !state.adapter.getParentId(x))
                .forEach(x => state.expandedIds.add(state.adapter.getId(x)));
            renderTree();
            updateFooterCount();
        } catch (err) {
            state.treeEl.innerHTML = `<div class="tp-empty" style="color:#ef4444;">❌ خطا: ${err.message}</div>`;
        }
    }

    global.TreePicker = { open };
})(window);