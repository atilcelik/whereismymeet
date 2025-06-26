// HTML'deki elemanlara erişim (id'leri kullanarak buluyoruz)
const agendaInput = document.getElementById('agendaInput');
const addButton = document.getElementById('addButton');
const agendaList = document.getElementById('agendaList');

// Sayfa yüklendiğinde localStorage'dan ajandaları yükle
document.addEventListener('DOMContentLoaded', loadAgendaItems);

// "Ekle" butonuna tıklandığında veya Enter'a basıldığında çalışacak fonksiyon
addButton.addEventListener('click', addAgendaItem);
agendaInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addAgendaItem();
    }
});

// Ajanda öğesi ekleme fonksiyonu
function addAgendaItem() {
    const agendaText = agendaInput.value.trim(); // Input'taki metni al ve boşlukları temizle

    if (agendaText === "") { // Eğer metin boşsa ekleme
        alert("Lütfen bir ajanda girişi yazın!");
        return; // Fonksiyondan çık
    }

    // Yeni bir liste öğesi (li) oluştur
    const listItem = document.createElement('li');
    listItem.textContent = agendaText; // Metni liste öğesine ekle

    // Silme butonu oluştur
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Sil';
    deleteButton.classList.add('delete-button'); // CSS sınıfı ekle
    deleteButton.addEventListener('click', function() {
        agendaList.removeChild(listItem); // Liste öğesini listeden kaldır
        saveAgendaItems(); // Değişiklikleri localStorage'a kaydet
    });

    listItem.appendChild(deleteButton); // Silme butonunu liste öğesine ekle
    agendaList.appendChild(listItem); // Liste öğesini ul listesine ekle

    saveAgendaItems(); // Ajandaları localStorage'a kaydet
    agendaInput.value = ""; // Input kutusunu temizle
}

// Ajanda öğelerini localStorage'a kaydetme fonksiyonu
function saveAgendaItems() {
    const items = [];
    agendaList.querySelectorAll('li').forEach(function(item) {
        // Sadece metin içeriğini al, sil butonunun metnini çıkar
        const textContent = item.textContent.replace('Sil', '').trim();
        items.push(textContent);
    });
    // Diziyi JSON formatına çevirip kaydet
    localStorage.setItem('agendaItems', JSON.stringify(items));
}

// Ajanda öğelerini localStorage'dan yükleme fonksiyonu
function loadAgendaItems() {
    const savedItems = localStorage.getItem('agendaItems');
    if (savedItems) {
        // Kayıtlı JSON metnini diziye çevir
        const items = JSON.parse(savedItems);
        items.forEach(function(itemText) {
            // Her bir öğe için yeni bir liste öğesi oluştur ve ekle
            const listItem = document.createElement('li');
            listItem.textContent = itemText;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Sil';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', function() {
                agendaList.removeChild(listItem);
                saveAgendaItems();
            });

            listItem.appendChild(deleteButton);
            agendaList.appendChild(listItem);
        });
    }
}
