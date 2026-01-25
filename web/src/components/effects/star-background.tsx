"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/theme-context";

export function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: {
      x: number;
      y: number;
      radius: number;
      opacity: number;
      speed: number;
    }[] = [];

    const generateStars = () => {
      stars = [];
      const starCount = Math.floor((canvas.width * canvas.height) / 5000);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.05 + 0.01,
        });
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateStars();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationFrameId: number;

    const animate = () => {
      // Clear canvas with theme-aware background or transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (theme === "dark") {
        ctx.fillStyle = "#0A0B1E";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

        // Stars are white in dark mode, subtle gray in light mode
        const starColor =
          theme === "dark"
            ? `rgba(255, 255, 255, ${star.opacity})`
            : `rgba(100, 100, 100, ${star.opacity * 0.3})`;

        ctx.fillStyle = starColor;
        ctx.fill();

        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });

      if (theme === "dark") {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width / 1.5,
        );
        gradient.addColorStop(0, "rgba(76, 29, 149, 0.05)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
}
