/* 工数・QCD診断シート　係数（ここだけ直せば、計算とグラフが変わります）
   各数字の根拠は _docs/shindan/係数メモ.md にあります。数字を変えたら、メモも合わせて直してください。
   「仮置き」と書いた数字は、根拠となる実測や統計がまだない、暫定の数字です。 */
window.SHINDAN_COEF = {
  version: '1.0',

  /* ---- 共通 ---- */
  RATE_YEN_PER_HOUR: 2300,      /* 人件費に直すときの1時間あたりの金額（円）。厚生労働省の賃金統計の機械・電気技術者の平均（社会保険料は含めない） */
  HOURS_PER_DAY: 8,             /* 1日の勤務時間 */
  HOURS_PER_PERSON_MONTH: 160,  /* 1人の1か月の勤務時間（年1,920時間÷12） */
  SPILL_PER_PERSON: 0.1,        /* 関わる人1人あたり、あなたの時間の何割ぶん、周りの人の時間も使うか（仮置き） */
  SPILL_CAP: 2,                 /* 周りの人の時間は、あなたの時間の何倍までとするか（仮置き） */

  /* ---- 仕事の種類ごとの係数 ----
     cut       ：仕事にかかる時間（工数）が減る割合
     rework    ：その仕事の時間のうち、ミス・やり直しに使っている割合（仮置き）
     reworkCut ：ミス・やり直しが減る割合
     lead      ：完了までの日数（納期）が短くなる割合 */
  tasks: [
    { id: 'teach',   label: '後輩に教える',       cut: 0.50, rework: 0.15, reworkCut: 0.50, lead: 0.10 },
    { id: 'trouble', label: 'トラブル対応',       cut: 0.40, rework: 0.25, reworkCut: 0.40, lead: 0.30 },
    { id: 'doc',     label: '資料や手順書づくり', cut: 0.50, rework: 0.20, reworkCut: 0.50, lead: 0.30 },
    { id: 'faq',     label: '同じ質問への回答',   cut: 0.50, rework: 0.10, reworkCut: 0.50, lead: 0.40 },
    { id: 'other',   label: 'その他',             cut: 0.30, rework: 0.10, reworkCut: 0.30, lead: 0.15 }
  ],

  /* ---- 業種ごとの係数　q：ミス・やり直しの割合にかける倍率（仮置き） ---- */
  industries: [
    { id: 'semi',  label: '半導体',   q: 1.2 },
    { id: 'plant', label: 'プラント', q: 1.1 },
    { id: 'panel', label: '制御盤',   q: 1.0 },
    { id: 'mold',  label: '金型加工', q: 1.1 },
    { id: 'elec',  label: '電気工事', q: 0.9 },
    { id: 'other', label: 'その他',   q: 1.0 }
  ],

  /* ---- 立場（結果の見出しに出す。計算には使わない） ---- */
  roles: [
    { id: 'owner',   label: '経営者' },
    { id: 'manager', label: '管理職' },
    { id: 'edu',     label: '教育担当' },
    { id: 'eng',     label: '技術者' }
  ],

  /* ---- 選択式の答え → 計算に使う数字（範囲の真ん中） ---- */
  hours: [
    { label: '10時間未満',     value: 5 },
    { label: '10〜20時間',     value: 15 },
    { label: '20〜40時間',     value: 30 },
    { label: '40〜60時間',     value: 50 },
    { label: '60〜100時間',    value: 80 },
    { label: '100時間以上',    value: 120 }
  ],
  people: [
    { label: '自分だけ',   value: 0 },
    { label: '1〜2人',     value: 1.5 },
    { label: '3〜5人',     value: 4 },
    { label: '6〜10人',    value: 8 },
    { label: '11〜20人',   value: 15 },
    { label: '21人以上',   value: 30 }
  ],

  /* ---- 個別面談の申し込みページ ---- */
  BOOKING_URL: 'https://utage-system.com/p/vv8MGVy8ReZr'
};
