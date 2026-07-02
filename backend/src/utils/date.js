// Normalizes any parseable date input to UTC midnight so that reservations
// made for "the same day" always compare equal regardless of the time
// component a client happens to send.
const normalizeDate = (input) => {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// Rejects dates that are in the past (before today, UTC).
const isPastDate = (date) => {
  const today = normalizeDate(new Date());
  return date.getTime() < today.getTime();
};

module.exports = { normalizeDate, isPastDate };