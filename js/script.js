
const API_URL = "https://script.google.com/macros/s/AKfycbzOFw8KrGQpASsH71a6CDM3yBAPcuVd5hertcIO9HWVFIwiQpxTh2EEGwARwJf574xW/exec";

// ========================================
// ELEMEN BORANG KEHADIRAN
// ========================================

const form = document.getElementById("attendanceForm");
const tarikhInput = document.getElementById("tarikh");
const kelasSelect = document.getElementById("kelas");
const bilanganHadirInput = document.getElementById("bilanganHadir");
const catatanInput = document.getElementById("catatan");

const jumlahMuridDisplay = document.getElementById("jumlahMurid");
const jumlahHadirPreview = document.getElementById("jumlahHadirPreview");
const jumlahTidakHadirDisplay = document.getElementById("jumlahTidakHadir");
const peratusKehadiranDisplay = document.getElementById("peratusKehadiran");

const classStatus = document.getElementById("classStatus");
const saveButton = document.getElementById("saveButton");
const message = document.getElementById("message");

// ========================================
// ELEMEN SEJARAH KEHADIRAN
// ========================================

const filterTarikh = document.getElementById("filterTarikh");
const filterKelas = document.getElementById("filterKelas");
const searchHistoryButton = document.getElementById("searchHistoryButton");
const resetHistoryButton = document.getElementById("resetHistoryButton");
const historyMessage = document.getElementById("historyMessage");
const historyResults = document.getElementById("historyResults");

let senaraiKelas = [];
let sedangMenyimpan = false;
let sedangMencari = false;

// ========================================
// TARIKH MALAYSIA
// ========================================

function tarikhMalaysiaHariIni() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const get = (type) => parts.find(p => p.type === type).value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function setTarikhHariIni() {
  if (tarikhInput) {
    tarikhInput.value = tarikhMalaysiaHariIni();
  }

  if (filterTarikh) {
    filterTarikh.value = tarikhMalaysiaHariIni();
  }
}

// ========================================
// MESEJ STATUS
// ========================================

function paparMesej(teks, jenis = "") {
  if (!message) return;

  message.textContent = teks;
  message.className = "message";

  if (jenis) {
    message.classList.add(jenis);
  }
}

function paparMesejSejarah(teks, jenis = "") {
  if (!historyMessage) return;

  historyMessage.textContent = teks;
  historyMessage.className = "message";

  if (jenis) {
    historyMessage.classList.add(jenis);
  }
}

// ========================================
// MUATKAN SENARAI KELAS
// ========================================

async function muatkanKelas() {
  if (!kelasSelect || !classStatus || !saveButton) return;

  classStatus.textContent = "Memuatkan senarai kelas...";
  kelasSelect.disabled = true;
  saveButton.disabled = true;

  try {
    const response = await fetch(`${API_URL}?action=kelas`);

    if (!response.ok) {
      throw new Error("Tidak dapat menghubungi pelayan.");
    }

    const result = await response.json();

    if (result.status !== "berjaya" || !Array.isArray(result.data)) {
      throw new Error("Format data kelas tidak sah.");
    }

    senaraiKelas = result.data;

    kelasSelect.innerHTML = '<option value="">Sila pilih kelas</option>';

    senaraiKelas.forEach((kelas) => {
      const option = document.createElement("option");
      option.value = kelas.id;
      option.textContent = kelas.nama;
      kelasSelect.appendChild(option);
    });

    kelasSelect.disabled = false;
    classStatus.textContent =
      `${senaraiKelas.length} kelas berjaya dimuatkan.`;

    isiPilihanKelasSejarah();
    kemasKiniPaparan();

    // Paparkan rekod hari ini selepas senarai kelas siap.
    await cariSejarahKehadiran();
  } catch (error) {
    classStatus.textContent =
      "Senarai kelas gagal dimuatkan. Sila muat semula halaman.";

    paparMesej(`Ralat memuatkan kelas: ${error.message}`, "error");
    paparMesejSejarah(
      "Sejarah belum dapat dimuatkan kerana senarai kelas gagal diperoleh.",
      "error"
    );
  }
}

// ========================================
// DROPDOWN SEJARAH
// ========================================

function isiPilihanKelasSejarah() {
  if (!filterKelas) return;

  filterKelas.innerHTML = '<option value="">Semua kelas</option>';

  senaraiKelas.forEach((kelas) => {
    const option = document.createElement("option");
    option.value = kelas.id;
    option.textContent = kelas.nama;
    filterKelas.appendChild(option);
  });
}

// ========================================
// KIRAAN KEHADIRAN
// ========================================

function kemasKiniPaparan() {
  if (!kelasSelect || !bilanganHadirInput || !saveButton) return;

  const kelasDipilih = senaraiKelas.find(
    (kelas) => kelas.id === kelasSelect.value
  );

  if (!kelasDipilih) {
    jumlahMuridDisplay.textContent = "—";
    jumlahHadirPreview.textContent = "—";
    jumlahTidakHadirDisplay.textContent = "—";
    peratusKehadiranDisplay.textContent = "—";

    bilanganHadirInput.value = "";
    bilanganHadirInput.disabled = true;
    bilanganHadirInput.removeAttribute("max");

    saveButton.disabled = true;
    return;
  }

  const jumlahMurid = Number(kelasDipilih.jumlahMurid);

  jumlahMuridDisplay.textContent = jumlahMurid;
  bilanganHadirInput.disabled = false;
  bilanganHadirInput.max = jumlahMurid;

  if (bilanganHadirInput.value.trim() === "") {
    jumlahHadirPreview.textContent = "—";
    jumlahTidakHadirDisplay.textContent = "—";
    peratusKehadiranDisplay.textContent = "—";

    saveButton.disabled = sedangMenyimpan;
    return;
  }

  const hadir = Number(bilanganHadirInput.value);

  if (
    !Number.isInteger(hadir) ||
    hadir < 0 ||
    hadir > jumlahMurid
  ) {
    jumlahHadirPreview.textContent = "—";
    jumlahTidakHadirDisplay.textContent = "—";
    peratusKehadiranDisplay.textContent = "—";

    saveButton.disabled = true;
    return;
  }

  const tidakHadir = jumlahMurid - hadir;

  const peratus = jumlahMurid > 0
    ? ((hadir / jumlahMurid) * 100).toFixed(2)
    : "0.00";

  jumlahHadirPreview.textContent = hadir;
  jumlahTidakHadirDisplay.textContent = tidakHadir;
  peratusKehadiranDisplay.textContent = `${peratus}%`;

  saveButton.disabled = sedangMenyimpan;
}

// ========================================
// EVENT BORANG KEHADIRAN
// ========================================

kelasSelect.addEventListener("change", () => {
  paparMesej("");
  kemasKiniPaparan();
});

bilanganHadirInput.addEventListener("input", kemasKiniPaparan);

// ========================================
// SIMPAN KEHADIRAN
// ========================================

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (sedangMenyimpan) return;

  paparMesej("");

  const kelasDipilih = senaraiKelas.find(
    (kelas) => kelas.id === kelasSelect.value
  );

  if (!kelasDipilih) {
    paparMesej("Sila pilih kelas terlebih dahulu.", "error");
    return;
  }

  if (!tarikhInput.value) {
    paparMesej("Sila pilih tarikh kehadiran.", "error");
    return;
  }

  const hadir = Number(bilanganHadirInput.value);
  const jumlahMurid = Number(kelasDipilih.jumlahMurid);

  if (
    bilanganHadirInput.value.trim() === "" ||
    !Number.isInteger(hadir) ||
    hadir < 0 ||
    hadir > jumlahMurid
  ) {
    paparMesej("Sila masukkan bilangan hadir yang sah.", "error");
    return;
  }

  const payload = {
    tarikh: tarikhInput.value,
    idKelas: kelasDipilih.id,
    bilanganHadir: hadir,
    catatan: catatanInput.value.trim()
  };

  sedangMenyimpan = true;
  saveButton.disabled = true;
  saveButton.textContent = "Sedang menyimpan...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status !== "berjaya") {
      throw new Error(result.mesej || "Rekod gagal disimpan.");
    }

    paparMesej(
      `Berjaya disimpan! ID rekod: ${result.data.idRekod}`,
      "success"
    );

    bilanganHadirInput.value = "";
    catatanInput.value = "";

    kemasKiniPaparan();

    // Jika rekod yang disimpan ialah untuk tarikh yang sedang ditapis,
    // kemas kini sejarah secara automatik.
    if (filterTarikh.value === payload.tarikh) {
      await cariSejarahKehadiran();
    }
  } catch (error) {
    paparMesej(
      `Simpanan tidak dapat disahkan. Semak Google Sheets sebelum mencuba semula. Maklumat: ${error.message}`,
      "error"
    );
  } finally {
    sedangMenyimpan = false;
    saveButton.textContent = "Simpan Kehadiran";
    kemasKiniPaparan();
  }
});

// ========================================
// PAPARAN REKOD SEJARAH
// ========================================

function paparSenaraiRekod(rekod) {
  if (!historyResults) return;

  historyResults.replaceChildren();

  if (rekod.length === 0) {
    const kosong = document.createElement("p");
    kosong.textContent = "Tiada rekod kehadiran untuk pilihan ini.";
    historyResults.appendChild(kosong);
    return;
  }

  rekod.forEach((item) => {
    const card = document.createElement("article");
    card.className = "history-record";

    const tajuk = document.createElement("h4");
    tajuk.textContent = item.namaKelas;

    const tarikh = document.createElement("p");
    tarikh.textContent = `Tarikh: ${item.tarikh}`;

    const bilangan = document.createElement("p");
    bilangan.textContent =
      `Hadir: ${item.bilanganHadir} / ${item.jumlahMurid}`;

    const tidakHadir = document.createElement("p");
    tidakHadir.textContent =
      `Tidak hadir: ${item.bilanganTidakHadir}`;

    const peratus = document.createElement("p");
    peratus.textContent =
      `Kehadiran: ${Number(item.peratusKehadiran).toFixed(2)}%`;

    const id = document.createElement("small");
    id.textContent = `ID rekod: ${item.idRekod}`;

    card.append(tajuk, tarikh, bilangan, tidakHadir, peratus, id);

    if (item.catatan) {
      const catatan = document.createElement("p");
      catatan.textContent = `Catatan: ${item.catatan}`;
      card.appendChild(catatan);
    }

    historyResults.appendChild(card);
  });
}

// ========================================
// CARI SEJARAH KEHADIRAN
// ========================================

async function cariSejarahKehadiran() {
  if (!filterTarikh || !filterKelas || !historyResults) return;
  if (sedangMencari) return;

  sedangMencari = true;

  if (searchHistoryButton) searchHistoryButton.disabled = true;
  if (resetHistoryButton) resetHistoryButton.disabled = true;

  paparMesejSejarah("Sedang memuatkan rekod...");
  historyResults.replaceChildren();

  try {
    const parameter = new URLSearchParams({
      action: "rekod"
    });

    if (filterTarikh.value) {
      parameter.set("tarikh", filterTarikh.value);
    }

    if (filterKelas.value) {
      parameter.set("idKelas", filterKelas.value);
    }

    const response = await fetch(`${API_URL}?${parameter.toString()}`);

    if (!response.ok) {
      throw new Error(`Ralat pelayan: ${response.status}`);
    }

    const result = await response.json();

    if (result.status !== "berjaya" || !Array.isArray(result.data)) {
      throw new Error(result.mesej || "Format data rekod tidak sah.");
    }

    paparSenaraiRekod(result.data);
    paparMesejSejarah(`${result.data.length} rekod dijumpai.`);
  } catch (error) {
    paparMesejSejarah(
      `Gagal memuatkan sejarah: ${error.message}`,
      "error"
    );
  } finally {
    sedangMencari = false;

    if (searchHistoryButton) searchHistoryButton.disabled = false;
    if (resetHistoryButton) resetHistoryButton.disabled = false;
  }
}

// ========================================
// BUTANG SEJARAH
// ========================================

if (searchHistoryButton) {
  searchHistoryButton.addEventListener("click", () => {
    cariSejarahKehadiran();
  });
}

if (resetHistoryButton) {
  resetHistoryButton.textContent = "Rekod Hari Ini";

  resetHistoryButton.addEventListener("click", () => {
    filterTarikh.value = tarikhMalaysiaHariIni();
    filterKelas.value = "";
    cariSejarahKehadiran();
  });
}

// ========================================
// MULAKAN SISTEM
// ========================================

setTarikhHariIni();
muatkanKelas();
