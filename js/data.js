let allData = [];
let extDeptMap = {};
let currentDept = "Tümü";
let mainChartInst = null;
let chartMode = "hourly";

// ---- HELPERS ----
function toMin(t) { if (!t) return null; const p = t.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]); }
function fmtT(t) { if (!t) return "—"; return t.substring(0, 5); }
function getExt(r) { return String(r.Extension || r.extension || r.ExtensionNumber || ""); }
function getName(r) { return r.ExtensionName || r.extensionName || r.Extension || "?"; }
function getTime(r) { return r.Time || r.time || ""; }
function getRing(r) { const v = r.RingTimeSecond ?? r.ringTimeSecond; return v != null ? parseInt(v) : null; }
function getDur(r) { const v = r.CallTimeSecond ?? r.callTimeSecond; return v != null ? parseInt(v) : null; }
function getDir(r) { return r.Direction || r.direction || r.EventType || ""; }
function getCallID(r) { return r.CallID || r.callID || r.callId || ""; }
function getDept(ext) { return extDeptMap[String(ext)] || "—"; }
function showErr(msg) { const el = document.getElementById("globalErr"); el.textContent = msg; el.style.display = "block"; }

function getTimeFilter() {
  const start = document.getElementById("startTime")?.value || "00:00";
  const end = document.getElementById("endTime")?.value || "23:59";
  return { start, end };
}

function inTimeRange(r) {
  const { start, end } = getTimeFilter();
  const t = getTime(r).substring(0, 5);
  return t >= start && t <= end;
}

// ---- SES KAYDI ----
async function playAudio(callID, btn) {
  if (!callID) { alert("Bu görüşme için ses kaydı bulunamadı."); return; }
  const company = document.getElementById("unitSelect").value;
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader"></i>';
  try {
    const res = await fetch(INVEKTO_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filterType: 4, callID: callID, companyCode: company })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.Status) throw new Error(json.Message || "Ses kaydı alınamadı");
    const audioUrl = Array.isArray(json.Data) ? json.Data[0] : json.Data;
    if (!audioUrl) throw new Error("Ses kaydı bulunamadı");
    showAudioPlayer(audioUrl, btn);
  } catch (e) {
    alert("Ses kaydı hatası: " + e.message);
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-player-play"></i>';
  }
}

function showAudioPlayer(url, btn) {
  const row = btn.closest("tr");
  const existingPlayer = row.querySelector(".audio-player-row");
  if (existingPlayer) { existingPlayer.remove(); btn.disabled = false; btn.innerHTML = '<i class="ti ti-player-play"></i>'; return; }
  const colCount = row.querySelectorAll("td").length;
  const playerRow = document.createElement("tr");
  playerRow.className = "audio-player-row";
  playerRow.innerHTML = `<td colspan="${colCount}" style="background:var(--navy3);padding:10px 16px">
    <div style="display:flex;align-items:center;gap:10px">
      <i class="ti ti-volume" style="color:var(--accent);font-size:16px"></i>
      <audio controls style="flex:1;height:32px" src="${url}">Tarayıcınız ses oynatmayı desteklemiyor.</audio>
      <button class="btn-icon" onclick="this.closest('tr').remove()" title="Kapat"><i class="ti ti-x"></i></button>
    </div>
  </td>`;
  row.insertAdjacentElement("afterend", playerRow);
  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-player-stop"></i>';
}

// ---- EXT-DEPT MAP (Supabase) ----
async function loadExtMap() {
  const company = document.getElementById("unitSelect").value;
  const { data } = await _supabase.from("ext_dept_map").select("*").eq("company_code", company);
  extDeptMap = {};
  (data || []).forEach(r => { extDeptMap[r.extension] = r.department; });
}

async function saveExtMap() {
  const company = document.getElementById("unitSelect").value;
  const rows = Object.entries(extDeptMap).map(([ext, dept]) => ({
    company_code: company, extension: ext, department: dept, updated_at: new Date().toISOString()
  }));
  const { error } = await _supabase.from("ext_dept_map").upsert(rows, { onConflict: "company_code,extension" });
  if (error) { alert("Kayıt hatası: " + error.message); return; }
  alert("Departman atamaları kaydedildi.");
  renderAll();
}

// ---- FETCH ----
async function fetchAll() {
  const date = document.getElementById("dateInput").value;
  const company = document.getElementById("unitSelect").value;
  if (!date) { showErr("Lütfen tarih seçin."); return; }
  document.getElementById("globalErr").style.display = "none";
  setLoading();
  await loadExtMap();
  try {
    const res = await fetch(INVEKTO_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filterType: 0, companyCode: company, startDate: date, endDate: date, reportType: 5 })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.Status) throw new Error(json.Message || "API hatası");
    allData = json.Data || [];
    renderAll();
    updateExtSettings();
  } catch (e) {
    showErr("API bağlantı hatası: " + e.message);
    setEmpty();
  }
}

function setLoading() {
  [["gorusmeTbody",9],["performansTbody",8],["denetimTbody",8],["suptbody",8]].forEach(([id,c]) => {
    document.getElementById(id).innerHTML = `<tr><td colspan="${c}" class="empty-td">Yükleniyor...</td></tr>`;
  });
}
function setEmpty() {
  [["gorusmeTbody",9],["performansTbody",8],["denetimTbody",8],["suptbody",8]].forEach(([id,c]) => {
    document.getElementById(id).innerHTML = `<tr><td colspan="${c}" class="empty-td">Veri bulunamadı.</td></tr>`;
  });
}

function renderAll() {
  renderDashboard();
  renderGorusmeler();
  renderPerformans();
  renderDenetim();
  renderSupheli();
}

// ---- DASHBOARD ----
function renderDashboard() {
  const filtered = allData.filter(inTimeRange);
  const total = filtered.length;
  const out = filtered.filter(r => { const d = String(getDir(r)); return d === "1" || d.toLowerCase().includes("out"); }).length;
  const miss = filtered.filter(r => getDur(r) === 0).length;
  const durs = filtered.map(r => getDur(r)).filter(v => v != null && v > 0);
  const avg = durs.length ? Math.round(durs.reduce((a,b)=>a+b,0)/durs.length) : 0;
  document.getElementById("d-total").textContent = total;
  document.getElementById("d-avg").textContent = avg;
  document.getElementById("d-out").textContent = out;
  document.getElementById("d-in").textContent = total - out;
  document.getElementById("d-miss").textContent = miss;
  renderChart();
}

function renderChart() {
  const filtered = allData.filter(inTimeRange);
  const labels = []; const data = [];
  if (chartMode === "hourly") {
    for (let h = 8; h <= 20; h++) {
      labels.push(h + ":00");
      data.push(filtered.filter(r => { const t = getTime(r); return t && parseInt(t.split(":")[0]) === h; }).length);
    }
  } else if (chartMode === "daily") {
    ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].forEach(d => { labels.push(d); data.push(0); });
    filtered.forEach(r => { const d = new Date((r.Date||r.date||"")+"T00:00:00").getDay(); const i = (d+6)%7; if(data[i]!=null)data[i]++; });
  } else if (chartMode === "weekly") {
    for (let w = 1; w <= 5; w++) { labels.push(w+". hafta"); data.push(0); }
    filtered.forEach(() => { data[0]++; });
  } else {
    ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"].forEach(m => { labels.push(m); data.push(0); });
    filtered.forEach(r => { const d = new Date((r.Date||r.date||"")+"T00:00:00"); if(!isNaN(d)) data[d.getMonth()]++; });
  }
  if (mainChartInst) mainChartInst.destroy();
  const ctx = document.getElementById("mainChart").getContext("2d");
  mainChartInst = new Chart(ctx, {
    type:"bar",
    data:{labels,datasets:[{label:"Çağrı",data,backgroundColor:"#4f8ef7",borderRadius:4,barThickness:16}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{x:{ticks:{color:"#6b7a99",font:{size:11}},grid:{display:false}},y:{ticks:{color:"#6b7a99",font:{size:11}},grid:{color:"rgba(255,255,255,0.05)"},beginAtZero:true}}}
  });
}

// ---- GÖRÜŞMELER ----
function renderGorusmeler() {
  const filtered = allData.filter(r => inTimeRange(r) && (currentDept === "Tümü" || getDept(getExt(r)) === currentDept));
  if (!filtered.length) { document.getElementById("gorusmeTbody").innerHTML='<tr><td colspan="9" class="empty-td">Bu filtrede veri yok.</td></tr>'; return; }
  const dirLabel = d => { const s = String(d); if(s==="1") return "Giden"; if(s==="2") return "Gelen"; if(s==="3") return "Kaçan"; return d||"—"; };
  document.getElementById("gorusmeTbody").innerHTML = filtered.map(r => {
    const ring = getRing(r); const dur = getDur(r); const callID = getCallID(r);
    return `<tr>
      <td>${getExt(r)}</td>
      <td class="td-bold">${getName(r)}</td>
      <td><span class="badge badge-info">${getDept(getExt(r))}</span></td>
      <td>${dirLabel(getDir(r))}</td>
      <td>${fmtT(getTime(r))}</td>
      <td>${dur??'—'}</td>
      <td>${ring===0?'<span class="badge badge-warn">0</span>':(ring!=null?ring:"—")}</td>
      <td>${dur===0?'<span class="badge badge-fail">Cevaplanmadı</span>':'<span class="badge badge-ok">Bağlandı</span>'}</td>
      <td>${callID?`<button class="btn-icon" onclick="playAudio('${callID}',this)" title="Ses kaydını dinle"><i class="ti ti-player-play"></i></button>`:'<span class="td-muted">—</span>'}</td>
    </tr>`;
  }).join("");
}

// ---- PERFORMANS ----
function renderPerformans() {
  const filtered = allData.filter(inTimeRange);
  const byExt = {};
  filtered.forEach(r => {
    const ext = getExt(r);
    if (!byExt[ext]) byExt[ext] = {ext, name:getName(r), total:0, totalDur:0, out:0, inDur:0, miss:0};
    byExt[ext].total++;
    const dur = getDur(r)||0; byExt[ext].totalDur += dur;
    const dir = String(getDir(r));
    if (dir==="1"||dir.toLowerCase().includes("out")) byExt[ext].out++; else byExt[ext].inDur += dur;
    if (dur===0) byExt[ext].miss++;
  });
  const rows = Object.values(byExt).sort((a,b)=>b.total-a.total);
  if (!rows.length) { document.getElementById("performansTbody").innerHTML='<tr><td colspan="8" class="empty-td">Veri yok.</td></tr>'; return; }
  document.getElementById("performansTbody").innerHTML = rows.map(r => `<tr>
    <td>${r.ext}</td><td class="td-bold">${r.name}</td>
    <td><span class="badge badge-info">${getDept(r.ext)}</span></td>
    <td>${r.total}</td><td>${Math.round(r.totalDur)}</td><td>${r.out}</td><td>${Math.round(r.inDur)}</td>
    <td>${r.miss>0?`<span class="badge badge-fail">${r.miss}</span>`:"0"}</td>
  </tr>`).join("");
}

// ---- DENETİM ----
function renderDenetim() {
  const filtered = allData.filter(inTimeRange);
  const byExt = {};
  filtered.forEach(r => {
    const ext = getExt(r);
    if (!byExt[ext]) byExt[ext] = {ext, name:getName(r), calls:[]};
    byExt[ext].calls.push(r);
  });
  const results = Object.values(byExt).map(p => {
    const dept = getDept(p.ext);
    const rule = RULES[dept];
    const sorted = p.calls.slice().sort((a,b)=>getTime(a).localeCompare(getTime(b)));
    const violations = []; let zeroRing = 0;
    const times = sorted.map(c=>getTime(c)).filter(Boolean);
    if (!times.length) return {name:p.name,dept,firstCall:null,lastCall:null,total:0,violations:[],zeroRing:0};
    sorted.forEach(c=>{ if(getRing(c)===0)zeroRing++; });
    if (zeroRing>0) violations.push(zeroRing+" adet sıfır çaldırma");
    if (rule) {
      if (toMin(times[0])>toMin(rule.ilk)) violations.push(`İlk çağrı ${fmtT(times[0])} (en geç ${rule.ilk})`);
      const oOnce = times.filter(t=>toMin(t)<=toMin(rule.ogleOnce));
      if (oOnce.length>0&&toMin(oOnce[oOnce.length-1])<toMin(rule.ogleOnce)) violations.push(`Öğle öncesi erken bırakılmış (${fmtT(oOnce[oOnce.length-1])})`);
      const oSonra = times.filter(t=>toMin(t)>toMin(rule.ogleOnce));
      if (oSonra.length>0&&toMin(oSonra[0])>toMin(rule.ogleSonrasi)) violations.push(`Öğle sonrası geç (${fmtT(oSonra[0])})`);
      if (toMin(times[times.length-1])<toMin(rule.gunSonu)) violations.push(`Gün sonu erken bırakılmış (${fmtT(times[times.length-1])})`);
      [times.filter(t=>toMin(t)<=toMin(rule.ogleOnce)), times.filter(t=>toMin(t)>=toMin(rule.ogleSonrasi))].forEach((list,i)=>{
        for(let j=1;j<list.length;j++){const diff=toMin(list[j])-toMin(list[j-1]);if(diff>rule.aralik)violations.push(`${i===0?"Sabah":"Öğleden sonra"}: ${fmtT(list[j-1])}–${fmtT(list[j])} arası ${diff}dk`);}
      });
    }
    return {name:p.name,dept,firstCall:times[0],lastCall:times[times.length-1],total:p.calls.length,violations,zeroRing};
  }).sort((a,b)=>b.violations.length-a.violations.length);

  document.getElementById("dn-total").textContent = results.length;
  document.getElementById("dn-ok").textContent = results.filter(r=>r.violations.length===0).length;
  document.getElementById("dn-fail").textContent = results.filter(r=>r.violations.length>0).length;
  document.getElementById("dn-zero").textContent = results.reduce((s,r)=>s+r.zeroRing,0);

  document.getElementById("denetimTbody").innerHTML = results.map(r => {
    const badge = r.violations.length===0
      ? `<span class="badge badge-ok"><i class="ti ti-check"></i> Uygun</span>`
      : `<span class="badge badge-fail"><i class="ti ti-alert-triangle"></i> ${r.violations.length} ihlal</span>`;
    const viols = r.violations.length>0
      ? `<div class="violations">${r.violations.map(v=>`<div class="viol"><i class="ti ti-point"></i>${v}</div>`).join("")}</div>`
      : `<span class="td-muted">—</span>`;
    return `<tr><td class="td-bold">${r.name}</td><td><span class="badge badge-info">${r.dept}</span></td>
      <td>${fmtT(r.firstCall)}</td><td>${fmtT(r.lastCall)}</td><td>${r.total}</td>
      <td>${r.zeroRing>0?`<span class="badge badge-warn">${r.zeroRing}</span>`:"—"}</td>
      <td>${badge}</td><td>${viols}</td></tr>`;
  }).join("");
}

// ---- ŞÜPHELİ ----
function renderSupheli() {
  const filtered = allData.filter(r => inTimeRange(r) && getRing(r) === 0);
  if (!filtered.length) { document.getElementById("suptbody").innerHTML='<tr><td colspan="8" class="empty-td">Şüpheli çağrı bulunamadı.</td></tr>'; return; }
  document.getElementById("suptbody").innerHTML = filtered.map(r => {
    const callID = getCallID(r);
    return `<tr>
      <td>${getExt(r)}</td><td class="td-bold">${getName(r)}</td>
      <td><span class="badge badge-info">${getDept(getExt(r))}</span></td>
      <td>${fmtT(getTime(r))}</td><td>${getDir(r)||"—"}</td>
      <td><span class="badge badge-warn">0</span></td><td>${getDur(r)??'—'}</td>
      <td>${callID?`<button class="btn-icon" onclick="playAudio('${callID}',this)" title="Ses kaydını dinle"><i class="ti ti-player-play"></i></button>`:'<span class="td-muted">—</span>'}</td>
    </tr>`;
  }).join("");
}

// ---- AYARLAR - EXT MAP ----
function updateExtSettings() {
  const exts = [...new Set(allData.map(r=>getExt(r)))].sort();
  if (!exts.length) { document.getElementById("extSettings").innerHTML='<div class="empty-td" style="padding:16px">Dahili bulunamadı.</div>'; return; }
  document.getElementById("extSettings").innerHTML = `<div class="ext-grid">${exts.map(ext=>`
    <div class="ext-row">
      <span class="ext-label">Dahili ${ext}</span>
      <select class="ext-select" id="es-${ext}" onchange="extDeptMap['${ext}']=this.value">
        <option value="—">— Atanmamış —</option>
        ${DEPTS.map(d=>`<option value="${d}"${extDeptMap[ext]===d?" selected":""}>${d}</option>`).join("")}
      </select>
    </div>`).join("")}</div>`;
}
