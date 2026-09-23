// Cívica v13.2 — configuración del piloto GitHub Pages + Firebase + Cloudinary.
window.CIVICA_CONFIG = {
  DEMO_MODE: false,
  FIREBASE: {
    apiKey: "AIzaSyBOXV5G8JEjfyueB2A2-aOsFZ-bG1OOT3Y",
    authDomain: "civica-arvela.firebaseapp.com",
    databaseURL: "https://civica-arvela-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "civica-arvela",
    storageBucket: "civica-arvela.firebasestorage.app",
    messagingSenderId: "954466497463",
    appId: "1:954466497463:web:410b4fda30cb8b73136e32",
    measurementId: "G-KBKE928QDZ"
  },
  AUTH: {
    MUNICIPAL_UIDS: [],
    CREW_UIDS: {},
    DEMO_DEFAULT_ROLE: "citizen"
  },
  CLOUDINARY: {
    cloudName: "jgomts0i",
    uploadPreset: "civica_unsigned"
  }
};
