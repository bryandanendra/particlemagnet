import React, { useState, useEffect } from "react";
import LightningConnection from "./LightningConnection";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface LightningManagerProps {
  particles: Particle[];
  connectionDistance: number;
  lightningDuration?: number;
  lightningFrequency?: number;
}

interface LightningInstance {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  distance: number;
  maxDistance: number;
  createdAt: number;
}

const LightningManager: React.FC<LightningManagerProps> = ({
  particles,
  connectionDistance,
  lightningDuration = 300,
  lightningFrequency = 0.3, // 0-1, probability of lightning creation per frame per eligible connection
}) => {
  const [lightnings, setLightnings] = useState<LightningInstance[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  useEffect(() => {
    // Function to update and manage lightning effects
    const updateLightnings = () => {
      const now = Date.now();
      
      // Remove expired lightnings
      setLightnings((prev) => 
        prev.filter((l) => now - l.createdAt < lightningDuration)
      );
      
      // Throttle creation of new lightnings to avoid performance issues
      // and create more natural looking effect with bursts
      // Lebih sering update untuk lightning lebih banyak
      if (now - lastUpdateTime > 150) { // Update every ~150ms (lebih cepat dari sebelumnya)
        setLastUpdateTime(now);
        
        // Check for potential new connections
        const newLightnings: LightningInstance[] = [];
        
        // Base frequency adjustment - create bursts of lightning
        // Tingkatkan chance of lightning burst
        const burstMultiplier = Math.random() < 0.35 ? 3 : 1; // 35% chance of a lightning burst (up from 15%)
        const adjustedFrequency = lightningFrequency * burstMultiplier;
        
        // Process particles with dynamic sampling based on count
        // Use sampling to reduce processing when there are many particles
        const skipFactor = particles.length > 60 ? 2 : 1; // Kurangi skipFactor untuk kalkulasi lebih banyak
        
        // Create a fast velocity-based filter - prioritize particles that are moving
        const fastMovingParticles = particles.filter((p, i) => {
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          // Turunkan speed threshold untuk lebih banyak partikel yang menghasilkan petir
          return (i % skipFactor === 0) && speed > 0.4; // Only consider reasonably moving particles
        });
        
        // Process connections between fast moving particles first
        for (let i = 0; i < fastMovingParticles.length; i++) {
          for (let j = i + 1; j < fastMovingParticles.length; j++) {
            const p1 = fastMovingParticles[i];
            const p2 = fastMovingParticles[j];
            
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Enhanced probability calculation based on distance
            // Higher probability for closer particles
            const distanceFactor = 1 - (distance / connectionDistance);
            // Meningkatkan probabilitas petir pada semua koneksi
            const finalProbability = adjustedFrequency * (distanceFactor * distanceFactor) * (Math.random() < 0.65 ? 1 : 0);
            
            // If particles are close enough and random test passes
            // Perluas area koneksi petir dibanding sebelumnya
            if (distance < connectionDistance * 0.85 && Math.random() < finalProbability) {
              newLightnings.push({
                id: `lightning-${i}-${j}-${now}-${Math.random().toString(36).substring(2, 9)}`,
                startX: p1.x,
                startY: p1.y,
                endX: p2.x,
                endY: p2.y,
                distance: distance,
                maxDistance: connectionDistance,
                createdAt: now,
              });
              
              // Limit number of new lightning effects created per frame
              // Tingkatkan jumlah maksimal petir per frame
              if (newLightnings.length >= 5) break;
            }
          }
          if (newLightnings.length >= 5) break;
        }
        
        // Create chain lightning effect - lightning can jump between close particles
        // Tingkatkan probabilitas chain lightning
        if (newLightnings.length > 0 && Math.random() < 0.4) {
          const sourceIndex = Math.floor(Math.random() * newLightnings.length);
          const sourceLightning = newLightnings[sourceIndex];
          
          // Find a nearby particle to jump to
          const targetParticle = particles.find(p => {
            if (p.x === sourceLightning.endX && p.y === sourceLightning.endY) return false;
            
            const dx = p.x - sourceLightning.endX;
            const dy = p.y - sourceLightning.endY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Perluas jarak lompatan chain lightning
            return distance < connectionDistance * 0.7; 
          });
          
          if (targetParticle) {
            // Add chain lightning with small delay
            setTimeout(() => {
              setLightnings(prev => [...prev, {
                id: `chain-${sourceLightning.id}-${now}`,
                startX: sourceLightning.endX,
                startY: sourceLightning.endY,
                endX: targetParticle.x,
                endY: targetParticle.y,
                distance: connectionDistance * 0.5, // Use shorter distance to make it brighter
                maxDistance: connectionDistance,
                createdAt: Date.now(),
              }]);
            }, 50 + Math.random() * 100); // Slight delay for chain effect
          }
        }
        
        // Tambahkan petir acak untuk partikel yang bergerak sangat cepat
        if (Math.random() < 0.2) { // 20% chance for extra random lightning
          const veryFastParticles = particles.filter(p => {
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            return speed > 1.5; // Hanya partikel yang bergerak sangat cepat
          });
          
          if (veryFastParticles.length >= 2) {
            const randomIndex1 = Math.floor(Math.random() * veryFastParticles.length);
            let randomIndex2 = Math.floor(Math.random() * veryFastParticles.length);
            while (randomIndex2 === randomIndex1) {
              randomIndex2 = Math.floor(Math.random() * veryFastParticles.length);
            }
            
            const p1 = veryFastParticles[randomIndex1];
            const p2 = veryFastParticles[randomIndex2];
            
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < connectionDistance * 1.2) { // Jarak lebih jauh untuk petir random
              newLightnings.push({
                id: `random-${now}-${Math.random().toString(36).substring(2, 9)}`,
                startX: p1.x,
                startY: p1.y,
                endX: p2.x,
                endY: p2.y,
                distance: distance,
                maxDistance: connectionDistance,
                createdAt: now,
              });
            }
          }
        }
        
        if (newLightnings.length > 0) {
          setLightnings((prev) => [...prev, ...newLightnings]);
        }
      }
    };
    
    // Animation frame loop for continuous updates
    let animationFrameId: number;
    
    const animate = () => {
      updateLightnings();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [particles, connectionDistance, lightningDuration, lightningFrequency]);
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {lightnings.map((lightning) => (
        <LightningConnection
          key={lightning.id}
          startX={lightning.startX}
          startY={lightning.startY}
          endX={lightning.endX}
          endY={lightning.endY}
          distance={lightning.distance}
          maxDistance={lightning.maxDistance}
          duration={lightningDuration}
        />
      ))}
    </div>
  );
};

export default LightningManager; 