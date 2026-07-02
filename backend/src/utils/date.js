const normalizeDate = (input) => {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const isPastDate = (date) => {
  const today = normalizeDate(new Date());
  return date.getTime() < today.getTime();
};

module.exports = { normalizeDate, isPastDate };