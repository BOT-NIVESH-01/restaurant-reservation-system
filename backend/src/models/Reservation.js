const mongoose = require('mongoose');

// Fixed set of bookable time slots. Using fixed slots (rather than free-form
// start/end times) keeps the overlap-detection logic simple and unambiguous:
// two reservations conflict only if they share the same table, same date,
// and the same slot.
const TIME_SLOTS = [
  '12:00-13:30',
  '13:30-15:00',
  '18:00-19:30',
  '19:30-21:00',
  '21:00-22:30',
];

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    // Stored as a UTC midnight Date representing the calendar day only.
    reservationDate: {
      type: Date,
      required: [true, 'Reservation date is required'],
    },
    timeSlot: {
      type: String,
      enum: TIME_SLOTS,
      required: [true, 'Time slot is required'],
    },
    guests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'Guests must be at least 1'],
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

// Application-level conflict checks are the primary safeguard (see
// reservationController). This partial unique index is a database-level
// safety net that prevents two *confirmed* reservations from ever existing
// for the same table + date + slot, even under concurrent requests.
reservationSchema.index(
  { table: 1, reservationDate: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } }
);

reservationSchema.statics.TIME_SLOTS = TIME_SLOTS;

module.exports = mongoose.model('Reservation', reservationSchema);