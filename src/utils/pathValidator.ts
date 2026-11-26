import { Position, TileType } from '../types/index';

interface QueueNode {
  pos: Position;
  hasKey: boolean;
  path: Position[];
}

/**
 * Validates whether a valid path exists from Start to Goal.
 * Accounts for 4 directional single-step moves AND 2-step jumps over hazards/empty tiles.
 * Accounts for Key collection unlocking Doors.
 */
export function validateBoardPath(
  board: TileType[][],
  startPos: Position
): { isValid: boolean; shortestPathLength: number; requiredKey: boolean; error?: string } {
  const rows = board.length;
  const cols = board[0].length;

  let goalPos: Position | null = null;
  let keyPos: Position | null = null;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === 'GOAL') {
        goalPos = { row: r, col: c };
      }
      if (board[r][c] === 'KEY') {
        keyPos = { row: r, col: c };
      }
    }
  }

  if (!goalPos) {
    return { isValid: false, shortestPathLength: 0, requiredKey: false, error: 'No GOAL tile found on board' };
  }

  // BFS state: row, col, hasKey
  const visited = new Set<string>();
  const makeKey = (r: number, c: number, k: boolean) => `${r},${c},${k ? 1 : 0}`;

  const queue: QueueNode[] = [
    {
      pos: startPos,
      hasKey: false,
      path: [startPos],
    },
  ];

  visited.add(makeKey(startPos.row, startPos.col, false));

  const directions = [
    { dr: -1, dc: 0 }, // UP
    { dr: 1, dc: 0 },  // DOWN
    { dr: 0, dc: -1 }, // LEFT
    { dr: 0, dc: 1 },  // RIGHT
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const { row, col } = current.pos;
    let hasKey = current.hasKey;

    // Check if on key tile
    if (board[row][col] === 'KEY') {
      hasKey = true;
    }

    // Check if reached goal
    if (row === goalPos.row && col === goalPos.col) {
      return {
        isValid: true,
        shortestPathLength: current.path.length - 1,
        requiredKey: hasKey,
      };
    }

    // Try single-tile moves in 4 directions
    for (const d of directions) {
      const nr = row + d.dr;
      const nc = col + d.dc;

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const tile = board[nr][nc];
        const canStep =
          tile !== 'WALL' &&
          tile !== 'HAZARD' &&
          (tile !== 'DOOR' || hasKey);

        const stateKey = makeKey(nr, nc, hasKey);
        if (canStep && !visited.has(stateKey)) {
          visited.add(stateKey);
          queue.push({
            pos: { row: nr, col: nc },
            hasKey,
            path: [...current.path, { row: nr, col: nc }],
          });
        }
      }

      // Try 2-step JUMP over the intermediate tile
      const jr = row + d.dr * 2;
      const jc = col + d.dc * 2;

      if (jr >= 0 && jr < rows && jc >= 0 && jc < cols) {
        const targetTile = board[jr][jc];
        // Hero can jump OVER hazards or walls, provided landing tile is walkable
        const canLand =
          targetTile !== 'WALL' &&
          targetTile !== 'HAZARD' &&
          (targetTile !== 'DOOR' || hasKey);

        const jumpStateKey = makeKey(jr, jc, hasKey);
        if (canLand && !visited.has(jumpStateKey)) {
          visited.add(jumpStateKey);
          queue.push({
            pos: { row: jr, col: jc },
            hasKey,
            path: [...current.path, { row: jr, col: jc }],
          });
        }
      }
    }
  }

  return {
    isValid: false,
    shortestPathLength: 0,
    requiredKey: false,
    error: 'Goal is unreachable from the current start position',
  };
}
