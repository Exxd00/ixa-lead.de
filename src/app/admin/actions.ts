"use server";

import {
  adminCookieName,
  adminSessionMaxAge,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAdmin(formData: FormData) {
  if (!isAdminConfigured()) redirect("/admin?error=config");

  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    redirect("/admin?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, createAdminSessionToken(), {
    httpOnly: true,
    maxAge: adminSessionMaxAge,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookieName);
  redirect("/admin");
}
