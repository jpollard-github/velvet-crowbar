export function isConfiguredEditor(
  email: string | null | undefined,
  configuredEmail: string,
) {
  return email?.toLowerCase() === configuredEmail.toLowerCase();
}
