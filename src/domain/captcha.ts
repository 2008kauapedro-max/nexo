/** Token is untrusted until Supabase Auth verifies it with the configured provider. */
export function captchaToken(
  value: FormDataEntryValue | null,
  required: boolean,
) {
  if (typeof value === "string" && value.length > 0 && value.length <= 2048)
    return value;
  if (required) throw new Error("CAPTCHA_REQUIRED");
  return undefined;
}
