// src/controllers/appointments.controller.js
// Refactored for PostgreSQL with parameterized queries
const db = require('../db/pool');
const { createError, sendSuccess } = require('../middleware/errorHandler');

/**
 * GET /api/v1/appointments
 * Query params: ?doctorId=&patientId=&status=&date=
 * All queries use parameterized statements
 */
const getAllAppointments = async (req, res, next) => {
    try {
        const { doctorId, patientId, status, date } = req.query;
        
        let query = `
            SELECT 
                a.id, a.patient_id AS "patientId", a.doctor_id AS "doctorId",
                p.name AS "patientName", d.name AS "doctorName",
                s.name AS "specialty", a.appointment_date AS date, 
                a.appointment_time AS time, a.type, a.status,
                a.reason_for_visit, a.created_at AS "createdAt"
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN specialties s ON d.specialty_id = s.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (doctorId) {
            query += ` AND a.doctor_id = $${paramCount}`;
            params.push(doctorId);
            paramCount++;
        }
        if (patientId) {
            query += ` AND a.patient_id = $${paramCount}`;
            params.push(patientId);
            paramCount++;
        }
        if (status) {
            query += ` AND a.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        if (date) {
            query += ` AND a.appointment_date = $${paramCount}`;
            params.push(date);
            paramCount++;
        }

        query += ` ORDER BY a.appointment_date ASC, a.appointment_time ASC`;
        
        const result = await db.queryMany(query, params);
        sendSuccess(res, 200, `Retrieved ${result.length} appointment(s).`, result);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/v1/appointments/:id
 * Uses parameterized query
 */
const getAppointmentById = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                a.id, a.patient_id AS "patientId", a.doctor_id AS "doctorId",
                p.name AS "patientName", d.name AS "doctorName",
                s.name AS "specialty", a.appointment_date AS date, 
                a.appointment_time AS time, a.type, a.status,
                a.reason_for_visit, a.notes, a.created_at, a.updated_at
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN specialties s ON d.specialty_id = s.id
            WHERE a.id = $1
        `;
        
        const appointment = await db.queryOne(query, [req.params.id]);
        if (!appointment) return next(createError(404, `Appointment with ID '${req.params.id}' not found.`));
        
        sendSuccess(res, 200, 'Appointment retrieved.', appointment);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/appointments
 * Body: { patientId, doctorId, date, time, type, reason_for_visit? }
 * Uses parameterized query - prevents SQL injection
 */
const createAppointment = async (req, res, next) => {
    try {
        const { patientId, doctorId, date, time, type, reason_for_visit } = req.body;

        // Validate required fields
        if (!patientId || !doctorId || !date || !time || !type) {
            return next(createError(400, 'Required fields: patientId, doctorId, date, time, type'));
        }

        // Verify patient exists using parameterized query
        const patient = await db.queryOne('SELECT id, name FROM patients WHERE id = $1', [patientId]);
        if (!patient) return next(createError(404, `Patient with ID '${patientId}' not found.`));

        // Verify doctor exists using parameterized query
        const doctor = await db.queryOne(
            'SELECT d.id, d.name, s.id AS specialty FROM doctors d LEFT JOIN specialties s ON d.specialty_id = s.id WHERE d.id = $1',
            [doctorId]
        );
        if (!doctor) return next(createError(404, `Doctor with ID '${doctorId}' not found.`));

        // Insert appointment with parameterized query
        const query = `
            INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, status, reason_for_visit)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING 
                id, patient_id AS "patientId", doctor_id AS "doctorId",
                appointment_date AS date, appointment_time AS time, type, status, reason_for_visit, created_at
        `;

        const newAppointment = await db.insert(query, [
            patientId,
            doctorId,
            date,
            time,
            type,
            'Scheduled',
            reason_for_visit || null
        ]);

        // Enrich response
        newAppointment.patientName = patient.name;
        newAppointment.doctorName = doctor.name;
        newAppointment.specialty = doctor.specialty;

        sendSuccess(res, 201, 'Appointment created successfully.', newAppointment);
    } catch (err) {
        if (err.code === '23503') { // Foreign key violation
            return next(createError(400, 'Invalid patientId or doctorId'));
        }
        next(err);
    }
};

/**
 * PUT /api/v1/appointments/:id
 * Body: { status?, time?, date?, type?, reason_for_visit? }
 * Uses parameterized query
 */
const updateAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, time, date, type, reason_for_visit } = req.body;

        // Check if appointment exists
        const appointment = await db.queryOne('SELECT status FROM appointments WHERE id = $1', [id]);
        if (!appointment) return next(createError(404, `Appointment with ID '${id}' not found.`));

        // Prevent updating completed/cancelled appointments
        if (['Completed', 'Cancelled'].includes(appointment.status)) {
            return next(createError(400, `Cannot update an appointment with status '${appointment.status}'.`));
        }

        // Build dynamic update query
        const updates = [];
        const params = [];
        let paramCount = 1;

        if (status !== undefined) {
            updates.push(`status = $${paramCount}`);
            params.push(status);
            paramCount++;
        }
        if (time !== undefined) {
            updates.push(`appointment_time = $${paramCount}`);
            params.push(time);
            paramCount++;
        }
        if (date !== undefined) {
            updates.push(`appointment_date = $${paramCount}`);
            params.push(date);
            paramCount++;
        }
        if (type !== undefined) {
            updates.push(`type = $${paramCount}`);
            params.push(type);
            paramCount++;
        }
        if (reason_for_visit !== undefined) {
            updates.push(`reason_for_visit = $${paramCount}`);
            params.push(reason_for_visit);
            paramCount++;
        }

        if (updates.length === 0) {
            return next(createError(400, 'No fields to update'));
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE appointments
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, patient_id, doctor_id, status, appointment_date, appointment_time, type, updated_at
        `;

        const updated = await db.queryOne(query, params);
        sendSuccess(res, 200, 'Appointment updated.', updated);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/v1/appointments/:id — Cancel appointment
 * Uses parameterized query
 */
const deleteAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if appointment exists
        const appointment = await db.queryOne('SELECT id FROM appointments WHERE id = $1', [id]);
        if (!appointment) return next(createError(404, `Appointment with ID '${id}' not found.`));

        // Delete with parameterized query
        await db.query('DELETE FROM appointments WHERE id = $1', [id]);
        
        sendSuccess(res, 200, `Appointment '${id}' has been cancelled and removed.`, null);
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllAppointments, getAppointmentById, createAppointment, updateAppointment, deleteAppointment };
