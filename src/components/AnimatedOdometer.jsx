import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export default function AnimatedOdometer({ value }) {
  const animatedValue = useSpring(value, {
    stiffness: 200,
    damping: 25,
    mass: 0.5,
  });
  const ref = useRef(null);

  useEffect(() => {
    animatedValue.set(value);
  }, [animatedValue, value]);

  useEffect(() => {
    return animatedValue.on('change', (latest) => {
      if (ref.current) {
        // Round the animated value to a whole number for the display
        ref.current.textContent = Math.round(latest);
      }
    });
  }, [animatedValue]);

  return <motion.span ref={ref} className="font-mono tabular-nums">{value}</motion.span>;
}
