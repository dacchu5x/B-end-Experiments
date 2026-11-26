/* ============================================================
 * script.js  –  Experiment 2: JavaScript & JSON
 * Library Management – Interactive 3D Configurator
 *
 * This file contains all client-side JavaScript for EXP 2:
 *   • 3D cupboard visualizer / configurator (Block 1)
 *   • Customer management module              (Block 2)
 *
 * Data is persisted on the server as user.json (library-customers.json)
 * via the Express.js API defined in server.js.
 * ============================================================ */
    (function() {
      const state = { cupboards: 1, shelves: 1, doorStyle: 'solid', doorsOpen: {}, batchMode: 'all-closed' };
      const bookColors = [
        { bg: '#0f766e', border: '#99f6e4', spine: '#14b8a6', title: '#ccfbf1' },
        { bg: '#3b1704', border: '#fed7aa', spine: '#78350f', title: '#fef3c7' },
        { bg: '#9a3412', border: '#ffedd5', spine: '#c2410c', title: '#fff7ed' },
        { bg: '#1e293b', border: '#cbd5e1', spine: '#334155', title: '#f1f5f9' },
        { bg: '#b45309', border: '#fef08a', spine: '#d97706', title: '#fffbeb' },
        { bg: '#881337', border: '#fecdd3', spine: '#9f1239', title: '#ffe4e6' },
        { bg: '#1e3a8a', border: '#bfdbfe', spine: '#2563eb', title: '#eff6ff' },
        { bg: '#064e3b', border: '#a7f3d0', spine: '#059669', title: '#ecfdf5' },
        { bg: '#78350f', border: '#fde68a', spine: '#92400e', title: '#fefce8' },
        { bg: '#4c1d95', border: '#ddd6fe', spine: '#6d28d9', title: '#f5f3ff' },
        { bg: '#1f2937', border: '#9ca3af', spine: '#374151', title: '#f9fafb' },
        { bg: '#831843', border: '#fbcfe8', spine: '#be185d', title: '#fdf2f8' }
      ];

      const row = document.getElementById('cupboard-row');
      const cupInput = document.getElementById('input-cupboards');
      const shInput = document.getElementById('input-shelves');
      const inputRoomWidth = document.getElementById('input-room-width');
      const inputRoomHeight = document.getElementById('input-room-height');
      const inputRoomDepth = document.getElementById('input-room-depth');
      const hudCupboards = document.getElementById('hud-cupboards');
      const hudShelves = document.getElementById('hud-shelves');
      const hudDoors = document.getElementById('hud-doors');
      const hudDim = document.getElementById('hud-dimensions');
      const doorStatusPill = document.getElementById('door-status-pill');

      // ── Boundary Value Analysis (BVA) Limits & Helpers (Same as Experiment 3) ──
      const BVA_LIMITS = {
        width:  { min: 900, max: null,  label: 'Room Width',  unit: 'mm', minReason: 'space for 1 cupboard unit (900mm)' },
        height: { min: 350, max: 3000,  label: 'Room Height', unit: 'mm', minReason: 'space for 1 shelf tier (350mm)' },
        depth:  { min: 200, max: 1000,  label: 'Room Depth',  unit: 'mm', minReason: 'practical depth for bookshelves' },
        cupboards: { min: 1, label: 'Cupboard Units' },
        shelves:   { min: 1, max: 10, label: 'Shelves per Unit' }
      };

      const CUPBOARD_UNIT_WIDTH_MM = 900;   // each cupboard unit is 900mm wide
      const SHELF_TIER_HEIGHT_MM   = 350;   // each shelf tier needs 350mm of height

      function setFieldError(fieldId, message, isWarning = false) {
        const errEl  = document.getElementById(fieldId + '-error');
        const wrapEl = document.getElementById(fieldId + '-input-wrap') || document.getElementById(fieldId);
        if (errEl) {
          errEl.textContent = message;
          errEl.classList.toggle('visible', !!message);
          errEl.classList.toggle('warning', !!isWarning);
        }
        if (wrapEl) {
          wrapEl.classList.toggle('input-error', !!message && !isWarning);
          wrapEl.classList.toggle('input-warning', !!message && isWarning);
        }
      }

      // ── International Phone Validation (uses shared PhoneValidation module) ──
      function getSelectedCountryIso() {
        return (document.getElementById('customer-country-iso')?.value || '').trim();
      }

      function getSelectedCallingCode() {
        return (document.getElementById('customer-country-code')?.value || '').trim();
      }

      function isValidCustomerPhone(value, isoOrCallingCode) {
        if (!value) return false;
        const digits = String(value).replace(/\D/g, '');
        if (!digits) return false;
        let iso = isoOrCallingCode || getSelectedCountryIso();
        if (iso && window.PhoneValidation && !window.PhoneValidation.COUNTRY_MAP[iso]) {
          const cleanCode = iso.startsWith('+') ? iso : '+' + iso;
          const found = window.PhoneValidation.COUNTRIES.find(function(c) { return c.callingCode === cleanCode; });
          iso = found ? found.iso : getSelectedCountryIso();
        }
        if (iso && window.PhoneValidation && window.PhoneValidation.COUNTRY_MAP[iso]) {
          return window.PhoneValidation.validatePhone(digits, iso);
        }
        return false;
      }

      function getCustomerPhoneData() {
        const iso = getSelectedCountryIso();
        const callingCode = getSelectedCallingCode();
        const phone = (document.getElementById('customer-phone')?.value || '').replace(/\D/g, '');
        const country = window.PhoneValidation.getCountryByIso(iso);
        const isValid = country ? window.PhoneValidation.validatePhone(phone, iso) : false;
        return {
          country: iso,
          countryCode: callingCode,
          phone: phone,
          phoneNumber: phone,
          fullPhone: isValid ? window.PhoneValidation.formatFullPhone(callingCode, phone) : ''
        };
      }

      function setCountryDropdown(iso) {
        const country = window.PhoneValidation.getCountryByIso(iso);
        if (!country) return;
        document.getElementById('customer-country-iso').value = iso;
        document.getElementById('customer-country-code').value = country.callingCode;
        document.getElementById('country-trigger-text').textContent = window.PhoneValidation.getOptionLabel(country);
        const hint = window.PhoneValidation.getPhoneFormatHint(iso);
        document.getElementById('customer-phone').placeholder = 'Phone (' + hint + ')';
        document.getElementById('customer-phone').maxLength = country.maxLen + 2;
        // Mark as selected in list
        document.querySelectorAll('#country-options-list li').forEach(function(li) {
          li.classList.toggle('selected', li.dataset.iso === iso);
        });
        onCountryChanged();
      }

      function clearCountryDropdown() {
        document.getElementById('customer-country-iso').value = '';
        document.getElementById('customer-country-code').value = '';
        document.getElementById('country-trigger-text').textContent = 'Select country';
        document.getElementById('customer-phone').placeholder = 'Phone Number';
        document.getElementById('customer-phone').maxLength = 20;
        document.getElementById('country-search-trigger').classList.remove('input-error');
      }

      function setCustomerPhoneFromRecord(record) {
        if (!record) return;
        const savedIso = record.country || record.countryIso || '';
        let savedCode = record.countryCode || '';
        const rawPhone = String(record.phoneNumber || record.phone || record.fullPhone || '').trim();
        let iso = savedIso;
        let digits = rawPhone.replace(/\D/g, '');

        if (!iso && !savedCode && rawPhone.startsWith('+') && window.PhoneValidation) {
          const sorted = window.PhoneValidation.COUNTRIES.slice().sort(function(a, b) { return b.callingCode.length - a.callingCode.length; });
          for (var i = 0; i < sorted.length; i++) {
            if (rawPhone.startsWith(sorted[i].callingCode)) {
              iso = sorted[i].iso;
              savedCode = sorted[i].callingCode;
              digits = rawPhone.slice(sorted[i].callingCode.length).replace(/\D/g, '');
              break;
            }
          }
        } else if (!iso && savedCode && window.PhoneValidation) {
          const cleanCode = savedCode.startsWith('+') ? savedCode : '+' + savedCode;
          const found = window.PhoneValidation.COUNTRIES.find(function(c) { return c.callingCode === cleanCode; });
          if (found) iso = found.iso;
        }

        if (iso && window.PhoneValidation && window.PhoneValidation.COUNTRY_MAP[iso]) {
          setCountryDropdown(iso);
        } else {
          clearCountryDropdown();
        }
        document.getElementById('customer-phone').value = digits;
        if (iso) validateCustomerField('customer-phone');
      }

      function onCountryChanged() {
        document.getElementById('country-search-trigger').classList.remove('input-error');
        validateCustomerField('customer-phone');
      }

      function formatCustomerPhone(record) {
        if (!record) return 'Not provided';
        const code = record.countryCode || '';
        const phone = record.phoneNumber || record.phone || '';
        const digits = String(phone).replace(/\D/g, '');
        let iso = record.country || record.countryIso || '';
        if (!iso && code && window.PhoneValidation) {
          const cleanCode = code.startsWith('+') ? code : '+' + code;
          const found = window.PhoneValidation.COUNTRIES.find(function(c) { return c.callingCode === cleanCode; });
          if (found) iso = found.iso;
        }
        const country = iso && window.PhoneValidation ? window.PhoneValidation.getCountryByIso(iso) : null;
        const flag = country ? country.flag + ' ' : '';
        if (code && digits) {
          return flag + (code.startsWith('+') ? code : '+' + code) + ' ' + digits;
        }
        if (digits) return flag + digits;
        if (record.fullPhone) return record.fullPhone;
        return phone ? String(phone) : 'Not provided';
      }

      function isValidCustomerEmail(value) {
        return /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/.test(value);
      }

      function validateDimension(field, value) {
        const lim = BVA_LIMITS[field];
        if (isNaN(value) || value === '' || value === null) {
          setFieldError(field, `⚠️ ${lim.label} is required (minimum ${lim.min}${lim.unit}).`, false);
          return false;
        }
        if (value <= 0) {
          setFieldError(field, `⚠️ ${lim.label} must be greater than 0 mm (minimum is ${lim.min} ${lim.unit}).`, false);
          return false;
        }
        if (value < lim.min) {
          setFieldError(field, `⚠️ ${lim.label} (${value}${lim.unit}) must be at least ${lim.min}${lim.unit} (${lim.minReason}).`, false);
          return false;
        }
        if (lim.max !== null && value > lim.max) {
          setFieldError(field, `⚠️ ${lim.label} (${value}${lim.unit}) must not exceed ${lim.max}${lim.unit}.`, false);
          return false;
        }
        setFieldError(field, ''); // clear warning/error
        return true;
      }

      /** Returns the max cupboards allowed by current room width */
      function maxCupboards() {
        const rw = parseFloat(inputRoomWidth.value);
        return (rw > 0) ? Math.max(1, Math.floor(rw / CUPBOARD_UNIT_WIDTH_MM)) : 1;
      }

      /** Returns the max shelves allowed by current room height (hard cap: 10) */
      function maxShelves() {
        const rh = parseFloat(inputRoomHeight.value);
        return (rh > 0) ? Math.min(10, Math.max(1, Math.floor(rh / SHELF_TIER_HEIGHT_MM))) : 10;
      }

      function validateCupboards(val) {
        const rw = parseFloat(inputRoomWidth.value) || 0;
        const maxAllowed = maxCupboards();
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1) {
          setFieldError('cupboards', `⚠ Cupboard Units must be at least 1 unit.`, false);
          return false;
        }
        if (num > maxAllowed) {
          setFieldError('cupboards', `⚠ Capacity Warning: ${num} units exceed room width (${rw}mm). Max ${maxAllowed} unit(s) fit @ ${CUPBOARD_UNIT_WIDTH_MM}mm each.`, true);
          return true;
        }
        setFieldError('cupboards', '');
        return true;
      }

      function validateShelves(val) {
        const rh = parseFloat(inputRoomHeight.value) || 0;
        const maxAllowed = maxShelves();
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1) {
          setFieldError('shelves', `⚠ Shelves must be at least 1 tier per unit.`, false);
          return false;
        }
        if (num > 10) {
          setFieldError('shelves', `⚠ Warning: Maximum allowed shelving tiers is 10.`, true);
          return true;
        }
        if (num > maxAllowed) {
          setFieldError('shelves', `⚠ Capacity Warning: ${num} tiers exceed room height (${rh}mm). Max ${maxAllowed} tier(s) fit @ ${SHELF_TIER_HEIGHT_MM}mm each.`, true);
          return true;
        }
        setFieldError('shelves', '');
        return true;
      }

      function validateCustomerField(field) {
        if (field === 'customer-id') {
          const v = (document.getElementById('customer-id')?.value || '').trim();
          if (!v) {
            setFieldError('customer-id', '⚠ Customer ID is required to save.', false);
            return false;
          }
          setFieldError('customer-id', '');
          return true;
        }
        if (field === 'customer-email') {
          const v = document.getElementById('customer-email')?.value || '';
          if (!isValidCustomerEmail(v)) {
            setFieldError('customer-email', '⚠️ Enter a valid email address (example: fgdfs@gmail.com).', false);
            return false;
          }
          setFieldError('customer-email', '');
          return true;
        }
        if (field === 'customer-phone') {
          const v = (document.getElementById('customer-phone')?.value || '').replace(/\D/g, '');
          const iso = getSelectedCountryIso();
          const trigger = document.getElementById('country-search-trigger');
          if (!iso) {
            if (trigger) trigger.classList.add('input-error');
            setFieldError('customer-phone', '\u26a0\ufe0f Please select a country first.', false);
            return false;
          }
          if (trigger) trigger.classList.remove('input-error');
          if (!window.PhoneValidation.validatePhone(v, iso)) {
            const country = window.PhoneValidation.getCountryByIso(iso);
            const hint = window.PhoneValidation.getPhoneFormatHint(iso);
            const countryName = country ? country.name : 'the selected country';
            setFieldError('customer-phone', '\u26a0\ufe0f Enter a valid phone number for ' + countryName + ' (' + hint + ').', false);
            return false;
          }
          setFieldError('customer-phone', '');
          return true;
        }
        if (field === 'customer-name') {
          const v = (document.getElementById('customer-name')?.value || '').trim();
          if (!v || v.length < 2) {
            setFieldError('customer-name', '⚠ Customer name must be at least 2 characters.', false);
            return false;
          }
          setFieldError('customer-name', '');
          return true;
        }
        return true;
      }

      /** Refresh the cupboard & shelf hints and enable/disable the + buttons */
      function updateUnitLimitHints() {
        const rw = parseFloat(inputRoomWidth.value) || 0;
        const rh = parseFloat(inputRoomHeight.value) || 0;
        const maxCup = maxCupboards();
        const maxSh  = maxShelves();

        // Cupboard hint
        const cupHint = document.getElementById('cupboard-auto-hint');
        if (cupHint) {
          cupHint.textContent = rw > 0
            ? `💡 Max ${maxCup} unit${maxCup !== 1 ? 's' : ''} @ ${CUPBOARD_UNIT_WIDTH_MM}mm each fit in ${rw}mm room`
            : '💡 Enter room width to auto-calculate';
        }

        // Shelf hint
        const shHint = document.getElementById('shelf-auto-hint');
        if (shHint) {
          shHint.textContent = rh > 0
            ? `💡 Max ${maxSh} tier${maxSh !== 1 ? 's' : ''} @ ${SHELF_TIER_HEIGHT_MM}mm each fit in ${rh}mm room`
            : '💡 Enter room height to auto-calculate';
        }

        // Disable + buttons when at the limit
        const cupIncBtn = document.getElementById('cupboards-inc');
        if (cupIncBtn) cupIncBtn.disabled = state.cupboards >= maxCup;
        const shIncBtn = document.getElementById('shelves-inc');
        if (shIncBtn) shIncBtn.disabled = state.shelves >= maxSh;
      }

      function updateDimensions() {
        let rw = parseFloat(inputRoomWidth.value);
        let rh = parseFloat(inputRoomHeight.value);
        let rd = parseFloat(inputRoomDepth.value);

        // Run inline validation for all three fields immediately
        validateDimension('width',  isNaN(rw) ? NaN : rw);
        validateDimension('height', isNaN(rh) ? NaN : rh);
        validateDimension('depth',  isNaN(rd) ? NaN : rd);

        if (isNaN(rw) || rw <= 0) rw = '';
        if (isNaN(rh) || rh <= 0) rh = '';
        if (isNaN(rd) || rd <= 0) rd = '';
        hudDim.textContent = `${rw || 0}mm × ${rh || 0}mm × ${rd || 0}mm`;

        // Auto-calculate and enforce cupboard count from room width
        if (rw && rw > 0) {
          const autoCups = Math.max(1, Math.floor(rw / CUPBOARD_UNIT_WIDTH_MM));
          if (state.cupboards > autoCups) setCupboards(autoCups);
          else validateCupboards(state.cupboards);
        }

        // Clamp shelves if room height changed
        if (rh && rh > 0) {
          const maxSh = Math.min(10, Math.max(1, Math.floor(rh / SHELF_TIER_HEIGHT_MM)));
          if (state.shelves > maxSh) setShelves(maxSh);
          else validateShelves(state.shelves);
        }

        updateUnitLimitHints();
        requestAnimationFrame(updateLayout);
      }

      // Dimension inputs — listen on 'input' and 'change'
      inputRoomWidth.addEventListener('input', () => { updateDimensions(); renderCupboards(); });
      inputRoomWidth.addEventListener('change', () => { updateDimensions(); renderCupboards(); });
      inputRoomHeight.addEventListener('input', () => { updateDimensions(); renderCupboards(); });
      inputRoomHeight.addEventListener('change', () => { updateDimensions(); renderCupboards(); });
      inputRoomDepth.addEventListener('input', updateDimensions);
      inputRoomDepth.addEventListener('change', updateDimensions);

      // Width stepper buttons (step: 100mm, min: 900, max: unlimited)
      document.getElementById('width-dec').addEventListener('click', () => {
        const cur = parseFloat(inputRoomWidth.value) || 900;
        const next = Math.max(900, cur - 100);
        inputRoomWidth.value = next;
        updateDimensions();
        renderCupboards();
      });
      document.getElementById('width-inc').addEventListener('click', () => {
        const cur = parseFloat(inputRoomWidth.value) || 900;
        const next = cur + 100;
        inputRoomWidth.value = next;
        updateDimensions();
        renderCupboards();
      });

      // Height stepper buttons (step: 100mm, min: 350, max: 3000)
      document.getElementById('height-dec').addEventListener('click', () => {
        const cur = parseFloat(inputRoomHeight.value) || 350;
        const next = Math.max(350, cur - 100);
        inputRoomHeight.value = next;
        updateDimensions();
        renderCupboards();
      });
      document.getElementById('height-inc').addEventListener('click', () => {
        const cur = parseFloat(inputRoomHeight.value) || 350;
        const next = Math.min(3000, cur + 100);
        inputRoomHeight.value = next;
        updateDimensions();
        renderCupboards();
      });

      // Depth stepper buttons (step: 50mm, min: 200, max: 1000)
      document.getElementById('depth-dec').addEventListener('click', () => {
        const cur = parseFloat(inputRoomDepth.value) || 200;
        const next = Math.max(200, cur - 50);
        inputRoomDepth.value = next;
        updateDimensions();
      });
      document.getElementById('depth-inc').addEventListener('click', () => {
        const cur = parseFloat(inputRoomDepth.value) || 200;
        const next = Math.min(1000, cur + 50);
        inputRoomDepth.value = next;
        updateDimensions();
      });

      // Customer fields real-time validation
      ['customer-id', 'customer-name', 'customer-phone', 'customer-email'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', function() {
            if (id === 'customer-phone') el.value = el.value.replace(/[^0-9]/g, '');
            validateCustomerField(id);
          });
          el.addEventListener('blur', function() { validateCustomerField(id); });
        }
      });

      // ── Searchable Country Dropdown Init ──
      (function initCountryDropdown() {
        var trigger = document.getElementById('country-search-trigger');
        var panel = document.getElementById('country-dropdown-panel');
        var searchInput = document.getElementById('country-search-input');
        var optionsList = document.getElementById('country-options-list');
        var highlightedIndex = -1;

        function updateHighlight(items) {
          items.forEach(function(item, idx) {
            item.classList.toggle('highlighted', idx === highlightedIndex);
            if (idx === highlightedIndex) {
              item.scrollIntoView({ block: 'nearest' });
            }
          });
        }

        function renderOptions(query) {
          var results = window.PhoneValidation.searchCountries(query || '');
          var currentIso = document.getElementById('customer-country-iso').value;
          highlightedIndex = results.length > 0 ? 0 : -1;
          if (results.length === 0) {
            optionsList.innerHTML = '<li class="country-no-results">No countries found</li>';
            return;
          }
          optionsList.innerHTML = results.map(function(c, idx) {
            return '<li data-iso="' + c.iso + '" class="' + (c.iso === currentIso ? 'selected' : '') + ' ' + (idx === 0 ? 'highlighted' : '') + '">' +
              c.flag + ' ' + c.name + ' (' + c.callingCode + ')' + '</li>';
          }).join('');
          optionsList.querySelectorAll('li[data-iso]').forEach(function(li, idx) {
            li.addEventListener('mouseenter', function() {
              highlightedIndex = idx;
              var all = Array.from(optionsList.querySelectorAll('li[data-iso]'));
              updateHighlight(all);
            });
            li.addEventListener('mousedown', function(e) {
              e.preventDefault();
              setCountryDropdown(li.dataset.iso);
              closeDropdown();
              validateCustomerField('customer-phone');
            });
          });
        }

        function openDropdown() {
          panel.classList.add('open');
          trigger.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
          searchInput.value = '';
          renderOptions('');
          setTimeout(function() { searchInput.focus(); }, 10);
        }

        function closeDropdown() {
          panel.classList.remove('open');
          trigger.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', function(e) {
          e.stopPropagation();
          if (panel.classList.contains('open')) closeDropdown();
          else openDropdown();
        });

        searchInput.addEventListener('input', function() {
          renderOptions(searchInput.value);
        });

        searchInput.addEventListener('keydown', function(e) {
          var items = Array.from(optionsList.querySelectorAll('li[data-iso]'));
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (items.length > 0) {
              highlightedIndex = (highlightedIndex + 1) % items.length;
              updateHighlight(items);
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (items.length > 0) {
              highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
              updateHighlight(items);
            }
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && items[highlightedIndex]) {
              setCountryDropdown(items[highlightedIndex].dataset.iso);
              closeDropdown();
              validateCustomerField('customer-phone');
            } else if (items.length === 1) {
              setCountryDropdown(items[0].dataset.iso);
              closeDropdown();
              validateCustomerField('customer-phone');
            }
          } else if (e.key === 'Escape') {
            closeDropdown();
          }
        });

        document.addEventListener('click', function(e) {
          if (!document.getElementById('country-search-wrap').contains(e.target)) {
            closeDropdown();
          }
        });

        // Pre-render options so first open is instant
        renderOptions('');
      })();

      function isDoorOpen(id, side) {
        if (state.doorsOpen[id] !== undefined) return !!state.doorsOpen[id];
        const isLeft = side === 'left' || id.includes('left');
        const isRight = side === 'right' || id.includes('right');
        const isBoth = side === 'both' || (!isLeft && !isRight);

        if (state.batchMode === 'all-open') return true;
        if (state.batchMode === 'all-closed') return false;
        if (state.batchMode === 'left-open') return isLeft || isBoth;
        if (state.batchMode === 'left-closed') return false;
        if (state.batchMode === 'right-open') return isRight || isBoth;
        if (state.batchMode === 'right-closed') return false;
        return false;
      }

      function generateBooksHTML(seed, numShelves) {
        const count = 13 + (seed % 4);
        let books = '';
        for (let i = 0; i < count; i++) {
          if (i > 0 && i % 4 === 0) books += '<div class="book-divider"></div>';
          const c = bookColors[(i * 3 + seed * 7) % bookColors.length];
          const h = 68 + ((i * 19 + seed * 13) % 28);
          const w = 9 + ((i * 7 + seed * 5) % 8);
          const tilt = i === count - 1 && seed % 2 === 0 ? 'transform: rotate(6.5deg); transform-origin: bottom left; margin-left: 3px;' : (i === 0 && seed % 2 === 1 ? 'transform: rotate(-6deg); transform-origin: bottom right; margin-right: 3px;' : '');
          books += `<div class="book" style="height:${h}%; width:${w}px; background-color:${c.bg}; border-color:${c.border}; ${tilt}"><span class="spine-line" style="background:${c.spine}"></span><span class="spine-title" style="background:${c.title}"></span><span class="spine-line" style="background:${c.spine}"></span></div>`;
        }
        return `<div class="books-row">${books}</div>`;
      }

      function renderCupboards(instantTransition = true) {
        if (instantTransition) row.classList.add('no-transition');

        let html = '';
        const { cupboards: numCups, shelves: numShelves, doorStyle: style } = state;

        for (let c = 1; c <= numCups; c++) {
          let tiersHTML = '';
          for (let s = 1; s <= numShelves; s++) {
            tiersHTML += `<div class="shelf-tier">${generateBooksHTML(c * 20 + s + numShelves, numShelves)}<div class="shelf-plank"><span class="shelf-peg left"></span><span class="shelf-peg right"></span></div></div>`;
          }

          let doorsHTML = '';
          if (style === 'solid') {
            const lKey = `c${c}-solid-left`, rKey = `c${c}-solid-right`;
            const isLeftOpen = isDoorOpen(lKey, 'left');
            const isRightOpen = isDoorOpen(rKey, 'right');
            doorsHTML = `
              <div class="solid-doors-wrapper">
                <div class="solid-door solid-door-left ${isLeftOpen ? 'is-open' : ''}" data-door-id="${lKey}" data-side="left">
                  <div class="door-inner-face"><div class="door-frame"><div class="door-inner-bevel"></div></div><div class="door-handle door-handle-left"></div><div class="hinge hinge-top"></div><div class="hinge hinge-bottom"></div></div>
                </div>
                <div class="solid-door solid-door-right ${isRightOpen ? 'is-open' : ''}" data-door-id="${rKey}" data-side="right">
                  <div class="door-inner-face"><div class="door-frame"><div class="door-inner-bevel"></div></div><div class="door-handle door-handle-right"></div><div class="hinge hinge-top"></div><div class="hinge hinge-bottom"></div></div>
                </div>
              </div>`;
          } else if (style === 'sliding') {
            let rowsHTML = '';
            for (let s = 1; s <= numShelves; s++) {
              const lKey = `c${c}-s${s}-glass-left`, rKey = `c${c}-s${s}-glass-right`;
              const isLeftOpen = isDoorOpen(lKey, 'left');
              const isRightOpen = isDoorOpen(rKey, 'right');
              rowsHTML += `
                <div class="sliding-door-row">
                  <div class="sliding-track-frame">
                    <div class="glass-door glass-door-left ${isLeftOpen ? 'is-open' : ''}" data-door-id="${lKey}" data-side="left"><span class="glass-sheen"></span><i class="glass-handle glass-handle-left"></i></div>
                    <div class="glass-door glass-door-right ${isRightOpen ? 'is-open' : ''}" data-door-id="${rKey}" data-side="right"><span class="glass-sheen"></span><i class="glass-handle glass-handle-right"></i></div>
                  </div>
                </div>`;
            }
            doorsHTML = `<div class="glass-doors-wrapper">${rowsHTML}</div>`;
          } else if (style === 'toplift') {
            let rowsHTML = '';
            for (let s = 1; s <= numShelves; s++) {
              const dKey = `c${c}-s${s}-toplift`;
              const isOpen = isDoorOpen(dKey, 'both');
              rowsHTML += `<div class="toplift-door-row"><div class="toplift-panel ${isOpen ? 'is-open' : ''}" data-door-id="${dKey}" data-side="both"><div class="toplift-hinge-bar"></div><div class="toplift-inner-bevel"></div><i class="toplift-handle"></i></div></div>`;
            }
            doorsHTML = `<div class="toplift-doors-wrapper">${rowsHTML}</div>`;
          }

          html += `
            <div class="cupboard" data-cupboard="${c}">
              <div class="top"><span class="brass-screw left"></span><span class="cupboard-title">CUPBOARD ${c}</span><span class="brass-screw right"></span></div>
              <div class="cupboard-interior"><div class="shelves-container">${tiersHTML}</div>${doorsHTML}</div>
              <div class="cupboard-base"></div>
            </div>`;
        }

        row.innerHTML = html;
        updateHUD();
        attachDoorListeners();
        updateSlidingPhysics();
        // Recalculate layout scale after DOM is updated
        requestAnimationFrame(updateLayout);

        if (instantTransition) {
          void row.offsetHeight;
          requestAnimationFrame(() => row.classList.remove('no-transition'));
        }
      }

      // ── Layout Engine: scale cupboards to fit room preview ──────────────────
      function updateLayout() {
        const container = document.getElementById('room-container');
        if (!container) return;

        const rw = parseFloat(inputRoomWidth.value) || 900;
        const rh = parseFloat(inputRoomHeight.value) || 350;
        const n  = state.cupboards;
        const ROOM_PAD_X = 16;   // px padding each side inside room
        const ROOM_PAD_BOTTOM = 12; // px bottom padding
        const MIN_CUP_W = 60;    // px minimum cupboard width
        const MIN_SHELF_H = 40;  // px minimum shelf tier height
        const TOP_BAR_H = 28;    // px cupboard top bar
        const BASE_H = 10;       // px cupboard base

        const availW = container.clientWidth  - ROOM_PAD_X * 2;
        const availH = container.clientHeight - ROOM_PAD_BOTTOM;

        // Gap between cupboards (scales with cupboard width)
        const rawGap = Math.max(4, Math.round(availW * 0.012));

        // Total width needed for n cupboards + (n-1) gaps
        // cupW * n + rawGap * (n-1) <= availW
        // cupW = (availW - rawGap * (n-1)) / n
        let cupW = Math.floor((availW - rawGap * (n - 1)) / n);
        cupW = Math.max(cupW, MIN_CUP_W);

        // Height: scale shelves to fit vertically
        // cupboard height = TOP_BAR_H + shelfH * numShelves + BASE_H <= availH
        const shelves = state.shelves;
        let shelfH = Math.floor((availH - TOP_BAR_H - BASE_H) / shelves);
        shelfH = Math.max(shelfH, MIN_SHELF_H);

        // Scale by room proportions (width:height aspect)
        // Use mm scale so cupboards feel proportional
        const mmPerPxW = rw / availW;
        const mmPerPxH = rh / (availH - TOP_BAR_H - BASE_H);
        // Already computed cupW from available px, that's correct
        // Optionally apply aspect-ratio awareness: if room is very wide, height scale might differ
        // Just use pixel-based clamped values already computed above

        // Detect overflow: total width of cupboards exceeds container
        const totalW = cupW * n + rawGap * (n - 1) + ROOM_PAD_X * 2;
        const overflowing = cupW <= MIN_CUP_W && totalW > container.clientWidth;
        const warnEl = document.getElementById('layout-overflow-warning');
        if (warnEl) warnEl.style.display = overflowing ? 'block' : 'none';

        // Apply CSS custom properties to cupboard-row (inherits down to cupboards & shelves)
        row.style.setProperty('--cupboard-w', cupW + 'px');
        row.style.setProperty('--shelf-h', shelfH + 'px');
        row.style.setProperty('--cup-gap', rawGap + 'px');
        row.style.setProperty('--room-pad-x', ROOM_PAD_X + 'px');

        // Adjust cupboard-title font size to fit
        const titleScale = Math.max(0.45, Math.min(0.68, cupW / 160 * 0.68));
        row.style.setProperty('--cupboard-title-size', titleScale + 'rem');
        // Apply font size to all cupboard titles
        row.querySelectorAll('.cupboard-title').forEach(el => {
          el.style.fontSize = titleScale + 'rem';
          el.style.letterSpacing = titleScale < 0.55 ? '0.5px' : '1.5px';
        });
      }

      function updateSlidingPhysics() {
        if (state.doorStyle !== 'sliding') return;
        row.querySelectorAll('.sliding-door-row').forEach(r => {
          const trackWidth = r.getBoundingClientRect().width || 150;
          const leftDoor = r.querySelector('.glass-door-left'), rightDoor = r.querySelector('.glass-door-right');
          if (!leftDoor || !rightDoor) return;
          const doorWidth = leftDoor.getBoundingClientRect().width || (trackWidth / 2 - 2);
          const maxTravel = Math.max(10, Math.floor(doorWidth * 0.85));

          const leftId = leftDoor.getAttribute('data-door-id');
          const rightId = rightDoor.getAttribute('data-door-id');
          const isLeftOpen = isDoorOpen(leftId, 'left');
          const isRightOpen = isDoorOpen(rightId, 'right');
          leftDoor.style.transform = `translateX(${isLeftOpen ? maxTravel : 0}px)`;
          rightDoor.style.transform = `translateX(${isRightOpen ? -maxTravel : 0}px)`;
        });
      }

      function attachDoorListeners() {
        row.querySelectorAll('[data-door-id]').forEach(door => {
          door.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.getAttribute('data-door-id');
            const side = this.getAttribute('data-side');
            const currentlyOpen = isDoorOpen(id, side);
            const nextState = !currentlyOpen;
            this.classList.toggle('is-open', nextState);
            state.doorsOpen[id] = nextState;
            if (state.doorStyle === 'sliding') updateSlidingPhysics();
            updateHUD();
          });
        });
      }

      function updateHUD() {
        hudCupboards.textContent = `${state.cupboards} ${state.cupboards === 1 ? 'Unit' : 'Units'}`;
        hudShelves.textContent = `${state.shelves} ${state.shelves === 1 ? 'Shelf per Unit' : 'Shelves per Unit'}`;
        const doorNames = { open: 'Open Bookshelf', solid: 'Solid Panel Walnut Doors', sliding: 'Sliding Tempered Glass Doors', toplift: 'Top-Lift Hinged Doors' };
        hudDoors.textContent = doorNames[state.doorStyle] || 'Custom';

        const openCount = row.querySelectorAll('[data-door-id].is-open').length;
        doorStatusPill.textContent = state.doorStyle === 'open' ? 'Display Open' : (openCount > 0 ? `${openCount} Door Panel${openCount > 1 ? 's' : ''} Open` : 'All Doors Closed');
      }

      function setCupboards(val) {
        let n = parseInt(val, 10);
        if (isNaN(n) || n < 1) n = 1;
        state.cupboards = n;
        cupInput.value = n;
        validateCupboards(n);
        updateUnitLimitHints();
        renderCupboards();
      }

      function setShelves(val) {
        let n = parseInt(val, 10);
        if (isNaN(n) || n < 1) n = 1;
        if (n > 10) n = 10;
        state.shelves = n;
        shInput.value = n;
        validateShelves(n);
        updateUnitLimitHints();
        renderCupboards();
      }

      function setDoorStyle(styleName, preserveDoors = false) {
        state.doorStyle = styleName;
        if (!preserveDoors) state.doorsOpen = {};
        document.querySelectorAll('.btn-door-style').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-style') === styleName));
        renderCupboards();
      }

      function toggleDoorsBatch(sideFilter, shouldOpen) {
        if (sideFilter === 'all') state.batchMode = shouldOpen ? 'all-open' : 'all-closed';
        else if (sideFilter === 'left') state.batchMode = shouldOpen ? 'left-open' : 'left-closed';
        else if (sideFilter === 'right') state.batchMode = shouldOpen ? 'right-open' : 'right-closed';

        state.doorsOpen = {};
        row.querySelectorAll('[data-door-id]').forEach(door => {
          const id = door.getAttribute('data-door-id');
          const side = door.getAttribute('data-side');
          const open = isDoorOpen(id, side);
          door.classList.toggle('is-open', open);
        });

        if (state.doorStyle === 'sliding') updateSlidingPhysics();
        updateHUD();
      }

      // Cupboard & Shelves input & button listeners
      cupInput.addEventListener('input', () => {
        if (cupInput.value === '') { validateCupboards(''); return; }
        const n = parseInt(cupInput.value, 10);
        if (!isNaN(n)) setCupboards(n);
      });
      cupInput.addEventListener('change', () => setCupboards(cupInput.value));
      document.getElementById('cupboards-dec').addEventListener('click', () => {
        if (state.cupboards > 1) setCupboards(state.cupboards - 1);
      });
      document.getElementById('cupboards-inc').addEventListener('click', () => {
        const max = maxCupboards();
        if (state.cupboards < max) setCupboards(state.cupboards + 1);
        else setFieldError('cupboards', `⚠ Maximum cupboards for ${inputRoomWidth.value}mm room width is ${max} units.`, true);
      });

      shInput.addEventListener('input', () => {
        if (shInput.value === '') { validateShelves(''); return; }
        const n = parseInt(shInput.value, 10);
        if (!isNaN(n)) setShelves(n);
      });
      shInput.addEventListener('change', () => setShelves(shInput.value));
      document.getElementById('shelves-dec').addEventListener('click', () => {
        if (state.shelves > 1) setShelves(state.shelves - 1);
      });
      document.getElementById('shelves-inc').addEventListener('click', () => {
        const max = maxShelves();
        if (state.shelves < max) setShelves(state.shelves + 1);
        else setFieldError('shelves', `⚠ Maximum shelves for ${inputRoomHeight.value}mm room height is ${max} tiers.`, true);
      });

      document.querySelectorAll('.btn-door-style').forEach(btn => btn.addEventListener('click', () => setDoorStyle(btn.getAttribute('data-style'))));

      document.getElementById('btn-open-all').addEventListener('click', () => toggleDoorsBatch('all', true));
      document.getElementById('btn-close-all').addEventListener('click', () => toggleDoorsBatch('all', false));
      document.getElementById('btn-open-left').addEventListener('click', () => toggleDoorsBatch('left', true));
      document.getElementById('btn-close-left').addEventListener('click', () => toggleDoorsBatch('left', false));
      document.getElementById('btn-open-right').addEventListener('click', () => toggleDoorsBatch('right', true));
      document.getElementById('btn-close-right').addEventListener('click', () => toggleDoorsBatch('right', false));

      // ── Customer Management & Automatic Unique ID Generation ──
      const savedConfigsList = document.getElementById('saved-configs-list');
      const savedConfigsContainer = document.getElementById('saved-configs-container');
      const API_BASE = (window.location.protocol === 'file:')
        ? 'http://localhost:3001/api'
        : '/api';
      let currentConfigsMap = {};
      let currentEditingCustomerId = null;

      function updateCustomerIdStatus(text, color) {
        const el = document.getElementById('customer-id-status');
        if (el) {
          el.textContent = text;
          el.style.color = color || 'var(--text-sub)';
        }
      }

      async function fetchNextCustomerId(setInputValue = true) {
        const endpoints = [
          API_BASE + '/next-customer-id',
          'http://localhost:3001/api/next-customer-id',
          'http://localhost:3000/api/next-customer-id'
        ];
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep);
            if (res.ok) {
              const result = await res.json();
              if (result && result.nextId) {
                if (setInputValue) {
                  document.getElementById('customer-id').value = result.nextId;
                  currentEditingCustomerId = null;
                  validateCustomerField('customer-id');
                  updateCustomerIdStatus(`✨ Auto-generated unique ID: ${result.nextId}`, '#34d399');
                }
                return result.nextId;
              }
            }
          } catch (e) {}
        }

        // Lowest unused offline ID generation from existing configs
        const localConfigs = Object.values(currentConfigsMap);
        const usedNumbers = new Set();
        localConfigs.forEach(c => {
          if (!c || !c.customerId) return;
          const match = String(c.customerId).match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num >= 1001) usedNumbers.add(num);
          }
        });
        let candidateNum = 1001;
        while (usedNumbers.has(candidateNum)) {
          candidateNum++;
        }
        let fallbackId = 'CUST-' + candidateNum;
        while (localConfigs.some(c => c && (
          String(c.customerId || '').toLowerCase() === fallbackId.toLowerCase() ||
          String(c.customerId || '') === String(candidateNum)
        ))) {
          candidateNum++;
          fallbackId = 'CUST-' + candidateNum;
        }
        if (setInputValue) {
          document.getElementById('customer-id').value = fallbackId;
          currentEditingCustomerId = null;
          validateCustomerField('customer-id');
          updateCustomerIdStatus(`✨ Assigned unique ID: ${fallbackId}`, '#34d399');
        }
        return fallbackId;
      }

      document.getElementById('btn-gen-cust-id').addEventListener('click', () => {
        fetchNextCustomerId(true);
        showToast('✨ Generated new unique Customer ID');
      });

      document.getElementById('customer-id').addEventListener('input', event => {
        if (!currentEditingCustomerId || event.target.value.trim().toLowerCase() !== currentEditingCustomerId.toLowerCase()) {
          currentEditingCustomerId = null;
        }
      });

      function formatValue(val) {
        return (val !== undefined && val !== null && String(val).trim() !== '') ? String(val).trim() : 'Not provided';
      }

      function renderConfigsList(configs) {
        if (!configs || configs.length === 0) {
          savedConfigsContainer.style.display = 'none';
          return;
        }
        configs.sort((a, b) => (a.customerId || '').localeCompare(b.customerId || ''));
        if (savedConfigsContainer) savedConfigsContainer.style.display = 'none';
        savedConfigsList.innerHTML = configs.map(c => {
          const custName = formatValue(c.name || c.customerName);
          const custPhone = formatCustomerPhone(c);
          const custEmail = formatValue(c.email || c.customerEmail);

          return `
          <div class="saved-config-card" style="background: rgba(10,14,25,0.75); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); padding: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <div>
                <div style="font-weight: 700; color: #fff; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                  <span>🆔</span> <span>${c.customerId || 'Unknown ID'}</span>
                </div>
                <div style="font-size: 0.82rem; font-weight: 600; color: var(--gold-300); margin-top: 2px;">
                  👤 ${custName}
                </div>
              </div>
              ${c._fromServer ? '<span style="font-size:0.65rem;background:rgba(16,185,129,0.2);color:#6ee7b7;border:1px solid rgba(16,185,129,0.3);border-radius:4px;padding:2px 6px;font-weight:700;">JSON</span>' : ''}
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 4px; font-size: 0.76rem; color: var(--text-sub); margin-bottom: 10px; background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
              <div style="display: flex; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span style="color: var(--gold-400); min-width: 50px;">📞 Phone:</span>
                <span style="color: ${custPhone === 'Not provided' ? 'var(--text-muted)' : '#e2e8f0'}; font-weight: 500;">${custPhone}</span>
              </div>
              <div style="display: flex; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span style="color: var(--gold-400); min-width: 50px;">✉️ Email:</span>
                <span style="color: ${custEmail === 'Not provided' ? 'var(--text-muted)' : '#e2e8f0'}; font-weight: 500;">${custEmail}</span>
              </div>
              <div style="margin-top: 2px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.08); font-size: 0.72rem; color: var(--text-muted);">
                Room: ${c.roomWidth || 0}mm × ${c.roomHeight || 0}mm × ${c.roomDepth || 0}mm | ${c.cupboards || 1} units | ${c.shelves || 1} shelves | ${c.doorStyle || 'solid'}
              </div>
            </div>

            <div style="display: flex; gap: 8px;">
              <button type="button" class="action-btn" onclick="window.editConfig('${c.customerId}')" style="flex: 1;">✏️ Edit</button>
              <button type="button" class="action-btn" onclick="window.deleteConfig('${c.customerId}')" style="flex: 1; background: rgba(220, 38, 38, 0.15); color: #fca5a5; border-color: rgba(220, 38, 38, 0.3);">🗑️ Delete</button>
            </div>
          </div>
        `;
        }).join('');
      }

      async function fetchCustomersFromJSON() {
        const apiEndpoints = [
          API_BASE + '/customers',
          'http://localhost:3001/api/customers',
          'http://localhost:3000/api/customers'
        ];
        for (const url of apiEndpoints) {
          try {
            const res = await fetch(url, { cache: 'no-store' });
            const result = await res.json();
            if (res.status === 503 || (result && result.error === 'DATA_FILE_MISSING')) {
              showToast(`⚠️ Customer database missing: ${result.path || 'data/library-customers.json'}`);
              return null;
            }
            if (res.ok && result && result.success && Array.isArray(result.data)) {
              return result.data.map(c => ({ ...c, _fromServer: true }));
            }
          } catch (e) {}
        }

        // Static relative path fallback to EXP 2's own library-customers.json
        const staticPaths = [
          'data/library-customers.json',
          './data/library-customers.json',
          '/data/library-customers.json',
          '../exp 2/data/library-customers.json',
          '../ex 2/data/library-customers.json'
        ];
        for (const p of staticPaths) {
          try {
            const res = await fetch(p, { cache: 'no-store' });
            if (res.ok) {
              const list = await res.json();
              if (Array.isArray(list)) {
                return list.map(c => ({ ...c, _fromServer: true }));
              }
            }
          } catch (e) {}
        }

        return null;
      }

      async function loadSavedConfigs(isSilentSync = false) {
        let configs = {};
        
        // 1. Read from Experiment 3's customer JSON / API first (source of truth)
        const serverCustomers = await fetchCustomersFromJSON();
        if (serverCustomers && Array.isArray(serverCustomers)) {
          // Active IDs present on the server
          const activeIds = new Set(serverCustomers.map(c => c.customerId));

          // Purge stale/ghost entries from localStorage that no longer exist on the server
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('library_project_')) {
              const custId = key.replace('library_project_', '');
              if (!activeIds.has(custId)) {
                localStorage.removeItem(key);
              }
            }
          }

          serverCustomers.forEach(c => {
            if (c && c.customerId) {
              configs[c.customerId] = { ...c, _fromServer: true };
              try {
                localStorage.setItem('library_project_' + c.customerId, JSON.stringify(c));
              } catch (e) {}
            }
          });
        } else {
          // 2. Offline fallback: read cached items only if server is completely offline
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('library_project_')) {
              try {
                const c = JSON.parse(localStorage.getItem(key));
                if (c && c.customerId) configs[c.customerId] = c;
              } catch (e) {}
            }
          }
        }

        currentConfigsMap = configs;
        renderConfigsList(Object.values(configs));
        const topBadge = document.getElementById('cm-count-badge');
        if (topBadge && Object.keys(configs).length) topBadge.textContent = Object.keys(configs).length;
      }

      window.editConfig = function(custId) {
        let _cachedEdit = null;
        try { _cachedEdit = JSON.parse(localStorage.getItem('library_project_' + custId) || 'null'); } catch(e) {}
        const c = currentConfigsMap[custId] || _cachedEdit;
        if (c) {
          currentEditingCustomerId = c.customerId;
          document.getElementById('customer-id').value = c.customerId || '';
          document.getElementById('customer-name').value = c.name || c.customerName || '';
          setCustomerPhoneFromRecord(c);
          document.getElementById('customer-email').value = c.email || c.customerEmail || '';
          updateCustomerIdStatus(`✏️ Editing customer: ${c.customerId}`, '#60a5fa');
          validateCustomerField('customer-id');
          validateCustomerField('customer-name');
          validateCustomerField('customer-phone');
          validateCustomerField('customer-email');

          inputRoomWidth.value = c.roomWidth || 900;
          inputRoomHeight.value = c.roomHeight || 350;
          inputRoomDepth.value = c.roomDepth || 200;
          state.cupboards = c.cupboards || 1;
          cupInput.value = state.cupboards;
          state.shelves = c.shelves || 1;
          shInput.value = state.shelves;
          state.doorsOpen = c.doorsOpen || {};
          state.batchMode = 'all-closed';
          setDoorStyle(c.doorStyle || 'solid', true);
          updateDimensions();
          const panel = document.querySelector('.panel');
          if (panel) panel.scrollTop = 0;
          showToast(`✏️ Configuration for ${c.customerId} loaded!`);
        }
      };

      window.deleteConfig = async function(custId) {
        if (confirm(`Are you sure you want to delete the configuration for Customer ID: ${custId}?`)) {
          localStorage.removeItem('library_project_' + custId);
          delete currentConfigsMap[custId];

          const deleteUrls = [
            API_BASE + '/customers/' + encodeURIComponent(custId),
            'http://localhost:3001/api/customers/' + encodeURIComponent(custId),
            'http://localhost:3000/api/customers/' + encodeURIComponent(custId)
          ];
          for (const u of deleteUrls) {
            try {
              const res = await fetch(u, { method: 'DELETE' });
              if (res.ok) break;
            } catch (e) {}
          }

          await loadSavedConfigs();
          showToast(`🗑️ Customer ${custId} deleted.`);
        }
      };

      // ── Generate Design Action ──
      document.getElementById('btn-generate').addEventListener('click', () => {
        const rw = parseFloat(inputRoomWidth.value);
        const rh = parseFloat(inputRoomHeight.value);
        const rd = parseFloat(inputRoomDepth.value);

        const wOk = validateDimension('width',  rw);
        const hOk = validateDimension('height', rh);
        const dOk = validateDimension('depth',  rd);
        const cOk = validateCupboards(state.cupboards);
        const sOk = validateShelves(state.shelves);
        const phoneOk = validateCustomerField('customer-phone');
        const emailOk = validateCustomerField('customer-email');

        if (isNaN(rw) || rw <= 0 || isNaN(rh) || rh <= 0 || isNaN(rd) || rd <= 0 || !cOk || !sOk || !phoneOk || !emailOk) {
          showToast('⚠️ Please resolve input validation errors before generating.');
          return;
        }

        document.getElementById('generate-alert').style.display = 'none';
        renderCupboards();
      });

      document.getElementById('btn-accept').addEventListener('click', () => {
        document.getElementById('generate-alert').style.display = 'block';
        document.getElementById('btn-save').click();
      });

      document.getElementById('btn-redesign').addEventListener('click', () => {
        document.getElementById('generate-alert').style.display = 'none';
      });

      // ── Start New / Reconfigure ──
      document.getElementById('btn-reconfigure').addEventListener('click', () => {
        if (confirm('Are you sure you want to start a new configuration? All unsaved progress will be lost.')) {
          fetchNextCustomerId(true);
          document.getElementById('customer-name').value = '';
          document.getElementById('customer-phone').value = '';
          document.getElementById('customer-email').value = '';
          clearCountryDropdown();
          ['customer-id', 'customer-name', 'customer-phone', 'customer-email', 'width', 'height', 'depth', 'cupboards', 'shelves'].forEach(id => setFieldError(id, ''));

          inputRoomWidth.value = 900;
          inputRoomHeight.value = 350;
          inputRoomDepth.value = 200;
          cupInput.value = 1;
          state.cupboards = 1;
          shInput.value = 1;
          state.shelves = 1;
          state.doorsOpen = {};
          setDoorStyle('solid');
          document.getElementById('generate-alert').style.display = 'none';
          updateDimensions();
          renderCupboards();
        }
      });

      // ── Save Configuration ──
      document.getElementById('btn-save').addEventListener('click', async () => {
        const custId = (document.getElementById('customer-id').value || '').trim();
        const custName = (document.getElementById('customer-name').value || '').trim();
        const phoneData = getCustomerPhoneData();
        const custPhone = phoneData.phone;
        const custEmail = (document.getElementById('customer-email').value || '').trim();
        const rw = parseFloat(inputRoomWidth.value);
        const rh = parseFloat(inputRoomHeight.value);
        const rd = parseFloat(inputRoomDepth.value);

        const idOk = validateCustomerField('customer-id');
        const emailOk = validateCustomerField('customer-email');
        const phoneOk = validateCustomerField('customer-phone');
        const nameOk = validateCustomerField('customer-name');
        const wOk = validateDimension('width',  rw);
        const hOk = validateDimension('height', rh);
        const dOk = validateDimension('depth',  rd);
        const cOk = validateCupboards(state.cupboards);
        const sOk = validateShelves(state.shelves);

        if (!idOk || !emailOk || !phoneOk || !nameOk || isNaN(rw) || rw <= 0 || isNaN(rh) || rh <= 0 || isNaN(rd) || rd <= 0 || !cOk || !sOk) {
          showToast('⚠️ Please resolve input validation errors before saving.');
          return;
        }

        const projectData = {
          customerId: custId,
          name: custName,
          country: phoneData.country,
          countryCode: phoneData.countryCode,
          phone: custPhone,
          phoneNumber: custPhone,
          fullPhone: phoneData.fullPhone,
          email: custEmail,
          roomWidth: rw,
          roomHeight: rh,
          roomDepth: rd,
          cupboards: state.cupboards,
          shelves: state.shelves,
          doorStyle: state.doorStyle,
          doorsOpen: state.doorsOpen,
          allowUpdate: !!currentEditingCustomerId && currentEditingCustomerId.toLowerCase() === custId.toLowerCase()
        };

        // Save/update to backend server which updates library-customers.json
        const saveUrls = [
          API_BASE + '/customers',
          'http://localhost:3001/api/customers',
          'http://localhost:3000/api/customers'
        ];
        let savedOk = false;
        let lastResult = null;

        for (const saveUrl of saveUrls) {
          try {
            const res = await fetch(saveUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...projectData, allowUpdate: true })
            });
            const result = await res.json();
            lastResult = result;
            if (result && result.success) {
              localStorage.setItem('library_project_' + custId, JSON.stringify(result.data || projectData));
              currentEditingCustomerId = custId;
              showToast('💾 Saved to library-customers.json!');
              savedOk = true;
              break;
            } else if (result && result.duplicate) {
              updateCustomerIdStatus(`⚠️ "${custId}" already exists! Try ${result.suggestedId}`, '#f87171');
              if (confirm(`Customer ID "${custId}" already exists. Use the new ID "${result.suggestedId}"?`)) {
                document.getElementById('customer-id').value = result.suggestedId;
                currentEditingCustomerId = null;
                document.getElementById('btn-save').click();
              }
              return;
            }
          } catch (e) {}
        }

        if (!savedOk) {
          localStorage.setItem('library_project_' + custId, JSON.stringify(projectData));
          if (lastResult && lastResult.message) {
            showToast('⚠️ ' + lastResult.message);
          } else {
            showToast('💾 Saved locally (server offline).');
          }
        }

        await loadSavedConfigs();
      });

      // Periodic auto-sync and focus sync so updates automatically appear in Experiment 2
      setInterval(() => loadSavedConfigs(true), 3000);
      window.addEventListener('focus', () => loadSavedConfigs(true));

      // Toast notification system
      function showToast(message, duration = 3000) {
        let toast = document.getElementById('save-toast');
        if (!toast) {
          toast = document.createElement('div');
          toast.id = 'save-toast';
          toast.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9999;padding:12px 20px;background:rgba(16,23,39,0.97);border:1px solid rgba(250,204,21,0.5);border-radius:10px;color:#fff;font-size:0.88rem;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.6);opacity:0;transform:translateY(16px);transition:opacity 0.3s ease,transform 0.3s ease;pointer-events:none;';
          document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(16px)';
        }, duration);
      }

      window.addEventListener('resize', () => {
        if (state.doorStyle === 'sliding') updateSlidingPhysics();
        updateLayout();
      });
      
      // Initialize on load
      renderCupboards();
      updateDimensions();
      loadSavedConfigs().then(() => {
        // Auto-generate fresh unique Customer ID on load if input is empty
        if (!document.getElementById('customer-id').value) {
          fetchNextCustomerId(true);
        }
      });
    })();

/* ── Customer Management Module ── */
    (function() {
      const overlay = document.getElementById('cm-overlay');
      const body = document.getElementById('cm-body');
      const searchInput = document.getElementById('cm-search');
      const countBadge = document.getElementById('cm-count-badge');
      const footerText = document.getElementById('cm-footer-text');
      const importFileInput = document.getElementById('cm-import-file');

      let _cachedConfigs = [];

      function getAllConfigsFromLS() {
        const configs = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('library_project_')) {
            try { configs.push(JSON.parse(localStorage.getItem(key))); } catch(e) {}
          }
        }
        configs.sort((a, b) => (a.customerId || '').localeCompare(b.customerId || ''));
        return configs;
      }

      function getAllConfigs() {
        return _cachedConfigs.length > 0 ? _cachedConfigs : getAllConfigsFromLS();
      }
      window.getAllConfigs = getAllConfigs;

      function refreshConfigs(callback) {
        const endpoints = [
          (typeof API_BASE !== 'undefined' ? API_BASE : '') + '/customers',
          'http://localhost:3001/api/customers',
          'http://localhost:3000/api/customers'
        ];
        
        let fetched = false;
        (async () => {
          for (const ep of endpoints) {
            try {
              const res = await fetch(ep, { cache: 'no-store' });
              const result = await res.json();
              if (res.ok && result && result.success && Array.isArray(result.data)) {
                _cachedConfigs = result.data.sort((a, b) => (a.customerId || '').localeCompare(b.customerId || ''));
                fetched = true;
                break;
              }
            } catch(e) {}
          }
          if (!fetched) {
            _cachedConfigs = getAllConfigsFromLS();
          }
          if (callback) callback(_cachedConfigs);
        })();
      }

      function updateBadge() {
        const count = getAllConfigs().length;
        if (countBadge) countBadge.textContent = count;
      }

      function renderTable(filter = '') {
        refreshConfigs((allConfigs) => {
          let configs = allConfigs;
          if (filter) {
            const q = filter.toLowerCase();
            configs = configs.filter(c => 
              (c.customerId || '').toLowerCase().includes(q) ||
              (c.name || c.customerName || '').toLowerCase().includes(q) ||
              (typeof formatCustomerPhone === 'function' ? formatCustomerPhone(c) : (c.phone || '')).toLowerCase().includes(q) ||
              (c.email || c.customerEmail || '').toLowerCase().includes(q)
            );
          }

          if (footerText) footerText.textContent = `${configs.length} customer${configs.length !== 1 ? 's' : ''}`;
          updateBadge();

          if (configs.length === 0) {
            body.innerHTML = `
              <div class="cm-empty">
                <div class="cm-empty-icon">📭</div>
                <div class="cm-empty-text">${filter ? 'No customers match your search' : 'No saved customers yet'}</div>
                <div class="cm-empty-sub">${filter ? 'Try a different keyword' : 'Save a configuration to see it here'}</div>
              </div>`;
            return;
          }

          const doorLabels = { open: 'Open', solid: 'Solid', sliding: 'Sliding', toplift: 'Top Lift' };

          body.innerHTML = `
            <table class="cm-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Dimensions (W×H×D)</th>
                  <th>Cupboards</th>
                  <th>Shelves</th>
                  <th>Door Style</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${configs.map(c => `
                  <tr data-cid="${c.customerId}">
                    <td class="td-id">${c.customerId}</td>
                    <td class="td-name">${c.name || c.customerName || '—'}</td>
                    <td class="td-phone">${typeof formatCustomerPhone === 'function' ? formatCustomerPhone(c) : (c.fullPhone || c.phone || '—')}</td>
                    <td class="td-email">${c.email || c.customerEmail || '—'}</td>
                    <td class="td-dims">${c.roomWidth || 0}×${c.roomHeight || 0}×${c.roomDepth || 0} mm</td>
                    <td>${c.cupboards || 1}</td>
                    <td>${c.shelves || 1}</td>
                    <td><span class="td-door-badge">${doorLabels[c.doorStyle] || c.doorStyle || 'Solid'}</span></td>
                    <td class="td-actions">
                      <button type="button" class="cm-row-btn cm-row-btn-edit" data-edit="${c.customerId}">✏️ Edit</button>
                      <button type="button" class="cm-row-btn cm-row-btn-delete" data-del="${c.customerId}">🗑️ Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`;

          body.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
              const custId = btn.getAttribute('data-edit');
              if (window.editConfig) window.editConfig(custId);
              closeModal();
            });
          });

          body.querySelectorAll('[data-del]').forEach(btn => {
            btn.addEventListener('click', async () => {
              const custId = btn.getAttribute('data-del');
              if (confirm(`Delete customer "${custId}"? This cannot be undone.`)) {
                if (window.deleteConfig) {
                  await window.deleteConfig(custId);
                } else {
                  fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/customers/' + encodeURIComponent(custId), { method: 'DELETE' });
                  localStorage.removeItem('library_project_' + custId);
                }
                renderTable(searchInput.value.trim());
                showCMToast('🗑️ Customer deleted');
              }
            });
          });
        });
      }

      function openModal() {
        renderTable();
        if (searchInput) searchInput.value = '';
        if (overlay) overlay.classList.add('visible');
      }

      function closeModal() {
        if (overlay) overlay.classList.remove('visible');
      }

      const openBtn = document.getElementById('btn-open-cm');
      if (openBtn) openBtn.addEventListener('click', openModal);
      const closeBtn = document.getElementById('cm-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (overlay) {
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
      }
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('visible')) closeModal();
      });

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          renderTable(searchInput.value.trim());
        });
      }

      // Export JSON
      const exportBtn = document.getElementById('cm-btn-export');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          refreshConfigs((configs) => {
            if (!configs || configs.length === 0) {
              alert('No customer data to export.');
              return;
            }
            const json = JSON.stringify(configs, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `customer_data_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showCMToast('📥 JSON exported successfully!');
          });
        });
      }

      // Import JSON
      const importBtn = document.getElementById('cm-btn-import');
      if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async function(ev) {
            try {
              const rawData = JSON.parse(ev.target.result);
              const list = Array.isArray(rawData) ? rawData : [rawData];
              for (const item of list) {
                if (item && item.customerId) {
                  localStorage.setItem('library_project_' + item.customerId, JSON.stringify(item));
                  try {
                    await fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/customers', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(item)
                    });
                  } catch(e) {}
                }
              }
              renderTable(searchInput.value.trim());
              showCMToast('📤 Customer data imported!');
            } catch(err) {
              alert('Error reading JSON file: ' + err.message);
            }
          };
          reader.readAsText(file);
          importFileInput.value = '';
        });
      }

      // Delete All
      const delAllBtn = document.getElementById('cm-btn-delete-all');
      if (delAllBtn) {
        delAllBtn.addEventListener('click', () => {
          refreshConfigs((configs) => {
            if (!configs || configs.length === 0) {
              alert('No customer data to delete.');
              return;
            }
            if (confirm(`Are you sure you want to delete ALL ${configs.length} customer records? This cannot be undone.`)) {
              fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/customers', { method: 'DELETE' })
                .catch(() => {});
              configs.forEach(c => localStorage.removeItem('library_project_' + c.customerId));
              _cachedConfigs = [];
              renderTable();
              showCMToast('🗑️ All customer data deleted');
            }
          });
        });
      }

      // ➕ New Customer button
      const btnNewCust = document.getElementById('cm-btn-new-cust');
      if (btnNewCust) {
        btnNewCust.addEventListener('click', () => {
          closeModal();
          const nameInput = document.getElementById('customer-name');
          if (nameInput) nameInput.value = '';
          const phoneInput = document.getElementById('customer-phone');
          if (phoneInput) phoneInput.value = '';
          const emailInput = document.getElementById('customer-email');
          if (emailInput) emailInput.value = '';
          if (typeof fetchNextCustomerId === 'function') {
            fetchNextCustomerId(true);
          }
          const panel = document.querySelector('.panel');
          if (panel) panel.scrollTop = 0;
        });
      }

      function showCMToast(message) {
        let toast = document.getElementById('cm-toast');
        if (!toast) {
          toast = document.createElement('div');
          toast.id = 'cm-toast';
          toast.style.cssText = 'position:fixed;bottom:28px;left:28px;z-index:99999;padding:12px 20px;background:rgba(16,23,39,0.97);border:1px solid rgba(139,92,246,0.5);border-radius:10px;color:#fff;font-size:0.88rem;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.6);opacity:0;transform:translateY(16px);transition:opacity 0.3s ease,transform 0.3s ease;pointer-events:none;';
          document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(16px)';
        }, 3000);
      }

      refreshConfigs(updateBadge);

      const saveBtn = document.getElementById('btn-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          setTimeout(() => {
            refreshConfigs(() => {
              updateBadge();
              if (overlay && overlay.classList.contains('visible')) renderTable(searchInput.value.trim());
            });
          }, 600);
        });
      }
    })();
