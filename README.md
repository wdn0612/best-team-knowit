# 小知了 - 你的 AI 情绪伙伴

每一次倾诉，都值得被温柔以待。

小知了是一款 AI 情绪陪伴应用，帮助你在对话中理解自己、记录情绪、收藏触动内心的金句。

## 核心功能

- **AI 情绪对话** — 随时和 AI 聊聊你的感受，获得温暖、有共鸣的回应
- **金句萃取** — 从对话中自动提取触动你的句子，收藏属于你的语录
- **情绪日记** — 记录每一天的情绪变化，回顾自己的心路历程

## 技术栈

- **前端**：React Native (Expo)，跨平台支持 iOS 和 Android
- **后端**：Node.js + Express
- **AI**：支持多个 LLM 提供商（OpenAI、Anthropic Claude、Gemini），实时流式响应
- **主题**：内置 5 套主题，支持自定义扩展

## 快速开始

### 启动客户端

```sh
cd app
npm start
```

### 启动服务端

```sh
cd server
npm run dev
```

### 环境变量

将 `server/.env.example` 复制为 `server/.env`，并填入你的 API Key。

## 项目结构

```
├── app/          # React Native 客户端
│   └── src/
│       ├── screens/      # 页面（对话、金句、情绪日记等）
│       ├── components/   # 通用组件
│       ├── theme.ts      # 主题配置
│       └── utils.ts      # 工具函数
├── server/       # Node.js 后端
│   └── src/
│       ├── chat/         # AI 对话路由
│       └── images/       # 图片处理路由
└── cli/          # CLI 脚手架工具
```

## 自定义主题

在 `app/src/theme.ts` 中添加新主题：

```ts
const calm = {
  ...lightTheme,
  name: '宁静',
  label: 'calm',
  tintColor: '#6B9BD2',
  textColor: '#3D5A80',
  tabBarActiveTintColor: '#3D5A80',
  tabBarInactiveTintColor: '#98C1D9',
  placeholderTextColor: '#98C1D9',
}
```

## License

MIT
