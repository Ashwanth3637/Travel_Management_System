const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = 'travels_cab_jwt_secret_token_key_2026';

app.use(cors());
app.use(bodyParser.json());

// log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Auth token check middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// Admin role check middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}
// Driver role check middleware
function requireDriver(req, res, next) {
  if (!req.user || req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Access denied. Driver privileges required.' });
  }
  next();
}

// Auth endpoint (Admin Login)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = db.getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});
// Driver Login
app.post('/api/auth/driver/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required.'
    });
  }

  const drivers = db.getDrivers();

  const driver = drivers.find(
    d => d.email && d.email.toLowerCase() === email.toLowerCase()
  );

  if (!driver || !bcrypt.compareSync(password, driver.password)) {
    return res.status(400).json({
      error: 'Invalid email or password.'
    });
  }

  const token = jwt.sign(
    {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      role: 'driver'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      role: 'driver'
    }
  });
});

// Customer Registration API
app.post('/api/customers/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const customers = db.getCustomers();
  const exists = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newCustomer = {
    id: 'c' + (customers.length + 1),
    name,
    email,
    phone,
    password: passwordHash,
    role: 'customer'
  };

  db.addCustomer(newCustomer);

  res.status(201).json({
    message: 'Registration successful',
    customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone }
  });
});

// Customer Login API
app.post('/api/customers/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const customers = db.getCustomers();
  const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

  if (!customer || !bcrypt.compareSync(password, customer.password)) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: customer.id, name: customer.name, email: customer.email, role: 'customer' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone }
  });
});

// Get all customers (registered + booking names)
app.get('/api/customers', authenticateToken, (req, res) => {
  const registered = db.getCustomers();
  const bookings = db.getBookings();
  
  const all = [...registered];
  bookings.forEach(b => {
    if (!all.some(c => c.name.toLowerCase() === b.customerName.toLowerCase())) {
      all.push({
        id: 'c_temp_' + (all.length + 1),
        name: b.customerName,
        email: `${b.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        phone: '—',
        role: 'customer'
      });
    }
  });
  
  res.json(all);
});

// Vehicles REST APIs
app.get('/api/vehicles', authenticateToken, requireAdmin, (req, res) => {
  res.json(db.getVehicles());
});

app.post('/api/vehicles', authenticateToken, requireAdmin, (req, res) => {
  const { name, plateNumber, type, acpreference, capacity, ratePerKm } = req.body;
  if (!name || !plateNumber || !type || !capacity || !ratePerKm) {
    return res.status(400).json({ error: 'All vehicle fields are required.' });
  }

  const vehicles = db.getVehicles();
  let maxNum = 0;
  vehicles.forEach(v => {
    const match = v.id.match(/^v(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const nextId = 'v' + (maxNum + 1);

  const newVehicle = {
    id: nextId,
    name,
    plateNumber,
    type,
    acpreference: acpreference || 'AC',
    capacity: parseInt(capacity),
    status: 'Available',
    ratePerKm: parseFloat(ratePerKm)
  };

  db.addVehicle(newVehicle);
  res.status(201).json(newVehicle);
});

app.put('/api/vehicles/:id', authenticateToken, requireAdmin, (req, res) => {
  const updated = db.updateVehicle(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Vehicle not found.' });
  }
  res.json(updated);
});

app.delete('/api/vehicles/:id', authenticateToken, requireAdmin, (req, res) => {
  const success = db.deleteVehicle(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Vehicle not found.' });
  }
  res.json({ message: 'Vehicle deleted successfully.' });
});

// Drivers REST APIs
app.get('/api/drivers', authenticateToken, requireAdmin, (req, res) => {
  res.json(db.getDrivers());
});

app.post('/api/drivers', authenticateToken, requireAdmin, (req, res) => {
  const { name, phone, licenseNumber } = req.body;
  if (!name || !phone || !licenseNumber) {
    return res.status(400).json({ error: 'All driver fields are required.' });
  }

  const drivers = db.getDrivers();
  let maxNum = 0;
  drivers.forEach(d => {
    const match = d.id.match(/^d(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const nextId = 'd' + (maxNum + 1);

  const newDriver = {
    id: nextId,
    name,
    phone,
    licenseNumber,
    status: 'Available'
  };

  db.addDriver(newDriver);
  res.status(201).json(newDriver);
});

app.put('/api/drivers/:id', authenticateToken, requireAdmin, (req, res) => {
  const updated = db.updateDriver(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Driver not found.' });
  }
  res.json(updated);
});

app.delete('/api/drivers/:id', authenticateToken, requireAdmin, (req, res) => {
  const success = db.deleteDriver(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Driver not found.' });
  }
  res.json({ message: 'Driver deleted successfully.' });
});

// Bookings REST APIs
app.get('/api/bookings', authenticateToken, requireAdmin, (req, res) => {
  res.json(db.getBookings());
});

app.post('/api/bookings', authenticateToken, requireAdmin, (req, res) => {
  const { customerName, pickupLocation, dropLocation, pickupDateTime, vehicleType, notes } = req.body;
  if (!customerName || !pickupLocation || !dropLocation || !pickupDateTime || !vehicleType) {
    return res.status(400).json({ error: 'Missing booking details.' });
  }

  let baseRate = 12;
  if (vehicleType === 'SUV') baseRate = 18;
  if (vehicleType === 'Minivan') baseRate = 25;

  const simulatedDistance = Math.floor(Math.random() * 80) + 20;
  const fareEstimated = simulatedDistance * baseRate;

  const bookings = db.getBookings();
  let maxNum = 0;
  bookings.forEach(b => {
    const match = b.id.match(/^b(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const nextId = 'b' + (maxNum + 1);

  const newBooking = {
    id: nextId,
    customerName,
    pickupLocation,
    dropLocation,
    pickupDateTime,
    vehicleType,
    status: 'Pending',
    assignedVehicleId: null,
    assignedDriverId: null,
    notes: notes || '',
    fareEstimated,
    createdAt: new Date().toISOString()
  };

  db.addBooking(newBooking);
  res.status(201).json(newBooking);
});

app.put('/api/bookings/:id', authenticateToken, requireAdmin, (req, res) => {
  const updated = db.updateBooking(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Booking not found.' });
  }
  res.json(updated);
});

// Stats Report API
app.get('/api/dashboard/stats', authenticateToken, requireAdmin, (req, res) => {
  const bookings = db.getBookings();
  const vehicles = db.getVehicles();
  const drivers = db.getDrivers();

  const totalEarnings = bookings
    .filter(b => b.status === 'Completed')
    .reduce((sum, b) => sum + (b.fareEstimated || 0), 0);

  const pending = bookings.filter(b => b.status === 'Pending').length;
  const confirmed = bookings.filter(b => b.status === 'Confirmed').length;
  const inprogress = bookings.filter(b => b.status === 'In Progress').length;
  const completed = bookings.filter(b => b.status === 'Completed').length;
  const cancelled = bookings.filter(b => b.status === 'Cancelled').length;

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter(d => d.status === 'Available').length;

  res.json({
    earnings: totalEarnings,
    counts: {
      bookings: bookings.length,
      pending,
      confirmed,
      active: inprogress,
      completed,
      cancelled,
      vehicles: totalVehicles,
      availableVehicles,
      drivers: totalDrivers,
      availableDrivers
    },
    utilization: {
      vehicleRate: totalVehicles ? ((totalVehicles - availableVehicles) / totalVehicles * 100).toFixed(0) : 0,
      driverRate: totalDrivers ? ((totalDrivers - availableDrivers) / totalDrivers * 100).toFixed(0) : 0
    }
  });
});
// ======================= DRIVER APIs =======================

// Driver Profile
app.get('/api/driver/profile', authenticateToken, requireDriver, (req, res) => {

  const driver = db.getDrivers().find(d => d.id === req.user.id);

  if (!driver) {
    return res.status(404).json({
      error: 'Driver not found.'
    });
  }

  res.json(driver);

});

// Driver Assigned Trips
app.get('/api/driver/trips', authenticateToken, requireDriver, (req, res) => {

  const trips = db.getBookings().filter(
    booking => booking.assignedDriverId === req.user.id
  );

  res.json(trips);

});

// Driver Dashboard
app.get('/api/driver/dashboard', authenticateToken, requireDriver, (req, res) => {

  const trips = db.getBookings().filter(
    booking => booking.assignedDriverId === req.user.id
  );

  res.json({
    totalTrips: trips.length,
    completedTrips: trips.filter(t => t.status === 'Completed').length,
    ongoingTrips: trips.filter(t => t.status === 'In Progress').length,
    upcomingTrips: trips.filter(t => t.status === 'Confirmed').length,
    trips
  });

});

// Update Trip Status
app.put('/api/driver/trips/:id/status', authenticateToken, requireDriver, (req, res) => {

  const updated = db.updateBooking(
    req.params.id,
    { status: req.body.status }
  );

  if (!updated) {
    return res.status(404).json({
      error: 'Trip not found.'
    });
  }

  res.json(updated);

});

// Update Driver Availability
app.put('/api/driver/availability', authenticateToken, requireDriver, (req, res) => {
  const { status } = req.body;

  if (!['Available', 'On Trip', 'Offline'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be Available, On Trip, or Offline.' });
  }

  const updated = db.updateDriver(req.user.id, { status });

  if (!updated) {
    return res.status(404).json({ error: 'Driver not found.' });
  }

  res.json({ message: 'Availability updated.', status: updated.status });
});

// Customer Bookings APIs
app.get('/api/customer/bookings', authenticateToken, (req, res) => {
  const bookings = db.getBookings();
  const targetName = req.query.customerName || req.user.name;
  const customerBookings = bookings.filter(b => b.customerName.toLowerCase() === targetName.toLowerCase());
  res.json(customerBookings);
});

app.post('/api/customer/bookings', authenticateToken, (req, res) => {
  const { pickupLocation, dropLocation, pickupDateTime, vehicleType, notes, customerName } = req.body;
  if (!pickupLocation || !dropLocation || !pickupDateTime || !vehicleType) {
    return res.status(400).json({ error: 'Missing booking details.' });
  }

  let baseRate = 12;
  if (vehicleType === 'SUV') baseRate = 18;
  if (vehicleType === 'Minivan') baseRate = 25;

  const simulatedDistance = Math.floor(Math.random() * 80) + 20;
  const fareEstimated = simulatedDistance * baseRate;

  const bookings = db.getBookings();
  let maxNum = 0;
  bookings.forEach(b => {
    const match = b.id.match(/^b(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const nextId = 'b' + (maxNum + 1);

  const newBooking = {
    id: nextId,
    customerName: customerName || req.user.name,
    pickupLocation,
    dropLocation,
    pickupDateTime,
    vehicleType,
    status: 'Pending',
    assignedVehicleId: null,
    assignedDriverId: null,
    notes: notes || '',
    fareEstimated,
    createdAt: new Date().toISOString()
  };

  db.addBooking(newBooking);
  res.status(201).json(newBooking);
});

app.post('/api/customer/bookings/:id/cancel', authenticateToken, (req, res) => {
  const bookings = db.getBookings();
  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const targetName = req.body.customerName || req.user.name;
  if (booking.customerName.toLowerCase() !== targetName.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied. You do not own this booking.' });
  }

  if (booking.status !== 'Pending' && booking.status !== 'Confirmed') {
    return res.status(400).json({ error: 'Booking cannot be cancelled in its current state.' });
  }

  const updated = db.updateBooking(req.params.id, { status: 'Cancelled' });
  res.json(updated);
});

app.get('/api/customer/assigned-resources/:bookingId', authenticateToken, (req, res) => {
  const bookings = db.getBookings();
  const booking = bookings.find(b => b.id === req.params.bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const targetName = req.query.customerName || req.user.name;
  if (booking.customerName.toLowerCase() !== targetName.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  let driver = null;
  let vehicle = null;

  if (booking.assignedDriverId) {
    driver = db.getDrivers().find(d => d.id === booking.assignedDriverId);
  }
  if (booking.assignedVehicleId) {
    vehicle = db.getVehicles().find(v => v.id === booking.assignedVehicleId);
  }

  res.json({
    driver: driver ? { name: driver.name, phone: driver.phone } : null,
    vehicle: vehicle ? { name: vehicle.name, plateNumber: vehicle.plateNumber, type: vehicle.type } : null
  });
});

app.listen(PORT, () => {
  console.log(`Travel Management System Backend listening on port ${PORT}`);
});


