/**
 * Web3 Doge 助手 - 战术磨砂机能版
 */
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
        #doge-lottie-layer { width: 150px; height: 150px; cursor: pointer; }
        .bone-fx { position: fixed; pointer-events: none; z-index: 10006; font-size: 30px; animation: bone-drop 0.8s forwards; }
        @keyframes bone-drop { 0% { transform: translateY(0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-130px); opacity: 0; } }
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
            mainText.innerText = "[SmartDOG] // 正在侦听环境...";
        }, 8000);
    }

    function spawnBone() {
        chrome.storage.local.get(['bones'], (res) => {
            let count = (res.bones || 0) + 1;
            chrome.storage.local.set({ bones: count });
            if(boneCounter) boneCounter.innerText = `🦴 DATA: ${count}`;
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
        mainText.innerText = ">> SPOON_OS: 正在拦截链上信号...";
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

    function playDogeResult(answerText) {
        dogeAnim.loop = false;
        dogeAnim.playSegments(STAGES.GET_ANSWER, true);
        const onGetAnswerComplete = function() {
            dogeAnim.removeEventListener('complete', onGetAnswerComplete);
            dogeAnim.loop = true;
            dogeAnim.playSegments(STAGES.ANSWERING, true);
            mainText.innerText = `[DIAGNOSTIC] ${answerText}`;
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
        // 1. 检查点击目标，如果点在小狗或气泡上，不触发识别（防止干扰）
        if (container.contains(e.target)) return;
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        // 2. 核心修复：增加 selection.isCollapsed 判断
        // isCollapsed 为 true 意味着选区的起点和终点在同一位置（即只是点击，没有划选）
        if (!selection.isCollapsed && selectedText.length > 5) {
            startAIProcess(selectedText);
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
})();