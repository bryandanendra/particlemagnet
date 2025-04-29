import React, { useEffect, useRef } from 'react'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePosition = useRef({ x: 0, y: 0 })
  const particles = useRef<{ x: number; y: number; vx: number; vy: number }[]>([])
  const animationFrameId = useRef<number>()
  const isTouching = useRef(false)
  const isMobile = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const checkMobile = () => {
      isMobile.current = window.innerWidth <= 768
    }

    const resizeCanvas = () => {
      checkMobile()
      canvas.width = (window.innerWidth - 48) * (isMobile.current ? 0.9 : 0.8)
      canvas.height = (window.innerHeight - 48) * (isMobile.current ? 0.9 : 0.8)
    }

    const createParticles = () => {
      particles.current = []
      const numParticles = isMobile.current ? 35 : 50
      for (let i = 0; i < numParticles; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * (isMobile.current ? 3 : 3.5),
          vy: (Math.random() - 0.5) * (isMobile.current ? 3 : 3.5)
        })
      }
    }

    // Menerapkan optimasi untuk perangkat mobile
    let lastFrameTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const animate = (timestamp = 0) => {
      if (!ctx || !canvas) return
      
      // Optimasi frame rate untuk performa lebih baik
      const elapsed = timestamp - lastFrameTime
      if (elapsed < frameInterval && !isMobile.current) {
        animationFrameId.current = requestAnimationFrame(animate)
        return
      }
      
      lastFrameTime = timestamp

      // Hapus latar belakang dengan tingkat transparansi yang sesuai
      ctx.fillStyle = isMobile.current ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.current.forEach(particle => {
        // Update particle position dengan kecepatan sesuai device
        const speedMultiplier = isMobile.current ? 1.2 : 1.5
        particle.x += particle.vx * speedMultiplier
        particle.y += particle.vy * speedMultiplier

        // Bounce off walls
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // Calculate distance to mouse
        const dx = mousePosition.current.x - particle.x - 24
        const dy = mousePosition.current.y - particle.y - 24
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Draw connections between particles
        particles.current.forEach(otherParticle => {
          const particleDistance = Math.sqrt(
            Math.pow(particle.x - otherParticle.x, 2) + 
            Math.pow(particle.y - otherParticle.y, 2)
          )

          const connectionDistance = isMobile.current ? 110 : 120
          if (particleDistance < connectionDistance) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - particleDistance / connectionDistance})`
            ctx.stroke()
          }
        })

        // Magnetic effect towards mouse - stronger on mobile for faster response
        const magnetDistance = isMobile.current ? 220 : 200;
        if (distance < magnetDistance) {
          const force = (magnetDistance - distance) / magnetDistance;
          const magnetStrength = isMobile.current ? 0.35 : 0.4;
          particle.vx += (dx / distance) * force * magnetStrength;
          particle.vy += (dy / distance) * force * magnetStrength;
        }

        // Limit velocity - higher on mobile for faster movement
        const maxSpeed = isMobile.current ? 5 : 6
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
        if (speed > maxSpeed) {
          particle.vx = (particle.vx / speed) * maxSpeed
          particle.vy = (particle.vy / speed) * maxSpeed
        }

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, isMobile.current ? 2 : 2.5, 0, Math.PI * 2)
        ctx.fillStyle = 'white'
        ctx.fill()
      })

      animationFrameId.current = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = {
        x: e.clientX,
        y: e.clientY
      }
      
      // Tambahkan efek langsung untuk desktop
      if (!isMobile.current) {
        const x = e.clientX
        const y = e.clientY
        
        particles.current.forEach(particle => {
          const dx = x - particle.x - 24
          const dy = y - particle.y - 24
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 150) {
            const force = (150 - distance) / 150
            particle.vx += (dx / distance) * force * 0.3
            particle.vy += (dy / distance) * force * 0.3
          }
        })
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      isTouching.current = true
      if (e.touches.length > 0) {
        const touch = e.touches[0]
        mousePosition.current = {
          x: touch.clientX,
          y: touch.clientY
        }
        
        // Efek yang sama seperti touchMove
        if (isMobile.current) {
          const x = touch.clientX
          const y = touch.clientY
          
          particles.current.forEach(particle => {
            const dx = x - particle.x - 24
            const dy = y - particle.y - 24
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < 120) {
              const force = (120 - distance) / 120
              particle.vx += (dx / distance) * force * 0.5
              particle.vy += (dy / distance) * force * 0.5
            }
          })
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        // Langsung update posisi tanpa delay pada mobile
        const touch = e.touches[0]
        mousePosition.current = {
          x: touch.clientX,
          y: touch.clientY
        }
        
        // Tambahkan percepatan ekstra ke partikel terdekat untuk efek magnet lebih cepat
        if (isMobile.current) {
          const x = touch.clientX
          const y = touch.clientY
          
          // Cari partikel yang paling dekat dengan touch
          particles.current.forEach(particle => {
            const dx = x - particle.x - 24
            const dy = y - particle.y - 24
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < 120) {
              // Berikan dorongan ekstra ke partikel terdekat
              const force = (120 - distance) / 120
              particle.vx += (dx / distance) * force * 0.5
              particle.vy += (dy / distance) * force * 0.5
            }
          })
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      isTouching.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: false })
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
    createParticles()
    animate()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center">
      <h1 className="absolute top-4 left-4 sm:top-8 sm:left-8 text-2xl sm:text-4xl text-white font-bold z-10">
        Magnet
      </h1>
      <div className="relative w-[calc(90%-(48px*0.9))] h-[calc(90vh-(48px*0.9))] sm:w-[calc(80%-(48px*0.8))] sm:h-[calc(80vh-(48px*0.8))] m-4 sm:m-6 rounded-xl overflow-hidden border border-white/20">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-none bg-black"
        />
      </div>
    </div>
  )
}

export default App