/**
 * AI World 游戏界面 - 带地图拖动、缩放和小地图
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

// 地图配置
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 700;
const TILE_SIZE = 50;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

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
}

export default function AIWorldGameWithControls() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [animations, setAnimations] = useState<Map<string, AgentAnimation>>(new Map());
  const [previousAgentPositions, setPreviousAgentPositions] = useState<Map<string, {x: number, y: number}>>(new Map());
  
  // 地图控制状态
  const [zoom, setZoom] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
    
    setAnimations(newAnimations);
    
    // 更新位置记录
    const newPositions = new Map();
    agents.forEach((agent: any) => {
      newPositions.set(agent._id, { x: agent.position.x, y: agent.position.y });
    });
    setPreviousAgentPositions(newPositions);
  }, [agents]);

  // 更新动画
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimations((prev) => {
        const updated = new Map(prev);
        let hasChanges = false;
        
        updated.forEach((anim, key) => {
          if (anim.progress < 1) {
            anim.progress = Math.min(1, anim.progress + 0.05);
            hasChanges = true;
          } else {
            updated.delete(key);
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  // 获取智能体渲染位置（带动画）
  const getAgentRenderPosition = (agent: any) => {
    const anim = animations.get(agent._id);
    if (anim && anim.progress < 1) {
      // easeOut cubic
      const t = 1 - Math.pow(1 - anim.progress, 3);
      return {
        x: anim.fromX + (anim.toX - anim.fromX) * t,
        y: anim.fromY + (anim.toY - anim.fromY) * t,
      };
    }
    return agent.position;
  };

  // 绘制主地图
  const drawMainMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 保存状态
    ctx.save();

    // 应用缩放和偏移
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);

    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, MAP_HEIGHT);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.6, "#98D8C8");
    gradient.addColorStop(1, "#7CFC00");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // 绘制云朵
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    for (let i = 0; i < 5; i++) {
      const x = (i * 250 + Date.now() / 100) % (MAP_WIDTH + 200) - 100;
      const y = 50 + i * 30;
      ctx.beginPath();
      ctx.ellipse(x, y, 60, 30, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 40, y, 50, 25, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 20, y - 15, 40, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制草地纹理
    ctx.fillStyle = "rgba(34, 139, 34, 0.1)";
    for (let x = 0; x < MAP_WIDTH; x += 20) {
      for (let y = MAP_HEIGHT * 0.5; y < MAP_HEIGHT; y += 20) {
        if (Math.random() > 0.7) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    // 绘制网格
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= MAP_WIDTH; x += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MAP_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= MAP_HEIGHT; y += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(MAP_WIDTH, y);
      ctx.stroke();
    }

    // 绘制资源点（带光晕）
    resources.forEach((resource: any) => {
      const x = resource.position.x * TILE_SIZE;
      const y = resource.position.y * TILE_SIZE;

      // 光晕效果
      const glowGradient = ctx.createRadialGradient(
        x + TILE_SIZE / 2,
        y + TILE_SIZE / 2,
        0,
        x + TILE_SIZE / 2,
        y + TILE_SIZE / 2,
        TILE_SIZE
      );
      glowGradient.addColorStop(0, "rgba(255, 215, 0, 0.3)");
      glowGradient.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(x - TILE_SIZE / 2, y - TILE_SIZE / 2, TILE_SIZE * 2, TILE_SIZE * 2);

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

      // 数量标签
      ctx.font = "10px Arial";
      ctx.fillStyle = "#FFF";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeText(`×${resource.amount}`, x + 5, y + TILE_SIZE - 5);
      ctx.fillText(`×${resource.amount}`, x + 5, y + TILE_SIZE - 5);
    });

    // 绘制建筑
    buildings.forEach((building: any) => {
      const x = building.position.x * TILE_SIZE;
      const y = building.position.y * TILE_SIZE;

      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(x + 5, y + TILE_SIZE - 5, TILE_SIZE - 5, 5);

      ctx.font = "36px Arial";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(BUILDING_ICONS[building.type] || "🏗️", x + 7, y + 38);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    });

    // 绘制智能体
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

      // 阴影
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

      // 名字标签
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      const nameWidth = ctx.measureText(agent.name).width;
      ctx.fillRect(x + TILE_SIZE / 2 - nameWidth / 2 - 5, y - 20, nameWidth + 10, 16);
      ctx.font = "12px Arial";
      ctx.fillStyle = "#FFF";
      ctx.fillText(agent.name, x + TILE_SIZE / 2 - nameWidth / 2, y - 8);

      // 能量条
      const energyPercent = Math.min(1, (agent.inventory?.food || 0) / 50);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(x + 5, y + TILE_SIZE - 10, TILE_SIZE - 10, 5);
      ctx.fillStyle = energyPercent > 0.5 ? "#00FF00" : energyPercent > 0.2 ? "#FFA500" : "#FF0000";
      ctx.fillRect(x + 5, y + TILE_SIZE - 10, (TILE_SIZE - 10) * energyPercent, 5);
    });

    // 恢复状态
    ctx.restore();
  }, [agents, resources, buildings, selectedAgent, animations, zoom, offsetX, offsetY]);

  // 绘制小地图
  const drawMiniMap = useCallback(() => {
    const canvas = miniMapRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = canvas.width / MAP_WIDTH;

    // 清空
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 资源点
    ctx.fillStyle = "#FFD700";
    resources.forEach((r: any) => {
      ctx.fillRect(r.position.x * TILE_SIZE * scale - 2, r.position.y * TILE_SIZE * scale - 2, 4, 4);
    });

    // 智能体
    ctx.fillStyle = "#00FF00";
    agents.forEach((a: any) => {
      ctx.fillRect(a.position.x * TILE_SIZE * scale - 2, a.position.y * TILE_SIZE * scale - 2, 4, 4);
    });

    // 视口框
    const viewWidth = (MAP_WIDTH / zoom) * scale;
    const viewHeight = (MAP_HEIGHT / zoom) * scale;
    const viewX = (-offsetX / zoom) * scale;
    const viewY = (-offsetY / zoom) * scale;
    
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.strokeRect(viewX, viewY, viewWidth, viewHeight);
  }, [agents, resources, zoom, offsetX, offsetY]);

  // 绘制循环
  useEffect(() => {
    drawMainMap();
    drawMiniMap();
  }, [drawMainMap, drawMiniMap]);

  // 鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * delta));
    
    // 以鼠标位置为中心缩放
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const worldX = (mouseX - offsetX) / zoom;
      const worldY = (mouseY - offsetY) / zoom;
      
      setOffsetX(mouseX - worldX * newZoom);
      setOffsetY(mouseY - worldY * newZoom);
    }
    
    setZoom(newZoom);
  };

  // 鼠标拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffsetX(e.clientX - dragStart.x);
      setOffsetY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 点击智能体
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - offsetX) / zoom;
    const clickY = (e.clientY - rect.top - offsetY) / zoom;

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
    }, 10000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // 重置视图
  const resetView = () => {
    setZoom(1.0);
    setOffsetX(0);
    setOffsetY(0);
  };

  // 居中到智能体
  const centerOnAgent = () => {
    if (selectedAgent && canvasRef.current) {
      const canvas = canvasRef.current;
      const agentX = selectedAgent.position.x * TILE_SIZE * zoom;
      const agentY = selectedAgent.position.y * TILE_SIZE * zoom;
      
      setOffsetX(canvas.width / 2 - agentX);
      setOffsetY(canvas.height / 2 - agentY);
    }
  };

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
                }}
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
                }}
              >
                🤖 执行一次
              </button>
              <button
                onClick={resetView}
                style={{
                  padding: "10px 20px",
                  fontSize: "16px",
                  background: "#A8E6CF",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                🔄 重置视图
              </button>
              {selectedAgent && (
                <button
                  onClick={centerOnAgent}
                  style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    background: "#FFD93D",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  📍 居中
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px", fontSize: "14px", color: "#666" }}>
            <span>🔍 缩放: {(zoom * 100).toFixed(0)}%</span>
            <span>|</span>
            <span>🖱️ 鼠标滚轮缩放</span>
            <span>|</span>
            <span>✋ 拖动地图查看</span>
          </div>

          {/* 主画布 */}
          <div style={{ position: "relative" }}>
            <canvas
              ref={canvasRef}
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
              style={{
                border: "3px solid #667eea",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                cursor: isDragging ? "grabbing" : "grab",
              }}
            />
            
            {/* 小地图 */}
            <div style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              border: "2px solid #FFF",
              borderRadius: "5px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            }}>
              <canvas
                ref={miniMapRef}
                width={200}
                height={140}
                style={{ display: "block" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 侧边栏 */}
      <div style={{ width: "350px", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* 统计信息 */}
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "15px",
          padding: "15px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>📊 统计信息</h3>
          <div style={{ fontSize: "14px", color: "#666" }}>
            <p>👥 智能体: {agents.length}</p>
            <p>📦 资源点: {resources.length}</p>
            <p>🏗️ 建筑: {buildings.length}</p>
          </div>
        </div>

        {/* 选中的智能体 */}
        {selectedAgent && (
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "15px",
            padding: "15px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>
              {PERSONALITY_ICONS[selectedAgent.personality]} {selectedAgent.name}
            </h3>
            <div style={{ fontSize: "14px", color: "#666" }}>
              <p><strong>性格:</strong> {PERSONALITY_NAMES[selectedAgent.personality]}</p>
              <p><strong>位置:</strong> ({selectedAgent.position.x}, {selectedAgent.position.y})</p>
              <p><strong>库存:</strong></p>
              <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                <li>🌲 木材: {selectedAgent.inventory.wood}</li>
                <li>🪨 石头: {selectedAgent.inventory.stone}</li>
                <li>🌾 食物: {selectedAgent.inventory.food}</li>
                <li>💰 金币: {selectedAgent.inventory.gold}</li>
              </ul>
            </div>
          </div>
        )}

        {/* 活动日志 */}
        <div style={{
          flex: 1,
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "15px",
          padding: "15px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>📜 活动日志</h3>
          <div style={{
            flex: 1,
            overflowY: "auto",
            fontSize: "12px",
            color: "#666",
            fontFamily: "monospace",
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
