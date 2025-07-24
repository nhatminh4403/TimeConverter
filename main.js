// === CÁC PHẦN TỬ DOM ===
// Đồng hồ thời gian thực
const currentClockEl = document.getElementById('currentClock');

// Chuyển đổi đơn lẻ
const fromTimezoneEl = document.getElementById('fromTimezone');
const toTimezoneEl = document.getElementById('toTimezone');
const sourceTimeEl = document.getElementById('sourceTime');
const sourceDisplayEl = document.getElementById('sourceDisplay');
const convertedDisplayEl = document.getElementById('convertedDisplay');

// Chuyển đổi khoảng thời gian
const rangeFromTimezoneEl = document.getElementById('rangeFromTimezone');
const rangeToTimezoneEl = document.getElementById('rangeToTimezone');
const startTimeEl = document.getElementById('startTime');
const endTimeEl = document.getElementById('endTime');
const rangeDateEl = document.getElementById('rangeDate');
const rangeSourceDisplayEl = document.getElementById('rangeSourceDisplay');
const rangeConvertedDisplayEl = document.getElementById('rangeConvertedDisplay');
const durationInfoEl = document.getElementById('durationInfo');
const timeDifferenceInfoEl = document.getElementById('timeDifferenceInfo');

// Định dạng khác
const formatGridEl = document.getElementById('formatGrid');

// === CÁC HÀM TIỆN ÍCH ===

/**
 * Phân tích một chuỗi ngày giờ (ví dụ: '2025-07-24', '08:00') trong một múi giờ cụ thể
 * và trả về một đối tượng Date hợp lệ (đại diện cho một thời điểm UTC duy nhất).
 * Đây là hàm cốt lõi để xử lý logic chuyển đổi một cách chính xác.
 * @param {string} dateString - Ngày theo định dạng 'YYYY-MM-DD'.
 * @param {string} timeString - Thời gian theo định dạng 'HH:mm'.
 * @param {string} timeZone - Tên múi giờ IANA (ví dụ: 'America/New_York').
 * @returns {Date} - Đối tượng Date đại diện cho thời điểm chính xác.
 */
function parseDateTimeInTimezone(dateString, timeString, timeZone) {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hour, minute] = timeString.split(':').map(Number);

    // Bước 1: Tạo một đối tượng Date "ngây thơ" bằng cách giả định thời gian đầu vào là UTC.
    // Ví dụ: '08:00' ở 'America/New_York' được tạo tạm thời thành 08:00 UTC.
    const naiveDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

    // Bước 2: Tính toán chênh lệch (offset) giữa múi giờ đích và UTC tại đúng thời điểm đó.
    // `Intl.DateTimeFormat` nhận biết được Giờ mùa hè.
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hourCycle: 'h23'
    });

    const parts = formatter.formatToParts(naiveDate);
    const partsMap = new Map(parts.map(p => [p.type, p.value]));

    // Tạo một thời điểm UTC từ các phần "giờ địa phương" của múi giờ nguồn.
    const localTimeAsUTC = Date.UTC(
        partsMap.get('year'), partsMap.get('month') - 1, partsMap.get('day'),
        partsMap.get('hour') === '24' ? 0 : partsMap.get('hour'),
        partsMap.get('minute'), partsMap.get('second')
    );

    // Chênh lệch là sự khác biệt giữa thời gian địa phương và thời gian UTC ban đầu của chúng ta.
    const offset = localTimeAsUTC - naiveDate.getTime();

    // Bước 3: Áp dụng chênh lệch vào thời gian "ngây thơ" của chúng ta để có được dấu thời gian UTC chính xác.
    // Dấu thời gian thực = Dấu thời gian "ngây thơ" (coi như UTC) - chênh lệch
    return new Date(naiveDate.getTime() - offset);
}

/** Lấy tên hiển thị thân thiện cho múi giờ */
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
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Múi giờ của trình duyệt
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

    // 1. Phân tích thành các đối tượng Date chính xác
    let startDate = parseDateTimeInTimezone(date, startTime, fromTz);
    let endDate = parseDateTimeInTimezone(date, endTime, fromTz);

    // Xử lý trường hợp khoảng thời gian qua nửa đêm (ví dụ: 22:00 - 02:00)
    if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
    }

    // 2. Cập nhật hiển thị nguồn
    rangeSourceDisplayEl.innerHTML = `
            <div>${startTime} - ${endTime}</div>
            <div style="font-size: 0.9em; opacity: 0.9; margin-top: 5px;">${new Date(date + 'T00:00').toLocaleDateString('vi-VN')} (${getTimezoneDisplayName(fromTz)})</div>
        `;

    // 3. Định dạng kết quả đã chuyển đổi
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

    // 4. Tính toán và hiển thị thời lượng
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.floor(durationMs / 3600000);
    const durationMinutes = Math.floor((durationMs % 3600000) / 60000);
    durationInfoEl.textContent = `Thời lượng: ${durationHours} giờ ${durationMinutes} phút`;

    // 5. Tính toán chênh lệch múi giờ
    // So sánh chênh lệch của mỗi múi giờ so với UTC
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
        { label: 'RFC 2822', value: date.toUTCString() } // UTC string is universal
    ];

    formatGridEl.innerHTML = '';
    formats.forEach(format => {
        const item = document.createElement('div');
        item.className = 'format-item';
        item.innerHTML = `<div class="format-label">${format.label}</div><div class="format-value">${format.value}</div>`;
        formatGridEl.appendChild(item);
    });
}

// === KHỞI TẠO VÀ GẮN SỰ KIỆN ===
function init() {
    // Cập nhật đồng hồ mỗi giây
    updateCurrentClock();
    setInterval(updateCurrentClock, 1000);

    // Đặt giá trị mặc định cho các trường input
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    sourceTimeEl.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    rangeDateEl.value = `${year}-${month}-${day}`;

    // Thiết lập múi giờ mặc định
    fromTimezoneEl.value = 'UTC';
    toTimezoneEl.value = 'Asia/Ho_Chi_Minh';
    rangeFromTimezoneEl.value = 'UTC';
    rangeToTimezoneEl.value = 'Asia/Ho_Chi_Minh';

    // Thực hiện chuyển đổi lần đầu
    convertTime();
    convertTimeRange();

    // Gắn các sự kiện 'change' để tự động cập nhật
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