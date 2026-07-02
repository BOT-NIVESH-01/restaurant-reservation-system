require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Table = require('../models/Table');
const User = require('../models/User');

const TABLES = [
  { label: 'T1', capacity: 2 },
  { label: 'T2', capacity: 2 },
  { label: 'T3', capacity: 4 },
  { label: 'T4', capacity: 4 },
  { label: 'T5', capacity: 6 },
  { label: 'T6', capacity: 8 },
];

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Table.deleteMany({});
    await User.deleteMany({});

    console.log('Cleared existing tables and users.');

    // Insert fresh tables
    await Table.insertMany(TABLES);
    console.log(`Seeded ${TABLES.length} tables.`);

    const adminEmail =
      process.env.SEED_ADMIN_EMAIL || 'admin@restaurant.com';
    const adminPassword =
      process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

    // Create fresh admin
    await User.create({
      name: 'Restaurant Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    console.log(`Seeded admin: ${adminEmail}`);

    console.log('Database seeded successfully.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();