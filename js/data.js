/**
 * Online Train Reservation System (RailSafar)
 * Data Layer & Initial Seed Data
 * Experiment 4: Internet Programming
 */

const STORAGE_KEYS = {
    TRAINS: 'railsafar_trains',
    USERS: 'railsafar_users',
    CURRENT_USER: 'railsafar_current_user',
    BOOKINGS: 'railsafar_bookings',
    PAYMENTS: 'railsafar_payments',
    FARE_RULES: 'railsafar_fare_rules',
    REFUND_RULES: 'railsafar_refund_rules'
};

// Seed Stations
const STATIONS = [
    { code: 'NDLS', name: 'New Delhi', city: 'Delhi', zone: 'Northern' },
    { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', zone: 'Western' },
    { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', zone: 'Eastern' },
    { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', zone: 'Southern' },
    { code: 'SBC', name: 'KSR Bengaluru', city: 'Bengaluru', zone: 'South Western' },
    { code: 'PNBE', name: 'Patna Junction', city: 'Patna', zone: 'East Central' },
    { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', zone: 'Western' },
    { code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow', zone: 'Northern' },
    { code: 'HYB', name: 'Hyderabad Deccan', city: 'Hyderabad', zone: 'South Central' },
    { code: 'PUNE', name: 'Pune Junction', city: 'Pune', zone: 'Central' },
    { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', zone: 'North Central' },
    { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', zone: 'Northern' }
];

// Seed Class Configurations
const TRAVEL_CLASSES = {
    '1A': { code: '1A', name: 'First AC (AC First Class)', multiplier: 3.2, baseCharge: 1200 },
    '2A': { code: '2A', name: '2 Tier AC (AC 2-Tier)', multiplier: 2.1, baseCharge: 800 },
    '3A': { code: '3A', name: '3 Tier AC (AC 3-Tier)', multiplier: 1.5, baseCharge: 550 },
    'SL': { code: 'SL', name: 'Sleeper Class (SL)', multiplier: 1.0, baseCharge: 220 },
    'CC': { code: 'CC', name: 'AC Chair Car', multiplier: 1.4, baseCharge: 450 }
};

// Seed Zone Fare Multipliers (by Zone)
const ZONE_MULTIPLIERS = {
    'Northern': 1.0,
    'Western': 1.05,
    'Southern': 1.02,
    'Eastern': 0.98,
    'Central': 1.0,
    'South Central': 1.03,
    'East Central': 0.97,
    'South Western': 1.04,
    'North Central': 1.01
};

// Seed Refund Rules configuration
const DEFAULT_REFUND_RULES = [
    {
        id: 'tier1',
        timeframe: '> 48 hours before departure',
        minHours: 48,
        description: 'Flat cancellation deduction per passenger: 1A: ₹240, 2A: ₹200, 3A: ₹180, SL: ₹120. Remainder refunded.',
        deductionType: 'flat',
        deductionByClass: { '1A': 240, '2A': 200, '3A': 180, 'SL': 120, 'CC': 180 },
        refundablePercentage: 88 // approximate for display
    },
    {
        id: 'tier2',
        timeframe: 'Between 48 hrs and 12 hrs before departure',
        minHours: 12,
        maxHours: 48,
        description: '25% of fare deducted subject to minimum flat cancellation charge.',
        deductionType: 'percentage',
        deductionPercent: 25,
        refundablePercentage: 75
    },
    {
        id: 'tier3',
        timeframe: 'Between 12 hrs and 4 hrs before departure',
        minHours: 4,
        maxHours: 12,
        description: '50% of fare deducted before chart preparation.',
        deductionType: 'percentage',
        deductionPercent: 50,
        refundablePercentage: 50
    },
    {
        id: 'tier4',
        timeframe: 'Less than 4 hrs before departure / After Charting',
        minHours: 0,
        maxHours: 4,
        description: 'No refund granted after chart preparation or within 4 hours of departure.',
        deductionType: 'percentage',
        deductionPercent: 100,
        refundablePercentage: 0
    },
    {
        id: 'rac_wl',
        timeframe: 'RAC / Waiting List cancellation up to 30 mins before departure',
        description: 'Only clerkage charge of ₹60 is deducted per passenger.',
        deductionType: 'flat_all',
        flatAmount: 60,
        refundablePercentage: 92
    }
];

// Seed Trains with Via details and realistic routes
const SEED_TRAINS = [
    {
        id: 'TRN-12952',
        trainNo: '12952',
        trainName: 'Mumbai Tejas Rajdhani Express',
        origin: 'NDLS',
        originName: 'New Delhi',
        destination: 'MMCT',
        destinationName: 'Mumbai Central',
        zone: 'Western',
        departureTime: '16:55',
        arrivalTime: '08:35',
        duration: '15h 40m',
        distanceKm: 1386,
        runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        classes: {
            '1A': { totalSeats: 24, available: 14, rac: 0, wl: 0, baseFare: 4850 },
            '2A': { totalSeats: 48, available: 22, rac: 4, wl: 0, baseFare: 3120 },
            '3A': { totalSeats: 120, available: 45, rac: 10, wl: 0, baseFare: 2260 }
        },
        viaStations: [
            { station: 'NDLS', name: 'New Delhi', arrival: '--', departure: '16:55', haltMin: 0, distance: 0, day: 1 },
            { station: 'CNB', name: 'Kanpur Central', arrival: '20:10', departure: '20:15', haltMin: 5, distance: 440, day: 1 },
            { station: 'KOTA', name: 'Kota Junction', arrival: '21:30', departure: '21:40', haltMin: 10, distance: 465, day: 1 },
            { station: 'RTM', name: 'Ratlam Junction', arrival: '01:05', departure: '01:10', haltMin: 5, distance: 731, day: 2 },
            { station: 'BRC', name: 'Vadodara Junction', arrival: '04:40', departure: '04:48', haltMin: 8, distance: 992, day: 2 },
            { station: 'ST', name: 'Surat', arrival: '06:15', departure: '06:20', haltMin: 5, distance: 1122, day: 2 },
            { station: 'MMCT', name: 'Mumbai Central', arrival: '08:35', departure: '--', haltMin: 0, distance: 1386, day: 2 }
        ]
    },
    {
        id: 'TRN-22436',
        trainNo: '22436',
        trainName: 'Vande Bharat Express',
        origin: 'NDLS',
        originName: 'New Delhi',
        destination: 'BSB',
        destinationName: 'Varanasi Junction',
        zone: 'Northern',
        departureTime: '06:00',
        arrivalTime: '14:00',
        duration: '8h 00m',
        distanceKm: 759,
        runsOn: ['Tue', 'Wed', 'Fri', 'Sat', 'Sun'],
        classes: {
            'CC': { totalSeats: 200, available: 32, rac: 0, wl: 0, baseFare: 1750 },
            '1A': { totalSeats: 52, available: 6, rac: 0, wl: 0, baseFare: 3300 }
        },
        viaStations: [
            { station: 'NDLS', name: 'New Delhi', arrival: '--', departure: '06:00', haltMin: 0, distance: 0, day: 1 },
            { station: 'CNB', name: 'Kanpur Central', arrival: '10:08', departure: '10:10', haltMin: 2, distance: 440, day: 1 },
            { station: 'PRYJ', name: 'Prayagraj Junction', arrival: '12:08', departure: '12:10', haltMin: 2, distance: 635, day: 1 },
            { station: 'BSB', name: 'Varanasi Junction', arrival: '14:00', departure: '--', haltMin: 0, distance: 759, day: 1 }
        ]
    },
    {
        id: 'TRN-12302',
        trainNo: '12302',
        trainName: 'Howrah Rajdhani Express',
        origin: 'NDLS',
        originName: 'New Delhi',
        destination: 'HWH',
        destinationName: 'Howrah Junction',
        zone: 'Eastern',
        departureTime: '16:50',
        arrivalTime: '09:55',
        duration: '17h 05m',
        distanceKm: 1450,
        runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'],
        classes: {
            '1A': { totalSeats: 30, available: 8, rac: 0, wl: 0, baseFare: 4980 },
            '2A': { totalSeats: 60, available: 16, rac: 2, wl: 0, baseFare: 3280 },
            '3A': { totalSeats: 140, available: 38, rac: 8, wl: 0, baseFare: 2390 }
        },
        viaStations: [
            { station: 'NDLS', name: 'New Delhi', arrival: '--', departure: '16:50', haltMin: 0, distance: 0, day: 1 },
            { station: 'CNB', name: 'Kanpur Central', arrival: '21:32', departure: '21:37', haltMin: 5, distance: 440, day: 1 },
            { station: 'PRYJ', name: 'Prayagraj Junction', arrival: '23:43', departure: '23:45', haltMin: 2, distance: 635, day: 1 },
            { station: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', arrival: '01:47', departure: '01:57', haltMin: 10, distance: 787, day: 2 },
            { station: 'GAYA', name: 'Gaya Junction', arrival: '04:10', departure: '04:13', haltMin: 3, distance: 992, day: 2 },
            { station: 'DHN', name: 'Dhanbad Junction', arrival: '06:45', departure: '06:50', haltMin: 5, distance: 1193, day: 2 },
            { station: 'HWH', name: 'Howrah Junction', arrival: '09:55', departure: '--', haltMin: 0, distance: 1450, day: 2 }
        ]
    },
    {
        id: 'TRN-12622',
        trainNo: '12622',
        trainName: 'Tamil Nadu Superfast Express',
        origin: 'NDLS',
        originName: 'New Delhi',
        destination: 'MAS',
        destinationName: 'MGR Chennai Central',
        zone: 'Southern',
        departureTime: '21:05',
        arrivalTime: '06:35',
        duration: '33h 30m',
        distanceKm: 2182,
        runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        classes: {
            '1A': { totalSeats: 18, available: 4, rac: 0, wl: 0, baseFare: 5400 },
            '2A': { totalSeats: 54, available: 12, rac: 0, wl: 0, baseFare: 3450 },
            '3A': { totalSeats: 160, available: 28, rac: 14, wl: 0, baseFare: 2420 },
            'SL': { totalSeats: 320, available: 64, rac: 25, wl: 10, baseFare: 840 }
        },
        viaStations: [
            { station: 'NDLS', name: 'New Delhi', arrival: '--', departure: '21:05', haltMin: 0, distance: 0, day: 1 },
            { station: 'AGC', name: 'Agra Cantt', arrival: '23:25', departure: '23:30', haltMin: 5, distance: 195, day: 1 },
            { station: 'GWL', name: 'Gwalior Junction', arrival: '01:13', departure: '01:15', haltMin: 2, distance: 313, day: 2 },
            { station: 'VGLJ', name: 'VGL Jhansi Junction', arrival: '02:35', departure: '02:45', haltMin: 10, distance: 411, day: 2 },
            { station: 'BPL', name: 'Bhopal Junction', arrival: '06:45', departure: '06:50', haltMin: 5, distance: 702, day: 2 },
            { station: 'NGP', name: 'Nagpur Junction', arrival: '13:05', departure: '13:10', haltMin: 5, distance: 1093, day: 2 },
            { station: 'BPQ', name: 'Balharshah', arrival: '16:25', departure: '16:30', haltMin: 5, distance: 1301, day: 2 },
            { station: 'WL', name: 'Warangal', arrival: '19:48', departure: '19:50', haltMin: 2, distance: 1545, day: 2 },
            { station: 'BZA', name: 'Vijayawada Junction', arrival: '23:20', departure: '23:30', haltMin: 10, distance: 1752, day: 2 },
            { station: 'MAS', name: 'MGR Chennai Central', arrival: '06:35', departure: '--', haltMin: 0, distance: 2182, day: 3 }
        ]
    },
    {
        id: 'TRN-12008',
        trainNo: '12008',
        trainName: 'Shatabdi Express',
        origin: 'MAS',
        originName: 'MGR Chennai Central',
        destination: 'SBC',
        destinationName: 'KSR Bengaluru',
        zone: 'Southern',
        departureTime: '06:00',
        arrivalTime: '10:55',
        duration: '4h 55m',
        distanceKm: 359,
        runsOn: ['Mon', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        classes: {
            'CC': { totalSeats: 180, available: 48, rac: 0, wl: 0, baseFare: 980 },
            '1A': { totalSeats: 40, available: 10, rac: 0, wl: 0, baseFare: 1850 }
        },
        viaStations: [
            { station: 'MAS', name: 'MGR Chennai Central', arrival: '--', departure: '06:00', haltMin: 0, distance: 0, day: 1 },
            { station: 'KPD', name: 'Katpadi Junction', arrival: '07:38', departure: '07:40', haltMin: 2, distance: 130, day: 1 },
            { station: 'JTJ', name: 'Jolarpettai Junction', arrival: '08:48', departure: '08:50', haltMin: 2, distance: 214, day: 1 },
            { station: 'BWT', name: 'Bangarapet', arrival: '09:48', departure: '09:50', haltMin: 2, distance: 289, day: 1 },
            { station: 'SBC', name: 'KSR Bengaluru', arrival: '10:55', departure: '--', haltMin: 0, distance: 359, day: 1 }
        ]
    },
    {
        id: 'TRN-12124',
        trainNo: '12124',
        trainName: 'Deccan Queen Superfast',
        origin: 'PUNE',
        originName: 'Pune Junction',
        destination: 'MMCT',
        destinationName: 'Mumbai Central',
        zone: 'Central',
        departureTime: '07:15',
        arrivalTime: '10:25',
        duration: '3h 10m',
        distanceKm: 192,
        runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        classes: {
            'CC': { totalSeats: 220, available: 75, rac: 0, wl: 0, baseFare: 420 },
            '2A': { totalSeats: 60, available: 18, rac: 0, wl: 0, baseFare: 780 }
        },
        viaStations: [
            { station: 'PUNE', name: 'Pune Junction', arrival: '--', departure: '07:15', haltMin: 0, distance: 0, day: 1 },
            { station: 'LNL', name: 'Lonavala', arrival: '08:06', departure: '08:08', haltMin: 2, distance: 64, day: 1 },
            { station: 'KJT', name: 'Karjat', arrival: '08:46', departure: '08:48', haltMin: 2, distance: 100, day: 1 },
            { station: 'KYN', name: 'Kalyan Junction', arrival: '09:33', departure: '09:35', haltMin: 2, distance: 147, day: 1 },
            { station: 'MMCT', name: 'Mumbai Central', arrival: '10:25', departure: '--', haltMin: 0, distance: 192, day: 1 }
        ]
    },
    {
        id: 'TRN-12296',
        trainNo: '12296',
        trainName: 'Sanghamitra Superfast Express',
        origin: 'SBC',
        originName: 'KSR Bengaluru',
        destination: 'PNBE',
        destinationName: 'Patna Junction',
        zone: 'South Western',
        departureTime: '09:00',
        arrivalTime: '09:20',
        duration: '48h 20m',
        distanceKm: 2698,
        runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        classes: {
            '2A': { totalSeats: 48, available: 5, rac: 2, wl: 0, baseFare: 3640 },
            '3A': { totalSeats: 160, available: 14, rac: 6, wl: 2, baseFare: 2490 },
            'SL': { totalSeats: 360, available: 42, rac: 20, wl: 15, baseFare: 920 }
        },
        viaStations: [
            { station: 'SBC', name: 'KSR Bengaluru', arrival: '--', departure: '09:00', haltMin: 0, distance: 0, day: 1 },
            { station: 'MAS', name: 'MGR Chennai Central', arrival: '14:30', departure: '14:55', haltMin: 25, distance: 359, day: 1 },
            { station: 'BZA', name: 'Vijayawada Junction', arrival: '21:00', departure: '21:10', haltMin: 10, distance: 789, day: 1 },
            { station: 'BPQ', name: 'Balharshah', arrival: '04:15', departure: '04:20', haltMin: 5, distance: 1238, day: 2 },
            { station: 'NGP', name: 'Nagpur Junction', arrival: '07:35', departure: '07:40', haltMin: 5, distance: 1446, day: 2 },
            { station: 'ET', name: 'Itarsi Junction', arrival: '12:45', departure: '12:55', haltMin: 10, distance: 1744, day: 2 },
            { station: 'JBP', name: 'Jabalpur', arrival: '16:30', departure: '16:40', haltMin: 10, distance: 1989, day: 2 },
            { station: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', arrival: '03:50', departure: '04:00', haltMin: 10, distance: 2486, day: 3 },
            { station: 'PNBE', name: 'Patna Junction', arrival: '09:20', departure: '--', haltMin: 0, distance: 2698, day: 3 }
        ]
    },
    {
        id: 'TRN-12933',
        trainNo: '12933',
        trainName: 'Karnavati Express',
        origin: 'MMCT',
        originName: 'Mumbai Central',
        destination: 'ADI',
        destinationName: 'Ahmedabad Junction',
        zone: 'Western',
        departureTime: '14:05',
        arrivalTime: '21:25',
        duration: '7h 20m',
        distanceKm: 491,
        runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        classes: {
            'CC': { totalSeats: 240, available: 62, rac: 0, wl: 0, baseFare: 670 },
            '2A': { totalSeats: 56, available: 14, rac: 0, wl: 0, baseFare: 1120 }
        },
        viaStations: [
            { station: 'MMCT', name: 'Mumbai Central', arrival: '--', departure: '14:05', haltMin: 0, distance: 0, day: 1 },
            { station: 'BVI', name: 'Borivali', arrival: '14:33', departure: '14:35', haltMin: 2, distance: 30, day: 1 },
            { station: 'VAPI', name: 'Vapi', arrival: '16:01', departure: '16:03', haltMin: 2, distance: 168, day: 1 },
            { station: 'ST', name: 'Surat', arrival: '17:17', departure: '17:22', haltMin: 5, distance: 263, day: 1 },
            { station: 'BRC', name: 'Vadodara Junction', arrival: '19:02', departure: '19:07', haltMin: 5, distance: 393, day: 1 },
            { station: 'ANND', name: 'Anand Junction', arrival: '19:41', departure: '19:43', haltMin: 2, distance: 428, day: 1 },
            { station: 'ADI', name: 'Ahmedabad Junction', arrival: '21:25', departure: '--', haltMin: 0, distance: 491, day: 1 }
        ]
    }
];

// Seed Users: 1 Admin and 2 Passengers
const SEED_USERS = [
    {
        id: 'USR-ADMIN',
        fullName: 'Chief Railway Admin',
        email: 'admin@railways.gov.in',
        phone: '9876543210',
        password: 'admin',
        role: 'admin',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
        id: 'USR-DEMO1',
        fullName: 'Rahul Sharma',
        email: 'rahul@example.com',
        phone: '9811223344',
        password: 'pass',
        role: 'passenger',
        status: 'Active',
        createdAt: '2026-02-15T10:30:00.000Z'
    },
    {
        id: 'USR-DEMO2',
        fullName: 'Priya Sundaram',
        email: 'priya@example.com',
        phone: '9877665544',
        password: 'pass',
        role: 'passenger',
        status: 'Active',
        createdAt: '2026-03-01T14:20:00.000Z'
    }
];

// Helper to get formatted date string (YYYY-MM-DD)
function getDateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

// Seed Initial Bookings
const SEED_BOOKINGS = [
    {
        pnr: '2468135790',
        trainId: 'TRN-12952',
        trainNo: '12952',
        trainName: 'Mumbai Tejas Rajdhani Express',
        origin: 'NDLS',
        originName: 'New Delhi',
        destination: 'MMCT',
        destinationName: 'Mumbai Central',
        journeyDate: getDateOffset(4),
        bookingDate: new Date().toISOString(),
        travelClass: '2A',
        quota: 'General',
        userId: 'USR-DEMO1',
        userEmail: 'rahul@example.com',
        passengers: [
            { name: 'Rahul Sharma', age: 29, gender: 'Male', berthPref: 'Lower', coach: 'A1', berthNo: '23', status: 'CNF' },
            { name: 'Neha Sharma', age: 27, gender: 'Female', berthPref: 'Upper', coach: 'A1', berthNo: '24', status: 'CNF' }
        ],
        farePerPassenger: 3120,
        totalFare: 6240,
        gst: 312,
        grandTotal: 6552,
        paymentStatus: 'Success',
        paymentMode: 'Online - UPI',
        transactionId: 'TXN-982468135',
        bookingStatus: 'Confirmed', // Confirmed, Cancelled, Partial
        chartStatus: 'Chart Not Prepared',
        refundStatus: 'None' // None, Requested, Approved, Rejected
    },
    {
        pnr: '1357924680',
        trainId: 'TRN-22436',
        trainNo: '22436',
        trainName: 'Vande Bharat Express',
        origin: 'NDLS',
        originName: 'New Delhi',
        destination: 'BSB',
        destinationName: 'Varanasi Junction',
        journeyDate: getDateOffset(1),
        bookingDate: new Date().toISOString(),
        travelClass: 'CC',
        quota: 'General',
        userId: 'USR-DEMO2',
        userEmail: 'priya@example.com',
        passengers: [
            { name: 'Priya Sundaram', age: 24, gender: 'Female', berthPref: 'Window', coach: 'C2', berthNo: '45', status: 'CNF' }
        ],
        farePerPassenger: 1750,
        totalFare: 1750,
        gst: 87,
        grandTotal: 1837,
        paymentStatus: 'Success',
        paymentMode: 'Online - Credit Card',
        transactionId: 'TXN-17294821',
        bookingStatus: 'Confirmed',
        chartStatus: 'Chart Prepared',
        refundStatus: 'None'
    },
    {
        pnr: '8912345670',
        trainId: 'TRN-12622',
        trainNo: '12622',
        trainName: 'Tamil Nadu Superfast Express',
        origin: 'NDLS',
        originName: 'New Delhi',
        destination: 'MAS',
        destinationName: 'MGR Chennai Central',
        journeyDate: getDateOffset(6),
        bookingDate: new Date().toISOString(),
        travelClass: 'SL',
        quota: 'General',
        userId: 'USR-DEMO1',
        userEmail: 'rahul@example.com',
        passengers: [
            { name: 'Amit Verma', age: 34, gender: 'Male', berthPref: 'Side Lower', coach: 'S4', berthNo: 'RAC 5', status: 'RAC' }
        ],
        farePerPassenger: 840,
        totalFare: 840,
        gst: 42,
        grandTotal: 882,
        paymentStatus: 'Success',
        paymentMode: 'Offline - Station Challan',
        transactionId: 'CHLN-5529104',
        bookingStatus: 'RAC',
        chartStatus: 'Chart Not Prepared',
        refundStatus: 'None'
    }
];

// Seed Payments Log (Maintained for System Admin)
const SEED_PAYMENTS = [
    {
        transactionId: 'TXN-982468135',
        pnr: '2468135790',
        amount: 6552,
        paymentMode: 'Online - UPI (Google Pay)',
        payerEmail: 'rahul@example.com',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'Completed',
        notes: 'Ticket confirmed for 2 passengers'
    },
    {
        transactionId: 'TXN-17294821',
        pnr: '1357924680',
        amount: 1837,
        paymentMode: 'Online - Credit Card (HDFC ****9012)',
        payerEmail: 'priya@example.com',
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: 'Completed',
        notes: 'Vande Bharat CC Booking'
    },
    {
        transactionId: 'CHLN-5529104',
        pnr: '8912345670',
        amount: 882,
        paymentMode: 'Offline - Railway Station Cash Counter',
        payerEmail: 'rahul@example.com',
        timestamp: new Date().toISOString(),
        status: 'Completed',
        notes: 'Counter Challan validated by Station Clerk'
    }
];

/**
 * Storage Controller: Initializer and persistence
 */
const RailDB = {
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.TRAINS)) {
            localStorage.setItem(STORAGE_KEYS.TRAINS, JSON.stringify(SEED_TRAINS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
            localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
            localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(SEED_PAYMENTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.REFUND_RULES)) {
            localStorage.setItem(STORAGE_KEYS.REFUND_RULES, JSON.stringify(DEFAULT_REFUND_RULES));
        }
        if (!localStorage.getItem(STORAGE_KEYS.FARE_RULES)) {
            localStorage.setItem(STORAGE_KEYS.FARE_RULES, JSON.stringify({
                classes: TRAVEL_CLASSES,
                zones: ZONE_MULTIPLIERS
            }));
        }
    },

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading localStorage for key', key, e);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage for key', key, e);
            return false;
        }
    },

    // Session helpers
    getCurrentUser() {
        return this.get(STORAGE_KEYS.CURRENT_USER);
    },

    setCurrentUser(user) {
        if (user) {
            this.set(STORAGE_KEYS.CURRENT_USER, user);
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
    },

    resetToDefaults() {
        localStorage.setItem(STORAGE_KEYS.TRAINS, JSON.stringify(SEED_TRAINS));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(SEED_PAYMENTS));
        localStorage.setItem(STORAGE_KEYS.REFUND_RULES, JSON.stringify(DEFAULT_REFUND_RULES));
        localStorage.setItem(STORAGE_KEYS.FARE_RULES, JSON.stringify({
            classes: TRAVEL_CLASSES,
            zones: ZONE_MULTIPLIERS
        }));
    }
};

// Initialize DB on script load
RailDB.init();
