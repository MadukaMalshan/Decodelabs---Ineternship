// src/routes/auth.routes.js — Multi-Portal Secure Authentication Routes
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Public endpoints
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// Authenticated user — theme preference persistence
router.put('/theme', ctrl.updateTheme);

// Admin validation endpoints
router.get('/admin/pending-doctors', requireAuth('admin'), ctrl.getPendingDoctors);
router.put('/admin/approve-doctor/:id', requireAuth('admin'), ctrl.approveDoctor);

module.exports = router;
