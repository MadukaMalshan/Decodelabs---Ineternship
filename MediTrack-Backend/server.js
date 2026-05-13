// server.js — MediTrack API Entry Point
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { healthCheck } = require('./src/db/pool');

const appointmentRoutes = require('./src/routes/appointments.routes');
const doctorRoutes = require('./src/routes/doctors.routes');
const inventoryRoutes = require('./src/routes/inventory.routes');
const prescriptionRoutes = require('./src/routes/prescriptions.routes');
const patientRoutes = require('./src/routes/patients.routes');
const authRoutes = require('./src/routes/auth.routes');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({
    // Allow all dev origins: Live Server, file://, custom ports
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Role', 'X-User-Id']
}));
app.use(express.json());
app.use(morgan('dev')); // HTTP request logger

// ─── Health Check Endpoints ────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'MediTrack API is running 🏥',
        version: '1.0.0',
        endpoints: {
            health:       '/health',
            appointments: '/api/v1/appointments',
            doctors:      '/api/v1/doctors',
            inventory:    '/api/v1/inventory',
            prescriptions:'/api/v1/prescriptions',
            patients:     '/api/v1/patients'
        }
    });
});

// Database health check
app.get('/health', async (req, res) => {
    try {
        const isHealthy = await healthCheck();
        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            database: isHealthy ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/appointments',  appointmentRoutes);
app.use('/api/v1/doctors',       doctorRoutes);
app.use('/api/v1/inventory',     inventoryRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/patients',      patientRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);  // 404 for unmatched routes
app.use(errorHandler);     // Global error handler

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🏥  MediTrack API Server`);
    console.log(`✅  Running at http://localhost:${PORT}`);
    console.log(`📋  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️   Database: ${process.env.DB_NAME || 'meditrack'}`);
    console.log(`📊  Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app;

