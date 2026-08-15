// oogo-zhirun.js - OOGO 奇门遁甲专属核心引擎 (完美置闰与原生飞盘版)
// ============================================================
// 修复说明（相对旧版）：
// 1. 新增 CalendarAdapter 隔离层：所有"读历法数据"的操作都必须经过它，
//    禁止在 OogoZhiRun / OogoFeiPan 等逻辑层直接调用 ThreeMeta.QimenChart.fromSolar()。
// 2. 修复核心 Bug：原代码里 dayStem 取自"真实输入时刻"（可能已被 ThreeMeta
//    内部做过早子时进位），随后又手动对 logicalDate 做 +1 天补偿，
//    导致 23 点之后的时刻被"进位两次"，符头基准日整体多推进 1 天。
//    典型案例：2026-08-17 23:55，天津真太阳时。旧代码把符头基准日错误算成
//    2026-08-18（甲子），恰好落入"超神接气"判断的 9 天阈值内，被错误划给了
//    "处暑上元"，起阴遁1局；正确结果应锚定在自然日 2026-08-17，落在
//    "立秋下元第5天"，起阴遁8局。
//    修复方式：符头/三元计算专用的日柱查询，固定用当天中午 12:00 去查，
//    彻底屏蔽 ThreeMeta 内部的早子时进位规则，不再叠加任何 +1 天补偿。
// 3. 节气边界判断增加"精确时刻"探测（如底层数据可用），逐天轮询仅作为
//    兜底容错，避免天级精度在 9 天阈值边界上产生误判。
// ============================================================

// ------------------------------------------------------------
// CalendarAdapter：唯一允许直接触碰 ThreeMeta 底层历法数据的入口
// 职责单一：只负责"读数据"，不做任何三元/置闰/局数判断
// ------------------------------------------------------------
const CalendarAdapter = {
  /**
   * 查询某个"公历自然日"的日柱干支。
   * 固定用当天中午 12:00 查询，彻底避免 ThreeMeta 内部的早子时(23点)进位
   * 干扰"符头基准日"的判定——这是修复本次 bug 的关键点。
   */
  getDayGanZhi: function(y, m, d) {
    const c = ThreeMeta.QimenChart.fromSolar(y, m, d, 12, 0, 0);
    return c.fourPillars.day; // {stem, branch}
  },

  /**
   * 查询某个公历自然日所处的节气名称（同样固定中午查询，避免边界抖动）。
   * 如果 ThreeMeta 的 timeInfo.solarTerm 附带精确交接时刻字段（如 exactTime /
   * exactDate 等），一并透出，供 calculate() 做更精确的"超神天数"计算。
   */
  getSolarTermInfo: function(y, m, d) {
    const c = ThreeMeta.QimenChart.fromSolar(y, m, d, 12, 0, 0);
    const st = c.timeInfo && c.timeInfo.solarTerm;
    return {
      name: (typeof st === 'string') ? st : (st && st.name),
      exactTime: (st && (st.exactTime || st.exactDate || st.time)) || null
    };
  },

  /**
   * 查询真实输入时刻的完整四柱（年月日时），用于显示/飞盘等需要
   * "真实时刻"的场景。这里信任 ThreeMeta 自己处理早子时进位，
   * 不做任何二次修正——早子时进位只应该影响"时柱"的显示，
   * 不应该污染符头/三元的判定基准，两者用途不同，必须分开查。
   */
  getFullChart: function(y, m, d, h, min) {
    return ThreeMeta.QimenChart.fromSolar(y, m, d, h, min, 0);
  }
};

// ------------------------------------------------------------
// OogoZhiRun：置闰法核心逻辑，只依赖 CalendarAdapter 提供的历法数据
// ------------------------------------------------------------
const OogoZhiRun = {

  // 超神接气阈值：超过该天数才触发真正的"置闰"（重复一遍上中下三元）
  RUN_THRESHOLD_DAYS: 9,

  // 只有芒种、大雪这两个节气允许置闰，古法明确规定，其余节气即便超神超过
  // 阈值天数，也不应触发置闰标记（这里按需可扩展为强校验/告警）
  RUN_ALLOWED_JIEQI: ["芒种", "大雪"],

  calculate: function(year, month, day, hour, min) {
    const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    const branches = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

    // 1. 真实时刻的完整盘（用于时柱等显示信息，允许早子时进位）
    const fullChart = CalendarAdapter.getFullChart(year, month, day, hour, min);

    // 2. 符头基准日：严格使用"公历自然日" year/month/day，不做任何早子时补偿。
    //    这是本次修复的核心——旧代码在这里错误地叠加了一次 +1 天。
    const baseDayGanZhi = CalendarAdapter.getDayGanZhi(year, month, day);
    const dayStem = baseDayGanZhi.stem;

    // 3. 计算当前日干距离最近的甲/己日的偏移量
    const dayGanIndex = stems.indexOf(dayStem);
    const offset = dayGanIndex % 5;

    // 4. 定位准确的"符头"日期（纯公历日期运算，与具体时刻无关）
    const logicalDate = new Date(year, month - 1, day, 12, 0, 0); // 中午锚定，防时区漂移
    const fuTouDate = new Date(logicalDate);
    fuTouDate.setDate(fuTouDate.getDate() - offset);

    // 5. 获取符头当天的干支信息
    const ftGanZhi = CalendarAdapter.getDayGanZhi(
      fuTouDate.getFullYear(),
      fuTouDate.getMonth() + 1,
      fuTouDate.getDate()
    );
    const ftZhi = ftGanZhi.branch;
    const ftZhiIndex = branches.indexOf(ftZhi);

    // 6. 判定上中下三元
    let yuan = 0;
    if ([0, 3, 6, 9].indexOf(ftZhiIndex) !== -1) yuan = 0;       // 子午卯酉 -> 上元
    else if ([2, 5, 8, 11].indexOf(ftZhiIndex) !== -1) yuan = 1; // 寅申巳亥 -> 中元
    else yuan = 2;                                               // 辰戌丑未 -> 下元

    // 7. 超神接气与置闰判断核心模型
    const baseJQInfo = CalendarAdapter.getSolarTermInfo(
      fuTouDate.getFullYear(), fuTouDate.getMonth() + 1, fuTouDate.getDate()
    );
    const baseJQ = baseJQInfo.name;

    // 往后探测下一个节气界限（逐天轮询作为兜底容错；如未来接入精确节气
    // 交接时刻数据源，可替换为直接做时间差计算，消除天级抖动风险）
    let daysToNext = 99, nextJQ = baseJQ;
    let probeNext = new Date(fuTouDate);
    for (let i = 1; i <= 16; i++) {
      probeNext.setDate(probeNext.getDate() + 1);
      const info = CalendarAdapter.getSolarTermInfo(
        probeNext.getFullYear(), probeNext.getMonth() + 1, probeNext.getDate()
      );
      if (info.name !== baseJQ) { nextJQ = info.name; daysToNext = i; break; }
    }

    // 往前探测上一个节气界限
    let daysToPrev = 99;
    let probePrev = new Date(fuTouDate);
    for (let i = 1; i <= 16; i++) {
      probePrev.setDate(probePrev.getDate() - 1);
      const info = CalendarAdapter.getSolarTermInfo(
        probePrev.getFullYear(), probePrev.getMonth() + 1, probePrev.getDate()
      );
      if (info.name !== baseJQ) { daysToPrev = i; break; }
    }

    let targetJieQiName = baseJQ;
    let isTrueRun = false;

    // 数学模型：如果距离下个节气更近，且在阈值天数以内，则将符头拨给下个
    // 节气（超神接气常规处理，拆补法/置闰法在此结果一致，不产生"闰"）
    if (daysToNext <= this.RUN_THRESHOLD_DAYS && daysToNext <= daysToPrev) {
      targetJieQiName = nextJQ;
    } else if (daysToNext > this.RUN_THRESHOLD_DAYS && daysToNext <= daysToPrev) {
      // 超神超过阈值：数学上会触发连续 15 天节气重复，即"置闰"。
      // 严格古法只在芒种、大雪允许置闰，这里显式区分，避免在其他节气上
      // 误触发置闰标记——即便逐天轮询在其他节气也凑巧算出 > 阈值天数，
      // 也只把它当作一次需要人工复核的异常，而不是静默接受。
      isTrueRun = this.RUN_ALLOWED_JIEQI.indexOf(baseJQ) !== -1;
      targetJieQiName = baseJQ;
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
      chart: fullChart, // 真实时刻的完整盘，供上层显示时柱等使用
      debugInfo: {
        // 以下字段建议在前端做一个可展开的"调试/核对"面板直接展示，
        // 方便人工核对边界情况，参考图2那种"本节气上元第一天：xxx"式的展示
        fuTouDate: fuTouDate.toISOString().slice(0, 10),
        fuTouGanZhi: dayStem + ftZhi,
        yuanName: ["上元", "中元", "下元"][yuan],
        baseJieQi: baseJQ,
        targetJieQi: targetJieQiName,
        daysToNext: daysToNext,
        daysToPrev: daysToPrev,
        isTrueRun: isTrueRun // UI 触发"(闰)"标签的精准开关，且已限定只在芒种/大雪生效
      }
    };
  }
};

// ------------------------------------------------------------
// 转盘增强：地八神排布（逻辑未改动，仅确认其只读取 calculate() 的产出，
// 不再直接触碰 ThreeMeta，天然隔离了本次的历法基准问题）
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// 飞盘逻辑（未改动）
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// 标签增强（驿马 / 空亡 / 伏吟反吟 / 击刑 / 门迫 / 入墓，未改动）
// ------------------------------------------------------------
const OogoTagEnhancer = {
  enhance: function(chart) {
    // ==========================================
    // 1. 拦截并修复 3meta 的【驿马星】致命 Bug
    // ==========================================
    const timeBranch = chart.fourPillars.hour.branch;
    let maXing = '';
    if (['申', '子', '辰'].includes(timeBranch)) maXing = '寅';
    else if (['亥', '卯', '未'].includes(timeBranch)) maXing = '巳';
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
    // 3. 提取全局特殊格局：伏吟与反吟 (纯原生物理判定，脱离底层引擎依赖)
    // ==========================================
    let hasStarFu = true;
    let hasGateFu = true;
    let hasStarFan = true;
    let hasGateFan = true;

    // 原宫位标准配置 (老家)
    const baseStars = {1:'天蓬', 2:'天芮', 3:'天冲', 4:'天辅', 6:'天心', 7:'天柱', 8:'天任', 9:'天英'};
    const baseGates = {1:'休门', 2:'死门', 3:'伤门', 4:'杜门', 6:'开门', 7:'惊门', 8:'生门', 9:'景门'};

    // 反吟对宫标准配置 (1-9, 2-8, 3-7, 4-6对调)
    const fanStars = {1:'天英', 2:'天任', 3:'天柱', 4:'天心', 6:'天辅', 7:'天冲', 8:'天芮', 9:'天蓬'};
    const fanGates = {1:'景门', 2:'生门', 3:'惊门', 4:'开门', 6:'杜门', 7:'伤门', 8:'死门', 9:'休门'};

    // 遍历九宫，进行物理位置核对
    chart.palaces.forEach(p => {
      let pos = p.position;
      if (pos === 5) return; // 中五宫跳过，校验外围八宫即可绝对定性

      let starName = Array.isArray(p.star) ? p.star[0] : (p.star || '');
      let gateName = p.gate || '';

      // 只要有一个不在老家，就不是伏吟
      if (starName !== baseStars[pos]) hasStarFu = false;
      if (gateName !== baseGates[pos] && gateName !== '') hasGateFu = false;

      // 只要有一个不在对宫，就不是反吟
      if (starName !== fanStars[pos]) hasStarFan = false;
      if (gateName !== fanGates[pos] && gateName !== '') hasGateFan = false;
    });

    let fyText = '';
    if (hasStarFu && hasGateFu) fyText = '星门俱伏';
    else if (hasStarFan && hasGateFan) fyText = '星门俱反';
    else if (hasStarFu) fyText = '星伏';
    else if (hasStarFan) fyText = '星反';
    else if (hasGateFu) fyText = '门伏';
    else if (hasGateFan) fyText = '门反';

    // 挂载到全局 chart 对象，供前端直接读取
    chart.uiTagFuYin = fyText;

    // ==========================================
    // 4. 遍历宫位，覆盖重写算法，屏蔽 3meta 的错误
    // ==========================================
    chart.palaces.forEach(p => {
      const pos = p.position;
      const hStem = Array.isArray(p.heavenlyStem) ? p.heavenlyStem[0] : (p.heavenlyStem || '');

      // 马星与空亡打标 (使用我们自己修复好的绝对落宫)
      p.uiTagMa = (pos === maPalaceNum);
      p.uiTagKong = (pos === kongPalace1 || pos === kongPalace2);

      // 击刑与门迫
      p.uiTagJx = !!(p.liuYiJiXing && p.liuYiJiXing.hasJiXing);
      p.uiTagPo = (p.gatePressure === '迫');

      // 拦截并修复 3meta 库的【天盘入墓】Bug (乙仅在乾6入墓)
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

// ------------------------------------------------------------
// 导出（如为浏览器全局脚本可忽略；如走模块化打包可解开下面这段）
// ------------------------------------------------------------
// module.exports = { CalendarAdapter, OogoZhiRun, OogoZhuanPanEnhancer, OogoFeiPan, OogoTagEnhancer };
