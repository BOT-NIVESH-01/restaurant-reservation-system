const Table = require('../models/Table');
const ApiError = require('../utils/ApiError');

exports.listTables = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { isActive: true };
    const tables = await Table.find(filter).sort({ label: 1 });
    res.status(200).json({ tables });
  } catch (err) {
    next(err);
  }
};

exports.createTable = async (req, res, next) => {
  try {
    const { label, capacity } = req.body;
    const table = await Table.create({ label, capacity });
    res.status(201).json({ table });
  } catch (err) {
    next(err);
  }
};

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

exports.deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) throw new ApiError(404, 'Table not found');
    await table.deleteOne();
    res.status(200).json({ message: 'Table deleted' });
  } catch (err) {
    next(err);
  }
};