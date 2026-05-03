// app.js - Centralized logic for MediTrack

// --- Mock Data ---
const mockSpecialties = [
    { id: 'cardio', name: 'Cardiology', icon: 'fa-heart-pulse' },
    { id: 'neuro', name: 'Neurology', icon: 'fa-brain' },
    { id: 'ortho', name: 'Orthopedics', icon: 'fa-bone' },
    { id: 'pedia', name: 'Pediatrics', icon: 'fa-baby' },
    { id: 'derma', name: 'Dermatology', icon: 'fa-disease' },
    { id: 'optha', name: 'Ophthalmology', icon: 'fa-eye' }
];

let mockDoctors = [
    { id: 'd1', name: 'Dr. Sarah Connor', specialty: 'cardio', shift: 'Morning', status: 'Available' },
    { id: 'd2', name: 'Dr. John Smith', specialty: 'neuro', shift: 'Evening', status: 'Busy' },
    { id: 'd3', name: 'Dr. Emily Chen', specialty: 'pedia', shift: 'Morning', status: 'Available' },
    { id: 'd4', name: 'Dr. Michael Lee', specialty: 'ortho', shift: 'Night', status: 'Offline' },
];

const mockAppointments = [
    { id: 'a1', patientName: 'Alice Johnson', time: '09:00 AM', type: 'Checkup', status: 'Waiting' },
    { id: 'a2', patientName: 'Bob Williams', time: '10:30 AM', type: 'Follow-up', status: 'Scheduled' },
    { id: 'a3', patientName: 'Charlie Brown', time: '11:45 AM', type: 'Consultation', status: 'Scheduled' }
];

let mockInventory = [
    { id: 'i1', item: 'Surgical Masks', category: 'PPE', stock: 1500, status: 'Good' },
    { id: 'i2', item: 'Hand Sanitizer', category: 'Hygiene', stock: 120, status: 'Low' },
    { id: 'i3', item: 'Amoxicillin 500mg', category: 'Pharmacy', stock: 45, status: 'Critical' },
    { id: 'i4', item: 'Bandages', category: 'Supplies', stock: 800, status: 'Good' }
];

const mockPatientHistory = [
    { date: '2025-01-15', diagnosis: 'Mild Hypertension', treatment: 'Prescribed Lisinopril 10mg. Recommended low sodium diet.' },
    { date: '2024-08-22', diagnosis: 'Routine Checkup', treatment: 'All vitals normal. Blood tests show good cholesterol levels.' },
    { date: '2023-11-05', diagnosis: 'Sprained Ankle', treatment: 'Rest, ice, compression, and elevation (RICE). Prescribed Ibuprofen.' }
];

let mockInpatients = [
    { id: 'p1', name: "John Doe", ward: "Ward A - Room 102", date: "2026-05-01", diagnosis: "Pneumonia", condition: "Stable" },
    { id: 'p2', name: "Jane Smith", ward: "ICU - Bed 4", date: "2026-05-02", diagnosis: "Post-surgery observation", condition: "Critical" },
    { id: 'p3', name: "Michael Johnson", ward: "Ward B - Room 205", date: "2026-04-28", diagnosis: "Fractured Femur", condition: "Improving" }
];

let mockPrescriptions = [
    { id: 'rx1', patient: "Alice Johnson", date: "2026-05-02", meds: "Amoxicillin 500mg", status: "Dispensed" },
    { id: 'rx2', patient: "Bob Williams", date: "2026-05-03", meds: "Lisinopril 10mg", status: "Pending" }
];

let mockBookings = [
    { id: 'b1', doctor: "Dr. Emily Chen", specialty: "Pediatrics", datetime: "2026-05-10, 09:00 AM", status: "Scheduled" },
    { id: 'b2', doctor: "Dr. Sarah Connor", specialty: "Cardiology", datetime: "2026-04-20, 10:30 AM", status: "Completed" },
    { id: 'b3', doctor: "Dr. Michael Lee", specialty: "Orthopedics", datetime: "2026-03-15, 02:15 PM", status: "Cancelled" }
];

const mockQueueStatus = {
    totalWaiting: 14,
    avgWaitTime: '25 mins',
    activeDoctors: 8,
    emergencyCases: 1
};

// --- Initialization & Routing ---
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initModal();
    
    const path = window.location.pathname;
    if (path.includes('admin.html')) {
        renderAdminDashboard();
    } else if (path.includes('doctor.html')) {
        renderDoctorDashboard();
    } else if (path.includes('patient.html')) {
        renderPatientDashboard();
    } else {
        initNetworkAnimation();
    }
});

// --- Sidebar Logic (Mobile) ---
function initSidebar() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuBtn && sidebar && overlay) {
        const toggleSidebar = () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        };

        menuBtn.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);
    }
}

// --- Utilities ---
function getBadgeClass(status) {
    const s = status.toLowerCase();
    if (['available', 'active', 'good'].includes(s)) return 'badge-success';
    if (['busy', 'low', 'waiting'].includes(s)) return 'badge-warning';
    if (['offline', 'critical'].includes(s)) return 'badge-danger';
    return 'badge-success';
}

// --- SPA Routing Logic ---
function initSPA() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-target]');
    const views = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active to clicked nav item
            item.classList.add('active');

            // Hide all views
            views.forEach(view => {
                view.classList.remove('active');
            });

            // Show target view
            const targetId = item.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.add('active');
            }

            // Close sidebar on mobile after click
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (window.innerWidth < 1024 && sidebar && overlay) {
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
            }
        });
    });
}

// --- Admin Dashboard Logic ---
function renderAdminDashboard() {
    initSPA();
    
    const staffSearchQuery = document.getElementById('staff-search-input')?.value.toLowerCase() || '';
    const inventorySearchQuery = document.getElementById('inventory-search-input')?.value.toLowerCase() || '';

    const queueMonitor = document.getElementById('queue-monitor');
    const rosterBody = document.getElementById('roster-table-body');
    const inventoryBody = document.getElementById('inventory-table-body');
    
    // New SPA Full Views
    const fullStaffBody = document.getElementById('full-staff-table-body');
    const fullInventoryBody = document.getElementById('full-inventory-table-body');

    if (queueMonitor) {
        queueMonitor.innerHTML = `
            <div class="stat-box">
                <p>Total Waiting</p>
                <h4>${mockQueueStatus.totalWaiting}</h4>
            </div>
            <div class="stat-box">
                <p>Avg Wait Time</p>
                <h4>${mockQueueStatus.avgWaitTime}</h4>
            </div>
            <div class="stat-box">
                <p>Active Doctors</p>
                <h4>${mockQueueStatus.activeDoctors}</h4>
            </div>
            <div class="stat-box">
                <p>Emergency</p>
                <h4 style="color: var(--clr-danger)">${mockQueueStatus.emergencyCases}</h4>
            </div>
        `;
    }

    if (rosterBody) {
        rosterBody.innerHTML = mockDoctors.slice(0, 3).map(doctor => `
            <tr>
                <td>${doctor.name}</td>
                <td>${mockSpecialties.find(s => s.id === doctor.specialty)?.name || 'General'}</td>
                <td>${doctor.shift}</td>
                <td><span class="badge ${getBadgeClass(doctor.status)}">${doctor.status}</span></td>
            </tr>
        `).join('');
    }

    if (inventoryBody) {
        inventoryBody.innerHTML = mockInventory.slice(0, 3).map(item => `
            <tr>
                <td>${item.item}</td>
                <td>${item.category}</td>
                <td>${item.stock}</td>
                <td><span class="badge ${getBadgeClass(item.status)}">${item.status}</span></td>
            </tr>
        `).join('');
    }

    // Render Full Staff Directory
    if (fullStaffBody) {
        let filteredStaff = mockDoctors;
        if (staffSearchQuery !== '') {
            filteredStaff = mockDoctors.filter(staff => 
                staff.name.toLowerCase().includes(staffSearchQuery) || 
                (mockSpecialties.find(s => s.id === staff.specialty)?.name || 'General').toLowerCase().includes(staffSearchQuery)
            );
        }

        if (filteredStaff.length === 0) {
            fullStaffBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem;">No staff members found matching "${staffSearchQuery}"</td></tr>`;
        } else {
            fullStaffBody.innerHTML = filteredStaff.map(staff => `
                <tr>
                    <td><div style="font-weight: 600; color: var(--clr-text-main);">${staff.name}</div></td>
                    <td>Doctor</td>
                    <td>${mockSpecialties.find(s => s.id === staff.specialty)?.name || 'General'}</td>
                    <td><i class="fa-solid fa-envelope" style="color:var(--clr-text-muted); margin-right:5px;"></i> contact@meditrack.com</td>
                    <td><span class="badge ${getBadgeClass(staff.status)}">${staff.status}</span></td>
                    <td>
                        <button class="btn" onclick="openEditStaffModal('${staff.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: rgba(13, 148, 136, 0.1); color: var(--clr-btn-primary); margin-right: 0.5rem;"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button class="btn" onclick="deleteStaff('${staff.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: rgba(220, 38, 38, 0.1); color: var(--clr-danger);"><i class="fa-solid fa-trash"></i> Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // Render Full Inventory Management
    if (fullInventoryBody) {
        let filteredInventory = mockInventory;
        if (inventorySearchQuery !== '') {
            filteredInventory = mockInventory.filter(item => 
                item.item.toLowerCase().includes(inventorySearchQuery) || 
                item.category.toLowerCase().includes(inventorySearchQuery)
            );
        }

        if (filteredInventory.length === 0) {
            fullInventoryBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem;">No inventory items found matching "${inventorySearchQuery}"</td></tr>`;
        } else {
            fullInventoryBody.innerHTML = filteredInventory.map(item => `
                <tr>
                    <td style="font-family: monospace; color: var(--clr-text-muted);">${item.id.toUpperCase()}</td>
                    <td><div style="font-weight: 600; color: var(--clr-text-main);">${item.item}</div></td>
                    <td>${item.category}</td>
                    <td>${item.stock} units</td>
                    <td>Today, 08:30 AM</td>
                    <td><span class="badge ${getBadgeClass(item.status)}">${item.status}</span></td>
                    <td>
                        <button class="btn" onclick="openEditInventoryModal('${item.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: rgba(13, 148, 136, 0.1); color: var(--clr-btn-primary); margin-right: 0.5rem;"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button class="btn" onclick="deleteInventory('${item.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: rgba(220, 38, 38, 0.1); color: var(--clr-danger);"><i class="fa-solid fa-trash"></i> Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

// --- Doctor Dashboard Logic ---
function renderDoctorDashboard() {
    initSPA();

    const appointmentsList = document.getElementById('appointments-list');
    const availabilityCheckbox = document.getElementById('availability-checkbox');
    const availabilityStatus = document.getElementById('availability-status');
    const inpatientsBody = document.getElementById('inpatients-table-body');
    const recentPrescriptionsBody = document.getElementById('recent-prescriptions-body');
    
    // Render Appointments
    if (appointmentsList) {
        appointmentsList.innerHTML = mockAppointments.map(appt => `
            <li class="appointment-item">
                <div class="appointment-info">
                    <h4>${appt.patientName}</h4>
                    <p><i class="fa-regular fa-clock"></i> ${appt.time} - ${appt.type}</p>
                </div>
                <button class="btn-icon view-history-btn" data-patient="${appt.patientName}" title="View Medical History">
                    <i class="fa-solid fa-file-medical"></i>
                </button>
            </li>
        `).join('');

        document.querySelectorAll('.view-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const patientName = e.currentTarget.dataset.patient;
                openHistoryModal(patientName);
            });
        });
    }

    // Availability Toggle
    if (availabilityCheckbox && availabilityStatus) {
        availabilityCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                availabilityStatus.textContent = 'Available';
                availabilityStatus.style.color = 'var(--clr-success)';
            } else {
                availabilityStatus.textContent = 'Offline';
                availabilityStatus.style.color = 'var(--clr-danger)';
            }
        });
    }

    // Render Inpatients
    if (inpatientsBody) {
        const searchInput = document.getElementById('inpatient-search-input');
        const query = searchInput ? searchInput.value.toLowerCase() : '';
        
        let filteredInpatients = mockInpatients;
        if (query) {
            filteredInpatients = mockInpatients.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.diagnosis.toLowerCase().includes(query)
            );
        }

        if (filteredInpatients.length === 0) {
            inpatientsBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem;">No patients found matching "${query}"</td></tr>`;
        } else {
            inpatientsBody.innerHTML = filteredInpatients.map(patient => `
                <tr>
                    <td><div style="font-weight: 600; color: var(--clr-text-main);">${patient.name}</div></td>
                    <td>${patient.ward}</td>
                    <td>${patient.date}</td>
                    <td>${patient.diagnosis}</td>
                    <td><span class="badge ${patient.condition === 'Critical' ? 'badge-danger' : 'badge-success'}">${patient.condition}</span></td>
                    <td>
                        <button class="btn" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: rgba(13, 148, 136, 0.1); color: var(--clr-btn-primary); margin-right: 0.5rem;" onclick="alert('Viewing Vitals for ${patient.name}')">Vitals</button>
                        <button class="btn" onclick="openEditInpatientModal('${patient.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: rgba(13, 148, 136, 0.1); color: var(--clr-btn-primary); margin-right: 0.5rem;"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn" onclick="dischargePatient('${patient.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: rgba(220, 38, 38, 0.1); color: var(--clr-danger);">Discharge</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // Render Recent Prescriptions
    if (recentPrescriptionsBody) {
        recentPrescriptionsBody.innerHTML = mockPrescriptions.map(rx => `
            <tr>
                <td><div style="font-weight: 600; color: var(--clr-text-main);">${rx.patient}</div></td>
                <td>${rx.date}</td>
                <td>${rx.meds}</td>
                <td><span class="badge ${rx.status === 'Dispensed' ? 'badge-success' : 'badge-warning'}">${rx.status}</span></td>
                <td>
                    <button class="btn" onclick="cancelPrescription('${rx.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: rgba(220, 38, 38, 0.1); color: var(--clr-danger);"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }
}

// --- Patient Dashboard Logic ---
function renderPatientDashboard() {
    initSPA();

    const waitingRoom = document.getElementById('waiting-room-status');
    const specialtyFilter = document.getElementById('specialty-filter');
    const specialtiesGrid = document.getElementById('specialties-grid');
    const doctorSelect = document.getElementById('doctor-select');
    
    const patientBookingsBody = document.getElementById('patient-bookings-body');
    const patientRecordsBody = document.getElementById('patient-records-body');

    // Render Waiting Room
    if (waitingRoom) {
        waitingRoom.innerHTML = `
            <div class="waiting-room-status">
                <p>Your estimated wait time is</p>
                <h4>12 mins</h4>
                <p>You are <strong>#3</strong> in the queue.</p>
            </div>
        `;
    }

    // Render Specialties Form Dropdown
    if (specialtyFilter) {
        specialtyFilter.innerHTML = '<option value="">Select a specialty</option>' + 
            mockSpecialties.map(spec => `<option value="${spec.id}">${spec.name}</option>`).join('');

        specialtyFilter.addEventListener('change', (e) => {
            const specialtyId = e.target.value;
            doctorSelect.innerHTML = '<option value="">Select a doctor</option>';
            
            if (specialtyId) {
                doctorSelect.disabled = false;
                const filteredDoctors = mockDoctors.filter(d => d.specialty === specialtyId);
                if(filteredDoctors.length === 0) {
                     doctorSelect.innerHTML = '<option value="">No doctors available</option>';
                     doctorSelect.disabled = true;
                } else {
                    filteredDoctors.forEach(doctor => {
                        doctorSelect.innerHTML += `<option value="${doctor.id}">${doctor.name}</option>`;
                    });
                }
            } else {
                doctorSelect.disabled = true;
                doctorSelect.innerHTML = '<option value="">First select a specialty</option>';
            }
        });
    }

    // Render Specialties Grid
    if (specialtiesGrid) {
        specialtiesGrid.innerHTML = mockSpecialties.map(spec => `
            <div class="specialty-item" onclick="document.getElementById('specialty-filter').value='${spec.id}'; document.getElementById('specialty-filter').dispatchEvent(new Event('change')); window.scrollTo({top: 0, behavior: 'smooth'});">
                <i class="fa-solid ${spec.icon}"></i>
                <h4>${spec.name}</h4>
            </div>
        `).join('');
    }

    // Render Patient Bookings
    if (patientBookingsBody) {
        if (mockBookings.length === 0) {
            patientBookingsBody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 2rem; color: var(--clr-text-muted);">No bookings yet. <a href="#" data-target="view-home" style="color: var(--clr-btn-primary);">Book an appointment</a>.</td></tr>`;
        } else {
            patientBookingsBody.innerHTML = mockBookings.map(b => `
                <tr>
                    <td><div style="font-weight: 600; color: var(--clr-text-main);">${b.doctor}</div></td>
                    <td>${b.specialty}</td>
                    <td>${b.datetime}</td>
                    <td><span class="badge ${b.status === 'Scheduled' ? 'badge-warning' : b.status === 'Completed' ? 'badge-success' : 'badge-danger'}">${b.status}</span></td>
                    <td>
                        ${b.status === 'Scheduled' ?
                        `<button class="btn btn-accent" onclick="rescheduleBooking('${b.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; margin-right: 0.5rem;">Reschedule</button>
                         <button class="btn" onclick="cancelBooking('${b.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: rgba(220, 38, 38, 0.1); color: var(--clr-danger);">Cancel</button>` :
                        `<span style="color: var(--clr-text-muted); font-size: 0.9rem;">No actions</span>`}
                    </td>
                </tr>
            `).join('');
        }
    }

    // Render Patient Medical Records
    if (patientRecordsBody) {
        patientRecordsBody.innerHTML = mockPatientHistory.map(record => `
            <tr>
                <td><div style="font-weight: 600; color: var(--clr-text-main);">${record.date}</div></td>
                <td>${record.diagnosis}</td>
                <td>${record.treatment}</td>
                <td>
                    <button class="btn" onclick="alert('Downloading report for: ${record.diagnosis}...')" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: rgba(13, 148, 136, 0.1); color: var(--clr-btn-primary);">
                        <i class="fa-solid fa-file-pdf"></i> Download PDF
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Booking form submission
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.onsubmit = (e) => {
            e.preventDefault();
            const doctorSelect = document.getElementById('doctor-select');
            const specialtyFilter = document.getElementById('specialty-filter');
            const dateInput = document.getElementById('appointment-date');

            const selectedDoctor = doctorSelect.options[doctorSelect.selectedIndex]?.text;
            const selectedSpecialty = specialtyFilter.options[specialtyFilter.selectedIndex]?.text;
            const selectedDate = dateInput.value;

            if (!selectedDoctor || doctorSelect.value === '' || !selectedDate) {
                alert('Please select a specialty, doctor, and date.');
                return;
            }

            const newBooking = {
                id: 'b' + Date.now(),
                doctor: selectedDoctor,
                specialty: selectedSpecialty,
                datetime: selectedDate + ', 09:00 AM',
                status: 'Scheduled'
            };
            mockBookings.unshift(newBooking);
            alert(`Appointment with ${selectedDoctor} on ${selectedDate} booked successfully!`);
            bookingForm.reset();
            doctorSelect.innerHTML = '<option value="">First select a specialty</option>';
            doctorSelect.disabled = true;
        };
    }

    // Settings form
    const settingsForm = document.querySelector('#view-settings form');
    if (settingsForm) {
        settingsForm.onsubmit = (e) => {
            e.preventDefault();
            const nameInput = settingsForm.querySelector('input[type="text"]');
            const newName = nameInput?.value;
            if (newName) {
                const sidebarName = document.querySelector('.user-name');
                if (sidebarName) sidebarName.textContent = newName;
            }
            alert('Profile details saved successfully!');
        };
    }
}

// --- Modal Utilities ---
function initModal() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const closeBtns = modal.querySelectorAll('.close-modal');
        
        const closeModal = () => modal.classList.remove('show');
        
        closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
        });
    });
}

function openHistoryModal(patientName) {
    const modal = document.getElementById('medical-history-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-history-content');

    if (modal && title && content) {
        title.textContent = `Medical History: ${patientName}`;
        
        content.innerHTML = mockPatientHistory.map(entry => `
            <div class="history-entry">
                <div class="date">${entry.date}</div>
                <h5>Diagnosis: ${entry.diagnosis}</h5>
                <p>${entry.treatment}</p>
            </div>
        `).join('');

        modal.classList.add('show');
    }
}

// --- Staff Directory CRUD Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Search Listener
    const staffSearchInput = document.getElementById('staff-search-input');
    if (staffSearchInput) {
        staffSearchInput.addEventListener('input', () => renderAdminDashboard());
    }

    // Add Staff Listener
    const addStaffForm = document.getElementById('add-staff-form');
    if (addStaffForm) {
        addStaffForm.onsubmit = (e) => {
            e.preventDefault();
            const inputs = addStaffForm.querySelectorAll('input, select');
            const newStaff = {
                id: 'd' + Date.now(),
                name: (inputs[1].value === 'Doctor' ? 'Dr. ' : '') + inputs[0].value,
                specialty: inputs[2].value,
                shift: 'Morning',
                status: 'Available'
            };
            mockDoctors.push(newStaff);
            document.getElementById('add-staff-modal').classList.remove('show');
            alert('New staff member added successfully!');
            addStaffForm.reset();
            renderAdminDashboard();
        };
    }

    // Edit Staff Listener
    const editStaffForm = document.getElementById('edit-staff-form');
    if (editStaffForm) {
        editStaffForm.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-staff-id').value;
            const index = mockDoctors.findIndex(d => d.id === id);
            if (index !== -1) {
                mockDoctors[index].name = document.getElementById('edit-staff-name').value;
                mockDoctors[index].specialty = document.getElementById('edit-staff-specialty').value;
                mockDoctors[index].shift = document.getElementById('edit-staff-shift').value;
                
                document.getElementById('edit-staff-modal').classList.remove('show');
                renderAdminDashboard();
            }
        };
    }
});

function openEditStaffModal(id) {
    const staff = mockDoctors.find(d => d.id === id);
    if (staff) {
        document.getElementById('edit-staff-id').value = staff.id;
        document.getElementById('edit-staff-name').value = staff.name;
        document.getElementById('edit-staff-specialty').value = staff.specialty || '';
        document.getElementById('edit-staff-shift').value = staff.shift || 'Morning';
        
        document.getElementById('edit-staff-modal').classList.add('show');
    }
}

function deleteStaff(id) {
    if (confirm("Are you sure you want to delete this staff member?")) {
        const index = mockDoctors.findIndex(d => d.id === id);
        if (index !== -1) {
            mockDoctors.splice(index, 1);
            renderAdminDashboard();
        }
    }
}

// --- Inventory CRUD Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Search Listener
    const inventorySearchInput = document.getElementById('inventory-search-input');
    if (inventorySearchInput) {
        inventorySearchInput.addEventListener('input', () => renderAdminDashboard());
    }

    // Add Inventory Listener
    const addInventoryForm = document.getElementById('add-inventory-form');
    if (addInventoryForm) {
        addInventoryForm.onsubmit = (e) => {
            e.preventDefault();
            const inputs = addInventoryForm.querySelectorAll('input, select');
            const newItem = {
                id: 'i' + Math.floor(Math.random() * 1000),
                item: inputs[0].value,
                category: inputs[1].value,
                stock: parseInt(inputs[2].value) || 0,
                status: inputs[3].value
            };
            mockInventory.push(newItem);
            document.getElementById('add-inventory-modal').classList.remove('show');
            alert('New inventory item added successfully!');
            addInventoryForm.reset();
            renderAdminDashboard();
        };
    }

    // Edit Inventory Listener
    const editInventoryForm = document.getElementById('edit-inventory-form');
    if (editInventoryForm) {
        editInventoryForm.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-inventory-id').value;
            const index = mockInventory.findIndex(i => i.id === id);
            if (index !== -1) {
                mockInventory[index].item = document.getElementById('edit-inventory-item').value;
                mockInventory[index].category = document.getElementById('edit-inventory-category').value;
                mockInventory[index].stock = parseInt(document.getElementById('edit-inventory-stock').value) || 0;
                mockInventory[index].status = document.getElementById('edit-inventory-status').value;
                
                document.getElementById('edit-inventory-modal').classList.remove('show');
                renderAdminDashboard();
            }
        };
    }
});

function openEditInventoryModal(id) {
    const item = mockInventory.find(i => i.id === id);
    if (item) {
        document.getElementById('edit-inventory-id').value = item.id;
        document.getElementById('edit-inventory-item').value = item.item;
        document.getElementById('edit-inventory-category').value = item.category;
        document.getElementById('edit-inventory-stock').value = item.stock;
        document.getElementById('edit-inventory-status').value = item.status;
        
        document.getElementById('edit-inventory-modal').classList.add('show');
    }
}

function deleteInventory(id) {
    if (confirm("Are you sure you want to delete this inventory item?")) {
        const index = mockInventory.findIndex(i => i.id === id);
        if (index !== -1) {
            mockInventory.splice(index, 1);
            renderAdminDashboard();
        }
    }
}

// --- Inpatient CRUD Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Search Listener
    const inpatientSearchInput = document.getElementById('inpatient-search-input');
    if (inpatientSearchInput) {
        inpatientSearchInput.addEventListener('input', () => renderDoctorDashboard());
    }

    // Admit Patient Listener
    const admitPatientForm = document.getElementById('admit-patient-form');
    if (admitPatientForm) {
        admitPatientForm.onsubmit = (e) => {
            e.preventDefault();
            const inputs = admitPatientForm.querySelectorAll('input, select');
            const today = new Date();
            const newPatient = {
                id: 'p' + Date.now(),
                name: inputs[0].value,
                ward: inputs[1].value,
                diagnosis: inputs[2].value,
                condition: inputs[3].value,
                date: today.toISOString().split('T')[0]
            };
            mockInpatients.push(newPatient);
            document.getElementById('admit-patient-modal').classList.remove('show');
            alert('Patient admitted successfully!');
            admitPatientForm.reset();
            renderDoctorDashboard();
        };
    }

    // Edit Inpatient Listener
    const editInpatientForm = document.getElementById('edit-inpatient-form');
    if (editInpatientForm) {
        editInpatientForm.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-inpatient-id').value;
            const index = mockInpatients.findIndex(p => p.id === id);
            if (index !== -1) {
                mockInpatients[index].name = document.getElementById('edit-inpatient-name').value;
                mockInpatients[index].ward = document.getElementById('edit-inpatient-ward').value;
                mockInpatients[index].diagnosis = document.getElementById('edit-inpatient-diagnosis').value;
                mockInpatients[index].condition = document.getElementById('edit-inpatient-condition').value;
                
                document.getElementById('edit-inpatient-modal').classList.remove('show');
                renderDoctorDashboard();
            }
        };
    }
});

function openEditInpatientModal(id) {
    const patient = mockInpatients.find(p => p.id === id);
    if (patient) {
        document.getElementById('edit-inpatient-id').value = patient.id;
        document.getElementById('edit-inpatient-name').value = patient.name;
        document.getElementById('edit-inpatient-ward').value = patient.ward;
        document.getElementById('edit-inpatient-diagnosis').value = patient.diagnosis;
        document.getElementById('edit-inpatient-condition').value = patient.condition;
        
        document.getElementById('edit-inpatient-modal').classList.add('show');
    }
}

function dischargePatient(id) {
    if (confirm("Are you sure you want to discharge this patient?")) {
        const index = mockInpatients.findIndex(p => p.id === id);
        if (index !== -1) {
            mockInpatients.splice(index, 1);
            renderDoctorDashboard();
        }
    }
}

// --- Patient Booking CRUD Logic ---
function cancelBooking(id) {
    if (confirm("Are you sure you want to cancel this appointment?")) {
        const index = mockBookings.findIndex(b => b.id === id);
        if (index !== -1) {
            mockBookings[index].status = 'Cancelled';
            renderPatientDashboard();
        }
    }
}

function rescheduleBooking(id) {
    const booking = mockBookings.find(b => b.id === id);
    if (booking) {
        alert(`Reschedule feature: Please contact the clinic to reschedule your appointment with ${booking.doctor}.`);
    }
}

// --- Network Animation (Landing Page) ---
function initNetworkAnimation() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    function resize() {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.radius = Math.random() * 2 + 1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            // Mix Teal and Coral colors for an energetic vibe
            ctx.fillStyle = this.radius > 2 ? 'rgba(255, 107, 107, 0.8)' : 'rgba(13, 148, 136, 0.9)'; 
            ctx.fill();
        }
    }
    
    for (let i = 0; i < 80; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(13, 148, 136, ${0.8 - distance / 120})`; // Fading teal lines
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    
    animate();
}

// --- Prescription Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const prescriptionForm = document.getElementById('prescription-form');
    if (prescriptionForm) {
        prescriptionForm.onsubmit = (e) => {
            e.preventDefault();
            const patientInput = document.getElementById('patient-search');
            const medsInput = document.getElementById('medication');
            
            const newRx = {
                id: 'rx' + Date.now(),
                patient: patientInput.value,
                date: new Date().toISOString().split('T')[0],
                meds: medsInput.value,
                status: 'Pending'
            };
            
            mockPrescriptions.push(newRx);
            alert('Prescription issued successfully!');
            prescriptionForm.reset();
            renderDoctorDashboard();
        };
    }
});

function cancelPrescription(id) {
    if (confirm("Are you sure you want to cancel this prescription?")) {
        const index = mockPrescriptions.findIndex(rx => rx.id === id);
        if (index !== -1) {
            mockPrescriptions.splice(index, 1);
            renderDoctorDashboard();
        }
    }
}
