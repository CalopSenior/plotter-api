/**
 * PlotterAPI - Biblioteca COMPLETA para geração de gráficos, GA, álgebra linear e análise numérica.
 * Versão 2.0.1 (Corrigido - context-independent)
 */

// Debug: validar se PlotterAPI foi definido
if (typeof PlotterAPIDebug !== 'undefined') {
  console.log('⚠️ PlotterAPI já foi definido anteriormente!');
}

const PlotterAPI = {
  // ==========================================
  // 1. CONSTRUTORES DE GEOMETRIA ANALÍTICA (GA)
  // ==========================================

  point3D(x, y, z) {
    return { type: "point3D", coords: [x, y, z] };
  },
  vector3D(dx, dy, dz, originX = 0, originY = 0, originZ = 0) {
    return {
      type: "vector3D",
      dir: [dx, dy, dz],
      origin: [originX, originY, originZ],
    };
  },
  line3D(p0, dir) {
    return { type: "line3D", p0, dir };
  },
  plane3D(a, b, c, d) {
    return { type: "plane3D", eq: [a, b, c, d] };
  },

  /** Cria um objeto vetor 2D nativo */
  vector(dimension, coords) {
    if (!Array.isArray(coords)) {
      console.error('vector(): coords deve ser um array', coords);
      return null;
    }
    return { type: "vector", dim: dimension, data: coords };
  },

  // ==========================================
  // 2. CONSTRUTORES DE SÓLIDOS (POLIEDROS)
  // ==========================================

  polyhedron(vertices, faces) {
    return { type: "polyhedron", vertices, faces };
  },

  cube(size = 2, center = [0, 0, 0]) {
    const s = size / 2,
      [cx, cy, cz] = center;
    const v = [
      [cx - s, cy - s, cz - s],
      [cx + s, cy - s, cz - s],
      [cx + s, cy + s, cz - s],
      [cx - s, cy + s, cz - s],
      [cx - s, cy - s, cz + s],
      [cx + s, cy - s, cz + s],
      [cx + s, cy + s, cz + s],
      [cx - s, cy + s, cz + s],
    ];
    const f = [
      [0, 1, 2, 3],
      [5, 4, 7, 6],
      [4, 0, 3, 7],
      [1, 5, 6, 2],
      [4, 5, 1, 0],
      [3, 2, 6, 7],
    ];
    return { type: "polyhedron", vertices: v, faces: f };
  },

  sphere(radius = 1, center = [0, 0, 0], segments = 16) {
    const vertices = [],
      faces = [];
    const [cx, cy, cz] = center;
    for (let i = 0; i <= segments; i++) {
      const phi = (i / segments) * Math.PI;
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * 2 * Math.PI;
        vertices.push([
          cx + radius * Math.sin(phi) * Math.cos(theta),
          cy + radius * Math.cos(phi),
          cz + radius * Math.sin(phi) * Math.sin(theta),
        ]);
      }
    }
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const p1 = i * (segments + 1) + j,
          p2 = p1 + 1,
          p3 = (i + 1) * (segments + 1) + j + 1,
          p4 = (i + 1) * (segments + 1) + j;
        faces.push([p1, p2, p3, p4]);
      }
    }
    return { type: "polyhedron", vertices, faces };
  },

  cylinder(radius = 1, height = 2, center = [0, 0, 0], segments = 16) {
    const vertices = [],
      faces = [];
    const [cx, cy, cz] = center,
      h2 = height / 2;
    vertices.push([cx, cy + h2, cz]);
    vertices.push([cx, cy - h2, cz]);
    const offset = 2;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      const x = cx + radius * Math.cos(theta),
        z = cz + radius * Math.sin(theta);
      vertices.push([x, cy + h2, z]);
      vertices.push([x, cy - h2, z]);
    }
    for (let i = 0; i < segments; i++) {
      const t1 = offset + i * 2,
        b1 = offset + i * 2 + 1,
        t2 = offset + (i + 1) * 2,
        b2 = offset + (i + 1) * 2 + 1;
      faces.push([t1, b1, b2, t2]);
      faces.push([0, t1, t2]);
      faces.push([1, b2, b1]);
    }
    return { type: "polyhedron", vertices, faces };
  },

  cone(radius = 1, height = 2, center = [0, 0, 0], segments = 16) {
    const vertices = [],
      faces = [];
    const [cx, cy, cz] = center,
      h2 = height / 2;
    vertices.push([cx, cy + h2, cz]);
    vertices.push([cx, cy - h2, cz]);
    const offset = 2;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      vertices.push([
        cx + radius * Math.cos(theta),
        cy - h2,
        cz + radius * Math.sin(theta),
      ]);
    }
    for (let i = 0; i < segments; i++) {
      const b1 = offset + i,
        b2 = offset + i + 1;
      faces.push([0, b1, b2]);
      faces.push([1, b2, b1]);
    }
    return { type: "polyhedron", vertices, faces };
  },

  // ==========================================
  // 3. CORTES E PROJEÇÕES
  // ==========================================

  projectToPlane(obj, plane) {
    const [a, b, c, d] = plane.eq;
    const denom = a * a + b * b + c * c;
    const projPoint = (pt) => {
      const [x, y, z] = pt;
      const t = -(a * x + b * y + c * z + d) / denom;
      return [x + t * a, y + t * b, z + t * c];
    };
    if (obj.type === "point3D")
      return { type: "point3D", coords: projPoint(obj.coords) };
    if (obj.type === "vector3D") {
      const pO = projPoint(obj.origin),
        dest = projPoint([
          obj.origin[0] + obj.dir[0],
          obj.origin[1] + obj.dir[1],
          obj.origin[2] + obj.dir[2],
        ]);
      return {
        type: "vector3D",
        dir: [dest[0] - pO[0], dest[1] - pO[1], dest[2] - pO[2]],
        origin: pO,
      };
    }
    if (obj.type === "line3D") {
      const p0 = projPoint(obj.p0),
        p1 = projPoint([
          obj.p0[0] + obj.dir[0],
          obj.p0[1] + obj.dir[1],
          obj.p0[2] + obj.dir[2],
        ]);
      return {
        type: "line3D",
        p0: p0,
        dir: [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]],
      };
    }
    if (obj.type === "polyhedron")
      return { ...obj, vertices: obj.vertices.map((v) => projPoint(v)) };
    return obj;
  },

  intersectSurfacePlane(func, planeEq, range = [-5, 5], step = 0.2) {
    const [a, b, c, d] = planeEq,
      segments = [];
    const F = (x, z) => a * x + b * func(x, z) + c * z + d;
    for (let x = range[0]; x < range[1]; x += step) {
      for (let z = range[0]; z < range[1]; z += step) {
        const p1 = [x, z],
          p2 = [x + step, z],
          p3 = [x + step, z + step],
          p4 = [x, z + step];
        const v1 = F(...p1),
          v2 = F(...p2),
          v3 = F(...p3),
          v4 = F(...p4),
          pts = [];
        const addIntersection = (valA, valB, ptA, ptB) => {
          if (valA * valB <= 0 && valA !== valB) {
            const t = valA / (valA - valB),
              ix = ptA[0] + t * (ptB[0] - ptA[0]),
              iz = ptA[1] + t * (ptB[1] - ptA[1]);
            pts.push([ix, func(ix, iz), iz]);
          }
        };
        addIntersection(v1, v2, p1, p2);
        addIntersection(v2, v3, p2, p3);
        addIntersection(v3, v4, p3, p4);
        addIntersection(v4, v1, p4, p1);
        if (pts.length >= 2) segments.push([pts[0], pts[1]]);
      }
    }
    return { type: "segments3D", segments };
  },

  intersectPolyhedronPlane(poly, plane) {
    const [a, b, c, d] = plane.eq;
    const dist = (v) => a * v[0] + b * v[1] + c * v[2] + d;
    const segments = [];
    poly.faces.forEach((face) => {
      const pts = [];
      for (let i = 0; i < face.length; i++) {
        const p1 = poly.vertices[face[i]],
          p2 = poly.vertices[face[(i + 1) % face.length]];
        const d1 = dist(p1),
          d2 = dist(p2);
        if (Math.abs(d1) < 1e-7) pts.push(p1);
        else if (d1 * d2 < 0) {
          const t = d1 / (d1 - d2);
          pts.push([
            p1[0] + t * (p2[0] - p1[0]),
            p1[1] + t * (p2[1] - p1[1]),
            p1[2] + t * (p2[2] - p1[2]),
          ]);
        }
      }
      if (pts.length >= 2) segments.push([pts[0], pts[1]]);
    });
    return { type: "segments3D", segments };
  },

  // ==========================================
  // 4. ÁLGEBRA LINEAR E MATRIZES
  // ==========================================

  matrix(data) {
    if (!Array.isArray(data) || data.length === 0 || !Array.isArray(data[0])) {
      const errorMsg = "Formato inválido. A matriz deve ser um array 2D, ex: [[1, 2], [3, 4]]";
      console.error(errorMsg, 'Argumento recebido:', data);
      throw new Error(errorMsg);
    }
    return {
      type: "matrix",
      data: data,
      rows: data.length,
      cols: data[0].length,
    };
  },

  matrixAdd(m1, m2) {
    if (m1.rows !== m2.rows || m1.cols !== m2.cols)
      throw new Error("Dimensões incompatíveis para adição.");
    return PlotterAPI.matrix(
      m1.data.map((row, i) => row.map((val, j) => val + m2.data[i][j])),
    );
  },

  matrixSub(m1, m2) {
    if (m1.rows !== m2.rows || m1.cols !== m2.cols)
      throw new Error("Dimensões incompatíveis para subtração.");
    return PlotterAPI.matrix(
      m1.data.map((row, i) => row.map((val, j) => val - m2.data[i][j])),
    );
  },

  matrixMult(m1, m2) {
    if (m1.cols !== m2.rows)
      throw new Error("Dimensões incompatíveis para multiplicação.");
    const result = Array(m1.rows)
      .fill(0)
      .map(() => Array(m2.cols).fill(0));
    for (let i = 0; i < m1.rows; i++) {
      for (let j = 0; j < m2.cols; j++) {
        for (let k = 0; k < m1.cols; k++) {
          result[i][j] += m1.data[i][k] * m2.data[k][j];
        }
      }
    }
    return PlotterAPI.matrix(result);
  },

  matrixTranspose(m) {
    const result = Array(m.cols)
      .fill(0)
      .map(() => Array(m.rows).fill(0));
    for (let i = 0; i < m.rows; i++) {
      for (let j = 0; j < m.cols; j++) result[j][i] = m.data[i][j];
    }
    return PlotterAPI.matrix(result);
  },

  matrixDet(m) {
    if (m.rows !== m.cols) throw new Error("A matriz deve ser quadrada.");
    const calcDet = (mat) => {
      if (mat.length === 1) return mat[0][0];
      if (mat.length === 2)
        return mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];
      let det = 0;
      for (let i = 0; i < mat.length; i++) {
        const minor = mat.slice(1).map((row) => row.filter((_, j) => j !== i));
        det += (i % 2 === 0 ? 1 : -1) * mat[0][i] * calcDet(minor);
      }
      return det;
    };
    return calcDet(m.data);
  },

  matrixInverse(m) {
    const det = PlotterAPI.matrixDet(m);
    if (Math.abs(det) < 1e-10)
      throw new Error("Matriz singular. Não possui inversa.");
    const n = m.rows;
    if (n === 1) return PlotterAPI.matrix([[1 / m.data[0][0]]]);
    const adjugate = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const minorData = m.data
          .filter((_, r) => r !== i)
          .map((row) => row.filter((_, c) => c !== j));
        adjugate[j][i] =
          (((i + j) % 2 === 0 ? 1 : -1) *
            PlotterAPI.matrixDet(PlotterAPI.matrix(minorData))) /
          det;
      }
    }
    return PlotterAPI.matrix(adjugate);
  },

  // ==========================================
  // 5. CÁLCULO NUMÉRICO E CAMPOS VETORIAIS
  // ==========================================

  vectorField3D(fX, fY, fZ, range = [-5, 5], step = 2) {
    const vectors = [];
    for (let x = range[0]; x <= range[1]; x += step) {
      for (let y = range[0]; y <= range[1]; y += step) {
        for (let z = range[0]; z <= range[1]; z += step) {
          try {
            const dx = fX(x, y, z),
              dy = fY(x, y, z),
              dz = fZ(x, y, z);
            if (isFinite(dx) && isFinite(dy) && isFinite(dz))
              vectors.push(PlotterAPI.vector3D(dx, dy, dz, x, y, z));
          } catch (e) {}
        }
      }
    }
    return vectors;
  },

  vectorField2D(fX, fY, rangeX = [-10, 10], rangeY = [-10, 10], step = 1) {
    const vectors = [];
    for (let x = rangeX[0]; x <= rangeX[1]; x += step) {
      for (let y = rangeY[0]; y <= rangeY[1]; y += step) {
        try {
          const dx = fX(x, y),
            dy = fY(x, y);
          if (isFinite(dx) && isFinite(dy)) {
            const v = PlotterAPI.vector(2, [dx, dy]);
            v.origin = { x, y };
            vectors.push(v);
          }
        } catch (e) {}
      }
    }
    return vectors;
  },

  conic2D(A, B, C, D, E, F) {
    return [
      (x) => {
        const a = C,
          b = B * x + E,
          c = A * x * x + D * x + F;
        if (Math.abs(a) < 1e-7) return -c / b;
        const delta = b * b - 4 * a * c;
        return delta >= 0 ? (-b + Math.sqrt(delta)) / (2 * a) : NaN;
      },
      (x) => {
        const a = C,
          b = B * x + E,
          c = A * x * x + D * x + F;
        if (Math.abs(a) < 1e-7) return NaN;
        const delta = b * b - 4 * a * c;
        return delta >= 0 ? (-b - Math.sqrt(delta)) / (2 * a) : NaN;
      },
    ];
  },

  interpolationGN(points) {
    const n = points.length;
    if (n < 2) return (x) => points[0]?.y || 0;
    const h = points[1].x - points[0].x,
      y = points.map((p) => p.y),
      diffs = [y];
    for (let j = 1; j < n; j++) {
      const col = [];
      for (let i = 0; i < n - j; i++)
        col.push(diffs[j - 1][i + 1] - diffs[j - 1][i]);
      diffs.push(col);
    }
    const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
    return (x) => {
      const u = (x - points[0].x) / h;
      let result = points[0].y,
        uProd = 1;
      for (let i = 1; i < n; i++) {
        uProd *= u - (i - 1);
        result += (uProd * diffs[i][0]) / fact(i);
      }
      return result;
    };
  },

  pointList(func, interval = [-10, 10], step = 1) {
    const list = [];
    for (let x = interval[0]; x <= interval[1]; x += step)
      list.push({ x, y: func(x) });
    return list;
  },

  derivative(func, h = 0.001) {
    return (x) => (func(x + h) - func(x - h)) / (2 * h);
  },

  integral(func, precision = 0.05) {
    return (x) => {
      let area = 0;
      const steps = Math.abs(x) / precision,
        sign = Math.sign(x);
      for (let i = 0; i < steps; i++) {
        const t = i * precision * sign;
        area += (func(t) + func(t + precision * sign)) * 0.5 * precision * sign;
      }
      return area;
    };
  },

  // ==========================================
  // 6. MOTORES DE RENDERIZAÇÃO
  // ==========================================

  _drawAxisMarks(ctx, toPxX, toPxY, xMin, xMax, yMin, yMax, zeroX, zeroY) {
    ctx.fillStyle = "#64748b";
    ctx.strokeStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.lineWidth = 1;
    const xStep = (xMax - xMin) / 10;
    for (let i = 0; i <= 10; i++) {
      const val = xMin + i * xStep,
        px = toPxX(val);
      ctx.beginPath();
      ctx.moveTo(px, zeroY - 4);
      ctx.lineTo(px, zeroY + 4);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillText(val.toFixed(1), px, zeroY + 15);
    }
    const yStep = (yMax - yMin) / 10;
    for (let i = 0; i <= 10; i++) {
      const val = yMin + i * yStep,
        py = toPxY(val);
      ctx.beginPath();
      ctx.moveTo(zeroX - 4, py);
      ctx.lineTo(zeroX + 4, py);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText(val.toFixed(1), zeroX - 8, py + 3);
    }
  },

  multiLineGraph2D(datasets, interval = [-10, 10], options = {}) {
    const {
      width = 600,
      height = 400,
      mesh = true,
      showAxisMarks = true,
      padding = 45,
      pointHover = false,
    } = options;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const [xMin, xMax] = interval;

    let yMin = Infinity,
      yMax = -Infinity;
    const processedData = datasets.map((dataset) => {
      const step = dataset.step || options.step || 0.1,
        samples = [];
      if (dataset.func) {
        for (let x = xMin; x <= xMax; x += step) {
          const y = dataset.func(x);
          if (!isNaN(y) && isFinite(y)) {
            yMin = Math.min(yMin, y);
            yMax = Math.max(yMax, y);
            samples.push({ x, y });
          }
        }
      }
      if (dataset.points)
        dataset.points.forEach((p) => {
          yMin = Math.min(yMin, p.y);
          yMax = Math.max(yMax, p.y);
        });
      return { ...dataset, samples };
    });

    const yRange = yMax - yMin;
    const adjYMin = yMin - (yRange * 0.1 || 1),
      adjYMax = yMax + (yRange * 0.1 || 1);
    const toPxX = (x) =>
      padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
    const toPxY = (y) =>
      height -
      padding -
      ((y - adjYMin) / (adjYMax - adjYMin)) * (height - 2 * padding);

    const render = (hoverPoint = null) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      if (mesh) {
        ctx.strokeStyle = "#f1f5f9";
        for (let i = 0; i <= 10; i++) {
          const vx = xMin + i * ((xMax - xMin) / 10);
          ctx.beginPath();
          ctx.moveTo(toPxX(vx), padding);
          ctx.lineTo(toPxX(vx), height - padding);
          ctx.stroke();
          const vy = adjYMin + i * ((adjYMax - adjYMin) / 10);
          ctx.beginPath();
          ctx.moveTo(padding, toPxY(vy));
          ctx.lineTo(width - padding, toPxY(vy));
          ctx.stroke();
        }
      }
      const zY = Math.max(padding, Math.min(height - padding, toPxY(0))),
        zX = Math.max(padding, Math.min(width - padding, toPxX(0)));
      ctx.strokeStyle = "#64748b";
      ctx.beginPath();
      ctx.moveTo(padding, zY);
      ctx.lineTo(width - padding, zY);
      ctx.moveTo(zX, padding);
      ctx.lineTo(zX, height - padding);
      ctx.stroke();
      if (showAxisMarks)
        PlotterAPI._drawAxisMarks(
          ctx,
          toPxX,
          toPxY,
          xMin,
          xMax,
          adjYMin,
          adjYMax,
          zX,
          zY,
        );

      processedData.forEach((data) => {
        const color = data.color || "#3b82f6";
        if (data.samples.length > 0) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          data.samples.forEach((p, i) =>
            i === 0
              ? ctx.moveTo(toPxX(p.x), toPxY(p.y))
              : ctx.lineTo(toPxX(p.x), toPxY(p.y)),
          );
          ctx.stroke();
        }
        if (data.points) {
          data.points.forEach((p) => {
            ctx.fillStyle = data.pointColor || color;
            ctx.beginPath();
            ctx.arc(toPxX(p.x), toPxY(p.y), 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        }
      });

      if (hoverPoint) {
        const px = toPxX(hoverPoint.x),
          py = toPxY(hoverPoint.y);
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();
        const label = `(${hoverPoint.x.toFixed(2)}, ${hoverPoint.y.toFixed(2)})`;
        ctx.font = "bold 11px sans-serif";
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.roundRect(px + 10, py - 30, textWidth + 15, 25, 5);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.fillText(label, px + 17, py - 13);
      }
    };

    render();

    if (pointHover) {
      canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect(),
          mx = e.clientX - rect.left,
          my = e.clientY - rect.top;
        let found = null;
        const threshold = 8;
        for (const data of processedData) {
          if (data.points) {
            for (const p of data.points) {
              const px = toPxX(p.x),
                py = toPxY(p.y);
              if (Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < threshold) {
                found = p;
                break;
              }
            }
          }
          if (found) break;
        }
        canvas.style.cursor = found ? "crosshair" : "default";
        render(found);
      });
      canvas.addEventListener("mouseleave", () => render(null));
    }
    return canvas;
  },

  lineGraph2D(func, interval, options) {
    return PlotterAPI.multiLineGraph2D([{ func, ...options }], interval, options);
  },

  vectorialGraph2D(vectors, options = {}) {
    const {
      width = 600,
      height = 400,
      color = "#f97316",
      padding = 50,
    } = options;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const toPx = (v, isX) =>
      isX
        ? padding + ((v + 10) / 20) * (width - 2 * padding)
        : height - padding - ((v + 10) / 20) * (height - 2 * padding);

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    vectors.forEach((v) => {
      // Validação: garantir que o vetor tem a estructura esperada
      if (!v || !v.data || !Array.isArray(v.data) || v.data.length < 2) {
        console.warn('Vetor inválido ignorado:', v);
        return;
      }
      const start = v.origin || { x: 0, y: 0 },
        end = { x: start.x + v.data[0], y: start.y + v.data[1] };
      const x1 = toPx(start.x, true),
        y1 = toPx(start.y, false),
        x2 = toPx(end.x, true),
        y2 = toPx(end.y, false);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - 8 * Math.cos(angle - 0.5),
        y2 - 8 * Math.sin(angle - 0.5),
      );
      ctx.lineTo(
        x2 - 8 * Math.cos(angle + 0.5),
        y2 - 8 * Math.sin(angle + 0.5),
      );
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    });
    return canvas;
  },

  scene3D(objects, options = {}) {
    const {
      width = 600,
      height = 400,
      step = 0.5,
      scale = 25,
      interactive = true,
      range = [-5, 5],
      showAxes = true,
    } = options;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    let pitch = 0.6,
      yaw = 0.8;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);
      const project = (x, y, z) => {
        const rx = x * Math.cos(yaw) - z * Math.sin(yaw),
          rz = x * Math.sin(yaw) + z * Math.cos(yaw);
        const ry = y * Math.cos(pitch) - rz * Math.sin(pitch),
          pz = y * Math.sin(pitch) + rz * Math.cos(pitch);
        return { px: width / 2 + rx * scale, py: height / 2 - ry * scale, pz };
      };

      if (showAxes) {
        const origin = project(0, 0, 0),
          pX = project(range[1], 0, 0),
          pY = project(0, range[1], 0),
          pZ = project(0, 0, range[1]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(origin.px, origin.py);
        ctx.lineTo(pX.px, pX.py);
        ctx.stroke();
        ctx.strokeStyle = "#22c55e";
        ctx.beginPath();
        ctx.moveTo(origin.px, origin.py);
        ctx.lineTo(pY.px, pY.py);
        ctx.stroke();
        ctx.strokeStyle = "#3b82f6";
        ctx.beginPath();
        ctx.moveTo(origin.px, origin.py);
        ctx.lineTo(pZ.px, pZ.py);
        ctx.stroke();
      }

      ctx.lineJoin = "round";
      objects.forEach((obj) => {
        ctx.strokeStyle = obj.color || "#e2e8f0";
        ctx.fillStyle = obj.color || "#e2e8f0";
        ctx.lineWidth = obj.lineWidth || 2;

        if (obj.type === "point3D") {
          const { px, py } = project(...obj.coords);
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === "vector3D") {
          const o = obj.origin,
            end = [o[0] + obj.dir[0], o[1] + obj.dir[1], o[2] + obj.dir[2]];
          const p1 = project(...o),
            p2 = project(...end);
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
          const angle = Math.atan2(p2.py - p1.py, p2.px - p1.px);
          ctx.beginPath();
          ctx.moveTo(p2.px, p2.py);
          ctx.lineTo(
            p2.px - 10 * Math.cos(angle - 0.5),
            p2.py - 10 * Math.sin(angle - 0.5),
          );
          ctx.lineTo(
            p2.px - 10 * Math.cos(angle + 0.5),
            p2.py - 10 * Math.sin(angle + 0.5),
          );
          ctx.closePath();
          ctx.fill();
        } else if (obj.type === "line3D") {
          const p0 = obj.p0,
            dir = obj.dir,
            ext1 = project(
              p0[0] - dir[0] * 50,
              p0[1] - dir[1] * 50,
              p0[2] - dir[2] * 50,
            ),
            ext2 = project(
              p0[0] + dir[0] * 50,
              p0[1] + dir[1] * 50,
              p0[2] + dir[2] * 50,
            );
          ctx.beginPath();
          ctx.moveTo(ext1.px, ext1.py);
          ctx.lineTo(ext2.px, ext2.py);
          ctx.stroke();
        } else if (obj.type === "plane3D") {
          const [a, b, c, d] = obj.eq;
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = 1;
          const drawPlaneGrid = (isCross) => {
            for (let u = range[0]; u <= range[1]; u += step) {
              ctx.beginPath();
              for (let v = range[0]; v <= range[1]; v += step) {
                let x, y, z;
                if (Math.abs(b) > 0.01) {
                  x = isCross ? v : u;
                  z = isCross ? u : v;
                  y = (-d - a * x - c * z) / b;
                } else if (Math.abs(c) > 0.01) {
                  x = isCross ? v : u;
                  y = isCross ? u : v;
                  z = (-d - a * x - b * y) / c;
                } else {
                  y = isCross ? v : u;
                  z = isCross ? u : v;
                  x = (-d - b * y - c * z) / a;
                }
                const { px, py } = project(x, y, z);
                if (v === range[0]) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.stroke();
            }
          };
          drawPlaneGrid(false);
          drawPlaneGrid(true);
          ctx.globalAlpha = 1.0;
        } else if (obj.type === "surface") {
          ctx.lineWidth = 1;
          const drawSurfaceGrid = (isCross) => {
            for (let u = range[0]; u <= range[1]; u += step) {
              ctx.beginPath();
              for (let v = range[0]; v <= range[1]; v += step) {
                const x = isCross ? v : u;
                const z = isCross ? u : v;
                const { px, py } = project(x, obj.func(x, z), z);
                if (v === range[0]) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.stroke();
            }
          };
          drawSurfaceGrid(false);
          drawSurfaceGrid(true);
        } else if (obj.type === "segments3D") {
          ctx.beginPath();
          if (obj.dashed) ctx.setLineDash([5, 5]);
          obj.segments.forEach((seg) => {
            const p1 = project(...seg[0]),
              p2 = project(...seg[1]);
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (obj.type === "polyhedron") {
          const projVerts = obj.vertices.map((v) => project(...v));
          const facesToDraw = obj.faces.map((faceIndices) => {
            const pts = faceIndices.map((idx) => projVerts[idx]);
            const avgZ = pts.reduce((sum, p) => sum + p.pz, 0) / pts.length;
            return { pts, avgZ };
          });

          facesToDraw.sort((a, b) => b.avgZ - a.avgZ);
          facesToDraw.forEach((face) => {
            ctx.beginPath();
            face.pts.forEach((p, i) => {
              if (i === 0) ctx.moveTo(p.px, p.py);
              else ctx.lineTo(p.px, p.py);
            });
            ctx.closePath();
            ctx.fillStyle = obj.fillColor || "rgba(56, 189, 248, 0.2)";
            ctx.fill();
            if (obj.showMesh !== false) {
              ctx.strokeStyle = obj.color || "#38bdf8";
              ctx.lineWidth = obj.lineWidth || 0.5;
              ctx.stroke();
            }
          });
        }
      });
    };

    render();

    if (interactive) {
      let isDragging = false;
      let lastMouse = { x: 0, y: 0 };
      canvas.addEventListener("mousedown", (e) => {
        isDragging = true;
        lastMouse = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = "grabbing";
      });
      canvas.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        yaw += (e.clientX - lastMouse.x) * 0.01;
        pitch += (e.clientY - lastMouse.y) * 0.01;
        lastMouse = { x: e.clientX, y: e.clientY };
        render();
      });
      canvas.addEventListener("mouseup", () => {
        isDragging = false;
        canvas.style.cursor = "grab";
      });
      canvas.addEventListener("mouseleave", () => {
        isDragging = false;
        canvas.style.cursor = "default";
      });
      canvas.style.cursor = "grab";
    }

    return canvas;
  },

  graph3D(func, rangeX = [-5, 5], rangeZ = [-5, 5], options = {}) {
    return PlotterAPI.scene3D(
      [{ type: "surface", func, color: options.colorX || "#38bdf8" }],
      { ...options, range: rangeX },
    );
  },
};

// ==========================================
// VALIDAÇÃO E DEBUG
// ==========================================

/** Método de teste para validar se PlotterAPI está funcional */
PlotterAPI._testAll = function() {
  const tests = {
    '✓ point3D': () => PlotterAPI.point3D(1, 2, 3),
    '✓ vector3D': () => PlotterAPI.vector3D(1, 2, 3),
    '✓ line3D': () => PlotterAPI.line3D([0,0,0], [1,1,1]),
    '✓ plane3D': () => PlotterAPI.plane3D(1, 2, 3, 4),
    '✓ vector': () => PlotterAPI.vector(2, [1, 2]),
    '✓ matrix': () => PlotterAPI.matrix([[1, 2], [3, 4]]),
    '✓ matrixAdd': () => { const m = PlotterAPI.matrix([[1, 2], [3, 4]]); return PlotterAPI.matrixAdd(m, m); },
    '✓ matrixSub': () => { const m = PlotterAPI.matrix([[1, 2], [3, 4]]); return PlotterAPI.matrixSub(m, m); },
    '✓ matrixMult': () => { const m = PlotterAPI.matrix([[1, 2], [3, 4]]); return PlotterAPI.matrixMult(m, m); },
    '✓ matrixTranspose': () => { const m = PlotterAPI.matrix([[1, 2], [3, 4]]); return PlotterAPI.matrixTranspose(m); },
    '✓ matrixDet': () => { const m = PlotterAPI.matrix([[1, 2], [3, 4]]); return PlotterAPI.matrixDet(m); },
    '✓ cube': () => PlotterAPI.cube(2),
    '✓ sphere': () => PlotterAPI.sphere(1),
    '✓ cylinder': () => PlotterAPI.cylinder(1, 2),
    '✓ cone': () => PlotterAPI.cone(1, 2),
    '✓ polyhedron': () => PlotterAPI.polyhedron([[0,0,0]], [[0]]),
    '✓ pointList': () => PlotterAPI.pointList(x => x*x, [-5, 5], 0.5),
    '✓ derivative': () => PlotterAPI.derivative(x => x*x)(2),
    '✓ integral': () => PlotterAPI.integral(x => x*x)(2),
    '✓ conic2D': () => PlotterAPI.conic2D(1, 0, 1, 0, 0, -1),
    '✓ interpolationGN': () => PlotterAPI.interpolationGN([{x:0, y:0}, {x:1, y:1}]),
  };
  
  const results = {};
  let pass = 0, fail = 0;
  
  for (const [name, fn] of Object.entries(tests)) {
    try {
      fn();
      results[name] = '✓';
      pass++;
    } catch (err) {
      results[name] = `✗ ${err.message}`;
      fail++;
    }
  }
  
  console.group('PlotterAPI Validation Tests');
  for (const [name, result] of Object.entries(results)) {
    console.log(result === '✓' ? `%c${name}` : `%c${name} ${result}`, result === '✓' ? 'color: green; font-weight: bold' : 'color: red;');
  }
  console.log(`\nResultado: ${pass}/${pass + fail} testes passaram`);
  console.groupEnd();
  
  return pass === pass + fail;
};

// ==========================================
// SUPORTE MÚLTIPLOS PADRÕES DE IMPORT/EXPORT
// ==========================================

// Export para ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlotterAPI;
  module.exports.default = PlotterAPI;
}

// Export para global (window)
if (typeof window !== 'undefined') {
  window.PlotterAPI = PlotterAPI;
}

// Export ES6 default
export default PlotterAPI;
