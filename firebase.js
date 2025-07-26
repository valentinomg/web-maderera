import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database"; // 🔥 Aquí ya está todo correctamente importado
import { getStorage } from "firebase/storage";  

const firebaseConfig = {
  apiKey: "AIzaSyAN7YI27m27zONOCNLwJepbRRaZeWBn1pM",
  authDomain: "cubitracker.firebaseapp.com",
  databaseURL: "https://cubitracker-default-rtdb.firebaseio.com",
  projectId: "cubitracker",
  storageBucket: "cubitracker.firebasestorage.app",
  messagingSenderId: "864965136732",
  appId: "1:864965136732:web:e918fa838e56f40465b199",
  measurementId: "G-617CX4EBRR"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Servicios de Firebase
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

export { auth, database, ref, set, get, storage }; // 🔥 Exportamos correctamente todo
