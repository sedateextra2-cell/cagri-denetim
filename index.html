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

function exportExcel(type) {
  if (!allData.length) { alert("Önce veri yükleyin."); return; }

  const startDate = document.getElementById("startDate")?.value || "";
  const endDate = document.getElementById("endDate")?.value || "";
  const { start, end } = getTimeFilter();
  const dirLabel = d => { const s = String(d); if(s==="1") return "Giden"; if(s==="2") return "Gelen"; if(s==="3") return "Kaçan"; return d||"—"; };

  let rows = [];
  let sheetName = "";
  let fileName = "";

  if (type === "gorusmeler") {
    sheetName = "Görüşmeler";
    fileName = `gorusmeler_${startDate}_${endDate}.xlsx`;
    rows = [["Dahili","Personel","Departman","Yön","Saat","Süre (sn)","Çaldırma (sn)","Durum"]];
    allData.filter(r => inTimeRange(r) && (currentDept === "Tümü" || getDept(getExt(r)) === currentDept)).forEach(r => {
      rows.push([
        getExt(r), getName(r), getDept(getExt(r)), dirLabel(getDir(r)),
        fmtT(getTime(r)), getDur(r)??0, getRing(r)??0,
        getDur(r)===0?"Cevaplanmadı":"Bağlandı"
      ]);
    });
  }

  if (type === "performans") {
    sheetName = "Performans";
    fileName = `performans_${startDate}_${endDate}.xlsx`;
    rows = [["Dahili","Personel","Departman","Toplam Arama","Konuşma Süresi (sn)","Giden Arama","Gelen Süre (sn)","Ulaşılamayan"]];
    const byExt = {};
    allData.filter(inTimeRange).forEach(r => {
      const ext = getExt(r);
      if (!byExt[ext]) byExt[ext] = {ext, name:getName(r), total:0, totalDur:0, out:0, inDur:0, miss:0};
      byExt[ext].total++;
      const dur = getDur(r)||0; byExt[ext].totalDur += dur;
      const dir = String(getDir(r));
      if (dir==="1"||dir.toLowerCase().includes("out")) byExt[ext].out++; else byExt[ext].inDur += dur;
      if (dur===0) byExt[ext].miss++;
    });
    Object.values(byExt).sort((a,b)=>b.total-a.total).forEach(r => {
      rows.push([r.ext, r.name, getDept(r.ext), r.total, Math.round(r.totalDur), r.out, Math.round(r.inDur), r.miss]);
    });
  }

  if (type === "denetim") {
    sheetName = "Denetim";
    fileName = `denetim_${startDate}_${endDate}.xlsx`;
    rows = [["Personel","Departman","İlk Çağrı","Son Çağrı","Toplam","Sıfır Çaldırma","Durum","İhlaller"]];
    const byExt = {};
    allData.filter(inTimeRange).forEach(r => {
      const ext = getExt(r);
      if (!byExt[ext]) byExt[ext] = {ext, name:getName(r), calls:[]};
      byExt[ext].calls.push(r);
    });
    Object.values(byExt).forEach(p => {
      const dept = getDept(p.ext);
      const rule = RULES[dept];
      const sorted = p.calls.slice().sort((a,b)=>getTime(a).localeCompare(getTime(b)));
      const violations = []; let zeroRing = 0;
      const times = sorted.map(c=>getTime(c)).filter(Boolean);
      if (!times.length) return;
      sorted.forEach(c=>{ if(getRing(c)===0)zeroRing++; });
      if (zeroRing>0) violations.push(zeroRing+" adet sıfır çaldırma");
      if (rule) {
        if (toMin(times[0])>toMin(rule.ilk)) violations.push(`İlk çağrı ${fmtT(times[0])} (en geç ${rule.ilk})`);
        const oOnce = times.filter(t=>toMin(t)<=toMin(rule.ogleOnce));
        if (oOnce.length>0&&toMin(oOnce[oOnce.length-1])<toMin(rule.ogleOnce)) violations.push(`Öğle öncesi erken bırakılmış`);
        const oSonra = times.filter(t=>toMin(t)>toMin(rule.ogleOnce));
        if (oSonra.length>0&&toMin(oSonra[0])>toMin(rule.ogleSonrasi)) violations.push(`Öğle sonrası geç`);
        if (toMin(times[times.length-1])<toMin(rule.gunSonu)) violations.push(`Gün sonu erken bırakılmış`);
        [times.filter(t=>toMin(t)<=toMin(rule.ogleOnce)), times.filter(t=>toMin(t)>=toMin(rule.ogleSonrasi))].forEach((list,i)=>{
          for(let j=1;j<list.length;j++){const diff=toMin(list[j])-toMin(list[j-1]);if(diff>rule.aralik)violations.push(`${i===0?"Sabah":"Öğleden sonra"} aralık ${diff}dk`);}
        });
      }
      rows.push([p.name, dept, fmtT(times[0]), fmtT(times[times.length-1]), p.calls.length, zeroRing, violations.length===0?"Uygun":"İhlal var", violations.join("; ")]);
    });
  }

  if (type === "supheli") {
    sheetName = "Şüpheli";
    fileName = `supheli_${startDate}_${endDate}.xlsx`;
    rows = [["Dahili","Personel","Departman","Saat","Yön","Çaldırma (sn)","Süre (sn)"]];
    allData.filter(r => inTimeRange(r) && getRing(r) === 0).forEach(r => {
      rows.push([getExt(r), getName(r), getDept(getExt(r)), fmtT(getTime(r)), dirLabel(getDir(r)), 0, getDur(r)??0]);
    });
  }

  if (rows.length <= 1) { alert("Dışa aktarılacak veri yok."); return; }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = rows[0].map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}
