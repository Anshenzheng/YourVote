import { useState, useEffect, useRef } from 'react'

function NumberRoll({ value, duration = 800, className = '' }) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)
  const animationRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (value === prevValue.current) return

    const startValue = prevValue.current
    const endValue = value
    const diff = endValue - startValue

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      
      const currentValue = Math.round(startValue + diff * easedProgress)
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        prevValue.current = endValue
        startTimeRef.current = null
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration])

  return <span className={`number-roll ${className}`}>{displayValue}</span>
}

export default NumberRoll
