const currentClockEl = document.getElementById('currentClock');

const fromTimezoneEl = document.getElementById('fromTimezone');
const toTimezoneEl = document.getElementById('toTimezone');
const sourceTimeEl = document.getElementById('sourceTime');
const sourceDisplayEl = document.getElementById('sourceDisplay');
const convertedDisplayEl = document.getElementById('convertedDisplay');

const rangeFromTimezoneEl = document.getElementById('rangeFromTimezone');
const rangeToTimezoneEl = document.getElementById('rangeToTimezone');
const startTimeEl = document.getElementById('startTime');
const endTimeEl = document.getElementById('endTime');
const rangeDateEl = document.getElementById('rangeDate');
const rangeSourceDisplayEl = document.getElementById('rangeSourceDisplay');
const rangeConvertedDisplayEl = document.getElementById('rangeConvertedDisplay');
const durationInfoEl = document.getElementById('durationInfo');
const timeDifferenceInfoEl = document.getElementById('timeDifferenceInfo');

const formatGridEl = document.getElementById('formatGrid');

function parseDateTimeInTimezone(dateString, timeString, timeZone) {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hour, minute] = timeString.split(':').map(Number);

    const naiveDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hourCycle: 'h23'
    });

    const parts = formatter.formatToParts(naiveDate);
    const partsMap = new Map(parts.map(p => [p.type, p.value]));

    const localTimeAsUTC = Date.UTC(
        partsMap.get('year'), partsMap.get('month') - 1, partsMap.get('day'),
        partsMap.get('hour') === '24' ? 0 : partsMap.get('hour'),
        partsMap.get('minute'), partsMap.get('second')
    );

    const offset = localTimeAsUTC - naiveDate.getTime();

    return new Date(naiveDate.getTime() - offset);
}

const getTimezoneDisplayName = (tz) => {
    const timezoneNames = {
        'UTC': 'UTC',
        'Asia/Ho_Chi_Minh': 'Việt Nam',
        'America/New_York': 'New York',
        'Europe/London': 'London',
        'Asia/Tokyo': 'Tokyo',
        'Australia/Sydney': 'Sydney',
        'Europe/Paris': 'Paris',
        'Asia/Shanghai': 'Thượng Hải',
        'America/Los_Angeles': 'Los Angeles',
        'Europe/Moscow': 'Moscow',
        'Asia/Dubai': 'Dubai'
    };
    return timezoneNames[tz] || tz.split('/').pop().replace('_', ' ');
};

// === CÁC HÀM LOGIC CHÍNH ===

function updateCurrentClock() {
    const now = new Date();
    const options = {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    };
    currentClockEl.textContent = now.toLocaleString('vi-VN', options);
}

function convertTime() {
    const sourceDateTimeValue = sourceTimeEl.value;
    if (!sourceDateTimeValue) return;

    const fromTz = fromTimezoneEl.value;
    const toTz = toTimezoneEl.value;

    const [dateString, timeString] = sourceDateTimeValue.split('T');
    const correctDate = parseDateTimeInTimezone(dateString, timeString, fromTz);

    const displayOptions = {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hourCycle: 'h23'
    };

    sourceDisplayEl.textContent = correctDate.toLocaleString('vi-VN', { ...displayOptions, timeZone: fromTz });
    convertedDisplayEl.textContent = correctDate.toLocaleString('vi-VN', { ...displayOptions, timeZone: toTz });

    updateFormats(correctDate, toTz);
}

function convertTimeRange() {
    const fromTz = rangeFromTimezoneEl.value;
    const toTz = rangeToTimezoneEl.value;
    const date = rangeDateEl.value;
    const startTime = startTimeEl.value;
    const endTime = endTimeEl.value;

    if (!date || !startTime || !endTime) return;

    let startDate = parseDateTimeInTimezone(date, startTime, fromTz);
    let endDate = parseDateTimeInTimezone(date, endTime, fromTz);

    if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
    }

    rangeSourceDisplayEl.innerHTML = `
            <div>${startTime} - ${endTime}</div>
            <div style="font-size: 0.9em; opacity: 0.9; margin-top: 5px;">${new Date(date + 'T00:00').toLocaleDateString('vi-VN')} (${getTimezoneDisplayName(fromTz)})</div>
        `;

    const timeFormat = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    const convertedStartTime = startDate.toLocaleTimeString('en-GB', { ...timeFormat, timeZone: toTz });
    const convertedEndTime = endDate.toLocaleTimeString('en-GB', { ...timeFormat, timeZone: toTz });

    const convertedStartDate = startDate.toLocaleDateString('vi-VN', { timeZone: toTz });
    const convertedEndDate = endDate.toLocaleDateString('vi-VN', { timeZone: toTz });

    let displayDateStr = convertedStartDate;
    if (convertedStartDate !== convertedEndDate) {
        displayDateStr = `${convertedStartDate} - ${convertedEndDate}`;
    }

    rangeConvertedDisplayEl.innerHTML = `
            <div>${convertedStartTime} - ${convertedEndTime}</div>
            <div style="font-size: 0.9em; opacity: 0.9; margin-top: 5px;">${displayDateStr} (${getTimezoneDisplayName(toTz)})</div>
        `;

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.floor(durationMs / 3600000);
    const durationMinutes = Math.floor((durationMs % 3600000) / 60000);
    durationInfoEl.textContent = `Thời lượng: ${durationHours} giờ ${durationMinutes} phút`;

    const dateForOffset = parseDateTimeInTimezone(date, '00:00', 'UTC');
    const fromOffset = (parseDateTimeInTimezone(date, '00:00', fromTz).getTime() - dateForOffset.getTime()) / 3600000;
    const toOffset = (parseDateTimeInTimezone(date, '00:00', toTz).getTime() - dateForOffset.getTime()) / 3600000;
    const diffHours = toOffset - fromOffset;

    let diffText = 'Cùng múi giờ';
    if (diffHours !== 0) {
        diffText = (diffHours > 0 ? '+' : '') + diffHours + ' giờ';
    }
    timeDifferenceInfoEl.textContent = `Chênh lệch múi giờ: ${diffText}`;
}

function updateFormats(date, timezone) {
    if (!(date instanceof Date) || isNaN(date)) return;

    const formats = [
        { label: 'ISO 8601', value: date.toISOString() },
        { label: 'Unix Timestamp (giây)', value: Math.floor(date.getTime() / 1000) },
        { label: '12 giờ (AM/PM)', value: date.toLocaleString('en-US', { timeZone: timezone, year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) },
        { label: 'Đầy đủ (Việt Nam)', value: date.toLocaleString('vi-VN', { timeZone: timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
        { label: 'Chỉ ngày (vi-VN)', value: date.toLocaleDateString('vi-VN', { timeZone: timezone }) },
        { label: 'RFC 2822', value: date.toUTCString() } 
    ];

    formatGridEl.innerHTML = '';
    formats.forEach(format => {
        const item = document.createElement('div');
        item.className = 'format-item';
        item.innerHTML = `<div class="format-label">${format.label}</div><div class="format-value">${format.value}</div>`;
        formatGridEl.appendChild(item);
    });
}

function init() {
    updateCurrentClock();
    setInterval(updateCurrentClock, 1000);

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    sourceTimeEl.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    rangeDateEl.value = `${year}-${month}-${day}`;

    fromTimezoneEl.value = 'UTC';
    toTimezoneEl.value = 'Asia/Ho_Chi_Minh';
    rangeFromTimezoneEl.value = 'UTC';
    rangeToTimezoneEl.value = 'Asia/Ho_Chi_Minh';

    convertTime();
    convertTimeRange();

    const allInputs = [
        sourceTimeEl, fromTimezoneEl, toTimezoneEl,
        startTimeEl, endTimeEl, rangeDateEl, rangeFromTimezoneEl, rangeToTimezoneEl
    ];

    allInputs.forEach(input => {
        input.addEventListener('change', () => {
            convertTime();
            convertTimeRange();
        });
    });
}

window.addEventListener('load', init);
