require('dotenv').config();
const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  plateNumber: { type: String, required: true },
  type:        { type: String, required: true },
  acpreference:{ type: String, default: 'AC' },
  capacity:    { type: Number, required: true },
  status:      { type: String, default: 'Available' },
  ratePerKm:   { type: Number, required: true },
  image:       { type: String, default: '' }
}, { timestamps: true });

const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);

const ALL_VEHICLES = [
  { id: 'v1',  name: 'Swift Dzire',     plateNumber: 'TN-37-AB-1234', type: 'Sedan',   acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/swift_dzire.png' },
  { id: 'vs2', name: 'Vitara Breeza',   plateNumber: 'TN-38-AB-2345', type: 'Sedan',   acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/vitara_brezza.png' },
  { id: 'vs3', name: 'WagonR',          plateNumber: 'TN-39-AB-3456', type: 'Sedan',   acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 11, image: '/cars/sedan/wagonr.png' },
  { id: 'vs4', name: 'Baleno',          plateNumber: 'TN-40-AB-4567', type: 'Sedan',   acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/suzuki_baleno.png' },
  { id: 'vs5', name: 'Hyundai Aura',    plateNumber: 'TN-41-AB-5678', type: 'Sedan',   acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 12, image: '/cars/sedan/hyundai_aura.png' },
  { id: 'v2',  name: 'Innova Crysta',   plateNumber: 'TN-37-CD-5678', type: 'SUV',     acpreference: 'AC', capacity: 7,  status: 'Available', ratePerKm: 18, image: '/cars/suv/innova_crysta.png' },
  { id: 'vu2', name: 'Mahindra Thar',   plateNumber: 'TN-38-CD-6789', type: 'SUV',     acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 20, image: '/cars/suv/mahindra_thar.png' },
  { id: 'vu3', name: 'Bolero',          plateNumber: 'TN-39-CD-7890', type: 'SUV',     acpreference: 'AC', capacity: 7,  status: 'Available', ratePerKm: 17, image: '/cars/suv/bolero.png' },
  { id: 'vu4', name: 'Mahindra Scorpio',plateNumber: 'TN-40-CD-8901', type: 'SUV',     acpreference: 'AC', capacity: 7,  status: 'Available', ratePerKm: 19, image: '/cars/suv/mahindra_scorpio.png' },
  { id: 'vl1', name: 'BMW',             plateNumber: 'TN-37-LX-1111', type: 'Luxury',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 35, image: '/cars/luxury/bmw.png' },
  { id: 'vl2', name: 'Audi',            plateNumber: 'TN-38-LX-2222', type: 'Luxury',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 38, image: '/cars/luxury/audi.png' },
  { id: 'vl3', name: 'Mercedes Benz',   plateNumber: 'TN-39-LX-3333', type: 'Luxury',  acpreference: 'AC', capacity: 4,  status: 'Available', ratePerKm: 40, image: '/cars/luxury/benz.png' },
  { id: 'v3',  name: 'Tempo Traveller', plateNumber: 'TN-37-EF-9012', type: 'Minivan', acpreference: 'AC', capacity: 12, status: 'Available', ratePerKm: 25, image: '/cars/minivan/tempo_traveller.png' },
  { id: 'vm2', name: 'Force Urbania',   plateNumber: 'TN-38-EF-0123', type: 'Minivan', acpreference: 'AC', capacity: 10, status: 'Available', ratePerKm: 28, image: '/cars/minivan/force_urbania.png' }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');
  let added = 0, skipped = 0;
  for (const v of ALL_VEHICLES) {
    const exists = await Vehicle.findOne({ id: v.id });
    if (!exists) {
      await Vehicle.create(v);
      console.log('  Added: ' + v.name + ' (' + v.type + ')');
      added++;
    } else {
      console.log('  Skipped: ' + v.name);
      skipped++;
    }
  }
  console.log('Done! Added: ' + added + ', Skipped: ' + skipped);
  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
