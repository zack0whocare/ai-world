/**
 * AI 自动决策逻辑 - AI World Extension
 */

import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * AI 智能体自动决策
 */
export const makeDecision = internalMutation({
  args: {
    agentId: v.string(),
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

    const personality = agent.personality;
    const inventory = agent.inventory as any;
    const goals = agent.goals;

    // 根据性格做出决策
    let decision: any = null;

    switch (personality) {
      case "gatherer":
        // 采集者：优先采集资源
        decision = await decideGathering(ctx, agent);
        break;

      case "builder":
        // 建造者：优先建造建筑
        decision = await decideBuilding(ctx, agent);
        break;

      case "trader":
        // 商人：优先交易
        decision = await decideTrading(ctx, agent);
        break;

      case "explorer":
        // 探险家：优先探索
        decision = await decideExploring(ctx, agent);
        break;

      case "defender":
        // 守卫者：优先防御
        decision = await decideDefending(ctx, agent);
        break;

      default:
        // 默认：平衡发展
        decision = await decideBalanced(ctx, agent);
    }

    return {
      success: true,
      agentId: args.agentId,
      personality,
      decision,
    };
  },
});

/**
 * 采集者决策：寻找最近的资源点采集
 */
async function decideGathering(ctx: any, agent: any) {
  const resources = await ctx.db.query("resources").collect();
  
  // 找到有资源的资源点
  const availableResources = resources.filter((r: any) => (r.amount as number) > 0);
  
  if (availableResources.length === 0) {
    return { action: "wait", reason: "没有可采集的资源" };
  }

  // 选择第一个可用资源点
  const targetResource = availableResources[0];

  return {
    action: "gather",
    resourceId: targetResource._id,
    resourceType: targetResource.type,
    reason: `采集 ${targetResource.type}`,
  };
}

/**
 * 建造者决策：根据资源情况建造建筑
 */
async function decideBuilding(ctx: any, agent: any) {
  const inventory = agent.inventory as any;

  // 检查是否有足够资源建造房屋
  if (inventory.wood >= 20 && inventory.stone >= 10) {
    return {
      action: "build",
      buildingType: "house",
      reason: "建造房屋",
    };
  }

  // 资源不足，先采集
  return await decideGathering(ctx, agent);
}

/**
 * 商人决策：寻找交易机会
 */
async function decideTrading(ctx: any, agent: any) {
  const inventory = agent.inventory as any;
  
  // 如果金币少，尝试用其他资源换金币
  if (inventory.gold < 10) {
    // 寻找有金币的智能体
    const otherAgents = await ctx.db
      .query("agentExtensions")
      .filter((q: any) => q.neq(q.field("agentId"), agent.agentId))
      .collect();

    for (const other of otherAgents) {
      const otherInventory = other.inventory as any;
      if (otherInventory.gold >= 5 && inventory.wood >= 20) {
        return {
          action: "trade",
          targetAgent: other.agentId,
          offering: { wood: 20 },
          requesting: { gold: 5 },
          reason: "用木材换取金币",
        };
      }
    }
  }

  // 没有交易机会，先采集
  return await decideGathering(ctx, agent);
}

/**
 * 探险家决策：探索新区域
 */
async function decideExploring(ctx: any, agent: any) {
  // 探险家会随机移动到新位置
  const newX = agent.position.x + (Math.random() > 0.5 ? 5 : -5);
  const newY = agent.position.y + (Math.random() > 0.5 ? 5 : -5);

  return {
    action: "move",
    newPosition: { x: newX, y: newY },
    reason: "探索新区域",
  };
}

/**
 * 守卫者决策：保护建筑
 */
async function decideDefending(ctx: any, agent: any) {
  // 检查是否有建筑需要保护
  const buildings = await ctx.db
    .query("buildings")
    .filter((q: any) => q.eq(q.field("ownerId"), agent.agentId))
    .collect();

  if (buildings.length === 0) {
    // 没有建筑，先建造
    return await decideBuilding(ctx, agent);
  }

  return {
    action: "guard",
    building: buildings[0]._id,
    reason: "守卫建筑",
  };
}

/**
 * 平衡决策：根据当前状态选择最优行动
 */
async function decideBalanced(ctx: any, agent: any) {
  const inventory = agent.inventory as any;
  const stats = agent.stats;

  // 如果资源少，先采集
  const totalResources = inventory.wood + inventory.stone + inventory.food + inventory.gold;
  if (totalResources < 50) {
    return await decideGathering(ctx, agent);
  }

  // 如果没有建筑，建造
  const buildings = await ctx.db
    .query("buildings")
    .filter((q: any) => q.eq(q.field("ownerId"), agent.agentId))
    .collect();

  if (buildings.length === 0 && inventory.wood >= 20 && inventory.stone >= 10) {
    return await decideBuilding(ctx, agent);
  }

  // 否则继续采集
  return await decideGathering(ctx, agent);
}

/**
 * 执行 AI 决策
 */
export const executeDecision = mutation({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    // 调用内部决策函数
    const decision = await ctx.runMutation(internal.aiworld.ai_decisions.makeDecision, {
      agentId: args.agentId,
    });

    if (!decision.success) {
      return decision;
    }

    // 根据决策执行动作
    const action = decision.decision.action;
    let result: any = null;

    switch (action) {
      case "gather":
        // 执行采集
        result = await ctx.runMutation(internal.aiworld.mutations.gatherResource, {
          agentId: args.agentId,
          resourceId: decision.decision.resourceId,
        });
        break;

      case "build":
        // 执行建造
        const agent = await ctx.db
          .query("agentExtensions")
          .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
          .first();
        
        if (agent) {
          result = await ctx.runMutation(internal.aiworld.mutations.buildStructure, {
            agentId: args.agentId,
            buildingType: decision.decision.buildingType,
            position: {
              x: agent.position.x + 2,
              y: agent.position.y + 2,
            },
          });
        }
        break;

      case "wait":
      case "move":
      case "guard":
        // 这些动作暂时只记录
        result = { success: true, message: decision.decision.reason };
        break;

      default:
        result = { success: false, error: "未知动作" };
    }

    return {
      success: true,
      decision: decision.decision,
      result,
    };
  },
});

/**
 * 批量执行所有智能体的决策
 */
export const runAllAgentDecisions = mutation({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agentExtensions").collect();
    const results = [];

    for (const agent of agents) {
      try {
        const result = await ctx.runMutation(internal.aiworld.ai_decisions.executeDecision, {
          agentId: agent.agentId,
        });
        results.push({
          agentId: agent.agentId,
          name: agent.name,
          result,
        });
      } catch (error: any) {
        results.push({
          agentId: agent.agentId,
          name: agent.name,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      totalAgents: agents.length,
      results,
    };
  },
});
