# サイト運用メモ(ロアニクス株式会社 公式サイト)

`_` で始まるフォルダは GitHub Pages(Jekyll)で公開されません。このファイルは社内用です。

## ファイルの役割

| ファイル | 中身 | 形式 |
|---|---|---|
| `index.html` | トップ | 通常HTML。`css/sub.css`＋`css/home.css`、`js/sub.js`を使用。図は`images/home/` |
| `message.html` | 代表メッセージ | Claude Design書き出し形式。`support.js`がReactを読み込んで表示 |
| `ai.html` | 技術教育の仕組みづくり（製造業の設備・保全・技術部門向け） | 普通のHTML。`css/sub.css` と `js/sub.js` を使用。図は `images/edu/` |
| `contact.html` | お問い合わせフォーム | 普通のHTML |
| `thanks.html` | 送信完了(検索除外 noindex) | 普通のHTML |
| `privacy.html` | プライバシーポリシー | 普通のHTML |
| `company.html` | 会社案内 | 普通のHTML |
| `css/sub.css` / `js/sub.js` | 下層ページ共通のデザインと動き | |
| `images/ogp.png` / `images/ogp-ai.png` | SNSで共有されたときの画像(1200×630) | 元データは `_docs/ogp/*.html.tmpl` |

**注意:** `index.html` と `message.html` を Claude Design で作り直して書き出すと、今回の変更(フォーム導線・事業内容の並び・AIページへのリンク)が上書きされます。今後はこのリポジトリ側を正本にしてください。

## お問い合わせフォーム(Web3Forms)

- 送信先サービス: Web3Forms(無料プランは月250件、通知先メール1件)
- 2026-09-27 にキー設定済み(Web3Forms のフォーム名「ロアニクス お問い合わせ」、アカウント lorenics@outlook.jp)
- キーは `contact.html` の `<input type="hidden" name="access_key" ...>` の1行。値を `YOUR_ACCESS_KEY_HERE` に戻すと、送信ボタンでメールソフトが開く代替動作になる
- Web3Forms 側の Website URL は `lorenics.com/contact.html`（2026-10-08 更新済み）
- 通知先メールアドレスを変える場合は、Web3Forms 側で新しいキーを発行して差し替え
- 公開後は必ず1通テスト送信し、完了ページ(thanks.html)が出ること・メールが届くことを確認

## 独自ドメイン（2026-10-05 切り替え済み）

- ドメイン: `lorenics.com`（XServerドメインで取得。アカウントのメールは lorenics@outlook.jp、2027-10-05 自動更新）
- DNS: A 185.199.108.153 / 109 / 110 / 111、www は CNAME lorenics.github.io。ネームサーバーは ns1〜3.xdomain.ne.jp
- リポジトリ直下の `CNAME` ファイル（中身 `lorenics.com`）を消さない。消すと独自ドメインが外れる

切り替えのときに行ったこと（再び移すときの手順）:

`https://lorenics.github.io/` と書かれた箇所をすべて新ドメインに置き換える。

- 全HTMLの `canonical` / `og:url` / `og:image`、JSON-LD の `url` / `item`
- `sitemap.xml` / `robots.txt`
- `contact.html` の `redirect`(送信完了後の移動先)
- GitHub の Settings → Pages → Custom domain を設定(`CNAME` ファイルは GitHub が作成)

## SNS共有画像を作り直すとき

`_docs/ogp/ogp.html.tmpl` を `.html` にしてブラウザで開き、1200×630 で画面を保存 → `images/` に上書き。

## 更新履歴

- 2026-10-10: ブランチ b2b-funnel-phase1 で法人向け導線の第1段を作成（技術伝承の無料診断、plc.html／advisor.html／faq.html、ヘッダー6項目＋2ボタン）。未公開・本人確認待ち。公式LINEのURLは js/sub.js の LINE_URL に入れると全ページのLINEボタンが出る。トップ構成の再設計を本人と相談中

- 2026-10-08: トップを通常HTMLへ再制作、代表メッセージの実績・経歴を指定文言へ修正。本人確認待ち・未公開。検証記録は `home-review-20261008.md`

- 2026-10-07: 技術教育の仕組みづくりLPの公開を本人が承認。ベテランの制御プログラミングの知識を新人へ受け継ぐトップ画（第4版）を採用。検証記録は `edu-review-20261006.md`

- 2026-10-06: 技術教育の仕組みづくりLPのローカル確認版を作成。PC/スマホと問い合わせ種類の選択を検証。本人確認待ちで未公開。検証記録は `edu-review-20261006.md`

- 2026-10-05: 独自ドメイン lorenics.com に切り替え
- 2026-09-27: Web3Forms のキーを設定し、フォームを本番送信に切り替え
- 2026-09-27: フォーム・送信完了・プライバシーポリシー・AI業務改善ページを追加。事業内容を主力3つ+そのほか6つに整理。会社案内に法人番号と連絡先を追加。ファビコンとSNS共有画像を追加

## 2026-10-11 AI活用マップ（b2b-funnel-phase1・未公開）
- ai-map.html：製品ができるまでのスイムレーン図。箱・工程名を押すと右パネル（スマホは下から）にAI活用と人に残す判断を表示
- パネル内フォーム（名前・会社名・メール・検討状況）→ Web3Forms 送信成功で downloads/ai-usecase-{工程}.pdf をダウンロード
- 件名は「【ロアニクスWeb】資料請求：{工程}編」。押した箇所も通知に入る
- PDFは静的ファイルなので、URLを知っていればフォームなしでも開ける
- css/ai-map.css, js/ai-map.js。トップの #flows 下とフッターMENUからリンク

## 2026-10-11 ライブデモ（b2b-funnel-phase1・未公開）
- demo.html：3Dシミュレータ（押すとiframeで本物を読み込む。plc-mech3d.vercel.app は埋め込み可）とラダーカルテ（plc-knowledge-app.vercel.app。CSPのframe-ancestorsがUTAGEと自分だけなので埋め込めず、新しいタブで開く）
- ラダーカルテの図は〔体験用CSVで試す〕の結果（人身2・設備破損0・品質2・読みやすさ6、10件中新人7件）を写したもの。アプリ側の結果が変わったら合わせて直す
- 会員サイト・ポケットシミュレータはURL待ち。フッターMENUに「AI活用マップ」「ライブデモ」を追加
- AutoCompilerという名前はもう使わない（今はラダーカルテ）

## 2026-10-11 トップをコンセプト「遡る・渡す・回す」に改定（b2b-funnel-phase1・未公開）
- 主語を「作る」から「遡る」へ。FV副文、数字の帯（JILPT 2026-05 調査：91.1／33.3／31.2／54.8）、課題の書き換え、問い、3段の流れ＋2つの約束、目利き3段、届くものの見本（技術の系譜の目次・過去トラ1ページの例）、選ばれる理由4つを差し替え
- AI活用マップとライブデモはトップの「工程ごとの置き換え例」の下のテキストリンクに格下げ
- 「技術の系譜」は仮の名前。見本の目次と過去トラの例は構成を示す作例（実物ではない）
