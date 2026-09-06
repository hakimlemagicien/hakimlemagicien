import { useEffect, useState } from "react";
import { AdminCard, AdminStatusBadge } from "@/components/admin/AdminPage";
import { AdminField, AdminSelect } from "@/components/admin/AdminLibraryKit";
import type { AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import { useStaffPermissions } from "@/components/admin/StaffPermissionsContext";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import { setAdminClientTrainingGoal } from "@/lib/admin/admin-clients-api";
import {
  ADMIN_GOAL_PICKER_GROUPS,
  adminTrainingGoalLabel,
  presentClientTrainingGoal,
} from "@/lib/admin/admin-client-goal";
import { translateLibraryError } from "@/lib/admin/admin-libraries";

type Props = {
  overview: AdminClientOverview;
  onUpdated: () => Promise<void> | void;
  onConfirm: (request: AdminConfirmRequest) => void;
};

export function ClientTrainingGoalCard({ overview, onUpdated, onConfirm }: Props) {
  const { can } = useStaffPermissions();
  const canEdit = can("training.manage");
  const current = presentClientTrainingGoal(overview.goal);
  const [selected, setSelected] = useState(current.canonicalId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(presentClientTrainingGoal(overview.goal).canonicalId ?? "");
    setError(null);
  }, [overview.goal, overview.id]);

  const dirty = Boolean(selected) && selected !== (current.canonicalId ?? "");

  const save = (reason?: string) => {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    void setAdminClientTrainingGoal({
      clientId: overview.id,
      goal: selected,
      reason: reason ?? "",
    })
      .then(async () => {
        await onUpdated();
      })
      .catch((err) => {
        console.error(err);
        setError(translateLibraryError(err));
      })
      .finally(() => setSaving(false));
  };

  const requestSave = () => {
    if (!selected) {
      setError("اختر هدفًا رسميًا.");
      return;
    }
    onConfirm({
      title: "تغيير هدف التدريب",
      body: "سيتم ربط ملف العميل بهدف رسمي حتى تستطيع Strategy Matrix التوليد. البرنامج الحالي لا يتغيّر تلقائيًا.",
      confirmLabel: "حفظ الهدف",
      tone: "primary",
      reasonRequired: true,
      reasonLabel: "سبب التغيير",
      subjectLabel: overview.full_name || "العميل",
      diff: [
        {
          label: "الهدف",
          before: current.displayAr,
          after: adminTrainingGoalLabel(selected),
        },
      ],
      onConfirm: (reason) => save(reason),
    });
  };

  return (
    <AdminCard>
      <h2 className="cc-section__title">هدف التدريب</h2>
      <dl className="cc-dl">
        <div>
          <dt>الهدف الحالي</dt>
          <dd>{current.displayAr}</dd>
        </div>
        <div>
          <dt>الحالة</dt>
          <dd>
            <AdminStatusBadge
              tone={current.matrixReady ? "success" : current.status === "MISSING" ? "neutral" : "review"}
            >
              {current.statusLabelAr}
            </AdminStatusBadge>
          </dd>
        </div>
      </dl>
      {!current.matrixReady ? (
        <p className="cc-field__error" role="status">
          Strategy Matrix لا تولّد برنامجًا قبل اختيار هدف رسمي مربوط.
        </p>
      ) : (
        <p className="cc-muted">الهدف مربوط. يمكنك توليد البرنامج من تبويب التدريب.</p>
      )}
      {canEdit ? (
        <>
          <AdminField label="الهدف الرسمي" htmlFor="client_training_goal">
            <AdminSelect id="client_training_goal" value={selected} onChange={setSelected}>
              <option value="">اختر هدفًا رسميًا</option>
              {ADMIN_GOAL_PICKER_GROUPS.map((group) => (
                <optgroup key={group.id} label={group.labelAr}>
                  {group.goals.map((goal) => (
                    <option key={goal} value={goal}>
                      {adminTrainingGoalLabel(goal)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </AdminSelect>
          </AdminField>
          {error ? (
            <p className="cc-field__error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="cc-editor-toolbar">
            <button
              type="button"
              className="cc-btn cc-btn--primary"
              disabled={saving || !selected || (!dirty && current.matrixReady)}
              onClick={requestSave}
            >
              {saving ? "جاري الحفظ…" : "حفظ الهدف"}
            </button>
          </div>
        </>
      ) : (
        <p className="cc-muted">عرض فقط. تغيير الهدف متاح للمدرب أو مدير النظام.</p>
      )}
    </AdminCard>
  );
}
