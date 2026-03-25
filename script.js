// ==========================================
// 💡 在这里自定义不同的句子！每个数组代表一句话。
// 游戏开始时会随机从这些句子里抽取词语生成方块，
// 只有相邻语序的词语发生碰撞时才能成功合并（不限制左右顺序）。
// ==========================================
const SENTENCES = [
    ["娃娃们啊", "再这样下去", "你的德语", "就完蛋了"], // 句子 1
    ["你们有个", "学长"], // 句子 2
    ["没做作业的", "自己", "站起来"], // 句子 3
    //["你们", "摸着", "良心", "说说"],
    ["你们的", "良心", "已经", "大大的", "坏掉了"],
    ["飞", "乐", "然"] 
    
];

let board = [];
let score = 0;
const gridSize = 4;
let activeSentences = [];
let isPaused = false; // 用于控制在显示结算画面时暂停输入

// 获取一个随机新句子（排除在场上的句子和空句子）
function getNewRandomSentence() {
    let validIndices = [];
    for (let i = 0; i < SENTENCES.length; i++) {
        if (SENTENCES[i].length > 0 && !activeSentences.includes(i)) {
            validIndices.push(i);
        }
    }
    if (validIndices.length === 0) {
        // 如果句库不够用了，允许重复
        for (let i = 0; i < SENTENCES.length; i++) {
            if (SENTENCES[i].length > 0) validIndices.push(i);
        }
    }
    return validIndices[Math.floor(Math.random() * validIndices.length)];
}

function initGame() {
    activeSentences = [];
    while (activeSentences.length < 2) {
        let newIdx = getNewRandomSentence();
        if (!activeSentences.includes(newIdx)) {
            activeSentences.push(newIdx);
        } else {
            // 如果所有不同句子不够3个，就允许重复加入
            activeSentences.push(newIdx);
        }
    }
    
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    board = [];
    
    for (let r = 0; r < gridSize; r++) {
        let row = [];
        for (let c = 0; c < gridSize; c++) {
            row.push(null);
            let cell = document.createElement('div');
            cell.id = `cell-${r}-${c}`;
            cell.className = 'grid-cell';
            grid.appendChild(cell);
        }
        board.push(row);
    }
    
    score = 0;
    updateScore();
    document.getElementById('game-message').style.display = 'none';
    
    addRandomTile();
    addRandomTile();
    updateBoard();
}

function updateScore() {
    document.getElementById('score').innerText = score;
}

// 刷新界面 UI
function updateBoard() {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            let cell = document.getElementById(`cell-${r}-${c}`);
            let tile = board[r][c];
            cell.className = 'grid-cell';
            cell.innerText = '';
            
            if (tile !== null) {
                // 根据它是第几个句子，设定不同颜色（复用 CSS 里的 .level-N）
                let level = (tile.sentenceIdx % 10) + 1;
                cell.classList.add(`level-${level}`);
                
                // 将 tile 中的词片段拼凑起来显示
                let text = "";
                for(let i = tile.startIdx; i <= tile.endIdx; i++) {
                    text += SENTENCES[tile.sentenceIdx][i];
                }
                cell.innerText = text;
                
                // 根据文字长度动态调整字号，避免超出方块
                if (text.length <= 4) {
                    cell.style.fontSize = '30px';
                } else if (text.length <= 8) {
                    cell.style.fontSize = '22px';
                } else if (text.length <= 12) {
                    cell.style.fontSize = '18px';
                } else {
                    cell.style.fontSize = '14px';
                }
            } else {
                cell.style.fontSize = ''; // 清空空方块的字号设置
            }
        }
    }
}

// 随机在一个空白格子里生成一个句子的某一个字
function addRandomTile() {
    let emptyCells = [];
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] === null) emptyCells.push({r, c});
        }
    }
    
    if (emptyCells.length > 0) {
        let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        let sIdx = activeSentences[Math.floor(Math.random() * activeSentences.length)];
        let wIdx = Math.floor(Math.random() * SENTENCES[sIdx].length);
        
        // 存储当前方块：它属于哪个句子，并且它现在包含了这个句子的第几个字到第几个字
        board[randomCell.r][randomCell.c] = {
            sentenceIdx: sIdx,
            startIdx: wIdx,
            endIdx: wIdx
        };
    }
}

// 核心逻辑：判断两个方块是否可以合并
function canMerge(fixed, moving) {
    if (!fixed || !moving) return false;
    // 两个方片不是同一句话的，不能合并
    if (fixed.sentenceIdx !== moving.sentenceIdx) return false;

    // 同一句里只要两段相邻（不论左右顺序）即可合并
    return fixed.endIdx + 1 === moving.startIdx || moving.endIdx + 1 === fixed.startIdx;
}

// 合并两个方块，并返回合并后的新方块
function getMergedTile(fixed, moving) {
    return {
        sentenceIdx: fixed.sentenceIdx,
        startIdx: Math.min(fixed.startIdx, moving.startIdx),
        endIdx: Math.max(fixed.endIdx, moving.endIdx)
    };
}

// 单行/单列滑动逻辑
function slide(row, isReversed = false) {
    // 1. 去掉空格，把所有方块紧凑挤在一起
    let filteredRow = row.filter(val => val !== null);
    
    // 2. 依次检查相邻元素能否合并
    for (let i = 0; i < filteredRow.length - 1; i++) {
        // filteredRow 中相邻两个方块如果可拼接就合并（不区分方向）
        if (canMerge(filteredRow[i], filteredRow[i+1])) {
            filteredRow[i] = getMergedTile(filteredRow[i], filteredRow[i+1]);
            let currentLen = (filteredRow[i].endIdx - filteredRow[i].startIdx) + 1;
            score += currentLen * 20; // 成功拼接一次加分
            filteredRow.splice(i + 1, 1);
        }
    }
    
    // 3. 补足空格
    while (filteredRow.length < gridSize) {
        filteredRow.push(null);
    }
    return filteredRow;
}

// 判断移动前后棋盘是否变化
function isBoardChanged(original, current) {
    for(let r=0; r<gridSize; r++) {
        for(let c=0; c<gridSize; c++) {
            if ((original[r][c] === null && current[r][c] !== null) ||
                (original[r][c] !== null && current[r][c] === null)) {
                return true;
            }
            if (original[r][c] !== null && current[r][c] !== null) {
                if (original[r][c].sentenceIdx !== current[r][c].sentenceIdx ||
                    original[r][c].startIdx !== current[r][c].startIdx ||
                    original[r][c].endIdx !== current[r][c].endIdx) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 深度复制棋盘
function deepCopy(b) {
    return b.map(row => row.map(cell => cell === null ? null : {...cell}));
}

function moveLeft() {
    let boardCopy = deepCopy(board);
    for (let r = 0; r < gridSize; r++) board[r] = slide(board[r], false);
    return isBoardChanged(boardCopy, board);
}

function moveRight() {
    let boardCopy = deepCopy(board);
    for (let r = 0; r < gridSize; r++) {
        board[r] = slide(board[r].reverse(), true).reverse();
    }
    return isBoardChanged(boardCopy, board);
}

function moveUp() {
    let boardCopy = deepCopy(board);
    for (let c = 0; c < gridSize; c++) {
        let col = [board[0][c], board[1][c], board[2][c], board[3][c]];
        col = slide(col, false);
        for (let r = 0; r < gridSize; r++) board[r][c] = col[r];
    }
    return isBoardChanged(boardCopy, board);
}

function moveDown() {
    let boardCopy = deepCopy(board);
    for (let c = 0; c < gridSize; c++) {
        let col = [board[0][c], board[1][c], board[2][c], board[3][c]];
        col = slide(col.reverse(), true).reverse();
        for (let r = 0; r < gridSize; r++) board[r][c] = col[r];
    }
    return isBoardChanged(boardCopy, board);
}

// 检查是否结束（格子满了且任何相邻都没有可以合成的词）
function checkGameOver() {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] === null) return false;
        }
    }
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (c < gridSize - 1 && canMerge(board[r][c], board[r][c+1])) return false;
            if (r < gridSize - 1 && canMerge(board[r][c], board[r+1][c])) return false;
        }
    }
    return true;
}

function checkCompletedSentences() {
    let completedText = [];
    
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            let tile = board[r][c];
            if (tile !== null) {
                let sLen = SENTENCES[tile.sentenceIdx].length;
                if (tile.startIdx === 0 && tile.endIdx === sLen - 1) {
                    // 完成了一个句子！
                    let text = SENTENCES[tile.sentenceIdx].join('');
                    completedText.push(text);
                    
                    // 加大分
                    score += sLen * 100;
                    
                    // 从棋盘移除该方块，腾出空间
                    board[r][c] = null;
                    
                    // 替换活跃列表中的这个句子，引入新句子
                    let listIndex = activeSentences.indexOf(tile.sentenceIdx);
                    if (listIndex !== -1) {
                        activeSentences.splice(listIndex, 1);
                        let newIdx = getNewRandomSentence();
                        activeSentences.push(newIdx);
                    }
                }
            }
        }
    }
    
    if (completedText.length > 0) {
        document.getElementById('completed-sentence').innerHTML = completedText.join('<br><br>');
        document.getElementById('sentence-message').style.display = 'flex';
        isPaused = true;
        return true; // 发现结算
    }
    return false;
}

function continueGame() {
    document.getElementById('sentence-message').style.display = 'none';
    isPaused = false;
    updateBoard();
    updateScore();
}

window.addEventListener('keydown', (e) => {
    if (isPaused) return; // 暂停时不处理按键
    
    let moved = false;
    
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) moved = moveLeft();
    else if (['ArrowRight', 'd', 'D'].includes(e.key)) moved = moveRight();
    else if (['ArrowUp', 'w', 'W'].includes(e.key)) moved = moveUp();
    else if (['ArrowDown', 's', 'S'].includes(e.key)) moved = moveDown();

    if (moved) {
        // 先检查是否有合成完成的句子！
        checkCompletedSentences();
        
        addRandomTile();
        updateBoard();
        updateScore();
        if (!isPaused && checkGameOver()) {
            document.getElementById('game-message').style.display = 'flex';
            isPaused = true;
        }
    }
});

// ==== 移动端触屏滑动支持 ====
let touchStartX = 0;
let touchStartY = 0;

// 在棋盘区域监听触摸事件
document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.querySelector('.game-container');
    
    gameContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: false });

    // 防止在棋盘上滑动时页面跟着滚动
    gameContainer.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    gameContainer.addEventListener('touchend', (e) => {
        if (isPaused) return;

        let touchEndX = e.changedTouches[0].screenX;
        let touchEndY = e.changedTouches[0].screenY;
        
        let diffX = touchEndX - touchStartX;
        let diffY = touchEndY - touchStartY;
        
        // 设一个滑动阈值，避免误触（比如至少滑动 30px 才算数）
        if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) return;

        let moved = false;
        
        // 判断滑动方向
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 水平滑动
            if (diffX > 0) moved = moveRight();
            else moved = moveLeft();
        } else {
            // 垂直滑动
            if (diffY > 0) moved = moveDown();
            else moved = moveUp();
        }

        if (moved) {
            checkCompletedSentences();
            addRandomTile();
            updateBoard();
            updateScore();
            if (!isPaused && checkGameOver()) {
                document.getElementById('game-message').style.display = 'flex';
                isPaused = true;
            }
        }
    });
});

function resetGame() {
    isPaused = false;
    initGame();
}

window.onload = initGame;
