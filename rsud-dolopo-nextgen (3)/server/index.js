const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
// Increase payload limit for base64 images
app.use(bodyParser.json({ limit: '10mb' }));

// --- API Endpoints ---

// 1. Get All Doctors
app.get('/api/doctors', (req, res) => {
  const sql = "SELECT * FROM doctors";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    // Convert 1/0 to boolean for frontend consistency
    const formattedRows = rows.map(row => ({
      ...row,
      available: row.available === 1
    }));
    res.json({
      "message": "success",
      "data": formattedRows
    });
  });
});

// 2. Add New Doctor (Admin)
app.post('/api/doctors', (req, res) => {
  const { name, specialty, image, schedule, available } = req.body;
  const sql = "INSERT INTO doctors (name, specialty, image, schedule, available) VALUES (?,?,?,?,?)";
  const params = [name, specialty, image, schedule, available ? 1 : 0];
  
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({
      "message": "success",
      "data": { id: this.lastID, ...req.body }
    });
  });
});

// Update Doctor
app.put('/api/doctors/:id', (req, res) => {
  const { name, specialty, image, schedule, available } = req.body;
  const sql = "UPDATE doctors SET name = ?, specialty = ?, image = ?, schedule = ?, available = ? WHERE id = ?";
  const params = [name, specialty, image, schedule, available ? 1 : 0, req.params.id];
  db.run(sql, params, function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "updated", changes: this.changes });
  });
});

// 3. Delete Doctor (Admin)
app.delete('/api/doctors/:id', (req, res) => {
  const sql = "DELETE FROM doctors WHERE id = ?";
  db.run(sql, req.params.id, function (err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({ "message": "deleted", changes: this.changes });
  });
});

// 4. Register Patient (Daftar Online)
app.post('/api/register', (req, res) => {
  const { nik, name, email, phone, poli, date, payment, payment_detail } = req.body;
  
  if (!nik || !name || !email || !phone || !poli || !date) {
    res.status(400).json({ "error": "Semua field wajib diisi" });
    return;
  }

  // Default payment status: Paid if BPJS, Unpaid if Umum (unless specified)
  const payment_status = payment === 'bpjs' ? 'Paid' : 'Unpaid';
  const final_payment_detail = payment === 'bpjs' ? 'BPJS Kesehatan' : (payment_detail || 'Tunai');
  const cost = 0; // Default cost is 0 until admin sets it

  const sql = 'INSERT INTO registrations (nik, name, email, phone, poli, date, payment, payment_detail, payment_status, cost, status) VALUES (?,?,?,?,?,?,?,?,?,?, "Pending")';
  const params = [nik, name, email, phone, poli, date, payment, final_payment_detail, payment_status, cost];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    
    // Generate Booking Code
    const bookingCode = `REG-${this.lastID.toString().padStart(4, '0')}`;
    
    res.json({
      "message": "success",
      "data": {
        id: this.lastID,
        bookingCode: bookingCode,
        ...req.body,
        payment_detail: final_payment_detail,
        payment_status: payment_status,
        cost: cost
      }
    });
  });
});

// Update Registration Status & Cost & Proof
app.put('/api/registrations/:id', (req, res) => {
  const { status, payment_status, cost, payment_detail, payment_proof, class_type, facility_notes } = req.body;
  
  let sql = "UPDATE registrations SET ";
  const params = [];
  const updates = [];

  if (status) {
    updates.push("status = ?");
    params.push(status);
  }
  if (payment_status) {
    updates.push("payment_status = ?");
    params.push(payment_status);
  }
  if (cost !== undefined) {
    updates.push("cost = ?");
    params.push(cost);
  }
  if (payment_detail) {
    updates.push("payment_detail = ?");
    params.push(payment_detail);
  }
  if (payment_proof) {
    updates.push("payment_proof = ?");
    params.push(payment_proof);
  }
  if (class_type !== undefined) {
    updates.push("class_type = ?");
    params.push(class_type);
  }
  if (facility_notes !== undefined) {
    updates.push("facility_notes = ?");
    params.push(facility_notes);
  }

  if (updates.length === 0) {
     res.status(400).json({ "error": "No fields to update" });
     return;
  }

  sql += updates.join(", ") + " WHERE id = ?";
  params.push(req.params.id);

  db.run(sql, params, function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "updated" });
  });
});

// 5. Get All Registrations (Admin)
app.get('/api/registrations', (req, res) => {
  const sql = "SELECT * FROM registrations ORDER BY created_at DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({
      "message": "success",
      "data": rows
    });
  });
});

// 6. Contact Form Message
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  const sql = 'INSERT INTO messages (name, email, phone, subject, message, is_read) VALUES (?,?,?,?,?, 0)';
  const params = [name, email, phone, subject, message];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({
      "message": "success",
      "id": this.lastID
    });
  });
});

// Update Message (Read Status or Content)
app.put('/api/messages/:id', (req, res) => {
  const { is_read, subject, message, name, email, phone } = req.body;
  
  // Dynamic update query construction
  let sql = "UPDATE messages SET ";
  const params = [];
  const updates = [];

  if (is_read !== undefined) {
    updates.push("is_read = ?");
    params.push(is_read ? 1 : 0);
  }
  if (subject) {
    updates.push("subject = ?");
    params.push(subject);
  }
  if (message) {
    updates.push("message = ?");
    params.push(message);
  }
  
  if (updates.length === 0) {
     res.status(400).json({ "error": "No fields to update" });
     return;
  }

  sql += updates.join(", ") + " WHERE id = ?";
  params.push(req.params.id);

  db.run(sql, params, function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "updated" });
  });
});

// 7. Get All Messages (Admin)
app.get('/api/messages', (req, res) => {
  const sql = "SELECT * FROM messages ORDER BY created_at DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    const formattedRows = rows.map(row => ({
      ...row,
      is_read: row.is_read === 1
    }));
    res.json({
      "message": "success",
      "data": formattedRows
    });
  });
});

// 8. USERS APIs
app.get('/api/users', (req, res) => {
  const sql = "SELECT * FROM users";
  db.all(sql, [], (err, rows) => {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "success", "data": rows });
  });
});

app.post('/api/users', (req, res) => {
  const { name, username, role, status } = req.body;
  const sql = "INSERT INTO users (name, username, role, status) VALUES (?,?,?,?)";
  db.run(sql, [name, username, role, status], function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "success", "data": { id: this.lastID, ...req.body } });
  });
});

app.put('/api/users/:id', (req, res) => {
  const { name, username, role, status } = req.body;
  const sql = "UPDATE users SET name = ?, username = ?, role = ?, status = ? WHERE id = ?";
  db.run(sql, [name, username, role, status, req.params.id], function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "updated" });
  });
});

app.delete('/api/users/:id', (req, res) => {
  db.run("DELETE FROM users WHERE id = ?", req.params.id, function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "deleted", changes: this.changes });
  });
});

// 9. BPJS APIs
app.get('/api/bpjs', (req, res) => {
  const sql = "SELECT * FROM bpjs_data";
  db.all(sql, [], (err, rows) => {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "success", "data": rows });
  });
});

app.post('/api/bpjs', (req, res) => {
  const { card_number, name, class_type, status, faskes } = req.body;
  const sql = "INSERT INTO bpjs_data (card_number, name, class_type, status, faskes) VALUES (?,?,?,?,?)";
  db.run(sql, [card_number, name, class_type, status, faskes], function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "success", "data": { id: this.lastID, ...req.body } });
  });
});

app.put('/api/bpjs/:id', (req, res) => {
  const { card_number, name, class_type, status, faskes } = req.body;
  const sql = "UPDATE bpjs_data SET card_number = ?, name = ?, class_type = ?, status = ?, faskes = ? WHERE id = ?";
  db.run(sql, [card_number, name, class_type, status, faskes, req.params.id], function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "updated" });
  });
});

app.delete('/api/bpjs/:id', (req, res) => {
  db.run("DELETE FROM bpjs_data WHERE id = ?", req.params.id, function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "deleted", changes: this.changes });
  });
});

// 10. Facilities / Tariffs APIs
app.get('/api/facilities', (req, res) => {
  const sql = "SELECT * FROM facilities";
  db.all(sql, [], (err, rows) => {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "success", "data": rows });
  });
});

app.post('/api/facilities', (req, res) => {
  const { name, category, price } = req.body;
  const sql = "INSERT INTO facilities (name, category, price) VALUES (?,?,?)";
  db.run(sql, [name, category, price], function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "success", "data": { id: this.lastID, ...req.body } });
  });
});

app.put('/api/facilities/:id', (req, res) => {
  const { name, category, price } = req.body;
  const sql = "UPDATE facilities SET name = ?, category = ?, price = ? WHERE id = ?";
  db.run(sql, [name, category, price, req.params.id], function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "updated" });
  });
});

app.delete('/api/facilities/:id', (req, res) => {
  db.run("DELETE FROM facilities WHERE id = ?", req.params.id, function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "deleted", changes: this.changes });
  });
});

// 11. Rooms APIs
app.get('/api/rooms', (req, res) => {
  const sql = "SELECT * FROM rooms";
  db.all(sql, [], (err, rows) => {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "success", "data": rows });
  });
});

app.post('/api/rooms', (req, res) => {
  const { name, class_type, total_beds, occupied_beds, price } = req.body;
  const sql = "INSERT INTO rooms (name, class_type, total_beds, occupied_beds, price) VALUES (?,?,?,?,?)";
  db.run(sql, [name, class_type, total_beds, occupied_beds, price], function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "success", "data": { id: this.lastID, ...req.body } });
  });
});

app.put('/api/rooms/:id', (req, res) => {
  const { name, class_type, total_beds, occupied_beds, price } = req.body;
  const sql = "UPDATE rooms SET name = ?, class_type = ?, total_beds = ?, occupied_beds = ?, price = ? WHERE id = ?";
  db.run(sql, [name, class_type, total_beds, occupied_beds, price, req.params.id], function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "updated" });
  });
});

app.delete('/api/rooms/:id', (req, res) => {
  db.run("DELETE FROM rooms WHERE id = ?", req.params.id, function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "deleted", changes: this.changes });
  });
});

// 12. Bank Accounts APIs
app.get('/api/banks', (req, res) => {
  const sql = "SELECT * FROM bank_accounts";
  db.all(sql, [], (err, rows) => {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    const formattedRows = rows.map(row => ({
        ...row,
        is_active: row.is_active === 1
      }));
    res.json({ "message": "success", "data": formattedRows });
  });
});

app.post('/api/banks', (req, res) => {
  const { bank_name, account_number, account_name, type, is_active } = req.body;
  const sql = "INSERT INTO bank_accounts (bank_name, account_number, account_name, type, is_active) VALUES (?,?,?,?,?)";
  db.run(sql, [bank_name, account_number, account_name, type, is_active ? 1 : 0], function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "success", "data": { id: this.lastID, ...req.body } });
  });
});

app.put('/api/banks/:id', (req, res) => {
  const { bank_name, account_number, account_name, type, is_active } = req.body;
  const sql = "UPDATE bank_accounts SET bank_name = ?, account_number = ?, account_name = ?, type = ?, is_active = ? WHERE id = ?";
  db.run(sql, [bank_name, account_number, account_name, type, is_active ? 1 : 0, req.params.id], function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "updated" });
  });
});

app.delete('/api/banks/:id', (req, res) => {
  db.run("DELETE FROM bank_accounts WHERE id = ?", req.params.id, function (err) {
    if (err) { res.status(400).json({ "error": err.message }); return; }
    res.json({ "message": "deleted", changes: this.changes });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});