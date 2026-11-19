import { Decimal } from "decimal.js";

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );

  return asUtc - date.getTime();
}

/**
 * Convert a calendar date (YYYY-MM-DD) at local midnight in `timeZone` to a UTC Date.
 */
export function parseDateOnlyInTimeZone(
  dateOnly: string,
  timeZone: string,
): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    throw new Error("Date must be YYYY-MM-DD");
  }

  const year = Number(dateOnly.slice(0, 4));
  const month = Number(dateOnly.slice(5, 7));
  const day = Number(dateOnly.slice(8, 10));

  let utc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  utc = new Date(utc.getTime() - getTimeZoneOffsetMs(utc, timeZone));
  utc = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) -
      getTimeZoneOffsetMs(utc, timeZone),
  );
  return utc;
}

export function todayDateOnlyInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Inclusive calendar range in the org timezone, queried as half-open
 * [start, endExclusive) in UTC so day boundaries stay consistent.
 */
export function resolveReportWindow(params: {
  timeZone: string;
  fromDate?: string | null;
  toDate?: string | null;
  defaultDays?: number;
}): { fromDate: string; toDate: string; start: Date; endExclusive: Date } {
  const timeZone = params.timeZone || "Asia/Bangkok";
  const defaultDays = params.defaultDays ?? 30;
  const toDate = params.toDate?.trim() || todayDateOnlyInTimeZone(timeZone);

  let fromDate = params.fromDate?.trim() || "";
  if (!fromDate) {
    const endLocal = parseDateOnlyInTimeZone(toDate, timeZone);
    const startGuess = new Date(
      endLocal.getTime() - (defaultDays - 1) * 86_400_000,
    );
    fromDate = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(startGuess);
  }

  const start = parseDateOnlyInTimeZone(fromDate, timeZone);
  const endDay = parseDateOnlyInTimeZone(toDate, timeZone);
  const endExclusive = new Date(endDay.getTime() + 86_400_000);

  if (endExclusive <= start) {
    throw new Error("Report end date must be on or after start date");
  }

  return { fromDate, toDate, start, endExclusive };
}

export function percentOf(
  numerator: Decimal.Value,
  denominator: Decimal.Value,
) {
  const den = new Decimal(denominator);
  if (den.eq(0)) return new Decimal(0);
  return new Decimal(numerator).mul(100).div(den).toDecimalPlaces(2);
}
