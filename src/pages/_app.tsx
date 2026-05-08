import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createContext, useContext, useEffect, useState } from "react";
import { RecoilRoot, useRecoilValue } from "recoil";
import { useRouter } from "next/router";
import { contestState } from "@/atoms/contestAtom";

// ── Theme Context ──────────────────────────────────────
type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ── Contest Guard ──────────────────────────────────────
function ContestGuard({ children }: { children: React.ReactNode }) {
  const contest = useRecoilValue(contestState);
  const router = useRouter();

  useEffect(() => {
    const handleBrowseAway = (url: string) => {
      if (contest.isInContest) {
        if (!window.confirm("You are in a contest! Leaving will disqualify you. Are you sure?")) {
          router.events.emit("routeChangeError");
          // Throwing an error is the only way to truly stop Next.js routing in some versions
          throw "routeChange aborted.";
        }
      }
    };

    const handleVisibilityChange = () => {
      if (contest.isInContest && document.visibilityState === "hidden") {
        toast.warn("Warning: Tab switching detected!", {
          position: "top-center",
          autoClose: 5000,
        });
      }
    };

    if (contest.isInContest) {
      window.onbeforeunload = () => "Contest in progress. Are you sure you want to leave?";
      router.events.on("routeChangeStart", handleBrowseAway);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      window.onbeforeunload = null;
      router.events.off("routeChangeStart", handleBrowseAway);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [contest.isInContest, router]);

  return <>{children}</>;
}

// ── App Wrapper ───────────────────────────────────────
function AppContent({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("lcc-theme") as Theme | null;
    const initialTheme = saved || "dark";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    document.documentElement.classList.remove("dark", "light-mode");
    if (initialTheme === "light") {
      document.documentElement.classList.add("light-mode");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("lcc-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    document.documentElement.classList.remove("dark", "light-mode");
    if (newTheme === "light") {
      document.documentElement.classList.add("light-mode");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div>
        <Head>
          <title>LeetClone</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.png" />
        </Head>
        <ToastContainer theme={theme === "dark" ? "dark" : "light"} />
        <ContestGuard>
          <Component {...pageProps} />
        </ContestGuard>
      </div>
    </ThemeContext.Provider>
  );
}

export default function App(props: AppProps) {
  return (
    <RecoilRoot>
      <AppContent {...props} />
    </RecoilRoot>
  );
}

