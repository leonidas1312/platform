import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const rect = containerRef.current!.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const moveX = (x - centerX) / 50;
      const moveY = (y - centerY) / 50;
      
      document.documentElement.style.setProperty('--move-x', `${moveX}px`);
      document.documentElement.style.setProperty('--move-y', `${moveY}px`);
    };

    containerRef.current.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const staggerChildren = {
    animate: {
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-transparent pt-28 pb-16 md:pt-36 md:pb-24"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[20%] opacity-30">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,#4f46e5_0,transparent_60%)] blur-3xl"></div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wide"
          >
            THE FUTURE OF AI IS HERE
          </motion.div>
          
          <motion.h1 
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            Experience the power of 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500"> state-of-the-art models</span>
          </motion.h1>
          
          <motion.p 
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-lg md:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto"
          >
            Access, deploy, and customize thousands of machine learning models for natural language processing, computer vision, speech, and more.
          </motion.p>
          
          <motion.div 
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="#models" 
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 w-full sm:w-auto"
            >
              Explore Models
            </a>
            <a 
              href="#how-it-works" 
              className="px-6 py-3 rounded-full border border-border bg-card hover:bg-secondary transition-colors flex items-center justify-center gap-2 font-medium w-full sm:w-auto"
            >
              How it works
              <ChevronRight size={16} />
            </a>
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-16 md:mt-24 max-w-5xl mx-auto"
        >
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-2xl shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm">
              <div className="absolute inset-0.5 rounded-lg overflow-hidden bg-background/50">
                <div className="h-full w-full bg-gray-100 glass">
                  <div className="w-full h-10 bg-secondary/50 flex items-center px-4 gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <div className="w-48 mx-auto h-6 rounded-full bg-white/30"></div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 p-4 h-[calc(100%-2.5rem)]">
                    <div className="col-span-3 bg-white/30 rounded-lg animate-pulse"></div>
                    <div className="col-span-9 flex flex-col gap-4">
                      <div className="h-32 bg-white/30 rounded-lg animate-pulse"></div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div className="aspect-[4/3] bg-white/30 rounded-lg animate-pulse"></div>
                        <div className="aspect-[4/3] bg-white/30 rounded-lg animate-pulse"></div>
                        <div className="aspect-[4/3] bg-white/30 rounded-lg animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-[-90px] left-1/2 -translate-x-1/2 w-full max-w-3xl">
            <div className="flex justify-center gap-6 md:gap-10">
              {['Text', 'Vision', 'Audio', 'Multimodal'].map((category, index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full glass flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <span className="text-primary">
                      {index === 0 && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 5.5L12 2L3 5.5M21 5.5V18.5L12 22M21 5.5L12 9M12 22L3 18.5V5.5M12 22V9M3 5.5L12 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {index === 1 && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 7.5C2 6.67157 2.67157 6 3.5 6H20.5C21.3284 6 22 6.67157 22 7.5V16.5C22 17.3284 21.3284 18 20.5 18H3.5C2.67157 18 2 17.3284 2 16.5V7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 12C8 13.1046 7.10457 14 6 14C4.89543 14 4 13.1046 4 12C4 10.8954 4.89543 10 6 10C7.10457 10 8 10.8954 8 12Z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M15 9L19 13M15 13L19 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {index === 2 && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19 12C19 16.9706 15.9706 20 12 20C8.02944 20 5 16.9706 5 12C5 7.02944 8.02944 4 12 4C15.9706 4 19 7.02944 19 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 4V2M4 12H2M12 20V22M20 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {index === 3 && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 9H4C3.44772 9 3 9.44772 3 10V18C3 18.5523 3.44772 19 4 19H20C20.5523 19 21 18.5523 21 18V10C21 9.44772 20.5523 9 20 9H17M7 9V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V9M7 9H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                    </span>
                  </div>
                  <p className="text-xs font-medium">{category}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
