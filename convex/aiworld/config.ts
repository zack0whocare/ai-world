/**
 * AI World 配置文件
 */

export const WORLD_CONFIG = {
  // 资源再生速度倍率
  resourceRegenMultiplier: 1.0,
  
  // AI决策频率(毫秒)
  agentThinkInterval: 30000, // 30秒
  
  // 初始资源
  startingResources: {
    wood: 5,
    stone: 0,
    food: 3,
    gold: 0,
  },
  
  // 每个玩家最多创建多少AI
  maxAgentsPerPlayer: 3,
  
  // 交易过期时间(毫秒)
  tradeExpirationTime: 5 * 60 * 1000, // 5分钟
  
  // 建筑最小间距
  buildingMinDistance: 3,
  
  // 经验值倍率
  experienceMultiplier: 1.0,
  
  // 调试模式
  debug: false,
};
