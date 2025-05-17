"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ChevronRight, ArrowDown, Sparkles, Share2, GitMerge } from "lucide-react"
import CodeFlowHero from "./CodeFlowHero"
import feature1Img from "/assets_task_01jtb9cr1cecgbfz3vt4q07zkx_1746283238_img_1.webp"
import feature2Img from "/assets_task_01jtcab54pfpetkq58meeznvpt_1746317784_img_1.webp"
import feature3Img from "/assets_task_01jtcm87kmexavejfwgnm0q3pn_1746328163_img_0.webp"

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const secondSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const rect = containerRef.current!.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const moveX = (x - centerX) / 50
      const moveY = (y - centerY) / 50

      document.documentElement.style.setProperty("--move-x", `${moveX}px`)
      document.documentElement.style.setProperty("--move-y", `${moveY}px`)
    }

    containerRef.current.addEventListener("mousemove", handleMouseMove)

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", handleMouseMove)
      }
    }
  }, [])

  const scrollToSecondSection = () => {
    secondSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const staggerChildren = {
    animate: {
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1,
      },
    },
  }

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  }

  return (
    <div className="relative overflow-hidden bg-white dark:bg-black">
      {/* First Section - Full Screen */}
      <div ref={containerRef} className="relative min-h-screen flex flex-col justify-center items-center px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-10 w-72 h-72 bg-blue-500/10 rounded-full filter blur-3xl" />
          <div className="absolute bottom-1/4 -right-10 w-72 h-72 bg-purple-500/10 rounded-full filter blur-3xl" />
        </div>

        <motion.div
          className="max-w-6xl mx-auto text-center relative z-10"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wide"
          >
            Making optimization accessible to everyone
          </motion.div>

          <motion.h1
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            The{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 dark:from-blue-400 to-violet-500 dark:to-violet-400">
              open source
            </span>{" "}
            community for optimization
          </motion.h1>

          <motion.p
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-lg md:text-xl text-foreground/70 mb-10 max-w-2xl mx-auto"
          >
            A new way to share, discover, and use optimization tools
          </motion.p>

          <motion.div
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <a
              href="qubots"
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 w-full sm:w-auto"
            >
              Explore qubots
            </a>
            <a
              href="docs"
              className="px-6 py-3 rounded-full border border-border bg-card hover:bg-secondary transition-colors flex items-center justify-center gap-2 font-medium w-full sm:w-auto"
            >
              How it works
              <ChevronRight size={16} />
            </a>
          </motion.div>

          <motion.button
            onClick={scrollToSecondSection}
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="animate-bounce inline-flex items-center justify-center p-2 rounded-full border border-border bg-background/50 backdrop-blur-sm hover:bg-secondary transition-colors"
            aria-label="Scroll down"
          >
            <ArrowDown size={20} />
          </motion.button>
        </motion.div>
      </div>

      {/* Second Section - Features */}
      <div ref={secondSectionRef} className="py-24 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Qubots Work</h2>
            <p className="text-lg text-muted-foreground">
              Qubots provide a standardized way to share and use optimization tools, making complex algorithms
              accessible to everyone.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            <div className="space-y-24">
              {/* Feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="flex flex-col md:flex-row items-center gap-12"
              >
                <div className="flex-1 order-2 md:order-1">
                  <h3 className="text-2xl font-semibold mb-3">Optimization Repositories</h3>
                  <p className="text-muted-foreground mb-4">
                    Qubots are specialized repositories that package optimization algorithms and problems in a
                    standardized format, making them easy to share and use.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 text-blue-500 dark:text-blue-400">
                        <Sparkles size={16} />
                      </div>
                      <span>Standardized interface for all optimization tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 text-blue-500 dark:text-blue-400">
                        <Sparkles size={16} />
                      </div>
                      <span>Consistent API across different algorithms</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-1 order-1 md:order-2">
                  <div className="max-w-[420px] overflow-hidden rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                    <img
                      src={feature2Img || "/placeholder.svg"}
                      alt="Visualization of optimization repositories"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>

              </motion.div>

              {/* Feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="flex flex-col md:flex-row-reverse items-center gap-12"
              >
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3">Share & Discover</h3>
                  <p className="text-muted-foreground mb-4">
                    Share your optimization tools with the community and discover solutions created by others through
                    the open source qubots library.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 text-purple-500 dark:text-purple-400">
                        <Share2 size={16} />
                      </div>
                      <span>Contribute your algorithms to the community</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 text-purple-500 dark:text-purple-400">
                        <Share2 size={16} />
                      </div>
                      <span>Find the perfect solution for your specific problem</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="max-w-[420px] overflow-hidden rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                    <img
                      src={feature1Img || "/placeholder.svg"}
                      alt="Share and discover optimization tools"
                      className="max-w-[420px] h-auto object-cover"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="flex flex-col md:flex-row items-center gap-12"
              >
                <div className="flex-1 order-2 md:order-1">
                  <h3 className="text-2xl font-semibold mb-3">Customize & Connect</h3>
                  <p className="text-muted-foreground mb-4">
                    Pull qubots into your projects, customize them for your specific needs, and connect different
                    algorithms with problems.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 text-green-500 dark:text-green-400">
                        <GitMerge size={16} />
                      </div>
                      <span>Mix and match problems with different solvers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 text-green-500 dark:text-green-400">
                        <GitMerge size={16} />
                      </div>
                      <span>Adapt existing solutions to your unique requirements</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-1 order-1 md:order-2">
                  <div className="max-w-[420px] overflow-hidden rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
                    <img
                      src={feature3Img || "/placeholder.svg"}
                      alt="Customize and connect optimization tools"
                      className="max-w-[420px] h-auto object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-20 max-w-3xl mx-auto"
          >
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <p className="font-medium">Qubots ecosystem</p>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Qubots</span> come in two types:{" "}
                <span className="text-blue-500 dark:text-blue-400 font-medium">Problems</span> (mathematical
                optimization problems) and{" "}
                <span className="text-orange-500 dark:text-orange-400 font-medium">Optimizers</span> (algorithms that
                solve them). Mix and match them to find the best solutions for your specific use case.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Third Section - Code Flow Hero (unchanged) */}
      <div className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center "
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Use qubots locally</h2>
            <p className="text-lg text-muted-foreground">
              Make use of qubots' AutoOptimizer & AutoProblem classes to create a qubot instance.
            </p>
          </motion.div>
          <CodeFlowHero />
        </div>
      </div>
    </div>
  )
}

export default Hero
