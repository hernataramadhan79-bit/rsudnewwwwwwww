const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database (creates file if not exists)
const dbPath = path.resolve(__dirname, 'hospital.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + dbPath + ': ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Initialize tables
db.serialize(() => {
  // Doctors Table
  db.run(`CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    specialty TEXT,
    image TEXT,
    schedule TEXT,
    available BOOLEAN
  )`);

  // Registrations Table
  db.run(`CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nik TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    poli TEXT,
    date TEXT,
    payment TEXT,
    payment_detail TEXT,
    payment_status TEXT,
    cost INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Try to add status column if it doesn't exist (migrations simulation)
  db.run("ALTER TABLE registrations ADD COLUMN status TEXT DEFAULT 'Pending'", (err) => {});
  // Add Payment Detail and Status columns
  db.run("ALTER TABLE registrations ADD COLUMN payment_detail TEXT DEFAULT 'Tunai'", (err) => {});
  db.run("ALTER TABLE registrations ADD COLUMN payment_status TEXT DEFAULT 'Unpaid'", (err) => {});
  // Add Cost column
  db.run("ALTER TABLE registrations ADD COLUMN cost INTEGER DEFAULT 0", (err) => {});
  // Add Email column
  db.run("ALTER TABLE registrations ADD COLUMN email TEXT", (err) => {});
  // Add Payment Proof column
  db.run("ALTER TABLE registrations ADD COLUMN payment_proof TEXT", (err) => {});
  // Add Class Type column
  db.run("ALTER TABLE registrations ADD COLUMN class_type TEXT", (err) => {});
  // Add Facility Notes column
  db.run("ALTER TABLE registrations ADD COLUMN facility_notes TEXT", (err) => {});

  // Contact Messages Table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    subject TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Try to add is_read column if it doesn't exist
  db.run("ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT 0", (err) => {
    // Ignore error if column exists
  });

  // Users Table (Staf/Admin)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    username TEXT,
    role TEXT,
    status TEXT
  )`);

  // BPJS Data Table
  db.run(`CREATE TABLE IF NOT EXISTS bpjs_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_number TEXT,
    name TEXT,
    class_type TEXT,
    status TEXT,
    faskes TEXT
  )`);

  // Facilities / Tariffs Table
  db.run(`CREATE TABLE IF NOT EXISTS facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    price INTEGER
  )`);

  // Rooms Table
  db.run(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    class_type TEXT,
    total_beds INTEGER,
    occupied_beds INTEGER,
    price INTEGER
  )`);

  // Bank Accounts / VA Table
  db.run(`CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    type TEXT, 
    is_active BOOLEAN DEFAULT 1
  )`);

  // Seed Data (Check if doctors empty first)
  db.get("SELECT count(*) as count FROM doctors", [], (err, row) => {
    if (err) return console.error(err.message);
    if (row.count === 0) {
      console.log("Seeding doctors data...");
      const doctors = [
        ['dr. Andi Wijaya, Sp.PD', 'Penyakit Dalam', 'https://picsum.photos/seed/doc1/200/200', 'Senin - Kamis, 08.00 - 12.00', 1],
        ['dr. Sarah Utami, Sp.A', 'Anak', 'https://picsum.photos/seed/doc2/200/200', 'Senin - Jumat, 09.00 - 14.00', 1],
        ['dr. Budi Santoso, Sp.JP', 'Jantung & Pembuluh Darah', 'https://picsum.photos/seed/doc3/200/200', 'Selasa & Kamis, 13.00 - 16.00', 0],
        ['dr. Linda Kusuma, Sp.OG', 'Kebidanan & Kandungan', 'https://picsum.photos/seed/doc4/200/200', 'Senin, Rabu, Jumat, 08.00 - 11.00', 1],
        ['dr. Hendra Gunawan, Sp.B', 'Bedah Umum', 'https://picsum.photos/seed/doc5/200/200', 'Jumat - Sabtu, 10.00 - 13.00', 1],
        ['dr. Maya Putri, Sp.M', 'Mata', 'https://picsum.photos/seed/doc6/200/200', 'Senin & Kamis, 14.00 - 17.00', 1]
      ];

      const stmt = db.prepare("INSERT INTO doctors (name, specialty, image, schedule, available) VALUES (?, ?, ?, ?, ?)");
      doctors.forEach(doc => stmt.run(doc));
      stmt.finalize();
    }
  });

  // Seed Users
  db.get("SELECT count(*) as count FROM users", [], (err, row) => {
    if (!err && row.count === 0) {
      const users = [
        ['Admin Utama', 'admin', 'Super Admin', 'Active'],
        ['Budi Staff', 'staff01', 'Staff Pendaftaran', 'Active'],
        ['Siti Perawat', 'perawat01', 'Perawat', 'Active']
      ];
      const stmt = db.prepare("INSERT INTO users (name, username, role, status) VALUES (?,?,?,?)");
      users.forEach(u => stmt.run(u));
      stmt.finalize();
    }
  });

  // Seed BPJS
  db.get("SELECT count(*) as count FROM bpjs_data", [], (err, row) => {
    if (!err && row.count === 0) {
      const bpjs = [
        ['0001234567890', 'Ahmad Dahlan', 'Kelas 1', 'Aktif', 'Puskesmas Dolopo'],
        ['0009876543210', 'Siti Maimunah', 'Kelas 3', 'Aktif', 'Klinik Sehat'],
        ['0001122334455', 'Joko Susilo', 'Kelas 2', 'Tidak Aktif', 'Puskesmas Geger']
      ];
      const stmt = db.prepare("INSERT INTO bpjs_data (card_number, name, class_type, status, faskes) VALUES (?,?,?,?,?)");
      bpjs.forEach(b => stmt.run(b));
      stmt.finalize();
    }
  });

  // Seed Facilities
  db.get("SELECT count(*) as count FROM facilities", [], (err, row) => {
    if (!err && row.count === 0) {
      const facilities = [
        ['Pendaftaran Umum', 'Administrasi', 15000],
        ['Konsultasi Dokter Spesialis', 'Poli Jalan', 75000],
        ['Cek Darah Lengkap', 'Laboratorium', 120000],
        ['Rontgen Thorax', 'Radiologi', 150000],
        ['USG Abdomen', 'Radiologi', 200000]
      ];
      const stmt = db.prepare("INSERT INTO facilities (name, category, price) VALUES (?,?,?)");
      facilities.forEach(f => stmt.run(f));
      stmt.finalize();
    }
  });

  // Seed Rooms
  db.get("SELECT count(*) as count FROM rooms", [], (err, row) => {
    if (!err && row.count === 0) {
      const rooms = [
        ['Mawar 01', 'VIP', 1, 0, 750000],
        ['Melati 01', 'Kelas 1', 2, 1, 400000],
        ['Anggrek 01', 'Kelas 2', 4, 3, 250000],
        ['Kenanga 01', 'Kelas 3', 6, 5, 100000]
      ];
      const stmt = db.prepare("INSERT INTO rooms (name, class_type, total_beds, occupied_beds, price) VALUES (?,?,?,?,?)");
      rooms.forEach(r => stmt.run(r));
      stmt.finalize();
    }
  });

  // Seed Bank Accounts
  db.get("SELECT count(*) as count FROM bank_accounts", [], (err, row) => {
    if (!err && row.count === 0) {
      const banks = [
        ['BCA', '8735089123', 'RSUD Dolopo', 'Transfer', 1],
        ['BRI', '0045010023456', 'RSUD Dolopo BLUD', 'Transfer', 1],
        ['Mandiri VA', '88000', 'RSUD Dolopo', 'VA', 1],
        ['BNI VA', '99000', 'RSUD Dolopo', 'VA', 1]
      ];
      const stmt = db.prepare("INSERT INTO bank_accounts (bank_name, account_number, account_name, type, is_active) VALUES (?,?,?,?,?)");
      banks.forEach(b => stmt.run(b));
      stmt.finalize();
    }
  });
});

module.exports = db;