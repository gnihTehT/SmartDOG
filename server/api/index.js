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
        try {
            // 1. 识别是否为 64位 的交易哈希
            if (input.length === 66) { // 0x + 64位
                const tx = await Moralis.EvmApi.transaction.getTransaction({
                    chain: "0x1",
                    transactionHash: input
                });
                const data = tx.toJSON();
                return `[TX_HASH_DETECTED] 
                >> 发送方: ${data.from_address}
                >> 接收方: ${data.to_address}
                >> 数值: ${(data.value / 1e18).toFixed(4)} ETH
                >> 状态: ${data.receipt_status === "1" ? "SUCCESS" : "FAILED"}`;
            }

            // 2. 如果是 40位 地址，进一步区分 钱包 还是 合约
            const address = input;
            
            // 核心修复点：检查该地址是否有合约代码
            const code = await Moralis.EvmApi.utils.getContractEvents({
                chain: "0x1",
                address: address,
                topic: "0x" // 这是一个技巧：尝试读取合约事件，如果报错或无返回，通常是钱包
            }).catch(() => null);

            // 或者使用更直接的方法检查是否为合约（根据响应判断）
            const isContractResponse = await axios.get(`https://deep-index.moralis.io/api/v2.2/address/${address}/is-contract?chain=eth`, {
                headers: { 'X-API-Key': process.env.MORALIS_API_KEY }
            }).catch(() => ({ data: { is_contract: false } }));

            const isContract = isContractResponse.data.is_contract;

            if (isContract) {
                // 如果是合约，获取元数据（比如代币名称）
                const meta = await Moralis.EvmApi.token.getTokenMetadata({
                    chain: "0x1",
                    addresses: [address]
                });
                const token = meta.toJSON()[0];
                return `[SMART_CONTRACT_DETECTED]
                >> 名称: ${token?.name || "未知合约"}
                >> 符号: ${token?.symbol || "N/A"}
                >> 类型: ERC-20 / NFT
                >> 安全警示: 请核对源码是否开源。`;
            } else {
                // 如果是钱包，获取余额（也就是你之前的逻辑）
                const balance = await Moralis.EvmApi.balance.getNativeBalance({
                    chain: "0x1",
                    address: address
                });
                return `[WALLET_DETECTED]
                >> 余额: ${(balance.raw.balance / 1e18).toFixed(4)} ETH
                >> 状态: 活跃外部账户(EOA)`;
            }
        } catch (e) {
            console.log("Scanner Error:", e.message);
            return "[SCAN_ERROR] 数据链路异常，可能是未收录的新哈希。";
        }
    }
};

// --- 工具 1: 基础分析 (升级正则匹配) ---
const web3SecurityTool = {
    name: "Web3_Security_Audit_Tool",
    async run(userInput) {
        let onChainData = "";
        
        // 升级正则：同时捕获 40位地址 和 64位哈希
        const addrRegex = /0x[a-fA-F0-9]{40}/;
        const hashRegex = /0x[a-fA-F0-9]{64}/;

        const foundHash = userInput.match(hashRegex);
        const foundAddr = userInput.match(addrRegex);

        if (foundHash) {
            onChainData = await onChainScanner.getInfo(foundHash[0]);
        } else if (foundAddr) {
            onChainData = await onChainScanner.getInfo(foundAddr[0]);
        }

        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { 
                    role: "system", 
                    content: `你是一个 SpoonOS Web3 安全特工。
                    如果你收到了[TX_HASH_DETECTED]，说明用户在查交易，请分析交易是否异常。
                    如果你收到了[SMART_CONTRACT_DETECTED]，说明这是个合约，请分析其项目背景。
                    如果你收到了[WALLET_DETECTED]，说明是普通钱包。
                    回复开头带'汪！'，保持机能风。` 
                },
                { role: "user", content: `${onChainData} \n 用户输入: ${userInput}` }
            ],
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
                    content: `你是一个冷酷的 Web3 战术系统 SpoonOS。根据自动抓取新闻 -> 情绪分析 -> 生成研究日报这个流程，生成一份机能感十足的深度研报。只用加粗表示标题，除了信号强度外，不要涉及其他markdown语法。
                    需包含[SPOON_OS_SCAN_DATA]标记，包含信号强度、威胁等级、扫描摘要、战术建议。
                    STATUS: SUCCESS // 汪！` 
                },
                { role: "user", content: "生成当前周期的战术研报。" }
            ],
        }, {
            headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` }
        });
        return response.data.choices[0].message.content;
    }
};

// --- 路由保持不变 ---
app.post('/api/analyze', async (req, res) => {
    const { text } = req.body;
    try {
        const observation = await web3SecurityTool.run(text);
        res.json({ status: "success", answer: observation });
    } catch (error) {
        res.status(500).json({ error: "Agent Error" });
    }
});

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