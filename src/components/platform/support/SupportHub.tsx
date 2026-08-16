import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, MessageCircle, Plus } from "lucide-react";
import coachPortrait from "@/assets/Coach_Hakim_Branded_Profile_PNG/03_Black_Guidance.png";
import { UpgradeCta } from "@/components/platform/shared/PlaceholderState";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { COACH_CHAT_NAME, COACH_REPLY_SLA, canUseCoachChat, coachAvailabilityLabel, isCoachAvailableAt } from "@/lib/platform/coaching-messaging";
import { SUPPORT_FAQS } from "@/lib/platform/support-faq";
import { useMembership } from "@/hooks/useMembership";
import { cn } from "@/lib/utils";

export function SupportHub() {
  const { features } = useMembership();
  const canChat = canUseCoachChat(features);
  const [openFaq, setOpenFaq] = useState<string>("");
  const available = isCoachAvailableAt();

  return (
    <>
      <header className="platform-section">
        <h1 className="text-xl font-black text-foreground">الدعم</h1>
        <p className="text-sm text-muted-foreground">
          أسئلة شائعة، ودردشة خاصة مع الكوتش. واتساب قناة احتياطية فقط.
        </p>
      </header>

      <section className="support-coach-card" aria-labelledby="support-coach-title">
        <div className="support-coach-card__top">
          <div className="support-coach-card__person">
            <span className="support-coach-card__avatar">
              <OptimizedImage
                src={coachPortrait}
                alt={COACH_CHAT_NAME}
                width={72}
                height={72}
                objectFit="cover"
              />
            </span>
            <span
              className={cn("support-coach-card__dot", available && "is-available")}
              aria-label={coachAvailabilityLabel(available)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="support-coach-title" className="text-[15px] font-black text-foreground">
              {COACH_CHAT_NAME}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {coachAvailabilityLabel(available)} · {COACH_REPLY_SLA}
            </p>
          </div>
        </div>
        {canChat ? (
          <Link to="/app/support/chat" className="support-coach-card__cta">
            <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
            ابدأ الدردشة
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <div className="support-coach-card__locked">
            <p className="text-xs leading-relaxed text-muted-foreground">
              الدردشة مع الكوتش متاحة حسب صلاحيات عضويتك.
            </p>
            <UpgradeCta
              className="mt-3 w-full"
              reason="فعّل برنامجك الشخصي لفتح الدردشة المباشرة مع الكوتش حكيم."
            />
          </div>
        )}
      </section>

      <section className="support-faq" aria-labelledby="support-faq-title">
        <h2 id="support-faq-title" className="text-sm font-black text-foreground">
          الأسئلة الشائعة
        </h2>
        <Accordion
          type="single"
          collapsible
          value={openFaq}
          onValueChange={setOpenFaq}
          className="support-faq__list"
        >
          {SUPPORT_FAQS.map((item) => {
            const open = openFaq === item.id;
            return (
              <AccordionItem key={item.id} value={item.id} className="support-faq__item">
                <AccordionTrigger className="support-faq__trigger hover:no-underline [&>svg]:hidden">
                  <span className="min-w-0 flex-1 text-right text-sm font-bold text-foreground">
                    {item.question}
                  </span>
                  <span className={cn("support-faq__plus", open && "is-open")} aria-hidden>
                    <Plus className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="support-faq__answer">{item.answer}</AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>
    </>
  );
}
