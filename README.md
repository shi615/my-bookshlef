# my-bookshelf 📚

物理的な蔵書をデジタル化して管理する、個人向けデジタル本棚 Web アプリケーションです。

本の ISBN バーコードを撮影またはアップロードするだけで、Google Cloud 上の AI が ISBN を自動認識し、書籍情報を取得して自分の本棚に登録できます。手入力ゼロで蔵書をデジタル化することを目指しています。

## ✨ 主な機能

- **ISBN スキャンで本を追加** — バーコード画像を撮影/アップロードすると、Gemini Vision が ISBN を読み取り、書籍メタデータ（タイトル・著者・出版社・表紙画像など）を自動取得して本棚に保存します。
- **手動登録** — カタログに該当する書籍が見つからない場合は、タイトル・著者（必須）と任意の表紙画像で手動登録できます。
- **重複の警告** — すでに本棚にある本を追加しようとすると警告を表示し、そのまま追加するかキャンセルするかを選べます。
- **プライベートな本棚** — 本棚は所有者本人のみが閲覧可能です（共有・公開機能はありません）。
- **読書ステータス** — 追加時は「読みたい（Want to Read）」で固定され、後から本棚で変更できます。

> ℹ️ ISBN はバーコード部分からのみ抽出します（印刷された文字列からは認識しません）。

## 🛠 技術スタック

| 領域 | 採用技術 |
| --- | --- |
| フロントエンド | Next.js 16 (App Router) / React 18 / TypeScript / Tailwind CSS |
| 認証 | Firebase Authentication |
| データベース | Firestore |
| ストレージ | Cloud Storage |
| サーバー | Cloud Run |
| AI / ML | Vertex AI / Gemini API (`@google/genai`) |
| ローカル開発 | Firebase Local Emulator Suite |
| CI/CD | Cloud Build |
| テスト | Vitest |

## 📁 プロジェクト構成

```text
app/                       # Next.js App Router（ページ & API ルート）
  api/
    auth/                  # ログイン / ログアウト
    books/scan/            # ISBN 画像スキャン API
    books/shelf/           # 本棚操作 API
  bookshelf/               # 本棚ページ
  books/add/               # 本の追加ページ
  login/                   # ログインページ
components/
  books/                   # ISBNScanner, BookConfirmCard, 重複警告ダイアログ など
lib/
  gemini/isbn-extractor.ts # Gemini Vision による ISBN 抽出
  books/                   # ISBN 検証・カタログ検索・本棚ロジック
  auth/                    # セッション管理
  firebase/                # Firebase Admin / Client 初期化
tests/
  unit/                    # ユニットテスト
  integration/             # API 結合テスト
```

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、各値を設定します。

```bash
cp .env.local.example .env.local
```

| 変数 | 説明 |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase クライアント API キー（公開可） |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase 認証ドメイン |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase プロジェクト ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Admin SDK のクライアントメール（サーバー専用・秘匿） |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin SDK の秘密鍵（本番は Secret Manager で管理） |
| `GOOGLE_CLOUD_PROJECT` | GCP プロジェクト ID |
| `GOOGLE_BOOKS_API_KEY` | Google Books API キー |
| `VERTEX_AI_LOCATION` | Vertex AI のリージョン（例: `asia-northeast1`） |
| `NEXT_PUBLIC_USE_EMULATOR` | ローカルで Firebase エミュレータを使う場合は `true` |

### 3. 開発サーバーの起動

```bash
# Firebase エミュレータ（別ターミナルで起動）
npm run emulator

# 開発サーバー
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 📜 npm スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバーを起動 |
| `npm run lint` | ESLint を実行 |
| `npm test` | ユニット & 結合テストを実行 |
| `npm run test:unit` | ユニットテストのみ実行 |
| `npm run test:integration` | 結合テストのみ実行 |
| `npm run test:watch` | テストをウォッチモードで実行 |
| `npm run emulator` | Firebase エミュレータを起動 |

## ☁️ デプロイ

Cloud Build と `Dockerfile` を用いて Cloud Run へデプロイします。

```bash
gcloud builds submit --config cloudbuild.yaml
```

## 🧪 テスト

```bash
npm test
```

ユニットテストは `tests/unit/`、API の結合テストは `tests/integration/` に配置されています。

## 📄 ライセンス

このプロジェクトは現在プライベート（`private: true`）です。
