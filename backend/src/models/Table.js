const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Table label is required'],
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Table capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true, // allows admins to retire a table without deleting history
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);