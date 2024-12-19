'use strict'

const MINE = '&#10055;'
const FLAG = '&#9872;'
const STATUS = '&#9786;'
const STATUS_L = '&#9785;'
const STATUS_W = '&#9996;'

var gLevel
var gGame

var gBoard
var gVacantCells
var gMines

var gTimer

function onInit() {
    gLevel = { size: 4, mines: 2 }
    resetGame()
}

function resetGame() {
    clearInterval(gTimer)
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: 3,
        isHint: false,
        safeClickCount: 3,
        isCustom: false,
        isCustomStart: false,
        megaHint: { isActive: false, isUsed: false, coords1: null }
    }
    gVacantCells = []
    gMines = []
    buildBoard()

    renderBoard(gBoard)

    document.querySelector('.status').innerHTML = STATUS
    document.querySelector('.lives').innerHTML = gGame.lives
    document.querySelector('.timer').innerHTML = gGame.secsPassed
    document.querySelector('.safe span').innerHTML = gGame.safeClickCount
    document.querySelector('.custom-game').style.display = 'inline'
    var hints = document.querySelectorAll('.hints')
    for (let i = 0; i < hints.length; i++) {
        hints[i].onclick = () => activateHint(hints[i])
        hints[i].style.opacity = 1
    }
}

function changeSize(size) {
    gLevel.size = size
    switch (size) {
        case 12:
            gLevel.mines = 32
            break;
        case 8:
            gLevel.mines = 14
            break;
        default:
            gLevel.mines = 2
            break;
    }
    resetGame()
}

function buildBoard() {
    gBoard = createMat(gLevel.size)

    for (var i = 0; i < gLevel.size; i++) {
        for (var j = 0; j < gLevel.size; j++) {
            gBoard[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            gVacantCells.push({ i, j })
        }
    }
}

function renderBoard(board) {
    var strHTML = ''

    for (var i = 0; i < board.length; i++) {
        strHTML += `<tr class="board-row" >\n`
        for (var j = 0; j < board[0].length; j++) {
            strHTML += `\t<td class="cell cell-${i}-${j} unshown"
            onclick="onCellClicked(this, ${i}, ${j})"
            oncontextmenu="onCellMarked(this, ${i}, ${j})"></td>\n`
        }
        strHTML += `</tr>\n`
    }
    document.querySelector('.board').innerHTML = strHTML
}

function startGame() {
    gGame.isOn = true

    gTimer = setInterval(timer, 1000)

    if (!gGame.isCustom) spawnMines()
    setMinesNegsCount(gBoard)
}

function spawnMines() {
    for (var i = 0; i < gLevel.mines; i++) {
        var mine = occupyRandom(gVacantCells)
        gBoard[mine.i][mine.j].isMine = true
        gMines.push(mine)

        renderCell(mine, MINE)

        console.log(mine) // to find the random mines
    }
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var curMineCount = gBoard[i][j].minesAroundCount = countNegs(board, i, j)

            if (!gBoard[i][j].isMine) renderCell({ i, j }, curMineCount ? curMineCount : null)
        }
    }
}

function onCellClicked(elCell, i, j) {
    if (gBoard[i][j].isShown || gBoard[i][j].isMarked) return
    if (!gGame.isOn && gGame.shownCount) return

    if (gGame.isHint) {
        hint(gBoard, i, j)
        return
    }
    if (gGame.megaHint.isActive) {
        megaHint(i, j)
        return
    }
    if (gGame.isCustom) {
        document.querySelector('.custom-game').style.display = 'none'
        if (gMines.length < gLevel.mines) {
            customGameAdd(elCell, i, j)
            return
        } 
        if(!gGame.isCustomStart) customGameStart(gMines)
    }

    gBoard[i][j].isShown = true
    gGame.shownCount++
    occupy({ i, j }, gVacantCells)

    elCell.classList.replace('unshown', 'shown')
    elCell.classList.remove('safe')

    if (!gGame.isOn) startGame()

    if (gBoard[i][j].isMine) {
        gGame.lives--

        document.querySelector('div span').innerHTML = gGame.lives
        elCell.style.color = 'red'

        if (!gGame.lives) gameOver()
        checkGameOver()
        return
    }

    checkGameOver()

    if (!gBoard[i][j].minesAroundCount) expandShown(gBoard, i, j)
}

function onCellMarked(elCell, i, j) {
    event.preventDefault()
    if (gBoard[i][j].isShown || !gGame.isOn) return

    if (gBoard[i][j].isMarked) {
        var delay = NaN
        clearTimeout(delay)

        gBoard[i][j].isMarked = false
        gGame.markedCount--

        elCell.classList.add('unshown')
        delay = setTimeout(renderAfterMarked, 300, i, j)
        return
    }

    gBoard[i][j].isMarked = true
    gGame.markedCount++

    checkGameOver()

    renderCell({ i, j }, FLAG)
    elCell.classList.remove('unshown')
}

function renderAfterMarked(i, j) {
    if (gBoard[i][j].isMine) renderCell({ i, j }, MINE)
    else renderCell({ i, j }, gBoard[i][j].minesAroundCount ?
        gBoard[i][j].minesAroundCount : null)
}

function checkGameOver() {
    if (gGame.shownCount + gGame.markedCount === gLevel.size ** 2) gameOver(true)
}

function gameOver(isVic = false) {
    gGame.isOn = false
    clearInterval(gTimer)

    document.querySelector('.status').innerHTML = isVic ? STATUS_W : STATUS_L
    if (isVic) return

    for (var i = 0; i < gLevel.mines; i++) {
        renderAfterMarked(gMines[i].i, gMines[i].j)
        const elMine = document.querySelector(`.cell-${gMines[i].i}-${gMines[i].j}`)
        elMine.classList.remove('unshown')
        elMine.classList.add('shown')
    }
}

function expandShown(board, i, j) {
    var negs = findNegs(board, i, j)
    for (var i = 0; i < negs.length; i++) {
        const elCell = document.querySelector(`.cell-${negs[i].i}-${negs[i].j}`)
        onCellClicked(elCell, negs[i].i, negs[i].j)
    }
}

function timer() {
    document.querySelector('.timer').innerHTML = gGame.secsPassed
    gGame.secsPassed++
}

function activateHint(elHint) {
    if (!gGame.isOn) return
    gGame.isHint = true

    elHint.onclick = null
    elHint.style.opacity = 0.4
}

function hint(board, cellI, cellJ) {
    gGame.isHint = false

    var negs = findNegs(board, cellI, cellJ, true)

    for (var i = 0; i < negs.length; i++) {
        renderHint(negs[i].i, negs[i].j, 1000)
    }
}

function renderHint(i, j, timeoutTime) {
    gBoard[i][j].isMarked = true

    const elCell = document.querySelector(`.cell-${i}-${j}`)
    elCell.classList.remove('unshown')
    setTimeout(function () {
        elCell.classList.add('unshown')
        gBoard[i][j].isMarked = false
    }, timeoutTime)
}

function safeClick() {
    if (!gGame.isOn || !gGame.safeClickCount || !gVacantCells.length) return
    gGame.safeClickCount--
    var timeoutSafe = NaN
    clearTimeout(timeoutSafe)

    const safeCoords = occupyRandom(gVacantCells)
    gVacantCells.push(safeCoords)

    document.querySelector('.safe span').innerHTML = gGame.safeClickCount
    const elSafeCell = document.querySelector(`.cell-${safeCoords.i}-${safeCoords.j}`)
    elSafeCell.classList.add('safe')
    timeoutSafe = setTimeout(() => elSafeCell.classList.remove('safe'), 3000)
}

function customGameAdd(elCell, i, j) {
    const mine = { i, j }
    occupy(mine, gVacantCells)
    gBoard[i][j].isMine = true
    gBoard[i][j].isMarked = true
    gMines.push(mine)
    
    elCell.innerHTML = MINE
    elCell.classList.add('safe')
}

function customGameStart(mines) {
    gGame.isCustomStart = true
    for (var i = 0; i < mines.length; i++) {
        gBoard[mines[i].i][mines[i].j].isMarked = false
        
        const elMine = document.querySelector(`.cell-${mines[i].i}-${mines[i].j}`)
        elMine.classList.remove('safe')
    }
}

function activateMegaHint() {
    if (!gGame.isOn || gGame.megaHint.isUsed) return

    gGame.megaHint.isUsed = gGame.megaHint.isActive = true
}

function megaHint(cellI, cellJ) {
    if (!gGame.megaHint.coords1) {
        gGame.megaHint.coords1 = { i: cellI, j: cellJ }

        document.querySelector(`.cell-${cellI}-${cellJ}`).classList.add('safe')
        return
    }

    gGame.megaHint.isActive = false


    var smallerI = Math.min(gGame.megaHint.coords1.i, cellI)
    var biggerI = Math.max(gGame.megaHint.coords1.i, cellI)
    var smallerJ = Math.min(gGame.megaHint.coords1.j, cellJ)
    var biggerJ = Math.max(gGame.megaHint.coords1.j, cellJ)

    for (var i = smallerI; i <= biggerI; i++) {
        for (var j = smallerJ; j <= biggerJ; j++) {
            renderHint(i, j, 2000)
        }
    }
    document.querySelector(`.cell-${gGame.megaHint.coords1.i}-${gGame.megaHint.coords1.j}`).classList.remove('safe')
}

function mineExterminator() {
    if (!gGame.isOn) return
    for (var i = 0; i < Math.min(gLevel.mines, 3); i++) {
        var mineCoords = gMines.pop()
        gBoard[mineCoords.i][mineCoords.j].isMine = false
        renderCell(mineCoords, null)
    }
    setMinesNegsCount(gBoard)
}