// ============================================================
// OOGO 奇门遁甲核心引擎 (含完美置闰、拆补、茅山、传统转盘与原生飞盘) 
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

  QIMEN_STEMS: [
    "戊","己","庚","辛","壬",
    "癸","丁","丙","乙"
  ],

  PALACES: [1,2,3,4,5,6,7,8,9],

  BAGUA_RING: [1,8,3,4,9,2,7,6],

  STARS: {
    1: "天蓬", 2: "天芮", 3: "天冲", 4: "天辅", 5: "天禽",
    6: "天心", 7: "天柱", 8: "天任", 9: "天英"
  },

  GATES: {
    1: "休门", 2: "死门", 3: "伤门", 4: "杜门",
    6: "开门", 7: "惊门", 8: "生门", 9: "景门"
  },

  GATE_ORDER: [
    "休门", "生门", "伤门", "杜门", "景门", "死门", "惊门", "开门"
  ],

  DEITY_ORDER_YIN: ["符", "螣", "阴", "六", "白", "玄", "地", "天"],
  DEITY_ORDER_YANG: ["符", "螣", "阴", "六", "白", "玄", "地", "天"],

  PALACE_ELEMENT: {
    1: "水", 2: "土", 3: "木", 4: "木", 5: "土", 6: "金", 7: "金", 8: "土", 9: "火"
  },

  STEM_ELEMENT: {
    "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土",
    "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水"
  },

  GATE_ELEMENT: {
    "休门": "水", "生门": "土", "伤门": "木", "杜门": "木",
    "景门": "火", "死门": "土", "惊门": "金", "开门": "金"
  },

  YANG_JU: {
    "冬至": [1,7,4], "小寒": [2,8,5], "大寒": [3,9,6], "立春": [8,5,2],
    "雨水": [9,6,3], "惊蛰": [1,7,4], "春分": [3,9,6], "清明": [4,1,7],
    "谷雨": [5,2,8], "立夏": [4,1,7], "小满": [5,2,8], "芒种": [6,3,9]
  },

  YIN_JU: {
    "夏至": [9,3,6], "小暑": [8,2,5], "大暑": [7,1,4], "立秋": [2,5,8],
    "处暑": [1,4,7], "白露": [9,3,6], "秋分": [7,1,4], "寒露": [6,9,3],
    "霜降": [5,8,2], "立冬": [6,9,3], "小雪": [5,8,2], "大雪": [4,7,1]
  },

  SOLAR_TERMS: [
    "小寒","大寒","立春","雨水","惊蛰","春分",
    "清明","谷雨","立夏","小满","芒种","夏至",
    "小暑","大暑","立秋","处暑","白露","秋分",
    "寒露","霜降","立冬","小雪","大雪","冬至"
  ],

  YANG_TERMS: [
    "冬至","小寒","大寒","立春","雨水","惊蛰",
    "春分","清明","谷雨","立夏","小满","芒种"
  ],

  YIN_TERMS: [
    "夏至","小暑","大暑","立秋","处暑","白露",
    "秋分","寒露","霜降","立冬","小雪","大雪"
  ]
};

// ============================================================
// 二、工具函数
// ============================================================
const QimenUtil = {
  mod(value, length) { return ((value % length) + length) % length; },
  palaceExists(palace) { return QimenConst.PALACES.includes(palace); },
  isOuterPalace(palace) { return palace !== 5; },
  resolveJiGong(palace) { return palace === 5 ? 2 : palace; },
  nextDate(date, days) { const d = new Date(date.getTime()); d.setDate(d.getDate() + days); return d; },
  dateOnly(y, m, d) { return new Date(y, m - 1, d, 12, 0, 0, 0); },
  stemIndex(stem) { return QimenConst.STEMS.indexOf(stem); },
  branchIndex(branch) { return QimenConst.BRANCHES.indexOf(branch); },
  findStemBranchIndex(stem, branch) {
    for (let i = 0; i < 60; i++) {
      if (QimenConst.STEMS[i % 10] === stem && QimenConst.BRANCHES[i % 12] === branch) return i;
    }
    return -1;
  },
  getXunInfo(stem, branch) {
    const index = this.findStemBranchIndex(stem, branch);
    if (index < 0) throw new Error(`无法确定旬：${stem}${branch}`);
    const xunIndex = index - (index % 10);
    const xunNames = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"];
    const xunName = xunNames[xunIndex / 10];
    const xunStemMap = { "甲子": "戊", "甲戌": "己", "甲申": "庚", "甲午": "辛", "甲辰": "壬", "甲寅": "癸" };
    const xunBranch = { "甲子": "子", "甲戌": "戌", "甲申": "申", "甲午": "午", "甲辰": "辰", "甲寅": "寅" }[xunName];
    return { name: xunName, stem: xunStemMap[xunName], branch: xunBranch, index: index };
  },
  ringIndex(palace) { return QimenConst.BAGUA_RING.indexOf(palace); },
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
      (stem === "戊" && palace === 3) || (stem === "己" && palace === 2) ||
      (stem === "庚" && palace === 8) || (stem === "辛" && palace === 9) ||
      (stem === "壬" && palace === 4) || (stem === "癸" && palace === 4)
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
      (gateElement === "水" && palaceElement === "火") || (gateElement === "火" && palaceElement === "金") ||
      (gateElement === "金" && palaceElement === "木") || (gateElement === "木" && palaceElement === "土") ||
      (gateElement === "土" && palaceElement === "水")
    );
  }, 
  // ==========================================
  // ★ 新增：十天干十二长生法理推算算法
  // ==========================================
  getChangSheng(stem, palace) {
    if (!stem || palace === 5) return ""; // 中5宫或无天干时不计算
    
    // 提取可能的数组或字符串的第一个字 (如遇到寄宫情况 "丙/戊"，只取 "丙")
    const mainStem = Array.isArray(stem) ? stem[0] : (typeof stem === 'string' ? stem.split('/')[0] : stem);
    
    const states = ["生", "沐", "冠", "临", "旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
    // 九宫对应的地支索引 (子=0, 丑=1... 亥=11)
    const branchesMap = { 1:[0], 8:[1,2], 3:[3], 4:[4,5], 9:[6], 2:[7,8], 7:[9], 6:[10,11] };
    // 十天干长生起点地支索引 (阳顺阴逆)
    const startMap = { '甲':11, '乙':6, '丙':2, '丁':9, '戊':2, '己':9, '庚':5, '辛':0, '壬':8, '癸':3 };
    const isYin = ['乙', '丁', '己', '辛', '癸'].includes(mainStem);

    if (!startMap.hasOwnProperty(mainStem)) return "";
    const startIdx = startMap[mainStem];
    const palaceBranches = branchesMap[palace];

    let res = [];
    // 遍历宫内包含的地支，四正宫1个，四维宫2个
    for (let i = 0; i < palaceBranches.length; i++) {
      let b = palaceBranches[i];
      // 阳干顺行，阴干逆行计算偏移量
      let offset = isYin ? (startIdx - b + 12) % 12 : (b - startIdx + 12) % 12;
      res.push(states[offset]);
    }
    return res.join(''); // 返回组合字符串，如 "沐" 或 "衰病"
  }
};  

// ============================================================
// 三、CalendarAdapter
// ============================================================
const CalendarAdapter = {
  getDayGanZhi(year, month, day) {
    const solar = OogoCalendar.Solar.fromYmdHms(year, month, day, 12, 0, 0);
    const lunar = OogoCalendar.Lunar.fromSolar(solar);
    return { stem: lunar.getDayGanExact(), branch: lunar.getDayZhiExact() };
  },
  getFullChart(year, month, day, hour, min, sec = 0) {
    let baziY = year, baziM = month, baziD = day, baziH = hour;
    if (hour >= 23) {
        let nextD = new Date(year, month - 1, day + 1);
        baziY = nextD.getFullYear(); baziM = nextD.getMonth() + 1; baziD = nextD.getDate(); baziH = 0; 
    }
    const solar = OogoCalendar.Solar.fromYmdHms(baziY, baziM, baziD, baziH, min, sec);
    const lunar = OogoCalendar.Lunar.fromSolar(solar);
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
      timeInfo: { solarTerm: prevJieQi.getName(), solarTermTime: prevJieQi.getSolar().toYmdHms() },
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
      stem === "甲" || stem === "己" ? 0 : stem === "乙" ? 1 : stem === "丙" ? 2 :
      stem === "丁" ? 3 : stem === "戊" ? 4 : stem === "庚" ? 1 : stem === "辛" ? 2 :
      stem === "壬" ? 3 : 4;
    const date = QimenUtil.dateOnly(year, month, day);
    const fuTouDate = QimenUtil.nextDate(date, -offset);
    const gz = CalendarAdapter.getDayGanZhi(fuTouDate.getFullYear(), fuTouDate.getMonth() + 1, fuTouDate.getDate());
    return { date: fuTouDate, stem: gz.stem, branch: gz.branch, ganZhi: gz.stem + gz.branch };
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
  isYangDun(termName) { return QimenConst.YANG_TERMS.includes(termName); },
  getJuTable(termName, isYang) {
    const table = isYang ? QimenConst.YANG_JU : QimenConst.YIN_JU;
    return table[termName] || null;
  }
};

// ============================================================
// 五、置闰、拆补、茅山引擎
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
    const fullChart = CalendarAdapter.getFullChart(year, month, day, hour, min, sec);
    let tYear = year, tMonth = month, tDay = day;
    if (hour >= 23) {
        let nextD = new Date(year, month - 1, day + 1);
        tYear = nextD.getFullYear(); tMonth = nextD.getMonth() + 1; tDay = nextD.getDate();
    }
    let targetDate = this.createDate(tYear, tMonth, tDay);

    let SS_prev = this.getSolsticeDate(tYear - 1, false), WS_prev = this.getSolsticeDate(tYear - 1, true);
    let SS_curr = this.getSolsticeDate(tYear, false), WS_curr = this.getSolsticeDate(tYear, true);

    let A_SS_prev = this.getAnchorUpperYuan(SS_prev), A_WS_prev = this.getAnchorUpperYuan(WS_prev);
    let A_SS_curr = this.getAnchorUpperYuan(SS_curr), A_WS_curr = this.getAnchorUpperYuan(WS_curr);

    let FT_D = null;
    for (let offset = 0; offset >= -14; offset--) {
        let d = this.addDays(targetDate, offset);
        if (this.getDayGanzhiIndex(d) % 15 === 0) { FT_D = d; break; }
    }

    let isYang = true, termsList = QimenConst.YANG_TERMS, baseAnchor = null;
    if (FT_D.getTime() < A_WS_prev.getTime()) { isYang = false; termsList = QimenConst.YIN_TERMS; baseAnchor = A_SS_prev; } 
    else if (FT_D.getTime() < A_SS_curr.getTime()) { isYang = true; termsList = QimenConst.YANG_TERMS; baseAnchor = A_WS_prev; } 
    else if (FT_D.getTime() < A_WS_curr.getTime()) { isYang = false; termsList = QimenConst.YIN_TERMS; baseAnchor = A_SS_curr; } 
    else { isYang = true; termsList = QimenConst.YANG_TERMS; baseAnchor = A_WS_curr; }

    let diffDays = this.diffDays(FT_D, baseAnchor);
    let k = Math.round(diffDays / 15);
    let isTrueRun = false, termIndex = k;
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

    return { chart: fullChart, method: "置闰法", juNumber: juNumber, isYangdun: isYang, termName: termName, termDate: astroStart, fuTouDate: FT_D, fuTouGanZhi: fuTouGanZhi, yuanIndex: yuanIndex, yuanName: yuanName, relation: relation, superShenDays: superShenDays, isTrueRun: isTrueRun, debugInfo: {} };
  }
};

const OogoChaiBu = {
  calculate(year, month, day, hour, min, sec = 0) {
    const fullChart = CalendarAdapter.getFullChart(year, month, day, hour, min, sec);
    let tYear = year, tMonth = month, tDay = day;
    if (hour >= 23) {
        let nextD = new Date(year, month - 1, day + 1);
        tYear = nextD.getFullYear(); tMonth = nextD.getMonth() + 1; tDay = nextD.getDate();
    }
    const date = QimenUtil.dateOnly(tYear, tMonth, tDay);
    const term = QimenSolarTerm.findPreviousTerm(date);
    const termName = term.name, termDate = term.date;
    const days = Math.floor((date.getTime() - termDate.getTime()) / 86400000);
    let yuanIndex = Math.floor(days / 5);
    if (yuanIndex < 0) yuanIndex = 0; if (yuanIndex > 2) yuanIndex = 2;
    const isYang = QimenSolarTerm.isYangDun(termName);
    const table = QimenSolarTerm.getJuTable(termName, isYang);
    return { chart: fullChart, method: "拆补法", juNumber: table[yuanIndex], isYangdun: isYang, termName, termDate, yuanIndex, yuanName: ["上元", "中元", "下元"][yuanIndex], debugInfo: {} };
  }
};

const OogoMaoShan = {
  calculate(year, month, day, hour, min, sec = 0) {
    const fullChart = CalendarAdapter.getFullChart(year, month, day, hour, min, sec);
    let tYear = year, tMonth = month, tDay = day, tHour = hour;
    if (hour >= 23) {
        let nextD = new Date(year, month - 1, day + 1);
        tYear = nextD.getFullYear(); tMonth = nextD.getMonth() + 1; tDay = nextD.getDate(); tHour = 0;
    }
    const targetDate = new Date(tYear, tMonth - 1, tDay, tHour, min, sec);
    const solar = OogoCalendar.Solar.fromYmdHms(tYear, tMonth, tDay, tHour, min, sec);
    const lunar = OogoCalendar.Lunar.fromSolar(solar);
    const jq = lunar.getPrevJieQi(); 
    const termName = jq.getName();
    const jqSolar = jq.getSolar();
    const termExactDate = new Date(jqSolar.getYear(), jqSolar.getMonth() - 1, jqSolar.getDay(), jqSolar.getHour(), jqSolar.getMinute(), jqSolar.getSecond());
    const diffMs = targetDate.getTime() - termExactDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    let yuanIndex = Math.floor(diffDays / 5);
    if (yuanIndex < 0) yuanIndex = 0; if (yuanIndex > 2) yuanIndex = 2;
    const isYang = QimenSolarTerm.isYangDun(termName);
    const table = QimenSolarTerm.getJuTable(termName, isYang);
    return { chart: fullChart, method: "茅山法", juNumber: table[yuanIndex], isYangdun: isYang, termName: termName, termDate: termExactDate, yuanIndex, yuanName: ["上元", "中元", "下元"][yuanIndex], debugInfo: { diffDays: diffDays } };
  }
};

// ============================================================
// 六、神煞与标签
// ============================================================
const OogoKongWang = {
  get(timeStem, timeBranch) {
    const index = QimenUtil.findStemBranchIndex(timeStem, timeBranch);
    const xunOffset = index % 10;
    const branchIndex = QimenUtil.branchIndex(timeBranch);
    const kong1 = QimenConst.BRANCHES[QimenUtil.mod(branchIndex + (10 - xunOffset), 12)];
    const kong2 = QimenConst.BRANCHES[QimenUtil.mod(branchIndex + (11 - xunOffset), 12)];
    return [kong1, kong2];
  },
  branchToPalace(branch) {
    const map = { "子": 1, "丑": 8, "寅": 8, "卯": 3, "辰": 4, "巳": 4, "午": 9, "未": 2, "申": 2, "酉": 7, "戌": 6, "亥": 6 };
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
  branchToPalace(branch) { return { "寅": 8, "巳": 4, "申": 2, "亥": 6 }[branch] || 0; },
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
      if (star && star.includes("/天禽")) star = star.replace("/天禽", "");
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
    else if (starFu) text = "星伏"; else if (starFan) text = "星反";
    else if (gateFu) text = "门伏"; else if (gateFan) text = "门反";
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
      // 提取主天干和主地干
      const hStem = Array.isArray(p.heavenlyStem) ? p.heavenlyStem[0] : p.heavenlyStem;
      const eStem = Array.isArray(p.earthlyStem) ? p.earthlyStem[0] : p.earthlyStem;

      // 原有的标签逻辑
      p.uiTagKong = kongPalaces.includes(p.position);
      p.uiTagMa = (p.position === ma.palace);
      p.uiTagJx = QimenUtil.isJiXing(hStem, p.position);
      p.uiTagPo = QimenUtil.isMenPo(p.gate, p.position);
      p.uiTagMu = QimenUtil.isTianGanMu(hStem, p.position);
      p.liuYiJiXing = { hasJiXing: p.uiTagJx };
      p.gatePressure = { hasPressure: p.uiTagPo, text: p.uiTagPo ? "门迫" : "" };
      p.tombInfo = { heavenlyStemInTomb: p.uiTagMu ? [hStem] : [], earthlyStemInTomb: [] };
      
      // ==========================================
      // ★ 新增：将十二长生状态作为属性写入返回的数据中
      // ==========================================
      p.heavenlyChangsheng = QimenUtil.getChangSheng(hStem, p.position);
      p.earthlyChangsheng = QimenUtil.getChangSheng(eStem, p.position);
    });

    chart.kongWang = { branches: kong, palaces: kongPalaces };
    chart.yiMa = ma;
    chart.uiTagFuYinFanYin = OogoFuFan.analyze(chart.palaces);
    return chart;
  }
};

// ============================================================
// 七、OogoGeJu 吉凶格局扫描器
// ============================================================
const OogoGeJu = {
  StemPatterns: {
    "戊戊": { name: "伏吟", type: "凶", desc: "凡事不利，道路闭塞，以守为佳。" },
    "戊乙": { name: "青龙和会", type: "吉", desc: "门吉事吉，门凶事凶，利合伙谋事。" },
    "戊丙": { name: "青龙返首", type: "大吉", desc: "动作大吉，谋事顺利，若逢迫墓吉变凶。" },
    "戊丁": { name: "青龙耀明", type: "大吉", desc: "宜见上级、贵人、求功名，若逢墓迫即招是非。" },
    "戊己": { name: "贵人入狱", type: "凶", desc: "公私皆不利，凡事有阻碍。" },
    "戊庚": { name: "值符飞宫", type: "大凶", desc: "吉事不吉，凶事更凶，求财破败，交战必败。" },
    "戊辛": { name: "青龙折足", type: "凶", desc: "吉门生助尚可谋为，若逢凶门主招灾、破财。" },
    "戊壬": { name: "青龙入天牢", type: "凶", desc: "凡事无结果，阴阳皆不吉。" },
    "戊癸": { name: "青龙华盖", type: "吉", desc: "门吉招福，门凶多乖，利合作。" },

    "乙戊": { name: "阴害阳门", type: "凶", desc: "利阴人、阴事，不利阳人、公开之事。" },
    "乙乙": { name: "日奇伏吟", type: "凶", desc: "不宜见上级贵人，不宜进取，只宜安分守己。" },
    "乙丙": { name: "奇仪顺遂", type: "吉", desc: "吉星迁官晋职，凶星夫妻离别。" },
    "乙丁": { name: "奇仪相佐", type: "吉", desc: "文书事吉，百事可为。" },
    "乙己": { name: "日奇入墓", type: "凶", desc: "被土暗昧，门凶更凶，主破财、隐匿。" },
    "乙庚": { name: "日奇被刑", type: "凶", desc: "太白退度，财产争讼，夫妻怀私。" },
    "乙辛": { name: "青龙逃走", type: "大凶", desc: "人亡财破，奴仆拐带，女逃男走。" },
    "乙壬": { name: "日奇入地", type: "凶", desc: "尊卑悖乱，官讼是非，有人谋害。" },
    "乙癸": { name: "华盖逢星", type: "吉", desc: "遁迹修道，隐匿藏形，避灾避难为吉。" },

    "丙戊": { name: "飞鸟跌穴", type: "大吉", desc: "百事吉，不劳而获，谋为大成就。" },
    "丙乙": { name: "日月并行", type: "吉", desc: "公私皆吉，退让为宜。" },
    "丙丙": { name: "月奇悖师", type: "凶", desc: "文书逼迫，破耗遗失，主客皆不利。" },
    "丙丁": { name: "星奇朱雀", type: "吉", desc: "贵人吉庆，常人平静，文章显达。" },
    "丙己": { name: "火悖入土", type: "凶", desc: "主囚人刑杖，文书不行，吉门得吉，凶门转凶。" },
    "丙庚": { name: "荧入太白", type: "凶", desc: "门户破败，盗贼耗失，事业亦衰。" },
    "丙辛": { name: "奇神合明", type: "吉", desc: "谋事成就，病人不凶。" },
    "丙壬": { name: "火入天罗", type: "凶", desc: "为客不利，是非颇多。" },
    "丙癸": { name: "华盖悖师", type: "凶", desc: "阴人害事，灾祸频生。" },

    "丁戊": { name: "青龙转光", type: "大吉", desc: "官人升迁，常人威信大增。" },
    "丁乙": { name: "玉女奇生", type: "吉", desc: "人遁吉格，贵人加官晋爵，常人有喜庆。" },
    "丁丙": { name: "星随月转", type: "吉", desc: "贵人越级高升，常人逢凶化吉。" },
    "丁丁": { name: "奇入太阴", type: "吉", desc: "文书证件即至，事多如意。" },
    "丁己": { name: "火入勾陈", type: "凶", desc: "因女人或私情事起风波。" },
    "丁庚": { name: "玉女乘龙", type: "吉", desc: "文书阻隔，但出行吉利。" },
    "丁辛": { name: "朱雀入狱", type: "凶", desc: "罪人释囚，官人失位。" },
    "丁壬": { name: "奇门合德", type: "吉", desc: "贵人恩惠，讼事和解，利婚姻合伙。" },
    "丁癸": { name: "朱雀投江", type: "大凶", desc: "文书沉溺，音信全无，官司口舌。" },

    "己戊": { name: "犬遇青龙", type: "吉", desc: "门吉谋望遂意，门凶枉费心机。" },
    "己乙": { name: "墓神不明", type: "凶", desc: "地户逢星，宜暗中行事，不宜公开。" },
    "己丙": { name: "火星地户", type: "凶", desc: "男人冤枉，女人受辱。" },
    "己丁": { name: "朱雀入墓", type: "凶", desc: "文书词讼先曲后直。" },
    "己己": { name: "地户逢鬼", type: "凶", desc: "病者发凶，百事不遂。" },
    "己庚": { name: "刑格返名", type: "凶", desc: "词讼先动者不利，退期可免。" },
    "己辛": { name: "游魂入墓", type: "凶", desc: "大人见怪，小人招殃。" },
    "己壬": { name: "地网高张", type: "凶", desc: "狡童佚女，奸情伤杀。" },
    "己癸": { name: "地刑玄武", type: "凶", desc: "男女疾病垂危，有词讼势端。" },

    "庚戊": { name: "天乙伏宫", type: "大凶", desc: "百事不可谋为，凶。" },
    "庚乙": { name: "太白逢星", type: "凶", desc: "退吉进凶，谋为多阻隔。" },
    "庚丙": { name: "太白入荧", type: "凶", desc: "测贼贼必来，为客进利，为主破财。" },
    "庚丁": { name: "亭亭之格", type: "凶", desc: "因私起因，官非不息。" },
    "庚己": { name: "官符刑格", type: "凶", desc: "官讼被重判，破财伤灾。" },
    "庚庚": { name: "太白同宫", type: "大凶", desc: "官灾横祸，兄弟雷攻。" },
    "庚辛": { name: "白虎干格", type: "大凶", desc: "远行车折马死，求财大败。" },
    "庚壬": { name: "上格", type: "凶", desc: "远行失迷道路，男女音信难通。" },
    "庚癸": { name: "大格", type: "大凶", desc: "多主车祸、刑伤、求财大败。" },

    "辛戊": { name: "困龙被伤", type: "凶", desc: "主因财起讼，防他人暗算。" },
    "辛乙": { name: "白虎猖狂", type: "大凶", desc: "家败人亡，远行多殃，测婚离散。" },
    "辛丙": { name: "干合悖师", type: "吉", desc: "门吉事吉，门凶事凶，测事易有牵连。" },
    "辛丁": { name: "狱神得奇", type: "吉", desc: "经商获倍利，囚人逢赦免。" },
    "辛己": { name: "入狱自刑", type: "凶", desc: "奴仆背主，有苦诉讼难伸。" },
    "辛庚": { name: "白虎出力", type: "大凶", desc: "刀刃相接，主客相残，退让为宜。" },
    "辛辛": { name: "伏吟天庭", type: "凶", desc: "公废私就，讼狱自惹。" },
    "辛壬": { name: "凶蛇入狱", type: "凶", desc: "两男争女，讼狱不息。" },
    "辛癸": { name: "天牢华盖", type: "凶", desc: "日月失明，误入天网，动止乖张。" },

    "壬戊": { name: "小蛇化龙", type: "吉", desc: "男人发达，女人产婴童。" },
    "壬乙": { name: "小蛇得势", type: "吉", desc: "女人柔顺，男人通达，测孕生子。" },
    "壬丙": { name: "水蛇入火", type: "凶", desc: "官灾刑禁，络绎不绝。" },
    "壬丁": { name: "干合星奇", type: "吉", desc: "文书词讼贵人解救，利合作。" },
    "壬己": { name: "反吟蛇刑", type: "凶", desc: "大祸将至，顺守可保全。" },
    "壬庚": { name: "太白擒蛇", type: "吉", desc: "刑狱公平，立案昭雪。" },
    "壬辛": { name: "腾蛇相缠", type: "凶", desc: "纵有吉门亦不能安宁，若有谋望被人欺瞒。" },
    "壬壬": { name: "蛇入地罗", type: "凶", desc: "外人缠绕，内事索索，吉门吉星化解。" },
    "壬癸": { name: "幼女奸淫", type: "凶", desc: "家有丑声，门吉星吉者反可进益。" },

    "癸戊": { name: "天乙会合", type: "吉", desc: "吉门宜求财，婚姻喜庆，吉人赞助。" },
    "癸乙": { name: "华盖逢星", type: "吉", desc: "贵人禄位，常人平安。" },
    "癸丙": { name: "华盖悖师", type: "凶", desc: "贵贱逢之皆不利，唯上人见喜。" },
    "癸丁": { name: "腾蛇夭矫", type: "大凶", desc: "文书官司，火焚也逃不掉。" },
    "癸己": { name: "华盖地户", type: "凶", desc: "男女音信皆阻，躲灾避难为吉。" },
    "癸庚": { name: "太白入网", type: "凶", desc: "暴力争诉，自作自受。" },
    "癸辛": { name: "网盖天牢", type: "凶", desc: "占病占讼，死罪难逃。" },
    "癸壬": { name: "复见腾蛇", type: "凶", desc: "嫁娶重婚，后嫁无子，不保年华。" },
    "癸癸": { name: "天网四张", type: "大凶", desc: "行人失伴，病讼皆伤，万事不宜行动。" }
  },

  GatePatterns: {
    "休门休门": { name: "休加休", type: "吉", desc: "求财进人口，谒见贵人吉，上官赴任、修造大利。" },
    "休门生门": { name: "休加生", type: "大吉", desc: "主得阴人财物，干恩人谋事必成。" },
    "休门伤门": { name: "休加伤", type: "凶", desc: "主交加欢乐，但事反必有剥折。" },
    "休门杜门": { name: "休加杜", type: "凶", desc: "主破财，失物难寻。" },
    "休门景门": { name: "休加景", type: "平", desc: "主求文书印信不至，反惹口舌是非。" },
    "休门死门": { name: "休加死", type: "凶", desc: "主文书印信官司事不吉，唯僧道无妨。" },
    "休门惊门": { name: "休加惊", type: "凶", desc: "主损财惊疑，疾病、惊恐事发。" },
    "休门开门": { name: "休加开", type: "大吉", desc: "主开谋事成，求财大吉，百事顺利。" },

    "生门休门": { name: "生加休", type: "吉", desc: "主阴人处求谋吉，利求暗财。" },
    "生门生门": { name: "生加生", type: "大吉", desc: "主远行求财吉，事业旺盛，万事如意。" },
    "生门伤门": { name: "生加伤", type: "凶", desc: "主亲友变故，道路不通，易生意外。" },
    "生门杜门": { name: "生加杜", type: "凶", desc: "主阴谋、阴人破财，诸事不利。" },
    "生门景门": { name: "生加景", type: "平", desc: "主阴人、小人引发口舌之争。" },
    "生门死门": { name: "生加死", type: "吉", desc: "主田宅词讼，因祸得福，主得他人田宅财物。" },
    "生门惊门": { name: "生加惊", type: "平", desc: "主尊长财产、词讼，事有迟疑，晚吉。" },
    "生门开门": { name: "生加开", type: "大吉", desc: "主见贵人，求财大吉，事业开拓。" },

    "伤门休门": { name: "伤加休", type: "凶", desc: "主男性疾病，身体欠安。" },
    "伤门生门": { name: "伤加生", type: "凶", desc: "主房产、财产有损，破财不利。" },
    "伤门伤门": { name: "伤加伤", type: "大凶", desc: "主变动、远行皆折伤，大凶之象。" },
    "伤门杜门": { name: "伤加杜", type: "凶", desc: "主变动、失脱、官非连连。" },
    "伤门景门": { name: "伤加景", type: "凶", desc: "主文书印信带来口舌是非。" },
    "伤门死门": { name: "伤加死", type: "大凶", desc: "主官司印信大凶，有牢狱刑罚之灾。" },
    "伤门惊门": { name: "伤加惊", type: "凶", desc: "主损财，因他人牵连而受惊吓。" },
    "伤门开门": { name: "伤加开", type: "平", desc: "主见贵人、开张尚可，但防走失。" },

    "杜门休门": { name: "杜加休", type: "吉", desc: "主求财有益，利于休养生息。" },
    "杜门生门": { name: "杜加生", type: "凶", desc: "主男子小口破财，有小耗。" },
    "杜门伤门": { name: "杜加伤", type: "凶", desc: "主兄弟相打，骨肉不和，破财。" },
    "杜门杜门": { name: "杜加杜", type: "凶", desc: "主因父母疾病，田宅出脱事凶。" },
    "杜门景门": { name: "杜加景", type: "凶", desc: "主文书印信阻隔，信息不通。" },
    "杜门死门": { name: "杜加死", type: "凶", desc: "主文书失落，官司破财。" },
    "杜门惊门": { name: "杜加惊", type: "凶", desc: "主门户内发生惊恐，词讼大凶。" },
    "杜门开门": { name: "杜加开", type: "吉", desc: "主客交接，远行避灾则吉。" },

    "景门休门": { name: "景加休", type: "凶", desc: "主文书遗失，计划受阻。" },
    "景门生门": { name: "景加生", type: "大吉", desc: "主生男之喜，求财大吉，名利双收。" },
    "景门伤门": { name: "景加伤", type: "凶", desc: "主长房少子多有阻滞，亲人不利。" },
    "景门杜门": { name: "景加杜", type: "凶", desc: "主失物难寻，文书受阻。" },
    "景门景门": { name: "景加景", type: "平", desc: "主文书印信多有不平，文案反复。" },
    "景门死门": { name: "景加死", type: "凶", desc: "主官司因田宅而起，多有不利。" },
    "景门惊门": { name: "景加惊", type: "凶", desc: "主词讼不断，多有惊恐不安。" },
    "景门开门": { name: "景加开", type: "吉", desc: "主官人升迁大吉，常人求谋有利。" },

    "死门休门": { name: "死加休", type: "凶", desc: "主求财不利，水神为患。" },
    "死门生门": { name: "死加生", type: "吉", desc: "主逢丧事，但求财却能得利。" },
    "死门伤门": { name: "死加伤", type: "大凶", desc: "主被刑杖，受罚，大凶。" },
    "死门杜门": { name: "死加杜", type: "凶", desc: "主破财，万事皆不利。" },
    "死门景门": { name: "死加景", type: "凶", desc: "主因文书、印信或财产引起官非。" },
    "死门死门": { name: "死加死", type: "大凶", desc: "主官司、大凶、多有伤亡惊恐之事。" },
    "死门惊门": { name: "死加惊", type: "凶", desc: "主因官司而产生极度惊恐。" },
    "死门开门": { name: "死加开", type: "吉", desc: "主见贵人求财，反能大吉。" },

    "惊门休门": { name: "惊加休", type: "凶", desc: "主求财破败，易惹口舌之非。" },
    "惊门生门": { name: "惊加生", type: "凶", desc: "主因妇人引起惊恐、生疑。" },
    "惊门伤门": { name: "惊加伤", type: "凶", desc: "主因惊恐而多破财。" },
    "惊门杜门": { name: "惊加杜", type: "凶", desc: "主因失物而惊恐。" },
    "惊门景门": { name: "惊加景", type: "凶", desc: "主词讼不息，惊疑不定。" },
    "惊门死门": { name: "惊加死", type: "大凶", desc: "主因病惊恐，甚至有丧事。" },
    "惊门惊门": { name: "惊加惊", type: "大凶", desc: "主疾病、惊疑，内忧外患皆有凶。" },
    "惊门开门": { name: "惊加开", type: "平", desc: "主忧疑官司，多有惊恐之事。" },

    "开门休门": { name: "开加休", type: "吉", desc: "主见贵人，利于求谋、求财。" },
    "开门生门": { name: "开加生", type: "大吉", desc: "主见贵人，求财大吉，创业顺利。" },
    "开门伤门": { name: "开加伤", type: "凶", desc: "主变动、失物，谋事多有阻隔。" },
    "开门杜门": { name: "开加杜", type: "凶", desc: "主失物难寻，有逃避之事。" },
    "开门景门": { name: "开加景", type: "平", desc: "主见贵人，但文书之事多有不利。" },
    "开门死门": { name: "开加死", type: "凶", desc: "主官司惊忧，事业受阻。" },
    "开门惊门": { name: "开加惊", type: "凶", desc: "主百事不利，大有惊恐。" },
    "开门开门": { name: "开加开", type: "大吉", desc: "主见贵人，得宝物、财喜，大吉大利。" }
  },

  scan(chart) {
    const globalPatterns = [];
    const timeStem = chart.fourPillars.hour.stem;
    const timeBranch = chart.fourPillars.hour.branch;

    const dayStem = chart.fourPillars.day.stem;
    if (this.isWuBuYuShi(dayStem, timeStem)) {
        globalPatterns.push({ name: "五不遇时", type: "大凶", desc: "诸事不顺，极度凶险" });
    }

    chart.palaces.forEach(p => {
      if (p.position === 5) return; 
      
      p.patterns = []; 
      let hStem = Array.isArray(p.heavenlyStem) ? p.heavenlyStem[0] : p.heavenlyStem;
      let eStem = Array.isArray(p.earthlyStem) ? p.earthlyStem[0] : p.earthlyStem;

      if (hStem && eStem) {
        let key = hStem + eStem;
        if (this.StemPatterns[key]) {
          p.patterns.push(this.StemPatterns[key]);
        }
      }

      if (p.gate) {
        let targetPos = QimenUtil.resolveJiGong(p.position);
        let eGate = QimenConst.GATES[targetPos]; 
        let hGate = p.gate;

        if (eGate && hGate) {
            let gateKey = hGate + eGate;
            if (this.GatePatterns[gateKey]) {
                p.patterns.push(this.GatePatterns[gateKey]);
            }
        }
      }

      const isJiMen = ["开门", "休门", "生门"].includes(p.gate);
      if (hStem === "丙" && isJiMen && eStem === "丁") {
        p.patterns.push({ name: "天遁", type: "大吉", desc: "宜祈祷求神，利战谋划。" });
      }
      if (hStem === "乙" && isJiMen && eStem === "己") {
        p.patterns.push({ name: "地遁", type: "大吉", desc: "宜安营扎寨，埋伏藏兵。" });
      }

      if (chart.zhiShi && chart.zhiShi.position === p.position) {
          if (hStem === "丁" || eStem === "丁") {
              p.patterns.push({ name: "玉女守门", type: "吉", desc: "利私下谋划、男女约会、宴请。" });
          }
      }
    });

    chart.globalPatterns = globalPatterns;
    return chart;
  },

  isWuBuYuShi(dayStem, hourStem) {
    const rules = { "甲": "庚", "乙": "辛", "丙": "壬", "丁": "癸", "戊": "甲", "己": "乙", "庚": "丙", "辛": "丁", "壬": "戊", "癸": "己" };
    return rules[dayStem] === hourStem;
  }
};

// ============================================================
// 八、传统转盘模块
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
  getStarAtOriginalPalace(palace) { return palace === 5 ? "天禽" : QimenConst.STARS[palace]; },
  build(earthStems, timeStem, xunStem, origXunPalace, isYang) {
    const result = {};
    const effectiveTimeStem = timeStem === "甲" ? xunStem : timeStem;
    let timeStemPalace = null;
    for (const p of QimenConst.PALACES) {
      if (earthStems[p] === effectiveTimeStem) { timeStemPalace = p; break; }
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
      if (result[p] === "天芮") { tianRuiPalace = p; break; }
    }
    if (tianRuiPalace) result[tianRuiPalace] = "天芮/天禽";
    return { stars: result, zhiFuStar: zhiFuStar === "天禽" ? "天芮/天禽" : zhiFuStar, zhiFuPalace: effectiveTime };
  }
};

const OogoZhuanMen = {
  getOriginalGate(palace) { return QimenConst.GATES[palace] || ""; },
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
    return { gates: result, zhiShiGate, zhiShiPalace: targetPalace, branchOffset: steps };
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
    let juInfo;
    if (method === "chaibu") juInfo = OogoChaiBu.calculate(year, month, day, hour, min, sec);
    else if (method === "maoshan") juInfo = OogoMaoShan.calculate(year, month, day, hour, min, sec);
    else juInfo = OogoZhiRun.calculate(year, month, day, hour, min, sec);

    const chart = juInfo.chart;
    const juNumber = juInfo.juNumber;
    const isYang = juInfo.isYangdun;
    const originalResolveJiGong = QimenUtil.resolveJiGong;
    const targetJiGong = (isYang && jigong === "y8y2") ? 8 : 2;
    QimenUtil.resolveJiGong = function(palace) { return palace === 5 ? targetJiGong : palace; };

    const timeStem = chart.fourPillars.hour.stem;
    const timeBranch = chart.fourPillars.hour.branch;
    const xun = QimenUtil.getXunInfo(timeStem, timeBranch);
    const earthStems = OogoDiPan.build(juNumber, isYang);

    let origXunPalace = null;
    for (const p of QimenConst.PALACES) {
      if (earthStems[p] === xun.stem) { origXunPalace = p; break; }
    }
    if (!origXunPalace) throw new Error(`找不到旬首地盘宫：${xun.stem}`);

    const starInfo = OogoZhuanXing.build(earthStems, timeStem, xun.stem, origXunPalace, isYang);
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

const hiddenStemsMap = new Map();

const qimenStems = [
  "戊", "己", "庚", "辛", "壬",
  "癸", "丁", "丙", "乙"
];

const hiddenTimeStem = timeStem === "甲"
  ? xun.stem
  : timeStem;

const tsIdx = qimenStems.indexOf(hiddenTimeStem);

if (tsIdx !== -1) {

  // 值使所在宫
  const zsTargetPalace = gateInfo.zhiShiPalace;

  // 值使宫的地盘干
  const zhiShiEarthStem = earthStems[zsTargetPalace];

  // ----------------------------------------------------------
  // 特殊情况：
  // 如果时干 = 值使宫地盘干
  // 则时干入中五宫
  // ----------------------------------------------------------
  const hiddenStartPalace =
    hiddenTimeStem === zhiShiEarthStem
      ? 5
      : zsTargetPalace;

  // ----------------------------------------------------------
  // 阳遁顺飞
  // 阴遁逆飞
  // ----------------------------------------------------------
  for (let i = 0; i < 9; i++) {

    let landPalace = isYang
      ? (hiddenStartPalace + i)
      : (hiddenStartPalace - i);

    while (landPalace > 9) landPalace -= 9;
    while (landPalace < 1) landPalace += 9;

    hiddenStemsMap.set(
      landPalace,
      qimenStems[(tsIdx + i) % 9]
    );
  }
}

chart.hiddenStems = hiddenStemsMap;

    const palaces = [];
    for (const position of QimenConst.PALACES) {
      palaces.push({
        position, earthStem: earthStems[position] || "", heavenlyStem: "",
        earthlyStem: earthStems[position] || "", star: starInfo.stars[position] || "",
        gate: gateInfo.gates[position] || "", deity: heavenDeities[position] || "",
        earthDeity: earthDeities[position] || "", hiddenStem: hiddenStemsMap.get(position) || "无", 
        isJiGong: position === 5
      });
    }

    const ring = QimenConst.BAGUA_RING;
    const effectiveTimeStem = timeStem === "甲" ? xun.stem : timeStem;
    let timeStemPalace = null;
    for (const p of QimenConst.PALACES) {
      if (earthStems[p] === effectiveTimeStem) { timeStemPalace = p; break; }
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
    heavenStems[5] = heavenStems[targetJiGong];

    palaces.forEach(p => {
      p.heavenlyStem = heavenStems[p.position] || "";
      if (p.position === targetJiGong) { p.earthlyStem = [p.earthlyStem, earthStems[5]]; }
      if (p.star && p.star.includes("天禽")) { p.heavenlyStem = [p.heavenlyStem, earthStems[5]]; }
    });

    const result = {
      method: juInfo.method, ju: { number: juNumber, type: isYang ? "阳遁" : "阴遁" },
      chart, fourPillars: chart.fourPillars, solarTerm: { name: juInfo.termName, date: juInfo.termDate },
      fuTou: { date: juInfo.fuTouDate, ganZhi: juInfo.fuTouGanZhi, yuan: juInfo.yuanName },
      zhiFu: { star: starInfo.zhiFuStar, position: starInfo.zhiFuPalace },
      zhiShi: { gate: gateInfo.zhiShiGate, position: gateInfo.zhiShiPalace },
      xun: { name: xun.name, stem: xun.stem, branch: xun.branch, palace: origXunPalace },
      hiddenStems: hiddenStemsMap, palaces, debugInfo: juInfo.debugInfo
    };

    QimenUtil.resolveJiGong = originalResolveJiGong;
    let enhancedChart = OogoTagEnhancer.enhance(result);
    return OogoGeJu.scan(enhancedChart);
  }
};

// ============================================================
// 九、原生飞盘模块 (已加入 isMingFa 参数联动)
// ============================================================
const OogoFeiPan = {
  fly(chart, isMingFa = false) {
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
    const xunStem = { "甲子": "戊", "甲戌": "己", "甲申": "庚", "甲午": "辛", "甲辰": "壬", "甲寅": "癸" }[xunName];

    const pureEarthStems = {};
    let palace = juNumber;
    const direction = isYang ? 1 : -1;
    for (let i = 0; i < 9; i++) {
      pureEarthStems[palace] = qimenStems[i];
      palace = QimenUtil.numberMove(palace, 1, direction);
    }

    const origStars = { 1: "天蓬", 2: "天芮", 3: "天冲", 4: "天辅", 5: "天禽", 6: "天心", 7: "天柱", 8: "天任", 9: "天英" };
    const origGates = { 1: "休门", 2: "死门", 3: "伤门", 4: "杜门", 5: "中门", 6: "开门", 7: "惊门", 8: "生门", 9: "景门" };

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

    const deitiesYang = ["符", "螣", "阴", "六", "勾", "常", "朱", "地", "天"];
    const deitiesYin  = ["符", "螣", "阴", "六", "白", "常", "玄", "地", "天"];
    const deitiesList = isYang ? deitiesYang : deitiesYin;

    // ★ 联动参数生效：传统随星，鸣法随门
    const deityStartPalace = isMingFa ? zsTargetPalace : zfTargetPalace;

    const flyDeities = {};
    for (let i = 0; i < 9; i++) {
      let landPalace = isYang ? (deityStartPalace + i) : (deityStartPalace - i);
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

      p.star = flyStars[pos]; p.gate = gate; p.deity = flyDeities[pos];
      p.heavenlyStem = hStem; p.earthlyStem = pureEarthStems[pos];
      p.hiddenStem = flyHiddenStems[pos] || "无";
      delete p.isJiGong;

      let jx = false;
      if ((hStem === "戊" && pos === 3) || (hStem === "己" && pos === 2) || (hStem === "庚" && pos === 8) || (hStem === "辛" && pos === 9) || (hStem === "壬" && pos === 4) || (hStem === "癸" && pos === 4)) jx = true;
      p.liuYiJiXing = { hasJiXing: jx };

      const gateEle = { "休门": "水", "生门": "土", "伤门": "木", "杜门": "木", "景门": "火", "死门": "土", "惊门": "金", "开门": "金", "中门": "土" }[gate];
      const palaceEle = { 1: "水", 2: "土", 3: "木", 4: "木", 5: "土", 6: "金", 7: "金", 8: "土", 9: "火" }[pos];
      let po = false;
      if ((gateEle === "水" && palaceEle === "火") || (gateEle === "火" && palaceEle === "金") || (gateEle === "金" && palaceEle === "木") || (gateEle === "木" && palaceEle === "土") || (gateEle === "土" && palaceEle === "水")) po = true;
      p.gatePressure = { hasPressure: po, text: po ? "门迫" : "" };

      let mu = false;
      if ((pos === 6 && ["丙", "戊", "乙"].includes(hStem)) || (pos === 8 && ["丁", "己", "庚"].includes(hStem)) || (pos === 4 && ["辛", "壬"].includes(hStem)) || (pos === 2 && hStem === "癸")) mu = true;
      p.tombInfo = { heavenlyStemInTomb: mu ? [hStem] : [], earthlyStemInTomb: [] };
    });

    if (!chart.zhiFu) chart.zhiFu = {};
    if (!chart.zhiShi) chart.zhiShi = {};
    chart.zhiFu.position = zfTargetPalace;
    chart.zhiShi.position = zsTargetPalace;

    let enhancedChart = OogoTagEnhancer.enhance(chart);
    return OogoGeJu.scan(enhancedChart);
  }
};

// ============================================================
// 十、统一入口与导出
// ============================================================
const OogoZhuanPanEnhancer = { enhance(chart, xunDun, isYang) { return chart; } };

const OogoQimen = {
  calculate(year, month, day, hour, min, sec = 0) { return OogoZhuanPan.calculate(year, month, day, hour, min, sec, "zhirun"); },
  calculateChaiBu(year, month, day, hour, min, sec = 0) { return OogoZhuanPan.calculate(year, month, day, hour, min, sec, "chaibu"); },
  calculateMaoShan(year, month, day, hour, min, sec = 0) { return OogoZhuanPan.calculate(year, month, day, hour, min, sec, "maoshan"); },
  calculateZhiRun(year, month, day, hour, min, sec = 0) { return OogoZhiRun.calculate(year, month, day, hour, min, sec); }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    QimenConst, QimenUtil, CalendarAdapter, QimenFuTou, QimenSolarTerm,
    OogoZhiRun, OogoChaiBu, OogoMaoShan, OogoDiPan, OogoZhuanXing, OogoZhuanMen,
    OogoTianShen, OogoDiShen, OogoKongWang, OogoYiMa, OogoFuFan,
    OogoTagEnhancer, OogoGeJu, OogoZhuanPan, OogoZhuanPanEnhancer, OogoFeiPan, OogoQimen
  };
}

if (typeof window !== "undefined") {
  window.OogoQimen = OogoQimen; window.OogoZhiRun = OogoZhiRun; window.OogoChaiBu = OogoChaiBu;
  window.OogoMaoShan = OogoMaoShan; window.OogoZhuanPan = OogoZhuanPan; window.OogoFeiPan = OogoFeiPan;
  window.OogoGeJu = OogoGeJu; window.OogoZhuanPanEnhancer = OogoZhuanPanEnhancer;
}
