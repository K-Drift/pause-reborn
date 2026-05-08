// Stage 9.C:品牌主 Dashboard 的纯前端 mock 数据层
// 以 brandId 为种子的确定性 LCG → 同品牌每次刷新数字一致,不闪烁
// 不接后端,所有数据本地生成

export interface Brand {
  id: string;
  brand: string;
  category: string;
  tone: string[];
}

// 镜像自 backend/data/ad_library.json,仅前端展示需要的字段
export const BRANDS: Brand[] = [
  { id: "naga_12", brand: "单一麦芽 · 长泽十二年", category: "威士忌", tone: ["深夜", "孤独", "克制", "高端"] },
  { id: "shanxi_cognac", brand: "山系 · 干邑年份桶", category: "干邑", tone: ["山林", "沉静", "克制"] },
  { id: "midnight_lager", brand: "便利店 · 深夜精酿", category: "啤酒", tone: ["都市", "深夜", "随性"] },
  { id: "yunyin_baicha", brand: "云隐 · 古法白茶", category: "茶", tone: ["古风", "禅意", "克制", "雅致"] },
  { id: "chenzhuo_coffee", brand: "晨啄 · 手冲挂耳咖啡", category: "咖啡", tone: ["晨间", "温柔", "甜蜜", "明亮"] },
  { id: "yexi_aroma", brand: "夜息 · 助眠香薰", category: "家居·香氛", tone: ["深夜", "安眠", "克制", "温柔"] },
  { id: "moyan_ink", brand: "古法墨砚", category: "文房四宝", tone: ["古风", "雅致", "沉静"] },
  { id: "jingmi_linen", brand: "静谧 · 亚麻床品", category: "家居·床品", tone: ["温暖", "安睡", "简约"] },
  { id: "qing_gong", brand: "清供 · 案头拈花", category: "家居·摆件", tone: ["禅意", "古风", "雅致"] },
  { id: "yuyu_blanket", brand: "余余 · 羊毛盖毯", category: "家居·织物", tone: ["温暖", "安睡", "深夜", "克制"] },
  { id: "feicui_bracelet", brand: "翡翠 · 极简手串", category: "饰品", tone: ["古风", "雅致", "克制"] },
  { id: "muxi_tea_set", brand: "木夕 · 旅行茶具", category: "茶器", tone: ["古风", "雅致", "禅意"] },
];

export const DEFAULT_BRAND_ID = BRANDS[0].id;

export const SCENE_BUCKETS = [
  "都市夜居酒屋",
  "古风庭院",
  "深夜独处",
  "甜宠晨间",
  "武侠对决",
  "商战会议",
  "家庭温馨",
  "病房 · 敏感",
];

const FEEDBACK_POOL: { quote: string; sentiment: "pos" | "neutral" }[] = [
  { quote: "和剧情融合得很自然,几乎没意识到是广告。", sentiment: "pos" },
  { quote: "广告文案像旁白,反而让我注意了一下品牌。", sentiment: "pos" },
  { quote: "终于不用看那种花花绿绿的弹窗了。", sentiment: "pos" },
  { quote: "看到广告我居然没急着跳过。", sentiment: "pos" },
  { quote: "色调和剧集统一,品牌就这么默默记住了。", sentiment: "pos" },
  { quote: "第一次感觉广告没打断我看剧。", sentiment: "pos" },
  { quote: "这种克制的呈现方式更舒服。", sentiment: "pos" },
  { quote: "看完没立刻想买,但隔天还记得这个牌子。", sentiment: "neutral" },
  { quote: "希望腾讯尽快上线这个功能。", sentiment: "pos" },
  { quote: "对古装剧的氛围保留得不错。", sentiment: "neutral" },
  { quote: "比传统暂停广告少了打扰感。", sentiment: "pos" },
  { quote: "AI 选的位置在画面边缘,不挡剧情。", sentiment: "pos" },
];

// 每个品牌的"为什么这个品牌适合这些剧种"叙事(2-3 句中文)
const NARRATIVES: Record<string, string> = {
  naga_12:
    "深夜独处类剧种契合度最高,尤其是都市孤独题材。AI 倾向把这款单一麦芽放在书房灯影、玻璃杯旁等克制场景,平均干扰度极低,品牌调性匹配持续维持在 90 以上。",
  shanxi_cognac:
    "更适合慢节奏的家庭剧与文人题材,而非派对场景。山林、雪夜、独酌镜头是最高契合段;商战、武打类剧种 AI 主动避开。",
  midnight_lager:
    "都市剧便利店、深夜街头镜头契合度极高。AI 严格规避商务场景与古装剧种,适合年轻、随性的内容画像。",
  yunyin_baicha:
    "古风、禅意场景几乎全命中。AI 在落雨、案头、夜读类镜头里推得最自然,场景情绪契合度长期保持高位。",
  chenzhuo_coffee:
    "甜宠剧晨间场景命中率最高,AI 倾向把它和阳光、慢起床、阅读类镜头组合。深夜场景几乎不推此品类。",
  yexi_aroma:
    "适合深夜独处与冬季暖灯类剧情。AI 在情绪沉重或冲突帧里几乎不推此品类,用户干扰度被严格控制在 low。",
  moyan_ink:
    "几乎只出现在古装、文人剧场景。覆盖剧种少但契合度集中,RAS 中位数偏高,触达精准但量级有限。",
  jingmi_linen:
    "广谱中等品类。AI 在睡前、清晨场景给出建议,白天活跃场景几乎不推,平均克制度稳定。",
  qing_gong:
    "古风、禅意剧种主战场,部分都市剧的书房镜头也命中。投放体量较小但 RAS 极高。",
  yuyu_blanket:
    "冷季感剧情、深夜陪伴类极契合。情绪沉重场景被严格 forbidden,品牌长期维持温暖、克制的调性印象。",
  feicui_bracelet:
    "古装、年代戏命中率高;现代职场剧基本不推。AI 倾向把它和静态镜头、镜面反光组合,品牌曝光轻而不强。",
  muxi_tea_set:
    "户外、旅行、文化类剧种契合度最高。AI 几乎不放在密闭城市夜景,适合内容输出向品牌定位。",
};

const DEFAULT_NARRATIVE =
  "AI 根据该品牌的 tone 标签自动筛选契合剧种,在不打扰的前提下做长期低强度曝光。";

export interface BrandDashboard {
  brandId: string;
  brand: string;
  category: string;
  tone: string[];
  kpis: {
    sceneCount: number;
    pauseCount: number;
    reachUsers: number;
    avgRAS: number;
  };
  sceneFit: { sceneCategory: string; score: number }[];
  rasTrend: number[];
  feedback: { quote: string; sentiment: "pos" | "neutral" }[];
  narrative: string;
}

// FNV-1a 散列(brandId → 32 位整数种子)
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) >>> 0;
    h = (h * 16777619) >>> 0;
  }
  return h;
}

// 线性同余生成器(Numerical Recipes 参数)
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s;
  };
}

export function getBrandDashboard(brandId: string): BrandDashboard {
  const brand = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0];
  const rng = lcg(hashSeed(brandId));
  const between = (lo: number, hi: number) => lo + (rng() % (hi - lo + 1));

  // KPI:用合理的演示量级
  const sceneCount = between(120, 380);
  const pauseCount = between(8000, 35000);
  const reachUsers = between(2000, 12000);
  const avgRAS = between(65, 89);

  // 场景契合度:8 个固定剧种,每个 40-95
  const sceneFit = SCENE_BUCKETS.map((label) => ({
    sceneCategory: label,
    score: between(40, 95),
  }));

  // 30 天 RAS 趋势,锚定在 avgRAS ± 10 区间
  const rasTrend = Array.from({ length: 30 }, () => {
    const offset = (rng() % 21) - 10;
    return Math.max(0, Math.min(100, avgRAS + offset));
  });

  // 用户反馈:从 pool 里抽 4 条(去重)
  const feedback: typeof FEEDBACK_POOL = [];
  const seen = new Set<number>();
  while (feedback.length < 4 && seen.size < FEEDBACK_POOL.length) {
    const idx = rng() % FEEDBACK_POOL.length;
    if (!seen.has(idx)) {
      seen.add(idx);
      feedback.push(FEEDBACK_POOL[idx]);
    }
  }

  return {
    brandId: brand.id,
    brand: brand.brand,
    category: brand.category,
    tone: brand.tone,
    kpis: { sceneCount, pauseCount, reachUsers, avgRAS },
    sceneFit,
    rasTrend,
    feedback,
    narrative: NARRATIVES[brandId] ?? DEFAULT_NARRATIVE,
  };
}
