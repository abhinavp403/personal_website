"use client"

import { useEffect, useRef } from "react"

// Full-screen quad; all the drawing happens in the fragment shader
const VERTEX_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  #define TWO_PI 6.2831853072
  #define PI 3.14159265359

  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform vec3 tint;

  float random (in float x) {
      return fract(sin(x)*1e4);
  }
  float random (vec2 st) {
      return fract(sin(dot(st.xy,
                           vec2(12.9898,78.233)))*
          43758.5453123);
  }

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

    vec2 fMosaicScal = vec2(4.0, 2.0);
    vec2 vScreenSize = vec2(256,256);
    uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
    uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);

    float t = time*0.06+random(uv.x)*0.4;
    float lineWidth = 0.0008;

    vec3 color = vec3(0.0);
    for(int j = 0; j < 3; j++){
      for(int i=0; i < 5; i++){
        color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*1.0 - length(uv));
      }
    }

    // Lines stay near-white at their core and take the shared backdrop colour around it
    vec3 lines = vec3(color[2],color[1],color[0]);
    gl_FragColor = vec4(lines * mix(vec3(1.0), tint * 1.6, 0.85), 1.0);
  }
`

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

// Animated line shader behind the hero. Plain WebGL — no library download.
export function ShaderAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext("webgl")
    if (!canvas || !gl) return

    const vertex   = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    const program  = gl.createProgram()
    if (!vertex || !fragment || !program) return
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, "position")
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const timeUniform       = gl.getUniformLocation(program, "time")
    const resolutionUniform = gl.getUniformLocation(program, "resolution")
    const tintUniform       = gl.getUniformLocation(program, "tint")

    // The tint is the page's shared backdrop colour (--fp-color, stepped by
    // BackdropColorCycle). Its computed value is already mid-fade during a
    // transition, so sampling it per frame gives the cross-fade for free.
    const style = getComputedStyle(canvas)
    let tintKey = ""
    const readTint = () => {
      const value = style.getPropertyValue("--fp-color")
      if (value === tintKey) return false
      const rgb = value.match(/[\d.]+/g)
      if (!value.trim().startsWith("rgb") || !rgb || rgb.length < 3) return false
      tintKey = value
      gl.uniform3f(tintUniform, +rgb[0] / 255, +rgb[1] / 255, +rgb[2] / 255)
      return true
    }
    gl.uniform3f(tintUniform, 59 / 255, 130 / 255, 246 / 255)

    // People who ask for reduced motion get one still frame instead of the loop
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let time    = 1.0
    let frame   = 0
    let visible = true

    const draw = () => {
      readTint()
      gl.uniform1f(timeUniform, time)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    const loop = () => {
      time += 0.05
      draw()
      frame = requestAnimationFrame(loop)
    }

    const start = () => { if (!still && visible && !frame) frame = requestAnimationFrame(loop) }
    const stop  = () => { if (frame) cancelAnimationFrame(frame); frame = 0 }

    // Follow the canvas's own box, so it refills when the layout changes without a window resize
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr  = window.devicePixelRatio || 1
      canvas.width  = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(resolutionUniform, canvas.width, canvas.height)
      draw()
    }
    const resized = new ResizeObserver(resize)
    resized.observe(canvas)

    // Stop drawing while the hero is scrolled off screen
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    seen.observe(canvas)

    resize()
    start()

    // The still frame never redraws on its own, so repaint it when the colour steps
    const stillTimer = still ? setInterval(() => { if (readTint()) draw() }, 1000) : undefined

    return () => {
      stop()
      if (stillTimer) clearInterval(stillTimer)
      resized.disconnect()
      seen.disconnect()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full" />
}
