// ============================================
// کامپوننت مشترک جستجو و فیلتر سطح
// برای صفحات اطلاعات پایه (base_data)
// ============================================

(function () {
  'use strict';

  // ============================================
  // وضعیت global
  // ============================================
  let config = null;
  let callbacks = null;
  let searchQuery = '';
  let activeLevel = 'all'; // 'all' یا '0', '1', '2', ...
  let searchTimer = null;

  // ============================================
  // تبدیل اعداد
  // ============================================
  function toPersianNum(str) {
    if (str === null || str === undefined) return '';
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/\d/g, function (d) {
      return persianDigits[parseInt(d)];
    });
  }

  function toEnglishNum(str) {
    if (!str) return '';
    return str.toString().replace(/[۰-۹]/g, function (d) {
      return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);
    });
  }

  // ============================================
  // ساخت HTML نوار
  // ============================================
function buildSearchBar() {
    const pillsHtml = [];

    // 👇 اگه hidePills باشه، Pills ساخته نشن
    if (!config.hidePills) {
        pillsHtml.push(`
            <button class="bds-pill active" data-level="all" onclick="bdsFilterByLevel('all')">
                <span class="bds-pill-icon">🗂️</span>
                <span>همه</span>
            </button>
        `);

        if (config.useType) {
            const typeValues = ['mission', 'program', 'service', 'plan', 'activity', 'project'];
            const typeLabels = ['مأموریت', 'برنامه', 'خدمت', 'طرح', 'فعالیت', 'پروژه'];
            const typeIcons = ['🎯', '📋', '⚙️', '📐', '🔧', '🏗️'];

            typeValues.forEach((typeVal, index) => {
                pillsHtml.push(`
                    <button class="bds-pill" data-level="${typeVal}" onclick="bdsFilterByLevel('${typeVal}')">
                        <span class="bds-pill-icon">${typeIcons[index]}</span>
                        <span>${typeLabels[index]}</span>
                    </button>
                `);
            });
        } else {
            config.levelNames.forEach((name, index) => {
                const icon = (config.levelIcons && config.levelIcons[index]) || '📄';
                pillsHtml.push(`
                    <button class="bds-pill" data-level="${index}" onclick="bdsFilterByLevel('${index}')">
                        <span class="bds-pill-icon">${icon}</span>
                        <span>${name}</span>
                    </button>
                `);
            });
        }
    }

    // اگه hidePills بود، Pills container رو اصلاً نذار
    const pillsContainer = config.hidePills ? '' : `
        <div class="bds-filter-pills" id="bds-filter-pills">
            ${pillsHtml.join('')}
        </div>
    `;

    return `
        <div class="bds-search-bar" id="bds-search-bar">
            <div class="bds-search-input-wrapper">
                <span class="bds-search-icon">🔍</span>
                <input type="text" id="bds-search-input" class="bds-search-input" placeholder="جستجو بر اساس کد یا عنوان..." autocomplete="off" />
                <button class="bds-search-clear" id="bds-search-clear" onclick="bdsClearSearch()" title="پاک کردن">✕</button>
            </div>
            ${pillsContainer}
            <div class="bds-result-info" id="bds-result-info"></div>
        </div>
    `;
}

  // ============================================
  // رندر نوار
  // ============================================
function renderSearchBar() {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar) {
        console.warn('[BDS] .toolbar not found');
        return;
    }

    // اگه قبلاً اضافه شده، حذف کن
    const existing = document.getElementById('bds-search-bar');
    if (existing) existing.remove();

    // 👇 اگه info-banner هست، قبل از اون اضافه کن. وگرنه قبل از toolbar
    const infoBanner = document.querySelector('.info-banner');
    const target = infoBanner || toolbar;

    target.insertAdjacentHTML('beforebegin', buildSearchBar());

    // event listeners
    const input = document.getElementById('bds-search-input');
    if (input) {
        input.addEventListener('input', onSearchInput);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') bdsClearSearch();
        });
    }

    updateSearchClearButton();
    updateResultInfo();
}
  // ============================================
  // event: سرچ
  // ============================================
  function onSearchInput(e) {
    clearTimeout(searchTimer);
    const value = e.target.value;

    // نمایش/مخفی کردن دکمه clear
    const clearBtn = document.getElementById('bds-search-clear');
    if (clearBtn) clearBtn.classList.toggle('visible', value.length > 0);

    searchTimer = setTimeout(() => {
      searchQuery = value.trim();
      saveStateToLocalStorage();
      triggerUpdate();
    }, 250);
  }

  // ============================================
  // پاک کردن سرچ
  // ============================================
  function bdsClearSearch() {
    const input = document.getElementById('bds-search-input');
    if (input) input.value = '';
    searchQuery = '';
    saveStateToLocalStorage();
    updateSearchClearButton();
    triggerUpdate();
  }

  function updateSearchClearButton() {
    const btn = document.getElementById('bds-search-clear');
    if (btn) btn.classList.toggle('visible', searchQuery.length > 0);
  }

  // ============================================
  // فیلتر سطح
  // ============================================
  function bdsFilterByLevel(level) {
    activeLevel = level;

    // آپدیت active state
    document.querySelectorAll('.bds-pill').forEach((p) => {
      p.classList.toggle('active', p.dataset.level === String(level));
    });

    saveStateToLocalStorage();
    triggerUpdate();
  }

  // ============================================
  // آمار نتایج
  // ============================================
  function updateResultInfo(total, filtered) {
    const el = document.getElementById('bds-result-info');
    if (!el) return;

    if (total === undefined) {
      el.innerHTML = '';
      return;
    }

    const isFiltered = searchQuery || activeLevel !== 'all';

    if (isFiltered) {
      el.innerHTML = `
        <span class="bds-result-count">
          <b>${toPersianNum(filtered)}</b> از <b>${toPersianNum(total)}</b> ردیف
        </span>
      `;
    } else {
      el.innerHTML = `
        <span class="bds-result-count">
          مجموع: <b>${toPersianNum(total)}</b> ردیف
        </span>
      `;
    }
  }

  // ============================================
  // فیلتر کردن داده‌ها
  // ============================================
 function filterData(flatData) {
    if (!flatData || flatData.length === 0) return [];

    let filtered = flatData;

    // ۱. فیلتر سطح (level یا type)
    if (activeLevel !== 'all') {
        if (config.useType) {
            // فیلتر بر اساس type
            filtered = filtered.filter((item) => {
                const itemType = item.type;
                
                // پروژه‌ها: project_capital و project_financial هر دو جزو "پروژه" هستن
                if (activeLevel === 'project') {
                    return itemType === 'project_capital' || 
                           itemType === 'project_financial' || 
                           itemType === 'project';
                }
                
                return itemType === activeLevel;
            });
        } else {
            // فیلتر بر اساس level
            const levelNum = parseInt(activeLevel);
            filtered = filtered.filter((item) => item.level === levelNum);
        }
    }

    // ۲. فیلتر سرچ
    if (searchQuery) {
        const q = toEnglishNum(searchQuery).toLowerCase();
        const originalQ = searchQuery.toLowerCase();
        const isNumeric = /^[\d\s\-]+$/.test(originalQ);

        filtered = filtered.filter((item) => {
            const code = (item.code || '').toLowerCase();
            const title = (item.title || '').toLowerCase();

            if (isNumeric) {
                return code.includes(q) || code.includes(originalQ);
            }

            return (
                code.includes(q) ||
                code.includes(originalQ) ||
                title.includes(originalQ)
            );
        });
    }

    return filtered;
}
  // ============================================
  // اضافه کردن والدها (اگه فقط سطح فیلتر شده)
  // ============================================
  // وقتی یه سطح فیلتر میشه، والدهای نتایج هم باید نمایش داده بشن
  // تا ساختار درخت حفظ بشه
  function addAncestors(filteredItems, allFlatData) {
    if (!searchQuery && activeLevel === 'all') return filteredItems;

    const idMap = {};
    allFlatData.forEach((item) => {
      idMap[item.id] = item;
    });

    const resultSet = new Set(filteredItems.map((item) => item.id));

    // برای هر آیتم، همه والداش رو اضافه کن
    filteredItems.forEach((item) => {
      let parentId = item.parent_id;
      let safety = 0;
      while (parentId && safety < 20) {
        if (resultSet.has(parentId)) break;
        resultSet.add(parentId);
        const parent = idMap[parentId];
        parentId = parent ? parent.parent_id : null;
        safety++;
      }
    });

    // برگردوندن به ترتیب اصلی flatData
    return allFlatData.filter((item) => resultSet.has(item.id));
  }

  // ============================================
  // محاسبه breadcrumb (مسیر کامل)
  // ============================================
  function buildBreadcrumbMap(flatData) {
    const idMap = {};
    flatData.forEach((item) => {
      idMap[item.id] = item;
    });

    const breadcrumbMap = {};
    flatData.forEach((item) => {
      const path = [];
      let current = item;
      let safety = 0;

      while (current && safety < 20) {
        path.unshift(current.code);
        current = current.parent_id ? idMap[current.parent_id] : null;
        safety++;
      }

      breadcrumbMap[item.id] = path.join(' → ');
    });

    return breadcrumbMap;
  }

  // ============================================
  // صدا زدن callback
  // ============================================
  function triggerUpdate() {
    if (!callbacks || !callbacks.onUpdate) return;

    const allData = callbacks.getFlatData() || [];
    const filtered = filterData(allData);
    const withAncestors = addAncestors(filtered, allData);
    const isFiltered = !!(searchQuery || activeLevel !== 'all');

    // breadcrumb map
    const breadcrumbMap = buildBreadcrumbMap(allData);

    updateResultInfo(allData.length, filtered.length);

    callbacks.onUpdate({
      allData,
      filteredData: withAncestors,
      isFiltered,
      breadcrumbMap,
      searchQuery,
      activeLevel,
    });
  }

  // ============================================
  // localStorage
  // ============================================
  function getStorageKey() {
    return `bds-state-${config.section}`;
  }

  function saveStateToLocalStorage() {
    try {
      localStorage.setItem(
        getStorageKey(),
        JSON.stringify({
          searchQuery: searchQuery,
          activeLevel: activeLevel,
        })
      );
    } catch (e) {}
  }

  function loadStateFromLocalStorage() {
    try {
      const raw = localStorage.getItem(getStorageKey());
      if (!raw) return;
      const state = JSON.parse(raw);

      if (state.searchQuery) searchQuery = state.searchQuery;
      if (state.activeLevel) activeLevel = state.activeLevel;
    } catch (e) {}
  }

  // ============================================
  // Public API
  // ============================================
  window.initBaseDataSearch = function (userConfig, userCallbacks) {
    if (!userConfig || !userConfig.section || !userConfig.levelNames) {
      console.error('[BDS] config ناقص است');
      return;
    }

    config = userConfig;
    callbacks = userCallbacks;

    // لود state قبلی
    loadStateFromLocalStorage();

    // رندر نوار
    renderSearchBar();

    // آپدیت اولیه (بعد از لود دیتا)
    // (خود صدا زننده باید بعد از loadData دوباره triggerUpdate کنه)
  };

  // APIهای global (برای onclick توی HTML)
  window.bdsClearSearch = bdsClearSearch;
  window.bdsFilterByLevel = bdsFilterByLevel;

  // ============================================
  // بستن روی window (برای دسترسی از صفحه)
  // ============================================
  window.getBdsState = function () {
    return {
      searchQuery: searchQuery,
      activeLevel: activeLevel,
    };
  };

  window.refreshBds = function () {
    if (config && callbacks) {
      triggerUpdate();
    }
  };

  // ============================================
  // ریست (وقتی section عوض میشه)
  // ============================================
  window.resetBdsState = function () {
    searchQuery = '';
    activeLevel = 'all';
  };

  // ============================================
  // API: ساخت breadcrumb map (برای استفاده در صفحه)
  // ============================================
  window.bdsBuildBreadcrumbMap = function (flatData) {
    if (!flatData) return {};
    const idMap = {};
    flatData.forEach((item) => {
      idMap[item.id] = item;
    });
    const breadcrumbMap = {};
    flatData.forEach((item) => {
      const path = [];
      let current = item;
      let safety = 0;
      while (current && safety < 20) {
        path.unshift(current.code);
        current = current.parent_id ? idMap[current.parent_id] : null;
        safety++;
      }
      breadcrumbMap[item.id] = path.join(' → ');
    });
    return breadcrumbMap;
  };


})();