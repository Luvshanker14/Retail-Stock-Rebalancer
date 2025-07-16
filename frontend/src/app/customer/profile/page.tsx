"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ratingsApi, Review } from "@/lib/api";
import ReviewCard from "@/components/ReviewCard";
import { ArrowLeft } from 'lucide-react';
import useCustomerAuth from '@/hooks/useCustomerAuth';
import { useDarkMode } from '@/hooks/useDarkMode';

interface CustomerProfile {
  id: number;
  name: string;
  email: string;
}

export default function CustomerProfilePage() {
  const { loading: authLoading } = useCustomerAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isDark } = useDarkMode();

  useEffect(() => {
    const fetchProfileAndReviews = async () => {
      try {
        // Fetch profile
        const token = localStorage.getItem("customerToken");
        if (!token) {
          router.push("/customer/login");
          return;
        }
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}/api/customer/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          }
        );
        if (res.status === 401) {
          router.push("/customer/login");
          return;
        }
        const profileData = await res.json();
        setProfile(profileData);

        // Fetch reviews
        const reviewsData = await ratingsApi.getCustomerReviews(1, 50);
        setReviews(reviewsData.reviews);
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndReviews();
    // eslint-disable-next-line
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-center text-red-500">Failed to load profile.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => router.push('/customer/home')}
        className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
        aria-label="Back to Home"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>
      <h1 className="text-2xl font-bold mb-2">My Profile</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="mb-2">
          <span className="font-semibold">Name:</span> {profile.name}
        </div>
        <div>
          <span className="font-semibold">Email:</span> {profile.email}
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-4">My Reviews</h2>
      {reviews.length === 0 ? (
        <div className="text-gray-500">You have not posted any reviews yet.</div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} isOwnReview isDark={isDark} />
          ))}
        </div>
      )}
    </div>
  );
} 