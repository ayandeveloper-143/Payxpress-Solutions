import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

type FormType = "login" | "signup" | "forgot";

const Auth = () => {
  const [formType, setFormType] = useState<FormType>("login");
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const handleSuccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main className="container-main pt-24 pb-12 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div key={formType} className="auth-form-enter">
            {formType === "login" && (
              <LoginForm
                onSuccess={handleSuccess}
                onShowSignup={() => setFormType("signup")}
                onShowForgot={() => setFormType("forgot")}
              />
            )}
            {formType === "signup" && (
              <SignupForm
                onSuccess={handleSuccess}
                onToggleForm={() => setFormType("login")}
              />
            )}
            {formType === "forgot" && (
              <ForgotPasswordForm
                onSuccess={() => setFormType("login")}
                onToggleForm={() => setFormType("login")}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
