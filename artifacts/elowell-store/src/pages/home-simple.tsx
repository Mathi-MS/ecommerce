import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Ecommerce Orders Demo</h1>
        <p className="text-gray-600 mb-8">
          This demo showcases the orders API integration with your backend.
        </p>
        
        <div className="space-y-4">
          <Link href="/orders-demo">
            <a className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
              View Orders Demo
            </a>
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>Features:</p>
            <ul className="mt-2 space-y-1">
              <li>• View all orders (Admin)</li>
              <li>• View user orders</li>
              <li>• Create test orders</li>
              <li>• Update order status</li>
              <li>• Filter and search orders</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Make sure your backend is running and the API URL is configured in your environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}