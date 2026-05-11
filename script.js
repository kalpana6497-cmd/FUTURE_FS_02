// ═══════════════════════════════════════════════════════════
//  LEADFLOW CRM — Multi-User Role System
//  Roles: admin (full access) | sales (own leads only)
// ═══════════════════════════════════════════════════════════

const ADMIN_SECRET_KEY = "LEADFLOW2024";

// ── Seed Data ──────────────────────────────────────────────
const SEED_USERS = [
  { id: "u1", username: "admin",  password: "admin123", name: "Admin User",   email: "admin@leadflow.io",  role: "admin", joinedAt: "2024-01-01T00:00:00Z" },
  { id: "u2", username: "sales1", password: "sales123", name: "Rahul Mehta",  email: "rahul@leadflow.io",  role: "sales", joinedAt: "2024-02-10T00:00:00Z" },
  { id: "u3", username: "sales2", password: "sales456", name: "Priya Sharma", email: "priya@leadflow.io",  role: "sales", joinedAt: "2024-03-05T00:00:00Z" },
];

const SEED_LEADS = [
  { id: 1, name: "Ananya Reddy",   email: "ananya@innovate.io",  phone: "+91 99887 76655", source: "Website",       status: "converted", company: "Innovate.io",   assignedTo: "u2", createdAt: "2024-05-28T08:00:00Z", notes: [{ id: 1, text: "Signed annual plan contract.", author: "Rahul Mehta", timestamp: "2024-05-30T14:00:00Z" }] },
  { id: 2, name: "Kiran Patel",    email: "kiran@webdev.co",     phone: "+91 87654 32109", source: "Email Campaign",status: "new",       company: "WebDev Co.",    assignedTo: "u2", createdAt: "2024-06-05T07:45:00Z", notes: [] },
  { id: 3, name: "Sneha Gupta",    email: "sneha@cloudbase.net", phone: "+91 76543 21098", source: "Website",       status: "contacted", company: "CloudBase",     assignedTo: "u3", createdAt: "2024-06-02T13:00:00Z", notes: [{ id: 1, text: "Follow-up call next Monday.", author: "Priya Sharma", timestamp: "2024-06-03T09:00:00Z" }] },
  { id: 4, name: "Vikram Singh",   email: "vikram@startup.in",   phone: "+91 91234 56789", source: "LinkedIn",      status: "new",       company: "StartupX",      assignedTo: "u3", createdAt: "2024-06-07T10:00:00Z", notes: [] },
  { id: 5, name: "Meera Joshi",    email: "meera@techpark.com",  phone: "+91 98765 11223", source: "Referral",      status: "contacted", company: "TechPark",      assignedTo: "u2", createdAt: "2024-06-01T09:00:00Z", notes: [] },
  { id: 6, name: "Arjun Nair",     email: "arjun@digitalco.in",  phone: "+91 88776 65544", source: "Cold Call",     status: "new",       company: "DigitalCo",     assignedTo: null, createdAt: "2024-06-08T11:00:00Z", notes: [] },
];

const AVATAR_BG = ["#EDE9FE","#D1FAE5","#FEF3C7","#FCE7F3","#DBEAFE","#FEE2E2"];
const AVATAR_TX = ["#7C3AED","#065F46","#92400E","#9D174D","#1E40AF","#991B1B"];
const SRC_COLORS = ["#6366F1","#8B5CF6","#10B981","#F59E0B","#EF4444","#3B82F6"];

// ── State ──────────────────────────────────────────────────
let users  = [];
let leads  = [];
let currentUser = null;
let currentView = "leads";
let editingLeadId = null;
let detailLeadId  = null;

// ── Persistence ────────────────────────────────────────────
function saveUsers()  { localStorage.setItem("crm_users",  JSON.stringify(users));  }
function saveLeads()  { localStorage.setItem("crm_leads",  JSON.stringify(leads));  }
function loadUsers()  { try { const s = localStorage.getItem("crm_users");  users  = s ? JSON.parse(s) : [...SEED_USERS]; } catch { users  = [...SEED_USERS]; } }
function loadLeads()  { try { const s = localStorage.getItem("crm_leads");  leads  = s ? JSON.parse(s) : [...SEED_LEADS]; } catch { leads  = [...SEED_LEADS]; } }

// ── Helpers ────────────────────────────────────────────────
const isAdmin = () => currentUser?.role === "admin";
const isSales = () => currentUser?.role === "sales";
const visibleLeads = () => isAdmin() ? leads : leads.filter(l => l.assignedTo === currentUser.id);
const fmtDate = iso => new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
const fmtDT   = iso => new Date(iso).toLocaleString("en-IN",     { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
const initials = n => n.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
const avatarStyle = id => { const i = (typeof id === "number" ? id : parseInt(id.replace(/\D/g,""),36)) % 6; return `background:${AVATAR_BG[i]};color:${AVATAR_TX[i]}`; };
const getUserName = uid => users.find(u => u.id === uid)?.name || "Unassigned";

function getStats(pool) {
  const t = pool.length;
  const n = pool.filter(l => l.status==="new").length;
  const c = pool.filter(l => l.status==="contacted").length;
  const v = pool.filter(l => l.status==="converted").length;
  return { total:t, new:n, contacted:c, converted:v, rate: t ? Math.round(v/t*100) : 0 };
}

// ── DOM helpers ────────────────────────────────────────────
const $ = id => document.getElementById(id);
function showAdminEls(show) {
  document.querySelectorAll(".admin-only").forEach(el => el.classList.toggle("hidden", !show));
}

// Load users immediately so login works before initApp() runs
loadUsers();

// ══════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════
function switchTab(tab) {
  $("tab-login").classList.toggle("active", tab==="login");
  $("tab-register").classList.toggle("active", tab==="register");
  $("login-form").classList.toggle("hidden", tab!=="login");
  $("register-form").classList.toggle("hidden", tab!=="register");
  $("login-error").classList.add("hidden");
}

function onRoleChange() {
  const isAdminRole = $("reg-role").value === "admin";
  $("reg-admin-key-group").classList.toggle("hidden", !isAdminRole);
}

function handleLogin() {
  const u = $("login-user").value.trim();
  const p = $("login-pass").value;
  const errEl = $("login-error");
  errEl.classList.add("hidden");
  if (!u || !p) { errEl.textContent = "Please fill in both fields."; errEl.classList.remove("hidden"); return; }
  const found = users.find(x => x.username === u && x.password === p);
  if (!found) { errEl.textContent = "Incorrect username or password."; errEl.classList.remove("hidden"); return; }
  currentUser = found;
  $("auth-screen").classList.add("hidden");
  $("app").classList.remove("hidden");
  initApp();
}

// Allow Enter key on login
$("login-pass").addEventListener("keydown", e => { if (e.key==="Enter") handleLogin(); });
$("login-user").addEventListener("keydown", e => { if (e.key==="Enter") handleLogin(); });

function handleRegister() {
  const name    = $("reg-name").value.trim();
  const username= $("reg-user").value.trim();
  const email   = $("reg-email").value.trim();
  const pass    = $("reg-pass").value;
  const role    = $("reg-role").value;
  const key     = $("reg-admin-key").value;

  // Reset errors
  ["reg-name","reg-user","reg-email","reg-pass","reg-key"].forEach(id => { const e = $("err-"+id); if(e) e.textContent=""; });
  $("register-error").classList.add("hidden");
  $("register-success").classList.add("hidden");

  let valid = true;
  if (!name)     { $("err-reg-name").textContent = "Required"; valid=false; }
  if (!username) { $("err-reg-user").textContent = "Required"; valid=false; }
  else if (users.find(u => u.username===username)) { $("err-reg-user").textContent = "Username already taken"; valid=false; }
  if (!email || !/\S+@\S+\.\S+/.test(email)) { $("err-reg-email").textContent = "Valid email required"; valid=false; }
  if (!pass || pass.length < 6) { $("err-reg-pass").textContent = "Min 6 characters"; valid=false; }
  if (role==="admin" && key !== ADMIN_SECRET_KEY) { $("err-reg-key").textContent = "Incorrect secret key"; valid=false; }
  if (!valid) return;

  const newUser = { id: "u"+Date.now(), username, password: pass, name, email, role, joinedAt: new Date().toISOString() };
  users.push(newUser);
  saveUsers();
  $("register-success").textContent = `Account created! You can now sign in as ${username}.`;
  $("register-success").classList.remove("hidden");
  // Clear form
  ["reg-name","reg-user","reg-email","reg-pass","reg-admin-key"].forEach(id => $(id).value="");
  setTimeout(() => switchTab("login"), 1800);
}

$("logout-btn").addEventListener("click", () => {
  currentUser = null;
  $("app").classList.add("hidden");
  $("auth-screen").classList.remove("hidden");
  $("login-user").value = "";
  $("login-pass").value = "";
  $("login-error").classList.add("hidden");
});

// ══════════════════════════════════════════════════════════
//  APP INIT
// ══════════════════════════════════════════════════════════
function initApp() {
  loadLeads(); // users already loaded at startup
  // Sidebar info
  $("sidebar-avatar").textContent = initials(currentUser.name);
  $("sidebar-name").textContent   = currentUser.name;
  $("sidebar-role-label").textContent = currentUser.role === "admin" ? "Administrator" : "Sales Rep";
  $("sidebar-role-dot").style.background = isAdmin() ? "#6366F1" : "#10B981";

  // Role badge in topbar
  const badge = $("topbar-role-badge");
  if (isAdmin()) { badge.textContent="Admin"; badge.style.cssText="background:#EEF2FF;color:#4338CA;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em"; }
  else           { badge.textContent="Sales Rep"; badge.style.cssText="background:#ECFDF5;color:#065F46;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em"; }

  showAdminEls(isAdmin());
  populateFilters();
  renderStats();
  renderLeadsTable();
  setView("leads");
}

// ── Navigation ─────────────────────────────────────────────
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    setView(btn.dataset.view);
  });
});

function setView(v) {
  currentView = v;
  ["leads","analytics","users"].forEach(id => $(id+"-view").classList.add("hidden"));
  $(v+"-view").classList.remove("hidden");
  $("add-lead-btn").classList.toggle("hidden", v !== "leads");
  const titles = { leads:"Lead Management", analytics:"Analytics Overview", users:"User Management" };
  $("page-title").textContent = titles[v] || "";
  if (v==="analytics") renderAnalytics();
  if (v==="users")     renderUsersTable();
}

// ══════════════════════════════════════════════════════════
//  STATS
// ══════════════════════════════════════════════════════════
function renderStats() {
  const pool = visibleLeads();
  const s = getStats(pool);
  $("stat-total").textContent = s.total;
  $("stat-new").textContent = s.new;
  $("stat-contacted").textContent = s.contacted;
  $("stat-converted").textContent = s.converted;
  $("stat-rate").textContent = `${s.rate}% conversion`;
  $("stat-total-sub").textContent = isAdmin() ? "All leads" : "Your leads";
}

// ══════════════════════════════════════════════════════════
//  FILTERS
// ══════════════════════════════════════════════════════════
function populateFilters() {
  // Sources
  const sources = [...new Set(leads.map(l => l.source))];
  const sel = $("filter-source");
  sel.innerHTML = '<option value="all">All Sources</option>';
  sources.forEach(s => { const o=document.createElement("option"); o.value=s; o.textContent=s; sel.appendChild(o); });

  // Assignee (admin only)
  const asel = $("filter-assignee");
  asel.innerHTML = '<option value="all">All Reps</option>';
  users.filter(u => u.role==="sales").forEach(u => { const o=document.createElement("option"); o.value=u.id; o.textContent=u.name; asel.appendChild(o); });
}

["search-input","filter-status","filter-source","filter-assignee","sort-by"].forEach(id => {
  $(id)?.addEventListener("input",  renderLeadsTable);
  $(id)?.addEventListener("change", renderLeadsTable);
});
$("clear-filters-btn").addEventListener("click", () => {
  $("search-input").value=""; $("filter-status").value="all";
  $("filter-source").value="all"; $("filter-assignee").value="all";
  renderLeadsTable();
});

function getFiltered() {
  const q     = $("search-input").value.toLowerCase();
  const fs    = $("filter-status").value;
  const fsrc  = $("filter-source").value;
  const fasgn = $("filter-assignee").value;
  const sort  = $("sort-by").value;

  let r = [...visibleLeads()];
  if (q)          r = r.filter(l => l.name.toLowerCase().includes(q)||l.email.toLowerCase().includes(q)||(l.company||"").toLowerCase().includes(q));
  if (fs!=="all") r = r.filter(l => l.status===fs);
  if (fsrc!=="all") r = r.filter(l => l.source===fsrc);
  if (isAdmin() && fasgn!=="all") r = r.filter(l => l.assignedTo===fasgn);
  if (sort==="newest") r.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  else if (sort==="oldest") r.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  else if (sort==="name") r.sort((a,b)=>a.name.localeCompare(b.name));
  return r;
}

// ══════════════════════════════════════════════════════════
//  LEADS TABLE
// ══════════════════════════════════════════════════════════
function renderLeadsTable() {
  const filtered = getFiltered();
  const hasFilter = $("search-input").value || $("filter-status").value!=="all" || $("filter-source").value!=="all" || $("filter-assignee").value!=="all";
  $("clear-filters-btn").classList.toggle("hidden", !hasFilter);
  $("leads-count").textContent = `Showing ${filtered.length} of ${visibleLeads().length} leads`;

  const tbody = $("leads-tbody");
  if (!filtered.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">No leads found. Adjust your filters or add a new lead.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(lead => {
    const assignee = lead.assignedTo ? getUserName(lead.assignedTo) : null;
    const assigneeHTML = assignee
      ? `<span class="assignee-tag">${assignee}</span>`
      : `<span class="unassigned-tag">Unassigned</span>`;
    const statusLabels = { new:"New", contacted:"Contacted", converted:"Converted" };
    return `
    <tr>
      <td>
        <div class="lead-cell">
          <div class="lead-avatar" style="${avatarStyle(lead.id)}">${initials(lead.name)}</div>
          <div>
            <div class="lead-name">${lead.name}</div>
            <div class="lead-email">${lead.email}</div>
          </div>
        </div>
      </td>
      <td style="color:#374151">${lead.company||"—"}</td>
      <td><span class="source-tag">${lead.source}</span></td>
      <td><span class="status-badge status-${lead.status}">${statusLabels[lead.status]}</span></td>
      <td>${assigneeHTML}</td>
      <td style="font-size:12px;color:#94A3B8">${fmtDate(lead.createdAt)}</td>
      <td style="color:#64748B">${lead.notes?.length||0}</td>
      <td>
        <div class="row-actions">
          <button class="btn-view" onclick="openDetail(${lead.id})">View</button>
          <button class="btn-edit" onclick="openEditModal(${lead.id})">Edit</button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

// ══════════════════════════════════════════════════════════
//  ADD / EDIT MODAL
// ══════════════════════════════════════════════════════════
$("add-lead-btn").addEventListener("click",   () => openAddModal());
$("modal-close-btn").addEventListener("click",  closeModal);
$("modal-cancel-btn").addEventListener("click", closeModal);
$("modal-save-btn").addEventListener("click",   saveModal);
$("lead-modal").addEventListener("click", e => { if(e.target===e.currentTarget) closeModal(); });

function populateAssignSelect(selectId, currentVal) {
  const sel = $(selectId);
  const salesReps = users.filter(u => u.role==="sales");
  sel.innerHTML = `<option value="">Unassigned</option>`;
  salesReps.forEach(u => {
    const o = document.createElement("option");
    o.value=u.id; o.textContent=u.name;
    if (u.id===currentVal) o.selected=true;
    sel.appendChild(o);
  });
}

function openAddModal() {
  editingLeadId = null;
  $("modal-title").textContent = "Add New Lead";
  $("modal-save-btn").textContent = "Add Lead";
  ["m-name","m-email","m-phone","m-company"].forEach(id => $(id).value="");
  $("m-source").value="Website"; $("m-status").value="new";
  if (isAdmin()) { $("assign-group").classList.remove("hidden"); populateAssignSelect("m-assign", null); }
  clearModalErrors();
  $("lead-modal").classList.remove("hidden");
}

function openEditModal(id) {
  const lead = leads.find(l => l.id===id);
  if (!lead) return;
  editingLeadId = id;
  $("modal-title").textContent = "Edit Lead";
  $("modal-save-btn").textContent = "Save Changes";
  $("m-name").value=lead.name; $("m-email").value=lead.email;
  $("m-phone").value=lead.phone||""; $("m-company").value=lead.company||"";
  $("m-source").value=lead.source; $("m-status").value=lead.status;
  if (isAdmin()) { $("assign-group").classList.remove("hidden"); populateAssignSelect("m-assign", lead.assignedTo); }
  clearModalErrors();
  $("lead-modal").classList.remove("hidden");
}

function clearModalErrors() {
  $("err-name").textContent=""; $("err-email").textContent="";
  $("m-name").style.borderColor=""; $("m-email").style.borderColor="";
}

function closeModal() { $("lead-modal").classList.add("hidden"); editingLeadId=null; }

function saveModal() {
  const name  = $("m-name").value.trim();
  const email = $("m-email").value.trim();
  let valid=true;
  if (!name)  { $("err-name").textContent="Required"; $("m-name").style.borderColor="#EF4444"; valid=false; }
  if (!email||!/\S+@\S+\.\S+/.test(email)) { $("err-email").textContent="Valid email required"; $("m-email").style.borderColor="#EF4444"; valid=false; }
  if (!valid) return;

  const assignedTo = isAdmin() ? ($("m-assign").value || null) : currentUser.id;
  const data = { name, email, phone:$("m-phone").value.trim(), company:$("m-company").value.trim(), source:$("m-source").value, status:$("m-status").value, assignedTo };

  if (editingLeadId) {
    leads = leads.map(l => l.id===editingLeadId ? {...l,...data} : l);
    if (detailLeadId===editingLeadId) openDetail(editingLeadId);
  } else {
    leads.push({...data, id:Date.now(), notes:[], createdAt:new Date().toISOString()});
    populateFilters();
  }
  saveLeads(); renderStats(); renderLeadsTable(); closeModal();
}

// ══════════════════════════════════════════════════════════
//  DETAIL PANEL
// ══════════════════════════════════════════════════════════
$("detail-close-btn").addEventListener("click", closeDetail);
$("detail-overlay").addEventListener("click", e => { if(e.target===$("detail-overlay")) closeDetail(); });
$("add-note-btn").addEventListener("click", addNote);
$("note-input").addEventListener("keydown", e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addNote();} });
$("edit-lead-btn").addEventListener("click", () => { closeDetail(); openEditModal(detailLeadId); });
$("delete-lead-btn").addEventListener("click", () => {
  $("delete-lead-btn").classList.add("hidden");
  $("confirm-delete").classList.remove("hidden");
});
$("cancel-delete-btn").addEventListener("click", () => {
  $("confirm-delete").classList.add("hidden");
  $("delete-lead-btn").classList.remove("hidden");
});
$("confirm-delete-btn").addEventListener("click", () => {
  leads = leads.filter(l => l.id!==detailLeadId);
  saveLeads(); renderStats(); renderLeadsTable(); populateFilters();
  closeDetail();
});

function openDetail(id) {
  const lead = leads.find(l => l.id===id);
  if (!lead) return;
  detailLeadId = id;

  $("detail-avatar").textContent = initials(lead.name);
  Object.assign($("detail-avatar").style, { background: AVATAR_BG[(typeof lead.id==="number"?lead.id:0)%6], color: AVATAR_TX[(typeof lead.id==="number"?lead.id:0)%6] });
  $("detail-name").textContent = lead.name;
  $("detail-company-sub").textContent = lead.company||"—";

  // Status toggles — sales can only update status on their own leads
  const canEdit = isAdmin() || lead.assignedTo === currentUser.id;
  $("status-toggles").innerHTML = ["new","contacted","converted"].map(s => `
    <button class="status-toggle ${lead.status===s?"active-"+s:""}"
      ${canEdit ? `onclick="setLeadStatus(${lead.id},'${s}')"` : "disabled"}
      style="${canEdit?"":"cursor:not-allowed;opacity:0.5"}">
      ${{new:"New",contacted:"Contacted",converted:"Converted"}[s]}
    </button>`).join("");

  // Info
  const assigneeName = lead.assignedTo ? getUserName(lead.assignedTo) : "Unassigned";
  $("detail-info-content").innerHTML = [
    ["📧","Email",lead.email],["📞","Phone",lead.phone||"—"],
    ["🏢","Company",lead.company||"—"],["📣","Source",lead.source],
    ["👤","Assigned",assigneeName],["📅","Added",fmtDate(lead.createdAt)],
  ].map(([ic,lb,v])=>`
    <div class="info-row">
      <span class="info-icon">${ic}</span>
      <span class="info-label">${lb}:</span>
      <span class="info-value">${v}</span>
    </div>`).join("");

  // Assignment (admin only)
  if (isAdmin()) {
    $("detail-assign-box").classList.remove("hidden");
    populateAssignSelect("detail-assign-select", lead.assignedTo);
  } else {
    $("detail-assign-box").classList.add("hidden");
  }

  // Notes — sales can only add notes to their assigned leads
  const canNote = isAdmin() || lead.assignedTo === currentUser.id;
  $("note-input").disabled = !canNote;
  $("add-note-btn").disabled = !canNote;
  $("add-note-btn").style.opacity = canNote ? "1" : "0.4";

  // Delete — admin always, sales only their own
  const canDelete = isAdmin() || lead.assignedTo === currentUser.id;
  $("delete-lead-btn").style.display = canDelete ? "" : "none";
  $("edit-lead-btn").style.display   = canDelete ? "" : "none";

  renderNotes(lead);
  $("confirm-delete").classList.add("hidden");
  $("delete-lead-btn").classList.remove("hidden");

  const overlay = $("detail-overlay");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.65);z-index:1000;display:flex;align-items:stretch;justify-content:flex-end;padding:0;";
  overlay.classList.remove("hidden");
}

function closeDetail() { $("detail-overlay").classList.add("hidden"); detailLeadId=null; }

function renderNotes(lead) {
  $("notes-count").textContent = lead.notes?.length||0;
  const list = $("notes-list");
  if (!lead.notes?.length) { list.innerHTML=`<p class="notes-empty">No notes yet. Add your first note above.</p>`; return; }
  list.innerHTML = [...lead.notes].reverse().map(note=>`
    <div class="note-item">
      <div class="note-author">${note.author||"Unknown"}</div>
      <p class="note-text">${note.text}</p>
      <div class="note-meta">
        <span class="note-time">${fmtDT(note.timestamp)}</span>
        ${(isAdmin()||note.authorId===currentUser.id)?`<button class="note-delete" onclick="deleteNote(${note.id})">Delete</button>`:""}
      </div>
    </div>`).join("");
}

function addNote() {
  const input = $("note-input");
  const text  = input.value.trim();
  if (!text||!detailLeadId) return;
  const lead = leads.find(l => l.id===detailLeadId);
  if (!lead) return;
  lead.notes = [...(lead.notes||[]), { id:Date.now(), text, author:currentUser.name, authorId:currentUser.id, timestamp:new Date().toISOString() }];
  input.value="";
  saveLeads(); renderNotes(lead); renderLeadsTable();
  if (currentView==="analytics") renderAnalytics();
}

function deleteNote(noteId) {
  const lead = leads.find(l => l.id===detailLeadId);
  if (!lead) return;
  lead.notes = lead.notes.filter(n => n.id!==noteId);
  saveLeads(); renderNotes(lead); renderLeadsTable();
}

function setLeadStatus(id, status) {
  leads = leads.map(l => l.id===id ? {...l, status} : l);
  saveLeads(); renderStats(); renderLeadsTable(); openDetail(id);
}

function saveAssignment() {
  const lead = leads.find(l => l.id===detailLeadId);
  if (!lead) return;
  lead.assignedTo = $("detail-assign-select").value || null;
  saveLeads(); renderLeadsTable(); openDetail(detailLeadId);
}

// ══════════════════════════════════════════════════════════
//  ANALYTICS
// ══════════════════════════════════════════════════════════
function renderAnalytics() {
  const pool = visibleLeads();
  const s = getStats(pool);

  // Funnel
  const FC = {new:"#3B82F6", contacted:"#F59E0B", converted:"#10B981"};
  $("funnel-bars").innerHTML = ["new","contacted","converted"].map(k => {
    const count=s[k], pct=s.total?Math.round(count/s.total*100):0;
    return `<div class="funnel-label-row"><span style="color:#374151;font-weight:500;text-transform:capitalize">${k}</span><span style="color:#64748B">${count} (${pct}%)</span></div>
    <div class="funnel-track"><div class="funnel-fill" style="width:${pct}%;background:${FC[k]}"></div></div>`;
  }).join("");
  $("conv-rate-big").textContent = `${s.rate}%`;

  // Sources
  const srcMap={};
  pool.forEach(l=>{ srcMap[l.source]=(srcMap[l.source]||0)+1; });
  const srcArr=Object.entries(srcMap).sort((a,b)=>b[1]-a[1]);
  const maxS=Math.max(...srcArr.map(([,c])=>c),1);
  $("source-bars").innerHTML = srcArr.map(([src,cnt],i)=>`
    <div class="source-bar-row">
      <div class="source-label-row"><span>${src}</span><strong>${cnt}</strong></div>
      <div class="source-track"><div class="source-fill" style="width:${Math.round(cnt/maxS*100)}%;background:${SRC_COLORS[i%SRC_COLORS.length]}"></div></div>
    </div>`).join("");

  // Rep performance (admin only)
  if (isAdmin()) {
    const repEl = $("rep-bars");
    if (repEl) {
      const repMap={};
      leads.forEach(l=>{ const name=l.assignedTo?getUserName(l.assignedTo):"Unassigned"; repMap[name]=(repMap[name]||{total:0,converted:0}); repMap[name].total++; if(l.status==="converted") repMap[name].converted++; });
      const repArr=Object.entries(repMap).sort((a,b)=>b[1].total-a[1].total);
      const maxR=Math.max(...repArr.map(([,v])=>v.total),1);
      repEl.innerHTML = repArr.map(([name,v])=>`
        <div class="source-bar-row">
          <div class="source-label-row"><span>${name}</span><strong>${v.total} leads / ${v.converted} converted</strong></div>
          <div class="source-track"><div class="source-fill" style="width:${Math.round(v.total/maxR*100)}%;background:#6366F1"></div></div>
        </div>`).join("");
    }
  }

  // Activity
  const acts=pool.flatMap(l=>(l.notes||[]).map(n=>({leadName:l.name,text:n.text,author:n.author,time:n.timestamp})));
  acts.sort((a,b)=>new Date(b.time)-new Date(a.time));
  const actEl=$("activity-list");
  if (!acts.length) { actEl.innerHTML=`<p class="activity-empty">No activity yet. Add notes to leads.</p>`; return; }
  actEl.innerHTML = acts.slice(0,6).map(a=>`
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div class="activity-text"><strong>${a.leadName}</strong> — ${a.text} <span style="color:#94A3B8;font-size:11px">(by ${a.author||"?"})</span></div>
      <span class="activity-time">${fmtDT(a.time)}</span>
    </div>`).join("");
}

// ══════════════════════════════════════════════════════════
//  USERS TABLE (Admin only)
// ══════════════════════════════════════════════════════════
function renderUsersTable() {
  const tbody = $("users-tbody");
  tbody.innerHTML = users.map(u => {
    const assignedCount = leads.filter(l => l.assignedTo===u.id).length;
    const isYou = u.id===currentUser.id;
    const canRemove = !isYou && u.role!=="admin";
    return `<tr>
      <td>
        <div class="lead-cell">
          <div class="lead-avatar" style="${avatarStyle(parseInt(u.id.replace(/\D/g,""),36)%6)}">${initials(u.name)}</div>
          <div>
            <div class="lead-name">${u.name} ${isYou?`<span class="you-tag">You</span>`:""}</div>
            <div class="lead-email">@${u.username}</div>
          </div>
        </div>
      </td>
      <td style="color:#64748B;font-size:13px">${u.email}</td>
      <td><span class="role-chip role-${u.role}">${u.role==="admin"?"Admin":"Sales Rep"}</span></td>
      <td style="color:#374151">${assignedCount} lead${assignedCount!==1?"s":""}</td>
      <td style="font-size:12px;color:#94A3B8">${fmtDate(u.joinedAt)}</td>
      <td>${canRemove?`<button class="btn-remove" onclick="removeUser('${u.id}')">Remove</button>`:""}</td>
    </tr>`;
  }).join("");
}

function removeUser(uid) {
  if (!confirm("Remove this user? Their leads will become unassigned.")) return;
  users = users.filter(u => u.id!==uid);
  leads = leads.map(l => l.assignedTo===uid ? {...l, assignedTo:null} : l);
  saveUsers(); saveLeads();
  renderUsersTable(); renderLeadsTable(); populateFilters();
}