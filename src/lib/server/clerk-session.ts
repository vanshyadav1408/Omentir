import { auth } from "./auth";
import { isClerkSessionKeyMismatch } from "../clerk-errors";

type ClerkAuthResult = Awaited<ReturnType<typeof auth>>;

export async function authOrSignedOut(): Promise<ClerkAuthResult | { userId: null }> {
  try {
    return await auth();
  } catch (error) {
    if (isClerkSessionKeyMismatch(error)) {
      return { userId: null };
    }

    throw error;
  }
}
