const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const ApiError = require('../utils/ApiError');
const { normalizeDate, isPastDate } = require('../utils/date');

exports.getAvailability = async (req, res, next) => {
  try {
    const { date, guests } = req.query;
    const reservationDate = normalizeDate(date);
    if (!reservationDate) throw new ApiError(400, 'A valid date is required');

    const partySize = guests ? Number(guests) : 1;
    if (!Number.isInteger(partySize) || partySize < 1) {
      throw new ApiError(400, 'Guests must be a positive integer');
    }

    const tables = await Table.find({ isActive: true, capacity: { $gte: partySize } }).sort({
      capacity: 1,
    });

    const existing = await Reservation.find({
      reservationDate,
      status: 'confirmed',
      table: { $in: tables.map((t) => t._id) },
    }).select('table timeSlot');

    const bookedSet = new Set(existing.map((r) => `${r.table}_${r.timeSlot}`));

    const availability = tables.map((table) => ({
      table: { id: table._id, label: table.label, capacity: table.capacity },
      availableSlots: Reservation.TIME_SLOTS.filter(
        (slot) => !bookedSet.has(`${table._id}_${slot}`)
      ),
    }));

    res.status(200).json({ date: reservationDate, timeSlots: Reservation.TIME_SLOTS, availability });
  } catch (err) {
    next(err);
  }
};

exports.createReservation = async (req, res, next) => {
  try {
    const { tableId, reservationDate: rawDate, timeSlot, guests } = req.body;

    if (!Reservation.TIME_SLOTS.includes(timeSlot)) {
      throw new ApiError(400, `timeSlot must be one of: ${Reservation.TIME_SLOTS.join(', ')}`);
    }

    const reservationDate = normalizeDate(rawDate);
    if (!reservationDate) throw new ApiError(400, 'A valid reservationDate is required');
    if (isPastDate(reservationDate)) throw new ApiError(400, 'Cannot book a reservation in the past');

    const numGuests = Number(guests);
    if (!Number.isInteger(numGuests) || numGuests < 1) {
      throw new ApiError(400, 'Guests must be a positive integer');
    }

    const table = await Table.findById(tableId);
    if (!table || !table.isActive) throw new ApiError(404, 'Selected table is not available');

    if (numGuests > table.capacity) {
      throw new ApiError(
        400,
        `Table ${table.label} seats up to ${table.capacity} guests, which is fewer than ${numGuests}`
      );
    }

    const conflict = await Reservation.findOne({
      table: table._id,
      reservationDate,
      timeSlot,
      status: 'confirmed',
    });
    if (conflict) {
      throw new ApiError(409, 'This table is already booked for the selected date and time slot');
    }

    const reservation = await Reservation.create({
      user: req.user._id,
      table: table._id,
      reservationDate,
      timeSlot,
      guests: numGuests,
    });

    const populated = await reservation.populate('table', 'label capacity');
    res.status(201).json({ reservation: populated });
  } catch (err) {
    if (err.code === 11000) {
      return next(new ApiError(409, 'This table is already booked for the selected date and time slot'));
    }
    next(err);
  }
};

exports.getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('table', 'label capacity')
      .sort({ reservationDate: -1, timeSlot: 1 });
    res.status(200).json({ reservations });
  } catch (err) {
    next(err);
  }
};

exports.cancelMyReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new ApiError(404, 'Reservation not found');

    if (String(reservation.user) !== String(req.user._id)) {
      throw new ApiError(403, 'You can only cancel your own reservations');
    }
    if (reservation.status === 'cancelled') {
      throw new ApiError(400, 'Reservation is already cancelled');
    }

    reservation.status = 'cancelled';
    await reservation.save();

    res.status(200).json({ reservation });
  } catch (err) {
    next(err);
  }
};