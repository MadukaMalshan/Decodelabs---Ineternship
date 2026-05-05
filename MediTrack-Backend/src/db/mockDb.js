// src/db/mockDb.js — In-Memory Data Store (Mock Database)
// This mirrors the frontend mock data and acts as the persistence layer.
// Replace with a real DB (PostgreSQL/MongoDB) by swapping this file's exports.

const { v4: uuidv4 } = require('uuid');

// ─── Specialties ──────────────────────────────────────────────────────────────
const specialties = [
    { id: 'cardio', name: 'Cardiology',    icon: 'fa-heart-pulse' },
    { id: 'neuro',  name: 'Neurology',     icon: 'fa-brain' },
    { id: 'ortho',  name: 'Orthopedics',   icon: 'fa-bone' },
    { id: 'pedia',  name: 'Pediatrics',    icon: 'fa-baby' },
    { id: 'derma',  name: 'Dermatology',   icon: 'fa-disease' },
    { id: 'optha',  name: 'Ophthalmology', icon: 'fa-eye' }
];

// ─── Doctors (Staff) ──────────────────────────────────────────────────────────
let doctors = [
    { id: 'd1', name: 'Dr. Sarah Connor', specialty: 'cardio', shift: 'Morning', status: 'Available', email: 'sarah.connor@meditrack.com', phone: '+94 71 234 5678' },
    { id: 'd2', name: 'Dr. John Smith',   specialty: 'neuro',  shift: 'Evening', status: 'Busy',      email: 'john.smith@meditrack.com',   phone: '+94 71 234 5679' },
    { id: 'd3', name: 'Dr. Emily Chen',   specialty: 'pedia',  shift: 'Morning', status: 'Available', email: 'emily.chen@meditrack.com',    phone: '+94 71 234 5680' },
    { id: 'd4', name: 'Dr. Michael Lee',  specialty: 'ortho',  shift: 'Night',   status: 'Offline',   email: 'michael.lee@meditrack.com',   phone: '+94 71 234 5681' }
];

// ─── Appointments ─────────────────────────────────────────────────────────────
let appointments = [
    { id: 'a1', patientId: 'pat1', patientName: 'Alice Johnson',  doctorId: 'd3', doctorName: 'Dr. Emily Chen',   specialty: 'pedia',  date: '2026-05-10', time: '09:00 AM', type: 'Checkup',      status: 'Scheduled', createdAt: new Date().toISOString() },
    { id: 'a2', patientId: 'pat2', patientName: 'Bob Williams',   doctorId: 'd1', doctorName: 'Dr. Sarah Connor', specialty: 'cardio', date: '2026-05-10', time: '10:30 AM', type: 'Follow-up',    status: 'Scheduled', createdAt: new Date().toISOString() },
    { id: 'a3', patientId: 'pat3', patientName: 'Charlie Brown',  doctorId: 'd2', doctorName: 'Dr. John Smith',   specialty: 'neuro',  date: '2026-05-10', time: '11:45 AM', type: 'Consultation', status: 'Waiting',   createdAt: new Date().toISOString() }
];

// ─── Inventory ────────────────────────────────────────────────────────────────
let inventory = [
    { id: 'i1', item: 'Surgical Masks',    category: 'PPE',      stock: 1500, unit: 'pieces', status: 'Good',     lastUpdated: new Date().toISOString() },
    { id: 'i2', item: 'Hand Sanitizer',    category: 'Hygiene',  stock: 120,  unit: 'bottles',status: 'Low',      lastUpdated: new Date().toISOString() },
    { id: 'i3', item: 'Amoxicillin 500mg', category: 'Pharmacy', stock: 45,   unit: 'boxes',  status: 'Critical', lastUpdated: new Date().toISOString() },
    { id: 'i4', item: 'Bandages',          category: 'Supplies', stock: 800,  unit: 'rolls',  status: 'Good',     lastUpdated: new Date().toISOString() }
];

// ─── Inpatients ───────────────────────────────────────────────────────────────
let inpatients = [
    { id: 'ip1', patientId: 'pat4', name: 'John Doe',        ward: 'Ward A - Room 102', admittedDate: '2026-05-01', diagnosis: 'Pneumonia',               condition: 'Stable',   attendingDoctorId: 'd1' },
    { id: 'ip2', patientId: 'pat5', name: 'Jane Smith',      ward: 'ICU - Bed 4',       admittedDate: '2026-05-02', diagnosis: 'Post-surgery observation', condition: 'Critical', attendingDoctorId: 'd2' },
    { id: 'ip3', patientId: 'pat6', name: 'Michael Johnson', ward: 'Ward B - Room 205', admittedDate: '2026-04-28', diagnosis: 'Fractured Femur',          condition: 'Stable',   attendingDoctorId: 'd4' }
];

// ─── Prescriptions ────────────────────────────────────────────────────────────
let prescriptions = [
    { id: 'rx1', patientId: 'pat1', patientName: 'Alice Johnson', doctorId: 'd1', issuedDate: '2026-05-02', medications: 'Amoxicillin 500mg - 1 tablet twice a day', status: 'Dispensed' },
    { id: 'rx2', patientId: 'pat2', patientName: 'Bob Williams',  doctorId: 'd1', issuedDate: '2026-05-03', medications: 'Lisinopril 10mg - 1 tablet daily',         status: 'Pending'   }
];

// ─── Patients ─────────────────────────────────────────────────────────────────
let patients = [
    { id: 'pat1', name: 'Alice Johnson',  email: 'alice@email.com',  dob: '1990-03-15', bloodType: 'O+', phone: '+94 77 111 2222' },
    { id: 'pat2', name: 'Bob Williams',   email: 'bob@email.com',    dob: '1985-07-22', bloodType: 'A+', phone: '+94 77 333 4444' },
    { id: 'pat3', name: 'Charlie Brown',  email: 'charlie@email.com',dob: '1998-01-10', bloodType: 'B+', phone: '+94 77 555 6666' }
];

// ─── Queue Status ─────────────────────────────────────────────────────────────
let queueStatus = {
    totalWaiting: 14,
    avgWaitTime: '25 mins',
    activeDoctors: 8,
    emergencyCases: 1,
    lastUpdated: new Date().toISOString()
};

// ─── DB Service Methods ───────────────────────────────────────────────────────
const db = {
    // ── Specialties ──
    getSpecialties: () => [...specialties],

    // ── Doctors ──
    getAllDoctors: () => [...doctors],
    getDoctorById: (id) => doctors.find(d => d.id === id) || null,
    addDoctor: (data) => {
        const newDoc = { id: uuidv4(), ...data };
        doctors.push(newDoc);
        return newDoc;
    },
    updateDoctor: (id, updates) => {
        const idx = doctors.findIndex(d => d.id === id);
        if (idx === -1) return null;
        doctors[idx] = { ...doctors[idx], ...updates };
        return doctors[idx];
    },
    deleteDoctor: (id) => {
        const idx = doctors.findIndex(d => d.id === id);
        if (idx === -1) return false;
        doctors.splice(idx, 1);
        return true;
    },

    // ── Appointments ──
    getAllAppointments: (filters = {}) => {
        let result = [...appointments];
        if (filters.doctorId) result = result.filter(a => a.doctorId === filters.doctorId);
        if (filters.patientId) result = result.filter(a => a.patientId === filters.patientId);
        if (filters.status)   result = result.filter(a => a.status.toLowerCase() === filters.status.toLowerCase());
        if (filters.date)     result = result.filter(a => a.date === filters.date);
        return result;
    },
    getAppointmentById: (id) => appointments.find(a => a.id === id) || null,
    addAppointment: (data) => {
        const newAppt = { id: uuidv4(), status: 'Scheduled', createdAt: new Date().toISOString(), ...data };
        appointments.push(newAppt);
        return newAppt;
    },
    updateAppointment: (id, updates) => {
        const idx = appointments.findIndex(a => a.id === id);
        if (idx === -1) return null;
        appointments[idx] = { ...appointments[idx], ...updates };
        return appointments[idx];
    },
    deleteAppointment: (id) => {
        const idx = appointments.findIndex(a => a.id === id);
        if (idx === -1) return false;
        appointments.splice(idx, 1);
        return true;
    },

    // ── Inventory ──
    getAllInventory: (filters = {}) => {
        let result = [...inventory];
        if (filters.category) result = result.filter(i => i.category.toLowerCase() === filters.category.toLowerCase());
        if (filters.status)   result = result.filter(i => i.status.toLowerCase() === filters.status.toLowerCase());
        return result;
    },
    getInventoryById: (id) => inventory.find(i => i.id === id) || null,
    addInventoryItem: (data) => {
        const newItem = { id: uuidv4(), lastUpdated: new Date().toISOString(), ...data };
        inventory.push(newItem);
        return newItem;
    },
    updateInventoryItem: (id, updates) => {
        const idx = inventory.findIndex(i => i.id === id);
        if (idx === -1) return null;
        inventory[idx] = { ...inventory[idx], ...updates, lastUpdated: new Date().toISOString() };
        return inventory[idx];
    },
    deleteInventoryItem: (id) => {
        const idx = inventory.findIndex(i => i.id === id);
        if (idx === -1) return false;
        inventory.splice(idx, 1);
        return true;
    },

    // ── Inpatients ──
    getAllInpatients: () => [...inpatients],
    getInpatientById: (id) => inpatients.find(p => p.id === id) || null,
    admitPatient: (data) => {
        const newPatient = { id: uuidv4(), admittedDate: new Date().toISOString().split('T')[0], ...data };
        inpatients.push(newPatient);
        return newPatient;
    },
    updateInpatient: (id, updates) => {
        const idx = inpatients.findIndex(p => p.id === id);
        if (idx === -1) return null;
        inpatients[idx] = { ...inpatients[idx], ...updates };
        return inpatients[idx];
    },
    dischargePatient: (id) => {
        const idx = inpatients.findIndex(p => p.id === id);
        if (idx === -1) return false;
        inpatients.splice(idx, 1);
        return true;
    },

    // ── Prescriptions ──
    getAllPrescriptions: (filters = {}) => {
        let result = [...prescriptions];
        if (filters.patientId) result = result.filter(rx => rx.patientId === filters.patientId);
        if (filters.doctorId)  result = result.filter(rx => rx.doctorId === filters.doctorId);
        if (filters.status)    result = result.filter(rx => rx.status.toLowerCase() === filters.status.toLowerCase());
        return result;
    },
    getPrescriptionById: (id) => prescriptions.find(rx => rx.id === id) || null,
    issuePrescription: (data) => {
        const newRx = { id: uuidv4(), issuedDate: new Date().toISOString().split('T')[0], status: 'Pending', ...data };
        prescriptions.push(newRx);
        return newRx;
    },
    updatePrescription: (id, updates) => {
        const idx = prescriptions.findIndex(rx => rx.id === id);
        if (idx === -1) return null;
        prescriptions[idx] = { ...prescriptions[idx], ...updates };
        return prescriptions[idx];
    },
    cancelPrescription: (id) => {
        const idx = prescriptions.findIndex(rx => rx.id === id);
        if (idx === -1) return false;
        prescriptions.splice(idx, 1);
        return true;
    },

    // ── Patients ──
    getAllPatients: () => [...patients],
    getPatientById: (id) => patients.find(p => p.id === id) || null,

    // ── Queue ──
    getQueueStatus: () => ({ ...queueStatus }),
    updateQueueStatus: (updates) => {
        queueStatus = { ...queueStatus, ...updates, lastUpdated: new Date().toISOString() };
        return queueStatus;
    }
};

module.exports = db;
