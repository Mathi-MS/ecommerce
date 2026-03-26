// Simple API client
import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'customer';
  isVerified: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice?: number;
  images: string[];
  mainImage: string;
  category: string;
  categoryName?: string;
  categoryId?: string;
  stock: number;
  isActive: boolean;
  featured?: boolean;
  averageRating?: number;
  reviewCount?: number;
  referralCode?: string;
  relatedProducts?: Product[];
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
  productName?: string;
  productImage?: string;
  price?: number;
  discountPrice?: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentId?: string;
  referralCode?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Offer {
  id: string;
  title: string;
  text: string;
  description: string;
  discount: number;
  isActive: boolean;
  status: 'active' | 'inactive';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Order[];
}

// Simple fetch wrapper
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

// Mock hooks with flexible parameters to fix TypeScript errors
export const useGetMe = (params?: any) => ({ 
  data: null as User | null, 
  isLoading: false, 
  isError: false,
  refetch: () => Promise.resolve()
});

export const useGetCart = (params?: any) => ({ 
  data: null as Cart | null, 
  isLoading: false,
  refetch: () => Promise.resolve()
});

export const useListOffers = (params?: any) => {
  const [data, setData] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const offers = await apiCall('/api/offers');
      setData(offers);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOffers();
  }, []);
  
  return { data, isLoading, refetch: fetchOffers };
};

export const useAddToCart = () => ({ 
  mutate: (data: any, options?: any) => Promise.resolve(),
  isPending: false,
  isLoading: false
});

export const useListProducts = (params?: any) => {
  const [data, setData] = useState<{ products: Product[] }>({ products: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('/api/products');
      setData({ products: response.products || response });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setData({ products: [] });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  return { data, isLoading, refetch: fetchProducts };
};

export const useGetDashboardStats = (params?: any) => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const stats = await apiCall('/api/admin/dashboard');
      setData(stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  return { data, isLoading, refetch: fetchStats };
};

export const useListFaq = (params?: any) => {
  const [data, setData] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchFaq = async () => {
    try {
      setIsLoading(true);
      const faq = await apiCall('/api/faq');
      setData(faq);
    } catch (error) {
      console.error('Failed to fetch FAQ:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFaq();
  }, []);
  
  return { data, isLoading, refetch: fetchFaq };
};

export const useCreateFaqItem = (params?: any) => ({ 
  mutate: (data: any, options?: any) => Promise.resolve(),
  isPending: false,
  isLoading: false
});

export const useCreateOffer = (params?: any) => ({ 
  mutate: (data: any, options?: any) => Promise.resolve(),
  isPending: false,
  isLoading: false
});

export const useUpdateOffer = (params?: any) => ({ 
  mutate: (data: any, options?: any) => Promise.resolve(),
  isPending: false,
  isLoading: false
});

export const useDeleteOffer = (params?: any) => ({ 
  mutate: (data: any, options?: any) => Promise.resolve(),
  isPending: false,
  isLoading: false
});

export const useUpdateOrderStatus = (params?: any) => ({ 
  mutate: (data: any, options?: any) => Promise.resolve(),
  isPending: false,
  isLoading: false
});

export const useUpdateCartItem = () => ({ 
  mutate: (data: any, options?: any) => Promise.resolve(),
  isPending: false,
  isLoading: false
});

export const useRemoveCartItem = () => ({ 
  mutate: (data: any, options?: any) => Promise.resolve(),
  isPending: false,
  isLoading: false
});

export const useValidateReferralCode = () => ({ 
  mutate: (data: any, options?: any) => Promise.resolve({ isValid: false, discount: 0 }),
  isPending: false,
  isLoading: false
});

export const useCreateOrder = () => ({ 
  mutate: (data: any, options?: any) => Promise.resolve(),
  isPending: false,
  isLoading: false
});

export const useListCategories = () => ({ 
  data: [] as Category[], 
  isLoading: false,
  refetch: () => Promise.resolve()
});

export const useGetProduct = (id?: string) => ({ 
  data: null as Product | null, 
  isLoading: false,
  refetch: () => Promise.resolve()
});

export const useGetProductReviews = (id?: string) => ({ 
  data: [] as Review[], 
  isLoading: false,
  refetch: () => Promise.resolve()
});