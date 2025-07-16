import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { User, Mail, Loader2, CheckCircle, XCircle, AlertTriangle, Calendar, BadgeCheck, X } from "lucide-react";
import ReactDOM from "react-dom";

export default function AdminProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [cancellation, setCancellation] = useState<{ status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showChangeModal, setShowChangeModal] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/admin/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        });
        setProfile(res.data);
        try {
          const cancelRes = await api.get("/admin/cancellation-request-status", {
            headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
          });
          setCancellation(cancelRes.data);
        } catch {
          setCancellation(null);
        }
      } catch (err: any) {
        setError("Failed to load profile info");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [open]);

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleCancelSubscription = async () => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post(
        "/admin/request-cancellation",
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }
      );
      setSuccess("Cancellation request submitted and pending review.");
      setCancellation({ status: "pending" });
      setShowModal(false);
    } catch (err: any) {
      setError("Failed to submit cancellation request");
    } finally {
      setActionLoading(false);
    }
  };

  // Change Subscription Modal
  function ChangeSubscriptionModal({ currentPlanId, onClose, onSuccess }: { currentPlanId: number, onClose: () => void, onSuccess: () => void }) {
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
      const fetchPlans = async () => {
        setLoading(true);
        setError("");
        try {
          const res = await api.get("/admin/subscription-plans", {
            headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
          });
          setPlans(res.data.filter((p: any) => p.id !== currentPlanId));
        } catch {
          setError("Failed to load plans");
        } finally {
          setLoading(false);
        }
      };
      fetchPlans();
    }, [currentPlanId]);
    const handleSubmit = async () => {
      if (!selectedPlan) return;
      setSubmitting(true);
      setError("");
      try {
        await api.post(
          "/admin/change-plan-request",
          { newPlanId: selectedPlan },
          { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }
        );
        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to submit request");
      } finally {
        setSubmitting(false);
      }
    };
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1100]">
        <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Change Subscription</h3>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-yellow-400 mx-auto my-8" />
          ) : error ? (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          ) : (
            <>
              <div className="mb-4">
                <div>
                  {plans.map((plan) => (
                    <label key={plan.id} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-white/10 ${selectedPlan === plan.id ? 'bg-violet-600/20' : ''}`}>
                      <input type="radio" name="plan" value={plan.id} checked={selectedPlan === plan.id} onChange={() => setSelectedPlan(plan.id)} className="form-radio text-violet-600" />
                      <span className="text-white font-medium">{plan.name}</span>
                      <span className="text-gray-400 ml-2">₹{plan.price} / {plan.duration_days === 30 ? 'month' : plan.duration_days === 365 ? 'year' : plan.duration_days + ' days'}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedPlan || submitting}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm Change
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="flex-1 text-gray-400 hover:text-white"
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!open) return null;

  const admin = profile;
  const subscription = profile?.subscription;
  const plan = subscription?.plan;

  // Modal content
  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 w-full max-w-md flex flex-col items-center shadow-xl">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-300 hover:text-white focus:outline-none"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400 my-12" />
        ) : (
          <>
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-yellow-400">
                {admin ? getInitials(admin.name) : "A"}
              </span>
            </div>
            {/* Admin Info */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-white font-semibold text-lg">{admin?.name}</span>
              </div>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">{admin?.email}</span>
              </div>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <BadgeCheck className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 capitalize">{admin?.status}</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Joined {admin?.created_at ? new Date(admin.created_at).toLocaleDateString() : "-"}</span>
              </div>
            </div>
            {/* Subscription Card */}
            <div className="w-full bg-white/5 rounded-lg p-5 border border-white/10 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Plan</span>
                <span className="text-white font-medium">{plan?.name || "-"}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Price</span>
                <span className="text-white font-medium">₹{plan?.price?.toLocaleString() || "-"} / {plan?.duration_days === 30 ? "month" : plan?.duration_days === 365 ? "year" : plan?.duration_days + " days"}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Status</span>
                <span className="text-white font-medium capitalize">{subscription?.status || "-"}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Monthly Fee</span>
                <span className="text-white font-medium">₹{subscription?.monthly_fee?.toLocaleString() || "-"}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Next Payment</span>
                <span className="text-white font-medium">{subscription?.next_payment_date ? new Date(subscription.next_payment_date).toLocaleDateString() : "-"}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Trial Ends</span>
                <span className="text-white font-medium">{subscription?.trial_end_date ? new Date(subscription.trial_end_date).toLocaleDateString() : "-"}</span>
              </div>
              {plan?.features && (
                <div className="mt-3">
                  <span className="text-gray-400 text-sm">Features:</span>
                  <ul className="list-disc list-inside text-gray-200 text-sm mt-1">
                    {Array.isArray(plan.features)
                      ? plan.features.map((f: string, i: number) => <li key={i}>{f}</li>)
                      : typeof plan.features === "string"
                      ? JSON.parse(plan.features).map((f: string, i: number) => <li key={i}>{f}</li>)
                      : null}
                  </ul>
                </div>
              )}
              {/* Cancellation Status */}
              {cancellation?.status === "pending" ? (
                <div className="flex items-center space-x-2 bg-yellow-500/10 rounded p-2 mb-2 mt-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm">Cancellation request pending review.</span>
                </div>
              ) : cancellation?.status === "approved" ? (
                <div className="flex items-center space-x-2 bg-green-500/10 rounded p-2 mb-2 mt-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Subscription cancelled.</span>
                </div>
              ) : cancellation?.status === "rejected" ? (
                <div className="flex items-center space-x-2 bg-red-500/10 rounded p-2 mb-2 mt-3">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">Cancellation request rejected.</span>
                </div>
              ) : null}
              <div className="flex gap-2 mt-4">
                <Button
                  className="w-1/2"
                  variant="secondary"
                  onClick={() => setShowChangeModal(true)}
                  disabled={subscription?.status !== "active"}
                >
                  Change Subscription
                </Button>
                <Button
                  className="w-1/2"
                  variant="destructive"
                  disabled={cancellation?.status === "pending" || subscription?.status !== "active"}
                  onClick={() => setShowModal(true)}
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
            {success && <p className="text-green-400 text-sm mb-2">{success}</p>}
          </>
        )}
        {/* Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1100]">
            <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Confirm Cancellation</h3>
              <p className="text-gray-300 mb-6">Are you sure you want to request cancellation of your subscription? This action will be reviewed by the super admin.</p>
              <div className="flex space-x-3">
                <Button
                  onClick={handleCancelSubscription}
                  disabled={actionLoading}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Yes, Request Cancellation
                </Button>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="ghost"
                  className="flex-1 text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        {showChangeModal && (
          <ChangeSubscriptionModal
            currentPlanId={plan?.id}
            onClose={() => setShowChangeModal(false)}
            onSuccess={() => setSuccess('Change plan request submitted. Please wait for super admin approval.')}
          />
        )}
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return ReactDOM.createPortal(modalContent, document.body);
} 