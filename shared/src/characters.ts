import type { Character } from './types.js';

// 柚子社全 13 作角色数据集
// 角色姓名均取自 萌娘百科 (Moegirl)，按用户要求补全主要角色与其他角色。
// 猜谜维度：角色名 / 角色位次(rank) / 发色(hair) / 瞳色(eyes) / 作品年份(titleYear, 由 GAME_TITLES 派生) / 爆闪次数(bakusen)。
// rank 为数据集序号占位（= id），如需真实位次可后续替换。
// isMain=true 表示可攻略女主角（猜谜目标），男主角/配角/其他为 false。
export const CHARACTERS: Character[] = [
  // ===== 魔女的夜宴 (サノバウィッチ) =====
  {
    id: 1, name: '绫地宁宁', nameJp: '綾地寧々', title: 'sannabitch', rank: '1',
    bakusen: 16, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 2, name: '因幡巡', nameJp: '因幡めぐる', title: 'sannabitch', rank: '2',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 3, name: '椎叶䌷', nameJp: '椎葉紬', title: 'sannabitch', rank: '3',
    bakusen: 16, hair: '棕', eyes: '绿', cv: '未知', isMain: true,
  },
  {
    id: 4, name: '户隐憧子', nameJp: '戸隠憧子', title: 'sannabitch', rank: '4',
    bakusen: 17, hair: '紫', eyes: '红', cv: '未知', isMain: true,
  },
  {
    id: 5, name: '假屋和奏', nameJp: '仮屋和奏', title: 'sannabitch', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 6, name: '越路美穗', nameJp: '越路美穂', title: 'sannabitch', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 7, name: '相马七绪', nameJp: '相馬七緒', title: 'sannabitch', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 8, name: '久岛佳苗', nameJp: '久島佳苗', title: 'sannabitch', rank: '次要',
    bakusen: 27, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 9, name: '海道秀明', nameJp: '海道秀明', title: 'sannabitch', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 10, name: '保科太一', nameJp: '保科太一', title: 'sannabitch', rank: '次要',
    bakusen: 12, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 11, name: '赤城', nameJp: '赤城', title: 'sannabitch', rank: '次要',
    bakusen: 17, hair: '红', eyes: '红', cv: '未知', isMain: false,
  },
  {
    id: 12, name: '保科柊史', nameJp: '保科柊史', title: 'sannabitch', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },

  // ===== 千恋*万花 (千恋＊万花) =====
  {
    id: 13, name: '朝武芳乃', nameJp: '朝武芳乃', title: 'sengoku', rank: '13',
    bakusen: 17, hair: '黑', eyes: '红', cv: '未知', isMain: true,
  },
  {
    id: 14, name: '常陆茉子', nameJp: '常陸茉子', title: 'sengoku', rank: '14',
    bakusen: 27, hair: '黑', eyes: '棕', cv: '未知', isMain: true,
  },
  {
    id: 15, name: '丛雨', nameJp: 'むらさめ', title: 'sengoku', rank: '15',
    bakusen: 15, hair: '银', eyes: '金', cv: '未知', isMain: true,
  },
  {
    id: 16, name: '蕾娜·列支敦瑙尔', nameJp: 'レナ・リヒテンシュタイン', title: 'sengoku', rank: '16',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 17, name: '鞍马小春', nameJp: '鞍馬小春', title: 'sengoku', rank: '17',
    bakusen: 16, hair: '棕', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 18, name: '马庭芦花', nameJp: '馬庭芦花', title: 'sengoku', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 19, name: '鞍马廉太郎', nameJp: '鞍馬廉太郎', title: 'sengoku', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 20, name: '驹川美津叶', nameJp: '駒川美津葉', title: 'sengoku', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 21, name: '朝武安晴', nameJp: '朝武安晴', title: 'sengoku', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 22, name: '鞍马玄十郎', nameJp: '鞍馬玄十郎', title: 'sengoku', rank: '次要',
    bakusen: 50, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 23, name: '中条比奈实', nameJp: '中条比奈実', title: 'sengoku', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 24, name: '猪谷心子', nameJp: '猪谷心子', title: 'sengoku', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 25, name: '朝武秋穗', nameJp: '朝武秋穂', title: 'sengoku', rank: '次要',
    bakusen: 12, hair: '黑', eyes: '红', cv: '未知', isMain: false,
  },
  {
    id: 26, name: '有地将臣', nameJp: '有地将臣', title: 'sengoku', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },

  // ===== RIDDLE JOKER =====
  {
    id: 27, name: '三司绫濑', nameJp: '三司あぐり', title: 'riddle', rank: '27',
    bakusen: 17, hair: '棕', eyes: '绿', cv: '未知', isMain: true,
  },
  {
    id: 28, name: '在原七海', nameJp: '在原七海', title: 'riddle', rank: '28',
    bakusen: 17, hair: '蓝', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 29, name: '式部茉优', nameJp: '式部茉優', title: 'riddle', rank: '29',
    bakusen: 17, hair: '黑', eyes: '紫', cv: '未知', isMain: true,
  },
  {
    id: 30, name: '二条院羽月', nameJp: '二条院羽月', title: 'riddle', rank: '30',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 31, name: '壬生千咲', nameJp: '壬生ちさき', title: 'riddle', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 32, name: '柿本香里', nameJp: '柿本香里', title: 'riddle', rank: '次要',
    bakusen: 27, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 33, name: '周防恭平', nameJp: '周防恭平', title: 'riddle', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 34, name: '在原隆之介', nameJp: '在原隆之介', title: 'riddle', rank: '次要',
    bakusen: 17, hair: '蓝', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 35, name: '伊势笃纪', nameJp: '伊勢篤紀', title: 'riddle', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 36, name: '在原晓', nameJp: '在原暁', title: 'riddle', rank: '次要',
    bakusen: 17, hair: '蓝', eyes: '蓝', cv: '未知', isMain: false,
  },

  // ===== 星光咖啡馆与死神之蝶 (喫茶ステラと死神の蝶) =====
  {
    id: 37, name: '明月栞那', nameJp: '明月かんな', title: 'stella', rank: '37',
    bakusen: 17, hair: '金', eyes: '紫', cv: '未知', isMain: true,
  },
  {
    id: 38, name: '四季夏目', nameJp: '四季なつめ', title: 'stella', rank: '38',
    bakusen: 17, hair: '银', eyes: '绿', cv: '未知', isMain: true,
  },
  {
    id: 39, name: '墨染希', nameJp: '墨染希', title: 'stella', rank: '39',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 40, name: '火打谷爱衣', nameJp: '火打谷あい', title: 'stella', rank: '40',
    bakusen: 17, hair: '棕', eyes: '红', cv: '未知', isMain: true,
  },
  {
    id: 41, name: '汐山凉音', nameJp: '汐山涼音', title: 'stella', rank: '41',
    bakusen: 17, hair: '蓝', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 42, name: '御帝', nameJp: '御帝', title: 'stella', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '红', cv: '未知', isMain: false,
  },
  {
    id: 43, name: '高嶺和史', nameJp: '高嶺和史', title: 'stella', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 44, name: '汐山宏人', nameJp: '汐山宏人', title: 'stella', rank: '次要',
    bakusen: 45, hair: '蓝', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 45, name: '高嶺昂晴', nameJp: '高嶺昂晴', title: 'stella', rank: '次要',
    bakusen: 20, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },

  // ===== 管乐恋曲! -The bonds of melody- (ぶらばん!) =====
  {
    id: 46, name: '香住纯', nameJp: '香住純', title: 'braban', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 47, name: '中之岛妙', nameJp: '中之島みお', title: 'braban', rank: '47',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 48, name: '海老原水濑', nameJp: '海老原みなせ', title: 'braban', rank: '48',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 49, name: '今宫纪子', nameJp: '今宮紀子', title: 'braban', rank: '49',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: true,
  },
  {
    id: 50, name: '云雀丘由贵', nameJp: '雲雀丘ゆき', title: 'braban', rank: '50',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 51, name: '御影须美', nameJp: '御影すみ', title: 'braban', rank: '51',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: true,
  },
  {
    id: 52, name: '朝雾春奈', nameJp: '朝霧はるな', title: 'braban', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 53, name: '新开地和音', nameJp: '新開地かずね', title: 'braban', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 54, name: '伊丹杏子', nameJp: '伊丹杏子', title: 'braban', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 55, name: '冢本麻衣', nameJp: '塚本麻衣', title: 'braban', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 56, name: '鹤桥健太郎', nameJp: '鶴橋健太郎', title: 'braban', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 57, name: '芦屋宗一郎', nameJp: '芦屋宗一郎', title: 'braban', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 58, name: '大河原甚五郎', nameJp: '大河原甚五郎', title: 'braban', rank: '次要',
    bakusen: 50, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },

  // ===== E×E (エグゼ) =====
  {
    id: 59, name: '伏见藤矢', nameJp: '伏見藤矢', title: 'exe', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 60, name: '伏见真姬奈', nameJp: '伏見真姫奈', title: 'exe', rank: '60',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 61, name: '伏见铃乃', nameJp: '伏見すずの', title: 'exe', rank: '61',
    bakusen: 27, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 62, name: '野宫悠', nameJp: '野宮ゆう', title: 'exe', rank: '62',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 63, name: '笼夏希', nameJp: '籠夏希', title: 'exe', rank: '63',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 64, name: '贵船未绪', nameJp: '貴船未緒', title: 'exe', rank: '64',
    bakusen: 17, hair: '黑', eyes: '红', cv: '未知', isMain: true,
  },
  {
    id: 65, name: '白峰沙耶', nameJp: '白峰さや', title: 'exe', rank: '65',
    bakusen: 17, hair: '银', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 66, name: '日向红叶', nameJp: '日向もみじ', title: 'exe', rank: '66',
    bakusen: 17, hair: '红', eyes: '红', cv: '未知', isMain: true,
  },
  {
    id: 67, name: '八坂紫织', nameJp: '八坂紫織', title: 'exe', rank: '67',
    bakusen: 17, hair: '紫', eyes: '紫', cv: '未知', isMain: true,
  },
  {
    id: 68, name: '上御灵圆', nameJp: '上御霊円', title: 'exe', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 69, name: '加茂寿士', nameJp: '加茂寿士', title: 'exe', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 70, name: '八坂尚之', nameJp: '八坂尚之', title: 'exe', rank: '次要',
    bakusen: 45, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 71, name: '宇治上影臣', nameJp: '宇治上影臣', title: 'exe', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },

  // ===== 夏空彼方 (夏空カナタ) =====
  {
    id: 72, name: '朝仓壮太', nameJp: '朝倉壮太', title: 'natsora', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 73, name: '上坂茅羽耶', nameJp: '上坂茅羽耶', title: 'natsora', rank: '73',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 74, name: '三好由比子', nameJp: '三好由比子', title: 'natsora', rank: '74',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 75, name: '七条沙沙罗', nameJp: '七条さらら', title: 'natsora', rank: '75',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 76, name: '三好双叶', nameJp: '三好ふたば', title: 'natsora', rank: '次要',
    bakusen: 12, hair: '棕', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 77, name: '三好美帆', nameJp: '三好美帆', title: 'natsora', rank: '次要',
    bakusen: 27, hair: '棕', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 78, name: '六角五郎', nameJp: '六角五郎', title: 'natsora', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 79, name: '仁木夕张', nameJp: '仁木ゆうばり', title: 'natsora', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 80, name: '足利贞道', nameJp: '足利贞道', title: 'natsora', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 81, name: '七条克己', nameJp: '七条克己', title: 'natsora', rank: '次要',
    bakusen: 45, hair: '金', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 82, name: '上坂昭彦', nameJp: '上坂昭彦', title: 'natsora', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 83, name: '羽柴昌平', nameJp: '羽柴昌平', title: 'natsora', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 84, name: '京极史绪', nameJp: '京極史緒', title: 'natsora', rank: '次要',
    bakusen: 27, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },

  // ===== 天神乱漫 =====
  {
    id: 85, name: '千岁春树', nameJp: '千歳春樹', title: 'tenran', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '绿', cv: '未知', isMain: false,
  },
  {
    id: 86, name: '卯花之佐久夜姬', nameJp: '卯花之佐久夜姫', title: 'tenran', rank: '86',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 87, name: '龙胆琉璃', nameJp: '竜胆ルリ', title: 'tenran', rank: '87',
    bakusen: 16, hair: '蓝', eyes: '紫', cv: '未知', isMain: true,
  },
  {
    id: 88, name: '千岁佐奈', nameJp: '千歳佐奈', title: 'tenran', rank: '88',
    bakusen: 16, hair: '棕', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 89, name: '山吹葵', nameJp: '山吹葵', title: 'tenran', rank: '89',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 90, name: '常盘真寻', nameJp: '常盤まひろ', title: 'tenran', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 91, name: '乌羽紫', nameJp: '烏羽紫', title: 'tenran', rank: '次要',
    bakusen: 27, hair: '黑', eyes: '紫', cv: '未知', isMain: false,
  },
  {
    id: 92, name: '东云庵', nameJp: '東雲庵', title: 'tenran', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 93, name: '浅葱虎太郎', nameJp: '浅葱虎太郎', title: 'tenran', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 94, name: '木贼朋花', nameJp: '木賊朋花', title: 'tenran', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 95, name: '山吹涉', nameJp: '山吹渉', title: 'tenran', rank: '次要',
    bakusen: 27, hair: '金', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 96, name: '老竹干雄', nameJp: '老竹幹雄', title: 'tenran', rank: '次要',
    bakusen: 50, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 97, name: '上役之神', nameJp: '上役の神', title: 'tenran', rank: '次要',
    bakusen: 17, hair: '白', eyes: '异色', cv: '未知', isMain: false,
  },
  {
    id: 98, name: '市杵宍姬命', nameJp: '市杵宍姫命', title: 'tenran', rank: '次要',
    bakusen: 17, hair: '白', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 99, name: '苏芳', nameJp: '蘇芳', title: 'tenran', rank: '次要',
    bakusen: 17, hair: '红', eyes: '红', cv: '未知', isMain: false,
  },

  // ===== Noble☆Works (のーぶる☆わーくす) =====
  {
    id: 100, name: '藤岛匠', nameJp: '藤島匠', title: 'noble', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 101, name: '兼元灯里', nameJp: '兼元あかり', title: 'noble', rank: '101',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 102, name: '国广日向', nameJp: '国広ひなた', title: 'noble', rank: '102',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 103, name: '月山濑奈', nameJp: '月山瀬奈', title: 'noble', rank: '103',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 104, name: '正宗静流', nameJp: '正宗静流', title: 'noble', rank: '104',
    bakusen: 17, hair: '黑', eyes: '红', cv: '未知', isMain: true,
  },
  {
    id: 105, name: '长光麻夜', nameJp: '長光麻夜', title: 'noble', rank: '105',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 106, name: '兼元伊角', nameJp: '兼元伊角', title: 'noble', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 107, name: '兼元朱里', nameJp: '兼元朱里', title: 'noble', rank: '次要',
    bakusen: 27, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 108, name: '长曾祢虎铁', nameJp: '長曽祢虎鉄', title: 'noble', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 109, name: '源茅明', nameJp: '源茅明', title: 'noble', rank: '次要',
    bakusen: 27, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 110, name: '安纲萤', nameJp: '安綱ほたる', title: 'noble', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 111, name: '三条真琴', nameJp: '三条真琴', title: 'noble', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 112, name: '正宗晋海', nameJp: '正宗晋海', title: 'noble', rank: '次要',
    bakusen: 50, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },

  // ===== DRACU-RIOT! =====
  {
    id: 113, name: '六连佑斗', nameJp: '六連佑斗', title: 'dracu', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 114, name: '矢来美羽', nameJp: '矢来美羽', title: 'dracu', rank: '114',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 115, name: '布良梓', nameJp: '布良あずさ', title: 'dracu', rank: '115',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 116, name: '稻丛莉音', nameJp: '稲叢りおん', title: 'dracu', rank: '116',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 117, name: '艾莉娜·奥列格芙娜·阿文', nameJp: 'エリナ・オレゴヴナ・アヴェーン', title: 'dracu', rank: '117',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 118, name: '尼古拉·凯菲尤斯', nameJp: 'ニコラ・ケフィユス', title: 'dracu', rank: '次要',
    bakusen: 17, hair: '银', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 119, name: '大房妃依里', nameJp: '大房妃依里', title: 'dracu', rank: '次要',
    bakusen: 27, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 120, name: '荒神小夜', nameJp: '荒神小夜', title: 'dracu', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '红', cv: '未知', isMain: false,
  },
  {
    id: 121, name: '安娜·莱缇库鲁', nameJp: 'アンナ・リトルクル', title: 'dracu', rank: '次要',
    bakusen: 17, hair: '银', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 122, name: '淡路萌香', nameJp: '淡路萌香', title: 'dracu', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 123, name: '扇元树', nameJp: '扇元樹', title: 'dracu', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 124, name: '枡形兵马', nameJp: '枡形兵馬', title: 'dracu', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 125, name: '仓端直太', nameJp: '倉端直太', title: 'dracu', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 126, name: '索菲亚·伊万诺夫娜·杰娃', nameJp: 'ソフィア・イワノヴナ・ジェヴァ', title: 'dracu', rank: '次要',
    bakusen: 27, hair: '金', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 127, name: '山端枫', nameJp: '山端楓', title: 'dracu', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: false,
  },

  // ===== 天色幻想岛 =====
  {
    id: 128, name: '鹭森透', nameJp: '鷺森透', title: 'ailenote', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 129, name: '夏莉·沃利克', nameJp: 'シャリ・ウォーリック', title: 'ailenote', rank: '129',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 130, name: '天雾夕音', nameJp: '天霧夕音', title: 'ailenote', rank: '130',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 131, name: '白鹿爱莉', nameJp: '白鹿愛莉', title: 'ailenote', rank: '131',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 132, name: '真咲·加亚尔', nameJp: 'マサキ・ガヤール', title: 'ailenote', rank: '132',
    bakusen: 17, hair: '黑', eyes: '红', cv: '未知', isMain: true,
  },
  {
    id: 133, name: '缇娅·霍芬威尔芬', nameJp: 'ティア・ホーフェンウェルフェン', title: 'ailenote', rank: '次要',
    bakusen: 17, hair: '银', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 134, name: '火宫木乃香', nameJp: '火宮このか', title: 'ailenote', rank: '次要',
    bakusen: 17, hair: '红', eyes: '红', cv: '未知', isMain: false,
  },
  {
    id: 135, name: '弗朗西斯卡·帕拉米蒂', nameJp: 'フランチェスカ・パラミティ', title: 'ailenote', rank: '次要',
    bakusen: 27, hair: '金', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 136, name: '三刀屋实里', nameJp: '三刀屋実里', title: 'ailenote', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 137, name: '欧文·加亚尔', nameJp: 'オーウェン・ガヤール', title: 'ailenote', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 138, name: '雷纳德·沃利克', nameJp: 'レナード・ウォーリック', title: 'ailenote', rank: '次要',
    bakusen: 45, hair: '金', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 139, name: '虎仓博巳', nameJp: '虎倉ひろみ', title: 'ailenote', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },

  // ===== 天使☆嚣嚣 RE-BOOT! =====
  {
    id: 140, name: '谷风李空', nameJp: '谷風李空', title: 'rebo', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 141, name: '白雪乃爱', nameJp: '白雪乃愛', title: 'rebo', rank: '141',
    bakusen: 17, hair: '白', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 142, name: '谷风天音', nameJp: '谷風天音', title: 'rebo', rank: '142',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 143, name: '小云雀来海', nameJp: '小雲雀来海', title: 'rebo', rank: '143',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 144, name: '星河辉耶', nameJp: '星河かぐや', title: 'rebo', rank: '144',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 145, name: '高楯欧丽叶', nameJp: '高楯オリエ', title: 'rebo', rank: '145',
    bakusen: 17, hair: '黑', eyes: '红', cv: '未知', isMain: true,
  },
  {
    id: 146, name: '百里风实花', nameJp: '百里風実花', title: 'rebo', rank: '146',
    bakusen: 17, hair: '粉', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 147, name: '木下枫', nameJp: '木下楓', title: 'rebo', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 148, name: '白石千花', nameJp: '白石ちか', title: 'rebo', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: false,
  },
  {
    id: 149, name: '三国彩里', nameJp: '三国さいり', title: 'rebo', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 150, name: '谷风由月', nameJp: '谷風ゆづき', title: 'rebo', rank: '次要',
    bakusen: 27, hair: '黑', eyes: '蓝', cv: '未知', isMain: false,
  },

  // ===== LimeLight Lemonade Jam =====
  {
    id: 151, name: '冲浪雪鹰', nameJp: '沖浪雪鷹', title: 'limelight', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 152, name: '阳见惠凪', nameJp: '陽見恵凪', title: 'limelight', rank: '152',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 153, name: '隐杏珠', nameJp: '隠杏珠', title: 'limelight', rank: '153',
    bakusen: 17, hair: '棕', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 154, name: '岛越月望', nameJp: '嶌越月望', title: 'limelight', rank: '154',
    bakusen: 17, hair: '金', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 155, name: '二见原莉莉子', nameJp: '二見原莉々子', title: 'limelight', rank: '155',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 156, name: '砾川美玖', nameJp: '礫川美玖', title: 'limelight', rank: '156',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: true,
  },
  {
    id: 157, name: '茶园那优花', nameJp: '茶園那優花', title: 'limelight', rank: '次要',
    bakusen: 27, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 158, name: '不二卫哉', nameJp: '不二衛哉', title: 'limelight', rank: '次要',
    bakusen: 17, hair: '棕', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 159, name: '仲原大梦', nameJp: '仲原大夢', title: 'limelight', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 160, name: '砾川杰', nameJp: '礫川傑', title: 'limelight', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 161, name: '砾川雄真', nameJp: '礫川雄真', title: 'limelight', rank: '次要',
    bakusen: 45, hair: '黑', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 162, name: '一ノ瀬こまち', nameJp: '一ノ瀬こまち', title: 'limelight', rank: '次要',
    bakusen: 17, hair: '黑', eyes: '蓝', cv: '未知', isMain: false,
  },

];

export function getCharacter(id: number): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

export function getEnabledCharacters(): Character[] {
  return CHARACTERS;
}
