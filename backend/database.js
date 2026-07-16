const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'db.json');

// Initialize database with default Admin, Vehicles, Drivers and Bookings
function initDb() {
  if (!fs.existsSync(dbPath)) {
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);

    const defaultData = {
      users: [
        {
          id: 'u1',
          email: 'admin@travels.com',
          password: adminPasswordHash,
          role: 'admin',
          name: 'Super Admin'
        }
      ],
      vehicles: [
        {
          id: 'v1',
          name: 'Swift Dzire',
          plateNumber: 'TN-37-AB-1234',
          type: 'Sedan',
          acpreference: 'AC',
          capacity: 4,
          status: 'Available',
          ratePerKm: 12
        },
        {
          id: 'v2',
          name: 'Innova Crysta',
          plateNumber: 'TN-37-CD-5678',
          type: 'SUV',
          acpreference: 'AC',
          capacity: 7,
          status: 'Available',
          ratePerKm: 18
        },
        {
          id: 'v3',
          name: 'Tempo Traveller',
          plateNumber: 'TN-37-EF-9012',
          type: 'Minivan',
          acpreference: 'AC',
          capacity: 12,
          status: 'Available',
          ratePerKm: 25
        }
      ],
      drivers: [
       {
  id: 'd1',
  name: 'Rajesh Kumar',
  email: 'rajesh@travels.com',
  password: bcrypt.hashSync('driver123', 10),
  phone: '+91 9876543210',
  licenseNumber: 'DL-12345TN',
  status: 'Available'
},
       {
  id: 'd2',
  name: 'Priya Sharma',
  email: 'priya@travels.com',
  password: bcrypt.hashSync('driver123', 10),
  phone: '+91 9876543211',
  licenseNumber: 'DL-67890TN',
  status: 'Available'
},
{
  id: 'd3',
  name: 'Ramesh Patel',
  email: 'ramesh@travels.com',
  password: bcrypt.hashSync('driver123', 10),
  phone: '+91 9876543212',
  licenseNumber: 'DL-54321TN',
  status: 'Available'
}
      ],
      bookings: [
        {
          id: 'b1',
          customerName: 'Ashwanth S',
          pickupLocation: 'Coimbatore Airport',
          dropLocation: 'Ooty Bus Stand',
          pickupDateTime: new Date(Date.now() + 86400000).toISOString(),
          vehicleType: 'SUV',
          status: 'Pending',
          assignedVehicleId: null,
          assignedDriverId: null,
          notes: 'Requires luggage rack',
          fareEstimated: 2500,
          createdAt: new Date().toISOString()
        },
        {
          id: 'b2',
          customerName: 'Nandhini Devi',
          pickupLocation: 'Salem Bus Stand',
          dropLocation: 'Yercaud Hills',
          pickupDateTime: new Date(Date.now() + 172800000).toISOString(),
          vehicleType: 'Sedan',
          status: 'Confirmed',
          assignedVehicleId: 'v1',
          assignedDriverId: 'd1',
          notes: 'Sightseeing trip',
          fareEstimated: 1200,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };

    saveDb(defaultData);
  }
}

// Read database
function readDb() {
  initDb();
  try {
    const rawData = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading db.json:', error);
    return { users: [], vehicles: [], drivers: [], bookings: [] };
  }
}

// Save database atomically
function saveDb(data) {
  const tempPath = `${dbPath}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, dbPath);
  } catch (error) {
    console.error('Error saving db.json:', error);
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }
    throw error;
  }
}

module.exports = {
  getUsers: () => readDb().users,

  getVehicles: () => readDb().vehicles,
  addVehicle: (vehicle) => {
    const db = readDb();
    db.vehicles.push(vehicle);
    saveDb(db);
    return vehicle;
  },
  updateVehicle: (id, updatedFields) => {
    const db = readDb();
    const idx = db.vehicles.findIndex(v => v.id === id);
    if (idx !== -1) {
      db.vehicles[idx] = { ...db.vehicles[idx], ...updatedFields };
      saveDb(db);
      return db.vehicles[idx];
    }
    return null;
  },
  deleteVehicle: (id) => {
    const db = readDb();
    db.vehicles = db.vehicles.filter(v => v.id !== id);
    saveDb(db);
    return true;
  },

  getDrivers: () => readDb().drivers,
  addDriver: (driver) => {
    const db = readDb();
    db.drivers.push(driver);
    saveDb(db);
    return driver;
  },
  updateDriver: (id, updatedFields) => {
    const db = readDb();
    const idx = db.drivers.findIndex(d => d.id === id);
    if (idx !== -1) {
      db.drivers[idx] = { ...db.drivers[idx], ...updatedFields };
      saveDb(db);
      return db.drivers[idx];
    }
    return null;
  },
  deleteDriver: (id) => {
    const db = readDb();
    db.drivers = db.drivers.filter(d => d.id !== id);
    saveDb(db);
    return true;
  },

  getBookings: () => readDb().bookings,
  addBooking: (booking) => {
    const db = readDb();
    db.bookings.push(booking);
    saveDb(db);
    return booking;
  },
  updateBooking: (id, updatedFields) => {
    const db = readDb();
    const idx = db.bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      const oldBooking = db.bookings[idx];
      const newStatus = updatedFields.status || oldBooking.status;

      // release drivers and vehicles on complete or cancel
      if (newStatus === 'Completed' || newStatus === 'Cancelled') {
        const vehicleId = updatedFields.assignedVehicleId || oldBooking.assignedVehicleId;
        const driverId = updatedFields.assignedDriverId || oldBooking.assignedDriverId;

        if (vehicleId) {
          const vIdx = db.vehicles.findIndex(v => v.id === vehicleId);
          if (vIdx !== -1) db.vehicles[vIdx].status = 'Available';
        }
        if (driverId) {
          const dIdx = db.drivers.findIndex(d => d.id === driverId);
          if (dIdx !== -1) db.drivers[dIdx].status = 'Available';
        }
      }

      // assign driver and vehicle status updates
      if (newStatus === 'Confirmed') {
        const vehicleId = updatedFields.assignedVehicleId || oldBooking.assignedVehicleId;
        const driverId = updatedFields.assignedDriverId || oldBooking.assignedDriverId;

        if (vehicleId) {
          const vIdx = db.vehicles.findIndex(v => v.id === vehicleId);
          if (vIdx !== -1) db.vehicles[vIdx].status = 'Assigned';
        }
        if (driverId) {
          const dIdx = db.drivers.findIndex(d => d.id === driverId);
          if (dIdx !== -1) db.drivers[dIdx].status = 'Available'; // trip not started
        }
      }

      if (newStatus === 'In Progress') {
        const vehicleId = updatedFields.assignedVehicleId || oldBooking.assignedVehicleId;
        const driverId = updatedFields.assignedDriverId || oldBooking.assignedDriverId;

        if (vehicleId) {
          const vIdx = db.vehicles.findIndex(v => v.id === vehicleId);
          if (vIdx !== -1) db.vehicles[vIdx].status = 'Assigned';
        }
        if (driverId) {
          const dIdx = db.drivers.findIndex(d => d.id === driverId);
          if (dIdx !== -1) db.drivers[dIdx].status = 'On Trip';
        }
      }

      db.bookings[idx] = { ...db.bookings[idx], ...updatedFields };
      saveDb(db);
      return db.bookings[idx];
    }
    return null;
  }
};
