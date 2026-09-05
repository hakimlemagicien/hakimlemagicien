/** Map GoTrue / Auth errors to Arabic. Never claim an OTP was sent when the request failed. */

function readAuthFields(error: unknown): { message: string; code: string } {
  if (error instanceof Error) {
    const extra = error as Error & { code?: string };
    return { message: extra.message.trim(), code: String(extra.code ?? "").trim() };
  }
  if (error && typeof error === "object") {
    const row = error as { message?: unknown; code?: unknown; error_description?: unknown };
    return {
      message: String(row.message ?? row.error_description ?? "").trim(),
      code: String(row.code ?? "").trim(),
    };
  }
  return { message: String(error ?? "").trim(), code: "" };
}

function looksEnglish(text: string): boolean {
  return /[A-Za-z]/.test(text) && !/[\u0600-\u06FF]/.test(text);
}

export function translateAuthError(error: unknown, fallback = "تعذّر إكمال العملية. حاول مرة أخرى."): string {
  const { message, code } = readAuthFields(error);
  const haystack = `${code} ${message}`.toLowerCase();

  if (
    haystack.includes("email_address_invalid") ||
    haystack.includes("invalid email") ||
    /email address .+ is invalid/.test(haystack)
  ) {
    return "هذا البريد غير مقبول لإرسال رمز التحقق. استخدم بريداً حقيقياً مثل Gmail أو Outlook.";
  }
  if (haystack.includes(".test") && haystack.includes("invalid")) {
    return "نطاق هذا البريد غير مسموح للتحقق. استخدم بريداً حقيقياً.";
  }
  if (haystack.includes("over_email_send_rate_limit") || haystack.includes("rate limit") || haystack.includes("for security purposes")) {
    return "تم طلب الرمز مرات كثيرة. انتظر قليلاً ثم أعد المحاولة.";
  }
  if (haystack.includes("otp_expired") || haystack.includes("token has expired") || haystack.includes("expired")) {
    return "انتهت صلاحية الرمز. اطلب رمزاً جديداً.";
  }
  if (haystack.includes("invalid") && (haystack.includes("otp") || haystack.includes("token") || haystack.includes("code"))) {
    return "رمز التحقق غير صحيح. تأكد من الأرقام أو اطلب رمزاً جديداً.";
  }
  if (haystack.includes("invalid login credentials") || haystack.includes("invalid_credentials")) {
    return "البريد أو كلمة المرور غير صحيحة.";
  }
  if (haystack.includes("email not confirmed") || haystack.includes("email_not_confirmed")) {
    return "البريد غير مؤكد بعد. أكمل رمز التحقق أولاً.";
  }
  if (haystack.includes("user already registered") || haystack.includes("already registered")) {
    return "هذا البريد مسجّل مسبقاً. سجّل الدخول أو استخدم بريداً آخر.";
  }
  if (haystack.includes("signup") && haystack.includes("disabled")) {
    return "إنشاء الحساب غير متاح حالياً. تواصل مع الدعم.";
  }
  if (haystack.includes("error sending") || haystack.includes("smtp") || haystack.includes("magic link")) {
    return "تعذّر إرسال الرسالة إلى هذا البريد. تحقق من العنوان أو جرّب بريداً آخر.";
  }
  if (haystack.includes("password") && (haystack.includes("weak") || haystack.includes("least") || haystack.includes("characters"))) {
    return "كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل.";
  }
  if (
    haystack.includes("provider is not enabled") ||
    haystack.includes("unsupported provider") ||
    (haystack.includes("validation_failed") && haystack.includes("provider"))
  ) {
    return "تسجيل الدخول بهذه الطريقة غير متاح حاليًا.";
  }
  if (haystack.includes("oauth") && (haystack.includes("google") || haystack.includes("apple"))) {
    if (haystack.includes("apple")) return "تعذر تسجيل الدخول باستخدام Apple. حاول مرة أخرى.";
    return "تعذر تسجيل الدخول باستخدام Google. حاول مرة أخرى.";
  }

  if (message && !looksEnglish(message)) return message;
  return fallback;
}

export function translateOAuthError(provider: "google" | "apple", error: unknown): string {
  const translated = translateAuthError(
    error,
    provider === "apple"
      ? "تعذر تسجيل الدخول باستخدام Apple. حاول مرة أخرى."
      : "تعذر تسجيل الدخول باستخدام Google. حاول مرة أخرى.",
  );
  const { message, code } = readAuthFields(error);
  const haystack = `${code} ${message}`.toLowerCase();
  if (
    haystack.includes("provider is not enabled") ||
    haystack.includes("unsupported provider") ||
    (haystack.includes("validation_failed") && haystack.includes("provider"))
  ) {
    return "تسجيل الدخول بهذه الطريقة غير متاح حاليًا.";
  }
  return translated;
}

export function quizOtpStatusCopy(input: {
  authenticating: boolean;
  sending: boolean;
  sent: boolean;
  hasError: boolean;
  name: string;
  otpLength: number;
}): string {
  if (input.authenticating) return "جاري التحقق من الرابط...";
  if (input.sending) return "جاري إرسال رمز التحقق إلى بريدك...";
  if (input.hasError && !input.sent) {
    return "لم يُرسل رمز التحقق. صحّح البريد أو أعد المحاولة. لن يصلك رمز حتى ينجح الإرسال.";
  }
  if (input.sent) {
    return input.name
      ? `مرحباً ${input.name}، أرسلنا رمزاً مكوّناً من ${input.otpLength} أرقام إلى بريدك.`
      : `أرسلنا رمزاً مكوّناً من ${input.otpLength} أرقام إلى بريدك لإكمال التسجيل.`;
  }
  return "أدخل بريداً صالحاً لإرسال رمز التحقق.";
}
