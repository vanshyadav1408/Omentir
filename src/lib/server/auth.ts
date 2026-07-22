import "server-only";

import { auth as clerkAuth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLocalMode } from "@/lib/runtime-mode";
import { LOCAL_SESSION_COOKIE, LOCAL_USER_ID, verifyLocalSession } from "@/lib/local-session";

async function resolveAuth() {
  if (!isLocalMode()) return clerkAuth();
  const token = (await cookies()).get(LOCAL_SESSION_COOKIE)?.value;
  const signedIn = await verifyLocalSession(token, process.env.LOCAL_SESSION_SECRET || "");
  return {
    userId: signedIn ? LOCAL_USER_ID : null,
    sessionClaims: signedIn ? { sub: LOCAL_USER_ID } : null,
  };
}

export const auth = Object.assign(resolveAuth, {
  protect: async (options?: { unauthenticatedUrl?: string }) => {
    if (!isLocalMode()) return clerkAuth.protect(options);
    const { userId } = await resolveAuth();
    if (!userId) redirect(options?.unauthenticatedUrl || "/login");
    return { userId: LOCAL_USER_ID };
  },
});

export async function currentUser() {
  if (!isLocalMode()) return clerkCurrentUser();
  const { userId } = await auth();
  if (!userId) return null;
  const email = process.env.LOCAL_USER_EMAIL || "local@localhost";
  return {
    id: LOCAL_USER_ID,
    firstName: process.env.LOCAL_USER_NAME || "Local",
    lastName: "User",
    fullName: process.env.LOCAL_USER_NAME || "Local User",
    imageUrl: "",
    primaryEmailAddressId: "local-email",
    primaryEmailAddress: { id: "local-email", emailAddress: email },
    emailAddresses: [{ id: "local-email", emailAddress: email }],
  };
}
