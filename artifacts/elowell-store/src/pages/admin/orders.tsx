import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useUpdateOrderStatus } from "@/lib/api";
import { useApiOptions } from "@/store/session";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Search, X, Package, Clock, Truck, CheckCircle, XCircle, RefreshCw } from "lucide-react";

const STATUSES = ["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_META = [
  { key: "all",        label: "All Orders",  icon: Package,     active: "bg-foreground text-background" },
  { key: "pending",    label: "Pending",     icon: Clock,       active: "bg-yellow-500 text-white" },
  { key: "processing", label: "Processing",  icon: RefreshCw,   active: "bg-blue-500 text-white" },
  { key: "shipped",    label: "Shipped",     icon: Truck,       active: "bg-purple-500 text-white" },
  { key: "delivered",  label: "Delivered",   icon: CheckCircle, active: "bg-green-500 text-white" },
  { key: "cancelled",  label: "Cancelled",   icon: XCircle,     active: "bg-red-500 text-white" },
] as const;

function useDebounce(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AdminOrders() {
  const apiOpts = useApiOptions();
  const updateStatus = useUpdateOrderStatus(apiOpts);
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");
  const authHeaders = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewing, setViewing] = useState<any>(null);

  const debouncedSearch = useDebounce(search);

  const queryKey = ["/api/orders", { status: statusFilter, search: debouncedSearch }];

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/orders?${params.toString()}`, { headers: authHeaders });
      return res.json();
    },
  });

  // counts per status for pills — fetched separately without filters
  const { data: allOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders", "counts"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { headers: authHeaders });
      return res.json();
    },
  });

  const countFor = (s: string) => s === "all"
    ? allOrders.length
    : allOrders.filter((o: any) => o.status === s).length;

  const handleStatusChange = (id: any, status: string) => {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        if (viewing && String(viewing.id) === String(id)) setViewing((v: any) => ({ ...v, status }));
      }
    });
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("all"); };
  const hasFilters = search || statusFilter !== "all";

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Manage Orders</h2>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_META.map(({ key, label, icon: Icon, active }) => {
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                  isActive ? `${active} border-transparent shadow-md` : "bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-inherit" : "bg-muted text-muted-foreground"
                }`}>{countFor(key)}</span>
              </button>
            );
          })}
        </div>

        {hasFilters && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Showing <strong className="text-foreground">{orders.length}</strong> orders</span>
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-primary hover:underline">
              <X className="h-3 w-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!viewing} onOpenChange={o => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{String(viewing.id).slice(-6).toUpperCase()}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <select
                    className="bg-muted/50 border border-border rounded-lg px-2 py-1 text-sm font-medium"
                    value={viewing.status}
                    onChange={e => handleStatusChange(viewing.id, e.target.value)}
                    disabled={updateStatus.isPending}
                  >
                    {STATUSES.filter(s => s !== "all").map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[viewing.status] || ""}`}>
                    {viewing.status}
                  </span>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold mb-1">Customer Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name</span><p className="font-medium">{viewing.customerName}</p></div>
                    <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{viewing.customerPhone || "—"}</p></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Email</span><p className="font-medium">{viewing.customerEmail}</p></div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 space-y-1">
                  <p className="text-sm font-semibold mb-1">Delivery Address</p>
                  <p className="text-sm">{viewing.address}</p>
                  <p className="text-sm">{viewing.city}, {viewing.state} — {viewing.pincode}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Products Ordered</p>
                  <div className="space-y-2">
                    {viewing.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                        {item.productImage && <img src={item.productImage} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.price?.toFixed(2)}</p>
                        </div>
                        <p className="text-sm font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                  <p className="font-semibold mb-1">Payment Summary</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{viewing.subtotal?.toFixed(2)}</span></div>
                  {viewing.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount {viewing.referralCode && `(${viewing.referralCode})`}</span>
                      <span>− ₹{viewing.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                    <span>Total</span><span>₹{viewing.total?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Payment</span>
                    <span className={`font-medium capitalize ${viewing.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                      {viewing.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-sm border-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-muted-foreground text-sm border-b border-border">
            <tr>
              <th className="p-4 font-medium">Order ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Phone</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={7} className="p-8 text-center">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No orders found.</td></tr>
            ) : orders.map((order: any) => (
              <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium text-sm">#{String(order.id).slice(-6).toUpperCase()}</td>
                <td className="p-4">
                  <div className="font-medium text-sm">{order.customerName}</div>
                  <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                </td>
                <td className="p-4 text-sm">{order.customerPhone || "—"}</td>
                <td className="p-4 font-bold text-sm">₹{order.total?.toFixed(2)}</td>
                <td className="p-4 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="icon" onClick={() => setViewing(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
