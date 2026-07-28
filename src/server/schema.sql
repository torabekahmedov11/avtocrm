-- ── Reset existing tables to ensure clean Uzbekistan seed data ──
DROP TABLE IF EXISTS appointments_to_make;
DROP TABLE IF EXISTS lab_cases;
DROP TABLE IF EXISTS insurance_plans;
DROP TABLE IF EXISTS waiting_list;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS tooth_conditions;
DROP TABLE IF EXISTS clinical_notes;
DROP TABLE IF EXISTS treatment_plan_items;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS treatment_types;
DROP TABLE IF EXISTS practitioners;
DROP TABLE IF EXISTS operatories;
DROP TABLE IF EXISTS settings;

-- ── Practice settings (key/value) ───────────────────────────────
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Defaults: day starts 08:00 (480 min), ends 19:00 (1140 min).
INSERT INTO settings (key, value) VALUES ('day_start_minute', '480');
INSERT INTO settings (key, value) VALUES ('day_end_minute', '1140');
INSERT INTO settings (key, value) VALUES ('slot_minutes', '15');

-- ── Operatories (treatment rooms / chairs) ──────────────────────
CREATE TABLE operatories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'sky',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Practitioners (dentists, hygienists, assistants) ────────────
CREATE TABLE practitioners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'dentist', -- 'dentist' | 'hygienist' | 'assistant'
  color TEXT NOT NULL DEFAULT 'teal',
  email TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Treatment types (procedures) ────────────────────────────────
CREATE TABLE treatment_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,                   -- e.g. 'FILL', 'CROWN'
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  default_fee REAL NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'sky',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Patients ────────────────────────────────────────────────────
CREATE TABLE patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth TEXT,                   -- ISO date 'YYYY-MM-DD'
  email TEXT,
  phone TEXT,
  address TEXT,
  medical_alerts TEXT,                  -- comma-separated tags: 'allergy:penicillin,diabet'
  notes TEXT,
  referral_source TEXT,                 -- e.g. 'Tavsiya', 'Instagram', 'Telegram', 'Walk-in'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_patients_name ON patients(last_name, first_name);

-- ── Appointments ────────────────────────────────────────────────
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  practitioner_id INTEGER REFERENCES practitioners(id) ON DELETE SET NULL,
  operatory_id INTEGER NOT NULL REFERENCES operatories(id) ON DELETE CASCADE,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  start_time TEXT NOT NULL,             -- ISO datetime 'YYYY-MM-DDTHH:MM:SS'
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'arrived' | 'in_chair' | 'completed' | 'no_show' | 'cancelled'
  kind TEXT NOT NULL DEFAULT 'patient',     -- 'patient' | 'break' | 'lunch' | 'block'
  title TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_appointments_start ON appointments(start_time);
CREATE INDEX idx_appointments_op_start ON appointments(operatory_id, start_time);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);

-- ── Treatment plans ─────────────────────────────────────────────
CREATE TABLE treatment_plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  tooth TEXT,                           -- e.g. '14' (FDI)
  surface TEXT,                         -- 'M' | 'O' | 'D' | 'B' | 'L'
  fee REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned', -- 'planned' | 'accepted' | 'completed' | 'declined'
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_plan_patient ON treatment_plan_items(patient_id);

-- ── Clinical notes ──────────────────────────────────────────────
CREATE TABLE clinical_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id INTEGER REFERENCES practitioners(id) ON DELETE SET NULL,
  note_date TEXT NOT NULL DEFAULT (datetime('now')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_notes_patient ON clinical_notes(patient_id, note_date DESC);

-- ── Tooth chart conditions ──────────────────────────────────────
CREATE TABLE tooth_conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth TEXT NOT NULL,                  -- '11'..'48' (FDI)
  surface TEXT,
  condition TEXT NOT NULL,              -- 'caries' | 'restoration' | 'crown' | 'missing' | 'implant' | 'endo'
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tooth_patient ON tooth_conditions(patient_id);

-- ── Invoices ────────────────────────────────────────────────────
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  issued_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'open',  -- 'open' | 'paid' | 'void'
  total REAL NOT NULL DEFAULT 0,
  amount_paid REAL NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE INDEX idx_invoices_patient ON invoices(patient_id);

CREATE TABLE invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ── Waiting list ────────────────────────────────────────────────
CREATE TABLE waiting_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  preferred_practitioner_id INTEGER REFERENCES practitioners(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Insurance plans ────────────────────────────────────────────
CREATE TABLE insurance_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  rank TEXT NOT NULL DEFAULT 'primary',
  carrier TEXT NOT NULL,
  member_id TEXT,
  group_id TEXT,
  subscriber_name TEXT,
  subscriber_dob TEXT,
  effective_date TEXT,
  term_date TEXT,
  copay REAL NOT NULL DEFAULT 0,
  deductible_total REAL NOT NULL DEFAULT 0,
  deductible_used REAL NOT NULL DEFAULT 0,
  max_annual REAL NOT NULL DEFAULT 0,
  max_used REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_insurance_patient ON insurance_plans(patient_id);

-- ── Lab cases ──────────────────────────────────────────────────
CREATE TABLE lab_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id INTEGER REFERENCES practitioners(id) ON DELETE SET NULL,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  lab_name TEXT NOT NULL,
  case_type TEXT NOT NULL,
  tooth TEXT,
  shade TEXT,
  fee REAL NOT NULL DEFAULT 0,
  sent_at TEXT,
  due_at TEXT,
  received_at TEXT,
  seated_at TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_lab_patient ON lab_cases(patient_id);
CREATE INDEX idx_lab_status ON lab_cases(status);

-- ── Appointments to make ────────────────────────────────────────
CREATE TABLE appointments_to_make (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  due_after TEXT,
  source TEXT NOT NULL DEFAULT 'reception',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Uzbekistan Khorezm Seed Data ───────────────────────────────
INSERT INTO operatories (name, color, sort_order) VALUES ('1-Kabinet (Terapevtik)', 'sky', 0);
INSERT INTO operatories (name, color, sort_order) VALUES ('2-Kabinet (Ortopedik)', 'emerald', 1);
INSERT INTO operatories (name, color, sort_order) VALUES ('3-Kabinet (Jarrohlik)', 'amber', 2);

INSERT INTO practitioners (name, role, color, phone) VALUES ('Dr. Anvar Rahimov', 'dentist', 'teal', '+998 (91) 234-56-78');
INSERT INTO practitioners (name, role, color, phone) VALUES ('Dr. Dilnoza Baxtiyorova', 'dentist', 'violet', '+998 (90) 876-54-32');
INSERT INTO practitioners (name, role, color, phone) VALUES ('Dr. Umid Alimov', 'dentist', 'rose', '+998 (93) 111-22-33');

INSERT INTO treatment_types (code, name, duration_minutes, default_fee, color) VALUES ('CONS', 'Konsultatsiya va Obyektiv Ko''rik', 20, 50000, 'emerald');
INSERT INTO treatment_types (code, name, duration_minutes, default_fee, color) VALUES ('FILL', 'Tishni Plombalash (Restavratsiya)', 45, 250000, 'amber');
INSERT INTO treatment_types (code, name, duration_minutes, default_fee, color) VALUES ('ENDO', 'Kanal tozalash va davolash (Endodontiya)', 60, 400000, 'rose');
INSERT INTO treatment_types (code, name, duration_minutes, default_fee, color) VALUES ('CROWN', 'Metallokeramika / Zirkon Koronka', 90, 800000, 'violet');
INSERT INTO treatment_types (code, name, duration_minutes, default_fee, color) VALUES ('EXT', 'Tishni olib tashlash (Xirurgik extraction)', 30, 150000, 'orange');
INSERT INTO treatment_types (code, name, duration_minutes, default_fee, color) VALUES ('CLEAN', 'Professional Ultra-tovush Gigiyena va Skeyling', 30, 300000, 'sky');
INSERT INTO treatment_types (code, name, duration_minutes, default_fee, color) VALUES ('IMPLANT', 'Dental Implantat O''rnatish', 90, 3500000, 'teal');

-- Seed Patients in Khorezm
INSERT INTO patients (first_name, last_name, date_of_birth, phone, email, address, medical_alerts, notes, referral_source)
VALUES ('Otabek', 'Ergashev', '1992-05-14', '+998 (91) 234-56-78', 'otabek.e@mail.uz', 'Urganch sh., Al-Xorazmiy ko''chasi 24-uy', 'allergy:penicillin', '14 va 15 tishlarida karies bor', 'Tavsiya (Tanish/Qarindosh)');

INSERT INTO patients (first_name, last_name, date_of_birth, phone, email, address, medical_alerts, notes, referral_source)
VALUES ('Malika', 'Qurbonova', '1998-11-20', '+998 (90) 876-54-32', 'malika.q@mail.uz', 'Xiva sh., Najmiddin Kubro ko''chasi 12-uy', 'surunkali diabet', 'Zirkon koronka qo''yish rejalashtirilmoqda', 'Instagram / Telegram');

INSERT INTO patients (first_name, last_name, date_of_birth, phone, email, address, medical_alerts, notes, referral_source)
VALUES ('Jamshid', 'Saidov', '1985-03-08', '+998 (93) 111-22-33', 'jamshid.s@mail.uz', 'Xonqa t., Markaziy ko''chasi 5-uy', '', 'Kanal davolangan, plomba qo''yilishi kerak', 'Piyoda kirib keldi (Walk-in)');

-- Seed Appointments for today
INSERT INTO appointments (patient_id, practitioner_id, operatory_id, treatment_type_id, start_time, end_time, status, kind, notes)
VALUES (1, 1, 1, 2, datetime('now', 'start of day', '+9 hours'), datetime('now', 'start of day', '+9 hours', '+45 minutes'), 'scheduled', 'patient', '14-tish plomba');

INSERT INTO appointments (patient_id, practitioner_id, operatory_id, treatment_type_id, start_time, end_time, status, kind, notes)
VALUES (2, 2, 2, 4, datetime('now', 'start of day', '+11 hours'), datetime('now', 'start of day', '+12 hours', '+30 minutes'), 'arrived', 'patient', 'Zirkon koronka o''lcham olish');

-- Seed Tooth Conditions
INSERT INTO tooth_conditions (patient_id, tooth, surface, condition) VALUES (1, '14', 'O', 'caries');
INSERT INTO tooth_conditions (patient_id, tooth, surface, condition) VALUES (1, '15', 'M', 'restoration');
INSERT INTO tooth_conditions (patient_id, tooth, surface, condition) VALUES (2, '21', null, 'crown');

-- Seed Treatment Plan
INSERT INTO treatment_plan_items (patient_id, treatment_type_id, tooth, surface, fee, status, notes)
VALUES (1, 2, '14', 'O', 250000, 'accepted', 'Plomba qo''yish');
INSERT INTO treatment_plan_items (patient_id, treatment_type_id, tooth, surface, fee, status, notes)
VALUES (1, 3, '16', null, 400000, 'planned', 'Kanal davolash');

-- Seed Clinical Note
INSERT INTO clinical_notes (patient_id, practitioner_id, body)
VALUES (1, 1, 'DS: 14-tish o''rta kariesi. Anesteziya (Artikain 1:100000) qilindi. Karies bo''shlig mexanizatsiya qilindi va kompozit plomba (A2) bilan tiklandi.');

-- Seed Lab Case
INSERT INTO lab_cases (patient_id, practitioner_id, treatment_type_id, lab_name, case_type, tooth, shade, fee, sent_at, due_at, status, notes)
VALUES (2, 2, 4, 'Dental Art Lab (Urganch)', 'Zirkon Koronka', '21', 'A2', 800000, datetime('now', '-2 days'), datetime('now', '+3 days'), 'in_lab', 'VITA A2 rangda zirkon koronka');

-- Seed Invoice
INSERT INTO invoices (patient_id, status, total, amount_paid, notes)
VALUES (1, 'open', 250000, 100000, 'Bo''nak to''landi');
INSERT INTO invoice_items (invoice_id, treatment_type_id, description, quantity, unit_price)
VALUES (1, 2, 'Tishni Plombalash (Restavratsiya)', 1, 250000);
