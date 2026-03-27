import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ApiRequestError } from "@/lib/api";
import { Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onToggleForm?: () => void;
  onShowSignup?: () => void;
  onShowForgot?: () => void;
}

const LoginForm = ({ onSuccess, onToggleForm, onShowSignup, onShowForgot }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      form.clearErrors();
      await login(values.email, values.password);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      onSuccess?.();
    } catch (error) {
      let hasFieldError = false;

      if (error instanceof ApiRequestError) {
        if (error.field === "email") {
          form.setError("email", { type: "server", message: error.message });
          hasFieldError = true;
        }

        if (error.field === "password") {
          form.setError("password", { type: "server", message: error.message });
          hasFieldError = true;
        }

        if (error.errors) {
          const emailError = error.errors.email?.[0];
          const passwordError = error.errors.password?.[0];

          if (emailError) {
            form.setError("email", { type: "server", message: emailError });
          }

          if (passwordError) {
            form.setError("password", { type: "server", message: passwordError });
          }

          if (emailError || passwordError) {
            hasFieldError = true;
          }
        }
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed",
        variant: "destructive",
      });

      if (hasFieldError) {
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 space-y-3 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Lock size={18} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground text-sm">Sign in to continue to your account</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Login
            </Button>
          </form>
        </Form>

        <div className="mt-6 space-y-3 text-center text-sm">
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              className="font-medium text-accent hover:underline"
              onClick={onShowSignup ?? onToggleForm}
            >
              Sign up
            </button>
          </p>
          <button
            type="button"
            className="font-medium text-accent hover:underline"
            onClick={onShowForgot ?? onToggleForm}
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
