# 🛰️ SmartDog: Tactical On-chain AI Agent
> **基于 SpoonOS Framework 的机能风 Web3 战术侦察助手**

SmartDog 是一款融合了 **Lottie 交互动画**、**ReAct (Reasoning and Acting) 思考模型**与 **Moralis 实时链上数据**的 Chrome 扩展插件。它像一只数字猎犬，潜伏在你的浏览器中，随时准备对任何加密信号（地址、哈希）进行深度扫描与战术分析。

---

## ⚡ 核心战术能力

* **🕵️ 信号捕捉 (Perception Layer)**：自动识别页面选中的以太坊地址 (EOA)、智能合约或交易哈希。
* **🧠 ReAct 思考引擎**：接入 DeepSeek-V3 大模型，通过“观察-推理-行动”循环，提供具有逻辑深度的智能诊断。
* **⛓️ 多链深度侦察**：集成 Moralis API，跨越 Ethereum 主网与 Sepolia 测试网，实时嗅探字节码 (Bytecode) 与资产余额。
* **🛡️ 身份判别协议**：精准区分“外部账户 (EOA)”与“智能合约”，针对特定场景触发“战术防御建议”。
* **🎁 战术芯片集成 (NFT)**：内置激励机制，通过捕获链上数据积累 `DATA` 碎片，合成并部署专属战术 NFT。

---

## 🛠️ 技术栈

| 组件 | 技术实现 |
| :--- | :--- |
| **Agent 架构** | ReAct (Reasoning and Acting) Pattern |
| **大语言模型** | DeepSeek-V3 (via API) |
| **链上数据源** | Moralis EvmApi & Deep Index |
| **前端交互** | Vanilla JS / Chrome Extension API / Lottie Animation |
| **后端服务** | Node.js / Express (Deployed on Vercel) |
| **视觉风格** | Cyberpunk / Tactical Frost Style (机能磨砂风) |

---

## 🚀 快速启动

### 1. 克隆仓库
```bash
git clone [https://github.com/your-repo/smart-doge-agent.git](https://github.com/your-repo/smart-doge-agent.git)
cd smart-doge-agent
```
### 2. 后端配置 (Server)
在 /server 目录下创建 .env 文件，并配置以下环境变量：

代码段
```
MORALIS_API_KEY=your_moralis_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```
安装依赖并启动：
```
Bash
npm install
node server.js
```
3. 加载扩展程序 (Extension)
打开 Chrome 浏览器，访问 chrome://extensions/。

开启右上角的 “开发者模式”。

点击 “加载已解压的扩展程序”，选择项目的 /extension 目录。

## ✨项目结构
```
.
├── extension/          # Chrome 插件前端代码
│   ├── manifest.json   # 插件配置文件
│   ├── content.js      # 页面注入逻辑 (UI + 交互)
│   └── Doge.json       # Lottie 动画文件
└── server/             # 后端 AI Agent 逻辑
    ├── server.js       # Express 服务与 ReAct 核心
    └── .env            # 敏感密钥 (不进入 Git)
```
## 🎮 交互指南
唤醒小狗：划选网页上的任意 0x... 地址。

战术分析：小狗进入 THINKING 状态，随后在气泡中输出格式化的诊断报告。

获取研报：点击 [Analyze Report] 按钮，同步卫星链路获取宏观市场深度分析。

合成芯片：当 🦴 DATA 达到 3 份时，点击 [Reward] 按钮，进行战术芯片合成。
