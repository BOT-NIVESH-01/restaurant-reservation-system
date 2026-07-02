const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const ApiError = require('../utils/ApiError');
const { normalizeDate, isPastDate } = require('../utils/date');

exports.getAllReservations = async (req, res, next) => {
  try {
    const { date, status } = req.query;
    const filter = {};

    if (date) {
      const parsed = normalizeDate(date);
      if (!parsed) throw new ApiError(400, 'Invalid date format');
      filter.reservationDate = parsed;
    }
    if (status) {
      if (!['confirmed', 'cancelled'].includes(status)) {
        throw new ApiError(400, 'status must be confirmed or cancelled');
      }
      filter.status = status;
    }

    const reservations = await Reservation.find(filter)
      .populate('table', 'label capacity')
      .populate('user', 'name email')
      .sort({ reservationDate: 1, timeSlot: 1 });

    res.status(200).json({ count: reservations.length, reservations });
  } catch (err) {
    next(err);
  }
};

exports.updateReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new ApiError(404, 'Reservation not found');

    const { tableId, reservationDate: rawDate, timeSlot, guests, status } = req.body;

    const nextTableId = tableId || String(reservation.table);
    const nextDate = rawDate ? normalizeDate(rawDate) : reservation.reservationDate;
    const nextSlot = timeSlot || reservation.timeSlot;
    const nextGuests = guests !== undefined ? Number(guests) : reservation.guests;

    if (rawDate && !nextDate) throw new ApiError(400, 'Invalid reservationDate');
    if (rawDate && isPastDate(nextDate)) {
      throw new ApiError(400, 'Cannot move a reservation to a past date');
    }
    if (timeSlot && !Reservation.TIME_SLOTS.includes(timeSlot)) {
      throw new ApiError(400, `timeSlot must be one of: ${Reservation.TIME_SLOTS.join(', ')}`);
    }

    const table = await Table.findById(nextTableId);
    if (!table) throw new ApiError(404, 'Table not found');
    if (nextGuests > table.capacity) {
      throw new ApiError(400, `Table ${table.label} seats up to ${table.capacity} guests`);
    }

    const somethingMoved =
      String(table._id) !== String(reservation.table) ||
      nextDate.getTime() !== reservation.reservationDate.getTime() ||
      nextSlot !== reservation.timeSlot;

    if (somethingMoved && (status || reservation.status) !== 'cancelled') {
      const conflict = await Reservation.findOne({
        _id: { $ne: reservation._id },
        table: table._id,
        reservationDate: nextDate,
        timeSlot: nextSlot,
        status: 'confirmed',
      });
      if (conflict) {
        throw new ApiError(409, 'Target table is already booked for that date and time slot');
      }
    }

    reservation.table = table._id;
    reservation.reservationDate = nextDate;
    reservation.timeSlot = nextSlot;
    reservation.guests = nextGuests;
    if (status) {
      if (!['confirmed', 'cancelled'].includes(status)) {
        throw new ApiError(400, 'status must be confirmed or cancelled');
      }
      reservation.status = status;
    }

    await reservation.save();
    const populated = await reservation.populate([
      { path: 'table', select: 'label capacity' },
      { path: 'user', select: 'name email' },
    ]);

    res.status(200).json({ reservation: populated });
  } catch (err) {
    if (err.code === 11000) {
      return next(new ApiError(409, 'Target table is already booked for that date and time slot'));
    }
    next(err);
  }
};

exports.cancelAnyReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new ApiError(404, 'Reservation not found');

    reservation.status = 'cancelled';
    await reservation.save();

    res.status(200).json({ reservation });
  } catch (err) {
    next(err);
  }
};