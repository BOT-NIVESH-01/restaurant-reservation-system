const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  getAvailability,
  createReservation,
  getMyReservations,
  cancelMyReservation,
} = require('../controllers/reservationController');

const router = express.Router();

router.use(protect);

router.get('/availability', getAvailability);

router.post(
  '/',
  [
    body('tableId').notEmpty().withMessage('tableId is required'),
    body('reservationDate').notEmpty().withMessage('reservationDate is required'),
    body('timeSlot').notEmpty().withMessage('timeSlot is required'),
    body('guests').isInt({ min: 1 }).withMessage('guests must be a positive integer'),
  ],
  validate,
  createReservation
);

router.get('/me', getMyReservations);
router.patch('/:id/cancel', cancelMyReservation);

module.exports = router;