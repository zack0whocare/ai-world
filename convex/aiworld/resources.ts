/**
 * 资源系统 - AI World Extension
 * 为AI Town添加资源采集和管理功能
 */

export type ResourceType = 'wood' | 'stone' | 'food' | 'gold';

export interface Resource {
  type: ResourceType;
  position: { x: number; y: number };
  amount: number;
  maxAmount: number;
  regenerateRate: number;
  lastRegenerate: number;
}

export interface Inventory {
  wood: number;
  stone: number;
  food: number;
  gold: number;
}

export const RESOURCE_CONFIG = {
  wood: {
    icon: '🌲',
    name: '木材',
    collectTime: 5000,
    collectAmount: 1,
    regenerateRate: 0.1,
  },
  stone: {
    icon: '🪨',
    name: '石头',
    collectTime: 8000,
    collectAmount: 1,
    regenerateRate: 0.05,
  },
  food: {
    icon: '🌾',
    name: '食物',
    collectTime: 3000,
    collectAmount: 2,
    regenerateRate: 0.2,
  },
  gold: {
    icon: '💰',
    name: '金币',
    collectTime: 15000,
    collectAmount: 1,
    regenerateRate: 0.02,
  },
};

export function initializeResources(): Resource[] {
  return [
    { type: 'wood', position: { x: 10, y: 15 }, amount: 10, maxAmount: 10, regenerateRate: 0.1, lastRegenerate: Date.now() },
    { type: 'wood', position: { x: 12, y: 16 }, amount: 10, maxAmount: 10, regenerateRate: 0.1, lastRegenerate: Date.now() },
    { type: 'wood', position: { x: 14, y: 14 }, amount: 10, maxAmount: 10, regenerateRate: 0.1, lastRegenerate: Date.now() },
    { type: 'stone', position: { x: 25, y: 8 }, amount: 15, maxAmount: 15, regenerateRate: 0.05, lastRegenerate: Date.now() },
    { type: 'stone', position: { x: 27, y: 10 }, amount: 15, maxAmount: 15, regenerateRate: 0.05, lastRegenerate: Date.now() },
    { type: 'food', position: { x: 5, y: 25 }, amount: 20, maxAmount: 20, regenerateRate: 0.2, lastRegenerate: Date.now() },
    { type: 'food', position: { x: 8, y: 27 }, amount: 20, maxAmount: 20, regenerateRate: 0.2, lastRegenerate: Date.now() },
    { type: 'gold', position: { x: 30, y: 30 }, amount: 5, maxAmount: 5, regenerateRate: 0.02, lastRegenerate: Date.now() },
  ];
}

export function isNearResource(
  agentPosition: { x: number; y: number },
  resource: Resource,
  maxDistance: number = 2
): boolean {
  const dx = Math.abs(agentPosition.x - resource.position.x);
  const dy = Math.abs(agentPosition.y - resource.position.y);
  return dx <= maxDistance && dy <= maxDistance;
}

export function collectResource(
  resource: Resource,
  inventory: Inventory
): { success: boolean; amount: number; newResource: Resource; newInventory: Inventory } {
  const config = RESOURCE_CONFIG[resource.type];
  
  if (resource.amount <= 0) {
    return {
      success: false,
      amount: 0,
      newResource: resource,
      newInventory: inventory,
    };
  }
  
  const collectAmount = Math.min(config.collectAmount, resource.amount);
  
  const newResource = {
    ...resource,
    amount: resource.amount - collectAmount,
  };
  
  const newInventory = {
    ...inventory,
    [resource.type]: inventory[resource.type] + collectAmount,
  };
  
  return {
    success: true,
    amount: collectAmount,
    newResource,
    newInventory,
  };
}

export function regenerateResource(resource: Resource): Resource {
  const now = Date.now();
  const timePassed = (now - resource.lastRegenerate) / 60000;
  
  if (resource.amount >= resource.maxAmount) {
    return resource;
  }
  
  const regenerateAmount = Math.min(
    timePassed * resource.regenerateRate,
    resource.maxAmount - resource.amount
  );
  
  return {
    ...resource,
    amount: resource.amount + regenerateAmount,
    lastRegenerate: now,
  };
}

export function createEmptyInventory(): Inventory {
  return {
    wood: 0,
    stone: 0,
    food: 0,
    gold: 0,
  };
}

export function formatInventory(inventory: Inventory): string {
  return `🌲${inventory.wood} 🪨${inventory.stone} 🌾${inventory.food} 💰${inventory.gold}`;
}
