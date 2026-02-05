/**
 * 目标系统 - AI World Extension
 */

import { Inventory, ResourceType } from './resources';
import { BuildingType } from './building';

export type GoalType = 
  | 'collect_resources'
  | 'build_structure'
  | 'accumulate_wealth'
  | 'become_trader'
  | 'explore_world'
  | 'help_community';

export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  description: string;
  priority: GoalPriority;
  progress: number;
  requirements: GoalRequirement[];
  rewards: GoalReward;
  createdAt: number;
  completedAt?: number;
}

export interface GoalRequirement {
  type: 'resource' | 'building' | 'trade' | 'social';
  target: string;
  current: number;
  required: number;
  description: string;
}

export interface GoalReward {
  prestige: number;
  title?: string;
  resources?: Partial<Inventory>;
  description: string;
}

export interface AgentPersonality {
  archetype: 'builder' | 'trader' | 'collector' | 'explorer' | 'helper';
  traits: string[];
  preferredGoals: GoalType[];
  riskTolerance: number;
  sociability: number;
}

export const GOAL_TEMPLATES: Record<GoalType, Omit<Goal, 'id' | 'createdAt' | 'progress'>> = {
  collect_resources: {
    type: 'collect_resources',
    title: '资源收集者',
    description: '收集大量基础资源',
    priority: 'medium',
    requirements: [
      { type: 'resource', target: 'wood', current: 0, required: 50, description: '收集50单位木材' },
      { type: 'resource', target: 'stone', current: 0, required: 30, description: '收集30单位石头' },
    ],
    rewards: {
      prestige: 20,
      title: '勤劳的收集者',
      description: '获得声望+20',
    },
  },
  
  build_structure: {
    type: 'build_structure',
    title: '建筑大师',
    description: '建造多种建筑',
    priority: 'high',
    requirements: [
      { type: 'building', target: 'house', current: 0, required: 1, description: '建造一座房屋' },
      { type: 'building', target: 'workshop', current: 0, required: 1, description: '建造一座工坊' },
    ],
    rewards: {
      prestige: 50,
      title: '建筑大师',
      resources: { gold: 5 },
      description: '获得声望+50和5金币',
    },
  },
  
  accumulate_wealth: {
    type: 'accumulate_wealth',
    title: '财富积累',
    description: '积累大量金币',
    priority: 'high',
    requirements: [
      { type: 'resource', target: 'gold', current: 0, required: 20, description: '积累20金币' },
    ],
    rewards: {
      prestige: 30,
      title: '富有的商人',
      description: '获得声望+30',
    },
  },
  
  become_trader: {
    type: 'become_trader',
    title: '贸易专家',
    description: '完成多次交易',
    priority: 'medium',
    requirements: [
      { type: 'trade', target: 'completed', current: 0, required: 10, description: '完成10次交易' },
    ],
    rewards: {
      prestige: 25,
      title: '贸易专家',
      resources: { gold: 3 },
      description: '获得声望+25和3金币',
    },
  },
  
  explore_world: {
    type: 'explore_world',
    title: '探险家',
    description: '探索世界各地',
    priority: 'low',
    requirements: [
      { type: 'social', target: 'locations_visited', current: 0, required: 15, description: '访问15个不同位置' },
    ],
    rewards: {
      prestige: 15,
      title: '探险家',
      description: '获得声望+15',
    },
  },
  
  help_community: {
    type: 'help_community',
    title: '社区帮手',
    description: '帮助其他Agent',
    priority: 'medium',
    requirements: [
      { type: 'social', target: 'gifts_given', current: 0, required: 5, description: '赠送资源5次' },
      { type: 'trade', target: 'fair_trades', current: 0, required: 5, description: '完成5次公平交易' },
    ],
    rewards: {
      prestige: 40,
      title: '社区之星',
      description: '获得声望+40',
    },
  },
};

export function generateGoalsForPersonality(personality: AgentPersonality): Goal[] {
  const goals: Goal[] = [];
  const now = Date.now();
  
  for (const goalType of personality.preferredGoals) {
    const template = GOAL_TEMPLATES[goalType];
    const goal: Goal = {
      ...template,
      id: `goal_${now}_${Math.random().toString(36).substr(2, 9)}`,
      progress: 0,
      createdAt: now,
      requirements: template.requirements.map(r => ({ ...r })),
    };
    
    goals.push(goal);
  }
  
  return goals.slice(0, 3);
}

export function generatePersonality(seed?: string): AgentPersonality {
  const random = seed ? seededRandom(seed) : Math.random;
  
  const archetypes: AgentPersonality['archetype'][] = [
    'builder', 'trader', 'collector', 'explorer', 'helper'
  ];
  
  const archetype = archetypes[Math.floor(random() * archetypes.length)];
  
  const personalityMap: Record<AgentPersonality['archetype'], Partial<AgentPersonality>> = {
    builder: {
      traits: ['勤劳', '有远见', '专注'],
      preferredGoals: ['build_structure', 'collect_resources', 'accumulate_wealth'],
      riskTolerance: 0.4,
      sociability: 0.5,
    },
    trader: {
      traits: ['精明', '善于交际', '冒险'],
      preferredGoals: ['become_trader', 'accumulate_wealth', 'help_community'],
      riskTolerance: 0.7,
      sociability: 0.8,
    },
    collector: {
      traits: ['耐心', '细致', '节俭'],
      preferredGoals: ['collect_resources', 'accumulate_wealth', 'build_structure'],
      riskTolerance: 0.3,
      sociability: 0.4,
    },
    explorer: {
      traits: ['好奇', '勇敢', '独立'],
      preferredGoals: ['explore_world', 'collect_resources', 'help_community'],
      riskTolerance: 0.8,
      sociability: 0.6,
    },
    helper: {
      traits: ['友善', '慷慨', '外向'],
      preferredGoals: ['help_community', 'become_trader', 'explore_world'],
      riskTolerance: 0.5,
      sociability: 0.9,
    },
  };
  
  return {
    archetype,
    ...personalityMap[archetype],
  } as AgentPersonality;
}

function seededRandom(seed: string): () => number {
  let value = 0;
  for (let i = 0; i < seed.length; i++) {
    value += seed.charCodeAt(i);
  }
  
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function decideNextAction(
  goals: Goal[],
  inventory: Inventory,
  position: { x: number; y: number },
  personality: AgentPersonality
): {
  action: 'collect' | 'build' | 'trade' | 'explore' | 'idle';
  target?: string;
  reason: string;
} {
  const activeGoals = goals
    .filter(g => !g.completedAt)
    .sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  
  if (activeGoals.length === 0) {
    return {
      action: 'idle',
      reason: '没有活跃目标',
    };
  }
  
  const topGoal = activeGoals[0];
  const unfinishedReqs = topGoal.requirements.filter(req => req.current < req.required);
  
  if (unfinishedReqs.length === 0) {
    return {
      action: 'idle',
      reason: '目标即将完成',
    };
  }
  
  const nextReq = unfinishedReqs[0];
  
  if (nextReq.type === 'resource') {
    return {
      action: 'collect',
      target: nextReq.target,
      reason: `为目标"${topGoal.title}"收集${nextReq.target}`,
    };
  }
  
  if (nextReq.type === 'building') {
    return {
      action: 'build',
      target: nextReq.target,
      reason: `为目标"${topGoal.title}"建造${nextReq.target}`,
    };
  }
  
  if (nextReq.type === 'trade') {
    return {
      action: 'trade',
      reason: `为目标"${topGoal.title}"进行交易`,
    };
  }
  
  if (nextReq.type === 'social') {
    return {
      action: 'explore',
      reason: `为目标"${topGoal.title}"探索世界`,
    };
  }
  
  return {
    action: 'idle',
    reason: '等待机会',
  };
}
