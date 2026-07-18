import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, ImageIcon, Trash2, X } from "lucide-react";
import type { PersonalInfoUpdate, ProfileDetails, TrainingProfileSnapshot } from "@/lib/platform/profile-api";
import { profileCardClass } from "./ProfileShared";
import { cn } from "@/lib/utils";

export function ProfileBottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[130] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" aria-label="إغلاق" className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div
            initial={reduceMotion ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduceMotion ? undefined : { y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg rounded-t-[28px] bg-background px-5 pb-8 pt-4 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-black">{title}</h3>
              <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-10 w-10 place-items-center">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function ProfileConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "إلغاء",
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[140] grid place-items-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" aria-label="إغلاق" className="absolute inset-0 bg-black/35" onClick={onClose} />
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
            className={cn(profileCardClass, "relative z-10 w-full max-w-sm p-5")}
            role="alertdialog"
            aria-modal="true"
          >
            <h3 className="text-base font-black text-foreground">{title}</h3>
            <p className="mt-2 text-sm font-medium text-muted-foreground">{description}</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-muted text-sm font-black"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={cn(
                  "inline-flex h-11 flex-1 items-center justify-center rounded-2xl text-sm font-black text-white",
                  danger ? "bg-destructive" : "bg-primary",
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function ProfileAvatarSheet({
  open,
  uploading,
  onClose,
  onPick,
  onRemove,
}: {
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }, [open]);

  const handleFile = (file: File | undefined) => {
    if (file) onPick(file);
  };

  return (
    <ProfileBottomSheet open={open} title="تغيير الصورة" onClose={onClose}>
      <div className="space-y-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => cameraRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm font-black"
        >
          <Camera className="h-5 w-5 text-primary" />
          التقاط صورة
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => galleryRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm font-black"
        >
          <ImageIcon className="h-5 w-5 text-primary" />
          اختيار من الجهاز
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={onRemove}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-destructive"
        >
          <Trash2 className="h-5 w-5" />
          حذف الصورة الحالية
        </button>
        {uploading ? <p className="text-center text-xs font-bold text-muted-foreground">جاري الرفع...</p> : null}
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </ProfileBottomSheet>
  );
}

const inputClass =
  "h-11 w-full rounded-2xl border border-border/70 bg-muted/30 px-3 text-sm font-bold outline-none focus:border-primary/40";

export function ProfileEditInfoSheet({
  open,
  profile,
  training,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  profile: ProfileDetails | null;
  training: TrainingProfileSnapshot | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: PersonalInfoUpdate) => Promise<void>;
}) {
  const answers = training?.answers ?? {};
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [heightCm, setHeightCm] = useState(answers.heightCm?.toString() ?? "");
  const [weightKg, setWeightKg] = useState(answers.weightKg?.toString() ?? "");
  const [targetWeightKg, setTargetWeightKg] = useState(answers.targetWeightKg?.toString() ?? "");
  const [activityLevel, setActivityLevel] = useState(answers.activityLevel ?? "");
  const [gender, setGender] = useState<"male" | "female" | "">(answers.gender ?? "");
  const [birthDate, setBirthDate] = useState(answers.birthDate ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFullName(profile?.fullName ?? "");
    setPhone(profile?.phone ?? "");
    setCity(profile?.city ?? "");
    setCountry(profile?.country ?? "");
    setHeightCm(answers.heightCm?.toString() ?? "");
    setWeightKg(answers.weightKg?.toString() ?? "");
    setTargetWeightKg(answers.targetWeightKg?.toString() ?? "");
    setActivityLevel(answers.activityLevel ?? "");
    setGender(answers.gender ?? "");
    setBirthDate(answers.birthDate ?? "");
    setError(null);
  }, [open, profile, training, answers]);

  const submit = async () => {
    setError(null);
    const height = heightCm ? Number(heightCm) : null;
    const weight = weightKg ? Number(weightKg) : null;
    const target = targetWeightKg ? Number(targetWeightKg) : null;
    if (height !== null && (height < 100 || height > 250)) {
      setError("الطول غير منطقي");
      return;
    }
    if (weight !== null && (weight < 30 || weight > 300)) {
      setError("الوزن غير منطقي");
      return;
    }
    try {
      await onSave({
        fullName,
        phone: phone || null,
        city: city || null,
        country: country || null,
        heightCm: height,
        weightKg: weight,
        targetWeightKg: target,
        activityLevel: activityLevel || null,
        gender: gender || null,
        birthDate: birthDate || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الحفظ");
    }
  };

  return (
    <ProfileBottomSheet open={open} title="تعديل المعلومات" onClose={onClose}>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto pb-2">
        <label className="block">
          <span className="mb-1 block text-xs font-black">الاسم الكامل</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black">الهاتف</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-black">الجنس</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female" | "")}
              className={inputClass}
            >
              <option value="">غير محدد</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-black">تاريخ الميلاد</span>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-black">الطول</span>
            <input inputMode="numeric" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-black">الوزن</span>
            <input inputMode="numeric" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-black">الهدف</span>
            <input inputMode="numeric" value={targetWeightKg} onChange={(e) => setTargetWeightKg(e.target.value)} className={inputClass} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-black">مستوى النشاط</span>
          <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className={inputClass}>
            <option value="">غير محدد</option>
            <option value="sedentary">قليل الحركة</option>
            <option value="light">نشاط خفيف</option>
            <option value="moderate">نشاط متوسط</option>
            <option value="active">نشط</option>
            <option value="very_active">نشط جداً</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-black">المدينة</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-black">الدولة</span>
            <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
          </label>
        </div>
        {error ? <p className="text-xs font-bold text-destructive">{error}</p> : null}
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </ProfileBottomSheet>
  );
}

export function ProfileSecurityFormSheet({
  open,
  mode,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "email" | "password";
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues({});
      setError(null);
    }
  }, [open, mode]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إكمال العملية");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileBottomSheet
      open={open}
      title={mode === "email" ? "تعديل البريد الإلكتروني" : "تغيير كلمة المرور"}
      onClose={onClose}
    >
      <div className="space-y-3">
        {mode === "email" ? (
          <>
            <p className="text-xs text-muted-foreground">
              سيُرسل رابط تحقق إلى البريد الجديد — لن يتغير البريد قبل اكتمال التحقق.
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-black">البريد الجديد</span>
              <input
                type="email"
                value={values.email ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                className={inputClass}
              />
            </label>
          </>
        ) : (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-black">كلمة المرور الحالية</span>
              <input
                type="password"
                value={values.current ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, current: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-black">كلمة المرور الجديدة</span>
              <input
                type="password"
                value={values.next ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, next: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-black">تأكيد كلمة المرور</span>
              <input
                type="password"
                value={values.confirm ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, confirm: e.target.value }))}
                className={inputClass}
              />
            </label>
            <p className="text-[10px] text-muted-foreground">8 أحرف على الأقل</p>
          </>
        )}
        {error ? <p className="text-xs font-bold text-destructive">{error}</p> : null}
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground"
        >
          {saving ? "جاري..." : "متابعة"}
        </button>
      </div>
    </ProfileBottomSheet>
  );
}

export function ProfileDeleteAccountFlow({
  open,
  step,
  onClose,
  onAdvance,
  onConfirmDelete,
}: {
  open: boolean;
  step: 1 | 2 | 3;
  onClose: () => void;
  onAdvance: () => void;
  onConfirmDelete: () => void;
}) {
  const copy =
    step === 1
      ? "سيتم حذف بيانات حسابك وبرنامجك وصور التقدم وفق السياسة المعتمدة. قد نحتفظ ببعض السجلات لأسباب قانونية أو مالية."
      : step === 2
        ? "تأكيد الهوية: هذا الإجراء لا يمكن التراجع عنه. سيتم إلغاء العضوية النشطة إن وجدت."
        : "هل أنت متأكد من حذف حسابك نهائياً؟";

  return (
    <ProfileConfirmDialog
      open={open}
      title={`حذف الحساب (${step}/3)`}
      description={copy}
      confirmLabel={step === 3 ? "حذف نهائي" : "متابعة"}
      danger
      onClose={onClose}
      onConfirm={step === 3 ? onConfirmDelete : onAdvance}
    />
  );
}
