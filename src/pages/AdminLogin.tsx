import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ShieldCheck } from "lucide-react";

const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AdminLogin = () => {
    const { login, isAdminLoggedIn } = useAdminAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    if (isAdminLoggedIn) {
        navigate("/admin", { replace: true });
        return null;
    }

    const onSubmit = async (values: LoginFormValues) => {
        setError(null);
        setIsLoading(true);
        try {
            await login(values.username, values.password);
            navigate("/admin", { replace: true });
        } catch (err) {
            if (err instanceof ApiRequestError) {
                setError(err.message);
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-background">

            <main className="container-main pt-12 pb-12 min-h-[calc(100vh-64px)] flex items-center justify-center">
                <div className="w-full max-w-md">
                    <div className="auth-form-enter">
                        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
                            <div className="mb-6 space-y-3 text-center">
                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                                    <ShieldCheck size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold tracking-tight">Admin Login</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Access is restricted to authorised administrators only.
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Username</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        autoComplete="username"
                                                        placeholder="Admin username"
                                                        disabled={isLoading}
                                                    />
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
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        autoComplete="current-password"
                                                        placeholder="••••••••"
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Signing in…" : "Sign In"}
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
};

export default AdminLogin;
