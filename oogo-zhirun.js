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
// 在 OogoEngine 或转盘增强处理中（可直接合并到 oogo-zhirun.js 底部）
const OogoZhuanPanEnhancer = {
  enhance: function(chart, xunDun, isYang) {
    const ring = [1, 8, 3, 4, 9, 2, 7, 6]; 
    const deities = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
    let earthDeitiesMap = {};
    
    // 寻找地盘旬首落宫
    let earthXunPalace = 5;
    for (let i = 1; i <= 9; i++) {
        let p = chart.palaces.find(x => x.position === i) || {};
        let eStemStr = Array.isArray(p.earthlyStem) ? p.earthlyStem[0] : (p.earthlyStem || '');
        if (eStemStr === xunDun) { earthXunPalace = i; break; }
    }
    if (earthXunPalace === 5) earthXunPalace = 2; // 中五宫寄坤二宫
    
    let eDeityStartIndex = ring.indexOf(earthXunPalace);
    if (eDeityStartIndex !== -1) {
        for (let i = 0; i < 8; i++) {
            let targetPalace = ring[isYang ? (eDeityStartIndex + i) % 8 : (eDeityStartIndex - i + 8) % 8];
            earthDeitiesMap[targetPalace] = deities[i];
        }
    }

    // 将地八神直接写入后端盘面对象的 palaces 中
    chart.palaces.forEach(p => {
        p.earthDeity = earthDeitiesMap[p.position] || '';
    });
    
    return chart;
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
    const qimenStems = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
    
    const hSIdx = stemsArr.indexOf(timeStem);
    const hBIdx = branchesArr.indexOf(timeBranch);
    const xunOffset = (hBIdx - hSIdx + 12) % 12;
    const xunName = stemsArr[0] + branchesArr[xunOffset];
    const xunStem = {"甲子":"戊", "甲戌":"己", "甲申":"庚", "甲午":"辛", "甲辰":"壬", "甲寅":"癸"}[xunName];

    // 纯净地盘
    const pureEarthStems = {};
    for (let i = 0; i < 9; i++) {
        let p = isYang ? (juNumber + i) : (juNumber - i);
        while (p > 9) p -= 9;
        while (p < 1) p += 9;
        pureEarthStems[p] = qimenStems[i];
    }

    const origStars = {1:'天蓬', 2:'天芮', 3:'天冲', 4:'天辅', 5:'天禽', 6:'天心', 7:'天柱', 8:'天任', 9:'天英'};
    const origGates = {1:'休门', 2:'死门', 3:'伤门', 4:'杜门', 5:'中门', 6:'开门', 7:'惊门', 8:'生门', 9:'景门'};

    let xunPalace = 5, zfTargetPalace = 5;
    for (let i = 1; i <= 9; i++) {
        if (pureEarthStems[i] === xunStem) xunPalace = i;
        if (pureEarthStems[i] === (timeStem === '甲' ? xunStem : timeStem)) zfTargetPalace = i;
    }

    // 飞星与天盘干
    let starSteps = isYang ? (zfTargetPalace - xunPalace) : (xunPalace - zfTargetPalace);
    if (starSteps < 0) starSteps += 9;
    const flyStars = {}; const flyHeavenStems = {};
    for (let i = 1; i <= 9; i++) {
        let landPalace = isYang ? (i + starSteps) : (i - starSteps);
        while (landPalace > 9) landPalace -= 9;
        while (landPalace < 1) landPalace += 9;
        flyStars[landPalace] = origStars[i];
        flyHeavenStems[landPalace] = pureEarthStems[i];
    }

    // 飞门
    const xunBranch = xunName[1];
    let branchOffset = branchesArr.indexOf(timeBranch) - branchesArr.indexOf(xunBranch);
    if (branchOffset < 0) branchOffset += 12;
    let zsTargetPalace = isYang ? (xunPalace + branchOffset) : (xunPalace - branchOffset);
    while (zsTargetPalace > 9) zsTargetPalace -= 9;
    while (zsTargetPalace < 1) zsTargetPalace += 9;

    let gateSteps = isYang ? (zsTargetPalace - xunPalace) : (xunPalace - zsTargetPalace);
    if (gateSteps < 0) gateSteps += 9;
    const flyGates = {};
    for (let i = 1; i <= 9; i++) {
        let landPalace = isYang ? (i + gateSteps) : (i - gateSteps);
        while (landPalace > 9) landPalace -= 9;
        while (landPalace < 1) landPalace += 9;
        flyGates[landPalace] = origGates[i];
    }

    // 飞神
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

    // 飞暗干
    const flyHiddenStems = {};
    const tsIdx = qimenStems.indexOf(timeStem === '甲' ? xunStem : timeStem);
    if (tsIdx !== -1) {
        for (let i = 0; i < 9; i++) {
            let landPalace = isYang ? (zsTargetPalace + i) : (zsTargetPalace - i);
            while (landPalace > 9) landPalace -= 9;
            while (landPalace < 1) landPalace += 9;
            flyHiddenStems[landPalace] = qimenStems[(tsIdx + i) % 9];
        }
    }

    // --- 覆写原盘属性并【重新判定神煞】 ---
    chart.palaces.forEach(function(p) {
        const pos = p.position;
        const gate = flyGates[pos];
        const hStem = flyHeavenStems[pos];

        p.star = flyStars[pos];
        p.gate = gate;
        p.deity = flyDeities[pos];
        p.heavenlyStem = hStem;
        p.earthlyStem = pureEarthStems[pos];
        p.hiddenStem = flyHiddenStems[pos] || "无";
        delete p.isJiGong; 

        // 1. 飞盘重新计算：六仪击刑
        let jx = false;
        if ((hStem === '戊' && pos === 3) || (hStem === '己' && pos === 2) ||
            (hStem === '庚' && pos === 8) || (hStem === '辛' && pos === 9) ||
            (hStem === '壬' && pos === 4) || (hStem === '癸' && pos === 4)) { jx = true; }
        p.liuYiJiXing = { hasJiXing: jx };

        // 2. 飞盘重新计算：门迫 (门克宫)
        const gateEle = {"休门":"水","生门":"土","伤门":"木","杜门":"木","景门":"火","死门":"土","惊门":"金","开门":"金","中门":"土"}[gate];
        const palaceEle = {1:"水",2:"土",3:"木",4:"木",5:"土",6:"金",7:"金",8:"土",9:"火"}[pos];
        let po = false;
        if ((gateEle==='水'&&palaceEle==='火') || (gateEle==='火'&&palaceEle==='金') ||
            (gateEle==='金'&&palaceEle==='木') || (gateEle==='木'&&palaceEle==='土') ||
            (gateEle==='土'&&palaceEle==='水')) { po = true; }
        p.gatePressure = po ? '迫' : '无';

        // 3. 飞盘重新计算：天盘入墓
        let mu = false;
        if ((pos === 6 && ['丙','戊','乙'].includes(hStem)) ||
            (pos === 8 && ['丁','己','庚'].includes(hStem)) ||
            (pos === 4 && ['辛','壬'].includes(hStem)) ||
            (pos === 2 && hStem === '癸')) { mu = true; }
        p.tombInfo = { heavenlyStemInTomb: mu ? [hStem] : [], earthlyStemInTomb: [] };
    });

    if (!chart.zhiFu) chart.zhiFu = {};
    if (!chart.zhiShi) chart.zhiShi = {};
    chart.zhiFu.position = zfTargetPalace;
    chart.zhiShi.position = zsTargetPalace;

    return chart;
  }
};

// oogo-zhirun.js 的最底部追加以下代码

const OogoTagEnhancer = {
  enhance: function(chart) {
    // ==========================================
    // 1. 拦截并修复 3meta 的【驿马星】致命 Bug
    // ==========================================
    // 彻底抛弃 chart.postHorse，使用时支重新精准计算马星
    const timeBranch = chart.fourPillars.hour.branch; 
    let maXing = '';
    if (['申', '子', '辰'].includes(timeBranch)) maXing = '寅';
    else if (['亥', '卯', '未'].includes(timeBranch)) maXing = '巳'; // 修复 3meta 误写为'申'的Bug
    else if (['寅', '午', '戌'].includes(timeBranch)) maXing = '申';
    else if (['巳', '酉', '丑'].includes(timeBranch)) maXing = '亥';

    const maPalaceMap = { "寅": 8, "巳": 4, "申": 2, "亥": 6 };
    const maPalaceNum = maPalaceMap[maXing] || 0;

    // ==========================================
    // 2. 物理映射：空亡绝对落宫
    // ==========================================
    const voidnessArr = (chart.timeInfo && chart.timeInfo.voidness) ? chart.timeInfo.voidness : [];
    const kong1 = voidnessArr[0] || '';
    const kong2 = voidnessArr[1] || '';
    const branchToPalace = {
        "子": 1, "丑": 8, "寅": 8, "卯": 3, "辰": 4, "巳": 4,
        "午": 9, "未": 2, "申": 2, "酉": 7, "戌": 6, "亥": 6
    };
    const kongPalace1 = branchToPalace[kong1] || 0;
    const kongPalace2 = branchToPalace[kong2] || 0;

    // ==========================================
    // 3. 遍历宫位，覆盖重写算法，屏蔽 3meta 的错误
    // ==========================================
    chart.palaces.forEach(p => {
        const pos = p.position;
        const hStem = Array.isArray(p.heavenlyStem) ? p.heavenlyStem[0] : (p.heavenlyStem || '');

        // 马星与空亡打标 (使用我们自己修复好的绝对落宫)
        p.uiTagMa = (pos === maPalaceNum);
        p.uiTagKong = (pos === kongPalace1 || pos === kongPalace2);
        
        // 击刑与门迫 (3meta 算的是对的，直接透传)
        p.uiTagJx = !!(p.liuYiJiXing && p.liuYiJiXing.hasJiXing);
        p.uiTagPo = (p.gatePressure === '迫');

        // ==========================================
        // 4. 拦截并修复 3meta 库的【天盘入墓】Bug
        // ==========================================
        // 废弃 p.tombInfo，强制使用标准《烟波钓叟歌》严格入墓规则 (乙仅在乾6入墓)
        let mu = false;
        if ((pos === 6 && ['丙','戊','乙'].includes(hStem)) ||
            (pos === 8 && ['丁','己','庚'].includes(hStem)) ||
            (pos === 4 && ['辛','壬'].includes(hStem)) ||
            (pos === 2 && hStem === '癸')) {
            mu = true;
        }
        p.uiTagMu = mu;
    });

    return chart;
  }
};


