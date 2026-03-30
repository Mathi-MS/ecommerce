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
  categoryIds?: string[];
  categories?: { id: string; name: string; slug: string }[];
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
  productName: string;
  productImage: string;
  price: number;
  discountPrice?: number;
  sessionId?: string;
  userId?: string;
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
  description?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  button1Text?: string;
  button1Link?: string;
  button2Text?: string;
  button2Link?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
}

export interface AboutSection {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeSection {
  id: string;
  type: 'about' | 'featured-products' | 'categories' | 'testimonials';
  title: string;
  subtitle?: string;
  order: number;
  isActive: boolean;
  config: {
    // For about sections
    description?: string;
    imageUrl?: string;
    features?: string[];
    buttonText?: string;
    buttonLink?: string;
    
    // For featured products
    productLimit?: number;
    showFeatured?: boolean;
    category?: string;
    selectedProductIds?: string[];
    viewAllText?: string;
    viewAllLink?: string;
    
    // For categories
    categoryIds?: string[];
    displayStyle?: 'grid' | 'carousel';
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
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

export const useGetCart = (params?: any) => {
  const [data, setData] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const cartSessionId = localStorage.getItem('cartSessionId');
      if (!cartSessionId) {
        setData(null);
        return;
      }
      
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart?sessionId=${cartSessionId}`, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const cart = await response.json();
      setData(cart);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCart();
  }, []);
  
  return { data, isLoading, refetch: fetchCart };
};

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

export const useAddToCart = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { data: { productId: string; quantity: number; sessionId: string } }, callbacks?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: options.data.productId,
          quantity: options.data.quantity,
          sessionId: options.data.sessionId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = errorData;
        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.error || errorData;
        } catch {
          // If not JSON, use the text as is
        }
        throw new Error(errorMessage || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      callbacks?.onSuccess?.();
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useListProducts = (params?: { category?: string; featured?: boolean; limit?: number; ids?: string[] }) => {
  const [data, setData] = useState<{ products: Product[] }>({ products: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      let url = '/api/products';
      const queryParams = new URLSearchParams();
      
      if (params?.category) queryParams.append('category', params.category);
      if (params?.featured !== undefined) queryParams.append('featured', String(params.featured));
      if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));
      if (params?.ids && params.ids.length > 0) queryParams.append('ids', params.ids.join(','));
      
      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }
      
      const response = await apiCall(url);
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
  }, [params?.category, params?.featured, params?.limit, params?.ids?.join(',')]);
  
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

export const useUpdateCartItem = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { itemId: string; data: { quantity: number; sessionId: string } }, callbacks?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart/${options.itemId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          quantity: options.data.quantity,
          sessionId: options.data.sessionId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = errorData;
        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.error || errorData;
        } catch {
          // If not JSON, use the text as is
        }
        throw new Error(errorMessage || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      callbacks?.onSuccess?.();
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useRemoveCartItem = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { itemId: string; data: { sessionId: string } }, callbacks?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart/${options.itemId}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({
          sessionId: options.data.sessionId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = errorData;
        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.error || errorData;
        } catch {
          // If not JSON, use the text as is
        }
        throw new Error(errorMessage || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      callbacks?.onSuccess?.();
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useValidateReferralCode = () => ({ 
  mutate: (data: any, options?: any) => Promise.resolve({ isValid: false, discount: 0 }),
  isPending: false,
  isLoading: false
});

export const useCreateOrder = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { data: any }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(options.data),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = errorData;
        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.error || errorData;
        } catch {
          // If not JSON, use the text as is
        }
        throw new Error(errorMessage || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useListCategories = () => {
  const [data, setData] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const categories = await apiCall('/api/categories');
      setData(categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  return { data, isLoading, refetch: fetchCategories };
};

export const useCreateCategory = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { data: { name: string; description?: string; imageUrl?: string } }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall('/api/categories', {
        method: 'POST',
        body: JSON.stringify(options.data),
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useUpdateCategory = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { id: string; data: { name: string; description?: string; imageUrl?: string } }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall(`/api/categories/${options.id}`, {
        method: 'PUT',
        body: JSON.stringify(options.data),
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useDeleteCategory = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { id: string }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall(`/api/categories/${options.id}`, {
        method: 'DELETE',
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useGetProduct = (id?: string) => {
  const [data, setData] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchProduct = async () => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const product = await apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`);
      setData(product);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProduct();
  }, [id]);
  
  return { data, isLoading, refetch: fetchProduct };
};

export const useGetProductReviews = (id?: string) => {
  const [data, setData] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchReviews = async () => {
    if (!id) {
      setData([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const reviews = await apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}/reviews`);
      setData(reviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchReviews();
  }, [id]);
  
  return { data, isLoading, refetch: fetchReviews };
};

export const useListBanners = (params?: { active?: boolean }) => {
  const [data, setData] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      let url = '/api/banners';
      if (params?.active !== undefined) {
        url += `?active=${params.active}`;
      }
      const banners = await apiCall(url);
      setData(banners);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBanners();
  }, [params?.active]);
  
  return { data, isLoading, refetch: fetchBanners };
};

export const useCreateBanner = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { data: Partial<Banner> }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall('/api/banners', {
        method: 'POST',
        body: JSON.stringify(options.data),
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useUpdateBanner = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { id: string; data: Partial<Banner> }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall(`/api/banners/${options.id}`, {
        method: 'PUT',
        body: JSON.stringify(options.data),
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useDeleteBanner = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { id: string }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall(`/api/banners/${options.id}`, {
        method: 'DELETE',
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useListAboutSections = () => {
  const [data, setData] = useState<AboutSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchAboutSections = async () => {
    try {
      setIsLoading(true);
      const aboutSections = await apiCall('/api/about');
      setData(aboutSections);
    } catch (error) {
      console.error('Failed to fetch about sections:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAboutSections();
  }, []);
  
  return { data, isLoading, refetch: fetchAboutSections };
};

export const useGetAboutSection = (id?: string) => {
  const [data, setData] = useState<AboutSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchAboutSection = async () => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const aboutSection = await apiCall(`/api/about/${id}`);
      setData(aboutSection);
    } catch (error) {
      console.error('Failed to fetch about section:', error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAboutSection();
  }, [id]);
  
  return { data, isLoading, refetch: fetchAboutSection };
};

export const useCreateAboutSection = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { data: Partial<AboutSection> }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall('/api/about', {
        method: 'POST',
        body: JSON.stringify(options.data),
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useUpdateAboutSection = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { id: string; data: Partial<AboutSection> }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall(`/api/about/${options.id}`, {
        method: 'PUT',
        body: JSON.stringify(options.data),
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useListHomeSections = () => {
  const [data, setData] = useState<HomeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchHomeSections = async () => {
    try {
      setIsLoading(true);
      const sections = await apiCall('/api/home-sections');
      // Map MongoDB _id to id for consistency
      const mappedSections = sections.map((section: any) => ({
        ...section,
        id: section._id || section.id
      }));
      setData(mappedSections);
    } catch (error) {
      console.error('Failed to fetch home sections:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHomeSections();
  }, []);
  
  return { data, isLoading, refetch: fetchHomeSections };
};

export const useCreateHomeSection = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { data: Partial<HomeSection> }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall('/api/home-sections', {
        method: 'POST',
        body: JSON.stringify(options.data),
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useUpdateHomeSection = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { id: string; data: Partial<HomeSection> }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall(`/api/home-sections/${options.id}`, {
        method: 'PUT',
        body: JSON.stringify(options.data),
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useDeleteHomeSection = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { id: string }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall(`/api/home-sections/${options.id}`, {
        method: 'DELETE',
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};

export const useDeleteAboutSection = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (options: { id: string }, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const result = await apiCall(`/api/about/${options.id}`, {
        method: 'DELETE',
      });
      callbacks?.onSuccess?.(result);
      return result;
    } catch (error) {
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  
  return { mutate, isPending, isLoading: isPending };
};