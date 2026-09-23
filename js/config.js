// Cívica v6 — Firebase Realtime Database + Cloudinary.
// Deja DEMO_MODE=true para probar sin configurar servicios.
window.CIVICA_CONFIG = {
  DEMO_MODE: true,
  FIREBASE: {
    apiKey: "TU_FIREBASE_API_KEY",
    authDomain: "TU-PROYECTO.firebaseapp.com",
    databaseURL: "https://TU-PROYECTO-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "TU-PROYECTO",
    appId: "TU_FIREBASE_APP_ID"
  },
  AUTH: {
    // Para una demo: activa Anonymous Authentication en Firebase.
    // Añade aquí UIDs autorizados para operar como Ayuntamiento.
    MUNICIPAL_UIDS: [],
    // Formato: { "firebase-uid": "Viales 2" }
    CREW_UIDS: {},
    // En DEMO_MODE se puede cambiar de rol desde acceso.html.
    DEMO_DEFAULT_ROLE: "citizen"
  },
  CLOUDINARY: {
    cloudName: "TU_CLOUD_NAME",
    uploadPreset: "TU_UNSIGNED_UPLOAD_PRESET"
  }
};