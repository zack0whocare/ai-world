# 🤖 豆包 AI 集成指南

## ✅ 已完成的工作

### 1. 核心模块

**doubao_client.ts** - 豆包 API 客户端
- ✅ API 调用封装（支持超时控制）
- ✅ 响应解析（支持 JSON 和纯文本）
- ✅ 错误处理和重试机制
- ✅ 连接测试功能

**ai_prompts.ts** - 智能提示词系统
- ✅ 5种性格详细描述（采集者、建造者、商人、探险家、守卫者）
- ✅ 动态生成决策提示词
- ✅ 交易决策提示词
- ✅ 上下文感知（周边资源、建筑、智能体）

**ai_brain.ts** - AI 决策大脑
- ✅ 混合决策系统（AI 优先，规则后备）
- ✅ 自动回退机制
- ✅ 批量决策执行
- ✅ 详细日志输出

### 2. 前端集成

**AIWorldDashboard.tsx**
- ✅ 更新为调用新的 AI 决策 API
- ✅ 自动运行模式（每5秒执行一次）
- ✅ 手动触发 AI 决策按钮

---

## 🎯 如何测试

### 方法 1：通过 Dashboard（推荐）

1. **访问 Dashboard**
   ```
   https://ai-world-smoky.vercel.app/?aiworld
   ```

2. **初始化世界**
   - 点击 "Initialize World" 按钮
   - 等待创建8个资源点

3. **创建智能体**
   - 点击不同性格按钮创建智能体：
     - 采集者（Gatherer）
     - 建造者（Builder）
     - 商人（Trader）
     - 探险家（Explorer）
     - 守卫者（Defender）

4. **启动 AI 决策**
   - **手动模式**：点击 "🤖 Run AI Decisions (Doubao)" 按钮
   - **自动模式**：点击 "Start Auto-Run" 按钮（每5秒自动执行）

5. **观察结果**
   - 查看浏览器控制台（F12）
   - 观察智能体的资源变化
   - 查看建筑的建造情况

---

### 方法 2：通过浏览器控制台

打开 https://ai-world-smoky.vercel.app/?aiworld，按 F12 打开控制台：

```javascript
// 获取 Convex 客户端
const convex = window.convex;

// 1. 重置世界
await convex.mutation(api.aiworld.init.resetWorld, {});

// 2. 初始化世界
await convex.mutation(api.aiworld.init.initializeWorld, {});

// 3. 创建采集者
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "AI采集者",
  personality: "gatherer",
  position: { x: 10, y: 10 }
});

// 4. 创建建造者
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "AI建造者",
  personality: "builder",
  position: { x: 20, y: 20 }
});

// 5. 执行 AI 决策（使用豆包 AI）
const result = await convex.mutation(api.aiworld.ai_brain.runAllAIDecisions, {
  useAI: true
});

console.log("AI 决策结果:", result);

// 6. 查看智能体状态
const agents = await convex.query(api.aiworld.mutations.getAllAgents, {});
console.log("智能体列表:", agents);
```

---

## 🔍 查看 AI 决策日志

### 在浏览器控制台中查看

AI 决策系统会输出详细日志：

```
🤖 AI采集者 正在使用豆包 AI 思考...
💭 AI采集者 AI 响应: {"action":"gather","target":"wood","reason":"作为采集者，优先采集木材资源"}
✅ AI采集者 AI 决策: {action: "gather", target: "wood", reason: "作为采集者，优先采集木材资源"}
```

### 日志说明

- 🤖 = 开始 AI 思考
- 💭 = AI 原始响应
- ✅ = AI 决策成功
- ❌ = AI 决策失败
- 🔄 = 回退到规则引擎

---

## 🎮 不同性格的预期行为

### 采集者（Gatherer）
- **优先行为**：采集资源
- **AI 特点**：会选择稀缺资源优先采集
- **预期决策**：gather → wood/stone/food/gold

### 建造者（Builder）
- **优先行为**：建造建筑
- **AI 特点**：会先采集资源，资源足够后建造
- **预期决策**：gather（资源不足）→ build（资源充足）

### 商人（Trader）
- **优先行为**：交易
- **AI 特点**：会囤积热门商品，寻找交易机会
- **预期决策**：gather → trade（如果有其他智能体）

### 探险家（Explorer）
- **优先行为**：探索
- **AI 特点**：喜欢四处游荡，偶尔采集
- **预期决策**：explore → gather（偶尔）

### 守卫者（Defender）
- **优先行为**：建造防御建筑
- **AI 特点**：优先建造瞭望塔，保护家园
- **预期决策**：gather → build watchtower

---

## 🔧 AI 配置说明

### 豆包 API 配置

在 `convex/aiworld/doubao_client.ts` 中：

```typescript
export const DOUBAO_CONFIG = {
  apiKey: "75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c",
  baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
  model: "doubao-seed-1-8-251228",
  temperature: 0.8,  // 创造性（0-1）
  maxTokens: 1500,   // 最大输出长度
  topP: 0.9,         // 采样参数
  timeout: 15000,    // 超时时间（毫秒）
};
```

### 调整 AI 行为

**提高创造性**：增加 `temperature`（0.8-1.0）
**提高稳定性**：降低 `temperature`（0.5-0.7）
**加快响应**：减少 `maxTokens`（500-1000）
**提高质量**：增加 `maxTokens`（1500-2000）

---

## 🐛 故障排查

### 问题 1：AI 决策失败

**症状**：控制台显示 "❌ AI 决策失败"

**可能原因**：
1. 豆包 API 连接超时
2. API Key 无效
3. 网络问题

**解决方案**：
- 检查网络连接
- 系统会自动回退到规则引擎
- 查看详细错误信息

### 问题 2：所有智能体都使用规则引擎

**症状**：日志显示 "🔄 回退到规则引擎"

**可能原因**：
1. 豆包 API 不可用
2. 超时设置太短
3. 请求频率过高

**解决方案**：
- 增加超时时间（`timeout: 30000`）
- 减少并发请求
- 检查 API 配额

### 问题 3：AI 响应解析失败

**症状**：决策结果为 `{action: "wait", reason: "解析失败"}`

**可能原因**：
1. AI 返回格式不符合预期
2. JSON 解析错误

**解决方案**：
- 查看原始 AI 响应（💭 日志）
- 优化提示词
- 使用更严格的 JSON 格式要求

---

## 📊 性能优化建议

### 1. 调整决策频率

当前：每5秒执行一次

```typescript
// 在 AIWorldDashboard.tsx 中
const interval = setInterval(() => {
  runAllDecisions({ useAI: true });
}, 5000); // 改为 10000 = 10秒
```

### 2. 批量处理

当前已实现批量决策（`runAllAIDecisions`）

### 3. 缓存决策

未来可以添加决策缓存：
- 相似情况使用缓存结果
- 缓存有效期：1-2分钟

---

## 🎉 成功标志

当你看到以下情况，说明 AI 系统正常工作：

✅ 控制台显示 "🤖 正在使用豆包 AI 思考..."
✅ 控制台显示 "✅ AI 决策: {action: ...}"
✅ 智能体的资源在变化
✅ 建筑被建造出来
✅ 不同性格的智能体表现出不同行为

---

## 📝 下一步计划

1. **优化提示词**：让 AI 决策更智能
2. **添加记忆系统**：智能体记住过去的决策
3. **智能体对话**：智能体之间可以交流
4. **目标系统**：AI 根据长期目标做决策
5. **性能监控**：统计 AI 调用成功率和响应时间

---

## 🚀 开始体验

访问 https://ai-world-smoky.vercel.app/?aiworld

创建几个不同性格的智能体，启动自动运行，观察它们的智能行为！

每个智能体都由豆包 1.8 AI 模型驱动，会根据自己的性格、周围环境、资源状态做出独特的决策。

**这就是真正的 AI World！** 🌍🤖
