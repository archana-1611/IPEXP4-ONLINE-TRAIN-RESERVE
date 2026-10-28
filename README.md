# IPEXP4-ONLINE-TRAIN-RESERVE

## Online Train Reservation System (RailSafar)
### Internet Programming Lab — Experiment 4

**RailSafar** is a modern, responsive web application for the Indian Railway Reservation System built with vanilla HTML5, CSS3, and JavaScript. It provides real-time train searches, interactive berth selection, dual payment processing (online & offline), PNR status tracking, tiered ticket cancellation with automated refund calculation, and a comprehensive Railway Admin Control Panel.

---

## 📋 Features & Requirement Mapping

| # | Requirement Specification | Implementation in RailSafar |
|---|---------------------------|-----------------------------|
| **1** | **User Authentication & Passenger Details**<br>Passenger must log in with valid credentials, provide journey date, names of passengers, ages, gender, berth preferences, origin, destination, and class type. | • Sign-In & Registration system with role-based sessions (`passenger` and `admin`).<br>• Dynamic multi-passenger form with validation.<br>• Interactive coach berth selector (Lower, Middle, Upper, Side Lower, Window). |
| **2** | **Train List, Seat Availability & Via Details**<br>Display available train list, real-time seat availability (CNF/RAC/WL), and via/intermediate route details. | • Train search by origin, destination, date, and class.<br>• Dynamic status badges (`AVL XX`, `RAC XX`, `WL XX`).<br>• "View Via Halts" modal showing complete station timeline, arrival/departure timings, halt durations, and cumulative distances. |
| **3** | **Online/Offline Payment & PNR Generation**<br>Pay through online/offline mode. After payment, generate ticket and 10-digit PNR. Keep payment details and send to System Admin. | • Integrated Railway Payment Gateway supporting UPI QR Code, Credit/Debit Card, Net Banking, and Offline PRS Counter Challan.<br>• Generates authentic 10-digit PNR (`PRG-XXXXXXX`).<br>• Stores complete transaction records in the Admin Payment Audit Ledger. |
| **4** | **Real-Time PNR Status Check**<br>Check PNR status (Confirmed, RAC, Waiting List) by entering 10-digit PNR. | • Dedicated PNR Status Inquiry tab.<br>• 3-stage visual progress stepper (Booking &bull; Charting &bull; Berth Allotment).<br>• Displays individual passenger status and coach/berth details. |
| **5** | **Admin Maintenance Suite**<br>Store train details, fare details (by zone, class, date), PNR numbers, dates, controlled by Admin. | • Dedicated Railway Admin Panel.<br>• Add/Edit/Delete train schedules.<br>• Live seat quota adjuster.<br>• Zone multipliers & class fare matrix.<br>• User account status toggle (Active/Suspended). |
| **6** | **Cancellation & Tiered Refund Rules**<br>Date of reservation, ticket fare, refundable percentage. Passenger cancels ticket by PNR. Admin passes refundable amount to system and credits passenger. | • Tiered refund calculation engine based on hours before departure.<br>• Automated breakdown: Original fare, cancellation fee, refundable %, net refund.<br>• Admin Refund Settlement queue with one-click "Approve & Pass to System". |

---

## 🎫 Refund & Cancellation Policy Matrix

The system implements official railway refund calculation rules:

| Timeline Prior to Departure | Cancellation Deduction Rule | Refundable % |
|-----------------------------|-----------------------------|--------------|
| **> 48 Hours** | Flat fee per passenger: **1A:** ₹240, **2A:** ₹200, **3A:** ₹180, **SL:** ₹120, **CC:** ₹180 | **~88% – 94%** |
| **Between 48 hrs & 12 hrs** | 25% of total ticket fare deducted | **75%** |
| **Between 12 hrs & 4 hrs** | 50% of total ticket fare deducted | **50%** |
| **< 4 Hours / After Charting** | 100% deduction | **0%** (No refund) |
| **RAC / Waitlisted Tickets** | Clerkage charge of ₹60 per passenger deducted | **~92%** |

---

## 👥 Demo User Credentials

For fast evaluation and demonstration, convenient one-click demo filler buttons are available in the login dialog:

| Role | Email | Password | Access Privileges |
|------|-------|----------|-------------------|
| **Passenger** | `rahul@example.com` | `pass` | Search trains, book tickets, select coach berths, view bookings, print tickets, request cancellations. |
| **Passenger 2** | `priya@example.com` | `pass` | Alternate passenger account with existing bookings. |
| **Railway Admin** | `admin@railways.gov.in` | `admin` | Chief Administrator access: Train fleet manager, payment audit logs, refund settlement queue, user management. |

---

## 🏗️ Project Architecture

```
IP EXP 4/
├── index.html            # Main Single-Page Application (SPA) structure & modals
├── css/
│   └── style.css         # Modern dark luxury design system, responsive grids & print styles
├── js/
│   ├── data.js           # Seed data (trains, stations, fares, refund tiers) & LocalStorage DB
│   └── app.js            # Core application controller (auth, search, booking, payment, PNR, admin)
└── README.md             # Project documentation & lab write-up
```

---

## 🚀 Running the Application

Since this application uses vanilla web technologies and client-side persistence, it can be run using any static file server:

### Option 1: Python HTTP Server (Recommended)
```bash
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in any modern browser.

### Option 2: Node.js Serve
```bash
npx serve -l 8080
```

### Option 3: Direct File Opening
Double-click `index.html` to open directly in Google Chrome, Microsoft Edge, or Mozilla Firefox.

---

## 🖨️ Printing Official E-Tickets

1. Navigate to **My Bookings** or complete any booking.
2. Click **View / Print E-Ticket**.
3. Click the **Print Ticket / Save as PDF** button or press `Ctrl + P`.
4. The custom print stylesheet (`@media print`) will automatically isolate the official Indian Railways Electronic Reservation Slip (ERS), hiding navigation bars and buttons for a clean physical printout or PDF export.
