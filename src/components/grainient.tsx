"use client"

import { useEffect, useRef } from "react"

interface GrainientProps {
  color1?: string
  color2?: string
  color3?: string
  timeSpeed?: number
  colorBalance?: number
  warpStrength?: number
  warpFrequency?: number
  warpSpeed?: number
  warpAmplitude?: number
  blendAngle?: number
  blendSoftness?: number
  rotationAmount?: number
  noiseScale?: number
  grainAmount?: number
  grainScale?: number
  grainAnimated?: boolean
  contrast?: number
  gamma?: number
  saturation?: number
  centerX?: number
  centerY?: number
  zoom?: number
  className?: string
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ]
}

const VERT = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`

const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec3  u_c1, u_c2, u_c3;
uniform float u_warpStrength, u_warpFreq, u_warpSpeed, u_warpAmp;
uniform float u_blendAngle, u_blendSoft;
uniform float u_rotation;
uniform float u_noiseScale;
uniform float u_grainAmt, u_grainScale;
uniform bool  u_grainAnim;
uniform float u_contrast, u_gamma, u_saturation;
uniform float u_cx, u_cy, u_zoom;
uniform float u_colorBalance;

float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0; a *= 0.5;
  }
  return v;
}

vec3 adjustSat(vec3 c, float s) {
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(lum), c, s);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  uv = (uv - 0.5) / u_zoom + 0.5;
  uv += vec2(u_cx, u_cy);

  // rotate
  float rot = u_rotation * 0.001;
  float cr = cos(rot), sr = sin(rot);
  uv -= 0.5;
  uv = vec2(cr * uv.x - sr * uv.y, sr * uv.x + cr * uv.y);
  uv += 0.5;

  // warp
  float t = u_time * u_warpSpeed;
  vec2 warp = vec2(
    fbm(uv * u_warpFreq + vec2(t * 0.3, t * 0.1)) - 0.5,
    fbm(uv * u_warpFreq + vec2(t * 0.1, t * 0.4)) - 0.5
  ) * u_warpAmp * 0.01 * u_warpStrength;
  vec2 wuv = uv + warp;

  // blend axis
  float angle = u_blendAngle * 3.14159 / 180.0;
  float blend = dot(wuv - 0.5, vec2(cos(angle), sin(angle))) + 0.5;
  blend = smoothstep(u_blendSoft, 1.0 - u_blendSoft, blend + fbm(wuv * u_noiseScale + t * 0.05) * 0.4 - 0.2);

  float mid = 0.5 + u_colorBalance * 0.5;
  vec3 col;
  if (blend < mid) {
    col = mix(u_c1, u_c2, smoothstep(0.0, mid, blend));
  } else {
    col = mix(u_c2, u_c3, smoothstep(mid, 1.0, blend));
  }

  // grain
  vec2 gp = gl_FragCoord.xy / u_grainScale;
  if (u_grainAnim) gp += vec2(u_time * 100.0);
  float grain = (hash(gp) - 0.5) * u_grainAmt;
  col += grain;

  // contrast / gamma / saturation
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / u_gamma));
  col = (col - 0.5) * u_contrast + 0.5;
  col = adjustSat(col, u_saturation);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

export default function Grainient({
  color1 = "#F0B429",
  color2 = "#0D0806",
  color3 = "#5C2E00",
  timeSpeed = 0.25,
  colorBalance = 0,
  warpStrength = 1,
  warpFrequency = 5,
  warpSpeed = 2,
  warpAmplitude = 50,
  blendAngle = 0,
  blendSoftness = 0.05,
  rotationAmount = 500,
  noiseScale = 2,
  grainAmount = 0.1,
  grainScale = 2,
  grainAnimated = false,
  contrast = 1.5,
  gamma = 1,
  saturation = 1,
  centerX = 0,
  centerY = 0,
  zoom = 0.9,
  className = "",
}: GrainientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false })
    if (!gl) return

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!
      gl!.shaderSource(s, src)
      gl!.compileShader(s)
      return s
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "a_position")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = (n: string) => gl.getUniformLocation(prog, n)
    const [r1,g1,b1] = hexToRgb(color1)
    const [r2,g2,b2] = hexToRgb(color2)
    const [r3,g3,b3] = hexToRgb(color3)

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      gl!.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let start = performance.now()

    function draw() {
      const t = ((performance.now() - start) / 1000) * timeSpeed
      gl!.uniform2f(u("u_res"), canvas!.width, canvas!.height)
      gl!.uniform1f(u("u_time"), t)
      gl!.uniform3f(u("u_c1"), r1, g1, b1)
      gl!.uniform3f(u("u_c2"), r2, g2, b2)
      gl!.uniform3f(u("u_c3"), r3, g3, b3)
      gl!.uniform1f(u("u_warpStrength"), warpStrength)
      gl!.uniform1f(u("u_warpFreq"), warpFrequency)
      gl!.uniform1f(u("u_warpSpeed"), warpSpeed)
      gl!.uniform1f(u("u_warpAmp"), warpAmplitude)
      gl!.uniform1f(u("u_blendAngle"), blendAngle)
      gl!.uniform1f(u("u_blendSoft"), blendSoftness)
      gl!.uniform1f(u("u_rotation"), rotationAmount)
      gl!.uniform1f(u("u_noiseScale"), noiseScale)
      gl!.uniform1f(u("u_grainAmt"), grainAmount)
      gl!.uniform1f(u("u_grainScale"), grainScale)
      gl!.uniform1i(u("u_grainAnim"), grainAnimated ? 1 : 0)
      gl!.uniform1f(u("u_contrast"), contrast)
      gl!.uniform1f(u("u_gamma"), gamma)
      gl!.uniform1f(u("u_saturation"), saturation)
      gl!.uniform1f(u("u_cx"), centerX)
      gl!.uniform1f(u("u_cy"), centerY)
      gl!.uniform1f(u("u_zoom"), zoom)
      gl!.uniform1f(u("u_colorBalance"), colorBalance)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      gl.deleteProgram(prog)
    }
  }, [color1, color2, color3, timeSpeed, colorBalance, warpStrength, warpFrequency,
      warpSpeed, warpAmplitude, blendAngle, blendSoftness, rotationAmount, noiseScale,
      grainAmount, grainScale, grainAnimated, contrast, gamma, saturation, centerX, centerY, zoom])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  )
}
