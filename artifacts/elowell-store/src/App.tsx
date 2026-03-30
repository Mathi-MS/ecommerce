import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import OrderHistory from "./pages/orders";
import OrdersDemo from "./pages/orders-demo";

// Import pages
import Home from "./pages/home";
import ProductsIndex from "./pages/products/index";
import ProductDetail from "./pages/products/[id]";
import Cart from "./pages/cart";
import Checkout from "./pages/checkout";
import Auth from "./pages/auth";
import Faq from "./pages/faq";
import OrderSuccess from "./pages/order-success";
import NotFound from "./pages/not-found";

import AdminCoupons from "./pages/admin/coupons";

// Admin pages
import AdminDashboard from "./pages/admin/dashboard";
import AdminProducts from "./pages/admin/products";
import AdminCategories from "./pages/admin/categories";
import AdminBanners from "./pages/admin/banners";
import AdminOrders from "./pages/admin/orders";
import AdminOffers from "./pages/admin/offers";
import AdminFaq from "./pages/admin/faq";
import AdminHomeSections from "./pages/admin/home-sections";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsIndex />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/orders-demo" element={<OrdersDemo />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<Auth />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/home-sections" element={<AdminHomeSections />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/offers" element={<AdminOffers />} />
            <Route path="/admin/faq" element={<AdminFaq />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/referrals" element={<AdminDashboard />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
