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
  id:                 { type: String, required: true, unique: true },
  name:               { type: String, required: true },
  plateNumber:        { type: String, required: true },
  vehicleNumber:      { type: String, default: '' },
  type:               { type: String, required: true }, // Vehicle Category
  vehicleType:        { type: String, default: 'AC' },  // E.g. AC, Non-AC, Sleeper
  brand:              { type: String, default: '' },
  model:              { type: String, default: '' },
  acpreference:       { type: String, default: 'AC' },
  capacity:           { type: Number, required: true },
  fuelType:           { type: String, default: 'Petrol' },
  status:             { type: String, default: 'Available' }, // Available, Assigned, On Trip, Under Maintenance, Inactive
  availability:       { type: Boolean, default: true },
  registrationDetails:{ type: String, default: '' },
  insuranceDetails:   { type: String, default: '' },
  ratePerKm:          { type: Number, required: true },
  image:              { type: String, default: '' }
}, { timestamps: true });

const DriverSchema = new mongoose.Schema({
  id:            { type: String, required: true, unique: true },
  name:          { type: String, required: true },
  phone:         { type: String, required: true },
  licenseNumber: { type: String, required: true },
  email:         { type: String },
  password:      { type: String },
  photo:         { type: String, default: '' },
  gender:        { type: String, default: 'Male' },
  status:        { type: String, default: 'Available' }
}, { timestamps: true });

const BookingSchema = new mongoose.Schema({
  id:                 { type: String, required: true, unique: true },
  customerName:       { type: String, required: true },
  customerContact:    { type: String, default: '' },
  bookingDate:        { type: String, default: '' },
  travelDate:         { type: String, default: '' },
  travelTime:         { type: String, default: '' },
  pickupLocation:     { type: String, required: true },
  dropLocation:       { type: String, required: true },
  pickupDateTime:     { type: String, required: true },
  vehicleType:        { type: String, required: true },
  passengersCount:    { type: Number, default: 1 },
  tripType:           { type: String, default: 'One Way' },
  specialRequirements:{ type: String, default: '' },
  status:             { type: String, default: 'Pending' },
  assignedVehicleId:  { type: String, default: null },
  assignedDriverId:   { type: String, default: null },
  notes:              { type: String, default: '' },
  fareEstimated:      { type: Number, default: 0 },
  createdAt:          { type: String },
  rating:             { type: Number, default: 0 },
  feedback:           { type: String, default: '' },
  feedbackDate:       { type: Date }
});

const CustomerSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  phone:    { type: String, required: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'customer' }
}, { timestamps: true });

const QuerySchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  phone:     { type: String, required: true },
  message:   { type: String, required: true },
  status:    { type: String, default: 'Pending' },
  createdAt: { type: String, default: () => new Date().toLocaleString() }
});

// ─── Models (guard re-compile) ────────────────────────────────────────────────

const User     = mongoose.models.User     || mongoose.model('User',     UserSchema);
const Driver   = mongoose.models.Driver   || mongoose.model('Driver',   DriverSchema);
const Booking  = mongoose.models.Booking  || mongoose.model('Booking',  BookingSchema);
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
const Query    = mongoose.models.Query    || mongoose.model('Query',    QuerySchema);

// Separate vehicle collections per category
const SeданModel  = mongoose.models.Sedan    || mongoose.model('Sedan',    VehicleSchema, 'sedans');
const SuvModel    = mongoose.models.Suv      || mongoose.model('Suv',      VehicleSchema, 'suvs');
const LuxuryModel = mongoose.models.Luxury   || mongoose.model('Luxury',   VehicleSchema, 'luxuries');
const MinivanModel= mongoose.models.Minivan  || mongoose.model('Minivan',  VehicleSchema, 'minivans');

// Helper: pick the right model based on vehicle type
function vehicleModel(type) {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t === 'sedan')   return SeданModel;
  if (t === 'suv')     return SuvModel;
  if (t === 'luxury')  return LuxuryModel;
  if (t === 'minivan') return MinivanModel;
  return null;
}

const ALL_VEHICLE_MODELS = [SeданModel, SuvModel, LuxuryModel, MinivanModel];


// ─── Seed default data (only if collections empty) ───────────────────────────

async function seedIfEmpty() {
  await connectDB();

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    await User.create({ id: 'u1', email: 'admin@travels.com', password: hash, role: 'admin', name: 'Super Admin' });
    console.log('🌱 Seeded admin user');
  }

  // Clear collections to ensure database seeds re-sync with sequential IDs v1, v2, ...
  for (const Model of ALL_VEHICLE_MODELS) {
    await Model.deleteMany({});
  }

  // Seed sedans — 2 units per model
  await SeданModel.insertMany([
    { id: 'sv1',  name: 'Swift Dzire',   plateNumber: 'TN-37-AB-1001', type: 'Sedan',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/swift_dzire.png',    vehicleNumber: 'TN-37-AB-1001', vehicleType: 'AC', brand: 'Maruti Suzuki', model: 'Swift Dzire' },
    { id: 'sv2',  name: 'Swift Dzire',   plateNumber: 'TN-37-AB-1002', type: 'Sedan',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/swift_dzire.png',    vehicleNumber: 'TN-37-AB-1002', vehicleType: 'AC', brand: 'Maruti Suzuki', model: 'Swift Dzire' },
    { id: 'sv3',  name: 'Vitara Brezza', plateNumber: 'TN-38-AB-1003', type: 'Sedan',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/vitara_brezza.png',  vehicleNumber: 'TN-38-AB-1003', vehicleType: 'AC', brand: 'Maruti Suzuki', model: 'Vitara Brezza' },
    { id: 'sv4',  name: 'Vitara Brezza', plateNumber: 'TN-38-AB-1004', type: 'Sedan',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/vitara_brezza.png',  vehicleNumber: 'TN-38-AB-1004', vehicleType: 'AC', brand: 'Maruti Suzuki', model: 'Vitara Brezza' },
    { id: 'sv5',  name: 'WagonR',        plateNumber: 'TN-39-AB-1005', type: 'Sedan',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 11, image: '/cars/sedan/wagonr.png',         vehicleNumber: 'TN-39-AB-1005', vehicleType: 'AC', brand: 'Maruti Suzuki', model: 'WagonR' },
    { id: 'sv6',  name: 'WagonR',        plateNumber: 'TN-39-AB-1006', type: 'Sedan',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 11, image: '/cars/sedan/wagonr.png',         vehicleNumber: 'TN-39-AB-1006', vehicleType: 'AC', brand: 'Maruti Suzuki', model: 'WagonR' },
    { id: 'sv7',  name: 'Baleno',        plateNumber: 'TN-40-AB-1007', type: 'Sedan',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/suzuki_baleno.png',  vehicleNumber: 'TN-40-AB-1007', vehicleType: 'AC', brand: 'Maruti Suzuki', model: 'Baleno' },
    { id: 'sv8',  name: 'Baleno',        plateNumber: 'TN-40-AB-1008', type: 'Sedan',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/suzuki_baleno.png',  vehicleNumber: 'TN-40-AB-1008', vehicleType: 'AC', brand: 'Maruti Suzuki', model: 'Baleno' },
    { id: 'sv9',  name: 'Hyundai Aura',  plateNumber: 'TN-41-AB-1009', type: 'Sedan',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/hyundai_aura.png',   vehicleNumber: 'TN-41-AB-1009', vehicleType: 'AC', brand: 'Hyundai', model: 'Aura' },
    { id: 'sv10', name: 'Hyundai Aura',  plateNumber: 'TN-41-AB-1010', type: 'Sedan',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/hyundai_aura.png',   vehicleNumber: 'TN-41-AB-1010', vehicleType: 'AC', brand: 'Hyundai', model: 'Aura' }
  ]);
  console.log('🌱 Seeded sedans collection');

  // Seed SUVs — 2 units per model
  await SuvModel.insertMany([
    { id: 'uv1',  name: 'Innova Crysta',    plateNumber: 'TN-37-CD-2001', type: 'SUV', acpreference: 'AC', capacity: 7, status: 'Available', ratePerKm: 18, image: '/cars/suv/innova_crysta.png',    vehicleNumber: 'TN-37-CD-2001', vehicleType: 'AC', brand: 'Toyota',   model: 'Innova Crysta' },
    { id: 'uv2',  name: 'Innova Crysta',    plateNumber: 'TN-37-CD-2002', type: 'SUV', acpreference: 'AC', capacity: 7, status: 'Available', ratePerKm: 18, image: '/cars/suv/innova_crysta.png',    vehicleNumber: 'TN-37-CD-2002', vehicleType: 'AC', brand: 'Toyota',   model: 'Innova Crysta' },
    { id: 'uv3',  name: 'Mahindra Thar',    plateNumber: 'TN-38-CD-2003', type: 'SUV', acpreference: 'AC', capacity: 4, status: 'Available', ratePerKm: 20, image: '/cars/suv/mahindra_thar.png',    vehicleNumber: 'TN-38-CD-2003', vehicleType: 'AC', brand: 'Mahindra', model: 'Thar' },
    { id: 'uv4',  name: 'Mahindra Thar',    plateNumber: 'TN-38-CD-2004', type: 'SUV', acpreference: 'AC', capacity: 4, status: 'Available', ratePerKm: 20, image: '/cars/suv/mahindra_thar.png',    vehicleNumber: 'TN-38-CD-2004', vehicleType: 'AC', brand: 'Mahindra', model: 'Thar' },
    { id: 'uv5',  name: 'Bolero',           plateNumber: 'TN-39-CD-2005', type: 'SUV', acpreference: 'AC', capacity: 7, status: 'Available', ratePerKm: 17, image: '/cars/suv/bolero.png',           vehicleNumber: 'TN-39-CD-2005', vehicleType: 'AC', brand: 'Mahindra', model: 'Bolero' },
    { id: 'uv6',  name: 'Bolero',           plateNumber: 'TN-39-CD-2006', type: 'SUV', acpreference: 'AC', capacity: 7, status: 'Available', ratePerKm: 17, image: '/cars/suv/bolero.png',           vehicleNumber: 'TN-39-CD-2006', vehicleType: 'AC', brand: 'Mahindra', model: 'Bolero' },
    { id: 'uv7',  name: 'Mahindra Scorpio', plateNumber: 'TN-40-CD-2007', type: 'SUV', acpreference: 'AC', capacity: 7, status: 'Available', ratePerKm: 19, image: '/cars/suv/mahindra_scorpio.png', vehicleNumber: 'TN-40-CD-2007', vehicleType: 'AC', brand: 'Mahindra', model: 'Scorpio' },
    { id: 'uv8',  name: 'Mahindra Scorpio', plateNumber: 'TN-40-CD-2008', type: 'SUV', acpreference: 'AC', capacity: 7, status: 'Available', ratePerKm: 19, image: '/cars/suv/mahindra_scorpio.png', vehicleNumber: 'TN-40-CD-2008', vehicleType: 'AC', brand: 'Mahindra', model: 'Scorpio' },
    { id: 'uv9',  name: 'Mahindra XUV700',  plateNumber: 'TN-41-CD-2009', type: 'SUV', acpreference: 'AC', capacity: 7, status: 'Available', ratePerKm: 21, image: '/cars/suv/mahindra_xuv700.png',  vehicleNumber: 'TN-41-CD-2009', vehicleType: 'AC', brand: 'Mahindra', model: 'XUV700' },
    { id: 'uv10', name: 'Mahindra XUV700',  plateNumber: 'TN-41-CD-2010', type: 'SUV', acpreference: 'AC', capacity: 7, status: 'Available', ratePerKm: 21, image: '/cars/suv/mahindra_xuv700.png',  vehicleNumber: 'TN-41-CD-2010', vehicleType: 'AC', brand: 'Mahindra', model: 'XUV700' }
  ]);
  console.log('🌱 Seeded suvs collection');

  // Seed Luxuries — 2 units per model
  await LuxuryModel.insertMany([
    { id: 'lv1', name: 'BMW',           plateNumber: 'TN-37-LX-3001', type: 'Luxury', acpreference: 'AC', capacity: 4, status: 'Available', ratePerKm: 35, image: '/cars/luxury/bmw.png',  vehicleNumber: 'TN-37-LX-3001', vehicleType: 'AC', brand: 'BMW',           model: '5 Series' },
    { id: 'lv2', name: 'BMW',           plateNumber: 'TN-37-LX-3002', type: 'Luxury', acpreference: 'AC', capacity: 4, status: 'Available', ratePerKm: 35, image: '/cars/luxury/bmw.png',  vehicleNumber: 'TN-37-LX-3002', vehicleType: 'AC', brand: 'BMW',           model: '5 Series' },
    { id: 'lv3', name: 'Audi',          plateNumber: 'TN-38-LX-3003', type: 'Luxury', acpreference: 'AC', capacity: 4, status: 'Available', ratePerKm: 38, image: '/cars/luxury/audi.png', vehicleNumber: 'TN-38-LX-3003', vehicleType: 'AC', brand: 'Audi',          model: 'A6' },
    { id: 'lv4', name: 'Audi',          plateNumber: 'TN-38-LX-3004', type: 'Luxury', acpreference: 'AC', capacity: 4, status: 'Available', ratePerKm: 38, image: '/cars/luxury/audi.png', vehicleNumber: 'TN-38-LX-3004', vehicleType: 'AC', brand: 'Audi',          model: 'A6' },
    { id: 'lv5', name: 'Mercedes Benz', plateNumber: 'TN-39-LX-3005', type: 'Luxury', acpreference: 'AC', capacity: 4, status: 'Available', ratePerKm: 40, image: '/cars/luxury/benz.png', vehicleNumber: 'TN-39-LX-3005', vehicleType: 'AC', brand: 'Mercedes Benz', model: 'E-Class' },
    { id: 'lv6', name: 'Mercedes Benz', plateNumber: 'TN-39-LX-3006', type: 'Luxury', acpreference: 'AC', capacity: 4, status: 'Available', ratePerKm: 40, image: '/cars/luxury/benz.png', vehicleNumber: 'TN-39-LX-3006', vehicleType: 'AC', brand: 'Mercedes Benz', model: 'E-Class' }
  ]);
  console.log('🌱 Seeded luxuries collection');

  // Seed Minivans — 2 units per model
  await MinivanModel.insertMany([
    { id: 'mv1', name: 'Tempo Traveller', plateNumber: 'TN-37-EF-4001', type: 'Minivan', acpreference: 'AC', capacity: 12, status: 'Available', ratePerKm: 25, image: '/cars/minivan/tempo_traveller.png', vehicleNumber: 'TN-37-EF-4001', vehicleType: 'AC', brand: 'Force', model: 'Tempo Traveller' },
    { id: 'mv2', name: 'Tempo Traveller', plateNumber: 'TN-37-EF-4002', type: 'Minivan', acpreference: 'AC', capacity: 12, status: 'Available', ratePerKm: 25, image: '/cars/minivan/tempo_traveller.png', vehicleNumber: 'TN-37-EF-4002', vehicleType: 'AC', brand: 'Force', model: 'Tempo Traveller' },
    { id: 'mv3', name: 'Force Urbania',   plateNumber: 'TN-38-EF-4003', type: 'Minivan', acpreference: 'AC', capacity: 10, status: 'Available', ratePerKm: 28, image: '/cars/minivan/force_urbania.png',   vehicleNumber: 'TN-38-EF-4003', vehicleType: 'AC', brand: 'Force', model: 'Urbania' },
    { id: 'mv4', name: 'Force Urbania',   plateNumber: 'TN-38-EF-4004', type: 'Minivan', acpreference: 'AC', capacity: 10, status: 'Available', ratePerKm: 28, image: '/cars/minivan/force_urbania.png',   vehicleNumber: 'TN-38-EF-4004', vehicleType: 'AC', brand: 'Force', model: 'Urbania' }
  ]);
  console.log('🌱 Seeded minivans collection');

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

  // Vehicles — routed to separate collections per type
  getVehicles: async () => {
    await connectDB();
    const results = await Promise.all(ALL_VEHICLE_MODELS.map(m => m.find({}).lean()));
    return results.flat().map(toPlain);
  },
  addVehicle: async (vehicle) => {
    await connectDB();
    const Model = vehicleModel(vehicle.type);
    if (!Model) throw new Error('Unknown vehicle type: ' + vehicle.type);
    const doc = await Model.create(vehicle);
    return toPlain(doc);
  },
  updateVehicle: async (id, fields) => {
    await connectDB();
    
    // Find the current vehicle first to check its category
    let existingDoc = null;
    let oldModel = null;
    for (const Model of ALL_VEHICLE_MODELS) {
      const doc = await Model.findOne({ id }).lean();
      if (doc) {
        existingDoc = doc;
        oldModel = Model;
        break;
      }
    }
    
    if (!existingDoc) return null;

    // Check if the category is changing
    const newCategory = fields.type;
    const oldCategory = existingDoc.type;

    if (newCategory && oldCategory && newCategory.toLowerCase() !== oldCategory.toLowerCase()) {
      // 1. Delete from old collection
      await oldModel.deleteOne({ id });

      // 2. Prepare merged fields
      const mergedFields = { ...existingDoc, ...fields };
      
      // 3. Create in new collection
      const NewModel = vehicleModel(newCategory);
      if (!NewModel) throw new Error('Unknown vehicle type: ' + newCategory);
      const newDoc = await NewModel.create(mergedFields);
      return toPlain(newDoc);
    } else {
      // Category is not changing, just perform standard update
      const updatedDoc = await oldModel.findOneAndUpdate({ id }, fields, { new: true });
      return toPlain(updatedDoc);
    }
  },
  deleteVehicle: async (id) => {
    await connectDB();
    for (const Model of ALL_VEHICLE_MODELS) {
      const result = await Model.deleteOne({ id });
      if (result.deletedCount > 0) return true;
    }
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

    // If vehicle assignment changed, release the old vehicle
    if (fields.assignedVehicleId && old.assignedVehicleId && fields.assignedVehicleId !== old.assignedVehicleId) {
      for (const M of ALL_VEHICLE_MODELS) {
        await M.findOneAndUpdate({ id: old.assignedVehicleId }, { status: 'Available' });
      }
    }

    // If driver assignment changed, release the old driver
    if (fields.assignedDriverId && old.assignedDriverId && fields.assignedDriverId !== old.assignedDriverId) {
      await Driver.findOneAndUpdate({ id: old.assignedDriverId }, { status: 'Available' });
    }

    const newStatus = fields.status || old.status;

    // Release resources on completion/cancellation
    if (['Completed', 'Trip Completed', 'Cancelled'].includes(newStatus)) {
      const vehicleId = fields.assignedVehicleId || old.assignedVehicleId;
      const driverId  = fields.assignedDriverId  || old.assignedDriverId;
      if (vehicleId) { for (const M of ALL_VEHICLE_MODELS) { await M.findOneAndUpdate({ id: vehicleId }, { status: 'Available' }); } }
      if (driverId)  await Driver.findOneAndUpdate({ id: driverId }, { status: 'Available' });
    }

    // Mark as assigned on Confirmed, Driver Assigned, Vehicle Assigned, Trip Scheduled
    if (['Confirmed', 'Driver Assigned', 'Vehicle Assigned', 'Trip Scheduled'].includes(newStatus)) {
      const vehicleId = fields.assignedVehicleId || old.assignedVehicleId;
      const driverId  = fields.assignedDriverId  || old.assignedDriverId;
      if (vehicleId) { for (const M of ALL_VEHICLE_MODELS) { await M.findOneAndUpdate({ id: vehicleId }, { status: 'Assigned' }); } }
      if (driverId)  await Driver.findOneAndUpdate({ id: driverId }, { status: 'Assigned' });
    }

    // Mark as on trip / active when Trip Started, Customer Picked Up, Ongoing, Destination Reached
    if (['Trip Started', 'Customer Picked Up', 'Ongoing', 'Destination Reached'].includes(newStatus)) {
      const vehicleId = fields.assignedVehicleId || old.assignedVehicleId;
      const driverId  = fields.assignedDriverId  || old.assignedDriverId;
      if (vehicleId) { for (const M of ALL_VEHICLE_MODELS) { await M.findOneAndUpdate({ id: vehicleId }, { status: 'On Trip' }); } }
      if (driverId)  await Driver.findOneAndUpdate({ id: driverId }, { status: 'On Trip' });
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
  },

  // Queries & Contacts
  getQueries: async () => {
    await connectDB();
    const docs = await Query.find({});
    return docs.map(toPlain);
  },
  addQuery: async (qData) => {
    await connectDB();
    const doc = await Query.create(qData);
    return toPlain(doc);
  },
  resolveQuery: async (id) => {
    await connectDB();
    const doc = await Query.findOneAndUpdate({ id }, { status: 'Resolved' }, { new: true });
    return toPlain(doc);
  }
};
