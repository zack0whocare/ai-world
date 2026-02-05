/**
 * 交易系统 - AI World Extension
 */

import { Inventory, ResourceType } from './resources';

export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed';

export interface TradeOffer {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  offering: Partial<Inventory>;
  requesting: Partial<Inventory>;
  status: TradeStatus;
  createdAt: number;
  expiresAt: number;
  message?: string;
}

export function createTradeOffer(
  fromAgentId: string,
  fromAgentName: string,
  toAgentId: string,
  toAgentName: string,
  offering: Partial<Inventory>,
  requesting: Partial<Inventory>,
  message?: string
): TradeOffer {
  const now = Date.now();
  const expirationTime = 5 * 60 * 1000;
  
  return {
    id: `trade_${now}_${Math.random().toString(36).substr(2, 9)}`,
    fromAgentId,
    fromAgentName,
    toAgentId,
    toAgentName,
    offering,
    requesting,
    status: 'pending',
    createdAt: now,
    expiresAt: now + expirationTime,
    message,
  };
}

export function isTradeReasonable(
  offering: Partial<Inventory>,
  requesting: Partial<Inventory>
): { fair: boolean; ratio: number; reason?: string } {
  const resourceValues: Record<ResourceType, number> = {
    wood: 1,
    stone: 1.5,
    food: 0.8,
    gold: 5,
  };
  
  let offeringValue = 0;
  for (const [resource, amount] of Object.entries(offering)) {
    offeringValue += (amount || 0) * resourceValues[resource as ResourceType];
  }
  
  let requestingValue = 0;
  for (const [resource, amount] of Object.entries(requesting)) {
    requestingValue += (amount || 0) * resourceValues[resource as ResourceType];
  }
  
  if (requestingValue === 0) {
    return { fair: false, ratio: 0, reason: '无效交易' };
  }
  
  const ratio = offeringValue / requestingValue;
  
  if (ratio < 0.6) {
    return { fair: false, ratio, reason: '提供的价值太低' };
  }
  
  if (ratio > 1.7) {
    return { fair: false, ratio, reason: '提供的价值太高' };
  }
  
  return { fair: true, ratio };
}
