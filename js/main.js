'use strict'

const MINE = '&#8506;'
const FLAG = '&#9872;'
const STATUS = '&#9786;'
const STATUS_L = '&#9785;'
const STATUS_W = '&#9996;'

var gBoard
var gLevel
var gGame
var gVacantCells

function onInit() {
    gLevel = { size: 4, mines: 2 }
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 }
    gVacantCells = []
    buildBoard()
    renderBoard(gBoard)
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
            onclick="onCellClicked(this, ${i}, ${j})"></td>\n`
        }
        strHTML += `</tr>\n`
    }
    document.querySelector('.board').innerHTML = strHTML
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var curMineCount = gBoard[i][j].minesAroundCount
            curMineCount = countNegs(board, i, j)

            if (curMineCount && !gBoard[i][j].isMine) renderCell({ i, j }, curMineCount)
        }
    }
}

function onCellClicked(elCell, i, j) {
    gBoard[i][j].isShown = true

    elCell.classList.remove('unshown')
    elCell.classList.add('shown')

    if (!gGame.isOn) startGame(elCell, i, j)
}

function startGame(elCell, i, j) {
    gGame.isOn = true
    spawnMines()
    setMinesNegsCount(gBoard)
}

function spawnMines() {
    // var mine1 = { i: 1, j: 1 }
    // var mine2 = { i: 2, j: 3 }
    // gBoard[1][1].isMine = true
    // gBoard[2][3].isMine = true
    // renderCell(mine1, MINE)
    // renderCell(mine2, MINE)
    for (var i = 0; i < gLevel.mines; i++) {
        var mine = gVacantCells.splice(getRandomInt(0, gVacantCells.length), 1)[0]
        gBoard[mine.i][mine.j].isMine = true
        console.log(mine)
        renderCell(mine, MINE)
    }
}

function onCellMarked(elCell) {

}

function checkGameOver() {

}

function expandShown(board, elCell, i, j) {

}

