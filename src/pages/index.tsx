import { useEffect, useState } from "react";
import { supabase } from "@/supabase/supabase";
import { useRouter } from "next/router";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import Dashboard from "@/components/Dashboard/Dashboard";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-layer-2 flex items-center justify-center">
        <AiOutlineLoading3Quarters className="animate-spin text-white text-4xl" />
      </div>
    );
  }

  return <Dashboard user={user} />;
}