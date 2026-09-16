# Word Log

思いついたことを気軽に書き留め、そのうち残す価値のあるものだけを自分の言葉で書き直し、既存のメモとリンクさせて積み上げていく — ニクラス・ルーマンの**ツェッテルカステン**(Zettelkasten、ドイツ語で「メモ箱」)を1人用のWebアプリとして実装した、個人用の知識システム。

### 考え方

ツェッテルカステンが価値を置くのは、メモそのものではなく**メモとメモの間のリンク**。1枚のメモは、他のメモと結びついて初めて「知識」になる。そのために、このアプリは書く行為を2段階に分ける。

1. **走り書き(Dash Off)** — 思いついたこと、読んだものの断片、AIとの会話で気づいたことを、体裁を気にせず放り込む場所。使い捨て前提で、整理されないまま1週間経ったものは自動でアーカイブされる。
2. **ツェッテルカステン** — 走り書きの中から「これは残したい」というものを選び、タイトルを付けて自分の言葉で書き直したもの(永久保存版メモ)。**必ず既存のメモか索引へのリンクを1つ以上持つ**ので、書いたきり孤立して忘れられることがない。

フォルダで分類はしない。永久保存版メモは全体で1本の時系列の並びを持ち、既存の2件の「あいだ」を選んで挿し込む — ルーマンが実物のカードに `21/3d7a26` のような住所を振り、番号を振り直さずに思考の枝分かれを表現したのと同じ考え方。探すための入り口は、本当によく参照するキーワードだけを登録した少数の**索引**と、全文検索。

### 主な機能

- **走り書き** — 1メモ＝1本のプレーンテキスト。```` ```言語 ````でコード、```` ```mermaid ````で図、`![](URL)`で画像が埋め込める
- **昇格** — 複数の走り書きをまとめて選び、1つ以上の永久保存版メモに書き直す。リンクを張らずには保存できない
- **文献メモ** — 本や論文の「自分の言葉での要約」を独立して保存し、走り書き・永久保存版メモのどちらからでも参照する。Zotero連携で書誌情報を取り込める
- **探索レール** — アクティブな走り書きに対して、関連しそうな文献やニュースの候補をAIが定期的に提示する。APIキーはアプリ共通では持たず、各自が自分のもの(Claude/ChatGPT/Gemini)を設定して使う
- **プロジェクトとカレンダー** — 最終目標から1日の目標までの目標ラダーと、日毎のタスクメモ(バレットジャーナル記法の凡例つき)。プロジェクトの期間は月単位のタイムラインに横線として引かれる
- **検索** — 走り書きと永久保存版メモを横断するインクリメンタル検索
- 日本語/英語、ダーク/ライト、PWA(オフラインでも書ける)

単一のNext.jsアプリ(フロントエンド・バックエンドを分離しない)から直接PostgreSQLへアクセスする。全文検索・あいまい検索・関連候補もすべてPostgreSQLの`pg_trgm`拡張だけで実現しており、Elasticsearchのような別サービスは不要。

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
