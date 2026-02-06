/**
 * 交易系统 Mutations - AI World Extension
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { createTradeOffer, isTradeReasonable } from "./trading";

/**
 * 创建交易提议
 */
export const createTrade = mutation({
  args: {
    fromAgentId: v.string(),
    toAgentId: v.string(),
    offering: v.object({
      wood: v.optional(v.number()),
      stone: v.optional(v.number()),
      food: v.optional(v.number()),
      gold: v.optional(v.number()),
    }),
    requesting: v.object({
      wood: v.optional(v.number()),
      stone: v.optional(v.number()),
      food: v.optional(v.number()),
      gold: v.optional(v.number()),
    }),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 获取发起者智能体
    const fromAgent = await ctx.db
      .query("agentExtensions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.fromAgentId))
      .first();

    if (!fromAgent) {
      return { success: false, error: "发起者智能体不存在" };
    }

    // 获取接收者智能体
    const toAgent = await ctx.db
      .query("agentExtensions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.toAgentId))
      .first();

    if (!toAgent) {
      return { success: false, error: "接收者智能体不存在" };
    }

    // 检查发起者是否有足够的资源
    const inventory = fromAgent.inventory as any;
    for (const [resource, amount] of Object.entries(args.offering)) {
      const offerAmount = amount as number;
      if (offerAmount && inventory[resource] < offerAmount) {
        return { success: false, error: `资源不足: ${resource}` };
      }
    }

    // 检查交易是否合理
    const fairness = isTradeReasonable(args.offering, args.requesting);
    if (!fairness.fair) {
      return {
        success: false,
        error: `交易不合理: ${fairness.reason}`,
        ratio: fairness.ratio,
      };
    }

    // 创建交易提议
    const trade = createTradeOffer(
      args.fromAgentId,
      fromAgent.name,
      args.toAgentId,
      toAgent.name,
      args.offering,
      args.requesting,
      args.message
    );

    // 保存到数据库
    const tradeId = await ctx.db.insert("tradeOffers", {
      id: trade.id,
      fromAgentId: trade.fromAgentId,
      fromAgentName: trade.fromAgentName,
      toAgentId: trade.toAgentId,
      toAgentName: trade.toAgentName,
      offering: args.offering,
      requesting: args.requesting,
      status: trade.status,
      createdAt: trade.createdAt,
      expiresAt: trade.expiresAt,
      message: trade.message,
    });

    return {
      success: true,
      message: `交易提议已发送给 ${toAgent.name}`,
      trade: { ...trade, _id: tradeId },
      fairness,
    };
  },
});

/**
 * 接受交易
 */
export const acceptTrade = mutation({
  args: {
    tradeId: v.id("tradeOffers"),
  },
  handler: async (ctx, args) => {
    const trade = await ctx.db.get(args.tradeId);
    if (!trade) {
      return { success: false, error: "交易不存在" };
    }

    if (trade.status !== "pending") {
      return { success: false, error: "交易已处理" };
    }

    if (Date.now() > (trade.expiresAt as number)) {
      await ctx.db.patch(args.tradeId, { status: "expired" });
      return { success: false, error: "交易已过期" };
    }

    // 获取双方智能体
    const fromAgent = await ctx.db
      .query("agentExtensions")
      .withIndex("by_agent", (q) => q.eq("agentId", trade.fromAgentId as string))
      .first();

    const toAgent = await ctx.db
      .query("agentExtensions")
      .withIndex("by_agent", (q) => q.eq("agentId", trade.toAgentId as string))
      .first();

    if (!fromAgent || !toAgent) {
      return { success: false, error: "智能体不存在" };
    }

    // 检查双方资源
    const fromInventory = fromAgent.inventory as any;
    const toInventory = toAgent.inventory as any;
    const offering = trade.offering as any;
    const requesting = trade.requesting as any;

    for (const [resource, amount] of Object.entries(offering)) {
      const offerAmount = amount as number;
      if (offerAmount && fromInventory[resource] < offerAmount) {
        return { success: false, error: `发起者资源不足: ${resource}` };
      }
    }

    for (const [resource, amount] of Object.entries(requesting)) {
      const requestAmount = amount as number;
      if (requestAmount && toInventory[resource] < requestAmount) {
        return { success: false, error: `接收者资源不足: ${resource}` };
      }
    }

    // 执行交易
    const newFromInventory = { ...fromInventory };
    const newToInventory = { ...toInventory };

    for (const [resource, amount] of Object.entries(offering)) {
      const offerAmount = amount as number;
      if (offerAmount) {
        newFromInventory[resource] -= offerAmount;
        newToInventory[resource] += offerAmount;
      }
    }

    for (const [resource, amount] of Object.entries(requesting)) {
      const requestAmount = amount as number;
      if (requestAmount) {
        newToInventory[resource] -= requestAmount;
        newFromInventory[resource] += requestAmount;
      }
    }

    // 更新智能体库存
    await ctx.db.patch(fromAgent._id, {
      inventory: newFromInventory,
      stats: {
        ...fromAgent.stats,
        tradesCompleted: fromAgent.stats.tradesCompleted + 1,
      },
    });

    await ctx.db.patch(toAgent._id, {
      inventory: newToInventory,
      stats: {
        ...toAgent.stats,
        tradesCompleted: toAgent.stats.tradesCompleted + 1,
      },
    });

    // 更新交易状态
    await ctx.db.patch(args.tradeId, { status: "completed" });

    return {
      success: true,
      message: "交易完成",
      fromInventory: newFromInventory,
      toInventory: newToInventory,
    };
  },
});

/**
 * 拒绝交易
 */
export const rejectTrade = mutation({
  args: {
    tradeId: v.id("tradeOffers"),
  },
  handler: async (ctx, args) => {
    const trade = await ctx.db.get(args.tradeId);
    if (!trade) {
      return { success: false, error: "交易不存在" };
    }

    if (trade.status !== "pending") {
      return { success: false, error: "交易已处理" };
    }

    await ctx.db.patch(args.tradeId, { status: "rejected" });

    return {
      success: true,
      message: "交易已拒绝",
    };
  },
});

/**
 * 获取智能体的所有交易
 */
export const getAgentTrades = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const sentTrades = await ctx.db
      .query("tradeOffers")
      .filter((q) => q.eq(q.field("fromAgentId"), args.agentId))
      .collect();

    const receivedTrades = await ctx.db
      .query("tradeOffers")
      .filter((q) => q.eq(q.field("toAgentId"), args.agentId))
      .collect();

    return {
      sent: sentTrades,
      received: receivedTrades,
    };
  },
});

/**
 * 获取所有待处理的交易
 */
export const getPendingTrades = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tradeOffers")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});
