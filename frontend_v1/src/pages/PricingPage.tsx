import React from 'react'
import { Check, Crown, Zap, Building2, Users, Workflow, Database, Cpu, Shield } from 'lucide-react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PricingPage = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for individual developers and open source projects",
      icon: <Users className="h-6 w-6" />,
      color: "bg-blue-500",
      features: [
        "Unlimited public repositories",
        "Unlimited private repositories", 
        "Unlimited public workflows",
        "Unlimited private workflows",
        "Basic workflow automation features",
        "Basic compute infrastructure",
        "Community support",
        "Standard execution time limits",
        "Basic dataset storage (10GB)"
      ],
      limitations: [],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "$9",
      period: "per month",
      description: "Enhanced features for professional developers and small teams",
      icon: <Zap className="h-6 w-6" />,
      color: "bg-purple-500",
      features: [
        "Everything in Free",
        "Advanced workflow automation features",
        "Priority compute infrastructure",
        "Extended execution time limits",
        "Advanced dataset storage (100GB)",
        "Priority support",
        "Advanced analytics & insights",
        "Custom workflow templates",
        "API rate limit increases"
      ],
      limitations: [],
      cta: "Upgrade to Pro",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "Full platform access with AutoSolve for organizations",
      icon: <Building2 className="h-6 w-6" />,
      color: "bg-orange-500",
      features: [
        "Everything in Pro",
        "Full AutoSolve access",
        "AI-powered optimization recommendations",
        "Advanced ML-based problem matching",
        "Unlimited dataset storage",
        "Dedicated compute resources",
        "24/7 enterprise support",
        "Custom integrations",
        "On-premise deployment options",
        "Advanced security & compliance",
        "Team management & permissions",
        "Custom SLA agreements"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false
    }
  ]

  const features = [
    {
      category: "Repository Management",
      items: [
        { name: "Public Repositories", free: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
        { name: "Private Repositories", free: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
        { name: "Collaborators", free: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
        { name: "Git LFS Support", free: "✓", pro: "✓", enterprise: "✓" }
      ]
    },
    {
      category: "Workflow Automation",
      items: [
        { name: "Public Workflows", free: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
        { name: "Private Workflows", free: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
        { name: "Basic Automation Features", free: "✓", pro: "✓", enterprise: "✓" },
        { name: "Advanced Automation Features", free: "✗", pro: "✓", enterprise: "✓" },
        { name: "Custom Templates", free: "✗", pro: "✓", enterprise: "✓" }
      ]
    },
    {
      category: "Compute & Infrastructure",
      items: [
        { name: "Basic Compute", free: "✓", pro: "✓", enterprise: "✓" },
        { name: "Priority Compute", free: "✗", pro: "✓", enterprise: "✓" },
        { name: "Dedicated Resources", free: "✗", pro: "✗", enterprise: "✓" },
        { name: "Execution Time Limit", free: "30 min", pro: "2 hours", enterprise: "Unlimited" }
      ]
    },
    {
      category: "AutoSolve & AI Features",
      items: [
        { name: "AutoSolve Access", free: "✗", pro: "✗", enterprise: "✓" },
        { name: "AI Recommendations", free: "✗", pro: "✗", enterprise: "✓" },
        { name: "ML Problem Matching", free: "✗", pro: "✗", enterprise: "✓" },
        { name: "Advanced Analytics", free: "✗", pro: "✓", enterprise: "✓" }
      ]
    }
  ]

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Crown className="h-3 w-3 mr-1" />
              Admin Only - Pricing Configuration
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Rastion respects the community, developers, startups, and enterprises with transparent, 
              fair pricing that grows with your optimization needs.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <Card 
                key={plan.name} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  plan.popular ? 'ring-2 ring-purple-500 scale-105' : 'hover:scale-105'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.popular ? 'pt-12' : 'pt-6'}`}>
                  <div className={`w-12 h-12 ${plan.color} rounded-xl flex items-center justify-center text-white mx-auto mb-4`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    {plan.period !== "contact us" && (
                      <span className="text-lg font-normal text-muted-foreground">/{plan.period}</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full mt-6 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                        : ''
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <Card className="mb-16">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-4">Features</th>
                      <th className="text-center py-4 px-4">Free</th>
                      <th className="text-center py-4 px-4">Pro</th>
                      <th className="text-center py-4 px-4">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((category, categoryIndex) => (
                      <React.Fragment key={categoryIndex}>
                        <tr>
                          <td colSpan={4} className="py-4 px-4 font-semibold text-primary bg-muted/50">
                            {category.category}
                          </td>
                        </tr>
                        {category.items.map((item, itemIndex) => (
                          <tr key={itemIndex} className="border-b border-muted/30">
                            <td className="py-3 px-4">{item.name}</td>
                            <td className="text-center py-3 px-4">{item.free}</td>
                            <td className="text-center py-3 px-4">{item.pro}</td>
                            <td className="text-center py-3 px-4">{item.enterprise}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Community-First Philosophy */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-none">
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 text-blue-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">Community-First Philosophy</h3>
              <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
                Our pricing model reflects our commitment to the optimization community. We believe in making 
                powerful optimization tools accessible to everyone - from individual researchers to large enterprises. 
                The Free tier provides everything needed for serious optimization work, while paid tiers add 
                convenience and advanced features for professional use cases.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default PricingPage
