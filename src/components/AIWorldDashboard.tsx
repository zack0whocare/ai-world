import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function AIWorldDashboard() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);

  // Queries
  const agents = useQuery(api.aiworld.mutations.getAllAgents);
  const resources = useQuery(api.aiworld.mutations.getAllResources);
  const buildings = useQuery(api.aiworld.mutations.getAllBuildings);
  const pendingTrades = useQuery(api.aiworld.trade_mutations.getPendingTrades);

  // Mutations
  const createAgent = useMutation(api.aiworld.mutations.createAgent);
  const initWorld = useMutation(api.aiworld.init.initializeWorld);
  const runAllDecisions = useMutation(api.aiworld.ai_decisions.runAllAgentDecisions);

  // Auto-run AI decisions
  useEffect(() => {
    if (!autoRunning) return;

    const interval = setInterval(() => {
      runAllDecisions({});
    }, 5000); // Run every 5 seconds

    return () => clearInterval(interval);
  }, [autoRunning, runAllDecisions]);

  const handleCreateAgent = async (personality: string) => {
    const names: Record<string, string> = {
      gatherer: '采集者',
      builder: '建造者',
      trader: '商人',
      explorer: '探险家',
      defender: '守卫者',
    };

    const randomX = Math.floor(Math.random() * 40) + 5;
    const randomY = Math.floor(Math.random() * 40) + 5;

    await createAgent({
      name: `${names[personality]}${Math.floor(Math.random() * 100)}`,
      personality,
      position: { x: randomX, y: randomY },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            AI World Dashboard
          </h1>
          <p className="text-gray-300 text-lg">
            Autonomous AI agents living in a simulated world
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/20">
          <h2 className="text-2xl font-semibold mb-4">Control Panel</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => initWorld({})}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all"
            >
              Initialize World
            </button>
            <button
              onClick={() => setAutoRunning(!autoRunning)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                autoRunning
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-lg hover:shadow-red-500/50'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/50'
              }`}
            >
              {autoRunning ? 'Stop Auto-Run' : 'Start Auto-Run'}
            </button>
            <button
              onClick={() => runAllDecisions({})}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              Run All AI Decisions
            </button>
          </div>
        </div>

        {/* Create Agents */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/20">
          <h2 className="text-2xl font-semibold mb-4">Create AI Agents</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['gatherer', 'builder', 'trader', 'explorer', 'defender'].map((personality) => (
              <button
                key={personality}
                onClick={() => handleCreateAgent(personality)}
                className="px-4 py-3 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg font-medium hover:from-slate-600 hover:to-slate-700 transition-all border border-purple-500/30 hover:border-purple-500/60"
              >
                {personality.charAt(0).toUpperCase() + personality.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agents List */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <h2 className="text-2xl font-semibold mb-4">
              AI Agents ({agents?.length || 0})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {agents?.map((agent: any) => (
                <div
                  key={agent._id}
                  onClick={() => setSelectedAgent(agent.agentId)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedAgent === agent.agentId
                      ? 'bg-purple-600/30 border-2 border-purple-500'
                      : 'bg-slate-700/50 border border-slate-600 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{agent.name}</h3>
                    <span className="px-3 py-1 bg-blue-500/30 rounded-full text-sm">
                      {agent.personality}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Wood:</span>
                      <span className="ml-1 font-medium">{agent.inventory.wood}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Stone:</span>
                      <span className="ml-1 font-medium">{agent.inventory.stone}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Food:</span>
                      <span className="ml-1 font-medium">{agent.inventory.food}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Gold:</span>
                      <span className="ml-1 font-medium text-yellow-400">{agent.inventory.gold}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Position: ({agent.position.x}, {agent.position.y})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resources List */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <h2 className="text-2xl font-semibold mb-4">
              Resources ({resources?.length || 0})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {resources?.map((resource: any) => (
                <div
                  key={resource._id}
                  className="p-4 rounded-lg bg-slate-700/50 border border-slate-600"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold capitalize">{resource.type}</h3>
                    <span className="text-sm text-gray-400">
                      ({resource.position.x}, {resource.position.y})
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(resource.amount / resource.maxAmount) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-sm text-gray-400">
                    {resource.amount.toFixed(1)} / {resource.maxAmount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buildings List */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <h2 className="text-2xl font-semibold mb-4">
              Buildings ({buildings?.length || 0})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {buildings?.map((building: any) => (
                <div
                  key={building._id}
                  className="p-4 rounded-lg bg-slate-700/50 border border-slate-600"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold capitalize">{building.type}</h3>
                    <span className="px-2 py-1 bg-green-500/30 rounded text-xs">
                      Level {building.level}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    Owner: {building.ownerId}
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-500 to-orange-600 h-2 rounded-full"
                      style={{ width: `${building.health}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    Health: {building.health}% | Position: ({building.position.x}, {building.position.y})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Trades */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <h2 className="text-2xl font-semibold mb-4">
              Pending Trades ({pendingTrades?.length || 0})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingTrades?.map((trade: any) => (
                <div
                  key={trade._id}
                  className="p-4 rounded-lg bg-slate-700/50 border border-slate-600"
                >
                  <div className="text-sm mb-2">
                    <span className="font-semibold">{trade.fromAgentName}</span>
                    <span className="text-gray-400"> → </span>
                    <span className="font-semibold">{trade.toAgentName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-gray-400 mb-1">Offering:</div>
                      {Object.entries(trade.offering).map(([resource, amount]: any) => (
                        <div key={resource}>
                          {resource}: {amount}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Requesting:</div>
                      {Object.entries(trade.requesting).map(([resource, amount]: any) => (
                        <div key={resource}>
                          {resource}: {amount}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
