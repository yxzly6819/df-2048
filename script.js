// ==========================================
// 💡 在这里自定义不同的句子！每个数组代表一句话。
// 游戏开始时会随机从这些句子里抽取词语生成方块，
// 只有相邻语序的词语发生碰撞，且合并顺序正确时才能成功合并。
// ==========================================
const SENTENCES = [
    ["娃娃们啊", "再这样下去", "你的德语", "就完蛋了"], // 句子 1，合成路线：我+爱=我爱，我爱+写=我爱写...
    ["你们有个", "学长"], // 句子 2
    ["没做作业的", "自己", "站起来"], // 句子 3
    ["你们", "摸着", "良心", "说说"],
    ["你们的", "良心", "已经", "大大的", "坏掉了"],
    ["飞", "乐", "然"] ,
    []
];

let board = [];
let score = 0;
const gridSize = 4;

function initGame() {
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
        
        let sIdx = Math.floor(Math.random() * SENTENCES.length);
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
function canMerge(tile1, tile2) {
    if (!tile1 || !tile2) return false;
    // 两个方片不是同一句话的，不能合并
    if (tile1.sentenceIdx !== tile2.sentenceIdx) return false;
    // 如果 方块1的结尾 接上 方块2的开头，或者 反之，就可以合并
    return (tile1.endIdx + 1 === tile2.startIdx) || (tile2.endIdx + 1 === tile1.startIdx);
}

// 合并两个方块，并返回合并后的新方块
function getMergedTile(fixed, moving) {
    if (fixed.endIdx + 1 === moving.startIdx) {
        return {
            sentenceIdx: fixed.sentenceIdx,
            startIdx: fixed.startIdx,
            endIdx: moving.endIdx
        };
    } else {
        return {
            sentenceIdx: fixed.sentenceIdx,
            startIdx: moving.startIdx,
            endIdx: fixed.endIdx
        };
    }
}

// 单行/单列滑动逻辑
function slide(row) {
    // 1. 去掉空格，把所有方块紧凑挤在一起
    let filteredRow = row.filter(val => val !== null);
    
    // 2. 依次检查相邻元素能否合并
    for (let i = 0; i < filteredRow.length - 1; i++) {
        // 向左/上滑动时，i 对应位置是接收撞击的一侧 (fixed)，i+1 是撞过来的一侧 (moving)
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
    for (let r = 0; r < gridSize; r++) board[r] = slide(board[r]);
    return isBoardChanged(boardCopy, board);
}

function moveRight() {
    let boardCopy = deepCopy(board);
    for (let r = 0; r < gridSize; r++) {
        board[r] = slide(board[r].reverse()).reverse();
    }
    return isBoardChanged(boardCopy, board);
}

function moveUp() {
    let boardCopy = deepCopy(board);
    for (let c = 0; c < gridSize; c++) {
        let col = [board[0][c], board[1][c], board[2][c], board[3][c]];
        col = slide(col);
        for (let r = 0; r < gridSize; r++) board[r][c] = col[r];
    }
    return isBoardChanged(boardCopy, board);
}

function moveDown() {
    let boardCopy = deepCopy(board);
    for (let c = 0; c < gridSize; c++) {
        let col = [board[0][c], board[1][c], board[2][c], board[3][c]];
        col = slide(col.reverse()).reverse();
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

window.addEventListener('keydown', (e) => {
    let moved = false;
    
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) moved = moveLeft();
    else if (['ArrowRight', 'd', 'D'].includes(e.key)) moved = moveRight();
    else if (['ArrowUp', 'w', 'W'].includes(e.key)) moved = moveUp();
    else if (['ArrowDown', 's', 'S'].includes(e.key)) moved = moveDown();

    if (moved) {
        addRandomTile();
        updateBoard();
        updateScore();
        if (checkGameOver()) {
            document.getElementById('game-message').style.display = 'flex';
        }
    }
});

function resetGame() {
    initGame();
}

window.onload = initGame;
