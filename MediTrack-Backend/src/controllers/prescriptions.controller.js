// src/controllers/prescriptions.controller.js
// Refactored for PostgreSQL with parameterized queries
const db = require('../db/pool');
const { createError, sendSuccess } = require('../middleware/errorHandler');

/**
 * GET /api/v1/prescriptions
 * Query params: ?patientId=&doctorId=&status=
 */
const getAllPrescriptions = async (req, res, next) => {
    try {
        const { patientId, doctorId, status } = req.query;
        let query = `
            SELECT 
                p.id, p.patient_id AS "patientId", p.doctor_id AS "doctorId",
                pt.name AS "patientName", d.name AS "doctorName",
                p.medication_name AS "medicationName", p.dosage, p.frequency, p.duration_days,
                p.issued_date AS "issuedDate", p.expiry_date AS "expiryDate",
                p.instructions, p.status, p.refills_remaining, p.created_at
            FROM prescriptions p
            JOIN patients pt ON p.patient_id = pt.id
            JOIN doctors d ON p.doctor_id = d.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (patientId) {
            query += ` AND p.patient_id = $${paramCount}`;
            params.push(patientId);
            paramCount++;
        }
        if (doctorId) {
            query += ` AND p.doctor_id = $${paramCount}`;
            params.push(doctorId);
            paramCount++;
        }
        if (status) {
            query += ` AND p.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        query += ` ORDER BY p.issued_date DESC`;
        
        const result = await db.queryMany(query, params);
        sendSuccess(res, 200, `Retrieved ${result.length} prescription(s).`, result);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/v1/prescriptions/:id
 */
const getPrescriptionById = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                p.id, p.patient_id AS "patientId", p.doctor_id AS "doctorId",
                pt.name AS "patientName", d.name AS "doctorName",
                p.medication_name AS "medicationName", p.dosage, p.frequency, p.duration_days,
                p.issued_date AS "issuedDate", p.expiry_date AS "expiryDate",
                p.instructions, p.status, p.refills_remaining, p.created_at, p.updated_at
            FROM prescriptions p
            JOIN patients pt ON p.patient_id = pt.id
            JOIN doctors d ON p.doctor_id = d.id
            WHERE p.id = $1
        `;
        
        const rx = await db.queryOne(query, [req.params.id]);
        if (!rx) return next(createError(404, `Prescription '${req.params.id}' not found.`));
        
        sendSuccess(res, 200, 'Prescription retrieved.', rx);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/prescriptions — Doctor only
 * Body: { patientId, medicationName, dosage, frequency, durationDays, instructions?, expiryDate? }
 * Uses parameterized query
 */
const issuePrescription = async (req, res, next) => {
    try {
        const { patientId, medicationName, dosage, frequency, durationDays, instructions, expiryDate } = req.body;
        const doctorId = req.user?.id || 'd1'; // Mock doctor ID from auth

        // Validate required fields
        if (!patientId || !medicationName || !dosage || !frequency || !durationDays) {
            return next(createError(400, 'Required fields: patientId, medicationName, dosage, frequency, durationDays'));
        }

        // Verify patient exists using parameterized query
        const patient = await db.queryOne('SELECT id, name FROM patients WHERE id = $1', [patientId]);
        if (!patient) return next(createError(404, `Patient with ID '${patientId}' not found.`));

        // Verify doctor exists using parameterized query
        const doctor = await db.queryOne('SELECT id, name FROM doctors WHERE id = $1', [doctorId]);
        if (!doctor) return next(createError(403, 'Doctor not authenticated or not found.'));

        // Calculate expiry date if not provided
        const issuedDate = new Date().toISOString().split('T')[0];
        const finalExpiryDate = expiryDate || new Date(new Date().setDate(new Date().getDate() + (durationDays * 2))).toISOString().split('T')[0];

        // Insert with parameterized query
        const query = `
            INSERT INTO prescriptions 
            (patient_id, doctor_id, medication_name, dosage, frequency, duration_days, issued_date, expiry_date, instructions, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING 
                id, patient_id AS "patientId", doctor_id AS "doctorId",
                medication_name AS "medicationName", dosage, frequency, duration_days, issued_date, expiry_date, 
                instructions, status, refills_remaining, created_at
        `;

        const newRx = await db.insert(query, [
            patientId,
            doctorId,
            medicationName,
            dosage,
            frequency,
            durationDays,
            issuedDate,
            finalExpiryDate,
            instructions || null,
            'Pending'
        ]);

        // Enrich response
        newRx.patientName = patient.name;
        newRx.doctorName = doctor.name;

        sendSuccess(res, 201, `Prescription issued by ${doctor.name} for ${patient.name}.`, newRx);
    } catch (err) {
        if (err.code === '23503') { // Foreign key violation
            return next(createError(400, 'Invalid patientId or doctorId'));
        }
        next(err);
    }
};

/**
 * PUT /api/v1/prescriptions/:id/status — Update status
 * Body: { status: 'Pending' | 'Dispensed' | 'Completed' | 'Cancelled' }
 */
const updatePrescriptionStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Pending', 'Dispensed', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return next(createError(400, `Invalid status. Must be: [${validStatuses.join(', ')}]`));
        }

        // Check if prescription exists
        const rx = await db.queryOne('SELECT status FROM prescriptions WHERE id = $1', [id]);
        if (!rx) return next(createError(404, `Prescription '${id}' not found.`));

        // Semantic: can't re-open a cancelled prescription
        if (rx.status === 'Cancelled' && status !== 'Cancelled') {
            return next(createError(400, 'Cannot update a cancelled prescription.'));
        }

        // Update with parameterized query
        const query = `
            UPDATE prescriptions
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, status, updated_at
        `;

        const updated = await db.queryOne(query, [status, id]);
        sendSuccess(res, 200, `Prescription status updated to '${status}'.`, updated);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/v1/prescriptions/:id — Cancel prescription
 * Uses parameterized query
 */
const cancelPrescription = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if prescription exists
        const rx = await db.queryOne('SELECT id FROM prescriptions WHERE id = $1', [id]);
        if (!rx) return next(createError(404, `Prescription '${id}' not found.`));

        // Delete with parameterized query
        await db.query('DELETE FROM prescriptions WHERE id = $1', [id]);
        
        sendSuccess(res, 200, `Prescription '${id}' cancelled.`, null);
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllPrescriptions, getPrescriptionById, issuePrescription, updatePrescriptionStatus, cancelPrescription };
