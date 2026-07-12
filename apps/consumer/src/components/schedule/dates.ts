/** Next N calendar occurrences of a given weekday (0=Sun), starting tomorrow. */
export function nextServiceDates(serviceDay: number, count = 4): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  let guard = 0;
  while (out.length < count && guard < 60) {
    guard++;
    d.setDate(d.getDate() + 1);
    if (d.getDay() === serviceDay) out.push(new Date(d));
  }
  return out;
}
