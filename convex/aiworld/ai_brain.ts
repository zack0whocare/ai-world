/**
 * AI 智能决策大脑 - 集成豆包 AI 模型
 * 混合决策系统：优先使用 AI，失败时回退到规则引擎
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";
import { callDoubaoAPI, parseAIResponse } from "./doubao_client";
import { generateDecisionPrompt } from "./ai_prompts";

/**
 * AI 驱动的智能决策（主函数）
 */
export const makeAIDecision = mutation({
  args: {
    agentId: v.string(),
    useAI: v.optional(v.boolean()), // 是否使用 AI（默认 true）
  },
  handler: async (ctx, args) => {
    const useAI = args.useAI !== false; // 默认使用 AI

    // 获取智能体信息
    const agent = await ctx.db
      .query("agentExtensions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!agent) {
      return { success: false, error: "智能体不存在" };
    }

    // 获取周边环境信息
    const nearbyResources = await ctx.db
      .query("resources")
      .filter((q) => q.gt(q.field("amount"), 0))
      .collect();

    const nearbyBuildings = await ctx.db
      .query("buildings")
      .collect();

    const nearbyAgents = await ctx.db
      .query("agentExtensions")
      .filter((q) => q.neq(q.field("agentId"), args.agentId))
      .collect();

    let decision: any = null;
    let usedAI = false;

    // 尝试使用 AI 决策
    if (useAI) {
      try {
        console.log(`🤖 ${agent.name} 正在使用豆包 AI 思考...`);
        
        const personality = typeof agent.personality === 'string' 
          ? agent.personality 
          : (agent.personality as any)?.archetype || 'gatherer';

        // 生成提示词
        const promptData = generateDecisionPrompt(
          agent.name,
          personality,
          agent.inventory,
          nearbyResources.map((r) => ({
            type: r.type,
            amount: r.amount,
          })),
          nearbyBuildings.map((b) => ({
            type: b.type,
            ownerName: b.ownerName,
          })),
          nearbyAgents.slice(0, 3).map((a) => ({
            name: a.name,
            personality: typeof a.personality === 'string' 
              ? a.personality 
              : (a.personality as any)?.archetype || 'unknown',
          }))
        );

        const promptObj = JSON.parse(promptData);
        
        // 调用豆包 AI
        const aiResponse = await callDoubaoAPI(promptObj.user, promptObj.system);
        
        console.log(`💭 ${agent.name} AI 响应:`, aiResponse);

        // 解析 AI 响应
        decision = parseAIResponse(aiResponse);
        usedAI = true;

        console.log(`✅ ${agent.name} AI 决策:`, decision);
      } catch (error: any) {
        console.error(`❌ ${agent.name} AI 决策失败:`, error.message);
        console.log(`🔄 ${agent.name} 回退到规则引擎`);
      }
    }

    // 如果 AI 决策失败或未启用，使用规则引擎
    if (!decision) {
      decision = await makeRuleBasedDecision(ctx, agent, nearbyResources);
      usedAI = false;
    }

    // 执行决策
    const result = await executeDecision(ctx, agent, decision, nearbyResources);

    return {
      success: true,
      agentId: args.agentId,
      agentName: agent.name,
      usedAI,
      decision,
      result,
    };
  },
});

/**
 * 规则引擎决策（后备方案）
 */
async function makeRuleBasedDecision(
  ctx: any,
  agent: any,
  nearbyResources: any[]
): Promise<any> {
  const personality = typeof agent.personality === 'string' 
    ? agent.personality 
    : (agent.personality as any)?.archetype || 'gatherer';
  const inventory = agent.inventory as any;

  switch (personality) {
    case "gatherer":
      // 采集者：优先采集资源
      if (nearbyResources.length > 0) {
        const target = nearbyResources[0];
        return {
          action: "gather",
          target: target.type,
          resourceId: target._id,
          reason: `采集 ${target.type}`,
        };
      }
      return { action: "wait", reason: "没有可采集的资源" };

    case "builder":
      // 建造者：优先建造
      if (inventory.wood >= 30 && inventory.stone >= 20 && inventory.gold >= 5) {
        return {
          action: "build",
          target: "house",
          reason: "建造房屋",
        };
      } else if (inventory.wood >= 40 && inventory.stone >= 30) {
        return {
          action: "build",
          target: "warehouse",
          reason: "建造仓库",
        };
      } else if (nearbyResources.length > 0) {
        const target = nearbyResources[0];
        return {
          action: "gather",
          target: target.type,
          resourceId: target._id,
          reason: "采集资源准备建造",
        };
      }
      return { action: "wait", reason: "资源不足，等待机会" };

    case "trader":
      // 商人：优先交易，其次采集
      if (nearbyResources.length > 0) {
        const target = nearbyResources[0];
        return {
          action: "gather",
          target: target.type,
          resourceId: target._id,
          reason: "采集资源用于交易",
        };
      }
      return { action: "wait", reason: "等待交易机会" };

    case "explorer":
      // 探险家：探索和采集
      if (nearbyResources.length > 0 && Math.random() > 0.5) {
        const target = nearbyResources[0];
        return {
          action: "gather",
          target: target.type,
          resourceId: target._id,
          reason: "顺便采集资源",
        };
      }
      return { action: "explore", reason: "探索新区域" };

    case "defender":
      // 守卫者：建造防御建筑
      if (inventory.wood >= 15 && inventory.stone >= 25 && inventory.gold >= 5) {
        return {
          action: "build",
          target: "watchtower",
          reason: "建造瞭望塔",
        };
      } else if (nearbyResources.length > 0) {
        const target = nearbyResources[0];
        return {
          action: "gather",
          target: target.type,
          resourceId: target._id,
          reason: "采集资源建造防御",
        };
      }
      return { action: "wait", reason: "守卫中" };

    default:
      // 默认：采集
      if (nearbyResources.length > 0) {
        const target = nearbyResources[0];
        return {
          action: "gather",
          target: target.type,
          resourceId: target._id,
          reason: "采集资源",
        };
      }
      return { action: "wait", reason: "等待" };
  }
}

/**
 * 执行决策
 */
async function executeDecision(
  ctx: any,
  agent: any,
  decision: any,
  nearbyResources: any[]
): Promise<any> {
  try {
    switch (decision.action) {
      case "gather":
        // 执行采集
        let resourceId = decision.resourceId;
        
        // 如果没有指定 resourceId，根据 target 查找
        if (!resourceId && decision.target) {
          const resource = nearbyResources.find((r) => r.type === decision.target);
          if (resource) {
            resourceId = resource._id;
          }
        }

        if (resourceId) {
          return await ctx.runMutation(api.aiworld.mutations.gatherResource, {
            agentId: agent.agentId,
            resourceId: resourceId,
          });
        }
        return { success: false, error: "未找到资源点" };

      case "build":
        // 执行建造
        if (agent.position && decision.target) {
          return await ctx.runMutation(api.aiworld.mutations.buildStructure, {
            agentId: agent.agentId,
            buildingType: decision.target,
            position: {
              x: agent.position.x + Math.floor(Math.random() * 5) + 1,
              y: agent.position.y + Math.floor(Math.random() * 5) + 1,
            },
          });
        }
        return { success: false, error: "无法建造" };

      case "explore":
      case "wait":
      case "trade":
        // 这些动作暂时只记录
        return {
          success: true,
          action: decision.action,
          message: decision.reason || `执行了 ${decision.action} 动作`,
        };

      default:
        return {
          success: false,
          error: `未知动作: ${decision.action}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "执行失败",
    };
  }
}

/**
 * 批量执行所有智能体的 AI 决策
 */
export const runAllAIDecisions = mutation({
  args: {
    useAI: v.optional(v.boolean()), // 是否使用 AI（默认 true）
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db.query("agentExtensions").collect();
    const results = [];

    console.log(`\n🎮 开始执行 ${agents.length} 个智能体的决策...`);

    for (const agent of agents) {
      try {
        const result = await ctx.runMutation(api.aiworld.ai_brain.makeAIDecision, {
          agentId: agent.agentId,
          useAI: args.useAI,
        });

        results.push({
          agentId: agent.agentId,
          name: agent.name,
          success: true,
          result,
        });
      } catch (error: any) {
        console.error(`❌ ${agent.name} 决策失败:`, error.message);
        results.push({
          agentId: agent.agentId,
          name: agent.name,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const aiCount = results.filter((r) => r.success && r.result?.usedAI).length;

    console.log(`✅ 决策完成: ${successCount}/${agents.length} 成功，${aiCount} 个使用了 AI`);

    return {
      success: true,
      totalAgents: agents.length,
      successCount,
      aiCount,
      results,
    };
  },
});
