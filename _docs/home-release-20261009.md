# トップ改修 公開対象 2026-10-09

本人が確認画像codex_27〜32の提示後に「OKです」と承認。mainへのcommit/pushと公開確認を実施する。

主目的は製造業の教育システム導入相談。暗黙知の形式知化、社名Loreの想い、技術者指導500名以上・パナソニック生産設備開発17年・主任職経験・技能五輪出場、職種/業種24項目を掲載。教育システム紹介を事業一覧の前へ配置し、事業カードの順は保持。主要4相談ボタンはtype=edu。

公開ソース：index.html、css/home.css、css/home-people.css、js/home-people.js、contact.html、js/sub.js。
message.htmlと生成画像は基点dfc176eに含まれ、今回追加差分なし。既存未追跡images/eduの7画像は対象外。

検証証拠（ローカル作業領域）：
- .codex_tmp/20261009-lorenics-conversion/report.json：最終版1280/375px、文字13px以上、コントラスト4.5以上、横はみ出し・欠落画像0、関連7リンク、主要4導線の教育システム種類自動選択、禁止語0、JSON-LD解析。
- .codex_tmp/20261009-lorenics-contact-labels/report.json：5種類のURL自動選択・手動選択・送信対象値。
- .codex_tmp/20261008-lorenics-home/marquee-v2/qa/report.json：両方向移動、停止・再開、動きを減らす設定、24項目一覧、JS無効。
- 最終画像の目視、git diff --check。フォームの実送信は行わない（表示文言と選択マッピングのみの変更）。

公開先：https://lorenics.com/ 。復旧はこの公開コミットだけをrevertする新規コミットで行い、履歴を破壊しない。実行結果と公開版ハッシュはローカル状態ファイルに記録する。
