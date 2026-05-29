"use client"

import { useEffect, useRef } from "react"

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop { vec3 color; float position; };

#define COLOR_RAMP(colors, factor, finalColor) { \
  int index = 0; \
  for (int i = 0; i < 2; i++) { \
    ColorStop cc = colors[i]; \
    bool inBetween = cc.position <= factor; \
    index = int(mix(float(index), float(i), float(inBetween))); \
  } \
  ColorStop cur = colors[index]; ColorStop nxt = colors[index + 1]; \
  float range = nxt.position - cur.position; \
  float lf = (factor - cur.position) / range; \
  finalColor = mix(cur.color, nxt.color, lf); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`

interface AuroraProps {
  colorStops?: string[]
  amplitude?: number
  blend?: number
  speed?: number
  className?: string
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

export default function Aurora({
  colorStops = ["#0f766e", "#2dd4bf", "#0e7490"],
  amplitude = 1.0,
  blend = 0.5,
  speed = 1.0,
  className = "",
}: AuroraProps) {
  const ctnRef = useRef<HTMLDivElement>(null)
  const propsRef = useRef({ colorStops, amplitude, blend, speed })
  propsRef.current = { colorStops, amplitude, blend, speed }

  useEffect(() => {
    const ctn = ctnRef.current
    if (!ctn) return

    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: true })
    if (!gl) return

    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    canvas.style.position = "absolute"
    canvas.style.inset = "0"
    canvas.style.width = "100%"
    canvas.style.height = "100%"

    const resize = () => {
      canvas.width = ctn.offsetWidth
      canvas.height = ctn.offsetHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (program) {
        const loc = gl.getUniformLocation(program, "uResolution")
        gl.useProgram(program)
        gl.uniform2f(loc, canvas.width, canvas.height)
      }
    }

    const compileShader = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const vert = compileShader(gl.VERTEX_SHADER, VERT)
    const frag = compileShader(gl.FRAGMENT_SHADER, FRAG)
    let program = gl.createProgram()!
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    gl.useProgram(program)

    // Full-screen triangle
    const positions = new Float32Array([-1, -1, 3, -1, -1, 3])
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(program, "position")
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    resize()
    window.addEventListener("resize", resize)
    ctn.appendChild(canvas)

    let rafId = 0
    const update = (t: number) => {
      rafId = requestAnimationFrame(update)
      const { colorStops: cs, amplitude: amp, blend: bl, speed: sp } = propsRef.current

      gl.useProgram(program)
      gl.uniform1f(gl.getUniformLocation(program, "uTime"), (t * 0.001) * sp)
      gl.uniform1f(gl.getUniformLocation(program, "uAmplitude"), amp)
      gl.uniform1f(gl.getUniformLocation(program, "uBlend"), bl)
      gl.uniform2f(gl.getUniformLocation(program, "uResolution"), canvas.width, canvas.height)

      const stops = cs.map(hexToRgb).flat()
      gl.uniform3fv(gl.getUniformLocation(program, "uColorStops"), new Float32Array(stops))

      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    rafId = requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", resize)
      if (ctn.contains(canvas)) ctn.removeChild(canvas)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [])

  return (
    <div
      ref={ctnRef}
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    />
  )
}
