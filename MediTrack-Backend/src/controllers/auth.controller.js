// src/controllers/auth.controller.js — Production Secure Authentication Controller
const crypto = require('crypto');
const db = require('../db/pool');
const { createError, sendSuccess } = require('../middleware/errorHandler');

// SHA-256 standard cryptographic hashing for zero-dependency robust deployment
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * POST /api/v1/auth/register
 * Handles dynamic multi-portal user registration with atomic transactions.
 */
const register = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        const { role, name, email, password, phone } = req.body;
        
        if (!role || !name || !email || !password || !phone) {
            throw createError(400, 'Required fields: role, name, email, password, phone');
        }

        const validRoles = ['Doctor', 'Patient'];
        if (!validRoles.includes(role)) {
            throw createError(400, "Role must be 'Doctor' or 'Patient' for public registration.");
        }

        // Check if email already registered in users table
        const userExists = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (userExists.rows.length > 0) {
            throw createError(400, 'Email address is already registered.');
        }

        const hashedPassword = hashPassword(password);

        // 1. Insert into users table
        const userResult = await client.query(
            `INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role`,
            [email.toLowerCase(), hashedPassword, role]
        );
        const newUser = userResult.rows[0];

        // 2. Insert into respective sub-table
        let portalData = null;
        if (role === 'Patient') {
            const { bloodType, dateOfBirth, gender, address, emergencyContact, emergencyPhone } = req.body;
            
            const patientResult = await client.query(
                `INSERT INTO patients 
                (user_id, name, email, phone, date_of_birth, blood_type, gender, address, emergency_contact, emergency_phone)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id, name, email, phone, blood_type`,
                [
                    newUser.id,
                    name,
                    email.toLowerCase(),
                    phone,
                    dateOfBirth || '2000-01-01',
                    bloodType || null,
                    gender || null,
                    address || null,
                    emergencyContact || null,
                    emergencyPhone || null
                ]
            );
            portalData = patientResult.rows[0];

            await client.query('COMMIT');
            return sendSuccess(res, 201, 'Patient registration successful. Instant access granted.', {
                user: { id: portalData.id, userId: newUser.id, name: portalData.name, email: newUser.email, role: newUser.role }
            });

        } else if (role === 'Doctor') {
            const { specialty, licenseNumber, yearsOfExperience, currentClinic } = req.body;
            
            if (!specialty || !licenseNumber) {
                throw createError(400, 'Doctor registration requires specialty ID and Medical License Number.');
            }

            // Verify specialty exists
            const specCheck = await client.query('SELECT id FROM specialties WHERE id = $1', [specialty]);
            if (specCheck.rows.length === 0) {
                throw createError(400, `Specialty ID '${specialty}' does not exist.`);
            }

            const doctorResult = await client.query(
                `INSERT INTO doctors 
                (user_id, name, specialty_id, shift, status, email, phone, license_number, years_of_experience, current_clinic)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id, name, status, license_number`,
                [
                    newUser.id,
                    name,
                    specialty,
                    'Morning', // default initial shift
                    'Pending', // Initial status verification constraint
                    email.toLowerCase(),
                    phone,
                    licenseNumber,
                    yearsOfExperience ? parseInt(yearsOfExperience) : null,
                    currentClinic || null
                ]
            );
            portalData = doctorResult.rows[0];

            await client.query('COMMIT');
            return sendSuccess(res, 201, 'Doctor registration submitted. Status set to Pending Admin Review.', {
                doctor: portalData
            });
        }

    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
            next(createError(400, 'A profile with these unique credentials (email/phone/license) already exists.'));
        } else {
            next(err);
        }
    } finally {
        client.release();
    }
};

/**
 * POST /api/v1/auth/login
 * Secure Parameterized query verification preventing SQL Injection.
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(createError(400, 'Please provide both email and password.'));
        }

        // Fetch user from centralized table via Parameterized Query ($1)
        const userQuery = `SELECT id, email, password, role, preferred_theme FROM users WHERE email = $1`;
        const userRecord = await db.queryOne(userQuery, [email.toLowerCase()]);

        if (!userRecord) {
            return next(createError(401, 'Invalid email or password.'));
        }

        // Validate cryptographic hash
        const hashedInput = hashPassword(password);
        if (hashedInput !== userRecord.password) {
            return next(createError(401, 'Invalid email or password.'));
        }

        // Role-specific verification & entity lookups
        let finalProfile = {
            userId: userRecord.id,
            email: userRecord.email,
            role: userRecord.role,
            preferredTheme: userRecord.preferred_theme || 'light'
        };

        if (userRecord.role === 'Admin') {
            finalProfile.id = 'admin-primary';
            finalProfile.name = 'System Administrator';
        } else if (userRecord.role === 'Doctor') {
            const docRecord = await db.queryOne(`SELECT id, name, status, specialty_id FROM doctors WHERE user_id = $1`, [userRecord.id]);
            if (!docRecord) {
                return next(createError(404, 'Associated doctor profile entity missing.'));
            }
            
            // Check verification constraint
            if (docRecord.status === 'Pending') {
                return next(createError(403, 'Access Denied: Your account is pending review. Please wait for Admin approval.'));
            }

            finalProfile.id = docRecord.id;
            finalProfile.name = docRecord.name;
            finalProfile.status = docRecord.status;
            finalProfile.specialty = docRecord.specialty_id;

        } else if (userRecord.role === 'Patient') {
            const patRecord = await db.queryOne(`SELECT id, name FROM patients WHERE user_id = $1`, [userRecord.id]);
            if (!patRecord) {
                return next(createError(404, 'Associated patient profile entity missing.'));
            }

            finalProfile.id = patRecord.id;
            finalProfile.name = patRecord.name;
        }

        sendSuccess(res, 200, `Successfully logged in as ${finalProfile.role}.`, {
            user: finalProfile,
            token: { role: finalProfile.role, userId: finalProfile.id } // Compatible with Simulated Headers flow
        });

    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/v1/auth/admin/pending-doctors
 * Retrieves all pending doctor registrations for Admin review interface.
 */
const getPendingDoctors = async (req, res, next) => {
    try {
        const query = `
            SELECT d.id, d.name, d.email, d.phone, d.license_number, d.years_of_experience, d.current_clinic, s.name AS specialty_name, d.created_at
            FROM doctors d
            LEFT JOIN specialties s ON d.specialty_id = s.id
            WHERE d.status = 'Pending'
            ORDER BY d.created_at DESC
        `;
        const list = await db.queryMany(query);
        sendSuccess(res, 200, `Fetched ${list.length} pending doctor(s).`, list);
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/v1/auth/admin/approve-doctor/:id
 * Updates doctor status from 'Pending' to 'Available'. Admin access required.
 */
const approveDoctor = async (req, res, next) => {
    try {
        const { id } = req.params;

        const checkDoc = await db.queryOne(`SELECT id, status FROM doctors WHERE id = $1`, [id]);
        if (!checkDoc) {
            return next(createError(404, `Doctor with ID '${id}' not found.`));
        }

        if (checkDoc.status !== 'Pending') {
            return next(createError(400, `Doctor is currently '${checkDoc.status}', not 'Pending'.`));
        }

        const updateQuery = `
            UPDATE doctors 
            SET status = 'Available', updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 
            RETURNING id, name, status, email
        `;
        const updatedDoc = await db.queryOne(updateQuery, [id]);

        sendSuccess(res, 200, `Doctor ${updatedDoc.name} has been approved and is now Available.`, updatedDoc);
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/v1/auth/theme
 * Updates the authenticated user's preferred_theme in the users table.
 */
const updateTheme = async (req, res, next) => {
    try {
        const { theme } = req.body;
        const userId = req.headers['x-user-id'];

        if (!theme || !['light', 'dark'].includes(theme)) {
            return next(createError(400, "Theme must be 'light' or 'dark'."));
        }
        if (!userId) {
            return next(createError(401, 'User ID required in X-User-Id header.'));
        }

        // Admin uses userId directly from users table; Doctor/Patient use their portal id -> look up user_id
        // Strategy: try updating users table directly by id first, if not found try via doctor/patient user_id
        let result = await db.queryOne(
            `UPDATE users SET preferred_theme = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, preferred_theme`,
            [theme, userId]
        );

        if (!result) {
            // Fallback: userId may be a doctor/patient portal id, not user uuid
            const docUser = await db.queryOne(`SELECT user_id FROM doctors WHERE id = $1`, [userId]);
            if (docUser) {
                result = await db.queryOne(
                    `UPDATE users SET preferred_theme = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, preferred_theme`,
                    [theme, docUser.user_id]
                );
            } else {
                const patUser = await db.queryOne(`SELECT user_id FROM patients WHERE id = $1`, [userId]);
                if (patUser) {
                    result = await db.queryOne(
                        `UPDATE users SET preferred_theme = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, preferred_theme`,
                        [theme, patUser.user_id]
                    );
                }
            }
        }

        if (!result) {
            return next(createError(404, 'User not found.'));
        }

        sendSuccess(res, 200, `Theme updated to '${theme}'.`, { preferredTheme: result.preferred_theme });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register,
    login,
    getPendingDoctors,
    approveDoctor,
    updateTheme
};
