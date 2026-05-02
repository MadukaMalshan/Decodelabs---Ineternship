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

const mockDoctors = [
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

const mockInventory = [
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

const mockQueueStatus = {
    totalWaiting: 14,
    avgWaitTime: '25 mins',
    activeDoctors: 8,
    emergencyCases: 1
};

// --- Initialization & Routing ---
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    
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
        fullStaffBody.innerHTML = mockDoctors.map(staff => `
            <tr>
                <td><div style="font-weight: 600; color: var(--clr-text-main);">${staff.name}</div></td>
                <td>Doctor</td>
                <td>${mockSpecialties.find(s => s.id === staff.specialty)?.name || 'General'}</td>
                <td><i class="fa-solid fa-envelope" style="color:var(--clr-text-muted); margin-right:5px;"></i> contact@meditrack.com</td>
                <td><span class="badge ${getBadgeClass(staff.status)}">${staff.status}</span></td>
                <td>
                    <button class="btn" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: rgba(13, 148, 136, 0.1); color: var(--clr-btn-primary);"><i class="fa-solid fa-pen"></i> Edit</button>
                </td>
            </tr>
        `).join('');
    }

    // Render Full Inventory Management
    if (fullInventoryBody) {
        fullInventoryBody.innerHTML = mockInventory.map(item => `
            <tr>
                <td style="font-family: monospace; color: var(--clr-text-muted);">${item.id.toUpperCase()}</td>
                <td><div style="font-weight: 600; color: var(--clr-text-main);">${item.item}</div></td>
                <td>${item.category}</td>
                <td>${item.stock} units</td>
                <td>Today, 08:30 AM</td>
                <td><span class="badge ${getBadgeClass(item.status)}">${item.status}</span></td>
                <td>
                    <button class="btn ${item.status === 'Low' || item.status === 'Critical' ? 'btn-accent' : ''}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">
                        ${item.status === 'Low' || item.status === 'Critical' ? 'Order Stock' : 'Update'}
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

// --- Doctor Dashboard Logic ---
function renderDoctorDashboard() {
    const appointmentsList = document.getElementById('appointments-list');
    const availabilityCheckbox = document.getElementById('availability-checkbox');
    const availabilityStatus = document.getElementById('availability-status');
    const form = document.getElementById('prescription-form');
    
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

    // Form
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Prescription successfully saved and sent to pharmacy.');
            form.reset();
        });
    }
    
    initModal();
}

// --- Patient Dashboard Logic ---
function renderPatientDashboard() {
    const waitingRoom = document.getElementById('waiting-room-status');
    const specialtyFilter = document.getElementById('specialty-filter');
    const specialtiesGrid = document.getElementById('specialties-grid');
    const doctorSelect = document.getElementById('doctor-select');
    const form = document.getElementById('booking-form');

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

    // Form
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Appointment request submitted successfully!');
            form.reset();
            doctorSelect.disabled = true;
            doctorSelect.innerHTML = '<option value="">First select a specialty</option>';
        });
    }
}

// --- Modal Utilities ---
function initModal() {
    const modal = document.getElementById('medical-history-modal');
    const closeBtns = document.querySelectorAll('.close-modal');

    if (modal) {
        const closeModal = () => modal.classList.remove('show');
        
        closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
        });
    }
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
