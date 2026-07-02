const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const ApiError = require('../utils/ApiError');

// GET /api/tables  (any authenticated user)
// Customers only see active tables (what they can actually book).
// Admins see every table, including deactivated ones, so they can manage them.
exports.listTables = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { isActive: true };
    const tables = await Table.find(filter).sort({ label: 1 });
    res.status(200).json({ tables });
  } catch (err) {
    next(err);
  }
};

// POST /api/tables  (admin only)
exports.createTable = async (req, res, next) => {
  try {
    const { label, capacity } = req.body;
    const table = await Table.create({ label, capacity });
    res.status(201).json({ table });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tables/:id  (admin only)
exports.updateTable = async (req, res, next) => {
  try {
    const { label, capacity, isActive } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) throw new ApiError(404, 'Table not found');

    if (label !== undefined) table.label = label;
    if (capacity !== undefined) table.capacity = capacity;
    if (isActive !== undefined) table.isActive = isActive;

    await table.save();
    res.status(200).json({ table });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tables/:id  (admin only)
exports.deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) throw new ApiError(404, 'Table not found');

    // Check if table has any active/confirmed reservations
    const activeReservations = await Reservation.countDocuments({
      table: req.params.id,
      status: 'confirmed',
    });

    if (activeReservations > 0) {
      throw new ApiError(
        400,
        `Cannot delete table with ${activeReservations} active reservation(s). Please cancel them first or deactivate the table instead.`
      );
    }

    await table.deleteOne();
    res.status(200).json({ message: 'Table deleted successfully' });
  } catch (err) {
    next(err);
  }
};
