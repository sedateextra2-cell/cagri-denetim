function showPage(id, el) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("page-" + id).classList.add("active");
  el.classList.add("active");
  if (id === "kullanici") loadUsers();
}

function switchChart(mode, el) {
  chartMode = mode;
  document.querySelectorAll(".ctab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  renderChart();
}

function filterDept(dept, el) {
  currentDept = dept;
  document.querySelectorAll(".dtab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  renderGorusmeler();
}
