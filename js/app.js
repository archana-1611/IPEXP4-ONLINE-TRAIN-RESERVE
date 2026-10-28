/**
 * Online Train Reservation System (RailSafar)
 * Core Application Controller
 * Experiment 4: Internet Programming
 */

// Application State
const AppState = {
    currentUser: null,
    searchParams: {
        origin: 'NDLS',
        destination: 'MMCT',
        date: '',
        travelClass: 'ALL'
    },
    selectedTrain: null,
    selectedClass: '2A',
    passengers: [],
    selectedSeats: [],
    activeView: 'view-search'
};

// ============================================================================
// Initialization & Lifecycle
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize State from Storage
    AppState.currentUser = RailDB.getCurrentUser();
    
    // Set default journey date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const searchDateInput = document.getElementById('searchDate');
    if (searchDateInput) {
        searchDateInput.min = new Date().toISOString().split('T')[0];
        searchDateInput.value = tomorrowStr;
        AppState.searchParams.date = tomorrowStr;
    }

    // 2. Populate Stations Dropdowns
    populateStationDropdowns();

    // 3. Update Auth Navigation state
    updateAuthUI();

    // 4. Attach Event Listeners
    setupEventListeners();

    // 5. Initial Search Display with default sample trains
    handleTrainSearch();

    // 6. Generate UPI QR Code simulator
    generateUpiQrCode('pay@railways', 3120);
});

// ============================================================================
// UI Navigation & View Switcher
// ============================================================================
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active-view');
    });

    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active-view');
        AppState.activeView = viewId;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update active state in nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-view') === viewId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Special view triggers
    if (viewId === 'view-my-bookings') {
        renderMyBookings();
    } else if (viewId === 'view-admin') {
        if (!AppState.currentUser || AppState.currentUser.role !== 'admin') {
            showToast('Access Denied: Administrator privileges required.', 'error');
            switchView('view-search');
            openAuthModal('loginTab');
            return;
        }
        renderAdminDashboard();
    }
}

// ============================================================================
// Station Dropdowns & Setup
// ============================================================================
function populateStationDropdowns() {
    const originSelect = document.getElementById('searchOrigin');
    const destSelect = document.getElementById('searchDestination');
    const newOriginSelect = document.getElementById('newTrainOrigin');
    const newDestSelect = document.getElementById('newTrainDestination');

    if (!originSelect || !destSelect) return;

    originSelect.innerHTML = '';
    destSelect.innerHTML = '';
    if (newOriginSelect) newOriginSelect.innerHTML = '';
    if (newDestSelect) newDestSelect.innerHTML = '';

    STATIONS.forEach((stn, idx) => {
        const opt1 = new Option(`${stn.name} (${stn.code}) - ${stn.city}`, stn.code);
        const opt2 = new Option(`${stn.name} (${stn.code}) - ${stn.city}`, stn.code);

        originSelect.add(opt1);
        destSelect.add(opt2);

        if (newOriginSelect && newDestSelect) {
            newOriginSelect.add(new Option(`${stn.name} (${stn.code})`, stn.code));
            newDestSelect.add(new Option(`${stn.name} (${stn.code})`, stn.code));
        }
    });

    // Set defaults: New Delhi -> Mumbai Central
    originSelect.value = 'NDLS';
    destSelect.value = 'MMCT';
}

// ============================================================================
// Authentication Module
// ============================================================================
function updateAuthUI() {
    const unauthNav = document.getElementById('unauthNav');
    const authNav = document.getElementById('authNav');
    const navMyBookingsItem = document.getElementById('navMyBookingsItem');
    const navAdminItem = document.getElementById('navAdminItem');
    const navUserName = document.getElementById('navUserName');
    const navUserRole = document.getElementById('navUserRole');
    const navAvatar = document.getElementById('navAvatar');

    if (AppState.currentUser) {
        unauthNav.style.display = 'none';
        authNav.style.display = 'flex';
        navUserName.textContent = AppState.currentUser.fullName;
        navUserRole.textContent = AppState.currentUser.role === 'admin' ? 'Railway Admin' : 'Passenger';
        navAvatar.textContent = AppState.currentUser.fullName.charAt(0).toUpperCase();

        navMyBookingsItem.style.display = 'block';
        if (AppState.currentUser.role === 'admin') {
            navAdminItem.style.display = 'block';
        } else {
            navAdminItem.style.display = 'none';
        }
    } else {
        unauthNav.style.display = 'block';
        authNav.style.display = 'none';
        navMyBookingsItem.style.display = 'none';
        navAdminItem.style.display = 'none';
    }
}

function openAuthModal(tabName = 'loginTab') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.add('active');

    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
            btn.classList.remove('btn-secondary');
        } else {
            btn.classList.remove('active');
            btn.classList.add('btn-secondary');
        }
    });

    document.getElementById('loginTab').style.display = tabName === 'loginTab' ? 'block' : 'none';
    document.getElementById('registerTab').style.display = tabName === 'registerTab' ? 'block' : 'none';
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
}

function handleLogin(email, password) {
    const users = RailDB.get(STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password);

    if (!user) {
        showToast('Invalid email or password. Please try again.', 'error');
        return false;
    }

    if (user.status === 'Blocked') {
        showToast('This account has been suspended by Railway Administration.', 'error');
        return false;
    }

    AppState.currentUser = user;
    RailDB.setCurrentUser(user);
    updateAuthUI();
    closeAuthModal();
    showToast(`Welcome back, ${user.fullName}!`, 'success');

    if (user.role === 'admin') {
        switchView('view-admin');
    }
    return true;
}

function handleRegister(fullName, email, phone, password) {
    const users = RailDB.get(STORAGE_KEYS.USERS) || [];
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (exists) {
        showToast('An account with this email already exists. Please log in.', 'warning');
        return false;
    }

    const newUser = {
        id: 'USR-' + Math.floor(100000 + Math.random() * 900000),
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: password,
        role: 'passenger',
        status: 'Active',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    RailDB.set(STORAGE_KEYS.USERS, users);

    AppState.currentUser = newUser;
    RailDB.setCurrentUser(newUser);
    updateAuthUI();
    closeAuthModal();
    showToast(`Registration successful! Welcome to RailSafar, ${newUser.fullName}.`, 'success');
    return true;
}

function handleLogout() {
    AppState.currentUser = null;
    RailDB.setCurrentUser(null);
    updateAuthUI();
    showToast('You have been logged out safely.', 'info');
    switchView('view-search');
}

// ============================================================================
// Train Search & Route Listing
// ============================================================================
function handleTrainSearch() {
    const origin = document.getElementById('searchOrigin').value;
    const dest = document.getElementById('searchDestination').value;
    const date = document.getElementById('searchDate').value;
    const travelClass = document.getElementById('searchClass').value;

    if (origin === dest) {
        showToast('Origin and Destination stations cannot be identical.', 'warning');
        return;
    }

    AppState.searchParams = { origin, dest, date, travelClass };

    const trains = RailDB.get(STORAGE_KEYS.TRAINS) || [];
    const fareRules = RailDB.get(STORAGE_KEYS.FARE_RULES) || {};

    // Filter trains that serve this route (either direct origin/dest or via stations in correct order)
    const matchedTrains = trains.filter(t => {
        // Direct origin & destination match
        if (t.origin === origin && t.destination === dest) return true;

        // Check if both stations exist in via list in correct sequence
        if (t.viaStations && t.viaStations.length > 0) {
            const originIndex = t.viaStations.findIndex(s => s.station === origin);
            const destIndex = t.viaStations.findIndex(s => s.station === dest);
            if (originIndex !== -1 && destIndex !== -1 && originIndex < destIndex) {
                return true;
            }
        }
        return false;
    });

    renderTrainResults(matchedTrains, origin, dest, date, travelClass);
}

function renderTrainResults(trains, origin, dest, date, travelClass) {
    const container = document.getElementById('trainResultsContainer');
    const trainList = document.getElementById('trainList');
    const resultsCount = document.getElementById('resultsCount');
    const resultsRouteSubtitle = document.getElementById('resultsRouteSubtitle');

    container.style.display = 'block';
    resultsCount.textContent = trains.length;

    const origStation = STATIONS.find(s => s.code === origin) || { name: origin };
    const destStation = STATIONS.find(s => s.code === dest) || { name: dest };
    resultsRouteSubtitle.textContent = `${origStation.name} (${origin}) to ${destStation.name} (${dest}) on ${formatDisplayDate(date)}`;

    if (trains.length === 0) {
        trainList.innerHTML = `
            <div class="train-card" style="padding: 40px; text-align: center;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 12px;"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                <h3>No Direct Trains Found</h3>
                <p style="color: var(--text-secondary); margin-top: 6px;">Try modifying stations (e.g. NDLS to MMCT, NDLS to BSB, or MAS to SBC) or changing the travel date.</p>
            </div>
        `;
        return;
    }

    trainList.innerHTML = trains.map(train => {
        // Build days pills
        const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const daysHtml = allDays.map(d => `
            <div class="day-pill ${train.runsOn.includes(d) ? 'active' : 'inactive'}">${d.charAt(0)}</div>
        `).join('');

        // Build class cards
        const classEntries = Object.entries(train.classes || {});
        const classCardsHtml = classEntries.map(([code, details]) => {
            let statusText = '';
            let statusColor = '';

            if (details.available > 0) {
                statusText = `AVL ${details.available}`;
                statusColor = '#34d399';
            } else if (details.rac > 0) {
                statusText = `RAC ${details.rac}`;
                statusColor = '#fbbf24';
            } else {
                statusText = `WL ${details.wl || 1}`;
                statusColor = '#f87171';
            }

            return `
                <div class="class-card" onclick="startBooking('${train.id}', '${code}')">
                    <div class="class-header">
                        <span class="class-code">${code}</span>
                        <span class="class-fare">₹${details.baseFare.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="class-status-text" style="color: ${statusColor};">
                        ${statusText}
                    </div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
                        Click to Book
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="train-card">
                <div class="train-card-header">
                    <div class="train-identification">
                        <span class="train-no-badge">${train.trainNo}</span>
                        <div>
                            <div class="train-name">${train.trainName}</div>
                            <div style="font-size: 0.78rem; color: var(--text-secondary);">Zone: ${train.zone} Railway</div>
                        </div>
                    </div>
                    <div class="train-runs-badge">
                        <span>Runs On:</span>
                        <div style="display: flex; gap: 4px;">${daysHtml}</div>
                    </div>
                </div>

                <div class="train-schedule-grid">
                    <div class="schedule-point">
                        <span class="point-time">${train.departureTime}</span>
                        <span class="point-station">${train.originName} (${train.origin})</span>
                        <span class="point-sub">Day 1</span>
                    </div>

                    <div class="journey-duration-track">
                        <span class="duration-text">${train.duration}</span>
                        <div class="duration-line"></div>
                        <button class="btn-via-route" onclick="showViaStationsModal('${train.id}')">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                            View Via Halts (${train.viaStations ? train.viaStations.length : 0} Stns)
                        </button>
                    </div>

                    <div class="schedule-point" style="text-align: right;">
                        <span class="point-time">${train.arrivalTime}</span>
                        <span class="point-station">${train.destinationName} (${train.destination})</span>
                        <span class="point-sub">Distance: ${train.distanceKm} Km</span>
                    </div>

                    <div>
                        <button class="btn btn-primary btn-sm" onclick="startBooking('${train.id}', 'default')">
                            Book Now
                        </button>
                    </div>
                </div>

                <div class="class-availability-row">
                    ${classCardsHtml}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================================
// Via Route & Halts Modal
// ============================================================================
function showViaStationsModal(trainId) {
    const trains = RailDB.get(STORAGE_KEYS.TRAINS) || [];
    const train = trains.find(t => t.id === trainId);
    if (!train) return;

    const modal = document.getElementById('viaStationsModal');
    const title = document.getElementById('viaModalTrainTitle');
    const sub = document.getElementById('viaModalTrainSub');
    const body = document.getElementById('viaModalBody');

    title.textContent = `${train.trainNo} - ${train.trainName}`;
    sub.textContent = `Route Timeline: ${train.originName} to ${train.destinationName} (${train.distanceKm} Km)`;

    if (!train.viaStations || train.viaStations.length === 0) {
        body.innerHTML = `<p style="color: var(--text-secondary);">Direct non-stop service between origin and destination.</p>`;
    } else {
        const rows = train.viaStations.map((stn, i) => `
            <tr>
                <td style="font-weight: 700;">#${i + 1}</td>
                <td><strong>${stn.name}</strong> (${stn.station})</td>
                <td>${stn.arrival}</td>
                <td>${stn.departure}</td>
                <td>${stn.haltMin > 0 ? stn.haltMin + ' mins' : '--'}</td>
                <td>${stn.distance} Km</td>
                <td>Day ${stn.day || 1}</td>
            </tr>
        `).join('');

        body.innerHTML = `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Stop</th>
                            <th>Station Name</th>
                            <th>Arrival</th>
                            <th>Departure</th>
                            <th>Halt</th>
                            <th>Distance</th>
                            <th>Day</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    modal.classList.add('active');
}

// ============================================================================
// Booking Flow & Passenger Form Builder (Requirement 1 & 2)
// ============================================================================
function startBooking(trainId, classCode) {
    // Check authentication requirement first (Requirement 1)
    if (!AppState.currentUser) {
        showToast('Please log in with valid credentials before reserving tickets.', 'warning');
        openAuthModal('loginTab');
        return;
    }

    const trains = RailDB.get(STORAGE_KEYS.TRAINS) || [];
    const train = trains.find(t => t.id === trainId);
    if (!train) {
        showToast('Train details not found.', 'error');
        return;
    }

    AppState.selectedTrain = train;
    const availableClasses = Object.keys(train.classes);
    AppState.selectedClass = (classCode !== 'default' && availableClasses.includes(classCode)) ? classCode : availableClasses[0];

    // Initialize 1 default passenger
    AppState.passengers = [{
        id: 1,
        name: AppState.currentUser.fullName || '',
        age: 28,
        gender: 'Male',
        berthPref: 'Lower',
        seatNumber: null
    }];
    AppState.selectedSeats = [];

    renderBookingPage();
    switchView('view-booking');
}

function renderBookingPage() {
    const train = AppState.selectedTrain;
    const classCode = AppState.selectedClass;

    document.getElementById('bookTrainNo').textContent = train.trainNo;
    document.getElementById('bookTrainName').textContent = train.trainName;
    document.getElementById('bookClassBadge').textContent = `Class: ${classCode} (${TRAVEL_CLASSES[classCode]?.name || classCode})`;
    document.getElementById('bookJourneyDate').textContent = formatDisplayDate(AppState.searchParams.date);
    document.getElementById('bookRoute').textContent = `${train.originName} (${train.origin}) → ${train.destinationName} (${train.destination})`;
    document.getElementById('bookTiming').textContent = `${train.departureTime} → ${train.arrivalTime} (${train.duration})`;

    renderPassengerInputs();
    renderCoachSeatMap(classCode);
    updateFareSummary();
}

function renderPassengerInputs() {
    const container = document.getElementById('passengerFormsList');
    container.innerHTML = AppState.passengers.map((p, index) => `
        <div class="passenger-card" id="passengerCard_${index}">
            <div class="passenger-card-header">
                <span style="font-weight: 700; font-size: 0.95rem;">Passenger #${index + 1}</span>
                ${AppState.passengers.length > 1 ? `
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removePassenger(${index})">
                        Remove
                    </button>
                ` : ''}
            </div>
            <div class="passenger-grid">
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-control" value="${escapeHtml(p.name)}" placeholder="Name as per Govt ID" onchange="updatePassengerField(${index}, 'name', this.value)" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Age</label>
                    <input type="number" class="form-control" value="${p.age}" min="1" max="110" onchange="updatePassengerField(${index}, 'age', this.value)" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Gender</label>
                    <select class="form-control" onchange="updatePassengerField(${index}, 'gender', this.value)">
                        <option value="Male" ${p.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${p.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Transgender" ${p.gender === 'Transgender' ? 'selected' : ''}>Transgender</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Berth Preference</label>
                    <select class="form-control" onchange="updatePassengerField(${index}, 'berthPref', this.value)">
                        <option value="Lower" ${p.berthPref === 'Lower' ? 'selected' : ''}>Lower Berth</option>
                        <option value="Middle" ${p.berthPref === 'Middle' ? 'selected' : ''}>Middle Berth</option>
                        <option value="Upper" ${p.berthPref === 'Upper' ? 'selected' : ''}>Upper Berth</option>
                        <option value="Side Lower" ${p.berthPref === 'Side Lower' ? 'selected' : ''}>Side Lower</option>
                        <option value="Side Upper" ${p.berthPref === 'Side Upper' ? 'selected' : ''}>Side Upper</option>
                        <option value="Window" ${p.berthPref === 'Window' ? 'selected' : ''}>Window Seat</option>
                    </select>
                </div>
            </div>
        </div>
    `).join('');
}

function updatePassengerField(index, field, value) {
    if (AppState.passengers[index]) {
        AppState.passengers[index][field] = value;
    }
}

function addPassenger() {
    if (AppState.passengers.length >= 6) {
        showToast('Maximum 6 passengers allowed per ticket reservation.', 'warning');
        return;
    }
    AppState.passengers.push({
        id: AppState.passengers.length + 1,
        name: '',
        age: 25,
        gender: 'Male',
        berthPref: 'Lower',
        seatNumber: null
    });
    renderPassengerInputs();
    updateFareSummary();
}

function removePassenger(index) {
    if (AppState.passengers.length > 1) {
        AppState.passengers.splice(index, 1);
        renderPassengerInputs();
        updateFareSummary();
    }
}

// ============================================================================
// Interactive Coach & Berth Map
// ============================================================================
function renderCoachSeatMap(travelClass) {
    const coachContainer = document.getElementById('coachLayoutContainer');
    const coachTitle = document.getElementById('coachTitle');

    let coachCode = 'B1';
    let totalRows = 6;
    if (travelClass === '1A') { coachCode = 'H1'; totalRows = 4; }
    else if (travelClass === '2A') { coachCode = 'A1'; totalRows = 5; }
    else if (travelClass === '3A') { coachCode = 'B1'; totalRows = 6; }
    else if (travelClass === 'SL') { coachCode = 'S3'; totalRows = 8; }
    else if (travelClass === 'CC') { coachCode = 'C1'; totalRows = 7; }

    coachTitle.textContent = `Coach ${coachCode} • ${TRAVEL_CLASSES[travelClass]?.name || travelClass} Interactive Seat Layout`;

    let html = '';
    let seatCounter = 1;

    for (let r = 1; r <= totalRows; r++) {
        const s1 = seatCounter++;
        const s2 = seatCounter++;
        const s3 = (travelClass === '3A' || travelClass === 'SL') ? seatCounter++ : null;
        const sSide = seatCounter++;

        html += `
            <div class="seat-row">
                <div class="seat-compartment">
                    <div class="seat-box" data-seat="${coachCode}-${s1}" onclick="toggleSeatPick('${coachCode}-${s1}')">
                        <span>${s1}</span>
                        <span style="font-size: 0.6rem; color: var(--text-muted);">LB</span>
                    </div>
                    <div class="seat-box" data-seat="${coachCode}-${s2}" onclick="toggleSeatPick('${coachCode}-${s2}')">
                        <span>${s2}</span>
                        <span style="font-size: 0.6rem; color: var(--text-muted);">UB</span>
                    </div>
                    ${s3 ? `
                        <div class="seat-box" data-seat="${coachCode}-${s3}" onclick="toggleSeatPick('${coachCode}-${s3}')">
                            <span>${s3}</span>
                            <span style="font-size: 0.6rem; color: var(--text-muted);">MB</span>
                        </div>
                    ` : ''}
                </div>

                <div class="aisle-gap">AISLE</div>

                <div class="seat-compartment">
                    <div class="seat-box" data-seat="${coachCode}-${sSide}" onclick="toggleSeatPick('${coachCode}-${sSide}')">
                        <span>${sSide}</span>
                        <span style="font-size: 0.6rem; color: var(--text-muted);">SL</span>
                    </div>
                </div>
            </div>
        `;
    }

    coachContainer.innerHTML = html;
}

function toggleSeatPick(seatId) {
    const seatEl = document.querySelector(`.seat-box[data-seat="${seatId}"]`);
    if (!seatEl) return;

    const passengerCount = AppState.passengers.length;
    const exists = AppState.selectedSeats.indexOf(seatId);

    if (exists !== -1) {
        AppState.selectedSeats.splice(exists, 1);
        seatEl.classList.remove('selected');
    } else {
        if (AppState.selectedSeats.length >= passengerCount) {
            // Replace the first chosen seat
            const oldSeat = AppState.selectedSeats.shift();
            const oldEl = document.querySelector(`.seat-box[data-seat="${oldSeat}"]`);
            if (oldEl) oldEl.classList.remove('selected');
        }
        AppState.selectedSeats.push(seatId);
        seatEl.classList.add('selected');
    }
}

// ============================================================================
// Fare Breakdown Calculator (Requirement 5)
// ============================================================================
function updateFareSummary() {
    const train = AppState.selectedTrain;
    const classCode = AppState.selectedClass;
    if (!train) return;

    const passengerCount = AppState.passengers.length;
    const baseFarePerPassenger = train.classes[classCode]?.baseFare || 1000;
    const baseTotal = baseFarePerPassenger * passengerCount;
    const resCharge = 40 * passengerCount;
    // 5% GST for AC classes, 0 for Sleeper
    const isAC = classCode !== 'SL';
    const gstTotal = isAC ? Math.round(baseTotal * 0.05) : 0;
    const grandTotal = baseTotal + resCharge + gstTotal;

    document.getElementById('farePassengerCount').textContent = passengerCount;
    document.getElementById('fareBaseTotal').textContent = `₹${baseTotal.toLocaleString('en-IN')}`;
    document.getElementById('fareResCharge').textContent = `₹${resCharge.toLocaleString('en-IN')}`;
    document.getElementById('fareGstTotal').textContent = `₹${gstTotal.toLocaleString('en-IN')}`;
    document.getElementById('fareGrandTotal').textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

    AppState.currentGrandTotal = grandTotal;
}

// ============================================================================
// Payment Gateway Modal & Simulator (Requirement 3)
// ============================================================================
function openPaymentModal() {
    // Validate passengers
    for (let i = 0; i < AppState.passengers.length; i++) {
        const p = AppState.passengers[i];
        if (!p.name || p.name.trim().length === 0) {
            showToast(`Please enter the name for Passenger #${i + 1}`, 'warning');
            return;
        }
    }

    const modal = document.getElementById('paymentModal');
    const grandTotal = AppState.currentGrandTotal || 3120;
    document.getElementById('paymentModalGrandTotal').textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
    document.getElementById('paymentModalTrainSummary').textContent = `${AppState.selectedTrain.trainNo} - ${AppState.selectedTrain.trainName} • ${AppState.passengers.length} Passenger(s)`;

    generateUpiQrCode('irctc.pay@railways', grandTotal);

    modal.classList.add('active');
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.classList.remove('active');
}

function generateUpiQrCode(vpa, amount) {
    const container = document.getElementById('upiQrCodeContainer');
    if (!container) return;

    // Generate crisp mock SVG QR Code
    container.innerHTML = `
        <svg viewBox="0 0 100 100" width="140" height="140" style="display:block;">
            <rect width="100" height="100" fill="#ffffff" />
            <!-- Corner marker 1 -->
            <rect x="5" y="5" width="26" height="26" fill="#0f172a" rx="2" />
            <rect x="9" y="9" width="18" height="18" fill="#ffffff" />
            <rect x="13" y="13" width="10" height="10" fill="#2563eb" />
            <!-- Corner marker 2 -->
            <rect x="69" y="5" width="26" height="26" fill="#0f172a" rx="2" />
            <rect x="73" y="9" width="18" height="18" fill="#ffffff" />
            <rect x="77" y="13" width="10" height="10" fill="#2563eb" />
            <!-- Corner marker 3 -->
            <rect x="5" y="69" width="26" height="26" fill="#0f172a" rx="2" />
            <rect x="9" y="73" width="18" height="18" fill="#ffffff" />
            <rect x="13" y="77" width="10" height="10" fill="#2563eb" />
            <!-- Center Railway Logo Badge -->
            <circle cx="50" cy="50" r="14" fill="#2563eb" />
            <path d="M44 54C44 55 45 56 46 56L45 57H55L54 56C55 56 56 55 56 54V46C56 44 54 44 50 44C46 44 44 44 44 46V54ZM50 48C51 48 52 48.5 52 49.5C52 50.5 51 51 50 51C49 51 48 50.5 48 49.5C48 48.5 49 48 50 48Z" fill="#ffffff" />
            <!-- Data pattern blocks -->
            <rect x="36" y="8" width="6" height="6" fill="#1e293b" />
            <rect x="46" y="8" width="6" height="6" fill="#1e293b" />
            <rect x="56" y="8" width="6" height="6" fill="#1e293b" />
            <rect x="36" y="22" width="6" height="6" fill="#1e293b" />
            <rect x="50" y="22" width="6" height="6" fill="#1e293b" />
            <rect x="8" y="38" width="6" height="6" fill="#1e293b" />
            <rect x="20" y="38" width="6" height="6" fill="#1e293b" />
            <rect x="8" y="52" width="6" height="6" fill="#1e293b" />
            <rect x="22" y="52" width="6" height="6" fill="#1e293b" />
            <rect x="74" y="38" width="6" height="6" fill="#1e293b" />
            <rect x="86" y="38" width="6" height="6" fill="#1e293b" />
            <rect x="74" y="52" width="6" height="6" fill="#1e293b" />
            <rect x="86" y="52" width="6" height="6" fill="#1e293b" />
            <rect x="36" y="70" width="6" height="6" fill="#1e293b" />
            <rect x="48" y="70" width="6" height="6" fill="#1e293b" />
            <rect x="60" y="70" width="6" height="6" fill="#1e293b" />
            <rect x="36" y="84" width="6" height="6" fill="#1e293b" />
            <rect x="50" y="84" width="6" height="6" fill="#1e293b" />
            <rect x="62" y="84" width="6" height="6" fill="#1e293b" />
        </svg>
    `;
}

// Process Payment & Complete Booking
function processPaymentAndBook() {
    const btnPay = document.getElementById('btnConfirmPaymentAndBook');
    const btnText = document.getElementById('btnPayText');
    btnPay.disabled = true;
    btnText.textContent = 'Processing with Bank Gateway...';

    setTimeout(() => {
        // 1. Determine active payment mode
        const activeCard = document.querySelector('.payment-method-card.active');
        const methodType = activeCard ? activeCard.getAttribute('data-method') : 'upi';

        let paymentModeStr = 'Online - UPI';
        let txnPrefix = 'TXN-';
        if (methodType === 'card') {
            paymentModeStr = 'Online - Credit/Debit Card';
            txnPrefix = 'TXN-CARD-';
        } else if (methodType === 'netbanking') {
            const bank = document.getElementById('netBankSelect').value;
            paymentModeStr = `Online - Net Banking (${bank})`;
            txnPrefix = `TXN-NB-`;
        } else if (methodType === 'offline') {
            paymentModeStr = 'Offline - Station PRS Cash Challan';
            txnPrefix = 'CHLN-';
        }

        const txnId = txnPrefix + Math.floor(10000000 + Math.random() * 90000000);
        
        // 2. Generate authentic 10-digit PNR (Requirement 3)
        // 3-digit Passenger Reservation Group code + 7 random digits
        const prgPrefixes = ['246', '135', '891', '452', '673', '914'];
        const chosenPrefix = prgPrefixes[Math.floor(Math.random() * prgPrefixes.length)];
        const generatedPnr = chosenPrefix + Math.floor(1000000 + Math.random() * 9000000).toString();

        const train = AppState.selectedTrain;
        const travelClass = AppState.selectedClass;
        const classQuota = train.classes[travelClass];

        // 3. Allocate Seats & Status (CNF, RAC, or WL)
        let overallBookingStatus = 'Confirmed';
        let coachCode = travelClass === '1A' ? 'H1' : (travelClass === '2A' ? 'A1' : (travelClass === '3A' ? 'B1' : (travelClass === 'CC' ? 'C1' : 'S3')));

        const finalizedPassengers = AppState.passengers.map((p, idx) => {
            let assignedCoach = coachCode;
            let assignedBerth = '';
            let status = 'CNF';

            // Check if user pre-selected a seat in the interactive coach map
            if (AppState.selectedSeats[idx]) {
                const parts = AppState.selectedSeats[idx].split('-');
                assignedCoach = parts[0];
                assignedBerth = parts[1];
            } else {
                // Auto-allot based on availability quota
                if (classQuota.available > 0) {
                    status = 'CNF';
                    assignedBerth = Math.floor(1 + Math.random() * 45).toString();
                } else if (classQuota.rac > 0) {
                    status = 'RAC';
                    assignedBerth = `RAC ${Math.floor(1 + Math.random() * 12)}`;
                    overallBookingStatus = 'RAC';
                } else {
                    status = 'WL';
                    assignedBerth = `WL ${Math.floor(1 + Math.random() * 20)}`;
                    overallBookingStatus = 'Waiting List';
                }
            }

            return {
                name: p.name.trim(),
                age: p.age,
                gender: p.gender,
                berthPref: p.berthPref,
                coach: assignedCoach,
                berthNo: assignedBerth,
                status: status
            };
        });

        // 4. Update seat count in train database
        if (classQuota.available >= AppState.passengers.length) {
            classQuota.available -= AppState.passengers.length;
        } else {
            classQuota.available = 0;
            if (classQuota.rac > 0) classQuota.rac = Math.max(0, classQuota.rac - AppState.passengers.length);
        }

        const allTrains = RailDB.get(STORAGE_KEYS.TRAINS) || [];
        const trainIndex = allTrains.findIndex(t => t.id === train.id);
        if (trainIndex !== -1) {
            allTrains[trainIndex] = train;
            RailDB.set(STORAGE_KEYS.TRAINS, allTrains);
        }

        // 5. Create Booking Object
        const booking = {
            pnr: generatedPnr,
            trainId: train.id,
            trainNo: train.trainNo,
            trainName: train.trainName,
            origin: train.origin,
            originName: train.originName,
            destination: train.destination,
            destinationName: train.destinationName,
            journeyDate: AppState.searchParams.date,
            bookingDate: new Date().toISOString(),
            travelClass: travelClass,
            quota: 'General',
            userId: AppState.currentUser.id,
            userEmail: AppState.currentUser.email,
            passengers: finalizedPassengers,
            farePerPassenger: classQuota.baseFare,
            totalFare: classQuota.baseFare * AppState.passengers.length,
            gst: travelClass !== 'SL' ? Math.round(classQuota.baseFare * AppState.passengers.length * 0.05) : 0,
            grandTotal: AppState.currentGrandTotal,
            paymentStatus: 'Success',
            paymentMode: paymentModeStr,
            transactionId: txnId,
            bookingStatus: overallBookingStatus,
            chartStatus: 'Chart Not Prepared',
            refundStatus: 'None'
        };

        const bookings = RailDB.get(STORAGE_KEYS.BOOKINGS) || [];
        bookings.unshift(booking);
        RailDB.set(STORAGE_KEYS.BOOKINGS, bookings);

        // 6. Record in Payment Ledger for System Admin (Requirement 3 & 5)
        const paymentRecord = {
            transactionId: txnId,
            pnr: generatedPnr,
            amount: AppState.currentGrandTotal,
            paymentMode: paymentModeStr,
            payerEmail: AppState.currentUser.email,
            timestamp: new Date().toISOString(),
            status: 'Completed',
            notes: `Ticket confirmed for ${finalizedPassengers.length} passenger(s) on ${train.trainNo}`
        };

        const payments = RailDB.get(STORAGE_KEYS.PAYMENTS) || [];
        payments.unshift(paymentRecord);
        RailDB.set(STORAGE_KEYS.PAYMENTS, payments);

        // Reset button
        btnPay.disabled = false;
        btnText.textContent = 'Authorize & Generate PNR';
        closePaymentModal();

        // 7. Success Notifications & Open Printable Ticket View
        showToast(`Payment successful! Generated PNR: ${generatedPnr}`, 'success');
        showToast(`A booking confirmation email has been dispatched to ${AppState.currentUser.email}`, 'info');

        renderPrintableTicket(booking);
        switchView('view-ticket-print');

    }, 1200);
}

// ============================================================================
// Printable E-Ticket Generator
// ============================================================================
function renderPrintableTicket(booking) {
    const container = document.getElementById('printableTicketArea');
    if (!container) return;

    const passengerRows = booking.passengers.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(p.name)}</strong></td>
            <td>${p.age} / ${p.gender.charAt(0)}</td>
            <td>${p.berthPref}</td>
            <td><strong style="color: #1e3a8a;">${p.coach}</strong></td>
            <td><strong style="color: #1e3a8a;">${p.berthNo}</strong></td>
            <td>
                <span class="badge ${p.status === 'CNF' ? 'badge-cnf' : (p.status === 'RAC' ? 'badge-rac' : 'badge-wl')}">
                    ${p.status}
                </span>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="ticket-header">
            <div class="ticket-railway-branding">
                <div class="ticket-railway-logo">IR</div>
                <div>
                    <h2 style="font-size: 1.3rem; margin: 0; color: #ffffff;">INDIAN RAILWAYS PASSENGER RESERVATION SYSTEM</h2>
                    <span style="font-size: 0.75rem; opacity: 0.9;">Electronic Reservation Slip (ERS) &bull; Verified E-Ticket</span>
                </div>
            </div>
            <div style="text-align: right;">
                <span class="badge badge-cnf" style="background: rgba(255,255,255,0.25); color: #fff; border: none;">${booking.bookingStatus}</span>
            </div>
        </div>

        <div class="ticket-pnr-banner">
            <div class="ticket-pnr-box">
                <span style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700;">PNR NUMBER</span>
                <span class="ticket-pnr-num">${booking.pnr}</span>
            </div>
            <div style="text-align: right; font-size: 0.85rem;">
                <div><strong>Transaction ID:</strong> ${booking.transactionId}</div>
                <div><strong>Payment:</strong> ${booking.paymentMode}</div>
            </div>
        </div>

        <div class="ticket-body">
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 14px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                <div>
                    <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">TRAIN NO. &amp; NAME</span>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">${booking.trainNo} - ${booking.trainName}</div>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">CLASS &amp; QUOTA</span>
                    <div style="font-size: 1rem; font-weight: 700; color: #1e3a8a;">${booking.travelClass} (${booking.quota})</div>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">DATE OF JOURNEY</span>
                    <div style="font-size: 1rem; font-weight: 700; color: #b45309;">${formatDisplayDate(booking.journeyDate)}</div>
                </div>
            </div>

            <div class="ticket-journey-strip">
                <div style="text-align: left;">
                    <span style="font-size: 0.75rem; color: #64748b;">FROM</span>
                    <h3 style="margin: 2px 0; color: #0f172a;">${booking.originName} (${booking.origin})</h3>
                    <span style="font-size: 0.82rem; color: #64748b;">Boarding Station</span>
                </div>
                <div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 0.75rem; color: #64748b;">TO</span>
                    <h3 style="margin: 2px 0; color: #0f172a;">${booking.destinationName} (${booking.destination})</h3>
                    <span style="font-size: 0.82rem; color: #64748b;">Destination Station</span>
                </div>
            </div>

            <h4 style="margin: 20px 0 10px; font-size: 0.95rem; color: #334155;">PASSENGER ALLOTMENT DETAILS</h4>
            <table class="ticket-passenger-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Passenger Name</th>
                        <th>Age / Sex</th>
                        <th>Preference</th>
                        <th>Coach</th>
                        <th>Berth No</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${passengerRows}
                </tbody>
            </table>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
                <div style="font-size: 0.8rem; color: #64748b; max-width: 440px;">
                    <p>• Valid with original government photo identity proof (Aadhaar, Voter ID, Passport, Driving License).</p>
                    <p>• Charting Status: <strong>${booking.chartStatus}</strong>.</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.85rem; color: #64748b;">Total Ticket Fare:</div>
                    <div style="font-size: 1.5rem; font-weight: 800; color: #1e3a8a;">₹${booking.grandTotal.toLocaleString('en-IN')}</div>
                    <span style="font-size: 0.75rem; color: #10b981; font-weight: 700;">PAID IN FULL</span>
                </div>
            </div>
        </div>

        <div class="ticket-footer">
            <span>Customer Care: 139 &bull; IRCTC Support</span>
            <span>Generated via RailSafar National Portal</span>
        </div>
    `;
}

// ============================================================================
// PNR Status Inquiry (Requirement 4)
// ============================================================================
function checkPnrStatus(pnrToQuery) {
    const pnr = (pnrToQuery || document.getElementById('pnrQueryInput').value || '').trim();
    if (pnr.length !== 10) {
        showToast('Please enter a valid 10-digit Indian Railways PNR number.', 'warning');
        return;
    }

    const bookings = RailDB.get(STORAGE_KEYS.BOOKINGS) || [];
    const booking = bookings.find(b => b.pnr === pnr);

    const resultArea = document.getElementById('pnrResultArea');
    resultArea.style.display = 'block';

    if (!booking) {
        resultArea.innerHTML = `
            <div class="train-card" style="padding: 30px; text-align: center;">
                <h3 style="color: #f87171;">PNR Not Found</h3>
                <p style="color: var(--text-secondary); margin-top: 6px;">No reservation records found for PNR: <strong>${escapeHtml(pnr)}</strong>. Please verify the 10-digit number and try again.</p>
            </div>
        `;
        return;
    }

    const isCancelled = booking.bookingStatus === 'Cancelled';
    const isCharted = booking.chartStatus === 'Chart Prepared';

    const passengerRows = booking.passengers.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(p.name)}</strong> (${p.age}, ${p.gender.charAt(0)})</td>
            <td>${booking.travelClass}</td>
            <td><strong style="color: #60a5fa;">${p.coach || 'WL'}</strong></td>
            <td><strong style="color: #60a5fa;">${p.berthNo || 'Waiting'}</strong></td>
            <td>
                <span class="badge ${isCancelled ? 'badge-wl' : (p.status === 'CNF' ? 'badge-cnf' : (p.status === 'RAC' ? 'badge-rac' : 'badge-wl'))}">
                    ${isCancelled ? 'CANCELLED' : p.status}
                </span>
            </td>
        </tr>
    `).join('');

    resultArea.innerHTML = `
        <div class="train-card" style="padding: 28px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
                <div>
                    <span style="font-size: 0.78rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">PNR NUMBER</span>
                    <h2 class="text-gold" style="font-family: var(--font-mono); font-size: 1.8rem; margin: 2px 0;">${booking.pnr}</h2>
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">Train: <strong>${booking.trainNo} - ${booking.trainName}</strong></span>
                </div>
                <div style="text-align: right;">
                    <span class="badge ${isCancelled ? 'badge-wl' : (booking.bookingStatus === 'Confirmed' ? 'badge-cnf' : 'badge-rac')}" style="font-size: 0.95rem; padding: 6px 14px;">
                        ${booking.bookingStatus}
                    </span>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 6px;">Charting: <strong>${booking.chartStatus}</strong></div>
                </div>
            </div>

            <!-- Stepper Progress Tracker -->
            <div class="pnr-status-stepper">
                <div class="step-node completed">
                    <div class="step-circle">&#10003;</div>
                    <span class="step-label">Booking Reserved</span>
                </div>
                <div class="step-node ${isCharted ? 'completed' : 'active'}">
                    <div class="step-circle">${isCharted ? '&#10003;' : '2'}</div>
                    <span class="step-label">${isCharted ? 'Chart Prepared' : 'Charting Preparation'}</span>
                </div>
                <div class="step-node ${isCancelled ? 'active' : (isCharted ? 'completed' : '')}">
                    <div class="step-circle">${isCancelled ? '!' : (isCharted ? '&#10003;' : '3')}</div>
                    <span class="step-label">${isCancelled ? 'Ticket Cancelled' : 'Ready for Boarding'}</span>
                </div>
            </div>

            <!-- Journey Details Card -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; background: rgba(30, 41, 59, 0.4); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 20px;">
                <div><strong>Boarding:</strong> ${booking.originName} (${booking.origin})</div>
                <div><strong>Destination:</strong> ${booking.destinationName} (${booking.destination})</div>
                <div><strong>Journey Date:</strong> ${formatDisplayDate(booking.journeyDate)}</div>
                <div><strong>Class / Quota:</strong> ${booking.travelClass} / ${booking.quota}</div>
            </div>

            <!-- Passenger Breakdown -->
            <h4 style="margin-bottom: 12px; font-size: 1.05rem;">Passenger Current Status</h4>
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Passenger</th>
                            <th>Class</th>
                            <th>Coach</th>
                            <th>Berth / Position</th>
                            <th>Current Status</th>
                        </tr>
                    </thead>
                    <tbody>${passengerRows}</tbody>
                </table>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                <button class="btn btn-secondary" onclick="viewPrintTicketByPnr('${booking.pnr}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print E-Ticket
                </button>
                ${!isCancelled ? `
                    <button class="btn btn-danger" onclick="openCancellationModal('${booking.pnr}')">
                        Cancel Ticket &amp; Claim Refund
                    </button>
                ` : `
                    <div class="badge badge-wl" style="font-size: 0.9rem;">Ticket Cancelled &bull; Refund Status: ${booking.refundStatus}</div>
                `}
            </div>
        </div>
    `;
}

// ============================================================================
// Cancellation & Tiered Refund Rules Engine (Requirement 6)
// ============================================================================
function calculateRefundBreakdown(booking) {
    const journeyDate = new Date(booking.journeyDate + 'T12:00:00');
    const now = new Date();
    const diffHours = (journeyDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    const totalFare = booking.grandTotal;
    const passengerCount = booking.passengers.length;
    const travelClass = booking.travelClass;

    let deductionPerPassenger = 0;
    let refundablePercent = 0;
    let ruleDescription = '';
    let isRacOrWl = booking.bookingStatus === 'RAC' || booking.bookingStatus === 'Waiting List';

    if (isRacOrWl) {
        deductionPerPassenger = 60; // Clerkage charge only
        refundablePercent = Math.max(0, Math.round(((totalFare - (60 * passengerCount)) / totalFare) * 100));
        ruleDescription = 'RAC/Waitlist Clerkage charge of ₹60 per passenger deducted.';
    } else if (diffHours > 48) {
        // Flat deduction based on class
        const flatMap = { '1A': 240, '2A': 200, '3A': 180, 'SL': 120, 'CC': 180 };
        deductionPerPassenger = flatMap[travelClass] || 150;
        const totalDeduction = deductionPerPassenger * passengerCount;
        refundablePercent = Math.max(0, Math.round(((totalFare - totalDeduction) / totalFare) * 100));
        ruleDescription = `> 48 hours prior to departure: Flat cancellation fee of ₹${deductionPerPassenger} per passenger applied.`;
    } else if (diffHours >= 12 && diffHours <= 48) {
        refundablePercent = 75;
        deductionPerPassenger = (totalFare * 0.25) / passengerCount;
        ruleDescription = 'Between 48 and 12 hours prior to departure: 25% cancellation deduction.';
    } else if (diffHours >= 4 && diffHours < 12) {
        refundablePercent = 50;
        deductionPerPassenger = (totalFare * 0.50) / passengerCount;
        ruleDescription = 'Between 12 and 4 hours prior to departure: 50% cancellation deduction.';
    } else {
        refundablePercent = 0;
        deductionPerPassenger = totalFare / passengerCount;
        ruleDescription = 'Less than 4 hours prior to departure / After Chart Preparation: No refund granted.';
    }

    const netDeduction = Math.min(totalFare, Math.round(deductionPerPassenger * passengerCount));
    const netRefundAmount = Math.max(0, totalFare - netDeduction);

    return {
        diffHours: Math.round(diffHours),
        totalFare,
        passengerCount,
        deductionPerPassenger,
        netDeduction,
        refundablePercent,
        netRefundAmount,
        ruleDescription
    };
}

function openCancellationModal(pnr) {
    const bookings = RailDB.get(STORAGE_KEYS.BOOKINGS) || [];
    const booking = bookings.find(b => b.pnr === pnr);
    if (!booking) {
        showToast('Booking not found.', 'error');
        return;
    }

    if (booking.bookingStatus === 'Cancelled') {
        showToast('This ticket is already cancelled.', 'warning');
        return;
    }

    const modal = document.getElementById('cancelTicketModal');
    document.getElementById('cancelModalPnr').textContent = `PNR: ${booking.pnr} (${booking.trainNo} - ${booking.trainName})`;

    const refund = calculateRefundBreakdown(booking);
    AppState.pendingCancellation = { booking, refund };

    const body = document.getElementById('cancelModalBody');
    body.innerHTML = `
        <div class="refund-calculation-box">
            <h4 style="color: var(--accent-gold); margin-bottom: 8px;">Automated Railway Refund Computation</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 14px;">
                ${refund.ruleDescription} (Calculated based on journey departure timeline)
            </p>

            <div class="fare-row">
                <span>Original Ticket Fare Paid:</span>
                <span>₹${refund.totalFare.toLocaleString('en-IN')}</span>
            </div>
            <div class="fare-row">
                <span>Cancellation Deduction (${refund.passengerCount} Passenger(s)):</span>
                <span style="color: #f87171;">- ₹${refund.netDeduction.toLocaleString('en-IN')}</span>
            </div>
            <div class="fare-row">
                <span>Refundable Percentage:</span>
                <span class="badge badge-cnf">${refund.refundablePercent}%</span>
            </div>
            <div class="fare-row total">
                <span>Net Refund Amount to Passenger:</span>
                <span class="text-gold" style="font-size: 1.4rem;">₹${refund.netRefundAmount.toLocaleString('en-IN')}</span>
            </div>
        </div>

        <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.5;">
            * Upon submitting this cancellation request, the Railway Administrator will pass through the refundable amount to the system, and the system will credit ₹${refund.netRefundAmount.toLocaleString('en-IN')} back to the passenger's payment mode.
        </p>
    `;

    modal.classList.add('active');
}

function executeCancellation() {
    if (!AppState.pendingCancellation) return;

    const { booking, refund } = AppState.pendingCancellation;
    const bookings = RailDB.get(STORAGE_KEYS.BOOKINGS) || [];
    const idx = bookings.findIndex(b => b.pnr === booking.pnr);

    if (idx !== -1) {
        bookings[idx].bookingStatus = 'Cancelled';
        bookings[idx].refundStatus = 'Refund Requested (Awaiting Admin Pass-through)';
        bookings[idx].refundCalculation = refund;
        RailDB.set(STORAGE_KEYS.BOOKINGS, bookings);

        // Also release seats back to train quota!
        const allTrains = RailDB.get(STORAGE_KEYS.TRAINS) || [];
        const trainIndex = allTrains.findIndex(t => t.id === booking.trainId);
        if (trainIndex !== -1) {
            const classObj = allTrains[trainIndex].classes[booking.travelClass];
            if (classObj) {
                classObj.available += booking.passengers.length;
                RailDB.set(STORAGE_KEYS.TRAINS, allTrains);
            }
        }

        const modal = document.getElementById('cancelTicketModal');
        if (modal) modal.classList.remove('active');

        showToast(`Ticket PNR ${booking.pnr} has been successfully cancelled.`, 'success');
        showToast(`Refund request of ₹${refund.netRefundAmount} submitted to Railway Admin.`, 'info');

        // Refresh views
        if (AppState.activeView === 'view-pnr') {
            checkPnrStatus(booking.pnr);
        } else if (AppState.activeView === 'view-my-bookings') {
            renderMyBookings();
        }
    }
}

// Refund Simulator (in Refund Rules view)
function simulateRefundRule() {
    const fare = parseFloat(document.getElementById('simFare').value) || 2000;
    const travelClass = document.getElementById('simClass').value;
    const hours = parseFloat(document.getElementById('simHours').value) || 0;

    let deduction = 0;
    let refundablePercent = 0;
    let tierText = '';

    if (hours > 48) {
        const flatMap = { '1A': 240, '2A': 200, '3A': 180, 'SL': 120, 'CC': 180 };
        deduction = flatMap[travelClass] || 150;
        refundablePercent = Math.max(0, Math.round(((fare - deduction) / fare) * 100));
        tierText = `Tier 1 (> 48 hrs): Flat charge of ₹${deduction} deducted. Remainder refunded.`;
    } else if (hours >= 12 && hours <= 48) {
        deduction = Math.round(fare * 0.25);
        refundablePercent = 75;
        tierText = `Tier 2 (12-48 hrs): 25% of fare deducted (₹${deduction}). 75% refunded.`;
    } else if (hours >= 4 && hours < 12) {
        deduction = Math.round(fare * 0.50);
        refundablePercent = 50;
        tierText = `Tier 3 (4-12 hrs): 50% of fare deducted (₹${deduction}). 50% refunded.`;
    } else {
        deduction = fare;
        refundablePercent = 0;
        tierText = `Tier 4 (< 4 hrs): 100% deduction. Zero refund after chart preparation.`;
    }

    const netRefund = Math.max(0, fare - deduction);
    const box = document.getElementById('simRefundResult');
    box.style.display = 'block';
    box.innerHTML = `
        <h4 style="color: var(--accent-gold); margin-bottom: 6px;">Simulated Railway Refund Result</h4>
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 12px;">${tierText}</p>
        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
            <div><strong>Ticket Fare:</strong> ₹${fare.toLocaleString('en-IN')}</div>
            <div><strong>Cancellation Fee:</strong> <span style="color: #f87171;">₹${deduction.toLocaleString('en-IN')}</span></div>
            <div><strong>Refundable Percentage:</strong> <span class="badge badge-cnf">${refundablePercent}%</span></div>
            <div><strong>Net Refund:</strong> <span class="text-gold" style="font-weight: 800;">₹${netRefund.toLocaleString('en-IN')}</span></div>
        </div>
    `;
}

// ============================================================================
// Passenger Dashboard (My Bookings)
// ============================================================================
function renderMyBookings() {
    const container = document.getElementById('myBookingsList');
    if (!AppState.currentUser) {
        container.innerHTML = `<p>Please log in to view reservations.</p>`;
        return;
    }

    const allBookings = RailDB.get(STORAGE_KEYS.BOOKINGS) || [];
    const myBookings = allBookings.filter(b => b.userId === AppState.currentUser.id || b.userEmail === AppState.currentUser.email);

    if (myBookings.length === 0) {
        container.innerHTML = `
            <div class="train-card" style="padding: 40px; text-align: center;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 12px;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <h3>No Bookings Found</h3>
                <p style="color: var(--text-secondary); margin-top: 6px;">You haven't reserved any train journeys yet.</p>
                <button class="btn btn-primary" onclick="switchView('view-search')" style="margin-top: 16px;">Search &amp; Book Trains</button>
            </div>
        `;
        return;
    }

    container.innerHTML = myBookings.map(b => {
        const isCancelled = b.bookingStatus === 'Cancelled';
        return `
            <div class="train-card" style="margin-bottom: 20px;">
                <div class="train-card-header">
                    <div>
                        <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">PNR</span>
                        <h3 class="text-gold" style="font-family: var(--font-mono); margin: 0;">${b.pnr}</h3>
                        <span style="font-size: 0.85rem; color: var(--text-secondary);">${b.trainNo} - ${b.trainName}</span>
                    </div>
                    <div style="text-align: right;">
                        <span class="badge ${isCancelled ? 'badge-wl' : (b.bookingStatus === 'Confirmed' ? 'badge-cnf' : 'badge-rac')}">
                            ${b.bookingStatus}
                        </span>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Booked on: ${formatDisplayDate(b.bookingDate)}</div>
                    </div>
                </div>

                <div style="padding: 20px 24px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 16px;">
                        <div><strong>Route:</strong> ${b.originName} &rarr; ${b.destinationName}</div>
                        <div><strong>Journey Date:</strong> ${formatDisplayDate(b.journeyDate)}</div>
                        <div><strong>Class:</strong> ${b.travelClass} (${b.quota})</div>
                        <div><strong>Fare Paid:</strong> ₹${b.grandTotal.toLocaleString('en-IN')}</div>
                    </div>

                    <div style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 14px;">
                        <strong>Passengers (${b.passengers.length}):</strong> ${b.passengers.map(p => `${p.name} [${p.coach || 'WL'}-${p.berthNo || 'WL'}]`).join(', ')}
                    </div>

                    ${isCancelled ? `
                        <div class="badge badge-info" style="display: block; margin-bottom: 14px; text-transform: none; text-align: left; padding: 10px;">
                            <strong>Refund Status:</strong> ${b.refundStatus}
                        </div>
                    ` : ''}

                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-secondary btn-sm" onclick="checkPnrStatus('${b.pnr}'); switchView('view-pnr');">
                            Check PNR Status
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="viewPrintTicketByPnr('${b.pnr}')">
                            View / Print E-Ticket
                        </button>
                        ${!isCancelled ? `
                            <button class="btn btn-outline-danger btn-sm" onclick="openCancellationModal('${b.pnr}')">
                                Cancel Ticket
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function viewPrintTicketByPnr(pnr) {
    const bookings = RailDB.get(STORAGE_KEYS.BOOKINGS) || [];
    const booking = bookings.find(b => b.pnr === pnr);
    if (!booking) return;

    renderPrintableTicket(booking);
    switchView('view-ticket-print');
}

// ============================================================================
// Railway Central Admin Panel Controller (Requirement 5)
// ============================================================================
function renderAdminDashboard() {
    renderAdminTrainsTable();
    renderAdminPaymentsTable();
    renderAdminRefundsTable();
    renderAdminUsersTable();
    renderAdminFareRules();
}

function renderAdminTrainsTable() {
    const tbody = document.getElementById('adminTrainsTableBody');
    const trains = RailDB.get(STORAGE_KEYS.TRAINS) || [];

    tbody.innerHTML = trains.map(t => {
        const classesSummary = Object.entries(t.classes || {}).map(([code, c]) => `
            <span class="badge ${c.available > 0 ? 'badge-cnf' : 'badge-rac'}" style="margin: 2px;">
                ${code}: ${c.available} AVL (₹${c.baseFare})
            </span>
        `).join('');

        return `
            <tr>
                <td>
                    <strong>${t.trainNo}</strong><br>
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(t.trainName)}</span>
                </td>
                <td><span class="badge badge-info">${t.zone}</span></td>
                <td>${t.origin} &rarr; ${t.destination}</td>
                <td>${t.departureTime} / ${t.arrivalTime}</td>
                <td>${t.duration}</td>
                <td>${classesSummary}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="promptUpdateSeats('${t.id}')" title="Adjust Quotas">
                        Seats
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteTrain('${t.id}')" title="Delete Train">
                        &times;
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function promptUpdateSeats(trainId) {
    const trains = RailDB.get(STORAGE_KEYS.TRAINS) || [];
    const train = trains.find(t => t.id === trainId);
    if (!train) return;

    const classKeys = Object.keys(train.classes);
    const chosenClass = prompt(`Enter class code to adjust quota (${classKeys.join(', ')}):`, classKeys[0]);
    if (!chosenClass || !train.classes[chosenClass]) return;

    const newSeats = prompt(`Enter new available seat count for ${train.trainNo} (${chosenClass}):`, train.classes[chosenClass].available);
    if (newSeats !== null && !isNaN(newSeats)) {
        train.classes[chosenClass].available = parseInt(newSeats, 10);
        RailDB.set(STORAGE_KEYS.TRAINS, trains);
        renderAdminTrainsTable();
        showToast(`Quota for ${train.trainNo} (${chosenClass}) updated to ${newSeats}.`, 'success');
    }
}

function deleteTrain(trainId) {
    if (!confirm('Are you sure you want to remove this train schedule from the system?')) return;
    let trains = RailDB.get(STORAGE_KEYS.TRAINS) || [];
    trains = trains.filter(t => t.id !== trainId);
    RailDB.set(STORAGE_KEYS.TRAINS, trains);
    renderAdminTrainsTable();
    showToast('Train schedule removed.', 'info');
}

function renderAdminPaymentsTable() {
    const tbody = document.getElementById('adminPaymentsTableBody');
    const payments = RailDB.get(STORAGE_KEYS.PAYMENTS) || [];
    const totalRevEl = document.getElementById('adminTotalRevenueBadge');

    let totalRev = 0;
    tbody.innerHTML = payments.map(p => {
        totalRev += (p.amount || 0);
        return `
            <tr>
                <td><strong style="font-family: var(--font-mono);">${p.transactionId}</strong></td>
                <td><a href="javascript:void(0)" onclick="checkPnrStatus('${p.pnr}'); switchView('view-pnr');">${p.pnr}</a></td>
                <td>${escapeHtml(p.payerEmail)}</td>
                <td><span class="badge badge-info">${p.paymentMode}</span></td>
                <td><strong>₹${(p.amount || 0).toLocaleString('en-IN')}</strong></td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${formatDisplayDate(p.timestamp)}</td>
                <td><span class="badge badge-cnf">${p.status}</span></td>
            </tr>
        `;
    }).join('');

    totalRevEl.textContent = `Total System Revenue: ₹${totalRev.toLocaleString('en-IN')}`;
}

function renderAdminRefundsTable() {
    const tbody = document.getElementById('adminRefundsTableBody');
    const bookings = RailDB.get(STORAGE_KEYS.BOOKINGS) || [];
    const refundBookings = bookings.filter(b => b.bookingStatus === 'Cancelled');

    if (refundBookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No cancellation or refund requests in queue.</td></tr>`;
        return;
    }

    tbody.innerHTML = refundBookings.map(b => {
        const calc = b.refundCalculation || { netRefundAmount: Math.round(b.grandTotal * 0.75), refundablePercent: 75 };
        const isDisbursed = b.refundStatus && b.refundStatus.includes('Disbursed');

        return `
            <tr>
                <td><strong>${b.pnr}</strong></td>
                <td>${b.trainNo} - ${b.trainName}</td>
                <td>${escapeHtml(b.userEmail)}</td>
                <td>₹${b.grandTotal.toLocaleString('en-IN')}</td>
                <td><span class="badge badge-rac">${calc.refundablePercent}%</span></td>
                <td><strong class="text-gold">₹${calc.netRefundAmount.toLocaleString('en-IN')}</strong></td>
                <td>
                    ${!isDisbursed ? `
                        <button class="btn btn-primary btn-sm" onclick="adminApproveRefund('${b.pnr}', ${calc.netRefundAmount})">
                            Approve &amp; Pass to System
                        </button>
                    ` : `
                        <span class="badge badge-cnf">Disbursed to Passenger</span>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function adminApproveRefund(pnr, refundAmount) {
    const bookings = RailDB.get(STORAGE_KEYS.BOOKINGS) || [];
    const idx = bookings.findIndex(b => b.pnr === pnr);

    if (idx !== -1) {
        bookings[idx].refundStatus = `Refund of ₹${refundAmount.toLocaleString('en-IN')} Disbursed & Passed to Passenger`;
        RailDB.set(STORAGE_KEYS.BOOKINGS, bookings);

        // Record refund ledger
        const payments = RailDB.get(STORAGE_KEYS.PAYMENTS) || [];
        payments.unshift({
            transactionId: 'RFND-' + Math.floor(100000 + Math.random() * 900000),
            pnr: pnr,
            amount: -refundAmount,
            paymentMode: 'System Pass-Through Refund',
            payerEmail: bookings[idx].userEmail,
            timestamp: new Date().toISOString(),
            status: 'Refund Completed',
            notes: `Refund passed to passenger by Admin`
        });
        RailDB.set(STORAGE_KEYS.PAYMENTS, payments);

        showToast(`Admin approved: ₹${refundAmount} refund passed to passenger for PNR ${pnr}.`, 'success');
        renderAdminRefundsTable();
        renderAdminPaymentsTable();
    }
}

function renderAdminUsersTable() {
    const tbody = document.getElementById('adminUsersTableBody');
    const users = RailDB.get(STORAGE_KEYS.USERS) || [];

    tbody.innerHTML = users.map(u => `
        <tr>
            <td><strong>${escapeHtml(u.fullName)}</strong></td>
            <td>${escapeHtml(u.email)}</td>
            <td>${escapeHtml(u.phone || '--')}</td>
            <td>
                <span class="badge ${u.role === 'admin' ? 'badge-admin' : 'badge-info'}">
                    ${u.role}
                </span>
            </td>
            <td>
                <span class="badge ${u.status === 'Active' ? 'badge-cnf' : 'badge-wl'}">
                    ${u.status}
                </span>
            </td>
            <td>
                ${u.role !== 'admin' ? `
                    <button class="btn btn-secondary btn-sm" onclick="toggleUserStatus('${u.id}')">
                        ${u.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Superuser</span>'}
            </td>
        </tr>
    `).join('');
}

function toggleUserStatus(userId) {
    const users = RailDB.get(STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.id === userId);
    if (!user) return;

    user.status = user.status === 'Active' ? 'Blocked' : 'Active';
    RailDB.set(STORAGE_KEYS.USERS, users);
    renderAdminUsersTable();
    showToast(`User ${user.fullName} is now ${user.status}.`, 'info');
}

function renderAdminFareRules() {
    const classContainer = document.getElementById('adminClassRulesList');
    const zoneContainer = document.getElementById('adminZoneRulesList');

    const fareRules = RailDB.get(STORAGE_KEYS.FARE_RULES) || { classes: TRAVEL_CLASSES, zones: ZONE_MULTIPLIERS };

    classContainer.innerHTML = Object.entries(fareRules.classes || {}).map(([code, c]) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div><strong>${code}</strong> - ${c.name}</div>
            <div style="color: var(--accent-gold); font-weight: 700;">Base: ₹${c.baseCharge} (x${c.multiplier})</div>
        </div>
    `).join('');

    zoneContainer.innerHTML = Object.entries(fareRules.zones || {}).map(([zone, mult]) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div><strong>${zone} Railway</strong></div>
            <div style="color: #60a5fa; font-weight: 700;">Multiplier: ${mult}x</div>
        </div>
    `).join('');
}

function handleAddNewTrain(e) {
    e.preventDefault();

    const trainNo = document.getElementById('newTrainNo').value.trim();
    const trainName = document.getElementById('newTrainName').value.trim();
    const zone = document.getElementById('newTrainZone').value;
    const origin = document.getElementById('newTrainOrigin').value;
    const destination = document.getElementById('newTrainDestination').value;
    const dep = document.getElementById('newTrainDep').value;
    const arr = document.getElementById('newTrainArr').value;
    const distance = parseInt(document.getElementById('newTrainDistance').value, 10) || 500;
    const duration = document.getElementById('newTrainDuration').value.trim();

    const q2A = parseInt(document.getElementById('newQuota2ASeats').value, 10) || 48;
    const f2A = parseInt(document.getElementById('newQuota2AFare').value, 10) || 1850;
    const q3A = parseInt(document.getElementById('newQuota3ASeats').value, 10) || 120;
    const f3A = parseInt(document.getElementById('newQuota3AFare').value, 10) || 1280;
    const qSL = parseInt(document.getElementById('newQuotaSLSeats').value, 10) || 300;
    const fSL = parseInt(document.getElementById('newQuotaSLFare').value, 10) || 460;

    const origObj = STATIONS.find(s => s.code === origin) || { name: origin };
    const destObj = STATIONS.find(s => s.code === destination) || { name: destination };

    const newTrain = {
        id: 'TRN-' + trainNo,
        trainNo: trainNo,
        trainName: trainName,
        origin: origin,
        originName: origObj.name,
        destination: destination,
        destinationName: destObj.name,
        zone: zone,
        departureTime: dep,
        arrivalTime: arr,
        duration: duration,
        distanceKm: distance,
        runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        classes: {
            '2A': { totalSeats: q2A, available: q2A, rac: 6, wl: 0, baseFare: f2A },
            '3A': { totalSeats: q3A, available: q3A, rac: 12, wl: 0, baseFare: f3A },
            'SL': { totalSeats: qSL, available: qSL, rac: 24, wl: 0, baseFare: fSL }
        },
        viaStations: [
            { station: origin, name: origObj.name, arrival: '--', departure: dep, haltMin: 0, distance: 0, day: 1 },
            { station: destination, name: destObj.name, arrival: arr, departure: '--', haltMin: 0, distance: distance, day: 1 }
        ]
    };

    const trains = RailDB.get(STORAGE_KEYS.TRAINS) || [];
    trains.unshift(newTrain);
    RailDB.set(STORAGE_KEYS.TRAINS, trains);

    document.getElementById('addTrainModal').classList.remove('active');
    document.getElementById('adminAddTrainForm').reset();
    showToast(`Train schedule ${trainNo} - ${trainName} successfully added!`, 'success');
    renderAdminTrainsTable();
}

// ============================================================================
// Event Listeners Setup
// ============================================================================
function setupEventListeners() {
    // Brand Click -> Return to Home
    document.getElementById('navHome').addEventListener('click', () => switchView('view-search'));

    // Navigation View Switching
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetView = link.getAttribute('data-view');
            if (targetView) switchView(targetView);
        });
    });

    // Auth Open/Close
    document.getElementById('btnOpenAuthModal').addEventListener('click', () => openAuthModal('loginTab'));
    document.getElementById('btnCloseAuthModal').addEventListener('click', closeAuthModal);
    document.getElementById('btnLogout').addEventListener('click', handleLogout);

    // Auth Tabs Switch
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => openAuthModal(btn.getAttribute('data-tab')));
    });

    // Login Form Submit
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const em = document.getElementById('loginEmail').value;
        const pw = document.getElementById('loginPassword').value;
        handleLogin(em, pw);
    });

    // Register Form Submit
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const nm = document.getElementById('regName').value;
        const em = document.getElementById('regEmail').value;
        const ph = document.getElementById('regPhone').value;
        const pw = document.getElementById('regPassword').value;
        handleRegister(nm, em, ph, pw);
    });

    // Quick Demo Credentials Fillers
    document.getElementById('btnFillDemoPassenger').addEventListener('click', () => {
        document.getElementById('loginEmail').value = 'rahul@example.com';
        document.getElementById('loginPassword').value = 'pass';
    });
    document.getElementById('btnFillDemoAdmin').addEventListener('click', () => {
        document.getElementById('loginEmail').value = 'admin@railways.gov.in';
        document.getElementById('loginPassword').value = 'admin';
    });

    // Station Swap
    document.getElementById('btnSwapStations').addEventListener('click', () => {
        const orig = document.getElementById('searchOrigin');
        const dest = document.getElementById('searchDestination');
        const temp = orig.value;
        orig.value = dest.value;
        dest.value = temp;
    });

    // Train Search Form
    document.getElementById('trainSearchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleTrainSearch();
    });

    // Sort Results
    const sortSelect = document.getElementById('sortResultsSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            handleTrainSearch();
        });
    }

    // Booking: Back to Results
    document.getElementById('btnBackToResults').addEventListener('click', () => switchView('view-search'));

    // Booking: Add Passenger
    document.getElementById('btnAddPassenger').addEventListener('click', addPassenger);

    // Booking: Proceed to Payment
    document.getElementById('btnProceedToPayment').addEventListener('click', openPaymentModal);

    // Payment Modal: Close / Cancel
    document.getElementById('btnClosePaymentModal').addEventListener('click', closePaymentModal);
    document.getElementById('btnCancelPayment').addEventListener('click', closePaymentModal);

    // Payment Method Selection Tabs
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            const method = card.getAttribute('data-method');
            document.querySelectorAll('.pay-method-view').forEach(v => v.style.display = 'none');

            if (method === 'upi') document.getElementById('payMethodUpi').style.display = 'block';
            else if (method === 'card') document.getElementById('payMethodCard').style.display = 'block';
            else if (method === 'netbanking') document.getElementById('payMethodNetbanking').style.display = 'block';
            else if (method === 'offline') document.getElementById('payMethodOffline').style.display = 'block';
        });
    });

    // Authorize & Book Payment
    document.getElementById('btnConfirmPaymentAndBook').addEventListener('click', processPaymentAndBook);

    // Printable Ticket Close
    document.getElementById('btnCloseTicketView').addEventListener('click', () => switchView('view-my-bookings'));

    // PNR Status Query Form
    document.getElementById('btnCheckPnr').addEventListener('click', () => checkPnrStatus());

    // Sample PNR click chips
    document.querySelectorAll('.sample-pnr-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pnr = btn.getAttribute('data-pnr');
            document.getElementById('pnrQueryInput').value = pnr;
            checkPnrStatus(pnr);
        });
    });

    // Refund Modal Handlers
    document.getElementById('btnCloseCancelModal').addEventListener('click', () => {
        document.getElementById('cancelTicketModal').classList.remove('active');
    });
    document.getElementById('btnDismissCancelModal').addEventListener('click', () => {
        document.getElementById('cancelTicketModal').classList.remove('active');
    });
    document.getElementById('btnConfirmCancellation').addEventListener('click', executeCancellation);

    // Refund Simulator Calculator
    document.getElementById('btnCalculateSimRefund').addEventListener('click', simulateRefundRule);

    // Via Route Modal Close
    document.getElementById('btnCloseViaModal').addEventListener('click', () => {
        document.getElementById('viaStationsModal').classList.remove('active');
    });

    // Admin Panel Sub-tabs
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetTab = btn.getAttribute('data-tab');
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            const content = document.getElementById(targetTab);
            if (content) content.classList.add('active');
        });
    });

    // Admin Add Train Modal
    document.getElementById('btnOpenAddTrainModal').addEventListener('click', () => {
        document.getElementById('addTrainModal').classList.add('active');
    });
    document.getElementById('btnCloseAddTrainModal').addEventListener('click', () => {
        document.getElementById('addTrainModal').classList.remove('active');
    });
    document.getElementById('btnCancelAddTrain').addEventListener('click', () => {
        document.getElementById('addTrainModal').classList.remove('active');
    });
    document.getElementById('adminAddTrainForm').addEventListener('submit', handleAddNewTrain);
}

// ============================================================================
// Notification Toasts Helper
// ============================================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === 'warning') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
        ${iconSvg}
        <span style="flex: 1;">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

// ============================================================================
// Utilities
// ============================================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}
