"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ChevronRight, ArrowDown, Sparkles, Share2, GitMerge, Zap, Users, Code, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/ThemeContext"
import CodeFlowHero from "./CodeFlowHero"
import feature1Img from "/assets_task_01jtb9cr1cecgbfz3vt4q07zkx_1746283238_img_1.webp"
import feature2Img from "/assets_task_01jtcab54pfpetkq58meeznvpt_1746317784_img_1.webp"
import feature3Img from "/assets_task_01jtcm87kmexavejfwgnm0q3pn_1746328163_img_0.webp"

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { actualTheme } = useTheme()

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    if (!containerRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const rect = containerRef.current!.getBoundingClientRect()
      const x = (clientX - rect.left) / rect.width
      const y = (clientY - rect.top) / rect.height
      setMousePosition({ x, y })
    }

    containerRef.current.addEventListener("mousemove", handleMouseMove)

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", handleMouseMove)
      }
    }
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.25, 0, 1],
      },
    },
  }

  return (
    <div ref={heroRef} className="relative overflow-hidden bg-background">
      {/* Animated background elements - using hero colors */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full filter blur-3xl"
          style={{
            background: `linear-gradient(135deg, hsl(var(--hero-primary) / 0.15), hsl(var(--hero-secondary) / 0.15))`
          }}
          animate={{
            x: mousePosition.x * 20,
            y: mousePosition.y * 20,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full filter blur-3xl"
          style={{
            background: `linear-gradient(135deg, hsl(var(--hero-secondary) / 0.15), hsl(var(--hero-accent) / 0.15))`
          }}
          animate={{
            x: mousePosition.x * -15,
            y: mousePosition.y * -15,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full filter blur-2xl"
          style={{
            background: `linear-gradient(135deg, hsl(var(--hero-primary) / 0.08), hsl(var(--hero-secondary) / 0.08))`
          }}
          animate={{
            x: mousePosition.x * 10,
            y: mousePosition.y * 10,
          }}
          transition={{ type: "spring", stiffness: 30, damping: 15 }}
        />
      </div>

      {/* Main hero content */}
      <motion.div
        ref={containerRef}
        className="relative h-screen flex flex-col justify-center items-center px-6 lg:px-8"
        style={{ y, opacity }}
      >
        <motion.div
          className="max-w-7xl mx-auto text-center relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm font-medium bg-secondary/20 border border-border/30 shadow-soft hover:shadow-medium transition-all duration-300 hover-lift text-foreground backdrop-blur-sm"
            >

              Making optimization accessible to everyone
            </Badge>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-8 leading-[1.1] text-foreground"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
          >
            The{" "}
            <span className="hero-gradient-text">
              open source
            </span>
            <br />
            community for optimization
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-medium"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
          >
            Access cutting-edge algorithms, share your solutions, and accelerate innovation.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Button
              size="lg"
              className="h-16 px-10 text-lg font-semibold rounded-full shadow-strong hover:shadow-medium transition-all duration-300 hover-lift w-full sm:w-auto border-0"
              style={{
                background: actualTheme === 'dark' ? 'white' : 'black',
                color: actualTheme === 'dark' ? 'black' : 'white',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}
              onClick={() => window.location.href = "/qubots"}
            >

              Explore Optimization Tools
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-16 px-10 text-lg font-semibold rounded-full border-2 border-border/50 hover:bg-secondary/20 transition-all duration-300 hover-lift w-full sm:w-auto text-foreground hover:text-foreground bg-transparent backdrop-blur-sm"
              style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}
              onClick={() => window.open("https://docs.rastion.com", "_blank")}
            >
              How it works
              <ChevronRight className="w-5 h-5 ml-3" />
            </Button>
          </motion.div>


        </motion.div>
      </motion.div>
    </div>
  )
}

export default Hero
