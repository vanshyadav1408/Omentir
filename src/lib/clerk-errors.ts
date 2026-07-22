export function isClerkSessionKeyMismatch(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  return (
    message.includes("jwk-kid-mismatch") ||
    message.includes("Handshake token verification failed") ||
    message.includes("Unable to find a signing key in JWKS")
  );
}
