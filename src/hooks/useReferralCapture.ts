import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const KEY = "wf_ref_code";

/** Saves ?ref=CODE from any link, then claims it once the user is signed in. */
export const useReferralCapture = () => {
  const { user } = useAuth();

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^WF-[A-Z0-9]{8}$/i.test(ref)) localStorage.setItem(KEY, ref.toUpperCase());
  }, []);

  useEffect(() => {
    const code = localStorage.getItem(KEY);
    if (!user || !code) return;
    supabase.rpc("claim_referral", { _code: code }).then(() => localStorage.removeItem(KEY));
  }, [user]);
};

export const ReferralCapture = () => { useReferralCapture(); return null; };
