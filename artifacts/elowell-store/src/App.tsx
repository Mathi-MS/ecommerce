import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { PageRouteLoader, AdminRouteLoader } from "@/components/RouteLoader";

// Lazy load public pages
const Home = lazy(() => import("./pages/home"));
const ProductsIndex = lazy(() => import("./pages/products/index"));
const ProductDetail = lazy(() => import("./pages/products/[id]"));
const Cart = lazy(() => import("./pages/cart"));
const Checkout = lazy(() => import("./pages/checkout"));
const Auth = lazy(() => import("./pages/auth"));
const Faq = lazy(() => import("./pages/faq"));
const OrderSuccess = lazy(() => import("./pages/order-success"));
const NotFound = lazy(() => import("./pages/not-found"));
const OrderHistory = lazy(() => import("./pages/orders"));
const OrdersDemo = lazy(() => import("./pages/orders-demo"));

// Lazy load admin pages (separate chunks)
const AdminDashboard = lazy(() => import("./pages/admin/dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/products"));
const AdminCategories = lazy(() => import("./pages/admin/categories"));
const AdminBanners = lazy(() => import("./pages/admin/banners"));
const AdminOrders = lazy(() => import("./pages/admin/orders"));
const AdminOffers = lazy(() => import("./pages/admin/offers"));
const AdminFaq = lazy(() => import("./pages/admin/faq"));
const AdminHomeSections = lazy(() => import("./pages/admin/home-sections"));
const AdminCoupons = lazy(() => import("./pages/admin/coupons"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Route wrapper components for different loading states
function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageRouteLoader />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<AdminRouteLoader />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
            <Route path="/products" element={<PublicRoute><ProductsIndex /></PublicRoute>} />
            <Route path="/products/:id" element={<PublicRoute><ProductDetail /></PublicRoute>} />
            <Route path="/cart" element={<PublicRoute><Cart /></PublicRoute>} />
            <Route path="/checkout" element={<PublicRoute><Checkout /></PublicRoute>} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/faq" element={<PublicRoute><Faq /></PublicRoute>} />
            <Route path="/order-success" element={<PublicRoute><OrderSuccess /></PublicRoute>} />
            <Route path="/orders" element={<PublicRoute><OrderHistory /></PublicRoute>} />
            <Route path="/orders-demo" element={<PublicRoute><OrdersDemo /></PublicRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
            <Route path="/admin/banners" element={<AdminRoute><AdminBanners /></AdminRoute>} />
            <Route path="/admin/home-sections" element={<AdminRoute><AdminHomeSections /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/offers" element={<AdminRoute><AdminOffers /></AdminRoute>} />
            <Route path="/admin/faq" element={<AdminRoute><AdminFaq /></AdminRoute>} />
            <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
            <Route path="/admin/referrals" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            {/* 404 Route */}
            <Route path="*" element={<PublicRoute><NotFound /></PublicRoute>} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
