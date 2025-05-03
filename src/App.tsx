import React, { useEffect, useRef } from 'react'
import ShinyText from './ShinyText/ShinyText'
import Noise from './Noise/Noise'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePosition = useRef({ x: 0, y: 0 })
  const particles = useRef<{ 
    x: number; 
    y: number; 
    vx: number; 
    vy: number; 
  }[]>([])
  const animationFrameId = useRef<number>()
  const isTouching = useRef(false)
  const isMobile = useRef(false)
  const [isDeviceMobile, setIsDeviceMobile] = React.useState(false)
  
  // Deteksi mobile di luar useEffect
  React.useEffect(() => {
    const checkMobile = () => {
      const mobileStatus = window.innerWidth <= 768
      isMobile.current = mobileStatus
      setIsDeviceMobile(mobileStatus)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      } else {
        canvas.width = (window.innerWidth - 48) * (isMobile.current ? 0.9 : 0.8)
        canvas.height = (window.innerHeight - 48) * (isMobile.current ? 0.9 : 0.8) 
      }
    }

    const createParticles = () => {
      particles.current = []
      // Tingkatkan jumlah partikel untuk desktop dan iPad
      const screenWidth = window.innerWidth
      let numParticles = 35 // Default untuk mobile
      
      if (screenWidth > 1200) {
        // Large desktop
        numParticles = 100
      } else if (screenWidth > 800) {
        // iPad dan desktop kecil
        numParticles = 80
      }
      
      const velocityMultiplier = window.innerWidth > 800 ? 4.2 : 3
      for (let i = 0; i < numParticles; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * velocityMultiplier,
          vy: (Math.random() - 0.5) * velocityMultiplier
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

      // Selalu isi latar belakang dengan warna hitam solid
      ctx.fillStyle = 'rgb(0, 0, 0)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Optimasi rendering untuk perangkat dengan banyak partikel
      // Pada desktop dengan banyak partikel, tidak perlu menggambar semua koneksi
      const skipFactor = window.innerWidth > 1200 ? 2 : 1 // Skip some connection calculations on large screens
      
      particles.current.forEach((particle, particleIndex) => {
        // Update particle position dengan kecepatan berbeda berdasarkan ukuran layar
        const speedMultiplier = window.innerWidth > 800 ? 1.8 : 1.2
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
        // Gunakan skipFactor untuk mengurangi jumlah koneksi yang digambar
        particles.current.forEach((otherParticle, otherIndex) => {
          // Skip beberapa kalkulasi koneksi untuk performa lebih baik pada layar besar
          if (skipFactor > 1 && (particleIndex % skipFactor !== 0 && otherIndex % skipFactor !== 0)) {
            return;
          }
          
          const particleDistance = Math.sqrt(
            Math.pow(particle.x - otherParticle.x, 2) + 
            Math.pow(particle.y - otherParticle.y, 2)
          )

          // Adjust connection distance based on device and screen size
          let connectionDistance = 130
          
          if (window.innerWidth > 1200) {
            // Large desktop - kurangi jarak koneksi untuk menghindari terlalu banyak garis
            connectionDistance = 120
          } else if (window.innerWidth > 800) {
            // iPad dan desktop kecil
            connectionDistance = 140
          }
          
          if (particleDistance < connectionDistance) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            // Make lines thinner on desktop for sharper appearance
            ctx.lineWidth = window.innerWidth > 800 ? 0.6 : 1
            
            // Sesuaikan opacity berdasarkan jarak dan ukuran layar
            const opacityFactor = window.innerWidth > 1200 ? 0.85 : 1
            ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - particleDistance / connectionDistance) * opacityFactor})`
            ctx.stroke()
          }
        })

        // Magnetic effect towards mouse - sama untuk semua device
        const magnetDistance = 220;
        if (distance < magnetDistance) {
          const force = (magnetDistance - distance) / magnetDistance;
          const magnetStrength = window.innerWidth > 800 ? 0.45 : 0.35;
          particle.vx += (dx / distance) * force * magnetStrength;
          particle.vy += (dy / distance) * force * magnetStrength;
        }

        // Limit velocity - sesuaikan dengan ukuran layar
        const maxSpeed = window.innerWidth > 800 ? 4 : 5
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
        if (speed > maxSpeed) {
          particle.vx = (particle.vx / speed) * maxSpeed
          particle.vy = (particle.vy / speed) * maxSpeed
        }

        // Draw particle with improved rendering for desktop
        ctx.beginPath()
        
        // Size adjustment based on device type
        const particleSize = window.innerWidth > 800 ? 2 : 2
        
        ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2)
        ctx.fillStyle = 'white'
        
        // Use sharper shadow for desktop
        if (window.innerWidth > 800) {
          ctx.shadowColor = 'rgba(255, 255, 255, 0.7)'
          ctx.shadowBlur = 3
        }
        
        ctx.fill()
        
        // Reset shadow to avoid affecting other elements
        if (window.innerWidth > 800) {
          ctx.shadowBlur = 0
        }
      })

      animationFrameId.current = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = {
        x: e.clientX,
        y: e.clientY
      }
      
      // Efek langsung untuk semua device
      const x = e.clientX
      const y = e.clientY
      
      particles.current.forEach(particle => {
        const dx = x - particle.x - 24
        const dy = y - particle.y - 24
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 120) {
          const force = (120 - distance) / 120
          const forceMultiplier = window.innerWidth > 800 ? 0.7 : 0.5
          particle.vx += (dx / distance) * force * forceMultiplier
          particle.vy += (dy / distance) * force * forceMultiplier
        }
      })
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
        
        // Efek yang sama seperti mouse move
        const x = touch.clientX
        const y = touch.clientY
        
        particles.current.forEach(particle => {
          const dx = x - particle.x - 24
          const dy = y - particle.y - 24
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 120) {
            const force = (120 - distance) / 120
            const forceMultiplier = window.innerWidth > 800 ? 0.7 : 0.5
            particle.vx += (dx / distance) * force * forceMultiplier
            particle.vy += (dy / distance) * force * forceMultiplier
          }
        })
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        // Langsung update posisi
        const touch = e.touches[0]
        mousePosition.current = {
          x: touch.clientX,
          y: touch.clientY
        }
        
        // Efek yang sama seperti mouse move
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
            const forceMultiplier = window.innerWidth > 800 ? 0.7 : 0.5
            particle.vx += (dx / distance) * force * forceMultiplier
            particle.vy += (dy / distance) * force * forceMultiplier
          }
        })
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
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Noise effect as background */}
      <Noise 
        patternSize={200}
        patternAlpha={20}
        patternRefreshInterval={4}
      />
      
      {/* Canvas container */}
      <div className="relative w-[90%] h-[90vh] sm:w-[80%] sm:h-[80vh] top-2 m-2 sm:m-2 rounded-xl overflow-hidden border border-white/20 z-10">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-none bg-black"
        />
      </div>
      
      {/* Title - increased z-index to make it appear above canvas */}
      <div className="absolute top-1 left-4 sm:top-8 sm:left-8 text-2xl sm:text-4xl font-bold z-30">
        <div className="px-2 py-1 rounded-md ">
          <ShinyText 
            text="Magnet Particles" 
            speed={3} 
            className="text-2xl sm:text-4xl font-bold"
          />
        </div>
      </div>
      
      {/* Instructions text */}
      <div className="text-center mt-2 z-10">
        <p className="text-white/40 text-sm sm:text-base px-2 py-1 inline-block ">
          {isDeviceMobile 
            ? "tap and move the screen to move the particles" 
            : "move the cursor to move the particles"}
        </p>
      </div>
    </div>
  )
}

export default App