# Word Log

出会った単語を、出会った順に記録する個人辞書サービス。単語ごとに自分の言葉での意味(テキスト/コード/Mermaid図/画像のブロック)、関連語(自由入力・登録済み単語への自動リンク)を記録し、全文検索できる。

単一のNext.jsアプリ(フロントエンド・バックエンドを分離しない)から直接PostgreSQLへアクセスする構成。全文検索・あいまい検索・関連語候補もすべてPostgreSQLの`pg_trgm`拡張だけで実現しており、Elasticsearchのような別サービスは不要。

## 構成図

```
Browser --(Google login via NextAuth)--> Next.js (App Router)
                                              |  Server Actions / Server Components
                                              |  (Prisma)
                                              v
                                          PostgreSQL (+ pg_trgm)
```

- 認証: NextAuthのGoogleログイン。バックエンドが別に無いため、認可も「ログイン中のGoogleアカウントのsub」でPostgreSQLの行を絞り込むだけ
- DB: PostgreSQL 1つ。Prismaでスキーマ管理・マイグレーション
- 検索: `pg_trgm`のtrigram類似度(`similarity()`)による全文/あいまい検索。追加のインフラ不要

## 前提

- Node.js 20+
- PostgreSQL(ローカルは`docker compose up -d`でOK)
- Google Cloud の OAuth 2.0 クライアントID

## 1. Google OAuth クライアントの作成

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) で OAuth 2.0 クライアントID(種類: ウェブアプリケーション)を作成
2. 承認済みのJavaScript生成元: `http://localhost:3000`
3. 承認済みのリダイレクトURI: `http://localhost:3000/api/auth/callback/google`
4. 発行された **クライアントID** と **クライアントシークレット** を控える

## 2. PostgreSQL起動

```bash
docker compose up -d
```

`localhost:5432`(db/user/pass はすべて `word_encounter`)。

## 3. アプリの起動

```bash
cd frontend
cp .env.example .env
# .env を編集:
#   DATABASE_URL       … デフォルトのままでdocker-compose.ymlと一致
#   AUTH_SECRET         … `openssl rand -base64 33` などで生成
#   AUTH_GOOGLE_ID      … Google OAuthクライアントID
#   AUTH_GOOGLE_SECRET  … Google OAuthクライアントシークレット
npm install        # postinstallでPrisma Clientも生成される
npx prisma migrate deploy   # テーブル作成 + pg_trgm拡張の有効化
npm run dev
```

`http://localhost:3000` を開き、Googleでログインする。未ログイン時はすべての画面が `/signin` にリダイレクトされる。

ビルド/Lint:

```bash
npm run build   # prisma migrate deploy も自動実行される
npm run lint
```

スキーマを変更したら:

```bash
npx prisma migrate dev --name <変更内容>
```

## 画面

- `/` — ホーム。出会った順(古い→新しい)に中央のスパインでつながるタイムライン。最上部に検索バー、最下部に新規登録への導線。
- `/words/new` — 単語名のみを入力する最小フォーム。入力中にリアルタイムで重複チェック。
- `/words/[id]` — 単語詳細。意味はテキスト/コード/Mermaid図/画像のブロックで構成し、ブロック単位で追加・編集・削除できる。関連語は自由入力のチップで追加し、登録済みの単語と一致すればクリックでジャンプできる。あいまい検索と逆引き関連語をもとにした「候補(自動検出)」を非同期で表示する。
- `/search` — 単語・意味・関連語を横断するインクリメンタル検索。見出し語が未登録ならその場で新規登録できる。

## デザイン

Figmaのワイヤーフレーム/ビジュアルデザイン: https://www.figma.com/design/iUwPKGIvCehJfzlrT8jYF6

## デプロイ

Vercel(フロントエンド、無料枠) + Neon(サーバーレスPostgres、無料枠)で月額$0運用できる。手順は [DEPLOY.md](./DEPLOY.md) を参照。
