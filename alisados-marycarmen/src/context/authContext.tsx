import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  type User 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Definimos el tipo del contexto
interface AuthContextType {
  user: User | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  professionalProfile: any | null;
}


// Creamos el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [professionalProfile, setProfessionalProfile] = useState<any | null>(null);

  // Escucha cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Si hay usuario logueado, obtenemos su perfil profesional
        await ensureProfessionalProfile(firebaseUser);
      } else {
        setProfessionalProfile(null); // Si no hay usuario, limpiamos perfil
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Función que asegura que el perfil profesional exista en Firestore
  const ensureProfessionalProfile = async (firebaseUser: User) => {
    const docRef = doc(db, "professionals", firebaseUser.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Si no existe, lo creamos
      await setDoc(docRef, {
        name: firebaseUser.displayName || "",
        email: firebaseUser.email,
        phone: "",
        rut: "",
        address: "",
        website: "",
        createdAt: serverTimestamp(),
      });
      setProfessionalProfile({
        name: firebaseUser.displayName || "",
        email: firebaseUser.email,
        phone: "",
        rut: "",
        address: "",
        website: "",
      });
    } else {
      // Si existe, guardamos sus datos en el estado
      setProfessionalProfile(docSnap.data());
    }
  };

  // Login con Email
const loginWithEmail = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
};


  // Logout
 // authContext.tsx
const logout = async () => {
  await signOut(auth);
  setUser(null); // 🔥 Limpia el estado local de usuario
  setProfessionalProfile(null); // 🔥 Limpia el perfil profesional
};


  return (
<AuthContext.Provider value={{ user, loginWithEmail, logout, loading, professionalProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto en cualquier componente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};
