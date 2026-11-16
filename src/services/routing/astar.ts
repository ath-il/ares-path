import type { LatLng, TerrainGrid, RouteResult, RouteMode } from '../../types/mars';

interface AStarNode {
  row: number;
  col: number;
  g: number; // cost from start
  h: number; // heuristic to goal
  f: number; // g + h
  parent: AStarNode | null;
}

/**
 * A* pathfinding on a terrain grid.
 *
 * @param grid The terrain grid
 * @param startLat Start latitude
 * @param startLng Start longitude
 * @param endLat End latitude
 * @param endLng End longitude
 * @param mode Navigation mode (rover or astronaut) — affects cost weights
 * @param maxSlopeDeg Maximum acceptable slope in degrees
 * @returns RouteResult or null if no path found
 */
export function astarRoute(
  grid: TerrainGrid,
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  mode: RouteMode,
  maxSlopeDeg: number = 25,
): RouteResult | null {
  const { rows, cols, cells, cellSizeM } = grid;

  // Convert lat/lng to grid coordinates
  const toGrid = (lat: number, lng: number): { row: number; col: number } => {
    const r = Math.round(((grid.maxLat - lat) / (grid.maxLat - grid.minLat)) * (rows - 1));
    const c = Math.round(((lng - grid.minLng) / (grid.maxLng - grid.minLng)) * (cols - 1));
    return {
      row: Math.max(0, Math.min(rows - 1, r)),
      col: Math.max(0, Math.min(cols - 1, c)),
    };
  };

  const start = toGrid(startLat, startLng);
  const goal = toGrid(endLat, endLng);

  // Heuristic: Euclidean distance in grid cells
  const heuristic = (r: number, c: number): number => {
    const dr = r - goal.row;
    const dc = c - goal.col;
    return Math.sqrt(dr * dr + dc * dc);
  };

  // Mode-specific cost multipliers
  const slopeWeight = mode === 'rover' ? 1.5 : 1.0; // rovers care more about slope
  const roughnessWeight = mode === 'rover' ? 1.2 : 0.8; // astronauts less sensitive

  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();

  const startNode: AStarNode = {
    row: start.row,
    col: start.col,
    g: 0,
    h: heuristic(start.row, start.col),
    f: heuristic(start.row, start.col),
    parent: null,
  };
  openSet.push(startNode);

  let nodesExplored = 0;
  const maxNodes = rows * cols * 2;

  while (openSet.length > 0 && nodesExplored < maxNodes) {
    nodesExplored++;

    // Find node with lowest f
    let lowestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestIdx].f) lowestIdx = i;
    }
    const current = openSet.splice(lowestIdx, 1)[0];
    const key = `${current.row},${current.col}`;

    if (closedSet.has(key)) continue;
    closedSet.add(key);

    // Check if we reached the goal
    if (current.row === goal.row && current.col === goal.col) {
      // Reconstruct path
      const path: { row: number; col: number }[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift({ row: node.row, col: node.col });
        node = node.parent;
      }

      // Convert to lat/lng
      const latLngPath: LatLng[] = path.map((p) => ({
        lat: grid.maxLat - (p.row / (rows - 1)) * (grid.maxLat - grid.minLat),
        lng: grid.minLng + (p.col / (cols - 1)) * (grid.maxLng - grid.minLng),
      }));

      // Compute metrics
      let distanceM = 0;
      let elevationGainM = 0;
      let maxSlopeDeg = 0;
      let totalCost = 0;
      let blockedCells = 0;
      let unknownCells = 0;

      for (let i = 0; i < path.length; i++) {
        const cell = cells[path[i].row][path[i].col];
        if (cell.blocked) blockedCells++;
        if (cell.elevationM === null) unknownCells++;
        if (i > 0) {
          const prev = path[i - 1];
          const prevCell = cells[prev.row][prev.col];
          distanceM += cellSizeM * Math.sqrt(
            Math.pow(path[i].row - prev.row, 2) + Math.pow(path[i].col - prev.col, 2),
          );
          if (cell.elevationM !== null && prevCell.elevationM !== null) {
            elevationGainM += Math.max(0, cell.elevationM - prevCell.elevationM);
            const elevDiff = Math.abs(cell.elevationM - prevCell.elevationM);
            const dist = cellSizeM * Math.sqrt(
              Math.pow(path[i].row - prev.row, 2) + Math.pow(path[i].col - prev.col, 2),
            );
            const slope = Math.atan2(elevDiff, dist) * (180 / Math.PI);
            maxSlopeDeg = Math.max(maxSlopeDeg, slope);
          }
          totalCost += cell.cost * slopeWeight;
        }
      }

      // Waypoints (every ~5th point)
      const waypointInterval = Math.max(1, Math.floor(path.length / 5));
      const waypoints: LatLng[] = [];
      for (let i = 0; i < path.length; i += waypointInterval) {
        waypoints.push(latLngPath[i]);
      }
      if (waypoints[waypoints.length - 1] !== latLngPath[latLngPath.length - 1]) {
        waypoints.push(latLngPath[latLngPath.length - 1]);
      }

      return {
        path: latLngPath,
        distanceM,
        elevationGainM,
        maxSlopeDeg,
        totalCost,
        mode,
        blockedCells,
        unknownCells,
        waypoints,
      };
    }

    // Explore neighbors (8-directional)
    const neighbors = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];

    for (const [dr, dc] of neighbors) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

      const neighborKey = `${nr},${nc}`;
      if (closedSet.has(neighborKey)) continue;

      const cell = cells[nr][nc];
      if (cell.blocked) continue;
      if (cell.slopeDeg !== null && cell.slopeDeg > maxSlopeDeg) continue;

      // Cost: base cell cost + slope penalty + diagonal penalty
      const isDiagonal = Math.abs(dr) === 1 && Math.abs(dc) === 1;
      const moveCost = isDiagonal ? 1.414 : 1.0;
      const slopeCost = cell.cost * slopeWeight;
      const roughnessCost = (cell.cost - 1) * roughnessWeight;
      const g = current.g + moveCost + slopeCost + roughnessCost;

      const existing = openSet.find((n) => n.row === nr && n.col === nc);
      if (existing && g >= existing.g) continue;

      const node: AStarNode = {
        row: nr,
        col: nc,
        g,
        h: heuristic(nr, nc),
        f: g + heuristic(nr, nc),
        parent: current,
      };

      if (existing) {
        existing.g = g;
        existing.f = g + existing.h;
        existing.parent = current;
      } else {
        openSet.push(node);
      }
    }
  }

  return null; // no path found
}