// ============================================================
// OOGO 奇门遁甲核心引擎 (含完美置闰、拆补、传统转盘与原生飞盘)
// ============================================================
// 主体系：
//   时家奇门
//   传统转盘 / 原生飞盘
//   置闰法 / 拆补法
//
// 辅助体系：
//   空亡
//   驿马
//   六仪击刑
//   门迫
//   天盘干入墓
//   伏吟 / 反吟
//   地八神
// ============================================================


// ============================================================
// 一、基础常量
// ============================================================

const QimenConst = {

  STEMS: [
    "甲","乙","丙","丁","戊",
    "己","庚","辛","壬","癸"
  ],

  BRANCHES: [
    "子","丑","寅","卯","辰","巳",
    "午","未","申","酉","戌","亥"
  ],

  // 奇门地盘九干
  QIMEN_STEMS: [
    "戊","己","庚","辛","壬",
    "癸","丁","丙","乙"
  ],

  // 洛书九宫
  PALACES: [1,2,3,4,5,6,7,8,9],

  // 八宫顺序
  // 坎 → 艮 → 震 → 巽 → 离 → 坤 → 兑 → 乾
  BAGUA_RING: [1,8,3,4,9,2,7,6],

  // 阳遁地盘顺序
  YANG_QI_RING: [1,2,3,4,5,6,7,8,9],

  // 阴遁地盘顺序
  YIN_QI_RING: [9,8,7,6,5,4,3,2,1],

  // 九星原始宫位
  STARS: {
    1: "天蓬",
    2: "天芮",
    3: "天冲",
    4: "天辅",
    5: "天禽",
    6: "天心",
    7: "天柱",
    8: "天任",
    9: "天英"
  },

  // 八门原始宫位
  GATES: {
    1: "休门",
    2: "死门",
    3: "伤门",
    4: "杜门",
    6: "开门",
    7: "惊门",
    8: "生门",
    9: "景门"
  },

  // 八门固定顺序
  GATE_ORDER: [
    "休门",
    "生门",
    "伤门",
    "杜门",
    "景门",
    "死门",
    "惊门",
    "开门"
  ],

  // 传统转盘八神
  DEITIES: [
    "值符",
    "螣蛇",
    "太阴",
    "六合",
    "白虎",
    "玄武",
    "九地",
    "九天"
  ],

  DEITY_ORDER: [
    "值符",
    "螣蛇",
    "太阴",
    "六合",
    "白虎",
    "玄武",
    "九地",
    "九天"
  ],

  // 九宫五行
  PALACE_ELEMENT: {
    1: "水",
    2: "土",
    3: "木",
    4: "木",
    5: "土",
    6: "金",
    7: "金",
    8: "土",
    9: "火"
  },

  // 天干五行
  STEM_ELEMENT: {
    "甲": "木",
    "乙": "木",
    "丙": "火",
    "丁": "火",
    "戊": "土",
    "己": "土",
    "庚": "金",
    "辛": "金",
    "壬": "水",
    "癸": "水"
  },

  // 门五行
  GATE_ELEMENT: {
    "休门": "水",
    "生门": "土",
    "伤门": "木",
    "杜门": "木",
    "景门": "火",
    "死门": "土",
    "惊门": "金",
    "开门": "金"
  },

  // 阳遁局数表
  YANG_JU: {
    "冬至": [1,7,4],
    "小寒": [2,8,5],
    "大寒": [3,9,6],
    "立春": [8,5,2],
    "雨水": [9,6,3],
    "惊蛰": [1,7,4],
    "春分": [3,9,6],
    "清明": [4,1,7],
    "谷雨": [5,2,8],
    "立夏": [4,1,7],
    "小满": [5,2,8],
    "芒种": [6,3,9]
  },

  // 阴遁局数表
  YIN_JU: {
    "夏至": [9,3,6],
    "小暑": [8,2,5],
    "大暑": [7,1,4],
    "立秋": [2,5,8],
    "处暑": [1,4,7],
    "白露": [9,3,6],
    "秋分": [7,1,4],
    "寒露": [6,9,3],
    "霜降": [5,8,2],
    "立冬": [6,9,3],
    "小雪": [5,8,2],
    "大雪": [4,7,1]
  },

  SOLAR_TERMS: [
    "小寒","大寒","立春","雨水","惊蛰","春分",
    "清明","谷雨","立夏","小满","芒种","夏至",
    "小暑","大暑","立秋","处暑","白露","秋分",
    "寒露","霜降","立冬","小雪","大雪","冬至"
  ],

  YANG_TERMS: [
    "冬至","小寒","大寒","立春",
    "雨水","惊蛰","春分","清明",
    "谷雨","立夏","小满","芒种"
  ],

  YIN_TERMS: [
    "夏至","小暑","大暑","立秋",
    "处暑","白露","秋分","寒露",
    "霜降","立冬","小雪","大雪"
  ]
};


// ============================================================
// 二、工具函数
// ============================================================

const QimenUtil = {

  mod(value, length) {
    return ((value % length) + length) % length;
  },

  palaceExists(palace) {
    return QimenConst.PALACES.includes(palace);
  },

  isOuterPalace(palace) {
    return palace !== 5;
  },

  nextDate(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  },

  dateOnly(y, m, d) {
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  },

  dateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2,"0"),
      String(date.getDate()).padStart(2,"0")
    ].join("-");
  },

  stemIndex(stem) {
    return QimenConst.STEMS.indexOf(stem);
  },

  branchIndex(branch) {
    return QimenConst.BRANCHES.indexOf(branch);
  },

  findStemBranchIndex(stem, branch) {
    for (let i = 0; i < 60; i++) {
      if (
        QimenConst.STEMS[i % 10] === stem &&
        QimenConst.BRANCHES[i % 12] === branch
      ) {
        return i;
      }
    }
    return -1;
  },

  getXunInfo(stem, branch) {
    const index = this.findStemBranchIndex(stem, branch);
    if (index < 0) {
      throw new Error(`无法确定旬：${stem}${branch}`);
    }
    const xunIndex = index - (index % 10);
    const xunNames = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"];
    const xunName = xunNames[xunIndex / 10];

    const xunStemMap = {
      "甲子": "戊", "甲戌": "己", "甲申": "庚",
      "甲午": "辛", "甲辰": "壬", "甲寅": "癸"
    };

    const xunBranch = {
      "甲子": "子", "甲戌": "戌", "甲申": "申",
      "甲午": "午", "甲辰": "辰", "甲寅": "寅"
    }[xunName];

    return {
      name: xunName,
      stem: xunStemMap[xunName],
      branch: xunBranch,
      index: index
    };
  },

  ringIndex(palace) {
    return QimenConst.BAGUA_RING.indexOf(palace);
  },

  ringMove(palace, steps, direction = 1) {
    const ring = QimenConst.BAGUA_RING;
    const index = ring.indexOf(palace);
    if (index < 0) return palace;
    return ring[this.mod(index + steps * direction, ring.length)];
  },

  numberMove(palace, steps, direction = 1) {
    return this.mod((palace - 1) + steps * direction, 9) + 1;
  },

  isJiXing(stem, palace) {
    return (
      (stem === "戊" && palace === 3) ||
      (stem === "己" && palace === 2) ||
      (stem === "庚" && palace === 8) ||
      (stem === "辛" && palace === 9) ||
      (stem === "壬" && palace === 4) ||
      (stem === "癸" && palace === 4)
    );
  },

  isTianGanMu(stem, palace) {
    if (palace === 6 && ["乙","丙","戊"].includes(stem)) return true;
    if (palace === 8 && ["丁","己","庚"].includes(stem)) return true;
    if (palace === 4 && ["辛","壬"].includes(stem)) return true;
    if (palace === 2 && stem === "癸") return true;
    return false;
  },

  isMenPo(gate, palace) {
    if (!gate) return false;
    const gateElement = QimenConst.GATE_ELEMENT[gate];
    const palaceElement = QimenConst.PALACE_ELEMENT[palace];
    if (!gateElement || !palaceElement) return false;

    return (
      (gateElement === "水" && palaceElement === "火") ||
      (gateElement === "火" && palaceElement === "金") ||
      (gateElement === "金" && palaceElement === "木") ||
      (gateElement === "木" && palaceElement === "土") ||
      (gateElement === "土" && palaceElement === "水")
    );
  }
};


// ============================================================
// 三、CalendarAdapter
// ============================================================

const CalendarAdapter = {
  getDayGanZhi(year, month, day) {
    const c = ThreeMeta.QimenChart.fromSolar(year, month, day, 12, 0, 0);
    return c.fourPillars.day;
  },

  getFullChart(year, month, day, hour, min, sec = 0) {
    return ThreeMeta.QimenChart.fromSolar(year, month, day, hour, min, sec);
  },

  getSolarTermInfo(year, month, day) {
    const c = ThreeMeta.QimenChart.fromSolar(year, month, day, 12, 0, 0);
    const st = c.timeInfo && c.timeInfo.solarTerm;
    if (typeof st === "string") {
      return { name: st, exactTime: null };
    }
    return {
      name: st && st.name ? st.name : null,
      exactTime: st && (st.exactTime || st.exactDate || st.time || null)
    };
  }
};


// ============================================================
// 四、符头系统与节气扫描器
// ============================================================

const QimenFuTou = {
  getFuTouDate(year, month, day) {
    const dayGZ = CalendarAdapter.getDayGanZhi(year, month, day);
    const stem = dayGZ.stem;
    const offset =
      stem === "甲" || stem === "己" ? 0 :
      stem === "乙" ? 1 : stem === "丙" ? 2 :
      stem === "丁" ? 3 : stem === "戊" ? 4 :
      stem === "庚" ? 1 : stem === "辛" ? 2 :
      stem === "壬" ? 3 : 4;

    const date = QimenUtil.dateOnly(year, month, day);
    const fuTouDate = QimenUtil.nextDate(date, -offset);
    const gz = CalendarAdapter.getDayGanZhi(
      fuTouDate.getFullYear(),
      fuTouDate.getMonth() + 1,
      fuTouDate.getDate()
    );

    return {
      date: fuTouDate,
      stem: gz.stem,
      branch: gz.branch,
      ganZhi: gz.stem + gz.branch
    };
  },

  getYuanFromFuTou(fuTouGanZhi) {
    const branch = fuTouGanZhi.branch;
    if (["子","午","卯","酉"].includes(branch)) return { index: 0, name: "上元" };
    if (["寅","申","巳","亥"].includes(branch)) return { index: 1, name: "中元" };
    if (["辰","戌","丑","未"].includes(branch)) return { index: 2, name: "下元" };
    throw new Error(`无法判定三元：${fuTouGanZhi.stem}${branch}`);
  }
};

const QimenSolarTerm = {
  findPreviousTerm(date, maxDays = 20) {
    let d = QimenUtil.dateOnly(date.getFullYear(), date.getMonth() + 1, date.getDate());
    let currentInfo = CalendarAdapter.getSolarTermInfo(d.getFullYear(), d.getMonth() + 1, d.getDate());
    let currentName = currentInfo.name;

    for (let i = 0; i <= maxDays; i++) {
      const info = CalendarAdapter.getSolarTermInfo(d.getFullYear(), d.getMonth() + 1, d.getDate());
      if (info.name !== currentName) {
        const termDate = QimenUtil.nextDate(d, 1);
        return { name: currentName, date: termDate };
      }
      d = QimenUtil.nextDate(d, -1);
    }
    return { name: currentName, date: d };
  },

  findNextTerm(date, maxDays = 20) {
    let d = QimenUtil.dateOnly(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const base = CalendarAdapter.getSolarTermInfo(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const baseName = base.name;

    for (let i = 1; i <= maxDays; i++) {
      d = QimenUtil.nextDate(d, 1);
      const info = CalendarAdapter.getSolarTermInfo(d.getFullYear(), d.getMonth() + 1, d.getDate());
      if (info.name !== baseName) {
        return { name: info.name, date: d };
      }
    }
    return null;
  },

  isYangDun(termName) {
    return QimenConst.YANG_TERMS.includes(termName);
  },

  getJuTable(termName, isYang) {
    const table = isYang ? QimenConst.YANG_JU : QimenConst.YIN_JU;
    return table[termName] || null;
  }
};


// ============================================================
// 五、置闰法与拆补法
// ============================================================

const OogoZhiRun = {
  classifyFuTouAndTerm(fuTouDate, termDate) {
    const diff = Math.round((fuTouDate.getTime() - termDate.getTime()) / 86400000);
    if (diff === 0) return { type: "正授", days: 0 };
    if (diff < 0) return { type: "超神", days: Math.abs(diff) };
    return { type: "接气", days: diff };
  },

  getCurrentTermContext(year, month, day) {
    const date = QimenUtil.dateOnly(year, month, day);
    const current = CalendarAdapter.getSolarTermInfo(year, month, day);
    const previous = QimenSolarTerm.findPreviousTerm(date);
    const next = QimenSolarTerm.findNextTerm(date);
    return { date, currentName: current.name, previous, next };
  },

  calculate(year, month, day, hour, min, sec = 0) {
    const fullChart = CalendarAdapter.getFullChart(year, month, day, hour, min, sec);
    const fuTou = QimenFuTou.getFuTouDate(year, month, day);
    const yuan = QimenFuTou.getYuanFromFuTou({ stem: fuTou.stem, branch: fuTou.branch });

    const termContext = this.getCurrentTermContext(year, month, day);
    const termName = termContext.currentName;
    const termDate = termContext.previous.date;

    const relation = this.classifyFuTouAndTerm(fuTou.date, termDate);
    const isYang = QimenSolarTerm.isYangDun(termName);

    let superShenDays = relation.type === "超神" ? relation.days : 0;
    let isTrueRun = false;
    if (superShenDays > 9 && (termName === "芒种" || termName === "大雪")) {
      isTrueRun = true;
    }

    const table = QimenSolarTerm.getJuTable(termName, isYang);
    if (!table) throw new Error(`没有找到节气局数表：${termName}`);

    let yuanIndex = yuan.index;
    let mode = relation.type;
    if (isTrueRun) mode = "闰奇";

    const juNumber = table[yuanIndex];

    return {
      chart: fullChart,
      method: "置闰法",
      juNumber,
      isYangdun: isYang,
      termName,
      termDate,
      fuTouDate: fuTou.date,
      fuTouGanZhi: fuTou.ganZhi,
      yuanIndex,
      yuanName: yuan.name,
      relation: mode,
      superShenDays,
      isTrueRun,
      debugInfo: {
        currentDate: QimenUtil.dateKey(QimenUtil.dateOnly(year, month, day)),
        fuTouDate: QimenUtil.dateKey(fuTou.date),
        fuTouGanZhi: fuTou.ganZhi,
        yuan: yuan.name,
        solarTerm: termName,
        solarTermDate: QimenUtil.dateKey(termDate),
        relation: relation.type,
        relationDays: relation.days,
        superShenDays,
        isTrueRun,
        juNumber,
        isYangdun: isYang
      }
    };
  }
};

const OogoChaiBu = {
  calculate(year, month, day, hour, min, sec = 0) {
    const fullChart = CalendarAdapter.getFullChart(year, month, day, hour, min, sec);
    const date = QimenUtil.dateOnly(year, month, day);
    const term = QimenSolarTerm.findPreviousTerm(date);
    const termName = term.name;
    const termDate = term.date;

    const days = Math.floor((date.getTime() - termDate.getTime()) / 86400000);
    let yuanIndex = Math.floor(days / 5);
    if (yuanIndex < 0) yuanIndex = 0;
    if (yuanIndex > 2) yuanIndex = 2;

    const isYang = QimenSolarTerm.isYangDun(termName);
    const table = QimenSolarTerm.getJuTable(termName, isYang);
    if (!table) throw new Error(`拆补法没有找到局数表：${termName}`);

    return {
      chart: fullChart,
      method: "拆补法",
      juNumber: table[yuanIndex],
      isYangdun: isYang,
      termName,
      termDate,
      yuanIndex,
      yuanName: ["上元","中元","下元"][yuanIndex],
      debugInfo: {
        termName,
        termDate: QimenUtil.dateKey(termDate),
        daysFromTerm: days,
        yuanIndex,
        yuanName: ["上元","中元","下元"][yuanIndex],
        juNumber: table[yuanIndex]
      }
    };
  }
};


// ============================================================
// 六、空亡、驿马与标签增强
// ============================================================

const OogoKongWang = {
  get(timeStem, timeBranch) {
    const index = QimenUtil.findStemBranchIndex(timeStem, timeBranch);
    if (index < 0) throw new Error(`无法确定旬空：${timeStem}${timeBranch}`);
    const xunOffset = index % 10;
    const branchIndex = QimenUtil.branchIndex(timeBranch);

    const kong1 = QimenConst.BRANCHES[QimenUtil.mod(branchIndex + (10 - xunOffset), 12)];
    const kong2 = QimenConst.BRANCHES[QimenUtil.mod(branchIndex + (11 - xunOffset), 12)];
    return [kong1, kong2];
  },

  branchToPalace(branch) {
    const map = {
      "子": 1, "丑": 8, "寅": 8, "卯": 3,
      "辰": 4, "巳": 4, "午": 9, "未": 2,
      "申": 2, "酉": 7, "戌": 6, "亥": 6
    };
    return map[branch] || 0;
  }
};

const OogoYiMa = {
  getMaBranch(timeBranch) {
    if (["申","子","辰"].includes(timeBranch)) return "寅";
    if (["亥","卯","未"].includes(timeBranch)) return "巳";
    if (["寅","午","戌"].includes(timeBranch)) return "申";
    if (["巳","酉","丑"].includes(timeBranch)) return "亥";
    return "";
  },

  branchToPalace(branch) {
    return { "寅": 8, "巳": 4, "申": 2, "亥": 6 }[branch] || 0;
  },

  calculate(timeBranch) {
    const branch = this.getMaBranch(timeBranch);
    return { branch, palace: this.branchToPalace(branch) };
  }
};

const OogoFuFan = {
  starBase: { 1: "天蓬", 2: "天芮", 3: "天冲", 4: "天辅", 6: "天心", 7: "天柱", 8: "天任", 9: "天英" },
  gateBase: { 1: "休门", 2: "死门", 3: "伤门", 4: "杜门", 6: "开门", 7: "惊门", 8: "生门", 9: "景门" },
  opposite: { 1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4 },

  analyze(palaces) {
    let starFu = true, gateFu = true, starFan = true, gateFan = true;
    for (const p of palaces) {
      if (p.position === 5) continue;
      const star = Array.isArray(p.star) ? p.star[0] : p.star;
      const gate = p.gate || "";

      if (star !== this.starBase[p.position]) starFu = false;
      if (gate && gate !== this.gateBase[p.position]) gateFu = false;

      const opposite = this.opposite[p.position];
      if (star !== this.starBase[opposite]) starFan = false;
      if (gate && gate !== this.gateBase[opposite]) gateFan = false;
    }

    let text = "";
    if (starFu && gateFu) text = "星门俱伏";
    else if (starFan && gateFan) text = "星门俱反";
    else if (starFu) text = "星伏";
    else if (starFan) text = "星反";
    else if (gateFu) text = "门伏";
    else if (gateFan) text = "门反";

    return { starFu, gateFu, starFan, gateFan, text };
  }
};

const OogoTagEnhancer = {
  enhance(chart) {
    const timeStem = chart.fourPillars.hour.stem;
    const timeBranch = chart.fourPillars.hour.branch;

    const kong = OogoKongWang.get(timeStem, timeBranch);
    const kongPalaces = kong.map(b => OogoKongWang.branchToPalace(b)).filter(Boolean);
    const ma = OogoYiMa.calculate(timeBranch);

    chart.palaces.forEach(p => {
      const hStem = Array.isArray(p.heavenlyStem) ? p.heavenlyStem[0] : p.heavenlyStem;

      p.uiTagKong = kongPalaces.includes(p.position);
      p.uiTagMa = (p.position === ma.palace);
      p.uiTagJx = QimenUtil.isJiXing(hStem, p.position);
      p.uiTagPo = QimenUtil.isMenPo(p.gate, p.position);
      p.uiTagMu = QimenUtil.isTianGanMu(hStem, p.position);

      p.liuYiJiXing = { hasJiXing: p.uiTagJx };
      p.gatePressure = { hasPressure: p.uiTagPo, text: p.uiTagPo ? "门迫" : "" };
      p.tombInfo = { heavenlyStemInTomb: p.uiTagMu ? [hStem] : [], earthlyStemInTomb: [] };
    });

    chart.kongWang = { branches: kong, palaces: kongPalaces };
    chart.yiMa = ma;
    chart.uiTagFuYinFanYin = OogoFuFan.analyze(chart.palaces);

    return chart;
  }
};


// ============================================================
// 七、传统转盘模块 (DiPan, ZhuanXing, ZhuanMen, TianShen, DiShen)
// ============================================================

const OogoDiPan = {
  build(juNumber, isYang) {
    const result = {};
    const order = isYang ? [1,2,3,4,5,6,7,8,9] : [9,8,7,6,5,4,3,2,1];
    for (let i = 0; i < 9; i++) {
      result[order[i]] = QimenConst.QIMEN_STEMS[i];
    }
    return result;
  }
};

const OogoZhuanXing = {
  getStarAtOriginalPalace(palace) {
    if (palace === 5) return "天禽";
    return QimenConst.STARS[palace];
  },

  build(earthStems, timeStem, xunStem, xunPalace, isYang) {
    const result = {};
    const effectiveTimeStem = timeStem === "甲" ? xunStem : timeStem;
    let timeStemPalace = null;

    for (const p of QimenConst.PALACES) {
      if (earthStems[p] === effectiveTimeStem) {
        timeStemPalace = p;
        break;
      }
    }
    if (!timeStemPalace) throw new Error(`找不到时干地盘宫：${effectiveTimeStem}`);

    const zhiFuStar = OogoZhuanXing.getStarAtOriginalPalace(xunPalace);
    const ring = QimenConst.BAGUA_RING;
    const xunRingIndex = ring.indexOf(xunPalace);
    const targetRingIndex = ring.indexOf(timeStemPalace);

    const shift = QimenUtil.mod(targetRingIndex - xunRingIndex, 8);
    for (let i = 0; i < 8; i++) {
      const sourcePalace = ring[QimenUtil.mod(xunRingIndex + i, 8)];
      const targetPalace = ring[QimenUtil.mod(xunRingIndex + i + shift, 8)];
      result[targetPalace] = QimenConst.STARS[sourcePalace];
    }

    let tianRuiPalace = null;
    for (const p of QimenConst.PALACES) {
      if (result[p] === "天芮") { tianRuiPalace = p; break; }
    }
    if (tianRuiPalace) result[tianRuiPalace] = "天芮/天禽";

    return { stars: result, zhiFuStar, zhiFuPalace: timeStemPalace };
  }
};

const OogoZhuanMen = {
  getOriginalGate(palace) {
    return QimenConst.GATES[palace] || "";
  },

  build(xunPalace, xunBranch, timeBranch, isYang) {
    const result = {};
    const xunIndex = QimenUtil.branchIndex(xunBranch);
    const timeIndex = QimenUtil.branchIndex(timeBranch);
    const branchOffset = QimenUtil.mod(timeIndex - xunIndex, 12);

    const targetPalace = QimenUtil.numberMove(xunPalace, branchOffset, isYang ? 1 : -1);
    const effectiveXunPalace = xunPalace === 5 ? 2 : xunPalace;
    const zhiShiGate = OogoZhuanMen.getOriginalGate(effectiveXunPalace);

    const ring = QimenConst.BAGUA_RING;
    const targetRingIndex = ring.indexOf(targetPalace);
    const gateIndex = QimenConst.GATE_ORDER.indexOf(zhiShiGate);

    for (let i = 0; i < 8; i++) {
      const gate = QimenConst.GATE_ORDER[QimenUtil.mod(gateIndex + i, 8)];
      const palace = ring[QimenUtil.mod(targetRingIndex + i, 8)];
      result[palace] = gate;
    }

    return { gates: result, zhiShiGate, zhiShiPalace: targetPalace, branchOffset };
  }
};

const OogoTianShen = {
  build(zhiFuPalace, isYang) {
    const result = {};
    const ring = QimenConst.BAGUA_RING;
    const start = ring.indexOf(zhiFuPalace);
    const direction = isYang ? 1 : -1;

    for (let i = 0; i < 8; i++) {
      const palace = ring[QimenUtil.mod(start + direction * i, 8)];
      result[palace] = QimenConst.DEITY_ORDER[i];
    }
    return result;
  }
};

const OogoDiShen = {
  build(earthXunPalace, isYang) {
    const result = {};
    const ring = QimenConst.BAGUA_RING;
    const start = ring.indexOf(earthXunPalace);
    const direction = isYang ? 1 : -1;

    for (let i = 0; i < 8; i++) {
      const palace = ring[QimenUtil.mod(start + direction * i, 8)];
      result[palace] = QimenConst.DEITY_ORDER[i];
    }
    return result;
  }
};

const OogoZhuanPan = {
  calculate(year, month, day, hour, min, sec = 0, method = "zhirun") {
    let juInfo = method === "chaibu" ? OogoChaiBu.calculate(year, month, day, hour, min, sec) : OogoZhiRun.calculate(year, month, day, hour, min, sec);
    const chart = juInfo.chart;
    const juNumber = juInfo.juNumber;
    const isYang = juInfo.isYangdun;

    const timeStem = chart.fourPillars.hour.stem;
    const timeBranch = chart.fourPillars.hour.branch;
    const xun = QimenUtil.getXunInfo(timeStem, timeBranch);

    const earthStems = OogoDiPan.build(juNumber, isYang);
    let xunPalace = null;
    for (const p of QimenConst.PALACES) {
      if (earthStems[p] === xun.stem) { xunPalace = p; break; }
    }
    if (xunPalace === 5) xunPalace = 2;
    if (!xunPalace) throw new Error(`找不到旬首地盘宫：${xun.stem}`);

    const starInfo = OogoZhuanXing.build(earthStems, timeStem, xun.stem, xunPalace, isYang);
    const gateInfo = OogoZhuanMen.build(xunPalace, xun.branch, timeBranch, isYang);
    const heavenDeities = OogoTianShen.build(starInfo.zhiFuPalace, isYang);
    const earthDeities = OogoDiShen.build(xunPalace, isYang);

    const palaces = [];
    for (const position of QimenConst.PALACES) {
      palaces.push({
        position,
        earthStem: earthStems[position] || "",
        heavenlyStem: "",
        earthlyStem: earthStems[position] || "",
        star: starInfo.stars[position] || "",
        gate: gateInfo.gates[position] || "",
        deity: heavenDeities[position] || "",
        earthDeity: earthDeities[position] || "",
        hiddenStem: "",
        isJiGong: position === 5
      });
    }

    const ring = QimenConst.BAGUA_RING;
    const effectiveTimeStem = timeStem === "甲" ? xun.stem : timeStem;
    let timeStemPalace = null;
    for (const p of QimenConst.PALACES) {
      if (earthStems[p] === effectiveTimeStem) { timeStemPalace = p; break; }
    }

    const xunRingIndex = ring.indexOf(xunPalace);
    const targetRingIndex = ring.indexOf(timeStemPalace);
    const starShift = QimenUtil.mod(targetRingIndex - xunRingIndex, 8);

    const heavenStems = {};
    for (let i = 0; i < 8; i++) {
      const sourcePalace = ring[QimenUtil.mod(xunRingIndex + i, 8)];
      const targetPalace = ring[QimenUtil.mod(xunRingIndex + i + starShift, 8)];
      heavenStems[targetPalace] = earthStems[sourcePalace];
    }
    heavenStems[5] = heavenStems[2];

    palaces.forEach(p => {
      p.heavenlyStem = heavenStems[p.position] || "";
    });

    const result = {
      method: juInfo.method,
      ju: { number: juNumber, type: isYang ? "阳遁" : "阴遁" },
      chart,
      fourPillars: chart.fourPillars,
      solarTerm: { name: juInfo.termName, date: juInfo.termDate },
      fuTou: { date: juInfo.fuTouDate, ganZhi: juInfo.fuTouGanZhi, yuan: juInfo.yuanName },
      zhiFu: { star: starInfo.zhiFuStar, position: starInfo.zhiFuPalace },
      zhiShi: { gate: gateInfo.zhiShiGate, position: gateInfo.zhiShiPalace },
      xun: { name: xun.name, stem: xun.stem, branch: xun.branch, palace: xunPalace },
      palaces,
      debugInfo: juInfo.debugInfo
    };

    return OogoTagEnhancer.enhance(result);
  }
};


// ============================================================
// 八、原生飞盘模块 (OogoFeiPan) —— 完整恢复移入
// ============================================================

const OogoFeiPan = {
  fly(chart) {
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
    const flyStars = {}; 
    const flyHeavenStems = {};
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

    // 飞神 (九神体系)
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

    // 覆写原盘属性并重新判定神煞
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

      // 1. 六仪击刑
      let jx = false;
      if ((hStem === '戊' && pos === 3) || (hStem === '己' && pos === 2) ||
          (hStem === '庚' && pos === 8) || (hStem === '辛' && pos === 9) ||
          (hStem === '壬' && pos === 4) || (hStem === '癸' && pos === 4)) { jx = true; }
      p.liuYiJiXing = { hasJiXing: jx };

      // 2. 门迫
      const gateEle = {"休门":"水","生门":"土","伤门":"木","杜门":"木","景门":"火","死门":"土","惊门":"金","开门":"金","中门":"土"}[gate];
      const palaceEle = {1:"水",2:"土",3:"木",4:"木",5:"土",6:"金",7:"金",8:"土",9:"火"}[pos];
      let po = false;
      if ((gateEle==='水'&&palaceEle==='火') || (gateEle==='火'&&palaceEle==='金') ||
          (gateEle==='金'&&palaceEle==='木') || (gateEle==='木'&&palaceEle==='土') ||
          (gateEle==='土'&&palaceEle==='水')) { po = true; }
      p.gatePressure = { hasPressure: po, text: po ? '门迫' : '' };

      // 3. 天盘入墓
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

    return OogoTagEnhancer.enhance(chart);
  }
};


// ============================================================
// 九、转盘增强器 (带阳遁勾陈/朱雀切换)
// ============================================================

const OogoZhuanPanEnhancer = {
  enhance(chart, xunDun, isYang) {
    if (!chart) throw new Error("OogoZhuanPanEnhancer：chart不能为空");
    const ring = QimenConst.BAGUA_RING;
    const deitiesYang = ['值符', '腾蛇', '太阴', '六合', '勾陈', '朱雀', '九地', '九天'];
    const deitiesYin  = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
    const deities = isYang ? deitiesYang : deitiesYin;

    let earthXunPalace = 5;
    for (const p of chart.palaces) {
      const stem = Array.isArray(p.earthlyStem) ? p.earthlyStem[0] : p.earthlyStem;
      if (stem === xunDun) {
        earthXunPalace = p.position;
        break;
      }
    }
    if (earthXunPalace === 5) earthXunPalace = 2;

    const earthDeitiesMap = {};
    const eDeityStartIndex = ring.indexOf(earthXunPalace);
    if (eDeityStartIndex !== -1) {
      for (let i = 0; i < 8; i++) {
        let targetPalace = ring[isYang ? (eDeityStartIndex + i) % 8 : (eDeityStartIndex - i + 8) % 8];
        earthDeitiesMap[targetPalace] = deities[i];
      }
    }

    chart.palaces.forEach(p => {
      p.earthDeity = earthDeitiesMap[p.position] || "";
    });

    return chart;
  }
};


// ============================================================
// 十、统一入口与导出
// ============================================================

const OogoQimen = {
  calculate(year, month, day, hour, min, sec = 0) {
    return OogoZhuanPan.calculate(year, month, day, hour, min, sec, "zhirun");
  },

  calculateChaiBu(year, month, day, hour, min, sec = 0) {
    return OogoZhuanPan.calculate(year, month, day, hour, min, sec, "chaibu");
  },

  calculateZhiRun(year, month, day, hour, min, sec = 0) {
    return OogoZhiRun.calculate(year, month, day, hour, min, sec);
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    QimenConst, QimenUtil, CalendarAdapter, QimenFuTou, QimenSolarTerm,
    OogoZhiRun, OogoChaiBu, OogoDiPan, OogoZhuanXing, OogoZhuanMen,
    OogoTianShen, OogoDiShen, OogoKongWang, OogoYiMa, OogoFuFan,
    OogoTagEnhancer, OogoZhuanPan, OogoZhuanPanEnhancer, OogoFeiPan, OogoQimen
  };
}

if (typeof window !== "undefined") {
  window.OogoQimen = OogoQimen;
  window.OogoZhiRun = OogoZhiRun;
  window.OogoChaiBu = OogoChaiBu;
  window.OogoZhuanPan = OogoZhuanPan;
  window.OogoFeiPan = OogoFeiPan;
  window.OogoZhuanPanEnhancer = OogoZhuanPanEnhancer;
}
