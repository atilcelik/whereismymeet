// Firebase SDK modüllerini içe aktarın
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot, 
    doc, 
    deleteDoc, 
    updateDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase yapılandırmanızı tanımlayın (Sizin sağladığınız bilgilerle güncellendi)
const firebaseConfig = {
    apiKey: "AIzaSyCs_fi2E-KkfXaB8wUXeeTI2AbOPzfv770",
    authDomain: "whereismymeet.firebaseapp.com",
    projectId: "whereismymeet",
    storageBucket: "whereismymeet.firebasestorage.app",
    messagingSenderId: "524975393363",
    appId: "1:524975393363:web:1434ae4aa9b9f09530d4a6",
    measurementId: "G-4L1R291K6T"
};

// Firebase uygulamasını başlatın
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Uygulama kimliğini al veya varsayılan olarak projectId'yi kullan (GitHub Pages için uygun)
const appId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;

// DOM elementlerini seçin
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authButton = document.getElementById('auth-button');
const toggleAuthButton = document.getElementById('toggle-auth');
const logoutButton = document.getElementById('logout-button');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');

const activityTitleInput = document.getElementById('activity-title');
const activityDateInput = document.getElementById('activity-date');
const activityTimeInput = document.getElementById('activity-time');
const reminderTimeSelect = document.getElementById('reminder-time');
const addActivityButton = document.getElementById('add-activity-button');
const activityList = document.getElementById('activity-list');

// Yeni eklenen modal elementleri
const confirmationModal = document.getElementById('confirmation-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCancelButton = document.getElementById('modal-cancel-button');
const modalConfirmButton = document.getElementById('modal-confirm-button');

let isRegistering = false; // Kayıt olma veya giriş yapma durumunu tutar
let currentUserId = null; // Mevcut kullanıcı kimliğini tutar
let onConfirmCallback = null; // Modal onay callback'i

// Mesaj kutusunu gösteren yardımcı fonksiyon
function showMessage(message, isError = true) {
    messageText.textContent = message;
    if (isError) {
        messageBox.classList.remove('bg-green-100', 'border-green-400', 'text-green-700');
        messageBox.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
    } else {
        messageBox.classList.remove('bg-red-100', 'border-red-400', 'text-green-700');
        messageBox.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
    }
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000); // 5 saniye sonra gizle
}

// Özel onay modalını gösteren fonksiyon
function showConfirmationModal(message, callback) {
    modalMessage.textContent = message;
    onConfirmCallback = callback; // Callback'i sakla
    confirmationModal.classList.remove('hidden'); // Modalı göster
}

// Modal iptal butonu olay dinleyicisi
modalCancelButton.addEventListener('click', () => {
    confirmationModal.classList.add('hidden'); // Modalı gizle
    if (onConfirmCallback) {
        onConfirmCallback(false); // Callback'i false ile çağır
    }
    onConfirmCallback = null; // Callback'i temizle
});

// Modal onay butonu olay dinleyicisi
modalConfirmButton.addEventListener('click', () => {
    confirmationModal.classList.add('hidden'); // Modalı gizle
    if (onConfirmCallback) {
        onConfirmCallback(true); // Callback'i true ile çağır
    }
    onConfirmCallback = null; // Callback'i temizle
});


// Kimlik doğrulama formunu değiştirme fonksiyonu (kayıt ol/giriş yap)
toggleAuthButton.addEventListener('click', (e) => {
    e.preventDefault();
    isRegistering = !isRegistering;
    if (isRegistering) {
        authTitle.textContent = 'Kaydol';
        authButton.textContent = 'Kaydol';
        toggleAuthButton.textContent = 'Giriş Yapın';
    } else {
        authTitle.textContent = 'Giriş Yap';
        authButton.textContent = 'Giriş Yap';
        toggleAuthButton.textContent = 'Kaydolun';
    }
});

// Kimlik doğrulama formunu gönderme işleyicisi
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Auth form submitted."); // Debug log
    const email = emailInput.value;
    const password = passwordInput.value;

    // Şifre boş veya çok kısaysa hata mesajı göster
    if (!password || password.length < 6) {
        showMessage('Şifre en az 6 karakter olmalıdır.', true);
        return; // İşlemi durdur
    }

    if (isRegistering) {
        console.log("Attempting to register new user..."); // Debug log
        console.log(`Email: ${email}, Password length: ${password.length}`); // Debug log (don't log actual password)
        // Kayıt ol
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("User successfully registered."); // Debug log
            showMessage('Başarıyla kaydoldunuz! Şimdi giriş yapabilirsiniz.', false);
            // Kaydolduktan sonra otomatik olarak giriş yapma ekranına dön
            isRegistering = false;
            authTitle.textContent = 'Giriş Yap';
            authButton.textContent = 'Giriş Yap';
            toggleAuthButton.textContent = 'Kaydolun';
        } catch (error) {
            console.error("Registration error:", error); // Debug log
            // Firebase hata kodlarını daha anlaşılır mesajlara çevirebiliriz
            let errorMessage = error.message;
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Bu e-posta adresi zaten kullanılıyor.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Geçersiz e-posta adresi.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Şifre çok zayıf. Lütfen daha güçlü bir şifre girin.';
            }
            showMessage(`Kaydolma hatası: ${errorMessage}`);
        }
    } else {
        console.log("Attempting to sign in user..."); // Debug log
        console.log(`Email: ${email}, Password length: ${password.length}`); // Debug log
        // Giriş yap
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("User successfully signed in."); // Debug log
            showMessage('Başarıyla giriş yaptınız!', false);
        } catch (error) {
            console.error("Sign-in error:", error); // Debug log
            let errorMessage = error.message;
            if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Geçersiz e-posta veya şifre.';
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Geçersiz e-posta veya şifre.';
            }
            showMessage(`Giriş hatası: ${errorMessage}`);
        }
    }
});

// Çıkış yapma işleyicisi
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showMessage('Başarıyla çıkış yaptınız!', false);
    } catch (error) {
        showMessage(`Çıkış hatası: ${error.message}`);
    }
});

// Kimlik doğrulama durumu değiştiğinde çalışır
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Kullanıcı giriş yapmış
        currentUserId = user.uid;
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        loadActivities(currentUserId); // Kullanıcının aktivitelerini yükle

        // __initial_auth_token değişkeni Canvas ortamında otomatik olarak sağlanır.
        // Eğer bu değişken tanımlıysa ve kullanıcı anonimse (test amaçlı) custom token ile giriş yapmayı deneriz.
        if (typeof __initial_auth_token !== 'undefined' && user.isAnonymous) {
            try {
                await signInWithCustomToken(auth, __initial_auth_token);
                console.log("Custom token ile giriş yapıldı.");
            } catch (error) {
                console.error("Custom token ile giriş hatası:", error);
            }
        }
    } else {
        // Kullanıcı çıkış yapmış veya giriş yapmamış
        currentUserId = null;
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        activityList.innerHTML = ''; // Aktiviteleri temizle

        // __initial_auth_token tanımlı değilse anonim olarak giriş yap.
        // Bu, uygulamanın Canvas dışındaki ortamlarda da çalışmasını sağlar.
        if (typeof __initial_auth_token === 'undefined') {
             try {
                await signInAnonymously(auth);
                console.log("Anonim olarak giriş yapıldı.");
            } catch (error) {
                console.error("Anonim giriş hatası:", error);
            }
        }
    }
});

// Aktivite ekleme işleyicisi
addActivityButton.addEventListener('click', async () => {
    const title = activityTitleInput.value.trim();
    const date = activityDateInput.value;
    const time = activityTimeInput.value;
    const reminder = reminderTimeSelect.value;

    if (title && date && currentUserId) {
        try {
            const activityDateTime = new Date(`${date}T${time || '00:00'}`);
            await addDoc(collection(db, `artifacts/${appId}/users/${currentUserId}/activities`), {
                title,
                date: activityDateTime.toISOString().split('T')[0], // Sadece tarih
                time: time || '', // Saat (isteğe bağlı)
                dateTime: activityDateTime.getTime(), // Unix timestamp olarak sakla
                reminder,
                createdAt: serverTimestamp() // Sunucu zaman damgası
            });
            activityTitleInput.value = '';
            activityDateInput.value = '';
            activityTimeInput.value = '';
            reminderTimeSelect.value = '';
            showMessage('Aktivite başarıyla eklendi!', false);
        } catch (error) {
            showMessage(`Aktivite ekleme hatası: ${error.message}`);
        }
    } else {
        showMessage('Lütfen tüm gerekli alanları doldurun.', true);
    }
});

// Aktiviteleri Firestore'dan yükleyen ve dinleyen fonksiyon
function loadActivities(userId) {
    // Kullanıcının koleksiyonuna sorgu oluştur
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/activities`));

    // Anlık güncellemeleri dinle
    onSnapshot(q, (snapshot) => {
        activityList.innerHTML = ''; // Listeyi temizle
        const activities = [];
        snapshot.forEach(doc => {
            activities.push({ id: doc.id, ...doc.data() });
        });

        // Aktiviteleri tarihe ve saate göre sırala
        activities.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
            const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
            return dateA - dateB;
        });

        activities.forEach(activity => {
            const listItem = document.createElement('li');
            listItem.className = 'bg-gray-50 p-4 rounded-lg shadow-sm flex items-center justify-between transition duration-200 hover:bg-gray-100';
            
            const activityDateTime = activity.time ? `${activity.date} ${activity.time}` : activity.date;
            const reminderText = activity.reminder ? `(Hatırlatıcı: ${activity.reminder})` : '';

            listItem.innerHTML = `
                <div>
                    <h4 class="text-lg font-medium text-gray-800">${activity.title}</h4>
                    <p class="text-sm text-gray-600">${activityDateTime} ${reminderText}</p>
                </div>
                <div>
                    <button data-id="${activity.id}" class="edit-button bg-blue-500 text-white px-3 py-1 rounded-md text-sm mr-2 hover:bg-blue-600 transition duration-200">Düzenle</button>
                    <button data-id="${activity.id}" class="delete-button bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition duration-200">Sil</button>
                </div>
            `;
            activityList.appendChild(listItem);
        });

        attachActivityEventListeners(); // Yeni eklenen butonlara event listener ekle
    }, (error) => {
        console.error("Aktiviteleri yükleme hatası:", error);
        showMessage("Aktiviteleri yüklerken bir hata oluştu.", true);
    });
}

// Aktivite düzenleme ve silme butonlarına event listener ekler
function attachActivityEventListeners() {
    document.querySelectorAll('.delete-button').forEach(button => {
        button.onclick = async (e) => {
            const id = e.target.dataset.id;
            // `confirm()` yerine özel modal kullanıldı
            if (currentUserId) {
                showConfirmationModal('Bu aktiviteyi silmek istediğinizden emin misiniz?', async (confirmed) => {
                    if (confirmed) {
                        try {
                            await deleteDoc(doc(db, `artifacts/${appId}/users/${currentUserId}/activities`, id));
                            showMessage('Aktivite başarıyla silindi!', false);
                        } catch (error) {
                            showMessage(`Aktivite silme hatası: ${error.message}`, true);
                        }
                    }
                });
            }
        };
    });

    document.querySelectorAll('.edit-button').forEach(button => {
        button.onclick = async (e) => {
            const id = e.target.dataset.id;
            const currentActivityDoc = await doc(db, `artifacts/${appId}/users/${currentUserId}/activities`, id);
            const currentActivity = await getDoc(currentActivityDoc);

            if (currentActivity.exists()) {
                const data = currentActivity.data();
                // Basit prompt pencereleri kullanılıyor, daha iyi bir kullanıcı deneyimi için modal pencereler tercih edilmeli.
                const newTitle = prompt('Yeni başlık girin:', data.title);
                const newDate = prompt('Yeni tarih girin (YYYY-MM-DD):', data.date);
                const newTime = prompt('Yeni saat girin (HH:MM):', data.time);
                const newReminder = prompt('Yeni hatırlatıcı zamanı girin (örn: 5m, 15m, 30m, 1h, 1d):', data.reminder);

                if (newTitle !== null && newDate !== null) {
                    try {
                        const updatedDateTime = new Date(`${newDate}T${newTime || '00:00'}`);
                        await updateDoc(currentActivityDoc, {
                            title: newTitle,
                            date: updatedDateTime.toISOString().split('T')[0],
                            time: newTime || '',
                            dateTime: updatedDateTime.getTime(),
                            reminder: newReminder || ''
                        });
                        showMessage('Aktivite başarıyla güncellendi!', false);
                    } catch (error) {
                        showMessage(`Aktivite güncelleme hatası: ${error.message}`, true);
                    }
                }
            }
        };
    });
}

// Hatırlatıcı gönderme fonksiyonu (Gerçek bir hatırlatıcı sistemi için sunucu tarafı bir çözüm gerekir)
// Bu sadece bir placeholder'dır. Mail göndermek için bir sunucuya veya bulut fonksiyonlarına ihtiyacınız var.
async function sendReminderEmail(activity) {
    const reminderDateTime = calculateReminderTime(activity.dateTime, activity.reminder);
    const currentDateTime = Date.now();

    // Hatırlatma zamanı geçmişse veya henüz çok erken ise gönderme
    if (reminderDateTime <= currentDateTime) {
        // Bu kısımda bir e-posta gönderme API'si veya Firebase Cloud Functions gibi bir servis kullanılmalıdır.
        // Örneğin:
        /*
        try {
            // Bir sunucu API'nize veya Firebase Cloud Function'ınıza fetch isteği gönderin
            await fetch('/sendReminder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: auth.currentUser.email,
                    subject: 'Ajanda Hatırlatıcısı: ' + activity.title,
                    text: `${activity.title} aktiviteniz ${activity.date} ${activity.time} tarihinde başlayacaktır.`,
                }),
            });
            console.log(`Hatırlatıcı gönderildi: ${activity.title}`);
        } catch (error) {
            console.error('Hatırlatıcı gönderme hatası:', error);
        }
        */
        console.log(`DEBUG: Hatırlatıcı için mail gönderilecekti: ${activity.title} - Zaman: ${new Date(reminderDateTime).toLocaleString()}`);
    }
}

// Hatırlatıcı zamanını hesaplar
function calculateReminderTime(activityTimestamp, reminderOption) {
    let reminderOffset = 0; // ms cinsinden
    switch (reminderOption) {
        case '5m': reminderOffset = 5 * 60 * 1000; break;
        case '15m': reminderOffset = 15 * 60 * 1000; break;
        case '30m': reminderOffset = 30 * 60 * 1000; break;
        case '1h': reminderOffset = 60 * 60 * 1000; break;
        case '1d': reminderOffset = 24 * 60 * 60 * 1000; break;
    }
    return activityTimestamp - reminderOffset;
}

// Uygulama başlatıldığında, auth durumunu kontrol eder ve buna göre UI'ı gösterir
document.addEventListener('DOMContentLoaded', async () => {
    // __initial_auth_token değişkeni tanımlıysa, özel token ile giriş yapmayı dene (Canvas ortamı için)
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
            // Henüz giriş yapmamışsa veya anonimse token ile giriş yap
            if (!auth.currentUser || auth.currentUser.isAnonymous) {
                await signInWithCustomToken(auth, __initial_auth_token);
                console.log("Canvas tarafından sağlanan özel token ile giriş yapıldı.");
            }
        } catch (error) {
            console.error("Özel token ile giriş hatası:", error);
            // Hata durumunda (veya Canvas dışı ortamda) anonim olarak giriş yap
            if (!auth.currentUser) { // Eğer zaten bir kullanıcı yoksa anonim giriş yap
                 await signInAnonymously(auth);
                 console.log("Özel token hatası veya Canvas dışı ortam nedeniyle anonim olarak giriş yapıldı.");
            }
        }
    } else {
        // __initial_auth_token tanımlı değilse, anonim olarak giriş yap
        if (!auth.currentUser) { // Eğer zaten bir kullanıcı yoksa anonim giriş yap
            await signInAnonymously(auth);
            console.log("Anonim olarak giriş yapıldı.");
        }
    }
});

// Reminder (Hatırlatıcı) fonksiyonelliği için önemli not:
// E-posta gönderme işlemi doğrudan tarayıcı tarafından güvenli bir şekilde yapılamaz.
// Bunun için bir sunucu tarafı hizmetine (örneğin Firebase Cloud Functions, SendGrid, Mailgun vb.) ihtiyacınız olacaktır.
// Kullanıcının e-posta adresine hatırlatıcı göndermek için, backend'de bir fonksiyon oluşturmanız ve
// bu fonksiyona aktivite verilerini (başlık, tarih, saat, hatırlatma zamanı, kullanıcı e-postası)
// göndermeniz gerekmektedir. Firebase Cloud Functions, Firestore'daki veri değişikliklerini
// dinleyerek (örneğin yeni bir aktivite eklendiğinde veya hatırlatma zamanı geldiğinde)
// e-posta göndermek için ideal bir çözümdür.
// Yukarıdaki `sendReminderEmail` fonksiyonu bir placeholder'dır ve çalışmaz.
// Gerçek bir uygulama için bu kısmı kendi backend çözümünüzle entegre etmeniz gerekmektedir.
