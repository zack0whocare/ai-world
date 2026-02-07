/**
 * AI World 游戏界面 - 可视化的 2D 游戏世界
 */

import React, { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

// 地图配置
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const TILE_SIZE = 40;

// 资源图标映射
const RESOURCE_ICONS: Record<string, string> = {
  wood: "🌲",
  stone: "🪨",
  food: "🌾",
  gold: "💰",
};

// 建筑图标映射
const BUILDING_ICONS: Record<string, string> = {
  house: "🏠",
  warehouse: "🏭",
  market: "🏪",
  watchtower: "🗼",
};

// 性格图标映射
const PERSONALITY_ICONS: Record<string, string> = {
  gatherer: "👷",
  builder: "👨‍🔧",
  merchant: "👨‍💼",
  explorer: "🧭",
  social: "👥",
};

export default function AIWorldGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // 获取游戏数据
  const agents = useQuery(api.aiworld.mutations.getAllAgents) || [];
  const resources = useQuery(api.aiworld.mutations.getAllResources) || [];
  const buildings = useQuery(api.aiworld.mutations.getAllBuildings) || [];

  // AI 决策 Action
  const runAIDecisions = useAction(api.aiworld.ai_decision_action.runAllAIDecisionsAction);

  // 添加日志
  const addLog = (message: string) => {
    setLogs((prev) => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // 渲染游戏画面
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = "#87CEEB"; // 天空蓝
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // 绘制草地网格
    ctx.strokeStyle = "#90EE90";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < MAP_WIDTH; x += TILE_SIZE) {
      for (let y = 0; y < MAP_HEIGHT; y += TILE_SIZE) {
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }

    // 绘制资源点
    resources.forEach((resource: any) => {
      const x = (resource.position?.x || 0) * TILE_SIZE;
      const y = (resource.position?.y || 0) * TILE_SIZE;

      // 资源图标
      ctx.font = "24px Arial";
      ctx.fillText(RESOURCE_ICONS[resource.type] || "❓", x + 8, y + 28);

      // 资源数量
      ctx.font = "12px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText(`${resource.amount}`, x + 5, y + TILE_SIZE - 5);
    });

    // 绘制建筑
    buildings.forEach((building: any) => {
      const x = (building.position?.x || 0) * TILE_SIZE;
      const y = (building.position?.y || 0) * TILE_SIZE;

      // 建筑图标
      ctx.font = "28px Arial";
      ctx.fillText(BUILDING_ICONS[building.type] || "🏗️", x + 6, y + 30);

      // 建筑名称
      ctx.font = "10px Arial";
      ctx.fillStyle = "#333";
      ctx.fillText(building.ownerName || "Unknown", x + 2, y + TILE_SIZE - 2);
    });

    // 绘制智能体
    agents.forEach((agent: any) => {
      const x = (agent.position?.x || 0) * TILE_SIZE;
      const y = (agent.position?.y || 0) * TILE_SIZE;

      const personality =
        typeof agent.personality === "string"
          ? agent.personality
          : agent.personality?.archetype || "gatherer";

      // 智能体图标
      ctx.font = "32px Arial";
      ctx.fillText(PERSONALITY_ICONS[personality] || "🤖", x + 4, y + 32);

      // 选中高亮
      if (selectedAgent?.agentId === agent.agentId) {
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      }

      // 智能体名字
      ctx.font = "10px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText(agent.name, x + 2, y - 2);
    });
  }, [agents, resources, buildings, selectedAgent]);

  // 自动运行循环
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        addLog("🤖 执行 AI 决策...");
        const result = await runAIDecisions({ useAI: true });
        
        if (result.success) {
          addLog(`✅ ${result.aiCount}/${result.totalAgents} 个智能体使用了 AI`);
          
          // 显示每个智能体的决策
          result.results.forEach((r: any) => {
            if (r.success && r.decision) {
              addLog(`${r.agentName}: ${r.decision.action} - ${r.decision.reason}`);
            }
          });
        }
      } catch (error: any) {
        addLog(`❌ 错误: ${error.message}`);
      }
    }, 8000); // 每 8 秒执行一次

    return () => clearInterval(interval);
  }, [isRunning, runAIDecisions]);

  // 点击画布选择智能体
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const tileX = Math.floor(clickX / TILE_SIZE);
    const tileY = Math.floor(clickY / TILE_SIZE);

    const clickedAgent = agents.find(
      (agent: any) =>
        agent.position?.x === tileX && agent.position?.y === tileY
    );

    setSelectedAgent(clickedAgent || null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">
            🌍 AI World
          </h1>
          <p className="text-xl text-gray-600">
            由豆包 AI 驱动的自主智能体世界
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 游戏画面 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">游戏世界</h2>
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`px-6 py-2 rounded-lg font-bold text-white transition-colors ${
                    isRunning
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {isRunning ? "⏸️ 暂停" : "▶️ 开始"}
                </button>
              </div>

              <canvas
                ref={canvasRef}
                width={MAP_WIDTH}
                height={MAP_HEIGHT}
                onClick={handleCanvasClick}
                className="border-4 border-gray-300 rounded-lg cursor-pointer"
              />

              <div className="mt-4 text-sm text-gray-600">
                <p>👷 采集者 | 👨‍🔧 建造者 | 👨‍💼 商人 | 🧭 探险家 | 👥 社交家</p>
                <p>🌲 木材 | 🪨 石头 | 🌾 食物 | 💰 金币</p>
              </div>
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 智能体信息 */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                智能体信息
              </h3>
              {selectedAgent ? (
                <div className="space-y-2">
                  <p className="font-bold text-lg">{selectedAgent.name}</p>
                  <p className="text-sm text-gray-600">
                    性格:{" "}
                    {typeof selectedAgent.personality === "string"
                      ? selectedAgent.personality
                      : selectedAgent.personality?.archetype}
                  </p>
                  <div className="text-sm">
                    <p className="font-semibold">库存:</p>
                    <p>🌲 木材: {selectedAgent.inventory?.wood || 0}</p>
                    <p>🪨 石头: {selectedAgent.inventory?.stone || 0}</p>
                    <p>🌾 食物: {selectedAgent.inventory?.food || 0}</p>
                    <p>💰 金币: {selectedAgent.inventory?.gold || 0}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">点击地图上的智能体查看详情</p>
              )}
            </div>

            {/* 活动日志 */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                活动日志
              </h3>
              <div className="space-y-1 text-xs font-mono max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500">等待活动...</p>
                ) : (
                  logs.map((log, i) => (
                    <p key={i} className="text-gray-700">
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* 统计信息 */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-xl font-bold text-gray-800 mb-3">统计</h3>
              <div className="space-y-2 text-sm">
                <p>🤖 智能体数量: {agents.length}</p>
                <p>🌲 资源点数量: {resources.length}</p>
                <p>🏠 建筑数量: {buildings.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
