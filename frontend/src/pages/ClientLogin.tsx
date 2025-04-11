import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useAuthGlobally } from "../context/AuthContext";
import ForgotPasswordModal from "./ForgotPasswordModal";
import ZoomLogo from "./ZoomLogo";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ClientAccessInfoModal from "./components/CreateClientAccountModal";

const API_URL = import.meta.env.VITE_REACT_APP_URL;

// --- AnimatedWordCycle Component---
interface AnimatedWordCycleProps {
  words: string[];
  interval?: number;
  className?: string;
}

function AnimatedWordCycle({
  words,
  interval = 5000,
  className = "",
}: AnimatedWordCycleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width, setWidth] = useState("auto");
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (measureRef.current) {
      const elements = measureRef.current.children;
      if (elements.length > currentIndex) {
        const newWidth = elements[currentIndex].getBoundingClientRect().width;
        setWidth(`${newWidth}px`);
      }
    }
  }, [currentIndex, words]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, words.length]);

  const containerVariants = {
    hidden: { y: -20, opacity: 0, filter: "blur(8px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
      y: 20,
      opacity: 0,
      filter: "blur(8px)",
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  return (
    <>
      <div
        ref={measureRef}
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none"
        style={{ visibility: "hidden" }}
      >
        {words.map((word, i) => (
          <span key={i} className={`font-bold ${className}`}>
            {word}
          </span>
        ))}
      </div>

      <motion.span
        className="relative inline-block overflow-hidden"
        animate={{
          width,
          transition: {
            type: "spring",
            stiffness: 150,
            damping: 15,
            mass: 1.2,
          },
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={currentIndex}
            className={`inline-block font-bold ${className}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ whiteSpace: "nowrap" }}
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  );
}
// --- End AnimatedWordCycle Component ---

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [formErrors, setFormErrors] = useState<{
    email: string;
    password: string;
    general: string;
  }>({
    email: "",
    password: "",
    general: "",
  });

  const [isAccessInfoModalOpen, setIsAccessInfoModalOpen] = useState(false); // Changed state name
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  const navigate = useNavigate();
  const [, setAuthGlobally] = useAuthGlobally();

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const tokenData = localStorage.getItem("token");
        if (!tokenData) {
          if (isMounted) setIsCheckingAuth(false);
          return;
        }

        let parsedData;
        try {
          parsedData = JSON.parse(tokenData);
        } catch (parseError) {
          console.error("Failed to parse token from localStorage:", parseError);
          throw new Error("Invalid token data in storage.");
        }

        const { user, token } = parsedData;
        if (!user || !user.role || !token) {
          throw new Error("Invalid token structure in storage.");
        }

        const response = await axios.get(`${API_URL}/api/v1/auth/verify-token`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 4000,
        });

        if (isMounted) {
          if (response.data.success) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            setAuthGlobally({
              user: user,
              role: user.role,
              token: token,
            });
            const redirectPath =
              user.role === "user" ? "/client-portal" : "/dashboard";
            navigate(redirectPath, { replace: true });
          } else {
            throw new Error("Token verification failed by server.");
          }
        }
      } catch (err: any) {
        console.error("Authentication check failed:", err.message || err);
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
        if (isMounted) {
          setAuthGlobally({ user: null, role: null, token: null });
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();

    const timeoutId = setTimeout(() => {
      if (isMounted && isCheckingAuth) {
        console.warn("Auth check timed out, proceeding to login page.");
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
        setAuthGlobally({ user: null, role: null, token: null });
        setIsCheckingAuth(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [navigate, setAuthGlobally]);

  const validateForm = (): boolean => {
    let errors: { email: string; password: string; general: string } = {
      email: "",
      password: "",
      general: "",
    };
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = "Email address is required.";
      isValid = false;
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (!password.trim()) {
      errors.password = "Password is required.";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({ email: "", password: "", general: "" });

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
        email,
        password,
      });

      const authData = {
        user: response.data.user,
        role: response.data.user.role,
        token: response.data.token,
      };
      setAuthGlobally(authData);
      localStorage.setItem("token", JSON.stringify(authData));
      axios.defaults.headers.common["Authorization"] = `Bearer ${authData.token}`;

      const redirectPath =
        authData.role === "admin" || authData.role === "superadmin"
          ? "/dashboard"
          : "/client-portal";
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your credentials and try again.";
      setFormErrors((prev) => ({ ...prev, general: errorMessage }));
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <svg
          className="animate-spin h-8 w-8 text-yellow-500"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-white">
      <div className="w-full md:w-1/2 bg-black text-white flex flex-col justify-center items-center p-6 md:px-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-80 z-0"></div>
        <div className="max-w-lg text-center py-8 md:py-0 relative z-10">
          <div className="flex justify-center items-center gap-4 mb-8 md:mb-14">
            <ZoomLogo />
          </div>
          <div className="hidden md:block">
            <p className="text-[37px] font-medium leading-tight mb-8">
              <AnimatedWordCycle
                words={["Transform", "Grow", "Streamline", "Succeed"]}
                interval={3000}
                className="text-yellow-400"
              />{" "}
              Your Business with Smart Solutions
            </p>
            <p className="text-lg leading-relaxed text-gray-300">
              Access your portal to manage customer relationships, track progress,
              and drive growth with our integrated platform.
            </p>
          </div>
          <div className="md:hidden text-center mt-6">
            <h2 className="text-2xl font-semibold mb-2 text-yellow-400">
              Your Business Hub
            </h2>
            <p className="text-gray-300">Login to access your client portal.</p>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center px-6 sm:px-10 py-12 md:py-8">
        <div className="max-w-md mx-auto w-full">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            WELCOME BACK 👋
          </h3>

          {formErrors.general && (
            <div
              className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm text-center"
              role="alert"
            >
              {formErrors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="w-full">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email || formErrors.general) {
                      setFormErrors((prev) => ({
                        ...prev,
                        email: "",
                        general: "",
                      }));
                    }
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    formErrors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
                  } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  placeholder="you@example.com"
                  required
                  aria-required="true"
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? "email-error" : undefined}
                  disabled={isLoading}
                />
              </div>
              {formErrors.email && (
                <p
                  id="email-error"
                  className="mt-1.5 text-xs text-red-600"
                  role="alert"
                >
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password || formErrors.general) {
                      setFormErrors((prev) => ({
                        ...prev,
                        password: "",
                        general: "",
                      }));
                    }
                  }}
                  className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    formErrors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
                  } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  placeholder="Enter your password"
                  required
                  aria-required="true"
                  aria-invalid={!!formErrors.password}
                  aria-describedby={
                    formErrors.password ? "password-error" : undefined
                  }
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {passwordVisible ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p
                  id="password-error"
                  className="mt-1.5 text-xs text-red-600"
                  role="alert"
                >
                  {formErrors.password}
                </p>
              )}
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => !isLoading && setIsForgotPasswordModalOpen(true)}
                className="text-sm font-medium text-yellow-600 hover:text-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-yellow-400 py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200 flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <p className="text-center text-sm text-gray-600 pt-2">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-medium text-yellow-600 hover:text-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => !isLoading && setIsAccessInfoModalOpen(true)} // Changed handler
                disabled={isLoading}
              >
                Sign up now
              </button>
            </p>
          </form>
        </div>
      </div>

      <ClientAccessInfoModal // Changed component
        isOpen={isAccessInfoModalOpen}
        onClose={() => setIsAccessInfoModalOpen(false)}
      />
      <ForgotPasswordModal
        visible={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
      />
    </div>
  );
}