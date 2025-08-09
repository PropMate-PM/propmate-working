import React, { useEffect, useRef } from 'react'

interface SplineBackgroundProps {
  className?: string
}

export default function SplineBackground({ className = '' }: SplineBackgroundProps) {
  const splineRef = useRef<any>(null)

  useEffect(() => {
    // Wait for the Spline viewer to be available
    const checkSplineViewer = () => {
      if (typeof window !== 'undefined' && (window as any).SplineViewer) {
        // Spline viewer is loaded
        return true
      }
      return false
    }

    if (!checkSplineViewer()) {
      // If not immediately available, wait for it
      const interval = setInterval(() => {
        if (checkSplineViewer()) {
          clearInterval(interval)
        }
      }, 100)

      return () => clearInterval(interval)
    }
  }, [])

  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      {/* Dark grey background behind Spline */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: '#0D0D0D',
          zIndex: -2
        }}
      />
      <spline-viewer 
        ref={splineRef}
        url="https://prod.spline.design/TwYN6gkS7JtWEZNC/scene.splinecode"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: -1,
          pointerEvents: 'none',
          opacity: 1.2, // Increased opacity for better visibility
          filter: 'brightness(1.3) contrast(1.1)' // Enhanced brightness and contrast
        }}
      />
    </div>
  )
} 