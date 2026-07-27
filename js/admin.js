
const SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbyuSP9xr1yOqRF3RNo2NOCY-I2BGdD7zjdGJvHIauXfT8Se_RoRxWIqJjh3X1xRKaws/exec";

loadDashboard();



function loadDashboard(){


fetch(SCRIPT_URL+"?action=dashboard")


.then(res=>res.json())


.then(data=>{


document.getElementById("jumlahKelas").innerHTML =
data.jumlahKelas;


document.getElementById("sudahIsi").innerHTML =
data.sudahIsi;


document.getElementById("belumIsi").innerHTML =
data.belumIsi;


document.getElementById("jumlahMurid").innerHTML =
data.jumlahMurid;


document.getElementById("jumlahHadir").innerHTML =
data.hadir;


document.getElementById("jumlahTidak").innerHTML =
data.tidakHadir;


document.getElementById("purata").innerHTML =
data.peratus+"%";


let belum =
document.getElementById("belumSenarai");


belum.innerHTML="";


let container =
document.getElementById("senaraiKelas");



data.kelas.forEach(kelas=>{

if(kelas.status=="Belum isi"){


belum.innerHTML += `

<p>
⚠️ ${kelas.nama}
</p>

`;


}


let warna="yellow";


let icon="⚠️";



if(kelas.status=="Sudah isi"){


if(Number(kelas.peratus)>=90){

warna="green";

icon="🟢";

}

else if(Number(kelas.peratus)>=80){

warna="yellow";

icon="🟡";

}

else{

warna="red";

icon="🔴";

}


}



container.innerHTML += `


<div class="status-card ${warna}">


<h3>

${icon} ${kelas.nama}

</h3>


<p>

${kelas.status}

</p>


<p>

${
kelas.status=="Sudah isi"

?

kelas.hadir+
"/"+
kelas.jumlah+
" murid ("+
kelas.peratus+
"%)"

:

"Belum direkod"

}

</p>


</div>


`;


});


});


}

function downloadLaporan(){


fetch(SCRIPT_URL+"?action=dashboard")


.then(res=>res.json())


.then(data=>{


let csv = 
"Laporan Kehadiran SMK KAMPUNG BARU KERTEH\n\n";


csv += 
"Kelas,Status,Jumlah Murid,Hadir,Tidak Hadir,Peratus\n";



data.kelas.forEach(k=>{


csv +=
k.nama + "," +
k.status + "," +
k.jumlah + "," +
k.hadir + "," +
k.tidakHadir + "," +
k.peratus + "%\n";


});



let blob =
new Blob(
[csv],
{
type:"text/csv"
}
);



let url =
URL.createObjectURL(blob);



let a =
document.createElement("a");


a.href=url;


a.download="Laporan_Kehadiran.csv";


a.click();



});

}