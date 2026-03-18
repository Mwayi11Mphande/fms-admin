// actions/auth.ts
"use server";

import { cookies } from "next/headers";

export async function loginUser(email: string) {
  try {
    // Import server actions
    const { getUserByEmail, isAdminUser } = await import("./user");
    
    const cleanEmail = email.toLowerCase().trim();
    
    // Check if user is admin
    const isAdmin = await isAdminUser(cleanEmail);
    
    if (!isAdmin) {
      return { 
        success: false, 
        error: "Access denied. Admin privileges required." 
      };
    }

    // Get user data
    const user = await getUserByEmail(cleanEmail);
    
    if (!user) {
      return { 
        success: false, 
        error: "Admin account not found." 
      };
    }

    // Create session
    const session = {
      uid: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: true,
      loginTime: new Date().toISOString(),
    };

    // Store in cookie
    const cookieStore = cookies();
    (await cookieStore).set("adminSession", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return { success: true, user: session };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "Login failed" };
  }
}

export async function verifySession() {
  try {
    const cookieStore = cookies();
    const sessionCookie = (await cookieStore).get("adminSession");
    
    if (!sessionCookie?.value) {
      return { valid: false };
    }

    const session = JSON.parse(sessionCookie.value);
    
    // Check if session expired (8 hours)
    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 8) {
      return { valid: false };
    }

    return { valid: true, user: session };
  } catch (error) {
    return { valid: false };
  }
}

export async function logoutUser() {
  try {
    const cookieStore = cookies();
    (await cookieStore).delete("adminSession");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}