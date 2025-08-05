import { db } from "../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export const updateProfileField = async (userId: string, field: string, value: any) => {
  const docRef = doc(db, "professionals", userId);
  await updateDoc(docRef, { [field]: value });
};

export const updateProfileData = async (userId: string, data: any) => {
  const docRef = doc(db, "professionals", userId);
  await updateDoc(docRef, data);
};
