import React, { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/store/session";

declare global {
  interface Window {
    google: any;
    handleGoogleSignIn: (response: any) => void;
  }
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser, setToken } = useSessionStore();
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Get redirect URL from query params or default based on role
  const getRedirectUrl = (userRole: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get('redirect');
    
    if (redirectTo) {
      return decodeURIComponent(redirectTo);
    }
    
    return userRole === 'admin' ? '/admin/dashboard' : '/';
  };

  // Initialize Google Sign-In
  React.useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      if (window.google) {
        initializeGoogle();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google) {
        initializeGoogle();
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup to avoid re-loading
    };
  }, []);

  const initializeGoogle = () => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID not configured');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      setGoogleLoaded(true);
    } catch (error) {
      console.error('Google Sign-In initialization failed:', error);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    try {
      setLoading(true);
      console.log('Google response received:', { hasCredential: !!response.credential });
      
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google-signin`;
      console.log('Making request to:', apiUrl);
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        toast({ title: "Success", description: "Signed in successfully" });
        
        // Redirect based on user role or intended page
        const redirectUrl = getRedirectUrl(data.user.role);
        setLocation(redirectUrl);
      } else {
        console.error('Login failed:', data);
        toast({ title: "Error", description: data.error || 'Login failed', variant: "destructive" });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({ title: "Error", description: "Google sign-in failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Render Google button when loaded
  React.useEffect(() => {
    if (googleLoaded && window.google) {
      const element = document.getElementById('google-signin-button');
      if (element && !element.hasChildNodes()) {
        try {
          window.google.accounts.id.renderButton(element, {
            theme: 'outline',
            size: 'large',
            width: element.offsetWidth || 300,
            text: 'signin_with',
            shape: 'rectangular'
          });
        } catch (error) {
          console.error('Failed to render Google button:', error);
        }
      }
    }
  }, [googleLoaded]);





  return (
    <AppLayout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to Elowell</CardTitle>
            <CardDescription>Sign in with your Google account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div id="google-signin-button" className="w-full min-h-[40px] flex items-center justify-center">
              {!googleLoaded && (
                <div className="w-full h-10 bg-muted animate-pulse rounded-md flex items-center justify-center text-sm text-muted-foreground">
                  Loading Google Sign-In...
                </div>
              )}
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}