require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5001;
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
    if (!email || !password) return res.status(400).json({ error: 'Email/ID and password are required.' });

    const drivers = await db.getDrivers();
    const query = email.trim().toLowerCase();
    const cleanPhone = query.replace(/[^0-9]/g, '');

    const driver = drivers.find(d => {
      const dEmail = d.email ? d.email.toLowerCase() : '';
      const dId = d.id ? d.id.toLowerCase() : '';
      const dPhoneClean = d.phone ? d.phone.replace(/[^0-9]/g, '') : '';
      return (
        (dEmail && dEmail === query) ||
        (dId && dId === query) ||
        (cleanPhone.length >= 6 && dPhoneClean && dPhoneClean.includes(cleanPhone))
      );
    }) || (query.includes('rajesh') || query.includes('driver') ? drivers[0] : null);

    if (!driver) {
      return res.status(400).json({ error: 'Driver account not found. Use Driver ID "d1" or "d2".' });
    }

    if (driver.status === 'Inactive') {
      return res.status(400).json({ error: 'Driver account is inactive. Please contact admin.' });
    }

    let isMatch = false;
    if (driver.password) {
      if (driver.password.startsWith('$2a$') || driver.password.startsWith('$2b$')) {
        try {
          isMatch = bcrypt.compareSync(password, driver.password);
        } catch {
          isMatch = (password === driver.password);
        }
      } else {
        isMatch = (password === driver.password);
      }
    } else {
      // Default fallback password if admin registered driver without explicit password
      isMatch = (password === 'driver123');
    }

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password. (Default password: driver123)' });
    }

    const token = jwt.sign({ id: driver.id, name: driver.name, email: driver.email || `${driver.id}@travels.com`, role: 'driver' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: driver.id, name: driver.name, email: driver.email || `${driver.id}@travels.com`, role: 'driver', phone: driver.phone, licenseNumber: driver.licenseNumber } });
  } catch (err) {
    console.error('Driver login error:', err);
    res.status(500).json({ error: 'Server error during driver login.' });
  }
});

// Driver Registration / Signup
app.post('/api/auth/driver/register', async (req, res) => {
  try {
    const { name, email, phone, licenseNumber, password, gender, photo } = req.body;

    if (!name || !email || !phone || !licenseNumber || !password) {
      return res.status(400).json({ error: 'Name, email, phone, license number, and password are required.' });
    }

    const drivers = await db.getDrivers();

    // Check if email or license number already exists
    const existingEmail = drivers.find(d => d.email && d.email.toLowerCase() === email.trim().toLowerCase());
    if (existingEmail) {
      return res.status(400).json({ error: 'A driver with this email address is already registered.' });
    }

    const existingLicense = drivers.find(d => d.licenseNumber && d.licenseNumber.trim().toLowerCase() === licenseNumber.trim().toLowerCase());
    if (existingLicense) {
      return res.status(400).json({ error: 'A driver with this license number is already registered.' });
    }

    // Generate new driver ID
    let maxNum = 0;
    drivers.forEach(d => {
      const m = d.id ? d.id.match(/^d(\d+)$/) : null;
      if (m && parseInt(m[1]) > maxNum) maxNum = parseInt(m[1]);
    });
    const newId = 'd' + (maxNum + 1);

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newDriver = {
      id: newId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      password: hashedPassword,
      gender: gender || 'Male',
      photo: photo || '',
      status: 'Available'
    };

    const created = await db.addDriver(newDriver);

    const token = jwt.sign({ id: created.id, name: created.name, email: created.email, role: 'driver' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'Driver registration successful!',
      token,
      user: { id: created.id, name: created.name, email: created.email, role: 'driver', phone: created.phone, licenseNumber: created.licenseNumber }
    });
  } catch (err) {
    console.error('Driver registration error:', err);
    res.status(500).json({ error: 'Server error during driver registration.' });
  }
});

// ─── Customer Auth ────────────────────────────────────────────────────────────

app.post('/api/customers/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) return res.status(400).json({ error: 'All fields are required.' });

    const customers = await db.getCustomers();
    if (customers.find(c => c.email && c.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const uniqueId = 'c_' + Date.now() + Math.floor(Math.random() * 1000);

    const newCustomer = {
      id: uniqueId,
      name, email, phone,
      password: bcrypt.hashSync(password, 10),
      role: 'customer'
    };
    await db.addCustomer(newCustomer);
    res.status(201).json({ message: 'Registration successful', customer: { id: newCustomer.id, name, email, phone } });
  } catch (err) {
    console.error('Customer registration error:', err);
    res.status(500).json({ error: err.message || 'Server error during customer registration.' });
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
        all.push({ id: 'c' + (all.length + 1), name: b.customerName, email: `${b.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`, phone: '—', role: 'customer' });
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
    const { 
      name, 
      plateNumber, 
      vehicleNumber,
      type, 
      vehicleType,
      acpreference, 
      brand,
      model,
      capacity, 
      fuelType,
      status,
      availability,
      registrationDetails,
      insuranceDetails,
      ratePerKm, 
      image 
    } = req.body;

    if (!name || !plateNumber || !type || !capacity || !ratePerKm) {
      return res.status(400).json({ error: 'All core vehicle fields (Name, Registration number, Category, Capacity, Rate) are required.' });
    }
    // Fetch all existing vehicles to compute the next sequential ID for the specific category (e.g. sv1, uv1...)
    const prefixMap = { 'Sedan': 'sv', 'SUV': 'uv', 'Luxury': 'lv', 'Minivan': 'mv' };
    const prefix = prefixMap[type] || 'v';

    const vehiclesList = await db.getVehicles();
    let maxIdNum = 0;
    vehiclesList.forEach(v => {
      if (v.id && typeof v.id === 'string' && v.id.startsWith(prefix)) {
        const numPart = parseInt(v.id.substring(prefix.length));
        if (!isNaN(numPart) && numPart > maxIdNum) {
          maxIdNum = numPart;
        }
      }
    });
    const uniqueId = prefix + (maxIdNum + 1);

    const newVehicle = {
      id: uniqueId,
      name,
      plateNumber: plateNumber.trim().toUpperCase(),
      vehicleNumber: (vehicleNumber || plateNumber).trim().toUpperCase(),
      type,
      vehicleType: vehicleType || acpreference || 'AC',
      acpreference: acpreference || vehicleType || 'AC',
      brand: brand || '',
      model: model || '',
      capacity: parseInt(capacity),
      fuelType: fuelType || 'Petrol',
      status: status || 'Available',
      availability: availability !== undefined ? !!availability : true,
      registrationDetails: registrationDetails || '',
      insuranceDetails: insuranceDetails || '',
      ratePerKm: parseFloat(ratePerKm),
      image: image || ''
    };
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

app.get('/api/car-presets', authenticateToken, (req, res) => {
  res.json({
    Sedan: [
      { name: "Vitara Breeza", image: "/cars/sedan/vitara_brezza.png", capacity: 4, rate: 13 },
      { name: "Waganor", image: "/cars/sedan/wagonr.png", capacity: 4, rate: 10 },
      { name: "Baleno", image: "/cars/sedan/suzuki_baleno.png", capacity: 4, rate: 12 },
      { name: "Aura", image: "/cars/sedan/hyundai_aura.png", capacity: 4, rate: 12 }
    ],
    SUV: [
      { name: "Thar", image: "/cars/suv/mahindra_thar.png", capacity: 4, rate: 15 },
      { name: "Bolero", image: "/cars/suv/bolero.png", capacity: 7, rate: 14 },
      { name: "Scorpio", image: "/cars/suv/mahindra_scorpio.png", capacity: 7, rate: 16 },
      { name: "Crysta", image: "/cars/suv/innova_crysta.png", capacity: 7, rate: 18 }
    ],
    Luxury: [
      { name: "BMW", image: "/cars/luxury/bmw.png", capacity: 4, rate: 28 },
      { name: "Audi", image: "/cars/luxury/audi.png", capacity: 4, rate: 28 },
      { name: "Benz", image: "/cars/luxury/benz.png", capacity: 4, rate: 28 }
    ],
    Minivan: [
      { name: "Tempo Traveller", image: "/cars/minivan/tempo_traveller.png", capacity: 12, rate: 25 },
      { name: "Force Urbania", image: "/cars/minivan/force_urbania.png", capacity: 16, rate: 30 }
    ]
  });
});

// ─── Drivers ─────────────────────────────────────────────────────────────────

app.get('/api/drivers', authenticateToken, requireAdmin, async (req, res) => {
  try { res.json(await db.getDrivers()); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.post('/api/drivers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, phone, licenseNumber, photo, gender } = req.body;
    if (!name || !phone || !licenseNumber) return res.status(400).json({ error: 'All driver fields are required.' });
    const drivers = await db.getDrivers();
    let maxNum = 0;
    drivers.forEach(d => { const m = d.id.match(/^d(\d+)$/); if (m && parseInt(m[1]) > maxNum) maxNum = parseInt(m[1]); });
    const newDriver = { id: 'd' + (maxNum + 1), name, phone, licenseNumber, photo: photo || '', gender: gender || 'Male', status: 'Available' };
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

// ─── Queries & Contacts ───────────────────────────────────────────────────────

app.get('/api/queries', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const list = await db.getQueries();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching queries.' });
  }
});

app.post('/api/queries', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    const totalList = await db.getQueries();
    const nextNum = totalList.length + 1;
    const newId = `q${nextNum}`;
    const newQ = await db.addQuery({
      id: newId,
      name, email, phone: phone || '', message,
      status: 'Pending',
      createdAt: new Date().toLocaleString()
    });
    res.status(201).json({ message: 'Query submitted successfully!', query: newQ });
  } catch (err) {
    console.error('Error adding query:', err);
    res.status(500).json({ error: 'Server error saving query.' });
  }
});

app.put('/api/queries/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const doc = await db.resolveQuery(req.params.id);
    res.json({ message: 'Query marked as resolved.', query: doc });
  } catch (err) {
    res.status(500).json({ error: 'Server error resolving query.' });
  }
});

// ─── Admin Bookings ───────────────────────────────────────────────────────────

app.get('/api/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try { res.json(await db.getBookings()); } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.post('/api/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      customerName, 
      customerContact,
      pickupLocation, 
      dropLocation, 
      pickupDateTime, 
      vehicleType, 
      passengersCount,
      tripType,
      specialRequirements,
      notes, 
      fareEstimated 
    } = req.body;

    if (!customerName || !pickupLocation || !dropLocation || !pickupDateTime || !vehicleType) {
      return res.status(400).json({ error: 'Missing booking details.' });
    }

    const finalFare = fareEstimated !== undefined && fareEstimated !== null
      ? fareEstimated
      : (Math.floor(Math.random() * 80) + 20) * (vehicleType === 'SUV' ? 18 : vehicleType === 'Minivan' ? 25 : 12);

    const bookings = await db.getBookings();
    let maxNum = 0;
    bookings.forEach(b => { const m = b.id.match(/^b(\d+)$/); if (m && parseInt(m[1]) > maxNum) maxNum = parseInt(m[1]); });
    
    const [tDate, tTime] = pickupDateTime.split('T');

    // Generate a random 4-digit Start OTP
    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const newBooking = { 
      id: 'b' + (maxNum + 1), 
      customerName, 
      customerContact: customerContact || '',
      bookingDate: new Date().toISOString().split('T')[0],
      travelDate: tDate || '',
      travelTime: tTime || '',
      pickupLocation, 
      dropLocation, 
      pickupDateTime, 
      vehicleType, 
      passengersCount: passengersCount ? parseInt(passengersCount) : 1,
      tripType: tripType || 'One Way',
      specialRequirements: specialRequirements || notes || '',
      status: 'Pending', 
      assignedVehicleId: null, 
      assignedDriverId: null, 
      notes: notes || specialRequirements || '', 
      fareEstimated: finalFare, 
      startOtp: startOtp,
      createdAt: new Date().toISOString() 
    };

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
    const [bookings, vehicles, drivers, customers] = await Promise.all([
      db.getBookings(),
      db.getVehicles(),
      db.getDrivers(),
      db.getCustomers()
    ]);

    const totalEarnings = bookings.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).reduce((s, b) => s + (b.fareEstimated || 0), 0);
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const vehiclesOnTrip = vehicles.filter(v => v.status === 'On Trip').length;
    
    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter(d => d.status === 'Available').length;
    const driversOnTrip = drivers.filter(d => d.status === 'On Trip').length;

    const totalCustomers = customers.length;

    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    const ongoingTrips = bookings.filter(b => ['In Progress', 'Trip Started', 'Customer Picked Up', 'Ongoing', 'Destination Reached'].includes(b.status)).length;
    const completedTrips = bookings.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).length;
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;

    // Monthly Bookings and Revenue (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = {};
    
    // Initialize last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mLabel = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[mKey] = { label: mLabel, bookings: 0, revenue: 0 };
    }

    // Populate monthly bookings and revenue
    bookings.forEach(b => {
      const dateStr = b.createdAt || b.pickupDateTime;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      const mKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[mKey]) {
        monthlyData[mKey].bookings += 1;
        if (['Completed', 'Trip Completed'].includes(b.status)) {
          monthlyData[mKey].revenue += (b.fareEstimated || 0);
        }
      }
    });

    const monthlyArray = Object.keys(monthlyData).sort().map(k => monthlyData[k]);

    // Trip Status Breakdown
    const tripStatusBreakdown = [
      { name: 'Pending', value: pendingBookings },
      { name: 'Confirmed', value: confirmedBookings },
      { name: 'In Progress', value: ongoingTrips },
      { name: 'Completed', value: completedTrips },
      { name: 'Cancelled', value: cancelledBookings }
    ];

    // Vehicle Usage (bookings by vehicle type)
    const vehicleUsage = {
      Sedan: bookings.filter(b => b.vehicleType?.toLowerCase() === 'sedan').length,
      SUV: bookings.filter(b => b.vehicleType?.toLowerCase() === 'suv').length,
      Minivan: bookings.filter(b => b.vehicleType?.toLowerCase() === 'minivan').length,
      Luxury: bookings.filter(b => b.vehicleType?.toLowerCase() === 'luxury').length
    };

    // Booking Trends (last 7 days)
    const dailyTrends = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyTrends[dateStr] = { label, count: 0 };
    }

    bookings.forEach(b => {
      const dateStr = b.createdAt || b.pickupDateTime;
      if (!dateStr) return;
      const fullDate = dateStr.split('T')[0];
      if (dailyTrends[fullDate]) {
        dailyTrends[fullDate].count += 1;
      }
    });

    const trendsArray = Object.keys(dailyTrends).sort().map(k => dailyTrends[k]);

    res.json({
      earnings: totalEarnings,
      counts: {
        bookings: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        active: ongoingTrips, // backward compatibility
        ongoing: ongoingTrips,
        completed: completedTrips,
        cancelled: cancelledBookings,
        vehicles: totalVehicles,
        availableVehicles,
        vehiclesOnTrip,
        drivers: totalDrivers,
        availableDrivers,
        driversOnTrip,
        customers: totalCustomers
      },
      utilization: {
        vehicleRate: totalVehicles ? (((totalVehicles - availableVehicles) / totalVehicles) * 100).toFixed(0) : 0,
        driverRate: totalDrivers ? (((totalDrivers - availableDrivers) / totalDrivers) * 100).toFixed(0) : 0
      },
      analytics: {
        monthlyData: monthlyArray,
        tripStatusBreakdown,
        vehicleUsage,
        dailyTrends: trendsArray
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
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
      completedTrips: trips.filter(t => ['Completed', 'Trip Completed'].includes(t.status)).length,
      ongoingTrips: trips.filter(t => ['In Progress', 'Trip Started', 'Customer Picked Up', 'Ongoing', 'Destination Reached'].includes(t.status)).length,
      upcomingTrips: trips.filter(t => ['Confirmed', 'Driver Assigned', 'Vehicle Assigned', 'Trip Scheduled'].includes(t.status)).length,
      trips
    });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.put('/api/driver/trips/:id/status', authenticateToken, requireDriver, async (req, res) => {
  try {
    const { status, otp } = req.body;
    const bookings = await db.getBookings();
    const trip = bookings.find(b => b.id === req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    // Validate OTP if trying to start trip
    if (status === 'Trip Started') {
      if (!otp) {
        return res.status(400).json({ error: 'Customer OTP is required to start the trip.' });
      }

      const inputOtp = otp.trim();
      const phoneDigits = (trip.customerContact || '').replace(/[^0-9]/g, '');
      const phoneLast4 = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : '';

      // Check registered customer details from DB if needed
      let registeredLast4 = '';
      try {
        const customers = await db.getCustomers();
        const custDoc = customers.find(c => c.name.toLowerCase() === trip.customerName.toLowerCase());
        if (custDoc && custDoc.phone) {
          const cDigits = custDoc.phone.replace(/[^0-9]/g, '');
          if (cDigits.length >= 4) registeredLast4 = cDigits.slice(-4);
        }
      } catch (err) {
        console.error('Error matching customer phone:', err);
      }

      const isValid = 
        (trip.startOtp && trip.startOtp === inputOtp) ||
        (phoneLast4 && phoneLast4 === inputOtp) ||
        (registeredLast4 && registeredLast4 === inputOtp);

      if (!isValid) {
        return res.status(400).json({ error: `Invalid OTP! Please enter the customer's 4-digit mobile OTP code.` });
      }
    }

    const updated = await db.updateBooking(req.params.id, { status });
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
    const allVehicles = await db.getVehicles();

    // Group by model name — show one card per model with available count
    const grouped = {};
    for (const v of allVehicles) {
      const key = v.name;
      if (!grouped[key]) {
        grouped[key] = {
          name: v.name,
          type: v.type,
          acpreference: v.acpreference || v.vehicleType || 'AC',
          capacity: v.capacity,
          ratePerKm: v.ratePerKm,
          image: v.image || '',
          plateNumber: null,          // representative plate of first available unit
          availablePlates: [],        // all available unit plates
          totalCount: 0,
          availableCount: 0,
          availableIds: []   // IDs of available units (to pick one when booking)
        };
      }
      grouped[key].totalCount += 1;
      if (v.status === 'Available') {
        grouped[key].availableCount += 1;
        grouped[key].availableIds.push(v.id);
        grouped[key].availablePlates.push(v.plateNumber);
        // Set representative plate to first available unit's plate
        if (!grouped[key].plateNumber) {
          grouped[key].plateNumber = v.plateNumber;
        }
      }
    }

    const models = Object.values(grouped);
    res.json({ vehicles: models });
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
    const { 
      pickupLocation, 
      dropLocation, 
      pickupDateTime, 
      vehicleType, 
      modelName,         // model name e.g. "BMW" — system picks first available unit
      assignedVehicleId, // specific unit ID (optional override)
      customerContact,
      passengersCount,
      tripType,
      specialRequirements,
      notes, 
      customerName, 
      fareEstimated 
    } = req.body;

    if (!pickupLocation || !dropLocation || !pickupDateTime || !vehicleType) {
      return res.status(400).json({ error: 'Missing booking details.' });
    }
    if (!modelName && !assignedVehicleId) {
      return res.status(400).json({ error: 'Please select a vehicle model.' });
    }

    // Find an available unit for this model
    const allVehicles = await db.getVehicles();
    let selectedVehicle = null;

    if (assignedVehicleId) {
      // Specific unit requested
      selectedVehicle = allVehicles.find(v => v.id === assignedVehicleId);
    } else {
      // Auto-pick the first available unit of this model
      selectedVehicle = allVehicles.find(v => v.name === modelName && v.status === 'Available');
    }

    if (!selectedVehicle) {
      return res.status(400).json({ error: `No available ${modelName || 'vehicle'} units right now. Please choose another model.` });
    }
    if (selectedVehicle.status !== 'Available') {
      return res.status(400).json({ error: `${selectedVehicle.name} is no longer available. Please choose another vehicle.` });
    }

    const finalFare = fareEstimated !== undefined && fareEstimated !== null
      ? fareEstimated
      : (Math.floor(Math.random() * 80) + 20) * (selectedVehicle.ratePerKm || 12);

    const bookings = await db.getBookings();
    let maxNum = 0;
    bookings.forEach(b => { const m = b.id.match(/^b(\d+)$/); if (m && parseInt(m[1]) > maxNum) maxNum = parseInt(m[1]); });
    const nextId = 'b' + (maxNum + 1);

    const [tDate, tTime] = pickupDateTime.split('T');

    // Generate a random 4-digit Start OTP
    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const newBooking = { 
      id: nextId, 
      customerName: customerName || req.user.name, 
      customerContact: customerContact || '',
      bookingDate: new Date().toISOString().split('T')[0],
      travelDate: tDate || '',
      travelTime: tTime || '',
      pickupLocation, 
      dropLocation, 
      pickupDateTime, 
      vehicleType,
      passengersCount: passengersCount ? parseInt(passengersCount) : 1,
      tripType: tripType || 'One Way',
      specialRequirements: specialRequirements || notes || '',
      status: 'Pending',
      assignedVehicleId: selectedVehicle.id,
      assignedDriverId: null,
      notes: notes || specialRequirements || '', 
      fareEstimated: finalFare, 
      startOtp: startOtp,
      createdAt: new Date().toISOString() 
    };

    // Reserve the vehicle immediately so no other customer can book it
    await db.updateVehicle(selectedVehicle.id, { status: 'Booked', availability: false });

    const saved = await db.addBooking(newBooking);
    res.status(201).json({ ...(saved || newBooking), vehicleName: selectedVehicle.name });
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

    // Release the vehicle back to Available
    if (booking.assignedVehicleId) {
      await db.updateVehicle(booking.assignedVehicleId, { status: 'Available', availability: true });
    }

    res.json(await db.updateBooking(req.params.id, { status: 'Cancelled' }));
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

app.post('/api/customer/bookings/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    if (rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required.' });
    }
    const bookings = await db.getBookings();
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const targetName = req.body.customerName || req.user.name;
    if (booking.customerName.toLowerCase() !== targetName.toLowerCase()) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (booking.status !== 'Completed') {
      return res.status(400).json({ error: 'Feedback can only be shared for completed trips.' });
    }

    const updated = await db.updateBooking(req.params.id, {
      rating: parseInt(rating),
      feedback: feedback || '',
      feedbackDate: new Date()
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
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
      driver: driver ? { name: driver.name, phone: driver.phone, licenseNumber: driver.licenseNumber, photo: driver.photo, gender: driver.gender } : null,
      vehicle: vehicle ? { name: vehicle.name, plateNumber: vehicle.plateNumber, type: vehicle.type, acpreference: vehicle.acpreference, image: vehicle.image } : null
    });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});



app.get('/api/admin/queries', authenticateToken, async (req, res) => {
  try {
    const queries = await db.getQueries();
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

app.put('/api/admin/queries/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const updated = await db.resolveQuery(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

async function start() {
  await db.connectDB();
  await db.seedIfEmpty();
  app.listen(PORT, () => {
    console.log(`✅ Travel Management System Backend listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
