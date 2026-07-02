const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  listTables,
  createTable,
  updateTable,
  deleteTable,
} = require('../controllers/tableController');

const router = express.Router();

router.use(protect);

router.get('/', listTables);

router.post(
  '/',
  authorize('admin'),
  [
    body('label').trim().notEmpty().withMessage('Table label is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  ],
  validate,
  createTable
);

router.patch('/:id', authorize('admin'), updateTable);
router.delete('/:id', authorize('admin'), deleteTable);

module.exports = router;