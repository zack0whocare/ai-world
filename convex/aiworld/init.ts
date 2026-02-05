/**
 * AI World 初始化函数
 */

import { mutation, query } from "../_generated/server";
import { initializeResources } from "./resources";

export const initializeWorld = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🌍 开始初始化AI World...");
    
    // 检查是否已经初始化
    const existingResources = await ctx.db.query("resources").collect();
    if (existingResources.length > 0) {
      console.log("⚠️ AI World已经初始化过了");
      return { success: false, message: "AI World已经初始化过了" };
    }
    
    // 初始化资源点
    const resources = initializeResources();
    for (const resource of resources) {
      await ctx.db.insert("resources", resource);
    }
    
    console.log(`✅ 初始化了 ${resources.length} 个资源点`);
    console.log("🎉 AI World初始化完成!");
    
    return { 
      success: true, 
      message: `AI World初始化完成! 创建了${resources.length}个资源点` 
    };
  },
});

export const getWorldStatus = query({
  args: {},
  handler: async (ctx) => {
    const resources = await ctx.db.query("resources").collect();
    const buildings = await ctx.db.query("buildings").collect();
    const agents = await ctx.db.query("agentExtensions").collect();
    const trades = await ctx.db.query("tradeOffers").collect();
    
    return {
      initialized: resources.length > 0,
      resourceCount: resources.length,
      buildingCount: buildings.length,
      agentCount: agents.length,
      tradeCount: trades.length,
    };
  },
});

export const resetWorld = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🔄 重置AI World...");
    
    // 删除所有资源
    const resources = await ctx.db.query("resources").collect();
    for (const resource of resources) {
      await ctx.db.delete(resource._id);
    }
    
    // 删除所有建筑
    const buildings = await ctx.db.query("buildings").collect();
    for (const building of buildings) {
      await ctx.db.delete(building._id);
    }
    
    // 删除所有交易
    const trades = await ctx.db.query("tradeOffers").collect();
    for (const trade of trades) {
      await ctx.db.delete(trade._id);
    }
    
    // 删除所有Agent扩展数据
    const agents = await ctx.db.query("agentExtensions").collect();
    for (const agent of agents) {
      await ctx.db.delete(agent._id);
    }
    
    console.log("✅ AI World重置完成");
    
    return { success: true, message: "AI World重置完成" };
  },
});
