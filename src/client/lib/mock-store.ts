import type {
  Appointment,
  AppointmentToMake,
  InsurancePlan,
  Invoice,
  LabCase,
  Operatory,
  Patient,
  Practitioner,
  TreatmentType,
  WaitingListEntry,
} from "../types";

const STORAGE_KEY = "open_dentist_khorezm_mock_v1";

const todayIso = new Date().toISOString().slice(0, 10);

const DEFAULT_OPERATORIES: Operatory[] = [
  { id: 1, name: "1-Kabinet (Terapevtik)", color: "sky", sort_order: 0, created_at: new Date().toISOString() },
  { id: 2, name: "2-Kabinet (Ortopedik)", color: "emerald", sort_order: 1, created_at: new Date().toISOString() },
  { id: 3, name: "3-Kabinet (Jarrohlik)", color: "amber", sort_order: 2, created_at: new Date().toISOString() },
];

const DEFAULT_PRACTITIONERS: Practitioner[] = [
  { id: 1, name: "Dr. Anvar Rahimov", role: "dentist", color: "teal", phone: "+998 (91) 234-56-78", email: "anvar@stomat.uz", created_at: new Date().toISOString() },
  { id: 2, name: "Dr. Dilnoza Baxtiyorova", role: "dentist", color: "violet", phone: "+998 (90) 876-54-32", email: "dilnoza@stomat.uz", created_at: new Date().toISOString() },
  { id: 3, name: "Dr. Umid Alimov", role: "dentist", color: "rose", phone: "+998 (93) 111-22-33", email: "umid@stomat.uz", created_at: new Date().toISOString() },
];

const DEFAULT_TREATMENT_TYPES: TreatmentType[] = [
  { id: 1, code: "CONS", name: "Konsultatsiya va Obyektiv Ko'rik", duration_minutes: 20, default_fee: 50000, color: "emerald", created_at: new Date().toISOString() },
  { id: 2, code: "FILL", name: "Tishni Plombalash (Restavratsiya)", duration_minutes: 45, default_fee: 250000, color: "amber", created_at: new Date().toISOString() },
  { id: 3, code: "ENDO", name: "Kanal tozalash va davolash (Endodontiya)", duration_minutes: 60, default_fee: 400000, color: "rose", created_at: new Date().toISOString() },
  { id: 4, code: "CROWN", name: "Metallokeramika / Zirkon Koronka", duration_minutes: 90, default_fee: 800000, color: "violet", created_at: new Date().toISOString() },
  { id: 5, code: "EXT", name: "Tishni olib tashlash (Xirurgik extraction)", duration_minutes: 30, default_fee: 150000, color: "orange", created_at: new Date().toISOString() },
  { id: 6, code: "CLEAN", name: "Professional Ultra-tovush Gigiyena va Skeyling", duration_minutes: 30, default_fee: 300000, color: "sky", created_at: new Date().toISOString() },
  { id: 7, code: "IMPLANT", name: "Dental Implantat O'rnatish", duration_minutes: 90, default_fee: 3500000, color: "teal", created_at: new Date().toISOString() },
];

const DEFAULT_PATIENTS: Patient[] = [
  {
    id: 1,
    first_name: "Otabek",
    last_name: "Ergashev",
    date_of_birth: "1992-05-14",
    phone: "+998 (91) 234-56-78",
    email: "otabek.e@mail.uz",
    address: "Urganch sh., Al-Xorazmiy ko'chasi 24-uy",
    medical_alerts: "allergy:penicillin",
    notes: "14 va 15 tishlarida karies bor",
    referral_source: "Tavsiya (Tanish/Qarindosh)",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    first_name: "Malika",
    last_name: "Qurbonova",
    date_of_birth: "1998-11-20",
    phone: "+998 (90) 876-54-32",
    email: "malika.q@mail.uz",
    address: "Xiva sh., Najmiddin Kubro ko'chasi 12-uy",
    medical_alerts: "surunkali diabet",
    notes: "Zirkon koronka qo'yish rejalashtirilmoqda",
    referral_source: "Instagram / Telegram",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    first_name: "Jamshid",
    last_name: "Saidov",
    date_of_birth: "1985-03-08",
    phone: "+998 (93) 111-22-33",
    email: "jamshid.s@mail.uz",
    address: "Xonqa t., Markaziy ko'chasi 5-uy",
    medical_alerts: "",
    notes: "Kanal davolangan, plomba qo'yilishi kerak",
    referral_source: "Piyoda kirib keldi (Walk-in)",
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: 1,
    patient_id: 1,
    practitioner_id: 1,
    operatory_id: 1,
    treatment_type_id: 2,
    start_time: `${todayIso}T09:00:00`,
    end_time: `${todayIso}T09:45:00`,
    status: "scheduled",
    kind: "patient",
    title: null,
    notes: "14-tish plomba",
    created_at: new Date().toISOString(),
    patient_first_name: "Otabek",
    patient_last_name: "Ergashev",
    practitioner_name: "Dr. Anvar Rahimov",
    practitioner_color: "teal",
    operatory_name: "1-Kabinet (Terapevtik)",
    treatment_name: "Tishni Plombalash (Restavratsiya)",
    treatment_code: "FILL",
    treatment_color: "amber",
  },
  {
    id: 2,
    patient_id: 2,
    practitioner_id: 2,
    operatory_id: 2,
    treatment_type_id: 4,
    start_time: `${todayIso}T11:00:00`,
    end_time: `${todayIso}T12:30:00`,
    status: "arrived",
    kind: "patient",
    title: null,
    notes: "Zirkon koronka o'lcham olish",
    created_at: new Date().toISOString(),
    patient_first_name: "Malika",
    patient_last_name: "Qurbonova",
    practitioner_name: "Dr. Dilnoza Baxtiyorova",
    practitioner_color: "violet",
    operatory_name: "2-Kabinet (Ortopedik)",
    treatment_name: "Metallokeramika / Zirkon Koronka",
    treatment_code: "CROWN",
    treatment_color: "violet",
  },
];

interface MockDatabase {
  settings: Record<string, string>;
  operatories: Operatory[];
  practitioners: Practitioner[];
  treatmentTypes: TreatmentType[];
  patients: Patient[];
  appointments: Appointment[];
  waitingList: WaitingListEntry[];
  appointmentsToMake: AppointmentToMake[];
  treatmentPlans: Array<{
    id: number;
    patient_id: number;
    treatment_type_id: number | null;
    tooth: string | null;
    surface: string | null;
    fee: number;
    status: "planned" | "accepted" | "completed" | "declined";
    notes: string | null;
    sort_order: number;
    created_at: string;
    treatment_code?: string;
    treatment_name?: string;
  }>;
  clinicalNotes: Array<{
    id: number;
    patient_id: number;
    practitioner_id: number | null;
    note_date: string;
    body: string;
    created_at: string;
    practitioner_name?: string;
  }>;
  toothConditions: Array<{
    id: number;
    patient_id: number;
    tooth: string;
    surface: string | null;
    condition: "caries" | "restoration" | "crown" | "missing" | "implant" | "endo";
    recorded_at: string;
  }>;
  invoices: Invoice[];
  invoiceItems: Array<{
    id: number;
    invoice_id: number;
    treatment_type_id: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    sort_order: number;
  }>;
  insurancePlans: InsurancePlan[];
  labCases: LabCase[];
}

function initMockDb(): MockDatabase {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      /* ignore */
    }
  }

  const db: MockDatabase = {
    settings: {
      day_start_minute: "480",
      day_end_minute: "1140",
      slot_minutes: "15",
    },
    operatories: DEFAULT_OPERATORIES,
    practitioners: DEFAULT_PRACTITIONERS,
    treatmentTypes: DEFAULT_TREATMENT_TYPES,
    patients: DEFAULT_PATIENTS,
    appointments: DEFAULT_APPOINTMENTS,
    waitingList: [],
    appointmentsToMake: [],
    treatmentPlans: [
      { id: 1, patient_id: 1, treatment_type_id: 2, tooth: "14", surface: "O", fee: 250000, status: "accepted", notes: "Plomba quyish", sort_order: 0, created_at: new Date().toISOString(), treatment_code: "FILL", treatment_name: "Tishni Plombalash" },
      { id: 2, patient_id: 1, treatment_type_id: 3, tooth: "16", surface: null, fee: 400000, status: "planned", notes: "Kanal davolash", sort_order: 1, created_at: new Date().toISOString(), treatment_code: "ENDO", treatment_name: "Kanal tozalash" },
    ],
    clinicalNotes: [
      { id: 1, patient_id: 1, practitioner_id: 1, note_date: new Date().toISOString(), body: "DS: 14-tish o'rta kariesi. Anesteziya qilingan holda karies bo'shlig'i tozalandi va kompozit plomba (A2) qo'yildi.", created_at: new Date().toISOString(), practitioner_name: "Dr. Anvar Rahimov" },
    ],
    toothConditions: [
      { id: 1, patient_id: 1, tooth: "14", surface: "O", condition: "caries", recorded_at: new Date().toISOString() },
      { id: 2, patient_id: 1, tooth: "15", surface: "M", condition: "restoration", recorded_at: new Date().toISOString() },
      { id: 3, patient_id: 2, tooth: "21", surface: null, condition: "crown", recorded_at: new Date().toISOString() },
    ],
    invoices: [
      { id: 1, patient_id: 1, appointment_id: 1, issued_at: new Date().toISOString(), status: "open", total: 250000, amount_paid: 100000, notes: "Bo'nak to'landi" },
    ],
    invoiceItems: [
      { id: 1, invoice_id: 1, treatment_type_id: 2, description: "Tishni Plombalash (Restavratsiya)", quantity: 1, unit_price: 250000, sort_order: 0 },
    ],
    insurancePlans: [],
    labCases: [
      { id: 1, patient_id: 2, practitioner_id: 2, treatment_type_id: 4, lab_name: "Dental Art Lab (Urganch)", case_type: "Zirkon Koronka", tooth: "21", shade: "A2", fee: 800000, sent_at: todayIso, due_at: todayIso, received_at: null, seated_at: null, status: "in_lab", notes: "VITA A2 rangda zirkon", created_at: new Date().toISOString(), first_name: "Malika", last_name: "Qurbonova", practitioner_name: "Dr. Dilnoza Baxtiyorova" },
    ],
  };

  saveMockDb(db);
  return db;
}

function saveMockDb(db: MockDatabase) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}

/** Execute mock handler matching path and method */
export async function handleMockApi<T>(method: string, path: string, body?: unknown): Promise<T> {
  const db = initMockDb();
  const url = new URL(path, "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/api/operatories" && method === "GET") {
    return { operatories: db.operatories } as T;
  }
  if (pathname === "/api/operatories" && method === "POST") {
    const b = body as Partial<Operatory>;
    const created: Operatory = {
      id: Date.now(),
      name: b.name || "Yangi Kabinet",
      color: b.color || "sky",
      sort_order: db.operatories.length,
      created_at: new Date().toISOString(),
    };
    db.operatories.push(created);
    saveMockDb(db);
    return { operatory: created } as T;
  }
  if (pathname.startsWith("/api/operatories/") && method === "DELETE") {
    const id = parseInt(pathname.split("/").pop()!, 10);
    db.operatories = db.operatories.filter((o) => o.id !== id);
    saveMockDb(db);
    return { ok: true } as T;
  }

  if (pathname === "/api/practitioners" && method === "GET") {
    return { practitioners: db.practitioners } as T;
  }
  if (pathname === "/api/practitioners" && method === "POST") {
    const b = body as Partial<Practitioner>;
    const created: Practitioner = {
      id: Date.now(),
      name: b.name || "Dr. Yangi Shifokor",
      role: b.role || "dentist",
      color: b.color || "teal",
      phone: b.phone || null,
      email: b.email || null,
      created_at: new Date().toISOString(),
    };
    db.practitioners.push(created);
    saveMockDb(db);
    return { practitioner: created } as T;
  }

  if (pathname === "/api/treatment-types" && method === "GET") {
    return { treatment_types: db.treatmentTypes } as T;
  }
  if (pathname === "/api/treatment-types" && method === "POST") {
    const b = body as Partial<TreatmentType>;
    const created: TreatmentType = {
      id: Date.now(),
      code: b.code || "MISC",
      name: b.name || "Yangi Xizmat",
      duration_minutes: b.duration_minutes || 30,
      default_fee: b.default_fee || 0,
      color: b.color || "sky",
      created_at: new Date().toISOString(),
    };
    db.treatmentTypes.push(created);
    saveMockDb(db);
    return { treatment_type: created } as T;
  }

  if (pathname === "/api/settings" && method === "GET") {
    return { settings: db.settings } as T;
  }
  if (pathname === "/api/settings" && method === "PUT") {
    const b = body as Record<string, string>;
    Object.assign(db.settings, b);
    saveMockDb(db);
    return { settings: db.settings } as T;
  }

  if (pathname === "/api/appointments" && method === "GET") {
    const date = url.searchParams.get("date");
    let apps = db.appointments;
    if (date) {
      apps = apps.filter((a) => a.start_time.startsWith(date));
    }
    return { appointments: apps } as T;
  }
  if (pathname === "/api/appointments" && method === "POST") {
    const b = body as Partial<Appointment>;
    const p = db.patients.find((pt) => pt.id === b.patient_id);
    const pr = db.practitioners.find((pr) => pr.id === b.practitioner_id);
    const op = db.operatories.find((o) => o.id === b.operatory_id);
    const tr = db.treatmentTypes.find((t) => t.id === b.treatment_type_id);

    const created: Appointment = {
      id: Date.now(),
      patient_id: b.patient_id ?? null,
      practitioner_id: b.practitioner_id ?? null,
      operatory_id: b.operatory_id ?? 1,
      treatment_type_id: b.treatment_type_id ?? null,
      start_time: b.start_time || `${todayIso}T09:00:00`,
      end_time: b.end_time || `${todayIso}T09:30:00`,
      status: b.status || "scheduled",
      kind: b.kind || "patient",
      title: b.title || null,
      notes: b.notes || null,
      created_at: new Date().toISOString(),
      patient_first_name: p?.first_name,
      patient_last_name: p?.last_name,
      practitioner_name: pr?.name,
      practitioner_color: pr?.color,
      operatory_name: op?.name,
      treatment_name: tr?.name,
      treatment_code: tr?.code,
      treatment_color: tr?.color,
    };
    db.appointments.push(created);
    saveMockDb(db);
    return { appointment: created } as T;
  }

  if (pathname.startsWith("/api/appointments/") && method === "PUT") {
    const id = parseInt(pathname.split("/").pop()!, 10);
    const idx = db.appointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      Object.assign(db.appointments[idx], body);
      saveMockDb(db);
      return { appointment: db.appointments[idx] } as T;
    }
  }
  if (pathname.startsWith("/api/appointments/") && method === "DELETE") {
    const id = parseInt(pathname.split("/").pop()!, 10);
    db.appointments = db.appointments.filter((a) => a.id !== id);
    saveMockDb(db);
    return { ok: true } as T;
  }

  if (pathname === "/api/waiting-list" && method === "GET") {
    return { waiting: db.waitingList } as T;
  }
  if (pathname === "/api/appointments-to-make" && method === "GET") {
    return { to_make: db.appointmentsToMake } as T;
  }

  if (pathname === "/api/patients" && method === "GET") {
    const q = url.searchParams.get("q")?.toLowerCase();
    let pts = db.patients;
    if (q) {
      pts = pts.filter(
        (p) =>
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q) ||
          (p.phone && p.phone.includes(q))
      );
    }
    return { patients: pts } as T;
  }
  if (pathname === "/api/patients" && method === "POST") {
    const b = body as Partial<Patient>;
    const created: Patient = {
      id: Date.now(),
      first_name: b.first_name || "Bemor",
      last_name: b.last_name || "Noma'lum",
      date_of_birth: b.date_of_birth || null,
      phone: b.phone || null,
      email: b.email || null,
      address: b.address || null,
      medical_alerts: b.medical_alerts || null,
      notes: b.notes || null,
      referral_source: b.referral_source || null,
      created_at: new Date().toISOString(),
    };
    db.patients.push(created);
    saveMockDb(db);
    return { patient: created } as T;
  }

  if (pathname.endsWith("/full") && pathname.startsWith("/api/patients/")) {
    const id = parseInt(pathname.split("/")[3], 10);
    const p = db.patients.find((pt) => pt.id === id) || db.patients[0];
    return {
      patient: p,
      appointments: db.appointments.filter((a) => a.patient_id === id),
      treatment_plans: db.treatmentPlans.filter((tp) => tp.patient_id === id),
      clinical_notes: db.clinicalNotes.filter((cn) => cn.patient_id === id),
      tooth_conditions: db.toothConditions.filter((tc) => tc.patient_id === id),
      invoices: db.invoices.filter((inv) => inv.patient_id === id),
      insurance_plans: db.insurancePlans.filter((ip) => ip.patient_id === id),
      lab_cases: db.labCases.filter((lc) => lc.patient_id === id),
    } as T;
  }

  if (pathname === "/api/lab-cases" && method === "GET") {
    return { lab_cases: db.labCases } as T;
  }

  if (pathname === "/api/reports/summary" && method === "GET") {
    return {
      today_appointments: db.appointments.length,
      week_appointments: db.appointments.length * 4,
      month_appointments: db.appointments.length * 15,
      month_completed: db.appointments.length * 10,
      month_no_shows: 1,
      month_cancelled: 0,
      month_production: 1850000,
      month_collections: 1450000,
      by_treatment: [
        { name: "Metallokeramika / Zirkon Koronka", n: 4, total: 800000 },
        { name: "Tishni Plombalash (Restavratsiya)", n: 6, total: 400000 },
        { name: "Konsultatsiya", n: 5, total: 250000 },
      ],
      by_source: [
        { source: "Tavsiya", n: 8 },
        { source: "Instagram / Telegram", n: 5 },
      ],
      aged_receivables: {
        "0-30": 150000,
        "31-60": 0,
        "61-90": 0,
        "90+": 0,
      },
      overdue_lab_cases: 0,
      waiting_list_count: db.waitingList.length,
    } as T;
  }

  // Fallback default response for any unhandled routes
  return { ok: true } as T;
}
