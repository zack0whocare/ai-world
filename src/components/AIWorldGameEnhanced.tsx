/**
 * AI World 增强版游戏界面 - 带动画和美化效果
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

// 地图配置
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 700;
const TILE_SIZE = 50;

// 资源图标映射（更丰富）
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

// 性格图标映射（扩展到8种）
const PERSONALITY_ICONS: Record<string, string> = {
  gatherer: "👷",
  builder: "👨‍🔧",
  merchant: "👨‍💼",
  explorer: "🧭",
  scholar: "📚",
  artist: "🎨",
  guardian: "🛡️",
  healer: "💚",
};

// 性格名称映射
const PERSONALITY_NAMES: Record<string, string> = {
  gatherer: "采集者",
  builder: "建造者",
  merchant: "商人",
  explorer: "探险家",
  scholar: "学者",
  artist: "艺术家",
  guardian: "守护者",
  healer: "治疗师",
};

// 动画状态接口
interface AgentAnimation {
  agentId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  action?: string;
}

export default function AIWorldGameEnhanced() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [animations, setAnimations] = useState<Map<string, AgentAnimation>>(new Map());
  const [previousAgentPositions, setPreviousAgentPositions] = useState<Map<string, {x: number, y: number}>>(new Map());

  // 获取游戏数据
  const agents = useQuery(api.aiworld.mutations.getAllAgents) || [];
  const resources = useQuery(api.aiworld.mutations.getAllResources) || [];
  const buildings = useQuery(api.aiworld.mutations.getAllBuildings) || [];

  // AI 决策 Action
  const runAIDecisions = useAction(api.aiworld.ai_decision_action.runAllAIDecisionsAction);

  // 添加日志
  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev.slice(-19), `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  // 检测智能体位置变化并创建动画
  useEffect(() => {
    const newAnimations = new Map(animations);
    
    agents.forEach((agent: any) => {
      const prevPos = previousAgentPositions.get(agent._id);
      const currentPos = agent.position;
      
      if (prevPos && (prevPos.x !== currentPos.x || prevPos.y !== currentPos.y)) {
        // 位置发生变化，创建动画
        newAnimations.set(agent._id, {
          agentId: agent._id,
          fromX: prevPos.x,
          fromY: prevPos.y,
          toX: currentPos.x,
          toY: currentPos.y,
          progress: 0,
        });
      }
    });

    // 更新位置记录
    const newPositions = new Map();
    agents.forEach((agent: any) => {
      newPositions.set(agent._id, { x: agent.position.x, y: agent.position.y });
    });
    setPreviousAgentPositions(newPositions);
    setAnimations(newAnimations);
  }, [agents]);

  // 动画循环
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setAnimations((prev) => {
        const updated = new Map(prev);
        let hasChanges = false;

        updated.forEach((anim, agentId) => {
          if (anim.progress < 1) {
            anim.progress += 0.1; // 动画速度
            hasChanges = true;
          } else {
            updated.delete(agentId);
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 50); // 50ms 更新一次

    return () => clearInterval(animationInterval);
  }, []);

  // 获取智能体当前渲染位置（考虑动画）
  const getAgentRenderPosition = (agent: any) => {
    const anim = animations.get(agent._id);
    if (anim && anim.progress < 1) {
      // 使用缓动函数
      const easeProgress = 1 - Math.pow(1 - anim.progress, 3); // easeOut cubic
      return {
        x: anim.fromX + (anim.toX - anim.fromX) * easeProgress,
        y: anim.fromY + (anim.toY - anim.fromY) * easeProgress,
      };
    }
    return agent.position;
  };

  // 渲染游戏画面
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 创建渐变背景（草地到天空）
    const gradient = ctx.createLinearGradient(0, 0, 0, MAP_HEIGHT);
    gradient.addColorStop(0, "#87CEEB"); // 天空蓝
    gradient.addColorStop(0.3, "#B0E0E6"); // 浅蓝
    gradient.addColorStop(0.7, "#90EE90"); // 浅绿
    gradient.addColorStop(1, "#228B22"); // 深绿
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // 绘制装饰性的云朵
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    for (let i = 0; i < 5; i++) {
      const x = (i * 250 + Date.now() / 100) % (MAP_WIDTH + 100);
      const y = 30 + i * 20;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
      ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制草地纹理（点状）
    ctx.fillStyle = "rgba(34, 139, 34, 0.3)";
    for (let x = 0; x < MAP_WIDTH; x += 20) {
      for (let y = MAP_HEIGHT * 0.5; y < MAP_HEIGHT; y += 20) {
        if (Math.random() > 0.7) {
          ctx.fillRect(x, y, 2, 4);
        }
      }
    }

    // 绘制网格（更细腻）
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    for (let x = 0; x < MAP_WIDTH; x += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MAP_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < MAP_HEIGHT; y += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(MAP_WIDTH, y);
      ctx.stroke();
    }

    // 绘制资源点（带阴影和光晕）
    resources.forEach((resource: any) => {
      const x = (resource.position?.x || 0) * TILE_SIZE;
      const y = (resource.position?.y || 0) * TILE_SIZE;

      // 绘制光晕
      const glowGradient = ctx.createRadialGradient(
        x + TILE_SIZE / 2,
        y + TILE_SIZE / 2,
        0,
        x + TILE_SIZE / 2,
        y + TILE_SIZE / 2,
        TILE_SIZE / 2
      );
      glowGradient.addColorStop(0, "rgba(255, 215, 0, 0.3)");
      glowGradient.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

      // 资源图标
      ctx.font = "32px Arial";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(RESOURCE_ICONS[resource.type] || "❓", x + 9, y + 35);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 资源数量（带背景）
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(x + 5, y + TILE_SIZE - 20, 40, 15);
      ctx.font = "bold 12px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.fillText(`${resource.amount}`, x + 10, y + TILE_SIZE - 8);
    });

    // 绘制建筑（带阴影）
    buildings.forEach((building: any) => {
      const x = (building.position?.x || 0) * TILE_SIZE;
      const y = (building.position?.y || 0) * TILE_SIZE;

      // 建筑阴影
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(x + 5, y + TILE_SIZE - 5, TILE_SIZE - 5, 5);

      // 建筑图标
      ctx.font = "36px Arial";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(BUILDING_ICONS[building.type] || "🏗️", x + 7, y + 38);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 建筑名称
      ctx.font = "10px Arial";
      ctx.fillStyle = "#FFF";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeText(building.type, x + 5, y + TILE_SIZE - 5);
      ctx.fillText(building.type, x + 5, y + TILE_SIZE - 5);
    });

    // 绘制智能体（带动画和状态指示）
    agents.forEach((agent: any) => {
      const renderPos = getAgentRenderPosition(agent);
      const x = renderPos.x * TILE_SIZE;
      const y = renderPos.y * TILE_SIZE;

      // 选中高亮
      if (selectedAgent && selectedAgent._id === agent._id) {
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, TILE_SIZE + 4, TILE_SIZE + 4);
      }

      // 智能体阴影
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE - 5, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 智能体图标
      ctx.font = "40px Arial";
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(PERSONALITY_ICONS[agent.personality] || "🤖", x + 5, y + 38);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 智能体名字（带背景）
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      const nameWidth = ctx.measureText(agent.name).width;
      ctx.fillRect(x + TILE_SIZE / 2 - nameWidth / 2 - 5, y - 20, nameWidth + 10, 16);
      ctx.font = "12px Arial";
      ctx.fillStyle = "#FFF";
      ctx.fillText(agent.name, x + TILE_SIZE / 2 - nameWidth / 2, y - 8);

      // 状态指示器（能量条）
      const energyPercent = Math.min(1, (agent.inventory?.food || 0) / 50);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(x + 5, y + TILE_SIZE - 10, TILE_SIZE - 10, 5);
      ctx.fillStyle = energyPercent > 0.5 ? "#00FF00" : energyPercent > 0.2 ? "#FFA500" : "#FF0000";
      ctx.fillRect(x + 5, y + TILE_SIZE - 10, (TILE_SIZE - 10) * energyPercent, 5);
    });

    // 绘制动画效果（移动轨迹）
    animations.forEach((anim) => {
      if (anim.progress < 1) {
        const fromX = anim.fromX * TILE_SIZE + TILE_SIZE / 2;
        const fromY = anim.fromY * TILE_SIZE + TILE_SIZE / 2;
        const toX = anim.toX * TILE_SIZE + TILE_SIZE / 2;
        const toY = anim.toY * TILE_SIZE + TILE_SIZE / 2;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }, [agents, resources, buildings, selectedAgent, animations]);

  // 处理画布点击
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 检查是否点击了智能体
    for (const agent of agents) {
      const renderPos = getAgentRenderPosition(agent);
      const agentX = renderPos.x * TILE_SIZE;
      const agentY = renderPos.y * TILE_SIZE;

      if (
        clickX >= agentX &&
        clickX <= agentX + TILE_SIZE &&
        clickY >= agentY &&
        clickY <= agentY + TILE_SIZE
      ) {
        setSelectedAgent(agent);
        addLog(`选中智能体: ${agent.name}`);
        return;
      }
    }

    setSelectedAgent(null);
  };

  // 执行 AI 决策
  const handleRunAI = async () => {
    try {
      addLog("🤖 开始执行 AI 决策...");
      const result = await runAIDecisions({ useAI: true });
      addLog(`✅ AI 决策完成: ${result.successCount}/${result.totalAgents} 成功`);
      
      // 显示每个智能体的决策
      result.results.forEach((r: any) => {
        if (r.success && r.decision) {
          addLog(`${r.agentName}: ${r.decision.action} - ${r.decision.reason}`);
        }
      });
    } catch (error: any) {
      addLog(`❌ AI 决策失败: ${error.message}`);
    }
  };

  // 自动运行
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      handleRunAI();
    }, 10000); // 每 10 秒执行一次

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      {/* 主游戏区域 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px" }}>
        <div style={{ 
          background: "rgba(255, 255, 255, 0.95)", 
          borderRadius: "15px", 
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h2 style={{ margin: 0, color: "#333", fontSize: "24px", fontWeight: "bold" }}>
              🌍 AI World - 智能体虚拟世界
            </h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setIsRunning(!isRunning)}
                style={{
                  padding: "10px 20px",
                  fontSize: "16px",
                  background: isRunning ? "#FF6B6B" : "#4ECDC4",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                  transition: "all 0.3s"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {isRunning ? "⏸️ 暂停" : "▶️ 开始"}
              </button>
              <button
                onClick={handleRunAI}
                disabled={isRunning}
                style={{
                  padding: "10px 20px",
                  fontSize: "16px",
                  background: isRunning ? "#CCC" : "#95E1D3",
                  color: isRunning ? "#666" : "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isRunning ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  boxShadow: isRunning ? "none" : "0 4px 6px rgba(0, 0, 0, 0.2)",
                }}
              >
                🤖 执行一次
              </button>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            onClick={handleCanvasClick}
            style={{
              border: "3px solid #333",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.2)"
            }}
          />
        </div>
      </div>

      {/* 侧边栏 */}
      <div style={{ width: "350px", padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
        {/* 统计信息 */}
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "15px",
          padding: "15px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>📊 统计信息</h3>
          <div style={{ fontSize: "14px", color: "#666" }}>
            <div>🤖 智能体: {agents.length}</div>
            <div>📦 资源点: {resources.length}</div>
            <div>🏗️ 建筑: {buildings.length}</div>
          </div>
        </div>

        {/* 选中的智能体 */}
        {selectedAgent && (
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "15px",
            padding: "15px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
          }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>
              {PERSONALITY_ICONS[selectedAgent.personality]} {selectedAgent.name}
            </h3>
            <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.6" }}>
              <div><strong>性格:</strong> {PERSONALITY_NAMES[selectedAgent.personality] || selectedAgent.personality}</div>
              <div><strong>位置:</strong> ({selectedAgent.position.x}, {selectedAgent.position.y})</div>
              <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #DDD" }}>
                <strong>库存:</strong>
                <div>🌲 木材: {selectedAgent.inventory?.wood || 0}</div>
                <div>🪨 石头: {selectedAgent.inventory?.stone || 0}</div>
                <div>🌾 食物: {selectedAgent.inventory?.food || 0}</div>
                <div>💰 金币: {selectedAgent.inventory?.gold || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* 活动日志 */}
        <div style={{
          flex: 1,
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "15px",
          padding: "15px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>📜 活动日志</h3>
          <div style={{
            flex: 1,
            overflow: "auto",
            fontSize: "12px",
            color: "#666",
            fontFamily: "monospace",
            background: "#F5F5F5",
            padding: "10px",
            borderRadius: "8px"
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: "5px" }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
