import "server-only";

import { getApps, initializeApp, cert, applicationDefault, type ServiceAccount } from "firebase-admin/app";
import { isLocalMode } from "@/lib/runtime-mode";
import { parseServiceAccountJson } from "./runtime-config";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export function getServiceAccount() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!raw) return null;

  return parseServiceAccountJson(raw);
}

export function getDb(): Firestore {
  if (!getApps().length) {
    const serviceAccount = getServiceAccount();

    if (isLocalMode() && !serviceAccount) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is required in local mode.");
    }

    initializeApp({
      credential: serviceAccount ? cert(serviceAccount as ServiceAccount) : applicationDefault(),
      projectId:
        process.env.FIREBASE_PROJECT_ID ||
        serviceAccount?.project_id ||
        process.env.GOOGLE_CLOUD_PROJECT,
    });
  }

  return getFirestore();
}

export function nowIso() {
  return new Date().toISOString();
}

export function cleanId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "");
}

export function normalizeLinkedInProfileUrl(value?: string) {
  if (!value) return "";

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const hostname = url.hostname.toLowerCase();
    if (hostname !== "linkedin.com" && !hostname.endsWith(".linkedin.com")) return value.trim();

    const parts = url.pathname.split("/").filter(Boolean);
    const profileIndex = parts.findIndex((part) => part.toLowerCase() === "in" || part.toLowerCase() === "pub");
    const profileType = profileIndex >= 0 ? parts[profileIndex].toLowerCase() : "";
    const identifier =
      profileType === "pub"
        ? parts.slice(profileIndex + 1).join("/")
        : parts[profileIndex + 1] || "";

    return identifier
      ? `https://www.linkedin.com/${profileType}/${identifier.toLowerCase()}`
      : value.trim();
  } catch {
    return value.trim();
  }
}
