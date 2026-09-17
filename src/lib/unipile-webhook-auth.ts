// Unipile's own docs attach the shared secret as `Unipile-Auth`. We also send
// `x-omentir-webhook-secret` when we register the webhook. Checking only one
// name 401s a valid delivery that used the other.

export function unipileWebhookProvidedSecret(headers: {
  get(name: string): string | null;
}) {
  return (
    headers.get("x-omentir-webhook-secret") ||
    headers.get("unipile-auth") ||
    headers.get("x-webhook-secret") ||
    ""
  );
}

export function unipileWebhookSecretHeaders(secret: string) {
  return [
    { key: "Content-Type", value: "application/json" },
    { key: "x-omentir-webhook-secret", value: secret },
    { key: "Unipile-Auth", value: secret },
  ];
}
