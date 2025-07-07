"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Typewriter from 'typewriter-effect'
import {
  ChevronRight,
  ArrowDown,
  Sparkles,
  Share2,
  GitMerge,
  Zap,
  Users,
  Code,
  Rocket,
  UserPlus,
  Play,
  Trophy,
  BarChart3,
  GitBranch,
  Layers,
  Target,
  Brain,
  Workflow,
  Database
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/components/ThemeContext"
import { WaitlistForm } from "./WaitlistForm"
import { ContactModal } from "./ContactModal"

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const { actualTheme } = useTheme()

  const animatedWords = ['fun', 'accessible', 'collaborative', 'reproducible', 'modular']

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

  const features = [
    {
      icon: GitBranch,
      title: "Optimization repositories",
      description: "Share and discover optimization algorithms with the qubots framework",
      href: "/qubots"
    },
    {
      icon: Zap,
      title: "AutoSolve",
      description: "AI-powered optimization recommendations from your data files",
      href: "/autosolve",
      badge: "BETA"
    },
    {
      icon: Workflow,
      title: "Decision model builder",
      description: "Build decision models with drag-and-drop visual interface",
      href: "/workflow-automation",
      badge: "BETA"
    },
    {
      icon: Target,
      title: "Optimization challenges",
      description: "Discover and participate in community optimization challenges",
      href: "/optimization-challenges",
      badge: "BETA"
    },
    {
      icon: Database,
      title: "Public decision models",
      description: "Browse and explore decision models shared by the community",
      href: "/public-experiments"
    },
    {
      icon: Code,
      title: "Documentation",
      description: "Comprehensive guides and API documentation for the qubots framework",
      href: "https://docs.rastion.com"
    }
  ]

  return (
    <div ref={heroRef} className="relative overflow-hidden bg-background">
      {/* Animated background elements */}
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

      {/* Hero Section */}
      <motion.div
        ref={containerRef}
        className="relative min-h-screen flex flex-col justify-center items-center px-6 lg:px-8 py-20"
        style={{ y, opacity }}
      >
        <motion.div
          className="max-w-6xl mx-auto text-center relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <Badge
              variant="secondary"
              className="px-6 py-3 text-sm font-medium bg-secondary/20 border border-border/30 shadow-soft hover:shadow-medium transition-all duration-300 hover-lift text-foreground backdrop-blur-sm rounded-full"
            >
              The developer's playground for optimization
            </Badge>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 leading-[1.1] text-foreground"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
          >
            Making{" "}
            <span className="hero-gradient-text">
              optimization
            </span>
            <br />
            <span className="relative inline-block">
              <div
                className="terminal-typewriter"
                style={{
                  color: actualTheme === 'dark' ? '#ffffff' : '#000000',
                  fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
                  fontWeight: 600,
                  fontSize: 'inherit',
                  lineHeight: 'inherit'
                }}
              >
                <Typewriter
                  options={{
                    strings: animatedWords,
                    autoStart: true,
                    loop: true,
                    delay: 100,
                    deleteSpeed: 50,
                    cursor: '|',
                    wrapperClassName: 'typewriter-wrapper',
                    cursorClassName: 'typewriter-cursor'
                  }}
                />
              </div>
              {/* Invisible placeholder to maintain layout */}
              <span className="opacity-0 select-none" aria-hidden="true">
                collaborative
              </span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-medium"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
          >
            Join developers and researchers creating modular optimization solutions. Upload your algorithms,
            test them in the playground, and join public leaderboards.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-semibold rounded-xl shadow-strong hover:shadow-medium transition-all duration-300 hover-lift w-full sm:w-auto border-0"
              style={{
                background: actualTheme === 'dark' ? 'white' : 'black',
                color: actualTheme === 'dark' ? 'black' : 'white',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}
              onClick={() => window.location.href = "/qubots"}
            >
              Explore optimization repositories
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg font-semibold rounded-xl border-2 border-border/50 hover:bg-secondary/20 transition-all duration-300 hover-lift w-full sm:w-auto text-foreground hover:text-foreground bg-transparent backdrop-blur-sm"
              style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}
              onClick={() => window.location.href = "/public-experiments"}
            >
              Browse decision models
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        className="relative z-10 py-20 px-6 lg:px-8"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 px-4 py-2 text-sm bg-secondary/10 text-foreground border-border/30 rounded-full"
            >
              Platform features
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              Everything you need for{" "}
              <span className="hero-gradient-text">optimization</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              From algorithm development to community collaboration, our platform provides
              all the tools you need to build and share optimization solutions.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
                  onClick={() => window.location.href = feature.href}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      
                      <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                      {feature.badge && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Vision Section */}
      <motion.div
        className="relative z-10 py-20 px-6 lg:px-8 bg-secondary/5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-6 px-4 py-2 text-sm bg-secondary/10 text-foreground border-border/30 rounded-full"
          >
            Our vision
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-foreground">
            The future of{" "}
            <span className="hero-gradient-text">optimization</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
            We envision a world where optimization is accessible to everyone - from seasoned researchers
            to domain experts without deep technical knowledge. Through the qubots framework, we're building
            modular, reusable optimization components that work like LEGO blocks, enabling rapid prototyping
            and deployment of optimization solutions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 text-base font-medium rounded-xl border-2 border-border/50 hover:bg-secondary/20 transition-all duration-300 hover-lift"
              onClick={() => window.open("https://discord.gg/E2rnssmh9Y", "_blank")}
            >
              <Users className="w-5 h-5 mr-2" />
              Join Discord
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-12 px-6 text-base font-medium rounded-xl hover:bg-secondary/20 transition-all duration-300"
              onClick={() => setIsContactOpen(true)}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Contact us
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Waitlist Form Modal */}
      <WaitlistForm
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  )
}

export default Hero
