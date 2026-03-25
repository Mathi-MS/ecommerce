import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Eye, Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function OrderHistory() {
  const [viewing, setViewing] = useState<any>(null);
  const token = localStorage.getItem("token");
  const authHeaders = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/orders", "user"],
    queryFn: async () => {
      const res = await fetch("/api/orders/user", { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!token,
  });

  if (!token) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground">You need to be signed in to view your order history.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Order History</h1>

        {isLoading ? (
          <div className="text-center py-12">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
            <Button onClick={() => window.location.href = "/products"}>Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const StatusIcon = STATUS_ICONS[order.status] || Package;
              return (
                <div key={order.id} className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Order #{String(order.id).slice(-6).toUpperCase()}</h3>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                          {order.status}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setViewing(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Items</p>
                      <p className="font-medium">{order.items?.length || 0} item(s)</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-bold text-lg">₹{order.total?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment</p>
                      <p className={`font-medium capitalize ${order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                        {order.paymentStatus}
                      </p>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {order.items.slice(0, 4).map((item: any) => (
                        <div key={item.id} className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                          {item.productImage && (
                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[viewing.status] || ""}`}>
                      {viewing.status}
                    </span>
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
                          {item.productImage && (
                            <img src={item.productImage} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0" />
                          )}
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
      </div>
    </AppLayout>
  );
}