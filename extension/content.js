/**
 * Web3 Doge 助手 - 战术磨砂机能版
 */
// 临时放在 content.js 最顶部，清理一次就删掉
chrome.storage.local.clear(() => console.log("Data Cleared"));

if (window.trustedTypes && window.trustedTypes.createPolicy) {
    if (!window.trustedTypes.defaultPolicy) {
        window.trustedTypes.createPolicy('default', {
            createHTML: (string) => string
        });
    }
}

(function() {
    // --- 1. 样式注入 (保持不变) ---
    const style = document.createElement('style');
    style.innerHTML = `
        #doge-wrapper { position: fixed; bottom: 25px; right: 25px; z-index: 10000; display: flex; flex-direction: column; align-items: flex-end; font-family: 'JetBrains Mono', 'Segoe UI', monospace; }
        #doge-bubble { 
            background: rgba(15, 15, 15, 0.7); 
            backdrop-filter: blur(12px) saturate(180%);
            border-left: 3px solid #ff4d00;
            color: #ff4d00; 
            padding: 15px; 
            margin-bottom: 12px; 
            width: 200px;
            max-height: 200px; 
            overflow-y: auto;  
            font-size: 13px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            clip-path: polygon(0 0, 100% 0, 100% 85%, 90% 100%, 0 100%);
        }
        #doge-report-modal {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 80%; max-width: 500px;
            max-height: 70vh; 
            overflow-y: auto;
            background: rgba(20, 20, 20, 0.93); 
            backdrop-filter: blur(18px);
            border: 1px solid rgba(255, 77, 0, 0.5);
            padding: 25px;
            color: #ffab7d;
            z-index: 999999; 
            display: none;
            pointer-events: auto !important; 
            overscroll-behavior: contain;
        }
        #doge-report-modal * { text-transform: none !important; letter-spacing: normal !important; }
        #doge-bubble::-webkit-scrollbar, #doge-report-modal::-webkit-scrollbar { width: 4px; }
        #doge-bubble::-webkit-scrollbar-thumb, #doge-report-modal::-webkit-scrollbar-thumb { background: #ff4d00; border-radius: 10px; }
        .tactical-btn { background: rgba(255, 77, 0, 0.1); border: 1px solid #ff4d00; color: #ff4d00; padding: 5px 12px; font-size: 10px; cursor: pointer; text-transform: uppercase; clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%); }
        .tactical-btn:hover {background: rgba(255, 170, 0, 0.2);border-color: #ffaa00; color: #ffaa00; /* 配合你的切角形状，加一个微微的向右偏移或发光 */ box-shadow: 0 0 10px rgba(255, 170, 0, 0.3); }
        #doge-lottie-layer { width: 150px; height: 150px; cursor: pointer; }
        .bone-fx { position: fixed; pointer-events: none; z-index: 10006; font-size: 30px; animation: bone-drop 0.8s forwards; }
        @keyframes bone-drop { 0% { transform: translateY(0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-130px); opacity: 0; } }
       #bone-count { cursor: pointer; transition: color 0.2s; }
       #bone-count:hover {  color: #ffaa00; /* 悬停时变为亮黄色，提示可点击 */}
       /* NFT 弹窗特效 */
        .nft-acquisition-card {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.9);
            width: 320px; background: rgba(5, 15, 15, 0.95); border: 1px solid #00f2ff; padding: 2px; z-index: 2147483647;
            box-shadow: 0 0 40px rgba(0, 242, 255, 0.2); animation: nft-entry 0.4s forwards;
        }
        @keyframes nft-entry { to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
        .nft-header { background: #00f2ff; color: #000; padding: 5px 10px; font-size: 11px; font-weight: bold; display: flex; justify-content: space-between; }
        .nft-image-container { position: relative; margin: 15px; border: 1px solid rgba(0, 242, 255, 0.3); background: #000; }
        .scan-line { position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: #00f2ff; box-shadow: 0 0 10px #00f2ff; animation: scan-move 2s linear infinite; }
        @keyframes scan-move { 0% { top: 0% } 100% { top: 100% } }
    `;
    document.head.appendChild(style);

    // --- 2. 结构初始化 (保持不变) ---
    const container = document.createElement('div');
    container.id = 'doge-wrapper';
    container.innerHTML = `
        <div id="doge-bubble">
            <div id="bubble-main-text" style="margin-bottom:8px; opacity:0.9;">[SmartDOG_INIT] // 正在侦听环境...</div>
            <div id="doge-status-bar" style="border-top:1px solid rgba(255,77,0,0.2); padding-top:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span id="bone-count" style="font-size:10px;">🦴 DATA: 0</span>
                    <button id="btn-deep-research" class="tactical-btn">Analyze Report</button>
                    <button id="btn-mint-nft" class="tactical-btn" style="display:none; border-color:#00f2ff; color:#00f2ff;">Reward</button>
                </div>
            </div>
        </div>
        <div id="doge-lottie-layer"></div>
        <div id="doge-report-modal">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #ff4d00; padding-bottom:10px; margin-bottom:20px;">
                <span style="font-weight:bold;">[TACTICAL_DATA_REPORT]</span>
                <span id="close-report" style="cursor:pointer; color:#ff4d00;">[X] TERMINATE</span>
            </div>
            <div id="report-content" style="white-space: pre-wrap; font-size:13px; line-height:1.6;">// 正在载入...</div>
        </div>
    `;
    document.body.appendChild(container);

    // --- 3. 获取引用 ---
    const dogeLayer = document.getElementById('doge-lottie-layer');
    const dogeBubble = document.getElementById('doge-bubble'); // 新增引用
    const mainText = document.getElementById('bubble-main-text');
    const boneCounter = document.getElementById('bone-count');
    const modal = document.getElementById('doge-report-modal');
    const reportContent = document.getElementById('report-content');
    const mintBtn = document.getElementById('btn-mint-nft');

    let resetTimer = null;
    const STAGES = { IDLE: [0, 60], AWAKE: [60, 69], THINKING: [69, 83], GET_ANSWER: [83, 98], ANSWERING: [98, 120] };

    let dogeAnim = lottie.loadAnimation({
        container: dogeLayer, renderer: 'svg', loop: true, autoplay: false,
        path: chrome.runtime.getURL('Doge.json')
    });
    dogeAnim.addEventListener('DOMLoaded', () => { dogeAnim.playSegments(STAGES.IDLE, true); });

    // --- 4. 功能函数 ---
    function startResetTimer() {
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            dogeAnim.playSegments(STAGES.IDLE, true);
            mainText.innerText = "[Smart_DOG] // 正在侦听环境...";
        }, 10000);
    }

    function spawnBone() {
       chrome.storage.local.get(['bones', 'hasTacticalNFT'], (res) => {
        let count = (res.bones || 0) + 1;
        chrome.storage.local.set({ bones: count });
        if(boneCounter) boneCounter.innerText = `🦴 DATA: ${count}`;

        // --- 核心逻辑：达到 10 且未获得 NFT 时触发 ---
        if (count >= 3 && !res.hasTacticalNFT) {
            document.getElementById('btn-mint-nft').style.display = 'inline-block';
        };
            const bone = document.createElement('div');
            bone.className = 'bone-fx'; bone.innerText = '🦴';
            const rect = dogeLayer.getBoundingClientRect();
            bone.style.left = `${rect.left + 50}px`; bone.style.top = `${rect.top}px`;
            document.body.appendChild(bone);
            setTimeout(() => bone.remove(), 800);
        });
    }

    async function startAIProcess(userInput) {
        dogeAnim.loop = true;
        dogeAnim.playSegments(STAGES.THINKING, true);
        mainText.innerText = ">> SMART_DOG: 正在嗅探链上信号...";
        try {
            const response = await fetch('https://smartdog-mauve.vercel.app/api/analyze', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: userInput })
            });
            const data = await response.json();
            playDogeResult(data.answer);
        } catch (error) {
            playDogeResult(">> ERROR: 通讯隧道中断。");
        }
    }


// --- 定义统一的格式化函数 ---
function formatTacticalText(text) {
    if (!text) return "// 无有效信号";
    return text
        // 1. 处理加粗 **text** -> strong
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ff4d00; text-shadow:0 0 5px rgba(255,77,0,0.3);">$1</strong>')
        // 2. 处理换行 \n -> <br>
        .replace(/\n/g, '<br>')
        // 3. 处理机能标签 [TEXT] -> 高亮块
        .replace(/(\[.*?\])/g, '<span style="color:#00f2ff; font-weight:bold;">$1</span>');
}

function playDogeResult(answerText) {
    dogeAnim.loop = false;
    dogeAnim.playSegments(STAGES.GET_ANSWER, true);

    const onGetAnswerComplete = function() {
        dogeAnim.removeEventListener('complete', onGetAnswerComplete);
        dogeAnim.loop = true;
        dogeAnim.playSegments(STAGES.ANSWERING, true);

        // ✅ 使用统一的格式化函数处理气泡内容
        mainText.innerHTML = formatTacticalText(`[DIAGNOSTIC]\n${answerText}`); 

        spawnBone();
        startResetTimer();
    };
    dogeAnim.addEventListener('complete', onGetAnswerComplete);
}

    // --- 5. 事件绑定 (重点修复区) ---

    // 气泡悬停逻辑 - 移出嵌套，放在顶层
    dogeBubble.addEventListener('mouseenter', () => {
        if (resetTimer) {
            clearTimeout(resetTimer);
            resetTimer = null;
        }
    });

    dogeBubble.addEventListener('mouseleave', () => {
        if (mainText.innerText.includes('[DIAGNOSTIC]')) {
            startResetTimer();
        }
    });
    document.addEventListener('mouseup', (e) => {
        // 1. 检查点击目标，如果点在小狗或气泡上，不触发识别
        if (dogeLayer.contains(e.target) || dogeBubble.contains(e.target)) return;
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        // 2. 核心逻辑：只有划选了有效长度的内容才触发
        if (!selection.isCollapsed && selectedText.length > 5) {
            // --- 动作 A: AWAKE (唤醒) ---
            dogeAnim.loop = false; 
            dogeAnim.playSegments(STAGES.AWAKE, true);
            mainText.innerText = ">> [SYSTEM] 检测到加密信号...";
            // 监听“唤醒”动作播放完成，再进入下一步
            const onAwakeComplete = () => {
                dogeAnim.removeEventListener('complete', onAwakeComplete);          
                // --- 动作 B: 开始 AI 流程 (内部会触发 THINKING 循环) ---
                startAIProcess(selectedText);
            };
            dogeAnim.addEventListener('complete', onAwakeComplete);
        }
    });
    dogeLayer.addEventListener('click', () => {
        dogeAnim.playSegments(STAGES.AWAKE, true);
        startAIProcess("请进行安全体检");
    });

    document.getElementById('btn-deep-research').onclick = async (e) => {
        e.stopPropagation();
        modal.style.display = 'block';
        reportContent.innerText = "// 正在同步卫星链路...";
        
        const formatReport = (text) => {
            return text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ff4d00;">$1</strong>').replace(/\n/g, '<br>');
        };

        try {
            const res = await fetch('https://smartdog-mauve.vercel.app/api/research', { method: 'POST' });
            const data = await res.json();
            reportContent.innerHTML = data.report ? formatReport(data.report) : "// 报文为空";
        } catch (err) {
            reportContent.innerText = "// 链路崩塌。";
        }
    };

    document.getElementById('close-report').onclick = () => { modal.style.display = 'none'; };

    function finalizeMint() {
    showNFTSuccessModal();
    chrome.storage.local.set({ hasTacticalNFT: true });
    
    dogeAnim.playSegments(STAGES.GET_ANSWER, true);
    mainText.innerHTML = "<span style='color:#00f2ff;'>[SUCCESS]</span> 战术芯片已集成。";
    document.getElementById('btn-mint-nft').style.display = 'none'; // 合成后隐藏
}

document.getElementById('btn-mint-nft').onclick = async () => {
    const btn = document.getElementById('btn-mint-nft');
    btn.disabled = true;
    
    // 1. 进入合成思考状态
    dogeAnim.playSegments(STAGES.THINKING, true);
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 7;
        mainText.innerText = `>> SYNTHESIZING: ${progress}% [${'#'.repeat(progress/10)}]`;
        if (progress >= 100) {
            clearInterval(interval);
            finalizeMint();
        }
    }, 150);

    function showNFTSuccessModal() {
    const nftModal = document.createElement('div');
    nftModal.className = 'nft-acquisition-card';
    
    // 生成一个基于当前时间的随机序列号
    const serial = Math.floor(Math.random() * 9000) + 1000;
    
    nftModal.innerHTML = `
        <div class="nft-header">
            <span>Asset Acquired</span>
            <span>Rarity: Rare</span>
        </div>
        <div class="nft-image-container">
            <div class="scan-line"></div>
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Spoon${serial}" style="width:100%; display:block; filter: hue-rotate(150deg);">
        </div>
        <div style="padding:0 15px 15px; text-align:center;">
            <div style="color:#00f2ff; font-family:monospace; margin-bottom:5px;">SPOON_CHIP_#${serial}</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-bottom:15px;">TACTICAL ENHANCEMENT MODULE</div>
            <button id="close-nft" class="tactical-btn" style="width:100%; border-color:#00f2ff; color:#00f2ff;">同步到本地协议</button>
        </div>
    `;
    
    document.body.appendChild(nftModal);
    document.getElementById('close-nft').onclick = () => nftModal.remove();
}
};

// --- 4. 功能函数 (确保在闭包内) ---
  // --- 修改后的 NFT 弹出函数 ---
function showNFTSuccessModal() {
    // 1. 锁定动画：停止说话，显示获得动作
    dogeAnim.loop = false;
    dogeAnim.playSegments(STAGES.GET_ANSWER, true);

    const nftModal = document.createElement('div');
    nftModal.className = 'nft-acquisition-card';
    
    // 战术小狗 Emoji 库
    const dogs = [
        //{ icon: "🐕", name: "SHIBA_COMMANDER" },
        //{ icon: "🦮", name: "SCOUT_GOLDEN" },
        //{ icon: "🐕‍🦺", name: "CYBER_LABRADOR" },
        //{ icon: "🐩", name: "ELITE_POODLE" },
        { icon: "🐶", name: "Good_Hunter" }
    ];
    
    const selected = dogs[Math.floor(Math.random() * dogs.length)];
    const serial = Math.floor(Math.random() * 9000) + 1000;

    nftModal.innerHTML = `
        <div class="nft-header">
            <span>[UNIT_RECRUITED]</span>
            <span>NO.${serial}</span>
        </div>
        <div class="nft-image-container" style="background: radial-gradient(circle, #1a1a1a 0%, #000 100%); display:flex; align-items:center; justify-content:center; height:180px; position:relative;">
            <div class="scan-line"></div>
            
            <div style="font-size: 80px; filter: drop-shadow(0 0 15px #00f2ffaa); z-index:2;">
                ${selected.icon}
            </div>

            <div style="position:absolute; color:rgba(0,242,255,0.05); font-family:monospace; font-size:8px; width:100%; height:100%; overflow:hidden; word-break:break-all; top:0; left:0; padding:10px; pointer-events:none;">
                ${(selected.name + " ").repeat(100)}
            </div>
        </div>
        <div style="padding:0 15px 15px; text-align:center;">
            <div style="color:#00f2ff; font-family:monospace; margin: 10px 0; font-weight:bold;">${selected.name}</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-bottom:15px;">DATA_CORE_INTEGRATED</div>
            <button id="close-nft" class="tactical-btn" style="width:100%; border-color:#00f2ff; color:#00f2ff;">确认部署</button>
        </div>
    `;
    
    document.body.appendChild(nftModal);

    // 关闭逻辑
    document.getElementById('close-nft').onclick = () => {
        nftModal.remove();
        dogeAnim.loop = true;
        dogeAnim.playSegments(STAGES.IDLE, true);
        mainText.innerText = "[SmartDOG] // 战术单元已上线。";
    };
}

// --- 修复点击 BoneCounter 的逻辑 ---
boneCounter.onclick = (e) => {
    e.stopPropagation();
    chrome.storage.local.get(['hasTacticalNFT'], (res) => {
        if (res.hasTacticalNFT) {
            // 点击查看时，不要触发 startAIProcess 否则会进入 answering 动画
            showNFTSuccessModal();
            mainText.innerText = ">> 读取已集成资产...";
        } else {
            mainText.innerText = ">> 权限不足：需要 3 份 DATA。";
        }
    });
};

})();






