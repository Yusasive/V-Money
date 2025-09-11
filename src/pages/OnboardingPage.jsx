import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import ScrollToTop from "../ScrollToTop";
import OnboardingForm from "../components/Navbar/OnboardingForm";
import Footer from "../pages/Footer";
import { authApi } from "../api/client";
import toast from "react-hot-toast";

export default function OnboardingPage() {
  const location = useLocation();
  const routeInitial = location.state?.initialData || {};
  
  // Check for URL parameters for prefill data
  const urlParams = new URLSearchParams(location.search);
  const prefillParam = urlParams.get('prefill');
  let urlPrefillData = {};
  
  if (prefillParam) {
    try {
      urlPrefillData = JSON.parse(decodeURIComponent(prefillParam));
    } catch (e) {
      console.error('Failed to parse prefill data from URL:', e);
    }
  }
  
  const combinedInitialData = { ...routeInitial, ...urlPrefillData };
  const [initialData, setInitialData] = useState(routeInitial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If route didn't pass initialData, try to fetch current user to prefill
    if (!combinedInitialData || Object.keys(combinedInitialData).length === 0) {
      let mounted = true;
      (async () => {
        try {
          setLoading(true);
          const res = await authApi.me();
          const user = res.data?.user || res.data || {};
          if (mounted) {
            setInitialData({
              email: user.email,
              username: user.username,
              ...urlPrefillData,
            });
          }
        } catch (err) {
          console.debug(
            "Onboarding prefill: failed to fetch user",
            err?.message || err
          );
          toast.error("Could not prefill onboarding. Please fill manually.");
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    } else {
      setInitialData(combinedInitialData);
    }
  }, [routeInitial, prefillParam]);

  return (
    <>
      <Navbar />
      <ScrollToTop />
      <OnboardingForm initialData={initialData} />
      <Footer />
    </>
  );
}
