/**
 * ============================================================================
 * PlotterAPI v2.0 - Motor Matemático, Geometria Analítica e Renderização
 * ============================================================================
 * Biblioteca 100% nativa em JavaScript (Canvas API) para análise numérica,
 * álgebra linear, geometria 2D/3D e renderização de poliedros.
 */
const PlotterAPI = {
  // ==========================================
  // 1. CONSTRUTORES DE GEOMETRIA ANALÍTICA 3D
  // ==========================================

  /**
   * Cria um ponto no espaço 3D.
   * @param {number} x - Coordenada X.
   * @param {number} y - Coordenada Y.
   * @param {number} z - Coordenada Z.
   * @returns {Object} Objeto do tipo 'point3D'.
   */
  point3D(x, y, z) {
    return { type: "point3D", coords: [x, y, z] };
  },

  /**
   * Cria um vetor direcional 3D, com origem opcional.
   * @param {number} dx - Componente X da direção.
   * @param {number} dy - Componente Y da direção.
   * @param {number} dz - Componente Z da direção.
   * @param {number} [originX=0] - Origem X do vetor.
   * @param {number} [originY=0] - Origem Y do vetor.
   * @param {number} [originZ=0] - Origem Z do vetor.
   * @returns {Object} Objeto do tipo 'vector3D'.
   */
  vector3D(dx, dy, dz, originX = 0, originY = 0, originZ = 0) {
    return {
      type: "vector3D",
      dir: [dx, dy, dz],
      origin: [originX, originY, originZ],
    };
  },

  /**
   * Cria um objeto vetor nativo da API
   */
  vector(dimension, coords) {
    return { type: "vector", dim: dimension, data: coords };
  },

  // ==========================================
  // CAMPOS VETORIAIS (GERADORES)
  // ==========================================

  /**
   * Gera um Campo Vetorial 3D a partir de funções de componentes (P, Q, R).
   * @param {Function} fX - Função para a componente X: f(x, y, z)
   * @param {Function} fY - Função para a componente Y: f(x, y, z)
   * @param {Function} fZ - Função para a componente Z: f(x, y, z)
   * @param {number[]} [range=[-5, 5]] - Intervalo cúbico de amostragem [min, max]
   * @param {number} [step=2] - Espaçamento entre os vetores gerados
   * @returns {Array} Array de objetos vector3D (pronto para ser passado ao scene3D)
   */
  vectorField3D(fX, fY, fZ, range = [-5, 5], step = 2) {
    const vectors = [];
    for (let x = range[0]; x <= range[1]; x += step) {
      for (let y = range[0]; y <= range[1]; y += step) {
        for (let z = range[0]; z <= range[1]; z += step) {
          try {
            const dx = fX(x, y, z);
            const dy = fY(x, y, z);
            const dz = fZ(x, y, z);

            // Apenas cria o vetor se as funções retornarem números reais (evita divisões por zero)
            if (isFinite(dx) && isFinite(dy) && isFinite(dz)) {
              vectors.push(this.vector3D(dx, dy, dz, x, y, z));
            }
          } catch (e) {
            // Ignora pontos de singularidade
          }
        }
      }
    }
    return vectors;
  },

  /**
   * Gera um Campo Vetorial 2D a partir de funções de componentes (P, Q).
   * @param {Function} fX - Função para a componente X: f(x, y)
   * @param {Function} fY - Função para a componente Y: f(x, y)
   * @param {number[]} [rangeX=[-10, 10]] - Intervalo de amostragem X [min, max]
   * @param {number[]} [rangeY=[-10, 10]] - Intervalo de amostragem Y [min, max]
   * @param {number} [step=1] - Espaçamento entre os vetores gerados
   * @returns {Array} Array de objetos vector (pronto para ser passado ao vectorialGraph2D)
   */
  vectorField2D(fX, fY, rangeX = [-10, 10], rangeY = [-10, 10], step = 1) {
    const vectors = [];
    for (let x = rangeX[0]; x <= rangeX[1]; x += step) {
      for (let y = rangeY[0]; y <= rangeY[1]; y += step) {
        try {
          const dx = fX(x, y);
          const dy = fY(x, y);

          if (isFinite(dx) && isFinite(dy)) {
            const v = this.vector(2, [dx, dy]);
            v.origin = { x, y }; // Define o ponto de aplicação da seta
            vectors.push(v);
          }
        } catch (e) {}
      }
    }
    return vectors;
  },

  /**
   * Renderiza a camada de vetores 2D.
   * O fundo é transparente para permitir a sobreposição (mix-blend-mode) com a malha 2D principal.
   */
  vectorialGraph2D(vectors, options = {}) {
    const {
      width = 600,
      height = 400,
      color = "#3b82f6",
      padding = 45,
    } = options;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // IMPORTANTE: Limpar com transparência em vez de fundo branco
    ctx.clearRect(0, 0, width, height);

    // Escala base (igual à do multiLineGraph2D)
    const toPxX = (v) => padding + ((v + 10) / 20) * (width - 2 * padding);
    const toPxY = (v) =>
      height - padding - ((v + 10) / 20) * (height - 2 * padding);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    vectors.forEach((v) => {
      const start = v.origin || { x: 0, y: 0 };
      const end = { x: start.x + v.data[0], y: start.y + v.data[1] };

      const x1 = toPxX(start.x);
      const y1 = toPxY(start.y);
      const x2 = toPxX(end.x);
      const y2 = toPxY(end.y);

      // Corpo do vetor (Reta)
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Ponta da seta (Arrowhead)
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

  /**
   * Cria uma reta 3D paramétrica.
   * @param {number[]} p0 - Ponto inicial [x, y, z].
   * @param {number[]} dir - Vetor diretor [dx, dy, dz].
   * @returns {Object} Objeto do tipo 'line3D'.
   */
  line3D(p0, dir) {
    return { type: "line3D", p0, dir };
  },

  /**
   * Cria um plano 3D a partir da equação geral: ax + by + cz + d = 0.
   * @param {number} a - Coeficiente A.
   * @param {number} b - Coeficiente B.
   * @param {number} c - Coeficiente C.
   * @param {number} d - Termo independente D.
   * @returns {Object} Objeto do tipo 'plane3D'.
   */
  plane3D(a, b, c, d) {
    return { type: "plane3D", eq: [a, b, c, d] };
  },

  // ==========================================
  // 2. CONSTRUTORES DE SÓLIDOS (POLIEDROS)
  // ==========================================

  /**
   * Cria um poliedro genérico a partir de vértices e faces.
   * @param {number[][]} vertices - Array de coordenadas [[x,y,z], ...].
   * @param {number[][]} faces - Array de índices ligando os vértices [[0,1,2], ...].
   * @returns {Object} Objeto do tipo 'polyhedron'.
   */
  polyhedron(vertices, faces) {
    return { type: "polyhedron", vertices, faces };
  },

  /**
   * Cria um cubo paramétrico.
   * @param {number} [size=2] - Tamanho da aresta.
   * @param {number[]} [center=[0,0,0]] - Centro do cubo [x,y,z].
   * @returns {Object} Objeto do tipo 'polyhedron'.
   */
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

  /**
   * Cria uma esfera poligonal.
   * @param {number} [radius=1] - Raio da esfera.
   * @param {number[]} [center=[0,0,0]] - Centro da esfera [x,y,z].
   * @param {number} [segments=16] - Resolução da malha.
   * @returns {Object} Objeto do tipo 'polyhedron'.
   */
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
          p2 = p1 + 1;
        const p3 = (i + 1) * (segments + 1) + j + 1,
          p4 = (i + 1) * (segments + 1) + j;
        faces.push([p1, p2, p3, p4]);
      }
    }
    return { type: "polyhedron", vertices, faces };
  },

  /**
   * Cria um cilindro sólido.
   * @param {number} [radius=1] - Raio da base.
   * @param {number} [height=2] - Altura do cilindro.
   * @param {number[]} [center=[0,0,0]] - Centro do cilindro [x,y,z].
   * @param {number} [segments=16] - Resolução da malha lateral.
   * @returns {Object} Objeto do tipo 'polyhedron'.
   */
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
        b1 = offset + i * 2 + 1;
      const t2 = offset + (i + 1) * 2,
        b2 = offset + (i + 1) * 2 + 1;
      faces.push([t1, b1, b2, t2]);
      faces.push([0, t1, t2]);
      faces.push([1, b2, b1]);
    }
    return { type: "polyhedron", vertices, faces };
  },

  /**
   * Cria um cone sólido.
   * @param {number} [radius=1] - Raio da base.
   * @param {number} [height=2] - Altura do cone.
   * @param {number[]} [center=[0,0,0]] - Centro do cone [x,y,z].
   * @param {number} [segments=16] - Resolução da malha.
   * @returns {Object} Objeto do tipo 'polyhedron'.
   */
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
  // 3. OPERAÇÕES AVANÇADAS 3D (CORTES E PROJEÇÕES)
  // ==========================================

  /**
   * Projeta ortogonalmente um objeto 3D num plano.
   * @param {Object} obj - Objeto GA a ser projetado (point, line, vector, polyhedron).
   * @param {Object} plane - Plano de destino (plane3D).
   * @returns {Object} Novo objeto GA esmagado no plano.
   */
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
    if (obj.type === "polyhedron") {
      return { ...obj, vertices: obj.vertices.map((v) => projPoint(v)) };
    }
    return obj;
  },

  /**
   * Interseção entre uma superfície f(x,z) e um plano.
   * @param {Function} func - Função da superfície y = f(x,z).
   * @param {number[]} planeEq - Equação do plano [a, b, c, d].
   * @param {number[]} [range=[-5,5]] - Limites de procura.
   * @param {number} [step=0.2] - Resolução da procura.
   * @returns {Object} Objeto do tipo 'segments3D' contendo a curva de corte.
   */
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

  /**
   * Interseção entre um poliedro (malha) e um plano.
   * @param {Object} poly - Objeto do tipo 'polyhedron'.
   * @param {Object} plane - Objeto do tipo 'plane3D'.
   * @returns {Object} Objeto do tipo 'segments3D' contendo as arestas cortadas.
   */
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
  // 4. MOTORES DE RENDERIZAÇÃO
  // ==========================================

  /**
   * Renderizador Unificado 3D. Desenha sólidos, superfícies e geometria num espaço tridimensional.
   * @param {Array<Object>} objects - Lista de objetos a renderizar.
   * @param {Object} options - Configurações (width, height, scale, interactive, showAxes).
   * @returns {HTMLCanvasElement} Elemento Canvas renderizado.
   */
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

          // Algoritmo do Pintor (Painter's Algorithm) para Oclusão
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

  // ==========================================
  // 5. CÁLCULO E ANÁLISE NUMÉRICA
  // ==========================================

  /**
   * Interpolação polinomial (Método Gregory-Newton).
   * @param {Array<{x:number, y:number}>} points - Pontos equidistantes.
   * @returns {Function} Função interpoladora f(x).
   */
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

  /** Derivada numérica (Diferença Central). */
  derivative(func, h = 0.001) {
    return (x) => (func(x + h) - func(x - h)) / (2 * h);
  },

  /** Integral numérica (Regra dos Trapézios Acumulada). */
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

  /**
   * Converte Equação Geral das Cônicas para 2 funções f(x).
   * Ax² + Bxy + Cy² + Dx + Ey + F = 0
   */
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

  // ==========================================
  // 6. ÁLGEBRA LINEAR E MATRIZES
  // ==========================================

  /**
   * Cria um objeto de matriz genérica a partir de um array bidimensional.
   * @param {number[][]} data - Array 2D contendo os valores da matriz (ex: [[1, 2], [3, 4]]).
   * @returns {Object} Objeto do tipo 'matrix' contendo os dados e as suas dimensões.
   */
  matrix(data) {
    if (!Array.isArray(data) || data.length === 0 || !Array.isArray(data[0])) {
      throw new Error(
        "Formato inválido. A matriz deve ser instanciada como um array 2D, ex: [[1, 2], [3, 4]]",
      );
    }
    return {
      type: "matrix",
      data: data,
      rows: data.length,
      cols: data[0].length,
    };
  },

  /**
   * Adiciona duas matrizes (A + B).
   * @param {Object} m1 - Primeira matriz.
   * @param {Object} m2 - Segunda matriz.
   * @returns {Object} Nova matriz resultante.
   */
  matrixAdd(m1, m2) {
    if (m1.rows !== m2.rows || m1.cols !== m2.cols) {
      throw new Error("Dimensões incompatíveis para adição de matrizes.");
    }
    const result = m1.data.map((row, i) =>
      row.map((val, j) => val + m2.data[i][j]),
    );
    return this.matrix(result);
  },

  /**
   * Subtrai duas matrizes (A - B).
   * @param {Object} m1 - Primeira matriz.
   * @param {Object} m2 - Segunda matriz.
   * @returns {Object} Nova matriz resultante.
   */
  matrixSub(m1, m2) {
    if (m1.rows !== m2.rows || m1.cols !== m2.cols) {
      throw new Error("Dimensões incompatíveis para subtração de matrizes.");
    }
    const result = m1.data.map((row, i) =>
      row.map((val, j) => val - m2.data[i][j]),
    );
    return this.matrix(result);
  },

  /**
   * Multiplica duas matrizes (A * B).
   * @param {Object} m1 - Matriz A (m x n).
   * @param {Object} m2 - Matriz B (n x p).
   * @returns {Object} Nova matriz resultante (m x p).
   */
  matrixMult(m1, m2) {
    if (m1.cols !== m2.rows) {
      throw new Error(
        "Dimensões incompatíveis para multiplicação. O número de colunas da 1ª deve igualar as linhas da 2ª.",
      );
    }
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
    return this.matrix(result);
  },

  /**
   * Calcula a Matriz Transposta (inverte linhas com colunas).
   * @param {Object} m - Matriz original.
   * @returns {Object} Nova matriz transposta.
   */
  matrixTranspose(m) {
    const result = Array(m.cols)
      .fill(0)
      .map(() => Array(m.rows).fill(0));
    for (let i = 0; i < m.rows; i++) {
      for (let j = 0; j < m.cols; j++) {
        result[j][i] = m.data[i][j];
      }
    }
    return this.matrix(result);
  },

  /**
   * Calcula o determinante de uma matriz quadrada (Teorema de Laplace).
   * @param {Object} m - Matriz quadrada.
   * @returns {number} Valor do determinante.
   */
  matrixDet(m) {
    if (m.rows !== m.cols) {
      throw new Error(
        "A matriz deve ser quadrada para calcular o determinante.",
      );
    }

    // Função auxiliar recursiva
    const calcDet = (mat) => {
      if (mat.length === 1) return mat[0][0];
      if (mat.length === 2)
        return mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];

      let det = 0;
      for (let i = 0; i < mat.length; i++) {
        // Obter a matriz menor (removendo a 1ª linha e a coluna i)
        const minor = mat.slice(1).map((row) => row.filter((_, j) => j !== i));
        const cofactor = (i % 2 === 0 ? 1 : -1) * mat[0][i] * calcDet(minor);
        det += cofactor;
      }
      return det;
    };

    return calcDet(m.data);
  },

  /**
   * Calcula a Matriz Inversa utilizando a Matriz Adjunta.
   * @param {Object} m - Matriz quadrada inversível.
   * @returns {Object} Matriz inversa.
   */
  matrixInverse(m) {
    const det = this.matrixDet(m);
    if (Math.abs(det) < 1e-10) {
      throw new Error(
        "Matriz singular (determinante nulo ou muito próximo a zero). Não possui inversa.",
      );
    }

    const n = m.rows;
    if (n === 1) return this.matrix([[1 / m.data[0][0]]]);

    const adjugate = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        // Encontrar a matriz menor excluindo a linha 'i' e a coluna 'j'
        const minorData = m.data
          .filter((_, rowIdx) => rowIdx !== i)
          .map((row) => row.filter((_, colIdx) => colIdx !== j));

        // A matriz adjunta é a transposta da matriz dos cofatores
        // Logo, colocamos o valor calculado na posição [j][i]
        const minorDet = this.matrixDet(this.matrix(minorData));
        adjugate[j][i] = (((i + j) % 2 === 0 ? 1 : -1) * minorDet) / det;
      }
    }

    return this.matrix(adjugate);
  },
};

export default PlotterAPI;
