# トップページ確認版 2026-10-08

状態：ローカル制作・検証済み／本人確認待ち。commit・push・公開後の確認は未実行。
基点：main 2e57d34ea93bf0498d554e4a3e6daa9d49f8f7d4。編集前git pull --ff-onlyはAlready up to date。

## 変更
- index.htmlを通常HTMLに変更。承認済ai.htmlと共通の書体・ヘッダー・ボタンを使用。専用css/home.cssに限定。
- 新しい主役図と3事業の画像を内蔵imagegenで生成。画像は説明用で実際の顧客事例写真ではない。日本語説明はHTML。
- images/home/hero.webp（1536×1024、150564 bytes）、services.webp（1536×1024、169026 bytes）。技術教育欄は承認済hero-v4.webpを参照。
- PLC教育・研修 → FA制御技術顧問 → 技術教育の仕組みづくり → シミュレータ開発／各種アプリ作成／PR／広告代理案件／取材のご依頼／SNS代行の順番を保持。
- 指定の実績・経歴を両ページに反映。代表紹介はai.html担当者欄の文言を使用。message.htmlは従来の構成・support.js方式を保持し、指定文言と受入条件に必要な文字色・最小サイズ・問い合わせ種類のみ補正。
- JSON-LDの会社情報、OGP、canonical、Googleサイト認証、各ページリンクを保持。CNAME・フォーム・共通CSS/JS・ai.htmlは変更なし。

## 検証
Windows / Chrome / Playwright / localhost:8772。
- 両ページの1280px・375px：横スクロール、はみ出し、欠落画像、13px未満、文字コントラスト4.5:1未満、JSエラーはいずれも0。
- 4章の禁止語0件、旧実績表現0件、見出し句読点0件。金額・効果保証・不安をあおる表現なし。
- 全27リンク実押し。内部ページ到達とアンカーを確認。一般相談はother、PLC教育はplc、技術顧問はadvisorの初期選択を確認。メールはクリックイベントとmailto宛先を検査し、送信なし。
- JSON-LD解析成功、canonicalはhttps://lorenics.com/とhttps://lorenics.com/message.html。git diff --check成功。
- 全体と各セクションを目視。承認済LPの画像と冒頭スクリーンショットも照合。図の説明ラベルはHTMLで、誤字・重なりなし。品質の本人採用判断は未了。
- スマホの手順矢印と代表紹介の余白を最終修正し、影響するトップの2幅表示を再検査。リンクは変更なし。

## 確認画像
Desktop/確認用/ロアニクスHP_トップ/
- codex_01.png：トップPC全体（1280×5145）
- codex_02.png：トップスマホ全体（375×6785）
- codex_03.png：トップPC冒頭
- codex_04.png：トップスマホ冒頭
- codex_05.png：代表メッセージPC全体
- codex_06.png：代表メッセージスマホ全体
- codex_07.png：事業紹介PC
- codex_08.png：事業紹介スマホ
部分画像だけ撮影時に固定ヘッダーを非表示。全体画像と冒頭画像は通常表示。

## 証拠と再開
ワークスペース .codex_tmp/20261008-lorenics-home/qa/report.json（27リンク・両ページ検査）、final-layout.json（最終トップ表示）、hashes.json（最終ファイル識別）。バックアップ・一時画像はこのPCのみ。
生成プロンプト：docs/agent/tasks/20261008-lorenics-home/image-prompts.json。内蔵ツールはモデル指定・版確認欄を提供しないため、特定のImageモデル版は未確認。
本人OK後に対象版・git status・検査証拠を照合し、今回の変更ファイルだけcommit/pushする。既存の未追跡images/edu画像7枚は含めない。
