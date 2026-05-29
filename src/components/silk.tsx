"use client"

import { useEffect, useRef } from "react"
import { Renderer, Program, Mesh, Triangle } from "ogl"

interface SilkProps {
  speed?: number
  scale?: number
  color?: string
  noiseIntensity?: number
  rotation?: number
  className?: string
}

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uColor;
  uniform float uSpeed;
  uniform float uScale;
  uniform float uNoiseIntensity;
  uniform float uRotation;

  varying vec2 vUv;

  const float e = 2.71828182845904523536;

  float noise(vec2 texCoord) {
    float G = e;
    vec2  r = (G * sin(G * texCoord));
    return fract(r.x * r.y * (1.0 + texCoord.x));
  }

  vec2 rotateUvs(vec2 uv, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    mat2  rot = mat2(c, -s, s, c);
    return rot * uv;
  }

  void main() {
    float rnd     = noise(gl_FragCoord.xy);
    vec2  uv      = rotateUvs(vUv * uScale, uRotation);
    vec2  tex     = uv * uScale;
    float tOffset = uSpeed * uTime;

    tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

    float pattern = 0.6 +
                    0.4 * sin(5.0 * (tex.x + tex.y +
                                     cos(3.0 * tex.x + 5.0 * tex.y) +
                                     0.02 * tOffset) +
                             sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

    vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
    col.a    = 1.0;
    gl_FragColor = col;
  }
`

export default function Silk({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
  className = "",
}: SilkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const renderer = new Renderer({ canvas, alpha: false, antialias: false, dpr })
    const gl = renderer.gl

    const getSize = () => {
      const p = canvas.parentElement
      return p
        ? { w: p.clientWidth || window.innerWidth, h: p.clientHeight || window.innerHeight }
        : { w: window.innerWidth, h: window.innerHeight }
    }

    const [r, g, b] = hexToVec3(color)

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime:           { value: 0 },
        uColor:          { value: [r, g, b] },
        uSpeed:          { value: speed },
        uScale:          { value: scale },
        uNoiseIntensity: { value: noiseIntensity },
        uRotation:       { value: rotation },
      },
    })

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })

    function resize() {
      const { w, h } = getSize()
      renderer.setSize(w, h)
    }

    resize()

    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    window.addEventListener("resize", resize)

    let animId: number
    function render(t: number) {
      animId = requestAnimationFrame(render)
      program.uniforms.uTime.value = t * 0.001
      renderer.render({ scene: mesh })
    }
    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      window.removeEventListener("resize", resize)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [color, speed, scale, noiseIntensity, rotation])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  )
}
