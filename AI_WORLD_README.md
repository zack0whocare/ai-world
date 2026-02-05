# AI World - AI Town游戏扩展

基于AI Town的完整AI生存和建造沙盒游戏扩展。

## 🎮 项目概述

AI World将AI Town升级为一个完整的多人AI沙盒世界，每个玩家可以创建自己的AI Agent，这些AI会：

- ✅ 自主采集资源（木材、石头、食物、金币）
- ✅ 建造建筑物（房屋、工坊、仓库、市场、瞭望塔）
- ✅ 与其他AI交易资源
- ✅ 根据长期目标做决策
- ✅ 拥有不同的性格特征（建造者、商人、收集者、探险家、帮手）

## 🤖 AI决策系统

**本项目使用字节跳动的豆包(Doubao) 1.8模型进行AI决策，不使用Claude。**

### 豆包模型配置

1. API Key: `75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c`
2. 模型ID: `doubao-seed-1-8-251228`
3. Base URL: `https://ark.cn-beijing.volces.com/api/v3`

配置文件位置：`.env.local`

## 📁 项目结构

```
convex/aiworld/
├── resources.ts         # 资源系统（采集、再生）
├── building.ts          # 建造系统（建筑类型、配方）
├── trading.ts           # 交易系统（交易提议、价值判断）
├── goals.ts             # 目标系统（目标模板、性格生成）
├── player-agents.ts     # 玩家AI创建系统
├── config.ts            # 全局配置
├── llm-config.ts        # 豆包模型配置
├── agent-brain.ts       # AI决策引擎
├── init.ts              # 初始化函数
└── mutations.ts         # Convex mutations和queries
```

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

已在 `.env.local` 中配置好豆包API：

```bash
ARK_API_KEY=75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c
ARK_MODEL=doubao-seed-1-8-251228
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

### 3. 部署到Convex

```bash
npx convex dev
```

### 4. 初始化AI World

在浏览器控制台运行：

```javascript
// 初始化世界（创建资源点）
await convex.mutation(api.aiworld.init.initializeWorld, {});

// 查看世界状态
await convex.query(api.aiworld.init.getWorldStatus, {});
```

### 5. 创建第一个AI Agent

```javascript
// 创建一个建造者AI
const result = await convex.mutation(api.aiworld.mutations.createAgent, {
  playerId: "player_001",
  playerName: "测试玩家",
  config: {
    name: "建造者Alice",
    personalityType: "builder",
    backstory: "一个热爱建造的AI，梦想建立一个繁荣的城镇"
  }
});

console.log(result);
```

### 6. 查看AI详情

```javascript
// 获取玩家的所有AI
const agents = await convex.query(api.aiworld.mutations.getPlayerAgents, {
  playerId: "player_001"
});

console.log(agents);

// 获取AI详细信息
const agentDetails = await convex.query(api.aiworld.mutations.getAgentDetails, {
  agentId: agents[0].agentId
});

console.log(agentDetails);
```

## 🎯 核心功能

### 资源系统

**资源类型：**
- 🌲 木材：采集时间5秒，再生速率0.1/分钟
- 🪨 石头：采集时间8秒，再生速率0.05/分钟
- 🌾 食物：采集时间3秒，再生速率0.2/分钟
- 💰 金币：采集时间15秒，再生速率0.02/分钟

**初始资源点：**
- 3个树木点
- 2个石头点
- 2个农田点
- 1个金矿点

### 建造系统

**建筑类型：**

| 建筑 | 图标 | 成本 | 效果 |
|------|------|------|------|
| 房屋 | 🏠 | 木材10, 石头5 | 声望+10 |
| 工坊 | 🔨 | 木材15, 石头10, 金币2 | 采集速度+20% |
| 仓库 | 📦 | 木材20, 石头15 | 背包容量+50 |
| 市场 | 🏪 | 木材25, 石头20, 金币5 | 启用交易功能 |
| 瞭望塔 | 🗼 | 木材30, 石头40, 金币10 | 视野范围+5格 |

### 性格系统

**5种性格类型：**

1. **建造者 (Builder)**
   - 特征：勤劳、有远见、专注
   - 目标：建造建筑、收集资源、积累财富
   - 风险容忍度：0.4
   - 社交性：0.5

2. **商人 (Trader)**
   - 特征：精明、善于交际、冒险
   - 目标：成为贸易专家、积累财富、帮助社区
   - 风险容忍度：0.7
   - 社交性：0.8

3. **收集者 (Collector)**
   - 特征：耐心、细致、节俭
   - 目标：收集资源、积累财富、建造建筑
   - 风险容忍度：0.3
   - 社交性：0.4

4. **探险家 (Explorer)**
   - 特征：好奇、勇敢、独立
   - 目标：探索世界、收集资源、帮助社区
   - 风险容忍度：0.8
   - 社交性：0.6

5. **帮手 (Helper)**
   - 特征：友善、慷慨、外向
   - 目标：帮助社区、成为贸易专家、探索世界
   - 风险容忍度：0.5
   - 社交性：0.9

### 目标系统

**6种目标类型：**

1. **资源收集者**：收集50木材 + 30石头
2. **建筑大师**：建造房屋 + 工坊
3. **财富积累**：积累20金币
4. **贸易专家**：完成10次交易
5. **探险家**：访问15个不同位置
6. **社区帮手**：赠送资源5次 + 完成5次公平交易

### 交易系统

**交易价值计算：**
- 木材：1点
- 石头：1.5点
- 食物：0.8点
- 金币：5点

**公平交易判定：**
- 价值比率在0.6-1.7之间视为公平交易
- 交易有效期：5分钟

## 🧠 AI决策流程

1. **环境感知**：获取附近资源、其他AI、当前库存
2. **目标评估**：根据性格和目标优先级排序
3. **豆包决策**：调用豆包1.8模型生成决策
4. **降级处理**：如果API失败，使用规则引擎
5. **执行动作**：采集、建造、交易、探索或休息

### 豆包API调用示例

```typescript
// 生成决策提示词
const prompt = generateAgentDecisionPrompt(
  agentName,
  personality,
  inventory,
  goals,
  nearbyResources,
  nearbyAgents
);

// 调用豆包API
const response = await callDoubaoAPI(prompt);

// 解析决策
const decision = JSON.parse(response);
// { action: "collect", target: "wood", reason: "需要木材建造房屋" }
```

## 📊 数据库Schema

### resources 表
```typescript
{
  id: string,
  type: 'wood' | 'stone' | 'food' | 'gold',
  position: { x: number, y: number },
  amount: number,
  maxAmount: number,
  regenerateRate: number,
  lastRegenerate: number
}
```

### buildings 表
```typescript
{
  id: string,
  type: 'house' | 'workshop' | 'storage' | 'market' | 'tower',
  position: { x: number, y: number },
  ownerId: string,
  ownerName: string,
  builtAt: number,
  level: number,
  health: number,
  maxHealth: number
}
```

### agentExtensions 表
```typescript
{
  agentId: string,
  playerId: string,
  playerName: string,
  inventory: { wood, stone, food, gold },
  goals: Goal[],
  personality: AgentPersonality,
  prestige: number,
  level: number,
  experience: number,
  stats: AgentStats
}
```

### tradeOffers 表
```typescript
{
  id: string,
  fromAgentId: string,
  toAgentId: string,
  offering: Partial<Inventory>,
  requesting: Partial<Inventory>,
  status: 'pending' | 'accepted' | 'rejected' | 'expired',
  createdAt: number,
  expiresAt: number
}
```

## 🔧 配置选项

在 `convex/aiworld/config.ts` 中可以调整：

```typescript
export const WORLD_CONFIG = {
  resourceRegenMultiplier: 1.0,    // 资源再生速度倍率
  agentThinkInterval: 30000,       // AI决策频率(毫秒)
  maxAgentsPerPlayer: 3,           // 每个玩家最多AI数量
  tradeExpirationTime: 300000,     // 交易过期时间(5分钟)
  buildingMinDistance: 3,          // 建筑最小间距
  experienceMultiplier: 1.0,       // 经验值倍率
  debug: false,                    // 调试模式
};
```

## 💰 成本估算（豆包模型）

**豆包1.8 (doubao-seed-1-8-251228) 价格：**
- 输入：约¥0.0005/千tokens
- 输出：约¥0.002/千tokens

**每次AI思考：**
- 输入约500 tokens
- 输出约200 tokens
- 成本约：¥0.0005-0.001/次

**50个AI，30秒思考一次：**
- 每天调用：50 × (24×60×60/30) = 144,000次
- 每天成本：¥72-144
- 每月成本：¥2,160-4,320

## 🧪 测试命令

```javascript
// 1. 初始化世界
await convex.mutation(api.aiworld.init.initializeWorld, {});

// 2. 查看世界状态
await convex.query(api.aiworld.init.getWorldStatus, {});

// 3. 创建测试AI
await convex.mutation(api.aiworld.mutations.createAgent, {
  playerId: "test_player",
  playerName: "测试玩家",
  config: {
    name: "建造者Bob",
    personalityType: "builder"
  }
});

// 4. 获取所有资源
await convex.query(api.aiworld.mutations.getAllResources, {});

// 5. 获取所有建筑
await convex.query(api.aiworld.mutations.getAllBuildings, {});

// 6. 重置世界（清空所有数据）
await convex.mutation(api.aiworld.init.resetWorld, {});
```

## 📝 技术栈

- **前端**：React + TypeScript + Vite + TailwindCSS
- **后端**：Convex (实时数据库)
- **AI模型**：豆包(Doubao) 1.8 - doubao-seed-1-8-251228
- **基础框架**：AI Town (a16z-infra)

## 🔒 重要说明

1. ✅ 本项目使用**豆包(Doubao)模型**，不使用Claude
2. ✅ 豆包API Key已配置在 `.env.local` 中
3. ✅ 所有AI决策都通过豆包API实现
4. ✅ 如果豆包API失败，会降级到规则引擎

## 📚 文件清单

### 核心系统文件
- ✅ `convex/aiworld/resources.ts` - 资源系统
- ✅ `convex/aiworld/building.ts` - 建造系统
- ✅ `convex/aiworld/trading.ts` - 交易系统
- ✅ `convex/aiworld/goals.ts` - 目标系统
- ✅ `convex/aiworld/player-agents.ts` - 玩家AI系统
- ✅ `convex/aiworld/config.ts` - 配置文件

### AI决策文件
- ✅ `convex/aiworld/llm-config.ts` - 豆包模型配置
- ✅ `convex/aiworld/agent-brain.ts` - AI决策引擎

### 数据库文件
- ✅ `convex/schema.ts` - 数据库Schema（已添加AI World表）
- ✅ `convex/aiworld/init.ts` - 初始化函数
- ✅ `convex/aiworld/mutations.ts` - Mutations和Queries

### 配置文件
- ✅ `.env.local` - 豆包API配置
- ✅ `.env.local.example` - 配置模板

## 🎉 预期结果

完成后，系统应该能：

- ✅ 在地图上显示资源点
- ✅ AI自主移动到资源点采集
- ✅ AI积累资源后建造建筑
- ✅ AI之间自主交易
- ✅ 玩家可以创建自定义AI
- ✅ 查看AI的库存、建筑、目标进度

## 🐛 故障排除

### 问题1：豆包API调用失败

**解决方案：**
1. 检查 `.env.local` 中的API Key是否正确
2. 确认网络可以访问 `https://ark.cn-beijing.volces.com`
3. 查看Convex日志中的错误信息
4. 系统会自动降级到规则引擎

### 问题2：初始化失败

**解决方案：**
1. 确保Convex已正确部署
2. 运行 `npx convex dev` 启动开发服务器
3. 检查Schema是否正确更新

### 问题3：AI不做决策

**解决方案：**
1. 检查AI的目标是否正确设置
2. 查看豆包API是否正常响应
3. 检查 `agentThinkInterval` 配置

## 📞 联系方式

如有问题，请查看：
- AI Town原项目：https://github.com/a16z-infra/ai-town
- Convex文档：https://docs.convex.dev
- 豆包API文档：https://console.volcengine.com/ark

---

**创建日期：** 2026年2月5日  
**版本：** 1.0.0  
**AI模型：** 豆包(Doubao) 1.8 - doubao-seed-1-8-251228
