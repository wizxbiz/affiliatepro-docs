importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBKL6HBLEndDX4LYo7APFNQ0IVICLJtaIE",
    authDomain: "appinjproject.firebaseapp.com",
    projectId: "appinjproject",
    storageBucket: "appinjproject.firebasestorage.app",
    messagingSenderId: "408718656984",
    appId: "1:408718656984:web:08bd8f084769d428251ead"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/images/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
