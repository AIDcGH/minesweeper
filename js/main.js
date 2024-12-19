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
var gMoves

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
        safeClickCount: 3
    }
    gVacantCells = []
    gMines = []
    gMoves = []
    buildBoard()
    renderBoard(gBoard)

    document.querySelector('.status').innerHTML = STATUS
    document.querySelector('.lives').innerHTML = gGame.lives
    document.querySelector('.timer').innerHTML = gGame.secsPassed
    document.querySelector('.safe span').innerHTML = gGame.safeClickCount
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

function startGame(i, j) {
    gGame.isOn = true

    gTimer = setInterval(timer, 1000)

    spawnMines()
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

            if (curMineCount && !gBoard[i][j].isMine) renderCell({ i, j }, curMineCount)
        }
    }
}

function onCellClicked(elCell, i, j) {
    if (gBoard[i][j].isShown || gBoard[i][j].isMarked) return
    if (!gGame.isOn && gGame.shownCount) return

    if (gGame.isHint) {
        hint(gBoard, elCell, i, j)
        return
    }

    gBoard[i][j].isShown = true
    gGame.shownCount++
    occupy({ i, j }, gVacantCells)

    elCell.classList.replace('unshown', 'shown')
    elCell.classList.remove('safe')

    if (!gGame.isOn) startGame()

    if (gBoard[i][j].isMine) {
        gGame.lives--
        gBoard[i][j].isMarked = true

        document.querySelector('div span').innerHTML = gGame.lives
        elCell.style.color = 'red'

        if (!gGame.lives) gameOver()
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

function hint(board, elClickedCell, cellI, cellJ) {
    gGame.isHint = false
    var timeoutHint = NaN
    clearTimeout(timeoutHint)

    var negs = findNegs(board, cellI, cellJ, true)

    elClickedCell.classList.remove('unshown')
    timeoutHint = setTimeout(() => elClickedCell.classList.add('unshown'), 1000)
    for (var i = 0; i < negs.length; i++) {
        // const elCell = document.querySelector(`.cell-${negs[i].i}-${negs[i].j}`)
        // elCell.classList.remove('unshown')
        // timeoutHint = setTimeout(() => elCell.classList.add('unshown'), 1000)
        renderHint(negs[i].i, negs[i].j, timeoutHint, 1000)
    }
}

function activateHint(elHint) {
    if (!gGame.isOn) return
    gGame.isHint = true

    elHint.onclick = null
    elHint.style.opacity = 0.4
}

function renderHint(i, j, timeoutHint, timeoutTime) {
    const elCell = document.querySelector(`.cell-${i}-${j}`)
    elCell.classList.remove('unshown')
    timeoutHint = setTimeout(() => elCell.classList.add('unshown'), timeoutTime)
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

function customGame() {

}

function megaHint() {
    // push moves for every OCC activation, then pop
}

function mineExterminator() {

}