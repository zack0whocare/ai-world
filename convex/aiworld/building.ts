/**
 * 建造系统 - AI World Extension
 */

import { Inventory, ResourceType } from './resources';

export type BuildingType = 'house' | 'workshop' | 'storage' | 'market' | 'tower';

export interface Building {
  id: string;
  type: BuildingType;
  position: { x: number; y: number };
  ownerId: string;
  ownerName: string;
  builtAt: number;
  level: number;
  health: number;
  maxHealth: number;
}

export interface BuildingRecipe {
  type: BuildingType;
  name: string;
  icon: string;
  description: string;
  cost: Partial<Inventory>;
  buildTime: number;
  benefits: string;
  maxLevel: number;
}

export const BUILDING_RECIPES: Record<BuildingType, BuildingRecipe> = {
  house: {
    type: 'house',
    name: '房屋',
    icon: '🏠',
    description: '提供居住空间',
    cost: { wood: 10, stone: 5 },
    buildTime: 10000,
    benefits: '声望+10',
    maxLevel: 3,
  },
  workshop: {
    type: 'workshop',
    name: '工坊',
    icon: '🔨',
    description: '提高资源采集效率',
    cost: { wood: 15, stone: 10, gold: 2 },
    buildTime: 15000,
    benefits: '采集速度+20%',
    maxLevel: 5,
  },
  storage: {
    type: 'storage',
    name: '仓库',
    icon: '📦',
    description: '增加背包容量',
    cost: { wood: 20, stone: 15 },
    buildTime: 12000,
    benefits: '背包容量+50',
    maxLevel: 3,
  },
  market: {
    type: 'market',
    name: '市场',
    icon: '🏪',
    description: '可以与其他AI交易',
    cost: { wood: 25, stone: 20, gold: 5 },
    buildTime: 20000,
    benefits: '启用交易功能',
    maxLevel: 2,
  },
  tower: {
    type: 'tower',
    name: '瞭望塔',
    icon: '🗼',
    description: '增加视野范围',
    cost: { wood: 30, stone: 40, gold: 10 },
    buildTime: 30000,
    benefits: '视野范围+5格',
    maxLevel: 3,
  },
};

export function canAffordBuilding(
  inventory: Inventory,
  buildingType: BuildingType
): { canBuild: boolean; missing: Partial<Inventory> } {
  const recipe = BUILDING_RECIPES[buildingType];
  const missing: Partial<Inventory> = {};
  let canBuild = true;
  
  for (const [resource, cost] of Object.entries(recipe.cost)) {
    const resourceType = resource as ResourceType;
    const needed = cost || 0;
    const has = inventory[resourceType] || 0;
    
    if (has < needed) {
      canBuild = false;
      missing[resourceType] = needed - has;
    }
  }
  
  return { canBuild, missing };
}

export function buildBuilding(
  inventory: Inventory,
  buildingType: BuildingType,
  position: { x: number; y: number },
  agentId: string,
  agentName: string
): { success: boolean; building?: Building; newInventory?: Inventory; error?: string } {
  const { canBuild, missing } = canAffordBuilding(inventory, buildingType);
  
  if (!canBuild) {
    return {
      success: false,
      error: `资源不足: ${Object.entries(missing)
        .map(([res, amt]) => `${res}:${amt}`)
        .join(', ')}`,
    };
  }
  
  const recipe = BUILDING_RECIPES[buildingType];
  const newInventory = { ...inventory };
  
  for (const [resource, cost] of Object.entries(recipe.cost)) {
    const resourceType = resource as ResourceType;
    newInventory[resourceType] -= cost || 0;
  }
  
  const building: Building = {
    id: `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: buildingType,
    position,
    ownerId: agentId,
    ownerName: agentName,
    builtAt: Date.now(),
    level: 1,
    health: 100,
    maxHealth: 100,
  };
  
  return {
    success: true,
    building,
    newInventory,
  };
}
