/* 製造業 工数・QCD診断　係数 v2（20問版）
   ここだけ直せば、計算とグラフが変わります。各数字の根拠は _docs/shindan/係数メモ.md にあります。
   「仮置き」と書いた数字は、根拠となる実測や統計がまだない暫定の数字です。 */
window.SHINDAN_COEF = {
  version: '2.0',

  /* ---- 共通 ---- */
  RATE_YEN_PER_HOUR: 2300,      /* 人件費に直すときの1時間あたりの金額（円）。厚生労働省の賃金統計の機械・電気技術者の平均（社会保険料は含めない） */
  HOURS_PER_DAY: 8,             /* 1日の勤務時間 */
  HOURS_PER_PERSON_MONTH: 160,  /* 1人の1か月の勤務時間（年1,920時間÷12） */
  WEEKS_PER_MONTH: 4.33,        /* 1か月の週数 */
  MONTHS_CAP: 12,               /* 1年の計算で、独り立ちまでの期間が1年を超えるぶんは数えない */

  /* ---- 減る割合の土台（仮置き。v1の cut を引き継ぎ） ---- */
  CUT: {
    teach: 0.50,    /* 教える時間：教材・課題・答え合わせに置き換わる分 */
    faq: 0.50,      /* 同じ質問への回答：教材と質問の記録で減る分 */
    doc: 0.50,      /* 資料・手順書づくり：AIの下書きで減る分（AIが使えない会社は下の AI_FACTOR で小さくなる） */
    trouble: 0.40,  /* トラブル対応：ベテランにしか対応できない分が、次の人に移る分 */
    rework: 0.50,   /* ミス・やり直し：基準と確認表で減る分 */
    lead: 0.25      /* 独り立ちまでの期間が短くなる割合（v1は1割。練習と答え合わせを入れた講座の実感から2.5割に置く・仮置き） */
  },

  /* ---- 今の教え方による伸びしろ（1.0＝土台の割合がそのまま。すでに仕組みがあるほど小さい・仮置き） ---- */
  EDU_FACTOR: [1.0, 0.9, 0.8, 0.6],
  /* ---- 社内で使えるAIによる、AIが関わる削減の倍率（禁止／許可されたものだけ／自由／分からない・仮置き） ---- */
  AI_FACTOR: [0.6, 0.85, 1.0, 0.8],
  /* ---- 判断の記録の残り方（残っていない／紙／フォルダ／検索できる）。退職リスクの重みに使う ---- */
  RECORD_RISK: [1.0, 0.8, 0.6, 0.3],

  /* ---- 業種ごとの係数　q：ミス・やり直しの時間にかける倍率（品質の要求が高い業種ほど大きい・仮置き） ---- */
  industries: [
    { id: 'auto',      label: '自動車・車載部品',                 q: 1.1 },
    { id: 'battery',   label: '電池・EV関連',                     q: 1.2 },
    { id: 'semi',      label: '半導体・電子部品',                 q: 1.2 },
    { id: 'elecdev',   label: '電機・精密機器（家電・カメラ・センサー）', q: 1.0 },
    { id: 'machine',   label: '産業機械・工作機械',               q: 1.0 },
    { id: 'equip',     label: '設備・装置メーカー（SIer・自動機）', q: 1.0 },
    { id: 'panel',     label: '制御盤',                           q: 1.0 },
    { id: 'elec',      label: '電気工事・設備工事',               q: 0.9 },
    { id: 'plant',     label: 'プラント（化学・素材・エネルギー）', q: 1.1 },
    { id: 'metal',     label: '金属加工・金型・鋳造',             q: 1.1 },
    { id: 'plastic',   label: '樹脂・ゴム・フィルム',             q: 1.0 },
    { id: 'food',      label: '食品・飲料・医薬・化粧品',         q: 1.0 },
    { id: 'medical',   label: '医療機器',                         q: 1.2 },
    { id: 'other',     label: 'その他',                           q: 1.0 }
  ],

  /* ---- 立場（結果の見出しと、活用法の案内に使う） ---- */
  roles: [
    { id: 'owner',   label: '経営者・役員' },
    { id: 'manager', label: '管理職' },
    { id: 'edu',     label: '教育担当・先輩' },
    { id: 'eng',     label: '技術者' }
  ],

  /* ---- 選択式の答え → 計算に使う数字（範囲の真ん中） ---- */
  engineers:   [{ label: '5人以下', value: 3 }, { label: '6〜20人', value: 12 }, { label: '21〜50人', value: 35 }, { label: '51〜200人', value: 120 }, { label: '201人以上', value: 300 }],
  newcomers:   [{ label: '0人', value: 0 }, { label: '1〜2人', value: 1.5 }, { label: '3〜5人', value: 4 }, { label: '6〜10人', value: 8 }, { label: '11人以上', value: 15 }],
  monthsSolo:  [{ label: '1か月くらい', value: 1 }, { label: '3か月くらい', value: 3 }, { label: '半年くらい', value: 6 }, { label: '1年くらい', value: 12 }, { label: '2年以上', value: 24 }],
  teachWeek:   [{ label: '1時間未満', value: 0.5 }, { label: '1〜3時間', value: 2 }, { label: '3〜5時間', value: 4 }, { label: '5〜10時間', value: 7.5 }, { label: '10時間以上', value: 12 }],
  faqWeek:     [{ label: 'ほとんどない', value: 0.3 }, { label: '1〜2時間', value: 1.5 }, { label: '3〜5時間', value: 4 }, { label: '6〜10時間', value: 8 }, { label: '10時間以上', value: 12 }],
  docMonth:    [{ label: 'ほとんどない', value: 0.5 }, { label: '1〜5時間', value: 3 }, { label: '6〜10時間', value: 8 }, { label: '11〜20時間', value: 15 }, { label: '21時間以上', value: 30 }],
  troubleMonth:[{ label: 'ほとんどない', value: 0.5 }, { label: '1〜5時間', value: 3 }, { label: '6〜10時間', value: 8 }, { label: '11〜20時間', value: 15 }, { label: '21〜40時間', value: 30 }, { label: '41時間以上', value: 50 }],
  vetShare:    [{ label: 'ほとんどない', value: 0.1 }, { label: '3割くらい', value: 0.3 }, { label: '半分くらい', value: 0.5 }, { label: '7割くらい', value: 0.7 }, { label: 'ほぼ全部', value: 0.9 }],
  reworkFreq:  [{ label: 'ほとんどない', value: 0.2 }, { label: '月1回くらい', value: 1 }, { label: '月2〜3回', value: 2.5 }, { label: '週1回くらい', value: 4.3 }, { label: '週2回以上', value: 8.6 }],
  reworkHours: [{ label: '1時間未満', value: 0.5 }, { label: '1〜3時間', value: 2 }, { label: '半日', value: 4 }, { label: '1日', value: 8 }, { label: '2日以上', value: 16 }],
  retire:      [{ label: '0人', value: 0 }, { label: '1人', value: 1 }, { label: '2〜3人', value: 2.5 }, { label: '4〜5人', value: 4.5 }, { label: '6人以上', value: 8 }],
  eduNow:      [{ label: '先輩が口頭で教えている' }, { label: '紙の手順書がある' }, { label: '動画や資料がある' }, { label: '会員サイトやeラーニングがある' }],
  recordNow:   [{ label: '残っていない（頭の中）' }, { label: '日報や紙には残っている' }, { label: 'フォルダにあるが、探しにくい' }, { label: '検索して使える' }],
  aiNow:       [{ label: '社内で禁止' }, { label: '会社が許可したものだけ' }, { label: '自由に使える' }, { label: '分からない' }],
  freedUse:    [{ label: '開発・改善', text: '開発・改善' }, { label: '品質向上', text: '品質向上' }, { label: '営業・集客', text: '営業・集客' }, { label: '残業を減らす', text: '残業を減らすこと' }, { label: 'まだ決めていない', text: '' }],
  budget:      [{ label: '50万円未満', value: 30 }, { label: '50〜100万円', value: 75 }, { label: '100〜300万円', value: 200 }, { label: '300〜500万円', value: 400 }, { label: '500万円以上', value: 700 }, { label: '未定', value: null }],
  timing:      [{ label: 'すぐにでも' }, { label: '3か月以内' }, { label: '半年以内' }, { label: '1年以内' }, { label: '未定' }],
  decider:     [{ label: '自分で決められる' }, { label: '上司の承認が要る' }, { label: '役員会・社長の承認が要る' }, { label: '分からない' }],

  /* ---- 個別面談の申し込みページ ---- */
  BOOKING_URL: 'https://utage-system.com/p/vv8MGVy8ReZr'
};
