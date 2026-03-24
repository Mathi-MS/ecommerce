import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Leaf, ShieldCheck, Truck } from "lucide-react";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";

export default function Home() {
  const { data: featuredData, isLoading: featuredLoading } = useListProducts({ featured: true, limit: 4 });
  const { data: categoriesData } = useListCategories();

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Natural wellness products" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 border border-primary/20">
              <Leaf className="h-4 w-4" /> 100% Organic & Natural
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-display text-foreground leading-tight mb-6">
              Pure Nature,<br/>Delivered to You.
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
              Discover our premium collection of cold-pressed oils, raw honeys, and soothing aloe vera. Sustainably sourced for your ultimate wellness.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products">
                <Button size="lg" className="rounded-full text-base px-8 h-14 shadow-lg shadow-primary/20 gap-2">
                  Shop Collection <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/faq">
                <Button size="lg" variant="outline" className="rounded-full text-base px-8 h-14 bg-background/50 backdrop-blur-sm border-border hover:bg-background">
                  Our Story
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Banner */}
      <section className="bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex flex-col items-center py-4 md:py-0">
              <Leaf className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">100% Natural</h3>
              <p className="text-muted-foreground text-sm">No synthetics, just pure botanical goodness.</p>
            </div>
            <div className="flex flex-col items-center py-4 md:py-0">
              <ShieldCheck className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Ethically Sourced</h3>
              <p className="text-muted-foreground text-sm">Sustainably harvested from trusted farmers.</p>
            </div>
            <div className="flex flex-col items-center py-4 md:py-0">
              <Truck className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground text-sm">Free shipping on all orders over $50.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bold font-display text-foreground mb-4">Trending Now</h2>
              <p className="text-muted-foreground text-lg">Our most loved natural essentials.</p>
            </div>
            <Link href="/products" className="hidden sm:flex items-center gap-2 font-medium text-primary hover:text-primary/80 transition-colors">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[4/5] bg-muted/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredData?.products?.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products">
              <Button variant="outline" className="w-full rounded-xl h-12">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-secondary/20 rounded-[2rem] transform translate-x-4 translate-y-4"></div>
              <img 
                src={`${import.meta.env.BASE_URL}images/about-img.png`} 
                alt="About Elowell" 
                className="relative z-10 w-full h-auto rounded-[2rem] shadow-xl object-cover aspect-[4/3]"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold font-display mb-6 leading-tight">Rooted in tradition, crafted for today.</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Elowell began with a simple mission: to bring the unadulterated healing power of nature directly to your doorstep. We partner directly with organic farmers to ensure every drop of oil, spoon of honey, and scoop of aloe is as pure as nature intended.
              </p>
              <ul className="space-y-4 mb-8">
                {['Cruelty-free & Vegan', 'Cold-pressed extraction', 'No artificial fragrances'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                    <CheckCircleIcon className="text-primary h-5 w-5" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/products">
                <Button size="lg" className="rounded-xl px-8">Discover Our Process</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
