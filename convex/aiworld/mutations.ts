/**
 * AI World Mutations - 玩家操作和AI管理
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * 创建AI智能体 - 简化版本
 */
export const createAgent = mutation({
  args: {
    name: v.string(),
    personality: v.string(), // "builder" | "merchant" | "collector" | "explorer" | "helper"
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    console.log(`🤖 创建AI Agent: ${args.name} (${args.personality})`);
    
    // 生成唯一ID
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 根据性格类型生成目标
    const goals = generateGoalsForPersonality(args.personality as any);
    
    // 创建性格数据
    const personality = {
      archetype: args.personality,
      traits: getPersonalityTraits(args.personality),
      preferences: getPersonalityPreferences(args.personality),
    };
    
    // 创建初始库存
    const inventory = {
      wood: 10,
      stone: 10,
      food: 20,
      gold: 5,
    };
    
    // 保存到数据库
    const agentExtensionId = await ctx.db.insert("agentExtensions", {
      agentId: agentId,
      playerId: "system", // 系统创建的Agent
      playerName: "AI World",
      name: args.name,
      position: args.position,
      inventory: inventory,
      goals: goals,
      personality: personality,
      prestige: 0,
      level: 1,
      experience: 0,
      stats: {
        resourcesGathered: 0,
        buildingsBuilt: 0,
        tradesCompleted: 0,
        goalsCompleted: 0,
      },
    });
    
    console.log(`✅ AI Agent创建成功: ${args.name} (${args.personality})`);
    
    return {
      success: true,
      message: `AI智能体 "${args.name}" 创建成功！`,
      agent: {
        id: agentId,
        name: args.name,
        personality: personality,
        goals: goals,
        inventory: inventory,
        position: args.position,
      },
    };
  },
});

/**
 * 获取性格特质
 */
function getPersonalityTraits(personalityType: string): string[] {
  const traitsMap: Record<string, string[]> = {
    builder: ["勤劳", "有条理", "注重效率", "喜欢规划"],
    merchant: ["精明", "善于交际", "追求利润", "机会主义"],
    collector: ["谨慎", "节俭", "注重积累", "有耐心"],
    explorer: ["好奇", "冒险", "灵活", "独立"],
    helper: ["友善", "慷慨", "合作", "利他"],
  };
  return traitsMap[personalityType] || ["平衡"];
}

/**
 * 获取性格偏好
 */
function getPersonalityPreferences(personalityType: string): Record<string, number> {
  const preferencesMap: Record<string, Record<string, number>> = {
    builder: { building: 0.8, gathering: 0.5, trading: 0.3, exploring: 0.2 },
    merchant: { trading: 0.9, gathering: 0.4, building: 0.3, exploring: 0.5 },
    collector: { gathering: 0.9, building: 0.4, trading: 0.2, exploring: 0.3 },
    explorer: { exploring: 0.9, gathering: 0.6, trading: 0.4, building: 0.2 },
    helper: { trading: 0.7, building: 0.6, gathering: 0.5, exploring: 0.4 },
  };
  return preferencesMap[personalityType] || { building: 0.5, gathering: 0.5, trading: 0.5, exploring: 0.5 };
}

/**
 * 根据性格生成目标
 */
function generateGoalsForPersonality(personalityType: string): Array<{
  id: string;
  type: string;
  description: string;
  target: number;
  progress: number;
  priority: number;
  reward: { prestige: number; experience: number };
}> {
  const goalTemplates: Record<string, any[]> = {
    builder: [
      { type: "build", description: "建造3座房屋", target: 3, priority: 0.9 },
      { type: "gather", description: "收集100木材", target: 100, priority: 0.7 },
    ],
    merchant: [
      { type: "trade", description: "完成10次交易", target: 10, priority: 0.9 },
      { type: "wealth", description: "积累100金币", target: 100, priority: 0.8 },
    ],
    collector: [
      { type: "gather", description: "收集200资源", target: 200, priority: 0.9 },
      { type: "store", description: "建造2座仓库", target: 2, priority: 0.7 },
    ],
    explorer: [
      { type: "explore", description: "探索10个资源点", target: 10, priority: 0.9 },
      { type: "discover", description: "发现5个新位置", target: 5, priority: 0.8 },
    ],
    helper: [
      { type: "trade", description: "帮助他人完成5次交易", target: 5, priority: 0.8 },
      { type: "build", description: "建造公共建筑", target: 2, priority: 0.7 },
    ],
  };
  
  const templates = goalTemplates[personalityType] || goalTemplates.builder;
  
  return templates.map((template, index) => ({
    id: `goal_${Date.now()}_${index}`,
    type: template.type,
    description: template.description,
    target: template.target,
    progress: 0,
    priority: template.priority,
    reward: {
      prestige: Math.floor(template.target * 0.5),
      experience: Math.floor(template.target * 2),
    },
  }));
}

/**
 * 获取所有AI智能体
 */
export const getAllAgents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agentExtensions").collect();
  },
});

/**
 * 获取特定玩家的AI智能体
 */
export const getPlayerAgents = query({
  args: {
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("agentExtensions")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    
    return agents;
  },
});

/**
 * 获取AI智能体详情
 */
export const getAgentDetails = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agentExtensions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();
    
    if (!agent) {
      return null;
    }
    
    // 获取该Agent的建筑
    const buildings = await ctx.db
      .query("buildings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.agentId))
      .collect();
    
    return {
      ...agent,
      buildings,
    };
  },
});

/**
 * 获取所有资源点
 */
export const getAllResources = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("resources").collect();
  },
});

/**
 * 获取所有建筑
 */
export const getAllBuildings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("buildings").collect();
  },
});

/**
 * AI智能体采集资源
 */
export const gatherResource = mutation({
  args: {
    agentId: v.string(),
    resourceId: v.id("resources"),
  },
  handler: async (ctx, args) => {
    // 获取智能体
    const agent = await ctx.db
      .query("agentExtensions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();
    
    if (!agent) {
      return { success: false, error: "智能体不存在" };
    }
    
    // 获取资源点
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) {
      return { success: false, error: "资源点不存在" };
    }
    
    const amount = resource.amount as number;
    const type = resource.type as string;
    
    if (amount <= 0) {
      return { success: false, error: "资源已耗尽" };
    }
    
    // 采集资源
    const gatherAmount = Math.min(10, amount);
    const newInventory = { ...agent.inventory } as any;
    newInventory[type] += gatherAmount;
    
    // 更新智能体库存
    await ctx.db.patch(agent._id, {
      inventory: newInventory,
      stats: {
        ...agent.stats,
        resourcesGathered: agent.stats.resourcesGathered + gatherAmount,
      },
    });
    
    // 更新资源点
    await ctx.db.patch(args.resourceId, {
      amount: amount - gatherAmount,
    });
    
    return {
      success: true,
      message: `采集了 ${gatherAmount} ${type}`,
      gathered: gatherAmount,
      newInventory,
    };
  },
});

/**
 * AI智能体建造建筑
 */
export const buildStructure = mutation({
  args: {
    agentId: v.string(),
    buildingType: v.string(),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // 获取智能体
    const agent = await ctx.db
      .query("agentExtensions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();
    
    if (!agent) {
      return { success: false, error: "智能体不存在" };
    }
    
    // 建筑成本
    const costs: Record<string, any> = {
      house: { wood: 20, stone: 10 },
      workshop: { wood: 30, stone: 20, gold: 5 },
      warehouse: { wood: 40, stone: 30 },
      market: { wood: 25, stone: 15, gold: 10 },
      watchtower: { wood: 15, stone: 25, gold: 5 },
    };
    
    const cost = costs[args.buildingType];
    if (!cost) {
      return { success: false, error: "未知的建筑类型" };
    }
    
    // 检查资源是否足够
    const inventory = agent.inventory as any;
    for (const [resource, amount] of Object.entries(cost)) {
      const requiredAmount = amount as number;
      if (inventory[resource] < requiredAmount) {
        return { success: false, error: `资源不足: 需要 ${requiredAmount} ${resource}` };
      }
    }
    
    // 扣除资源
    const newInventory = { ...agent.inventory } as any;
    for (const [resource, amount] of Object.entries(cost)) {
      const costAmount = amount as number;
      newInventory[resource] -= costAmount;
    }
    
    // 创建建筑
    const buildingId = await ctx.db.insert("buildings", {
      type: args.buildingType,
      ownerId: args.agentId,
      position: args.position,
      level: 1,
      health: 100,
      constructionProgress: 100,
      isActive: true,
      productionRate: 1.0,
    });
    
    // 更新智能体
    await ctx.db.patch(agent._id, {
      inventory: newInventory,
      stats: {
        ...agent.stats,
        buildingsBuilt: agent.stats.buildingsBuilt + 1,
      },
    });
    
    return {
      success: true,
      message: `成功建造 ${args.buildingType}`,
      buildingId,
      newInventory,
    };
  },
});
