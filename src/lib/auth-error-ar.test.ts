import assert from "node:assert/strict";
import { quizOtpStatusCopy, translateAuthError, translateOAuthError } from "./auth-error-ar.ts";
import { quizMeasureCopy } from "./quiz-measure-copy.ts";

assert.equal(
  translateAuthError({ message: 'Email address "x@qa.test" is invalid', code: "email_address_invalid" }).includes("بريداً حقيقياً"),
  true,
  "invalid email is Arabic",
);
assert.equal(translateAuthError({ message: 'Email address "x@qa.test" is invalid' }).includes("Email address"), false, "no English leak");
assert.equal(translateAuthError({ message: "Invalid login credentials" }).includes("كلمة المرور"), true, "login creds");
assert.equal(translateAuthError({ message: "Token has expired or is invalid" }).includes("صلاحية"), true, "expired");
assert.equal(translateAuthError("البريد غير صالح"), "البريد غير صالح", "keep Arabic");
assert.equal(
  translateAuthError({ message: "Unsupported provider", code: "validation_failed" }).includes("غير متاح"),
  true,
  "provider disabled",
);
assert.equal(translateOAuthError("google", { message: "oauth error" }).includes("Google"), true, "google oauth");
assert.equal(translateOAuthError("apple", { message: "oauth error" }).includes("Apple"), true, "apple oauth");
assert.equal(
  translateOAuthError("google", { message: "Provider is not enabled" }).includes("غير متاح"),
  true,
  "provider not enabled",
);

const failedSend = quizOtpStatusCopy({
  authenticating: false,
  sending: false,
  sent: false,
  hasError: true,
  name: "أحمد",
  otpLength: 8,
});
assert.equal(failedSend.includes("أرسلنا"), false, "do not claim OTP sent on failure");
assert.equal(failedSend.includes("لم يُرسل"), true, "state send failure");

const sentCopy = quizOtpStatusCopy({
  authenticating: false,
  sending: false,
  sent: true,
  hasError: false,
  name: "أحمد",
  otpLength: 8,
});
assert.equal(sentCopy.includes("أرسلنا"), true, "claim send only after success");

const male = quizMeasureCopy("male");
assert.equal(male.title.includes("طوله"), false, "no third-person طوله");
assert.equal(male.title.includes("طولك"), true, "male uses طولك");
assert.equal(male.subtitle.includes("أدخلي"), false, "male not feminine");
assert.equal(male.subtitle.includes("أدخل "), true, "male أدخل");
assert.equal(male.subtitle.includes("تحصلي"), false, "male not تحصلي");

const female = quizMeasureCopy("female");
assert.equal(female.subtitle.includes("أدخلي"), true, "female أدخلي");
assert.equal(female.subtitle.includes("تحصلي"), true, "female تحصلي");

console.log("auth-error-ar tests passed");
