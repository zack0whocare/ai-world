# AI World - Autonomous AI Agent Simulation

## 🎮 Overview

AI World is an advanced autonomous AI agent simulation system built on top of AI Town. It features multiple AI agents with different personalities that can:

- 🤖 Make autonomous decisions based on their personality
- 📦 Gather resources from the environment
- 🏗️ Build structures and buildings
- 💰 Trade resources with other agents
- 🗺️ Explore the world and discover new areas

## 🚀 Features

### 1. Multiple Agent Personalities

- **Gatherer**: Focuses on collecting resources
- **Builder**: Prioritizes constructing buildings
- **Trader**: Seeks trading opportunities
- **Explorer**: Explores new territories
- **Defender**: Protects buildings and territory

### 2. Trading System

- Create trade offers between agents
- Accept or reject trades
- Fair trade validation based on resource values
- Trade history tracking

### 3. AI Auto-Decision System

- Autonomous decision-making based on personality
- Continuous simulation mode
- Real-time execution of agent actions

### 4. Beautiful Dashboard

- Real-time visualization of all agents
- Resource monitoring
- Building status tracking
- Trade management interface
- Auto-run mode for continuous simulation

## 🎯 Quick Start

### Access the Dashboard

Visit one of these URLs:
- https://ai-world-smoky.vercel.app/?aiworld
- https://ai-world-smoky.vercel.app/aiworld

### Initialize the World

```javascript
// Open browser console (F12)
await convex.mutation(api.aiworld.init.initializeWorld, {})
```

### Create AI Agents

Use the dashboard buttons or console:

```javascript
await convex.mutation(api.aiworld.mutations.createAgent, {
  name: "Gatherer Alice",
  personality: "gatherer",
  position: { x: 10, y: 10 }
})
```

### Start Auto-Run

Click the "Start Auto-Run" button in the dashboard to watch agents make autonomous decisions every 5 seconds!

## 📊 System Architecture

```
AI World
├── Backend (Convex)
│   ├── Agent Management
│   ├── Resource System
│   ├── Building System
│   ├── Trading System
│   └── AI Decision Engine
└── Frontend (React + TypeScript)
    ├── Dashboard UI
    ├── Real-time Data Visualization
    └── Control Panel
```

## 🛠️ Technologies

- **Backend**: Convex (serverless backend)
- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS
- **Real-time**: Convex Reactive Queries
- **Deployment**: Vercel

## 📖 Documentation

See [test_aiworld.md](./test_aiworld.md) for comprehensive testing guide and feature documentation.

## 🎨 Dashboard Features

### Control Panel
- Initialize World
- Start/Stop Auto-Run
- Manual Decision Execution
- Create Agents with Different Personalities

### Agent List
View all agents with their:
- Name and personality
- Resource inventory (wood, stone, food, gold)
- Current position
- Statistics

### Resource Monitor
Track all resource nodes:
- Resource type and amount
- Regeneration rate
- Location
- Visual progress bars

### Building Manager
Monitor all buildings:
- Building type and level
- Owner information
- Health status
- Production rate

### Trade Manager
View and manage trades:
- Pending trade offers
- Trade details (offering/requesting)
- Accept/Reject functionality

## 🔮 Future Enhancements

- [ ] 2D Map visualization with agent positions
- [ ] Agent-to-agent chat system
- [ ] Quest/Task system
- [ ] Achievement system
- [ ] Data analytics dashboard
- [ ] Multiplayer mode
- [ ] Mobile app support

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

Built with ❤️ using Convex and React
