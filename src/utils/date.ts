/**
 * Cambodia Timezone Helper Utility (Asia/Phnom_Penh, UTC+7)
 * Ensures all order timestamps, created_at dates, and user dates
 * are formatted accurately in Cambodia Local Time.
 */

export function formatCambodiaTime(
  dateInput?: string | Date | number | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "";
  let d: Date;

  if (typeof dateInput === "string") {
    let str = dateInput.trim();
    if (!str.includes("Z") && !/[+-]\d{2}:?\d{2}$/.test(str)) {
      str = `${str.replace(" ", "T")}Z`;
    }
    d = new Date(str);
  } else if (typeof dateInput === "number") {
    d = new Date(dateInput);
  } else {
    d = dateInput;
  }

  if (isNaN(d.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Phnom_Penh",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  };

  return d.toLocaleString("en-US", defaultOptions);
}

export function formatCambodiaDateOnly(
  dateInput?: string | Date | number | null
): string {
  return formatCambodiaTime(dateInput, {
    hour: undefined,
    minute: undefined,
    hour12: undefined,
  });
}
