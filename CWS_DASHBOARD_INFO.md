# Chrome Web Store Developer Dashboard Info

ダッシュボードへの提出時に参照するための情報をまとめたファイルです。

---

## 1. ストアリスト情報

### 拡張機能名
```
HandsFree for YouTube
```

### 短い説明（132文字以内）
```
YouTubeの動画をハンズフリーで操作。音声コマンドで再生・停止・速度変更・スキップ。マイクボタンひとつで、画面に触れずに動画をコントロールできます。
```

### 詳細説明
```
HandsFree for YouTube は、音声コマンドだけで YouTube 動画を操作できる Chrome 拡張機能です。
料理中、楽器の練習中、ワークアウト中など、手が使えない状況でも快適に動画を視聴できます。

【機能一覧】
・再生 / 停止（「再生」「ストップ」など）
・再生速度変更（「2倍速」「1.5倍速」など、0.1〜10.0倍に対応）
・速度リセット（「解除」）
・時間スキップ（「30秒スキップ」「5分スキップ」など）
・スキップボタンの音声クリック（画面上の「スキップ」ボタンが現れるまで待機して自動クリック）

【使い方】
1. YouTube の動画ページを開く
2. 画面右端に表示されるマイクボタンをクリック
3. 音声コマンドを話しかける

【注意事項】
・対応言語：日本語（ja-JP）
・推奨：ヘッドセット使用（スピーカー音声の誤認識を防止）
・音声認識には Chrome 内蔵の Web Speech API を使用します
```

---

## 2. カテゴリ・属性

| 項目 | 値 |
|---|---|
| カテゴリ | Accessibility（アクセシビリティ） |
| 言語 | 日本語 |
| 対象ユーザー | 全ユーザー |

---

## 3. プライバシーポリシー URL

GitHubリポジトリを公開後、以下の形式のURLを設定してください。

```
https://github.com/<your-username>/HandsFree_for_YouTube/blob/main/docs/PRIVACY.md
```

ポリシー本文は `docs/PRIVACY.md` に記載されています。

---

## 4. プライバシーに関する説明（Privacy Read-me）

審査担当者向けの説明文です（英語）：

```
HandsFree for YouTube enables voice-controlled playback of YouTube videos using
the browser's built-in Web Speech API (webkitSpeechRecognition).

1. No Data Collection: The extension does not collect, store, or transmit any
   user data to external servers managed by the developer.

2. Microphone Usage: The microphone is activated only when the user explicitly
   clicks the mic button on the YouTube page. Voice audio is processed solely
   by Google's built-in Chrome Speech Recognition service — the extension
   developer has no access to this data.

3. Ad Skip Clarification: The "ad skip" feature simulates a click on YouTube's
   native "Skip Ad" button on behalf of the user. It does not block, intercept,
   or remove any ad content — it is a UI accessibility assist tool.

4. No Remote Code: All logic runs locally via a content script. No external
   scripts are fetched or executed at runtime.
```

---

## 5. 権限の使用理由（Permission Justification）

| 権限 | 理由 |
|---|---|
| `host_permissions: https://www.youtube.com/*` | YouTubeの動画ページにマイクボタンとトースト通知UIを注入し、音声コマンド処理を行うために必要です。 |

---

## 6. スクリーンショット要件

Chrome Web Store では最低1枚のスクリーンショットが必要です。

| サイズ | 用途 | 必須 |
|---|---|---|
| 1280×800 または 640×400 | ストアページ掲載用 | ✅ 最低1枚 |
| 440×280 | 小プロモーションタイル | 任意 |
| 920×680 | 大プロモーションタイル | 任意 |

**推奨スクリーンショット内容：**
1. YouTube動画ページ上のマイクボタン表示
2. 音声認識中（赤いパルスアニメーション）の状態
3. トースト通知の表示例
4. ポップアップの表示

---

## 7. 提出前チェックリスト

- [ ] GitHubリポジトリを公開済み
- [ ] `docs/PRIVACY.md` のURLをダッシュボードに設定
- [ ] スクリーンショットを撮影・アップロード（1280×800、最低1枚）
- [ ] 拡張機能をZIPに圧縮（`manifest.json` が直下に来るように）
- [ ] デベロッパーダッシュボードにZIPをアップロード
- [ ] 説明文・カテゴリを入力
- [ ] 「Privacy Read-me」欄に上記英語説明を入力
- [ ] 審査提出
