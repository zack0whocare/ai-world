# AI World 完整测试指南

## 访问 AI World Dashboard

访问以下任一URL:
- https://ai-world-smoky.vercel.app/?aiworld
- https://ai-world-smoky.vercel.app/aiworld

## 功能测试步骤

### 1. 初始化世界

```javascript
// 打开浏览器控制台 (F12)
await convex.mutation(api.aiworld.init.initializeWorld, {})
```

**预期结果**: 创建8个资源点（木材、石头、食物、金币各2个）

---

### 2. 创建多个不同性格的智能体

#### 方式A: 使用Dashboard界面
点击 "Create AI Agents" 区域的按钮创建不同性格的智能体

#### 方式B: 使用控制台

```javascript
// 创建采集者
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "采集者小红",
  personality: "gatherer",
  position: { x: 10, y: 10 }
})

// 创建建造者
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "建造者小明",
  personality: "builder",
  position: { x: 15, y: 15 }
})

// 创建商人
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "商人老王",
  personality: "trader",
  position: { x: 20, y: 20 }
})

// 创建探险家
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "探险家小李",
  personality: "explorer",
  position: { x: 25, y: 25 }
})

// 创建守卫者
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "守卫者小张",
  personality: "defender",
  position: { x: 30, y: 30 }
})
```

**预期结果**: 每个智能体创建成功，显示在Dashboard的"AI Agents"列表中

---

### 3. 测试交易系统

```javascript
// 获取所有智能体
const agents = await convex.query(api.aiworld.mutations.getAllAgents, {})

// 获取两个智能体的ID
const agent1Id = agents[0].agentId
const agent2Id = agents[1].agentId

// 创建交易提议：用20木材换5金币
await convex.mutation(api.aiworld.trade_mutations.createTrade, {
  fromAgentId: agent1Id,
  toAgentId: agent2Id,
  offering: { wood: 20 },
  requesting: { gold: 5 },
  message: "用木材换金币"
})

// 查看待处理的交易
const pendingTrades = await convex.query(api.aiworld.trade_mutations.getPendingTrades, {})
console.log("待处理交易:", pendingTrades)

// 接受交易
const tradeId = pendingTrades[0]._id
await convex.mutation(api.aiworld.trade_mutations.acceptTrade, {
  tradeId: tradeId
})

// 查看智能体的交易历史
await convex.query(api.aiworld.trade_mutations.getAgentTrades, {
  agentId: agent1Id
})
```

**预期结果**: 
- 交易提议创建成功
- 交易显示在"Pending Trades"列表中
- 接受交易后，双方库存更新
- 交易状态变为"completed"

---

### 4. 测试AI自动决策

```javascript
// 单个智能体执行决策
const agents = await convex.query(api.aiworld.mutations.getAllAgents, {})
const agentId = agents[0].agentId

await convex.mutation(api.aiworld.ai_decisions.executeDecision, {
  agentId: agentId
})

// 所有智能体执行决策
await convex.mutation(api.aiworld.ai_decisions.runAllAgentDecisions, {})
```

**预期结果**:
- 采集者会自动采集资源
- 建造者会在资源足够时建造建筑
- 商人会尝试发起交易
- 探险家会移动到新位置
- 守卫者会保护建筑

---

### 5. 启用自动运行模式

#### 方式A: 使用Dashboard界面
点击 "Start Auto-Run" 按钮

**预期结果**: 
- 每5秒自动执行所有智能体的决策
- 可以看到资源、库存、建筑实时变化
- 点击 "Stop Auto-Run" 停止自动运行

#### 方式B: 使用控制台定时器

```javascript
// 启动自动运行
const autoRun = setInterval(async () => {
  const result = await convex.mutation(api.aiworld.ai_decisions.runAllAgentDecisions, {})
  console.log("AI决策结果:", result)
}, 5000)

// 停止自动运行
clearInterval(autoRun)
```

---

### 6. 查看完整状态

```javascript
// 查看所有智能体
const agents = await convex.query(api.aiworld.mutations.getAllAgents, {})
console.log("智能体数量:", agents.length)
console.log("智能体详情:", agents)

// 查看所有资源
const resources = await convex.query(api.aiworld.mutations.getAllResources, {})
console.log("资源点数量:", resources.length)
console.log("资源详情:", resources)

// 查看所有建筑
const buildings = await convex.query(api.aiworld.mutations.getAllBuildings, {})
console.log("建筑数量:", buildings.length)
console.log("建筑详情:", buildings)

// 查看所有交易
const pendingTrades = await convex.query(api.aiworld.trade_mutations.getPendingTrades, {})
console.log("待处理交易:", pendingTrades.length)
```

---

## Dashboard功能说明

### Control Panel
- **Initialize World**: 初始化世界，创建资源点
- **Start/Stop Auto-Run**: 启动/停止AI自动决策（每5秒运行一次）
- **Run All AI Decisions**: 手动触发所有智能体执行一次决策

### Create AI Agents
点击不同性格按钮创建智能体：
- **Gatherer**: 采集者 - 优先采集资源
- **Builder**: 建造者 - 优先建造建筑
- **Trader**: 商人 - 优先进行交易
- **Explorer**: 探险家 - 优先探索新区域
- **Defender**: 守卫者 - 优先保护建筑

### AI Agents 列表
显示所有智能体的：
- 名称和性格
- 资源库存（木材、石头、食物、金币）
- 当前位置
- 点击可选中智能体

### Resources 列表
显示所有资源点的：
- 资源类型
- 当前数量/最大数量
- 位置坐标
- 资源量进度条

### Buildings 列表
显示所有建筑的：
- 建筑类型
- 等级
- 所有者
- 健康度
- 位置坐标

### Pending Trades 列表
显示待处理的交易：
- 发起者和接收者
- 提供的资源
- 请求的资源

---

## 性格特点说明

### Gatherer (采集者)
- **行为**: 优先寻找并采集资源
- **决策逻辑**: 选择最近的可用资源点进行采集
- **适合**: 快速积累资源

### Builder (建造者)
- **行为**: 优先建造建筑
- **决策逻辑**: 资源足够时建造房屋，不足时先采集
- **建造成本**:
  - House (房屋): 20木材 + 10石头
  - Workshop (工坊): 30木材 + 20石头 + 5金币
  - Warehouse (仓库): 40木材 + 30石头
  - Market (市场): 25木材 + 15石头 + 10金币
  - Watchtower (瞭望塔): 15木材 + 25石头 + 5金币

### Trader (商人)
- **行为**: 优先寻找交易机会
- **决策逻辑**: 金币少于10时，尝试用其他资源换金币
- **交易策略**: 寻找有金币的智能体，用20木材换5金币

### Explorer (探险家)
- **行为**: 探索新区域
- **决策逻辑**: 随机移动到新位置
- **移动范围**: 每次移动±5单位

### Defender (守卫者)
- **行为**: 保护建筑
- **决策逻辑**: 有建筑时守卫，无建筑时先建造
- **防御策略**: 优先保护自己的建筑

---

## 预期观察结果

运行自动模式后，你应该能看到：

1. **资源变化**: 资源点的数量逐渐减少（被采集）
2. **库存增长**: 智能体的资源库存增加
3. **建筑出现**: 建造者创建新建筑
4. **交易发生**: 商人发起交易提议
5. **位置变化**: 探险家移动到新位置
6. **统计更新**: 智能体的统计数据（采集量、建造数、交易数）更新

---

## 故障排除

### 如果看不到Dashboard
1. 确保访问URL包含 `?aiworld` 或路径为 `/aiworld`
2. 强制刷新页面 (Ctrl+Shift+R)
3. 检查浏览器控制台是否有错误

### 如果API调用失败
1. 检查 Convex 部署状态
2. 确认环境变量配置正确
3. 查看浏览器控制台的错误信息

### 如果自动运行不工作
1. 确保已经初始化世界
2. 确保已经创建智能体
3. 检查是否有足够的资源可采集

---

## 下一步扩展

可以继续添加的功能：
1. **地图可视化**: 在2D画布上显示智能体、资源、建筑的位置
2. **实时聊天**: 智能体之间的对话系统
3. **任务系统**: 为智能体分配特定任务
4. **成就系统**: 记录智能体的里程碑
5. **数据分析**: 可视化智能体的行为数据和统计
6. **多玩家模式**: 允许多个玩家控制不同的智能体
