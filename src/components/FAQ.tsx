import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function useInView<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, threshold]);
  return { ref, inView };
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "كيف يعمل برنامج التدريب الأونلاين؟",
    a: "تبدأ بتقييم شامل لحالتك وأهدافك، ثم نصمم لك خطة تدريب وغذاء مخصصة بالكامل تصلك عبر التطبيق مع متابعة دورية من المدرب.",
  },
  {
    q: "هل أحتاج إلى معدات رياضية خاصة؟",
    a: "لا، يمكننا تصميم برنامجك ليناسب المعدات المتوفرة لديك سواء كنت في النادي أو في المنزل بأبسط الأدوات.",
  },
  {
    q: "كيف يتم تصميم خطة التغذية؟",
    a: "نأخذ في الاعتبار تفضيلاتك الغذائية، نمط حياتك، وأهدافك لنصمم خطة مرنة وسهلة الالتزام بها على المدى الطويل.",
  },
  {
    q: "كم مرة سيتم متابعة تقدمي؟",
    a: "نتابع تقدمك أسبوعياً ونعدل الخطة عند الحاجة، مع إمكانية التواصل المباشر مع المدرب طوال أيام الأسبوع.",
  },
  {
    q: "ماذا لو لم أحقق النتائج المتوقعة؟",
    a: "نلتزم بالعمل معك حتى تحقق هدفك. نراجع خطتك باستمرار ونعدلها لضمان وصولك إلى النتائج المرجوة.",
  },
  {
    q: "هل يمكنني تغيير خطتي أثناء البرنامج؟",
    a: "بالتأكيد. الخطة مرنة وقابلة للتعديل حسب تطورك واحتياجاتك وأي ظروف جديدة قد تطرأ خلال رحلتك.",
  },
  {
    q: "هل البرنامج مناسب للمبتدئين؟",
    a: "نعم، نصمم البرنامج بناءً على مستواك الحالي ونتدرج معك خطوة بخطوة لضمان الأمان والاستمرارية.",
  },
  {
    q: "كيف يمكنني التواصل مع المدرب؟",
    a: "يمكنك التواصل مع المدرب مباشرة عبر التطبيق أو واتساب طوال أيام الأسبوع للحصول على دعم سريع.",
  },
];

function FaqItem({
  item,
  index,
  onOpen,
}: {
  item: { q: string; a: string };
  index: number;
  onOpen: () => void;
}) {
  const { ref, inView } = useInView<HTMLButtonElement>();
  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center justify-between gap-4 overflow-hidden rounded-[20px] bg-white px-5 py-5 text-right ring-1 ring-neutral-100 shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:ring-orange-100 md:px-6 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500">
        <Plus className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className="flex-1 text-right text-sm font-bold text-neutral-900 md:text-base">{item.q}</span>
    </button>
  );
}

export default function FAQ() {
  const head = useInView<HTMLDivElement>();
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(null);
  const activeFaq = activeFaqIdx !== null ? FAQS[activeFaqIdx] : null;

  return (
    <section
      id="faq"
      dir="rtl"
      className="relative w-full overflow-hidden bg-white py-20 md:py-28 font-[Tajawal,Cairo,sans-serif]"
    >
      {/* decorative dots */}
      <div className="pointer-events-none absolute left-6 top-32 hidden md:grid grid-cols-5 gap-2 opacity-40">
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-orange-300" />
        ))}
      </div>
      <div className="pointer-events-none absolute right-6 top-32 hidden md:grid grid-cols-5 gap-2 opacity-40">
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-orange-300" />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* HEADER */}
        <div
          ref={head.ref}
          className={`text-center transition-all duration-700 ease-out ${
            head.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600">
            <Sparkles className="h-4 w-4" />
            إجابات على أكثر الأسئلة شيوعاً
          </span>
          <h2 className="mt-5 text-4xl md:text-6xl lg:text-7xl font-black leading-[1.15] text-neutral-900">
            الأسئلة <span className="text-orange-500">الشائعة</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-neutral-500 leading-loose">
            كل ما تحتاج معرفته قبل البدء في برنامجك التدريبي والغذائي.
          </p>
        </div>

        <div className="mx-auto mt-14 md:mt-16 max-w-3xl space-y-3">
          {FAQS.map((item, i) => (
            <FaqItem
              key={item.q}
              item={item}
              index={i}
              onOpen={() => setActiveFaqIdx(i)}
            />
          ))}
        </div>

        <Dialog
          open={activeFaqIdx !== null}
          onOpenChange={(open) => {
            if (!open) setActiveFaqIdx(null);
          }}
        >
          <DialogContent
            dir="rtl"
            className="max-w-md gap-0 overflow-hidden rounded-[24px] border-orange-100 p-0 sm:max-w-lg [&>button]:left-4 [&>button]:right-auto"
          >
            {activeFaq && (
              <>
                <div className="h-1.5 w-full bg-gradient-to-l from-orange-500 to-orange-400" />
                <DialogHeader className="space-y-3 px-6 pb-2 pt-6 text-right">
                  <DialogTitle className="text-lg font-black leading-snug text-neutral-900 md:text-xl">
                    {activeFaq.q}
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription
                  asChild
                  className="px-6 pb-6 text-right text-sm leading-loose text-neutral-600 md:text-base"
                >
                  <p>{activeFaq.a}</p>
                </DialogDescription>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
