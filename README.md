# 📈 GeMoney · AI 股票情报助手

实时抓取**财联社电报**，每日汇总**新闻联播**，结合大语言模型深度分析，智能生成个股推荐与投资洞察。

---

## ✨ 项目亮点

- **实时电报**：通过 SSE 长连接秒级推送财联社最新电报，第一时间捕捉市场异动与政策信号
- **AI 解读**：每条电报支持一键 AI 解读，流式输出分析结果
- **每日报告**：自动汇总当日电报，AI 生成个股热点追踪报告，含市场情绪、板块方向、风险提示
- **新闻联播**：每日自动抓取新闻联播内容，提取宏观政策与产业方向
- **用户体系**：支持注册登录，VIP 权限控制，JWT 鉴权
- **全自动化**：定时任务自动抓取数据，无需人工干预

---

## 🎯 核心功能

### 实时电报监控
- 财联社电报实时推送（SSE），按重要性分级（重要 / 关注 / 普通）
- 最多缓存 200 条，自动滚动更新

### AI 热点追踪报告
- 基于当日电报，AI 自动生成个股推荐列表
- 支持按市场（主板 / 创业板 / 科创板 / 北交所）、周期（短线 / 中线）、热度筛选
- 输出字段：股票名称、代码、所属板块、新闻逻辑、风险提示、参考区间、市场情绪

### 新闻联播分析
- 每日自动抓取新闻联播文本
- AI 结构化解读宏观政策与产业支持方向

### 用户与权限
- 注册 / 登录 / 登出，JWT Token 鉴权
- 角色分级：`user` / `vip` / `admin`，VIP 到期时间管理

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Nuxt 4 · Vue 3 · Tailwind CSS 4 |
| 后端 | Express · TypeScript · Prisma ORM |
| 数据库 | MySQL |
| AI | 豆包（字节跳动 ARK）· 兼容 OpenAI 接口格式 |
| 实时推送 | SSE（Server-Sent Events） |
| 定时任务 | node-cron |
| 鉴权 | JWT + bcryptjs |
| 日志 | Winston |

---

## 📁 项目结构

```
stock_ai_gemoney/
├── client/                  # 前端（Nuxt 4）
│   └── app/
│       ├── pages/           # 页面：首页、早盘、午盘、晚盘、新闻
│       ├── components/      # 组件：AI 解读弹窗、登录弹窗、VIP 门控
│       └── composables/     # 逻辑复用：电报、AI 分析、SSE、鉴权
├── server/                  # 后端（Express）
│   ├── src/
│   │   ├── modules/         # 业务模块：用户、电报、AI、指数、新闻
│   │   ├── middleware/      # 中间件：鉴权、错误处理、参数校验
│   │   └── utils/           # 工具：JWT、响应封装、异步处理
│   └── prisma/
│       └── schema.prisma    # 数据模型：User、Telegraph、DailyReport、NewsReport
├── start.bat                # 一键启动前后端（Windows）
└── README.md
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- MySQL 数据库

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/stock_ai_gemoney.git
cd stock_ai_gemoney
```

### 2. 配置后端环境变量

```bash
cd server
cp .env.example .env
```

编辑 `.env`：

```env
PORT=3000
JWT_SECRET=your_jwt_secret_here
DATABASE_URL="mysql://root:password@localhost:3306/gemoney"
ARK_API_KEY=your_doubao_api_key
ARK_MODEL=doubao-seed-2-0-lite-260215
NODE_ENV=development
```

### 3. 安装依赖 & 初始化数据库

```bash
# 后端
cd server
npm install
npm run prisma:migrate

# 前端
cd ../client
npm install
```

### 4. 启动项目

**Windows 一键启动：**

```bash
# 在根目录双击或执行
start.bat
```

**手动启动：**

```bash
# 后端（端口 3000）
cd server && npm run dev

# 前端（端口 3001）
cd client && npm run dev
```

访问 [http://localhost:3001](http://localhost:3001)

---

## ⚠️ 免责声明

> 本项目仅供学习与技术研究使用，**所有 AI 生成内容均不构成任何投资建议**。
> 股市有风险，入市需谨慎。项目不承担任何投资损失责任。

---

**欢迎 Star & Fork**，有任何问题或建议欢迎提 Issue。
