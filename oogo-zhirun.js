// oogo-zhirun.js - OOGO 专属真·置闰法核心引擎 (原生Date探针版)
const OogoZhiRun = {
  calculate: function(year, month, day, hour, min) {
    // 1. 获取当天的排盘基础信息（用最安全的 fromSolar 接口）
    const chart = ThreeMeta.QimenChart.fromSolar(year, month, day, hour, min, 0);
    const dayStem = chart.fourPillars.day.stem;
    
    const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const branches = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    
    // 2. 计算距离符头的偏移量
    const dayGanIndex = stems.indexOf(dayStem);
    const offset = dayGanIndex % 5; 
    
    // 3. 用原生 JS Date 倒推寻找【符头】当天的日期（完美绕过底层限制）
    const fuTouDate = new Date(year, month - 1, day);
    fuTouDate.setDate(fuTouDate.getDate() - offset);
    
    // 4. 获取符头当天的排盘信息
    const ftChart = ThreeMeta.QimenChart.fromSolar(
        fuTouDate.getFullYear(), 
        fuTouDate.getMonth() + 1, 
        fuTouDate.getDate(), 
        12, 0, 0
    );
    const ftZhi = ftChart.fourPillars.day.branch;
    const ftZhiIndex = branches.indexOf(ftZhi);
    
    // 5. 判定【上中下元】
    let yuan = 0;
    if ([0, 3, 6, 9].includes(ftZhiIndex)) yuan = 0;      // 子午卯酉 -> 上元
    else if ([2, 5, 8, 11].includes(ftZhiIndex)) yuan = 1; // 寅申巳亥 -> 中元
    else yuan = 2;                                         // 辰戌丑未 -> 下元
    
    // 6. 核心：通过时间探针寻找节气边界
    // 以符头当天为基准，每天往前/往后探测一次，看哪天节气发生变化
    const baseJQ = ftChart.timeInfo.solarTerm;
    let daysToNext = 99;
    let nextJQ = baseJQ;
    
    let probeNext = new Date(fuTouDate);
    for(let i = 1; i <= 16; i++) {
        probeNext.setDate(probeNext.getDate() + 1);
        let c = ThreeMeta.QimenChart.fromSolar(probeNext.getFullYear(), probeNext.getMonth() + 1, probeNext.getDate(), 12, 0, 0);
        if(c.timeInfo.solarTerm !== baseJQ) {
            nextJQ = c.timeInfo.solarTerm;
            daysToNext = i;
            break;
        }
    }
    
    let probePrev = new Date(fuTouDate);
    let daysToPrev = 99;
    for(let i = 1; i <= 16; i++) {
        probePrev.setDate(probePrev.getDate() - 1);
        let c = ThreeMeta.QimenChart.fromSolar(probePrev.getFullYear(), probePrev.getMonth() + 1, probePrev.getDate(), 12, 0, 0);
        if(c.timeInfo.solarTerm !== baseJQ) {
            daysToPrev = i;
            break;
        }
    }
    
    // 7. 超神接气与置闰判定（以近为准则）
    let targetJieQiName = baseJQ;
    if (daysToNext <= 9 && daysToNext <= daysToPrev) {
        // 如果符头离下一个节气更近，且在9天以内，属于超神，借用下个节气
        targetJieQiName = nextJQ;
    }
    
    // 8. 阴阳遁判定与查表
    const isYang = ["冬至","小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种"].includes(targetJieQiName);
    
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
