/**
 * Data Fetcher for Le Run HK
 * Downloads xlsx files from LCSD and converts to JSON for the frontend
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { AREAS, DISTRICTS, SPORTS_GROUNDS, getDownloadUrl, getTargetMonths } = require('./config');

const RAW_DATA_DIR = path.join(__dirname, '..', 'data', 'raw');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

// Ensure directories exist
if (!fs.existsSync(RAW_DATA_DIR)) fs.mkdirSync(RAW_DATA_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Download a file from URL
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else if (response.statusCode === 404) {
        file.close();
        fs.unlinkSync(destPath);
        resolve(false); // File not yet available
      } else {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

/**
 * Parse time string to minutes since midnight
 */
function parseTimeToMinutes(timeStr) {
  const match = timeStr.match(/(\d{1,2}):?(\d{2})/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

/**
 * Parse notice date/time to extract day and time range
 * Handles formats like:
 * - "4/5/2026 0630-1700"
 * - "2026/5/2  16:00 - 20:00"
 * - "2026/5/4,11,18" (multiple days)
 */
function parseNoticeDateTimes(dateTimeStr, timeStr = null) {
  const results = [];

  // Handle time in separate column
  let timeRange = { start: null, end: null };
  if (timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})\s*[-–]\s*(\d{1,2}):?(\d{2})/);
    if (timeMatch) {
      timeRange.start = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
      timeRange.end = parseInt(timeMatch[3]) * 60 + parseInt(timeMatch[4]);
    }
  }

  // Extract time from dateTimeStr if present
  const inlineTimeMatch = dateTimeStr.match(/(\d{2}):?(\d{2})\s*[-–]\s*(\d{2}):?(\d{2})/);
  if (inlineTimeMatch && !timeStr) {
    timeRange.start = parseInt(inlineTimeMatch[1]) * 60 + parseInt(inlineTimeMatch[2]);
    timeRange.end = parseInt(inlineTimeMatch[3]) * 60 + parseInt(inlineTimeMatch[4]);
  }

  // Extract days - handle multiple days like "2026/5/4,11,18"
  const dayMatches = dateTimeStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})|(\d{4})\/(\d{1,2})\/(\d{1,2})/g);

  if (dayMatches) {
    for (const dateMatch of dayMatches) {
      let day;
      if (dateMatch.match(/^\d{4}/)) {
        // Format: 2026/5/2
        const parts = dateMatch.split('/');
        day = parseInt(parts[2]);
      } else {
        // Format: 4/5/2026
        const parts = dateMatch.split('/');
        day = parseInt(parts[0]);
      }
      results.push({ day, ...timeRange });
    }
  }

  // Handle comma-separated days like "2026/5/4,11,18"
  const commaDays = dateTimeStr.match(/,\s*(\d{1,2})/g);
  if (commaDays && results.length > 0) {
    for (const match of commaDays) {
      const day = parseInt(match.replace(/,\s*/, ''));
      results.push({ day, ...timeRange });
    }
  }

  return results;
}

/**
 * Parse xlsx file and extract timetable data
 */
function parseXlsxFile(filePath, venueId) {
  const wb = XLSX.readFile(filePath);

  // Parse timetable sheet
  const timetableSheet = wb.Sheets[wb.SheetNames[0]];
  const timetableData = XLSX.utils.sheet_to_json(timetableSheet, { header: 1, defval: '' });

  // Extract title (venue name and month)
  const title = timetableData[0][0] || '';

  // Parse legend dynamically from the sheet (rows 1-6 typically)
  const legend = {};
  for (let i = 1; i < Math.min(10, timetableData.length); i++) {
    const row = timetableData[i];
    // Look for status code in column B (index 1) and explanation in later columns
    const statusCode = (row[1] || '').toString().trim();
    if (statusCode && /^[A-Z*]$/.test(statusCode)) {
      // Find explanation - could be in column C or later
      let explanation = '';
      for (let j = 2; j < row.length; j++) {
        if (row[j] && row[j].toString().trim()) {
          explanation = row[j].toString().trim();
          break;
        }
      }
      if (explanation) {
        // Split bilingual explanation
        const zhMatch = explanation.match(/[\u4e00-\u9fff][\u4e00-\u9fff\s\d\-()（）、，。：:]+/);
        const enMatch = explanation.match(/[A-Za-z][A-Za-z\s\d\-().,]+/);
        legend[statusCode] = {
          en: enMatch ? enMatch[0].trim() : explanation,
          zh: zhMatch ? zhMatch[0].trim() : explanation
        };
      }
    }
  }

  // Ensure we have at least default legend entries
  if (!legend.A) legend.A = { en: 'Opening Hours for Jogging', zh: '緩步跑開放時間' };
  if (!legend.M) legend.M = { en: 'Venue closed', zh: '場地關閉' };

  // Find first time slot row (contains time pattern like "06:30 - 07:00")
  let firstTimeSlotIdx = -1;
  for (let i = 0; i < timetableData.length; i++) {
    const firstCell = (timetableData[i][0] || '').toString();
    if (/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/.test(firstCell)) {
      firstTimeSlotIdx = i;
      break;
    }
  }

  if (firstTimeSlotIdx === -1) {
    return { venueId, title, legend, dates: [], timeSlots: [], notices: [], specialNotes: [] };
  }

  // Find header row - look backwards from first time slot for row with dates
  let headerRowIdx = firstTimeSlotIdx - 1;
  let weekdayRowIdx = -1;

  // Check if dates and weekdays are on separate rows
  for (let i = firstTimeSlotIdx - 1; i >= 0; i--) {
    const row = timetableData[i];
    const firstCell = (row[0] || '').toString();
    const secondCell = row[1];

    // Check if this row has weekday info (週/week or Mon/Tue etc)
    if (secondCell && /週|Mon|Tue|Wed|Thu|Fri|Sat|Sun/i.test(secondCell.toString())) {
      weekdayRowIdx = i;
    }

    // Check if this row has date numbers or Excel serial numbers
    if (secondCell !== undefined && secondCell !== '') {
      const val = secondCell.toString();
      // Day number (1-31) or Excel serial number (>40000)
      if (/^[1-9]$|^[12][0-9]$|^3[01]$/.test(val) || (typeof secondCell === 'number' && secondCell > 40000)) {
        headerRowIdx = i;
        break;
      }
    }
  }

  // Parse dates from header row - track column indices for merged cell handling
  const headerRow = timetableData[headerRowIdx] || [];
  const weekdayRow = weekdayRowIdx >= 0 ? timetableData[weekdayRowIdx] : headerRow;
  const dates = [];
  const columnIndices = []; // Track actual column index for each date (for merged cells)

  for (let i = 1; i < headerRow.length; i++) {
    const cellVal = headerRow[i];
    if (cellVal === undefined || cellVal === '') continue;

    let day, weekdayZh = '', weekdayEn = '';

    if (typeof cellVal === 'number' && cellVal > 40000) {
      // Excel serial number - convert to date
      const d = new Date((cellVal - 25569) * 86400 * 1000);
      day = d.getDate();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayNamesZh = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
      weekdayEn = dayNames[d.getDay()];
      weekdayZh = dayNamesZh[d.getDay()];
    } else {
      // Text format - could be "1\n週五\nFri" or just "1"
      const parts = cellVal.toString().split(/[\r\n]+/);
      day = parseInt(parts[0]);
      if (isNaN(day)) continue;

      // Get weekday from same cell or weekday row
      if (parts.length > 1) {
        weekdayZh = parts[1] || '';
        weekdayEn = parts[2] || '';
      } else if (weekdayRow && weekdayRow[i]) {
        const wdParts = weekdayRow[i].toString().split(/[\r\n]+/);
        weekdayZh = wdParts.find(p => /週/.test(p)) || '';
        weekdayEn = wdParts.find(p => /Mon|Tue|Wed|Thu|Fri|Sat|Sun/i.test(p)) || '';
      }
    }

    // Clean weekday strings
    weekdayZh = (weekdayZh || '').replace(/\s+/g, '').trim();
    weekdayEn = (weekdayEn || '').replace(/\s+/g, '').trim();

    dates.push({ day, weekdayZh, weekdayEn });
    columnIndices.push(i); // Store the actual column index
  }

  // Parse time slots - use columnIndices to handle merged cells correctly
  const timeSlots = [];
  for (let rowIdx = firstTimeSlotIdx; rowIdx < timetableData.length; rowIdx++) {
    const row = timetableData[rowIdx];
    const firstCell = (row[0] || '').toString();
    if (!firstCell || !/^\d{2}:\d{2}/.test(firstCell)) break; // End of time slots

    const timeRange = firstCell.trim();
    const availability = [];

    for (let dayIdx = 0; dayIdx < dates.length; dayIdx++) {
      // Use actual column index from columnIndices (handles merged cells)
      const colIdx = columnIndices[dayIdx];
      const status = (row[colIdx] || '').toString().trim();
      availability.push(status || '-');
    }

    timeSlots.push({
      time: timeRange,
      availability
    });
  }

  // Parse special notes from bottom of timetable sheet (e.g., "*** Jogging Track available during maintenance")
  const specialNotes = [];
  for (let rowIdx = firstTimeSlotIdx + timeSlots.length; rowIdx < timetableData.length; rowIdx++) {
    const row = timetableData[rowIdx];
    const firstCell = (row[0] || '').toString().trim();

    // Look for special notes - typically start with "***" or contain important info
    if (firstCell.startsWith('***') ||
        (firstCell.length > 20 && /緩跑|Jogging|Track|開放|available|保養|Maintenance/i.test(firstCell))) {
      // Skip standard footer lines
      if (/場地的預訂情況|Date of issue|Date of latest update|發出日期|最新更新日期/i.test(firstCell)) {
        continue;
      }

      // Split bilingual text
      const zhMatch = firstCell.match(/[\u4e00-\u9fff][\u4e00-\u9fff\s\d\-()（）、，。：:/至年月日*\u3000]+/g);
      const enMatch = firstCell.match(/[A-Za-z][A-Za-z\s\d\-().,/]+/g);

      specialNotes.push({
        text: firstCell.replace(/^\*+\s*/, '').trim(),
        en: enMatch ? enMatch.join(' ').trim() : firstCell,
        zh: zhMatch ? zhMatch.join(' ').trim() : firstCell
      });
    }
  }

  // Parse notices sheet
  const notices = [];
  if (wb.SheetNames.length > 1) {
    const noticeSheet = wb.Sheets[wb.SheetNames[1]];
    const noticeData = XLSX.utils.sheet_to_json(noticeSheet, { header: 1, defval: '' });

    // Detect header row to understand column structure
    let headerRow = 1;
    let hasTimeColumn = false;
    for (let i = 0; i < Math.min(3, noticeData.length); i++) {
      const row = noticeData[i];
      const rowStr = row.join(' ').toLowerCase();
      if (rowStr.includes('time') || rowStr.includes('時間')) {
        headerRow = i;
        // Check if time is in separate column
        if (row[1] && /time|時間/i.test(row[1].toString())) {
          hasTimeColumn = true;
        }
        break;
      }
    }

    for (let i = headerRow + 1; i < noticeData.length; i++) {
      const row = noticeData[i];
      if (!row[0] || !row[0].toString().trim()) continue;

      const dateTimeStr = row[0].toString();
      let facilities, reason, remarks;

      if (hasTimeColumn) {
        // Format: Date | Time | Facilities | Reason
        const timeStr = row[1] ? row[1].toString() : '';
        facilities = row[2] || '';
        reason = row[3] || '';
        remarks = row[4] || '';

        // Parse with time column
        const parsedDateTimes = parseNoticeDateTimes(dateTimeStr, timeStr);
        for (const dt of parsedDateTimes) {
          notices.push({
            day: dt.day,
            startTime: dt.start,
            endTime: dt.end,
            dateTime: dateTimeStr + (timeStr ? ' ' + timeStr : ''),
            facilities: facilities.toString(),
            reason: reason.toString(),
            remarks: remarks.toString()
          });
        }
      } else {
        // Format: DateTime | Facilities | Reason
        facilities = row[1] || '';
        reason = row[2] || '';
        remarks = row[3] || '';

        const parsedDateTimes = parseNoticeDateTimes(dateTimeStr);
        for (const dt of parsedDateTimes) {
          notices.push({
            day: dt.day,
            startTime: dt.start,
            endTime: dt.end,
            dateTime: dateTimeStr,
            facilities: facilities.toString(),
            reason: reason.toString(),
            remarks: remarks.toString()
          });
        }
      }
    }
  }

  return {
    venueId,
    title,
    legend,
    dates,
    timeSlots,
    notices,
    specialNotes
  };
}

/**
 * Main function to fetch and process all data
 */
async function main() {
  console.log('Le Run HK Data Fetcher');
  console.log('='.repeat(50));

  const targetMonths = getTargetMonths();
  console.log(`Fetching data for: ${targetMonths.map(m => `${m.year}/${m.month}`).join(', ')}`);

  const allData = {
    lastUpdated: new Date().toISOString(),
    areas: AREAS,
    districts: DISTRICTS,
    venues: {},
    months: {}
  };

  // Build venue metadata
  for (const ground of SPORTS_GROUNDS) {
    const venueData = {
      id: ground.id,
      name: ground.name,
      district: ground.district,
      area: DISTRICTS[ground.district].area,
      lanes: ground.lanes || 8
    };
    if (ground.address) {
      venueData.address = ground.address;
    }
    if (ground.coords) {
      venueData.coords = ground.coords;
    }
    if (ground.closed) {
      venueData.closed = true;
    }
    if (ground.joggingTrackOnly) {
      venueData.joggingTrackOnly = true;
    }
    if (ground.hasJoggingTrack) {
      venueData.hasJoggingTrack = true;
    }
    allData.venues[ground.id] = venueData;
  }

  // Download and parse for each month
  for (const { year, month } of targetMonths) {
    const monthKey = `${year}${month.toString().padStart(2, '0')}`;
    allData.months[monthKey] = {
      year,
      month,
      venues: {}
    };

    console.log(`\nProcessing ${year}/${month}...`);

    for (const ground of SPORTS_GROUNDS) {
      // Skip closed venues
      if (ground.closed) {
        continue;
      }

      const url = getDownloadUrl(ground.id, year, month);
      const filename = `${ground.id}_${monthKey}.xlsx`;
      const filePath = path.join(RAW_DATA_DIR, filename);

      process.stdout.write(`  ${ground.name.en}... `);

      try {
        // Download if not exists, is empty (corrupted), or force refresh
        const needsDownload = !fs.existsSync(filePath) || fs.statSync(filePath).size === 0;
        if (needsDownload) {
          // Remove empty/corrupted file before re-downloading
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          const success = await downloadFile(url, filePath);
          if (!success) {
            console.log('Not yet available');
            continue;
          }
        }

        // Parse the file
        const data = parseXlsxFile(filePath, ground.id);
        allData.months[monthKey].venues[ground.id] = data;
        console.log('OK');

      } catch (err) {
        console.log(`Error: ${err.message}`);
      }
    }
  }

  // Write combined JSON output
  const outputPath = path.join(OUTPUT_DIR, 'availability.json');
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  console.log(`\nData saved to: ${outputPath}`);

  // Also export config for frontend
  const configOutput = {
    areas: AREAS,
    districts: DISTRICTS,
    venues: allData.venues
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'config.json'),
    JSON.stringify(configOutput, null, 2)
  );
  console.log(`Config saved to: ${path.join(OUTPUT_DIR, 'config.json')}`);
}

main().catch(console.error);
