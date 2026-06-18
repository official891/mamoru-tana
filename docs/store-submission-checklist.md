# まもる棚 ストア提出チェックリスト

## 現在ローカルで完了

- Expo SDK 56系へ更新済み
- `npm run release:check:node20` 通過済み
- Androidの不要権限なし
- EAS本番ビルド用 `eas.json` 追加済み
- 未接続のPlus/Familyを有効化できないよう制限済み
- 端末内保存データの正規化と入力上限チェック済み
- 防災キット不足チェックとすぐ追加テンプレートは端末内処理のみ
- プライバシーポリシーと利用規約の原稿追加済み
- GitHub Pages公開用の `privacy.html`、`terms.html`、`support.html` 追加済み

## ストア公開前に必須

- Apple Developer Programへ登録
- Google Play Consoleへ登録
- `npx eas-cli@latest init` を実行し、EAS project IDを紐付ける
- `eas build --platform ios --profile production` を成功させる
- `eas build --platform android --profile production` を成功させる
- TestFlightで実機テストする
- Google Play内部テストで実機テストする
- プライバシーポリシーURL、サポートURL、利用規約URLを公開する
- GitHub Pagesを有効化し、公開URLをストア設定に入力する
- App Store / Google Play用スクリーンショットを作成する
- App StoreのApp Privacyを実装内容と一致させる
- Google PlayのData safetyを実装内容と一致させる
- コンテンツレーティングを正確に回答する
- 初回リリース版をGitコミットで固定する

## サブスク公開前に必須

- App Store Connectで自動更新サブスクリプション商品を作成する
- Google Play Consoleでサブスクリプション商品を作成する
- `mamoru_tana_plus_monthly` と `mamoru_tana_family_monthly` の商品IDをストア側と一致させる
- RevenueCatまたは`expo-iap`などのIAPライブラリを開発ビルドで接続する
- 購入、復元、期限切れ、キャンセル、返金、ファミリー非対応時の表示をテストする
- 審査メモに有料機能の確認手順を書く

## 初回公開の推奨

初回はFree版として公開し、実ユーザーの継続率、登録数、期限切れ防止の利用状況を見てから、Plus/Familyを接続するのが安全です。
