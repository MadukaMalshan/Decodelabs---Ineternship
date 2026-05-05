// src/controllers/patients.controller.js
// Refactored for PostgreSQL with parameterized queries
const db = require('../db/pool');
const { createError, sendSuccess } = require('../middleware/errorHandler');

/**
 * GET /api/v1/patients — Admin/Doctor only
 */
const getAllPatients = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                id, name, email, phone, date_of_birth, blood_type, gender, 
                address, emergency_contact, emergency_phone, allergies, created_at
            FROM patients
            ORDER BY name ASC
        `;
        
        const patients = await db.queryMany(query);
        sendSuccess(res, 200, `Retrieved ${patients.length} patient(s).`, patients);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/v1/patients/:id — Admin, Doctor, or the patient themselves
 */
const getPatientById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                id, name, email, phone, date_of_birth, blood_type, gender, 
                address, emergency_contact, emergency_phone, allergies, 
                medical_history, created_at, updated_at
            FROM patients
            WHERE id = $1
        `;
        
        const patient = await db.queryOne(query, [id]);
        if (!patient) return next(createError(404, `Patient '${id}' not found.`));
        
        sendSuccess(res, 200, 'Patient retrieved.', patient);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/v1/patients/:id/appointments — Patient's own appointments
 */
const getPatientAppointments = async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                a.id, a.patient_id, a.doctor_id,
                d.name AS "doctorName", s.name AS "specialty",
                a.appointment_date AS date, a.appointment_time AS time,
                a.type, a.status, a.reason_for_visit, a.created_at
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN specialties s ON d.specialty_id = s.id
            WHERE a.patient_id = $1
            ORDER BY a.appointment_date DESC
        `;
        
        const appointments = await db.queryMany(query, [id]);
        sendSuccess(res, 200, `${appointments.length} appointment(s) for patient '${id}'.`, appointments);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/v1/patients/:id/prescriptions
 */
const getPatientPrescriptions = async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                p.id, p.doctor_id,
                d.name AS "doctorName",
                p.medication_name AS "medicationName", p.dosage, p.frequency,
                p.issued_date, p.expiry_date, p.status, p.instructions, p.refills_remaining,
                p.created_at
            FROM prescriptions p
            JOIN doctors d ON p.doctor_id = d.id
            WHERE p.patient_id = $1
            ORDER BY p.issued_date DESC
        `;
        
        const prescriptions = await db.queryMany(query, [id]);
        sendSuccess(res, 200, `${prescriptions.length} prescription(s) for patient '${id}'.`, prescriptions);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/v1/patients/:id/inpatient — Check if patient is admitted
 */
const getPatientInpatientStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                id, patient_id, attending_doctor_id,
                ward, room_number, bed_number, admission_date, discharge_date,
                diagnosis, medical_condition, treatment_notes, created_at
            FROM inpatients
            WHERE patient_id = $1 AND discharge_date IS NULL
            LIMIT 1
        `;
        
        const record = await db.queryOne(query, [id]);

        if (!record) {
            return sendSuccess(res, 200, `Patient '${id}' is not currently admitted.`, { admitted: false });
        }
        
        sendSuccess(res, 200, 'Inpatient record found.', { admitted: true, record });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllPatients, getPatientById, getPatientAppointments, getPatientPrescriptions, getPatientInpatientStatus };
