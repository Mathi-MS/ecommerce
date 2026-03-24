import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { useApiOptions } from "@/store/session";
import { Package, ShoppingCart, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const apiOpts = useApiOptions();
  const { data: stats, isLoading } = useGetDashboardStats({ ...apiOpts });

  if (isLoading) return <AdminLayout>Loading stats...</AdminLayout>;
  if (!stats) return <AdminLayout>Error loading stats</AdminLayout>;

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-2xl shadow-sm border-none bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl shadow-sm border-none bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.pendingOrders} pending</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-none bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-none bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{stats.totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
      <div className="bg-card rounded-2xl shadow-sm border-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
            <tr>
              <th className="p-4 font-medium">Order ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats.recentOrders?.map(order => (
              <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium">#{order.id}</td>
                <td className="p-4">{order.customerName}</td>
                <td className="p-4 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4 font-bold">${order.total.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'pending' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!stats.recentOrders || stats.recentOrders.length === 0) && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No recent orders</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
