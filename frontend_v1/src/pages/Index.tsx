import React from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import Hero from "../components/Hero";
import ModelShowcase from "../components/ModelShowcase";

const Index = () => {
  return (
    <Layout>
      <Hero />
      
      <div className="mt-4 pt-2">
        <section id="how-it-works" className="py-24 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              How Rastion platform works
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-foreground/70"
            >
              Access and deploy state-of-the-art optimizers with just a few lines of code
            </motion.p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Browse Models",
                description: "Explore thousands of pre-trained models across various domains and tasks",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )
              },
              {
                title: "Deploy & Integrate",
                description: "Seamlessly deploy models to production with our inference API or download for local use",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16V22M12 22L15 19M12 22L9 19M6 13V16C6 16.6 5.5 18 4 18C2.5 18 2 16.6 2 16V11C2 7.5 5 4 9 4H15C19 4 22 7.5 22 11V16C22 16.6 21.5 18 20 18C18.5 18 18 16.6 18 16V13C18 12.4 17.6 12 17 12H7C6.4 12 6 12.4 6 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )
              },
              {
                title: "Customize & Fine-tune",
                description: "Adapt models to your specific needs with simple fine-tuning capabilities",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 4V7C14 7.55228 14.4477 8 15 8H18M14 4H7C6.44772 4 6 4.44772 6 5V19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19V8M14 4L18 8M10 12H14M10 16H14M8 8H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-8 hover:shadow-lg hover:shadow-primary/5 transition-all hover:border-primary/20"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-foreground/70">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
      
      
      
      <section className="py-24 bg-gradient-to-b from-background to-secondary/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              Ready to transform your projects with Rastion?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-foreground/70 mb-8"
            >
              Join our community and help us accelerate the field of optimization
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <a 
                href="#models" 
                className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
              >
                Sign up
              </a>
              <a 
                href="#models" 
                className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
              >
                Contact us
              </a>
              <a 
                href="#" 
                className="px-6 py-3 rounded-full border border-border bg-background hover:bg-secondary transition-colors"
              >
                Read Documentation
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
