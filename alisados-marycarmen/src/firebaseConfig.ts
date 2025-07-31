import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // 👈 Para login con Google
import { getFirestore } from "firebase/firestore"; // 👈 Importar Firestore


// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCnyg6W2x7_UsYB2qu3qalZLWDjvDJIHR8",
  authDomain: "alisados-marycarmen.firebaseapp.com",
  projectId: "alisados-marycarmen",
  storageBucket: "alisados-marycarmen.firebasestorage.app",
  messagingSenderId: "172919494124",
  appId: "1:172919494124:web:2900f328757a099efc9cc9"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta auth para manejar la autenticación
export const auth = getAuth(app);
export const db = getFirestore(app); // 👈 AÑADIDO PARA USAR FIRESTORE

