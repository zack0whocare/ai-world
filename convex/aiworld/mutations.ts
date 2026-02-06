/**
 * AI World Mutations - 玩家操作和AI管理
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { createPlayerAgent } from "./player_agents";
import { createEmptyInventory } from "./resources";
import { generatePersonality, generateGoalsForPersonality } from "./goals";

export const createAgent = mutation({
  args: {
    playerId: v.string(),
    playerName: v.string(),
    config: v.object({
      name: v.string(),
      personalityType: v.optional(v.string()),
      backstory: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    console.log(`🤖 创建AI Agent: ${args.config.name}`);
    
    // 检查玩家已有的AI数量
    const existingAgents = await ctx.db
      .query("agentExtensions")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    
    if (existingAgents.length >= 3) {
      return { 
        success: false, 
        error: "每个玩家最多只能创建3个AI Agent" 
      };
    }
    
    // 创建AI Agent
    const agent = createPlayerAgent(
      args.playerId,
      args.playerName,
      {
        name: args.config.name,
        personalityType: args.config.personalityType as any,
        backstory: args.config.backstory,
      }
    );
    
    // 保存到数据库
    const agentExtensionId = await ctx.db.insert("agentExtensions", {
      agentId: agent.id,
      playerId: agent.playerId,
      playerName: agent.playerName,
      inventory: agent.inventory,
      goals: agent.goals,
      personality: agent.personality,
      prestige: agent.prestige,
      level: agent.level,
      experience: agent.experience,
      stats: agent.stats,
    });
    
    console.log(`✅ AI Agent创建成功: ${agent.name} (${agent.personality.archetype})`);
    
    return {
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        personality: agent.personality,
        goals: agent.goals,
      },
    };
  },
});

export const getPlayerAgents = query({
  args: {
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("agentExtensions")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    
    return agents;
  },
});

export const getAgentDetails = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agentExtensions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();
    
    if (!agent) {
      return null;
    }
    
    // 获取该Agent的建筑
    const buildings = await ctx.db
      .query("buildings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.agentId))
      .collect();
    
    return {
      ...agent,
      buildings,
    };
  },
});

export const getAllResources = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("resources").collect();
  },
});

export const getAllBuildings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("buildings").collect();
  },
});
