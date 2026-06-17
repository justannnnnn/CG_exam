const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");
if (!gl) alert("WebGL не поддерживается");

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener("resize", resize);
resize();

const VS = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vTexCoord;

void main()
{
    vec4 worldPos = uModel * vec4(aPosition,1.0);

    vWorldPos = worldPos.xyz;
    vNormal = mat3(uModel) * aNormal;
    vTexCoord = aTexCoord;

    gl_Position =
        uProjection *
        uView *
        worldPos;
}
`;

const FS = `
precision mediump float;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vTexCoord;

uniform sampler2D uTexture;

uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform bool uUseTexture;

void main()
{
    vec3 normal = normalize(vNormal);

    vec3 lightDir =
        normalize(uLightPos - vWorldPos);

    vec3 viewDir =
        normalize(uCameraPos - vWorldPos);

    vec3 reflectDir =
        reflect(-lightDir, normal);

    float ambient = 0.25;

    float diffuse =
        max(dot(normal, lightDir), 0.0);

    float specular =
        pow(
            max(dot(viewDir, reflectDir), 0.0),
            32.0
        );

    vec3 baseColor;

    if (uUseTexture)
    {
        baseColor =
            texture2D(uTexture, vTexCoord).rgb;
    }
    else
    {
        baseColor = vec3(0.25, 0.25, 0.25);
    }

    vec3 result =
        baseColor * (ambient + diffuse)
        + vec3(specular);

    gl_FragColor =
        vec4(result, 1.0);
}
`;

function createShader(type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh));
  }
  return sh;
}

function createProgram(vsSrc, fsSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, createShader(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(p, createShader(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p));
  }
  return p;
}

const program = createProgram(VS, FS);
gl.useProgram(program);

const crateTexture = gl.createTexture();

const image = new Image();

image.onload = function()
{
    gl.bindTexture(
        gl.TEXTURE_2D,
        crateTexture
    );

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
    );

    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
    );

    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        gl.LINEAR
    );
};

image.src = "crate.jpg";

const aPosition = gl.getAttribLocation(program, "aPosition");
const aNormal = gl.getAttribLocation(program, "aNormal");
const aTexCoord = gl.getAttribLocation(program, "aTexCoord");
const uModel = gl.getUniformLocation(program, "uModel");
const uView = gl.getUniformLocation(program, "uView");
const uProjection = gl.getUniformLocation(program, "uProjection");
const uLightPos = gl.getUniformLocation(program, "uLightPos");
const uCameraPos = gl.getUniformLocation(program, "uCameraPos");
const uTexture = gl.getUniformLocation(program, "uTexture");
const uUseTexture = gl.getUniformLocation(program, "uUseTexture");

function mat4Identity() {
  return new Float32Array([
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    0,0,0,1
  ]);
}

function mat4Multiply(a, b) {
  const out = new Float32Array(16);

  const a00=a[0], a01=a[1], a02=a[2], a03=a[3];
  const a10=a[4], a11=a[5], a12=a[6], a13=a[7];
  const a20=a[8], a21=a[9], a22=a[10], a23=a[11];
  const a30=a[12], a31=a[13], a32=a[14], a33=a[15];

  const b00=b[0], b01=b[1], b02=b[2], b03=b[3];
  const b10=b[4], b11=b[5], b12=b[6], b13=b[7];
  const b20=b[8], b21=b[9], b22=b[10], b23=b[11];
  const b30=b[12], b31=b[13], b32=b[14], b33=b[15];

  out[0]  = a00*b00 + a10*b01 + a20*b02 + a30*b03;
  out[1]  = a01*b00 + a11*b01 + a21*b02 + a31*b03;
  out[2]  = a02*b00 + a12*b01 + a22*b02 + a32*b03;
  out[3]  = a03*b00 + a13*b01 + a23*b02 + a33*b03;

  out[4]  = a00*b10 + a10*b11 + a20*b12 + a30*b13;
  out[5]  = a01*b10 + a11*b11 + a21*b12 + a31*b13;
  out[6]  = a02*b10 + a12*b11 + a22*b12 + a32*b13;
  out[7]  = a03*b10 + a13*b11 + a23*b12 + a33*b13;

  out[8]  = a00*b20 + a10*b21 + a20*b22 + a30*b23;
  out[9]  = a01*b20 + a11*b21 + a21*b22 + a31*b23;
  out[10] = a02*b20 + a12*b21 + a22*b22 + a32*b23;
  out[11] = a03*b20 + a13*b21 + a23*b22 + a33*b23;

  out[12] = a00*b30 + a10*b31 + a20*b32 + a30*b33;
  out[13] = a01*b30 + a11*b31 + a21*b32 + a31*b33;
  out[14] = a02*b30 + a12*b31 + a22*b32 + a32*b33;
  out[15] = a03*b30 + a13*b31 + a23*b32 + a33*b33;

  return out;
}

function mat4Translate(x, y, z) {
  const m = mat4Identity();
  m[12] = x; m[13] = y; m[14] = z;
  return m;
}

function mat4Scale(x, y, z) {
  const m = mat4Identity();
  m[0] = x; m[5] = y; m[10] = z;
  return m;
}

function mat4RotateX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  const m = mat4Identity();
  m[5] = c;  m[6] = s;
  m[9] = -s; m[10] = c;
  return m;
}

function mat4RotateY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  const m = mat4Identity();
  m[0] = c;  m[2] = -s;
  m[8] = s;  m[10] = c;
  return m;
}

function mat4RotateZ(a) {
  const c = Math.cos(a), s = Math.sin(a);
  const m = mat4Identity();
  m[0] = c;  m[1] = s;
  m[4] = -s; m[5] = c;
  return m;
}

function mat4Perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) * nf;
  m[11] = -1;
  m[14] = 2 * far * near * nf;
  return m;
}

function vec3Normalize(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function mat4LookAt(eye, center, up) {
  const z = vec3Normalize([
    eye[0] - center[0],
    eye[1] - center[1],
    eye[2] - center[2]
  ]);

  const x = vec3Normalize([
    up[1] * z[2] - up[2] * z[1],
    up[2] * z[0] - up[0] * z[2],
    up[0] * z[1] - up[1] * z[0]
  ]);

  const y = [
    z[1] * x[2] - z[2] * x[1],
    z[2] * x[0] - z[0] * x[2],
    z[0] * x[1] - z[1] * x[0]
  ];

  const m = mat4Identity();
  m[0] = x[0]; m[1] = y[0]; m[2]  = z[0];
  m[4] = x[1]; m[5] = y[1]; m[6]  = z[1];
  m[8] = x[2]; m[9] = y[2]; m[10] = z[2];
  m[12] = -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]);
  m[13] = -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]);
  m[14] = -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]);
  return m;
}

const cubeVertices = new Float32Array([

  // FRONT (+Z)

  -0.5,-0.5, 0.5,   0,0,1,   0,0,
   0.5,-0.5, 0.5,   0,0,1,   1,0,
   0.5, 0.5, 0.5,   0,0,1,   1,1,

  -0.5,-0.5, 0.5,   0,0,1,   0,0,
   0.5, 0.5, 0.5,   0,0,1,   1,1,
  -0.5, 0.5, 0.5,   0,0,1,   0,1,


  // BACK (-Z)

   0.5,-0.5,-0.5,   0,0,-1,  0,0,
  -0.5,-0.5,-0.5,   0,0,-1,  1,0,
  -0.5, 0.5,-0.5,   0,0,-1,  1,1,

   0.5,-0.5,-0.5,   0,0,-1,  0,0,
  -0.5, 0.5,-0.5,   0,0,-1,  1,1,
   0.5, 0.5,-0.5,   0,0,-1,  0,1,


  // LEFT (-X)

  -0.5,-0.5,-0.5,  -1,0,0,   0,0,
  -0.5,-0.5, 0.5,  -1,0,0,   1,0,
  -0.5, 0.5, 0.5,  -1,0,0,   1,1,

  -0.5,-0.5,-0.5,  -1,0,0,   0,0,
  -0.5, 0.5, 0.5,  -1,0,0,   1,1,
  -0.5, 0.5,-0.5,  -1,0,0,   0,1,


  // RIGHT (+X)

   0.5,-0.5, 0.5,   1,0,0,   0,0,
   0.5,-0.5,-0.5,   1,0,0,   1,0,
   0.5, 0.5,-0.5,   1,0,0,   1,1,

   0.5,-0.5, 0.5,   1,0,0,   0,0,
   0.5, 0.5,-0.5,   1,0,0,   1,1,
   0.5, 0.5, 0.5,   1,0,0,   0,1,


  // TOP (+Y)

  -0.5, 0.5, 0.5,   0,1,0,   0,0,
   0.5, 0.5, 0.5,   0,1,0,   1,0,
   0.5, 0.5,-0.5,   0,1,0,   1,1,

  -0.5, 0.5, 0.5,   0,1,0,   0,0,
   0.5, 0.5,-0.5,   0,1,0,   1,1,
  -0.5, 0.5,-0.5,   0,1,0,   0,1,


  // BOTTOM (-Y)

  -0.5,-0.5,-0.5,   0,-1,0,  0,0,
   0.5,-0.5,-0.5,   0,-1,0,  1,0,
   0.5,-0.5, 0.5,   0,-1,0,  1,1,

  -0.5,-0.5,-0.5,   0,-1,0,  0,0,
   0.5,-0.5, 0.5,   0,-1,0,  1,1,
  -0.5,-0.5, 0.5,   0,-1,0,  0,1

]);

function createShardVertices()
{
    const depth = 0.05;

    const points = [

        [-0.55,-0.45],
        [ 0.45,-0.50],
        [ 0.60,-0.10],
        [ 0.20, 0.55],
        [-0.40, 0.25]

    ];

    for(const p of points)
    {
        p[0] += (Math.random()-0.5)*0.35;
        p[1] += (Math.random()-0.5)*0.35;
    }

    const v = [];

    function pushVertex(x,y,z,nx,ny,nz,u,vv)
    {
        v.push(
            x,y,z,
            nx,ny,nz,
            u,vv
        );
    }

    function addTri(a,b,c,nx,ny,nz)
    {
        pushVertex(a[0],a[1],a[2],nx,ny,nz,0,0);
        pushVertex(b[0],b[1],b[2],nx,ny,nz,1,0);
        pushVertex(c[0],c[1],c[2],nx,ny,nz,0.5,1);
    }

    //
    // Передняя грань
    //

    const front = points.map(
        p => [p[0], p[1], depth]
    );

    addTri(front[0],front[1],front[2],0,0,1);
    addTri(front[0],front[2],front[3],0,0,1);
    addTri(front[0],front[3],front[4],0,0,1);

    //
    // Задняя грань
    //

    const back = points.map(
        p => [p[0], p[1], -depth]
    );

    addTri(back[2],back[1],back[0],0,0,-1);
    addTri(back[3],back[2],back[0],0,0,-1);
    addTri(back[4],back[3],back[0],0,0,-1);

    //
    // Боковые грани
    //

    for(let i=0;i<points.length;i++)
    {
        const next =
            (i+1)%points.length;

        const f1 = front[i];
        const f2 = front[next];

        const b1 = back[i];
        const b2 = back[next];

        const ex = f2[0]-f1[0];
        const ey = f2[1]-f1[1];

        let nx = ey;
        let ny = -ex;

        const len =
            Math.hypot(nx,ny);

        nx /= len;
        ny /= len;

        addTri(
            f1,
            f2,
            b2,
            nx,ny,0
        );

        addTri(
            f1,
            b2,
            b1,
            nx,ny,0
        );
    }

    return new Float32Array(v);
}

const cubeBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

const stride = 8 * Float32Array.BYTES_PER_ELEMENT;

// position
gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(
    aPosition,
    3,
    gl.FLOAT,
    false,
    stride,
    0
);

// normal
gl.enableVertexAttribArray(aNormal);
gl.vertexAttribPointer(
    aNormal,
    3,
    gl.FLOAT,
    false,
    stride,
    3 * Float32Array.BYTES_PER_ELEMENT
);

// uv
gl.enableVertexAttribArray(aTexCoord);
gl.vertexAttribPointer(
    aTexCoord,
    2,
    gl.FLOAT,
    false,
    stride,
    6 * Float32Array.BYTES_PER_ELEMENT
);

const cameraPos = [0, 1.8, 6];
const cameraTarget = [0, 1.0, 0];
const cameraUp = [0, 1, 0];
const lightPos = [3, 5, 4];

const floorY = -1.5;
const gravity = -9.8;

let broken = false;
let box = null;
let fragments = [];

function makeBox() {
  return {
    pos: [0, 0, 0],
    size: [2, 2, 2],
    rot: [0, 0, 0],
    color: [0.65, 0.42, 0.22],
    useTexture: true
  };
}

function makeFragment(pos, size) {
  return {
    pos: pos.slice(),
    size: size.slice(),
    rot: [0, 0, 0],
    vel: [
      (Math.random() - 0.5) * 4.0,
      Math.random() * 5.0 + 2.0,
      (Math.random() - 0.5) * 4.0
    ],
    rotVel: [
      (Math.random() - 0.5) * 6.0,
      (Math.random() - 0.5) * 6.0,
      (Math.random() - 0.5) * 6.0
    ],
    color: [
      0.45 + Math.random() * 0.25,
      0.25 + Math.random() * 0.20,
      0.10 + Math.random() * 0.10
    ],
    useTexture: true
  };
}

function makeCrate()
{
    return [
        // передняя стенка

        {
            pos:[0,0,1],
            size:[2,2,0.1],
            rot:[0,0,0],
            useTexture:true
        },

        // задняя

        {
            pos:[0,0,-1],
            size:[2,2,0.1],
            rot:[0,0,0],
            useTexture:true
        },

        // левая

        {
            pos:[-1,0,0],
            size:[0.1,2,2],
            rot:[0,0,0],
            useTexture:true
        },

        // правая

        {
            pos:[1,0,0],
            size:[0.1,2,2],
            rot:[0,0,0],
            useTexture:true
        },

        // дно

        {
            pos:[0,-1,0],
            size:[2,0.1,2],
            rot:[0,0,0],
            useTexture:true
        }
    ];
}

function resetScene() {
  broken = false;
  box = makeCrate();
  fragments = [];
}
resetScene();

function rayAABB(ro, rd, min, max) {
  let tmin = -Infinity, tmax = Infinity;

  for (let i = 0; i < 3; i++) {
    if (Math.abs(rd[i]) < 1e-6) {
      if (ro[i] < min[i] || ro[i] > max[i]) return false;
    } else {
      let t1 = (min[i] - ro[i]) / rd[i];
      let t2 = (max[i] - ro[i]) / rd[i];
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }

  return tmax > 0;
}

function destroyBox()
{
    if (broken) return;

    broken = true;

    fragments = [];

    for (let i = 0; i < 20; i++)
    {
        fragments.push(

            makeWoodFragment(
                [
                    (Math.random()-0.5)*2,
                    (Math.random()-0.5)*2,
                    (Math.random()-0.5)*2
                ],
                [2,2,0.1] // ← размер стенки
            )
        );
    }
}

function update(dt) {
  if (!broken) return;

  for (const p of fragments) {
    p.vel[1] += gravity * dt;

    p.pos[0] += p.vel[0] * dt;
    p.pos[1] += p.vel[1] * dt;
    p.pos[2] += p.vel[2] * dt;
    p.vel[0] *= 0.999;
    p.vel[1] *= 0.999;
    p.vel[2] *= 0.999;

    p.rot[0] += p.rotVel[0] * dt;
    p.rot[1] += p.rotVel[1] * dt;
    p.rot[2] += p.rotVel[2] * dt;
    p.rotVel[0] *= 0.998;
    p.rotVel[1] *= 0.998;
    p.rotVel[2] *= 0.998;

   const lowestY =
    getLowestPoint(p);

    if(lowestY < floorY)
    {
        const penetration =
            floorY - lowestY;

        p.pos[1] += penetration;

        p.vel[1] *= -0.25;

        p.vel[0] *= 0.96;
        p.vel[2] *= 0.96;

        p.rotVel[0] *= 0.95;
        p.rotVel[1] *= 0.95;
        p.rotVel[2] *= 0.95;
    }
    const linearSpeed =
    Math.hypot(
        p.vel[0],
        p.vel[1],
        p.vel[2]
    );

    const angularSpeed =
        Math.hypot(
            p.rotVel[0],
            p.rotVel[1],
            p.rotVel[2]
        );

    if(
        linearSpeed < 0.05 &&
        angularSpeed < 0.05 &&
        lowestY < floorY + 0.02
    )
    {
        p.vel[0] = 0;
        p.vel[1] = 0;
        p.vel[2] = 0;

        p.rotVel[0] = 0;
        p.rotVel[1] = 0;
        p.rotVel[2] = 0;
    }
  }
}

function drawObject(obj, isFragment) {
  let model = mat4Identity();

  model = mat4Multiply(model, mat4Translate(obj.pos[0], obj.pos[1], obj.pos[2]));
  model = mat4Multiply(model, mat4RotateZ(obj.rot[2]));
  model = mat4Multiply(model, mat4RotateY(obj.rot[1]));
  model = mat4Multiply(model, mat4RotateX(obj.rot[0]));
  model = mat4Multiply(model, mat4Scale(obj.size[0], obj.size[1], obj.size[2]));

  const proj =
    mat4Perspective(
        Math.PI / 3,
        canvas.width / canvas.height,
        0.1,
        100
    );

    const view =
        mat4LookAt(
            cameraPos,
            cameraTarget,
            cameraUp
        );

    gl.uniformMatrix4fv(
        uModel,
        false,
        model
    );

    gl.uniformMatrix4fv(
        uView,
        false,
        view
    );

    gl.uniformMatrix4fv(
        uProjection,
        false,
        proj
    );

    gl.uniform3fv(
        uLightPos,
        lightPos
    );

    gl.uniform3fv(
        uCameraPos,
        cameraPos
    );

    gl.activeTexture(gl.TEXTURE0);

    gl.bindTexture(
        gl.TEXTURE_2D,
        crateTexture
    );

    gl.uniform1i(
        uTexture,
        0
    );

    gl.uniform1i(
        uUseTexture,
        obj.useTexture ? 1 : 0
    );
    if(isFragment)
    {
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            obj.buffer
        );

        gl.vertexAttribPointer(
            aPosition,
            3,
            gl.FLOAT,
            false,
            stride,
            0
        );

        gl.vertexAttribPointer(
            aNormal,
            3,
            gl.FLOAT,
            false,
            stride,
            3 * Float32Array.BYTES_PER_ELEMENT
        );

        gl.vertexAttribPointer(
            aTexCoord,
            2,
            gl.FLOAT,
            false,
            stride,
            6 * Float32Array.BYTES_PER_ELEMENT
        );

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            obj.vertexCount
        );
    }
    else
    {
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            cubeBuffer
        );

        gl.vertexAttribPointer(
            aPosition,
            3,
            gl.FLOAT,
            false,
            stride,
            0
        );

        gl.vertexAttribPointer(
            aNormal,
            3,
            gl.FLOAT,
            false,
            stride,
            3 * Float32Array.BYTES_PER_ELEMENT
        );

        gl.vertexAttribPointer(
            aTexCoord,
            2,
            gl.FLOAT,
            false,
            stride,
            6 * Float32Array.BYTES_PER_ELEMENT
        );

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            36
        );
    }
}

function render() {
  gl.clearColor(0.12, 0.13, 0.16, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Пол
  const floor = {
    pos: [0, floorY - 0.8, 0],
    size: [20, 1, 20],
    rot: [0, 0, 0],
    color: [0.22, 0.24, 0.27],
    useTexture: false
  };
  drawObject(floor, false);

  // Целый объект или осколки
  if (!broken) {
    for (const board of box)
    {
        drawObject(board,false);
    }
  } else {
    for (const p of fragments) drawObject(p, true);
  }
}

function makeWoodFragment(pos, wallSize)
{
    const mesh = createShardVertices();

    const localVertices = [];

    for(let i=0;i<mesh.length;i+=8)
    {
        localVertices.push([
            mesh[i],
            mesh[i+1],
            mesh[i+2]
        ]);
    }

    const buffer = gl.createBuffer();

    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        buffer
    );

    gl.bufferData(
        gl.ARRAY_BUFFER,
        mesh,
        gl.STATIC_DRAW
    );

    return {

        pos: [
            pos[0] + (Math.random()-0.5)*0.1,
            pos[1] + (Math.random()-0.5)*0.1,
            pos[2] + (Math.random()-0.5)*0.1
        ],

        size: [
            wallSize[0] * (0.25 + Math.random()*0.4),
            wallSize[1] * (0.25 + Math.random()*0.4),
            1.0
        ],

        rot: [
            Math.random()*Math.PI,
            Math.random()*Math.PI,
            Math.random()*Math.PI
        ],

        vel: [
            (Math.random()-0.5)*6,
            3 + Math.random()*6,
            (Math.random()-0.5)*6
        ],

        rotVel: [
            (Math.random()-0.5)*10,
            (Math.random()-0.5)*10,
            (Math.random()-0.5)*10
        ],

        useTexture: true,

        buffer: buffer,

        vertexCount: mesh.length / 8,

        localVertices: localVertices
    };
}

function rotateVertex(v, rot)
{
    let x = v[0];
    let y = v[1];
    let z = v[2];

    // X

    let cy = Math.cos(rot[0]);
    let sy = Math.sin(rot[0]);

    let ny = y * cy - z * sy;
    let nz = y * sy + z * cy;

    y = ny;
    z = nz;

    // Y

    let cx = Math.cos(rot[1]);
    let sx = Math.sin(rot[1]);

    let nx = x * cx + z * sx;
    nz = -x * sx + z * cx;

    x = nx;
    z = nz;

    // Z

    let cz = Math.cos(rot[2]);
    let sz = Math.sin(rot[2]);

    nx = x * cz - y * sz;
    ny = x * sz + y * cz;

    return [nx, ny, z];
}

function getLowestPoint(fragment)
{
    let minY = Infinity;

    for(const v of fragment.localVertices)
    {
        const r =
            rotateVertex(
                [
                    v[0] * fragment.size[0],
                    v[1] * fragment.size[1],
                    v[2] * fragment.size[2]
                ],
                fragment.rot
            );

        const worldY =
            r[1] + fragment.pos[1];

        if(worldY < minY)
        {
            minY = worldY;
        }
    }

    return minY;
}

let lastTime = performance.now();

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  update(dt);
  render();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function shoot()
{
    if (broken) return;

    const forward = vec3Normalize([
        cameraTarget[0] - cameraPos[0],
        cameraTarget[1] - cameraPos[1],
        cameraTarget[2] - cameraPos[2]
    ]);

    // считаем общий AABB всех стенок
    let min = [ Infinity, Infinity, Infinity ];
    let max = [ -Infinity, -Infinity, -Infinity ];

    for (const part of box)
    {
        const bmin = [
            part.pos[0] - part.size[0] * 0.5,
            part.pos[1] - part.size[1] * 0.5,
            part.pos[2] - part.size[2] * 0.5
        ];

        const bmax = [
            part.pos[0] + part.size[0] * 0.5,
            part.pos[1] + part.size[1] * 0.5,
            part.pos[2] + part.size[2] * 0.5
        ];

        for (let i = 0; i < 3; i++)
        {
            min[i] = Math.min(min[i], bmin[i]);
            max[i] = Math.max(max[i], bmax[i]);
        }
    }

    if (rayAABB(cameraPos, forward, min, max))
    {
        destroyBox();
    }
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") shoot();
  if (e.code === "KeyR") resetScene();
});

window.addEventListener("mousedown", shoot);