import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import type { CoachChatDraft, CoachChatMessage } from "@/lib/platform/coach-chat";

const CATEGORY_LABEL: Record<CoachChatDraft["category"], string> = {
  meal_photo: "مراجعة وجبة",
  program_adjust: "تعديل تمرين",
  coach_needed: "يحتاج رد الكوتش",
};

function previewForDraft(messages: CoachChatMessage[], draft: CoachChatDraft) {
  const source = messages.find((message) => message.id === draft.memberMessageId);
  if (!source || source.kind === "progress" || source.kind === "status") return "رسالة العضو";
  if (source.kind === "image") return source.text || "صورة مرفقة";
  return source.text;
}

export function CoachChatReviewSheet({
  open,
  drafts,
  messages,
  onClose,
  onSend,
  onDismiss,
}: {
  open: boolean;
  drafts: CoachChatDraft[];
  messages: CoachChatMessage[];
  onClose: () => void;
  onSend: (draftId: string, text: string) => void;
  onDismiss: (draftId: string) => void;
}) {
  const current = drafts[0] ?? null;
  const [text, setText] = useState(current?.suggestedText ?? "");

  useEffect(() => {
    if (current) setText(current.suggestedText);
  }, [current?.id, current?.suggestedText]);

  if (typeof document === "undefined" || !open || !current) return null;

  return createPortal(
    <div className="coach-chat-review">
      <button type="button" className="coach-chat-review__backdrop" aria-label="إغلاق" onClick={onClose} />
      <section
        className="coach-chat-review__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-review-title"
        dir="rtl"
      >
        <div className="coach-chat-review__handle" />
        <header className="coach-chat-review__head">
          <div>
            <p className="coach-chat-review__kicker">مسودة بانتظار اعتمادك</p>
            <h2 id="coach-review-title">{CATEGORY_LABEL[current.category]}</h2>
          </div>
          <span className="coach-chat-review__count">{drafts.length}</span>
        </header>
        <p className="coach-chat-review__quote">{previewForDraft(messages, current)}</p>
        <label className="coach-chat-review__label" htmlFor="coach-draft-text">
          عدّل ثم أرسل
        </label>
        <textarea
          id="coach-draft-text"
          className="coach-chat-review__text"
          rows={4}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="coach-chat-review__actions">
          <button type="button" className="coach-chat-review__dismiss" onClick={() => onDismiss(current.id)}>
            <X className="h-4 w-4" />
            تجاهل
          </button>
          <button
            type="button"
            className="coach-chat-review__send"
            disabled={!text.trim()}
            onClick={() => onSend(current.id, text)}
          >
            <Check className="h-4 w-4" />
            اعتماد وإرسال
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
