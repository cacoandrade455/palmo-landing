/**
 * Dicionário do funil internacional (/global) — INDEPENDENTE do
 * lib/content.ts do site. Público-alvo: investidor estrangeiro, por isso
 * NÃO há português aqui. Idiomas: en (padrão), zh (中文), fr, ar (RTL).
 *
 * Traduções feitas em registro simples e claro — sujeitas a revisão nativa.
 */

export type GlobalLang = "en" | "zh" | "fr" | "ar";

export const GLOBAL_LANGS: { code: GlobalLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

export const GLOBAL_LANG_STORAGE_KEY = "palmo-global-lang";

export function isRtl(lang: GlobalLang): boolean {
  return lang === "ar";
}

export function isGlobalLang(v: string | null): v is GlobalLang {
  return v === "en" || v === "zh" || v === "fr" || v === "ar";
}

const en = {
  // ── Top bar / shared ──
  brandTag: "Global",
  langLabel: "Language",
  backHome: "Back to overview",

  // ── Landing ──
  earlyAccess: "Early access",
  heroTitle: "Access Brazilian farmland yield",
  heroSub:
    "Palmo connects investors to income from productive land in Brazil. We are in early access: investment structures are under legal structuring, and access opens only after verification.",
  bullet1Title: "Calculator built on official data",
  bullet1Body:
    "Our land-value estimates use official Brazilian sources (IBGE and municipal land values) — no invented numbers.",
  bullet2Title: "Verified land",
  bullet2Body:
    "Listings are checked against Brazil's rural environmental registry (CAR) and documentation before going live.",
  bullet3Title: "Regulated structure",
  bullet3Body:
    "International investment flows through regulated Brazilian instruments, structured case by case with legal counsel.",
  ctaStart: "Start verification",
  disclaimer:
    "Early access — investment structures under legal structuring. This page is informational only: it is not an offer of securities and no return is promised or guaranteed.",
  inboundOnly: "Palmo operates exclusively with land and production located in Brazil.",

  // ── Wizard ──
  kycTitle: "Investor verification",
  kycIntro: "A short verification is required before any access. Files are reviewed manually by our team.",
  stepType: "Type",
  stepDetails: "Details",
  stepDocs: "Documents",
  typeQuestion: "Who is investing?",
  individual: "Individual",
  individualDesc: "Investing in my own name",
  entity: "Entity",
  entityDesc: "Fund, family office or company",
  continueBtn: "Continue",
  backBtn: "Back",
  submitBtn: "Submit for review",
  submitting: "Submitting…",
  signInTitle: "Sign in to continue",
  signInBody: "We need a verified email to open your file.",
  signInGoogle: "Continue with Google",
  fullName: "Full name (as in passport)",
  country: "Country of residence",
  passportNumber: "Passport number",
  address: "Residential address",
  investmentRange: "Intended investment range",
  rangeSelect: "Select a range",
  range1: "Up to US$ 100k",
  range2: "US$ 100k – 500k",
  range3: "US$ 500k – 1M",
  range4: "Over US$ 1M",
  sourceOfFunds: "Source of funds",
  sourceOfFundsPh:
    "Briefly describe the origin of the funds (e.g. sale of a business, savings, dividends).",
  pepQuestion: "Are you a politically exposed person (PEP)?",
  yes: "Yes",
  no: "No",
  entityName: "Entity name",
  entityCountry: "Country of incorporation",
  registrationNumber: "Registration number",
  ubosTitle: "Beneficial owners (25% or more)",
  uboName: "Name",
  uboCountry: "Country",
  uboPassport: "Passport no.",
  addUbo: "Add beneficial owner",
  removeUbo: "Remove",
  docsTitle: "Documents",
  docsHint: "Image or PDF, up to 10 MB.",
  passportDoc: "Passport (photo or scan)",
  incorporationDoc: "Certificate of incorporation",
  chooseFile: "Choose file",
  requiredError: "Please complete all required fields.",
  uploadError: "Upload failed. Please try again.",
  submitError: "Something went wrong. Please try again.",
  notConfigured: "Service unavailable right now. Please try again later.",

  // ── Status ──
  reviewTitle: "Under review",
  reviewBody: "You'll hear from us within 5 business days.",
  approvedTitle: "Verification approved",
  approvedBody: "Our team will contact you by email with the next steps.",
  rejectedTitle: "We couldn't verify your file",
  rejectedBody: "Some information could not be confirmed. You can submit a new verification.",
  redo: "Start a new verification",
};

export type GlobalDict = typeof en;

const zh: GlobalDict = {
  brandTag: "Global",
  langLabel: "语言",
  backHome: "返回概览",

  earlyAccess: "早期阶段",
  heroTitle: "投资巴西农地收益",
  heroSub:
    "Palmo 连接投资者与巴西生产性土地的收益。我们目前处于早期阶段：投资结构正在进行法律搭建，通过验证后方可访问。",
  bullet1Title: "基于官方数据的估值计算器",
  bullet1Body: "土地估值采用巴西官方数据来源（IBGE 及市级土地价值）——绝无虚构数字。",
  bullet2Title: "经核实的土地",
  bullet2Body: "土地信息在上线前均与巴西农村环境登记（CAR）及相关文件核对。",
  bullet3Title: "受监管的结构",
  bullet3Body: "国际投资通过受监管的巴西金融工具进行，并与法律顾问逐案搭建。",
  ctaStart: "开始验证",
  disclaimer:
    "早期阶段——投资结构正在进行法律搭建。本页面仅供参考：不构成证券要约，亦不承诺或保证任何回报。",
  inboundOnly: "Palmo 仅涉及位于巴西境内的土地与生产。",

  kycTitle: "投资者验证",
  kycIntro: "访问前需完成简短验证，资料由我们的团队人工审核。",
  stepType: "类型",
  stepDetails: "信息",
  stepDocs: "文件",
  typeQuestion: "投资主体是？",
  individual: "个人",
  individualDesc: "以个人名义投资",
  entity: "机构",
  entityDesc: "基金、家族办公室或公司",
  continueBtn: "继续",
  backBtn: "返回",
  submitBtn: "提交审核",
  submitting: "提交中…",
  signInTitle: "登录以继续",
  signInBody: "我们需要经过验证的邮箱来建立您的档案。",
  signInGoogle: "使用 Google 继续",
  fullName: "全名（与护照一致）",
  country: "居住国家",
  passportNumber: "护照号码",
  address: "居住地址",
  investmentRange: "拟投资金额区间",
  rangeSelect: "请选择区间",
  range1: "10 万美元以下",
  range2: "10 万 – 50 万美元",
  range3: "50 万 – 100 万美元",
  range4: "100 万美元以上",
  sourceOfFunds: "资金来源",
  sourceOfFundsPh: "请简要说明资金来源（如出售企业、储蓄、分红等）。",
  pepQuestion: "您是否为政治公众人物（PEP）？",
  yes: "是",
  no: "否",
  entityName: "机构名称",
  entityCountry: "注册国家",
  registrationNumber: "注册编号",
  ubosTitle: "最终受益人（持股 25% 及以上）",
  uboName: "姓名",
  uboCountry: "国家",
  uboPassport: "护照号",
  addUbo: "添加受益人",
  removeUbo: "移除",
  docsTitle: "文件",
  docsHint: "图片或 PDF，最大 10 MB。",
  passportDoc: "护照（照片或扫描件）",
  incorporationDoc: "公司注册证书",
  chooseFile: "选择文件",
  requiredError: "请填写所有必填项。",
  uploadError: "上传失败，请重试。",
  submitError: "出现问题，请重试。",
  notConfigured: "服务暂不可用，请稍后再试。",

  reviewTitle: "审核中",
  reviewBody: "我们将在 5 个工作日内与您联系。",
  approvedTitle: "验证已通过",
  approvedBody: "我们的团队将通过邮件与您联系后续事宜。",
  rejectedTitle: "未能完成验证",
  rejectedBody: "部分信息无法确认。您可以重新提交验证。",
  redo: "重新验证",
};

const fr: GlobalDict = {
  brandTag: "Global",
  langLabel: "Langue",
  backHome: "Retour à l'aperçu",

  earlyAccess: "Accès anticipé",
  heroTitle: "Accédez au rendement des terres agricoles brésiliennes",
  heroSub:
    "Palmo relie les investisseurs au revenu de terres productives au Brésil. Nous sommes en accès anticipé : les structures d'investissement sont en cours de structuration juridique, et l'accès ne s'ouvre qu'après vérification.",
  bullet1Title: "Calculateur fondé sur des données officielles",
  bullet1Body:
    "Nos estimations de valeur foncière s'appuient sur des sources officielles brésiliennes (IBGE et valeurs foncières municipales) — aucun chiffre inventé.",
  bullet2Title: "Terres vérifiées",
  bullet2Body:
    "Les annonces sont contrôlées via le registre environnemental rural du Brésil (CAR) et la documentation avant publication.",
  bullet3Title: "Structure réglementée",
  bullet3Body:
    "L'investissement international passe par des instruments brésiliens réglementés, structurés au cas par cas avec des conseils juridiques.",
  ctaStart: "Commencer la vérification",
  disclaimer:
    "Accès anticipé — structures d'investissement en cours de structuration juridique. Cette page est purement informative : elle ne constitue pas une offre de titres et aucun rendement n'est promis ni garanti.",
  inboundOnly: "Palmo opère exclusivement avec des terres et une production situées au Brésil.",

  kycTitle: "Vérification de l'investisseur",
  kycIntro:
    "Une courte vérification est requise avant tout accès. Les dossiers sont examinés manuellement par notre équipe.",
  stepType: "Type",
  stepDetails: "Informations",
  stepDocs: "Documents",
  typeQuestion: "Qui investit ?",
  individual: "Particulier",
  individualDesc: "J'investis en mon nom propre",
  entity: "Entité",
  entityDesc: "Fonds, family office ou société",
  continueBtn: "Continuer",
  backBtn: "Retour",
  submitBtn: "Soumettre pour examen",
  submitting: "Envoi…",
  signInTitle: "Connectez-vous pour continuer",
  signInBody: "Un e-mail vérifié est nécessaire pour ouvrir votre dossier.",
  signInGoogle: "Continuer avec Google",
  fullName: "Nom complet (comme sur le passeport)",
  country: "Pays de résidence",
  passportNumber: "Numéro de passeport",
  address: "Adresse résidentielle",
  investmentRange: "Fourchette d'investissement envisagée",
  rangeSelect: "Choisissez une fourchette",
  range1: "Jusqu'à 100 k US$",
  range2: "100 k – 500 k US$",
  range3: "500 k – 1 M US$",
  range4: "Plus de 1 M US$",
  sourceOfFunds: "Origine des fonds",
  sourceOfFundsPh:
    "Décrivez brièvement l'origine des fonds (ex. vente d'une entreprise, épargne, dividendes).",
  pepQuestion: "Êtes-vous une personne politiquement exposée (PPE) ?",
  yes: "Oui",
  no: "Non",
  entityName: "Nom de l'entité",
  entityCountry: "Pays de constitution",
  registrationNumber: "Numéro d'enregistrement",
  ubosTitle: "Bénéficiaires effectifs (25 % ou plus)",
  uboName: "Nom",
  uboCountry: "Pays",
  uboPassport: "N° de passeport",
  addUbo: "Ajouter un bénéficiaire",
  removeUbo: "Retirer",
  docsTitle: "Documents",
  docsHint: "Image ou PDF, 10 Mo maximum.",
  passportDoc: "Passeport (photo ou scan)",
  incorporationDoc: "Certificat de constitution",
  chooseFile: "Choisir un fichier",
  requiredError: "Veuillez remplir tous les champs obligatoires.",
  uploadError: "Échec de l'envoi. Veuillez réessayer.",
  submitError: "Une erreur est survenue. Veuillez réessayer.",
  notConfigured: "Service momentanément indisponible. Réessayez plus tard.",

  reviewTitle: "En cours d'examen",
  reviewBody: "Nous vous répondrons sous 5 jours ouvrés.",
  approvedTitle: "Vérification approuvée",
  approvedBody: "Notre équipe vous contactera par e-mail pour la suite.",
  rejectedTitle: "Vérification non aboutie",
  rejectedBody:
    "Certaines informations n'ont pas pu être confirmées. Vous pouvez soumettre une nouvelle vérification.",
  redo: "Recommencer la vérification",
};

const ar: GlobalDict = {
  brandTag: "Global",
  langLabel: "اللغة",
  backHome: "العودة إلى النظرة العامة",

  earlyAccess: "وصول مبكر",
  heroTitle: "استثمر في عوائد الأراضي الزراعية البرازيلية",
  heroSub:
    "تربط بالمو المستثمرين بدخل الأراضي المنتجة في البرازيل. نحن في مرحلة الوصول المبكر: هياكل الاستثمار قيد الهيكلة القانونية، ولا يُفتح الوصول إلا بعد التحقق.",
  bullet1Title: "حاسبة مبنية على بيانات رسمية",
  bullet1Body:
    "تعتمد تقديراتنا لقيمة الأراضي على مصادر برازيلية رسمية (IBGE وقيم الأراضي البلدية) — لا أرقام مختلقة.",
  bullet2Title: "أراضٍ موثّقة",
  bullet2Body:
    "تُراجع الإعلانات عبر السجل البيئي الريفي البرازيلي (CAR) والمستندات قبل النشر.",
  bullet3Title: "هيكل خاضع للتنظيم",
  bullet3Body:
    "يمر الاستثمار الدولي عبر أدوات برازيلية خاضعة للتنظيم، تُهيكل حالة بحالة مع مستشارين قانونيين.",
  ctaStart: "ابدأ التحقق",
  disclaimer:
    "وصول مبكر — هياكل الاستثمار قيد الهيكلة القانونية. هذه الصفحة للمعلومات فقط: ليست عرضًا لأوراق مالية ولا وعدًا أو ضمانًا لأي عائد.",
  inboundOnly: "تعمل بالمو حصريًا مع أراضٍ وإنتاج داخل البرازيل.",

  kycTitle: "التحقق من المستثمر",
  kycIntro: "يلزم تحقق قصير قبل أي وصول. تُراجع الملفات يدويًا من قبل فريقنا.",
  stepType: "النوع",
  stepDetails: "البيانات",
  stepDocs: "المستندات",
  typeQuestion: "من الذي يستثمر؟",
  individual: "فرد",
  individualDesc: "أستثمر باسمي الشخصي",
  entity: "كيان",
  entityDesc: "صندوق أو مكتب عائلي أو شركة",
  continueBtn: "متابعة",
  backBtn: "رجوع",
  submitBtn: "إرسال للمراجعة",
  submitting: "جارٍ الإرسال…",
  signInTitle: "سجّل الدخول للمتابعة",
  signInBody: "نحتاج إلى بريد إلكتروني موثّق لفتح ملفك.",
  signInGoogle: "المتابعة عبر Google",
  fullName: "الاسم الكامل (كما في جواز السفر)",
  country: "بلد الإقامة",
  passportNumber: "رقم جواز السفر",
  address: "عنوان السكن",
  investmentRange: "نطاق الاستثمار المقصود",
  rangeSelect: "اختر نطاقًا",
  range1: "حتى 100 ألف دولار",
  range2: "100 – 500 ألف دولار",
  range3: "500 ألف – مليون دولار",
  range4: "أكثر من مليون دولار",
  sourceOfFunds: "مصدر الأموال",
  sourceOfFundsPh: "صف باختصار مصدر الأموال (مثل بيع شركة، مدخرات، توزيعات أرباح).",
  pepQuestion: "هل أنت شخص معرّض سياسيًا (PEP)؟",
  yes: "نعم",
  no: "لا",
  entityName: "اسم الكيان",
  entityCountry: "بلد التأسيس",
  registrationNumber: "رقم التسجيل",
  ubosTitle: "المستفيدون الفعليون (25% أو أكثر)",
  uboName: "الاسم",
  uboCountry: "البلد",
  uboPassport: "رقم الجواز",
  addUbo: "إضافة مستفيد",
  removeUbo: "إزالة",
  docsTitle: "المستندات",
  docsHint: "صورة أو PDF، بحد أقصى 10 ميغابايت.",
  passportDoc: "جواز السفر (صورة أو نسخة ممسوحة)",
  incorporationDoc: "شهادة التأسيس",
  chooseFile: "اختيار ملف",
  requiredError: "يرجى تعبئة جميع الحقول المطلوبة.",
  uploadError: "فشل الرفع. يرجى المحاولة مرة أخرى.",
  submitError: "حدث خطأ. يرجى المحاولة مرة أخرى.",
  notConfigured: "الخدمة غير متاحة حاليًا. حاول لاحقًا.",

  reviewTitle: "قيد المراجعة",
  reviewBody: "سنتواصل معك خلال 5 أيام عمل.",
  approvedTitle: "تمت الموافقة على التحقق",
  approvedBody: "سيتواصل معك فريقنا عبر البريد الإلكتروني بالخطوات التالية.",
  rejectedTitle: "تعذر التحقق من ملفك",
  rejectedBody: "تعذّر تأكيد بعض المعلومات. يمكنك تقديم تحقق جديد.",
  redo: "بدء تحقق جديد",
};

export const globalContent: Record<GlobalLang, GlobalDict> = { en, zh, fr, ar };
