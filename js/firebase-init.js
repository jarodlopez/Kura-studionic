// Inicialización de Firebase para la tienda. Se compila como primer archivo del
// bundle dist/app.js, de modo que define los globals (db, IMGBB_API_KEY) antes
// de que utils.js / App.js los usen. Requiere que firebase-app-compat y
// firebase-firestore-compat ya se hayan cargado (scripts defer en index.html).
var firebaseConfig = {
    apiKey: "AIzaSyB6YA-gSckDvi-fdFlRsvwRttr3VnGQ82U",
    authDomain: "kuranic-b1034.firebaseapp.com",
    projectId: "kuranic-b1034"
};
var IMGBB_API_KEY = "B922654effe3a1ab5ac85cc4c23f97b8";
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
var db = firebase.firestore();
