// Route preloader utility for better UX (Hash Router compatible)
const routePreloaders = new Map<string, () => Promise<any>>();

// Register route preloaders
export function registerRoutePreloaders() {
  // Public routes
  routePreloaders.set('#/', () => import('../pages/home'));
  routePreloaders.set('#/products', () => import('../pages/products/index'));
  routePreloaders.set('#/cart', () => import('../pages/cart'));
  routePreloaders.set('#/checkout', () => import('../pages/checkout'));
  routePreloaders.set('#/auth', () => import('../pages/auth'));
  routePreloaders.set('#/faq', () => import('../pages/faq'));
  routePreloaders.set('#/orders', () => import('../pages/orders'));
  
  // Admin routes
  routePreloaders.set('#/admin/dashboard', () => import('../pages/admin/dashboard'));
  routePreloaders.set('#/admin/products', () => import('../pages/admin/products'));
  routePreloaders.set('#/admin/categories', () => import('../pages/admin/categories'));
  routePreloaders.set('#/admin/banners', () => import('../pages/admin/banners'));
  routePreloaders.set('#/admin/orders', () => import('../pages/admin/orders'));
  routePreloaders.set('#/admin/offers', () => import('../pages/admin/offers'));
  routePreloaders.set('#/admin/faq', () => import('../pages/admin/faq'));
  routePreloaders.set('#/admin/home-sections', () => import('../pages/admin/home-sections'));
  routePreloaders.set('#/admin/coupons', () => import('../pages/admin/coupons'));
  
  // Also register without hash for compatibility
  routePreloaders.set('/', () => import('../pages/home'));
  routePreloaders.set('/products', () => import('../pages/products/index'));
  routePreloaders.set('/cart', () => import('../pages/cart'));
  routePreloaders.set('/checkout', () => import('../pages/checkout'));
  routePreloaders.set('/auth', () => import('../pages/auth'));
  routePreloaders.set('/faq', () => import('../pages/faq'));
  routePreloaders.set('/orders', () => import('../pages/orders'));
  routePreloaders.set('/admin/dashboard', () => import('../pages/admin/dashboard'));
  routePreloaders.set('/admin/products', () => import('../pages/admin/products'));
  routePreloaders.set('/admin/categories', () => import('../pages/admin/categories'));
  routePreloaders.set('/admin/banners', () => import('../pages/admin/banners'));
  routePreloaders.set('/admin/orders', () => import('../pages/admin/orders'));
  routePreloaders.set('/admin/offers', () => import('../pages/admin/offers'));
  routePreloaders.set('/admin/faq', () => import('../pages/admin/faq'));
  routePreloaders.set('/admin/home-sections', () => import('../pages/admin/home-sections'));
  routePreloaders.set('/admin/coupons', () => import('../pages/admin/coupons'));
}

// Preload a specific route
export function preloadRoute(path: string): Promise<any> | null {
  const preloader = routePreloaders.get(path);
  if (preloader) {
    return preloader().catch(error => {
      console.warn(`Failed to preload route ${path}:`, error);
      return null;
    });
  }
  return null;
}

// Preload multiple routes
export function preloadRoutes(paths: string[]): Promise<any[]> {
  const promises = paths.map(path => preloadRoute(path)).filter(Boolean);
  return Promise.allSettled(promises);
}

// Auto-initialize
registerRoutePreloaders();