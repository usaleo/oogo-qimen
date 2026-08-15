// ============================================================
// OOGO 奇门遁甲核心引擎
// ============================================================
// 主体系：
//   时家奇门
//   传统转盘
//   置闰法
//
// 辅助体系：
//   拆补法
//   空亡
//   驿马
//   六仪击刑
//   门迫
//   天盘干入墓
//   伏吟 / 反吟
//   地八神
//
// 重要说明：
// 1. 本文件不负责自己计算真太阳时。
// 2. CalendarAdapter 是唯一历法入口。
// 3. 置闰法与拆补法完全分离。
// 4. 转盘与飞盘完全分离。
// 5. 所有宫位移动必须使用洛书八宫顺序，
//    禁止使用 1→2→3→4→5→6→7→8→9 作为飞布路径。
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

  // 八神阳遁顺、阴遁逆
  // 实际由 BAGUA_RING 完成
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

  // 节气顺序
  SOLAR_TERMS: [
    "小寒",
    "大寒",
    "立春",
    "雨水",
    "惊蛰",
    "春分",
    "清明",
    "谷雨",
    "立夏",
    "小满",
    "芒种",
    "夏至",
    "小暑",
    "大暑",
    "立秋",
    "处暑",
    "白露",
    "秋分",
    "寒露",
    "霜降",
    "立冬",
    "小雪",
    "大雪",
    "冬至"
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
  ],

  // 中五寄坤
  CENTER_PALACE: 5,
  CENTER_DEPEND_PALACE: 2,

  // 天禽寄坤
  TIAN_QIN_PALACE: 2
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

  // 甲子旬首
  getXunInfo(stem, branch) {

    const index = this.findStemBranchIndex(stem, branch);

    if (index < 0) {
      throw new Error(`无法确定旬：${stem}${branch}`);
    }

    const xunIndex = index - (index % 10);

    const xunNames = [
      "甲子",
      "甲戌",
      "甲申",
      "甲午",
      "甲辰",
      "甲寅"
    ];

    const xunName = xunNames[xunIndex / 10];

    const xunStemMap = {
      "甲子": "戊",
      "甲戌": "己",
      "甲申": "庚",
      "甲午": "辛",
      "甲辰": "壬",
      "甲寅": "癸"
    };

    const xunBranch = {
      "甲子": "子",
      "甲戌": "戌",
      "甲申": "申",
      "甲午": "午",
      "甲辰": "辰",
      "甲寅": "寅"
    }[xunName];

    return {
      name: xunName,
      stem: xunStemMap[xunName],
      branch: xunBranch,
      index: index
    };
  },

  // 洛书八宫环
  ringIndex(palace) {
    return QimenConst.BAGUA_RING.indexOf(palace);
  },

  ringMove(palace, steps, direction = 1) {

    const ring = QimenConst.BAGUA_RING;

    const index = ring.indexOf(palace);

    if (index < 0) {
      return palace;
    }

    return ring[
      this.mod(index + steps * direction, ring.length)
    ];
  },

  // 九宫顺逆（包含中五）
  numberMove(palace, steps, direction = 1) {

    return this.mod(
      (palace - 1) + steps * direction,
      9
    ) + 1;
  },

  // 六仪击刑
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

  // 天盘干入墓
  //
  // 采用：
  // 乙、丙、戊 → 乾6
  // 丁、己、庚 → 艮8
  // 辛、壬 → 巽4
  // 癸 → 坤2
  //
  // 乙墓采用“乾6”版本。
  isTianGanMu(stem, palace) {

    if (
      palace === 6 &&
      ["乙","丙","戊"].includes(stem)
    ) return true;

    if (
      palace === 8 &&
      ["丁","己","庚"].includes(stem)
    ) return true;

    if (
      palace === 4 &&
      ["辛","壬"].includes(stem)
    ) return true;

    if (
      palace === 2 &&
      stem === "癸"
    ) return true;

    return false;
  },

  // 门迫：门克宫
  isMenPo(gate, palace) {

    if (!gate) {
      return false;
    }

    const gateElement = QimenConst.GATE_ELEMENT[gate];
    const palaceElement = QimenConst.PALACE_ELEMENT[palace];

    if (!gateElement || !palaceElement) {
      return false;
    }

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

  // ----------------------------------------------------------
  // 获取自然日干支
  //
  // 固定使用当天12:00查询。
  // 防止底层历法库的23点早子时规则污染符头判断。
  // ----------------------------------------------------------

  getDayGanZhi(year, month, day) {

    const c = ThreeMeta.QimenChart.fromSolar(
      year,
      month,
      day,
      12,
      0,
      0
    );

    return c.fourPillars.day;
  },


  // ----------------------------------------------------------
  // 获取完整四柱
  //
  // 真实时刻交给底层历法库。
  // ----------------------------------------------------------

  getFullChart(year, month, day, hour, min, sec = 0) {

    return ThreeMeta.QimenChart.fromSolar(
      year,
      month,
      day,
      hour,
      min,
      sec
    );
  },


  // ----------------------------------------------------------
  // 获取节气
  // ----------------------------------------------------------

  getSolarTermInfo(year, month, day) {

    const c = ThreeMeta.QimenChart.fromSolar(
      year,
      month,
      day,
      12,
      0,
      0
    );

    const st =
      c.timeInfo &&
      c.timeInfo.solarTerm;

    if (typeof st === "string") {

      return {
        name: st,
        exactTime: null
      };

    }

    return {
      name: st && st.name ? st.name : null,
      exactTime:
        st &&
        (
          st.exactTime ||
          st.exactDate ||
          st.time ||
          null
        )
    };
  },


  // ----------------------------------------------------------
  // 如果底层库能提供精确节气时刻，则读取
  // ----------------------------------------------------------

  getExactSolarTermTime(year, month, day) {

    const info =
      this.getSolarTermInfo(year, month, day);

    return info.exactTime || null;
  }
};


// ============================================================
// 四、符头系统
// ============================================================

const QimenFuTou = {

  // ----------------------------------------------------------
  // 根据自然日日干确定当前日属于哪个甲己符头
  // ----------------------------------------------------------

  getFuTouDate(year, month, day) {

    const dayGZ =
      CalendarAdapter.getDayGanZhi(
        year,
        month,
        day
      );

    const stem = dayGZ.stem;

    const stemIndex =
      QimenUtil.stemIndex(stem);

    if (stemIndex < 0) {
      throw new Error(`非法日干：${stem}`);
    }

    // 甲=0, 乙=1, 丙=2, 丁=3, 戊=4
    // 己=5, 庚=6, 辛=7, 壬=8, 癸=9
    //
    // 距离最近前一个甲/己日
    const offset =
      stem === "甲" || stem === "己"
        ? 0
        : (
          stem === "乙" ? 1 :
          stem === "丙" ? 2 :
          stem === "丁" ? 3 :
          stem === "戊" ? 4 :
          stem === "庚" ? 1 :
          stem === "辛" ? 2 :
          stem === "壬" ? 3 :
          4
        );

    const date =
      QimenUtil.dateOnly(
        year,
        month,
        day
      );

    const fuTouDate =
      QimenUtil.nextDate(
        date,
        -offset
      );

    const gz =
      CalendarAdapter.getDayGanZhi(
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


  // ----------------------------------------------------------
  // 根据符头干支确定三元
  // ----------------------------------------------------------

  getYuanFromFuTou(fuTouGanZhi) {

    const branch =
      fuTouGanZhi.branch;

    const upper = [
      "子","午","卯","酉"
    ];

    const middle = [
      "寅","申","巳","亥"
    ];

    const lower = [
      "辰","戌","丑","未"
    ];

    if (upper.includes(branch)) {
      return {
        index: 0,
        name: "上元"
      };
    }

    if (middle.includes(branch)) {
      return {
        index: 1,
        name: "中元"
      };
    }

    if (lower.includes(branch)) {
      return {
        index: 2,
        name: "下元"
      };
    }

    throw new Error(
      `无法判定三元：${fuTouGanZhi.stem}${branch}`
    );
  }
};


// ============================================================
// 五、节气扫描器
// ============================================================

const QimenSolarTerm = {

  // ----------------------------------------------------------
  // 从指定日期向前搜索当前节气起点
  // ----------------------------------------------------------

  findPreviousTerm(date, maxDays = 20) {

    let d =
      QimenUtil.dateOnly(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );

    let currentInfo =
      CalendarAdapter.getSolarTermInfo(
        d.getFullYear(),
        d.getMonth() + 1,
        d.getDate()
      );

    let currentName =
      currentInfo.name;

    for (let i = 0; i <= maxDays; i++) {

      const info =
        CalendarAdapter.getSolarTermInfo(
          d.getFullYear(),
          d.getMonth() + 1,
          d.getDate()
        );

      if (info.name !== currentName) {

        const termDate =
          QimenUtil.nextDate(d, 1);

        return {
          name: currentName,
          date: termDate
        };
      }

      d =
        QimenUtil.nextDate(d, -1);
    }

    return {
      name: currentName,
      date: d
    };
  },


  // ----------------------------------------------------------
  // 向后搜索下一个节气
  // ----------------------------------------------------------

  findNextTerm(date, maxDays = 20) {

    let d =
      QimenUtil.dateOnly(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );

    const base =
      CalendarAdapter.getSolarTermInfo(
        d.getFullYear(),
        d.getMonth() + 1,
        d.getDate()
      );

    const baseName =
      base.name;

    for (let i = 1; i <= maxDays; i++) {

      d =
        QimenUtil.nextDate(d, 1);

      const info =
        CalendarAdapter.getSolarTermInfo(
          d.getFullYear(),
          d.getMonth() + 1,
          d.getDate()
        );

      if (info.name !== baseName) {

        return {
          name: info.name,
          date: d
        };
      }
    }

    return null;
  },


  // ----------------------------------------------------------
  // 判断某日期属于阳遁还是阴遁
  // ----------------------------------------------------------

  isYangDun(termName) {

    return QimenConst.YANG_TERMS.includes(
      termName
    );
  },


  // ----------------------------------------------------------
  // 获取某节气三元局表
  // ----------------------------------------------------------

  getJuTable(termName, isYang) {

    const table =
      isYang
        ? QimenConst.YANG_JU
        : QimenConst.YIN_JU;

    return table[termName] || null;
  }
};


// ============================================================
// 六、置闰法
// ============================================================

const OogoZhiRun = {

  // ----------------------------------------------------------
  // 置闰规则说明
  //
  // 这里采用传统“超神→闰奇→接气→正授”的模型。
  //
  // 不是：
  // “离哪个节气近就用哪个节气”
  //
  // 而是：
  // 符头与节气之间的关系决定：
  // 正授 / 超神 / 接气
  //
  // 超神超过一旬左右：
  // 芒种、大雪附近进入置闰处理。
  // ----------------------------------------------------------


  // 传统置闰特殊节气
  RUN_TERMS: [
    "芒种",
    "大雪"
  ],


  // ----------------------------------------------------------
  // 判断一个节气与符头之间的关系
  // ----------------------------------------------------------

  classifyFuTouAndTerm(
    fuTouDate,
    termDate
  ) {

    const diff =
      Math.round(
        (
          fuTouDate.getTime() -
          termDate.getTime()
        ) /
        86400000
      );

    if (diff === 0) {

      return {
        type: "正授",
        days: 0
      };
    }

    if (diff < 0) {

      return {
        type: "超神",
        days: Math.abs(diff)
      };
    }

    return {
      type: "接气",
      days: diff
    };
  },


  // ----------------------------------------------------------
  // 找当前节气的符头
  //
  // 这里不是用“当前日符头”直接决定节气，
  // 而是找到当前节气附近的甲己符头。
  // ----------------------------------------------------------

  getTermFuTou(termDate) {

    let best = null;

    for (let offset = -5; offset <= 5; offset++) {

      const d =
        QimenUtil.nextDate(
          termDate,
          offset
        );

      const gz =
        CalendarAdapter.getDayGanZhi(
          d.getFullYear(),
          d.getMonth() + 1,
          d.getDate()
        );

      if (
        gz.stem === "甲" ||
        gz.stem === "己"
      ) {

        if (!best) {

          best = {
            date: d,
            stem: gz.stem,
            branch: gz.branch,
            ganZhi: gz.stem + gz.branch
          };

        } else {

          const a =
            Math.abs(
              d.getTime() -
              termDate.getTime()
            );

          const b =
            Math.abs(
              best.date.getTime() -
              termDate.getTime()
            );

          if (a < b) {
            best = {
              date: d,
              stem: gz.stem,
              branch: gz.branch,
              ganZhi: gz.stem + gz.branch
            };
          }
        }
      }
    }

    if (!best) {
      throw new Error(
        `无法找到节气符头：${QimenUtil.dateKey(termDate)}`
      );
    }

    return best;
  },


  // ----------------------------------------------------------
  // 判断当前日期所在节气
  // ----------------------------------------------------------

  getCurrentTermContext(
    year,
    month,
    day
  ) {

    const date =
      QimenUtil.dateOnly(
        year,
        month,
        day
      );

    const current =
      CalendarAdapter.getSolarTermInfo(
        year,
        month,
        day
      );

    const previous =
      QimenSolarTerm.findPreviousTerm(
        date
      );

    const next =
      QimenSolarTerm.findNextTerm(
        date
      );

    return {
      date,
      currentName: current.name,
      previous,
      next
    };
  },


  // ----------------------------------------------------------
  // 主置闰计算
  // ----------------------------------------------------------

  calculate(
    year,
    month,
    day,
    hour,
    min,
    sec = 0
  ) {

    const fullChart =
      CalendarAdapter.getFullChart(
        year,
        month,
        day,
        hour,
        min,
        sec
      );


    // --------------------------------------------------------
    // 1. 当前自然日符头
    // --------------------------------------------------------

    const fuTou =
      QimenFuTou.getFuTouDate(
        year,
        month,
        day
      );

    const yuan =
      QimenFuTou.getYuanFromFuTou(
        {
          stem: fuTou.stem,
          branch: fuTou.branch
        }
      );


    // --------------------------------------------------------
    // 2. 当前节气
    // --------------------------------------------------------

    const termContext =
      this.getCurrentTermContext(
        year,
        month,
        day
      );

    const termName =
      termContext.currentName;

    const termDate =
      termContext.previous.date;


    // --------------------------------------------------------
    // 3. 符头与当前节气关系
    // --------------------------------------------------------

    const relation =
      this.classifyFuTouAndTerm(
        fuTou.date,
        termDate
      );


    // --------------------------------------------------------
    // 4. 节气所属阴阳遁
    // --------------------------------------------------------

    const isYang =
      QimenSolarTerm.isYangDun(
        termName
      );


    // --------------------------------------------------------
    // 5. 判断是否进入传统置闰窗口
    //
    // 芒种之后至夏至前
    // 大雪之后至冬至前
    // --------------------------------------------------------

    let isRunWindow = false;

    if (
      termName === "芒种" ||
      termName === "夏至"
    ) {

      isRunWindow = true;

    } else if (
      termName === "大雪" ||
      termName === "冬至"
    ) {

      isRunWindow = true;
    }


    // --------------------------------------------------------
    // 6. 超神天数
    // --------------------------------------------------------

    const superShenDays =
      relation.type === "超神"
        ? relation.days
        : 0;


    // --------------------------------------------------------
    // 7. 置闰状态
    //
    // 传统资料对“九、十、十一日”的具体门槛
    // 存在版本差异。
    //
    // 主模式采用：
    // 超过九日进入置闰候选。
    //
    // 但只允许在芒种、大雪体系内真正标记。
    // --------------------------------------------------------

    let isTrueRun = false;

    if (
      superShenDays > 9 &&
      (
        termName === "芒种" ||
        termName === "大雪"
      )
    ) {

      isTrueRun = true;
    }


    // --------------------------------------------------------
    // 8. 普通局数
    // --------------------------------------------------------

    const table =
      QimenSolarTerm.getJuTable(
        termName,
        isYang
      );

    if (!table) {

      throw new Error(
        `没有找到节气局数表：${termName}`
      );
    }


    // --------------------------------------------------------
    // 9. 取得当前符头三元
    // --------------------------------------------------------

    let yuanIndex =
      yuan.index;


    // --------------------------------------------------------
    // 10. 置闰模式
    //
    // 闰奇的核心不是改变阴阳遁，
    // 而是重复当前节气的三元周期，
    // 直到接气。
    //
    // 当前盘如果实际落在“闰三元”窗口，
    // 标记为 RUN。
    // --------------------------------------------------------

    let mode = relation.type;

    if (isTrueRun) {
      mode = "闰奇";
    }


    // --------------------------------------------------------
    // 11. 局数
    // --------------------------------------------------------

    const juNumber =
      table[yuanIndex];


    // --------------------------------------------------------
    // 12. 返回
    // --------------------------------------------------------

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

        currentDate:
          QimenUtil.dateKey(
            QimenUtil.dateOnly(
              year,
              month,
              day
            )
          ),

        fuTouDate:
          QimenUtil.dateKey(
            fuTou.date
          ),

        fuTouGanZhi:
          fuTou.ganZhi,

        yuan:
          yuan.name,

        solarTerm:
          termName,

        solarTermDate:
          QimenUtil.dateKey(
            termDate
          ),

        relation:
          relation.type,

        relationDays:
          relation.days,

        superShenDays,

        isRunWindow,

        isTrueRun,

        juNumber,

        isYangdun:
          isYang
      }
    };
  }
};


// ============================================================
// 七、拆补法
// ============================================================

const OogoChaiBu = {

  calculate(
    year,
    month,
    day,
    hour,
    min,
    sec = 0
  ) {

    const fullChart =
      CalendarAdapter.getFullChart(
        year,
        month,
        day,
        hour,
        min,
        sec
      );


    const date =
      QimenUtil.dateOnly(
        year,
        month,
        day
      );


    const term =
      QimenSolarTerm.findPreviousTerm(
        date
      );


    const termName =
      term.name;


    const termDate =
      term.date;


    const days =
      Math.floor(
        (
          date.getTime() -
          termDate.getTime()
        ) /
        86400000
      );


    // 拆补法：
    // 节气交接日为该节气第一元起点，
    // 每五日换一元。
    //
    // 0~4 上元
    // 5~9 中元
    // 10~14 下元

    let yuanIndex =
      Math.floor(days / 5);

    if (yuanIndex < 0) yuanIndex = 0;
    if (yuanIndex > 2) yuanIndex = 2;


    const isYang =
      QimenSolarTerm.isYangDun(
        termName
      );


    const table =
      QimenSolarTerm.getJuTable(
        termName,
        isYang
      );


    if (!table) {
      throw new Error(
        `拆补法没有找到局数表：${termName}`
      );
    }


    return {

      chart: fullChart,

      method: "拆补法",

      juNumber:
        table[yuanIndex],

      isYangdun:
        isYang,

      termName,

      termDate,

      yuanIndex,

      yuanName:
        ["上元","中元","下元"][yuanIndex],

      debugInfo: {

        termName,

        termDate:
          QimenUtil.dateKey(
            termDate
          ),

        daysFromTerm:
          days,

        yuanIndex,

        yuanName:
          ["上元","中元","下元"][yuanIndex],

        juNumber:
          table[yuanIndex]
      }
    };
  }
};


// ============================================================
// 八、地盘排布
// ============================================================

const OogoDiPan = {

  // ----------------------------------------------------------
  // 传统转盘地盘
  //
  // 戊己庚辛壬癸丁丙乙
  //
  // 阳遁顺
  // 阴遁逆
  //
  // 中五寄坤二。
  // ----------------------------------------------------------

  build(juNumber, isYang) {

    const result = {};

    const order =
      isYang
        ? [1,2,3,4,5,6,7,8,9]
        : [9,8,7,6,5,4,3,2,1];


    for (let i = 0; i < 9; i++) {

      result[order[i]] =
        QimenConst.QIMEN_STEMS[i];
    }


    // 中五寄坤二
    //
    // 保留5宫数据用于内部逻辑，
    // 同时在最终显示中可以选择隐藏。
    //
    return result;
  }
};


// ============================================================
// 九、转盘九星
// ============================================================

const OogoZhuanXing = {

  // ----------------------------------------------------------
  // 根据原宫位取得九星
  // ----------------------------------------------------------

  getOriginalStar(palace) {

    return QimenConst.STARS[palace];
  },


  // ----------------------------------------------------------
  // 天禽随天芮
  // ----------------------------------------------------------

  getStarAtOriginalPalace(palace) {

    if (palace === 5) {
      return "天禽";
    }

    return QimenConst.STARS[palace];
  },


  // ----------------------------------------------------------
  // 转盘天星
  //
  // 值符星随时干所在宫移动。
  // 其余九星沿八宫顺时针保持相对次序。
  //
  // 天禽与天芮同宫。
  // ----------------------------------------------------------

  build(
    earthStems,
    timeStem,
    xunStem,
    xunPalace,
    isYang
  ) {

    const result = {};

    // 时干如果为甲，实际取旬首所遁六仪
    const effectiveTimeStem =
      timeStem === "甲"
        ? xunStem
        : timeStem;


    // 找时干地盘宫
    let timeStemPalace = null;

    for (const p of QimenConst.PALACES) {

      if (
        earthStems[p] === effectiveTimeStem
      ) {

        timeStemPalace = p;
        break;
      }
    }


    if (!timeStemPalace) {

      throw new Error(
        `找不到时干地盘宫：${effectiveTimeStem}`
      );
    }


    // 值符星 = 旬首地盘宫原星
    const zhiFuStar =
      OogoZhuanXing.getStarAtOriginalPalace(
        xunPalace
      );


    // --------------------------------------------------------
    // 建立八宫星序
    //
    // 从值符原宫出发，
    // 将原盘星按洛书八宫顺序顺时针搬运。
    // --------------------------------------------------------

    const ring =
      QimenConst.BAGUA_RING;


    const xunRingIndex =
      ring.indexOf(xunPalace);


    const targetRingIndex =
      ring.indexOf(timeStemPalace);


    if (
      xunRingIndex < 0 ||
      targetRingIndex < 0
    ) {

      throw new Error(
        "值符或时干落在非法八宫"
      );
    }


    // --------------------------------------------------------
    // 星转动：
    //
    // 传统转盘的星盘整体随值符转动。
    // 星的相对顺序保持不变。
    //
    // 阳阴只影响起局时地盘，
    // 星盘旋转本身保持顺时针。
    // --------------------------------------------------------

    const shift =
      QimenUtil.mod(
        targetRingIndex -
        xunRingIndex,
        8
      );


    for (let i = 0; i < 8; i++) {

      const sourcePalace =
        ring[
          QimenUtil.mod(
            xunRingIndex + i,
            8
          )
        ];

      const targetPalace =
        ring[
          QimenUtil.mod(
            xunRingIndex + i + shift,
            8
          )
        ];

      result[targetPalace] =
        OogoZhuanXing.getOriginalStar(
          sourcePalace
        );
    }


    // 天禽随天芮
    //
    // 天芮原宫2，因此天禽跟随天芮。
    //
    // 找天芮所在宫。
    let tianRuiPalace = null;

    for (const p of QimenConst.PALACES) {

      if (result[p] === "天芮") {
        tianRuiPalace = p;
        break;
      }
    }

    if (tianRuiPalace) {
      result[tianRuiPalace] = "天芮/天禽";
    }


    return {

      stars: result,

      zhiFuStar,

      zhiFuPalace:
        timeStemPalace
    };
  }
};


// ============================================================
// 十、转盘八门
// ============================================================

const OogoZhuanMen = {

  // ----------------------------------------------------------
  // 找原始值使门
  // ----------------------------------------------------------

  getOriginalGate(palace) {

    return QimenConst.GATES[palace] || "";
  },


  // ----------------------------------------------------------
  // 值使门随时支
  //
  // 从旬首宫开始，
  // 按九宫数字顺逆数到时支序数。
  //
  // 这是传统时家转盘的重要步骤。
  // ----------------------------------------------------------

  build(
    xunPalace,
    xunBranch,
    timeBranch,
    isYang
  ) {

    const result = {};

    const xunIndex =
      QimenUtil.branchIndex(
        xunBranch
      );

    const timeIndex =
      QimenUtil.branchIndex(
        timeBranch
      );


    if (
      xunIndex < 0 ||
      timeIndex < 0
    ) {

      throw new Error(
        `无法计算值使：${xunBranch}/${timeBranch}`
      );
    }


    const branchOffset =
      QimenUtil.mod(
        timeIndex - xunIndex,
        12
      );


    // --------------------------------------------------------
    // 值使落宫
    //
    // 阳顺、阴逆
    // 以旬首宫为起点。
    //
    // 九宫数字顺序：
    // 1→2→3→4→5→6→7→8→9
    //
    // 中五属于计数位。
    // --------------------------------------------------------

    const targetPalace =
      QimenUtil.numberMove(
        xunPalace,
        branchOffset,
        isYang ? 1 : -1
      );


    // 原值使门：
    // 旬首所在宫原始门。
    //
    // 中五没有八门，因此寄坤二。
    const effectiveXunPalace =
      xunPalace === 5
        ? 2
        : xunPalace;


    const zhiShiGate =
      OogoZhuanMen.getOriginalGate(
        effectiveXunPalace
      );


    if (!zhiShiGate) {

      throw new Error(
        `无法确定值使门：宫${xunPalace}`
      );
    }


    // --------------------------------------------------------
    // 八门以值使为起点，
    // 其余门保持固定顺序顺时针布。
    // --------------------------------------------------------

    const ring =
      QimenConst.BAGUA_RING;


    const targetRingIndex =
      ring.indexOf(targetPalace);


    if (targetRingIndex < 0) {

      throw new Error(
        `值使目标宫非法：${targetPalace}`
      );
    }


    const gateIndex =
      QimenConst.GATE_ORDER.indexOf(
        zhiShiGate
      );


    if (gateIndex < 0) {

      throw new Error(
        `未知值使门：${zhiShiGate}`
      );
    }


    // 八门从值使门开始，
    // 按八宫顺时针排列。
    for (let i = 0; i < 8; i++) {

      const gate =
        QimenConst.GATE_ORDER[
          QimenUtil.mod(
            gateIndex + i,
            8
          )
        ];

      const palace =
        ring[
          QimenUtil.mod(
            targetRingIndex + i,
            8
          )
        ];

      result[palace] = gate;
    }


    return {

      gates: result,

      zhiShiGate,

      zhiShiPalace:
        targetPalace,

      branchOffset
    };
  }
};


// ============================================================
// 十一、转盘天八神
// ============================================================

const OogoTianShen = {

  build(
    zhiFuPalace,
    isYang
  ) {

    const result = {};

    const ring =
      QimenConst.BAGUA_RING;


    const start =
      ring.indexOf(
        zhiFuPalace
      );


    if (start < 0) {

      throw new Error(
        `天八神值符宫非法：${zhiFuPalace}`
      );
    }


    const direction =
      isYang ? 1 : -1;


    for (let i = 0; i < 8; i++) {

      const palace =
        ring[
          QimenUtil.mod(
            start + direction * i,
            8
          )
        ];

      result[palace] =
        QimenConst.DEITY_ORDER[i];
    }


    return result;
  }
};


// ============================================================
// 十二、地八神
// ============================================================

const OogoDiShen = {

  // ----------------------------------------------------------
  // 地八神：
  // 以地盘旬首落宫为值符起点。
  // ----------------------------------------------------------

  build(
    earthXunPalace,
    isYang
  ) {

    const result = {};

    const ring =
      QimenConst.BAGUA_RING;


    const start =
      ring.indexOf(
        earthXunPalace
      );


    if (start < 0) {

      throw new Error(
        `地八神旬首宫非法：${earthXunPalace}`
      );
    }


    const direction =
      isYang ? 1 : -1;


    for (let i = 0; i < 8; i++) {

      const palace =
        ring[
          QimenUtil.mod(
            start + direction * i,
            8
          )
        ];

      result[palace] =
        QimenConst.DEITY_ORDER[i];
    }


    return result;
  }
};


// ============================================================
// 十三、旬空
// ============================================================

const OogoKongWang = {

  get(
    timeStem,
    timeBranch
  ) {

    const index =
      QimenUtil.findStemBranchIndex(
        timeStem,
        timeBranch
      );


    if (index < 0) {

      throw new Error(
        `无法确定旬空：${timeStem}${timeBranch}`
      );
    }


    const xunOffset =
      index % 10;


    const branchIndex =
      QimenUtil.branchIndex(
        timeBranch
      );


    const kong1 =
      QimenConst.BRANCHES[
        QimenUtil.mod(
          branchIndex + (10 - xunOffset),
          12
        )
      ];


    const kong2 =
      QimenConst.BRANCHES[
        QimenUtil.mod(
          branchIndex + (11 - xunOffset),
          12
        )
      ];


    return [
      kong1,
      kong2
    ];
  },


  branchToPalace(branch) {

    const map = {

      "子": 1,

      "丑": 8,
      "寅": 8,

      "卯": 3,

      "辰": 4,
      "巳": 4,

      "午": 9,

      "未": 2,
      "申": 2,

      "酉": 7,

      "戌": 6,
      "亥": 6
    };

    return map[branch] || 0;
  }
};


// ============================================================
// 十四、驿马
// ============================================================

const OogoYiMa = {

  getMaBranch(timeBranch) {

    if (
      ["申","子","辰"].includes(
        timeBranch
      )
    ) {

      return "寅";
    }


    if (
      ["亥","卯","未"].includes(
        timeBranch
      )
    ) {

      return "巳";
    }


    if (
      ["寅","午","戌"].includes(
        timeBranch
      )
    ) {

      return "申";
    }


    if (
      ["巳","酉","丑"].includes(
        timeBranch
      )
    ) {

      return "亥";
    }


    return "";
  },


  branchToPalace(branch) {

    return {

      "寅": 8,
      "巳": 4,
      "申": 2,
      "亥": 6

    }[branch] || 0;
  },


  calculate(timeBranch) {

    const branch =
      this.getMaBranch(
        timeBranch
      );

    return {

      branch,

      palace:
        this.branchToPalace(
          branch
        )
    };
  }
};


// ============================================================
// 十五、伏吟 / 反吟
// ============================================================

const OogoFuFan = {

  starBase: {
    1: "天蓬",
    2: "天芮",
    3: "天冲",
    4: "天辅",
    6: "天心",
    7: "天柱",
    8: "天任",
    9: "天英"
  },


  gateBase: {
    1: "休门",
    2: "死门",
    3: "伤门",
    4: "杜门",
    6: "开门",
    7: "惊门",
    8: "生门",
    9: "景门"
  },


  opposite: {
    1: 9,
    9: 1,

    2: 8,
    8: 2,

    3: 7,
    7: 3,

    4: 6,
    6: 4
  },


  analyze(palaces) {

    let starFu = true;
    let gateFu = true;

    let starFan = true;
    let gateFan = true;


    for (const p of palaces) {

      if (p.position === 5) {
        continue;
      }


      const star =
        Array.isArray(p.star)
          ? p.star[0]
          : p.star;


      const gate =
        p.gate || "";


      if (
        star !==
        this.starBase[p.position]
      ) {

        starFu = false;
      }


      if (
        gate &&
        gate !==
        this.gateBase[p.position]
      ) {

        gateFu = false;
      }


      const opposite =
        this.opposite[p.position];


      if (
        star !==
        this.starBase[opposite]
      ) {

        starFan = false;
      }


      if (
        gate &&
        gate !==
        this.gateBase[opposite]
      ) {

        gateFan = false;
      }
    }


    let text = "";


    if (
      starFu &&
      gateFu
    ) {

      text = "星门俱伏";

    } else if (
      starFan &&
      gateFan
    ) {

      text = "星门俱反";

    } else if (starFu) {

      text = "星伏";

    } else if (starFan) {

      text = "星反";

    } else if (gateFu) {

      text = "门伏";

    } else if (gateFan) {

      text = "门反";
    }


    return {

      starFu,
      gateFu,
      starFan,
      gateFan,

      text
    };
  }
};


// ============================================================
// 十六、特殊标签
// ============================================================

const OogoTagEnhancer = {

  enhance(chart) {

    const timeStem =
      chart.fourPillars.hour.stem;

    const timeBranch =
      chart.fourPillars.hour.branch;


    // --------------------------------------------------------
    // 旬空
    // --------------------------------------------------------

    const kong =
      OogoKongWang.get(
        timeStem,
        timeBranch
      );


    const kongPalaces =
      kong
        .map(
          b =>
            OogoKongWang.branchToPalace(b)
        )
        .filter(Boolean);


    // --------------------------------------------------------
    // 驿马
    // --------------------------------------------------------

    const ma =
      OogoYiMa.calculate(
        timeBranch
      );


    // --------------------------------------------------------
    // 每宫重新计算标签
    // --------------------------------------------------------

    chart.palaces.forEach(
      p => {

        const hStem =
          Array.isArray(
            p.heavenlyStem
          )
            ? p.heavenlyStem[0]
            : p.heavenlyStem;


        p.uiTagKong =
          kongPalaces.includes(
            p.position
          );


        p.uiTagMa =
          p.position === ma.palace;


        p.uiTagJx =
          QimenUtil.isJiXing(
            hStem,
            p.position
          );


        p.uiTagPo =
          QimenUtil.isMenPo(
            p.gate,
            p.position
          );


        p.uiTagMu =
          QimenUtil.isTianGanMu(
            hStem,
            p.position
          );


        p.liuYiJiXing = {

          hasJiXing:
            p.uiTagJx
        };


        p.gatePressure = {

          hasPressure:
            p.uiTagPo,

          text:
            p.uiTagPo
              ? "门迫"
              : ""
        };


        p.tombInfo = {

          heavenlyStemInTomb:
            p.uiTagMu
              ? [hStem]
              : [],

          earthlyStemInTomb: []
        };
      }
    );


    chart.kongWang = {

      branches: kong,

      palaces:
        kongPalaces
    };


    chart.yiMa = ma;


    chart.uiTagFuYinFanYin =
      OogoFuFan.analyze(
        chart.palaces
      );


    return chart;
  }
};


// ============================================================
// 十七、传统转盘主引擎
// ============================================================

const OogoZhuanPan = {

  calculate(
    year,
    month,
    day,
    hour,
    min,
    sec = 0,
    method = "zhirun"
  ) {

    // --------------------------------------------------------
    // 1. 定局
    // --------------------------------------------------------

    let juInfo;


    if (
      method === "chaibu"
    ) {

      juInfo =
        OogoChaiBu.calculate(
          year,
          month,
          day,
          hour,
          min,
          sec
        );

    } else {

      juInfo =
        OogoZhiRun.calculate(
          year,
          month,
          day,
          hour,
          min,
          sec
        );
    }


    const chart =
      juInfo.chart;


    const juNumber =
      juInfo.juNumber;


    const isYang =
      juInfo.isYangdun;


    // --------------------------------------------------------
    // 2. 时干、时支
    // --------------------------------------------------------

    const timeStem =
      chart.fourPillars.hour.stem;

    const timeBranch =
      chart.fourPillars.hour.branch;


    // --------------------------------------------------------
    // 3. 旬首
    // --------------------------------------------------------

    const xun =
      QimenUtil.getXunInfo(
        timeStem,
        timeBranch
      );


    // --------------------------------------------------------
    // 4. 地盘
    // --------------------------------------------------------

    const earthStems =
      OogoDiPan.build(
        juNumber,
        isYang
      );


    // --------------------------------------------------------
    // 5. 找旬首地盘宫
    // --------------------------------------------------------

    let xunPalace = null;


    for (
      const p of QimenConst.PALACES
    ) {

      if (
        earthStems[p] ===
        xun.stem
      ) {

        xunPalace = p;

        break;
      }
    }


    // 中五寄坤二
    if (
      xunPalace === 5
    ) {

      xunPalace = 2;
    }


    if (!xunPalace) {

      throw new Error(
        `找不到旬首地盘宫：${xun.stem}`
      );
    }


    // --------------------------------------------------------
    // 6. 天盘九星
    // --------------------------------------------------------

    const starInfo =
      OogoZhuanXing.build(
        earthStems,
        timeStem,
        xun.stem,
        xunPalace,
        isYang
      );


    // --------------------------------------------------------
    // 7. 值使
    // --------------------------------------------------------

    const gateInfo =
      OogoZhuanMen.build(
        xunPalace,
        xun.branch,
        timeBranch,
        isYang
      );


    // --------------------------------------------------------
    // 8. 天八神
    // --------------------------------------------------------

    const heavenDeities =
      OogoTianShen.build(
        starInfo.zhiFuPalace,
        isYang
      );


    // --------------------------------------------------------
    // 9. 地八神
    // --------------------------------------------------------

    const earthDeities =
      OogoDiShen.build(
        xunPalace,
        isYang
      );


    // --------------------------------------------------------
    // 10. 建立九宫
    // --------------------------------------------------------

    const palaces = [];


    for (
      const position of QimenConst.PALACES
    ) {

      const earthStem =
        earthStems[position] || "";


      const star =
        starInfo.stars[position] || "";


      const gate =
        gateInfo.gates[position] || "";


      const heavenDeity =
        heavenDeities[position] || "";


      const earthDeity =
        earthDeities[position] || "";


      palaces.push({

        position,

        earthStem,

        heavenlyStem: "",

        earthlyStem: earthStem,

        star,

        gate,

        deity:
          heavenDeity,

        heavenDeity,

        earthDeity,

        hiddenStem: "",

        isJiGong:
          position === 5
      });
    }


    // --------------------------------------------------------
    // 11. 天盘干
    //
    // 天盘干跟随原宫九星一起旋转。
    // --------------------------------------------------------

    const ring =
      QimenConst.BAGUA_RING;


    const effectiveTimeStem =
      timeStem === "甲"
        ? xun.stem
        : timeStem;


    let timeStemPalace = null;


    for (
      const p of QimenConst.PALACES
    ) {

      if (
        earthStems[p] ===
        effectiveTimeStem
      ) {

        timeStemPalace = p;
        break;
      }
    }


    if (
      !timeStemPalace
    ) {

      throw new Error(
        `无法找到时干宫：${effectiveTimeStem}`
      );
    }


    const xunRingIndex =
      ring.indexOf(
        xunPalace
      );


    const targetRingIndex =
      ring.indexOf(
        timeStemPalace
      );


    const starShift =
      QimenUtil.mod(
        targetRingIndex -
        xunRingIndex,
        8
      );


    // 原盘天盘干：
    // 原宫地盘干随星转
    const heavenStems = {};


    for (
      let i = 0;
      i < 8;
      i++
    ) {

      const sourcePalace =
        ring[
          QimenUtil.mod(
            xunRingIndex + i,
            8
          )
        ];


      const targetPalace =
        ring[
          QimenUtil.mod(
            xunRingIndex + i + starShift,
            8
          )
        ];


      heavenStems[targetPalace] =
        earthStems[sourcePalace];
    }


    // 中五寄坤二
    heavenStems[5] =
      heavenStems[2];


    // --------------------------------------------------------
    // 12. 写入天盘干
    // --------------------------------------------------------

    palaces.forEach(
      p => {

        p.heavenlyStem =
          heavenStems[p.position] || "";

      }
    );


    // --------------------------------------------------------
    // 13. 值符、值使
    // --------------------------------------------------------

    const zhiFu = {

      star:
        starInfo.zhiFuStar,

      position:
        starInfo.zhiFuPalace
    };


    const zhiShi = {

      gate:
        gateInfo.zhiShiGate,

      position:
        gateInfo.zhiShiPalace
    };


    // --------------------------------------------------------
    // 14. 主盘对象
    // --------------------------------------------------------

    const result = {

      method:
        juInfo.method,

      ju: {

        number:
          juNumber,

        type:
          isYang
            ? "阳遁"
            : "阴遁"
      },


      chart,


      fourPillars:
        chart.fourPillars,


      solarTerm: {

        name:
          juInfo.termName,

        date:
          juInfo.termDate
      },


      fuTou: {

        date:
          juInfo.fuTouDate,

        ganZhi:
          juInfo.fuTouGanZhi,

        yuan:
          juInfo.yuanName
      },


      zhiFu,

      zhiShi,


      xun: {

        name:
          xun.name,

        stem:
          xun.stem,

        branch:
          xun.branch,

        palace:
          xunPalace
      },


      palaces,

      debugInfo:
        juInfo.debugInfo
    };


    // --------------------------------------------------------
    // 15. 特殊标签
    // --------------------------------------------------------

    return OogoTagEnhancer.enhance(
      result
    );
  }
};


// ============================================================
// 十八、兼容旧 API：转盘增强器
// ============================================================

const OogoZhuanPanEnhancer = {

  enhance(
    chart,
    xunDun,
    isYang
  ) {

    if (!chart) {
      throw new Error(
        "OogoZhuanPanEnhancer：chart不能为空"
      );
    }


    const ring =
      QimenConst.BAGUA_RING;


    let earthXunPalace = 5;


    for (
      const p of chart.palaces
    ) {

      const stem =
        Array.isArray(
          p.earthlyStem
        )
          ? p.earthlyStem[0]
          : p.earthlyStem;


      if (
        stem === xunDun
      ) {

        earthXunPalace =
          p.position;

        break;
      }
    }


    if (
      earthXunPalace === 5
    ) {

      earthXunPalace = 2;
    }


    const earthDeities =
      OogoDiShen.build(
        earthXunPalace,
        isYang
      );


    chart.palaces.forEach(
      p => {

        p.earthDeity =
          earthDeities[p.position] ||
          "";
      }
    );


    return chart;
  }
};


// ============================================================
// 十九、飞盘模块
// ============================================================
//
// 注意：
// 本模块故意不参与 OogoZhuanPan。
// 飞盘与传统转盘属于不同排法体系。
// 以后如果需要测试飞盘，应单独调用 OogoFeiPan。
// ============================================================

const OogoFeiPan = {

  // 洛书飞宫顺序
  RING:
    [1,8,3,4,9,2,7,6],


  move(
    palace,
    steps,
    direction = 1
  ) {

    const ring =
      this.RING;

    const index =
      ring.indexOf(
        palace
      );

    if (index < 0) {
      return palace;
    }

    return ring[
      QimenUtil.mod(
        index +
        steps *
        direction,
        8
      )
    ];
  },


  // ----------------------------------------------------------
  // 说明：
  //
  // 原版本这里用：
  // palace + i
  //
  // 是错误的。
  //
  // 飞宫必须走洛书八宫环。
  //
  // 因此本模块不再复用原来的 1→2→3...
  // ----------------------------------------------------------

  disabledReason() {

    return (
      "飞盘已独立。传统转盘主引擎不会调用飞盘。" +
      "如需飞盘，应使用独立流派参数进行验证。"
    );
  }
};


// ============================================================
// 二十、统一入口
// ============================================================

const OogoQimen = {

  // ----------------------------------------------------------
  // 默认：
  // 传统转盘 + 置闰法
  // ----------------------------------------------------------

  calculate(
    year,
    month,
    day,
    hour,
    min,
    sec = 0
  ) {

    return OogoZhuanPan.calculate(
      year,
      month,
      day,
      hour,
      min,
      sec,
      "zhirun"
    );
  },


  // ----------------------------------------------------------
  // 拆补法
  // ----------------------------------------------------------

  calculateChaiBu(
    year,
    month,
    day,
    hour,
    min,
    sec = 0
  ) {

    return OogoZhuanPan.calculate(
      year,
      month,
      day,
      hour,
      min,
      sec,
      "chaibu"
    );
  },


  // ----------------------------------------------------------
  // 直接调用置闰定局
  // ----------------------------------------------------------

  calculateZhiRun(
    year,
    month,
    day,
    hour,
    min,
    sec = 0
  ) {

    return OogoZhiRun.calculate(
      year,
      month,
      day,
      hour,
      min,
      sec
    );
  }
};


// ============================================================
// 二十一、导出
// ============================================================

if (
  typeof module !== "undefined" &&
  module.exports
) {

  module.exports = {

    QimenConst,

    QimenUtil,

    CalendarAdapter,

    QimenFuTou,

    QimenSolarTerm,

    OogoZhiRun,

    OogoChaiBu,

    OogoDiPan,

    OogoZhuanXing,

    OogoZhuanMen,

    OogoTianShen,

    OogoDiShen,

    OogoKongWang,

    OogoYiMa,

    OogoFuFan,

    OogoTagEnhancer,

    OogoZhuanPan,

    OogoZhuanPanEnhancer,

    OogoFeiPan,

    OogoQimen
  };
}


// 浏览器全局
if (
  typeof window !== "undefined"
) {

  window.OogoQimen = OogoQimen;

  window.OogoZhiRun =
    OogoZhiRun;

  window.OogoChaiBu =
    OogoChaiBu;

  window.OogoZhuanPan =
    OogoZhuanPan;

  window.OogoFeiPan =
    OogoFeiPan;
}
