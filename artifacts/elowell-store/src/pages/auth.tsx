import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useSessionStore } from "@/store/session";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const { setToken, setUser } = useSessionStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate({ data: { email, password } }, {
        onSuccess: (res) => {
          setToken(res.token);
          setUser(res.user);
          toast({ title: "Welcome back!" });
          if(res.user.role === 'admin') setLocation('/admin/dashboard');
          else setLocation('/');
        },
        onError: () => toast({ title: "Login failed", description: "Check your credentials.", variant: "destructive" })
      });
    } else {
      registerMutation.mutate({ data: { email, password, name } }, {
        onSuccess: (res) => {
          setToken(res.token);
          setUser(res.user);
          toast({ title: "Account created!" });
          setLocation('/');
        },
        onError: () => toast({ title: "Registration failed", variant: "destructive" })
      });
    }
  };

  return (
    <AppLayout>
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card p-8 rounded-3xl border border-border/50 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] -z-10"></div>
          
          <h1 className="text-3xl font-bold font-display mb-2">{isLogin ? 'Welcome Back' : 'Join Elowell'}</h1>
          <p className="text-muted-foreground mb-8">{isLogin ? 'Sign in to access your orders.' : 'Create an account to track orders and save.'}</p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="h-12 rounded-xl" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 rounded-xl" />
            </div>
            
            <Button 
              type="submit" 
              disabled={loginMutation.isPending || registerMutation.isPending}
              className="w-full h-14 rounded-xl text-lg shadow-md mt-4"
            >
              {loginMutation.isPending || registerMutation.isPending ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-primary hover:underline">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
