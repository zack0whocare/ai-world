/**
 * AI 自动决策逻辑 - AI World Extension
 */

import { v } from "convex/values";
import { mutation, internalMutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { api } from "../_generated/api";

/**
 * 决策逻辑内部函数
 */
async function makeDecisionLogic(ctx: any, args: { agentId: string }) {
  // 获取智能体
  const agent = await ctx.db
    .query("agentExtensions")
    .withIndex("by_agent", (q: any) => q.eq("agentId", args.agentId))
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
}

/**
 * AI 智能体自动决策
 */
export const makeDecision = internalMutation({
  args: {
    agentId: v.string(),
  },
  handler: makeDecisionLogic,
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
  
  // 检查资源是否足够建造
  const buildingTypes = [
    { type: "house", wood: 30, stone: 20, gold: 5 },
    { type: "warehouse", wood: 40, stone: 30, gold: 0 },
    { type: "market", wood: 25, stone: 15, gold: 10 },
    { type: "watchtower", wood: 15, stone: 25, gold: 5 },
  ];

  for (const building of buildingTypes) {
    if (
      inventory.wood >= building.wood &&
      inventory.stone >= building.stone &&
      inventory.gold >= building.gold
    ) {
      return {
        action: "build",
        buildingType: building.type,
        reason: `建造 ${building.type}`,
      };
    }
  }

  // 资源不足，先采集
  return await decideGathering(ctx, agent);
}

/**
 * 商人决策：寻找交易机会
 */
async function decideTrading(ctx: any, agent: any) {
  const inventory = agent.inventory as any;
  
  // 如果金币少于10，尝试用木材换金币
  if (inventory.gold < 10 && inventory.wood >= 20) {
    // 寻找其他智能体
    const otherAgents = await ctx.db
      .query("agentExtensions")
      .filter((q: any) => q.neq(q.field("agentId"), agent.agentId))
      .collect();

    if (otherAgents.length > 0) {
      return {
        action: "trade",
        targetAgentId: otherAgents[0].agentId,
        offering: { wood: 20 },
        requesting: { gold: 5 },
        reason: "用木材换金币",
      };
    }
  }

  // 没有交易机会，采集资源
  return await decideGathering(ctx, agent);
}

/**
 * 探险家决策：探索新区域
 */
async function decideExploring(ctx: any, agent: any) {
  const currentPos = agent.position || { x: 0, y: 0 };
  
  // 随机移动到新位置
  const newX = currentPos.x + (Math.random() > 0.5 ? 5 : -5);
  const newY = currentPos.y + (Math.random() > 0.5 ? 5 : -5);

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
  // 检查是否有建筑需要守卫
  const buildings = await ctx.db
    .query("buildings")
    .filter((q: any) => q.eq(q.field("ownerId"), agent.agentId))
    .collect();

  if (buildings.length > 0) {
    return {
      action: "guard",
      buildingId: buildings[0]._id,
      reason: `守卫 ${buildings[0].type}`,
    };
  }

  // 没有建筑，先建造一个
  return await decideBuilding(ctx, agent);
}

/**
 * 平衡决策：根据当前状态选择最优行动
 */
async function decideBalanced(ctx: any, agent: any) {
  const inventory = agent.inventory as any;
  
  // 检查是否有建筑
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
export const executeDecision: any = internalMutation({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    // 调用内部决策函数
    const decision = await makeDecisionLogic(ctx, args);

    if (!decision.success) {
      return decision;
    }

    // 根据决策执行动作
    const action = decision.decision.action;
    let result: any = null;

    switch (action) {
      case "gather":
        // 执行采集
        result = await ctx.runMutation(api.aiworld.mutations.gatherResource, {
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
        
        if (agent && agent.position) {
          result = await ctx.runMutation(api.aiworld.mutations.buildStructure, {
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
        result = {
          success: true,
          action,
          message: `执行了 ${action} 动作`,
        };
        break;

      default:
        result = {
          success: false,
          error: `未知动作: ${action}`,
        };
    }

    return {
      success: true,
      agentId: args.agentId,
      decision: decision.decision,
      result,
    };
  },
});

/**
 * 批量执行所有智能体的决策
 */
export const runAllAgentDecisions: any = mutation({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agentExtensions").collect();
    const results = [];

    for (const agent of agents) {
      try {
        // 直接调用决策逻辑，不通过 runMutation
        const decision = await makeDecisionLogic(ctx, { agentId: agent.agentId });
        
        if (!decision.success) {
          results.push({
            agentId: agent.agentId,
            name: agent.name,
            error: decision.error,
          });
          continue;
        }

        // 执行决策
        let actionResult: any = null;
        const action = decision.decision.action;

        switch (action) {
          case "gather":
            actionResult = await ctx.runMutation(api.aiworld.mutations.gatherResource, {
              agentId: agent.agentId,
              resourceId: decision.decision.resourceId,
            });
            break;

          case "build":
            if (agent.position) {
              actionResult = await ctx.runMutation(api.aiworld.mutations.buildStructure, {
                agentId: agent.agentId,
                buildingType: decision.decision.buildingType,
                position: {
                  x: agent.position.x + 2,
                  y: agent.position.y + 2,
                },
              });
            }
            break;

          default:
            actionResult = { success: true, action };
        }

        results.push({
          agentId: agent.agentId,
          name: agent.name,
          result: {
            success: true,
            decision: decision.decision,
            actionResult,
          },
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
