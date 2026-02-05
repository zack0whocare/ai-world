# Vercel部署指南 - AI World

## 🎯 部署状态

✅ TypeScript构建错误已修复
✅ 代码已推送到GitHub: https://github.com/zack0whocare/ai-world
🔄 等待Vercel自动重新部署

---

## 📋 部署步骤

### 第1步：等待Vercel自动部署

由于你已经通过Vercel导入了GitHub项目，Vercel会自动检测到新的提交并重新部署。

**检查部署状态：**
1. 访问 Vercel项目页面
2. 查看"Deployments"标签
3. 应该能看到新的部署正在进行（commit: `52ff7b1`）

如果没有自动触发，点击"Redeploy"按钮。

### 第2步：配置Convex环境变量

部署成功后，需要配置Convex：

1. **登录Convex Dashboard**
   - 访问: https://dashboard.convex.dev
   - 使用GitHub账号登录

2. **创建新项目**
   - 点击"Create a project"
   - 项目名称: `ai-world`
   - 选择团队（或个人账号）

3. **获取Convex URL**
   - 创建项目后，会看到 `CONVEX_URL`
   - 格式类似: `https://xxx.convex.cloud`

4. **在Vercel配置环境变量**
   - 返回Vercel项目设置
   - 进入"Settings" → "Environment Variables"
   - 添加以下变量：

```bash
# Convex配置
VITE_CONVEX_URL=https://你的convex部署.convex.cloud

# 豆包API配置
VITE_ARK_API_KEY=75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c
VITE_ARK_MODEL=doubao-seed-1-8-251228
VITE_ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3

# 兼容OpenAI格式
VITE_OPENAI_API_KEY=75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c
VITE_OPENAI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VITE_OPENAI_MODEL=doubao-seed-1-8-251228
```

⚠️ **注意**: Vite项目的环境变量需要 `VITE_` 前缀才能在浏览器中访问。

### 第3步：部署Convex Schema

在本地运行以下命令：

```bash
# 1. 登录Convex
npx convex login

# 2. 部署到生产环境
npx convex deploy --prod

# 3. 获取生产环境URL
npx convex env get CONVEX_URL
```

将获取到的 `CONVEX_URL` 添加到Vercel环境变量中。

### 第4步：重新部署Vercel

配置完环境变量后：

1. 在Vercel项目页面点击"Redeploy"
2. 等待部署完成
3. 访问部署的URL

---

## 🔧 环境变量配置清单

### Vercel环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_CONVEX_URL` | `https://xxx.convex.cloud` | Convex部署URL |
| `VITE_ARK_API_KEY` | `75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c` | 豆包API Key |
| `VITE_ARK_MODEL` | `doubao-seed-1-8-251228` | 豆包模型ID |
| `VITE_ARK_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3` | 豆包API Base URL |
| `VITE_OPENAI_API_KEY` | `75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c` | 兼容OpenAI格式 |
| `VITE_OPENAI_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3` | 兼容OpenAI格式 |
| `VITE_OPENAI_MODEL` | `doubao-seed-1-8-251228` | 兼容OpenAI格式 |

### Convex环境变量

Convex后端函数需要的环境变量（在Convex Dashboard配置）：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ARK_API_KEY` | `75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c` | 豆包API Key（后端） |
| `ARK_MODEL` | `doubao-seed-1-8-251228` | 豆包模型ID |
| `ARK_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3` | 豆包API Base URL |

**配置方法：**
1. 访问 Convex Dashboard
2. 选择你的项目
3. 进入 "Settings" → "Environment Variables"
4. 添加上述变量

---

## 🧪 部署后测试

### 1. 访问部署的网站

Vercel会提供一个URL，格式类似：
- `https://ai-world-xxx.vercel.app`

### 2. 初始化AI World

打开浏览器控制台（F12），运行：

```javascript
// 初始化世界
const initResult = await convex.mutation(api.aiworld.init.initializeWorld, {});
console.log(initResult);
// 预期: { success: true, message: "AI World初始化完成! 创建了8个资源点" }
```

### 3. 创建测试AI

```javascript
// 创建AI Agent
const agent = await convex.mutation(api.aiworld.mutations.createAgent, {
  playerId: "player_001",
  playerName: "测试玩家",
  config: {
    name: "建造者Alice",
    personalityType: "builder"
  }
});
console.log(agent);
```

### 4. 查看资源点

```javascript
// 获取所有资源
const resources = await convex.query(api.aiworld.mutations.getAllResources, {});
console.log("资源点:", resources);
```

---

## 🐛 常见问题

### 问题1：部署成功但页面空白

**原因**: Convex URL未配置或配置错误

**解决方案**:
1. 检查Vercel环境变量中的 `VITE_CONVEX_URL`
2. 确保URL格式正确（https://xxx.convex.cloud）
3. 重新部署Vercel

### 问题2：AI决策不工作

**原因**: 豆包API配置未生效

**解决方案**:
1. 检查Convex Dashboard中的环境变量
2. 确保 `ARK_API_KEY` 等变量已配置
3. 重新部署Convex: `npx convex deploy --prod`

### 问题3：初始化失败

**原因**: Convex Schema未部署

**解决方案**:
```bash
# 部署Convex Schema
npx convex deploy --prod
```

### 问题4：TypeScript构建错误

**状态**: ✅ 已修复

修复内容：
- Game.tsx: 添加width/height默认值
- PixiViewport.tsx: 修复对象字面量类型错误

---

## 📊 部署架构

```
GitHub (zack0whocare/ai-world)
    ↓ (自动触发)
Vercel (前端部署)
    ↓ (连接)
Convex (后端数据库)
    ↓ (调用)
豆包API (AI决策)
```

---

## 🔐 安全注意事项

1. **API Key保护**
   - 豆包API Key已配置在环境变量中
   - 不要在前端代码中硬编码API Key
   - Convex后端函数会安全地调用豆包API

2. **环境变量**
   - 前端变量需要 `VITE_` 前缀
   - 后端变量在Convex Dashboard配置
   - 不要将 `.env.local` 提交到Git

3. **Convex认证**
   - 默认所有mutations和queries都是公开的
   - 如需限制访问，使用Convex的认证系统

---

## 📝 下一步

部署成功后：

1. ✅ 验证前端页面可以访问
2. ✅ 初始化AI World（创建资源点）
3. ✅ 创建测试AI Agent
4. ✅ 验证豆包API决策功能
5. 🎮 开始使用AI World！

---

## 📞 获取帮助

如果遇到问题：

1. 查看Vercel部署日志
2. 查看Convex Dashboard日志
3. 检查浏览器控制台错误
4. 参考 `DEPLOYMENT_GUIDE.md`

---

**部署提交**: `52ff7b1` - "fix: Resolve TypeScript build errors for Vercel deployment"  
**GitHub**: https://github.com/zack0whocare/ai-world  
**Convex**: https://dashboard.convex.dev
