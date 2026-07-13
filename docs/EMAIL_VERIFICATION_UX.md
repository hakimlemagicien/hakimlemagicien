# Email Verification UX — Hakim Coaching

## ما تم تنفيذه

| العنصر | الملف / الموقع |
|--------|----------------|
| قالب البريد (OTP + رابط احتياطي) | `supabase/email-templates/magic-link.html` |
| معاينة محلية للتصميم | `supabase/email-templates/magic-link.preview.html` |
| إعدادات OTP (8 أرقام / 10 دقائق) | `supabase/config.toml` → `otp_length = 8`, `otp_expiry = 600` |
| إرسال الرمز | `src/lib/quiz-onboarding-api.ts` → `sendEmailVerificationOtp()` |
| إدخال الرمز في التطبيق | `src/components/quiz/QuizOnboardingScreens.tsx` → `VerifyEmailScreen` |
| رابط التحقق الاحتياطي | يوجّه إلى `/quiz?step=createPassword` |

## نشر القالب على Supabase (يدوي — مرة واحدة)

المشروع الرسمي: `ufgrbpakuemamggwypdh`

### الطريقة 1 — Dashboard (الأسهل)

1. [Supabase Dashboard](https://supabase.com/dashboard/project/ufgrbpakuemamggwypdh/auth/templates) → **Authentication** → **Email Templates**
2. اختر **Magic Link**
3. **Subject:** `تحقق من بريدك الإلكتروني`
4. الصق محتوى `supabase/email-templates/magic-link.html` في حقل HTML
5. **Authentication** → **SMTP Settings**
   - **Sender name:** `Hakim Coaching`
   - **From:** `support@hakimlemagicien.com`
6. احفظ

### الطريقة 2 — CLI

```bash
supabase link --project-ref ufgrbpakuemamggwypdh
supabase config push
```

### إعدادات OTP

الإنتاج يستخدم **8 أرقام**. تأكد من مزامنة الإعدادات:

```bash
supabase link --project-ref ufgrbpakuemamggwypdh
supabase config push
```

## معايير القبول

- [x] هوية Hakim Coaching فقط (بدون Supabase في نص الرسالة)
- [x] رمز OTP من 8 أرقام هو العنصر الأبرز
- [x] رابط «متابعة عبر رابط التحقق» احتياطي فقط
- [x] RTL + Cairo + ألوان المشروع (#FF6B00)
- [x] المستخدم يُدخل الرمز داخل التطبيق دون مغادرة التدفق

## اختبار سريع

1. افتح `supabase/email-templates/magic-link.preview.html` في المتصفح (معاينة التصميم)
2. في التطبيق: أكمل الكويز حتى شاشة **تحقق من بريدك الإلكتروني**
3. تحقق من وصول بريد بعنوان **تحقق من بريدك الإلكتروني** ومرسل **Hakim Coaching**
4. أدخل الرمز الـ 8 أرقام في التطبيق
5. اضغط «متابعة عبر رابط التحقق» في البريد → يجب فتح شاشة **إنشاء كلمة المرور** مباشرة
