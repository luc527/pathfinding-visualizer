import { Pos, matrix, lerp, eqPos } from "./common.js"
import { uniformCostSearch } from "./pathfinding.js"
import { plopRandom } from "./noise.js"

interface RGB {
  r: number
  g: number
  b: number
}

function rgbToString(c: RGB): string {
  return `rgb(${c.r}, ${c.g}, ${c.b})`
}

function invertColor(c: RGB): RGB {
  return {
    r: 255-c.r,
    g: 255-c.g,
    b: 255-c.b,
  }
}

interface HeightColor {
  height: number
  color: RGB
}

// TODO better key colors somehow

// like key frames
const heightKeyColors: Array<HeightColor> = [
  { height: 0.0, color: { r: 0x00, g: 0x00, b: 0x00 } },
  { height: 0.1, color: { r: 0x00, g: 0x4d, b: 0x04 } },
  { height: 0.4, color: { r: 0x8a, g: 0xff, b: 0x7a } },
  { height: 0.8, color: { r: 0xda, g: 0xff, b: 0xcc } },
  { height: 0.9, color: { r: 0xda, g: 0xff, b: 0xcc } },
  { height: 1.0, color: { r: 0xff, g: 0xff, b: 0xff } },
]

function lerpColor(v: RGB, w: RGB, x: number): RGB {
  return {
    r: lerp(v.r, w.r, x),
    g: lerp(v.g, w.g, x),
    b: lerp(v.b, w.b, x),
  }
}

function colorFromHeight(h: number): RGB {
  let i: number;
  for (i = 1; i < heightKeyColors.length; i++) {
    if (h <= heightKeyColors[i].height) {
      break
    }
  }
  if (i > 0 && i < heightKeyColors.length) {
    const j = i-1
    const { height: h1, color: c1 } = heightKeyColors[j]
    const { height: h2, color: c2 } = heightKeyColors[i]
    const x = (h - h1) / (h2 - h1)
    return lerpColor(c1, c2, x)
  }

  // signals an error
  return { r: 0xFF, g: 0x00, b: 0x00 }
}

function posFromEvent(event: MouseEvent): Pos {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  return {
    row: Math.trunc((event.clientY - rect.y) / sidePx),
    col: Math.trunc((event.clientX - rect.x) / sidePx),
  }
}

enum CurSize {
  Small,
  Medium,
  Large,
  Ginormous
}

function cursorOffset(x: CurSize): number {
  switch (x) {
    case CurSize.Small: return 0
    case CurSize.Medium: return 1
    case CurSize.Large: return 3
    case CurSize.Ginormous: return 7
  }
}

function largerCurSize(x: CurSize): CurSize {
  switch (x) {
    case CurSize.Small: return CurSize.Medium;
    case CurSize.Medium: return CurSize.Large;
    case CurSize.Large: return CurSize.Ginormous;
    case CurSize.Ginormous: return CurSize.Ginormous;
  }
}

function smallerCurSize(x: CurSize): CurSize {
  switch (x) {
    case CurSize.Small: return CurSize.Small;
    case CurSize.Medium: return CurSize.Small;
    case CurSize.Large: return CurSize.Medium;
    case CurSize.Ginormous: return CurSize.Large;
  }
}

//
// interface setup
//

const rows = 60
const cols = 100

const world = matrix<number>(rows, cols, 0.5);

const sidePx = 10

const container = document.getElementById('the-container')

const canvas = document.createElement('canvas')
canvas.height = rows * sidePx
canvas.width  = cols * sidePx
container.append(canvas)

const conx = canvas.getContext('2d')

let curSize = CurSize.Small
let curRow: number|null = null
let curCol: number|null = null

// add/erase obstacles
let addUnderCursor   = false
let eraseUnderCursor = false

let problemStart = { row: rows/2, col: 5 }
let problemGoal  = { row: rows/2, col: cols-5 }

let problemSolution: Pos[] = []

let draggingProblemStart = false
let draggingProblemGoal  = false

const obstacle = matrix<boolean>(rows, cols, false)

function drawTile(row: number, col: number, color: string) {
  conx.fillStyle = color
  conx.fillRect(col*sidePx, row*sidePx, sidePx, sidePx)
}

function calcHeight(row: number, col: number): number {
  // for now it's a circle thingy
  // later will be some noise function
  const y = row / (rows/2) - 1
  const x = col / (cols/2) - 1
  const d = Math.sqrt(x**2 + y**2) //distance to origin
  return d > 1 ? 0 : 1-d
}

function underCursor(fn: (row: number, col: number) => void): void {
  if (curSize == CurSize.Small) {
    fn(curRow, curCol)
    return
  }
  const offset = cursorOffset(curSize)
  for (let i = curRow-offset; i <= curRow+offset; i++) {
    for (let j = curCol-offset; j <= curCol+offset; j++) {
      if (i < 0 || j < 0 || i >= rows || j >= cols) {
        continue
      }
      fn(i, j)
    }
  }
}

const obstacleColor: RGB = {
  r: 0xee,
  g: 0xaa,
  b: 0xee
}

const startColor: RGB = {
  r: 0x44, g: 0x44, b: 0xff
}

const goalColor: RGB = {
  r: 0xff, g: 0x44, b: 0x44
}

const solutionPathColor: RGB = {
  r: 0x44, g: 0xff, b: 0xff
}
const solutionPathColorString = rgbToString(solutionPathColor)

// TODO [maybe] it would be better to generate the color strings just once
// and store it in a matrix, since it doesn't change, at it's currently
// being generated at every iteration of the rendering loop

function getColor(row: number, col: number): RGB {
  const pos = {row, col};
  if (eqPos(pos, problemStart)) return startColor;
  if (eqPos(pos, problemGoal))  return goalColor;
  if (obstacle[row][col])       return obstacleColor;
  return colorFromHeight(world[row][col]);
}

function mainLoop(): void {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      drawTile(row, col, rgbToString(getColor(row, col)));
    }
  }

  if (curRow != null && curCol != null) {
    underCursor((row: number, col: number) => {
      if (draggingProblemGoal || draggingProblemStart) return;
      drawTile(row, col, rgbToString(invertColor(getColor(row, col))));
    })
  }

  // ignore problem start and goal
  for (let i = 1; i < problemSolution.length-1; i++) {
    const pos = problemSolution[i];
    drawTile(pos.row, pos.col, solutionPathColorString)
  }

  requestAnimationFrame(mainLoop)
}

canvas.addEventListener('mousemove', (event: MouseEvent) => {
  const { row, col } = posFromEvent(event)
  curRow = row
  curCol = col

  if (draggingProblemStart){
    problemStart.row = row
    problemStart.col = col
  }
  else if (draggingProblemGoal) {
    problemGoal.row = row
    problemGoal.col = col
  }
  else if (addUnderCursor){
    underCursor((r, c) => {
      obstacle[r][c] = true
    })
  }
  else if (eraseUnderCursor) {
    underCursor((r, c) => {
      obstacle[r][c] = false
    })
  }
})

canvas.addEventListener('mousedown', (event: MouseEvent) => {
  event.preventDefault()

  const { row, col } = posFromEvent(event)
  curRow = row
  curCol = col

  const couldBeDragging = curSize == CurSize.Small && event.buttons == 1

  draggingProblemStart = couldBeDragging && problemStart.row == row && problemStart.col == col
  draggingProblemGoal  = couldBeDragging &&  problemGoal.row == row &&  problemGoal.col == col

  const dragging = draggingProblemStart || draggingProblemGoal

  addUnderCursor   = !dragging && event.buttons == 1 //left click
  eraseUnderCursor = !dragging && event.buttons == 4 //wheel click
})

canvas.addEventListener('mouseup', () => {
  draggingProblemStart = draggingProblemGoal = addUnderCursor = eraseUnderCursor = false
})

canvas.addEventListener('mouseout', () => {
  curRow = curCol = null
  draggingProblemStart = draggingProblemGoal = addUnderCursor = eraseUnderCursor = false
})

canvas.addEventListener('wheel', (event: WheelEvent) => {
  curSize = (event.deltaY > 0 ? smallerCurSize : largerCurSize)(curSize)
})

requestAnimationFrame(mainLoop)

// TODO after moving the start of goal positions
// don't erase the previous solution
// but still draw it, just transparent/darker/something like that

const findSolutionButton = document.createElement('button')
findSolutionButton.textContent = 'Find solution'
findSolutionButton.type = 'button'

findSolutionButton.onclick = () => {
  // 0.5 is the optimal walking height/terrain
  // any more or less is equally worse
  function cost(srow: number, scol: number, drow: number, dcol: number): number {
    return 1 + Math.abs(world[srow][scol] - 0.5) + Math.abs(world[drow][dcol] - 0.5);
  }
  const problem = {
    rows,
    cols,
    start: problemStart,
    goal: problemGoal,
    obstacle,
    cost
  }
  problemSolution = []
  const result = uniformCostSearch(problem)
  if (result === false) {
    console.log('no solution :(')
  } else {
    problemSolution = result
  }
}

container.append(findSolutionButton)

const plopButton = document.createElement('button');
Object.assign(plopButton, {
  textContent: 'Plop',
  type: 'button',
  onclick() {
    plopRandom(world);
  }
});
container.append(plopButton);