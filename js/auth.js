const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;
let currentProfile = null;

async function doLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginErr");
  errEl.style.display = "none";

  if (!email || !pass) { showLoginErr("E-posta ve şifre giriniz."); return; }

  const { data, error } = await _supabase.auth.signInWithPassword({ email, password: pass });
  if (error) { showLoginErr("Hatalı e-posta veya şifre."); return; }

  currentUser = data.user;
  await loadProfile();
  initApp();
}

function showLoginErr(msg) {
  const el = document.getElementById("loginErr");
  el.textContent = msg; el.style.display = "block";
}

async function loadProfile() {
  const { data } = await _supabase.from("profiles").select("*").eq("id", currentUser.id).single();
  currentProfile = data;
}

async function doLogout() {
  await _supabase.auth.signOut();
  currentUser = null; currentProfile = null;
  document.getElementById("appScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
}

function initApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appScreen").style.display = "flex";

  const role = currentProfile?.role || "denetim";
  const name = currentProfile?.full_name || currentProfile?.email || "";
  const roleLabel = { admin: "Admin", departman_lideri: "Departman lideri", denetim: "Denetim" }[role] || role;
  document.getElementById("userBadge").textContent = name + " · " + roleLabel;

  if (role === "admin" || role === "departman_lideri") {
    document.getElementById("navKullanici").style.display = "flex";
    loadUsers();
  }

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("dateInput").value = today;
}

// ---- KULLANICI YÖNETİMİ ----

async function loadUsers() {
  const { data, error } = await _supabase.from("profiles").select("*").order("created_at");
  if (error) { console.error(error); return; }
  renderUsers(data || []);
}

function renderUsers(users) {
  const roleBadge = { admin: "badge-admin", departman_lideri: "badge-dept", denetim: "badge-denetim" };
  const roleLabel = { admin: "Admin", departman_lideri: "Departman lideri", denetim: "Denetim" };
  const myRole = currentProfile?.role;

  document.getElementById("userTbody").innerHTML = users.map(u => `
    <tr>
      <td class="td-bold">${u.full_name || "—"}</td>
      <td>${u.email}</td>
      <td><span class="badge ${roleBadge[u.role] || 'badge-info'}">${roleLabel[u.role] || u.role}</span></td>
      <td>${new Date(u.created_at).toLocaleDateString("tr-TR")}</td>
      <td>
        ${myRole === "admin" ? `
          <button class="btn-icon" onclick="openRoleEdit('${u.id}','${u.role}','${u.full_name||u.email}')" title="Rol değiştir"><i class="ti ti-edit"></i></button>
          <button class="btn-icon" onclick="openPassModal('${u.id}')" title="Şifre değiştir"><i class="ti ti-key"></i></button>
          ${u.id !== currentUser.id ? `<button class="btn-icon red" onclick="deleteUser('${u.id}')" title="Sil"><i class="ti ti-trash"></i></button>` : ""}
        ` : `<button class="btn-icon" onclick="openPassModal('${u.id}')" title="Şifre değiştir"><i class="ti ti-key"></i></button>`}
      </td>
    </tr>`).join("");
}

function showAddUser() {
  document.getElementById("addUserForm").style.display = "block";
}
function hideAddUser() {
  document.getElementById("addUserForm").style.display = "none";
  document.getElementById("addUserErr").style.display = "none";
}

async function addUser() {
  const name = document.getElementById("newName").value.trim();
  const email = document.getElementById("newEmail").value.trim();
  const pass = document.getElementById("newPass").value;
  const role = document.getElementById("newRole").value;
  const errEl = document.getElementById("addUserErr");
  errEl.style.display = "none";

  if (!name || !email || !pass) { errEl.textContent = "Tüm alanları doldurun."; errEl.style.display = "block"; return; }
  if (pass.length < 6) { errEl.textContent = "Şifre en az 6 karakter olmalı."; errEl.style.display = "block"; return; }

  const { data, error } = await _supabase.auth.admin.createUser({
    email, password: pass,
    user_metadata: { full_name: name, role },
    email_confirm: true
  });

  if (error) { errEl.textContent = "Hata: " + error.message; errEl.style.display = "block"; return; }

  hideAddUser();
  document.getElementById("newName").value = "";
  document.getElementById("newEmail").value = "";
  document.getElementById("newPass").value = "";
  loadUsers();
}

async function deleteUser(uid) {
  if (!confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) return;
  const { error } = await _supabase.auth.admin.deleteUser(uid);
  if (error) { alert("Silinemedi: " + error.message); return; }
  loadUsers();
}

function openRoleEdit(uid, currentRole, name) {
  const roles = ["denetim","departman_lideri","admin"];
  const labels = { denetim:"Denetim", departman_lideri:"Departman lideri", admin:"Admin" };
  const newRole = prompt(
    `"${name}" kullanıcısının yeni rolünü girin:\n- denetim\n- departman_lideri\n- admin`,
    currentRole
  );
  if (!newRole || !roles.includes(newRole)) return;
  updateRole(uid, newRole);
}

async function updateRole(uid, role) {
  const { error } = await _supabase.from("profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", uid);
  if (error) { alert("Güncellenemedi: " + error.message); return; }
  loadUsers();
}

function openPassModal(uid) {
  document.getElementById("passUserId").value = uid;
  document.getElementById("newPassModal").value = "";
  document.getElementById("passModalErr").style.display = "none";
  const modal = document.getElementById("passModal");
  modal.style.display = "flex";
}

function closePassModal() {
  document.getElementById("passModal").style.display = "none";
}

async function changePassword() {
  const uid = document.getElementById("passUserId").value;
  const pass = document.getElementById("newPassModal").value;
  const errEl = document.getElementById("passModalErr");
  errEl.style.display = "none";

  if (pass.length < 6) { errEl.textContent = "Şifre en az 6 karakter olmalı."; errEl.style.display = "block"; return; }

  const { error } = await _supabase.auth.admin.updateUserById(uid, { password: pass });
  if (error) { errEl.textContent = "Hata: " + error.message; errEl.style.display = "block"; return; }

  closePassModal();
  alert("Şifre başarıyla güncellendi.");
}

// Oturum kontrolü - sayfa açıldığında
window.addEventListener("load", async () => {
  const { data: { session } } = await _supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadProfile();
    initApp();
  }
});
