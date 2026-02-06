/**
 * LLM配置 - 使用豆包模型
 */

export const LLM_CONFIG = {
  provider: 'doubao',
  
  // 豆包API配置
  apiKey: process.env.ARK_API_KEY || process.env.OPENAI_API_KEY || '75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c',
  baseUrl: process.env.ARK_BASE_URL || process.env.OPENAI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  model: process.env.ARK_MODEL || process.env.OPENAI_MODEL || 'doubao-seed-1-8-251228',
  
  // 模型参数
  temperature: 0.7,
  maxTokens: 2000,
  topP: 0.95,
  
  // 请求超时(毫秒)
  timeout: 30000,
  
  // 重试配置
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * 调用豆包API生成响应
 */
export async function callDoubaoAPI(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: any[] = [];
  
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  messages.push({
    role: 'user',
    content: prompt,
  });
  
  const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: LLM_CONFIG.model,
      messages: messages,
      temperature: LLM_CONFIG.temperature,
      max_tokens: LLM_CONFIG.maxTokens,
      top_p: LLM_CONFIG.topP,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`豆包API调用失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * AI决策提示词 - 针对豆包模型优化
 */
export function generateAgentDecisionPrompt(
  agentName: string,
  personality: any,
  inventory: any,
  goals: any[],
  nearbyResources: any[],
  nearbyAgents: any[]
): string {
  const personalityDesc = `你是${agentName},性格类型是${personality.archetype}(${personality.traits.join('、')})。`;
  
  const inventoryDesc = `当前背包:木材${inventory.wood},石头${inventory.stone},食物${inventory.food},金币${inventory.gold}`;
  
  const goalsDesc = goals.length > 0 
    ? `当前目标:\n${goals.map(g => `- ${g.title} (进度${g.progress}%)`).join('\n')}`
    : '暂无目标';
  
  const resourcesDesc = nearbyResources.length > 0
    ? `附近资源:\n${nearbyResources.map(r => `- ${r.type}点 距离${r.distance}格`).join('\n')}`
    : '附近没有资源';
  
  const agentsDesc = nearbyAgents.length > 0
    ? `附近AI:\n${nearbyAgents.map(a => `- ${a.name} 距离${a.distance}格`).join('\n')}`
    : '附近没有其他AI';
  
  return `${personalityDesc}

${inventoryDesc}

${goalsDesc}

${resourcesDesc}

${agentsDesc}

根据你的性格和目标,你现在应该做什么?从以下选项中选择:
1. collect - 采集资源(指定类型:wood/stone/food/gold)
2. build - 建造建筑(如果有足够资源)
3. trade - 寻找交易机会
4. explore - 探索新区域
5. idle - 休息等待

请用JSON格式回答:
{
  "action": "行动类型",
  "target": "目标(如果适用)",
  "reason": "简短原因"
}`;
}

/**
 * AI交易决策提示词
 */
export function generateTradeDecisionPrompt(
  agentName: string,
  tradeOffer: any,
  inventory: any,
  needs: any
): string {
  return `你是${agentName}。

有人向你提出交易:
- 对方给你: ${JSON.stringify(tradeOffer.offering)}
- 要求你给: ${JSON.stringify(tradeOffer.requesting)}

你的当前库存: ${JSON.stringify(inventory)}
你的需求: ${JSON.stringify(needs)}

请判断是否接受这个交易。用JSON格式回答:
{
  "accept": true/false,
  "reason": "原因"
}`;
}
