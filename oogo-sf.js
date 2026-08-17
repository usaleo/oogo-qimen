// ============================================================
// OOGO 奇门遁甲核心引擎 (含完美置闰、拆补、传统转盘与原生飞盘)
// 全量修正版 2026-08-15 - 补全转盘天/地盘干寄宫数组显示逻辑
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

  // 八宫顺序（转盘用）
  // 坎 → 艮 → 震 → 巽 → 离 → 坤 → 兑 → 乾
  BAGUA_RING: [1,8,3,4,9,2,7,6],

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

  // 八门固定顺序（永远顺时针）
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

  // 传统转盘八神（阴遁默认）
  DEITY_ORDER_YIN: [
    "符",
    "螣",
    "阴",
    "合",
    "白",
    "玄",
    "地",
    "天"
  ],

  // 阳遁八神（勾陈/朱雀）
  DEITY_ORDER_YANG: [
    "符",
    "螣",
    "阴",
    "合",
    "白",
    "玄",
    "地",
    "天"
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

  // 统一中宫寄坤
  resolveJiGong(palace) {
    return palace === 5 ? 2 : palace;
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
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
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
    if (palace === 6 && ["乙", "丙", "戊"].includes(stem)) return true;
    if (palace === 8 && ["丁", "己", "庚"].includes(stem)) return true;
    if (palace === 4 && ["辛", "壬"].includes(stem)) return true;
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
// 三、CalendarAdapter (强制跨日终极版)
// ============================================================
const CalendarAdapter = {
  getDayGanZhi(year, month, day) {
    const solar = OogoCalendar.Solar.fromYmdHms(year, month, day, 12, 0, 0);
    const lunar = OogoCalendar.Lunar.fromSolar(solar);
    return {
      stem: lunar.getDayGanExact(),
      branch: lunar.getDayZhiExact()
    };
  },

  getFullChart(year, month, day, hour, min, sec = 0) {
    // ★ 核心拦截：彻底废掉“夜子时”，只要 >= 23 点，八字和排盘强制推到第二天！
    let baziY = year, baziM = month, baziD = day, baziH = hour;
    if (hour >= 23) {
        let nextD = new Date(year, month - 1, day + 1);
        baziY = nextD.getFullYear();
        baziM = nextD.getMonth() + 1;
        baziD = nextD.getDate();
        baziH = 0; // 当作第二天早子时，确保日柱、时柱全部跨日
    }

    const solar = OogoCalendar.Solar.fromYmdHms(baziY, baziM, baziD, baziH, min, sec);
    const lunar = OogoCalendar.Lunar.fromSolar(solar);
    
    // 节气交接时间必须按真实时间算，不能推到第二天，防止错位
    const origSolar = OogoCalendar.Solar.fromYmdHms(year, month, day, hour, min, sec);
    const origLunar = OogoCalendar.Lunar.fromSolar(origSolar);
    const prevJieQi = origLunar.getPrevJieQi();
    
    return {
      fourPillars: {
        year: { stem: lunar.getYearGanExact(), branch: lunar.getYearZhiExact() },
        month: { stem: lunar.getMonthGanExact(), branch: lunar.getMonthZhiExact() },
        day: { stem: lunar.getDayGanExact(), branch: lunar.getDayZhiExact() },
        hour: { stem: lunar.getTimeGan(), branch: lunar.getTimeZhi() }
      },
      timeInfo: {
        solarTerm: prevJieQi.getName(),
        solarTermTime: prevJieQi.getSolar().toYmdHms()
      },
      // 飞盘防报错底座
      palaces: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(pos => ({ position: pos }))
    };
  },

  getSolarTermInfo(year, month, day) {
    const solar = OogoCalendar.Solar.fromYmdHms(year, month, day, 12, 0, 0);
    const lunar = OogoCalendar.Lunar.fromSolar(solar);
    const jq = lunar.getPrevJieQi();
    return { name: jq.getName(), exactTime: jq.getSolar().toYmdHms() };
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
    if (["子", "午", "卯", "酉"].includes(branch)) return { index: 0, name: "上元" };
    if (["寅", "申", "巳", "亥"].includes(branch)) return { index: 1, name: "中元" };
    if (["辰", "戌", "丑", "未"].includes(branch)) return { index: 2, name: "下元" };
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
// 五、置闰法与拆补法 (彻底修复子时跨日引擎割裂BUG)
// ============================================================

const OogoZhiRun = {
  createDate(y, m, d) { return new Date(y, m - 1, d, 12, 0, 0, 0); },
  addDays(date, days) { let d = new Date(date.getTime()); d.setDate(d.getDate() + days); return d; },
  diffDays(d1, d2) { return Math.round((d1.getTime() - d2.getTime()) / 86400000); },
  
  getDayGanzhiIndex(date) {
    let y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    let chart = CalendarAdapter.getDayGanZhi(y, m, d);
    return QimenUtil.findStemBranchIndex(chart.stem, chart.branch);
  },

  getSolsticeDate(year, isWinter) {
    let m = isWinter ? 12 : 6;
    let targetTerm = isWinter ? "冬至" : "夏至";
    for (let d = 15; d <= 25; d++) {
        let chart = CalendarAdapter.getSolarTermInfo(year, m, d);
        if (chart.name === targetTerm) {
            let prevChart = CalendarAdapter.getSolarTermInfo(year, m, d - 1);
            if (prevChart.name !== targetTerm) return this.createDate(year, m, d);
        }
    }
    return this.createDate(year, m, 21);
  },

  getAnchorUpperYuan(solsticeDate) {
    for (let offset = -9; offset <= 5; offset++) {
        let d = this.addDays(solsticeDate, offset);
        if (this.getDayGanzhiIndex(d) % 15 === 0) return d;
    }
    return solsticeDate;
  },

  getTermStartDateExact(termName, targetDate) {
    for (let d = -30; d <= 30; d++) {
        let testDate = this.addDays(targetDate, d);
        let chart = CalendarAdapter.getSolarTermInfo(testDate.getFullYear(), testDate.getMonth() + 1, testDate.getDate());
        if (chart.name === termName) {
            let prevDate = this.addDays(testDate, -1);
            let prevChart = CalendarAdapter.getSolarTermInfo(prevDate.getFullYear(), prevDate.getMonth() + 1, prevDate.getDate());
            if (prevChart.name !== termName) return testDate;
        }
    }
    return targetDate; 
  },

  calculate(year, month, day, hour, min, sec = 0) {
    // 1. 获取四柱 (OogoCalendar会自动把 23:00 后的日柱推到第二天)
    const fullChart = CalendarAdapter.getFullChart(year, month, day, hour, min, sec);
    
    // 2. 强制同步引擎基准日期！如果 >= 23 点，引擎计算局数的日期必须跟着 +1 天！
    let tYear = year, tMonth = month, tDay = day;
    if (hour >= 23) {
        let nextD = new Date(year, month - 1, day + 1);
        tYear = nextD.getFullYear();
        tMonth = nextD.getMonth() + 1;
        tDay = nextD.getDate();
    }
    let targetDate = this.createDate(tYear, tMonth, tDay);

    // 3. 所有节气推算，必须使用 tYear，防止跨年除夕夜出现严重BUG
    let SS_prev = this.getSolsticeDate(tYear - 1, false);
    let WS_prev = this.getSolsticeDate(tYear - 1, true);
    let SS_curr = this.getSolsticeDate(tYear, false);
    let WS_curr = this.getSolsticeDate(tYear, true);

    let A_SS_prev = this.getAnchorUpperYuan(SS_prev);
    let A_WS_prev = this.getAnchorUpperYuan(WS_prev);
    let A_SS_curr = this.getAnchorUpperYuan(SS_curr);
    let A_WS_curr = this.getAnchorUpperYuan(WS_curr);

    let FT_D = null;
    for (let offset = 0; offset >= -14; offset--) {
        let d = this.addDays(targetDate, offset);
        if (this.getDayGanzhiIndex(d) % 15 === 0) {
            FT_D = d;
            break;
        }
    }

    let isYang = true;
    let termsList = QimenConst.YANG_TERMS;
    let baseAnchor = null;

    if (FT_D.getTime() < A_WS_prev.getTime()) {
        isYang = false; termsList = QimenConst.YIN_TERMS; baseAnchor = A_SS_prev;
    } else if (FT_D.getTime() < A_SS_curr.getTime()) {
        isYang = true; termsList = QimenConst.YANG_TERMS; baseAnchor = A_WS_prev;
    } else if (FT_D.getTime() < A_WS_curr.getTime()) {
        isYang = false; termsList = QimenConst.YIN_TERMS; baseAnchor = A_SS_curr;
    } else {
        isYang = true; termsList = QimenConst.YANG_TERMS; baseAnchor = A_WS_curr;
    }

    let diffDays = this.diffDays(FT_D, baseAnchor);
    let k = Math.round(diffDays / 15);

    let isTrueRun = false;
    let termIndex = k;
    if (k >= 12) { termIndex = 11; isTrueRun = true; }

    let termName = termsList[termIndex];
    let daysSinceFT = this.diffDays(targetDate, FT_D);
    let yuanIndex = Math.floor(daysSinceFT / 5); 
    let yuanName = ["上元", "中元", "下元"][yuanIndex];

    let table = isYang ? QimenConst.YANG_JU[termName] : QimenConst.YIN_JU[termName];
    let juNumber = table[yuanIndex];

    let astroStart = this.getTermStartDateExact(termName, targetDate);
    let relationDays = this.diffDays(FT_D, astroStart);
    let relation = relationDays === 0 ? "正授" : (relationDays < 0 ? "超神" : "接气");
    let superShenDays = relation === "超神" ? Math.abs(relationDays) : 0;
    if (isTrueRun) relation = "闰奇";

    let fuTouChart = CalendarAdapter.getDayGanZhi(FT_D.getFullYear(), FT_D.getMonth() + 1, FT_D.getDate());
    let fuTouGanZhi = fuTouChart.stem + fuTouChart.branch;

    return {
        chart: fullChart,
        method: "置闰法",
        juNumber: juNumber,
        isYangdun: isYang,
        termName: termName,
        termDate: astroStart,
        fuTouDate: FT_D,
        fuTouGanZhi: fuTouGanZhi,
        yuanIndex: yuanIndex,
        yuanName: yuanName,
        relation: relation,
        superShenDays: superShenDays,
        isTrueRun: isTrueRun,
        debugInfo: {}
    };
  }
};

const OogoChaiBu = {
  calculate(year, month, day, hour, min, sec = 0) {
    const fullChart = CalendarAdapter.getFullChart(year, month, day, hour, min, sec);
    
    // 拆补法同样需要处理跨日
    let tYear = year, tMonth = month, tDay = day;
    if (hour >= 23) {
        let nextD = new Date(year, month - 1, day + 1);
        tYear = nextD.getFullYear();
        tMonth = nextD.getMonth() + 1;
        tDay = nextD.getDate();
    }
    const date = QimenUtil.dateOnly(tYear, tMonth, tDay);
    
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
      yuanName: ["上元", "中元", "下元"][yuanIndex],
      debugInfo: {}
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
    if (["申", "子", "辰"].includes(timeBranch)) return "寅";
    if (["亥", "卯", "未"].includes(timeBranch)) return "巳";
    if (["寅", "午", "戌"].includes(timeBranch)) return "申";
    if (["巳", "酉", "丑"].includes(timeBranch)) return "亥";
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
      let star = Array.isArray(p.star) ? p.star[0] : p.star;
      
      // ★ 修改：通用兼容处理，无论是"天芮/天禽"还是"天任/天禽"，都砍掉"/天禽"只留主星比对
      if (star && star.includes("/天禽")) {
        star = star.replace("/天禽", "");
      }
      
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
// 七、传统转盘模块
// ============================================================

const OogoDiPan = {
  build(juNumber, isYang) {
    const result = {};
    const stems = QimenConst.QIMEN_STEMS;
    let palace = juNumber;
    const direction = isYang ? 1 : -1;

    for (let i = 0; i < 9; i++) {
      result[palace] = stems[i];
      palace = QimenUtil.numberMove(palace, 1, direction);
    }
    return result;
  }
};

const OogoZhuanXing = {
  getStarAtOriginalPalace(palace) {
    if (palace === 5) return "天禽";
    return QimenConst.STARS[palace];
  },

  build(earthStems, timeStem, xunStem, origXunPalace, isYang) {
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

    const zhiFuStar = this.getStarAtOriginalPalace(origXunPalace === 5 ? 5 : origXunPalace);
    const ring = QimenConst.BAGUA_RING;

    const effectiveXun = QimenUtil.resolveJiGong(origXunPalace);
    const effectiveTime = QimenUtil.resolveJiGong(timeStemPalace);

    const xunRingIndex = ring.indexOf(effectiveXun);
    const targetRingIndex = ring.indexOf(effectiveTime);

    const shift = QimenUtil.mod(targetRingIndex - xunRingIndex, 8);

    for (let i = 0; i < 8; i++) {
      const sourcePalace = ring[QimenUtil.mod(xunRingIndex + i, 8)];
      const targetPalace = ring[QimenUtil.mod(xunRingIndex + i + shift, 8)];
      result[targetPalace] = QimenConst.STARS[sourcePalace];
    }

    let tianRuiPalace = null;
    for (const p of QimenConst.PALACES) {
      if (result[p] === "天芮") {
        tianRuiPalace = p;
        break;
      }
    }
    if (tianRuiPalace) result[tianRuiPalace] = "天芮/天禽";

    return {
      stars: result,
      zhiFuStar: zhiFuStar === "天禽" ? "天芮/天禽" : zhiFuStar,
      zhiFuPalace: effectiveTime
    };
  }
};

const OogoZhuanMen = {
  getOriginalGate(palace) {
    return QimenConst.GATES[palace] || "";
  },

  build(origXunPalace, xunBranch, timeBranch, isYang) {
    const result = {};
    const ring = QimenConst.BAGUA_RING;

    const effectiveXun = QimenUtil.resolveJiGong(origXunPalace);
    const zhiShiGate = this.getOriginalGate(effectiveXun);

    const xunIdx = QimenUtil.branchIndex(xunBranch);
    const timeIdx = QimenUtil.branchIndex(timeBranch);
    const steps = QimenUtil.mod(timeIdx - xunIdx, 12);

    const direction = isYang ? 1 : -1;
    
    let targetPalace = QimenUtil.numberMove(origXunPalace, steps, direction); 
    targetPalace = QimenUtil.resolveJiGong(targetPalace);

    const targetRingIdx = ring.indexOf(targetPalace);
    const gateStartIdx = QimenConst.GATE_ORDER.indexOf(zhiShiGate);

    for (let i = 0; i < 8; i++) {
      const gate = QimenConst.GATE_ORDER[QimenUtil.mod(gateStartIdx + i, 8)];
      const palace = ring[QimenUtil.mod(targetRingIdx + i, 8)];
      result[palace] = gate;
    }

    return {
      gates: result,
      zhiShiGate,
      zhiShiPalace: targetPalace,
      branchOffset: steps
    };
  }
};

const OogoTianShen = {
  build(zhiFuPalace, isYang) {
    const result = {};
    const ring = QimenConst.BAGUA_RING;
    const deities = isYang ? QimenConst.DEITY_ORDER_YANG : QimenConst.DEITY_ORDER_YIN;
    const start = ring.indexOf(QimenUtil.resolveJiGong(zhiFuPalace));
    const direction = isYang ? 1 : -1;

    for (let i = 0; i < 8; i++) {
      const palace = ring[QimenUtil.mod(start + direction * i, 8)];
      result[palace] = deities[i];
    }
    return result;
  }
};

const OogoDiShen = {
  build(earthXunPalace, isYang) {
    const result = {};
    const ring = QimenConst.BAGUA_RING;
    const deities = isYang ? QimenConst.DEITY_ORDER_YANG : QimenConst.DEITY_ORDER_YIN;
    const start = ring.indexOf(QimenUtil.resolveJiGong(earthXunPalace));
    const direction = isYang ? 1 : -1;

    for (let i = 0; i < 8; i++) {
      const palace = ring[QimenUtil.mod(start + direction * i, 8)];
      result[palace] = deities[i];
    }
    return result;
  }
};

const OogoZhuanPan = {
  calculate(year, month, day, hour, min, sec = 0, method = "zhirun", jigong = "ji2") {
    const juInfo = method === "chaibu"
      ? OogoChaiBu.calculate(year, month, day, hour, min, sec)
      : OogoZhiRun.calculate(year, month, day, hour, min, sec);

    const chart = juInfo.chart;
    const juNumber = juInfo.juNumber;
    const isYang = juInfo.isYangdun;

    // ========================================================
    // ★ 新增：动态寄宫拦截 (不修改底层函数，只在本次排盘生效)
    // ========================================================
    const originalResolveJiGong = QimenUtil.resolveJiGong;
    const targetJiGong = (isYang && jigong === "y8y2") ? 8 : 2;
    QimenUtil.resolveJiGong = function(palace) {
      return palace === 5 ? targetJiGong : palace;
    };

    const timeStem = chart.fourPillars.hour.stem;
    const timeBranch = chart.fourPillars.hour.branch;
    const xun = QimenUtil.getXunInfo(timeStem, timeBranch);

    const earthStems = OogoDiPan.build(juNumber, isYang);

    let origXunPalace = null;
    for (const p of QimenConst.PALACES) {
      if (earthStems[p] === xun.stem) {
        origXunPalace = p;
        break;
      }
    }
    if (!origXunPalace) throw new Error(`找不到旬首地盘宫：${xun.stem}`);

    const starInfo = OogoZhuanXing.build(earthStems, timeStem, xun.stem, origXunPalace, isYang);

    // ★ 新增：如果寄8宫，手动把天禽星从天芮剥离，重新绑给天任
    if (targetJiGong === 8) {
      for (let p in starInfo.stars) {
        if (starInfo.stars[p] === "天芮/天禽") starInfo.stars[p] = "天芮";
        if (starInfo.stars[p] === "天任") starInfo.stars[p] = "天任/天禽";
      }
      if (starInfo.zhiFuStar === "天芮/天禽" || starInfo.zhiFuStar === "天芮") starInfo.zhiFuStar = "天任/天禽";
    }
    const gateInfo = OogoZhuanMen.build(origXunPalace, xun.branch, timeBranch, isYang);
    const heavenDeities = OogoTianShen.build(starInfo.zhiFuPalace, isYang);
    const earthDeities = OogoDiShen.build(origXunPalace, isYang);

    // ==========================================
    // ★ 飞暗干逻辑：用 Map 对象强行覆盖原库的脏数据
    // ==========================================
    const hiddenStemsMap = new Map();
    const qimenStems = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
    const hiddenTimeStem = timeStem === "甲" ? xun.stem : timeStem;
    const tsIdx = qimenStems.indexOf(hiddenTimeStem);

    if (tsIdx !== -1) {
      let zsTargetPalace = gateInfo.zhiShiPalace;
      
      for (let i = 0; i < 9; i++) {
        let landPalace = isYang ? (zsTargetPalace + i) : (zsTargetPalace - i);
        while (landPalace > 9) landPalace -= 9;
        while (landPalace < 1) landPalace += 9;
        
        hiddenStemsMap.set(landPalace, qimenStems[(tsIdx + i) % 9]);
      }
    }
    
    chart.hiddenStems = hiddenStemsMap;
    // ==========================================

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
        hiddenStem: hiddenStemsMap.get(position) || "无", 
        isJiGong: position === 5
      });
    }

    const ring = QimenConst.BAGUA_RING;
    const effectiveTimeStem = timeStem === "甲" ? xun.stem : timeStem;
    let timeStemPalace = null;
    for (const p of QimenConst.PALACES) {
      if (earthStems[p] === effectiveTimeStem) {
        timeStemPalace = p;
        break;
      }
    }
    timeStemPalace = QimenUtil.resolveJiGong(timeStemPalace);

    const effectiveXunPalace = QimenUtil.resolveJiGong(origXunPalace);
    const xunRingIndex = ring.indexOf(effectiveXunPalace); 
    const targetRingIndex = ring.indexOf(timeStemPalace);
    const starShift = QimenUtil.mod(targetRingIndex - xunRingIndex, 8);

    const heavenStems = {};
    for (let i = 0; i < 8; i++) {
      const sourcePalace = ring[QimenUtil.mod(xunRingIndex + i, 8)];
      const targetPalace = ring[QimenUtil.mod(xunRingIndex + i + starShift, 8)];
      heavenStems[targetPalace] = earthStems[sourcePalace];
    }
    // ★ 修改：天干跟随动态目标寄宫 (之前写死了2)
    heavenStems[5] = heavenStems[targetJiGong];

    palaces.forEach(p => {
      p.heavenlyStem = heavenStems[p.position] || "";

      // ==========================================
      // ★ 修改：天盘、地盘寄宫数组显示逻辑
      // ==========================================
      if (p.position === targetJiGong) {
        // 目标宫地盘：[原宫地干, 中5宫地干]
        p.earthlyStem = [p.earthlyStem, earthStems[5]];
      }
      // ★ 修改：只要名字里包含天禽星，中五宫天干就跟过去
      if (p.star && p.star.includes("天禽")) {
        p.heavenlyStem = [p.heavenlyStem, earthStems[5]];
      }
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
      xun: { name: xun.name, stem: xun.stem, branch: xun.branch, palace: origXunPalace },
      hiddenStems: hiddenStemsMap, // 给前端使用
      palaces,
      debugInfo: juInfo.debugInfo
    };

    // ★ 新增：恢复引擎原本的寄宫函数，防止污染其他排盘
    QimenUtil.resolveJiGong = originalResolveJiGong;

    return OogoTagEnhancer.enhance(result);
  }
};

// ============================================================
// 八、原生飞盘模块（地盘已与转盘统一）
// ============================================================

const OogoFeiPan = {
  fly(chart) {
    const isYang = (chart.ju && chart.ju.type) ? chart.ju.type.indexOf("阳") !== -1 : true;
    const juNumber = chart.ju.number;
    const timeStem = chart.fourPillars.hour.stem;
    const timeBranch = chart.fourPillars.hour.branch;

    const stemsArr = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const branchesArr = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const qimenStems = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];

    const hSIdx = stemsArr.indexOf(timeStem);
    const hBIdx = branchesArr.indexOf(timeBranch);
    const xunOffset = (hBIdx - hSIdx + 12) % 12;
    const xunName = stemsArr[0] + branchesArr[xunOffset];
    const xunStem = {
      "甲子": "戊", "甲戌": "己", "甲申": "庚",
      "甲午": "辛", "甲辰": "壬", "甲寅": "癸"
    }[xunName];

    const pureEarthStems = {};
    let palace = juNumber;
    const direction = isYang ? 1 : -1;
    for (let i = 0; i < 9; i++) {
      pureEarthStems[palace] = qimenStems[i];
      palace = QimenUtil.numberMove(palace, 1, direction);
    }

    const origStars = {
      1: "天蓬", 2: "天芮", 3: "天冲", 4: "天辅", 5: "天禽",
      6: "天心", 7: "天柱", 8: "天任", 9: "天英"
    };
    const origGates = {
      1: "休门", 2: "死门", 3: "伤门", 4: "杜门", 5: "中门",
      6: "开门", 7: "惊门", 8: "生门", 9: "景门"
    };

    let xunPalace = 5, zfTargetPalace = 5;
    for (let i = 1; i <= 9; i++) {
      if (pureEarthStems[i] === xunStem) xunPalace = i;
      if (pureEarthStems[i] === (timeStem === "甲" ? xunStem : timeStem)) zfTargetPalace = i;
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
      flyHeavenStems[landPalace] = pureEarthStems[i];
    }

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

    const deitiesYang = ["符", "螣", "阴", "合", "勾", "常", "朱", "地", "天"];
    const deitiesYin  = ["符", "螣", "阴", "合", "白", "常", "玄", "地", "天"];
    const deitiesList = isYang ? deitiesYang : deitiesYin;

    const flyDeities = {};
    for (let i = 0; i < 9; i++) {
      let landPalace = isYang ? (zfTargetPalace + i) : (zfTargetPalace - i);
      while (landPalace > 9) landPalace -= 9;
      while (landPalace < 1) landPalace += 9;
      flyDeities[landPalace] = deitiesList[i];
    }

    const flyHiddenStems = {};
    const tsIdx = qimenStems.indexOf(timeStem === "甲" ? xunStem : timeStem);
    if (tsIdx !== -1) {
      for (let i = 0; i < 9; i++) {
        let landPalace = isYang ? (zsTargetPalace + i) : (zsTargetPalace - i);
        while (landPalace > 9) landPalace -= 9;
        while (landPalace < 1) landPalace += 9;
        flyHiddenStems[landPalace] = qimenStems[(tsIdx + i) % 9];
      }
    }

    chart.palaces.forEach(function (p) {
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

      let jx = false;
      if ((hStem === "戊" && pos === 3) || (hStem === "己" && pos === 2) ||
          (hStem === "庚" && pos === 8) || (hStem === "辛" && pos === 9) ||
          (hStem === "壬" && pos === 4) || (hStem === "癸" && pos === 4)) {
        jx = true;
      }
      p.liuYiJiXing = { hasJiXing: jx };

      const gateEle = {
        "休门": "水", "生门": "土", "伤门": "木", "杜门": "木",
        "景门": "火", "死门": "土", "惊门": "金", "开门": "金", "中门": "土"
      }[gate];
      const palaceEle = { 1: "水", 2: "土", 3: "木", 4: "木", 5: "土", 6: "金", 7: "金", 8: "土", 9: "火" }[pos];
      let po = false;
      if ((gateEle === "水" && palaceEle === "火") || (gateEle === "火" && palaceEle === "金") ||
          (gateEle === "金" && palaceEle === "木") || (gateEle === "木" && palaceEle === "土") ||
          (gateEle === "土" && palaceEle === "水")) {
        po = true;
      }
      p.gatePressure = { hasPressure: po, text: po ? "门迫" : "" };

      let mu = false;
      if ((pos === 6 && ["丙", "戊", "乙"].includes(hStem)) ||
          (pos === 8 && ["丁", "己", "庚"].includes(hStem)) ||
          (pos === 4 && ["辛", "壬"].includes(hStem)) ||
          (pos === 2 && hStem === "癸")) {
        mu = true;
      }
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
// 九、统一入口与导出
// ============================================================
const OogoZhuanPanEnhancer = {
  enhance(chart, xunDun, isYang) {
    return chart;
  }
};
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
