import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

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

// Admin pages
import AdminDashboard from "./pages/admin/dashboard";
import AdminProducts from "./pages/admin/products";
import AdminOrders from "./pages/admin/orders";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={ProductsIndex} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/auth" component={Auth} />
      <Route path="/faq" component={Faq} />
      <Route path="/order-success" component={OrderSuccess} />
      
      {/* Admin routes */}
      <Route path="/admin">
        {() => { window.location.replace("/admin/login"); return null; }}
      </Route>
      <Route path="/admin/login" component={Auth} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/referrals" component={AdminDashboard} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
