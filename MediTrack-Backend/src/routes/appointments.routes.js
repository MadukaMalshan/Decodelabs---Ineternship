// src/routes/appointments.routes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { requireAuth } = require('../middleware/auth.middleware');
const { runValidation, validateAppointmentDate, validateDoctorExists, validateDoctorAvailability } = require('../middleware/validate.middleware');

const ctrl = require('../controllers/appointments.controller');

// ─── Syntactic Validation Rules ───────────────────────────────────────────────
const appointmentCreateRules = [
    body('patientId').notEmpty().withMessage('patientId is required.'),

    body('doctorId').notEmpty().withMessage('doctorId is required.'),
    body('date')
        .notEmpty().withMessage('date is required.')
        .isISO8601().withMessage('date must be a valid ISO 8601 date (YYYY-MM-DD).'),
    body('time').notEmpty().withMessage('time is required (e.g., 09:00 AM).'),
    body('type')
        .notEmpty().withMessage('type is required.')
        .isIn(['Checkup', 'Follow-up', 'Consultation', 'Emergency'])
        .withMessage("type must be one of: ['Checkup', 'Follow-up', 'Consultation', 'Emergency'].")
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/appointments  — Admin & Doctor can see all; Patients filtered by their own
router.get('/', requireAuth('admin', 'doctor', 'patient'), ctrl.getAllAppointments);

// GET /api/v1/appointments/:id
router.get('/:id', requireAuth('admin', 'doctor', 'patient'), ctrl.getAppointmentById);

// POST /api/v1/appointments — Gatekeeper: Syntactic → Semantic → Controller
router.post('/',
    requireAuth('admin', 'doctor', 'patient'),
    appointmentCreateRules,
    runValidation,                        // SYNTACTIC gate
    validateAppointmentDate,              // SEMANTIC: date not in past
    ctrl.createAppointment
);

// PUT /api/v1/appointments/:id — Reschedule
router.put('/:id',
    requireAuth('admin', 'doctor', 'patient'),
    [
        body('date').optional().isISO8601().withMessage('date must be ISO 8601.'),
        body('status').optional().isIn(['Scheduled', 'Waiting', 'Completed', 'Cancelled']).withMessage('Invalid status.')
    ],
    runValidation,
    ctrl.updateAppointment
);

// DELETE /api/v1/appointments/:id — Cancel appointment
router.delete('/:id', requireAuth('admin', 'doctor', 'patient'), ctrl.deleteAppointment);

module.exports = router;
