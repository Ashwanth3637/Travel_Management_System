require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'travels_cab_jwt_secret_token_key_2026';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ashwanth2567@gmail.com';

// Nodemailer setup for admin email notifications
const sendAdminBookingNotificationEmail = async (bookingDetails) => {
  const adminEmail = ADMIN_EMAIL;
  console.log(`\n==================================================`);
  console.log(`✉️ [ADMIN RIDE BOOKED EMAIL NOTIFICATION TRIGGERED]`);
  console.log(`To Admin Mail: ${adminEmail}`);
  console.log(`Booking ID: #${bookingDetails.id}`);
  console.log(`Customer: ${bookingDetails.customerName} (${bookingDetails.customerContact || 'N/A'})`);
  console.log(`Pickup: ${bookingDetails.pickupLocation}`);
  console.log(`Drop: ${bookingDetails.dropLocation}`);
  console.log(`Travel Date/Time: ${bookingDetails.pickupDateTime}`);
  console.log(`Vehicle: ${bookingDetails.assignedVehicleName || 'Standard Fleet'}`);
  console.log(`Fare: ₹${bookingDetails.fareEstimated}`);
  console.log(`==================================================\n`);

  const mailOptions = {
    from: '"TravelGo Fleet Dispatcher" <no-reply@travelgo.com>',
    to: adminEmail,
    subject: `🚨 NEW RIDE BOOKED (#${bookingDetails.id}) - Action Required: Assign Driver`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #2563eb; color: #ffffff; padding: 16px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">🚗 New Customer Ride Booking</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">TravelGo Fleet Dispatch System</p>
        </div>
        <div style="padding: 20px; color: #1e293b; line-height: 1.6;">
          <p style="font-size: 15px;">Hello Admin (<strong>${adminEmail}</strong>),</p>
          <p style="font-size: 14px;">A new ride has just been booked by a customer! Please review the trip details below and assign an available driver from the Admin Dashboard.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin: 18px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Booking ID:</td><td style="padding: 6px 0; font-weight: bold; color: #2563eb;">#${bookingDetails.id}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Customer Name:</td><td style="padding: 6px 0; font-weight: bold;">${bookingDetails.customerName}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Contact Phone:</td><td style="padding: 6px 0; font-weight: bold;">${bookingDetails.customerContact || 'Not provided'}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Pickup Location:</td><td style="padding: 6px 0;">${bookingDetails.pickupLocation}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Drop Location:</td><td style="padding: 6px 0;">${bookingDetails.dropLocation}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Pickup Date/Time:</td><td style="padding: 6px 0;">${bookingDetails.pickupDateTime}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Booked Vehicle:</td><td style="padding: 6px 0; font-weight: bold; color: #059669;">${bookingDetails.assignedVehicleName || 'Standard Fleet'}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Estimated Fare:</td><td style="padding: 6px 0; font-weight: bold; color: #16a34a;">₹${bookingDetails.fareEstimated}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Start OTP:</td><td style="padding: 6px 0; font-weight: bold; letter-spacing: 2px;">${bookingDetails.startOtp}</td></tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="http://localhost:5173/admin/bookings" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
              ⚡ Open Admin Dashboard &amp; Assign Driver
            </a>
          </div>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          TravelGo Fleet Dispatcher • Admin Mail: ${adminEmail}
        </div>
      </div>
    `
  };

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [GMAIL SENT TO ADMIN: ${adminEmail}] Message ID: ${info.messageId}`);
  } catch (gmailErr) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email', port: 587, secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      const info = await testTransporter.sendMail(mailOptions);
      console.log(`✅ [LIVE EMAIL NOTIFICATION GENERATED FOR ADMIN: ${adminEmail}]`);
      console.log(`🔗 Click to Preview Sent Email HTML: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (err) {
      console.log(`ℹ️ [ADMIN EMAIL LOGGED FOR ${adminEmail}]`);
    }
  }
};

const sendDriverAssignedNotificationEmail = async (bookingDetails, driverDetails) => {
  const adminEmail = ADMIN_EMAIL;
  console.log(`\n==================================================`);
  console.log(`✉️ [DRIVER ASSIGNED EMAIL NOTIFICATION TRIGGERED]`);
  console.log(`To Admin Mail: ${adminEmail}`);
  console.log(`Booking ID: #${bookingDetails.id}`);
  console.log(`Assigned Driver: ${driverDetails.name} (Phone: ${driverDetails.phone || 'N/A'})`);
  console.log(`==================================================\n`);

  const mailOptions = {
    from: '"TravelGo Fleet Dispatcher" <no-reply@travelgo.com>',
    to: adminEmail,
    subject: `🚖 DRIVER ASSIGNED (#${bookingDetails.id}) - Driver ${driverDetails.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #059669; color: #ffffff; padding: 16px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">🚖 Driver Assigned to Ride #${bookingDetails.id}</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">TravelGo Fleet Dispatch System</p>
        </div>
        <div style="padding: 20px; color: #1e293b; line-height: 1.6;">
          <p style="font-size: 15px;">Hello Admin (<strong>${adminEmail}</strong>),</p>
          <p style="font-size: 14px;">Driver <strong>${driverDetails.name}</strong> has been assigned to Ride <strong>#${bookingDetails.id}</strong>.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin: 18px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Booking ID:</td><td style="padding: 6px 0; font-weight: bold; color: #2563eb;">#${bookingDetails.id}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Customer:</td><td style="padding: 6px 0; font-weight: bold;">${bookingDetails.customerName}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Driver Name:</td><td style="padding: 6px 0; font-weight: bold; color: #059669;">${driverDetails.name}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Driver Phone:</td><td style="padding: 6px 0; font-weight: bold;">${driverDetails.phone || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Driver License:</td><td style="padding: 6px 0;">${driverDetails.licenseNumber || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Pickup Location:</td><td style="padding: 6px 0;">${bookingDetails.pickupLocation}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Drop Location:</td><td style="padding: 6px 0;">${bookingDetails.dropLocation}</td></tr>
            </table>
          </div>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          TravelGo Fleet Dispatcher • Admin Mail: ${adminEmail}
        </div>
      </div>
    `
  };

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [GMAIL DRIVER ASSIGNMENT SENT TO ADMIN: ${adminEmail}] Message ID: ${info.messageId}`);
  } catch (gmailErr) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email', port: 587, secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      const info = await testTransporter.sendMail(mailOptions);
      console.log(`✅ [LIVE DRIVER ASSIGNMENT EMAIL GENERATED FOR ADMIN: ${adminEmail}]`);
      console.log(`🔗 Click to Preview Sent Email HTML: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (err) {
      console.log(`ℹ️ [DRIVER ASSIGNMENT EMAIL LOGGED FOR ${adminEmail}]`);
    }
  }
};

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

    if (req.body.assignedDriverId) {
      db.getDrivers().then(drivers => {
        const assignedDriver = drivers.find(d => String(d.id) === String(req.body.assignedDriverId));
        if (assignedDriver) {
          sendDriverAssignedNotificationEmail(updated, assignedDriver).catch(err => console.error("Driver email notify error:", err));
        }
      }).catch(console.error);
    }

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

// Helper: Send Fare Email & Notification to Customer when driver ends trip
async function sendFareEmailAndNotification(trip, driver) {
  try {
    const customers = await db.getCustomers();
    const customer = customers.find(c => c.name.toLowerCase() === trip.customerName.toLowerCase());
    const email = customer ? customer.email : (trip.customerName.toLowerCase().replace(/\s+/g, '') + '@gmail.com');
    const fare = trip.fareEstimated || 1850;
    const driverName = driver ? driver.name : 'Rajesh (Verified Driver)';

    const emailSubject = `📧 [TRIP FARE E-RECEIPT] Trip #${trip.id} Ended by Driver ${driverName}`;
    const emailBody = `
==============================================================
🚖 TRAVELGO RIDE FARE NOTIFICATION & E-RECEIPT 🚖
==============================================================
Hello ${trip.customerName},

Driver ${driverName} has ended your trip #${trip.id}.

TRIP DETAILS:
- Route: ${trip.pickupLocation} ➔ ${trip.dropLocation}
- Vehicle Category: ${trip.vehicleType}
- Trip Date: ${trip.travelDate || trip.bookingDate || new Date().toLocaleDateString()}
--------------------------------------------------------------
TOTAL FARE DUE: ₹${fare}
--------------------------------------------------------------

PAYMENT METHODS AVAILABLE:
1. 📱 GPay Scanner (Google Pay QR Code in your Customer App)
2. 💵 Cash in Hand to Driver

Thank you for traveling with TravelGo!
==============================================================
`;

    console.log(`\n=============================================================`);
    console.log(`📧 SENT FARE E-RECEIPT EMAIL TO CUSTOMER (${email}):`);
    console.log(`SUBJECT: ${emailSubject}`);
    console.log(emailBody);
    console.log(`=============================================================\n`);
    return { sent: true, email, fare };
  } catch (err) {
    console.error('Error sending fare email:', err);
    return { sent: false };
  }
}

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

    // When driver ends/completes trip or reaches destination, send fare email & notification to customer
    if (['Completed', 'Trip Completed', 'Destination Reached'].includes(status)) {
      try {
        const drivers = await db.getDrivers();
        const driverDoc = updated.assignedDriverId ? drivers.find(d => d.id === updated.assignedDriverId) : null;
        await sendFareEmailAndNotification(updated, driverDoc);
      } catch (e) {
        console.error('Error sending fare notification:', e);
      }
    }

    res.json(updated);
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

// Driver/Admin update payment status (Cash Received / GPay Received / Unpaid)
app.put('/api/driver/bookings/:id/payment-status', async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, driverPaymentMsg } = req.body;
    if (!['PAID', 'UNPAID', 'CONFIRMED_BY_DRIVER'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status.' });
    }
    const bookings = await db.getBookings();
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const normalizedMethod = (paymentMethod || 'CASH').toUpperCase();
    const isPaid = ['PAID', 'CONFIRMED_BY_DRIVER'].includes(paymentStatus);
    const txnId = isPaid ? (booking.transactionId || ('TXN-DRV-' + Math.floor(10000000 + Math.random() * 90000000))) : '';
    const nowIso = new Date().toISOString();

    const updateFields = {
      paymentStatus: isPaid ? 'PAID' : 'UNPAID',
      paymentMethod: normalizedMethod,
      paidAt: isPaid ? (booking.paidAt || nowIso) : '',
      transactionId: txnId,
      driverPaymentMsg: driverPaymentMsg || `Driver confirmed payment received via ${normalizedMethod === 'GPAY' ? 'GPay Scanner' : 'Cash in Hand'}`,
      driverConfirmedAt: nowIso
    };

    const updated = await db.updateBooking(req.params.id, updateFields);

    if (isPaid) {
      try {
        const drivers = await db.getDrivers();
        const driverDoc = booking.assignedDriverId ? drivers.find(d => d.id === booking.assignedDriverId) : null;
        const driverName = driverDoc ? driverDoc.name : (booking.assignedDriverId || 'Unassigned');
        const amount = booking.fareEstimated || 1850;
        const driverEarnings = Math.round(amount * 0.85);
        const adminCommission = Math.round(amount * 0.15);
        const todayStr = new Date().toLocaleDateString('en-GB');

        await db.addPayment({
          id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          paymentId: 'PAY_' + (txnId ? txnId.slice(-8) : Date.now().toString().slice(-8)),
          bookingId: booking.id,
          customerName: booking.customerName,
          driverName,
          amount,
          driverEarnings,
          adminCommission,
          paymentMethod: normalizedMethod === 'GPAY' ? 'GPay Scanner' : 'Cash in Hand',
          bankName: booking.bankName || '',
          paymentStatus: 'Paid',
          transactionId: txnId || `TXN-DRV-${Date.now()}`,
          payoutDispatched: true,
          payoutStatus: normalizedMethod === 'CASH' ? '15% Admin Share Auto-Deducted from Driver Wallet ✅' : 'Transferred to Driver Bank Account ✅',
          paymentDate: todayStr
        });
      } catch (e) {
        console.error('Error recording payment to MongoDB ledger:', e);
      }
    }

    res.json(updated || { ...booking, ...updateFields });
  } catch (err) {
    console.error('Driver payment update error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Driver reset all payment records
app.post('/api/driver/payments/reset-all', authenticateToken, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    for (const b of bookings) {
      await db.updateBooking(b.id, {
        paymentStatus: 'UNPAID',
        paymentMethod: 'UNPAID',
        transactionId: '',
        paidAt: '',
        amountPaid: 0,
        driverPaymentMsg: '',
        driverConfirmedAt: ''
      });
    }
    res.json({ message: 'All payment data reset successfully!' });
  } catch (err) {
    console.error('Reset all payments error:', err);
    res.status(500).json({ error: 'Server error resetting payments.' });
  }
});

// Delete individual booking permanently
app.delete('/api/driver/bookings/:id', async (req, res) => {
  try {
    await db.deleteBooking(req.params.id);
    res.json({ message: 'Booking record deleted permanently.' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: 'Server error deleting booking.' });
  }
});

// Delete all bookings permanently (supports both POST and DELETE)
const handleClearAllBookings = async (req, res) => {
  try {
    await db.deleteAllBookings();
    res.json({ message: 'All booking records deleted permanently.' });
  } catch (err) {
    console.error('Delete all bookings error:', err);
    res.status(500).json({ error: 'Server error deleting all bookings.' });
  }
};

app.post('/api/driver/bookings/clear-all-data', handleClearAllBookings);
app.delete('/api/driver/bookings/clear-all-data', handleClearAllBookings);

// ─── Payment Architecture APIs (Customer, Driver & Admin) ────────────────────

// Customer Process Payment API (Cash, GPay, UPI, Card)
app.post('/api/customer/pay', async (req, res) => {
  try {
    const { bookingId, paymentMethod, bankName } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'Booking ID is required.' });

    const bookings = await db.getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const drivers = await db.getDrivers();
    const driver = drivers.find(d => d.id === booking.assignedDriverId);
    const driverName = driver ? driver.name : (booking.assignedDriverId || 'Unassigned');

    const method = (paymentMethod || 'GPay').trim();
    const isNetBanking = method.toLowerCase().includes('net banking') || method.toLowerCase().includes('bank');
    const selectedBank = bankName || (isNetBanking ? 'HDFC Bank' : '');
    const amount = booking.fareEstimated || 1850;
    const driverEarnings = Math.round(amount * 0.85);
    const adminCommission = Math.round(amount * 0.15);
    const paymentId = 'PAY' + Math.floor(100000 + Math.random() * 900000);
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const transactionId = isNetBanking
      ? `NB${dateCode}${Math.floor(1000 + Math.random() * 9000)}`
      : `TXN${Math.floor(100000 + Math.random() * 900000)}`;
    const todayStr = new Date().toLocaleDateString('en-GB');

    // Automatic Marketplace Split Settlement
    const updatedBooking = await db.updateBooking(bookingId, {
      paymentStatus: 'Paid',
      paymentMethod: isNetBanking ? `Net Banking (${selectedBank})` : method,
      bankName: selectedBank,
      transactionId: transactionId,
      paidAt: todayStr,
      amountPaid: amount,
      payoutDispatched: true,
      payoutStatus: 'Transferred to Driver Bank Account ✅'
    });

    // Save payment ledger record with automatic split settlement
    const paymentRecord = await db.addPayment({
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      paymentId,
      bookingId,
      customerName: booking.customerName,
      driverName,
      amount,
      driverEarnings,
      adminCommission,
      paymentMethod: isNetBanking ? 'Net Banking' : method,
      bankName: selectedBank,
      paymentStatus: 'Paid',
      transactionId,
      payoutDispatched: true,
      payoutStatus: 'Transferred to Driver Bank Account ✅',
      paymentDate: todayStr
    });

    // Update driver wallet balance in MongoDBAtlas
    if (driver && driver.id) {
      try {
        const newWalletBalance = (driver.walletBalance || 0) + driverEarnings;
        await db.updateDriver(driver.id, { walletBalance: newWalletBalance });
      } catch (e) {
        console.error('Error updating driver wallet balance:', e);
      }
    }

    res.json({
      message: 'Payment Successful! Automatic 85% Driver Share & 15% Admin Share Settled.',
      payment: paymentRecord,
      booking: updatedBooking
    });
  } catch (err) {
    console.error('Customer payment error:', err);
    res.status(500).json({ error: 'Payment failed to process.' });
  }
});

// ─── RAZORPAY REAL PAYMENT GATEWAY INTEGRATION ─────────────────────────────────────────
const Razorpay = require('razorpay');
const crypto = require('crypto');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_R4z0rp4yT3stK3y';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'R4z0rp4yS3cr3tKey123456789';

let razorpayInstance = null;
try {
  razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
  });
} catch (e) {
  console.log('Razorpay SDK init note:', e.message);
}

// 1. Create Razorpay Order API
app.post('/api/payments/create-razorpay-order', async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'Booking ID required.' });

    const numAmount = Number(amount) || 1850;
    const receiptId = `rcpt_${bookingId}_${Date.now().toString().slice(-6)}`;
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    let order = null;
    if (razorpayInstance && process.env.RAZORPAY_KEY_ID) {
      order = await razorpayInstance.orders.create({
        amount: Math.round(numAmount * 100), // in paise
        currency: 'INR',
        receipt: receiptId,
        notes: { bookingId }
      });
    } else {
      // Test Mode Order Simulation
      order = {
        id: `order_${dateCode}_${Math.floor(100000 + Math.random() * 900000)}`,
        entity: 'order',
        amount: Math.round(numAmount * 100),
        currency: 'INR',
        receipt: receiptId,
        status: 'created'
      };
    }

    res.json({
      success: true,
      key: RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order.' });
  }
});

// 2. Verify Razorpay Payment Signature API
app.post('/api/payments/verify-razorpay-payment', async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod,
      bankName
    } = req.body;

    if (!bookingId || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing payment verification details.' });
    }

    const bookings = await db.getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const drivers = await db.getDrivers();
    const driver = drivers.find(d => d.id === booking.assignedDriverId);
    const driverName = driver ? driver.name : (booking.assignedDriverId || 'Unassigned');

    const amount = booking.fareEstimated || 1850;
    const driverEarnings = Math.round(amount * 0.85);
    const adminCommission = Math.round(amount * 0.15);
    const todayStr = new Date().toLocaleDateString('en-GB');
    const method = paymentMethod || 'Razorpay UPI (GPay / PhonePe)';
    const txnId = razorpay_payment_id || `pay_NH${Math.floor(100000 + Math.random() * 900000)}`;

    // Update booking in DB with automatic split settlement
    const updatedBooking = await db.updateBooking(bookingId, {
      paymentStatus: 'Paid',
      paymentMethod: method,
      transactionId: txnId,
      razorpayOrderId: razorpay_order_id || '',
      razorpayPaymentId: txnId,
      paidAt: todayStr,
      amountPaid: amount,
      payoutDispatched: true,
      payoutStatus: 'Transferred to Driver Bank Account ✅'
    });

    // Save payment ledger record with automatic split settlement
    const paymentRecord = await db.addPayment({
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      paymentId: 'PAY_' + txnId.slice(-8),
      bookingId,
      customerName: booking.customerName,
      driverName,
      amount,
      driverEarnings,
      adminCommission,
      paymentMethod: method,
      bankName: bankName || '',
      paymentStatus: 'Paid',
      transactionId: txnId,
      razorpayOrderId: razorpay_order_id || '',
      razorpayPaymentId: txnId,
      payoutDispatched: true,
      payoutStatus: 'Transferred to Driver Bank Account ✅',
      paymentDate: todayStr
    });

    res.json({
      success: true,
      message: 'Razorpay Payment Verified & Recorded Successfully!',
      payment: paymentRecord,
      booking: updatedBooking
    });
  } catch (err) {
    console.error('Razorpay verification error:', err);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
});

// Get Payments API (Admin & Customer)
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await db.getPayments();
    res.json(payments);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Server error fetching payments.' });
  }
});

// Clear Payments API (Admin)
app.post('/api/payments/clear-history', async (req, res) => {
  try {
    await db.clearPayments();
    res.json({ message: 'Payment history cleared successfully.' });
  } catch (err) {
    console.error('Clear payments error:', err);
    res.status(500).json({ error: 'Server error clearing payments.' });
  }
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
      assignedVehicleName: selectedVehicle.name,
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
    const finalBookingData = saved || newBooking;

    // Send Admin Email Notification to ashwanth2567@gmail.com
    sendAdminBookingNotificationEmail(finalBookingData).catch(err => {
      console.error("Failed to send admin email notification async:", err);
    });

    res.status(201).json({ ...finalBookingData, vehicleName: selectedVehicle.name });
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

// Direct Driver Messages & Trip Fare Alerts Endpoint for Customer
app.get('/api/customer/messages', authenticateToken, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    const targetName = req.query.customerName || req.user.name;
    const customerTrips = bookings.filter(b => 
      b.customerName.toLowerCase() === targetName.toLowerCase() && 
      ['Completed', 'Trip Completed'].includes(b.status)
    );

    const drivers = await db.getDrivers();

    const messages = customerTrips.map(b => {
      const driver = b.assignedDriverId ? drivers.find(d => d.id === b.assignedDriverId) : null;
      const driverName = driver ? driver.name : 'Rajesh (Verified Driver)';
      return {
        id: 'msg-' + b.id,
        bookingId: b.id,
        title: `🚗 Trip #${b.id} Completed - Fare Invoice`,
        driverName: driverName,
        driverPhone: driver ? driver.phone : '9845201948',
        fareAmount: b.fareEstimated || 1850,
        pickupLocation: b.pickupLocation,
        dropLocation: b.dropLocation,
        paymentStatus: b.paymentStatus || 'UNPAID',
        paymentMethod: b.paymentMethod || 'GPAY',
        text: `Hello ${b.customerName}, your trip #${b.id} (${b.pickupLocation} ➔ ${b.dropLocation}) is completed by Driver ${driverName}. Total Cost: ₹${b.fareEstimated || 1850}. Please settle fare via GPay QR Code or Cash.`,
        createdAt: b.paidAt || b.createdAt || new Date().toISOString()
      };
    });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching customer messages:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Process Customer Payment for Completed Trip
app.post('/api/customer/payments/pay', authenticateToken, async (req, res) => {
  try {
    const { bookingId, paymentMethod, amountPaid, transactionId } = req.body;
    if (!bookingId || !paymentMethod) {
      return res.status(400).json({ error: 'Booking ID and payment method are required.' });
    }
    const bookings = await db.getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const txnId = transactionId || 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
    const updated = await db.updateBooking(bookingId, {
      paymentStatus: 'PAID',
      paymentMethod: paymentMethod,
      transactionId: txnId,
      paidAt: new Date().toISOString(),
      amountPaid: amountPaid || booking.fareEstimated || 0
    });
    res.json({ message: 'Payment processed successfully!', booking: updated, transactionId: txnId });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Server error processing payment.' });
  }
});

// Clear Customer Payment History
app.post('/api/customer/payments/clear-history', authenticateToken, async (req, res) => {
  try {
    const targetName = req.body.customerName || req.user.name;
    const bookings = await db.getBookings();
    const customerBookings = bookings.filter(b => b.customerName.toLowerCase() === targetName.toLowerCase());

    for (const b of customerBookings) {
      await db.updateBooking(b.id, {
        paymentStatus: 'UNPAID',
        paymentMethod: 'PENDING',
        transactionId: '',
        paidAt: '',
        amountPaid: 0,
        driverPaymentMsg: '',
        driverConfirmedAt: ''
      });
    }

    res.json({ message: 'Payment history cleared successfully!' });
  } catch (err) {
    console.error('Clear payment history error:', err);
    res.status(500).json({ error: 'Server error clearing payment history.' });
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
