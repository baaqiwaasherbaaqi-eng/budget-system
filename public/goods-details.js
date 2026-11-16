// ============================================
// goods-details.js — نسخه نهایی و قطعی
// ============================================

// state
let currentModalTab = 'basic';
let editingGoodsId = null;
let currentGoodsDetails = null;
let currentGoodsPersons = [];
let customFieldsArray = [];
let vehicleCustomFieldsArray = [];
let selectedPerson = null;
let searchDebounceTimer = null;

// ============================================
// سوئیچ تب
// ============================================
function switchModalTab(tab) {
    currentModalTab = tab;
    document.querySelectorAll('.modal-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.modal-tab-panel').forEach(p => {
        p.classList.toggle('active', p.id === 'panel-' + tab);
    });
}

// ============================================
// نمایش/مخفی تب‌ها
// ============================================
function updateModalTabsVisibility(level, isVehicle) {
    const tabs = document.getElementById('modal-tabs');
    const vehicleTab = document.querySelector('.modal-tab[data-tab="vehicle"]');
    if (!tabs) return;
    if (level === 3) {
        tabs.style.display = 'flex';
        if (vehicleTab) vehicleTab.style.display = isVehicle ? 'flex' : 'none';
        if (!isVehicle && currentModalTab === 'vehicle') switchModalTab('details');
    } else {
        tabs.style.display = 'none';
        if (vehicleTab) vehicleTab.style.display = 'none';
        switchModalTab('basic');
    }
}

// ============================================
// فیلدهای سفارشی
// ============================================
function renderCustomFieldsList(containerId, arr, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (arr.length === 0) {
        container.innerHTML = '<div style="color:#999; font-size:12px; padding:8px 0;">فیلدی تعریف نشده</div>';
        return;
    }
    container.innerHTML = arr.map((f, idx) => `
        <div class="custom-field-row">
            <input type="text" placeholder="نام فیلد" value="${f.key || ''}" onchange="updateCustomFieldArray('${type}', ${idx}, 'key', this.value)" style="flex:0.8;" />
            <input type="text" placeholder="مقدار" value="${f.value || ''}" onchange="updateCustomFieldArray('${type}', ${idx}, 'value', this.value)" style="flex:1.2;" />
            <button type="button" class="btn-remove-field" onclick="removeCustomFieldFrom('${type}', ${idx})">✕</button>
        </div>
    `).join('');
}
function updateCustomFieldArray(type, idx, field, value) {
    const arr = type === 'vehicle' ? vehicleCustomFieldsArray : customFieldsArray;
    if (arr[idx]) arr[idx][field] = value;
}
function addCustomFieldTo(type) {
    const arr = type === 'vehicle' ? vehicleCustomFieldsArray : customFieldsArray;
    arr.push({ key: '', value: '' });
    renderCustomFieldsList(type === 'vehicle' ? 'vehicle-custom-fields-list' : 'custom-fields-list', arr, type);
}
function removeCustomFieldFrom(type, idx) {
    const arr = type === 'vehicle' ? vehicleCustomFieldsArray : customFieldsArray;
    arr.splice(idx, 1);
    renderCustomFieldsList(type === 'vehicle' ? 'vehicle-custom-fields-list' : 'custom-fields-list', arr, type);
}

// ============================================
// استاندارد سرویس
// ============================================
function renderServiceStandard(key, label, icon, data) {
    const d = data || { basis: 'km' };
    const basis = d.basis || 'km';
    return `
        <div class="service-standard-box" data-key="${key}">
            <div class="service-standard-header"><span>${icon} ${label}</span></div>
            <div class="service-standard-body">
                <div class="service-basis-radio">
                    <label><input type="radio" name="basis-${key}" value="km" ${basis === 'km' ? 'checked' : ''} onchange="onServiceBasisChange('${key}', 'km')" /> کیلومتر</label>
                    <label><input type="radio" name="basis-${key}" value="date" ${basis === 'date' ? 'checked' : ''} onchange="onServiceBasisChange('${key}', 'date')" /> تاریخ</label>
                    <label><input type="radio" name="basis-${key}" value="amount" ${basis === 'amount' ? 'checked' : ''} onchange="onServiceBasisChange('${key}', 'amount')" /> مقدار</label>
                </div>
                <div class="service-field" data-field="km" style="display: ${basis === 'km' ? 'flex' : 'none'};">
                    <label>کیلومتر:</label><input type="number" class="svc-km-value" step="1" value="${d.km_value || ''}" placeholder="مثلاً ۱۰۰۰۰" />
                    <label>± تلرانس:</label><input type="number" class="svc-km-tolerance" step="100" value="${d.km_tolerance || ''}" placeholder="مضرب ۱۰۰" />
                </div>
                <div class="service-field" data-field="date" style="display: ${basis === 'date' ? 'flex' : 'none'};">
                    <label>هر:</label><input type="number" class="svc-date-months" step="1" value="${d.date_months || ''}" placeholder="مثلاً ۱۲" />
                    <label>ماه ± </label><input type="number" class="svc-date-tolerance" step="1" value="${d.date_tolerance || ''}" placeholder="مثلاً ۱" /><label>ماه</label>
                </div>
                <div class="service-field" data-field="amount" style="display: ${basis === 'amount' ? 'flex' : 'none'};">
                    <label>مقدار:</label><input type="number" class="svc-amount-value" step="0.01" value="${d.amount_value || ''}" placeholder="مثلاً ۴" />
                </div>
                <div class="service-field" style="display: flex;">
                    <label>یادداشت:</label><input type="text" class="svc-notes" value="${d.notes || ''}" placeholder="اختیاری" style="flex:1;" />
                </div>
            </div>
        </div>
    `;
}
function onServiceBasisChange(key, basis) {
    const box = document.querySelector(`.service-standard-box[data-key="${key}"]`);
    if (!box) return;
    box.querySelectorAll('.service-field').forEach(f => {
        const fieldName = f.dataset.field;
        if (fieldName === 'km') f.style.display = basis === 'km' ? 'flex' : 'none';
        else if (fieldName === 'date') f.style.display = basis === 'date' ? 'flex' : 'none';
        else if (fieldName === 'amount') f.style.display = basis === 'amount' ? 'flex' : 'none';
    });
}
function collectServiceStandard(key) {
    const box = document.querySelector(`.service-standard-box[data-key="${key}"]`);
    if (!box) return null;
    const basisRadio = box.querySelector(`input[name="basis-${key}"]:checked`);
    return {
        basis: basisRadio ? basisRadio.value : 'km',
        km_value: parseFloat(box.querySelector('.svc-km-value')?.value) || null,
        km_tolerance: parseFloat(box.querySelector('.svc-km-tolerance')?.value) || null,
        date_months: parseFloat(box.querySelector('.svc-date-months')?.value) || null,
        date_tolerance: parseFloat(box.querySelector('.svc-date-tolerance')?.value) || null,
        amount_value: parseFloat(box.querySelector('.svc-amount-value')?.value) || null,
        notes: box.querySelector('.svc-notes')?.value || null
    };
}

// ============================================
// DatePicker
// ============================================
function initDetailsDatePickers() {
    setTimeout(() => {
        ['detail-purchase-date', 'detail-operation-date', 'detail-battery-last-replace'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            try { $("#" + id).persianDatepicker('destroy'); } catch (e) {}
            $("#" + id).persianDatepicker({ format: 'YYYY/MM/DD', autoClose: true, persianDigit: true, initialValue: !!el.value });
        });
    }, 200);
}

// ============================================
// جستجوی شخص
// ============================================
function searchPersonsDebounced() {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    const q = document.getElementById('person-search-input').value.trim();
    if (q.length < 2) { document.getElementById('person-search-results').style.display = 'none'; return; }
    searchDebounceTimer = setTimeout(() => searchPersons(q), 350);
}
async function searchPersons(query) {
    const box = document.getElementById('person-search-results');
    box.style.display = 'block';
    box.innerHTML = '<div style="padding:15px; text-align:center; color:#999;">🔍 در حال جستجو...</div>';
    try {
        const res = await fetch(`/api/employees/search?q=${encodeURIComponent(query)}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('خطا در جستجو');
        const data = await res.json();
        const results = data.results || [];
        if (results.length === 0) { box.innerHTML = '<div style="padding:15px; text-align:center; color:#999;">❌ یافت نشد</div>'; return; }
        box.innerHTML = results.map(p => `
            <div class="person-search-item" onclick='selectPersonForGoods(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                <div class="ps-name">${p.full_name}</div>
                <div class="ps-meta">کد ملی: ${p.national_id || '—'} | کد: ${p.code || '—'}</div>
            </div>
        `).join('');
    } catch (e) {
        box.innerHTML = `<div style="padding:15px; text-align:center; color:#dc3545;">❌ ${e.message}</div>`;
    }
}
async function selectPersonForGoods(person) {
    selectedPerson = person;
    document.getElementById('person-search-results').style.display = 'none';
    document.getElementById('person-search-input').value = '';
    document.getElementById('selected-person-box').style.display = 'block';
    document.getElementById('selected-person-name').textContent = person.full_name;
    document.getElementById('selected-person-meta').textContent = `کد ملی: ${person.national_id || '—'} | کد: ${person.code || '—'}`;
    document.getElementById('task-select-group').style.display = 'block';
    document.getElementById('relation-select-group').style.display = 'block';
    document.getElementById('person-add-btn-group').style.display = 'block';
    await loadPersonTasks(person.id);
}
async function loadPersonTasks(personId) {
    const select = document.getElementById('person-task-select');
    select.innerHTML = '<option value="">— در حال بارگذاری... —</option>';
    try {
        const res = await fetch(`/api/employees/${personId}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const tasks = await res.json();
        select.innerHTML = '<option value="">— بدون وظیفه —</option>';
        tasks.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = `${t.task_title || 'وظیفه'} (${t.task_type})`;
            select.appendChild(opt);
        });
    } catch {
        select.innerHTML = '<option value="">— خطا در لود وظایف —</option>';
    }
}
function clearSelectedPerson() {
    selectedPerson = null;
    document.getElementById('selected-person-box').style.display = 'none';
    document.getElementById('task-select-group').style.display = 'none';
    document.getElementById('relation-select-group').style.display = 'none';
    document.getElementById('person-add-btn-group').style.display = 'none';
}

// ============================================
// رندر اشخاص
// ============================================
function renderGoodsPersonsList() {
    const container = document.getElementById('goods-persons-list');
    if (!container) return;
    if (currentGoodsPersons.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">هنوز شخصی اضافه نشده</div>';
        return;
    }
    const relationLabels = { owner: 'مالک', user: 'کاربر', responsible: 'مسئول', custodian: 'امین امانت', other: 'سایر' };
    container.innerHTML = currentGoodsPersons.map(gp => `
        <div class="goods-person-item">
            <div class="goods-person-info">
                <div class="goods-person-name">${gp.person_full_name || 'شخص'}</div>
                <div class="goods-person-meta">
                    <span class="badge-relation">${relationLabels[gp.relation_type] || gp.relation_type}</span>
                    ${gp.task_title ? `<span class="badge-task">${gp.task_title}</span>` : ''}
                </div>
            </div>
            <button type="button" class="btn-remove-person" onclick="removePersonFromGoods(${gp.id})">✕</button>
        </div>
    `).join('');
}
async function addPersonToGoods() {
    if (!editingGoodsId) { showToast('ابتدا کالا را ذخیره کنید', 'error'); return; }
    if (!selectedPerson) { showToast('شخص را انتخاب کنید', 'error'); return; }
    const taskId = document.getElementById('person-task-select').value;
    const relationType = document.getElementById('person-relation-select').value;
    try {
        const res = await fetch(`/api/goods/${editingGoodsId}/persons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ person_id: selectedPerson.id, task_id: taskId ? parseInt(taskId) : null, relation_type: relationType })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا');
        showToast('شخص با موفقیت اضافه شد');
        clearSelectedPerson();
        await reloadGoodsPersons();
    } catch (e) { showToast(e.message, 'error'); }
}
async function removePersonFromGoods(gpId) {
    if (!confirm('مطمئن هستید این شخص حذف شود؟')) return;
    try {
        const res = await fetch(`/api/goods/persons/${gpId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        showToast('شخص حذف شد');
        await reloadGoodsPersons();
    } catch { showToast('خطا در حذف', 'error'); }
}
async function reloadGoodsPersons() {
    if (!editingGoodsId) return;
    try {
        const res = await fetch(`/api/goods/${editingGoodsId}/details`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        currentGoodsPersons = data.persons || [];
        renderGoodsPersonsList();
    } catch {}
}

// ============================================
// بارگذاری جزئیات — این تابع فقط فیلدها رو پر می‌کنه
// ============================================
async function loadGoodsDetailsForEdit(goodsId) {
    try {
        const res = await fetch(`/api/goods/${goodsId}/details`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        currentGoodsDetails = data.details || null;
        currentGoodsPersons = data.persons || [];
        const d = currentGoodsDetails;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
        const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

        setVal('detail-asset-number', d?.asset_number);
        setVal('detail-purchase-date', d?.purchase_date_shamsi);
        setVal('detail-operation-date', d?.operation_date_shamsi);
        setVal('detail-storage-location', d?.storage_location);
        setVal('detail-purchase-price', d?.purchase_price ? formatRialForInput(d.purchase_price) : '');
        setVal('detail-notes', d?.notes);
        setCheck('detail-is-vehicle', d?.is_vehicle === 1);
        setVal('veh-tire-count', d?.tire_count);
        setVal('veh-tire-basis', d?.tire_basis);
        setVal('veh-battery-count', d?.battery_count);
        setVal('veh-battery-last-replace', d?.battery_last_replace_shamsi);

        // ============ استانداردهای سرویس: حالا از HTML می‌خونیم ============
        fillServiceStandardFromData('vehicle', d?.service_vehicle_parsed);
        fillServiceStandardFromData('oil_filter', d?.service_oil_filter_parsed);
        fillServiceStandardFromData('air_filter', d?.service_air_filter_parsed);
        fillServiceStandardFromData('ac_filter', d?.service_ac_filter_parsed);
        fillServiceStandardFromData('antifreeze', d?.service_antifreeze_parsed);
        fillServiceStandardFromData('timing_belt', d?.service_timing_belt_parsed);

        // ============ سوخت‌گیری ============
        const fs = d?.fuel_standard_parsed || {};
        setVal('fuel-type', fs.fuel_type);
        setVal('fuel-basis', fs.basis || 'km');
        setVal('fuel-km-value', fs.km_value);
        setVal('fuel-km-tolerance', fs.km_tolerance);
        setVal('fuel-date-value', fs.date_value);
        setVal('fuel-date-tolerance', fs.date_tolerance);
        setVal('fuel-date-unit', fs.date_unit || 'month');
        setVal('fuel-amount', fs.amount);
        setVal('fuel-notes', fs.notes);
        if (typeof onFuelBasisChange === 'function') onFuelBasisChange(fs.basis || 'km');

        customFieldsArray = d?.custom_fields_parsed || [];
        vehicleCustomFieldsArray = d?.vehicle_custom_fields_parsed || [];
        renderCustomFieldsList('custom-fields-list', customFieldsArray, 'general');
        renderCustomFieldsList('vehicle-custom-fields-list', vehicleCustomFieldsArray, 'vehicle');

        renderGoodsPersonsList();

renderGoodsPersonsList();
await loadGoodsLinks(goodsId);   // ← اضافه کن
initDetailsDatePickers();

        initDetailsDatePickers();
    } catch (e) {
        console.error('loadGoodsDetailsForEdit error:', e);
    }
}

// پر کردن یک کارت استاندارد سرویس از دیتابیس
function fillServiceStandardFromData(key, data) {
    const box = document.querySelector(`.service-standard-box[data-key="${key}"]`);
    if (!box || !data) return;

    // رادیو
    const basis = data.basis || 'km';
    const radio = box.querySelector(`input[name="basis-${key}"][value="${basis}"]`);
    if (radio) radio.checked = true;

    // نمایش فیلدهای مربوطه
    box.querySelectorAll('.service-field').forEach(f => {
        const fieldName = f.dataset.field;
        if (fieldName === 'km') f.style.display = basis === 'km' ? 'flex' : 'none';
        else if (fieldName === 'date') f.style.display = basis === 'date' ? 'flex' : 'none';
        else if (fieldName === 'amount') f.style.display = basis === 'amount' ? 'flex' : 'none';
    });

    // پر کردن مقادیر
    const kmVal = box.querySelector('.svc-km-value');
    if (kmVal) kmVal.value = data.km_value || '';
    const kmTol = box.querySelector('.svc-km-tolerance');
    if (kmTol) kmTol.value = data.km_tolerance || '';
    const dateMonths = box.querySelector('.svc-date-months');
    if (dateMonths) dateMonths.value = data.date_months || '';
    const dateTol = box.querySelector('.svc-date-tolerance');
    if (dateTol) dateTol.value = data.date_tolerance || '';
    const amountVal = box.querySelector('.svc-amount-value');
    if (amountVal) amountVal.value = data.amount_value || '';
    const notes = box.querySelector('.svc-notes');
    if (notes) notes.value = data.notes || '';
}
// ============================================
// ذخیره‌ی جزئیات
// ============================================
async function saveGoodsDetails() {
    if (!editingGoodsId) return;
    const body = {
        asset_number: document.getElementById('detail-asset-number').value.trim() || null,
        purchase_date_shamsi: cleanDateSimple(document.getElementById('detail-purchase-date').value),
        operation_date_shamsi: cleanDateSimple(document.getElementById('detail-operation-date').value),
        storage_location: document.getElementById('detail-storage-location').value.trim() || null,
        purchase_price: parseRialValue('detail-purchase-price') || null,
        custom_fields: customFieldsArray.filter(f => f.key && f.key.trim()),
        is_vehicle: document.getElementById('detail-is-vehicle').checked ? 1 : 0,
        notes: document.getElementById('detail-notes').value.trim() || null
    };
    if (body.is_vehicle) {
        body.tire_count = parseInt(document.getElementById('veh-tire-count').value) || null;
        body.tire_basis = document.getElementById('veh-tire-basis').value || null;
        body.battery_count = parseInt(document.getElementById('veh-battery-count').value) || null;
        body.battery_last_replace_shamsi = cleanDateSimple(document.getElementById('veh-battery-last-replace').value);
        body.service_vehicle_standard = collectServiceStandard('vehicle');
        body.service_oil_filter_standard = collectServiceStandard('oil_filter');
        body.service_air_filter_standard = collectServiceStandard('air_filter');
        body.service_ac_filter_standard = collectServiceStandard('ac_filter');
        body.service_antifreeze_standard = collectServiceStandard('antifreeze');
        body.service_timing_belt_standard = collectServiceStandard('timing_belt');
        body.fuel_standard = {
            fuel_type: document.getElementById('fuel-type').value || null,
            basis: document.getElementById('fuel-basis').value || 'km',
            km_value: parseFloat(document.getElementById('fuel-km-value').value) || null,
            km_tolerance: parseFloat(document.getElementById('fuel-km-tolerance').value) || null,
            date_value: parseFloat(document.getElementById('fuel-date-value').value) || null,
            date_tolerance: parseFloat(document.getElementById('fuel-date-tolerance').value) || null,
            date_unit: document.getElementById('fuel-date-unit').value || 'month',
            amount: parseFloat(document.getElementById('fuel-amount').value) || null,
            notes: document.getElementById('fuel-notes').value.trim() || null
        };
        body.vehicle_custom_fields = vehicleCustomFieldsArray.filter(f => f.key && f.key.trim());
    }
    const res = await fetch(`/api/goods/${editingGoodsId}/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در ذخیره جزئیات');
}

// ============================================
// سوخت‌گیری
// ============================================
function onFuelBasisChange(basis) {
    document.getElementById('fuel-km-field').style.display = basis === 'km' ? 'flex' : 'none';
    document.getElementById('fuel-date-field').style.display = basis === 'date' ? 'flex' : 'none';
}

// ============================================
// کمکی‌ها
// ============================================
function cleanDateSimple(value) {
    if (!value) return null;
    const v = toEnglishNumbers(value.toString()).trim();
    const match = v.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (match) return `${match[1]}/${match[2].padStart(2,'0')}/${match[3].padStart(2,'0')}`;
    return null;
}
function parseRialValue(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return null;
    const raw = (el.dataset.rawValue || toEnglishNumbers(el.value)).replace(/[^\d]/g, '');
    return raw ? parseInt(raw) : null;
}
function formatRialForInput(amount) {
    if (!amount && amount !== 0) return '';
    const num = Math.round(Number(amount));
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return formatted.replace(/\d/g, d => persianDigits[parseInt(d)]);
}

// ============================================
// ارتباطات بودجه (برای کالا سطح ۴)
// ============================================
async function loadGoodsLinks(goodsId) {
    await renderBudgetLinksList('goods-economic-list', 'goods', goodsId, 'economic', 'refreshGoodsLinks');
}

async function refreshGoodsLinks() {
    if (editingGoodsId) {
        await loadGoodsLinks(editingGoodsId);
    }
}

function openEconomicPickerForGoods() {
    if (!editingGoodsId) {
        showToast('ابتدا کالا را ذخیره کنید', 'error');
        return;
    }
    
    openTreePickerModal({
        targetType: 'economic',
        economicType: 'expense',
        onConfirm: async (selectedIds) => {
            try {
                const res = await fetch('/api/budget-links', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        source_type: 'goods',
                        source_id: editingGoodsId,
                        target_type: 'economic',
                        target_ids: selectedIds
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'خطا');
                showToast(`${data.inserted} ردیف اقتصادی اضافه شد`);
                await refreshGoodsLinks();
            } catch (e) {
                showToast(e.message, 'error');
            }
        }
    });
}