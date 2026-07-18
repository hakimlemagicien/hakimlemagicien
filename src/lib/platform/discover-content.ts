import homeNutritionHero from "@/assets/home-nutrition-hero.webp";
import heroCoachDashboard from "@/assets/hero-coach-dashboard.png";
import muscleBuild from "@/assets/بناء العضلات.webp";
import fatLoss from "@/assets/خسارة الدهون.jpg";
import trainingGym from "@/assets/training-env-gym.png";
import khaledBefore from "@/assets/خالد قبل.jpg";
import khaledAfter from "@/assets/خالد بعد.jpg";
import fatimaBefore from "@/assets/فاطمة قبل.jpg";
import fatimaAfter from "@/assets/فاطمة بعد.jpg";

export type DiscoverContentType =
  | "article"
  | "video"
  | "recipe"
  | "success_story"
  | "challenge"
  | "daily_tip"
  | "platform_update"
  | "promotional";

export type DiscoverContentStatus = "draft" | "scheduled" | "published" | "unpublished" | "archived";
export type DiscoverAccessLevel = "free" | "premium";
export type DiscoverChallengeStatus = "upcoming" | "active" | "completed" | "closed";

export type DiscoverCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  status: "active" | "hidden";
};

export type RecipeNutrition = {
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  servings: number;
  prepMinutes: number;
};

export type DiscoverContentItem = {
  id: string;
  type: DiscoverContentType;
  title: string;
  slug: string;
  shortDescription: string;
  body: string;
  categoryId: string;
  coverImage: string;
  authorName: string;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  featured: boolean;
  accessLevel: DiscoverAccessLevel;
  status: DiscoverContentStatus;
  language: "ar";
  readingTimeMinutes?: number;
  videoDurationSeconds?: number;
  videoSource?: string;
  viewCount?: number;
  recipe?: RecipeNutrition & {
    ingredients: string[];
    steps: string[];
    allergens?: string[];
  };
  challenge?: {
    status: DiscoverChallengeStatus;
    startDate: string;
    endDate: string;
    days: number;
    participantCount: number;
  };
  successStory?: {
    displayName: string;
    country?: string;
    journeyDays: number;
    resultSummary: string;
    consentApproved: boolean;
    beforeImage?: string;
    afterImage?: string;
    disclaimer: string;
  };
  badge?: string;
  sortPriority?: number;
};

export type DiscoverFeed = {
  featured: DiscoverContentItem[];
  dailyTip: DiscoverContentItem | null;
  videos: DiscoverContentItem[];
  articles: DiscoverContentItem[];
  successStories: DiscoverContentItem[];
  challenges: DiscoverContentItem[];
  recipes: DiscoverContentItem[];
  recent: DiscoverContentItem[];
};

export type DiscoverContentFilter =
  | "all"
  | "video"
  | "article"
  | "recipe"
  | "success_story"
  | "challenge"
  | "daily_tip";

export const DISCOVER_CATEGORIES: DiscoverCategory[] = [
  { id: "exercises", name: "تمارين", slug: "exercises", icon: "dumbbell", sortOrder: 1, status: "active" },
  { id: "nutrition", name: "تغذية", slug: "nutrition", icon: "utensils", sortOrder: 2, status: "active" },
  { id: "fat-loss", name: "خسارة الدهون", slug: "fat-loss", icon: "flame", sortOrder: 3, status: "active" },
  { id: "muscle", name: "بناء العضلات", slug: "muscle", icon: "biceps", sortOrder: 4, status: "active" },
  { id: "mindset", name: "العقلية", slug: "mindset", icon: "brain", sortOrder: 5, status: "active" },
  { id: "sleep", name: "النوم", slug: "sleep", icon: "moon", sortOrder: 6, status: "active" },
  { id: "hydration", name: "الترطيب", slug: "hydration", icon: "droplet", sortOrder: 7, status: "active" },
  { id: "health", name: "الصحة", slug: "health", icon: "heart", sortOrder: 8, status: "active" },
  { id: "cardio", name: "الكارديو", slug: "cardio", icon: "activity", sortOrder: 9, status: "active" },
  { id: "recipes", name: "وصفات", slug: "recipes", icon: "salad", sortOrder: 10, status: "active" },
];

const now = new Date();
const daysAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const daysFromNow = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

/** CMS-ready seed — replace with Supabase `discover_content` when populated. */
export const DISCOVER_CONTENT_SEED: DiscoverContentItem[] = [
  {
    id: "feat-muscle-mistakes",
    type: "video",
    title: "5 أخطاء تمنعك من بناء العضلات",
    slug: "5-muscle-building-mistakes",
    shortDescription: "تجنّب هذه الأخطاء الشائعة لتسريع نتائجك في التدريب.",
    body: "بناء العضلات يحتاج اتساقاً في التدريب والتغذية والنوم. في هذا الفيديو نراجع أهم 5 أخطاء: قلة البروتين، تخطي أيام الراحة، تكرار نفس الوزن، إهمال الشكل التقني، وعدم تتبع التقدم.\n\n## الخطأ الأول\nقلة البروتين اليومي.\n\n## الخطأ الثاني\nعدم الراحة الكافية بين الجلسات.",
    categoryId: "muscle",
    coverImage: muscleBuild,
    authorName: "فريق حكيم",
    publishDate: daysAgo(1),
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
    tags: ["عضلات", "تدريب", "أخطاء"],
    featured: true,
    accessLevel: "free",
    status: "published",
    language: "ar",
    videoDurationSeconds: 225,
    viewCount: 1240,
    badge: "مميز",
    sortPriority: 1,
  },
  {
    id: "feat-balanced-meal",
    type: "article",
    title: "كيف تبني وجبة متوازنة؟",
    slug: "balanced-meal-guide",
    shortDescription: "دليل عملي لتكوين وجبة غنية بالبروتين والألياف.",
    body: "الوجبة المتوازنة تجمع مصدر بروتين، كربوهيدرات معقدة، دهون صحية، وخضار.\n\n## خطوة 1\nاختر مصدر بروتين.\n\n## خطوة 2\nأضف كربوهيدرات بطيئة الهضم.\n\n## خطوة 3\nلا تنسَ الخضار.",
    categoryId: "nutrition",
    coverImage: homeNutritionHero,
    authorName: "أ. سارة",
    publishDate: daysAgo(2),
    createdAt: daysAgo(12),
    updatedAt: daysAgo(2),
    tags: ["تغذية", "وجبات"],
    featured: true,
    accessLevel: "free",
    status: "published",
    language: "ar",
    readingTimeMinutes: 4,
    viewCount: 890,
    sortPriority: 2,
  },
  {
    id: "feat-water-challenge",
    type: "challenge",
    title: "تحدي شرب الماء — 7 أيام",
    slug: "water-challenge-7-days",
    shortDescription: "التزم بشرب كمية الماء اليومية لمدة أسبوع.",
    body: "تحدي عام اختياري — لا يغيّر برنامجك الشخصي. الهدف: بناء عادة الترطيب اليومي.",
    categoryId: "hydration",
    coverImage: heroCoachDashboard,
    authorName: "فريق حكيم",
    publishDate: daysAgo(3),
    createdAt: daysAgo(8),
    updatedAt: daysAgo(1),
    tags: ["ماء", "تحدي"],
    featured: true,
    accessLevel: "free",
    status: "published",
    language: "ar",
    challenge: {
      status: "active",
      startDate: daysAgo(2),
      endDate: daysFromNow(5),
      days: 7,
      participantCount: 428,
    },
    sortPriority: 3,
  },
  {
    id: "tip-today",
    type: "daily_tip",
    title: "نصيحة اليوم",
    slug: "daily-tip-water-morning",
    shortDescription: "ابدأ يومك بكوب ماء قبل الإفطار لتحسين الترطيب والطاقة.",
    body: "ابدأ يومك بكوب ماء قبل الإفطار — عادة بسيطة تساعد على الترطيب والانتظام.",
    categoryId: "hydration",
    coverImage: heroCoachDashboard,
    authorName: "فريق حكيم",
    publishDate: daysAgo(0),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(0),
    tags: ["نصيحة", "ماء"],
    featured: false,
    accessLevel: "free",
    status: "published",
    language: "ar",
  },
  {
    id: "video-chest-form",
    type: "video",
    title: "تمرين الصدر الصحيح",
    slug: "correct-chest-exercise",
    shortDescription: "تعلّم الشكل الصحيح لضغط الصدر وتجنّب إصابات الكتف.",
    body: "شرح عام لتمرين ضغط الصدر — للتعلم فقط وليس بديلاً عن برنامجك.",
    categoryId: "exercises",
    coverImage: trainingGym,
    authorName: "كوتش حكيم",
    publishDate: daysAgo(4),
    createdAt: daysAgo(15),
    updatedAt: daysAgo(4),
    tags: ["صدر", "تمارين"],
    featured: false,
    accessLevel: "free",
    status: "published",
    language: "ar",
    videoDurationSeconds: 205,
    viewCount: 2100,
  },
  {
    id: "video-sleep-recovery",
    type: "video",
    title: "النوم والاستشفاء",
    slug: "sleep-recovery-basics",
    shortDescription: "لماذا النوم جزء أساسي من التقدم الرياضي؟",
    body: "فيديو تعليمي عام عن أهمية النوم للاستشفاء.",
    categoryId: "sleep",
    coverImage: heroCoachDashboard,
    authorName: "د. ليلى",
    publishDate: daysAgo(6),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(6),
    tags: ["نوم", "استشفاء"],
    featured: false,
    accessLevel: "premium",
    status: "published",
    language: "ar",
    videoDurationSeconds: 312,
    viewCount: 540,
  },
  {
    id: "article-protein-basics",
    type: "article",
    title: "أساسيات البروتين للمبتدئين",
    slug: "protein-basics",
    shortDescription: "كم تحتاج من البروتين؟ ومتى تتناوله؟",
    body: "مقال تعليمي عام — لا يُعد بديلاً عن خطة التغذية الشخصية.\n\n## ما هو البروتين؟\n...\n\n## المصادر الجيدة\n...",
    categoryId: "nutrition",
    coverImage: homeNutritionHero,
    authorName: "أ. سارة",
    publishDate: daysAgo(5),
    createdAt: daysAgo(18),
    updatedAt: daysAgo(5),
    tags: ["بروتين", "تغذية"],
    featured: false,
    accessLevel: "free",
    status: "published",
    language: "ar",
    readingTimeMinutes: 6,
    viewCount: 1560,
  },
  {
    id: "article-mindset-consistency",
    type: "article",
    title: "كيف تحافظ على الاستمرارية؟",
    slug: "mindset-consistency",
    shortDescription: "استراتيجيات عملية للالتزام دون حرق نفسي.",
    body: "الاستمرارية أهم من الكمال.\n\n## ابدأ صغيراً\n...\n\n## تتبّع العادات\n...",
    categoryId: "mindset",
    coverImage: heroCoachDashboard,
    authorName: "فريق حكيم",
    publishDate: daysAgo(7),
    createdAt: daysAgo(25),
    updatedAt: daysAgo(7),
    tags: ["عقلية", "التزام"],
    featured: false,
    accessLevel: "free",
    status: "published",
    language: "ar",
    readingTimeMinutes: 5,
    viewCount: 980,
  },
  {
    id: "story-khaled",
    type: "success_story",
    title: "رحلة خالد — 16 كغ في 84 يوماً",
    slug: "success-khaled",
    shortDescription: "قصة نجاح معتمدة — النتائج تختلف بين الأشخاص.",
    body: "خالد التزم ببرنامج متكامل من تدريب وتغذية. هذه قصته المعتمدة بموافقة صريحة.\n\n> النتائج الفردية تختلف — هذا محتوى تحفيزي وليس ضماناً.",
    categoryId: "fat-loss",
    coverImage: khaledAfter,
    authorName: "خالد",
    publishDate: daysAgo(10),
    createdAt: daysAgo(30),
    updatedAt: daysAgo(10),
    tags: ["قصة نجاح", "تحول"],
    featured: false,
    accessLevel: "free",
    status: "published",
    language: "ar",
    readingTimeMinutes: 3,
    viewCount: 3200,
    successStory: {
      displayName: "خالد",
      country: "السعودية",
      journeyDays: 84,
      resultSummary: "خسر 16 كغ مع تحسّن واضح في اللياقة",
      consentApproved: true,
      beforeImage: khaledBefore,
      afterImage: khaledAfter,
      disclaimer: "النتائج تختلف بين الأشخاص — هذه قصة فردية معتمدة.",
    },
  },
  {
    id: "story-fatima",
    type: "success_story",
    title: "رحلة فاطمة — شد وتناسق",
    slug: "success-fatima",
    shortDescription: "تحول تدريجي مع التزام يومي — بموافقة معتمدة.",
    body: "فاطمة ركزت على الاستمرارية والتغذية المتوازنة.\n\n> النتائج الفردية تختلف.",
    categoryId: "health",
    coverImage: fatimaAfter,
    authorName: "فاطمة",
    publishDate: daysAgo(12),
    createdAt: daysAgo(35),
    updatedAt: daysAgo(12),
    tags: ["قصة نجاح"],
    featured: false,
    accessLevel: "free",
    status: "published",
    language: "ar",
    readingTimeMinutes: 3,
    viewCount: 2100,
    successStory: {
      displayName: "فاطمة",
      country: "الإمارات",
      journeyDays: 90,
      resultSummary: "تحسّن التناسق والطاقة خلال 3 أشهر",
      consentApproved: true,
      beforeImage: fatimaBefore,
      afterImage: fatimaAfter,
      disclaimer: "النتائج تختلف بين الأشخاص.",
    },
  },
  {
    id: "challenge-steps",
    type: "challenge",
    title: "تحدي 10,000 خطوة",
    slug: "steps-10000-challenge",
    shortDescription: "14 يوماً من النشاط اليومي — انضمام اختياري.",
    body: "تحدي عام — لا يعدّل برنامجك الشخصي.",
    categoryId: "cardio",
    coverImage: fatLoss,
    authorName: "فريق حكيم",
    publishDate: daysAgo(1),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    tags: ["خطوات", "كارديو"],
    featured: false,
    accessLevel: "free",
    status: "published",
    language: "ar",
    challenge: {
      status: "active",
      startDate: daysAgo(1),
      endDate: daysFromNow(13),
      days: 14,
      participantCount: 892,
    },
  },
  {
    id: "challenge-sugar",
    type: "challenge",
    title: "تحدي تقليل السكر",
    slug: "reduce-sugar-challenge",
    shortDescription: "أسبوع واحد لبناء وعي أفضل بعادات السكر.",
    body: "تحدي تعليمي عام — استشر مختصاً عند الحاجة.",
    categoryId: "nutrition",
    coverImage: homeNutritionHero,
    authorName: "فريق حكيم",
    publishDate: daysAgo(20),
    createdAt: daysAgo(25),
    updatedAt: daysAgo(20),
    tags: ["سكر", "عادات"],
    featured: false,
    accessLevel: "free",
    status: "published",
    language: "ar",
    challenge: {
      status: "completed",
      startDate: daysAgo(25),
      endDate: daysAgo(18),
      days: 7,
      participantCount: 1205,
    },
  },
  {
    id: "recipe-protein-salad",
    type: "recipe",
    title: "سلطة بروتين سريعة",
    slug: "quick-protein-salad",
    shortDescription: "وجبة خفيفة غنية بالبروتين — للتعلم فقط.",
    body: "وصفة عامة تعليمية — لا تستبدل وجبات برنامجك تلقائياً.",
    categoryId: "recipes",
    coverImage: homeNutritionHero,
    authorName: "أ. سارة",
    publishDate: daysAgo(3),
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
    tags: ["سلطة", "بروتين"],
    featured: false,
    accessLevel: "free",
    status: "published",
    language: "ar",
    readingTimeMinutes: 2,
    viewCount: 760,
    recipe: {
      calories: 420,
      protein: 35,
      carbs: 28,
      fat: 14,
      servings: 1,
      prepMinutes: 15,
      ingredients: ["150غ صدر دجاج", "خس", "طماطم", "زيت زيتون", "ليمون"],
      steps: ["اشوِ الدجاج", "قطّع الخضار", "اخلط وقدّم"],
      allergens: ["لا يوجد"],
    },
  },
  {
    id: "recipe-oats-breakfast",
    type: "recipe",
    title: "شوفان بالفواكه",
    slug: "oats-fruit-breakfast",
    shortDescription: "فطور متوازن — قيم غذائية تقريبية.",
    body: "وصفة عامة للإلهام — القيم تقريبية.",
    categoryId: "recipes",
    coverImage: homeNutritionHero,
    authorName: "فريق حكيم",
    publishDate: daysAgo(8),
    createdAt: daysAgo(14),
    updatedAt: daysAgo(8),
    tags: ["فطور", "شوفان"],
    featured: false,
    accessLevel: "premium",
    status: "published",
    language: "ar",
    viewCount: 430,
    recipe: {
      calories: 380,
      protein: 18,
      carbs: 52,
      fat: 10,
      servings: 1,
      prepMinutes: 10,
      ingredients: ["شوفان", "حليب", "موز", "عسل"],
      steps: ["اطبخ الشوفان", "أضف الفواكه", "قدّم دافئاً"],
    },
  },
  {
    id: "platform-update-v2",
    type: "platform_update",
    title: "تحديث المنصة — تجربة اكتشف",
    slug: "platform-discover-launch",
    shortDescription: "مجلة رقمية جديدة للتعلم والإلهام داخل المنصة.",
    body: "نقدّم لكم تجربة اكتشف — محتوى متجدد من مقالات وفيديوهات ووصفات.",
    categoryId: "health",
    coverImage: heroCoachDashboard,
    authorName: "فريق حكيم",
    publishDate: daysAgo(0),
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
    tags: ["تحديث"],
    featured: false,
    accessLevel: "free",
    status: "published",
    language: "ar",
    readingTimeMinutes: 2,
  },
];

export function isDiscoverPublished(item: DiscoverContentItem, at = new Date()): boolean {
  if (item.status !== "published" && item.status !== "scheduled") return false;
  if (item.status === "scheduled" && new Date(item.publishDate) > at) return false;
  return true;
}

export function getDiscoverCategory(id: string): DiscoverCategory | undefined {
  return DISCOVER_CATEGORIES.find((c) => c.id === id && c.status === "active");
}

export function getDiscoverCategoryBySlug(slug: string): DiscoverCategory | undefined {
  return DISCOVER_CATEGORIES.find((c) => c.slug === slug && c.status === "active");
}

export function formatDiscoverDuration(seconds?: number): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDiscoverRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  return `منذ ${Math.floor(days / 30)} شهر`;
}

export function getDiscoverTypeLabel(type: DiscoverContentType): string {
  const labels: Record<DiscoverContentType, string> = {
    article: "مقال",
    video: "فيديو",
    recipe: "وصفة",
    success_story: "قصة نجاح",
    challenge: "تحدي",
    daily_tip: "نصيحة",
    platform_update: "تحديث",
    promotional: "محتوى ترويجي",
  };
  return labels[type];
}

export function canAccessDiscoverContent(
  item: DiscoverContentItem,
  isPaidMember: boolean,
): boolean {
  if (item.accessLevel === "free") return true;
  return isPaidMember;
}

function publishedItems(): DiscoverContentItem[] {
  return DISCOVER_CONTENT_SEED.filter((item) => isDiscoverPublished(item)).sort(
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );
}

export function getDiscoverContentBySlug(slug: string): DiscoverContentItem | undefined {
  const item = DISCOVER_CONTENT_SEED.find((c) => c.slug === slug);
  if (!item || !isDiscoverPublished(item)) return undefined;
  if (item.type === "success_story" && !item.successStory?.consentApproved) return undefined;
  return item;
}

export function getDiscoverContentById(id: string): DiscoverContentItem | undefined {
  const item = DISCOVER_CONTENT_SEED.find((c) => c.id === id);
  if (!item || !isDiscoverPublished(item)) return undefined;
  return item;
}

export function buildDiscoverFeed(): DiscoverFeed {
  const all = publishedItems();
  const featured = all
    .filter((i) => i.featured)
    .sort((a, b) => (a.sortPriority ?? 99) - (b.sortPriority ?? 99))
    .slice(0, 5);

  const dailyTip =
    all.find((i) => i.type === "daily_tip" && new Date(i.publishDate).toDateString() === new Date().toDateString()) ??
    all.find((i) => i.type === "daily_tip") ??
    null;

  return {
    featured,
    dailyTip,
    videos: all.filter((i) => i.type === "video").slice(0, 8),
    articles: all.filter((i) => i.type === "article").slice(0, 6),
    successStories: all
      .filter((i) => i.type === "success_story" && i.successStory?.consentApproved)
      .slice(0, 6),
    challenges: all.filter((i) => i.type === "challenge").slice(0, 6),
    recipes: all.filter((i) => i.type === "recipe").slice(0, 6),
    recent: all.slice(0, 12),
  };
}

export function searchDiscoverContent(
  query: string,
  options?: {
    categoryId?: string;
    filter?: DiscoverContentFilter;
    accessLevel?: DiscoverAccessLevel | "all";
  },
): DiscoverContentItem[] {
  const q = query.trim().toLowerCase();
  let items = publishedItems();

  if (options?.categoryId) {
    items = items.filter((i) => i.categoryId === options.categoryId);
  }

  if (options?.filter && options.filter !== "all") {
    const typeMap: Record<Exclude<DiscoverContentFilter, "all">, DiscoverContentType> = {
      video: "video",
      article: "article",
      recipe: "recipe",
      success_story: "success_story",
      challenge: "challenge",
      daily_tip: "daily_tip",
    };
    items = items.filter((i) => i.type === typeMap[options.filter!]);
  }

  if (options?.accessLevel && options.accessLevel !== "all") {
    items = items.filter((i) => i.accessLevel === options.accessLevel);
  }

  if (!q) return items;

  return items.filter((item) => {
    const category = getDiscoverCategory(item.categoryId)?.name ?? "";
    const haystack = [
      item.title,
      item.shortDescription,
      item.body,
      item.authorName,
      category,
      getDiscoverTypeLabel(item.type),
      ...item.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getRelatedDiscoverContent(item: DiscoverContentItem, limit = 4): DiscoverContentItem[] {
  return publishedItems()
    .filter(
      (c) =>
        c.id !== item.id &&
        (c.categoryId === item.categoryId || c.type === item.type),
    )
    .slice(0, limit);
}

/** Simulated CMS fetch — swap body with Supabase when tables are populated. */
export async function fetchDiscoverFeed(): Promise<DiscoverFeed> {
  await new Promise((r) => setTimeout(r, 120));
  return buildDiscoverFeed();
}

export async function fetchDiscoverContent(slug: string): Promise<DiscoverContentItem | null> {
  await new Promise((r) => setTimeout(r, 80));
  return getDiscoverContentBySlug(slug) ?? null;
}

export async function searchDiscoverContentAsync(
  query: string,
  options?: Parameters<typeof searchDiscoverContent>[1],
): Promise<DiscoverContentItem[]> {
  await new Promise((r) => setTimeout(r, 200));
  return searchDiscoverContent(query, options);
}
