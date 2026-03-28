import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, Tag, LogOut, ArrowLeft } from "lucide-react";
import { useSessionStore, useApiOptions } from "@/store/session";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, setUser, token, logout } = useSessionStore();
  const apiOpts = useApiOptions();

  const { data: userData, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), enabled: !!token, retry: false },
    ...apiOpts,
  });

  useEffect(() => {
    if (userData) setUser(userData);
  }, [userData, setUser]);

  useEffect(() => {
    if (!isLoading && (!token || (userData && userData.role !== 'admin'))) {
      setLocation('/admin/login');
    }
  }, [isLoading, token, userData, setLocation]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || user.role !== 'admin') return null;

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Referrals', path: '/admin/referrals', icon: Tag },
  ];

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm">
        <div className="h-20 flex items-center px-6 border-b border-border">
          <span className="font-display font-bold text-xl text-primary">Elowell Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
            Storefront
          </Link>
          <button 
            onClick={() => { logout(); setLocation('/'); }}
            className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-20 bg-card border-b border-border flex items-center px-8 shadow-sm">
          <h1 className="text-2xl font-bold font-display text-foreground">
            {navItems.find(i => i.path === location)?.name || 'Admin Panel'}
          </h1>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
