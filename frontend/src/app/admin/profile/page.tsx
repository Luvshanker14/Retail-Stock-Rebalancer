"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { User, Mail, Loader2, CheckCircle, XCircle, AlertTriangle, Calendar, BadgeCheck, DollarSign, Layers } from "lucide-react";
import useAuth from '@/hooks/useAuth';

export default function AdminProfilePage() {
  const { loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [cancellation, setCancellation] = useState<{ status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        // Fetch admin profile (includes subscription)
        const res = await api.get("/admin/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        });
        setProfile(res.data);
        // Fetch cancellation request status (if you have a dedicated endpoint)
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
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  const admin = profile;
  const subscription = profile?.subscription;
  const plan = subscription?.plan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center py-12 px-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 w-full max-w-md flex flex-col items-center">
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
              onClick={() => router.push("/admin/change-subscription")}
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
      </div>
      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
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
    </div>
  );
} 