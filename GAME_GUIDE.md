# 🎮 AI World 游戏界面使用指南

## 🌍 欢迎来到 AI World！

AI World 是一个由**豆包 AI 驱动**的自主智能体虚拟世界。在这里，AI 智能体会根据自己的性格、资源状态和周围环境，自主做出决策并执行行动。

---

## 🚀 快速开始

### 1. 访问游戏界面

**游戏 URL**: https://ai-world-smoky.vercel.app/?game

**Dashboard URL**: https://ai-world-smoky.vercel.app/?aiworld

---

### 2. 初始化世界

在浏览器控制台（按 F12）执行：

```javascript
// 重置世界
await convex.mutation(api.aiworld.init.resetWorld, {})

// 初始化世界（创建资源点）
await convex.mutation(api.aiworld.init.initializeWorld, {})
```

---

### 3. 创建智能体

在控制台执行以下命令创建不同性格的智能体：

```javascript
// 创建采集者
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "采集者小明",
  personality: "gatherer",
  position: { x: 5, y: 5 }
})

// 创建建造者
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "建造者小红",
  personality: "builder",
  position: { x: 10, y: 10 }
})

// 创建商人
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "商人小李",
  personality: "merchant",
  position: { x: 15, y: 5 }
})

// 创建探险家
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "探险家小张",
  personality: "explorer",
  position: { x: 8, y: 12 }
})

// 创建社交家
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "社交家小王",
  personality: "social",
  position: { x: 12, y: 8 }
})
```

---

### 4. 开始游戏

点击游戏界面上的 **"▶️ 开始"** 按钮，AI 智能体将开始自主行动！

---

## 🎯 游戏界面说明

### 主游戏画面

- **地图**: 800x600 像素的 2D 网格世界
- **智能体**: 用 emoji 图标表示，会在地图上移动和行动
- **资源点**: 🌲 木材、🪨 石头、🌾 食物、💰 金币
- **建筑**: 🏠 房屋、🏭 仓库、🏪 市场、🗼 瞭望塔

### 智能体性格图标

- 👷 **采集者 (gatherer)**: 专注于收集资源
- 👨‍🔧 **建造者 (builder)**: 喜欢建造建筑
- 👨‍💼 **商人 (merchant)**: 擅长交易和积累财富
- 🧭 **探险家 (explorer)**: 喜欢探索未知区域
- 👥 **社交家 (social)**: 喜欢与其他智能体互动

### 侧边栏

**智能体信息**：
- 点击地图上的智能体查看详细信息
- 显示名字、性格、库存等

**活动日志**：
- 实时显示智能体的行动
- AI 决策的理由
- 系统事件

**统计信息**：
- 智能体数量
- 资源点数量
- 建筑数量

---

## 🤖 AI 决策系统

### 自动运行

点击 **"▶️ 开始"** 按钮后：
- 每 8 秒执行一次 AI 决策
- 所有智能体会根据豆包 AI 的建议行动
- 活动日志会显示每个智能体的决策和理由

### 手动执行

在控制台执行：

```javascript
// 执行一次 AI 决策
const result = await convex.action(api.aiworld.ai_decision_action.runAllAIDecisionsAction, {
  useAI: true
})

// 查看结果
console.log("使用 AI 的数量:", result.aiCount)
console.log("成功数量:", result.successCount)

// 查看详细日志
result.results.forEach(r => {
  console.log(`${r.agentName}:`, r.decision)
  r.debugLogs.forEach(log => console.log(log))
})
```

---

## 🎮 游戏机制

### 资源系统

每个智能体有 4 种资源：
- 🌲 **木材 (wood)**: 用于建造
- 🪨 **石头 (stone)**: 用于建造
- 🌾 **食物 (food)**: 维持生存
- 💰 **金币 (gold)**: 用于交易

### 行动类型

智能体可以执行以下行动：

1. **采集 (gather)**: 从资源点采集资源
2. **建造 (build)**: 消耗资源建造建筑
3. **探索 (explore)**: 探索新区域
4. **交易 (trade)**: 与其他智能体交易
5. **等待 (wait)**: 暂时不行动

### AI 决策过程

1. **感知环境**: 获取周围的资源、建筑、其他智能体
2. **生成提示词**: 根据性格和状态生成决策提示
3. **调用豆包 AI**: 获取智能决策
4. **执行行动**: 根据 AI 建议执行具体操作
5. **更新状态**: 更新库存、位置等信息

---

## 🎨 性格特点

### 👷 采集者 (Gatherer)
- **特点**: 勤劳、对资源有敏锐的嗅觉
- **行为**: 优先采集稀缺资源，喜欢积累财富
- **目标**: 成为最富有的智能体

### 👨‍🔧 建造者 (Builder)
- **特点**: 富有远见、善于规划
- **行为**: 先采集资源再建造，追求建筑的多样性
- **目标**: 建立繁荣的城镇

### 👨‍💼 商人 (Merchant)
- **特点**: 精明、善于交易
- **行为**: 低买高卖，寻找交易机会
- **目标**: 通过交易积累财富

### 🧭 探险家 (Explorer)
- **特点**: 好奇、勇敢
- **行为**: 探索未知区域，寻找新资源
- **目标**: 发现所有秘密

### 👥 社交家 (Social)
- **特点**: 友善、善于沟通
- **行为**: 与其他智能体互动，促进合作
- **目标**: 建立和谐的社区

---

## 🔧 高级功能

### 查看所有智能体

```javascript
const agents = await convex.query(api.aiworld.mutations.getAllAgents, {})
console.log(agents)
```

### 查看所有资源点

```javascript
const resources = await convex.query(api.aiworld.mutations.getAllResources, {})
console.log(resources)
```

### 查看所有建筑

```javascript
const buildings = await convex.query(api.aiworld.mutations.getAllBuildings, {})
console.log(buildings)
```

### 手动采集资源

```javascript
await convex.mutation(api.aiworld.mutations.gatherResource, {
  agentId: "agent_xxx",
  resourceId: "md_xxx"
})
```

### 手动建造建筑

```javascript
await convex.mutation(api.aiworld.mutations.buildStructure, {
  agentId: "agent_xxx",
  buildingType: "house",
  position: { x: 10, y: 10 }
})
```

---

## 🎯 推荐场景

### 场景 1：资源竞争
创建 3 个采集者，观察它们如何竞争有限的资源。

### 场景 2：城镇建设
创建 2 个建造者 + 2 个采集者，看它们如何协作建造城镇。

### 场景 3：混合社区
创建所有 5 种性格各 1 个，观察完整的生态系统。

### 场景 4：探险队
创建 1 个探险家 + 2 个采集者 + 1 个建造者，模拟探险和定居。

---

## 🐛 故障排除

### 问题 1：智能体不动
- 检查是否点击了"开始"按钮
- 查看控制台是否有错误
- 确认豆包 API 是否正常

### 问题 2：AI 决策失败
- 查看活动日志中的错误信息
- 检查 Convex Dashboard 的服务器日志
- 确认网络连接正常

### 问题 3：资源点耗尽
- 重新初始化世界：`await convex.mutation(api.aiworld.init.initializeWorld, {})`

---

## 📚 相关文档

- **AI_WORLD_COMPLETE.md** - 项目完整总结
- **AI_INTEGRATION_GUIDE.md** - AI 集成详细指南
- **README_AIWORLD.md** - 系统概述

---

## 🎉 享受 AI World！

这是一个真正由 AI 驱动的虚拟世界，每个智能体都有自己的"思想"和"目标"。

观察它们如何互动、竞争、合作，享受这个独特的 AI 社会实验！🌍🤖✨
