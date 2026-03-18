// actions/users.ts
"use server";

import { db } from "@/lib/firebase/init";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const usersRef = db.collection("users");
    const q = usersRef.where("email", "==", email.toLowerCase());
    const querySnapshot = await q.get();
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { 
        id: doc.id, 
        ...doc.data()
      } as User;
    }
    return null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

export async function isAdminUser(email: string): Promise<boolean> {
  try {
    const usersRef = db.collection("users");
    const q = usersRef
      .where("email", "==", email.toLowerCase())
      .where("role", "==", "admin")
      .where("status", "==", "active");
    
    const querySnapshot = await q.get();
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking admin user:", error);
    return false;
  }
}