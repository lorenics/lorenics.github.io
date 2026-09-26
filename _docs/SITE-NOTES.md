# サイト運用メモ(ロアニクス株式会社 公式サイト)

`_` で始まるフォルダは GitHub Pages(Jekyll)で公開されません。このファイルは社内用です。

## ファイルの役割

| ファイル | 中身 | 形式 |
|---|---|---|
| `index.html` | トップ | Claude Design の書き出し形式。`support.js` が表示時に unpkg から React を読み込んで組み立てる |
| `message.html` | 代表メッセージ | 同上 |
| `ai.html` | AI業務改善(工務店・電気工事・設備会社向け) | 普通のHTML。`css/sub.css` と `js/sub.js` を使用 |
| `contact.html` | お問い合わせフォーム | 普通のHTML |
| `thanks.html` | 送信完了(検索除外 noindex) | 普通のHTML |
| `privacy.html` | プライバシーポリシー | 普通のHTML |
| `company.html` | 会社案内 | 普通のHTML |
| `css/sub.css` / `js/sub.js` | 下層ページ共通のデザインと動き | |
| `images/ogp.png` / `images/ogp-ai.png` | SNSで共有されたときの画像(1200×630) | 元データは `_docs/ogp/*.html.tmpl` |

**注意:** `index.html` と `message.html` を Claude Design で作り直して書き出すと、今回の変更(フォーム導線・事業内容の並び・AIページへのリンク)が上書きされます。今後はこのリポジトリ側を正本にしてください。

## お問い合わせフォーム(Web3Forms)

- 送信先サービス: Web3Forms(無料プランは月250件、通知先メール1件)
- `contact.html` の `access_key` が `YOUR_ACCESS_KEY_HERE` のままの間は、送信ボタンを押すとメールソフトが開く「代替動作」になります
- キーを取得したら、`contact.html` の次の1行を書き換えるだけで本番送信に切り替わります
  `<input type="hidden" name="access_key" value="YOUR_ACCESS_KEY_HERE">`
- 通知先メールアドレスを変える場合は、Web3Forms 側で新しいキーを発行して差し替え
- 公開後は必ず1通テスト送信し、完了ページ(thanks.html)が出ること・メールが届くことを確認

## 独自ドメインに切り替えるとき

`https://lorenics.github.io/` と書かれた箇所をすべて新ドメインに置き換える。

- 全HTMLの `canonical` / `og:url` / `og:image`、JSON-LD の `url` / `item`
- `sitemap.xml` / `robots.txt`
- `contact.html` の `redirect`(送信完了後の移動先)
- GitHub の Settings → Pages → Custom domain を設定(`CNAME` ファイルは GitHub が作成)

## SNS共有画像を作り直すとき

`_docs/ogp/ogp.html.tmpl` を `.html` にしてブラウザで開き、1200×630 で画面を保存 → `images/` に上書き。

## 更新履歴

- 2026-09-27: フォーム・送信完了・プライバシーポリシー・AI業務改善ページを追加。事業内容を主力3つ+そのほか6つに整理。会社案内に法人番号と連絡先を追加。ファビコンとSNS共有画像を追加
