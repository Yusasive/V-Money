import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import ScrollToTop from "../ScrollToTop";
import OnboardingForm from "../components/Navbar/OnboardingForm";
import Footer from "../pages/Footer";
import { authApi } from "../api/client";
import toast from "react-hot-toast";

export default function OnboardingPage() {
  const location = useLocation();
  const routeInitial = useMemo(
    () => location.state?.initialData || {},
    [location.state]
  );

  // Check for URL parameters for prefill data
  const urlParams = new URLSearchParams(location.search);
  const prefillParam = urlParams.get("prefill");
  const urlPrefillData = useMemo(() => {
    if (!prefillParam) return {};
    try {
      return JSON.parse(decodeURIComponent(prefillParam));
    } catch (e) {
      console.error("Failed to parse prefill data from URL:", e);
      return {};
    }
  }, [prefillParam]);

  const combinedInitialData = useMemo(
    () => ({ ...routeInitial, ...urlPrefillData }),
    [routeInitial, urlPrefillData]
  );
  const [initialData, setInitialData] = useState(routeInitial);
  // removed unused loading state to satisfy eslint

  useEffect(() => {
    let mounted = true;
    (async () => {
      // if we already have combined data, just set it
      if (combinedInitialData && Object.keys(combinedInitialData).length) {
        setInitialData(combinedInitialData);
        return;
      }
      try {
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
      }
    })();
    return () => {
      mounted = false;
    };
  }, [combinedInitialData, urlPrefillData]);

  return (
    <>
      <Navbar />
      <ScrollToTop />
      <OnboardingForm initialData={initialData} />
      <Footer />
    </>
  );
}
