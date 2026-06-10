/**
 * Internationalization (i18n) for Le Run HK
 * Supports English and Traditional Chinese
 */

const I18N = {
  en: {
    // Header
    langToggle: '中',

    // Intro
    introText: 'Check jogging availability at Hong Kong sports grounds',

    // Filters
    areaLabel: 'Area',
    districtLabel: 'District',
    venueLabel: 'Sports Ground',
    monthLabel: 'Month',
    selectArea: '-- Select Area --',
    selectDistrict: '-- Select District --',
    selectVenue: '-- Select Sports Ground --',
    selectMonth: '-- Select Month --',
    searchBtn: 'Search',

    // Legend (standard sportsgrounds)
    legendTitle: 'Legend',
    legendA: 'Available',
    legendL: 'Lanes Confined',
    legendB: 'Closed for Block Booking',
    legendM: 'Venue Closed',

    // Legend (Causeway Bay specific)
    legendL_cwb: '100M Lanes Booked',
    legendG: 'Grass Pitch booked',
    legendGL: 'Both 100M Lanes and Grass Pitch booked',
    legendT: 'Turf Maintenance, jogging track Available',

    // Notices
    noticesTitle: 'Notices',
    noNotices: 'No notices for this month',
    facilities: 'Facilities',
    reason: 'Reason',

    // Go to Today button
    goToToday: 'Go to Today',

    // Available Today
    availableToday: 'Available Today',
    todayTitle: 'Available Today',
    noVenuesToday: 'No sports grounds with open slots today',
    areaHK: 'Hong Kong Island',
    areaKLN: 'Kowloon',
    areaNT: 'New Territories',

    // Loading & Errors
    loadingText: 'Loading data...',
    errorLoading: 'Failed to load data. Please try again later.',
    noData: 'No data available for this selection',
    dataNotFound: 'Data not found - the schedule for this venue is currently unavailable from LCSD',
    noMonthsAvailable: 'No schedule data available for this venue',

    // Footer
    footerText: 'Data sourced from',
    lcsdName: 'Leisure and Cultural Services Department',
    lcsdUrl: 'https://www.lcsd.gov.hk/en/index.html',
    lastUpdated: 'Last updated',
    disclaimer: 'Information accuracy is not guaranteed. Please verify with official LCSD sources if needed.',
    copyright: '© 2026 Le Run HK 樂跑. All rights reserved.',
    feedbackText: 'Found a bug or have feedback?',
    feedbackLink: 'Let us know',

    // Months
    months: {
      1: 'January', 2: 'February', 3: 'March', 4: 'April',
      5: 'May', 6: 'June', 7: 'July', 8: 'August',
      9: 'September', 10: 'October', 11: 'November', 12: 'December'
    },

    // Weekdays short
    weekdays: {
      Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu',
      Fri: 'Fri', Sat: 'Sat', Sun: 'Sun'
    }
  },

  zh: {
    // Header
    langToggle: 'EN',

    // Intro
    introText: '查詢香港運動場緩步跑開放時間',

    // Filters
    areaLabel: '地區',
    districtLabel: '區域',
    venueLabel: '運動場',
    monthLabel: '月份',
    selectArea: '-- 選擇地區 --',
    selectDistrict: '-- 選擇區域 --',
    selectVenue: '-- 選擇運動場 --',
    selectMonth: '-- 選擇月份 --',
    searchBtn: '搜尋',

    // Legend (standard sportsgrounds)
    legendTitle: '圖例',
    legendA: '開放',
    legendL: '部分跑道不開放',
    legendB: '團體預訂',
    legendM: '場地關閉',

    // Legend (Causeway Bay specific)
    legendL_cwb: '跑道預訂',
    legendG: '草地預訂',
    legendGL: '草地及跑道預訂',
    legendT: '草地保養期間，緩跑徑開放',

    // Notices
    noticesTitle: '備註',
    noNotices: '本月暫無備註',
    facilities: '設施',
    reason: '原因',

    // Go to Today button
    goToToday: '跳至今日',

    // Available Today
    availableToday: '今日可用',
    todayTitle: '今日可用時段',
    noVenuesToday: '今日沒有運動場有開放時段',
    areaHK: '香港島',
    areaKLN: '九龍',
    areaNT: '新界',

    // Loading & Errors
    loadingText: '載入資料中...',
    errorLoading: '無法載入資料，請稍後再試。',
    noData: '未有此選擇的資料',
    dataNotFound: '找不到資料 - 康文署暫未提供此運動場的時間表',
    noMonthsAvailable: '此運動場暫無可用的時間表資料',

    // Footer
    footerText: '資料來源',
    lcsdName: '康樂及文化事務署',
    lcsdUrl: 'https://www.lcsd.gov.hk/tc/index.html',
    lastUpdated: '最後更新',
    disclaimer: '資料僅供參考，準確性不獲保證。如有需要，請向康文署官方網站核實。',
    copyright: '© 2026 Le Run HK 樂跑。保留所有權利。',
    feedbackText: '發現錯誤或有意見？',
    feedbackLink: '告訴我們',

    // Months
    months: {
      1: '1月', 2: '2月', 3: '3月', 4: '4月',
      5: '5月', 6: '6月', 7: '7月', 8: '8月',
      9: '9月', 10: '10月', 11: '11月', 12: '12月'
    },

    // Weekdays short
    weekdays: {
      Mon: '一', Tue: '二', Wed: '三', Thu: '四',
      Fri: '五', Sat: '六', Sun: '日'
    }
  }
};

/**
 * Get translation for a key
 * @param {string} key - The translation key
 * @param {string} lang - Language code ('en' or 'zh')
 * @returns {string}
 */
function t(key, lang) {
  const keys = key.split('.');
  let value = I18N[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

/**
 * Get current language from localStorage or default to English
 * Uses try-catch to handle private browsing mode where localStorage may throw
 */
function getCurrentLang() {
  try {
    return localStorage.getItem('lang') || 'en';
  } catch (e) {
    return 'en';
  }
}

/**
 * Set language in localStorage
 * Silently fails in private browsing mode
 */
function setLang(lang) {
  try {
    localStorage.setItem('lang', lang);
  } catch (e) {
    // localStorage not available (private browsing mode)
  }
}
