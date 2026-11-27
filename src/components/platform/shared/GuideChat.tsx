/**
 * Guide chat — a header button that opens a chat sheet with instant answers
 * about using the app. Suggested questions follow the page it was opened from.
 * VIP members also get a direct way to message the coach from here.
 */
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, MessageCircleQuestion, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import coachAvatar from "@/assets/coach-avatar-320.webp";
import {
  guideSuggestions,
  matchGuideAnswer,
  resolveGuidePage,
  type GuideAction,
  type GuideAnswer,
} from "@/lib/platform/guide-chat";
import { cn } from "@/lib/utils";

type Message =
  | { id: string; from: "coach"; text: string; action?: GuideAction }
  | { id: string; from: "me"; text: string };

let messageSeq = 0;
const nextId = () => `g${(messageSeq += 1)}`;

export function GuideChatButton({
  actionClassName,
  iconClassName,
  strokeWidth = 1.8,
  coachChatEnabled,
  coachUnread,
}: {
  actionClassName?: string;
  iconClassName?: string;
  strokeWidth?: number;
  coachChatEnabled: boolean;
  coachUnread: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={coachUnread > 0 ? `المساعد، ${coachUnread} رسالة من الكوتش` : "المساعد"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(actionClassName, "relative")}
        onClick={() => setOpen(true)}
      >
        <MessageCircleQuestion className={iconClassName} strokeWidth={strokeWidth} />
        {coachUnread > 0 ? <span className="platform-bell-dot" /> : null}
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <GuideChatSheet
              onClose={() => setOpen(false)}
              coachChatEnabled={coachChatEnabled}
              coachUnread={coachUnread}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function GuideChatSheet({
  onClose,
  coachChatEnabled,
  coachUnread,
}: {
  onClose: () => void;
  coachChatEnabled: boolean;
  coachUnread: number;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const page = useMemo(() => resolveGuidePage(pathname), [pathname]);
  const suggestions = useMemo(() => guideSuggestions(page), [page]);
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>(() => [{ id: nextId(), from: "coach", text: page.intro }]);
  const [asked, setAsked] = useState<Set<string>>(() => new Set());
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, typing, reduce]);

  const reply = (text: string, action?: GuideAction) => {
    setTyping(true);
    const t = window.setTimeout(
      () => {
        setTyping(false);
        setMessages((m) => [...m, { id: nextId(), from: "coach", text, action }]);
      },
      reduce ? 0 : 650,
    );
    timers.current.push(t);
  };

  const ask = (answer: GuideAnswer) => {
    setAsked((s) => new Set(s).add(answer.id));
    setMessages((m) => [...m, { id: nextId(), from: "me", text: answer.question }]);
    reply(answer.answer, answer.action);
  };

  const send = () => {
    const text = draft.trim();
    if (!text || typing) return;
    setDraft("");
    setMessages((m) => [...m, { id: nextId(), from: "me", text }]);
    const hit = matchGuideAnswer(text, page);
    if (hit) {
      setAsked((s) => new Set(s).add(hit.id));
      reply(hit.answer, hit.action);
      return;
    }
    if (coachChatEnabled) {
      reply("سؤال جيد! هذا يحتاج رداً شخصياً. أرسله لي في دردشة الكوتش وسأرد عليك بنفسي.", {
        label: "مراسلة الكوتش",
        to: "/app/support/chat",
      });
    } else {
      reply("سؤال جيد! لم أجد له إجابة جاهزة هنا. تجد كل طرق التواصل والأسئلة الشائعة في صفحة الدعم.", {
        label: "صفحة الدعم",
        to: "/app/support",
      });
    }
  };

  const go = (to: string) => {
    onClose();
    void navigate({ to } as Parameters<typeof navigate>[0]);
  };

  const remaining = suggestions.filter((s) => !asked.has(s.id));

  return (
    <div className="gch" dir="rtl" lang="ar">
      <motion.button
        type="button"
        className="gch-backdrop"
        aria-label="إغلاق"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <motion.div
        role="dialog"
        aria-label="المساعد"
        className="gch-sheet"
        initial={reduce ? false : { y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
      >
        <header className="gch-head">
          <img src={coachAvatar} alt="" width={40} height={40} />
          <span className="gch-head__who">
            <b>مساعد حكيم</b>
            <span>إجابات فورية عن استخدام التطبيق</span>
          </span>
          <button type="button" className="gch-close" onClick={onClose} aria-label="إغلاق">
            <X aria-hidden />
          </button>
        </header>

        {coachChatEnabled ? (
          <button type="button" className="gch-coach" onClick={() => go("/app/support/chat")}>
            <span>
              <b>مراسلة الكوتش مباشرة</b>
              <span>{coachUnread > 0 ? `لديك ${coachUnread} رسالة جديدة` : "للأسئلة الشخصية عن خطتك"}</span>
            </span>
            {coachUnread > 0 ? <i className="gch-coach__badge">{coachUnread}</i> : <ChevronLeft aria-hidden />}
          </button>
        ) : null}

        <div ref={scrollRef} className="gch-thread" aria-live="polite">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              className={cn("gch-msg", m.from === "me" ? "is-me" : "is-coach")}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <p>{m.text}</p>
              {m.from === "coach" && m.action ? (
                <button type="button" className="gch-action" onClick={() => go(m.action!.to)}>
                  {m.action.label} <ChevronLeft aria-hidden />
                </button>
              ) : null}
            </motion.div>
          ))}
          <AnimatePresence>
            {typing ? (
              <motion.div
                key="typing"
                className="gch-msg is-coach is-typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="htd-dots">
                  <i />
                  <i />
                  <i />
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
          {!typing && remaining.length > 0 ? (
            <div className="gch-chips">
              {messages.length > 1 ? <span className="gch-chips__label">أسئلة أخرى هنا</span> : null}
              {remaining.map((s) => (
                <button key={s.id} type="button" className="gch-chip" onClick={() => ask(s)}>
                  {s.question}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <form
          className="gch-input"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب سؤالك عن التطبيق…"
            aria-label="سؤالك"
            enterKeyHint="send"
          />
          <button type="submit" aria-label="إرسال" disabled={!draft.trim() || typing}>
            <Send aria-hidden />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

