# SeekChat

SeekChat 是一个轻量级的 ChatGPT 风格聊天网站，后端调用 DeepSeek API，支持用户登录、会话管理、流式 AI 回复和历史记录保存。

项目包含：

- Node.js / Express 后端
- MongoDB 数据持久化
- 静态 HTML / CSS / JavaScript 前端
- 通过 OpenAI 兼容 SDK 调用 DeepSeek API

## 项目截图

![登录页面](screenshots/login.png)

![聊天页面](screenshots/chat.png)

## 功能特性

- 用户登录
- 新建、重命名、删除、置顶会话
- AI 回复流式输出
- 保存历史聊天记录
- Express 托管前端静态页面

## 技术栈

- Node.js
- Express
- MongoDB 和 Mongoose
- DeepSeek API
- OpenAI 兼容 SDK
- HTML、CSS、原生 JavaScript

## 项目结构

```text
backend/
  server.js              Express 服务入口
  routes/
    auth.js              登录接口
    chat.js              会话和流式聊天接口
  models/
    User.js              用户模型
    Conversation.js      会话模型
  public/
    login.html           登录页面
    chat.html            聊天页面
screenshots/
  login.png
  chat.png
```

## 环境要求

- Node.js 18 或更高版本
- 本地 MongoDB，或可用的 MongoDB 连接地址
- DeepSeek API Key

## 安装与启动

进入后端目录：

```bash
cd backend
```

安装依赖：

```bash
npm install
```

复制环境变量示例文件：

```bash
copy .env.example .env
```

编辑 `backend/.env`：

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/DeepSeek
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

启动后端服务：

```bash
npm start
```

浏览器打开：

```text
http://localhost:5000
```

## 创建测试用户

当前项目默认用户已经存在于 MongoDB 中，没有单独的注册页面。可以使用 `mongosh` 手动插入一个测试用户：

```javascript
use DeepSeek
db.users.insertOne({ username: "test", password: "123456" })
```

然后使用以下账号登录：

```text
username: test
password: 123456
```

## 接口概览

```text
POST   /api/auth/login
POST   /api/chat/new
GET    /api/chat/conversations/:userId
GET    /api/chat/history/:conversationId
POST   /api/chat/send
PUT    /api/chat/rename/:conversationId
PUT    /api/chat/pin/:conversationId
DELETE /api/chat/delete/:conversationId
GET    /api/health
```

## 项目检查

```bash
cd backend
npm test
```

当前 `npm test` 会对后端入口文件和路由文件进行基础语法检查。

## 注意事项

- 不要提交 `.env` 文件，它已经被 `.gitignore` 忽略。
- 当前项目为了兼容原始演示数据，密码仍以明文方式存储。正式部署前应改为密码哈希存储。
- 启动项目前，请确认 MongoDB 已经运行，并且 `.env` 中已经配置 `DEEPSEEK_API_KEY`。
