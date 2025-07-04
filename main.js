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
    serverTimestamp,
    getDoc // Belgeyi tek seferlik almak için eklendi
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase yapılandırmanızı tanımlayın
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
// Bu değer, Firestore güvenlik kurallarındaki {appId} ile eşleşmelidir.
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
    console.log("Auth form submitted. isRegistering:", isRegistering); // Debug log
    const email = emailInput.value;
    const password = passwordInput.value;

    // Şifre boş veya çok kısaysa hata mesajı göster
    if (!password || password.length < 6) {
        showMessage('Şifre en az 6 karakter olmalıdır.', true);
        return; // İşlemi durdur
    }

    if (isRegistering) {
        console.log("Attempting to register new user with email:", email); // Debug log
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("User successfully registered and logged in."); // Debug log
            showMessage('Başarıyla kaydoldunuz! Giriş yaptınız.', false);
            // Başarılı kaydolma ve otomatik girişten sonra UI'ı güncellemek onAuthStateChanged'a bırakılır.
        } catch (error) {
            console.error("Registration error:", error); // Debug log
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
        console.log("Attempting to sign in user with email:", email); // Debug log
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("User successfully signed in."); // Debug log
            showMessage('Başarıyla giriş yaptınız!', false);
            // Başarılı girişten sonra UI'ı güncellemek onAuthStateChanged'a bırakılır.
        } catch (error) {
            console.error("Sign-in error:", error); // Debug log
            let errorMessage = error.message;
            if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Geçersiz e-posta veya şifre.';
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Geçersiz e-posta veya şifre.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'Kullanıcı hesabı devre dışı bırakılmış.';
            }
            showMessage(`Giriş hatası: ${errorMessage}`);
        }
    }
});

// Çıkış yapma işleyicisi
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log("User signed out."); // Debug log
        showMessage('Başarıyla çıkış yaptınız!', false);
    } catch (error) {
        console.error("Sign-out error:", error); // Debug log
        showMessage(`Çıkış hatası: ${error.message}`);
    }
});

// Kimlik doğrulama durumu değiştiğinde çalışır
onAuthStateChanged(auth, async (user) => {
    console.log("onAuthStateChanged triggered. User:", user ? user.uid : "null"); // Debug log
    if (user) {
        // Kullanıcı giriş yapmış
        currentUserId = user.uid;
        console.log("Current user ID:", currentUserId); // Debug log

        // Canvas ortamındaysa ve kullanıcı anonimse, custom token ile giriş yapılabilir
        if (typeof __initial_auth_token !== 'undefined' && user.isAnonymous) {
            try {
                await signInWithCustomToken(auth, __initial_auth_token);
                console.log("Canvas tarafından sağlanan özel token ile giriş yapıldı.");
            } catch (error) {
                console.error("Özel token ile giriş hatası:", error);
            }
        }

        // Uygulama arayüzünü göster
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        loadActivities(currentUserId); // Kullanıcının aktivitelerini yükle
    } else {
        // Kullanıcı çıkış yapmış veya henüz giriş yapmamış
        currentUserId = null;
        console.log("User is logged out. Showing auth container."); // Debug log

        // Giriş formunu göster
        appContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        activityList.innerHTML = '';

        // Otomatik anonim giriş yapılmıyor
    }
});

// Aktivite ekleme işleyicisi
addActivityButton.addEventListener('click', async () => {
    const title = activityTitleInput.value.trim();
    const date = activityDateInput.value;
    const time = activityTimeInput.value;
    const reminder = reminderTimeSelect.value;

    if (title && date && currentUserId) {
        const collectionPath = `artifacts/${appId}/users/${currentUserId}/activities`;
        console.log("Attempting to add activity to collection:", collectionPath); // Yeni debug log
        try {
            const activityDateTime = new Date(`${date}T${time || '00:00'}`);
            await addDoc(collection(db, collectionPath), {
                title,
                date: activityDateTime.toISOString().split('T')[0],
                time: time || '',
                dateTime: activityDateTime.getTime(),
                reminder,
                createdAt: serverTimestamp()
            });
            activityTitleInput.value = '';
            activityDateInput.value = '';
            activityTimeInput.value = '';
            reminderTimeSelect.value = '';
            showMessage('Aktivite başarıyla eklendi!', false);
        } catch (error) {
            console.error("Activity add error:", error); // Debug log
            showMessage(`Aktivite ekleme hatası: ${error.message}`);
        }
    } else {
        showMessage('Lütfen tüm gerekli alanları doldurun.', true);
    }
});

// Aktiviteleri Firestore'dan yükleyen ve dinleyen fonksiyon
function loadActivities(userId) {
    if (!userId) {
        console.log("No user ID available to load activities.");
        activityList.innerHTML = '';
        return;
    }
    const collectionPath = `artifacts/${appId}/users/${userId}/activities`;
    console.log("Attempting to load activities from collection:", collectionPath); // Yeni debug log

    const q = query(collection(db, collectionPath));

    onSnapshot(q, (snapshot) => {
        activityList.innerHTML = '';
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

        if (activities.length === 0) {
            activityList.innerHTML = '<li class="text-center text-gray-500 py-4">Henüz hiç aktivite yok. Yeni bir tane ekleyin!</li>';
        } else {
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
        }

        attachActivityEventListeners(); // Yeni eklenen butonlara event listener ekle
    }, (error) => {
        console.error("Aktiviteleri yükleme hatası:", error); // Debug log
        showMessage("Aktiviteleri yüklerken bir hata oluştu.", true);
    });
}

// Aktivite düzenleme ve silme butonlarına event listener ekler
function attachActivityEventListeners() {
    document.querySelectorAll('.delete-button').forEach(button => {
        button.onclick = async (e) => {
            const id = e.target.dataset.id;
            if (currentUserId) {
                showConfirmationModal('Bu aktiviteyi silmek istediğinizden emin misiniz?', async (confirmed) => {
                    if (confirmed) {
                        const documentPath = `artifacts/${appId}/users/${currentUserId}/activities/${id}`;
                        console.log("Attempting to delete document:", documentPath); // Yeni debug log
                        try {
                            await deleteDoc(doc(db, documentPath));
                            showMessage('Aktivite başarıyla silindi!', false);
                        } catch (error) {
                            console.error("Activity delete error:", error); // Debug log
                            showMessage(`Aktivite silme hatası: ${error.message}`, true);
                        }
                    }
                });
            } else {
                showMessage("Aktivite silmek için giriş yapmalısınız.", true);
            }
        };
    });

    document.querySelectorAll('.edit-button').forEach(button => {
        button.onclick = async (e) => {
            const id = e.target.dataset.id;
            if (!currentUserId) {
                showMessage("Aktivite düzenlemek için giriş yapmalısınız.", true);
                return;
            }
            const documentPath = `artifacts/${appId}/users/${currentUserId}/activities/${id}`;
            console.log("Attempting to get/update document:", documentPath); // Yeni debug log
            const currentActivityDocRef = doc(db, documentPath);
            const currentActivitySnap = await getDoc(currentActivityDocRef);

            if (currentActivitySnap.exists()) {
                const data = currentActivitySnap.data();
                const newTitle = prompt('Yeni başlık girin:', data.title);
                const newDate = prompt('Yeni tarih girin (YYYY-MM-DD):', data.date);
                const newTime = prompt('Yeni saat girin (HH:MM):', data.time);
                const newReminder = prompt('Yeni hatırlatıcı zamanı girin (örn: 5m, 15m, 30m, 1h, 1d):', data.reminder);

                if (newTitle !== null && newDate !== null) {
                    try {
                        const updatedDateTime = new Date(`${newDate}T${newTime || '00:00'}`);
                        await updateDoc(currentActivityDocRef, {
                            title: newTitle,
                            date: updatedDateTime.toISOString().split('T')[0],
                            time: newTime || '',
                            dateTime: updatedDateTime.getTime(),
                            reminder: newReminder || ''
                        });
                        showMessage('Aktivite başarıyla güncellendi!', false);
                    } catch (error) {
                        console.error("Activity update error:", error); // Debug log
                        showMessage(`Aktivite güncelleme hatası: ${error.message}`, true);
                    }
                }
            } else {
                showMessage("Düzenlenecek aktivite bulunamadı.", true);
            }
        };
    });
}

// Hatırlatıcı gönderme fonksiyonu (placeholder)
async function sendReminderEmail(activity) {
    const reminderDateTime = calculateReminderTime(activity.dateTime, activity.reminder);
    const currentDateTime = Date.now();
    console.log(`DEBUG: sendReminderEmail çağrıldı. Aktivite: ${activity.title}, Hatırlatıcı zamanı (timestamp): ${reminderDateTime}`);

    if (reminderDateTime <= currentDateTime) {
        console.log(`DEBUG: Hatırlatıcı zamanı geldi veya geçti. Mail gönderme simülasyonu: ${activity.title}`);
        // Gerçek e-posta gönderimi için Firebase Cloud Functions veya benzeri bir backend servisi gereklidir.
    } else {
        console.log(`DEBUG: Hatırlatıcı zamanı henüz gelmedi. Aktivite: ${activity.title}, Gönderilecek Zaman: ${new Date(reminderDateTime).toLocaleString()}`);
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

// Uygulama başlatıldığında, auth durumunu kontrol eder
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded: Initializing Firebase Auth state."); // Debug log
    // onAuthStateChanged zaten otomatik olarak tetiklenecek.
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        if (!auth.currentUser || auth.currentUser.isAnonymous) {
            try {
                await signInWithCustomToken(auth, __initial_auth_token);
                console.log("DOMContentLoaded: Canvas token ile giriş denendi.");
            } catch (error) {
                console.error("DOMContentLoaded: Canvas token ile giriş hatası:", error);
            }
        }
    }
    // Token yoksa veya Canvas dışındaysak, kullanıcı giriş yapmamışsa form gösterilir.
});

// Reminder fonksiyonelliği için önemli notlar
// Gerçek bir uygulamada e-posta göndermek için backend hizmeti gerekmektedir.
// Bu dosyada yer alan sendReminderEmail işlevi yalnızca örnek amaçlıdır.
