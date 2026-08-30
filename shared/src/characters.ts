import type { Character } from './types.js';

// 柚子社全 13 作角色数据集
// 角色姓名均取自 萌娘百科 (Moegirl)，按用户要求补全主要角色与其他角色。
// 猜谜维度：角色名 / 角色位次(rank) / 发色(hair) / 瞳色(eyes) / 作品年份(titleYear, 由 GAME_TITLES 派生) / 爆闪次数(bakusen) / 声优(cv)。
// rank 取真实位次：女主角为 '一号位'~'七号位'，其余为 '主角' / '次要' / '配角'。
// cv 使用作品署名的化名；同一位声优的多个化名见 divide.json（猜测时判定为"接近"）。
// isMain=true 表示可攻略女主角（猜谜目标），男主角/配角/其他为 false。
export const CHARACTERS: Character[] = [
  // ===== 魔女的夜宴 (サノバウィッチ) =====
  {
    id: 1, name: '绫地宁宁', nameJp: '綾地寧々', title: 'sannabitch', rank: '一号位',
    bakusen: 28, hair: '白', eyes: '紫', cv: '桐谷华', isMain: true,
  },
  {
    id: 2, name: '因幡巡', nameJp: '因幡めぐる', title: 'sannabitch', rank: '二号位',
    bakusen: 18, hair: '橙', eyes: '红', cv: '遥空', isMain: true,
  },
  {
    id: 3, name: '椎叶䌷', nameJp: '椎葉紬', title: 'sannabitch', rank: '三号位',
    bakusen: 14, hair: '灰', eyes: '蓝', cv: '黒咲そら', isMain: true,
  },
  {
    id: 4, name: '户隐憧子', nameJp: '戸隠憧子', title: 'sannabitch', rank: '四号位',
    bakusen: 26, hair: '黑', eyes: '棕', cv: '明科まなさ', isMain: true,
  },
  {
    id: 5, name: '假屋和奏', nameJp: '仮屋和奏', title: 'sannabitch', rank: '次要',
    bakusen: 14, hair: '金', eyes: '绿', cv: '小鸟居夕花', isMain: true,
  },
  {
    id: 6, name: '越路美穗', nameJp: '越路美穂', title: 'sannabitch', rank: '配角',
    bakusen: 0, hair: '蓝', eyes: '蓝', cv: '桃山いおん', isMain: false,
  },
  {
    id: 7, name: '相马七绪', nameJp: '相馬七緒', title: 'sannabitch', rank: '配角',
    bakusen: 0, hair: '粉', eyes: '棕', cv: '沢村かすみ', isMain: false,
  },
  {
    id: 8, name: '久岛佳苗', nameJp: '久島佳苗', title: 'sannabitch', rank: '配角',
    bakusen: 0, hair: '褐', eyes: '红', cv: '村田サナ', isMain: false,
  },
  {
    id: 9, name: '海道秀明', nameJp: '海道秀明', title: 'sannabitch', rank: '配角',
    bakusen: 0, hair: '紫', eyes: '灰', cv: '寺竹顺', isMain: false,
  },
  {
    id: 10, name: '保科太一', nameJp: '保科太一', title: 'sannabitch', rank: '配角',
    bakusen: 0, hair: '黑', eyes: '橙', cv: '鸠マン军曹', isMain: false,
  },
  {
    id: 11, name: '赤城', nameJp: '赤城', title: 'sannabitch', rank: '配角',
    bakusen: 0, hair: '蓝', eyes: '黄', cv: '真宫柚子', isMain: false,
  },
  {
    id: 12, name: '保科柊史', nameJp: '保科柊史', title: 'sannabitch', rank: '主角',
    bakusen: 0, hair: '棕', eyes: '红', cv: '无', isMain: false,
  },

  // ===== 千恋*万花 (千恋＊万花) =====
  {
    id: 13, name: '朝武芳乃', nameJp: '朝武芳乃', title: 'sengoku', rank: '一号位',
    bakusen: 23, hair: '白', eyes: '红', cv: '遥空', isMain: true,
  },
  {
    id: 14, name: '常陆茉子', nameJp: '常陸茉子', title: 'sengoku', rank: '二号位',
    bakusen: 31, hair: '黑', eyes: '绿', cv: '小鸟居夕花', isMain: true,
  },
  {
    id: 15, name: '丛雨', nameJp: 'むらさめ', title: 'sengoku', rank: '三号位',
    bakusen: 8, hair: '绿', eyes: '红', cv: '佐藤美柑', isMain: true,
  },
  {
    id: 16, name: '蕾娜·列支敦瑙尔', nameJp: 'レナ・リヒテンシュタイン', title: 'sengoku', rank: '四号位',
    bakusen: 18, hair: '金', eyes: '紫', cv: '沢泽砂羽', isMain: true,
  },
  {
    id: 17, name: '鞍马小春', nameJp: '鞍馬小春', title: 'sengoku', rank: '次要',
    bakusen: 20, hair: '粉', eyes: '黄', cv: '真宫柚子', isMain: true,
  },
  {
    id: 18, name: '马庭芦花', nameJp: '馬庭芦花', title: 'sengoku', rank: '次要',
    bakusen: 15, hair: '红', eyes: '蓝', cv: '西山冴希', isMain: true,
  },
  {
    id: 19, name: '鞍马廉太郎', nameJp: '鞍馬廉太郎', title: 'sengoku', rank: '配角',
    bakusen: 0, hair: '橙', eyes: '橙', cv: '真野枫', isMain: false,
  },
  {
    id: 20, name: '驹川美津叶', nameJp: '駒川美津葉', title: 'sengoku', rank: '配角',
    bakusen: 0, hair: '黑', eyes: '橙', cv: '樱川未央', isMain: false,
  },
  {
    id: 21, name: '朝武安晴', nameJp: '朝武安晴', title: 'sengoku', rank: '配角',
    bakusen: 0, hair: '灰', eyes: '未知', cv: '由嘉钝', isMain: false,
  },
  {
    id: 22, name: '鞍马玄十郎', nameJp: '鞍馬玄十郎', title: 'sengoku', rank: '配角',
    bakusen: 0, hair: '白', eyes: '灰', cv: '山崎高', isMain: false,
  },
  {
    id: 23, name: '中条比奈实', nameJp: '中条比奈実', title: 'sengoku', rank: '配角',
    bakusen: 0, hair: '蓝', eyes: '绿', cv: '木住葵', isMain: false,
  },
  {
    id: 24, name: '猪谷心子', nameJp: '猪谷心子', title: 'sengoku', rank: '配角',
    bakusen: 0, hair: '绿', eyes: '灰', cv: 'ちとせ杏', isMain: false,
  },
  {
    id: 25, name: '朝武秋穗', nameJp: '朝武秋穂', title: 'sengoku', rank: '配角',
    bakusen: 0, hair: '白', eyes: '蓝', cv: '北见六花', isMain: false,
  },
  {
    id: 26, name: '有地将臣', nameJp: '有地将臣', title: 'sengoku', rank: '主角',
    bakusen: 0, hair: '棕', eyes: '棕', cv: '无', isMain: false,
  },

  // ===== RIDDLE JOKER =====
  {
    id: 27, name: '三司绫濑', nameJp: '三司あぐり', title: 'riddle', rank: '一号位',
    bakusen: 30, hair: '粉', eyes: '紫', cv: '沢泽砂羽', isMain: true,
  },
  {
    id: 28, name: '在原七海', nameJp: '在原七海', title: 'riddle', rank: '二号位',
    bakusen: 36, hair: '金', eyes: '红', cv: '楠原结衣', isMain: true,
  },
  {
    id: 29, name: '式部茉优', nameJp: '式部茉優', title: 'riddle', rank: '三号位',
    bakusen: 25, hair: '绿', eyes: '绿', cv: '西园纯夏', isMain: true,
  },
  {
    id: 30, name: '二条院羽月', nameJp: '二条院羽月', title: 'riddle', rank: '四号位',
    bakusen: 28, hair: '黑', eyes: '紫', cv: '遥空', isMain: true,
  },
  {
    id: 31, name: '壬生千咲', nameJp: '壬生ちさき', title: 'riddle', rank: '次要',
    bakusen: 20, hair: '红', eyes: '蓝', cv: '夏和小', isMain: true,
  },
  {
    id: 32, name: '柿本香里', nameJp: '柿本香里', title: 'riddle', rank: '配角',
    bakusen: 0, hair: '褐', eyes: '黄', cv: '川岛莉乃', isMain: false,
  },
  {
    id: 33, name: '周防恭平', nameJp: '周防恭平', title: 'riddle', rank: '配角',
    bakusen: 0, hair: '蓝', eyes: '灰', cv: '花园芽衣', isMain: false,
  },
  {
    id: 34, name: '在原隆之介', nameJp: '在原隆之介', title: 'riddle', rank: '配角',
    bakusen: 0, hair: '棕', eyes: '金', cv: '宝殿亭月', isMain: false,
  },
  {
    id: 35, name: '伊势笃纪', nameJp: '伊勢篤紀', title: 'riddle', rank: '配角',
    bakusen: 0, hair: '黑', eyes: '蓝', cv: '一条和矢', isMain: false,
  },
  {
    id: 36, name: '在原晓', nameJp: '在原暁', title: 'riddle', rank: '主角',
    bakusen: 0, hair: '黑', eyes: '棕', cv: '无', isMain: false,
  },

  // ===== 星光咖啡馆与死神之蝶 (喫茶ステラと死神の蝶) =====
  {
    id: 37, name: '明月栞那', nameJp: '明月かんな', title: 'stella', rank: '一号位',
    bakusen: 24, hair: '白', eyes: '紫', cv: '麻仓亚恋', isMain: true,
  },
  {
    id: 38, name: '四季夏目', nameJp: '四季なつめ', title: 'stella', rank: '二号位',
    bakusen: 21, hair: '黑', eyes: '金', cv: '夏和小', isMain: true,
  },
  {
    id: 39, name: '墨染希', nameJp: '墨染希', title: 'stella', rank: '三号位',
    bakusen: 12, hair: '橙', eyes: '紫', cv: '上原葵', isMain: true,
  },
  {
    id: 40, name: '火打谷爱衣', nameJp: '火打谷あい', title: 'stella', rank: '四号位',
    bakusen: 12, hair: '紫', eyes: '绿', cv: '音来内丽', isMain: true,
  },
  {
    id: 41, name: '汐山凉音', nameJp: '汐山涼音', title: 'stella', rank: '次要',
    bakusen: 13, hair: '粉', eyes: '蓝', cv: '木之美希', isMain: true,
  },
  {
    id: 42, name: '御帝贵妃', nameJp: '御帝貴紀', title: 'stella', rank: '配角',
    bakusen: 0, hair: '灰', eyes: '黄', cv: '宝殿亭千枚', isMain: false,
  },
  {
    id: 43, name: '高岭和史', nameJp: '高嶺和史', title: 'stella', rank: '配角',
    bakusen: 0, hair: '黑', eyes: '棕', cv: '鬼瓦虎铁', isMain: false,
  },
  {
    id: 44, name: '汐山宏人', nameJp: '汐山宏人', title: 'stella', rank: '配角',
    bakusen: 0, hair: '灰', eyes: '蓝', cv: '柠檬泽一', isMain: false,
  },
  {
    id: 45, name: '高岭昂晴', nameJp: '高嶺昂晴', title: 'stella', rank: '主角',
    bakusen: 0, hair: '棕', eyes: '棕', cv: '无', isMain: false,
  },

  // ===== 管乐恋曲! -The bonds of melody- (ぶらばん!) =====
  {
    id: 46, name: '香住纯', nameJp: '香住純', title: 'braban', rank: '主角',
    bakusen: 0, hair: '棕', eyes: '棕', cv: '无', isMain: false,
  },
  {
    id: 47, name: '中之岛妙', nameJp: '中之島みお', title: 'braban', rank: '一号位',
    bakusen: 5, hair: '褐', eyes: '红', cv: '榊原由依', isMain: true,
  },
  {
    id: 48, name: '海老原水濑', nameJp: '海老原みなせ', title: 'braban', rank: '二号位',
    bakusen: 7, hair: '红', eyes: '青', cv: '安玖深音', isMain: true,
  },
  {
    id: 49, name: '今宫纪子', nameJp: '今宮紀子', title: 'braban', rank: '三号位',
    bakusen: 7, hair: '黑', eyes: '绿', cv: '松永雪希', isMain: true,
  },
  {
    id: 50, name: '云雀丘由贵', nameJp: '雲雀丘ゆき', title: 'braban', rank: '四号位',
    bakusen: 6, hair: '金', eyes: '紫', cv: '齐藤爱子', isMain: true,
  },
  {
    id: 51, name: '御影须美', nameJp: '御影すみ', title: 'braban', rank: '五号位',
    bakusen: 6, hair: '紫', eyes: '褐', cv: 'みる', isMain: true,
  },
  {
    id: 52, name: '朝雾春奈', nameJp: '朝霧はるな', title: 'braban', rank: '配角',
    bakusen: 0, hair: '灰', eyes: '红', cv: '三咲里奈', isMain: false,
  },
  {
    id: 53, name: '新开地和音', nameJp: '新開地かずね', title: 'braban', rank: '配角',
    bakusen: 0, hair: '绿', eyes: '蓝', cv: '野神奈奈', isMain: false,
  },
  {
    id: 54, name: '伊丹杏子', nameJp: '伊丹杏子', title: 'braban', rank: '配角',
    bakusen: 0, hair: '橙', eyes: '棕', cv: '矢泽泉', isMain: false,
  },
  {
    id: 55, name: '冢本麻衣', nameJp: '塚本麻衣', title: 'braban', rank: '配角',
    bakusen: 0, hair: '绿', eyes: '黄', cv: '远野梵', isMain: false,
  },
  {
    id: 56, name: '鹤桥健太郎', nameJp: '鶴橋健太郎', title: 'braban', rank: '配角',
    bakusen: 0, hair: '棕', eyes: '棕', cv: '中本伸辅', isMain: false,
  },
  {
    id: 57, name: '芦屋宗一郎', nameJp: '芦屋宗一郎', title: 'braban', rank: '配角',
    bakusen: 0, hair: '白', eyes: '红', cv: '四季透', isMain: false,
  },
  {
    id: 58, name: '大河原甚五郎', nameJp: '大河原甚五郎', title: 'braban', rank: '配角',
    bakusen: 0, hair: '灰', eyes: '红', cv: '一条和矢', isMain: false,
  },

  // ===== E×E (エグゼ) =====
  {
    id: 59, name: '伏见藤矢', nameJp: '伏見藤矢', title: 'exe', rank: '主角',
    bakusen: 0, hair: '棕', eyes: '蓝', cv: '无', isMain: false,
  },
  {
    id: 60, name: '伏见真姬奈', nameJp: '伏見真姫奈', title: 'exe', rank: '配角',
    bakusen: 0, hair: '粉', eyes: '红', cv: '榊るな', isMain: false,
  },
  {
    id: 61, name: '伏见铃乃', nameJp: '伏見すずの', title: 'exe', rank: '配角',
    bakusen: 0, hair: '粉', eyes: '蓝', cv: '野神奈奈', isMain: false,
  },
  {
    id: 62, name: '野宫悠', nameJp: '野宮ゆう', title: 'exe', rank: '一号位',
    bakusen: 10, hair: '紫', eyes: '紫', cv: '青山由香里', isMain: true,
  },
  {
    id: 63, name: '笼夏希', nameJp: '籠夏希', title: 'exe', rank: '二号位',
    bakusen: 8, hair: '黄', eyes: '绿', cv: 'みる', isMain: true,
  },
  {
    id: 64, name: '贵船未绪', nameJp: '貴船未緒', title: 'exe', rank: '三号位',
    bakusen: 9, hair: '红', eyes: '红', cv: '风音', isMain: true,
  },
  {
    id: 65, name: '白峰沙耶', nameJp: '白峰さや', title: 'exe', rank: '次要',
    bakusen: 4, hair: '棕', eyes: '棕', cv: '一色光', isMain: true,
  },
  {
    id: 66, name: '日向红叶', nameJp: '日向もみじ', title: 'exe', rank: '次要',
    bakusen: 2, hair: '紫', eyes: '黄', cv: '佐本二厘', isMain: true,
  },
  {
    id: 67, name: '八坂紫织', nameJp: '八坂紫織', title: 'exe', rank: '配角',
    bakusen: 0, hair: '白', eyes: '红', cv: '成濑未亚', isMain: false,
  },
  {
    id: 68, name: '上御灵圆', nameJp: '上御霊円', title: 'exe', rank: '次要',
    bakusen: 4, hair: '棕', eyes: '绿', cv: '榊原由依', isMain: true,
  },
  {
    id: 69, name: '加茂寿士', nameJp: '加茂寿士', title: 'exe', rank: '配角',
    bakusen: 0, hair: '黄', eyes: '深红', cv: '杉崎和哉', isMain: false,
  },
  {
    id: 70, name: '八坂尚之', nameJp: '八坂尚之', title: 'exe', rank: '配角',
    bakusen: 0, hair: '紫', eyes: '红', cv: '小次郎', isMain: false,
  },
  {
    id: 71, name: '宇治上影臣', nameJp: '宇治上影臣', title: 'exe', rank: '配角',
    bakusen: 0, hair: '棕', eyes: '绿', cv: 'ドテラ4号', isMain: false,
  },

  // ===== 夏空彼方 (夏空カナタ) =====
  {
    id: 72, name: '朝仓壮太', nameJp: '朝倉壮太', title: 'natsora', rank: '主角',
    bakusen: 0, hair: '棕', eyes: '棕', cv: '无', isMain: false,
  },
  {
    id: 73, name: '上坂茅羽耶', nameJp: '上坂茅羽耶', title: 'natsora', rank: '一号位',
    bakusen: 8, hair: '黑', eyes: '青', cv: '夏野冰', isMain: true,
  },
  {
    id: 74, name: '三好由比子', nameJp: '三好由比子', title: 'natsora', rank: '二号位',
    bakusen: 6, hair: '橙', eyes: '绿', cv: '成濑未亚', isMain: true,
  },
  {
    id: 75, name: '七条沙沙罗', nameJp: '七条さらら', title: 'natsora', rank: '三号位',
    bakusen: 9, hair: '绿', eyes: '紫', cv: 'みる', isMain: true,
  },
  {
    id: 76, name: '三好双叶', nameJp: '三好ふたば', title: 'natsora', rank: '配角',
    bakusen: 0, hair: '橙', eyes: '绿', cv: '民安友绘', isMain: false,
  },
  {
    id: 77, name: '三好美帆', nameJp: '三好美帆', title: 'natsora', rank: '配角',
    bakusen: 0, hair: '橙', eyes: '绿', cv: '白井绫乃', isMain: false,
  },
  {
    id: 78, name: '六角五郎', nameJp: '六角五郎', title: 'natsora', rank: '配角',
    bakusen: 0, hair: '粉红', eyes: '金', cv: 'ヘルシー太郎', isMain: false,
  },
  {
    id: 79, name: '仁木夕张', nameJp: '仁木ゆうばり', title: 'natsora', rank: '配角',
    bakusen: 0, hair: '褐', eyes: '绿', cv: '小林智子', isMain: false,
  },
  {
    id: 80, name: '足利贞道', nameJp: '足利贞道', title: 'natsora', rank: '配角',
    bakusen: 0, hair: '金', eyes: '绿', cv: '子太明', isMain: false,
  },
  {
    id: 81, name: '七条克己', nameJp: '七条克己', title: 'natsora', rank: '配角',
    bakusen: 0, hair: '紫', eyes: '紫', cv: 'ドテラ4号', isMain: false,
  },
  {
    id: 82, name: '上坂昭彦', nameJp: '上坂昭彦', title: 'natsora', rank: '配角',
    bakusen: 0, hair: '灰', eyes: '青', cv: '南武哲好', isMain: false,
  },
  {
    id: 83, name: '羽柴昌平', nameJp: '羽柴昌平', title: 'natsora', rank: '配角',
    bakusen: 0, hair: '黑', eyes: '灰', cv: '广末凉', isMain: false,
  },
  {
    id: 84, name: '京极史绪', nameJp: '京極史緒', title: 'natsora', rank: '配角',
    bakusen: 0, hair: '绿', eyes: '紫', cv: '川岛莉乃', isMain: false,
  },

  // ===== 天神乱漫 =====
  {
    id: 85, name: '千岁春树', nameJp: '千歳春樹', title: 'tenran', rank: '主角',
    bakusen: 0, hair: '灰', eyes: '橘', cv: '无', isMain: false,
  },
  {
    id: 86, name: '卯花之佐久夜姬', nameJp: '卯花之佐久夜姫', title: 'tenran', rank: '一号位',
    bakusen: 10, hair: '黑', eyes: '红', cv: '高志麻矢', isMain: true,
  },
  {
    id: 87, name: '龙胆琉璃', nameJp: '竜胆ルリ', title: 'tenran', rank: '二号位',
    bakusen: 9, hair: '银', eyes: '绿', cv: '成濑未亚', isMain: true,
  },
  {
    id: 88, name: '千岁佐奈', nameJp: '千歳佐奈', title: 'tenran', rank: '三号位',
    bakusen: 5, hair: '金', eyes: '蓝', cv: '安玖深音', isMain: true,
  },
  {
    id: 89, name: '山吹葵', nameJp: '山吹葵', title: 'tenran', rank: '四号位',
    bakusen: 5, hair: '棕', eyes: '金', cv: '佐本二厘', isMain: true,
  },
  {
    id: 90, name: '常盘真寻', nameJp: '常盤まひろ', title: 'tenran', rank: '次要',
    bakusen: 5, hair: '粉', eyes: '棕', cv: '远野梵', isMain: true,
  },
  {
    id: 91, name: '乌羽紫', nameJp: '烏羽紫', title: 'tenran', rank: '次要',
    bakusen: 11, hair: '红', eyes: '绿', cv: '夏野冰', isMain: true,
  },
  {
    id: 92, name: '东云庵', nameJp: '東雲庵', title: 'tenran', rank: '配角',
    bakusen: 0, hair: '紫灰', eyes: '蓝', cv: '本多启吾', isMain: false,
  },
  {
    id: 93, name: '浅葱虎太郎', nameJp: '浅葱虎太郎', title: 'tenran', rank: '配角',
    bakusen: 0, hair: '绿', eyes: '茶', cv: '榊原由依', isMain: false,
  },
  {
    id: 94, name: '木贼朋花', nameJp: '木賊朋花', title: 'tenran', rank: '配角',
    bakusen: 5, hair: '蓝', eyes: '蓝', cv: 'みる', isMain: true, // 不可攻略但是有CG，isMain存疑
  },
  {
    id: 95, name: '山吹涉', nameJp: '山吹渉', title: 'tenran', rank: '配角',
    bakusen: 0, hair: '黄', eyes: '棕', cv: '五行荠', isMain: false,
  },
  {
    id: 96, name: '老竹干雄', nameJp: '老竹幹雄', title: 'tenran', rank: '配角',
    bakusen: 0, hair: '灰', eyes: '棕', cv: '藤流水', isMain: false,
  },
  {
    id: 97, name: '市杵宍姬命', nameJp: '市杵宍姫命', title: 'tenran', rank: '七号位',
    bakusen: 0, hair: '紫', eyes: '紫', cv: '由加奈', isMain: true,
  },
  {
    id: 98, name: '苏芳', nameJp: '蘇芳', title: 'tenran', rank: '配角',
    bakusen: 0, hair: '红', eyes: '红', cv: '阿澄佳奈', isMain: false,
  },

  // ===== Noble☆Works (のーぶる☆わーくす) =====
  {
    id: 99, name: '藤岛匠', nameJp: '藤島匠', title: 'noble', rank: '主角',
    bakusen: 0, hair: '红', eyes: '绿', cv: '无', isMain: false,
  },
  {
    id: 100, name: '兼元灯里', nameJp: '兼元あかり', title: 'noble', rank: '一号位',
    bakusen: 9, hair: '金', eyes: '绿', cv: '真中海', isMain: true,
  },
  {
    id: 101, name: '国广日向', nameJp: '国広ひなた', title: 'noble', rank: '四号位',
    bakusen: 13, hair: '粉', eyes: '蓝', cv: '佐佐露香', isMain: true,
  },
  {
    id: 102, name: '月山濑奈', nameJp: '月山瀬奈', title: 'noble', rank: '二号位',
    bakusen: 10, hair: '绿', eyes: '金', cv: '五行荠', isMain: true,
  },
  {
    id: 103, name: '正宗静流', nameJp: '正宗静流', title: 'noble', rank: '三号位',
    bakusen: 30, hair: '黑', eyes: '红', cv: '夏野冰', isMain: true,
  },
  {
    id: 104, name: '长光麻夜', nameJp: '長光麻夜', title: 'noble', rank: '五号位',
    bakusen: 15, hair: '蓝', eyes: '红', cv: '青叶苹果', isMain: true,
  },
  {
    id: 105, name: '兼元伊角', nameJp: '兼元伊角', title: 'noble', rank: '配角',
    bakusen: 0, hair: '棕', eyes: '绿', cv: '上州汤姆', isMain: false,
  },
  {
    id: 106, name: '兼元朱里', nameJp: '兼元朱里', title: 'noble', rank: '配角',
    bakusen: 0, hair: '红', eyes: '绿', cv: '岛真闲', isMain: false,
  },
  {
    id: 107, name: '长曾祢虎铁', nameJp: '長曽祢虎鉄', title: 'noble', rank: '配角',
    bakusen: 0, hair: '黑', eyes: '灰绿', cv: '佐藤健吾', isMain: false,
  },
  {
    id: 108, name: '源茅明', nameJp: '源茅明', title: 'noble', rank: '配角',
    bakusen: 0, hair: '黑', eyes: '黄', cv: '井村屋穗乃香', isMain: false,
  },
  {
    id: 109, name: '安纲萤', nameJp: '安綱ほたる', title: 'noble', rank: '次要',
    bakusen: 2, hair: '紫', eyes: '紫', cv: 'みる', isMain: true,
  },
  {
    id: 110, name: '三条真琴', nameJp: '三条真琴', title: 'noble', rank: '配角',
    bakusen: 0, hair: '红', eyes: '红', cv: '铃木兰', isMain: false,
  },
  {
    id: 111, name: '正宗晋海', nameJp: '正宗晋海', title: 'noble', rank: '配角',
    bakusen: 0, hair: '白', eyes: '蓝', cv: '事务台车', isMain: false,
  },

  // ===== DRACU-RIOT! =====
  {
    id: 112, name: '六连佑斗', nameJp: '六連佑斗', title: 'dracu', rank: '主角',
    bakusen: 0, hair: '黑', eyes: '金', cv: '无', isMain: false,
  },
  {
    id: 113, name: '矢来美羽', nameJp: '矢来美羽', title: 'dracu', rank: '一号位',
    bakusen: 26, hair: '红', eyes: '褐', cv: '夏野冰', isMain: true,
  },
  {
    id: 114, name: '布良梓', nameJp: '布良あずさ', title: 'dracu', rank: '二号位',
    bakusen: 31, hair: '黑', eyes: '蓝', cv: '佐藤雫', isMain: true,
  },
  {
    id: 115, name: '稻丛莉音', nameJp: '稲叢りおん', title: 'dracu', rank: '三号位',
    bakusen: 18, hair: '红', eyes: '棕', cv: '鲇川日向', isMain: true,
  },
  {
    id: 116, name: '艾莉娜·奥列格芙娜·阿文', nameJp: 'エリナ・オレゴヴナ・アヴェーン', title: 'dracu', rank: '四号位',
    bakusen: 23, hair: '银', eyes: '红', cv: '铃木惠莉央', isMain: true,
  },
  {
    id: 117, name: '尼古拉·凯菲尤斯', nameJp: 'ニコラ・ケフィユス', title: 'dracu', rank: '次要',
    bakusen: 14, hair: '金', eyes: '红', cv: '浅野柚子', isMain: true,
  },
  {
    id: 118, name: '大房妃依里', nameJp: '大房妃依里', title: 'dracu', rank: '配角',
    bakusen: 0, hair: '蓝', eyes: '棕', cv: '金松由花', isMain: false,
  },
  {
    id: 119, name: '荒神小夜', nameJp: '荒神小夜', title: 'dracu', rank: '配角',
    bakusen: 0, hair: '褐', eyes: '红', cv: '青叶苹果', isMain: false,
  },
  {
    id: 120, name: '安娜·莱缇库鲁', nameJp: 'アンナ・リトルクル', title: 'dracu', rank: '配角',
    bakusen: 0, hair: '紫', eyes: '蓝', cv: '川岛莉乃', isMain: false,
  },
  {
    id: 121, name: '淡路萌香', nameJp: '淡路萌香', title: 'dracu', rank: '配角',
    bakusen: 0, hair: '粉', eyes: '未知', cv: '高井户雫', isMain: false,
  },
  {
    id: 122, name: '扇元树', nameJp: '扇元樹', title: 'dracu', rank: '配角',
    bakusen: 0, hair: '绿', eyes: '金', cv: 'One More Chance', isMain: false,
  },
  {
    id: 123, name: '枡形兵马', nameJp: '枡形兵馬', title: 'dracu', rank: '配角',
    bakusen: 0, hair: '棕', eyes: '金', cv: 'デビルかとう', isMain: false,
  },
  {
    id: 124, name: '仓端直太', nameJp: '倉端直太', title: 'dracu', rank: '配角',
    bakusen: 0, hair: '紫', eyes: '金', cv: '古河彻人', isMain: false,
  },
  {
    id: 125, name: '索菲亚·伊万诺夫娜·杰娃', nameJp: 'ソフィア・イワノヴナ・ジェヴァ', title: 'dracu', rank: '配角',
    bakusen: 0, hair: '黄', eyes: '棕', cv: '未知', isMain: false,
  },
  {
    id: 126, name: '山端枫', nameJp: '山端楓', title: 'dracu', rank: '配角',
    bakusen: 0, hair: '黑', eyes: '绿', cv: '未知', isMain: false,
  },

  // ===== 天色幻想岛 =====
  {
    id: 127, name: '鹭森透', nameJp: '鷺森透', title: 'ailenote', rank: '主角',
    bakusen: 0, hair: '黑', eyes: '棕', cv: '无', isMain: false,
  },
  {
    id: 128, name: '夏莉·沃利克', nameJp: 'シャリ・ウォーリック', title: 'ailenote', rank: '一号位',
    bakusen: 25, hair: '黄', eyes: '橙', cv: '北见六花', isMain: true,
  },
  {
    id: 129, name: '天雾夕音', nameJp: '天霧夕音', title: 'ailenote', rank: '二号位',
    bakusen: 20, hair: '黑', eyes: '绿', cv: '登代田濑良', isMain: true,
  },
  {
    id: 130, name: '白鹿爱莉', nameJp: '白鹿愛莉', title: 'ailenote', rank: '三号位',
    bakusen: 9, hair: '蓝', eyes: '蓝', cv: '夏野冰', isMain: true,
  },
  {
    id: 131, name: '真咲·加亚尔', nameJp: 'マサキ・ガヤール', title: 'ailenote', rank: '四号位',
    bakusen: 17, hair: '红', eyes: '紫', cv: '桐谷华', isMain: true,
  },
  {
    id: 132, name: '缇娅·霍芬威尔芬', nameJp: 'ティア・ホーフェンウェルフェン', title: 'ailenote', rank: '次要',
    bakusen: 13, hair: '绿', eyes: '黄', cv: '雪野玉', isMain: true,
  },
  {
    id: 133, name: '火宫木乃香', nameJp: '火宮このか', title: 'ailenote', rank: '次要',
    bakusen: 27, hair: '白', eyes: '红', cv: '雪都沙绪梨', isMain: true,
  },
  {
    id: 134, name: '弗朗西斯卡·帕拉米蒂', nameJp: 'フランチェスカ・パラミティ', title: 'ailenote', rank: '配角',
    bakusen: 0, hair: '粉', eyes: '橙', cv: '井之上花', isMain: false,
  },
  {
    id: 135, name: '三刀屋实里', nameJp: '三刀屋実里', title: 'ailenote', rank: '配角',
    bakusen: 0, hair: '紫', eyes: '红', cv: '真中海', isMain: false,
  },
  {
    id: 136, name: '欧文·加亚尔', nameJp: 'オーウェン・ガヤール', title: 'ailenote', rank: '配角',
    bakusen: 0, hair: '棕', eyes: '棕', cv: '风雾瞬', isMain: false,
  },
  {
    id: 137, name: '雷纳德·沃利克', nameJp: 'レナード・ウォーリック', title: 'ailenote', rank: '配角',
    bakusen: 0, hair: '金', eyes: '红', cv: '大石惠三', isMain: false,
  },
  {
    id: 138, name: '虎仓博巳', nameJp: '虎倉ひろみ', title: 'ailenote', rank: '配角',
    bakusen: 0, hair: '黑', eyes: '黑', cv: '一条和矢', isMain: false,
  },

  // ===== 天使☆嚣嚣 RE-BOOT! =====
  {
    id: 139, name: '谷风李空', nameJp: '谷風李空', title: 'rebo', rank: '主角',
    bakusen: 0, hair: '黑', eyes: '绿', cv: '无', isMain: false,
  },
  {
    id: 140, name: '白雪乃爱', nameJp: '白雪乃愛', title: 'rebo', rank: '一号位',
    bakusen: 22, hair: '金', eyes: '蓝', cv: '濑户乃麻里惠', isMain: true,
  },
  {
    id: 141, name: '谷风天音', nameJp: '谷風天音', title: 'rebo', rank: '二号位',
    bakusen: 33, hair: '粉', eyes: '绿', cv: '夏和小', isMain: true,
  },
  {
    id: 142, name: '小云雀来海', nameJp: '小雲雀来海', title: 'rebo', rank: '三号位',
    bakusen: 15, hair: '蓝粉渐变', eyes: '金', cv: '柳瞳', isMain: true,
  },
  {
    id: 143, name: '星河辉耶', nameJp: '星河かぐや', title: 'rebo', rank: '四号位',
    bakusen: 34, hair: '黑', eyes: '红', cv: '遥空', isMain: true,
  },
  {
    id: 144, name: '高楯欧丽叶', nameJp: '高楯オリエ', title: 'rebo', rank: '次要',
    bakusen: 26, hair: '绿', eyes: '紫', cv: '夏野冰', isMain: true,
  },
  {
    id: 145, name: '百里风实花', nameJp: '百里風実花', title: 'rebo', rank: '次要',
    bakusen: 31, hair: '红', eyes: '蓝', cv: '明羽杏子', isMain: true,
  },
  {
    id: 146, name: '木下枫', nameJp: '木下楓', title: 'rebo', rank: '配角',
    bakusen: 0, hair: '银', eyes: '粉', cv: '山吹丽', isMain: false,
  },
  {
    id: 147, name: '白石千花', nameJp: '白石ちか', title: 'rebo', rank: '配角',
    bakusen: 0, hair: '棕橙挑染', eyes: '绿', cv: '饴川紫乃', isMain: false,
  },
  {
    id: 148, name: '三国彩里', nameJp: '三国さいり', title: 'rebo', rank: '配角',
    bakusen: 3, hair: '棕', eyes: '绿', cv: '夏野派因', isMain: false, // 不可攻略但是有CG，isMain存疑
  },
  {
    id: 149, name: '谷风由月', nameJp: '谷風ゆづき', title: 'rebo', rank: '配角',
    bakusen: 0, hair: '紫', eyes: '金', cv: '神無月ほのか', isMain: false,
  },
  {
    id: 150, name: '克拉维', nameJp: 'クラヴィー', title: 'rebo', rank: '配角',
    bakusen: 0, hair: '银', eyes: '金', cv: 'いなりうづき', isMain: false,
  },
  {
    id: 151, name: '五岛老师', nameJp: '五島先生', title: 'rebo', rank: '配角',
    bakusen: 0, hair: '褐', eyes: '绿', cv: '川峰すずか', isMain: false,
  },
  {
    id: 152, name: '月乃', nameJp: '月乃', title: 'rebo', rank: '配角',
    bakusen: 0, hair: '蓝', eyes: '金', cv: '逢坂菜乃花', isMain: false,
  },
  {
    id: 153, name: '苏蒂', nameJp: 'シュテイ', title: 'rebo', rank: '配角',
    bakusen: 0, hair: '银', eyes: '银', cv: '藤宫ちよ', isMain: false,
  },
  {
    id: 154, name: '维嘉', nameJp: 'ヴェガ', title: 'rebo', rank: '配角',
    bakusen: 0, hair: '白', eyes: '金', cv: '麦畑穗香', isMain: false,
  },
  {
    id: 155, name: '斯内乌大王子', nameJp: 'スネーウ国第一王子', title: 'rebo', rank: '配角',
    bakusen: 0, hair: '紫', eyes: '红', cv: '出汁名岁', isMain: false,
  },
  {
    id: 156, name: '迷路的孩子', nameJp: '迷い子', title: 'rebo', rank: '配角',
    bakusen: 0, hair: '黑', eyes: '蓝', cv: '川峰すずか', isMain: false,
  },


  // ===== LimeLight Lemonade Jam =====
  {
    id: 157, name: '冲浪雪鹰', nameJp: '沖浪雪鷹', title: 'limelight', rank: '主角',
    bakusen: 0, hair: '黑', eyes: '绿', cv: '无', isMain: false,
  },
  {
    id: 158, name: '阳见惠凪', nameJp: '陽見恵凪', title: 'limelight', rank: '一号位',
    bakusen: 31, hair: '粉', eyes: '粉', cv: '御园纱纱', isMain: true,
  },
  {
    id: 159, name: '隐杏珠', nameJp: '隠杏珠', title: 'limelight', rank: '二号位',
    bakusen: 38, hair: '紫粉接发', eyes: '绿', cv: '天季日和', isMain: true,
  },
  {
    id: 160, name: '岛越月望', nameJp: '嶌越月望', title: 'limelight', rank: '三号位',
    bakusen: 9, hair: '金', eyes: '蓝', cv: '虎濑がお', isMain: true,
  },
  {
    id: 161, name: '二见原莉莉子', nameJp: '二見原莉々子', title: 'limelight', rank: '四号位',
    bakusen: 20, hair: '红', eyes: '金', cv: 'しましまはかせ', isMain: true,
  },
  {
    id: 162, name: '砾川美玖', nameJp: '礫川美玖', title: 'limelight', rank: '次要',
    bakusen: 11, hair: '灰', eyes: '蓝', cv: '楠原结衣', isMain: true,
  },
  {
    id: 163, name: '茶园那优花', nameJp: '茶園那優花', title: 'limelight', rank: '次要',
    bakusen: 31, hair: '紫', eyes: '黄', cv: '夏和小', isMain: true,
  },
  {
    id: 164, name: '不二卫哉', nameJp: '不二衛哉', title: 'limelight', rank: '配角',
    bakusen: 0, hair: '棕', eyes: '黄', cv: '冬ノ熊肉', isMain: false,
  },
  {
    id: 165, name: '仲原大梦', nameJp: '仲原大夢', title: 'limelight', rank: '配角',
    bakusen: 0, hair: '棕', eyes: '黄', cv: '梅咲查理', isMain: false,
  },
  {
    id: 166, name: '砾川杰', nameJp: '礫川傑', title: 'limelight', rank: '配角',
    bakusen: 0, hair: '灰', eyes: '蓝', cv: '天河雄成', isMain: false,
  },
  {
    id: 167, name: '砾川雄真', nameJp: '礫川雄真', title: 'limelight', rank: '配角',
    bakusen: 0, hair: '灰', eyes: '蓝', cv: '九財翼', isMain: false,
  },

];

export function getCharacter(id: number): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

export function getEnabledCharacters(): Character[] {
  return CHARACTERS;
}