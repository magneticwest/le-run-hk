/**
 * Sports Ground Configuration
 * Maps venue IDs to their metadata including names in both languages,
 * area, and district.
 */

const AREAS = {
  HK_ISLAND: { en: 'Hong Kong Island', zh: '香港島' },
  KOWLOON: { en: 'Kowloon', zh: '九龍' },
  NT: { en: 'New Territories', zh: '新界' }
};

const DISTRICTS = {
  // Hong Kong Island
  EASTERN: { en: 'Eastern', zh: '東區', area: 'HK_ISLAND' },
  SOUTHERN: { en: 'Southern', zh: '南區', area: 'HK_ISLAND' },
  WAN_CHAI: { en: 'Wan Chai', zh: '灣仔區', area: 'HK_ISLAND' },
  CENTRAL_WESTERN: { en: 'Central & Western', zh: '中西區', area: 'HK_ISLAND', noVenues: true },

  // Kowloon
  KOWLOON_CITY: { en: 'Kowloon City', zh: '九龍城', area: 'KOWLOON' },
  SHAM_SHUI_PO: { en: 'Sham Shui Po', zh: '深水埗', area: 'KOWLOON' },
  KWUN_TONG: { en: 'Kwun Tong', zh: '觀塘', area: 'KOWLOON' },
  WONG_TAI_SIN: { en: 'Wong Tai Sin', zh: '黃大仙', area: 'KOWLOON' },
  YAU_TSIM_MONG: { en: 'Yau Tsim Mong', zh: '油尖旺', area: 'KOWLOON', noVenues: true },

  // New Territories
  ISLANDS: { en: 'Islands', zh: '離島', area: 'NT' },
  KWAI_TSING: { en: 'Kwai Tsing', zh: '葵青', area: 'NT' },
  NORTH: { en: 'North', zh: '北區', area: 'NT' },
  SAI_KUNG: { en: 'Sai Kung', zh: '西貢', area: 'NT' },
  SHA_TIN: { en: 'Sha Tin', zh: '沙田', area: 'NT' },
  TAI_PO: { en: 'Tai Po', zh: '大埔', area: 'NT' },
  TSUEN_WAN: { en: 'Tsuen Wan', zh: '荃灣', area: 'NT' },
  TUEN_MUN: { en: 'Tuen Mun', zh: '屯門', area: 'NT' },
  YUEN_LONG: { en: 'Yuen Long', zh: '元朗', area: 'NT' }
};

/**
 * Sports grounds with LCSD venue IDs
 * ID extracted from URL pattern: {id}_YYYYMM.xlsx
 */
const SPORTS_GROUNDS = [
  // Hong Kong Island
  {
    id: '488',
    name: { en: 'Siu Sai Wan Sports Ground', zh: '小西灣運動場' },
    district: 'EASTERN',
    lanes: 8,
    address: { en: '15 Siu Sai Wan Road, Siu Sai Wan', zh: '小西灣小西灣道15號' },
    coords: { lat: 22.2638, lng: 114.2525 }
  },
  {
    id: '547',
    name: { en: 'Aberdeen Sports Ground', zh: '香港仔運動場' },
    district: 'SOUTHERN',
    lanes: 6,
    address: { en: '108 Wong Chuk Hang Road, Aberdeen', zh: '香港仔黃竹坑道108號' },
    coords: { lat: 22.2478, lng: 114.1698 }
  },
  {
    id: '907',
    name: { en: 'Causeway Bay Sports Ground', zh: '銅鑼灣運動場' },
    district: 'WAN_CHAI',
    lanes: 5,
    hasJoggingTrack: true,
    address: { en: 'Causeway Bay Sports Ground, Causeway Road, Causeway Bay, Hong Kong', zh: '	銅鑼灣高士威道銅鑼灣運動場' },
    coords: { lat: 22.2805, lng: 114.1906 }
  },

  // Kowloon
  {
    id: '48',
    name: { en: 'Kowloon Tsai Sports Ground', zh: '九龍仔運動場' },
    district: 'KOWLOON_CITY',
    lanes: 8,
    address: { en: '13 Inverness Road, Kowloon Tong', zh: '九龍塘延文禮士道13號' },
    coords: { lat: 22.3366, lng: 114.1765 }
  },
  {
    id: '63',
    name: { en: 'Perth Street Sports Ground', zh: '巴富街運動場' },
    district: 'KOWLOON_CITY',
    lanes: 6,
    address: { en: '12 Perth Street, Ho Man Tin', zh: '何文田巴富街12號' },
    coords: { lat: 22.3162, lng: 114.1756 }
  },
  {
    id: '683',
    name: { en: 'Sham Shui Po Sports Ground', zh: '深水埗運動場' },
    district: 'SHAM_SHUI_PO',
    lanes: 8,
    address: { en: '325 Lai Chi Kok Road, Sham Shui Po', zh: '深水埗荔枝角道325號' },
    coords: { lat: 22.3296, lng: 114.1592 }
  },
  {
    id: '723',
    name: { en: 'Hammer Hill Road Sports Ground', zh: '斧山道運動場' },
    district: 'WONG_TAI_SIN',
    lanes: 8,
    address: { en: '70 Hammer Hill Road, Diamond Hill', zh: '鑽石山斧山道70號' },
    coords: { lat: 22.3434, lng: 114.2044 }
  },
  {
    id: 'closed_kowloon_bay',
    name: { en: 'Kowloon Bay Sports Ground (Closed)', zh: '九龍灣運動場 (已關閉)' },
    district: 'KWUN_TONG',
    closed: true
  },

  // New Territories
  {
    id: '857',
    name: { en: 'Cheung Chau Sports Ground', zh: '長洲運動場' },
    district: 'ISLANDS',
    lanes: 5,
    address: { en: 'Kwun Yam Wan Road, Cheung Chau', zh: '長洲觀音灣路' },
    coords: { lat: 22.2095, lng: 114.0296 }
  },
  {
    id: '790',
    name: { en: 'Kwai Chung Sports Ground', zh: '葵涌運動場' },
    district: 'KWAI_TSING',
    lanes: 8,
    address: { en: '35 Hing Shing Road, Kwai Chung', zh: '葵涌興盛路35號' },
    coords: { lat: 22.3583, lng: 114.1280 }
  },
  {
    id: '845',
    name: { en: 'Tsing Yi Sports Ground', zh: '青衣運動場' },
    district: 'KWAI_TSING',
    lanes: 8,
    address: { en: '3 Tsing King Road, Tsing Yi', zh: '青衣青敬路3號' },
    coords: { lat: 22.3531, lng: 114.1027 }
  },
  {
    id: '282',
    name: { en: 'Fanling Recreation Ground', zh: '粉嶺遊樂場' },
    district: 'NORTH',
    lanes: 1,
    joggingTrackOnly: true,
    address: { en: '17 Ma Sik Road, Fanling', zh: '粉嶺馬適路17號' },
    coords: { lat: 22.4925, lng: 114.1418 }
  },
  {
    id: '309',
    name: { en: 'North District Sports Ground', zh: '北區運動場' },
    district: 'NORTH',
    lanes: 8,
    address: { en: '1 Lung Wan Street, Sheung Shui', zh: '上水龍運街1號' },
    coords: { lat: 22.5025, lng: 114.1267 }
  },
  {
    id: '375',
    name: { en: 'Sai Kung Tang Shiu Kin Sports Ground', zh: '西貢鄧肇堅運動場' },
    district: 'SAI_KUNG',
    lanes: 8,
    address: { en: '2 Tai Mong Tsai Road, Sai Kung', zh: '西貢大網仔路2號' },
    coords: { lat: 22.3830, lng: 114.2708 }
  },
  {
    id: '1060',
    name: { en: 'Tseung Kwan O Sports Ground', zh: '將軍澳運動場' },
    district: 'SAI_KUNG',
    lanes: 8,
    address: { en: '11 Wan Po Road, Tseung Kwan O', zh: '將軍澳運亨路11號' },
    coords: { lat: 22.3087, lng: 114.2595 }
  },
  {
    id: '413',
    name: { en: 'Ma On Shan Sports Ground', zh: '馬鞍山運動場' },
    district: 'SHA_TIN',
    lanes: 8,
    address: { en: '2 On Chun Street, Ma On Shan', zh: '馬鞍山鞍駿街2號' },
    coords: { lat: 22.4206, lng: 114.2265 }
  },
  {
    id: '428',
    name: { en: 'Sha Tin Sports Ground', zh: '沙田運動場' },
    district: 'SHA_TIN',
    lanes: 8,
    address: { en: '1 Yuen Wo Road, Sha Tin', zh: '沙田源禾路1號' },
    coords: { lat: 22.3876, lng: 114.1919 }
  },
  {
    id: '97',
    name: { en: 'Tai Po Sports Ground', zh: '大埔運動場' },
    district: 'TAI_PO',
    lanes: 8,
    address: { en: '2 Dai Kwai Street, Tai Po', zh: '大埔大貴街2號' },
    coords: { lat: 22.4502, lng: 114.1610 }
  },
  {
    id: '618',
    name: { en: 'Shing Mun Valley Sports Ground', zh: '城門谷運動場' },
    district: 'TSUEN_WAN',
    lanes: 8,
    address: { en: '25 Shing Mun Road, Tsuen Wan', zh: '荃灣城門道25號' },
    coords: { lat: 22.3847, lng: 114.1182 }
  },
  {
    id: '238',
    name: { en: 'Siu Lun Sports Ground', zh: '兆麟運動場' },
    district: 'TUEN_MUN',
    lanes: 6,
    address: { en: '3 Siu Lun Street, Tuen Mun', zh: '屯門兆麟街3號' },
    coords: { lat: 22.3894, lng: 113.9737 }
  },
  {
    id: '263',
    name: { en: 'Tuen Mun Tang Shiu Kin Sports Ground', zh: '屯門鄧肇堅運動場' },
    district: 'TUEN_MUN',
    lanes: 8,
    address: { en: '1 Wu Shan Road, Tuen Mun', zh: '屯門湖山路1號' },
    coords: { lat: 22.3959, lng: 113.9678 }
  },
  {
    id: '197',
    name: { en: 'Tin Shui Wai Sports Ground', zh: '天水圍運動場' },
    district: 'YUEN_LONG',
    lanes: 8,
    address: { en: '1 Tin Wah Road, Tin Shui Wai', zh: '天水圍天華路1號' },
    coords: { lat: 22.4595, lng: 114.0027 }
  },
  {
    id: 'closed_yuen_long',
    name: { en: 'Yuen Long Stadium (Closed)', zh: '元朗大球場 (已關閉)' },
    district: 'YUEN_LONG',
    closed: true
  }
];

/**
 * Generate URL for downloading xlsx file
 * @param {string} venueId - The LCSD venue ID
 * @param {number} year - Year (e.g., 2026)
 * @param {number} month - Month (1-12)
 * @returns {string} The download URL
 */
function getDownloadUrl(venueId, year, month) {
  const monthStr = month.toString().padStart(2, '0');
  return `https://www.lcsd.gov.hk/file_upload_clpss/leisure_facilities/lsb/jogging/${venueId}_${year}${monthStr}.xlsx`;
}

/**
 * Get current and next month's year/month
 * @returns {Array<{year: number, month: number}>}
 */
function getTargetMonths() {
  const now = new Date();
  const current = { year: now.getFullYear(), month: now.getMonth() + 1 };

  let nextMonth = current.month + 1;
  let nextYear = current.year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }

  return [
    current,
    { year: nextYear, month: nextMonth }
  ];
}

module.exports = {
  AREAS,
  DISTRICTS,
  SPORTS_GROUNDS,
  getDownloadUrl,
  getTargetMonths
};
