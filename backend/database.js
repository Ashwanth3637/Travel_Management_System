require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Mongoose Connection ──────────────────────────────────────────────────────

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log('✅ Connected to MongoDB Atlas');
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'admin' },
  name:     { type: String, required: true }
}, { timestamps: true });

const VehicleSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  plateNumber: { type: String, required: true },
  type:        { type: String, required: true },
  acpreference:{ type: String, default: 'AC' },
  capacity:    { type: Number, required: true },
  status:      { type: String, default: 'Available' },
  ratePerKm:   { type: Number, required: true }
}, { timestamps: true });

const DriverSchema = new mongoose.Schema({
  id:            { type: String, required: true, unique: true },
  name:          { type: String, required: true },
  phone:         { type: String, required: true },
  licenseNumber: { type: String, required: true },
  email:         { type: String },
  password:      { type: String },
  status:        { type: String, default: 'Available' }
}, { timestamps: true });

const BookingSchema = new mongoose.Schema({
  id:                { type: String, required: true, unique: true },
  customerName:      { type: String, required: true },
  pickupLocation:    { type: String, required: true },
  dropLocation:      { type: String, required: true },
  pickupDateTime:    { type: String, required: true },
  vehicleType:       { type: String, required: true },
  status:            { type: String, default: 'Pending' },
  assignedVehicleId: { type: String, default: null },
  assignedDriverId:  { type: String, default: null },
  notes:             { type: String, default: '' },
  fareEstimated:     { type: Number, default: 0 },
  createdAt:         { type: String }
});

const CustomerSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  phone:    { type: String, required: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'customer' }
}, { timestamps: true });

// ─── Models (guard re-compile) ────────────────────────────────────────────────

const User     = mongoose.models.User     || mongoose.model('User',     UserSchema);
const Vehicle  = mongoose.models.Vehicle  || mongoose.model('Vehicle',  VehicleSchema);
const Driver   = mongoose.models.Driver   || mongoose.model('Driver',   DriverSchema);
const Booking  = mongoose.models.Booking  || mongoose.model('Booking',  BookingSchema);
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

// ─── Seed default data (only if collections empty) ───────────────────────────

async function seedIfEmpty() {
  await connectDB();

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    await User.create({ id: 'u1', email: 'admin@travels.com', password: hash, role: 'admin', name: 'Super Admin' });
    console.log('🌱 Seeded admin user');
  }

  const vehicleCount = await Vehicle.countDocuments();
  if (vehicleCount === 0) {
    await Vehicle.insertMany([
      { id: 'v1', name: 'Swift Dzire',     plateNumber: 'TN-37-AB-1234', type: 'Sedan',   acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12 },
      { id: 'v2', name: 'Innova Crysta',   plateNumber: 'TN-37-CD-5678', type: 'SUV',     acpreference: 'AC', capacity: 7,  status: 'Available', ratePerKm: 18 },
      { id: 'v3', name: 'Tempo Traveller', plateNumber: 'TN-37-EF-9012', type: 'Minivan', acpreference: 'AC', capacity: 12, status: 'Available', ratePerKm: 25 }
    ]);
    console.log('🌱 Seeded vehicles');
  }

  const driverCount = await Driver.countDocuments();
  if (driverCount === 0) {
    const hash = bcrypt.hashSync('driver123', 10);
    await Driver.insertMany([
      { id: 'd1', name: 'Rajesh Kumar', email: 'rajesh@travels.com', password: hash, phone: '+91 9876543210', licenseNumber: 'DL-12345TN', status: 'Available' },
      { id: 'd2', name: 'Priya Sharma', email: 'priya@travels.com',  password: hash, phone: '+91 9876543211', licenseNumber: 'DL-67890TN', status: 'Available' },
      { id: 'd3', name: 'Ramesh Patel', email: 'ramesh@travels.com', password: hash, phone: '+91 9876543212', licenseNumber: 'DL-54321TN', status: 'Available' }
    ]);
    console.log('🌱 Seeded drivers');
  }
}

// ─── Helper: serialize mongoose doc to plain object ──────────────────────────

function toPlain(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
}

// ─── DB API (all async) ───────────────────────────────────────────────────────

module.exports = {
  connectDB,
  seedIfEmpty,

  // Users
  getUsers: async () => {
    await connectDB();
    const docs = await User.find({});
    return docs.map(toPlain);
  },

  // Vehicles
  getVehicles: async () => {
    await connectDB();
    const docs = await Vehicle.find({});
    return docs.map(toPlain);
  },
  addVehicle: async (vehicle) => {
    await connectDB();
    const doc = await Vehicle.create(vehicle);
    return toPlain(doc);
  },
  updateVehicle: async (id, fields) => {
    await connectDB();
    const doc = await Vehicle.findOneAndUpdate({ id }, fields, { new: true });
    return toPlain(doc);
  },
  deleteVehicle: async (id) => {
    await connectDB();
    await Vehicle.deleteOne({ id });
    return true;
  },

  // Drivers
  getDrivers: async () => {
    await connectDB();
    const docs = await Driver.find({});
    return docs.map(toPlain);
  },
  addDriver: async (driver) => {
    await connectDB();
    const doc = await Driver.create(driver);
    return toPlain(doc);
  },
  updateDriver: async (id, fields) => {
    await connectDB();
    const doc = await Driver.findOneAndUpdate({ id }, fields, { new: true });
    return toPlain(doc);
  },
  deleteDriver: async (id) => {
    await connectDB();
    await Driver.deleteOne({ id });
    return true;
  },

  // Bookings
  getBookings: async () => {
    await connectDB();
    const docs = await Booking.find({});
    return docs.map(toPlain);
  },
  addBooking: async (booking) => {
    await connectDB();
    const doc = await Booking.create(booking);
    return toPlain(doc);
  },
  updateBooking: async (id, fields) => {
    await connectDB();

    const old = await Booking.findOne({ id });
    if (!old) return null;

    const newStatus = fields.status || old.status;

    // Release resources on completion/cancellation
    if (newStatus === 'Completed' || newStatus === 'Cancelled') {
      const vehicleId = fields.assignedVehicleId || old.assignedVehicleId;
      const driverId  = fields.assignedDriverId  || old.assignedDriverId;
      if (vehicleId) await Vehicle.findOneAndUpdate({ id: vehicleId }, { status: 'Available' });
      if (driverId)  await Driver.findOneAndUpdate({ id: driverId },   { status: 'Available' });
    }

    // Mark as assigned on confirmation
    if (newStatus === 'Confirmed') {
      const vehicleId = fields.assignedVehicleId || old.assignedVehicleId;
      const driverId  = fields.assignedDriverId  || old.assignedDriverId;
      if (vehicleId) await Vehicle.findOneAndUpdate({ id: vehicleId }, { status: 'Assigned' });
      if (driverId)  await Driver.findOneAndUpdate({ id: driverId },   { status: 'Assigned' });
    }

    // Mark as on trip when In Progress
    if (newStatus === 'In Progress') {
      const vehicleId = fields.assignedVehicleId || old.assignedVehicleId;
      const driverId  = fields.assignedDriverId  || old.assignedDriverId;
      if (vehicleId) await Vehicle.findOneAndUpdate({ id: vehicleId }, { status: 'Assigned' });
      if (driverId)  await Driver.findOneAndUpdate({ id: driverId },   { status: 'On Trip' });
    }

    const doc = await Booking.findOneAndUpdate({ id }, fields, { new: true });
    return toPlain(doc);
  },

  // Customers
  getCustomers: async () => {
    await connectDB();
    const docs = await Customer.find({});
    return docs.map(toPlain);
  },
  addCustomer: async (customer) => {
    await connectDB();
    const doc = await Customer.create(customer);
    return toPlain(doc);
  }
};
