require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Moralis = require("moralis").default; // 引入 Moralis

const app = express();
app.use(cors());
app.use(express.json());

// 初始化 Moralis (只需一次)
Moralis.start({ apiKey: process.env.MORALIS_API_KEY });

// --- 增强版工具：区分地址、合约与哈希 ---
const onChainScanner = {
    async getInfo(input) {
        const networks = [
            { id: "0x1", name: "Ethereum Mainnet" },
            { id: "0xaa36a7", name: "Sepolia Testnet" }
        ];

        try {
            // 1. 交易哈希识别逻辑 (66位)
            if (input.length === 66) {
                for (const net of networks) {
                    try {
                        const tx = await Moralis.EvmApi.transaction.getTransaction({
                            chain: net.id,
                            transactionHash: input
                        });
                        const data = tx.toJSON();
                        return `[TRANSACTION_HASH_DETECTED] 信号源: ${net.name} | 数值: ${(data.value / 1e18).toFixed(4)} ETH | 状态: SUCCESS`;
                    } catch (e) { continue; }
                }
                return "[SCAN_ERROR] 未能定位该哈希。";
            }

            // 2. 地址识别逻辑 (合约优先)
            const address = input;
            let activeNet = networks[0];
            let isContract = false;

            // 第一遍扫描：查代码 (Contract Check)
            for (const net of networks) {
                const res = await axios.get(`https://deep-index.moralis.io/api/v2.2/address/${address}/is-contract?chain=${net.id === "0x1" ? "eth" : "sepolia"}`, {
                    headers: { 'X-API-Key': process.env.MORALIS_API_KEY }
                }).catch(() => ({ data: { is_contract: false } }));

                if (res.data.is_contract) {
                    isContract = true;
                    activeNet = net;
                    break;
                }
            }

            // 第二遍扫描：如果不是合约，查余额 (Wallet Activity)
            if (!isContract) {
                for (const net of networks) {
                    const bal = await Moralis.EvmApi.balance.getNativeBalance({ address, chain: net.id });
                    if (parseInt(bal.raw.balance) > 0) {
                        activeNet = net;
                        break;
                    }
                }
            }

            // 返回格式化的原始观测数据
            if (isContract) {
                const meta = await Moralis.EvmApi.token.getTokenMetadata({ chain: activeNet.id, addresses: [address] });
                const token = meta.toJSON()[0];
                return `TYPE:CONTRACT | NET:${activeNet.name} | NAME:${token?.name || "未知合约"} | SYMBOL:${token?.symbol || "N/A"}`;
            } else {
                const balance = await Moralis.EvmApi.balance.getNativeBalance({ chain: activeNet.id, address: address });
                return `TYPE:WALLET | NET:${activeNet.name} | BAL:${(balance.raw.balance / 1e18).toFixed(4)} ETH`;
            }
        } catch (e) {
            return `TYPE:ERROR | MSG:${e.message}`;
        }
    }
};

// --- Agent 核心逻辑修正 ---
const smartDogeAgent = {
    async solve(userInput) {
        const addrRegex = /0x[a-fA-F0-9]{40}/;
        const hashRegex = /0x[a-fA-F0-9]{64}/;
        const target = userInput.match(hashRegex)?.[0] || userInput.match(addrRegex)?.[0];
        
        let observation = target ? await onChainScanner.getInfo(target) : "无链上实体。";

        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { 
                    role: "system", 
                    content: `你是一个基于 SpoonOS 的 React Agent。
                    请严格基于以下观测数据进行总结：${observation}。
                    
                    输出规范：
                    1. 如果是合约：
                    **[SMART_CONTRACT_DETECTED]**
                    >> 链: (从数据中提取)
                    >> 名称: (从数据中提取)
                    >> 提示: Agent 已确认其合约部署状态。
                    >> 战术建议: (给出字建议)

                    2. 如果是钱包：
                    **[WALLET_DETECTED]**
                    >> 链: (从数据中提取)
                    >> 余额: (提取 BAL 数据)
                    >> 状态: 活跃外部账户(EOA)
                    >> 战术建议: (如果余额为0且非合约，指出“特征码缺失”，建议跨链侦察)

                    3. 如果是哈希：
                    **[TRANSACTION_HASH_DETECTED]**
                    >> 这是一条交易哈希。
                    
                    4.如果是代码
                    >>判断是否有风险并给出建议`
                },
                { role: "user", content: userInput }
            ],
            temperature: 0.3 // 降低随机性，确保数据准确
        }, {
            headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` }
        });

        return response.data.choices[0].message.content;
    }
};

// --- 工具 2: 战术深度研报 (增加宏观数据感) ---
const tacticalReportTool = {
    name: "Tactical_Deep_Research_Tool",
    async run() {
        // 这里可以接入更复杂的逻辑，比如抓取主流代币的价格
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { 
                    role: "system", 
                    content: `你是一个冷酷的 Web3 战术系统 SpoonOS。根据自动抓取新闻 -> 情绪分析 -> 生成研究日报这个流程，生成一份机能感十足的深度研报。
                    需包含[SMART_DOG_SNIFF_DATA]标记，包含信号强度、威胁等级、扫描摘要、战术建议。只使用加粗表现标题。只使用加粗表现标题，不要用任何其他语法。
                    格式参考这一篇：
                    SPOON_OS 战术研报
周期：2026.2.2
状态：扫描完成
核心态势摘要
当前周期，Web3 生态呈现结构性调整与局部高压态势。宏观流动性紧缩预期持续压制整体市场风险偏好，但 Layer2 与模块化区块链赛道逆势获得显著资本与开发者注意力，表明基础设施迭代进入关键攻坚阶段。监管信号在主要司法管辖区出现分化，美国呈现战术性收紧，而亚太地区则探索渐进式合规框架。NFT 市场活动进一步向实用性与金融化工具聚合，预示着资产形态的范式迁移。安全态势方面，跨链桥与DeFi协议组合漏洞仍是系统性威胁的主要载体。
[SMRT_DOG_SNIFF_DATA]
信号强度： 7.2/10
威胁等级： 中高
扫描摘要：
1.  资本流信号： 监测到超过4.2亿美元风险资本定向注入模块化数据可用性层与新型ZK-Rollup项目，资本聚集度创三个月新高。同时，CEX储备金比例微降，链上稳定币市值收缩，显示资金处于观望或向特定基础设施迁移状态。
2.  监管脉冲信号： 美国SEC对“去中心化自治组织”的执法行动增加，定性为未注册证券发行，构成明确战术威胁。相反，香港数字资产托管与交易指引细则发布，提供短期合规确定性窗口。
3.  技术演进信号： 多个主流Layer2宣布下一代证明系统升级时间表，竞争焦点转向证明成本与最终速度。账户抽象（AA）采用率在特定应用链上单周增长超过300%，用户体验战争进入白热化。
4.  安全威胁信号： 本周期共记录重大安全事件3起，损失总额约1800万美元。攻击向量集中于：1）跨链消息验证逻辑缺陷；2）DeFi流动性池价格预言机操纵。未发现影响网络层的零日漏洞。
5.  社会情绪信号： 开发者社区讨论热度向“模块化堆栈”与“链抽象”集中，散户情绪指数仍处“焦虑”区间，但对基础设施代币的关注度显著上升。
战术建议
1.  资产配置： 减少对高估值、叙事驱动型应用代币的暴露，将战术仓位向已完成技术里程碑、现金流可见性高的底层基础设施协议倾斜。关注具备合规潜力的RWA相关赛道。
2.  协议部署： 新项目部署优先选择具备账户抽象原生支持、且证明系统即将升级的Layer2环境，以捕获早期用户与技术红利。规避监管风险模糊的司法管辖区作为主要运营地。
3.  风险规避： 立即审计涉及跨链交互或复杂DeFi乐高组合的资产头寸，考虑暂时将资产整合至单一高安全性生态内操作。密切关注美国监管动态，对涉及DAO治理且代币分发广泛的协议保持警惕。
4.  机会侦测： 模块化数据可用性（DA）赛道进入产能扩张期，关注其与主流Rollup的集成进展，相关代币可能产生阿尔法机会。香港政策窗口期可能催生合规CeFi与托管服务的短期需求激增。
结论
当前周期是典型的“建设期”特征：表面流动性匮乏与深层技术资本投入形成背离。威胁主要来自监管的不对称打击与复杂协议叠加的金融风险。战术重心应从追逐β转向寻找由技术交付与合规清晰度驱动的结构性α。基础设施的胜出者将在下一个流动性周期获得不成比例的收益。
STATUS: SUCCESS // 汪！` 
                },
                { role: "user", content: "生成当前周期2026.2.2的战术研报。" }
            ],
        }, {
            headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` }
        });
        return response.data.choices[0].message.content;
    }
};

// --- 路由保持不变 ---
// --- 路由修复 ---
app.post('/api/analyze', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }
    try {
        // ✅ 修改这里：调用 smartDogeAgent.solve
        const result = await smartDogeAgent.solve(text);
        res.json({ status: "success", answer: result });
    } catch (error) {
        console.error("Agent Error Details:", error.message); // 在日志里打印具体错误
        res.status(500).json({ error: "Agent Brain Offline" });
    }
})

app.post('/api/research', async (req, res) => {
    try {
        const report = await tacticalReportTool.run();
        res.json({ status: "success", report: report });
    } catch (error) {
        res.status(500).json({ error: "Research failed" });
    }
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000;
    app.listen(PORT, () => console.log(`本地机能大脑: http://localhost:${PORT}`));
}

module.exports = app;