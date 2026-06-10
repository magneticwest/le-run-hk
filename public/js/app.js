/**
 * Le Run HK - Main Application
 */

(function() {
  'use strict';

  // State
  let appData = null;
  let currentLang = getCurrentLang();
  let selectedArea = '';
  let selectedDistrict = '';
  let selectedVenue = '';
  let selectedMonth = '';
  let currentTodayArea = null; // Track which "Available Today" area is displayed

  // DOM Elements
  const elements = {
    langToggle: document.getElementById('lang-toggle'),
    introText: document.getElementById('intro-text'),
    areaLabel: document.getElementById('area-label'),
    areaSelect: document.getElementById('area-select'),
    districtLabel: document.getElementById('district-label'),
    districtSelect: document.getElementById('district-select'),
    venueLabel: document.getElementById('venue-label'),
    venueSelect: document.getElementById('venue-select'),
    monthLabel: document.getElementById('month-label'),
    monthSelect: document.getElementById('month-select'),
    searchBtn: document.getElementById('search-btn'),
    searchBtnText: document.getElementById('search-btn-text'),
    availableTodayTitle: document.getElementById('available-today-title'),
    availableTodayHK: document.getElementById('available-today-hk'),
    availableTodayKLN: document.getElementById('available-today-kln'),
    availableTodayNT: document.getElementById('available-today-nt'),
    btnHKText: document.getElementById('btn-hk-text'),
    btnKLNText: document.getElementById('btn-kln-text'),
    btnNTText: document.getElementById('btn-nt-text'),
    todaySection: document.getElementById('today-section'),
    todayTitle: document.getElementById('today-title'),
    todayDate: document.getElementById('today-date'),
    todayVenues: document.getElementById('today-venues'),
    timetableSection: document.getElementById('timetable-section'),
    tableLastUpdated: document.getElementById('table-last-updated'),
    venueTitle: document.getElementById('venue-title'),
    venueAddress: document.getElementById('venue-address'),
    goToTodayBtn: document.getElementById('go-to-today-btn'),
    goToTodayText: document.getElementById('go-to-today-text'),
    legendTitle: document.getElementById('legend-title'),
    legendA: document.getElementById('legend-A'),
    legendL: document.getElementById('legend-L'),
    legendB: document.getElementById('legend-B'),
    legendM: document.getElementById('legend-M'),
    todayLegendItems: document.getElementById('today-legend-items'),
    todaySpecialNotes: document.getElementById('today-special-notes'),
    timetableHead: document.getElementById('timetable-head'),
    timetableBody: document.getElementById('timetable-body'),
    specialNotesSection: document.getElementById('special-notes-section'),
    specialNotesContent: document.getElementById('special-notes-content'),
    noticesSection: document.getElementById('notices-section'),
    noticesTitle: document.getElementById('notices-title'),
    noticesContent: document.getElementById('notices-content'),
    loading: document.getElementById('loading'),
    loadingText: document.getElementById('loading-text'),
    error: document.getElementById('error'),
    errorText: document.getElementById('error-text'),
    footerSourceText: document.getElementById('footer-source-text'),
    lcsdLink: document.getElementById('lcsd-link'),
    lastUpdated: document.getElementById('last-updated'),
    feedbackText: document.getElementById('feedback-text'),
    feedbackLink: document.getElementById('feedback-link'),
    footerDisclaimer: document.getElementById('footer-disclaimer'),
    footerCopyright: document.getElementById('footer-copyright')
  };

  /**
   * Initialize the application
   */
  async function init() {
    showLoading(true);

    try {
      const response = await fetch('data/availability.json');
      if (!response.ok) throw new Error('Failed to fetch data');
      appData = await response.json();

      setupEventListeners();
      updateUI();
      populateAreaDropdown();
      restoreLastSelection();

      showLoading(false);
    } catch (err) {
      console.error('Init error:', err);
      showError(t('errorLoading', currentLang));
    }
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    elements.langToggle.addEventListener('click', toggleLanguage);
    elements.areaSelect.addEventListener('change', onAreaChange);
    elements.districtSelect.addEventListener('change', onDistrictChange);
    elements.venueSelect.addEventListener('change', onVenueChange);
    elements.monthSelect.addEventListener('change', onMonthChange);
    elements.searchBtn.addEventListener('click', onSearchClick);

    // Regional Available Today buttons
    elements.availableTodayHK.addEventListener('click', () => showAvailableToday('HK_ISLAND'));
    elements.availableTodayKLN.addEventListener('click', () => showAvailableToday('KOWLOON'));
    elements.availableTodayNT.addEventListener('click', () => showAvailableToday('NT'));

    // Go to Today button
    elements.goToTodayBtn.addEventListener('click', scrollToTodayColumn);
  }

  /**
   * Scroll timetable to today's column
   */
  function scrollToTodayColumn() {
    const todayHeader = elements.timetableHead.querySelector('.today-column');
    if (todayHeader) {
      todayHeader.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  /**
   * Toggle between English and Chinese
   */
  function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'zh' : 'en';
    setLang(currentLang);
    updateUI();
    // Re-render active view (mutually exclusive - today takes priority if active)
    if (currentTodayArea) {
      showAvailableToday(currentTodayArea);
    } else if (selectedVenue && selectedMonth) {
      renderTimetable();
    }
  }

  /**
   * Update UI text based on current language
   */
  function updateUI() {
    const lang = currentLang;

    // Header
    elements.langToggle.textContent = t('langToggle', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';

    // Intro
    elements.introText.textContent = t('introText', lang);

    // Filter labels
    elements.areaLabel.textContent = t('areaLabel', lang);
    elements.districtLabel.textContent = t('districtLabel', lang);
    elements.venueLabel.textContent = t('venueLabel', lang);
    elements.monthLabel.textContent = t('monthLabel', lang);

    // Update dropdown placeholders if empty
    if (!selectedArea) {
      elements.areaSelect.options[0].textContent = t('selectArea', lang);
    }
    if (!selectedDistrict) {
      elements.districtSelect.options[0].textContent = t('selectDistrict', lang);
    }
    if (!selectedVenue) {
      elements.venueSelect.options[0].textContent = t('selectVenue', lang);
    }
    if (!selectedMonth) {
      elements.monthSelect.options[0].textContent = t('selectMonth', lang);
    }

    // Search button
    elements.searchBtnText.textContent = t('searchBtn', lang);

    // Update dropdown options text with translated names (more efficient than rebuilding)
    if (appData) {
      updateDropdownLabels(elements.areaSelect, appData.areas);
      if (selectedArea) updateDropdownLabels(elements.districtSelect, appData.districts, 'noVenues');
      if (selectedDistrict) updateDropdownLabels(elements.venueSelect, appData.venues, 'closed');
      // Month dropdown uses different format, rebuild it if visible
      if (selectedVenue) populateMonthDropdown();
    }

    // Available Today section - button labels only
    // Note: todayTitle, todayDate, and venue cards are updated by showAvailableToday()
    elements.availableTodayTitle.textContent = t('availableToday', lang);
    elements.btnHKText.textContent = t('areaHK', lang);
    elements.btnKLNText.textContent = t('areaKLN', lang);
    elements.btnNTText.textContent = t('areaNT', lang);

    // Legend (timetable) - default before venue selection
    elements.legendTitle.textContent = t('legendTitle', lang);
    elements.legendA.textContent = `A: ${t('legendA', lang)}`;
    elements.legendL.textContent = `L: ${t('legendL', lang)}`;
    elements.legendB.textContent = `B: ${t('legendB', lang)}`;
    elements.legendM.textContent = `M: ${t('legendM', lang)}`;

    // Legend (Available Today) - dynamically updated in showAvailableToday()
    // No static update needed here since legend is rebuilt when area is selected

    // Notices
    elements.noticesTitle.textContent = t('noticesTitle', lang);

    // Loading
    elements.loadingText.textContent = t('loadingText', lang);

    // Footer - update text content directly to avoid stale references
    elements.footerSourceText.textContent = `${t('footerText', lang)}:`;
    elements.lcsdLink.href = t('lcsdUrl', lang);
    elements.lcsdLink.textContent = t('lcsdName', lang);
    elements.feedbackText.textContent = t('feedbackText', lang);
    elements.feedbackLink.textContent = t('feedbackLink', lang);
    elements.footerDisclaimer.textContent = t('disclaimer', lang);
    elements.footerCopyright.textContent = t('copyright', lang);

    if (appData?.lastUpdated) {
      const date = new Date(appData.lastUpdated);
      elements.lastUpdated.textContent = `${t('lastUpdated', lang)}: ${date.toLocaleDateString(lang === 'zh' ? 'zh-HK' : 'en-GB')}`;
    }
  }

  /**
   * Update dropdown labels without rebuilding (performance optimization)
   * Only updates text content, preserves selection state
   */
  function updateDropdownLabels(select, data, disabledFlag = null) {
    for (let i = 1; i < select.options.length; i++) {
      const option = select.options[i];
      const key = option.value;
      const item = data[key];
      if (!item) continue;

      // Get the name/label from the data structure
      let label;
      if (item.name) {
        // Venue format: { name: { en, zh }, ... }
        label = currentLang === 'zh' ? item.name.zh : item.name.en;
      } else if (item.en && item.zh) {
        // Area/District format: { en, zh, ... }
        label = currentLang === 'zh' ? item.zh : item.en;
      }

      // Add disabled suffix if applicable
      if (disabledFlag && item[disabledFlag]) {
        label += currentLang === 'zh' ?
          (disabledFlag === 'noVenues' ? ' (沒有運動場)' : '') :
          (disabledFlag === 'noVenues' ? ' (No venues)' : '');
      }

      if (label) option.textContent = label;
    }
  }

  /**
   * Populate area dropdown
   */
  function populateAreaDropdown() {
    const select = elements.areaSelect;
    const currentValue = selectedArea;

    select.innerHTML = `<option value="">${t('selectArea', currentLang)}</option>`;

    for (const [key, value] of Object.entries(appData.areas)) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = currentLang === 'zh' ? value.zh : value.en;
      if (key === currentValue) option.selected = true;
      select.appendChild(option);
    }
  }

  /**
   * Handle area selection change
   */
  function onAreaChange(e) {
    selectedArea = e.target.value;
    selectedDistrict = '';
    selectedVenue = '';
    selectedMonth = '';

    // Clear Available Today when user starts selecting filters
    currentTodayArea = null;
    elements.todaySection.classList.add('hidden');
    // Clear active states on region buttons
    elements.availableTodayHK.classList.remove('active');
    elements.availableTodayKLN.classList.remove('active');
    elements.availableTodayNT.classList.remove('active');

    elements.districtSelect.disabled = !selectedArea;
    elements.venueSelect.disabled = true;
    elements.monthSelect.disabled = true;
    elements.searchBtn.disabled = true;
    elements.timetableSection.classList.add('hidden');

    if (selectedArea) {
      populateDistrictDropdown();
    } else {
      elements.districtSelect.innerHTML = `<option value="">${t('selectDistrict', currentLang)}</option>`;
    }
    elements.venueSelect.innerHTML = `<option value="">${t('selectVenue', currentLang)}</option>`;
    elements.monthSelect.innerHTML = `<option value="">${t('selectMonth', currentLang)}</option>`;
  }

  /**
   * Populate district dropdown based on selected area
   */
  function populateDistrictDropdown() {
    const select = elements.districtSelect;
    const currentValue = selectedDistrict;

    select.innerHTML = `<option value="">${t('selectDistrict', currentLang)}</option>`;

    for (const [key, value] of Object.entries(appData.districts)) {
      if (value.area === selectedArea) {
        const option = document.createElement('option');
        option.value = key;
        let label = currentLang === 'zh' ? value.zh : value.en;
        if (value.noVenues) {
          label += currentLang === 'zh' ? ' (沒有運動場)' : ' (No venues)';
          option.disabled = true;
        }
        option.textContent = label;
        if (key === currentValue) option.selected = true;
        select.appendChild(option);
      }
    }
  }

  /**
   * Handle district selection change
   */
  function onDistrictChange(e) {
    selectedDistrict = e.target.value;
    selectedVenue = '';
    selectedMonth = '';

    // Clear Available Today when user interacts with filters
    currentTodayArea = null;
    elements.todaySection.classList.add('hidden');
    elements.availableTodayHK.classList.remove('active');
    elements.availableTodayKLN.classList.remove('active');
    elements.availableTodayNT.classList.remove('active');

    elements.venueSelect.disabled = !selectedDistrict;
    elements.monthSelect.disabled = true;
    elements.searchBtn.disabled = true;
    elements.timetableSection.classList.add('hidden');

    if (selectedDistrict) {
      populateVenueDropdown();
    } else {
      elements.venueSelect.innerHTML = `<option value="">${t('selectVenue', currentLang)}</option>`;
    }
    elements.monthSelect.innerHTML = `<option value="">${t('selectMonth', currentLang)}</option>`;
  }

  /**
   * Populate venue dropdown based on selected district
   */
  function populateVenueDropdown() {
    const select = elements.venueSelect;
    const currentValue = selectedVenue;

    select.innerHTML = `<option value="">${t('selectVenue', currentLang)}</option>`;

    for (const [id, venue] of Object.entries(appData.venues)) {
      if (venue.district === selectedDistrict) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = currentLang === 'zh' ? venue.name.zh : venue.name.en;
        if (venue.closed) {
          option.disabled = true;
        }
        if (id === currentValue && !venue.closed) option.selected = true;
        select.appendChild(option);
      }
    }
  }

  /**
   * Handle venue selection change
   */
  function onVenueChange(e) {
    selectedVenue = e.target.value;
    selectedMonth = '';

    // Clear Available Today when user interacts with filters
    currentTodayArea = null;
    elements.todaySection.classList.add('hidden');
    elements.availableTodayHK.classList.remove('active');
    elements.availableTodayKLN.classList.remove('active');
    elements.availableTodayNT.classList.remove('active');

    elements.monthSelect.disabled = !selectedVenue;
    elements.searchBtn.disabled = true;
    elements.timetableSection.classList.add('hidden');

    if (selectedVenue) {
      populateMonthDropdown();
    } else {
      elements.monthSelect.innerHTML = `<option value="">${t('selectMonth', currentLang)}</option>`;
    }
  }

  /**
   * Populate month dropdown with available months for venue
   */
  function populateMonthDropdown() {
    const select = elements.monthSelect;
    const currentValue = selectedMonth;

    select.innerHTML = `<option value="">${t('selectMonth', currentLang)}</option>`;

    // Find months that have data for this venue
    let monthCount = 0;
    for (const [monthKey, monthData] of Object.entries(appData.months)) {
      if (monthData.venues[selectedVenue]) {
        const option = document.createElement('option');
        option.value = monthKey;
        const monthName = t(`months.${monthData.month}`, currentLang);
        option.textContent = `${monthName} ${monthData.year}`;
        if (monthKey === currentValue) option.selected = true;
        select.appendChild(option);
        monthCount++;
      }
    }

    // Show message if no months available for this venue
    if (monthCount === 0) {
      showError(t('noMonthsAvailable', currentLang));
    } else {
      elements.error.classList.add('hidden');
    }
  }

  /**
   * Handle month selection change
   */
  function onMonthChange(e) {
    selectedMonth = e.target.value;

    // Clear Available Today when user interacts with filters
    currentTodayArea = null;
    elements.todaySection.classList.add('hidden');
    elements.availableTodayHK.classList.remove('active');
    elements.availableTodayKLN.classList.remove('active');
    elements.availableTodayNT.classList.remove('active');

    // Enable search button when month is selected
    elements.searchBtn.disabled = !selectedMonth;
    // Hide timetable until search is clicked
    elements.timetableSection.classList.add('hidden');
  }

  /**
   * Handle search button click
   */
  function onSearchClick() {
    if (selectedVenue && selectedMonth) {
      renderTimetable();
      // Save last selection to localStorage
      saveLastSelection();
      // Update URL for sharing
      updateUrl();
      // Auto-scroll to timetable section
      setTimeout(() => {
        elements.timetableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  /**
   * Save last venue selection to localStorage
   */
  function saveLastSelection() {
    try {
      localStorage.setItem('lastSelection', JSON.stringify({
        area: selectedArea,
        district: selectedDistrict,
        venue: selectedVenue
      }));
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Restore last venue selection from localStorage
   */
  function restoreLastSelection() {
    // First check for URL parameters (takes priority)
    if (restoreFromUrl()) return;

    try {
      const saved = localStorage.getItem('lastSelection');
      if (!saved) return;
      const { area, district, venue } = JSON.parse(saved);
      if (!area || !district || !venue) return;
      // Verify the venue still exists
      if (!appData.venues[venue]) return;

      // Restore selections
      selectedArea = area;
      elements.areaSelect.value = area;
      elements.districtSelect.disabled = false;
      populateDistrictDropdown();

      selectedDistrict = district;
      elements.districtSelect.value = district;
      elements.venueSelect.disabled = false;
      populateVenueDropdown();

      selectedVenue = venue;
      elements.venueSelect.value = venue;
      elements.monthSelect.disabled = false;
      populateMonthDropdown();
    } catch (e) {
      // Invalid data or localStorage error
    }
  }

  /**
   * Restore selection from URL parameters
   * Supports: ?venue=907&month=202606
   */
  function restoreFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const venueId = params.get('venue');
    const monthKey = params.get('month');

    if (!venueId) return false;

    const venueInfo = appData.venues[venueId];
    if (!venueInfo) return false;

    // Get area and district from venue
    const area = venueInfo.area;
    const district = venueInfo.district;

    // Restore selections
    selectedArea = area;
    elements.areaSelect.value = area;
    elements.districtSelect.disabled = false;
    populateDistrictDropdown();

    selectedDistrict = district;
    elements.districtSelect.value = district;
    elements.venueSelect.disabled = false;
    populateVenueDropdown();

    selectedVenue = venueId;
    elements.venueSelect.value = venueId;
    elements.monthSelect.disabled = false;
    populateMonthDropdown();

    // If month is specified and valid, auto-render
    if (monthKey && appData.months[monthKey]?.venues[venueId]) {
      selectedMonth = monthKey;
      elements.monthSelect.value = monthKey;
      elements.searchBtn.disabled = false;
      // Auto-render timetable
      setTimeout(() => {
        renderTimetable();
        elements.timetableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

    return true;
  }

  /**
   * Update URL with current selection (without page reload)
   */
  function updateUrl() {
    if (!selectedVenue || !selectedMonth) return;
    const url = new URL(window.location);
    url.searchParams.set('venue', selectedVenue);
    url.searchParams.set('month', selectedMonth);
    window.history.replaceState({}, '', url);
  }

  /**
   * Render the timetable
   */
  function renderTimetable() {
    // Clear today area and hide today section when showing timetable
    currentTodayArea = null;
    elements.todaySection.classList.add('hidden');
    elements.availableTodayHK.classList.remove('active');
    elements.availableTodayKLN.classList.remove('active');
    elements.availableTodayNT.classList.remove('active');

    const monthData = appData.months[selectedMonth];
    const venueData = monthData?.venues[selectedVenue];

    if (!venueData) {
      showError(t('dataNotFound', currentLang));
      return;
    }

    // Check if data was fetched but has no content
    if (!venueData.dates || venueData.dates.length === 0 ||
        !venueData.timeSlots || venueData.timeSlots.length === 0) {
      showError(t('dataNotFound', currentLang));
      return;
    }

    // Determine today's date for highlighting
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === monthData.year &&
                           (today.getMonth() + 1) === monthData.month;
    const todayDay = today.getDate();

    // Build a map of notices by day and time range for precise linking
    const noticesByDayTime = {};
    (venueData.notices || []).forEach((notice, idx) => {
      const day = notice.day;
      if (day) {
        if (!noticesByDayTime[day]) noticesByDayTime[day] = [];
        noticesByDayTime[day].push({
          idx,
          startTime: notice.startTime,
          endTime: notice.endTime
        });
      }
    });

    // Helper function to check if a time slot overlaps with a notice
    function findMatchingNotice(day, slotTimeStr) {
      if (!noticesByDayTime[day]) return null;

      // Parse slot time (format: "06:30 - 07:00")
      const match = slotTimeStr.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
      if (!match) return null;

      const slotStart = parseInt(match[1]) * 60 + parseInt(match[2]);
      const slotEnd = parseInt(match[3]) * 60 + parseInt(match[4]);

      // Find first notice that overlaps with this time slot
      for (const notice of noticesByDayTime[day]) {
        if (notice.startTime !== null && notice.endTime !== null) {
          // Check for time overlap
          if (slotStart < notice.endTime && slotEnd > notice.startTime) {
            return notice.idx;
          }
        } else {
          // No time info - match any slot on this day
          return notice.idx;
        }
      }
      return null;
    }

    // Update legend based on venue (Causeway Bay has different legend)
    const isCausewayBay = selectedVenue === '907';
    const legendContainer = document.querySelector('.legend-items');
    if (legendContainer) {
      let legendHtml = '';

      // A - Available (same for all)
      legendHtml += `
        <div class="legend-item">
          <span class="legend-color status-A"></span>
          <span>A: ${t('legendA', currentLang)}</span>
        </div>
      `;

      // L - Different wording for Causeway Bay
      legendHtml += `
        <div class="legend-item">
          <span class="legend-color status-L"></span>
          <span>L: ${isCausewayBay ? t('legendL_cwb', currentLang) : t('legendL', currentLang)}</span>
        </div>
      `;

      // B - Block Booking (same for all)
      legendHtml += `
        <div class="legend-item">
          <span class="legend-color status-B"></span>
          <span>B: ${t('legendB', currentLang)}</span>
        </div>
      `;

      // M - Venue Closed (same for all)
      legendHtml += `
        <div class="legend-item">
          <span class="legend-color status-M"></span>
          <span>M: ${t('legendM', currentLang)}</span>
        </div>
      `;

      // Causeway Bay specific: G, GL, and T
      if (isCausewayBay) {
        legendHtml += `
          <div class="legend-item">
            <span class="legend-color status-G"></span>
            <span>G: ${t('legendG', currentLang)}</span>
          </div>
          <div class="legend-item">
            <span class="legend-color status-GL"></span>
            <span>GL: ${t('legendGL', currentLang)}</span>
          </div>
          <div class="legend-item">
            <span class="legend-color status-T"></span>
            <span>T: ${t('legendT', currentLang)}</span>
          </div>
        `;
      }

      legendContainer.innerHTML = legendHtml;
    }

    // Update venue title and last updated
    const venue = appData.venues[selectedVenue];
    elements.venueTitle.textContent = currentLang === 'zh' ? venue.name.zh : venue.name.en;

    // Show venue address with Google Maps link
    if (venue.address && venue.coords) {
      const address = currentLang === 'zh' ? venue.address.zh : venue.address.en;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${venue.coords.lat},${venue.coords.lng}`;
      elements.venueAddress.innerHTML = `<span class="map-icon">📍</span><a href="${mapsUrl}" target="_blank" rel="noopener">${address}</a>`;
    } else {
      elements.venueAddress.innerHTML = '';
    }

    // Show/hide "Go to Today" button based on whether viewing current month
    if (isCurrentMonth) {
      elements.goToTodayBtn.classList.remove('hidden');
      elements.goToTodayText.textContent = t('goToToday', currentLang);
    } else {
      elements.goToTodayBtn.classList.add('hidden');
    }

    // Show last updated timestamp
    if (appData.lastUpdated) {
      const updateDate = new Date(appData.lastUpdated);
      const formattedDate = updateDate.toLocaleString(currentLang === 'zh' ? 'zh-HK' : 'en-GB', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      elements.tableLastUpdated.textContent = `${t('lastUpdated', currentLang)}: ${formattedDate}`;
    }

    // Build table header using array for better performance
    const headerParts = ['<tr><th class="time-header">' + (currentLang === 'zh' ? '時間' : 'Time') + '</th>'];
    venueData.dates.forEach((date, idx) => {
      const isWeekend = date.weekdayEn === 'Sat' || date.weekdayEn === 'Sun';
      const isToday = isCurrentMonth && date.day === todayDay;
      const isPastDay = isCurrentMonth && date.day < todayDay;
      const weekday = currentLang === 'zh' ? date.weekdayZh : date.weekdayEn;
      const classes = [
        isWeekend ? 'weekend' : '',
        isToday ? 'today-column' : '',
        isPastDay ? 'past-day' : ''
      ].filter(Boolean).join(' ');
      headerParts.push(`<th class="${classes}">${date.day}<br><small>${weekday}</small></th>`);
    });
    headerParts.push('</tr>');
    elements.timetableHead.innerHTML = headerParts.join('');

    // Build table body using array for better performance with large tables
    const knownStatuses = ['A', 'L', 'B', 'M', 'T', 'S', 'F', 'R', 'G', 'GL'];
    const bodyParts = [];
    venueData.timeSlots.forEach((slot, slotIdx) => {
      bodyParts.push(`<tr><td class="time-cell">${slot.time}</td>`);
      slot.availability.forEach((status, idx) => {
        const date = venueData.dates[idx];
        const isWeekend = date?.weekdayEn === 'Sat' || date?.weekdayEn === 'Sun';
        const isToday = isCurrentMonth && date?.day === todayDay;
        const isPastDay = isCurrentMonth && date?.day < todayDay;

        // Handle all status codes dynamically (including multi-char codes like GL)
        const statusClass = status && knownStatuses.includes(status) ? `status-${status}` : '';

        // Find matching notice by day AND time overlap (not just day)
        const noticeIdx = findMatchingNotice(date?.day, slot.time);
        const hasNotice = noticeIdx !== null && status !== 'A'; // Don't link open slots

        const classes = [
          statusClass,
          isWeekend && !statusClass ? 'weekend' : '',
          isToday ? 'today-column' : '',
          isPastDay ? 'past-day' : '',
          hasNotice ? 'has-notice' : ''
        ].filter(Boolean).join(' ');
        const noticeLink = hasNotice ? `data-notice-idx="${noticeIdx}" data-notice-day="${date.day}"` : '';
        bodyParts.push(`<td class="${classes}" ${noticeLink}>${status}</td>`);
      });
      bodyParts.push('</tr>');
    });
    elements.timetableBody.innerHTML = bodyParts.join('');

    // Add click handlers for notice links
    elements.timetableBody.querySelectorAll('td.has-notice').forEach(td => {
      td.addEventListener('click', () => {
        const noticeIdx = td.dataset.noticeIdx;
        const noticeEl = document.getElementById(`notice-${noticeIdx}`);
        if (noticeEl) {
          noticeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          noticeEl.classList.add('highlight');
          setTimeout(() => noticeEl.classList.remove('highlight'), 2000);
        }
      });
    });

    // Set up row/column highlighting
    setupCellHighlighting();

    // Render special notes (e.g., jogging track available during maintenance)
    renderSpecialNotes(venueData.specialNotes);

    // Render notices
    renderNotices(venueData.notices);

    // Show timetable section
    elements.timetableSection.classList.remove('hidden');
    elements.error.classList.add('hidden');

    // If today's column exists, scroll it into view
    if (isCurrentMonth) {
      const todayHeader = elements.timetableHead.querySelector('.today-column');
      if (todayHeader) {
        setTimeout(() => {
          todayHeader.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 100);
      }
    }
  }

  /**
   * Render special notes section (e.g., jogging track available during maintenance)
   */
  function renderSpecialNotes(specialNotes) {
    if (!specialNotes || specialNotes.length === 0) {
      elements.specialNotesSection.classList.add('hidden');
      return;
    }

    // Use array for consistency with other render functions
    const htmlParts = specialNotes.map(note => {
      const text = currentLang === 'zh' ? note.zh : note.en;
      return `<div class="special-note">${text}</div>`;
    });

    elements.specialNotesContent.innerHTML = htmlParts.join('');
    elements.specialNotesSection.classList.remove('hidden');
  }

  /**
   * Render notices section
   */
  function renderNotices(notices) {
    if (!notices || notices.length === 0) {
      elements.noticesSection.classList.add('hidden');
      return;
    }

    // Use array for better performance with many notices
    const htmlParts = [];
    notices.forEach((notice, idx) => {
      htmlParts.push(`
        <div class="notice-item" id="notice-${idx}">
          <div class="notice-datetime">${notice.dateTime}</div>
          <div class="notice-facility">${t('facilities', currentLang)}: ${notice.facilities}</div>
          <div class="notice-reason">${t('reason', currentLang)}: ${notice.reason}</div>
          ${notice.remarks ? `<div class="notice-remarks">${notice.remarks}</div>` : ''}
        </div>
      `);
    });

    elements.noticesContent.innerHTML = htmlParts.join('');
    elements.noticesSection.classList.remove('hidden');
  }

  // Store event handler references to prevent memory leaks
  let highlightHandlers = null;

  /**
   * Set up row and column highlighting on hover/touch
   * Uses event delegation to prevent memory leaks on re-renders
   */
  function setupCellHighlighting() {
    const table = document.querySelector('.timetable');
    const headerRow = elements.timetableHead.querySelector('tr');
    const bodyRows = elements.timetableBody.querySelectorAll('tr');

    function clearHighlights() {
      table.querySelectorAll('.highlight-row').forEach(el => el.classList.remove('highlight-row'));
      table.querySelectorAll('.highlight-col').forEach(el => el.classList.remove('highlight-col'));
      table.querySelectorAll('.highlight-cell').forEach(el => el.classList.remove('highlight-cell'));
    }

    function highlightCell(td) {
      if (!td || td.classList.contains('time-cell')) return;

      clearHighlights();

      // Highlight the row
      const row = td.closest('tr');
      if (row) row.classList.add('highlight-row');

      // Find column index (accounting for time-cell)
      const cellIndex = Array.from(row.children).indexOf(td);
      if (cellIndex < 1) return; // Skip if it's the time column

      // Highlight the column header
      const headerCells = headerRow.children;
      if (headerCells[cellIndex]) {
        headerCells[cellIndex].classList.add('highlight-col');
      }

      // Highlight all cells in this column
      bodyRows.forEach(bodyRow => {
        const cell = bodyRow.children[cellIndex];
        if (cell && !cell.classList.contains('time-cell')) {
          cell.classList.add('highlight-col');
        }
      });

      // Highlight the cell itself
      td.classList.add('highlight-cell');
    }

    // Remove previous event listeners to prevent memory leaks
    if (highlightHandlers) {
      elements.timetableBody.removeEventListener('mouseover', highlightHandlers.mouseover);
      elements.timetableBody.removeEventListener('mouseleave', highlightHandlers.mouseleave);
      elements.timetableBody.removeEventListener('touchstart', highlightHandlers.touchstart);
      elements.timetableBody.removeEventListener('touchend', highlightHandlers.touchend);
    }

    // Create new handlers
    highlightHandlers = {
      mouseover: (e) => {
        const td = e.target.closest('td');
        highlightCell(td);
      },
      mouseleave: clearHighlights,
      touchstart: (e) => {
        const td = e.target.closest('td');
        highlightCell(td);
      },
      touchend: () => {
        // Keep highlight visible for a moment on touch
        setTimeout(clearHighlights, 1500);
      }
    };

    // Add event listeners
    elements.timetableBody.addEventListener('mouseover', highlightHandlers.mouseover);
    elements.timetableBody.addEventListener('mouseleave', highlightHandlers.mouseleave);
    elements.timetableBody.addEventListener('touchstart', highlightHandlers.touchstart, { passive: true });
    elements.timetableBody.addEventListener('touchend', highlightHandlers.touchend, { passive: true });
  }

  /**
   * Show available venues for today filtered by area
   */
  function showAvailableToday(areaToShow) {
    // Track current area for language toggle re-render
    currentTodayArea = areaToShow;

    const today = new Date();
    const monthKey = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    const todayDay = today.getDate();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    // Update button active states
    elements.availableTodayHK.classList.toggle('active', areaToShow === 'HK_ISLAND');
    elements.availableTodayKLN.classList.toggle('active', areaToShow === 'KOWLOON');
    elements.availableTodayNT.classList.toggle('active', areaToShow === 'NT');

    // Get area name for title
    const areaNames = {
      HK_ISLAND: currentLang === 'zh' ? '香港島' : 'Hong Kong Island',
      KOWLOON: currentLang === 'zh' ? '九龍' : 'Kowloon',
      NT: currentLang === 'zh' ? '新界' : 'New Territories'
    };
    elements.todayTitle.textContent = `${t('todayTitle', currentLang)} - ${areaNames[areaToShow]}`;

    // Format today's date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString(currentLang === 'zh' ? 'zh-HK' : 'en-GB', dateOptions);
    elements.todayDate.textContent = formattedDate;

    const monthData = appData.months[monthKey];
    if (!monthData) {
      elements.todayLegendItems.innerHTML = '';
      elements.todaySpecialNotes.classList.add('hidden');
      elements.todayVenues.innerHTML = `<p class="today-no-venues">${t('noVenuesToday', currentLang)}</p>`;
      elements.todaySection.classList.remove('hidden');
      elements.timetableSection.classList.add('hidden');
      return;
    }

    // Find venues with available slots today, filtered by area
    const availableVenues = [];
    const allStatuses = new Set(); // Track all statuses that appear
    const allSpecialNotes = []; // Collect special notes from venues

    for (const [venueId, venueData] of Object.entries(monthData.venues)) {
      if (!venueData.dates || !venueData.timeSlots) continue;

      // Filter by area
      const venueInfo = appData.venues[venueId];
      if (venueInfo.area !== areaToShow) continue;

      // Find today's column index
      const todayIdx = venueData.dates.findIndex(d => d.day === todayDay);
      if (todayIdx === -1) continue;

      // Check if there are any available slots (A, L, or T - turf maintenance with jogging track open)
      const todaySlots = venueData.timeSlots.map((slot, slotIdx) => {
        const status = slot.availability[todayIdx];
        if (status) allStatuses.add(status); // Track all statuses
        return {
          time: slot.time,
          status: status,
          slotIdx
        };
      });

      const hasAvailability = todaySlots.some(s => s.status === 'A' || s.status === 'L' || s.status === 'T');
      if (hasAvailability) {
        const district = appData.districts[venueInfo.district];
        availableVenues.push({
          id: venueId,
          name: currentLang === 'zh' ? venueInfo.name.zh : venueInfo.name.en,
          district: currentLang === 'zh' ? district.zh : district.en,
          slots: todaySlots,
          specialNotes: venueData.specialNotes || []
        });

        // Collect special notes from this venue
        if (venueData.specialNotes && venueData.specialNotes.length > 0) {
          venueData.specialNotes.forEach(note => {
            const noteText = currentLang === 'zh' ? note.zh : note.en;
            if (noteText && !allSpecialNotes.includes(noteText)) {
              allSpecialNotes.push(noteText);
            }
          });
        }
      }
    }

    // Build legend dynamically based on statuses that actually appear
    const statusConfig = {
      A: { label: t('legendA', currentLang) },
      L: { label: t('legendL', currentLang) },
      T: { label: t('legendT', currentLang) },
      B: { label: t('legendB', currentLang) },
      M: { label: t('legendM', currentLang) },
      G: { label: t('legendG', currentLang) },
      GL: { label: t('legendGL', currentLang) }
    };
    const statusOrder = ['A', 'L', 'T', 'B', 'M', 'G', 'GL'];
    let legendHtml = '';
    statusOrder.forEach(status => {
      if (allStatuses.has(status)) {
        legendHtml += `
          <div class="legend-item">
            <span class="legend-color status-${status}"></span>
            <span>A: ${statusConfig[status]?.label || status}</span>
          </div>
        `.replace('A:', `${status}:`);
      }
    });
    elements.todayLegendItems.innerHTML = legendHtml;

    if (availableVenues.length === 0) {
      elements.todayVenues.innerHTML = `<p class="today-no-venues">${t('noVenuesToday', currentLang)}</p>`;
      elements.todaySpecialNotes.classList.add('hidden');
    } else {
      // Render venue cards using array for better performance
      const htmlParts = [];
      availableVenues.forEach(venue => {
        htmlParts.push(`
          <div class="today-venue-card">
            <div class="today-venue-name">${venue.name}</div>
            <div class="today-venue-district">${venue.district}</div>
            <div class="today-timeline-container" id="timeline-${venue.id}">
              <div class="today-timeline">
        `);

        venue.slots.forEach((slot, idx) => {
          const statusClass = ['A', 'L', 'B', 'M', 'T'].includes(slot.status) ? `status-${slot.status}` : '';
          // Check if this slot is the current time slot
          const [startHour, startMin] = slot.time.split(' - ')[0].split(':').map(Number);
          const [endHour, endMin] = slot.time.split(' - ')[1].split(':').map(Number);
          const isCurrentSlot = (currentHour > startHour || (currentHour === startHour && currentMinute >= startMin)) &&
                               (currentHour < endHour || (currentHour === endHour && currentMinute < endMin));
          const currentClass = isCurrentSlot ? 'current-time' : '';
          const shortTime = slot.time.split(' - ')[0];

          htmlParts.push(`
            <div class="today-slot ${statusClass} ${currentClass}" data-slot-idx="${idx}">
              <div class="today-slot-time">${shortTime}</div>
              <div class="today-slot-status">${slot.status}</div>
            </div>
          `);
        });

        htmlParts.push(`
              </div>
            </div>
          </div>
        `);
      });

      elements.todayVenues.innerHTML = htmlParts.join('');

      // Scroll each timeline to current time
      setTimeout(() => {
        availableVenues.forEach(venue => {
          const container = document.getElementById(`timeline-${venue.id}`);
          const currentSlot = container?.querySelector('.current-time');
          if (currentSlot && container) {
            const scrollPos = currentSlot.offsetLeft - container.offsetWidth / 2 + currentSlot.offsetWidth / 2;
            container.scrollLeft = Math.max(0, scrollPos);
          }
        });
      }, 100);
    }

    // Render special notes if any venues have them
    if (allSpecialNotes.length > 0) {
      const notesHtml = allSpecialNotes.map(note =>
        `<div class="today-special-note">${note}</div>`
      ).join('');
      elements.todaySpecialNotes.innerHTML = notesHtml;
      elements.todaySpecialNotes.classList.remove('hidden');
    } else {
      elements.todaySpecialNotes.classList.add('hidden');
    }

    elements.todaySection.classList.remove('hidden');
    elements.timetableSection.classList.add('hidden');

    // Scroll to today section
    elements.todaySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Show/hide loading spinner
   */
  function showLoading(show) {
    elements.loading.classList.toggle('hidden', !show);
  }

  /**
   * Show error message
   */
  function showError(message) {
    elements.errorText.textContent = message;
    elements.error.classList.remove('hidden');
    elements.loading.classList.add('hidden');
    elements.timetableSection.classList.add('hidden');
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
