
const API_URL = "https://script.google.com/macros/s/AKfycbzOFw8KrGQpASsH71a6CDM3yBAPcuVd5hertcIO9HWVFIwiQpxTh2EEGwARwJf574xW/exec";

const $ = id => document.getElementById(id);

let senaraiKelas = [];
let sedangMenyimpan = false;
let sedangMencari = false;

function tarikhMalaysiaHariIni() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const get = type => parts.find(p => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function paparMesej(id, teks, jenis = "") {
  const elemen = $(id);
  if (!elemen) return;

  elemen.textContent = teks;
  elemen.className = "message";

  if (jenis) elemen.classList.add(jenis);
}

async function dapatkanJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Ralat pelayan: ${response.status}`);
  }

  const result = await response.json();

  if (result.status !== "berjaya") {
    throw new Error(result.mesej || "Permintaan gagal.");
  }

  return result.data;
}

async function hantarData(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (result.status !== "berjaya") {
    throw new Error(result.mesej || "Operasi gagal.");
  }

  return result.data;
}

// ========================================
// KELAS
// ========================================

async function muatkanKelas() {
  $("classStatus").textContent = "Memuatkan kelas...";

  try {
    senaraiKelas = await dapatkanJSON(`${API_URL}?action=kelas`);

    $("kelas").replaceChildren();
    $("filterKelas").replaceChildren();
    $("editKelas").replaceChildren();

    tambahPilihan($("kelas"), "", "Sila pilih kelas");
    tambahPilihan($("filterKelas"), "", "Semua kelas");
    tambahPilihan($("editKelas"), "", "Sila pilih kelas");

    senaraiKelas.forEach(kelas => {
      tambahPilihan($("kelas"), kelas.id, kelas.nama);
      tambahPilihan($("filterKelas"), kelas.id, kelas.nama);
      tambahPilihan($("editKelas"), kelas.id, kelas.nama);
    });

    $("classStatus").textContent =
      `${senaraiKelas.length} kelas berjaya dimuatkan.`;

    kemasKiniKiraan();
    await Promise.all([
      cariSejarahKehadiran(),
      muatDashboard(),
      muatLaporanBulanan()
    ]);

  } catch (error) {
    $("classStatus").textContent = "Kelas gagal dimuatkan.";
    paparMesej("message", error.message, "error");
  }
}

function tambahPilihan(select, value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  select.appendChild(option);
}

// ========================================
// KIRAAN BORANG UTAMA
// ========================================

function kemasKiniKiraan() {
  const kelas = senaraiKelas.find(k => k.id === $("kelas").value);
  const input = $("bilanganHadir");

  if (!kelas) {
    $("jumlahMurid").textContent = "—";
    $("jumlahHadirPreview").textContent = "—";
    $("jumlahTidakHadir").textContent = "—";
    $("peratusKehadiran").textContent = "—";
    input.value = "";
    input.disabled = true;
    input.removeAttribute("max");
    $("saveButton").disabled = true;
    return;
  }

  const jumlah = Number(kelas.jumlahMurid);
  input.disabled = false;
  input.max = jumlah;
  $("jumlahMurid").textContent = jumlah;

  if (input.value.trim() === "") {
    $("jumlahHadirPreview").textContent = "—";
    $("jumlahTidakHadir").textContent = "—";
    $("peratusKehadiran").textContent = "—";
    $("saveButton").disabled = sedangMenyimpan;
    return;
  }

  const hadir = Number(input.value);

  if (!Number.isInteger(hadir) || hadir < 0 || hadir > jumlah) {
    $("jumlahHadirPreview").textContent = "—";
    $("jumlahTidakHadir").textContent = "—";
    $("peratusKehadiran").textContent = "—";
    $("saveButton").disabled = true;
    return;
  }

  $("jumlahHadirPreview").textContent = hadir;
  $("jumlahTidakHadir").textContent = jumlah - hadir;
  $("peratusKehadiran").textContent =
    `${jumlah ? (hadir / jumlah * 100).toFixed(2) : "0.00"}%`;

  $("saveButton").disabled = sedangMenyimpan;
}

$("kelas").addEventListener("change", () => {
  paparMesej("message", "");
  kemasKiniKiraan();
});

$("bilanganHadir").addEventListener("input", kemasKiniKiraan);

// ========================================
// SIMPAN REKOD
// ========================================

$("attendanceForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (sedangMenyimpan) return;

  const kelas = senaraiKelas.find(k => k.id === $("kelas").value);
  const hadirText = $("bilanganHadir").value.trim();
  const hadir = Number(hadirText);
  const tarikh = $("tarikh").value;

  if (!kelas || !tarikh || hadirText === "" ||
      !Number.isInteger(hadir) || hadir < 0 ||
      hadir > Number(kelas.jumlahMurid)) {
    paparMesej("message", "Sila semak tarikh, kelas dan bilangan hadir.", "error");
    return;
  }

  sedangMenyimpan = true;
  $("saveButton").disabled = true;
  $("saveButton").textContent = "Sedang menyimpan...";

  try {
    const result = await hantarData({
      action: "simpan",
      tarikh,
      idKelas: kelas.id,
      bilanganHadir: hadir,
      catatan: $("catatan").value.trim()
    });

    paparMesej(
      "message",
      `Kehadiran berjaya disimpan. ID: ${result.idRekod}`,
      "success"
    );

    $("bilanganHadir").value = "";
    $("catatan").value = "";
    kemasKiniKiraan();

    if ($("filterTarikh").value === tarikh) {
      await Promise.all([cariSejarahKehadiran(), muatDashboard()]);
    }

    await muatLaporanBulanan();

  } catch (error) {
    paparMesej("message", error.message, "error");
  } finally {
    sedangMenyimpan = false;
    $("saveButton").textContent = "Simpan Kehadiran";
    kemasKiniKiraan();
  }
});

// ========================================
// SEJARAH KEHADIRAN
// ========================================

async function cariSejarahKehadiran() {
  if (sedangMencari) return;
  sedangMencari = true;

  $("searchHistoryButton").disabled = true;
  $("resetHistoryButton").disabled = true;
  paparMesej("historyMessage", "Sedang memuatkan rekod...");
  $("historyResults").replaceChildren();

  try {
    const tarikh = $("filterTarikh").value || tarikhMalaysiaHariIni();
    $("filterTarikh").value = tarikh;

    const params = new URLSearchParams({
      action: "rekod",
      tarikh
    });

    if ($("filterKelas").value) {
      params.set("idKelas", $("filterKelas").value);
    }

    const rekod = await dapatkanJSON(`${API_URL}?${params}`);
    paparSenaraiRekod(rekod);
    paparMesej("historyMessage", `${rekod.length} rekod dijumpai.`);
  } catch (error) {
    paparMesej("historyMessage", error.message, "error");
  } finally {
    sedangMencari = false;
    $("searchHistoryButton").disabled = false;
    $("resetHistoryButton").disabled = false;
  }
}

function paparSenaraiRekod(rekod) {
  const container = $("historyResults");
  container.replaceChildren();

  if (!rekod.length) {
    const kosong = document.createElement("p");
    kosong.className = "empty-state";
    kosong.textContent = "Tiada rekod kehadiran untuk pilihan ini.";
    container.appendChild(kosong);
    return;
  }

  rekod.forEach(item => {
    const card = document.createElement("article");
    card.className = "history-record";

    const tajuk = document.createElement("h3");
    tajuk.textContent = item.namaKelas;

    const butiran = document.createElement("div");
    butiran.className = "record-details";

    [
      `Tarikh: ${item.tarikh}`,
      `Hadir: ${item.bilanganHadir} / ${item.jumlahMurid}`,
      `Tidak hadir: ${item.bilanganTidakHadir}`,
      `Kehadiran: ${Number(item.peratusKehadiran).toFixed(2)}%`,
      `ID: ${item.idRekod}`
    ].forEach(teks => {
      const p = document.createElement("p");
      p.textContent = teks;
      butiran.appendChild(p);
    });

    if (item.catatan) {
      const catatan = document.createElement("p");
      catatan.textContent = `Catatan: ${item.catatan}`;
      butiran.appendChild(catatan);
    }

    const actions = document.createElement("div");
    actions.className = "record-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "button-small";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => bukaEdit(item));

    const padam = document.createElement("button");
    padam.type = "button";
    padam.className = "button-small button-danger";
    padam.textContent = "Padam";
    padam.addEventListener("click", () => padamRekod(item));

    actions.append(edit, padam);
    card.append(tajuk, butiran, actions);
    container.appendChild(card);
  });
}

$("searchHistoryButton").addEventListener("click", cariSejarahKehadiran);

$("resetHistoryButton").addEventListener("click", () => {
  $("filterTarikh").value = tarikhMalaysiaHariIni();
  $("filterKelas").value = "";
  cariSejarahKehadiran();
});

// ========================================
// EDIT REKOD
// ========================================

function bukaEdit(item) {
  $("editId").value = item.idRekod;
  $("editTarikh").value = item.tarikh;
  $("editKelas").value = item.idKelas;
  $("editHadir").value = item.bilanganHadir;
  $("editCatatan").value = item.catatan || "";

  $("editPanel").hidden = false;
  $("editPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  kemasKiniKiraanEdit();
}

function kemasKiniKiraanEdit() {
  const kelas = senaraiKelas.find(k => k.id === $("editKelas").value);
  const hadirText = $("editHadir").value.trim();
  const hadir = Number(hadirText);

  if (!kelas || hadirText === "" ||
      !Number.isInteger(hadir) || hadir < 0 ||
      hadir > Number(kelas.jumlahMurid)) {
    $("editPreview").textContent = "Masukkan bilangan hadir yang sah.";
    return;
  }

  $("editPreview").textContent =
    `Jumlah murid: ${kelas.jumlahMurid} | Tidak hadir: ${kelas.jumlahMurid - hadir} | Kehadiran: ${kelas.jumlahMurid ? (hadir / kelas.jumlahMurid * 100).toFixed(2) : "0.00"}%`;
}

$("editKelas").addEventListener("change", kemasKiniKiraanEdit);
$("editHadir").addEventListener("input", kemasKiniKiraanEdit);

$("cancelEdit").addEventListener("click", () => {
  $("editPanel").hidden = true;
  $("editForm").reset();
  paparMesej("editMessage", "");
});

$("editForm").addEventListener("submit", async event => {
  event.preventDefault();

  try {
    const result = await hantarData({
      action: "edit",
      idRekod: $("editId").value,
      tarikh: $("editTarikh").value,
      idKelas: $("editKelas").value,
      bilanganHadir: $("editHadir").value,
      catatan: $("editCatatan").value.trim()
    });

    paparMesej("editMessage", "Rekod berjaya dikemas kini.", "success");
    $("editPanel").hidden = true;

    $("filterTarikh").value = result.tarikh;
    $("filterKelas").value = "";
    $("tarikh").value = result.tarikh;

    await Promise.all([
      cariSejarahKehadiran(),
      muatDashboard(),
      muatLaporanBulanan()
    ]);

  } catch (error) {
    paparMesej("editMessage", error.message, "error");
  }
});

// ========================================
// PADAM REKOD
// ========================================

async function padamRekod(item) {
  const sah = confirm(
    `Padam rekod ${item.namaKelas} pada ${item.tarikh}?\n\nTindakan ini tidak boleh dibatalkan.`
  );

  if (!sah) return;

  try {
    await hantarData({
      action: "padam",
      idRekod: item.idRekod
    });

    paparMesej("historyMessage", `Rekod ${item.namaKelas} berjaya dipadam.`, "success");

    await Promise.all([
      cariSejarahKehadiran(),
      muatDashboard(),
      muatLaporanBulanan()
    ]);

  } catch (error) {
    paparMesej("historyMessage", error.message, "error");
  }
}

// ========================================
// DASHBOARD
// ========================================

async function muatDashboard() {
  try {
    const hariIni = tarikhMalaysiaHariIni();
    const params = new URLSearchParams({
      action: "rekod",
      tarikh: hariIni
    });

    const rekod = await dapatkanJSON(`${API_URL}?${params}`);
    const idsDirekod = new Set(rekod.map(item => item.idKelas));
    const belumDirekod = senaraiKelas.filter(k => !idsDirekod.has(k.id));

    const jumlahMuridDirekod = rekod.reduce(
      (jumlah, item) => jumlah + Number(item.jumlahMurid), 0
    );
    const jumlahHadir = rekod.reduce(
      (jumlah, item) => jumlah + Number(item.bilanganHadir), 0
    );
    const purata = jumlahMuridDirekod
      ? (jumlahHadir / jumlahMuridDirekod * 100).toFixed(2)
      : "0.00";

    $("dashboardRecorded").textContent = idsDirekod.size;
    $("dashboardMissing").textContent = belumDirekod.length;
    $("dashboardRate").textContent = `${purata}%`;

    $("missingClasses").replaceChildren();

    if (!belumDirekod.length) {
      const p = document.createElement("p");
      p.textContent = "Semua kelas telah direkodkan hari ini.";
      $("missingClasses").appendChild(p);
    } else {
      belumDirekod.forEach(kelas => {
        const p = document.createElement("p");
        p.textContent = kelas.nama;
        $("missingClasses").appendChild(p);
      });
    }
  } catch (error) {
    $("missingClasses").textContent = `Dashboard gagal dimuatkan: ${error.message}`;
  }
}

// ========================================
// LAPORAN BULANAN
// ========================================

async function muatLaporanBulanan() {
  const bulan = $("filterBulan").value;

  if (!bulan) return;

  try {
    const params = new URLSearchParams({
      action: "rekod",
      bulan
    });

    const rekod = await dapatkanJSON(`${API_URL}?${params}`);
    paparLaporan(rekod);
  } catch (error) {
    paparMesej("reportMessage", error.message, "error");
  }
}

function paparLaporan(rekod) {
  const container = $("reportResults");
  container.replaceChildren();

  const jumlahHadir = rekod.reduce(
    (jumlah, item) => jumlah + Number(item.bilanganHadir), 0
  );
  const jumlahMurid = rekod.reduce(
    (jumlah, item) => jumlah + Number(item.jumlahMurid), 0
  );
  const kadar = jumlahMurid ? (jumlahHadir / jumlahMurid * 100).toFixed(2) : "0.00";

  $("reportCount").textContent = rekod.length;
  $("reportRate").textContent = `${kadar}%`;
  paparMesej("reportMessage", `${rekod.length} rekod dalam laporan.`);

  if (!rekod.length) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = "Tiada rekod untuk bulan yang dipilih.";
    container.appendChild(p);
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const header = document.createElement("tr");

  ["Tarikh", "Kelas", "Jumlah Murid", "Hadir", "Tidak Hadir", "Kehadiran"].forEach(teks => {
    const th = document.createElement("th");
    th.textContent = teks;
    header.appendChild(th);
  });

  thead.appendChild(header);

  const tbody = document.createElement("tbody");

  rekod.forEach(item => {
    const row = document.createElement("tr");
    [
      item.tarikh,
      item.namaKelas,
      item.jumlahMurid,
      item.bilanganHadir,
      item.bilanganTidakHadir,
      `${Number(item.peratusKehadiran).toFixed(2)}%`
    ].forEach(teks => {
      const td = document.createElement("td");
      td.textContent = teks;
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  container.appendChild(table);
}

$("searchReportButton").addEventListener("click", muatLaporanBulanan);

$("printReportButton").addEventListener("click", () => {
  window.print();
});

// ========================================
// MULAKAN SISTEM
// ========================================

$("tarikh").value = tarikhMalaysiaHariIni();
$("filterTarikh").value = tarikhMalaysiaHariIni();

const bulanSemasa = tarikhMalaysiaHariIni().slice(0, 7);
$("filterBulan").value = bulanSemasa;

muatkanKelas();
