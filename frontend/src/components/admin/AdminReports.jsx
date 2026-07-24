import React, { useState, useMemo } from 'react';
import { BarChart, AreaChart, DoughnutChart, HorizontalBarChart } from './ChartComponents';

function AdminReports({ token, stats, bookings = [], vehicles = [], drivers = [], refresh, toast }) {
  const [activeReport, setActiveReport] = useState('booking'); // 'booking' | 'trip' | 'driver' | 'vehicle' | 'completed' | 'cancelled' | 'revenue'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── FILTER STATES ──────────────────────────────────────────────────────────
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');
  const [tripStatusFilter, setTripStatusFilter] = useState('All');
  const [driverFilter, setDriverFilter] = useState('All');
  const [vehicleFilter, setVehicleFilter] = useState('All');

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setBookingStatusFilter('All');
    setTripStatusFilter('All');
    setDriverFilter('All');
    setVehicleFilter('All');
  };

  // ─── FILTERED DATA COMPUTATION ──────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Date filter
      const bDateStr = b.createdAt || b.pickupDateTime;
      if (fromDate && bDateStr) {
        if (new Date(bDateStr) < new Date(fromDate)) return false;
      }
      if (toDate && bDateStr) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        if (new Date(bDateStr) > endDate) return false;
      }

      // Booking status filter
      if (bookingStatusFilter !== 'All' && b.status !== bookingStatusFilter) {
        return false;
      }

      // Trip status filter (for active trip statuses)
      if (tripStatusFilter !== 'All' && b.status !== tripStatusFilter) {
        return false;
      }

      // Driver filter
      if (driverFilter !== 'All' && b.assignedDriverId !== driverFilter) {
        return false;
      }

      // Vehicle filter (by ID or category)
      if (vehicleFilter !== 'All') {
        const matchesCategory = b.vehicleType && b.vehicleType.toLowerCase() === vehicleFilter.toLowerCase();
        const matchesId = b.assignedVehicleId === vehicleFilter;
        if (!matchesCategory && !matchesId) return false;
      }

      return true;
    });
  }, [bookings, fromDate, toDate, bookingStatusFilter, tripStatusFilter, driverFilter, vehicleFilter]);

  // Filtered Summary KPIs
  const totalFilteredRevenue = useMemo(() => {
    return filteredBookings
      .filter(b => ['Completed', 'Trip Completed'].includes(b.status))
      .reduce((sum, b) => sum + (b.fareEstimated || 0), 0);
  }, [filteredBookings]);

  const completedTripsCount = useMemo(() => {
    return filteredBookings.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).length;
  }, [filteredBookings]);

  const cancelledBookingsCount = useMemo(() => {
    return filteredBookings.filter(b => b.status === 'Cancelled').length;
  }, [filteredBookings]);

  const activeTripsCount = useMemo(() => {
    return filteredBookings.filter(b => ['In Progress', 'Trip Started', 'Customer Picked Up', 'Ongoing', 'Destination Reached'].includes(b.status)).length;
  }, [filteredBookings]);

  // ─── CSV EXPORT FUNCTION ───────────────────────────────────────────────────
  const exportToCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `report_${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeReport === 'booking' || activeReport === 'completed' || activeReport === 'cancelled' || activeReport === 'revenue') {
      headers = ["Booking ID", "Customer Name", "Pickup Location", "Drop Location", "Travel Date", "Vehicle Type", "Assigned Driver", "Status", "Fare (INR)"];
      
      let targetList = filteredBookings;
      if (activeReport === 'completed') targetList = filteredBookings.filter(b => ['Completed', 'Trip Completed'].includes(b.status));
      if (activeReport === 'cancelled') targetList = filteredBookings.filter(b => b.status === 'Cancelled');

      rows = targetList.map(b => {
        const dObj = drivers.find(d => d.id === b.assignedDriverId);
        return [
          b.id,
          `"${b.customerName || ''}"`,
          `"${b.pickupLocation || ''}"`,
          `"${b.dropLocation || ''}"`,
          b.pickupDateTime || b.travelDate || '',
          b.vehicleType || '',
          `"${dObj ? dObj.name : (b.assignedDriverId || 'Unassigned')}"`,
          b.status || '',
          b.fareEstimated || 0
        ];
      });
    } else if (activeReport === 'trip') {
      headers = ["Booking ID", "Customer", "Pickup Location", "Drop Location", "Trip Status", "Assigned Driver", "Assigned Vehicle", "Fare (INR)"];
      const activeTripsList = filteredBookings.filter(b => ['In Progress', 'Trip Started', 'Customer Picked Up', 'Ongoing', 'Destination Reached', 'Confirmed'].includes(b.status));
      rows = activeTripsList.map(b => {
        const dObj = drivers.find(d => d.id === b.assignedDriverId);
        const vObj = vehicles.find(v => v.id === b.assignedVehicleId);
        return [
          b.id,
          `"${b.customerName || ''}"`,
          `"${b.pickupLocation || ''}"`,
          `"${b.dropLocation || ''}"`,
          b.status,
          `"${dObj ? dObj.name : 'Unassigned'}"`,
          `"${vObj ? vObj.name + ' (' + vObj.plateNumber + ')' : 'Unassigned'}"`,
          b.fareEstimated || 0
        ];
      });
    } else if (activeReport === 'driver') {
      headers = ["Driver ID", "Driver Name", "Phone", "License Number", "Total Trips", "Completed Trips", "Cancelled Trips", "Revenue Generated (INR)", "Status"];
      rows = drivers.map(d => {
        const dTrips = bookings.filter(b => b.assignedDriverId === d.id);
        const dCompleted = dTrips.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).length;
        const dCancelled = dTrips.filter(b => b.status === 'Cancelled').length;
        const dEarnings = dTrips.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).reduce((s, b) => s + (b.fareEstimated || 0), 0);
        return [
          d.id,
          `"${d.name || ''}"`,
          `"${d.phone || ''}"`,
          d.licenseNumber || '',
          dTrips.length,
          dCompleted,
          dCancelled,
          dEarnings,
          d.status || 'Available'
        ];
      });
    } else if (activeReport === 'vehicle') {
      headers = ["Vehicle ID", "Vehicle Name", "Plate Number", "Category", "Rate Per Km", "Completed Trips", "Total Earnings (INR)", "Status"];
      rows = vehicles.map(v => {
        const vTrips = bookings.filter(b => b.assignedVehicleId === v.id);
        const vCompleted = vTrips.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).length;
        const vEarnings = vTrips.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).reduce((s, b) => s + (b.fareEstimated || 0), 0);
        return [
          v.id,
          `"${v.name || ''}"`,
          v.plateNumber || '',
          v.type || '',
          v.ratePerKm || 0,
          vCompleted,
          vEarnings,
          v.status || 'Available'
        ];
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left', paddingBottom: '40px' }}>
      
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
            Reports & Analytics Hub
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0 }}>
            Generate audit logs, track fleet usage, and monitor driver performance indexes.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={exportToCSV} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontWeight: '600' }}
          >
            📥 Export CSV
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => window.print()} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontWeight: '600', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            📄 Export PDF
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleRefreshClick} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontWeight: '600' }}
          >
            <svg className={isRefreshing ? 'icon-spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* ─── DYNAMIC KPI SUMMARY CARDS ─── */}
      <div className="dashboard-grid">
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Filtered Revenue</div>
            <div style={{ color: '#10b981', fontSize: '26px', fontWeight: '800', margin: '4px 0' }}>₹{totalFilteredRevenue.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {completedTripsCount} completed rides</div>
          </div>
          <div style={{ backgroundColor: 'var(--status-inprogress-bg)', padding: '12px', borderRadius: '12px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Matching Bookings</div>
            <div style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0' }}>{filteredBookings.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeTripsCount} active in progress</div>
          </div>
          <div style={{ backgroundColor: 'var(--status-confirmed-bg)', padding: '12px', borderRadius: '12px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Completed Rides</div>
            <div style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0' }}>{completedTripsCount}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cancelledBookingsCount} cancelled</div>
          </div>
          <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Cancelled Rides</div>
            <div style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0', color: '#ef4444' }}>{cancelledBookingsCount}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aborted or rejected</div>
          </div>
          <div style={{ backgroundColor: 'var(--status-cancelled-bg)', padding: '12px', borderRadius: '12px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
        </div>
      </div>

      {/* ─── MULTI-CRITERIA FILTER BAR ─── */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-primary)' }}>
            🔍 Multi-Criteria Filter Controls
          </h3>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '4px 10px', fontSize: '12px' }} 
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          
          {/* From Date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>From Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
            />
          </div>

          {/* To Date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>To Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} 
            />
          </div>

          {/* Booking Status Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Booking Status</label>
            <select 
              className="form-select" 
              value={bookingStatusFilter} 
              onChange={(e) => setBookingStatusFilter(e.target.value)}
            >
              <option value="All">All Booking Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Trip Status Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Trip Telemetry Status</label>
            <select 
              className="form-select" 
              value={tripStatusFilter} 
              onChange={(e) => setTripStatusFilter(e.target.value)}
            >
              <option value="All">All Trip Statuses</option>
              <option value="Trip Started">Trip Started</option>
              <option value="Customer Picked Up">Customer Picked Up</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Destination Reached">Destination Reached</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Driver Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Filter Driver</label>
            <select 
              className="form-select" 
              value={driverFilter} 
              onChange={(e) => setDriverFilter(e.target.value)}
            >
              <option value="All">All Drivers</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
              ))}
            </select>
          </div>

          {/* Vehicle Category Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Vehicle / Category</label>
            <select 
              className="form-select" 
              value={vehicleFilter} 
              onChange={(e) => setVehicleFilter(e.target.value)}
            >
              <option value="All">All Vehicles & Categories</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Minivan">Minivan</option>
              <option value="Luxury">Luxury</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.plateNumber})</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ─── 7 REPORT TABS NAVIGATION ─── */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { key: 'booking', label: '📋 Booking Report' },
          { key: 'trip', label: '🚗 Trip Report' },
          { key: 'driver', label: '👨‍✈️ Driver Performance' },
          { key: 'vehicle', label: '🚙 Vehicle Usage' },
          { key: 'completed', label: '✅ Completed Trips' },
          { key: 'cancelled', label: '❌ Cancelled Bookings' },
          { key: 'revenue', label: '💰 Revenue Report' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveReport(tab.key)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: activeReport === tab.key ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
              backgroundColor: activeReport === tab.key ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)',
              color: activeReport === tab.key ? 'var(--text-dark)' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── REPORT CONTENT TABLES ─── */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        
        {/* 1. BOOKING REPORT */}
        {activeReport === 'booking' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800' }}>Master Booking Log</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer Name</th>
                    <th>Pickup & Drop Location</th>
                    <th>Travel Date & Time</th>
                    <th>Vehicle Type</th>
                    <th>Assigned Driver</th>
                    <th>Fare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No bookings match active filters.</td>
                    </tr>
                  ) : (
                    filteredBookings.map(b => {
                      const dObj = drivers.find(d => d.id === b.assignedDriverId);
                      return (
                        <tr key={b.id}>
                          <td><strong>{b.id}</strong></td>
                          <td style={{ fontWeight: '600' }}>{b.customerName}</td>
                          <td style={{ fontSize: '12px' }}>{b.pickupLocation} → {b.dropLocation}</td>
                          <td>{b.pickupDateTime || b.travelDate}</td>
                          <td><span className="badge badge-confirmed">{b.vehicleType}</span></td>
                          <td>{dObj ? dObj.name : (b.assignedDriverId || 'Unassigned')}</td>
                          <td style={{ fontWeight: '700', color: '#10b981' }}>₹{b.fareEstimated}</td>
                          <td>
                            <span className={`badge badge-${b.status === 'Completed' ? 'completed' : b.status === 'Cancelled' ? 'cancelled' : b.status === 'In Progress' ? 'inprogress' : 'pending'}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. TRIP REPORT */}
        {activeReport === 'trip' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800' }}>Active & Scheduled Trip Telemetry</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Route Detail</th>
                    <th>Current Status</th>
                    <th>Assigned Driver</th>
                    <th>Assigned Vehicle</th>
                    <th>Fare</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.filter(b => ['In Progress', 'Trip Started', 'Customer Picked Up', 'Ongoing', 'Destination Reached', 'Confirmed'].includes(b.status)).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active or scheduled trips match filters.</td>
                    </tr>
                  ) : (
                    filteredBookings
                      .filter(b => ['In Progress', 'Trip Started', 'Customer Picked Up', 'Ongoing', 'Destination Reached', 'Confirmed'].includes(b.status))
                      .map(b => {
                        const dObj = drivers.find(d => d.id === b.assignedDriverId);
                        const vObj = vehicles.find(v => v.id === b.assignedVehicleId);
                        return (
                          <tr key={b.id}>
                            <td><strong>{b.id}</strong></td>
                            <td style={{ fontWeight: '600' }}>{b.customerName}</td>
                            <td style={{ fontSize: '12px' }}>{b.pickupLocation} → {b.dropLocation}</td>
                            <td>
                              <span className="badge badge-inprogress">{b.status}</span>
                            </td>
                            <td>{dObj ? dObj.name : 'Unassigned'}</td>
                            <td>{vObj ? `${vObj.name} (${vObj.plateNumber})` : 'Unassigned'}</td>
                            <td style={{ fontWeight: '700', color: '#10b981' }}>₹{b.fareEstimated}</td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. DRIVER PERFORMANCE REPORT */}
        {activeReport === 'driver' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800' }}>Driver Performance & Utilization Audit</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Driver ID</th>
                    <th>Driver Name</th>
                    <th>Phone</th>
                    <th>License Number</th>
                    <th>Total Assigned Trips</th>
                    <th>Completed Rides</th>
                    <th>Cancelled Rides</th>
                    <th>Total Earnings Generated</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No drivers registered.</td>
                    </tr>
                  ) : (
                    drivers.map(d => {
                      const dTrips = filteredBookings.filter(b => b.assignedDriverId === d.id);
                      const dCompleted = dTrips.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).length;
                      const dCancelled = dTrips.filter(b => b.status === 'Cancelled').length;
                      const dEarnings = dTrips.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).reduce((s, b) => s + (b.fareEstimated || 0), 0);
                      return (
                        <tr key={d.id}>
                          <td><strong>{d.id}</strong></td>
                          <td style={{ fontWeight: '600' }}>{d.name}</td>
                          <td>{d.phone}</td>
                          <td>{d.licenseNumber}</td>
                          <td style={{ fontWeight: '700' }}>{dTrips.length}</td>
                          <td style={{ color: '#10b981', fontWeight: '700' }}>{dCompleted}</td>
                          <td style={{ color: '#ef4444', fontWeight: '700' }}>{dCancelled}</td>
                          <td style={{ color: '#10b981', fontWeight: '800' }}>₹{dEarnings.toLocaleString("en-IN")}</td>
                          <td>
                            <span className={`badge badge-${d.status === 'On Trip' ? 'ontrip' : d.status === 'Inactive' ? 'inactive' : 'available'}`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. VEHICLE USAGE REPORT */}
        {activeReport === 'vehicle' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800' }}>Fleet Vehicle Usage & Revenue Report</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle ID</th>
                    <th>Vehicle Model</th>
                    <th>Plate Number</th>
                    <th>Category</th>
                    <th>Rate/Km</th>
                    <th>Completed Rides</th>
                    <th>Total Earnings</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No vehicles registered.</td>
                    </tr>
                  ) : (
                    vehicles.map(v => {
                      const vTrips = filteredBookings.filter(b => b.assignedVehicleId === v.id);
                      const vCompleted = vTrips.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).length;
                      const vEarnings = vTrips.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).reduce((s, b) => s + (b.fareEstimated || 0), 0);
                      return (
                        <tr key={v.id}>
                          <td><strong>{v.id}</strong></td>
                          <td style={{ fontWeight: '600' }}>{v.name}</td>
                          <td>{v.plateNumber}</td>
                          <td><span className="badge badge-confirmed">{v.type}</span></td>
                          <td>₹{v.ratePerKm}/km</td>
                          <td style={{ fontWeight: '700' }}>{vCompleted}</td>
                          <td style={{ color: '#10b981', fontWeight: '800' }}>₹{vEarnings.toLocaleString("en-IN")}</td>
                          <td>
                            <span className={`badge badge-${v.status === 'On Trip' ? 'ontrip' : (v.status === 'Inactive' || v.status === 'Under Maintenance') ? 'inactive' : v.status === 'Assigned' ? 'assigned' : 'available'}`}>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. COMPLETED TRIP REPORT */}
        {activeReport === 'completed' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800' }}>Completed Rides Audit Report</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer Name</th>
                    <th>Route</th>
                    <th>Assigned Driver</th>
                    <th>Vehicle Type</th>
                    <th>Travel Date</th>
                    <th>Fare Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No completed trips match filters.</td>
                    </tr>
                  ) : (
                    filteredBookings
                      .filter(b => ['Completed', 'Trip Completed'].includes(b.status))
                      .map(b => {
                        const dObj = drivers.find(d => d.id === b.assignedDriverId);
                        return (
                          <tr key={b.id}>
                            <td><strong>{b.id}</strong></td>
                            <td style={{ fontWeight: '600' }}>{b.customerName}</td>
                            <td style={{ fontSize: '12px' }}>{b.pickupLocation} → {b.dropLocation}</td>
                            <td>{dObj ? dObj.name : (b.assignedDriverId || 'Unassigned')}</td>
                            <td><span className="badge badge-confirmed">{b.vehicleType}</span></td>
                            <td>{b.pickupDateTime || b.travelDate}</td>
                            <td style={{ fontWeight: '800', color: '#10b981' }}>₹{b.fareEstimated}</td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. CANCELLED BOOKING REPORT */}
        {activeReport === 'cancelled' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800' }}>Cancelled Bookings & Lost Revenue Log</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer Name</th>
                    <th>Route</th>
                    <th>Vehicle Type</th>
                    <th>Date Requested</th>
                    <th>Notes / Reason</th>
                    <th>Estimated Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.filter(b => b.status === 'Cancelled').length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No cancelled bookings match filters.</td>
                    </tr>
                  ) : (
                    filteredBookings
                      .filter(b => b.status === 'Cancelled')
                      .map(b => (
                        <tr key={b.id}>
                          <td><strong>{b.id}</strong></td>
                          <td style={{ fontWeight: '600' }}>{b.customerName}</td>
                          <td style={{ fontSize: '12px' }}>{b.pickupLocation} → {b.dropLocation}</td>
                          <td><span className="badge badge-pending">{b.vehicleType}</span></td>
                          <td>{b.createdAt || b.pickupDateTime}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.notes || 'Cancelled by user/admin'}</td>
                          <td style={{ fontWeight: '700', color: '#ef4444' }}>₹{b.fareEstimated}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. REVENUE REPORT */}
        {activeReport === 'revenue' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800' }}>Financial Revenue Breakdown</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer Name</th>
                    <th>Vehicle Category</th>
                    <th>Assigned Driver</th>
                    <th>Trip Status</th>
                    <th>Fare Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.filter(b => ['Completed', 'Trip Completed'].includes(b.status)).length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No revenue transactions match active filters.</td>
                    </tr>
                  ) : (
                    filteredBookings
                      .filter(b => ['Completed', 'Trip Completed'].includes(b.status))
                      .map(b => {
                        const dObj = drivers.find(d => d.id === b.assignedDriverId);
                        return (
                          <tr key={b.id}>
                            <td><strong>{b.id}</strong></td>
                            <td style={{ fontWeight: '600' }}>{b.customerName}</td>
                            <td><span className="badge badge-confirmed">{b.vehicleType}</span></td>
                            <td>{dObj ? dObj.name : (b.assignedDriverId || 'Unassigned')}</td>
                            <td><span className="badge badge-completed">{b.status}</span></td>
                            <td style={{ fontWeight: '800', color: '#10b981', fontSize: '15px' }}>₹{b.fareEstimated}</td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default AdminReports;
