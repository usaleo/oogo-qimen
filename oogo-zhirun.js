// oogo-zhirun.js - OOGO 专属真·置闰法核心引擎
const OogoZhiRun = {
  calculate: function(year, month, day, hour, min) {
    // 1. 调取底层历法库获取当前时间的 Lunar 对象
    const lunar = ThreeMeta.Lunar.fromYmdHms(year, month, day, hour, min, 0);

    // 2. 寻找【符头】
    // 日干支中，甲、己为符头。天干 0-9，甲为0，己为5。
    const dayGanIndex = lunar.getDayGanIndexExact(); 
    const offset = dayGanIndex % 5; // 距离本局符头差了几天
    const fuTouLunar = lunar.next(-offset); // 时间倒推，锁定符头当天的历法对象

    // 3. 判定【上中下元】
    // 取符头当天的地支索引 (0:子, 1:丑, 2:寅... 11:亥)
    const fuTouZhiIndex = fuTouLunar.getDayZhiIndexExact(); 
    let yuan = 0; // 0:上元, 1:中元, 2:下元
    
    // 子午卯酉(0,6,3,9)为上元；寅申巳亥(2,8,5,11)为中元；辰戌丑未(4,10,1,7)为下元
    if ([0, 3, 6, 9].includes(fuTouZhiIndex)) yuan = 0;
    else if ([2, 5, 8, 11].includes(fuTouZhiIndex)) yuan = 1;
    else yuan = 2;

    // 4. 判定【节气归属】（超神、接气、正授的核心降维算法）
    // 置闰法最高法则：以符头为主！符头离哪个节气近，就归哪个节气管。
    const prevJieQi = fuTouLunar.getPrevJieQi(true);
    const nextJieQi = fuTouLunar.getNextJieQi(true);

    const daysToPrev = Math.abs(fuTouLunar.getSolar().subtract(prevJieQi.getSolar()));
    const daysToNext = Math.abs(nextJieQi.getSolar().subtract(fuTouLunar.getSolar()));

    let targetJieQiName = prevJieQi.getName();
    // 如果符头距离下一个节气更近，且在正常超神范围（通常不超过9天），则属于【超神】，用下一个节气
    if (daysToNext <= daysToPrev && daysToNext <= 9) {
        targetJieQiName = nextJieQi.getName();
    }

    // 5. 阴阳遁判定
    const isYang = ["冬至","小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种"].includes(targetJieQiName);

    // 6. 局数查表 (按 节气 -> [上元, 中元, 下元] 映射)
    const juTable = {
        "冬至": [1, 7, 4], "小寒": [2, 8, 5], "大寒": [3, 9, 6],
        "立春": [8, 5, 2], "雨水": [9, 6, 3], "惊蛰": [1, 7, 4],
        "春分": [3, 9, 6], "清明": [4, 1, 7], "谷雨": [5, 2, 8],
        "立夏": [4, 1, 7], "小满": [5, 2, 8], "芒种": [6, 3, 9],
        "夏至": [9, 3, 6], "小暑": [8, 2, 5], "大暑": [7, 1, 4],
        "立秋": [2, 5, 8], "处暑": [1, 4, 7], "白露": [9, 3, 6],
        "秋分": [7, 1, 4], "寒露": [6, 9, 3], "霜降": [5, 8, 2],
        "立冬": [6, 9, 3], "小雪": [5, 8, 2], "大雪": [4, 7, 1]
    };

    return {
        juNumber: juTable[targetJieQiName][yuan],
        isYangdun: isYang,
        debugInfo: {
            yuanName: ["上元", "中元", "下元"][yuan],
            targetJieQi: targetJieQiName
        }
    };
  }
};
