'use strict'

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min)
    const maxFloored = Math.floor(max)
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled)
}

function createMat(rows, cols = rows) {
    var mat = []
    for (var i = 0; i < rows; i++) {
        mat[i] = []
        for (var j = 0; j < cols; j++) {
            mat[i][j] = null
        }
    }
    return mat
}

function countNegs(mat, cellI, cellJ) {
    var count = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= mat[i].length) continue

            if (mat[i][j].isMine) count++
        }
    }
    return count
}

function findNegs(mat, cellI, cellJ, withMines = false) {
    var negs = []
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ && !withMines) continue
            if (j < 0 || j >= mat[i].length) continue
            if (mat[i][j].isShown) continue

            if (!mat[i][j].isMine || withMines) negs.push({ i, j })
        }
    }
    return negs
}

function renderCell(location, value) {
    const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)
    elCell.innerHTML = value
}

function occupy(coords, vacArr) {
    return vacArr.splice(vacArr.findIndex(c => c.i === coords.i && c.j === coords.j), 1)[0]
}

function occupyRandom(vacArr) {
    return vacArr.splice(getRandomInt(0, vacArr.length), 1)[0]
}
