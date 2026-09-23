import {
  BarChart3,
  Check,
  Droplets,
  Dumbbell,
  Home,
  Salad,
  Sparkles,
  Utensils,
} from "lucide-react";
import nutritionHero from "@/assets/home-nutrition-hero.webp";

export function MarketingAppShowcase({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative mx-auto w-full ${compact ? "max-w-[330px]" : "max-w-[390px] lg:max-w-[430px]"}`}
      aria-label="معاينة من واجهة تطبيق MAAKFIT"
    >
      <div className="absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(circle,rgba(255,107,0,0.18),rgba(255,247,239,0.72)_48%,transparent_72%)] blur-xl" />

      <div className="absolute -right-3 top-[17%] z-20 hidden items-center gap-2 rounded-2xl border border-[#E8E4DE] bg-white/95 px-3 py-2 shadow-[0_18px_38px_-20px_rgba(15,23,42,0.35)] backdrop-blur sm:flex lg:-right-16">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#E9F9EF] text-[#22A95D]">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
        <div className="text-right">
          <p className="text-[11px] font-extrabold text-[#0F172A]">برنامجك جاهز</p>
          <p className="text-[9px] font-medium text-[#64748B]">داخل حسابك في التطبيق</p>
        </div>
      </div>

      <div className="absolute -left-3 bottom-[18%] z-20 hidden items-center gap-2 rounded-2xl border border-[#FFE0C7] bg-white/95 px-3 py-2 shadow-[0_18px_38px_-20px_rgba(15,23,42,0.35)] backdrop-blur sm:flex lg:-left-14">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#FFF1E6] text-[#FF6B00]">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="text-right">
          <p className="text-[11px] font-extrabold text-[#0F172A]">تجربة رقمية كاملة</p>
          <p className="text-[9px] font-medium text-[#64748B]">تدريب · تغذية · تقدم · ماء</p>
        </div>
      </div>

      <div className="rounded-[38px] border-[7px] border-[#171717] bg-[#171717] p-1.5 shadow-[0_35px_75px_-30px_rgba(15,23,42,0.5)]">
        <div className="overflow-hidden rounded-[27px] bg-[#F8F5F1]">
          <div className="flex items-center justify-between bg-white px-4 pb-3 pt-4">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#111827] text-[10px] font-black text-white">
              MF
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#94A3B8]">تطبيق MAAKFIT</p>
              <p className="text-[14px] font-black text-[#0F172A]">خطتك اليوم</p>
              <p className="mt-0.5 text-[8px] font-extrabold text-[#FF6B00]">الهدف: تنشيف الجسم</p>
            </div>
          </div>

          <div className={`${compact ? "space-y-2.5 p-3" : "space-y-3 p-3.5"}`}>
            <div className="rounded-[20px] bg-gradient-to-l from-[#FF6B00] to-[#FF8A3D] p-3.5 text-white shadow-[0_14px_28px_-18px_rgba(255,107,0,0.75)]">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/18">
                  <Dumbbell className="h-5 w-5" />
                </span>
                <div className="flex-1 text-right">
                  <p className="text-[10px] font-bold text-white/75">تمرين اليوم</p>
                  <p className="mt-0.5 text-[15px] font-black">الجزء العلوي والقوة</p>
                  <p className="mt-1 text-[10px] font-semibold text-white/80">
                    6 تمارين · 45 دقيقة
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25">
                <div className="h-full w-[62%] rounded-full bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_94px] gap-2.5 rounded-[20px] border border-[#E8E4DE] bg-white p-2.5 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.4)]">
              <div className="flex flex-col justify-center text-right">
                <div className="flex items-center justify-end gap-1.5 text-[#22A95D]">
                  <span className="text-[9px] font-extrabold">الخطة الغذائية</span>
                  <Salad className="h-3.5 w-3.5" />
                </div>
                <p className="mt-1 text-[12px] font-black text-[#0F172A]">وجبتك التالية محسوبة</p>
                <p className="mt-1 text-[9px] font-semibold text-[#64748B]">
                  السعرات والماكروز حسب هدفك
                </p>
                <div className="mt-2 flex justify-end gap-1">
                  <span className="rounded-full bg-[#FFF1E6] px-2 py-0.5 text-[8px] font-bold text-[#FF6B00]">
                    6 وجبات
                  </span>
                  <span className="rounded-full bg-[#E9F9EF] px-2 py-0.5 text-[8px] font-bold text-[#22A95D]">
                    محسوبة
                  </span>
                </div>
              </div>
              <img
                src={nutritionHero}
                alt="وجبة من خطة التغذية داخل تطبيق MAAKFIT"
                className="aspect-square h-full w-full rounded-2xl object-cover"
                loading="eager"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-[18px] border border-[#DCEAFE] bg-[#F4F8FF] p-3 text-right">
                <div className="flex items-center justify-between text-[#3B82F6]">
                  <span className="text-[10px] font-black">5 / 8 أكواب</span>
                  <Droplets className="h-4 w-4" />
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#DCEAFE]">
                  <div className="h-full w-[62%] rounded-full bg-[#3B82F6]" />
                </div>
                <p className="mt-1.5 text-[8px] font-bold text-[#64748B]">متابعة الترطيب</p>
              </div>
              <div className="rounded-[18px] border border-[#E5F4E8] bg-[#F4FBF5] p-3 text-right">
                <div className="flex items-center justify-between text-[#22A95D]">
                  <span className="text-[10px] font-black">+12%</span>
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="mt-2 flex h-5 items-end justify-between gap-1" aria-hidden>
                  {[38, 52, 46, 68, 78, 88].map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-t bg-[#22A95D]/70"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-[8px] font-bold text-[#64748B]">تقدمك هذا الشهر</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 border-t border-[#E8E4DE] bg-white px-3 py-2.5 text-center text-[#94A3B8]">
            {[
              { Icon: Home, label: "الرئيسية", active: true },
              { Icon: Dumbbell, label: "التدريب" },
              { Icon: Utensils, label: "التغذية" },
              { Icon: BarChart3, label: "التقدم" },
            ].map(({ Icon, label, active }) => (
              <div key={label} className={active ? "text-[#FF6B00]" : ""}>
                <Icon className="mx-auto h-4 w-4" strokeWidth={2.2} />
                <p className="mt-1 text-[7px] font-extrabold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
