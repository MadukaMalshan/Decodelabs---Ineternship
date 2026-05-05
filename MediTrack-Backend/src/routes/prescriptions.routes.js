// src/routes/prescriptions.routes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { requireAuth } = require('../middleware/auth.middleware');
const { runValidation } = require('../middleware/validate.middleware');
const ctrl = require('../controllers/prescriptions.controller');

// GET /api/v1/prescriptions — Admin & Doctor
router.get('/', requireAuth('admin', 'doctor'), ctrl.getAllPrescriptions);

// GET /api/v1/prescriptions/:id — Admin, Doctor, or the patient (patient route handles this)
router.get('/:id', requireAuth('admin', 'doctor'), ctrl.getPrescriptionById);

// POST /api/v1/prescriptions — Doctor only
router.post('/',
    requireAuth('doctor'),
    [
        body('patientId').notEmpty().withMessage('patientId is required.'),
        body('patientName').notEmpty().trim().withMessage('patientName is required.'),
        body('medications').notEmpty().trim().withMessage('medications field is required.')
    ],
    runValidation,
    ctrl.issuePrescription
);

// PATCH /api/v1/prescriptions/:id/status — Doctor or Admin
router.patch('/:id/status',
    requireAuth('admin', 'doctor'),
    [body('status').notEmpty().withMessage('status is required.')],
    runValidation,
    ctrl.updatePrescriptionStatus
);

// DELETE /api/v1/prescriptions/:id — Doctor (own) or Admin
router.delete('/:id', requireAuth('admin', 'doctor'), ctrl.cancelPrescription);

module.exports = router;
