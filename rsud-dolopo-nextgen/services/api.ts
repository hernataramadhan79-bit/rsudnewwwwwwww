import { Doctor } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Types
export interface Facility {
    id: number;
    name: string;
    category: string;
    price: number;
}

export interface Room {
    id: number;
    name: string;
    class_type: string;
    total_beds: number;
    occupied_beds: number;
    price: number;
}

export interface BankAccount {
    id: number;
    bank_name: string;
    account_number: string;
    account_name: string;
    type: 'Transfer' | 'VA';
    is_active: boolean;
}

// --- INITIAL MOCK DATA (Fallback) ---
const INITIAL_DOCTORS: Doctor[] = [
  { id: 1, name: 'dr. Andi Wijaya, Sp.PD', specialty: 'Penyakit Dalam', image: 'https://picsum.photos/seed/doc1/200/200', schedule: 'Senin - Kamis, 08.00 - 12.00', available: true },
  { id: 2, name: 'dr. Sarah Utami, Sp.A', specialty: 'Anak', image: 'https://picsum.photos/seed/doc2/200/200', schedule: 'Senin - Jumat, 09.00 - 14.00', available: true },
  { id: 3, name: 'dr. Budi Santoso, Sp.JP', specialty: 'Jantung & Pembuluh Darah', image: 'https://picsum.photos/seed/doc3/200/200', schedule: 'Selasa & Kamis, 13.00 - 16.00', available: false },
  { id: 4, name: 'dr. Linda Kusuma, Sp.OG', specialty: 'Kebidanan & Kandungan', image: 'https://picsum.photos/seed/doc4/200/200', schedule: 'Senin, Rabu, Jumat, 08.00 - 11.00', available: true },
  { id: 5, name: 'dr. Hendra Gunawan, Sp.B', specialty: 'Bedah Umum', image: 'https://picsum.photos/seed/doc5/200/200', schedule: 'Jumat - Sabtu, 10.00 - 13.00', available: true },
  { id: 6, name: 'dr. Maya Putri, Sp.M', specialty: 'Mata', image: 'https://picsum.photos/seed/doc6/200/200', schedule: 'Senin & Kamis, 14.00 - 17.00', available: true }
];

const INITIAL_REGISTRATIONS = [
  { id: 1, bookingCode: 'REG-1001', nik: '3502123456780001', name: 'Budi Santoso', email: 'budi@example.com', phone: '081234567890', poli: 'umum', date: '2023-11-20', payment: 'bpjs', payment_detail: 'BPJS Kesehatan', payment_status: 'Paid', cost: 0, created_at: '2023-11-18T10:00:00.000Z', status: 'Pending', payment_proof: null, class_type: 'Kelas 1', facility_notes: 'Lab Darah' },
  { id: 2, bookingCode: 'REG-1002', nik: '3502876543210002', name: 'Siti Aminah', email: 'siti@example.com', phone: '089876543210', poli: 'anak', date: '2023-11-21', payment: 'umum', payment_detail: 'Tunai', payment_status: 'Unpaid', cost: 50000, created_at: '2023-11-19T09:30:00.000Z', status: 'Confirmed', payment_proof: null, class_type: null, facility_notes: '' },
];

const INITIAL_MESSAGES = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '08123123123', subject: 'Info Layanan', message: 'Apakah poli mata buka hari Sabtu?', created_at: '2023-11-15T14:00:00.000Z', is_read: false }
];

const INITIAL_USERS = [
  { id: 1, name: 'Admin Utama', username: 'admin', role: 'Super Admin', status: 'Active' },
  { id: 2, name: 'Budi Staff', username: 'staff01', role: 'Staff Pendaftaran', status: 'Active' }
];

const INITIAL_BPJS = [
  { id: 1, card_number: '0001234567890', name: 'Ahmad Dahlan', class_type: 'Kelas 1', status: 'Aktif', faskes: 'Puskesmas Dolopo' },
  { id: 2, card_number: '0009876543210', name: 'Siti Maimunah', class_type: 'Kelas 3', status: 'Aktif', faskes: 'Klinik Sehat' }
];

const INITIAL_FACILITIES: Facility[] = [
    { id: 1, name: 'Pendaftaran Umum', category: 'Administrasi', price: 15000 },
    { id: 2, name: 'Konsultasi Dokter Spesialis', category: 'Poli Jalan', price: 75000 },
    { id: 3, name: 'Cek Darah Lengkap', category: 'Laboratorium', price: 120000 },
];

const INITIAL_ROOMS: Room[] = [
    { id: 1, name: 'Mawar 01', class_type: 'VIP', total_beds: 1, occupied_beds: 0, price: 750000 },
    { id: 2, name: 'Melati 01', class_type: 'Kelas 1', total_beds: 2, occupied_beds: 1, price: 400000 },
    { id: 3, name: 'Anggrek 01', class_type: 'Kelas 2', total_beds: 4, occupied_beds: 3, price: 250000 },
];

const INITIAL_BANKS: BankAccount[] = [
    { id: 1, bank_name: 'BCA', account_number: '8735089123', account_name: 'RSUD Dolopo', type: 'Transfer', is_active: true },
    { id: 2, bank_name: 'BRI', account_number: '0045010023456', account_name: 'RSUD Dolopo BLUD', type: 'Transfer', is_active: true },
    { id: 3, bank_name: 'Mandiri VA', account_number: '88000', account_name: 'RSUD Dolopo', type: 'VA', is_active: true },
];

// --- HELPER: Mock Local Storage for Fallback ---
const getStorage = (key: string, initial: any) => {
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
};

const setStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Storage full or error", e);
  }
};

// --- API IMPLEMENTATION ---

export const api = {
  // Check NIK
  checkNik: async (nik: string) => {
    if (isSupabaseConfigured()) {
        const { data } = await supabase.from('registrations').select('id').eq('nik', nik);
        return data && data.length > 0;
    } else {
        const regs = getStorage('rsud_registrations', INITIAL_REGISTRATIONS);
        return regs.some((r: any) => r.nik === nik);
    }
  },

  // Fetch Doctors
  getDoctors: async (): Promise<Doctor[]> => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('doctors').select('*');
        if (error) return INITIAL_DOCTORS;
        return data as Doctor[];
    }
    return getStorage('rsud_doctors', INITIAL_DOCTORS);
  },

  // Doctors CRUD
  addDoctor: async (doctorData: any) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('doctors').insert([doctorData]).select().single();
        if (error) throw error;
        return { message: 'success', data };
    }
    const docs = getStorage('rsud_doctors', INITIAL_DOCTORS);
    const newDoc = { ...doctorData, id: Date.now() };
    setStorage('rsud_doctors', [...docs, newDoc]);
    return { message: 'success', data: newDoc };
  },
  updateDoctor: async (id: number, data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('doctors').update(data).eq('id', id);
        return { message: 'success' };
    }
    const docs = getStorage('rsud_doctors', INITIAL_DOCTORS);
    const updated = docs.map((d: any) => d.id === id ? { ...d, ...data } : d);
    setStorage('rsud_doctors', updated);
    return { message: 'success' };
  },
  deleteDoctor: async (id: number) => {
    if (isSupabaseConfigured()) {
        await supabase.from('doctors').delete().eq('id', id);
        return { message: 'success' };
    }
    const docs = getStorage('rsud_doctors', INITIAL_DOCTORS);
    const filtered = docs.filter((d: any) => d.id !== id);
    setStorage('rsud_doctors', filtered);
    return { message: 'success' };
  },

  // Patient Login
  loginPatient: async (nik: string) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('nik', nik)
            .order('created_at', { ascending: false });
        
        if (error || !data || data.length === 0) {
            // Check basic format to simulate login for demo purposes if not found in DB
            if (nik.length >= 10) return { found: true, data: [] }; 
            throw new Error('NIK tidak ditemukan');
        }
        return { found: true, data };
    } else {
        const regs = getStorage('rsud_registrations', INITIAL_REGISTRATIONS);
        const userRegs = regs.filter((r: any) => r.nik === nik);
        if (userRegs.length > 0) return { found: true, data: userRegs };
        if (nik.length >= 10) return { found: true, data: [] };
        throw new Error('NIK tidak ditemukan');
    }
  },

  // Register Patient
  registerPatient: async (data: any) => {
    const payment_status = data.payment === 'bpjs' ? 'Paid' : 'Unpaid';
    const payment_detail = data.payment === 'bpjs' ? 'BPJS Kesehatan' : (data.payment_detail || 'Tunai');
    const bookingCode = `REG-${Math.floor(Math.random() * 10000)}`;
    const cost = 0;

    const payload = {
        ...data,
        bookingCode,
        status: 'Pending',
        payment_status,
        payment_detail,
        cost,
        created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
        const { data: resData, error } = await supabase.from('registrations').insert([payload]).select().single();
        if (error) throw error;
        return { message: 'success', data: resData };
    } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        const regs = getStorage('rsud_registrations', INITIAL_REGISTRATIONS);
        const newRecord = { id: Date.now(), ...payload };
        setStorage('rsud_registrations', [newRecord, ...regs]);
        return { message: 'success', data: newRecord };
    }
  },

  // Contact Message
  sendMessage: async (data: any) => {
    const payload = { ...data, is_read: false, created_at: new Date().toISOString() };
    
    if (isSupabaseConfigured()) {
        const { data: res, error } = await supabase.from('messages').insert([payload]).select().single();
        if (error) throw error;
        return { message: 'success', id: res.id };
    } else {
        const msgs = getStorage('rsud_messages', INITIAL_MESSAGES);
        const newMessage = { id: Date.now(), ...payload };
        setStorage('rsud_messages', [newMessage, ...msgs]);
        return { message: 'success', id: newMessage.id };
    }
  },

  // Admin: Get Registrations
  getRegistrations: async () => {
    if (isSupabaseConfigured()) {
        const { data } = await supabase.from('registrations').select('*').order('created_at', { ascending: false });
        return data || [];
    }
    return getStorage('rsud_registrations', INITIAL_REGISTRATIONS);
  },

  // Admin: Update Registration
  updateRegistration: async (
      id: number, 
      status: string, 
      payment_status?: string, 
      cost?: number, 
      payment_detail?: string, 
      payment_proof?: string,
      class_type?: string,
      facility_notes?: string
  ) => {
    const updates: any = {};
    if (status) updates.status = status;
    if (payment_status) updates.payment_status = payment_status;
    if (cost !== undefined) updates.cost = cost;
    if (payment_detail) updates.payment_detail = payment_detail;
    if (payment_proof) updates.payment_proof = payment_proof;
    if (class_type !== undefined) updates.class_type = class_type;
    if (facility_notes !== undefined) updates.facility_notes = facility_notes;

    if (isSupabaseConfigured()) {
        await supabase.from('registrations').update(updates).eq('id', id);
    } else {
        const regs = getStorage('rsud_registrations', INITIAL_REGISTRATIONS);
        const updated = regs.map((reg: any) => reg.id === id ? { ...reg, ...updates } : reg);
        setStorage('rsud_registrations', updated);
    }
  },

  // Admin: Messages
  getMessages: async () => {
    if (isSupabaseConfigured()) {
        const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
        return data || [];
    }
    return getStorage('rsud_messages', INITIAL_MESSAGES);
  },
  
  updateMessage: async (id: number, data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('messages').update(data).eq('id', id);
    } else {
        const msgs = getStorage('rsud_messages', INITIAL_MESSAGES);
        const updated = msgs.map((msg: any) => msg.id === id ? { ...msg, ...data } : msg);
        setStorage('rsud_messages', updated);
    }
  },

  // Admin: Users
  getUsers: async () => {
    if (isSupabaseConfigured()) {
        const { data } = await supabase.from('users').select('*');
        return data || [];
    }
    return getStorage('rsud_users', INITIAL_USERS);
  },
  addUser: async (data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('users').insert([data]);
        return { message: 'success' };
    }
    const users = getStorage('rsud_users', INITIAL_USERS);
    const newUser = { ...data, id: Date.now() };
    setStorage('rsud_users', [...users, newUser]);
    return { message: 'success' };
  },
  updateUser: async (id: number, data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('users').update(data).eq('id', id);
    } else {
        const users = getStorage('rsud_users', INITIAL_USERS);
        const updated = users.map((u: any) => u.id === id ? { ...u, ...data } : u);
        setStorage('rsud_users', updated);
    }
  },
  deleteUser: async (id: number) => {
    if (isSupabaseConfigured()) {
        await supabase.from('users').delete().eq('id', id);
    } else {
        const users = getStorage('rsud_users', INITIAL_USERS);
        const filtered = users.filter((u: any) => u.id !== id);
        setStorage('rsud_users', filtered);
    }
  },

  // Admin: BPJS
  getBPJS: async () => {
    if (isSupabaseConfigured()) {
        const { data } = await supabase.from('bpjs_data').select('*');
        return data || [];
    }
    return getStorage('rsud_bpjs', INITIAL_BPJS);
  },
  addBPJS: async (data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('bpjs_data').insert([data]);
        return { message: 'success' };
    }
    const bpjs = getStorage('rsud_bpjs', INITIAL_BPJS);
    const newBpjs = { ...data, id: Date.now() };
    setStorage('rsud_bpjs', [...bpjs, newBpjs]);
    return { message: 'success' };
  },
  updateBPJS: async (id: number, data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('bpjs_data').update(data).eq('id', id);
    } else {
        const bpjs = getStorage('rsud_bpjs', INITIAL_BPJS);
        const updated = bpjs.map((b: any) => b.id === id ? { ...b, ...data } : b);
        setStorage('rsud_bpjs', updated);
    }
  },
  deleteBPJS: async (id: number) => {
    if (isSupabaseConfigured()) {
        await supabase.from('bpjs_data').delete().eq('id', id);
    } else {
        const bpjs = getStorage('rsud_bpjs', INITIAL_BPJS);
        const filtered = bpjs.filter((b: any) => b.id !== id);
        setStorage('rsud_bpjs', filtered);
    }
  },

  // Admin: Facilities
  getFacilities: async () => {
    if (isSupabaseConfigured()) {
        const { data } = await supabase.from('facilities').select('*');
        return data || [];
    }
    return getStorage('rsud_facilities', INITIAL_FACILITIES);
  },
  addFacility: async (data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('facilities').insert([data]);
        return { message: 'success' };
    }
    const facilities = getStorage('rsud_facilities', INITIAL_FACILITIES);
    const newItem = { ...data, id: Date.now() };
    setStorage('rsud_facilities', [...facilities, newItem]);
    return { message: 'success' };
  },
  updateFacility: async (id: number, data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('facilities').update(data).eq('id', id);
    } else {
        const facilities = getStorage('rsud_facilities', INITIAL_FACILITIES);
        const updated = facilities.map((f: any) => f.id === id ? { ...f, ...data } : f);
        setStorage('rsud_facilities', updated);
    }
  },
  deleteFacility: async (id: number) => {
    if (isSupabaseConfigured()) {
        await supabase.from('facilities').delete().eq('id', id);
    } else {
        const facilities = getStorage('rsud_facilities', INITIAL_FACILITIES);
        const filtered = facilities.filter((f: any) => f.id !== id);
        setStorage('rsud_facilities', filtered);
    }
  },

  // Admin: Rooms
  getRooms: async () => {
    if (isSupabaseConfigured()) {
        const { data } = await supabase.from('rooms').select('*');
        return data || [];
    }
    return getStorage('rsud_rooms', INITIAL_ROOMS);
  },
  addRoom: async (data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('rooms').insert([data]);
        return { message: 'success' };
    }
    const rooms = getStorage('rsud_rooms', INITIAL_ROOMS);
    const newItem = { ...data, id: Date.now() };
    setStorage('rsud_rooms', [...rooms, newItem]);
    return { message: 'success' };
  },
  updateRoom: async (id: number, data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('rooms').update(data).eq('id', id);
    } else {
        const rooms = getStorage('rsud_rooms', INITIAL_ROOMS);
        const updated = rooms.map((r: any) => r.id === id ? { ...r, ...data } : r);
        setStorage('rsud_rooms', updated);
    }
  },
  deleteRoom: async (id: number) => {
    if (isSupabaseConfigured()) {
        await supabase.from('rooms').delete().eq('id', id);
    } else {
        const rooms = getStorage('rsud_rooms', INITIAL_ROOMS);
        const filtered = rooms.filter((r: any) => r.id !== id);
        setStorage('rsud_rooms', filtered);
    }
  },

  // Admin: Banks
  getBanks: async (): Promise<BankAccount[]> => {
    if (isSupabaseConfigured()) {
        const { data } = await supabase.from('bank_accounts').select('*');
        return data || [];
    }
    return getStorage('rsud_banks', INITIAL_BANKS);
  },
  addBank: async (data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('bank_accounts').insert([data]);
        return { message: 'success' };
    }
    const banks = getStorage('rsud_banks', INITIAL_BANKS);
    const newItem = { ...data, id: Date.now() };
    setStorage('rsud_banks', [...banks, newItem]);
    return { message: 'success' };
  },
  updateBank: async (id: number, data: any) => {
    if (isSupabaseConfigured()) {
        await supabase.from('bank_accounts').update(data).eq('id', id);
    } else {
        const banks = getStorage('rsud_banks', INITIAL_BANKS);
        const updated = banks.map((b: any) => b.id === id ? { ...b, ...data } : b);
        setStorage('rsud_banks', updated);
    }
  },
  deleteBank: async (id: number) => {
    if (isSupabaseConfigured()) {
        await supabase.from('bank_accounts').delete().eq('id', id);
    } else {
        const banks = getStorage('rsud_banks', INITIAL_BANKS);
        const filtered = banks.filter((b: any) => b.id !== id);
        setStorage('rsud_banks', filtered);
    }
  }
};