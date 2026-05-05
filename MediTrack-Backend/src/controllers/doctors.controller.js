// src/controllers/doctors.controller.js
// Refactored for PostgreSQL with parameterized queries
const db = require('../db/pool');
const { createError, sendSuccess } = require('../middleware/errorHandler');

/**
 * GET /api/v1/doctors
 * Query params: ?specialty=&status=
 * All queries use parameterized statements to prevent SQL injection
 */
const getAllDoctors = async (req, res, next) => {
    try {
        const { specialty, status } = req.query;
        let query = `
            SELECT 
                d.id, d.name, d.specialty_id AS specialty, d.shift, d.status, 
                d.email, d.phone, d.department, s.name AS specialty_name
            FROM doctors d
            LEFT JOIN specialties s ON d.specialty_id = s.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (specialty) {
            query += ` AND d.specialty_id = $${paramCount}`;
            params.push(specialty);
            paramCount++;
        }
        if (status) {
            query += ` AND d.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        query += ` ORDER BY d.name ASC`;
        
        const result = await db.queryMany(query, params);
        sendSuccess(res, 200, `Retrieved ${result.length} doctor(s).`, result);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/v1/doctors/:id
 */
const getDoctorById = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                d.id, d.name, d.specialty_id AS specialty, d.shift, d.status, 
                d.email, d.phone, d.department, s.name AS specialty_name,
                d.hire_date, d.created_at, d.updated_at
            FROM doctors d
            LEFT JOIN specialties s ON d.specialty_id = s.id
            WHERE d.id = $1
        `;
        
        const doctor = await db.queryOne(query, [req.params.id]);
        if (!doctor) return next(createError(404, `Doctor with ID '${req.params.id}' not found.`));
        
        sendSuccess(res, 200, 'Doctor retrieved.', doctor);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/doctors — Admin only
 * Body: { name, specialty, shift, email, phone, department?, hire_date? }
 * Uses parameterized query to prevent SQL injection
 */
const createDoctor = async (req, res, next) => {
    try {
        const { name, specialty, shift, email, phone, department, hire_date } = req.body;

        // Validate required fields
        if (!name || !specialty || !email || !phone) {
            return next(createError(400, 'Required fields: name, specialty, email, phone'));
        }

        // Verify specialty exists using parameterized query
        const specExists = await db.queryOne(
            'SELECT id FROM specialties WHERE id = $1',
            [specialty]
        );
        if (!specExists) {
            return next(createError(400, `Invalid specialty ID: '${specialty}'`));
        }

        // Insert doctor with parameterized query - prevents SQL injection
        const query = `
            INSERT INTO doctors (name, specialty_id, shift, status, email, phone, department, hire_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, name, specialty_id AS specialty, shift, status, email, phone, department, hire_date, created_at
        `;
        
        const newDoctor = await db.insert(query, [
            name,
            specialty,
            shift || 'Morning',
            'Available',
            email,
            phone,
            department || null,
            hire_date || new Date().toISOString().split('T')[0]
        ]);

        sendSuccess(res, 201, 'Doctor profile created successfully.', newDoctor);
    } catch (err) {
        if (err.code === '23505') { // UNIQUE constraint violation
            const field = err.detail.includes('email') ? 'email' : 'phone';
            return next(createError(400, `A doctor with this ${field} already exists.`));
        }
        next(err);
    }
};

/**
 * PUT /api/v1/doctors/:id — Admin only
 * Body: any updatable fields
 * Uses parameterized query
 */
const updateDoctor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, specialty, shift, email, phone, department, status } = req.body;

        // Check if doctor exists
        const doctor = await db.queryOne('SELECT id FROM doctors WHERE id = $1', [id]);
        if (!doctor) return next(createError(404, `Doctor with ID '${id}' not found.`));

        // Build dynamic update query with parameterized values
        const updates = [];
        const params = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount}`);
            params.push(name);
            paramCount++;
        }
        if (specialty !== undefined) {
            updates.push(`specialty_id = $${paramCount}`);
            params.push(specialty);
            paramCount++;
        }
        if (shift !== undefined) {
            updates.push(`shift = $${paramCount}`);
            params.push(shift);
            paramCount++;
        }
        if (email !== undefined) {
            updates.push(`email = $${paramCount}`);
            params.push(email);
            paramCount++;
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramCount}`);
            params.push(phone);
            paramCount++;
        }
        if (department !== undefined) {
            updates.push(`department = $${paramCount}`);
            params.push(department);
            paramCount++;
        }
        if (status !== undefined) {
            updates.push(`status = $${paramCount}`);
            params.push(status);
            paramCount++;
        }

        if (updates.length === 0) {
            return next(createError(400, 'No fields to update'));
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE doctors
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, name, specialty_id AS specialty, shift, status, email, phone, department, updated_at
        `;

        const updated = await db.queryOne(query, params);
        sendSuccess(res, 200, 'Doctor profile updated.', updated);
    } catch (err) {
        if (err.code === '23505') {
            const field = err.detail.includes('email') ? 'email' : 'phone';
            return next(createError(400, `A doctor with this ${field} already exists.`));
        }
        next(err);
    }
};

/**
 * PUT /api/v1/doctors/:id/status — Availability toggle
 * Body: { status: 'Available' | 'Busy' | 'Offline' }
 * Uses parameterized query
 */
const updateDoctorStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Available', 'Busy', 'Offline'];
        if (!validStatuses.includes(status)) {
            return next(createError(400, `Invalid status. Must be one of: [${validStatuses.join(', ')}]`));
        }

        // Check if doctor exists using parameterized query
        const doctor = await db.queryOne('SELECT name FROM doctors WHERE id = $1', [id]);
        if (!doctor) return next(createError(404, `Doctor with ID '${id}' not found.`));

        // Update status with parameterized query
        const query = `
            UPDATE doctors
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, name, status
        `;

        const updated = await db.queryOne(query, [status, id]);
        sendSuccess(res, 200, `Dr. ${updated.name}'s status updated to '${status}'.`, updated);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/v1/doctors/:id — Admin only
 * Uses parameterized query
 */
const deleteDoctor = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if doctor exists and get name
        const doctor = await db.queryOne('SELECT id, name FROM doctors WHERE id = $1', [id]);
        if (!doctor) return next(createError(404, `Doctor with ID '${id}' not found.`));

        // Delete with parameterized query
        await db.query('DELETE FROM doctors WHERE id = $1', [id]);
        
        sendSuccess(res, 200, `Doctor '${doctor.name}' removed from the system.`, null);
    } catch (err) {
        if (err.code === '23502' || err.message.includes('foreign key')) {
            return next(createError(400, 'Cannot delete doctor: has associated appointments or inpatient records.'));
        }
        next(err);
    }
};

/**
 * GET /api/v1/doctors/specialties — Get all specialties
 */
const getSpecialties = async (req, res, next) => {
    try {
        const query = 'SELECT id, name, icon FROM specialties ORDER BY name ASC';
        const specialties = await db.queryMany(query);
        sendSuccess(res, 200, `${specialties.length} specialties retrieved.`, specialties);
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllDoctors, getDoctorById, createDoctor, updateDoctor, updateDoctorStatus, deleteDoctor, getSpecialties };

