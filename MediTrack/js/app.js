// app.js - MediTrack Frontend (API-Connected)
const API = 'http://localhost:5000/api/v1';

// Role config per page
function getAuth() {
    const p = window.location.pathname;
    if (p.includes('admin.html'))   return { role: 'admin',   id: 'admin1' };
    if (p.includes('doctor.html'))  return { role: 'doctor',  id: 'd1' };
    if (p.includes('patient.html')) return { role: 'patient', id: 'pat1' };
    return { role: 'admin', id: 'admin1' };
}

async function api(endpoint, method = 'GET', body = null) {
    const auth = getAuth();
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Role': auth.role, 'X-User-Id': auth.id }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${endpoint}`, opts);
    const data = await res.json();
    if (!res.ok) {
        const msg = data.message || `Error ${res.status}`;
        alert(`⚠️ ${msg}`);
        throw new Error(msg);
    }
    return data;
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    initSidebar(); initModal();
    const p = window.location.pathname;
    if (p.includes('admin.html'))        renderAdminDashboard();
    else if (p.includes('doctor.html'))  renderDoctorDashboard();
    else if (p.includes('patient.html')) renderPatientDashboard();
    else initNetworkAnimation();
});

function initSidebar() {
    const btn = document.getElementById('mobile-menu-btn'), sb = document.getElementById('sidebar'), ov = document.getElementById('sidebar-overlay');
    if (btn && sb && ov) { const t = () => { sb.classList.toggle('open'); ov.classList.toggle('show'); }; btn.addEventListener('click', t); ov.addEventListener('click', t); }
}

function getBadgeClass(s) {
    s = s.toLowerCase();
    if (['available','active','good'].includes(s)) return 'badge-success';
    if (['busy','low','waiting'].includes(s)) return 'badge-warning';
    if (['offline','critical'].includes(s)) return 'badge-danger';
    return 'badge-success';
}

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fa-solid fa-check"></i>';
        button.style.color = 'var(--clr-success)';
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = 'var(--clr-text-muted)';
        }, 2000);
    }).catch(err => console.error('Copy failed:', err));
}

function generateTruncatedIdCell(fullId) {
    const truncated = fullId.toUpperCase().substring(0, 8);
    return `<div style="display:flex; align-items:center; gap:0.5rem; word-break:break-word;">
        <span style="font-family:monospace; color:var(--clr-text-muted);">${truncated}...</span>
        <button class="btn-icon copy-id-btn" onclick="copyToClipboard('${fullId}', this)" title="Copy full ID" style="background:none; border:none; cursor:pointer; padding:0; color:var(--clr-text-muted); font-size:0.85rem;">
            <i class="fa-solid fa-copy"></i>
        </button>
    </div>`;
}

function initSPA() {
    const navs = document.querySelectorAll('.sidebar-nav .nav-item[data-target]');
    const views = document.querySelectorAll('.view-section');
    navs.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            navs.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            views.forEach(v => v.classList.remove('active'));
            const t = document.getElementById(item.getAttribute('data-target'));
            if (t) t.classList.add('active');
            const sb = document.getElementById('sidebar'), ov = document.getElementById('sidebar-overlay');
            if (window.innerWidth < 1024 && sb && ov) { sb.classList.remove('open'); ov.classList.remove('show'); }
        });
    });
}

// ===================== ADMIN =====================
async function renderAdminDashboard() {
    initSPA();
    try {
        // Queue (still local - no backend endpoint)
        const qm = document.getElementById('queue-monitor');
        if (qm) qm.innerHTML = `<div class="stat-box"><p>Total Waiting</p><h4>14</h4></div><div class="stat-box"><p>Avg Wait Time</p><h4>25 mins</h4></div><div class="stat-box"><p>Active Doctors</p><h4>8</h4></div><div class="stat-box"><p>Emergency</p><h4 style="color:var(--clr-danger)">1</h4></div>`;

        const { data: doctors } = await api('/doctors');
        const { data: specs } = await api('/doctors/specialties');
        const specMap = {}; specs.forEach(s => specMap[s.id] = s.name);

        // Preview roster
        const rb = document.getElementById('roster-table-body');
        if (rb) rb.innerHTML = doctors.slice(0,3).map(d => `<tr><td>${d.name}</td><td>${specMap[d.specialty]||'General'}</td><td>${d.shift}</td><td><span class="badge ${getBadgeClass(d.status)}">${d.status}</span></td></tr>`).join('');

        // Full staff
        const sq = document.getElementById('staff-search-input')?.value.toLowerCase() || '';
        const filtered = sq ? doctors.filter(d => d.name.toLowerCase().includes(sq) || (specMap[d.specialty]||'').toLowerCase().includes(sq)) : doctors;
        const fb = document.getElementById('full-staff-table-body');
        if (fb) fb.innerHTML = filtered.length === 0 ? `<tr><td colspan="6" class="text-center" style="padding:2rem">No results</td></tr>` :
            filtered.map(s => `<tr><td><div style="font-weight:600;color:var(--clr-text-main)">${s.name}</div></td><td>Doctor</td><td>${specMap[s.specialty]||'General'}</td><td><i class="fa-solid fa-envelope" style="color:var(--clr-text-muted);margin-right:5px"></i>${s.email||'N/A'}</td><td><span class="badge ${getBadgeClass(s.status)}">${s.status}</span></td><td><button class="btn" onclick="openEditStaffModal('${s.id}')" style="padding:0.2rem 0.5rem;font-size:0.8rem;background:rgba(13,148,136,0.1);color:var(--clr-btn-primary);margin-right:0.5rem"><i class="fa-solid fa-pen"></i> Edit</button><button class="btn" onclick="deleteStaff('${s.id}')" style="padding:0.2rem 0.5rem;font-size:0.8rem;background:rgba(220,38,38,0.1);color:var(--clr-danger)"><i class="fa-solid fa-trash"></i> Delete</button></td></tr>`).join('');

        // Full inventory
        const { data: inv } = await api('/inventory');
        const iq = document.getElementById('inventory-search-input')?.value.toLowerCase() || '';
        const fInv = iq ? inv.filter(i => i.item.toLowerCase().includes(iq) || i.category.toLowerCase().includes(iq)) : inv;
        const ib = document.getElementById('full-inventory-table-body');
        if (ib) ib.innerHTML = fInv.length === 0 ? `<tr><td colspan="7" class="text-center" style="padding:2rem">No results</td></tr>` :
            fInv.map(i => `<tr><td style="font-family:monospace;color:var(--clr-text-muted);word-break:break-all">${generateTruncatedIdCell(i.id)}</td><td><div style="font-weight:600;color:var(--clr-text-main)">${i.item}</div></td><td>${i.category}</td><td>${i.stock} ${i.unit||'units'}</td><td>${i.lastUpdated ? new Date(i.lastUpdated).toLocaleDateString() : 'N/A'}</td><td><span class="badge ${getBadgeClass(i.status)}">${i.status}</span></td><td><button class="btn" onclick="openEditInventoryModal('${i.id}')" style="padding:0.2rem 0.5rem;font-size:0.8rem;background:rgba(13,148,136,0.1);color:var(--clr-btn-primary);margin-right:0.5rem"><i class="fa-solid fa-pen"></i> Edit</button><button class="btn" onclick="deleteInventory('${i.id}')" style="padding:0.2rem 0.5rem;font-size:0.8rem;background:rgba(220,38,38,0.1);color:var(--clr-danger)"><i class="fa-solid fa-trash"></i> Delete</button></td></tr>`).join('');

        // Preview inventory
        const pib = document.getElementById('inventory-table-body');
        if (pib) pib.innerHTML = inv.slice(0,3).map(i => `<tr><td>${i.item}</td><td>${i.category}</td><td>${i.stock}</td><td><span class="badge ${getBadgeClass(i.status)}">${i.status}</span></td></tr>`).join('');
    } catch(e) { console.error('Admin render error:', e); }
}

// Admin CRUD
async function deleteStaff(id) {
    if (!confirm('Delete this staff member?')) return;
    try { await api(`/doctors/${id}`, 'DELETE'); renderAdminDashboard(); } catch(e) {}
}
async function deleteInventory(id) {
    if (!confirm('Delete this inventory item?')) return;
    try { await api(`/inventory/${id}`, 'DELETE'); renderAdminDashboard(); } catch(e) {}
}

function openEditStaffModal(id) {
    api(`/doctors/${id}`).then(({ data: s }) => {
        document.getElementById('edit-staff-id').value = s.id;
        document.getElementById('edit-staff-name').value = s.name;
        document.getElementById('edit-staff-specialty').value = s.specialty || '';
        document.getElementById('edit-staff-shift').value = s.shift || 'Morning';
        document.getElementById('edit-staff-modal').classList.add('show');
    }).catch(() => {});
}
function openEditInventoryModal(id) {
    api(`/inventory/${id}`).then(({ data: i }) => {
        document.getElementById('edit-inventory-id').value = i.id;
        document.getElementById('edit-inventory-item').value = i.item;
        document.getElementById('edit-inventory-category').value = i.category;
        document.getElementById('edit-inventory-stock').value = i.stock;
        document.getElementById('edit-inventory-status').value = i.status;
        document.getElementById('edit-inventory-modal').classList.add('show');
    }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    const ss = document.getElementById('staff-search-input');
    if (ss) ss.addEventListener('input', () => renderAdminDashboard());
    const is = document.getElementById('inventory-search-input');
    if (is) is.addEventListener('input', () => renderAdminDashboard());

    const af = document.getElementById('add-staff-form');
    if (af) af.onsubmit = async (e) => {
        e.preventDefault();
        const fname = document.getElementById('add-staff-fname').value.trim();
        const lname = document.getElementById('add-staff-lname')?.value.trim() || '';
        const role  = document.getElementById('add-staff-role').value;
        const spec  = document.getElementById('add-staff-specialty').value;
        const email = document.getElementById('add-staff-email')?.value.trim();
        const contact = document.getElementById('add-staff-contact')?.value.trim();
        
        if (!fname || !role || !spec || !email) {
            alert('Please fill in all required fields');
            return;
        }
        
        const fullName = (role === 'Doctor' ? 'Dr. ' : '') + fname + (lname ? ' ' + lname : '');
        try {
            await api('/doctors', 'POST', { 
                name: fullName, 
                specialty: spec, 
                shift: 'Morning', 
                email: email,
                contact: contact
            });
            document.getElementById('add-staff-modal').classList.remove('show');
            af.reset(); 
            alert('✅ Staff member added successfully!');
            renderAdminDashboard();
        } catch(e) {
            console.error('Error adding staff:', e);
        }
    };
    const ef = document.getElementById('edit-staff-form');
    if (ef) ef.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-staff-id').value;
        try {
            await api(`/doctors/${id}`, 'PUT', { name: document.getElementById('edit-staff-name').value, specialty: document.getElementById('edit-staff-specialty').value, shift: document.getElementById('edit-staff-shift').value });
            document.getElementById('edit-staff-modal').classList.remove('show');
            renderAdminDashboard();
        } catch(e) {}
    };
    const aif = document.getElementById('add-inventory-form');
    if (aif) aif.onsubmit = async (e) => {
        e.preventDefault();
        const inp = aif.querySelectorAll('input, select');
        try {
            await api('/inventory', 'POST', { item: inp[0].value, category: inp[1].value, stock: parseInt(inp[2].value)||0, unit: 'units', status: inp[3].value });
            document.getElementById('add-inventory-modal').classList.remove('show');
            aif.reset(); renderAdminDashboard();
        } catch(e) {}
    };
    const eif = document.getElementById('edit-inventory-form');
    if (eif) eif.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-inventory-id').value;
        try {
            await api(`/inventory/${id}`, 'PUT', { item: document.getElementById('edit-inventory-item').value, category: document.getElementById('edit-inventory-category').value, stock: parseInt(document.getElementById('edit-inventory-stock').value)||0, status: document.getElementById('edit-inventory-status').value });
            document.getElementById('edit-inventory-modal').classList.remove('show');
            renderAdminDashboard();
        } catch(e) {}
    };
});

// ===================== DOCTOR =====================
async function renderDoctorDashboard() {
    initSPA();
    try {
        const { data: appts } = await api('/appointments');
        const al = document.getElementById('appointments-list');
        if (al) {
            al.innerHTML = appts.slice(0,5).map(a => `<li class="appointment-item"><div class="appointment-info"><h4>${a.patientName}</h4><p><i class="fa-regular fa-clock"></i> ${a.time} - ${a.type}</p></div><button class="btn-icon view-history-btn" data-patient="${a.patientName}" title="View History"><i class="fa-solid fa-file-medical"></i></button></li>`).join('');
            document.querySelectorAll('.view-history-btn').forEach(b => b.addEventListener('click', e => openHistoryModal(e.currentTarget.dataset.patient)));
        }

        const ac = document.getElementById('availability-checkbox'), as = document.getElementById('availability-status');
        if (ac && as) ac.addEventListener('change', async (e) => {
            const st = e.target.checked ? 'Available' : 'Offline';
            try { await api(`/doctors/${getAuth().id}/status`, 'PUT', { status: st }); as.textContent = st; as.style.color = st === 'Available' ? 'var(--clr-success)' : 'var(--clr-danger)'; } catch(e) {}
        });

        // Inpatients - still local (no inpatient endpoint exposed to frontend yet)
        const ipb = document.getElementById('inpatients-table-body');
        if (ipb) {
            const mockInpatients = [
                { id:'p1', name:'John Doe', ward:'Ward A - Room 102', date:'2026-05-01', diagnosis:'Pneumonia', condition:'Stable' },
                { id:'p2', name:'Jane Smith', ward:'ICU - Bed 4', date:'2026-05-02', diagnosis:'Post-surgery', condition:'Critical' }
            ];
            const sq = document.getElementById('inpatient-search-input')?.value.toLowerCase()||'';
            const f = sq ? mockInpatients.filter(p => p.name.toLowerCase().includes(sq)||p.diagnosis.toLowerCase().includes(sq)) : mockInpatients;
            ipb.innerHTML = f.map(p => `<tr><td><div style="font-weight:600;color:var(--clr-text-main)">${p.name}</div></td><td>${p.ward}</td><td>${p.date}</td><td>${p.diagnosis}</td><td><span class="badge ${p.condition==='Critical'?'badge-danger':'badge-success'}">${p.condition}</span></td><td><button class="btn" style="padding:0.2rem 0.5rem;font-size:0.8rem;background:rgba(13,148,136,0.1);color:var(--clr-btn-primary);margin-right:0.5rem" onclick="alert('Viewing Vitals')">Vitals</button><button class="btn" onclick="openEditInpatientModal('${p.id}')" style="padding:0.2rem 0.5rem;font-size:0.8rem;background:rgba(13,148,136,0.1);color:var(--clr-btn-primary);margin-right:0.5rem"><i class="fa-solid fa-pen"></i></button><button class="btn" onclick="dischargePatient('${p.id}')" style="padding:0.2rem 0.5rem;font-size:0.8rem;background:rgba(220,38,38,0.1);color:var(--clr-danger)">Discharge</button></td></tr>`).join('');
        }

        // Prescriptions from API
        const { data: rxs } = await api('/prescriptions');
        const rpb = document.getElementById('recent-prescriptions-body');
        if (rpb) rpb.innerHTML = rxs.map(rx => `<tr><td><div style="font-weight:600;color:var(--clr-text-main)">${rx.patientName}</div></td><td>${rx.issuedDate||rx.date}</td><td>${rx.medications||rx.meds}</td><td><span class="badge ${rx.status==='Dispensed'?'badge-success':'badge-warning'}">${rx.status}</span></td><td><button class="btn" onclick="cancelPrescription('${rx.id}')" style="padding:0.2rem 0.5rem;font-size:0.8rem;background:rgba(220,38,38,0.1);color:var(--clr-danger)"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
    } catch(e) { console.error('Doctor render:', e); }
}

async function cancelPrescription(id) {
    if (!confirm('Cancel this prescription?')) return;
    try { await api(`/prescriptions/${id}`, 'DELETE'); renderDoctorDashboard(); } catch(e) {}
}

// Inpatient stubs (local for now)
function openEditInpatientModal(id) { alert('Edit inpatient: ' + id); }
function dischargePatient(id) { if (confirm('Discharge?')) { alert('Patient discharged'); renderDoctorDashboard(); } }

document.addEventListener('DOMContentLoaded', () => {
    const ips = document.getElementById('inpatient-search-input');
    if (ips) ips.addEventListener('input', () => renderDoctorDashboard());

    const pf = document.getElementById('prescription-form');
    if (pf) pf.onsubmit = async (e) => {
        e.preventDefault();
        const patient = document.getElementById('patient-search').value;
        const meds = document.getElementById('medication').value;
        try {
            await api('/prescriptions', 'POST', { patientId: 'pat1', patientName: patient, medications: meds });
            alert('Prescription issued!'); pf.reset(); renderDoctorDashboard();
        } catch(e) {}
    };
});

// ===================== PATIENT =====================
async function renderPatientDashboard() {
    initSPA();
    try {
        const wr = document.getElementById('waiting-room-status');
        if (wr) wr.innerHTML = `<div class="waiting-room-status"><p>Your estimated wait time is</p><h4>12 mins</h4><p>You are <strong>#3</strong> in the queue.</p></div>`;

        const { data: specs } = await api('/doctors/specialties');
        const sf = document.getElementById('specialty-filter');
        const ds = document.getElementById('doctor-select');
        if (sf) {
            sf.innerHTML = '<option value="">Select a specialty</option>' + specs.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            sf.addEventListener('change', async (e) => {
                ds.innerHTML = '<option value="">Select a doctor</option>';
                if (e.target.value) {
                    try {
                        const { data: docs } = await api(`/doctors?specialty=${e.target.value}`);
                        if (docs.length === 0) { ds.innerHTML = '<option value="">No doctors available</option>'; ds.disabled = true; }
                        else { ds.disabled = false; docs.forEach(d => ds.innerHTML += `<option value="${d.id}">${d.name}</option>`); }
                    } catch(e) {}
                } else { ds.disabled = true; ds.innerHTML = '<option value="">First select a specialty</option>'; }
            });
        }

        const sg = document.getElementById('specialties-grid');
        if (sg) sg.innerHTML = specs.map(s => `<div class="specialty-item" onclick="document.getElementById('specialty-filter').value='${s.id}';document.getElementById('specialty-filter').dispatchEvent(new Event('change'));window.scrollTo({top:0,behavior:'smooth'})"><i class="fa-solid ${s.icon}"></i><h4>${s.name}</h4></div>`).join('');

        // Bookings from API
        const { data: bookings } = await api(`/patients/${getAuth().id}/appointments`);
        const bb = document.getElementById('patient-bookings-body');
        if (bb) {
            if (bookings.length === 0) bb.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:2rem;color:var(--clr-text-muted)">No bookings yet.</td></tr>`;
            else bb.innerHTML = bookings.map(b => `<tr><td><div style="font-weight:600;color:var(--clr-text-main)">${b.doctorName}</div></td><td>${b.specialty}</td><td>${b.date}, ${b.time}</td><td><span class="badge ${b.status==='Scheduled'?'badge-warning':b.status==='Completed'?'badge-success':'badge-danger'}">${b.status}</span></td><td>${b.status==='Scheduled'?`<button class="btn btn-accent" onclick="alert('Contact clinic to reschedule')" style="padding:0.2rem 0.5rem;font-size:0.8rem;margin-right:0.5rem">Reschedule</button><button class="btn" onclick="cancelBooking('${b.id}')" style="padding:0.2rem 0.5rem;font-size:0.8rem;background:rgba(220,38,38,0.1);color:var(--clr-danger)">Cancel</button>`:`<span style="color:var(--clr-text-muted);font-size:0.9rem">No actions</span>`}</td></tr>`).join('');
        }

        // Medical records (local - no backend endpoint)
        const records = [
            { date:'2025-01-15', diagnosis:'Mild Hypertension', treatment:'Prescribed Lisinopril 10mg' },
            { date:'2024-08-22', diagnosis:'Routine Checkup', treatment:'All vitals normal' }
        ];
        const rb = document.getElementById('patient-records-body');
        if (rb) rb.innerHTML = records.map(r => `<tr><td><div style="font-weight:600;color:var(--clr-text-main)">${r.date}</div></td><td>${r.diagnosis}</td><td>${r.treatment}</td><td><button class="btn" onclick="alert('Downloading: ${r.diagnosis}')" style="padding:0.2rem 0.5rem;font-size:0.8rem;background:rgba(13,148,136,0.1);color:var(--clr-btn-primary)"><i class="fa-solid fa-file-pdf"></i> Download</button></td></tr>`).join('');

        // Booking form
        const bf = document.getElementById('booking-form');
        if (bf) bf.onsubmit = async (e) => {
            e.preventDefault();
            const docSel = document.getElementById('doctor-select');
            const dateIn = document.getElementById('appointment-date');
            if (!docSel.value || !dateIn.value) { alert('Select specialty, doctor and date'); return; }
            try {
                await api('/appointments', 'POST', { patientId: getAuth().id, patientName: 'Alex Doe', doctorId: docSel.value, date: dateIn.value, time: '09:00 AM', type: 'Checkup' });
                alert('Appointment booked!'); bf.reset(); docSel.innerHTML = '<option value="">First select a specialty</option>'; docSel.disabled = true;
                renderPatientDashboard();
            } catch(e) {}
        };

        // Settings form
        const stf = document.querySelector('#view-settings form');
        if (stf) stf.onsubmit = (e) => { e.preventDefault(); const n = stf.querySelector('input[type="text"]')?.value; if (n) { const sn = document.querySelector('.user-name'); if (sn) sn.textContent = n; } alert('Profile saved!'); };
    } catch(e) { console.error('Patient render:', e); }
}

async function cancelBooking(id) {
    if (!confirm('Cancel this appointment?')) return;
    try { await api(`/appointments/${id}`, 'DELETE'); renderPatientDashboard(); } catch(e) {}
}

// ===================== MODALS =====================
function initModal() {
    document.querySelectorAll('.modal').forEach(m => {
        const close = () => m.classList.remove('show');
        m.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', close));
        window.addEventListener('click', e => { if (e.target === m) close(); });
        window.addEventListener('keydown', e => { if (e.key === 'Escape' && m.classList.contains('show')) close(); });
    });
}

function openHistoryModal(name) {
    const m = document.getElementById('medical-history-modal'), t = document.getElementById('modal-title'), c = document.getElementById('modal-history-content');
    if (m && t && c) {
        t.textContent = `Medical History: ${name}`;
        c.innerHTML = `<div class="history-entry"><div class="date">2025-01-15</div><h5>Diagnosis: Mild Hypertension</h5><p>Prescribed Lisinopril 10mg</p></div><div class="history-entry"><div class="date">2024-08-22</div><h5>Diagnosis: Routine Checkup</h5><p>All vitals normal</p></div>`;
        m.classList.add('show');
    }
}

// ===================== NETWORK ANIMATION =====================
function initNetworkAnimation() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; };
    window.addEventListener('resize', resize); resize();
    class P { constructor() { this.x=Math.random()*w; this.y=Math.random()*h; this.vx=(Math.random()-0.5)*0.8; this.vy=(Math.random()-0.5)*0.8; this.r=Math.random()*2+1; } update() { this.x+=this.vx; this.y+=this.vy; if(this.x<0||this.x>w)this.vx*=-1; if(this.y<0||this.y>h)this.vy*=-1; } draw() { ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fillStyle=this.r>2?'rgba(255,107,107,0.8)':'rgba(13,148,136,0.9)'; ctx.fill(); } }
    for(let i=0;i<80;i++) particles.push(new P());
    (function animate() {
        ctx.clearRect(0,0,w,h);
        for(let i=0;i<particles.length;i++) { particles[i].update(); particles[i].draw(); for(let j=i+1;j<particles.length;j++) { const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d=Math.sqrt(dx*dx+dy*dy); if(d<120) { ctx.beginPath(); ctx.strokeStyle=`rgba(13,148,136,${0.8-d/120})`; ctx.lineWidth=1; ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.stroke(); } } }
        requestAnimationFrame(animate);
    })();
}
