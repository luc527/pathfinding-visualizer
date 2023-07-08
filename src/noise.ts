// Too lazy to actually learn how some noise function works
// So let's just plop some circular mountains/valleys onto the ground

import { World, Rect, lerp, randint, dim, clamp } from './common.js';

function applyCircle(world: World, rect: Rect, magnitude: number): void {
    const rows = world.length;
    const cols = world[0].length;

    const { tl, w, h } = rect;

    for (let ro = 0; ro < rect.w; ro++) { //row offset
        for (let co = 0; co < rect.h; co++) { //col offset
            const row = tl.row + ro;
            const col = tl.col + co;

            // out of bounds
            if (row > rows || col > cols) continue;

            //position in the unit circle
            const x = ro/(w/2)-1;
            const y = co/(h/2)-1;

            // distance from the origin
            const d = Math.sqrt(x**2 + y**2);

            // outside of the circle
            if (d > 1) continue;

            const delta = lerp(0, magnitude, 1-d);
            world[row][col] = clamp(world[row][col] + delta, 0, 1);
        }
    }
}

function randomRectInside(rows: number, cols: number): Rect {
    const row = randint(0, rows);
    const col = randint(0, cols);
    const tl = { row, col };
    const k  = randint(10, 50);
    const w  = Math.min(k+randint(0,5), rows-row);
    const h  = Math.min(k+randint(0,5), cols-col);
    return { tl, w, h }
}

export function plopRandom(world: World): void {
    const { rows, cols } = dim(world);
    const rect = randomRectInside(rows, cols);
    const magnitude = (Math.random() - 0.5) * 0.8;
    applyCircle(world, rect, magnitude);
}