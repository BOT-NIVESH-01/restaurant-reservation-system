const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllReservations,
  updateReservation,
  cancelAnyReservation,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/reservations', getAllReservations);
router.patch('/reservations/:id', updateReservation);
router.patch('/reservations/:id/cancel', cancelAnyReservation);

module.exports = router;