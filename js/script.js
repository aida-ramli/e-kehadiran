
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzkQyiBV-SQ8ZtdHUmJ6GhrbR2WnzXtxRcXxfIFc3e9CoS1b9Msyd8fE-AyLF_BSCqFJg/exec";

const jumlahMurid = {
  "PRA LILY": 24,
  "2 KVR MASAKAN": 8,
  "2 KVS PASTRI": 6,
  "1 MAWAR": 29,
  "1 MELATI": 28,
  "1 MELOR": 28,
  "2 MAWAR": 31,
  "2 MELATI": 30,
  "2 MELOR": 27,
  "3 MAWAR": 32,
  "3 MELATI": 33,
  "3 MELOR": 30,
  "4 BAKAWALI": 21,
  "4 CEMPAKA": 26,
  "4 KENANGA": 11,
  "4 SEROJA": 21,
  "5 BAKAWALI": 19,
  "5 CEMPAKA": 25,
  "5 KENANGA": 20,
  "5 SEROJA": 21
};

document.addEventListener("DOMContentLoaded", () => {
  const tarikh = new Date();

  const tarikhElement = document.getElementById("tarikhHariIni");
  if (tarikhElement) {
    tarikhElement.textContent = tarikh.toLocaleDateString("ms-MY", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  const kelasElement = document.getElementById("kelas");
  if (kelasElement) {
    kelasElement.addEventListener("change", tukarKelas);
  }

  const hadirElement = document.getElementById("hadir");
  if (hadirElement) {
    hadirElement.addEventListener("input", kira);
  }

  loadRekod();
});

function tukarKelas() {
  const kelas = document.getElementById("kelas").value;
  const jumlah = jumlahMurid[kelas] || 0;

  document.getElementById("jumlah").value = jumlah;
  document.getElementById("jumlahLabel").textContent =
    jumlah + " Orang";

  document.getElementById("hadir").value = "";
  document.getElementById("hadir").max = jumlah;

  document.getElementById("hadirView").textContent = "0";
  document.getElementById("takHadir").textContent = jumlah || "0";
  document.getElementById("peratus").textContent = "0.00%";

  document.getElementById("hadir").style.borderColor = "";

  // Tiada kelas dipilih: kosongkan jumlah yang dipaparkan.
  if (!kelas) {
    document.getElementById("takHadir").textContent = "0";
  }
}

function kira() {
  const jumlah = Number(document.getElementById("jumlah").value);
  const input = document.getElementById("hadir");
  const hadir = Number(input.value);

  if (input.value === "" || jumlah <= 0) {
    document.getElementById("hadirView").textContent = "0";
    document.getElementById("takHadir").textContent = jumlah || "0";
    document.getElementById("peratus").textContent = "0.00%";
    return;
  }

  if (hadir < 0 || hadir > jumlah) {
    input.style.borderColor = "red";
    document.getElementById("hadirView").textContent = "—";
    document.getElementById("takHadir").textContent = "—";
    document.getElementById("peratus").textContent = "Tidak sah";
    return;
  }

  input.style.borderColor = "";

  document.getElementById("hadirView").textContent = hadir;
  document.getElementById("takHadir").textContent = jumlah - hadir;
  document.getElementById("peratus").textContent =
    ((hadir / jumlah) * 100).toFixed(2) + "%";
}

async function simpan() {
  const kelas = document.getElementById("kelas").value;
  const hadirValue = document.getElementById("hadir").value;
  const jumlah = Number(document.getElementById("jumlah").value);
  const hadir = Number(hadirValue);

  if (!kelas) {
    alert("Sila pilih kelas dahulu.");
    return;
  }

  if (hadirValue === "" || !Number.isInteger(hadir)) {
    alert("Sila masukkan bilangan murid hadir yang sah.");
    return;
  }

  if (hadir < 0 || hadir > jumlah) {
    alert("Bilangan hadir mestilah antara 0 hingga " + jumlah + ".");
    return;
  }

  const button = document.getElementById("btnSimpan");
  const status = document.getElementById("status");
  const data = { kelas, jumlah, hadir };

  if (button) {
    button.disabled = true;
    button.textContent = "Menyimpan...";
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Data gagal disimpan.");
    }

    if (status) {
      status.textContent =
        "Kehadiran berjaya disimpan: " + result.kelas +
        " | Hadir " + result.hadir + "/" + result.jumlah +
        " | Tidak hadir " + result.tidakHadir +
        " | " + Number(result.peratus).toFixed(2) + "%";
    }

    await loadRekod();

  } catch (error) {
    console.error("simpan:", error);

    if (status) {
      status.textContent = "Gagal menyimpan: " + error.message;
    }

    alert("Gagal menyimpan kehadiran. Semak sambungan dan deployment Apps Script.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "💾 SIMPAN KEHADIRAN";
    }
  }
}

async function loadRekod() {
  const table = document.getElementById("rekod");
  if (!table) return;

  table.innerHTML = "";

  const header = document.createElement("tr");

  ["Kelas", "Murid", "Hadir", "Tidak Hadir", "%", "Tindakan"]
    .forEach(label => {
      const th = document.createElement("th");
      th.textContent = label;
      header.appendChild(th);
    });

  table.appendChild(header);

  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      throw new Error(data.error || "Format data tidak sah.");
    }

    if (data.length === 0) {
      tambahMesejJadual(table, "Tiada rekod kehadiran untuk hari ini.");
      return;
    }

    data.forEach(item => {
      const row = document.createElement("tr");

      const kelas = item.kelas ?? "";
      const jumlah = Number(item.jumlah) || 0;
      const hadir = Number(item.hadir) || 0;
      const tidakHadir = Number(item.tidakHadir) || 0;
      const peratus = Number(item.peratus) || 0;

      [kelas, jumlah, hadir, tidakHadir, peratus.toFixed(2) + "%"]
        .forEach((value, index) => {
          const td = document.createElement("td");
          td.textContent = value;

          if (index === 2) td.className = "hadir-text";
          if (index === 3) td.className = "tidak-text";
          if (index === 4) {
            const badge = document.createElement("span");
            badge.className = "peratus-badge";
            badge.textContent = value;
            td.textContent = "";
            td.appendChild(badge);
          }

          row.appendChild(td);
        });

      const actionCell = document.createElement("td");
      const editButton = document.createElement("button");

      editButton.type = "button";
      editButton.className = "edit-btn";
      editButton.textContent = "✏️";
      editButton.addEventListener("click", () => editKelas(kelas, hadir));

      actionCell.appendChild(editButton);
      row.appendChild(actionCell);
      table.appendChild(row);
    });

  } catch (error) {
    console.error("loadRekod:", error);
    tambahMesejJadual(table, "Gagal membaca rekod: " + error.message);
  }
}

function tambahMesejJadual(table, mesej) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");

  cell.colSpan = 6;
  cell.textContent = mesej;
  cell.style.textAlign = "center";

  row.appendChild(cell);
  table.appendChild(row);
}

function editKelas(kelas, hadir) {
  const kelasElement = document.getElementById("kelas");
  kelasElement.value = kelas;

  tukarKelas();

  document.getElementById("hadir").value = hadir;
  kira();

  window.scrollTo({ top: 0, behavior: "smooth" });
}
