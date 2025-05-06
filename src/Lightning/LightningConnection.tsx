import React, { useState, useEffect } from "react";
import Lightning from "./Lightning";

interface LightningConnectionProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  distance: number;
  maxDistance: number;
  duration?: number;
}

const LightningConnection: React.FC<LightningConnectionProps> = ({
  startX,
  startY,
  endX,
  endY,
  distance,
  maxDistance,
  duration = 300,
}) => {
  const [active, setActive] = useState(true);
  
  // Calculate center point between particles
  const centerX = (startX + endX) / 2;
  const centerY = (startY + endY) / 2;
  
  // Calculate width and height based on distance between particles
  // Ensure minimum dimensions for very close particles
  const width = Math.max(Math.abs(endX - startX) * 1.2, 35); 
  const height = Math.max(Math.abs(endY - startY) * 1.2, 35);
  
  // Calculate rotation angle
  const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
  
  // Calculate opacity based on distance
  // Meningkatkan opacity dari sebelumnya
  const opacity = (1 - distance / maxDistance) * 0.95;
  
  // Lightning effect properties - adjust for white color
  const speed = 1.3 + (1 - distance / maxDistance) * 2.2; // Faster effect for closer particles
  const intensity = 2 + (1 - distance / maxDistance) * 1.5; // Lebih bright
  const size = 2 + (1 - distance / maxDistance) * 0.9; // Slightly larger
  
  // Randomize effect reset time slightly
  const effectDuration = duration * (0.8 + Math.random() * 0.4);
  
  // Reset effect after duration
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setActive(false);
    }, effectDuration);
    
    return () => clearTimeout(timeoutId);
  }, [effectDuration]);
  
  if (!active) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: centerX - width / 2,
        top: centerY - height / 2,
        width: width,
        height: height,
        transform: `rotate(${angle}deg)`,
        opacity: opacity,
        zIndex: 5,
        mixBlendMode: "screen", // Penting: gunakan mixBlendMode untuk membuat background menyatu
        filter: "blur(0.2px)",
      }}
    >
      <div className="w-full h-full" style={{ 
        position: "relative",
        backgroundColor: "transparent" // Pastikan container tidak memiliki background
      }}>
        <Lightning 
          hue={210} // Dengan hue biru sangat muda akan terlihat putih
          xOffset={0}
          speed={speed}
          intensity={intensity}
          size={size}
        />
      </div>
    </div>
  );
};

export default LightningConnection; 