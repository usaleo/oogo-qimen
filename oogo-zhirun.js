// oogo-zhirun.js - OOGO 奇门遁甲专属核心引擎 (完美置闰与原生飞盘版)

const OogoZhiRun = {
  calculate: function(year, month, day, hour, min) {
    // 1. 生成基础盘，提取当前正确的干支（ThreeMeta 会自动处理 23:00 后的干支进位）
    const chart = ThreeMeta.QimenChart.fromSolar(year, month, day, hour, min, 0);
    const dayStem = chart.fourPillars.day.stem;
    const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const branches = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    
    // 2. 计算当前日干距离最近的甲/己日的偏移量
    const dayGanIndex = stems.indexOf(dayStem);
    const offset = dayGanIndex % 5; 
    
    // 3. 修复核心 Bug：处理“子时跨日”导致的日历与干支脱节
    // 如果时间在 23:00 之后，日干支已经算作了明天，物理日历也必须同步推进 1 天来作为基准
    const logicalDate = new Date(year, month - 1, day, 12, 0, 0); // 统一锚定中午12点防时区漂移
    if (hour >= 23) {
        logicalDate.setDate(logicalDate.getDate() + 1);
    }
    
    // 4. 定位准确的“符头”日期
    const fuTouDate = new Date(logicalDate);
    fuTouDate.setDate(fuTouDate.getDate() - offset);
    
    // 获取符头当天的干支信息
    const ftChart = ThreeMeta.QimenChart.fromSolar(
        fuTouDate.getFullYear(), 
        fuTouDate.getMonth() + 1, 
        fuTouDate.getDate(), 
        12, 0, 0
    );
    const ftZhi = ftChart.fourPillars.day.branch;
    const ftZhiIndex = branches.indexOf(ftZhi);
    
    // 5. 判定上中下三元
    let yuan = 0;
    if ([0, 3, 6, 9].indexOf(ftZhiIndex) !== -1) yuan = 0;       // 子午卯酉 -> 上元
    else if ([2, 5, 8, 11].indexOf(ftZhiIndex) !== -1) yuan = 1; // 寅申巳亥 -> 中元
    else yuan = 2;                                               // 辰戌丑未 -> 下元
    
    // 6. 超神接气与置闰判断核心模型
    const baseJQ = ftChart.timeInfo.solarTerm;
    let daysToNext = 99;
    let nextJQ = baseJQ;
    
    // 往后探测下一个节气界限
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
    
    // 往前探测上一个节气界限
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
    // 数学模型：如果距离下个节气更近，且在 9 天以内，则将符头拨给下个节气（超神接气常规处理）
    if (daysToNext <= 9 && daysToNext <= daysToPrev) {
        targetJieQiName = nextJQ;
    }
    // 注：如果 daysToNext > 9，说明超神极其严重，阈值将强制它使用 baseJQ(当前物理节气)，
    // 这会在数学上完美触发连续 15 天的节气循环重复，从而实现“置闰”。
    
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
            targetJieQi: targetJieQiName,
            isTrueRun: daysToNext > 9 && daysToNext > daysToPrev // UI 触发“(闰)”标签的精准开关
        }
    };
  }
};

const OogoFeiPan = {
  fly: function(chart) {
    const isYang = (chart.ju && chart.ju.type) ? chart.ju.type.indexOf('阳') !== -1 : true;
    const juNumber = chart.ju.number;
    const timeStem = chart.fourPillars.hour.stem;
    const timeBranch = chart.fourPillars.hour.branch;
    
    const stemsArr = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const branchesArr = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    
    const hSIdx = stemsArr.indexOf(timeStem);
    const hBIdx = branchesArr.indexOf(timeBranch);
    const xunOffset = (hBIdx - hSIdx + 12) % 12;
    const xunName = stemsArr[0] + branchesArr[xunOffset];
    const xunStem = {"甲子":"戊", "甲戌":"己", "甲申":"庚", "甲午":"辛", "甲辰":"壬", "甲寅":"癸"}[xunName];

    // 1. 免疫转盘寄宫干扰：纯数学还原 1~9 宫的最原始纯净地盘天干
    const baseEarthStems = {};
    const qimenStems = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
    for (let i = 0; i < 9; i++) {
        let p = isYang ? (juNumber + i) : (juNumber - i);
        while (p > 9) p -= 9;
        while (p < 1) p += 9;
        baseEarthStems[p] = qimenStems[i];
    }

    const origStars = {1:'天蓬', 2:'天芮', 3:'天冲', 4:'天辅', 5:'天禽', 6:'天心', 7:'天柱', 8:'天任', 9:'天英'};
    const origGates = {1:'休门', 2:'死门', 3:'伤门', 4:'杜门', 5:'中门', 6:'开门', 7:'惊门', 8:'生门', 9:'景门'};

    // 2. 寻找旬首落宫 (完全基于纯净地盘，杜绝一切多干错误)
    let xunPalace = 5;
    for (let i = 1; i <= 9; i++) {
        if (baseEarthStems[i] === xunStem) { xunPalace = i; break; }
    }

    // 3. 寻找值符星目标落宫 (时干所在的地盘宫)
    let zfTargetPalace = 5;
    let searchStem = (timeStem === '甲') ? xunStem : timeStem;
    for (let i = 1; i <= 9; i++) {
        if (baseEarthStems[i] === searchStem) { zfTargetPalace = i; break; }
    }

    // 4. 九星与天盘干齐飞 (按照 1~9 数字轨道飞步)
    let starSteps = isYang ? (zfTargetPalace - xunPalace) : (xunPalace - zfTargetPalace);
    if (starSteps < 0) starSteps += 9;

    const flyStars = {};
    const flyHeavenStems = {};
    for (let i = 1; i <= 9; i++) {
        let landPalace = isYang ? (i + starSteps) : (i - starSteps);
        while (landPalace > 9) landPalace -= 9;
        while (landPalace < 1) landPalace += 9;
        
        flyStars[landPalace] = origStars[i];
        flyHeavenStems[landPalace] = baseEarthStems[i]; // 天盘干取该星老家的纯净地盘干
    }

    // 5. 飞门 (按地支偏移量，计算值使门落宫)
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

    // 6. 飞盘特有九神 (阴阳遁神煞排列不同)
    const deitiesYang = ['值符', '腾蛇', '太阴', '六合', '勾陈', '太常', '朱雀', '九地', '九天'];
    const deitiesYin  = ['值符', '腾蛇', '太阴', '六合', '白虎', '太常', '玄武', '九地', '九天'];
    const deitiesList = isYang ? deitiesYang : deitiesYin;
    const flyDeities = {};
    for (let i = 0; i < 9; i++) {
        let landPalace = isYang ? (zfTargetPalace + i) : (zfTargetPalace - i);
        while (landPalace > 9) landPalace -= 9;
        while (landPalace < 1) landPalace += 9;
        flyDeities[landPalace] = deitiesList[i];
    }

    // 7. 覆写原盘所有属性 (干掉转盘的所有杂质)
    chart.palaces.forEach(function(p) {
        const pos = p.position;
        p.star = flyStars[pos];
        p.gate = flyGates[pos];
        p.deity = flyDeities[pos];
        p.heavenlyStem = flyHeavenStems[pos];
        p.earthlyStem = baseEarthStems[pos]; 
        
        // 彻底清除掉转盘的寄宫记录，防止 UI 和其它排盘渲染逻辑串位
        delete p.isJiGong; 
    });

    if (!chart.zhiFu) chart.zhiFu = {};
    if (!chart.zhiShi) chart.zhiShi = {};
    chart.zhiFu.position = zfTargetPalace;
    chart.zhiShi.position = zsTargetPalace;

    return chart;
  }
};
