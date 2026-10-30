/**
 * Calculate working days (Mon-Fri) excluding holidays between startDate and endDate inclusive.
 * @param {string|Date} startDate - Start date (YYYY-MM-DD or Date object)
 * @param {string|Date} endDate - End date (YYYY-MM-DD or Date object)
 * @param {Array<string|{date: string}>} holidays - Array of holiday date strings 'YYYY-MM-DD' or holiday objects {date: 'YYYY-MM-DD'}
 * @returns {number} Count of working days
 */
export function calculateWorkingDays(startDate, endDate, holidays = []) {
  if (!startDate || !endDate) return 0;

  // Normalize string to YYYY-MM-DD parts to avoid timezone shifting
  const parseDateUTC = (d) => {
    if (d instanceof Date) {
      return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    const [year, month, day] = String(d).slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const start = parseDateUTC(startDate);
  const end = parseDateUTC(endDate);

  if (end < start) return 0;

  // Build a set of holiday strings 'YYYY-MM-DD'
  const holidaySet = new Set(
    holidays.map((h) => {
      const val = typeof h === 'string' ? h : h?.date;
      return String(val || '').slice(0, 10);
    }).filter(Boolean)
  );

  let workingDays = 0;
  const current = new Date(start.getTime());

  while (current <= end) {
    const dayOfWeek = current.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const yyyy = current.getUTCFullYear();
    const mm = String(current.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(current.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateStr);

    if (!isWeekend && !isHoliday) {
      workingDays += 1;
    }

    // Advance 1 day in UTC
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return workingDays;
}
