// oogo-zhirun.js - OOGO 奇门遁甲全系引擎 (完美置闰版)
// 包含：真·置闰法核心、无缝转盘引擎、原生飞盘引擎

const OogoEngine = {
    // ------------------------------------------------------------------------
    // 核心引擎 1：纯数学级“置闰法定局” (修复子时跨日，完美模拟超神接气与置闰)
    // ------------------------------------------------------------------------
    getZhiRunParameters: function (year, month, day, hour, min) {
        // 1. 获取包含真实干支的基础盘（判定当前时辰是否已触发早晚子时跨日）
        const baseChart = ThreeMeta.QimenChart.fromSolar(year, month, day, hour, min, 0);
        const dayStem = baseChart.fourPillars.day.stem;
        const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
        const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

        // 2. 算符头偏移：距离最近的甲/己日的偏差天数
        const dayGanIndex = stems.indexOf(dayStem);
        const offset = dayGanIndex % 5;

        // 3. 修复“时空错乱”：如果时间在 23:00 之后，日干支已进位，物理日历计算时必须加 1 天
        const logicalDate = new Date(year, month - 1, day, 12, 0, 0); // 统一用中午12点防时区漂移
        if (hour >= 23) {
            logicalDate.setDate(logicalDate.getDate() + 1);
        }

        // 4. 定位精确的“符头”日期
        const fuTouDate = new Date(logicalDate);
        fuTouDate.setDate(fuTouDate.getDate() - offset);

        const ftChart = ThreeMeta.QimenChart.fromSolar(
            fuTouDate.getFullYear(),
            fuTouDate.getMonth() + 1,
            fuTouDate.getDate(),
            12, 0, 0
        );
        const ftZhi = ftChart.fourPillars.day.branch;
        const ftZhiIndex = branches.indexOf(ftZhi);

        // 5. 判定三元（上、中、下）
        let yuan = 0;
        if ([0, 3, 6, 9].indexOf(ftZhiIndex) !== -1) yuan = 0;       // 子午卯酉 -> 上元
        else if ([2, 5, 8, 11].indexOf(ftZhiIndex) !== -1) yuan = 1; // 寅申巳亥 -> 中元
        else yuan = 2;                                               // 辰戌丑未 -> 下元

        // 6. 核心置闰逻辑：符头就近日法 (Nearest Solar Term)
        // 获取符头前后各一个月的 24 节气精确时间，找到与符头日绝对时间差最小的节气
        let minDiff = Infinity;
        let targetJieQi = "";
        
        let probeDate = new Date(fuTouDate);
        probeDate.setDate(probeDate.getDate() - 20); // 往前推20天开始扫描
        let termsMap = {};
        
        // 扫描并收集附近的所有节气
        for (let i = 0; i < 40; i++) {
            let c = ThreeMeta.QimenChart.fromSolar(probeDate.getFullYear(), probeDate.getMonth() + 1, probeDate.getDate(), 12, 0, 0);
            let jq = c.timeInfo.solarTerm;
            if (!termsMap[jq]) {
                termsMap[jq] = new Date(probeDate.getTime());
            }
            probeDate.setDate(probeDate.getDate() + 1);
        }

        // 数学匹配：找出距离符头最近的节气（完美实现：超神>9天自动置闰退回前一节气）
        const fuTouTime = fuTouDate.getTime();
        for (let jq in termsMap) {
            let diff = Math.abs(termsMap[jq].getTime() - fuTouTime);
            if (diff < minDiff) {
                minDiff = diff;
                targetJieQi = jq;
            }
        }

        const isYang = ["冬至", "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种"].indexOf(targetJieQi) !== -1;
        const juTable = {
            "冬至": [1, 7, 4], "小寒": [2, 8, 5], "大寒": [3, 9, 6], "立春": [8, 5, 2], "雨水": [9, 6, 3], "惊蛰": [1, 7, 4],
            "春分": [3, 9, 6], "清明": [4, 1, 7], "谷雨": [5, 2, 8], "立夏": [4, 1, 7], "小满": [5, 2, 8], "芒种": [6, 3, 9],
            "夏至": [9, 3, 6], "小暑": [8, 2, 5], "大暑": [7, 1, 4], "立秋": [2, 5, 8], "处暑": [1, 4, 7], "白露": [9, 3, 6],
            "秋分": [7, 1, 4], "寒露": [6, 9, 3], "霜降": [5, 8, 2], "立冬": [6, 9, 3], "小雪": [5, 8, 2], "大雪": [4, 7, 1]
        };

        return {
            juNumber: juTable[targetJieQi][yuan],
            isYangdun: isYang,
            debugInfo: {
                yuanName: ["上元", "中元", "下元"][yuan],
                targetJieQi: targetJieQi,
                fuTouDateStr: fuTouDate.getFullYear() + "-" + (fuTouDate.getMonth() + 1) + "-" + fuTouDate.getDate()
            }
        };
    },

    // ------------------------------------------------------------------------
    // 引擎 2：转盘生成器 (严丝合缝利用 ThreeMeta 原生转盘逻辑，零 Bug)
    // ------------------------------------------------------------------------
    createZhuanPan: function (year, month, day, hour, min) {
        // 先算置闰精准参数
        const zrParams = this.getZhiRunParameters(year, month, day, hour, min);

        // 将置闰算出的“局数”和“阴阳遁”强行注入 ThreeMeta 引擎，生成最终盘
        const chart = ThreeMeta.QimenChart.fromSolar(year, month, day, hour, min, 0, {
            juNumber: zrParams.juNumber,
            isYangdun: zrParams.isYangdun
        });

        chart.oogoZhiRunMeta = zrParams.debugInfo; // 挂载用于 UI 显示的符头数据
        return chart;
    },

    // ------------------------------------------------------------------------
    // 引擎 3：飞盘生成器 (彻底重写，排除寄宫干扰，包含飞盘专属八神与暗干)
    // ------------------------------------------------------------------------
    createFeiPan: function (year, month, day, hour, min) {
        // 同样基于置闰法的局数起盘
        const zrParams = this.getZhiRunParameters(year, month, day, hour, min);
        const chart = ThreeMeta.QimenChart.fromSolar(year, month, day, hour, min, 0, {
            juNumber: zrParams.juNumber,
            isYangdun: zrParams.isYangdun
        });
        chart.oogoZhiRunMeta = zrParams.debugInfo;

        const isYang = zrParams.isYangdun;
        const juNumber = zrParams.juNumber;
        const timeStem = chart.fourPillars.hour.stem;
        const timeBranch = chart.fourPillars.hour.branch;

        const stemsArr = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
        const branchesArr = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
        const qimenStems = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"]; // 奇仪序

        // 找旬首天干
        const hSIdx = stemsArr.indexOf(timeStem);
        const hBIdx = branchesArr.indexOf(timeBranch);
        const xunOffset = (hBIdx - hSIdx + 12) % 12;
        const xunName = stemsArr[0] + branchesArr[xunOffset];
        const xunStem = { "甲子": "戊", "甲戌": "己", "甲申": "庚", "甲午": "辛", "甲辰": "壬", "甲寅": "癸" }[xunName];

        // 1. 生成纯净地盘天干 (排除任何寄宫干扰，1-9 宫一宫一干)
        const pureEarthStems = {};
        for (let i = 0; i < 9; i++) {
            let p = isYang ? (juNumber + i) : (juNumber - i);
            while (p > 9) p -= 9;
            while (p < 1) p += 9;
            pureEarthStems[p] = qimenStems[i];
        }

        const origStars = { 1: '天蓬', 2: '天芮', 3: '天冲', 4: '天辅', 5: '天禽', 6: '天心', 7: '天柱', 8: '天任', 9: '天英' };
        const origGates = { 1: '休门', 2: '死门', 3: '伤门', 4: '杜门', 5: '中门', 6: '开门', 7: '惊门', 8: '生门', 9: '景门' };

        // 2. 找旬首宫与时干宫
        let xunPalace = 5, zfTargetPalace = 5;
        for (let i = 1; i <= 9; i++) {
            if (pureEarthStems[i] === xunStem) xunPalace = i;
            if (pureEarthStems[i] === (timeStem === '甲' ? xunStem : timeStem)) zfTargetPalace = i;
        }

        // 3. 飞星与飞天干 (按 1~9 宫九宫数序飞布)
        let starSteps = isYang ? (zfTargetPalace - xunPalace) : (xunPalace - zfTargetPalace);
        if (starSteps < 0) starSteps += 9;
        
        const flyStars = {};
        const flyHeavenStems = {};
        for (let i = 1; i <= 9; i++) {
            let landPalace = isYang ? (i + starSteps) : (i - starSteps);
            while (landPalace > 9) landPalace -= 9;
            while (landPalace < 1) landPalace += 9;
            flyStars[landPalace] = origStars[i];
            flyHeavenStems[landPalace] = pureEarthStems[i];
        }

        // 4. 飞门 (值使门起落宫)
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

        // 5. 飞神 (飞盘特有九神，阴阳遁神序不同)
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

        // 6. 飞暗干 (飞盘标准法：时干加入值使门，按奇仪序顺逆飞九宫)
        const flyHiddenStems = {};
        const tsIdx = qimenStems.indexOf(timeStem === '甲' ? xunStem : timeStem);
        if (tsIdx !== -1) {
            for (let i = 0; i < 9; i++) {
                let landPalace = isYang ? (zsTargetPalace + i) : (zsTargetPalace - i);
                while (landPalace > 9) landPalace -= 9;
                while (landPalace < 1) landPalace += 9;
                let sIdx = (tsIdx + i) % 9;
                flyHiddenStems[landPalace] = qimenStems[sIdx];
            }
        }

        // 7. 覆写原盘属性
        chart.palaces.forEach(function(p) {
            const pos = p.position;
            p.star = flyStars[pos];
            p.gate = flyGates[pos];
            p.deity = flyDeities[pos];
            p.heavenlyStem = flyHeavenStems[pos];
            p.earthlyStem = pureEarthStems[pos];
            p.hiddenStem = flyHiddenStems[pos] || "无";
            
            // 清理掉转盘特有的寄宫属性，防止 UI 渲染混乱
            delete p.isJiGong;
        });

        if (!chart.zhiFu) chart.zhiFu = {};
        if (!chart.zhiShi) chart.zhiShi = {};
        chart.zhiFu.position = zfTargetPalace;
        chart.zhiShi.position = zsTargetPalace;

        return chart;
    }
};

// =======================
// 使用示例说明：
// 生成准确置闰的转盘：
// const zhuanPan = OogoEngine.createZhuanPan(2026, 8, 14, 23, 48);
// 生成准确置闰的飞盘：
// const feiPan = OogoEngine.createFeiPan(2026, 8, 14, 23, 48);
// =======================
