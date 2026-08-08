# Word Log

出会った単語を、出会った順に記録する個人辞書サービス。単語ごとに自分の言葉での意味(テキスト/コード/Mermaid図/画像のブロック)、関連語(自由入力・登録済み単語への自動リンク)を記録し、全文検索できる。

- `backend/` — Spring Boot (Java 21) REST API。PostgreSQL + Elasticsearch。認証はGoogle IDトークンを検証するOAuth2リソースサーバー。
- `frontend/` — Next.js (App Router)。NextAuthでGoogleログインし、GoogleのIDトークンをそのままバックエンドへBearerトークンとして転送する。

## 構成図

```
Browser --(Google login)--> Next.js (frontend)
                                 |  Authorization: Bearer <Google ID token>
                                 v
                          Spring Boot API (backend)
                                 |            \
                                 v             v
                          PostgreSQL      Elasticsearch
```

バックエンドは公式Elasticsearch Javaクライアント(`spring-boot-starter-data-elasticsearch`)を使っているため、OpenSearchではなく本家Elasticsearchを使うこと。

## 前提

- Java 21 / Node.js 20+
- Docker (PostgreSQL・Elasticsearchをローカルで動かす場合)
- Google Cloud の OAuth 2.0 クライアントID(下記参照)

## 1. Google OAuth クライアントの作成

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) で OAuth 2.0 クライアントID(種類: ウェブアプリケーション)を作成
2. 承認済みのJavaScript生成元: `http://localhost:3000`
3. 承認済みのリダイレクトURI: `http://localhost:3000/api/auth/callback/google`
4. 発行された **クライアントID** と **クライアントシークレット** を控える(クライアントIDはフロントエンド・バックエンド両方で使う)

## 2. インフラ起動(PostgreSQL / Elasticsearch)

```bash
docker compose up -d
```

- PostgreSQL: `localhost:5432`(db/user/pass はすべて `word_encounter`)
- Elasticsearch: `localhost:9200`(セキュリティ無効の開発用設定)

## 3. バックエンド

```bash
cd backend
export GOOGLE_CLIENT_ID=<Google OAuthクライアントID>
./gradlew bootRun
```

起動時にFlywayがマイグレーションを自動適用する。他の環境変数(`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `ELASTICSEARCH_URIS`, `APP_CORS_ALLOWED_ORIGINS`, `SERVER_PORT`)は `backend/src/main/resources/application.yml` の通りデフォルトでローカル開発に対応済み。API は `http://localhost:8080` で待ち受ける。

テスト実行:

```bash
./gradlew test
```

## 4. フロントエンド

```bash
cd frontend
cp .env.example .env.local
# .env.local を編集:
#   AUTH_SECRET       … `openssl rand -base64 33` などで生成
#   AUTH_GOOGLE_ID     … Google OAuthクライアントID(バックエンドと同じ値)
#   AUTH_GOOGLE_SECRET … Google OAuthクライアントシークレット
#   API_BASE_URL       … http://localhost:8080 (デフォルト)
npm install
npm run dev
```

`http://localhost:3000` を開き、Googleでログインする。未ログイン時はすべての画面が `/signin` にリダイレクトされる。

ビルド/Lint:

```bash
npm run build
npm run lint
```

## 画面

- `/` — ホーム。出会った順(古い→新しい)に中央のスパインでつながるタイムライン。最上部に検索バー、最下部に新規登録への導線。
- `/words/new` — 単語名のみを入力する最小フォーム。入力中にリアルタイムで重複チェック。
- `/words/[id]` — 単語詳細。意味はテキスト/コード/Mermaid図/画像のブロックで構成し、ブロック単位で追加・編集・削除できる。関連語は自由入力のチップで追加し、登録済みの単語と一致すればクリックでジャンプできる。あいまい検索と逆引き関連語をもとにした「候補(自動検出)」を非同期で表示する。
- `/search` — 単語・意味・関連語を横断するインクリメンタル検索。見出し語が未登録ならその場で新規登録できる。

## デザイン

Figmaのワイヤーフレーム/ビジュアルデザイン: https://www.figma.com/design/iUwPKGIvCehJfzlrT8jYF6

## デプロイ

Oracle Cloudの無料枠に全部乗せて月額$0で動かす手順は [DEPLOY.md](./DEPLOY.md) を参照。