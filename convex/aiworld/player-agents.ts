/**
 * 玩家AI创建系统 - AI World Extension
 */

import { AgentPersonality, generatePersonality, generateGoalsForPersonality, Goal } from './goals';
import { createEmptyInventory, Inventory } from './resources';

export interface PlayerAgent {
  id: string;
  playerId: string;
  playerName: string;
  name: string;
  personality: AgentPersonality;
  appearance: AgentAppearance;
  inventory: Inventory;
  position: { x: number; y: number };
  goals: Goal[];
  prestige: number;
  level: number;
  experience: number;
  createdAt: number;
  backstory?: string;
  stats: AgentStats;
}

export interface AgentAppearance {
  sprite: string;
  color: string;
  accessories: string[];
}

export interface AgentStats {
  totalResourcesCollected: number;
  buildingsBuilt: number;
  tradesCompleted: number;
  locationsVisited: number;
  friendsMade: number;
  goalsCompleted: number;
  hoursActive: number;
}

export const AVAILABLE_SPRITES = [
  { id: 'sprite_1', name: '农夫', icon: '👨‍🌾' },
  { id: 'sprite_2', name: '工匠', icon: '👷' },
  { id: 'sprite_3', name: '商人', icon: '🧑‍💼' },
  { id: 'sprite_4', name: '探险家', icon: '🧑‍🚀' },
  { id: 'sprite_5', name: '学者', icon: '👨‍🎓' },
  { id: 'sprite_6', name: '艺术家', icon: '🧑‍🎨' },
];

export const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
];

export function createPlayerAgent(
  playerId: string,
  playerName: string,
  agentConfig: {
    name: string;
    personalityType?: AgentPersonality['archetype'];
    appearance?: Partial<AgentAppearance>;
    startPosition?: { x: number; y: number };
    backstory?: string;
  }
): PlayerAgent {
  const now = Date.now();
  
  const personality = agentConfig.personalityType
    ? generatePersonality(agentConfig.personalityType)
    : generatePersonality(agentConfig.name);
  
  const goals = generateGoalsForPersonality(personality);
  
  const appearance: AgentAppearance = {
    sprite: agentConfig.appearance?.sprite || AVAILABLE_SPRITES[0].id,
    color: agentConfig.appearance?.color || AVAILABLE_COLORS[0],
    accessories: agentConfig.appearance?.accessories || [],
  };
  
  const position = agentConfig.startPosition || {
    x: 15 + Math.floor(Math.random() * 10),
    y: 15 + Math.floor(Math.random() * 10),
  };
  
  const agent: PlayerAgent = {
    id: `agent_${now}_${Math.random().toString(36).substr(2, 9)}`,
    playerId,
    playerName,
    name: agentConfig.name,
    personality,
    appearance,
    inventory: {
      ...createEmptyInventory(),
      wood: 5,
      food: 3,
    },
    position,
    goals,
    prestige: 0,
    level: 1,
    experience: 0,
    createdAt: now,
    backstory: agentConfig.backstory,
    stats: {
      totalResourcesCollected: 0,
      buildingsBuilt: 0,
      tradesCompleted: 0,
      locationsVisited: 1,
      friendsMade: 0,
      goalsCompleted: 0,
      hoursActive: 0,
    },
  };
  
  return agent;
}

export const EXPERIENCE_REWARDS = {
  collectResource: 2,
  buildBuilding: 50,
  completeTrade: 10,
  completeGoal: 100,
  discoverLocation: 5,
  makeFriend: 20,
  upgradeBuilding: 30,
};
