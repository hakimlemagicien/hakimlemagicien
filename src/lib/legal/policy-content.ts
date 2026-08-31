import type { LegalLocale, PolicyKind } from "./policy-catalog";
import {
  CURRENT_SUPPORT_EMAIL,
  CURRENT_WHATSAPP,
  GOVERNING_LAW_STATUS,
  LEGAL_ENTITY_STATUS,
  POLICY_VERSION,
  REGISTERED_ADDRESS_STATUS,
} from "./policy-catalog";

export type LegalSection = { title: string; body: string[] };

export type LegalDocument = {
  title: string;
  description: string;
  sections: LegalSection[];
};

function docs(locale: LegalLocale): Record<PolicyKind, LegalDocument> {
  if (locale === "en") return EN;
  return AR;
}

export function getLegalDocument(kind: PolicyKind, locale: LegalLocale): LegalDocument {
  return docs(locale)[kind];
}

const AR: Record<PolicyKind, LegalDocument> = {
  terms: {
    title: "شروط وأحكام MAAKFIT",
    description:
      "توضّح هذه الشروط كيف تعمل منصة MAAKFIT، وما يقدّمه كل اشتراك، ومسؤولياتك كعميل. ليست خدمة طبية.",
    sections: [
      {
        title: "1. من نحن وما نقدّمه",
        body: [
          "MAAKFIT منصة رقمية للياقة والتغذية والصحة العامة، مع متابعة بشرية من Coach Hakim (الكوتش حكيم) حسب الباقة.",
          "MAAKFIT ليست مقدّم رعاية طبية، ولا تشخّص ولا تعالج الأمراض.",
          `الكيان القانوني المسجّل: ${LEGAL_ENTITY_STATUS}. العنوان المسجّل: ${REGISTERED_ADDRESS_STATUS}.`,
        ],
      },
      {
        title: "2. الأهلية والحساب",
        body: [
          "الاستخدام في الإصدار الحالي مخصص لمن أتمّ 18 عاماً.",
          "الحساب شخصي وغير قابل للمشاركة أو إعادة البيع أو النقل لشخص آخر.",
          "أنت مسؤول عن دقة بياناتك وتحديثها، بما في ذلك الإصابات والحساسية والقيود الغذائية.",
        ],
      },
      {
        title: "3. السلامة والتدريب والتغذية",
        body: [
          "نفّذ التمارين بأمان وضمن قدراتك، وفي مكان ومعدات مناسبة تتحمل مسؤوليتها.",
          "إذا ظهرت إصابة جديدة أو حالة صحية، أبلغ المنصة فوراً. لا ينبغي الاستمرار في تمارين متأثرة وكأن شيئاً لم يتغير.",
          "معلومات التغذية عامة وليست علاجاً لحساسية أو حالة طبية. راجع مختصاً عند الحاجة.",
          "تقديرات النظام (مثل السعرات أو النسب) ليست قياسات طبية مؤكدة.",
        ],
      },
      {
        title: "4. الباقات والاشتراك",
        body: [
          "الباقات المدفوعة: Essential وPremium وVIP لمدد 3 أشهر أو 6 أشهر فقط. لا يوجد اشتراك شهري أو سنوي في V1.",
          "Essential: البرنامج والمزايا الأساسية. لا يشمل دردشة الكوتش البشرية الخاصة بـPremium/VIP.",
          "Premium: يشمل دردشة الكوتش ومراجعة تقدم دورية كل أسبوعين، مع تحسينات مناسبة حسب التقدم والمعلومات المتاحة.",
          "VIP: يشمل دردشة الكوتش ودعماً يومياً بأولوية أعلى ومتابعة أقرب وتعديلات أسرع عند الملاءمة. الدعم اليومي ليس 24/7، والأولوية ليست رداً فورياً مضموناً.",
          "البرنامج رقمي ويمكن أن يتطور حسب تقدمك وأهدافك والإصابات المبلّغ عنها ومنطق البرنامج ومراجعة الكوتش.",
        ],
      },
      {
        title: "5. التجديد والإلغاء",
        body: [
          "الاشتراكات المدفوعة قابلة للتجديد التلقائي وفق ما يظهر وتوافق عليه عند الدفع.",
          "يمكنك إلغاء التجديد. إلغاء التجديد لا يلغي الفترة المدفوعة الحالية ويستمر الوصول حتى نهاية الفترة المدفوعة.",
          "إلغاء التجديد ≠ حذف الحساب ≠ طلب استرداد.",
        ],
      },
      {
        title: "6. الأسعار والعروض",
        body: [
          "السعر المعروض عند الدفع هو المبلغ الرسمي للفترة المختارة بالدولار الأمريكي ما لم يُذكر غير ذلك. قد تُضاف ضرائب حسب الموقع ومزود الدفع والقانون المعمول به.",
          "رسوم تحويل العملة التي يفرضها بنكك ليست تحت سيطرة MAAKFIT.",
          "يمكن تعديل الأسعار مستقبلاً دون أثر رجعي على فترة مدفوعة. إذا تغيّر سعر التجديد فسيظهر قبل التحصيل.",
          "أي عرض يجب أن يوضح السعر الحالي ومدة الفوترة وسعر التجديد وشروط العرض.",
        ],
      },
      {
        title: "7. دردشة الكوتش والذكاء الاصطناعي",
        body: [
          "دردشة الكوتش ميزة لـPremium وVIP. المرفقات خاصة وللمخوّلين فقط.",
          "MAAKFIT أو Coach Hakim قد يرفض تعديلاً غير آمن أو غير مناسب.",
          "قد يساعد الذكاء الاصطناعي في التخصيص والاقتراح والتحليل. لا ينتحل شخصية Coach Hakim. أي رد يُقدَّم لك على أنه من الكوتش بشرياً يخضع لآلية الاعتماد البشري المطلوبة.",
        ],
      },
      {
        title: "8. المحتوى والملكية",
        body: [
          "محتوى MAAKFIT (البرامج، الفيديوهات، النصوص، التصميم) محمي. يُمنع النسخ أو إعادة البيع دون إذن.",
          "تحتفظ بملكية صورك ورسائلك ومحتواك الشخصي. قد نستخدم ملاحظاتك لتحسين المنتج دون نقل ملكية بياناتك.",
        ],
      },
      {
        title: "9. الاستخدام المحظور وتوفر الخدمة",
        body: [
          "يُحظر إساءة الاستخدام أو الاحتيال أو مشاركة الحساب أو محاولة اختراق الخدمة.",
          "قد نعلّق الحساب عند مخالفة جوهرية، مع تسجيل السبب والوقت والصلاحية المناسبة.",
          "قد تحدث تحديثات أو انقطاعات تقنية قصيرة. انقطاع قصير لا ينشئ استرداداً تلقائياً. انقطاع جوهري ممتد يخضع لمراجعة عادلة.",
          "نستخدم مزودي بنية تحتية ودفع وبريد وفق الحاجة لتشغيل الخدمة.",
        ],
      },
      {
        title: "10. المسؤولية والنتائج",
        body: [
          "النتائج تختلف بين الأشخاص. لا نضمن خسارة وزن أو زيادة عضل أو تحولاً أو إطاراً زمنياً محدداً لكل عميل.",
          "لا نقدّم ادعاءات طبية مثل علاج السمنة أو شفاء إصابة أو تشخيص مرض.",
          "لا تستبعد هذه الشروط الحقوق التي لا يسمح القانون باستبعادها.",
          "إذا تعارض بند مع القانون يُطبَّق باقي الاتفاق. عدم إنفاذ حق مرة لا يعني التنازل عنه.",
        ],
      },
      {
        title: "11. التحديثات والقانون والتواصل",
        body: [
          `القانون الحاكم والاختصاص: ${GOVERNING_LAW_STATUS} حتى تحديد الكيان القانوني والأسواق.`,
          "يمكن تحديث الشروط مع إشعار مناسب للتغييرات الجوهرية.",
          "النسخة العربية والإنجليزية تحملان نفس رقم الإصدار. اللغة المرجعية القانونية: TBD.",
          "الاتصالات الضرورية للحساب والفوترة والأمان ليست تسويقاً.",
          `القناة الرسمية: ${CURRENT_SUPPORT_EMAIL} أو صفحة التواصل. واتساب: ${CURRENT_WHATSAPP}. دعم MAAKFIT/الكوتش ليس قناة طوارئ طبية.`,
          `الإصدار ${POLICY_VERSION}. تاريخ السريان يُحدَّد عند الإطلاق العام.`,
        ],
      },
    ],
  },
  privacy: {
    title: "سياسة خصوصية MAAKFIT",
    description:
      "كيف تجمع MAAKFIT بياناتك وتستخدمها وتحميها. لا نبيع بياناتك الشخصية.",
    sections: [
      {
        title: "1. من نحن",
        body: [
          `MAAKFIT منصة لياقة وتغذية رقمية. الكيان القانوني: ${LEGAL_ENTITY_STATUS}. العنوان: ${REGISTERED_ADDRESS_STATUS}.`,
          `للتواصل بشأن الخصوصية: ${CURRENT_SUPPORT_EMAIL} عبر فئة Privacy في صفحة التواصل.`,
        ],
      },
      {
        title: "2. البيانات التي نجمعها — بالحد الأدنى",
        body: [
          "نجمع فقط ما يلزم لتقديم الخدمة: الحساب (اسم، بريد، هاتف اختياري)، إجابات التقييم (هدف، قياسات، نشاط، تفضيلات)، بيانات تقدم تختار إدخالها، وصور تقدم إن رفعتها.",
          "قد نجمع بيانات إصابة أو حساسية عندما تقدّمها بنفسك لسلامة البرنامج — وليست للتشخيص الطبي.",
          "بيانات تقنية لازمة للتشغيل: نوع الجهاز/المتصفح، سجلات أمنية محدودة، وتخزين محلي للجلسة والتفضيلات.",
          "لا نجمع موقعك الدقيق إلا إذا لزم مستقبلاً بوضوح وموافقة. إذن الميكروفون/الكاميرا يُطلب فقط لميزة تستخدمه (مثل رسالة صوتية أو صورة).",
        ],
      },
      {
        title: "3. أغراض الاستخدام",
        body: [
          "تقديم الحساب والبرنامج والتغذية وتتبع التقدم ودعم الحساب/الفوترة ودردشة الكوتش حسب الباقة.",
          "تشغيل الفوترة والتجديد والإشعارات الضرورية والأمان ومنع الاحتيال.",
          "تحسين المنتج اعتماداً على بيانات مجمّعة أو ملاحظات، دون بيع بياناتك.",
        ],
      },
      {
        title: "4. الدفع",
        body: [
          "MAAKFIT لا تخزّن رقم البطاقة الكامل أو CVV في قاعدة بيانات التطبيق. يعالجها مزود دفع معتمد عند اعتماده.",
          "يمكننا تخزين معرف المعاملة والمبلغ والعملة والحالة والخطة والتواريخ اللازمة لإدارة الاشتراك.",
        ],
      },
      {
        title: "5. صور التقدم ودردشة الكوتش",
        body: [
          "صور التقدم خاصة افتراضياً. رفع الصورة لا يعني موافقة تسويقية.",
          "لا نستخدم صورك تلقائياً في إعلانات أو وسائل تواصل أو حملات قبل/بعد أو شهادات عامة.",
          "موافقة قبل/بعد للتسويق — إن وُجدت — اختيارية وصريحة ومنفصلة وغير محددة مسبقاً، ولا يؤثر رفضها على الحساب أو البرنامج أو الاشتراك أو الكوتش.",
          "دردشة الكوتش ومرفقاتها خاصة، بتخزين خاص، دون روابط عامة، ولوصول المخوّلين فقط (أنت والفريق المخوّل بالمتابعة).",
        ],
      },
      {
        title: "6. الذكاء الاصطناعي والتحليلات",
        body: [
          "قد يحلّل الذكاء الاصطناعي ويقترح ويساعد داخل المنصة. لا ينتحل شخصية Coach Hakim.",
          "لا نستخدم بياناتك الحساسة أو صور التقدم أو دردشة الكوتش لتدريب نموذج ذكاء اصطناعي عام لطرف خارجي دون أساس قانوني وموافقة مناسبة عند الحاجة.",
          "التحليلات التشغيلية مسموحة لتحسين الخدمة. لا نتوسع في تتبّع إعلاني دون أساس واضح.",
        ],
      },
      {
        title: "7. التسويق مقابل اتصالات الخدمة",
        body: [
          "الموافقة التسويقية اختيارية ومنفصلة عن قبول الشروط والشراء واتصالات الخدمة.",
          "رفض التسويق لا يمنع شراء باقة. يمكنك إلغاء الاشتراك التسويقي في أي وقت.",
          "اتصالات الأمان والفوترة وتذكير التجديد والتغييرات القانونية المهمة وإشعارات الحساب ليست تسويقاً.",
        ],
      },
      {
        title: "8. المشاركة والأمان",
        body: [
          "لا نبيع بياناتك الشخصية.",
          "قد نشارك ما يلزم مع مزودي الاستضافة والبريد والتخزين والدفع المستقبلي بموجب millات مناسبة، ومع فريق الكوتش المخوّل لتقديم المتابعة.",
          "نطبّق ضمانات تقنية وتنظيمية معقولة (تشفير النقل، صلاحيات أقل، تخزين خاص). لا ندّعي أمناً مطلقاً 100%.",
          "كلمات المرور تُعالج عبر نظام المصادقة ولا تُحفظ كنص واضح لدينا.",
        ],
      },
      {
        title: "9. حقوقك والاحتفاظ والحذف",
        body: [
          "يمكنك طلب الوصول أو التصحيح أو الحذف أو تقييد المعالجة أو الاعتراض أو سحب موافقة اختيارية، حسب القانون المعمول به. قد نتحقق من هويتك للطلبات الحساسة.",
          "حذف الحساب ≠ إلغاء التجديد ≠ طلب استرداد. بعد التأكيد نطبّق الحذف أو إخفاء الهوية وفق فئات الاحتفاظ.",
          "لا نحتفظ بكل شيء إلى الأبد، ولا نحذف كل شيء فور انتهاء الاشتراك. المدد القانونية لبعض الفئات: TBD_LEGAL_RETENTION حتى تحديد الكيان والاختصاص.",
          "النسخ الاحتياطية تُدار وفق دورة حياة محدودة ثم تُزال.",
        ],
      },
      {
        title: "10. الأطفال والنقل والقانون",
        body: [
          "الخدمة لـ18+ في V1. إذا علمنا بحساب لقاصر سنغلقه وفق سياسة معقولة.",
          "قد تُعالَج بيانات عبر مزودين دوليين. لا ندّعي إقامة بيانات في بلد محدد ما لم نُعلن ذلك بوضوح.",
          "قد نكشف بيانات إذا طُلب قانونياً أو لمنع احتيال/ضرر جسيم، وبالحد اللازم.",
          `القانون الحاكم: ${GOVERNING_LAW_STATUS}. الإصدار ${POLICY_VERSION}. العربية والإنجليزية نفس الإصدار.`,
        ],
      },
    ],
  },
  refund: {
    title: "سياسة الاسترداد والإلغاء",
    description:
      "كيف يعمل إلغاء التجديد، ومتى يُراجع طلب الاسترداد. ليست ضمانة استرجاع غير مشروطة.",
    sections: [
      {
        title: "1. المبدأ",
        body: [
          "MAAKFIT لا تقدّم ضمان استرجاع تسويقي عام لـ7 أو 14 أو 30 يوماً.",
          "التجربة المجانية وسيلة للتعرّف على المنصة قبل شراء باقة مدفوعة.",
          "نجاح الدفع لا يعني تلقائياً «لا استرداد على الإطلاق». نميّز بين الدفع، التفعيل، فتح المزايا، بدء إنشاء البرنامج، وإتاحة البرنامج.",
        ],
      },
      {
        title: "2. إلغاء التجديد",
        body: [
          "يمكنك إلغاء التجديد التلقائي من إعدادات الاشتراك والفوترة عندما تكون الميزة متاحة.",
          "لن تُخصم دورة جديدة. يستمر الوصول حتى نهاية الفترة المدفوعة. يصلك تأكيد ويظهر تاريخ انتهاء الوصول.",
          "إلغاء التجديد ≠ حذف الحساب ≠ طلب استرداد.",
        ],
      },
      {
        title: "3. الأهلية للاسترداد",
        body: [
          "تغيير الرأي بعد بدء تقديم الخدمة لا ينشئ تلقائياً حق استرداد، خصوصاً بعد تفعيل المزايا المدفوعة أو بدء/إتاحة البرنامج الشخصي أو استخدام المزايا المدفوعة.",
          "نراعي الحقوق القانونية الإلزامية، والرسوم المكررة أو الخاطئة، وأخطاء الدفع، وفشل MAAKFIT في تقديم خدمة مدفوعة جوهرية، وحالات يكون الاسترداد فيها مطلوباً قانونياً أو عادلاً.",
        ],
      },
      {
        title: "4. مهلة الطلب والمراجعة",
        body: [
          "للحالات المؤهلة وفق هذه السياسة: مهلة تقديم الطلب 14 يوماً. هذا ليس ضمان استرجاع غير مشروط لـ14 يوماً.",
          "طلب مكتمل يُراجع عادة خلال 5–7 أيام عمل.",
          "إذا وُوفق، يُعاد المبلغ إلى وسيلة الدفع الأصلية عندما يكون ذلك ممكناً ووفق مزود الدفع. ظهور المبلغ لدى البنك قد يختلف ولا نضمن زمن البنك.",
        ],
      },
      {
        title: "5. التجميد والتعطل والإغلاق",
        body: [
          "في ظروف استثنائية موثّقة تمنعك من الاستخدام لفترة ممتدة، يمكن مراجعة تجميد أو تمديد بدل الاسترداد النقدي — تقييماً لكل حالة وليس حقاً تلقائياً.",
          "انقطاع تقني قصير لا ينشئ استرداداً تلقائياً. انقطاع جوهري ممتد قد يشمل إصلاحاً أو تمديداً أو رصيداً أو استرداداً متناسباً عند الاقتضاء.",
          "إذا أُغلقت خدمة مدفوعة نهائياً وكان لديك جزء مدفوع لم يعد بالإمكان تقديمه، نتعامل مع الجزء غير المقدَّم بعدل وقد يشمل استرداداً متناسباً.",
        ],
      },
      {
        title: "6. كيف تطلب",
        body: [
          `أرسل طلباً من صفحة التواصل (فئة Refund) أو ${CURRENT_SUPPORT_EMAIL} مع اسمك والبريد وتاريخ الدفع والباقة وسبب موجز.`,
          "لا تُرسل كلمة مرور أو رقم بطاقة كامل أو CVV.",
          `الإصدار ${POLICY_VERSION}. الكيان القانوني والقانون الحاكم: TBD حتى الاعتماد النهائي.`,
        ],
      },
    ],
  },
};

const EN: Record<PolicyKind, LegalDocument> = {
  terms: {
    title: "MAAKFIT Terms & Conditions",
    description:
      "How MAAKFIT works, what each plan includes, and your responsibilities. This is not a medical service.",
    sections: [
      {
        title: "1. Who we are",
        body: [
          "MAAKFIT is a digital fitness, nutrition, and general-wellness platform, with human follow-up from Coach Hakim depending on your plan.",
          "MAAKFIT is not a medical provider and does not diagnose or treat disease.",
          `Legal entity: ${LEGAL_ENTITY_STATUS}. Registered address: ${REGISTERED_ADDRESS_STATUS}.`,
        ],
      },
      {
        title: "2. Eligibility and account",
        body: [
          "V1 is for users aged 18+ only.",
          "Accounts are personal and may not be shared, resold, or transferred.",
          "You are responsible for accurate information and for updating injuries, allergies, and dietary restrictions.",
        ],
      },
      {
        title: "3. Safety, training, nutrition",
        body: [
          "Train safely, within your ability, with equipment and locations you are responsible for.",
          "If a new injury or health issue appears, report it. Affected exercises should not continue as if nothing changed.",
          "Nutrition guidance is general wellness, not medical treatment for allergies or conditions.",
          "System estimates are not confirmed medical measurements.",
        ],
      },
      {
        title: "4. Plans and subscription",
        body: [
          "Paid plans: Essential, Premium, and VIP for 3-month or 6-month periods only. No monthly or annual core plan in V1.",
          "Essential includes the core program. It does not include Premium/VIP human Coaching Chat.",
          "Premium includes Coaching Chat and a progress review about every two weeks, with suitable program improvements based on available information.",
          "VIP includes Coaching Chat, higher-priority daily support, closer follow-up, and faster adjustments when appropriate. Daily support is not 24/7. Priority is not a guaranteed instant reply.",
          "Your program can evolve with progress, goals, reported injuries, program logic, and coaching review.",
        ],
      },
      {
        title: "5. Renewal and cancellation",
        body: [
          "Paid subscriptions may auto-renew according to what you see and accept at checkout.",
          "You may cancel renewal. Access continues until the paid period ends. Cancel renewal ≠ delete account ≠ refund request.",
        ],
      },
      {
        title: "6. Pricing and offers",
        body: [
          "The amount shown at checkout is the official price for the selected period, in USD unless stated otherwise. Taxes may apply by location, payment provider, and law.",
          "Bank FX fees are outside MAAKFIT’s control.",
          "Future price changes are not retroactive. A new renewal price will be shown before it is charged.",
          "Promotions must show current price, billing period, renewal price, and conditions.",
        ],
      },
      {
        title: "7. Coaching Chat and AI",
        body: [
          "Coaching Chat is a Premium/VIP feature. Attachments are private.",
          "MAAKFIT or Coach Hakim may refuse an unsafe or unsuitable adjustment.",
          "AI may analyze, suggest, and assist. It must not impersonate Coach Hakim. Anything presented as a human Coach Hakim reply requires the required human-approval path.",
        ],
      },
      {
        title: "8. Content and ownership",
        body: [
          "MAAKFIT content is protected and may not be copied or resold without permission.",
          "You keep ownership of your photos, messages, and personal content. Feedback may improve the product without transferring ownership of your data.",
        ],
      },
      {
        title: "9. Prohibited use and availability",
        body: [
          "Abuse, fraud, account sharing, and attempts to compromise the service are prohibited.",
          "We may suspend an account for material violations, with reason, time, and appropriate permissions recorded.",
          "Short outages do not automatically create a refund. Material extended outages are reviewed fairly.",
        ],
      },
      {
        title: "10. Liability and results",
        body: [
          "Results vary. We do not guarantee specific weight loss, muscle gain, transformation, or timeframe.",
          "We do not claim to treat obesity, cure injury, or diagnose disease.",
          "Nothing here excludes rights that cannot legally be excluded. If one clause is unenforceable, the rest remains. No waiver from a single non-enforcement.",
        ],
      },
      {
        title: "11. Updates, law, contact",
        body: [
          `Governing law / jurisdiction: ${GOVERNING_LAW_STATUS} until the legal entity and markets are set.`,
          "We may update these terms with appropriate notice for material changes.",
          "Arabic and English share the same policy version. Legal reference language: TBD.",
          `Official contact: ${CURRENT_SUPPORT_EMAIL} or the Contact page. WhatsApp: ${CURRENT_WHATSAPP}. Support/coaching is not an emergency medical channel.`,
          `Version ${POLICY_VERSION}. Effective date to be set at public release.`,
        ],
      },
    ],
  },
  privacy: {
    title: "MAAKFIT Privacy Policy",
    description: "How MAAKFIT collects, uses, and protects your data. We do not sell personal data.",
    sections: [
      {
        title: "1. Who we are",
        body: [
          `MAAKFIT is a digital fitness and nutrition platform. Legal entity: ${LEGAL_ENTITY_STATUS}. Address: ${REGISTERED_ADDRESS_STATUS}.`,
          `Privacy contact: ${CURRENT_SUPPORT_EMAIL} using the Privacy category on the Contact page.`,
        ],
      },
      {
        title: "2. Data we collect — minimization",
        body: [
          "We collect only what is needed: account details, quiz answers you provide, progress data you enter, and progress photos if you upload them.",
          "Injury or allergy data is collected only if you provide it for program safety — not for medical diagnosis.",
          "Technical data needed to run the service may include device/browser information, limited security logs, and local storage for session/preferences.",
          "Microphone/camera permission is requested only for a feature that uses it.",
        ],
      },
      {
        title: "3. Purposes",
        body: [
          "To provide the account, program, nutrition, progress tracking, billing/account support, and Coaching Chat when included.",
          "To operate billing, renewal reminders, security, and fraud prevention.",
          "To improve the product. We do not sell personal data.",
        ],
      },
      {
        title: "4. Payments",
        body: [
          "MAAKFIT does not store full card numbers or CVV in the app database. A future approved payment provider will process those details.",
          "We may store transaction identifiers, amount, currency, status, plan, and dates needed to manage the subscription.",
        ],
      },
      {
        title: "5. Progress photos and coaching",
        body: [
          "Progress photos are private by default. Upload is not marketing consent.",
          "We do not automatically use photos in ads, social media, before/after campaigns, or public testimonials.",
          "Any before/after marketing consent is separate, explicit, optional, and not pre-checked. Refusal does not affect account, program, subscription, or coaching.",
          "Coaching Chat and attachments are private, privately stored, without public URLs, and limited to you and authorized follow-up staff.",
        ],
      },
      {
        title: "6. AI and analytics",
        body: [
          "AI may analyze, suggest, and assist. It must not impersonate Coach Hakim.",
          "We do not use sensitive personal data, progress photos, or coaching chat to train a general third-party AI model without a legal basis and appropriate consent when required.",
          "Operational analytics may improve the service. We do not expand advertising tracking without a clear basis.",
        ],
      },
      {
        title: "7. Marketing vs service communications",
        body: [
          "Marketing consent is optional and separate from Terms acceptance, purchase, and service communications.",
          "Refusing marketing does not block a paid plan. You may opt out later.",
          "Security, billing, renewal reminders, material legal changes, and account notices are not marketing.",
        ],
      },
      {
        title: "8. Sharing and security",
        body: [
          "We do not sell personal data.",
          "We may share what is needed with hosting, email, storage, and a future payment provider under appropriate agreements, and with authorized coaching staff.",
          "We apply reasonable technical and organizational safeguards. We do not claim 100% security.",
          "Passwords are handled by the auth system and are not stored in plaintext.",
        ],
      },
      {
        title: "9. Rights, retention, deletion",
        body: [
          "You may request access, correction, deletion, restriction, objection, or withdrawal of optional consent, subject to applicable law. Sensitive requests may require identity verification.",
          "Delete account ≠ cancel renewal ≠ refund request.",
          "We do not keep everything forever, and we do not delete everything the moment a subscription ends. Some legal retention periods are TBD_LEGAL_RETENTION until entity/jurisdiction is set.",
        ],
      },
      {
        title: "10. Children, transfers, law",
        body: [
          "V1 is 18+. If we learn of a minor account, we will close it under a reasonable process.",
          "Data may be processed by international providers. We do not make false data-residency claims.",
          `Governing law: ${GOVERNING_LAW_STATUS}. Version ${POLICY_VERSION}. Arabic and English share the same version.`,
        ],
      },
    ],
  },
  refund: {
    title: "Refund & Cancellation Policy",
    description:
      "How renewal cancellation works and when refunds are reviewed. This is not an unconditional money-back guarantee.",
    sections: [
      {
        title: "1. Principle",
        body: [
          "MAAKFIT does not offer a general 7-, 14-, or 30-day money-back marketing guarantee.",
          "The free experience is how you can learn the platform before buying a paid plan.",
          "Payment success does not mean refunds are impossible. We distinguish payment, activation, paid-feature access, personal-program creation, and program delivery.",
        ],
      },
      {
        title: "2. Cancel renewal",
        body: [
          "You may cancel automatic renewal from Subscription & Billing when that control is available.",
          "No new cycle is charged. Access continues until the paid period ends. You receive confirmation and the access end date.",
          "Cancel renewal ≠ delete account ≠ refund request.",
        ],
      },
      {
        title: "3. Refund eligibility",
        body: [
          "A change of mind after service delivery has started does not automatically create a refund, especially after paid features are activated, a personal program is started or delivered, or paid features are used.",
          "We still consider mandatory legal rights, duplicate/incorrect charges, payment errors, material failure to provide a paid service, and other cases where a refund is legally required or fair under this policy.",
        ],
      },
      {
        title: "4. Window and review",
        body: [
          "For eligible cases under this policy, the request window is 14 days. That is not a 14-day unconditional money-back guarantee.",
          "Complete requests are usually reviewed within 5–7 business days.",
          "If approved, funds return to the original payment method when possible and as the provider allows. Bank posting times vary and are not guaranteed by MAAKFIT.",
        ],
      },
      {
        title: "5. Freeze, outages, shutdown",
        body: [
          "In documented exceptional circumstances that prevent use for an extended period, a freeze or extension may be reviewed instead of a cash refund — case by case, not automatic.",
          "A short technical interruption does not automatically create a refund. A material extended outage may lead to a fix, extension, credit, or proportional refund when appropriate.",
          "If a paid service is permanently shut down and a prepaid unused portion cannot be delivered, we will treat that unused portion fairly, which may include a proportional refund.",
        ],
      },
      {
        title: "6. How to request",
        body: [
          `Submit a Contact request (Refund category) or email ${CURRENT_SUPPORT_EMAIL} with your name, email, payment date, plan, and a short reason.`,
          "Do not send passwords, full card numbers, or CVV.",
          `Version ${POLICY_VERSION}. Legal entity and governing law remain TBD until finally approved.`,
        ],
      },
    ],
  },
};
