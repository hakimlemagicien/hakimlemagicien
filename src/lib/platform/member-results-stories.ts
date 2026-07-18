import khaledBefore from "@/assets/خالد قبل.jpg";
import khaledAfter from "@/assets/خالد بعد.jpg";
import samirBefore from "@/assets/سمير قبل.jpg";
import samirAfter from "@/assets/سمير بعد.jpg";
import pedroBefore from "@/assets/بيدرو قبل.jpg";
import pedroAfter from "@/assets/بيدرو بعد.jpg";
import anwarBefore from "@/assets/انوار قبل.jpg";
import anwarAfter from "@/assets/انوار بعد.jpg";
import fatimaBefore from "@/assets/فاطمة قبل.jpg";
import fatimaAfter from "@/assets/فاطمة بعد.jpg";
import yasminBefore from "@/assets/ياسمين قبل.jpg";
import yasminAfter from "@/assets/ياسمين بعد.jpg";

export type MemberResultStory = {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  before: string;
  after: string;
  weightLost: string;
  weightLabel: string;
  days: string;
  daysLabel: string;
  rating: number;
  reviewCount: number;
  quote: string;
};

/** Placeholder stories — swap images/quotes with real client assets when ready. */
export const MEMBER_RESULT_STORIES: MemberResultStory[] = [
  {
    id: "ahmed",
    name: "أحمد",
    country: "الإمارات",
    countryFlag: "🇦🇪",
    before: pedroBefore,
    after: pedroAfter,
    weightLost: "18- كغ",
    weightLabel: "الوزن المفقود",
    days: "120",
    daysLabel: "يوم",
    rating: 4.9,
    reviewCount: 320,
    quote: "برنامج متكامل غير حياتي! فقدت 18 كغ واستعدت ثقتي بنفسي من جديد",
  },
  {
    id: "khaled",
    name: "خالد",
    country: "السعودية",
    countryFlag: "🇸🇦",
    before: khaledBefore,
    after: khaledAfter,
    weightLost: "16- كغ",
    weightLabel: "الوزن المفقود",
    days: "84",
    daysLabel: "يوم",
    rating: 4.9,
    reviewCount: 280,
    quote: "كنت أجرب أنظمة كثيرة بدون نتيجة، مع خطة حكيم المخصصة قدرت أخسر 16 كغ وأبني جسم قوي.",
  },
  {
    id: "samir",
    name: "سمير",
    country: "قطر",
    countryFlag: "🇶🇦",
    before: samirBefore,
    after: samirAfter,
    weightLost: "12- كغ",
    weightLabel: "الوزن المفقود",
    days: "70",
    daysLabel: "يوم",
    rating: 4.8,
    reviewCount: 195,
    quote: "البرنامج كان واضحاً وسهل الالتزام. تحسّن أدائي وزادت كتلتي العضلية خلال أسابيع قليلة.",
  },
  {
    id: "anwar",
    name: "أنوار",
    country: "الكويت",
    countryFlag: "🇰🇼",
    before: anwarBefore,
    after: anwarAfter,
    weightLost: "11- كغ",
    weightLabel: "الوزن المفقود",
    days: "56",
    daysLabel: "يوم",
    rating: 4.9,
    reviewCount: 164,
    quote: "المتابعة الأسبوعية ساعدتني أضبط الخطة. النتائج جاءت تدريجياً وبثبات دون إرهاق.",
  },
  {
    id: "fatima",
    name: "فاطمة",
    country: "البحرين",
    countryFlag: "🇧🇭",
    before: fatimaBefore,
    after: fatimaAfter,
    weightLost: "9- كغ",
    weightLabel: "الوزن المفقود",
    days: "90",
    daysLabel: "يوم",
    rating: 5,
    reviewCount: 142,
    quote: "خطة التغذية كانت واقعية ومستدامة. شعرت بتغيير حقيقي في طاقتي وشكل جسمي.",
  },
  {
    id: "yasmin",
    name: "ياسمين",
    country: "عُمان",
    countryFlag: "🇴🇲",
    before: yasminBefore,
    after: yasminAfter,
    weightLost: "10- كغ",
    weightLabel: "الوزن المفقود",
    days: "75",
    daysLabel: "يوم",
    rating: 4.9,
    reviewCount: 118,
    quote: "أخيراً برنامج يناسب حياتي. خسرت وزناً حقيقياً مع الحفاظ على نشاطي اليومي.",
  },
];
