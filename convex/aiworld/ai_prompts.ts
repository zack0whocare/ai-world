/**
 * AI 决策提示词系统 - AI World Extension
 * 为不同性格的智能体生成个性化提示词
 */

/**
 * 性格描述映射
 */
const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  gatherer: `你是一个勤劳的采集者，热爱收集各种资源。你的特点是：
- 对资源有敏锐的嗅觉，总能找到最好的采集点
- 喜欢积累财富，看到满满的仓库会很有成就感
- 做事有条理，优先采集稀缺资源
- 偶尔也会考虑建造仓库来存储资源`,

  builder: `你是一个富有远见的建造者，梦想建立繁荣的城镇。你的特点是：
- 热衷于建造各种建筑，从简单的房屋到宏伟的市场
- 善于规划，会先采集足够的资源再动工
- 追求建筑的多样性，不喜欢重复建造同一种建筑
- 建造完成后会感到极大的满足`,

  trader: `你是一个精明的商人，擅长通过交易获利。你的特点是：
- 对市场行情敏感，知道什么资源最有价值
- 喜欢与其他智能体交易，寻找互利共赢的机会
- 会囤积热门商品，等待好价格
- 资源不足时也会自己采集，但更喜欢交易`,

  explorer: `你是一个冒险的探险家，热爱发现新事物。你的特点是：
- 喜欢四处游荡，探索未知区域
- 对新的资源点和建筑充满好奇
- 不喜欢长时间待在一个地方
- 偶尔会采集资源或建造，但很快又会继续探险`,

  defender: `你是一个忠诚的守卫者，保护家园是你的使命。你的特点是：
- 关注建筑的安全，喜欢建造防御性建筑（瞭望塔）
- 会在重要建筑附近巡逻
- 资源充足时优先建造防御设施
- 对其他智能体保持警惕，但不会主动攻击`,
};

/**
 * 资源类型描述
 */
const RESOURCE_DESCRIPTIONS: Record<string, string> = {
  wood: "木材（用于建造房屋、仓库等基础建筑）",
  stone: "石头（用于建造坚固的建筑和防御设施）",
  food: "食物（维持生存的必需品）",
  gold: "金币（贵重货币，用于高级建筑和交易）",
};

/**
 * 建筑类型描述
 */
const BUILDING_DESCRIPTIONS: Record<string, { cost: string; benefit: string }> = {
  house: {
    cost: "需要 30 木材、20 石头、5 金币",
    benefit: "提供居住空间，提升幸福感",
  },
  warehouse: {
    cost: "需要 40 木材、30 石头",
    benefit: "扩大存储容量，保护资源安全",
  },
  market: {
    cost: "需要 25 木材、15 石头、10 金币",
    benefit: "促进贸易，吸引其他智能体交易",
  },
  watchtower: {
    cost: "需要 15 木材、25 石头、5 金币",
    benefit: "提供防御和视野，保护周边安全",
  },
};

/**
 * 生成智能体决策提示词
 */
export function generateDecisionPrompt(
  agentName: string,
  personality: string,
  inventory: any,
  nearbyResources: any[],
  nearbyBuildings: any[],
  nearbyAgents: any[]
): string {
  const personalityDesc = PERSONALITY_DESCRIPTIONS[personality] || PERSONALITY_DESCRIPTIONS.gatherer;

  // 当前状态
  const inventoryDesc = `
当前背包：
- 木材: ${inventory.wood ?? 0}
- 石头: ${inventory.stone ?? 0}
- 食物: ${inventory.food ?? 0}
- 金币: ${inventory.gold ?? 0}`;

  // 附近资源
  let resourcesDesc = "\n附近资源点：";
  if (nearbyResources.length === 0) {
    resourcesDesc += "\n- 附近没有可采集的资源";
  } else {
    resourcesDesc += nearbyResources
      .slice(0, 5)
      .map((r) => `\n- ${RESOURCE_DESCRIPTIONS[r.type] || r.type}，剩余 ${r.amount}`)
      .join("");
  }

  // 附近建筑
  let buildingsDesc = "\n附近建筑：";
  if (nearbyBuildings.length === 0) {
    buildingsDesc += "\n- 附近没有建筑";
  } else {
    buildingsDesc += nearbyBuildings
      .slice(0, 3)
      .map((b) => `\n- ${b.type}（${b.ownerName || "无主"}）`)
      .join("");
  }

  // 附近智能体
  let agentsDesc = "\n附近智能体：";
  if (nearbyAgents.length === 0) {
    agentsDesc += "\n- 附近没有其他智能体";
  } else {
    agentsDesc += nearbyAgents
      .slice(0, 3)
      .map((a) => `\n- ${a.name}（${a.personality}）`)
      .join("");
  }

  // 可建造的建筑
  const buildableBuildings: string[] = [];
  if (inventory.wood >= 30 && inventory.stone >= 20 && inventory.gold >= 5) {
    buildableBuildings.push("house");
  }
  if (inventory.wood >= 40 && inventory.stone >= 30) {
    buildableBuildings.push("warehouse");
  }
  if (inventory.wood >= 25 && inventory.stone >= 15 && inventory.gold >= 10) {
    buildableBuildings.push("market");
  }
  if (inventory.wood >= 15 && inventory.stone >= 25 && inventory.gold >= 5) {
    buildableBuildings.push("watchtower");
  }

  let buildOptionsDesc = "\n可建造的建筑：";
  if (buildableBuildings.length === 0) {
    buildOptionsDesc += "\n- 资源不足，无法建造";
  } else {
    buildOptionsDesc += buildableBuildings
      .map((type) => {
        const desc = BUILDING_DESCRIPTIONS[type];
        return `\n- ${type}: ${desc.benefit}`;
      })
      .join("");
  }

  // 系统提示词
  const systemPrompt = `你是 ${agentName}，一个生活在 AI World 虚拟世界中的智能体。

${personalityDesc}

请根据你的性格特点和当前情况，决定下一步行动。`;

  // 用户提示词
  const userPrompt = `${inventoryDesc}
${resourcesDesc}
${buildingsDesc}
${agentsDesc}
${buildOptionsDesc}

请根据你的性格和当前情况，选择下一步行动。可选行动：

1. **gather** - 采集资源（如果附近有资源点）
2. **build** - 建造建筑（如果资源足够）
   可建造类型：${buildableBuildings.join(", ") || "无"}
3. **trade** - 寻找交易机会（如果附近有其他智能体）
4. **explore** - 探索新区域（移动到新位置）
5. **wait** - 休息等待

请用 JSON 格式回答（只返回 JSON，不要其他文字）：
{
  "action": "行动类型（gather/build/trade/explore/wait）",
  "target": "目标（如果是 gather 则填资源类型，如果是 build 则填建筑类型）",
  "reason": "简短的决策理由（一句话）"
}`;

  return JSON.stringify({
    system: systemPrompt,
    user: userPrompt,
  });
}

/**
 * 生成交易决策提示词
 */
export function generateTradePrompt(
  agentName: string,
  personality: string,
  inventory: any,
  tradeOffer: {
    fromAgent: string;
    offering: any;
    requesting: any;
  }
): string {
  const personalityDesc = PERSONALITY_DESCRIPTIONS[personality] || PERSONALITY_DESCRIPTIONS.trader;

  const systemPrompt = `你是 ${agentName}，一个生活在 AI World 虚拟世界中的智能体。

${personalityDesc}

现在有人向你提出交易，请根据你的性格和需求决定是否接受。`;

  const userPrompt = `
当前背包：
- 木材: ${inventory.wood ?? 0}
- 石头: ${inventory.stone ?? 0}
- 食物: ${inventory.food ?? 0}
- 金币: ${inventory.gold ?? 0}

交易提议（来自 ${tradeOffer.fromAgent}）：
- 对方给你: ${JSON.stringify(tradeOffer.offering)}
- 要求你给: ${JSON.stringify(tradeOffer.requesting)}

请判断是否接受这个交易。考虑因素：
1. 你是否有足够的资源来交换
2. 对方提供的资源对你是否有价值
3. 这个交易是否符合你的性格特点

请用 JSON 格式回答（只返回 JSON，不要其他文字）：
{
  "accept": true/false,
  "reason": "简短的决策理由（一句话）"
}`;

  return JSON.stringify({
    system: systemPrompt,
    user: userPrompt,
  });
}
