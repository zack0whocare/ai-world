/**
 * AI 决策 Action - 完整的决策流程
 * Action 可以调用 fetch 和 mutation
 */

import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { parseAIResponse } from "./doubao_action";
import { generateDecisionPrompt } from "./ai_prompts";

// 豆包 API 配置
const DOUBAO_CONFIG = {
  apiKey: "75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c",
  baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
  model: "doubao-seed-1-8-251228",
  temperature: 0.8,
  maxTokens: 1500,
  topP: 0.9,
};

/**
 * 执行单个智能体的 AI 决策（Action）
 */
export const makeAIDecisionAction = action({
  args: {
    agentId: v.string(),
    useAI: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const useAI = args.useAI !== false; // 默认使用 AI
    const debugLogs: string[] = [];

    try {
      // 1. 获取智能体信息
      const agent = await ctx.runQuery(api.aiworld.mutations.getAgentDetails, {
        agentId: args.agentId,
      });

      if (!agent) {
        return {
          success: false,
          error: "智能体不存在",
          debugLogs,
        };
      }

      // 2. 获取周边环境信息
      const nearbyResources = await ctx.runQuery(api.aiworld.mutations.getAllResources, {});
      const nearbyBuildings = await ctx.runQuery(api.aiworld.mutations.getAllBuildings, {});
      const allAgents = await ctx.runQuery(api.aiworld.mutations.getAllAgents, {});
      const nearbyAgents = allAgents.filter((a: any) => a.agentId !== args.agentId);

      let decision: any = null;
      let usedAI = false;

      // 3. 尝试使用 AI 决策
      if (useAI) {
        try {
          debugLogs.push(`🤖 ${agent.name} 正在使用豆包 AI 思考...`);
          debugLogs.push(`📊 useAI 参数: ${useAI}`);

          const personality = typeof agent.personality === "string"
            ? agent.personality
            : (agent.personality as any)?.archetype || "gatherer";

          debugLogs.push(`👤 性格类型: ${personality}`);

          // 生成提示词
          const promptData = generateDecisionPrompt(
            agent.name,
            personality,
            agent.inventory,
            nearbyResources.map((r: any) => ({
              type: r.type,
              amount: r.amount,
            })),
            nearbyBuildings.map((b: any) => ({
              type: b.type,
              ownerName: b.ownerName,
            })),
            nearbyAgents.slice(0, 3).map((a: any) => ({
              name: a.name,
              personality:
                typeof a.personality === "string"
                  ? a.personality
                  : (a.personality as any)?.archetype || "unknown",
            }))
          );

          const promptObj = JSON.parse(promptData);
          debugLogs.push(
            `📝 提示词对象: ${JSON.stringify(promptObj).substring(0, 200)}...`
          );

          // 调用豆包 API
          debugLogs.push(`🌐 开始调用豆包 API...`);

          const response = await fetch(`${DOUBAO_CONFIG.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${DOUBAO_CONFIG.apiKey}`,
            },
            body: JSON.stringify({
              model: DOUBAO_CONFIG.model,
              messages: [
                {
                  role: "system",
                  content: promptObj.system,
                },
                {
                  role: "user",
                  content: promptObj.user,
                },
              ],
              temperature: DOUBAO_CONFIG.temperature,
              max_tokens: DOUBAO_CONFIG.maxTokens,
              top_p: DOUBAO_CONFIG.topP,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `豆包 API 调用失败: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();

          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("豆包 API 返回格式错误");
          }

          const aiResponse = data.choices[0].message.content;
          debugLogs.push(`🌐 豆包 API 调用成功`);
          debugLogs.push(`💭 AI 响应: ${aiResponse.substring(0, 100)}...`);

          // 解析 AI 响应
          decision = parseAIResponse(aiResponse);
          usedAI = true;

          debugLogs.push(`✅ AI 决策: ${JSON.stringify(decision)}`);
        } catch (error: any) {
          debugLogs.push(`❌ AI 决策失败: ${error.message}`);
          debugLogs.push(`🔄 回退到规则引擎`);
        }
      }

      // 4. 如果 AI 失败，使用规则引擎
      if (!decision) {
        decision = makeRuleBasedDecision(agent, nearbyResources);
        usedAI = false;
        debugLogs.push(`🎯 规则引擎决策: ${JSON.stringify(decision)}`);
      }

      // 5. 执行决策
      const result = await executeDecision(ctx, agent, decision, nearbyResources);

      return {
        success: true,
        agentId: args.agentId,
        agentName: agent.name,
        usedAI,
        decision,
        result,
        debugLogs,
      };
    } catch (error: any) {
      debugLogs.push(`❌ 决策执行失败: ${error.message}`);
      return {
        success: false,
        agentId: args.agentId,
        error: error.message,
        debugLogs,
      };
    }
  },
});

/**
 * 批量执行所有智能体的 AI 决策
 */
export const runAllAIDecisionsAction = action({
  args: {
    useAI: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.runQuery(api.aiworld.mutations.getAllAgents, {});
    const results = [];

    console.log(`\n🎮 开始执行 ${agents.length} 个智能体的决策...`);

    for (const agent of agents) {
      try {
        const result = await ctx.runAction(api.aiworld.ai_decision_action.makeAIDecisionAction, {
          agentId: agent.agentId,
          useAI: args.useAI,
        });

        results.push(result);
      } catch (error: any) {
        console.error(`❌ ${agent.name} 决策失败:`, error.message);
        results.push({
          success: false,
          agentId: agent.agentId,
          name: agent.name,
          error: error.message,
          debugLogs: [`❌ 执行失败: ${error.message}`],
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const aiCount = results.filter((r) => r.success && r.usedAI).length;

    console.log(
      `✅ 决策完成: ${successCount}/${agents.length} 成功，${aiCount} 个使用了 AI`
    );

    return {
      success: true,
      totalAgents: agents.length,
      successCount,
      aiCount,
      results,
    };
  },
});

/**
 * 规则引擎决策（后备方案）
 */
function makeRuleBasedDecision(agent: any, nearbyResources: any[]): any {
  const personality =
    typeof agent.personality === "string"
      ? agent.personality
      : (agent.personality as any)?.archetype || "gatherer";

  // 简单的规则决策
  if (personality === "gatherer") {
    // 采集者：优先采集资源
    const resource = nearbyResources.find((r) => r.amount > 0);
    if (resource) {
      return {
        action: "gather",
        target: resource.type,
        resourceId: resource._id,
        reason: `采集 ${resource.type}`,
      };
    }
  } else if (personality === "builder") {
    // 建造者：先采集资源，再建造
    const hasEnoughResources =
      agent.inventory.wood >= 20 && agent.inventory.stone >= 15;
    if (hasEnoughResources) {
      return {
        action: "build",
        target: "house",
        reason: "采集资源准备建造",
      };
    } else {
      const resource = nearbyResources.find((r) => r.amount > 0);
      if (resource) {
        return {
          action: "gather",
          target: resource.type,
          resourceId: resource._id,
          reason: "采集资源准备建造",
        };
      }
    }
  }

  return {
    action: "wait",
    reason: "等待中",
  };
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
        let resourceId = decision.resourceId;

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
        return {
          success: true,
          action: decision.action,
          message: decision.reason || `执行了 ${decision.action} 动作`,
        };

      default:
        return {
          success: false,
          error: "未知动作",
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
