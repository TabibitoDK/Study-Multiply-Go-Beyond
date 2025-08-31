# Study Multiply - Go Beyond

[![React][React.js]][React-url] [![JavaScript][JavaScript]][JavaScript-url] [![Vite][Vite.js]][Vite-url]

このプロジェクトは、仲間と繋がりながら学習記録を共有し、モチベーションを高め合うためのソーシャル学習アプリです。

![学習の様子](https://via.placeholder.com/800x400/646cff/ffffff?text=Study+Multiply+-+Go+Beyond)

> 仮想空間で他の人と一緒に勉強することで、モチベーションを向上させることができます。

---

# Study Multiply – Go Beyond

## 📚 概要 (Overview)

このアプリケーションは、学習に特化したInstagramのようなものです。ユーザーは日々の学習内容や時間を記録し、それを仲間と共有することができます。これにより、自身の学習ログや日記として機能するだけでなく、他者の学習意欲を刺激するプラットフォームとなることを目指します。

---

## ✨ 主な機能 (Features)

* **学習記録の簡単化**:
    * 学習ノートを導入し、手軽に記録やまとめが作成できます
    * フラッシュカードを自動で作成し、復習をサポートします

* **人工知能の導入**:
    * AIが学習ノートの内容を分析し、要約を自動生成します

* **目標設定システム**:
    * 長期的・短期的な学習目標を設定し、進捗を記録・管理できます


## 目標（現在の到達目標）
- **UI設計（Figma 等）**  
  - 主要画面のワイヤー → モック → デザインシステム（色・タイポ・コンポーネント）
  - モバイル優先・レスポンシブ方針の確立
- **フロントエンド（UIをウェブサイト化）**  
  - Figma → React + Vite で実装（状態管理・ルーティング・アクセシビリティ）
  - 学習記録一覧、投稿フォーム、プロフィール、設定の最小機能
- **バックエンド（Gemini / Firebase 等のAPI利用）**  
  - Firebase 認証・DB（Firestore）・ストレージの採用
  - Gemini API による要約／自動フラッシュカードの試作
  - セキュリティルールの基本整備

---

## インストール & 開発方法（Getting Started）

### 前提条件
- Node.js 18+
- npm または yarn
- Git

### セットアップ
```bash
git clone <YOUR_REPO_URL>
cd study-multiply-go-beyond
npm install
npm run dev
# ブラウザ: http://localhost:5173
```

### ビルド & プレビュー
```bash
npm run build
npm run preview
```

### 環境変数（Vite 例）
`./.env`（または `.env.local`）に以下を設定：
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxx
VITE_FIREBASE_APP_ID=1:xxxxxx:web:xxxxxx

VITE_GEMINI_API_KEY=your_gemini_key
```
> フロントから参照する値は `VITE_` プレフィックス必須。Firebase の Web 設定はコンソールの「プロジェクトの設定 → アプリを追加」から取得。

### 開発フロー（最小）
1. **UI確定**：Figma で画面・コンポーネントを定義  
2. **UI実装**：React でページ/コンポーネント作成 → ルーティング/状態管理  
3. **API接続**：Firebase 初期化、認証→DB→ストレージ連携  
4. **AI機能**：Gemini API で要約/カード化のプロトタイプ  
5. **保護**：Firestore セキュリティルールの基本設定（読み書き条件）  
6. **ビルド/デプロイ**：`npm run build` → 任意のホスティングへ

### 開発に向けて学ぶべきこと（推奨）
- **UI/UX**：Figma（Auto Layout、Variants、Style/Token、レスポンシブ設計）  
- **フロントエンド**：HTML/CSS/最新JS、React（Hooks/Context）、React Router、フォーム/バリデーション、A11y、Vite、（余力で）テスト（Vitest/RTL）  
- **バックエンド＆API**：Firebase（Auth/Firestore/Storage/ルール）、Gemini API（テキスト生成・要約／プロンプト設計）、非同期処理、エラーハンドリング、データモデリング  
- **運用**：Git/GitHub（ブランチ・PR）、ESLint/Prettier、デプロイ（Vercel/Netlify/Firebase Hosting）

---

### プロジェクト構成（例）
```
src/
  assets/
  components/
  pages/
  App.jsx
  main.jsx
  index.css
```

### NPM スクリプト（例）
- `npm run dev`：開発サーバ起動  
- `npm run build`：本番ビルド  
- `npm run preview`：ビルド物のローカルプレビュー  
- `npm run lint`：ESLint 実行

---

## 🛠️ 開発技術 (Built With)

* **フロントエンド**:
    * React 19.1.0
    * JavaScript (ES2020+)
    * Vite 7.0.4
    * CSS3

* **開発ツール**:
    * ESLint (コード品質管理)
    * React Hooks (状態管理)
    * React Refresh (ホットリロード)

---

## 🚀 セットアップ方法 (Setup Instructions)

### 前提条件 (Prerequisites)

このアプリケーションを実行するには、以下のソフトウェアがインストールされている必要があります：

- **Node.js** (バージョン 16.0.0 以上推奨)
- **npm** または **yarn** (パッケージマネージャー)
- **Git** (ソースコード管理)

#### Node.jsのインストール確認
```bash
node --version
npm --version
```

### 📥 インストール手順 (Installation)

#### 1. リポジトリのクローン
```bash
git clone https://github.com/your-username/study-multiply-go-beyond.git
cd study-multiply-go-beyond
```

#### 2. 依存関係のインストール
```bash
# npmを使用する場合
npm install

# または yarnを使用する場合
yarn install
```

#### 3. 開発サーバーの起動
```bash
# npmを使用する場合
npm run dev

# または yarnを使用する場合
yarn dev
```

#### 4. ブラウザでアプリケーションを開く
開発サーバーが起動したら、ブラウザで以下のURLにアクセスしてください：
```
http://localhost:5173
```

---

## 📜 利用可能なスクリプト (Available Scripts)

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動します (ホットリロード有効) |
| `npm run build` | 本番用にアプリケーションをビルドします |
| `npm run lint` | ESLintを実行してコードの品質をチェックします |
| `npm run preview` | ビルドされたアプリケーションをプレビューします |

---

## 📁 プロジェクト構造 (Project Structure)

```
study-multiply-go-beyond/
├── public/                 # 静的ファイル
│   └── vite.svg           # Viteのロゴ
├── src/                   # ソースコード
│   ├── assets/            # アセットファイル
│   │   └── react.svg      # Reactのロゴ
│   ├── App.css           # アプリケーションのスタイル
│   ├── App.jsx           # メインアプリケーションコンポーネント
│   ├── index.css         # グローバルスタイル
│   └── main.jsx          # エントリーポイント
├── .gitignore            # Gitで無視するファイル
├── eslint.config.js      # ESLint設定
├── index.html            # HTMLテンプレート
├── package.json          # プロジェクト設定と依存関係
├── vite.config.js        # Vite設定
└── README.md             # このファイル
```

---

## 🔧 開発環境の設定 (Development Environment)

### VS Code拡張機能の推奨
開発効率を向上させるために、以下の拡張機能をインストールすることをお勧めします：

- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **ESLint**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**

### ESLint設定
プロジェクトには既にESLint設定が含まれています。コードの品質を保つために、以下のルールが適用されています：

- React Hooks のルール
- React Refresh のルール
- 未使用変数の検出（大文字で始まる変数は除く）

---

## 🚀 本番環境へのデプロイ (Production Deployment)

### ビルド
```bash
npm run build
```

ビルドされたファイルは `dist/` フォルダに生成されます。

### プレビュー
ビルドされたアプリケーションをローカルでプレビューできます：
```bash
npm run preview
```

---

## 🎯 プロジェクトの目標 (Goal)

**既存の学習時間管理アプリ「Study Plus」を超える！**

| 機能 | 我々のアプリ | Study Plus |
|------|-------------|------------|
| 勉強の記録 | ✅ | ✅ |
| AI導入 | ✅ | ❌ |
| 目標システム | ✅ | ❌ |
| ソーシャル機能 | ✅ | 限定的 |

---

## 🤝 コントリビューション (Contributing)

1. このリポジトリをフォークしてください
2. 新しいブランチを作成してください (`git checkout -b feature/AmazingFeature`)
3. 変更をコミットしてください (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュしてください (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成してください

---

## 🐛 トラブルシューティング (Troubleshooting)

### よくある問題と解決方法

#### 1. `npm install` でエラーが発生する場合
```bash
# Node.jsとnpmが最新バージョンか確認
node --version
npm --version

# キャッシュをクリア
npm cache clean --force

# 再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 2. 開発サーバーが起動しない場合
- ポート5173が既に使用されていないか確認
- ファイアウォールの設定を確認
- Node.jsのバージョンが16以上であることを確認

#### 3. ESLintエラーが発生する場合
```bash
# ESLintの問題を自動修正
npm run lint -- --fix
```

---

## 📄 ライセンス (License)

MIT License

Copyright (c) 2025 George

---

## 📞 お問い合わせ (Contact)

プロジェクトに関するご質問やご提案がございましたら、以下の方法でお気軽にお問い合わせください：

- プロジェクトリンク: [https://github.com/your-username/study-multiply-go-beyond](https://github.com/your-username/study-multiply-go-beyond)
- Issues: [GitHub Issues](https://github.com/your-username/study-multiply-go-beyond/issues)

---

## 🙏 謝辞 (Acknowledgments)

- [React](https://reactjs.org/) - ユーザーインターフェース構築のためのJavaScriptライブラリ
- [Vite](https://vitejs.dev/) - 高速なフロントエンド開発ツール
- [ESLint](https://eslint.org/) - JavaScriptのコード解析ツール

---

**⭐ このプロジェクトが役に立った場合は、ぜひスターを付けてください！**

[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[JavaScript]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[JavaScript-url]: https://www.javascript.com
[Vite.js]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev/