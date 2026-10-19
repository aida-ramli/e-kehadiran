
const API_URL = "https://script.google.com/macros/s/AKfycbzOFw8KrGQpASsH71a6CDM3yBAPcuVd5hertcIO9HWVFIwiQpxTh2EEGwARwJf574xW/exec";

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

let senaraiKelas = [];

function setTarikhHariIni() {
  const sekarang = new Date();
  const offset = sekarang.getTimezoneOffset();
  const tarikhTempatan = new Date(sekarang.getTime() - offset * 60000);
  tarikhInput.value = tarikhTempatan.toISOString().slice(0, 10);
}

function paparMesej(teks, jenis = "") {
  message.textContent = teks;
  message.className = "message";

  if (jenis) {
    message.classList.add(jenis);
  }
}

async function muatkanKelas() {
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
    classStatus.textContent = `${senaraiKelas.length} kelas berjaya dimuatkan.`;
  } catch (error) {
    classStatus.textContent = "Senarai kelas gagal dimuatkan. Sila muat semula halaman.";
    paparMesej(`Ralat memuatkan kelas: ${error.message}`, "error");
  }
}

function kemasKiniPaparan() {
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

  if (bilanganHadirInput.value === "") {
    jumlahHadirPreview.textContent = "—";
    jumlahTidakHadirDisplay.textContent = "—";
    peratusKehadiranDisplay.textContent = "—";
    saveButton.disabled = false;
    return;
  }

  const hadir = Number(bilanganHadirInput.value);

  if (!Number.isInteger(hadir) || hadir < 0 || hadir > jumlahMurid) {
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
  saveButton.disabled = false;
}

kelasSelect.addEventListener("change", () => {
  paparMesej("");
  kemasKiniPaparan();
});

bilanganHadirInput.addEventListener("input", kemasKiniPaparan);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  paparMesej("");

  const kelasDipilih = senaraiKelas.find(
    (kelas) => kelas.id === kelasSelect.value
  );

  if (!kelasDipilih) {
    paparMesej("Sila pilih kelas terlebih dahulu.", "error");
    return;
  }

  const hadir = Number(bilanganHadirInput.value);

  if (
    bilanganHadirInput.value.trim() === "" ||
    !Number.isInteger(hadir) ||
    hadir < 0 ||
    hadir > Number(kelasDipilih.jumlahMurid)
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
  } catch (error) {
    paparMesej(
      `Rekod mungkin belum berjaya disimpan. Semak Google Sheets sebelum cuba lagi. Maklumat: ${error.message}`,
      "error"
    );
  } finally {
    saveButton.textContent = "Simpan Kehadiran";
    kemasKiniPaparan();
  }
});

setTarikhHariIni();
muatkanKelas();

const filterTarikh = document.getElementById("filterTarikh");
const filterKelas = document.getElementById("filterKelas");
const searchHistoryButton = document.getElementById("searchHistoryButton");
const resetHistoryButton = document.getElementById("resetHistoryButton");
const historyMessage = document.getElementById("historyMessage");
const historyResults = document.getElementById("historyResults");

function paparMesejSejarah(teks, jenis = "") {
  historyMessage.textContent = teks;
  historyMessage.className = "message";

  if (jenis) {
    historyMessage.classList.add(jenis);
  }
}

function isiPilihanKelasSejarah() {
  senaraiKelas.forEach((kelas) => {
    const option = document.createElement("option");
    option.value = kelas.id;
    option.textContent = kelas.nama;
    filterKelas.appendChild(option);
  });
}

async function cariSejarahKehadiran() {
  searchHistoryButton.disabled = true;
  resetHistoryButton.disabled = true;
  paparMesejSejarah("Sedang mendapatkan rekod...");
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
      throw new Error("Pelayan tidak dapat dihubungi.");
    }

    const result = await response.json();

    if (result.status !== "berjaya" || !Array.isArray(result.data)) {
      throw new Error("Format data rekod tidak sah.");
    }

    paparMesejSejarah(`${result.data.length} rekod dijumpai.`);

    if (result.data.length === 0) {
      const kosong = document.createElement("p");
      kosong.textContent = "Tiada rekod untuk pilihan ini.";
      historyResults.appendChild(kosong);
      return;
    }

    result.data.forEach((rekod) => {
      const card = document.createElement("article");
      card.className = "history-record";

      const tajuk = document.createElement("h4");
      tajuk.textContent = rekod.namaKelas;

      const tarikh = document.createElement("p");
      tarikh.textContent = `Tarikh: ${rekod.tarikh}`;

      const bilangan = document.createElement("p");
      bilangan.textContent =
        `Hadir: ${rekod.bilanganHadir} / ${rekod.jumlahMurid}`;

      const tidakHadir = document.createElement("p");
      tidakHadir.textContent =
        `Tidak hadir: ${rekod.bilanganTidakHadir}`;

      const peratus = document.createElement("p");
      peratus.textContent =
        `Kehadiran: ${Number(rekod.peratusKehadiran).toFixed(2)}%`;

      const id = document.createElement("small");
      id.textContent = `ID rekod: ${rekod.idRekod}`;

      card.append(tajuk, tarikh, bilangan, tidakHadir, peratus, id);

      if (rekod.catatan) {
        const catatan = document.createElement("p");
        catatan.textContent = `Catatan: ${rekod.catatan}`;
        card.appendChild(catatan);
      }

      historyResults.appendChild(card);
    });
  } catch (error) {
    paparMesejSejarah(
      `Gagal memuatkan sejarah: ${error.message}`,
      "error"
    );
  } finally {
    searchHistoryButton.disabled = false;
    resetHistoryButton.disabled = false;
  }
}

searchHistoryButton.addEventListener("click", cariSejarahKehadiran);

resetHistoryButton.addEventListener("click", () => {
  filterTarikh.value = "";
  filterKelas.value = "";
  cariSejarahKehadiran();
});

// Isi dropdown sejarah selepas senarai kelas selesai dimuatkan.
const muatkanKelasAsal = muatkanKelas;

muatkanKelas = async function () {
  await muatkanKelasAsal();

  if (senaraiKelas.length > 0) {
    isiPilihanKelasSejarah();
  }
};

cariSejarahKehadiran();
