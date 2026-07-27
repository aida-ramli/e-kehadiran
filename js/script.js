const SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbzkQyiBV-SQ8ZtdHUmJ6GhrbR2WnzXtxRcXxfIFc3e9CoS1b9Msyd8fE-AyLF_BSCqFJg/exec";



// JUMLAH MURID SETIAP KELAS

const jumlahMurid = {


    "PRA LILY":22,

    "2 KVS MASAKAN":7,

    "2 KVS PASTRI":14,


    "1 MAWAR":29,
    "1 MELATI":28,
    "1 MELOR":27,


    "2 MAWAR":31,
    "2 MELATI":30,
    "2 MELOR":26,


    "3 MAWAR":33,
    "3 MELATI":33,
    "3 MELOR":31,


    "4 BAKAWALI":21,
    "4 CEMPAKA":27,
    "4 KENANGA":13,
    "4 SEROJA":22,


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



.then(res=>res.json())



.then(data=>{



let table =
document.getElementById("rekod");



table.innerHTML=`

<tr>

<th>Kelas</th>

<th>Murid</th>

<th>Hadir</th>

<th>Tidak Hadir</th>

<th>%</th>

<th>Tindakan</th>

</tr>

`;





data.forEach(item=>{


table.innerHTML +=`

<tr>


<td>
<b>${item.kelas}</b>
</td>


<td>
${item.jumlah}
</td>


<td class="hadir-text">
${item.hadir}
</td>


<td class="tidak-text">
${item.tidakHadir}
</td>


<td>

<span class="peratus-badge">

${item.peratus}%

</span>

</td>


<td>

<button
class="edit-btn"
onclick="editKelas('${item.kelas}',${item.hadir})">

✏️

</button>


</td>


</tr>

`;


});



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