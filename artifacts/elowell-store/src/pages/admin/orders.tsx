import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListOrders, useUpdateOrderStatus } from "@workspace/api-client-react";
import { useApiOptions } from "@/store/session";
import { Select } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminOrders() {
  const apiOpts = useApiOptions();
  const { data: orders, isLoading } = useListOrders(undefined, apiOpts);
  const updateStatus = useUpdateOrderStatus(apiOpts);
  const queryClient = useQueryClient();

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/orders"] })
    });
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Manage Orders</h2>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
            <tr>
              <th className="p-4 font-medium">Order ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr> : 
             orders?.map(order => (
              <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium">#{order.id}</td>
                <td className="p-4">
                  <div>{order.customerName}</div>
                  <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                </td>
                <td className="p-4 font-bold">${order.total.toFixed(2)}</td>
                <td className="p-4 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <select 
                    className="bg-muted/50 border border-border rounded-lg px-2 py-1 text-sm font-medium"
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updateStatus.isPending}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && !isLoading && (
              <tr><td colSpan={5} className="p-8 text-center">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
