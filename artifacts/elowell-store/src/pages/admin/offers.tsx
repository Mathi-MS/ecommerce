import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminOffers() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Offers Management</h1>
          <p className="text-muted-foreground">Manage promotional banners and offers</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Offers management is not available in the current API version.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
