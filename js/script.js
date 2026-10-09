const SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbzkQyiBV-SQ8ZtdHUmJ6GhrbR2WnzXtxRcXxfIFc3e9CoS1b9Msyd8fE-AyLF_BSCqFJg/exec";



// JUMLAH MURID SETIAP KELAS

const jumlahMurid = {


    "PRA LILY":24,

    "2 KVR MASAKAN":8,

    "2 KVS PASTRI":6,


    "1 MAWAR":29,
    "1 MELATI":28,
    "1 MELOR":28,


    "2 MAWAR":31,
    "2 MELATI":30,
    "2 MELOR":27,


    "3 MAWAR":32,
    "3 MELATI":33,
    "3 MELOR":30,


    "4 BAKAWALI":21,
    "4 CEMPAKA":26,
    "4 KENANGA":11,
    "4 SEROJA":21,


    "5 BAKAWALI":19,
    "5 CEMPAKA":25,
    "5 KENANGA":20,
    "5 SEROJA":21


};




let tarikh = new Date();


document.getElementById("tarikhHariIni").innerHTML =
tarikh.toLocaleDateString("ms-MY",{
weekday:"long",
day:"numeric",
month:"long",
year:"numeric"
});



loadRekod();





function kira(){


let jumlah =
Number(document.getElementById("jumlah").value);



let hadirInput =
document.getElementById("hadir");



let hadir =
Number(hadirInput.value);



if(hadirInput.value === ""){


document.getElementById("hadirView").innerHTML="0";

document.getElementById("takHadir").innerHTML="-";

document.getElementById("peratus").innerHTML="-";


return;

}




if(hadir > jumlah){


document.getElementById("takHadir").innerHTML="??";

document.getElementById("peratus").innerHTML="Tidak sah";


hadirInput.style.borderColor="red";


return;

}




hadirInput.style.borderColor="";



let tak =
jumlah-hadir;



let peratus =
((hadir/jumlah)*100).toFixed(2);



document.getElementById("hadirView").innerHTML=hadir;


document.getElementById("takHadir").innerHTML=tak;


document.getElementById("peratus").innerHTML=peratus;



}







function simpan(){



let kelas =
document.getElementById("kelas").value;



if(kelas === ""){


alert("⚠️ Sila pilih kelas dahulu.");

return;

}





let hadirValue =
document.getElementById("hadir").value;



let hadir =
Number(hadirValue);



let jumlah =
Number(document.getElementById("jumlah").value);




if(hadirValue===""){


alert("⚠️ Sila masukkan bilangan murid hadir.");


return;


}




if(hadir > jumlah){


alert(
"⚠️ Bilangan hadir tidak boleh melebihi jumlah murid ("+
jumlah+
" orang)."
);


return;


}




if(hadir < 0){


alert(
"⚠️ Bilangan hadir tidak boleh negatif."
);


return;


}





let button =
document.getElementById("btnSimpan");



button.innerHTML="⏳ Menyimpan...";

button.disabled=true;






let data={


kelas:kelas,


jumlah:jumlah,


hadir:hadir


};





fetch(SCRIPT_URL,{

method:"POST",

body:JSON.stringify(data)

})



.then(res=>res.json())



.then(response=>{



document.getElementById("status").innerHTML=

`

<div class="success-card">

<div class="success-icon">
✓
</div>


<h3>
Kehadiran Berjaya Disimpan
</h3>


<p>
🏫 ${data.kelas}
</p>


<p>
👥 Hadir:
<b>${data.hadir}/${data.jumlah}</b>
</p>


<p>
❌ Tidak hadir:
<b>${data.jumlah-data.hadir}</b>
</p>


<p>
📈 Kehadiran:
<b>${((data.hadir/data.jumlah)*100).toFixed(2)}%</b>
</p>


</div>

`;



button.innerHTML="💾 SIMPAN KEHADIRAN";

button.disabled=false;


loadRekod();



})



.catch(err=>{


console.log(err);


document.getElementById("status").innerHTML=
"❌ Gagal simpan";



button.innerHTML="💾 SIMPAN KEHADIRAN";

button.disabled=false;



});



}









function loadRekod() {
  const table = document.getElementById("rekod");

  table.innerHTML = `
    <tr>
      <th>Kelas</th>
      <th>Murid</th>
      <th>Hadir</th>
      <th>Tidak Hadir</th>
      <th>%</th>
      <th>Tindakan</th>
    </tr>
  `;

  fetch(SCRIPT_URL)
    .then(res => {
      if (!res.ok) {
        throw new Error("Gagal mendapatkan data.");
      }
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        throw new Error(
          data.error || "Format data daripada Apps Script tidak sah."
        );
      }

      // Tarikh hari ini dalam format dd/MM/yyyy.
      const sekarang = new Date();
      const hariIni =
        String(sekarang.getDate()).padStart(2, "0") + "/" +
        String(sekarang.getMonth() + 1).padStart(2, "0") + "/" +
        sekarang.getFullYear();

      // Tapis rekod hari ini sahaja.
      const rekodHariIni = data.filter(item => {
        let tarikh = item.tarikh ?? item.Tarikh ?? "";

        if (tarikh instanceof Date) {
          tarikh =
            String(tarikh.getDate()).padStart(2, "0") + "/" +
            String(tarikh.getMonth() + 1).padStart(2, "0") + "/" +
            tarikh.getFullYear();
        }

        return String(tarikh).trim() === hariIni;
      });

      if (rekodHariIni.length === 0) {
        table.innerHTML += `
          <tr>
            <td colspan="6" style="text-align:center">
              Tiada rekod kehadiran untuk hari ini.
            </td>
          </tr>
        `;
        return;
      }

      rekodHariIni.forEach(item => {
        const kelas = item.kelas ?? item.Kelas ?? "";
        const jumlah = Number(item.jumlah ?? item.Jumlah ?? 0);
        const hadir = Number(item.hadir ?? item.Hadir ?? 0);
        const tidakHadir = Number(
          item.tidakHadir ??
          item["Tidak Hadir"] ??
          (jumlah - hadir)
        );
        const peratus = Number(
          String(item.peratus ?? item.Peratus ?? 0).replace("%", "")
        );

        const tr = document.createElement("tr");

        [
          kelas,
          jumlah,
          hadir,
          tidakHadir,
          peratus.toFixed(2) + "%"
        ].forEach(value => {
          const td = document.createElement("td");
          td.textContent = value;
          tr.appendChild(td);
        });

        const tindakan = document.createElement("td");
        const button = document.createElement("button");

        button.className = "edit-btn";
        button.textContent = "✏️";
        button.onclick = () => editKelas(kelas, hadir);

        tindakan.appendChild(button);
        tr.appendChild(tindakan);
        table.appendChild(tr);
      });
    })
    .catch(err => {
      console.error("loadRekod:", err);

      table.innerHTML += `
        <tr>
          <td colspan="6" style="text-align:center;color:red">
            Gagal membaca rekod kehadiran.
          </td>
        </tr>
      `;
    });
}







function editKelas(kelas,hadir){


document.getElementById("kelas").value=kelas;


tukarKelas();


document.getElementById("hadir").value=hadir;


kira();



window.scrollTo({

top:0,

behavior:"smooth"

});


}







function tukarKelas(){



let kelas =
document.getElementById("kelas").value;



let jumlah =
jumlahMurid[kelas];



document.getElementById("jumlah").value=jumlah;



document.getElementById("jumlahLabel").innerHTML =
jumlah + " Orang";



document.getElementById("hadir").value="";


document.getElementById("hadirView").innerHTML="0";


document.getElementById("takHadir").innerHTML="0";


document.getElementById("peratus").innerHTML="0";



document.getElementById("hadir").max=jumlah;



}const SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbwpsZ41wp1mVOg6fmvgufFYFqsIlTAxNzj7f9rrhbpTcos-_0qMiPS0f6ad9VzOKahYjg/exec";



// JUMLAH MURID SETIAP KELAS

const jumlahMurid = {


    "PRA LILY":24,

    "2 KVR MASAKAN":8,

    "2 KVS PASTRI":6,


    "1 MAWAR":29,
    "1 MELATI":28,
    "1 MELOR":28,


    "2 MAWAR":31,
    "2 MELATI":30,
    "2 MELOR":27,


    "3 MAWAR":32,
    "3 MELATI":33,
    "3 MELOR":30,


    "4 BAKAWALI":21,
    "4 CEMPAKA":26,
    "4 KENANGA":11,
    "4 SEROJA":21,


    "5 BAKAWALI":19,
    "5 CEMPAKA":25,
    "5 KENANGA":20,
    "5 SEROJA":21


};




let tarikh = new Date();


document.getElementById("tarikhHariIni").innerHTML =
tarikh.toLocaleDateString("ms-MY",{
weekday:"long",
day:"numeric",
month:"long",
year:"numeric"
});



loadRekod();





function kira(){


let jumlah =
Number(document.getElementById("jumlah").value);



let hadirInput =
document.getElementById("hadir");



let hadir =
Number(hadirInput.value);



if(hadirInput.value === ""){


document.getElementById("hadirView").innerHTML="0";

document.getElementById("takHadir").innerHTML="-";

document.getElementById("peratus").innerHTML="-";


return;

}




if(hadir > jumlah){


document.getElementById("takHadir").innerHTML="??";

document.getElementById("peratus").innerHTML="Tidak sah";


hadirInput.style.borderColor="red";


return;

}




hadirInput.style.borderColor="";



let tak =
jumlah-hadir;



let peratus =
((hadir/jumlah)*100).toFixed(2);



document.getElementById("hadirView").innerHTML=hadir;


document.getElementById("takHadir").innerHTML=tak;


document.getElementById("peratus").innerHTML=peratus;



}







function simpan(){



let kelas =
document.getElementById("kelas").value;



if(kelas === ""){


alert("⚠️ Sila pilih kelas dahulu.");

return;

}





let hadirValue =
document.getElementById("hadir").value;



let hadir =
Number(hadirValue);



let jumlah =
Number(document.getElementById("jumlah").value);




if(hadirValue===""){


alert("⚠️ Sila masukkan bilangan murid hadir.");


return;


}




if(hadir > jumlah){


alert(
"⚠️ Bilangan hadir tidak boleh melebihi jumlah murid ("+
jumlah+
" orang)."
);


return;


}




if(hadir < 0){


alert(
"⚠️ Bilangan hadir tidak boleh negatif."
);


return;


}





let button =
document.getElementById("btnSimpan");



button.innerHTML="⏳ Menyimpan...";

button.disabled=true;






let data={


kelas:kelas,


jumlah:jumlah,


hadir:hadir


};





fetch(SCRIPT_URL,{

method:"POST",

body:JSON.stringify(data)

})



.then(res=>res.json())



.then(response=>{



document.getElementById("status").innerHTML=

`

<div class="success-card">

<div class="success-icon">
✓
</div>


<h3>
Kehadiran Berjaya Disimpan
</h3>


<p>
🏫 ${data.kelas}
</p>


<p>
👥 Hadir:
<b>${data.hadir}/${data.jumlah}</b>
</p>


<p>
❌ Tidak hadir:
<b>${data.jumlah-data.hadir}</b>
</p>


<p>
📈 Kehadiran:
<b>${((data.hadir/data.jumlah)*100).toFixed(2)}%</b>
</p>


</div>

`;



button.innerHTML="💾 SIMPAN KEHADIRAN";

button.disabled=false;


loadRekod();



})



.catch(err=>{


console.log(err);


document.getElementById("status").innerHTML=
"❌ Gagal simpan";



button.innerHTML="💾 SIMPAN KEHADIRAN";

button.disabled=false;



});



}








function loadRekod(){

    fetch(SCRIPT_URL)

    .then(res => {

        if (!res.ok) {
            throw new Error("HTTP Error: " + res.status);
        }

        return res.json();

    })

    .then(data => {

        console.log("DATA DITERIMA:", data);

        // Kalau backend pulangkan error
        if (!Array.isArray(data)) {

            throw new Error(
                data.error || "Data rekod tidak sah."
            );

        }

        let table =
            document.getElementById("rekod");

        table.innerHTML = `
            <tr>
                <th>Kelas</th>
                <th>Murid</th>
                <th>Hadir</th>
                <th>Tidak Hadir</th>
                <th>%</th>
                <th>Tindakan</th>
            </tr>
        `;


        data.forEach(item => {

            // ==============================
            // AMBIL NILAI
            // ==============================

            const kelas =
                item.kelas || "";

            const hadir =
                Number(item.hadir) || 0;

            const tidakHadir =
                Number(item.tidakHadir) || 0;


            // ==============================
            // JUMLAH MURID
            // ==============================
            // Kalau item.jumlah ada dan > 0,
            // guna nilai tersebut.
            //
            // Kalau kosong / 0,
            // kira hadir + tidak hadir.
            // ==============================

            let jumlah =
                Number(item.jumlah) || 0;

            if (jumlah <= 0) {

                jumlah =
                    hadir + tidakHadir;

            }


            // ==============================
            // PERATUS
            // ==============================

            let peratus =
                Number(item.peratus);

            if (!Number.isFinite(peratus)) {

                peratus =
                    jumlah > 0
                        ? ((hadir / jumlah) * 100)
                        : 0;

            }


            peratus =
                peratus.toFixed(2);


            // ==============================
            // PAPAR TABLE
            // ==============================

            table.innerHTML += `

                <tr>

                    <td>
                        <b>${kelas}</b>
                    </td>

                    <td>
                        ${jumlah}
                    </td>

                    <td class="hadir-text">
                        ${hadir}
                    </td>

                    <td class="tidak-text">
                        ${tidakHadir}
                    </td>

                    <td>
                        <span class="peratus-badge">
                            ${peratus}%
                        </span>
                    </td>

                    <td>

                        <button
                            class="edit-btn"
                            onclick="editKelas('${kelas}',${hadir})"
                        >
                            ✏️
                        </button>

                    </td>

                </tr>

            `;

        });

    })

    .catch(err => {

        console.error(
            "Gagal membaca rekod:",
            err
        );

        document.getElementById("rekod").innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        color:red;
                        padding:20px;
                    "
                >

                    ❌ Gagal membaca rekod kehadiran

                </td>

            </tr>

        `;

    });

}







function editKelas(kelas,hadir){


document.getElementById("kelas").value=kelas;


tukarKelas();


document.getElementById("hadir").value=hadir;


kira();



window.scrollTo({

top:0,

behavior:"smooth"

});


}







function tukarKelas(){



let kelas =
document.getElementById("kelas").value;



let jumlah =
jumlahMurid[kelas];



document.getElementById("jumlah").value=jumlah;



document.getElementById("jumlahLabel").innerHTML =
jumlah + " Orang";



document.getElementById("hadir").value="";


document.getElementById("hadirView").innerHTML="0";


document.getElementById("takHadir").innerHTML="0";


document.getElementById("peratus").innerHTML="0";



document.getElementById("hadir").max=jumlah;



}
