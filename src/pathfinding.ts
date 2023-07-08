import { Pos, matrix } from "./common.js"
import PriorityQueue from "./priorityQueue.js"
import Queue from "./queue.js"

export interface Problem {
  rows: number
  cols: number
  start: Pos
  goal: Pos
  obstacle: boolean[][]
  cost(srow: number, scol: number, drow: number, dcol: number): number
}

enum Dir {
  Up,
  Down,
  Right,
  Left
}

interface Node {
  parent: Node
  pathCost: number
  row: number
  col: number
}

function _recoverPath(n: Node, path: Pos[]) {
  if (n == null) {
    return
  }
  if (n.parent != null) {
    _recoverPath(n.parent, path)
  }
  path.push({ row: n.row, col: n.col })
}

function generatePath(n: Node): Pos[] {
  const path: Pos[] = []
  _recoverPath(n, path)
  return path
}

const allDirections = [ Dir.Up, Dir.Down, Dir.Right, Dir.Left ]

function* expand(problem: Problem, n: Node): Generator<Node> {
  const { cost } = problem
  for (const dir of allDirections) {
    let { row, col } = n
    switch (dir) {
      case Dir.Up:    row--; break;
      case Dir.Down:  row++; break;
      case Dir.Left:  col--; break;
      case Dir.Right: col++; break;
    }
    if (row < 0 || col < 0 || row >= problem.rows || col >= problem.cols) {
      continue
    }
    if (problem.obstacle[row][col]) {
      continue
    }
    yield {
      parent: n,
      pathCost: n.pathCost + cost(n.row, n.col, row, col),
      row,
      col
    }
  }
}

// bfs is not going to find the best solution

export function bfs(problem: Problem): false|Pos[] {
  const reached = matrix<boolean>(problem.rows, problem.cols, false)
  const frontier = new Queue<Node>()

  const { start, goal } = problem
  frontier.enqueue({
    parent: null,
    pathCost: 0,
    row: start.row,
    col: start.col
  })
  reached[start.row][start.col] = true

  while (!frontier.isEmpty()) {
    const node = frontier.dequeue()
    for (const child of expand(problem, node)) {
      if (child.row == goal.row && child.col == goal.col) {
        return generatePath(child)
      }
      if (reached[child.row][child.col]) {
        continue
      }
      frontier.enqueue(child)
      reached[child.row][child.col] = true
    }
  }
  return false
}

function bestFirstSearch(problem: Problem, f: (n: Node) => number): false|Pos[] {
  const { rows, cols, start, goal } = problem

  const reached = matrix<Node>(rows, cols, null)
  const frontier = new PriorityQueue<Node>((n, m) => f(n) - f(m))

  const initialNode = {
    parent: null,
    pathCost: 0,
    row: start.row,
    col: start.col
  }
  reached[start.row][start.col] = initialNode
  frontier.enqueue(initialNode)

  while (!frontier.isEmpty()) {
    const node = frontier.dequeue();
    if (node.row == goal.row && node.col == goal.col) {
      return generatePath(node)
    }

    for (const child of expand(problem, node)) {
      const reachedNode = reached[child.row][child.col]
      if (reachedNode == null || child.pathCost < reachedNode.pathCost) {
        reached[child.row][child.col] = child
        frontier.enqueue(child)
      }
    }
  }

  return false
}

export function uniformCostSearch(problem: Problem): false|Pos[] {
  return bestFirstSearch(problem, n => n.pathCost)
}