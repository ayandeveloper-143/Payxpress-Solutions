import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Lock, Receipt, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchBillsHistory, Bill } from "@/lib/api";
import { downloadBillPdf } from "@/lib/download";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { changePassword } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type Tab = "profile" | "security" | "billing";

const AccountPage = () => {
  const { user, isLoggedIn, isAuthLoading } = useAuth();

  if (!isAuthLoading && !isLoggedIn) {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      return <Navigate to="/auth" replace />;
    } else {
      window.dispatchEvent(new CustomEvent("show-login-popup"));
      return null;
    }
  }


  const location = useLocation();
  const navigate = useNavigate();
  // Determine tab from URL
  const getTabFromPath = (pathname: string): Tab => {
    if (pathname.endsWith("/billing")) return "billing";
    if (pathname.endsWith("/security")) return "security";
    return "profile";
  };
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromPath(location.pathname));

  // Sync tab with URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);
  // Bills state for UI
  const [bills, setBills] = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billsError, setBillsError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (invoiceId: string) => {
    setDownloading(invoiceId);
    try {
      await downloadBillPdf(invoiceId);
    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err?.message || "Unable to download invoice.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  // Fetch bills from API
  const fetchBills = useCallback(async () => {
    setBillsLoading(true);
    setBillsError(null);
    try {
      const res = await fetchBillsHistory();
      setBills(res.bills);
    } catch (err: any) {
      setBillsError(err?.message || "Failed to load bills");
      setBills([]);
    } finally {
      setBillsLoading(false);
    }
  }, []);

  // Only fetch bills once when billing tab is first opened
  const [billsFetched, setBillsFetched] = useState(false);
  useEffect(() => {
    if (activeTab === "billing" && !billsFetched) {
      fetchBills();
      setBillsFetched(true);
    }
  }, [activeTab, billsFetched, fetchBills]);

  const [name, setName] = useState(user?.name ?? "");
  const [email] = useState(user?.email ?? "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast({ title: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: err?.message || "Failed to update password", variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile", icon: <User size={16} /> },
    { key: "security", label: "Security", icon: <Lock size={16} /> },
    { key: "billing", label: "Billing", icon: <Receipt size={16} /> },
  ];

  const initials = name
    .trim()
    .split(/\s+/)
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main className="container-main pt-28 pb-16 space-y-10">
        <ScrollReveal className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">My Account</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Account Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your profile, security and billing information.</p>
        </ScrollReveal>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <ScrollReveal className="lg:col-span-1 space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6">
              <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-2xl font-bold select-none">
                {initials.trim() || <User size={32} />}
              </div>
              <div className="text-center min-w-0 w-full">
                <p className="font-semibold text-foreground truncate">{user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
              </div>
            </div>

            {/* Tab Nav */}
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    // Update URL on tab click
                    if (tab.key === "profile") {
                      navigate("/account");
                    } else {
                      navigate(`/account/${tab.key}`);
                    }
                  }}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors text-left ${activeTab === tab.key
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </ScrollReveal>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Section */}
            {activeTab === "profile" && (
              <ScrollReveal className="rounded-2xl border bg-card p-6 space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                    <User size={18} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Profile Information</h2>
                    <p className="text-xs text-muted-foreground">Update your name and email address.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all">
                    Save Changes
                  </Button>
                </div>
              </ScrollReveal>
            )}

            {/* Security Section */}
            {activeTab === "security" && (
              <ScrollReveal className="rounded-2xl border bg-card p-6 space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                    <Lock size={18} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Change Password</h2>
                    <p className="text-xs text-muted-foreground">Keep your account secure with a strong password.</p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showCurrent ? "Hide password" : "Show password"}
                      >
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showNew ? "Hide password" : "Show password"}
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all" disabled={passwordLoading}>
                      {passwordLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </ScrollReveal>
            )}

            {/* Billing Section */}
            {activeTab === "billing" && (
              <ScrollReveal className="rounded-2xl border bg-card p-6 space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                    <Receipt size={18} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Bills History</h2>
                    <p className="text-xs text-muted-foreground">View and download your past invoices.</p>
                  </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice No.</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {billsLoading
                        ? Array.from({ length: 3 }).map((_, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-6" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
                            <td className="px-4 py-3 text-right"><Skeleton className="h-7 w-20" /></td>
                          </tr>
                        ))
                        : bills.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-10">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                  <Receipt size={32} className="text-muted-foreground" />
                                </div>
                                <div className="font-semibold text-foreground">No bills found</div>
                                <div className="text-xs text-muted-foreground">You have not made any purchases yet.</div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          bills.map((bill, idx) => (
                            <tr key={bill.orderId} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-foreground">{bill.invoiceNo}</td>
                              <td className="px-4 py-3 font-semibold text-foreground">₹{bill.amount}</td>
                              <td className="px-4 py-3 text-muted-foreground">{new Date(bill.date).toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">Paid</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  type="button"
                                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                                  isLoading={downloading === bill.invoiceNo}
                                  disabled={downloading === bill.invoiceNo}
                                  onClick={() => handleDownload(bill.invoiceNo)}
                                >
                                  Download
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {billsLoading
                    ? Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="rounded-xl border bg-background p-4 space-y-3">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-7 w-20" />
                      </div>
                    ))
                    : bills.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <Receipt size={32} className="text-muted-foreground" />
                        </div>
                        <div className="font-semibold text-foreground">No bills found</div>
                        <div className="text-xs text-muted-foreground">You have not made any purchases yet.</div>
                      </div>
                    ) : (
                      bills.map((bill) => (
                        <div key={bill.orderId} className="rounded-xl border bg-background p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-foreground text-sm">{bill.invoiceNo}</p>
                              <p className="text-xs text-muted-foreground">{new Date(bill.date).toLocaleString()}</p>
                            </div>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">Paid</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-base font-semibold text-foreground">₹{bill.amount}</p>
                            </div>
                            <Button
                              type="button"
                              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                              isLoading={downloading === bill.invoiceNo}
                              disabled={downloading === bill.invoiceNo}
                              onClick={() => handleDownload(bill.invoiceNo)}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                </div>
                {billsError && <div className="text-red-500 text-sm pt-2">{billsError}</div>}
              </ScrollReveal>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountPage;
