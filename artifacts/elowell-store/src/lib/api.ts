// Simple API client to replace workspace dependency
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  isVerified: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
}

export interface Order {
  id: string;
  status: string;
  total: number;
  items: CartItem[];
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
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

// Mock hooks for development (replace with actual API calls)
export const useGetMe = () => ({ data: null, isLoading: false });
export const useGetCart = () => ({ data: null, isLoading: false });
export const useListOffers = () => ({ data: [], isLoading: false });
export const useAddToCart = () => ({ mutate: () => {} });
export const useListProducts = () => ({ data: [], isLoading: false });
export const useGetDashboardStats = () => ({ data: null, isLoading: false });
export const useListFaq = () => ({ data: [], isLoading: false });
export const useCreateFaqItem = () => ({ mutate: () => {} });
export const useCreateOffer = () => ({ mutate: () => {} });
export const useUpdateOffer = () => ({ mutate: () => {} });
export const useDeleteOffer = () => ({ mutate: () => {} });
export const useUpdateOrderStatus = () => ({ mutate: () => {} });
export const useUpdateCartItem = () => ({ mutate: () => {} });
export const useRemoveCartItem = () => ({ mutate: () => {} });
export const useValidateReferralCode = () => ({ mutate: () => {} });
export const useCreateOrder = () => ({ mutate: () => {} });
export const useListCategories = () => ({ data: [], isLoading: false });
export const useGetProduct = () => ({ data: null, isLoading: false });
export const useGetProductReviews = () => ({ data: [], isLoading: false });