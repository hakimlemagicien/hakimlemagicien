import type { LegalLocale, PolicyKind } from "./policy-catalog";
import {
  CURRENT_SUPPORT_EMAIL,
  CURRENT_WHATSAPP,
  LEGAL_OPERATOR,
  POLICY_EFFECTIVE_DATE_AR,
  POLICY_EFFECTIVE_DATE_EN,
  POLICY_VERSION,
  PUBLIC_LOCATION,
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
      "توضّح هذه الشروط كيف يعمل تطبيق MAAKFIT الرقمي، وما يقدّمه كل اشتراك، ومسؤولياتك كعميل. ليست خدمة طبية.",
    sections: [
      {
        title: "1. من نحن وما نقدّمه",
        body: [
          "MAAKFIT تطبيق Fitness رقمي بالكامل للتدريب والتغذية وتتبع التقدم والترطيب. تُقدَّم الخدمة والخطط المخصصة داخل التطبيق.",
          "MAAKFIT ليست مقدّم رعاية طبية، ولا تشخّص ولا تعالج الأمراض.",
          `MAAKFIT منتج لياقة رقمية يتم تشغيله بواسطة ${LEGAL_OPERATOR}، بصفته مشغّلاً فردياً وليس شركة مسجلة. الموقع العام: ${PUBLIC_LOCATION}.`,
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
          "تتضمن ممارسة الرياضة مخاطر بدنية. نفّذ التمارين بأمان وضمن قدراتك وبمعدات ومكان مناسبين، وتوقف فوراً عند ألم غير معتاد أو دوار أو ضيق تنفس أو أي أعراض مقلقة.",
          "استشر طبيباً أو مختصاً مؤهلاً قبل البدء إذا كان لديك مرض أو إصابة أو حمل أو وصفة غذائية علاجية أو أي قلق صحي، وأبلغ التطبيق عن أي تغيير ذي صلة.",
          "تعتمد التوصيات الغذائية على المعلومات التي تُدخلها. أنت مسؤول عن إدخال الحساسية وعدم التحمّل والأطعمة غير المرغوبة بدقة، وعن التحقق مستقلاً من المكونات والملصقات وملاءمة الطعام لك.",
          "تحاول MAAKFIT مراعاة القيود التي تقدمها، لكنها لا تضمن خلو كل منتج أو مطبخ من مسببات الحساسية أو التلوث التبادلي، ولا تستبدل استشارة غذائية طبية.",
          "تقديرات النظام (مثل السعرات أو النسب) ليست قياسات طبية مؤكدة.",
        ],
      },
      {
        title: "4. الباقات والاشتراك",
        body: [
          "FREE تمنح وصولاً محدوداً: يظهر البرنامج التدريبي المخصص في حالة مقفلة، وتتاح وجبة فطور حقيقية واحدة بينما تبقى بقية الوجبات مقفلة وفق المنتج الحالي.",
          "الباقات المدفوعة الحالية هي PLUS وPRO لفترات 3 أشهر أو 6 أشهر وفق ما يظهر عند الشراء.",
          "PLUS يفتح برنامج التدريب والتغذية الرقمي والمزايا المدفوعة الموضحة في صفحة الشراء.",
          "PRO يشمل مزايا PLUS إضافةً إلى المزايا الرقمية الإضافية المعروضة صراحةً في صفحة الشراء.",
          "البرنامج رقمي ويمكن أن يتطور وفق تقدمك وأهدافك والإصابات المبلّغ عنها وسجلاتك ومنطق التطبيق.",
        ],
      },
      {
        title: "5. التجديد والإلغاء",
        body: [
          "الاشتراكات المدفوعة قابلة للتجديد التلقائي وفق ما يظهر وتوافق عليه عند الدفع.",
          "يمكنك إلغاء التجديد. إلغاء التجديد لا يلغي الفترة المدفوعة الحالية ويستمر الوصول حتى نهاية الفترة المدفوعة.",
          "إلغاء التجديد ≠ حذف الحساب ≠ طلب استرداد.",
          "قد يؤدي فشل الدفع أو انتهاء وسيلة الدفع إلى تعليق التجديد أو المزايا المدفوعة بعد إشعار مناسب. لن نطلب منك كلمة المرور أو رقم البطاقة الكامل لمعالجة مشكلة فوترة.",
          "إذا اعترضت على عملية دفع، تواصل معنا أولاً لنحقق في الرسوم؛ لا يحد ذلك من حقك في التواصل مع البنك أو ممارسة حقوقك القانونية. قد نعلّق الوصول المرتبط بعملية متنازع عليها أثناء مراجعة عادلة.",
        ],
      },
      {
        title: "6. الأسعار والعروض",
        body: [
          "السعر المعروض عند الدفع هو المبلغ الرسمي للفترة المختارة بالدولار الأمريكي ما لم يُذكر غير ذلك. قد تُضاف ضرائب حسب الموقع ومزود الدفع والقانون المعمول به.",
          "رسوم تحويل العملة التي يفرضها بنكك ليست تحت سيطرة MAAKFIT.",
          "يمكن تعديل الأسعار مستقبلاً دون أثر رجعي على فترة مدفوعة. إذا تغيّر سعر التجديد فسيظهر قبل التحصيل.",
          "أي عرض يجب أن يوضح السعر الحالي ومدة الفوترة وسعر التجديد وشروط العرض.",
          "قد تخضع العروض وأكواد الخصم لفترة صلاحية وباقات أو مدد مؤهلة وحدود استخدام وشروط عميل جديد. لا يمكن الجمع بينها إلا إذا ذُكر ذلك صراحةً، ويمكن رفض الاستخدام الاحتيالي أو غير المؤهل.",
          "قد تُعالَج المدفوعات، عند تفعيلها، عبر مزودي دفع خارجيين وفق شروطهم وإشعارات الخصوصية الخاصة بهم.",
        ],
      },
      {
        title: "7. التخصيص الآلي وحدود الخدمة",
        body: [
          "يستخدم التطبيق قواعد وحسابات آلية لتخصيص التدريب والتغذية وعرض التقدم استناداً إلى البيانات التي تقدمها.",
          "قد يمنع التطبيق اقتراحاً أو تعديلاً غير آمن أو غير مناسب، وقد يطلب معلومات إضافية قبل إنشاء الخطة.",
          "هذه الوظائف الرقمية لا تمثل تشخيصاً طبياً أو علاجاً أو استشارة مهنية فردية.",
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
          "تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة كما تُطبق في إمارة دبي، وتختص محاكم دبي، دولة الإمارات العربية المتحدة، بالمنازعات، مع مراعاة أي حقوق إلزامية للمستهلك لا يمكن التنازل عنها بموجب القانون المعمول به.",
          "يمكن تحديث الشروط مع إشعار مناسب للتغييرات الجوهرية.",
          "تتوفر هذه الشروط باللغتين العربية والإنجليزية. وفي حال وجود تعارض أو اختلاف في التفسير، تكون النسخة العربية هي المرجع، مع مراعاة أي حقوق إلزامية بموجب القانون المعمول به.",
          "الاتصالات الضرورية للحساب والفوترة والأمان ليست تسويقاً.",
          `القناة الرسمية: ${CURRENT_SUPPORT_EMAIL} أو صفحة التواصل. واتساب: ${CURRENT_WHATSAPP} لدعم الحساب والمشاكل التقنية والفوترة فقط. دعم MAAKFIT ليس قناة طوارئ طبية.`,
          `الإصدار ${POLICY_VERSION}. تاريخ السريان: ${POLICY_EFFECTIVE_DATE_AR}.`,
        ],
      },
    ],
  },
  privacy: {
    title: "سياسة خصوصية MAAKFIT",
    description: "كيف تجمع MAAKFIT بياناتك وتستخدمها وتحميها. لا نبيع بياناتك الشخصية.",
    sections: [
      {
        title: "1. من نحن",
        body: [
          `MAAKFIT تطبيق لياقة وتغذية رقمي يتم تشغيله بواسطة ${LEGAL_OPERATOR}، بصفته مشغّلاً فردياً وليس شركة مسجلة. الموقع العام: ${PUBLIC_LOCATION}.`,
          `للتواصل بشأن الخصوصية: ${CURRENT_SUPPORT_EMAIL} عبر فئة Privacy في صفحة التواصل.`,
        ],
      },
      {
        title: "2. البيانات التي نجمعها — بالحد الأدنى",
        body: [
          "نجمع ما يلزم لتقديم الخدمة: الاسم وبيانات الحساب والبريد والهاتف إن أدخلته، العمر أو تاريخ الميلاد، الجنس، الهدف، أيام التدريب، وقت التدريب، القياسات والتفضيلات.",
          "تشمل بيانات الاستخدام التي تختار إدخالها سجلات التمرين والأوزان والتكرارات والجهد، نشاط الترطيب، التقدم والصور عند رفعها، وتفضيلات التغذية والحساسية وعدم التحمل والأطعمة غير المرغوبة.",
          "نجمع حالة العضوية والفوترة ومعرّفات المعاملة اللازمة، وبيانات الجهاز والجلسة والأمان والسجلات التقنية المحدودة والتخزين المحلي/ملفات الارتباط الضرورية.",
          "لا نجمع موقعك الدقيق إلا إذا لزم مستقبلاً بوضوح وموافقة. إذن الميكروفون/الكاميرا يُطلب فقط لميزة تستخدمه (مثل رسالة صوتية أو صورة).",
        ],
      },
      {
        title: "3. أغراض الاستخدام",
        body: [
          "تشغيل الحساب وتخصيص التجربة وتعيين التدريب والتغذية وتتبع التقدم ودعم الحساب والفوترة.",
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
        title: "5. صور التقدم والملفات المرفوعة",
        body: [
          "صور التقدم خاصة افتراضياً. رفع الصورة لا يعني موافقة تسويقية.",
          "لا نستخدم صورك تلقائياً في إعلانات أو وسائل تواصل أو حملات قبل/بعد أو شهادات عامة.",
          "موافقة قبل/بعد للتسويق — إن وُجدت — اختيارية وصريحة ومنفصلة وغير محددة مسبقاً، ولا يؤثر رفضها على الحساب أو البرنامج أو الاشتراك.",
          "صور التقدم والملفات المرفوعة تُخزّن بوصول خاص وتقتصر على صاحب الحساب والموظفين المخولين عند الحاجة للدعم أو تشغيل الخدمة.",
        ],
      },
      {
        title: "6. التخصيص الآلي والتحليلات",
        body: [
          "قد تستخدم الخدمة قواعد وحسابات آلية لتخصيص الخطط وعرض التحليلات والتقدم.",
          "لا نستخدم صور التقدم أو البيانات الحساسة لأغراض تسويقية دون موافقة منفصلة وصريحة.",
          "تُستخدم التحليلات التشغيلية لتحسين الخدمة والأمان. لا نتوسع في تتبّع إعلاني دون أساس واضح.",
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
        title: "8. مزودو الخدمة والمشاركة والأمان",
        body: [
          "لا نبيع بياناتك الشخصية.",
          "نستخدم Supabase للمصادقة وقاعدة البيانات والتخزين، وVercel لاستضافة التطبيق، وResend لإرسال رسائل الخدمة. قد تتغير مهامهم أو بدائلهم مع تحديث هذه السياسة.",
          "عند تفعيل الدفع، قد نشارك الحد اللازم مع مزودي دفع خارجيين وفق شروطهم وإشعارات الخصوصية الخاصة بهم. كما يصل الموظفون المخولون فقط إلى ما يلزم لتشغيل الخدمة أو تقديم الدعم.",
          "نطبّق ضمانات تقنية وتنظيمية معقولة (تشفير النقل، صلاحيات أقل، تخزين خاص). لا ندّعي أمناً مطلقاً 100%.",
          "كلمات المرور تُعالج عبر نظام المصادقة ولا تُحفظ كنص واضح لدينا.",
        ],
      },
      {
        title: "9. حقوقك والاحتفاظ والحذف",
        body: [
          "يمكنك طلب الوصول أو التصحيح أو الحذف أو تقييد المعالجة أو الاعتراض أو سحب موافقة اختيارية، حسب القانون المعمول به. قد نتحقق من هويتك للطلبات الحساسة.",
          "حذف الحساب ≠ إلغاء التجديد ≠ طلب استرداد. بعد التأكيد نطبّق الحذف أو إخفاء الهوية وفق فئات الاحتفاظ.",
          "نحتفظ بالبيانات فقط للمدة المعقولة اللازمة للأغراض الموضحة، والالتزامات القانونية، وتسوية المنازعات، ومنع الاحتيال، والأمان. سيُراجع جدول المدد التفصيلي بعد تحديد الجهة والاختصاص.",
          "النسخ الاحتياطية تُدار وفق دورة حياة محدودة ثم تُزال.",
        ],
      },
      {
        title: "10. الأطفال والنقل والقانون",
        body: [
          "الخدمة لـ18+ في V1. إذا علمنا بحساب لقاصر سنغلقه وفق سياسة معقولة.",
          "قد تُعالَج بيانات عبر مزودين دوليين. لا ندّعي إقامة بيانات في بلد محدد ما لم نُعلن ذلك بوضوح.",
          "قد نكشف بيانات إذا طُلب قانونياً أو لمنع احتيال/ضرر جسيم، وبالحد اللازم.",
          `تخضع هذه السياسة لقوانين دولة الإمارات العربية المتحدة كما تُطبق في إمارة دبي، وتختص محاكم دبي، دولة الإمارات العربية المتحدة، مع مراعاة الحقوق الإلزامية التي لا يمكن التنازل عنها. تتوفر السياسة بالعربية والإنجليزية وتكون العربية المرجع عند اختلاف التفسير. الإصدار ${POLICY_VERSION}، تاريخ السريان: ${POLICY_EFFECTIVE_DATE_AR}.`,
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
          "التجربة المجانية وسيلة للتعرّف على التطبيق قبل شراء باقة مدفوعة.",
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
          "تخضع المشتريات الترويجية وأكواد الخصم لنفس المراجعة مع احتساب المبلغ المدفوع فعلياً، ولا تلغي الحقوق الإلزامية للمستهلك.",
          "المعاملة الفاشلة أو المعلقة التي لم تُحصّل لا تُعد مبلغاً مسترداً؛ نتحقق من حالتها مع مزود الدفع. تُراجع الرسوم المكررة أو أخطاء الفوترة وتصَحَّح عند التحقق.",
          "الاعتراض البنكي (chargeback) لا يُستخدم كبديل لمراجعة الدعم، لكنه لا يلغي حقوقك. قد نقيّد الوصول المتصل بالمبلغ المتنازع عليه أثناء التحقيق دون اتخاذ إجراء انتقامي.",
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
          `تشغّل ${LEGAL_OPERATOR} منتج MAAKFIT بصفته مشغّلاً فردياً من ${PUBLIC_LOCATION}. تخضع هذه السياسة لقوانين دولة الإمارات العربية المتحدة كما تُطبق في إمارة دبي، وتختص محاكم دبي، مع مراعاة الحقوق الإلزامية للمستهلك. العربية هي النسخة المرجعية عند اختلاف التفسير. الإصدار ${POLICY_VERSION}، تاريخ السريان: ${POLICY_EFFECTIVE_DATE_AR}.`,
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
          "MAAKFIT is a fully digital fitness app for training, nutrition, progress tracking, and hydration. The service and personalized plans are delivered inside the app.",
          "MAAKFIT is not a medical provider and does not diagnose or treat disease.",
          `MAAKFIT is a digital fitness product operated by ${LEGAL_OPERATOR}, acting as an individual operator and not as a registered company. Public location: ${PUBLIC_LOCATION}.`,
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
          "Exercise involves physical risk. Train safely within your ability, using suitable equipment and surroundings, and stop immediately for unusual pain, dizziness, breathing difficulty, or other concerning symptoms.",
          "Consult a qualified medical professional before starting if you have a medical condition, injury, pregnancy, prescribed diet, or health concern, and report relevant changes to the service.",
          "Nutrition suggestions depend on the information you provide. You are responsible for entering allergies, intolerances, and disliked foods accurately and independently checking ingredients, labels, and suitability.",
          "MAAKFIT attempts to respect supplied restrictions but cannot guarantee that every product or kitchen is free from allergens or cross-contamination. It does not replace medical dietary advice.",
          "System estimates are not confirmed medical measurements.",
        ],
      },
      {
        title: "4. Plans and subscription",
        body: [
          "FREE provides limited access: the personalized training structure is shown locked, and one real breakfast is available while the remaining meals stay locked under the current product.",
          "The current paid plans are PLUS and PRO for the periods shown at purchase, currently 3 or 6 months.",
          "PLUS unlocks the digital training and nutrition program and the paid features shown on the purchase page.",
          "PRO includes PLUS features together with the additional digital features expressly shown on the purchase page.",
          "Your digital program can evolve with your progress, goals, reported injuries, logs, and the app's rules.",
        ],
      },
      {
        title: "5. Renewal and cancellation",
        body: [
          "Paid subscriptions may auto-renew according to what you see and accept at checkout.",
          "You may cancel renewal. Access continues until the paid period ends. Cancel renewal ≠ delete account ≠ refund request.",
          "A failed or expired payment method may suspend renewal or paid entitlements after appropriate notice. We will never request your password or full card number to resolve billing.",
          "If you dispute a charge, contact us first so we can investigate; this does not limit legal or bank rights. Access connected to a disputed payment may be restricted during a fair review.",
        ],
      },
      {
        title: "6. Pricing and offers",
        body: [
          "The amount shown at checkout is the official price for the selected period, in USD unless stated otherwise. Taxes may apply by location, payment provider, and law.",
          "Bank FX fees are outside MAAKFIT’s control.",
          "Future price changes are not retroactive. A new renewal price will be shown before it is charged.",
          "Promotions must show current price, billing period, renewal price, and conditions.",
          "Promotions and promo codes may have expiry dates, eligible plans or terms, usage limits, or new-customer rules. They cannot be combined unless stated, and fraudulent or ineligible use may be rejected.",
          "When enabled, payments may be processed by third-party payment providers under their own terms and privacy notices.",
        ],
      },
      {
        title: "7. Automated personalization and service limits",
        body: [
          "The app uses automated rules and calculations to personalize training, nutrition, and progress displays based on the data you provide.",
          "The app may reject an unsafe or unsuitable suggestion or adjustment and may request more information before generating a plan.",
          "These digital functions are not a medical diagnosis, treatment, or professional medical consultation.",
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
          "These Terms are governed by the laws of the United Arab Emirates as applicable in the Emirate of Dubai. The courts of Dubai, United Arab Emirates have jurisdiction, subject to any mandatory consumer rights that cannot be waived under applicable law.",
          "We may update these terms with appropriate notice for material changes.",
          "These Terms are available in Arabic and English. In the event of any inconsistency or difference in interpretation, the Arabic version shall prevail, subject to any mandatory rights under applicable law.",
          `Official contact: ${CURRENT_SUPPORT_EMAIL} or the Contact page. WhatsApp: ${CURRENT_WHATSAPP} for account, technical, and billing support only. MAAKFIT Support is not a medical emergency channel.`,
          `Version ${POLICY_VERSION}. Effective date: ${POLICY_EFFECTIVE_DATE_EN}.`,
        ],
      },
    ],
  },
  privacy: {
    title: "MAAKFIT Privacy Policy",
    description:
      "How MAAKFIT collects, uses, and protects your data. We do not sell personal data.",
    sections: [
      {
        title: "1. Who we are",
        body: [
          `MAAKFIT is a digital fitness and nutrition app operated by ${LEGAL_OPERATOR}, acting as an individual operator and not as a registered company. Public location: ${PUBLIC_LOCATION}.`,
          `Privacy contact: ${CURRENT_SUPPORT_EMAIL} using the Privacy category on the Contact page.`,
        ],
      },
      {
        title: "2. Data we collect — minimization",
        body: [
          "We collect what is needed to provide the service: name and account data, email, phone if supplied, age or date-related profile input, gender, goals, training days, training time, measurements, and preferences.",
          "Data you choose to enter may include workout logs, weights, reps, effort, hydration activity, progress and uploaded photos, nutrition preferences, allergies, intolerances, and disliked foods.",
          "We collect membership and billing status, necessary transaction identifiers, device/browser and session data, limited security logs, and necessary cookies or local storage.",
          "Microphone/camera permission is requested only for a feature that uses it.",
        ],
      },
      {
        title: "3. Purposes",
        body: [
          "To operate the account, personalize the experience, assign training and nutrition, track progress, and support billing and account needs.",
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
        title: "5. Progress photos and uploaded files",
        body: [
          "Progress photos are private by default. Upload is not marketing consent.",
          "We do not automatically use photos in ads, social media, before/after campaigns, or public testimonials.",
          "Any before/after marketing consent is separate, explicit, optional, and not pre-checked. Refusal does not affect the account, program, or subscription.",
          "Progress photos and uploaded files are privately stored and limited to the account holder and authorized staff when needed for support or service operation.",
        ],
      },
      {
        title: "6. Automated personalization and analytics",
        body: [
          "The service may use automated rules and calculations to personalize plans and present analytics and progress.",
          "We do not use progress photos or sensitive data for marketing without separate, explicit consent.",
          "Operational analytics may improve the service and security. We do not expand advertising tracking without a clear basis.",
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
        title: "8. Service providers, sharing, and security",
        body: [
          "We do not sell personal data.",
          "We use Supabase for authentication, database, and storage; Vercel to host the application; and Resend for service email. Their roles or replacements may change with an updated policy.",
          "When payments are enabled, limited data may be shared with third-party payment providers under their own terms and privacy notices. Authorized operations and support staff receive only the access needed to provide the service.",
          "We apply reasonable technical and organizational safeguards. We do not claim 100% security.",
          "Passwords are handled by the auth system and are not stored in plaintext.",
        ],
      },
      {
        title: "9. Rights, retention, deletion",
        body: [
          "You may request access, correction, deletion, restriction, objection, or withdrawal of optional consent, subject to applicable law. Sensitive requests may require identity verification.",
          "Delete account ≠ cancel renewal ≠ refund request.",
          "We retain data only as long as reasonably necessary for the purposes described, legal obligations, dispute resolution, fraud prevention, and security. A detailed retention schedule will be reviewed after entity and jurisdiction are finalized.",
        ],
      },
      {
        title: "10. Children, transfers, law",
        body: [
          "V1 is 18+. If we learn of a minor account, we will close it under a reasonable process.",
          "Data may be processed by international providers. We do not make false data-residency claims.",
          `This Policy is governed by the laws of the United Arab Emirates as applicable in the Emirate of Dubai. The courts of Dubai, United Arab Emirates have jurisdiction, subject to mandatory rights that cannot be waived. It is available in Arabic and English; Arabic prevails if interpretation differs. Version ${POLICY_VERSION}. Effective date: ${POLICY_EFFECTIVE_DATE_EN}.`,
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
          "Promotional purchases and promo-code orders follow the same review using the amount actually paid and do not remove mandatory consumer rights.",
          "A failed or pending transaction that was not captured is not a refund. We verify its status with the payment provider. Verified duplicate charges and billing errors are corrected.",
          "A chargeback is not a substitute for contacting Support, but it does not remove your rights. Access connected to the disputed amount may be limited during investigation without retaliation.",
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
          `MAAKFIT is operated by ${LEGAL_OPERATOR} as an individual from ${PUBLIC_LOCATION}. This Policy is governed by the laws of the United Arab Emirates as applicable in the Emirate of Dubai, with jurisdiction in the courts of Dubai, subject to mandatory consumer rights. Arabic is the reference version if interpretation differs. Version ${POLICY_VERSION}. Effective date: ${POLICY_EFFECTIVE_DATE_EN}.`,
        ],
      },
    ],
  },
};
