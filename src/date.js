// ============================================
// توابع کار با تاریخ شمسی
// ============================================

export function toShamsi(date = new Date()) {
  try {
    const d = typeof date === "string" ? new Date(date) : date;

    // تبدیل به وقت تهران (UTC+3:30)
    const tehranTime = new Date(d.getTime() + 3.5 * 60 * 60 * 1000);

    const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    });

    const parts = formatter.formatToParts(tehranTime);

    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;

    const pad = (n) => n.toString().padStart(2, "0");

    return `${year}/${pad(month)}/${pad(day)}`;
  } catch (error) {
    console.error("toShamsi error:", error);
    return null;
  }
}
