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
let currentTires = [];
let currentBatteries = [];
let currentGoodsCurrentKm = null;

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

currentTires = data.tires || [];
currentBatteries = data.batteries || [];
currentGoodsCurrentKm = data.details?.current_km || null;

// پر کردن فیلد کیلومتر فعلی
const kmInput = document.getElementById('veh-current-km');
if (kmInput) kmInput.value = currentGoodsCurrentKm != null ? currentGoodsCurrentKm : '';

// رندر لیست‌ها
renderTiresList();
renderBatteriesList();

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

        body.current_km = document.getElementById('veh-current-km')?.value
    ? parseInt(document.getElementById('veh-current-km').value)
    : null;
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

     // ذخیره لاستیک‌ها
    try {
        const tiresRes = await fetch(`/api/goods/${editingGoodsId}/tires`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ tires: collectTiresFromUI() })
        });
        if (!tiresRes.ok) {
            const err = await tiresRes.json();
            console.error('save tires error:', err);
        }
    } catch (e) {
        console.error('save tires exception:', e);
    }

    // ذخیره باتری‌ها
    try {
        const batteriesRes = await fetch(`/api/goods/${editingGoodsId}/batteries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ batteries: collectBatteriesFromUI() })
        });
        if (!batteriesRes.ok) {
            const err = await batteriesRes.json();
            console.error('save batteries error:', err);
        }
    } catch (e) {
        console.error('save batteries exception:', e);
    }
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
// لاستیک‌ها (goods_tires)
// ============================================

const TIRE_POSITIONS = {
    front_left: 'جلو چپ',
    front_right: 'جلو راست',
    rear_left: 'عقب چپ',
    rear_right: 'عقب راست',
    spare: 'زاپاس'
};

const BATTERY_POSITIONS = {
    engine_bay: 'محفظه موتور',
    trunk: 'صندوق عقب',
    under_seat: 'زیر صندلی',
    other: 'سایر'
};

// محاسبه تعداد ماه از یک تاریخ شمسی تا امروز
function monthsSince(shamsiDate) {
    if (!shamsiDate) return 0;
    try {
        const normalized = String(shamsiDate).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
        const parts = normalized.split('/');
        if (parts.length !== 3) return 0;
        const [jy, jm, jd] = parts.map(Number);
        if (!jy || !jm || !jd) return 0;

        // تبدیل شمسی به میلادی
        function jalaliToGregorian(jy, jm, jd) {
            let jy2 = jy + 1595;
            let days = -355668 + (365 * jy2) + (Math.floor(jy2 / 33) * 8) +
                       Math.floor(((jy2 % 33) + 3) / 4) + jd +
                       ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
            let gy = 400 * Math.floor(days / 146097);
            days %= 146097;
            if (days > 36524) {
                gy += 100 * Math.floor(--days / 36524);
                days %= 36524;
                if (days >= 365) days++;
            }
            gy += 4 * Math.floor(days / 1461);
            days %= 1461;
            if (days > 365) {
                gy += Math.floor((days - 1) / 365);
                days = (days - 1) % 365;
            }
            let gd = days + 1;
            const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28,
                           31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            let gm = 0;
            for (gm = 0; gm < 13; gm++) {
                const v = sal_a[gm];
                if (gd <= v) break;
                gd -= v;
            }
            return [gy, gm, gd];
        }

        const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
        const installDate = new Date(gy, gm - 1, gd);
        const now = new Date();
        const diffMs = now - installDate;
        if (diffMs < 0) return 0;
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
    } catch (e) {
        console.error('monthsSince error:', e);
        return 0;
    }
}

// محاسبه وضعیت سایش (مشترک بین لاستیک و باتری)
function calcWearStatus(item, currentKm) {
    if (item.is_active === 0 || item.removed_date_shamsi) {
        return { label: '📜 تعویض شده', color: '#6c757d' };
    }

    const warnings = [];
    const nearWarnings = [];

    // چک کیلومتر
    if (item.expected_life_km && item.install_km != null && currentKm != null) {
        const used = currentKm - item.install_km;
        const limit = item.expected_life_km;
        const tol = item.tolerance_km || 0;
        if (used >= limit + tol) warnings.push('کیلومتر');
        else if (used >= limit - tol) nearWarnings.push('کیلومتر');
    }

    // چک تاریخ
    if (item.expected_life_months && item.install_date_shamsi) {
        const used = monthsSince(item.install_date_shamsi);
        const limit = item.expected_life_months;
        const tol = item.tolerance_months || 0;
        if (used >= limit + tol) warnings.push('تاریخ');
        else if (used >= limit - tol) nearWarnings.push('تاریخ');
    }

    if (warnings.length > 0) {
        return { label: `🔴 نیاز به تعویض (${warnings.join(' + ')})`, color: '#dc3545' };
    }
    if (nearWarnings.length > 0) {
        return { label: `🟡 نزدیک تعویض (${nearWarnings.join(' + ')})`, color: '#fd7e14' };
    }
    return { label: '🟢 سالم', color: '#28a745' };
}

// ============================================
// رندر لیست لاستیک‌ها
// ============================================
function renderTiresList() {
    const activeContainer = document.getElementById('tires-active-list');
    const historyContainer = document.getElementById('tires-history-list');
    const historySection = document.getElementById('tires-history-section');
    const historyCount = document.getElementById('tires-history-count');
    if (!activeContainer) return;

    const active = currentTires.filter(t => t.is_active !== 0 && !t.removed_date_shamsi);
    const replaced = currentTires.filter(t => t.is_active === 0 || t.removed_date_shamsi);

    if (active.length === 0) {
        activeContainer.innerHTML = '<div style="text-align:center; padding:15px; color:#999; font-size:12px;">لاستیک فعالی ثبت نشده</div>';
    } else {
        activeContainer.innerHTML = active.map(t => renderTireRow(t, false)).join('');
    }

    if (replaced.length > 0) {
        if (historySection) historySection.style.display = 'block';
        if (historyCount) historyCount.textContent = toPersianNumbers(replaced.length);
        if (historyContainer) historyContainer.innerHTML = replaced.map(t => renderTireRow(t, true)).join('');
    } else {
        if (historySection) historySection.style.display = 'none';
    }

    setTimeout(() => initTireDatePickers(), 50);
}

function renderTireRow(tire, isReplaced) {
    const idx = currentTires.indexOf(tire);
    const status = getTireStatus(tire);
    const disabled = isReplaced ? 'disabled' : '';

    return `
    <div class="tire-row ${isReplaced ? 'is-replaced' : ''}" data-index="${idx}">
        <div class="row-header">
            <div class="row-title">
                <span>🔘 لاستیک #${toPersianNumbers(tire.tire_number || idx + 1)}</span>
                <span class="tire-status-badge" style="background:${status.color};">${status.label}</span>
            </div>
            <div class="row-actions">
                ${!isReplaced ? `<button type="button" onclick="markTireReplaced(${idx})" title="ثبت تعویض" style="background:#fd7e14; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px;">🔁 تعویض شد</button>` : ''}
                ${!isReplaced ? `<button type="button" onclick="removeTireRow(${idx})" style="background:#e74c3c; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px;">🗑️</button>` : ''}
            </div>
        </div>
        <div class="row-fields">
            <div class="form-group">
                <label>موقعیت</label>
                <select class="tire-position" ${disabled} onchange="updateTireField(${idx}, 'position', this.value)">
                    <option value="">—</option>
                    ${Object.entries(TIRE_POSITIONS).map(([k, v]) => `<option value="${k}" ${tire.position === k ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>برند</label>
                <input type="text" class="tire-brand" value="${tire.brand || ''}" ${disabled} onchange="updateTireField(${idx}, 'brand', this.value)"/>
            </div>
            <div class="form-group">
                <label>سایز</label>
                <input type="text" class="tire-size" value="${tire.size || ''}" ${disabled} placeholder="مثلاً 195/65R15" onchange="updateTireField(${idx}, 'size', this.value)"/>
            </div>
            <div class="form-group">
                <label>تاریخ نصب</label>
                <input type="text" class="tire-install-date datepicker" value="${tire.install_date_shamsi || ''}" ${disabled} placeholder="۱۴۰۴/۰۱/۰۱" onchange="updateTireField(${idx}, 'install_date_shamsi', this.value)"/>
            </div>
            <div class="form-group">
                <label>کیلومتر نصب</label>
                <input type="number" class="tire-install-km" value="${tire.install_km != null ? tire.install_km : ''}" ${disabled} onchange="updateTireField(${idx}, 'install_km', this.value)"/>
            </div>
            <div class="form-group">
                <label>عمر مفید (کیلومتر)</label>
                <input type="number" class="tire-life-km" value="${tire.expected_life_km != null ? tire.expected_life_km : ''}" ${disabled} onchange="updateTireField(${idx}, 'expected_life_km', this.value)"/>
            </div>
            <div class="form-group">
                <label>عمر مفید (ماه)</label>
                <input type="number" class="tire-life-months" value="${tire.expected_life_months != null ? tire.expected_life_months : ''}" ${disabled} onchange="updateTireField(${idx}, 'expected_life_months', this.value)"/>
            </div>
            <div class="form-group">
                <label>تلرانس (کیلومتر)</label>
                <input type="number" class="tire-tolerance-km" value="${tire.tolerance_km != null ? tire.tolerance_km : ''}" ${disabled} onchange="updateTireField(${idx}, 'tolerance_km', this.value)"/>
            </div>
            <div class="form-group">
                <label>تلرانس (ماه)</label>
                <input type="number" class="tire-tolerance-months" value="${tire.tolerance_months != null ? tire.tolerance_months : ''}" ${disabled} onchange="updateTireField(${idx}, 'tolerance_months', this.value)"/>
            </div>
        </div>
        ${!isReplaced ? `
        <div class="row-fields" style="margin-top:8px; grid-template-columns: 1fr;">
            <div class="form-group">
                <label>یادداشت</label>
                <input type="text" class="tire-notes" value="${tire.notes || ''}" placeholder="اختیاری" onchange="updateTireField(${idx}, 'notes', this.value)"/>
            </div>
        </div>
        ` : `
        <div style="margin-top:8px; padding:8px 12px; background:#e9ecef; border-radius:6px; font-size:12px;">
            <b>تعویض شده:</b>
            ${tire.removed_date_shamsi ? `تاریخ: ${toPersianNumbers(tire.removed_date_shamsi)}` : ''}
            ${tire.removed_km != null ? ` | کیلومتر: ${toPersianNumbers(tire.removed_km)}` : ''}
            ${tire.removal_reason ? ` | دلیل: ${tire.removal_reason}` : ''}
        </div>
        `}
    </div>
    `;
}

function getTireStatus(tire) {
    const currentKm = parseInt(document.getElementById('veh-current-km')?.value) || currentGoodsCurrentKm;
    return calcWearStatus(tire, currentKm);
}

function addTireRow() {
    const activeCount = currentTires.filter(t => t.is_active !== 0 && !t.removed_date_shamsi).length;
    currentTires.push({
        id: null,
        tire_number: activeCount + 1,
        position: '',
        brand: '',
        size: '',
        install_date_shamsi: '',
        install_km: null,
        expected_life_km: null,
        expected_life_months: null,
        tolerance_km: null,
        tolerance_months: null,
        removed_date_shamsi: null,
        removed_km: null,
        removal_reason: null,
        is_active: 1,
        notes: '',
        sort_order: currentTires.length
    });
    renderTiresList();
}

function removeTireRow(index) {
    if (!confirm('این لاستیک از لیست حذف شود؟')) return;
    currentTires.splice(index, 1);
    renderTiresList();
}

function updateTireField(index, field, value) {
    if (!currentTires[index]) return;
    if (field === 'install_km' || field === 'expected_life_km' ||
        field === 'expected_life_months' || field === 'tolerance_km' ||
        field === 'tolerance_months') {
        currentTires[index][field] = value === '' || value == null ? null : parseInt(value);
    } else {
        currentTires[index][field] = value;
    }
}

function markTireReplaced(index) {
    const tire = currentTires[index];
    if (!tire) return;

    const currentKm = parseInt(document.getElementById('veh-current-km')?.value) || currentGoodsCurrentKm;
    const todayShamsi = getTodayShamsi();

    const dateStr = prompt('تاریخ تعویض (شمسی):', todayShamsi);
    if (dateStr === null) return;

    const kmStr = prompt('کیلومتر تعویض:', currentKm != null ? String(currentKm) : '');
    if (kmStr === null) return;

    const reason = prompt('دلیل تعویض (اختیاری):', 'ساییدگی');
    if (reason === null) return;

    tire.removed_date_shamsi = dateStr || todayShamsi;
    tire.removed_km = kmStr ? parseInt(kmStr) : currentKm;
    tire.removal_reason = reason || null;
    tire.is_active = 0;

    renderTiresList();
    showToast('لاستیک به تاریخچه منتقل شد', 'success');
}

function toggleTiresHistory() {
    const list = document.getElementById('tires-history-list');
    const arrow = document.getElementById('tires-history-arrow');
    if (!list) return;
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'block' : 'none';
    if (arrow) arrow.textContent = isHidden ? '▲' : '▼';
}

function initTireDatePickers() {
    if (typeof $ === 'undefined' || !$.fn.persianDatepicker) return;
    document.querySelectorAll('.tire-install-date:not(.has-datepicker)').forEach(el => {
        try {
            $(el).persianDatepicker({
                format: 'YYYY/MM/DD',
                autoClose: true,
                persianDigit: true,
                initialValue: !!el.value,
                onSelect: function () {
                    const idx = parseInt(el.closest('.tire-row')?.dataset.index);
                    if (!isNaN(idx)) updateTireField(idx, 'install_date_shamsi', el.value);
                }
            });
            el.classList.add('has-datepicker');
        } catch (e) { /* ignore */ }
    });
}

// ============================================
// رندر لیست باتری‌ها
// ============================================
function renderBatteriesList() {
    const activeContainer = document.getElementById('batteries-active-list');
    const historyContainer = document.getElementById('batteries-history-list');
    const historySection = document.getElementById('batteries-history-section');
    const historyCount = document.getElementById('batteries-history-count');
    if (!activeContainer) return;

    const active = currentBatteries.filter(b => b.is_active !== 0 && !b.removed_date_shamsi);
    const replaced = currentBatteries.filter(b => b.is_active === 0 || b.removed_date_shamsi);

    if (active.length === 0) {
        activeContainer.innerHTML = '<div style="text-align:center; padding:15px; color:#999; font-size:12px;">باتری فعالی ثبت نشده</div>';
    } else {
        activeContainer.innerHTML = active.map(b => renderBatteryRow(b, false)).join('');
    }

    if (replaced.length > 0) {
        if (historySection) historySection.style.display = 'block';
        if (historyCount) historyCount.textContent = toPersianNumbers(replaced.length);
        if (historyContainer) historyContainer.innerHTML = replaced.map(b => renderBatteryRow(b, true)).join('');
    } else {
        if (historySection) historySection.style.display = 'none';
    }

    setTimeout(() => initBatteryDatePickers(), 50);
}

function renderBatteryRow(battery, isReplaced) {
    const idx = currentBatteries.indexOf(battery);
    const status = getBatteryStatus(battery);
    const disabled = isReplaced ? 'disabled' : '';

    return `
    <div class="battery-row ${isReplaced ? 'is-replaced' : ''}" data-index="${idx}">
        <div class="row-header">
            <div class="row-title">
                <span>🔋 باتری #${toPersianNumbers(battery.battery_number || idx + 1)}</span>
                <span class="battery-status-badge" style="background:${status.color};">${status.label}</span>
            </div>
            <div class="row-actions">
                ${!isReplaced ? `<button type="button" onclick="markBatteryReplaced(${idx})" title="ثبت تعویض" style="background:#fd7e14; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px;">🔁 تعویض شد</button>` : ''}
                ${!isReplaced ? `<button type="button" onclick="removeBatteryRow(${idx})" style="background:#e74c3c; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px;">🗑️</button>` : ''}
            </div>
        </div>
        <div class="row-fields">
            <div class="form-group">
                <label>برند</label>
                <input type="text" class="battery-brand" value="${battery.brand || ''}" ${disabled} onchange="updateBatteryField(${idx}, 'brand', this.value)"/>
            </div>
            <div class="form-group">
                <label>مدل</label>
                <input type="text" class="battery-model" value="${battery.model || ''}" ${disabled} onchange="updateBatteryField(${idx}, 'model', this.value)"/>
            </div>
            <div class="form-group">
                <label>آمپر</label>
                <input type="number" step="0.1" class="battery-capacity" value="${battery.capacity_amp != null ? battery.capacity_amp : ''}" ${disabled} placeholder="مثلاً ۶۰" onchange="updateBatteryField(${idx}, 'capacity_amp', this.value)"/>
            </div>
            <div class="form-group">
                <label>تاریخ نصب</label>
                <input type="text" class="battery-install-date datepicker" value="${battery.install_date_shamsi || ''}" ${disabled} placeholder="۱۴۰۴/۰۱/۰۱" onchange="updateBatteryField(${idx}, 'install_date_shamsi', this.value)"/>
            </div>
            <div class="form-group">
                <label>کیلومتر نصب</label>
                <input type="number" class="battery-install-km" value="${battery.install_km != null ? battery.install_km : ''}" ${disabled} onchange="updateBatteryField(${idx}, 'install_km', this.value)"/>
            </div>
            <div class="form-group">
                <label>عمر مفید (ماه)</label>
                <input type="number" class="battery-life-months" value="${battery.expected_life_months != null ? battery.expected_life_months : ''}" ${disabled} onchange="updateBatteryField(${idx}, 'expected_life_months', this.value)"/>
            </div>
            <div class="form-group">
                <label>عمر مفید (کیلومتر)</label>
                <input type="number" class="battery-life-km" value="${battery.expected_life_km != null ? battery.expected_life_km : ''}" ${disabled} onchange="updateBatteryField(${idx}, 'expected_life_km', this.value)"/>
            </div>
            <div class="form-group">
                <label>تلرانس (ماه)</label>
                <input type="number" class="battery-tolerance-months" value="${battery.tolerance_months != null ? battery.tolerance_months : ''}" ${disabled} onchange="updateBatteryField(${idx}, 'tolerance_months', this.value)"/>
            </div>
            <div class="form-group">
                <label>گارانتی تا</label>
                <input type="text" class="battery-warranty datepicker" value="${battery.warranty_until_shamsi || ''}" ${disabled} placeholder="اختیاری" onchange="updateBatteryField(${idx}, 'warranty_until_shamsi', this.value)"/>
            </div>
        </div>
        ${!isReplaced ? `
        <div class="row-fields" style="margin-top:8px; grid-template-columns: 1fr;">
            <div class="form-group">
                <label>یادداشت</label>
                <input type="text" class="battery-notes" value="${battery.notes || ''}" placeholder="اختیاری" onchange="updateBatteryField(${idx}, 'notes', this.value)"/>
            </div>
        </div>
        ` : `
        <div style="margin-top:8px; padding:8px 12px; background:#e9ecef; border-radius:6px; font-size:12px;">
            <b>تعویض شده:</b>
            ${battery.removed_date_shamsi ? `تاریخ: ${toPersianNumbers(battery.removed_date_shamsi)}` : ''}
            ${battery.removed_km != null ? ` | کیلومتر: ${toPersianNumbers(battery.removed_km)}` : ''}
            ${battery.removal_reason ? ` | دلیل: ${battery.removal_reason}` : ''}
        </div>
        `}
    </div>
    `;
}

function getBatteryStatus(battery) {
    const currentKm = parseInt(document.getElementById('veh-current-km')?.value) || currentGoodsCurrentKm;
    return calcWearStatus(battery, currentKm);
}

function addBatteryRow() {
    const activeCount = currentBatteries.filter(b => b.is_active !== 0 && !b.removed_date_shamsi).length;
    currentBatteries.push({
        id: null,
        battery_number: activeCount + 1,
        brand: '',
        model: '',
        capacity_amp: null,
        install_date_shamsi: '',
        install_km: null,
        expected_life_months: null,
        expected_life_km: null,
        tolerance_months: null,
        tolerance_km: null,
        warranty_until_shamsi: null,
        removed_date_shamsi: null,
        removed_km: null,
        removal_reason: null,
        is_active: 1,
        notes: '',
        sort_order: currentBatteries.length
    });
    renderBatteriesList();
}

function removeBatteryRow(index) {
    if (!confirm('این باتری از لیست حذف شود؟')) return;
    currentBatteries.splice(index, 1);
    renderBatteriesList();
}

function updateBatteryField(index, field, value) {
    if (!currentBatteries[index]) return;
    if (['install_km', 'expected_life_km', 'expected_life_months',
         'tolerance_km', 'tolerance_months'].includes(field)) {
        currentBatteries[index][field] = value === '' || value == null ? null : parseInt(value);
    } else if (field === 'capacity_amp') {
        currentBatteries[index][field] = value === '' || value == null ? null : parseFloat(value);
    } else {
        currentBatteries[index][field] = value;
    }
}

function markBatteryReplaced(index) {
    const battery = currentBatteries[index];
    if (!battery) return;

    const currentKm = parseInt(document.getElementById('veh-current-km')?.value) || currentGoodsCurrentKm;
    const todayShamsi = getTodayShamsi();

    const dateStr = prompt('تاریخ تعویض (شمسی):', todayShamsi);
    if (dateStr === null) return;

    const kmStr = prompt('کیلومتر تعویض:', currentKm != null ? String(currentKm) : '');
    if (kmStr === null) return;

    const reason = prompt('دلیل تعویض (اختیاری):', 'ضعف باتری');
    if (reason === null) return;

    battery.removed_date_shamsi = dateStr || todayShamsi;
    battery.removed_km = kmStr ? parseInt(kmStr) : currentKm;
    battery.removal_reason = reason || null;
    battery.is_active = 0;

    renderBatteriesList();
    showToast('باتری به تاریخچه منتقل شد', 'success');
}

function toggleBatteriesHistory() {
    const list = document.getElementById('batteries-history-list');
    const arrow = document.getElementById('batteries-history-arrow');
    if (!list) return;
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'block' : 'none';
    if (arrow) arrow.textContent = isHidden ? '▲' : '▼';
}

function initBatteryDatePickers() {
    if (typeof $ === 'undefined' || !$.fn.persianDatepicker) return;
    document.querySelectorAll('.battery-install-date:not(.has-datepicker), .battery-warranty:not(.has-datepicker)').forEach(el => {
        try {
            $(el).persianDatepicker({
                format: 'YYYY/MM/DD',
                autoClose: true,
                persianDigit: true,
                initialValue: !!el.value,
                onSelect: function () {
                    const idx = parseInt(el.closest('.battery-row')?.dataset.index);
                    if (isNaN(idx)) return;
                    const field = el.classList.contains('battery-install-date') ? 'install_date_shamsi' : 'warranty_until_shamsi';
                    updateBatteryField(idx, field, el.value);
                }
            });
            el.classList.add('has-datepicker');
        } catch (e) { /* ignore */ }
    });
}

// ============================================
// توابع کمکی
// ============================================
function getTodayShamsi() {
    if (typeof toShamsi === 'function') {
        return toShamsi(new Date());
    }
    // fallback ساده
    const now = new Date();
    const gy = now.getFullYear(), gm = now.getMonth() + 1, gd = now.getDate();
    function gregorianToJalali(gy, gm, gd) {
        const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        let jy = (gy <= 1600) ? 0 : 979;
        gy -= (gy <= 1600) ? 621 : 1600;
        const gy2 = (gm > 2) ? (gy + 1) : gy;
        let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
        jy += 33 * Math.floor(days / 12053);
        days %= 12053;
        jy += 4 * Math.floor(days / 1461);
        days %= 1461;
        if (days > 365) {
            jy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }
        const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
        const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
        return [jy, jm, jd];
    }
    const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
    return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
}

// جمع‌آوری لاستیک‌ها برای ذخیره
function collectTiresFromUI() {
    return currentTires.map(t => ({
        tire_number: t.tire_number,
        position: t.position || null,
        brand: t.brand || null,
        size: t.size || null,
        install_date_shamsi: t.install_date_shamsi || null,
        install_km: t.install_km,
        expected_life_km: t.expected_life_km,
        expected_life_months: t.expected_life_months,
        tolerance_km: t.tolerance_km,
        tolerance_months: t.tolerance_months,
        removed_date_shamsi: t.removed_date_shamsi || null,
        removed_km: t.removed_km,
        removal_reason: t.removal_reason || null,
        is_active: t.is_active,
        notes: t.notes || null,
        sort_order: t.sort_order
    }));
}

// جمع‌آوری باتری‌ها برای ذخیره
function collectBatteriesFromUI() {
    return currentBatteries.map(b => ({
        battery_number: b.battery_number,
        brand: b.brand || null,
        model: b.model || null,
        capacity_amp: b.capacity_amp,
        install_date_shamsi: b.install_date_shamsi || null,
        install_km: b.install_km,
        expected_life_months: b.expected_life_months,
        expected_life_km: b.expected_life_km,
        tolerance_months: b.tolerance_months,
        tolerance_km: b.tolerance_km,
        warranty_until_shamsi: b.warranty_until_shamsi || null,
        removed_date_shamsi: b.removed_date_shamsi || null,
        removed_km: b.removed_km,
        removal_reason: b.removal_reason || null,
        is_active: b.is_active,
        notes: b.notes || null,
        sort_order: b.sort_order
    }));
}