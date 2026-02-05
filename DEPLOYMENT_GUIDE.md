# AI World 部署指南

完整的部署步骤和测试流程。

## 📋 前置要求

1. Node.js 18+ 
2. pnpm 或 npm
3. Convex账号（免费）
4. 豆包API Key（已提供）

## 🚀 部署步骤

### 第1步：克隆项目

```bash
git clone https://github.com/zack0whocare/ai-world.git
cd ai-world
```

### 第2步：安装依赖

```bash
pnpm install
```

### 第3步：配置环境变量

项目已包含 `.env.local` 文件，内容如下：

```bash
# 豆包API配置
ARK_API_KEY=75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c
ARK_MODEL=doubao-seed-1-8-251228
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3

# 兼容OpenAI格式
OPENAI_API_KEY=75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c
OPENAI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
OPENAI_MODEL=doubao-seed-1-8-251228
```

**无需修改，已配置好豆包API。**

### 第4步：登录Convex

```bash
npx convex login
```

按提示完成登录。

### 第5步：初始化Convex项目

```bash
npx convex dev
```

这会：
1. 创建新的Convex项目（或连接现有项目）
2. 部署Schema和函数
3. 启动开发服务器

**重要：** 保持此终端窗口运行。

### 第6步：启动前端（新终端）

```bash
npm run dev
```

访问 `http://localhost:5173`

## 🧪 测试流程

### 测试1：初始化AI World

打开浏览器控制台（F12），运行：

```javascript
// 初始化世界
const initResult = await convex.mutation(api.aiworld.init.initializeWorld, {});
console.log(initResult);
// 预期输出: { success: true, message: "AI World初始化完成! 创建了8个资源点" }

// 查看世界状态
const status = await convex.query(api.aiworld.init.getWorldStatus, {});
console.log(status);
// 预期输出: { initialized: true, resourceCount: 8, buildingCount: 0, agentCount: 0, tradeCount: 0 }
```

### 测试2：创建AI Agent

```javascript
// 创建建造者AI
const agent1 = await convex.mutation(api.aiworld.mutations.createAgent, {
  playerId: "player_001",
  playerName: "测试玩家1",
  config: {
    name: "建造者Alice",
    personalityType: "builder",
    backstory: "一个热爱建造的AI"
  }
});
console.log(agent1);

// 创建商人AI
const agent2 = await convex.mutation(api.aiworld.mutations.createAgent, {
  playerId: "player_001",
  playerName: "测试玩家1",
  config: {
    name: "商人Bob",
    personalityType: "trader"
  }
});
console.log(agent2);

// 创建收集者AI
const agent3 = await convex.mutation(api.aiworld.mutations.createAgent, {
  playerId: "player_002",
  playerName: "测试玩家2",
  config: {
    name: "收集者Charlie",
    personalityType: "collector"
  }
});
console.log(agent3);
```

### 测试3：查看AI信息

```javascript
// 获取玩家1的所有AI
const player1Agents = await convex.query(api.aiworld.mutations.getPlayerAgents, {
  playerId: "player_001"
});
console.log("玩家1的AI:", player1Agents);

// 获取第一个AI的详细信息
const agentDetails = await convex.query(api.aiworld.mutations.getAgentDetails, {
  agentId: player1Agents[0].agentId
});
console.log("AI详情:", agentDetails);
```

### 测试4：查看资源和建筑

```javascript
// 获取所有资源点
const resources = await convex.query(api.aiworld.mutations.getAllResources, {});
console.log("资源点:", resources);

// 获取所有建筑
const buildings = await convex.query(api.aiworld.mutations.getAllBuildings, {});
console.log("建筑:", buildings);
```

### 测试5：测试豆包API（可选）

```javascript
// 直接测试豆包API连接
const testDoubao = async () => {
  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer 75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c',
    },
    body: JSON.stringify({
      model: 'doubao-seed-1-8-251228',
      messages: [
        { role: 'user', content: '你好，请用一句话介绍你自己' }
      ],
    }),
  });
  
  const data = await response.json();
  console.log('豆包响应:', data);
};

testDoubao();
```

## 📊 验证清单

完成部署后，确认以下功能：

- [ ] ✅ Convex开发服务器运行正常
- [ ] ✅ 前端页面可以访问
- [ ] ✅ AI World初始化成功（8个资源点）
- [ ] ✅ 可以创建AI Agent
- [ ] ✅ 可以查看AI的性格、目标、库存
- [ ] ✅ 可以查看资源点位置和数量
- [ ] ✅ 豆包API连接正常（可选测试）

## 🔄 重置世界（如需要）

如果需要清空所有数据重新开始：

```javascript
// 重置世界（删除所有资源、建筑、交易、AI扩展数据）
const resetResult = await convex.mutation(api.aiworld.init.resetWorld, {});
console.log(resetResult);

// 重新初始化
const initResult = await convex.mutation(api.aiworld.init.initializeWorld, {});
console.log(initResult);
```

## 🌐 生产环境部署

### 部署到Vercel

1. 连接GitHub仓库到Vercel
2. 设置环境变量（与 `.env.local` 相同）
3. 部署

### 部署Convex到生产环境

```bash
npx convex deploy
```

这会创建生产环境的Convex部署。

## 📈 监控和日志

### 查看Convex日志

访问 Convex Dashboard：https://dashboard.convex.dev

在 "Logs" 标签页可以看到：
- AI决策日志
- 豆包API调用日志
- 错误信息

### 查看AI决策日志

AI决策会在Convex日志中显示：

```
${agent.name}决策: { action: "collect", target: "wood", reason: "需要木材建造房屋" }
```

### 查看豆包API调用

如果豆包API调用失败，会显示：

```
${agent.name}思考出错: Error: 豆包API调用失败: 401 Unauthorized
```

## 🐛 常见问题

### 问题1：Convex连接失败

**解决方案：**
```bash
# 重新登录
npx convex logout
npx convex login

# 重新部署
npx convex dev
```

### 问题2：Schema更新失败

**解决方案：**
```bash
# 强制推送Schema
npx convex dev --once
```

### 问题3：豆包API 401错误

**解决方案：**
1. 检查 `.env.local` 中的API Key
2. 确认API Key未过期
3. 检查网络连接

### 问题4：AI不执行动作

**解决方案：**
1. 确认AI已创建：`await convex.query(api.aiworld.mutations.getPlayerAgents, { playerId: "xxx" })`
2. 检查AI的目标：查看 `goals` 字段
3. 查看Convex日志中的AI决策记录

## 🔐 安全注意事项

1. **API Key保护**：
   - `.env.local` 已在 `.gitignore` 中
   - 不要将API Key提交到公共仓库
   - 生产环境使用环境变量

2. **Convex权限**：
   - 默认所有mutations和queries都是公开的
   - 如需限制，使用Convex的认证系统

## 📞 获取帮助

如果遇到问题：

1. 查看 `AI_WORLD_README.md` 中的故障排除章节
2. 检查Convex Dashboard的日志
3. 查看GitHub Issues
4. 联系开发者

## 📝 下一步

部署成功后，可以：

1. 创建更多AI Agent测试不同性格
2. 观察AI的自主决策行为
3. 实现前端UI显示资源和建筑
4. 添加实时AI决策可视化
5. 实现玩家交互功能

---

**部署完成！** 🎉

现在你的AI World已经运行，AI Agents会使用豆包1.8模型进行智能决策！
