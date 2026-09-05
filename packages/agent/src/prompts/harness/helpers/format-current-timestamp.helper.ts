/**
 * The current date/time rendered for model consumption — a stable English
 * format shared by the intent classifier and the tool-execute prompt so both
 * anchor on the same instant phrasing: "Friday, January 3, 2025, 10:30 AM GMT+1".
 */
export function formatCurrentTimestamp(): string {
  return new Date()
    .toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    .replace(' at ', ', ');
}
