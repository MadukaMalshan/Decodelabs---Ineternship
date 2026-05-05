// src/middleware/validate.middleware.js — Syntactic & Semantic Validation
// Uses express-validator for field-level rules, then runs semantic checks.

const { validationResult } = require('express-validator');
const { createError } = require('./errorHandler');

/**
 * runValidation — Picks up express-validator errors from the request
 * and short-circuits with a 400 response if any exist.
 * SYNTACTIC VALIDATION: checks format, type, required fields.
 */
const runValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value
        }));
        return next(createError(400, 'Validation failed. Please check the request body.', formattedErrors));
    }
    next();
};

/**
 * validateAppointmentDate — SEMANTIC VALIDATION.
 * Ensures the appointment date is not in the past.
 */
const validateAppointmentDate = (req, res, next) => {
    const { date, time } = req.body;
    if (!date) return next(); // Already caught by syntactic validation

    const appointmentDateTime = new Date(`${date}T${convertTo24Hr(time) || '00:00'}`);
    const now = new Date();

    if (appointmentDateTime < now) {
        return next(createError(400, 'Semantic validation failed: Appointment date/time cannot be in the past.'));
    }
    next();
};

/**
 * validateDoctorExists — SEMANTIC VALIDATION.
 * Ensures a given doctorId actually exists in our data store.
 */
const validateDoctorExists = (db) => (req, res, next) => {
    const doctorId = req.body.doctorId || req.params.id;
    if (!doctorId) return next();

    const doctor = db.getDoctorById(doctorId);
    if (!doctor) {
        return next(createError(404, `Semantic validation failed: Doctor with ID '${doctorId}' does not exist.`));
    }
    // Attach doctor to request for reuse in controller
    req.resolvedDoctor = doctor;
    next();
};

/**
 * validateDoctorAvailability — SEMANTIC VALIDATION.
 * Ensures a doctor is 'Available' before booking them.
 */
const validateDoctorAvailability = (db) => (req, res, next) => {
    const { doctorId } = req.body;
    if (!doctorId) return next();

    const doctor = db.getDoctorById(doctorId);
    if (doctor && doctor.status !== 'Available') {
        return next(createError(409, `Semantic validation failed: Dr. ${doctor.name} is currently '${doctor.status}' and cannot accept new appointments.`));
    }
    next();
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const convertTo24Hr = (time) => {
    if (!time) return null;
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    if (modifier === 'PM' && hours !== '12') hours = parseInt(hours, 10) + 12;
    if (modifier === 'AM' && hours === '12') hours = '00';
    return `${String(hours).padStart(2, '0')}:${minutes}:00`;
};

module.exports = { runValidation, validateAppointmentDate, validateDoctorExists, validateDoctorAvailability };
