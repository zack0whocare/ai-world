/**
 * AI Agent思考和决策系统 - 使用豆包模型
 */

import { callDoubaoAPI, generateAgentDecisionPrompt } from './llm-config';
import { decideNextAction } from './goals';

/**
 * AI Agent思考并决策下一步行动
 */
export async function agentThink(
  agent: any,
  extension: any,
  nearbyResources: any[],
  nearbyAgents: any[]
): Promise<any> {
  try {
    // 使用豆包模型生成决策
    const prompt = generateAgentDecisionPrompt(
      agent.name,
      extension.personality,
      extension.inventory,
      extension.goals,
      nearbyResources,
      nearbyAgents
    );
    
    const response = await callDoubaoAPI(prompt);
    
    // 解析响应
    const decision = JSON.parse(response);
    
    console.log(`${agent.name}决策:`, decision);
    
    return decision;
    
  } catch (error) {
    console.error(`${agent.name}思考出错:`, error);
    
    // 降级:使用规则引擎
    return decideNextAction(
      extension.goals,
      extension.inventory,
      agent.position,
      extension.personality
    );
  }
}

/**
 * 批量AI思考 - 优化成本
 */
export async function batchAgentThink(
  agents: any[],
  extensions: any[],
  nearbyResourcesMap: Map<string, any[]>,
  nearbyAgentsMap: Map<string, any[]>
): Promise<Map<string, any>> {
  const decisions = new Map<string, any>();
  
  // 并发处理多个AI的思考
  const promises = agents.map(async (agent, index) => {
    const extension = extensions[index];
    const nearbyResources = nearbyResourcesMap.get(agent.id) || [];
    const nearbyAgents = nearbyAgentsMap.get(agent.id) || [];
    
    const decision = await agentThink(agent, extension, nearbyResources, nearbyAgents);
    decisions.set(agent.id, decision);
  });
  
  await Promise.all(promises);
  
  return decisions;
}
