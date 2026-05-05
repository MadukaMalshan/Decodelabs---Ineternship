-- MediTrack Database Schema
-- PostgreSQL 12+
-- Database: meditrack

-- ============================================================================
-- DROP EXISTING TABLES (for clean migration)
-- ============================================================================
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS inpatients CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS specialties CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;

-- ============================================================================
-- SPECIALTIES TABLE
-- ============================================================================
CREATE TABLE specialties (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DOCTORS (STAFF) TABLE
-- ============================================================================
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    specialty_id VARCHAR(50) NOT NULL,
    shift VARCHAR(50) NOT NULL CHECK (shift IN ('Morning', 'Evening', 'Night')),
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Busy', 'Offline')),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    department VARCHAR(100),
    license_number VARCHAR(100) UNIQUE,
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE RESTRICT
);

-- ============================================================================
-- PATIENTS TABLE
-- ============================================================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    blood_type VARCHAR(5) CHECK (blood_type IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
    gender VARCHAR(10),
    address TEXT,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    medical_history TEXT,
    allergies TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    type VARCHAR(100) NOT NULL CHECK (type IN ('Checkup', 'Follow-up', 'Consultation', 'Emergency', 'Surgery')),
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Waiting', 'In Progress', 'Completed', 'Cancelled')),
    notes TEXT,
    reason_for_visit VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    CONSTRAINT future_appointment CHECK (appointment_date >= CURRENT_DATE)
);

-- ============================================================================
-- INPATIENTS TABLE
-- ============================================================================
CREATE TABLE inpatients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    attending_doctor_id UUID NOT NULL,
    ward VARCHAR(100) NOT NULL,
    room_number VARCHAR(20),
    bed_number VARCHAR(20),
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    discharge_date DATE,
    diagnosis VARCHAR(500) NOT NULL,
    medical_condition VARCHAR(50) NOT NULL CHECK (medical_condition IN ('Stable', 'Critical', 'Improving', 'Deteriorating')),
    treatment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (attending_doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    CONSTRAINT discharge_after_admission CHECK (discharge_date IS NULL OR discharge_date >= admission_date)
);

-- ============================================================================
-- PRESCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL CHECK (frequency IN ('Once daily', 'Twice daily', 'Thrice daily', 'Four times daily', 'As needed')),
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    instructions TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Dispensed', 'Completed', 'Cancelled')),
    refills_remaining INTEGER DEFAULT 0 CHECK (refills_remaining >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    CONSTRAINT expiry_after_issue CHECK (expiry_date > issued_date)
);

-- ============================================================================
-- INVENTORY TABLE
-- ============================================================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('PPE', 'Hygiene', 'Pharmacy', 'Supplies', 'Equipment', 'Other')),
    quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    unit_of_measure VARCHAR(50) NOT NULL,
    reorder_level INTEGER NOT NULL CHECK (reorder_level > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Good' CHECK (status IN ('Good', 'Low', 'Critical')),
    supplier VARCHAR(255),
    unit_cost DECIMAL(10, 2),
    expiry_date DATE,
    batch_number VARCHAR(100),
    location_in_warehouse VARCHAR(100),
    last_restocked DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX idx_doctors_status ON doctors(status);
CREATE INDEX idx_doctors_email ON doctors(email);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_inpatients_patient ON inpatients(patient_id);
CREATE INDEX idx_inpatients_doctor ON inpatients(attending_doctor_id);
CREATE INDEX idx_inpatients_discharge ON inpatients(discharge_date);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_status ON inventory(status);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert Specialties
INSERT INTO specialties (id, name, icon) VALUES
('cardio', 'Cardiology', 'fa-heart-pulse'),
('neuro', 'Neurology', 'fa-brain'),
('ortho', 'Orthopedics', 'fa-bone'),
('pedia', 'Pediatrics', 'fa-baby'),
('derma', 'Dermatology', 'fa-disease'),
('optha', 'Ophthalmology', 'fa-eye');

-- Insert Doctors
INSERT INTO doctors (name, specialty_id, shift, status, email, phone, department, hire_date) VALUES
('Dr. Sarah Connor', 'cardio', 'Morning', 'Available', 'sarah.connor@meditrack.com', '+94 71 234 5678', 'Cardiology', '2023-01-15'),
('Dr. John Smith', 'neuro', 'Evening', 'Busy', 'john.smith@meditrack.com', '+94 71 234 5679', 'Neurology', '2022-06-20'),
('Dr. Emily Chen', 'pedia', 'Morning', 'Available', 'emily.chen@meditrack.com', '+94 71 234 5680', 'Pediatrics', '2023-03-10'),
('Dr. Michael Lee', 'ortho', 'Night', 'Offline', 'michael.lee@meditrack.com', '+94 71 234 5681', 'Orthopedics', '2021-11-05');

-- Insert Patients
INSERT INTO patients (name, email, phone, date_of_birth, blood_type, gender, address, emergency_contact, emergency_phone, allergies) VALUES
('Alice Johnson', 'alice@email.com', '+94 77 111 2222', '1990-03-15', 'O+', 'Female', '123 Main St', 'John Johnson', '+94 77 111 2223', 'Penicillin'),
('Bob Williams', 'bob@email.com', '+94 77 333 4444', '1985-07-22', 'A+', 'Male', '456 Oak Ave', 'Sarah Williams', '+94 77 333 4445', NULL),
('Charlie Brown', 'charlie@email.com', '+94 77 555 6666', '1998-01-10', 'B+', 'Male', '789 Pine Rd', 'Mary Brown', '+94 77 555 6667', 'Aspirin');

-- Insert Appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, status, reason_for_visit) VALUES
((SELECT id FROM patients WHERE email = 'alice@email.com'), (SELECT id FROM doctors WHERE email = 'emily.chen@meditrack.com'), '2026-05-10', '09:00:00', 'Checkup', 'Scheduled', 'Annual checkup'),
((SELECT id FROM patients WHERE email = 'bob@email.com'), (SELECT id FROM doctors WHERE email = 'sarah.connor@meditrack.com'), '2026-05-10', '10:30:00', 'Follow-up', 'Scheduled', 'Hypertension follow-up'),
((SELECT id FROM patients WHERE email = 'charlie@email.com'), (SELECT id FROM doctors WHERE email = 'john.smith@meditrack.com'), '2026-05-10', '11:45:00', 'Consultation', 'Waiting', 'Headache concerns');

-- Insert Inpatients
INSERT INTO inpatients (patient_id, attending_doctor_id, ward, room_number, bed_number, admission_date, diagnosis, medical_condition, treatment_notes) VALUES
((SELECT id FROM patients WHERE email = 'alice@email.com'), (SELECT id FROM doctors WHERE email = 'sarah.connor@meditrack.com'), 'Ward A', '102', 'A-102-1', '2026-05-01', 'Pneumonia', 'Stable', 'Responding well to antibiotics'),
((SELECT id FROM patients WHERE email = 'bob@email.com'), (SELECT id FROM doctors WHERE email = 'john.smith@meditrack.com'), 'ICU', '4', 'ICU-4-1', '2026-05-02', 'Post-surgery observation', 'Critical', 'Monitoring vital signs closely');

-- Insert Prescriptions  
INSERT INTO prescriptions (patient_id, doctor_id, medication_name, dosage, frequency, duration_days, issued_date, expiry_date, instructions, status, refills_remaining) VALUES
((SELECT id FROM patients WHERE email = 'alice@email.com'), (SELECT id FROM doctors WHERE email = 'sarah.connor@meditrack.com'), 'Amoxicillin', '500mg', 'Twice daily', 7, '2026-05-02', '2026-06-02', 'Take with food', 'Dispensed', 2),
((SELECT id FROM patients WHERE email = 'bob@email.com'), (SELECT id FROM doctors WHERE email = 'sarah.connor@meditrack.com'), 'Lisinopril', '10mg', 'Once daily', 30, '2026-05-03', '2026-06-03', 'Take in morning', 'Pending', 11);

-- Insert Inventory
INSERT INTO inventory (item_name, category, quantity_in_stock, unit_of_measure, reorder_level, status, supplier, unit_cost, batch_number, location_in_warehouse) VALUES
('Surgical Masks', 'PPE', 1500, 'pieces', 500, 'Good', 'MedSupply Co', 0.50, 'BATCH-2024-001', 'A1'),
('Hand Sanitizer', 'Hygiene', 120, 'bottles', 200, 'Low', 'CleanCare Inc', 5.00, 'BATCH-2024-002', 'B2'),
('Amoxicillin 500mg', 'Pharmacy', 45, 'boxes', 100, 'Critical', 'PharmaPro Ltd', 25.00, 'BATCH-2024-003', 'C1'),
('Bandages', 'Supplies', 800, 'rolls', 200, 'Good', 'MedSupply Co', 2.00, 'BATCH-2024-004', 'A3');

-- ============================================================================
-- DONE
-- ============================================================================
