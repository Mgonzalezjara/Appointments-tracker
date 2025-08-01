import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  QuerySnapshot,
} from "firebase/firestore";

export const listenAppointments = (uid: string, callback: (data: any[]) => void) => {
  return onSnapshot(collection(db, "professionals", uid, "appointments"), (snapshot: QuerySnapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
};

export const fetchServices = async (uid: string) => {
  const querySnapshot = await getDocs(collection(db, "professionals", uid, "services"));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const createAppointment = async (uid: string, data: any) => {
  await addDoc(collection(db, "professionals", uid, "appointments"), data);
};

export const updateAppointment = async (uid: string, appointmentId: string, data: any) => {
  const docRef = doc(db, "professionals", uid, "appointments", appointmentId);
  await updateDoc(docRef, data);
};

export const deleteAppointment = async (uid: string, appointmentId: string) => {
  const docRef = doc(db, "professionals", uid, "appointments", appointmentId);
  await deleteDoc(docRef);
};
