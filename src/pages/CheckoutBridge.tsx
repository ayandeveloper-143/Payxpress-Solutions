import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { parseCheckoutBridgeData, storeCheckoutBridgeData } from "@/lib/checkout-bridge";

const CheckoutBridge = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshUser } = useAuth();
    const { toast } = useToast();
    const encodedData = searchParams.get("data");

    useEffect(() => {
        if (!encodedData) {
            toast({
                title: "Missing checkout data",
                description: "The payment handoff link is incomplete.",
                variant: "destructive",
            });
            navigate("/checkout", { replace: true });
            return;
        }

        const payload = parseCheckoutBridgeData(encodedData);

        if (!payload) {
            toast({
                title: "Invalid checkout data",
                description: "The payment handoff link could not be decoded.",
                variant: "destructive",
            });
            navigate("/checkout", { replace: true });
            return;
        }

        storeCheckoutBridgeData(payload);

        const syncAuthAndRedirect = async () => {
            try {
                await refreshUser?.();
            } catch {
                // Keep redirecting to checkout even if auth refresh fails.
            } finally {
                navigate("/checkout", { replace: true });
            }
        };

        syncAuthAndRedirect();
    }, [encodedData, navigate, refreshUser, toast]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">

        </div>
    );
};

export default CheckoutBridge;