// oogo-zhirun.js - OOGO 专属真·置闰法核心引擎与飞盘引擎
const OogoZhiRun = {
  calculate: function(year, month, day, hour, min) {
    const chart = ThreeMeta.QimenChart.fromSolar(year, month, day, hour, min, 0);
    const dayStem = chart.fourPillars.day.stem;
    const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const branches = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    const dayGanIndex = stems.indexOf(dayStem);
    const offset = dayGanIndex % 5; 
    
    const fuTouDate = new Date(year, month - 1, day);
    fuTouDate.setDate(fuTouDate.getDate() - offset);
    
    const ftChart = ThreeMeta.QimenChart.fromSolar(
        fuTouDate.getFullYear(), 
        fuTouDate.getMonth() + 1, 
        fuTouDate.getDate(), 
        12, 0, 0
    );
    const ftZhi = ftChart.fourPillars.day.branch;
    const ftZhiIndex = branches.indexOf(ftZhi);
    
    let yuan = 0;
    if ([0, 3, 6, 9].indexOf(ftZhiIndex) !== -1) yuan = 0;     
    else if ([2, 5, 8, 11].indexOf(ftZhiIndex) !== -1) yuan = 1; 
    else yuan = 2;                                       
    
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
    
    let targetJieQiName = baseJQ;
    if (daysToNext <= 9 && daysToNext <= daysToPrev) {
        targetJieQiName = nextJQ;
    }
    
    const isYang = ["冬至","小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种"].indexOf(targetJieQiName) !== -1;
    
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

const OogoFeiPan = {
  fly: function(chart) {
    const isYang = (chart.ju && chart.ju.type) ? chart.ju.type.indexOf('阳') !== -1 : true;
    const timeStem = chart.fourPillars.hour.stem;
    const timeBranch = chart.fourPillars.hour.branch;
    
    const stemsArr = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const branchesArr = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    const hSIdx = stemsArr.indexOf(timeStem);
    const hBIdx = branchesArr.indexOf(timeBranch);
    const xunOffset = (hBIdx - hSIdx + 12) % 12;
    const xunName = stemsArr[0] + branchesArr[xunOffset];
    const xunStem = {"甲子":"戊", "甲戌":"己", "甲申":"庚", "甲午":"辛", "甲辰":"壬", "甲寅":"癸"}[xunName];

    const earthStems = {};
    chart.palaces.forEach(function(p) {
        earthStems[p.position] = Array.isArray(p.earthlyStem) ? p.earthlyStem[0] : p.earthlyStem;
    });
    if (!earthStems[5]) {
        const qimenStems = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
        const juNumber = chart.ju.number;
        let steps = isYang ? (5 - juNumber + 9) % 9 : (juNumber - 5 + 9) % 9;
        earthStems[5] = qimenStems[steps];
    }

    const origStars = {1:'天蓬', 2:'天芮', 3:'天冲', 4:'天辅', 5:'天禽', 6:'天心', 7:'天柱', 8:'天任', 9:'天英'};
    const origGates = {1:'休门', 2:'死门', 3:'伤门', 4:'杜门', 5:'中门', 6:'开门', 7:'惊门', 8:'生门', 9:'景门'};

    let xunPalace = 5;
    for (let i = 1; i <= 9; i++) {
        if (earthStems[i] === xunStem) { xunPalace = i; break; }
    }

    let zfTargetPalace = 5;
    let searchStem = (timeStem === '甲') ? xunStem : timeStem;
    for (let i = 1; i <= 9; i++) {
        if (earthStems[i] === searchStem) { zfTargetPalace = i; break; }
    }

    let starSteps = isYang ? (zfTargetPalace - xunPalace) : (xunPalace - zfTargetPalace);
    if (starSteps < 0) starSteps += 9;

    const flyStars = {};
    const flyHeavenStems = {};
    for (let i = 1; i <= 9; i++) {
        let landPalace = isYang ? (i + starSteps) : (i - starSteps);
        while (landPalace > 9) landPalace -= 9;
        while (landPalace < 1) landPalace += 9;
        
        flyStars[landPalace] = origStars[i];
        flyHeavenStems[landPalace] = earthStems[i];
    }

    const xunBranch = xunName[1];
    let branchOffset = branchesArr.indexOf(timeBranch) - branchesArr.indexOf(xunBranch);
    if (branchOffset < 0) branchOffset += 12;

    let zsTargetPalace = xunPalace;
    if (isYang) {
        zsTargetPalace = xunPalace + branchOffset;
        while (zsTargetPalace > 9) zsTargetPalace -= 9;
    } else {
        zsTargetPalace = xunPalace - branchOffset;
        while (zsTargetPalace < 1) zsTargetPalace += 9;
    }

    let gateSteps = isYang ? (zsTargetPalace - xunPalace) : (xunPalace - zsTargetPalace);
    if (gateSteps < 0) gateSteps += 9;

    const flyGates = {};
    for (let i = 1; i <= 9; i++) {
        let landPalace = isYang ? (i + gateSteps) : (i - gateSteps);
        while (landPalace > 9) landPalace -= 9;
        while (landPalace < 1) landPalace += 9;
        flyGates[landPalace] = origGates[i];
    }

    const deitiesList = ['值符', '腾蛇', '太阴', '六合', '勾陈', '太常', '朱雀', '九地', '九天'];
    const flyDeities = {};
    for (let i = 0; i < 9; i++) {
        let landPalace = isYang ? (zfTargetPalace + i) : (zfTargetPalace - i);
        while (landPalace > 9) landPalace -= 9;
        while (landPalace < 1) landPalace += 9;
        flyDeities[landPalace] = deitiesList[i];
    }

    chart.palaces.forEach(function(p) {
        const pos = p.position;
        p.star = flyStars[pos];
        p.gate = flyGates[pos];
        p.deity = flyDeities[pos];
        p.heavenlyStem = flyHeavenStems[pos];
        p.earthlyStem = earthStems[pos];
    });

    if (!chart.zhiFu) chart.zhiFu = {};
    if (!chart.zhiShi) chart.zhiShi = {};
    chart.zhiFu.position = zfTargetPalace;
    chart.zhiShi.position = zsTargetPalace;

    return chart;
  }
};

// ==========================================
// OOGO 专属转盘排盘流派对齐适配器（对齐主流传统软件）
// ==========================================
const OogoAlignAdapter = {
  alignZhuanPan: function(chart) {
    if (!chart || !chart.palaces) return chart;

    // 核心流派修正：将现代库默认的“阳遁寄艮8宫”统一修正为传统古法主流的“寄坤2宫”
    let palace5 = chart.palaces.find(p => p.position === 5);
    let palace2 = chart.palaces.find(p => p.position === 2);
    let palace8 = chart.palaces.find(p => p.position === 8);

    if (palace5 && palace2) {
      // 如果传统软件将中宫5的干支/星门统一归入或协同2宫（坤宫）
      // 我们在这里对 2 宫和 5 宫的数据进行桥接或重映射
      
      // 示例：确保 2 宫能够正确承载中宫寄宫的天干与星
      let extraStem = palace5.earthlyStem || palace5.heavenlyStem;
      if (extraStem && palace2) {
        if (!Array.isArray(palace2.earthlyStem)) {
          palace2.earthlyStem = [palace2.earthlyStem];
        }
        // 如果 2 宫还没有包含中宫干，则将中宫干补充进去
        if (!palace2.earthlyStem.includes(extraStem)) {
          palace2.earthlyStem.push(extraStem);
        }
      }
    }

    // 如果市面主流软件对某些特定时辰的转盘门位有强制顺逆对齐要求
    // 你可以在这里直接对 chart.palaces 中各宫的 gate（门）进行微调交换
    // 例如：强制修正特定宫位的八门名称以匹配传统古法
    
    return chart;
  }
};
