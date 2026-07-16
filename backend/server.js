require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET || 'travels_cab_jwt_secret_token_key_2026';

app.use(cors());
app.use(bodyParser.json());

// log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Middleware ───────────────────────────────────────────────────────────────

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

function requireDriver(req, res, next) {
  if (!req.user || req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Access denied. Driver privileges required.' });
  }
  next();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// Admin Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const users = await db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Driver Login
app.post('/api/auth/driver/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const drivers = await db.getDrivers();
    const driver = drivers.find(d => d.email && d.email.toLowerCase() === email.toLowerCase());
    if (!driver || !bcrypt.compareSync(password, driver.password)) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: driver.id, name: driver.name, email: driver.email, role: 'driver' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: driver.id, name: driver.name, email: driver.email, role: 'driver' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Customer Auth ────────────────────────────────────────────────────────────

app.post('/api/customers/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) return res.status(400).json({ error: 'All fields are required.' });

    const customers = await db.getCustomers();
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const newCustomer = {
      id: 'c' + (customers.length + 1),
      name, email, phone,
      password: bcrypt.hashSync(password, 10),
      role: 'customer'
    };
    await db.addCustomer(newCustomer);
    res.status(201).json({ message: 'Registration successful', customer: { id: newCustomer.id, name, email, phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/customers/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const customers = await db.getCustomers();
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!customer || !bcrypt.compareSync(password, customer.password)) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: customer.id, name: customer.name, email: customer.email, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// All customers (registered + from bookings)
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const registered = await db.getCustomers();
    const bookings = await db.getBookings();
    const all = [...registered];
    bookings.forEach(b => {
      if (!all.some(c => c.name.toLowerCase() === b.customerName.toLowerCase())) {
        all.push({ id: 'c_temp_' + (all.length + 1), name: b.customerName, email: `${b.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`, phone: '—', role: 'customer' });
      }
    });
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Vehicles ────────────────────────────────────────────────────────────────

app.get('/api/vehicles', authenticateToken, requireAdmin, async (req, res) => {
  try { res.json(await db.getVehicles()); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.post('/api/vehicles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, plateNumber, type, acpreference, capacity, ratePerKm } = req.body;
    if (!name || !plateNumber || !type || !capacity || !ratePerKm) {
      return res.status(400).json({ error: 'All vehicle fields are required.' });
    }
    const vehicles = await db.getVehicles();
    let maxNum = 0;
    vehicles.forEach(v => { const m = v.id.match(/^v(\d+)$/); if (m && parseInt(m[1]) > maxNum) maxNum = parseInt(m[1]); });
    const newVehicle = { id: 'v' + (maxNum + 1), name, plateNumber, type, acpreference: acpreference || 'AC', capacity: parseInt(capacity), status: 'Available', ratePerKm: parseFloat(ratePerKm) };
    res.status(201).json(await db.addVehicle(newVehicle));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

app.put('/api/vehicles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await db.updateVehicle(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Vehicle not found.' });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.delete('/api/vehicles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.deleteVehicle(req.params.id);
    res.json({ message: 'Vehicle deleted successfully.' });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

// ─── Drivers ─────────────────────────────────────────────────────────────────

app.get('/api/drivers', authenticateToken, requireAdmin, async (req, res) => {
  try { res.json(await db.getDrivers()); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.post('/api/drivers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, phone, licenseNumber } = req.body;
    if (!name || !phone || !licenseNumber) return res.status(400).json({ error: 'All driver fields are required.' });
    const drivers = await db.getDrivers();
    let maxNum = 0;
    drivers.forEach(d => { const m = d.id.match(/^d(\d+)$/); if (m && parseInt(m[1]) > maxNum) maxNum = parseInt(m[1]); });
    const newDriver = { id: 'd' + (maxNum + 1), name, phone, licenseNumber, status: 'Available' };
    res.status(201).json(await db.addDriver(newDriver));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

app.put('/api/drivers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await db.updateDriver(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Driver not found.' });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.delete('/api/drivers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.deleteDriver(req.params.id);
    res.json({ message: 'Driver deleted successfully.' });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

// ─── Admin Bookings ───────────────────────────────────────────────────────────

app.get('/api/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try { res.json(await db.getBookings()); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.post('/api/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { customerName, pickupLocation, dropLocation, pickupDateTime, vehicleType, notes } = req.body;
    if (!customerName || !pickupLocation || !dropLocation || !pickupDateTime || !vehicleType) {
      return res.status(400).json({ error: 'Missing booking details.' });
    }
    let baseRate = 12;
    if (vehicleType === 'SUV') baseRate = 18;
    if (vehicleType === 'Minivan') baseRate = 25;
    const fareEstimated = (Math.floor(Math.random() * 80) + 20) * baseRate;

    const bookings = await db.getBookings();
    let maxNum = 0;
    bookings.forEach(b => { const m = b.id.match(/^b(\d+)$/); if (m && parseInt(m[1]) > maxNum) maxNum = parseInt(m[1]); });
    const newBooking = { id: 'b' + (maxNum + 1), customerName, pickupLocation, dropLocation, pickupDateTime, vehicleType, status: 'Pending', assignedVehicleId: null, assignedDriverId: null, notes: notes || '', fareEstimated, createdAt: new Date().toISOString() };
    res.status(201).json(await db.addBooking(newBooking));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

app.put('/api/bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await db.updateBooking(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Booking not found.' });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

app.get('/api/dashboard/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [bookings, vehicles, drivers] = await Promise.all([db.getBookings(), db.getVehicles(), db.getDrivers()]);
    const totalEarnings = bookings.filter(b => b.status === 'Completed').reduce((s, b) => s + (b.fareEstimated || 0), 0);
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter(d => d.status === 'Available').length;
    res.json({
      earnings: totalEarnings,
      counts: {
        bookings: bookings.length,
        pending: bookings.filter(b => b.status === 'Pending').length,
        confirmed: bookings.filter(b => b.status === 'Confirmed').length,
        active: bookings.filter(b => b.status === 'In Progress').length,
        completed: bookings.filter(b => b.status === 'Completed').length,
        cancelled: bookings.filter(b => b.status === 'Cancelled').length,
        vehicles: totalVehicles, availableVehicles,
        drivers: totalDrivers, availableDrivers
      },
      utilization: {
        vehicleRate: totalVehicles ? (((totalVehicles - availableVehicles) / totalVehicles) * 100).toFixed(0) : 0,
        driverRate: totalDrivers ? (((totalDrivers - availableDrivers) / totalDrivers) * 100).toFixed(0) : 0
      }
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

// ─── Driver APIs ──────────────────────────────────────────────────────────────

app.get('/api/driver/profile', authenticateToken, requireDriver, async (req, res) => {
  try {
    const drivers = await db.getDrivers();
    const driver = drivers.find(d => d.id === req.user.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found.' });
    res.json(driver);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.get('/api/driver/trips', authenticateToken, requireDriver, async (req, res) => {
  try {
    const trips = (await db.getBookings()).filter(b => b.assignedDriverId === req.user.id);
    res.json(trips);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.get('/api/driver/dashboard', authenticateToken, requireDriver, async (req, res) => {
  try {
    const trips = (await db.getBookings()).filter(b => b.assignedDriverId === req.user.id);
    res.json({
      totalTrips: trips.length,
      completedTrips: trips.filter(t => t.status === 'Completed').length,
      ongoingTrips: trips.filter(t => t.status === 'In Progress').length,
      upcomingTrips: trips.filter(t => t.status === 'Confirmed').length,
      trips
    });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.put('/api/driver/trips/:id/status', authenticateToken, requireDriver, async (req, res) => {
  try {
    const updated = await db.updateBooking(req.params.id, { status: req.body.status });
    if (!updated) return res.status(404).json({ error: 'Trip not found.' });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.put('/api/driver/availability', authenticateToken, requireDriver, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Available', 'On Trip', 'Offline'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    const updated = await db.updateDriver(req.user.id, { status });
    if (!updated) return res.status(404).json({ error: 'Driver not found.' });
    res.json({ message: 'Availability updated.', status: updated.status });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

// ─── Customer Booking APIs ────────────────────────────────────────────────────

app.get('/api/customer/booking-options', authenticateToken, async (req, res) => {
  try {
    const [vehicles, drivers] = await Promise.all([db.getVehicles(), db.getDrivers()]);
    res.json({
      vehicles: vehicles.filter(v => v.status === 'Available').map(v => ({ id: v.id, name: v.name, plateNumber: v.plateNumber, type: v.type, acpreference: v.acpreference, capacity: v.capacity, ratePerKm: v.ratePerKm })),
      drivers: drivers.filter(d => d.status === 'Available').map(d => ({ id: d.id, name: d.name, phone: d.phone, licenseNumber: d.licenseNumber }))
    });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.get('/api/customer/bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    const targetName = req.query.customerName || req.user.name;
    res.json(bookings.filter(b => b.customerName.toLowerCase() === targetName.toLowerCase()));
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.post('/api/customer/bookings', authenticateToken, async (req, res) => {
  try {
    const { pickupLocation, dropLocation, pickupDateTime, vehicleType, assignedVehicleId, assignedDriverId, notes, customerName } = req.body;
    if (!pickupLocation || !dropLocation || !pickupDateTime || !vehicleType) return res.status(400).json({ error: 'Missing booking details.' });
    if (!assignedVehicleId) return res.status(400).json({ error: 'Please select a car model.' });

    const [vehicles, drivers] = await Promise.all([db.getVehicles(), db.getDrivers()]);

    const selectedVehicle = vehicles.find(v => v.id === assignedVehicleId);
    if (!selectedVehicle) return res.status(404).json({ error: 'Selected car was not found.' });
    if (selectedVehicle.status !== 'Available') return res.status(400).json({ error: 'Selected car is no longer available.' });
    if (selectedVehicle.type !== vehicleType) return res.status(400).json({ error: 'Selected car does not match the requested category.' });

    let finalDriverId = assignedDriverId;
    if (!finalDriverId) {
      const availableDrivers = drivers.filter(d => d.status === 'Available');
      if (availableDrivers.length === 0) {
        return res.status(400).json({ error: 'No available drivers right now. Please try again in a few minutes.' });
      }
      finalDriverId = availableDrivers[0].id;
    }

    const selectedDriver = drivers.find(d => d.id === finalDriverId);
    if (!selectedDriver) return res.status(404).json({ error: 'Selected driver was not found.' });
    if (selectedDriver.status !== 'Available') return res.status(400).json({ error: 'Selected driver is no longer available.' });

    let baseRate = selectedVehicle.ratePerKm || 12;
    const fareEstimated = (Math.floor(Math.random() * 80) + 20) * baseRate;

    const bookings = await db.getBookings();
    let maxNum = 0;
    bookings.forEach(b => { const m = b.id.match(/^b(\d+)$/); if (m && parseInt(m[1]) > maxNum) maxNum = parseInt(m[1]); });
    const nextId = 'b' + (maxNum + 1);

    const newBooking = { id: nextId, customerName: customerName || req.user.name, pickupLocation, dropLocation, pickupDateTime, vehicleType, status: 'Pending', assignedVehicleId, assignedDriverId: finalDriverId, notes: notes || '', fareEstimated, createdAt: new Date().toISOString() };
    await db.addBooking(newBooking);
    const confirmed = await db.updateBooking(nextId, { status: 'Confirmed' });
    res.status(201).json(confirmed || newBooking);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error.' }); }
});

app.post('/api/customer/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const targetName = req.body.customerName || req.user.name;
    if (booking.customerName.toLowerCase() !== targetName.toLowerCase()) return res.status(403).json({ error: 'Access denied.' });
    if (!['Pending', 'Confirmed'].includes(booking.status)) return res.status(400).json({ error: 'Booking cannot be cancelled in its current state.' });

    res.json(await db.updateBooking(req.params.id, { status: 'Cancelled' }));
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.get('/api/customer/assigned-resources/:bookingId', authenticateToken, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    const booking = bookings.find(b => b.id === req.params.bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const targetName = req.query.customerName || req.user.name;
    if (booking.customerName.toLowerCase() !== targetName.toLowerCase()) return res.status(403).json({ error: 'Access denied.' });

    const [allDrivers, allVehicles] = await Promise.all([db.getDrivers(), db.getVehicles()]);
    const driver = booking.assignedDriverId ? allDrivers.find(d => d.id === booking.assignedDriverId) : null;
    const vehicle = booking.assignedVehicleId ? allVehicles.find(v => v.id === booking.assignedVehicleId) : null;

    res.json({
      driver: driver ? { name: driver.name, phone: driver.phone, licenseNumber: driver.licenseNumber } : null,
      vehicle: vehicle ? { name: vehicle.name, plateNumber: vehicle.plateNumber, type: vehicle.type, acpreference: vehicle.acpreference } : null
    });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

async function start() {
  await db.connectDB();
  await db.seedIfEmpty();
  app.listen(5002, () => {
    console.log(`✅ Travel Management System Backend listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
