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
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0, lives: 3 }
    gVacantCells = []
    gMines = []
    buildBoard()
    renderBoard(gBoard)

    document.querySelector('.status').innerHTML = STATUS
    document.querySelector('.lives').innerHTML = gGame.lives
    document.querySelector('.timer').innerHTML = gGame.secsPassed
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

    occupy({ i, j }, gVacantCells)
    gGame.shownCount++

    spawnMines()
    setMinesNegsCount(gBoard)
}

function spawnMines() {
    for (var i = 0; i < gLevel.mines; i++) {
        var mine = gVacantCells.splice(getRandomInt(0, gVacantCells.length), 1)[0]
        gBoard[mine.i][mine.j].isMine = true
        gMines.push(mine)

        renderCell(mine, MINE)

        console.log(mine)
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

    gBoard[i][j].isShown = true

    elCell.classList.replace('unshown', 'shown')

    if (!gGame.isOn) startGame(i, j)

    if (gBoard[i][j].isMine) {
        gGame.lives--

        document.querySelector('div span').innerHTML = gGame.lives
        elCell.style.color = 'red'

        if (!gGame.lives) gameOver()
        return
    }

    if (gGame.shownCount + gGame.markedCount === gLevel.size ** 2) {
        gameOver(true)
        return
    }

    expandShown(gBoard, elCell, i, j)
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

    renderCell({ i, j }, FLAG)
    elCell.classList.remove('unshown')
}

function renderAfterMarked(i, j) {
    if (gBoard[i][j].isMine) renderCell({ i, j }, MINE)
    else renderCell({ i, j }, gBoard[i][j].minesAroundCount ?
        gBoard[i][j].minesAroundCount : null)
}

function gameOver(isVictory = false) {

}

function expandShown(board, elCell, i, j) {
    var negs = findNegs(board, i, j)
    console.log(negs)
}

function timer() {
    document.querySelector('.timer').innerHTML = gGame.secsPassed
    gGame.secsPassed++
}