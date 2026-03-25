import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, User, Menu, X, Leaf } from "lucide-react";
import { useSessionStore, useApiOptions } from "@/store/session";
import { useGetCart, useGetMe, useListOffers } from "@workspace/api-client-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileDropdown } from "@/components/ProfileDropdown";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartSessionId = useSessionStore((s) => s.cartSessionId);
  const { user, setUser, token, logout } = useSessionStore();
  const apiOpts = useApiOptions();

  // Rehydrate user
  const { data: userData, isError } = useGetMe({
    query: { enabled: !!token && !user, retry: false }, // Only fetch if we have token but no user
    ...apiOpts,
  });

  useEffect(() => {
    if (userData && !user) setUser(userData); // Only set user if we don't already have one
    if (isError && token) logout(); // Only logout if we had a token but API failed
  }, [userData, isError, setUser, logout, user, token]);

  // Fetch cart
  const { data: cart } = useGetCart({ sessionId: cartSessionId });

  // Fetch active offer for banner
  const { data: offers } = useListOffers(apiOpts);
  const activeOffer = Array.isArray(offers) ? offers.find((o: any) => o.status === "active") : null;

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Banner */}
      {activeOffer && (
        <div className="bg-primary text-primary-foreground text-center py-3 text-sm font-medium tracking-wide">
          {activeOffer.text}
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Elowell Logo" className="h-10 w-10 group-hover:scale-105 transition-transform" />
              <span className="font-display font-bold text-2xl tracking-tight text-foreground">Elowell</span>
            </Link>
            
            <nav className="hidden md:flex gap-6">
              <Link href="/products" className={`text-sm font-medium hover:text-primary transition-colors ${location === '/products' ? 'text-primary' : 'text-muted-foreground'}`}>Shop All</Link>
              <Link href="/faq" className={`text-sm font-medium hover:text-primary transition-colors ${location === '/faq' ? 'text-primary' : 'text-muted-foreground'}`}>FAQ</Link>
              {user?.role === 'admin' && (
                <Link href="/admin/dashboard" className="text-sm font-medium text-secondary hover:text-secondary/80 transition-colors">Admin Panel</Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ProfileDropdown />
            
            <Link href="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors">
              <ShoppingBag className="h-6 w-6" />
              {cart?.itemCount ? (
                <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold shadow-sm">
                  {cart.itemCount}
                </span>
              ) : null}
            </Link>

            <button className="md:hidden p-2 text-foreground" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-background md:hidden flex flex-col"
          >
            <div className="p-4 flex justify-end">
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-foreground">
                <X className="h-8 w-8" />
              </button>
            </div>
            <nav className="flex flex-col gap-6 p-8 text-2xl font-display font-medium">
              <Link href="/" className="hover:text-primary">Home</Link>
              <Link href="/products" className="hover:text-primary">Shop All</Link>
              <Link href="/faq" className="hover:text-primary">FAQ</Link>
              <Link href="/auth" className="hover:text-primary">{user ? 'My Account' : 'Sign In'}</Link>
              {user?.role === 'admin' && (
                <Link href="/admin/dashboard" className="text-secondary">Admin Panel</Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-2xl tracking-tight text-white">Elowell</span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              We believe in the power of pure, unadulterated nature. Our products are sustainably sourced, minimally processed, and delivered with love.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white">Shop</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/products?category=oils" className="hover:text-white transition-colors">Natural Oils</Link></li>
              <li><Link href="/products?category=honey" className="hover:text-white transition-colors">Raw Honey</Link></li>
              <li><Link href="/products?category=skincare" className="hover:text-white transition-colors">Skincare</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white">Help</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-white/10 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Elowell Natural Products. All rights reserved.
        </div>
      </footer>
    </div>
  );
}