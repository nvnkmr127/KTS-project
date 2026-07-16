// Biometric APIs sometimes send UTC ISO timestamps for what is actually local time.
// When that's the case, extracting date/time via Date getters (not UTC getters) recovers the intended local value.
export function utcDateTimeToParts(str: string): { date: string; time: string } | null {
  if (!str.includes('T') || !(str.endsWith('Z') || str.includes('+'))) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return {
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  };
}

// Splits a raw biometric scan_datetime (UTC ISO or "YYYY-MM-DD HH:MM:SS") into date/time parts
export function scanDateTimeToParts(scanDatetime: string): { date: string; time: string } {
  const utc = utcDateTimeToParts(scanDatetime);
  if (utc) return utc;
  const date = scanDatetime.includes('T') ? scanDatetime.split('T')[0] : scanDatetime.split(' ')[0];
  const timeStr = scanDatetime.includes('T') ? scanDatetime.split('T')[1] : scanDatetime.split(' ')[1];
  const time = timeStr ? timeStr.slice(0, 5) : scanDatetime.slice(11, 16);
  return { date, time };
}

export function formatTimeAgo(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'some time ago';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'some time ago';
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export function formatDateTimeParts(dateInput: string | Date | null | undefined): { date: string; time: string } {
  if (!dateInput) return { date: '', time: '' };
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return { date: '', time: '' };
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (e) {}
  return dateStr;
}
