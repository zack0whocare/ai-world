import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentTables } from './agent/schema';
import { aiTownTables } from './aiTown/schema';
import { conversationId, playerId } from './aiTown/ids';
import { engineTables } from './engine/schema';

export default defineSchema({
  music: defineTable({
    storageId: v.string(),
    type: v.union(v.literal('background'), v.literal('player')),
  }),

  messages: defineTable({
    conversationId,
    messageUuid: v.string(),
    author: playerId,
    text: v.string(),
    worldId: v.optional(v.id('worlds')),
  })
    .index('conversationId', ['worldId', 'conversationId'])
    .index('messageUuid', ['conversationId', 'messageUuid']),

  ...agentTables,
  ...aiTownTables,
  ...engineTables,

  // AI World Extension Tables
  resources: defineTable({
    id: v.string(),
    type: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    amount: v.number(),
    maxAmount: v.number(),
    regenerateRate: v.number(),
    lastRegenerate: v.number(),
  }),

  buildings: defineTable({
    id: v.string(),
    type: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    ownerId: v.string(),
    ownerName: v.string(),
    builtAt: v.number(),
    level: v.number(),
    health: v.number(),
    maxHealth: v.number(),
  }).index("by_owner", ["ownerId"]),

  tradeOffers: defineTable({
    id: v.string(),
    fromAgentId: v.string(),
    fromAgentName: v.string(),
    toAgentId: v.string(),
    toAgentName: v.string(),
    offering: v.any(),
    requesting: v.any(),
    status: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    message: v.optional(v.string()),
  }).index("by_recipient", ["toAgentId", "status"])
    .index("by_sender", ["fromAgentId"]),

  agentExtensions: defineTable({
    agentId: v.string(),
    playerId: v.string(),
    playerName: v.string(),
    inventory: v.any(),
    goals: v.any(),
    personality: v.any(),
    prestige: v.number(),
    level: v.number(),
    experience: v.number(),
    stats: v.any(),
  }).index("by_agent", ["agentId"])
    .index("by_player", ["playerId"]),
});
