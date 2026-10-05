import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  CheckCircle2,
  GraduationCap,
  Landmark,
  Building2,
  Globe,
  Newspaper,
  FlaskConical,
  Scale,
  MoreHorizontal,
  LocateFixed,
  Loader2,
} from "lucide-react";
import { INDIAN_STATES, getDistricts, getCities } from "../../data/india-locations";

const PROFESSIONS = [
  { value: "Student", label: "Student", icon: GraduationCap },
  { value: "Government Employee", label: "Government Employee", icon: Landmark },
  { value: "Private Employee", label: "Private Employee", icon: Building2 },
  { value: "Self Employed", label: "Self Employed", icon: Briefcase },
  { value: "Business Owner", label: "Business Owner", icon: Globe },
  { value: "Farmer", label: "Farmer", icon: Globe },
  { value: "Teacher", label: "Teacher", icon: GraduationCap },
  { value: "Doctor", label: "Doctor", icon: FlaskConical },
  { value: "Engineer", label: "Engineer", icon: Building2 },
  { value: "Lawyer", label: "Lawyer", icon: Scale },
  { value: "Journalist", label: "Journalist", icon: Newspaper },
  { value: "Researcher", label: "Researcher", icon: FlaskConical },
  { value: "Homemaker", label: "Homemaker", icon: User },
  { value: "Retired", label: "Retired", icon: User },
  { value: "Unemployed", label: "Unemployed", icon: User },
  { value: "Other", label: "Other", icon: MoreHorizontal },
];

const STEP_LABELS = ["Account", "Personal", "Location & Security"];

const INITIAL_FORM_DATA = {
  fullName: "",
  email: "",
  mobile: "",
  dob: "",
  gender: "",
  profession: "",
  professionOther: "",
  state: "",
  district: "",
  city: "",
  pincode: "",
  password: "",
  confirmPassword: "",
  agree: false,
};

const MAX_DOB = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
})();

export default function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { login } = useAuth();

  // Live Backend OTP Integration State
  const [emailOtp, setEmailOtp] = useState({
    sent: false,
    verified: false,
    value: "",
    sending: false,
    verifying: false,
    timer: 0,
  });
  const [mobileOtp, setMobileOtp] = useState({
    sent: false,
    verified: false,
    value: "",
    sending: false,
    verifying: false,
    timer: 0,
  });
  const emailTimerRef = useRef(null);
  const mobileTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(emailTimerRef.current);
      clearInterval(mobileTimerRef.current);
    };
  }, []);

  const startResendTimer = (setter, ref) => {
    clearInterval(ref.current);
    setter((prev) => ({ ...prev, timer: 60 }));
    ref.current = setInterval(() => {
      setter((prev) => {
        if (prev.timer <= 1) {
          clearInterval(ref.current);
          return { ...prev, timer: 0 };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);
  };

  // Live Backend HTTP Call: Send Email OTP
  const sendEmailOtp = async () => {
    const emailVal = formData.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)) {
      setErrors((prev) => ({ ...prev, email: "Enter a valid email address before sending OTP" }));
      return;
    }
    setEmailOtp((prev) => ({ ...prev, sending: true }));
    try {
      const res = await fetch("http://localhost:8081/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: emailVal, type: "EMAIL_VERIFICATION" })
      });
      const data = await res.json();
      setEmailOtp((prev) => ({ ...prev, sending: false }));
      if (res.ok && data.success) {
        setEmailOtp((prev) => ({ ...prev, sent: true, verified: false, value: "" }));
        setErrors((prev) => ({ ...prev, email: "" }));
        startResendTimer(setEmailOtp, emailTimerRef);
        toast.success(`Verification code sent to ${emailVal}`);
      } else {
        if (res.status === 409 || data.message?.toLowerCase().includes("already exists")) {
          setErrors((prev) => ({ ...prev, email: "An account with this email already exists. Please sign in instead." }));
          toast.error("An account with this email already exists. Please sign in instead.");
        } else {
          toast.error(data.message || "Failed to send email OTP.");
        }
      }
    } catch (err) {
      setEmailOtp((prev) => ({ ...prev, sending: false }));
      toast.error("Backend server offline. Could not send email OTP.");
    }
  };

  // Live Backend HTTP Call: Verify Email OTP
  const verifyEmailOtp = async () => {
    if (!/^\d{6}$/.test(emailOtp.value)) {
      setErrors((prev) => ({ ...prev, emailOtp: "Enter the 6-digit code" }));
      return;
    }
    setEmailOtp((prev) => ({ ...prev, verifying: true }));
    try {
      const res = await fetch("http://localhost:8081/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: formData.email.trim(), otpCode: emailOtp.value, type: "EMAIL_VERIFICATION" })
      });
      const data = await res.json();
      setEmailOtp((prev) => ({ ...prev, verifying: false }));
      if (res.ok && data.success) {
        setEmailOtp((prev) => ({ ...prev, verified: true }));
        setErrors((prev) => ({ ...prev, emailOtp: "" }));
        toast.success("Email verified successfully!");
      } else {
        setErrors((prev) => ({ ...prev, emailOtp: data.message || "Invalid OTP code" }));
      }
    } catch (err) {
      setEmailOtp((prev) => ({ ...prev, verifying: false }));
      setErrors((prev) => ({ ...prev, emailOtp: "Backend server offline. OTP verification failed." }));
    }
  };

  // Live Backend HTTP Call: Send Phone OTP
  const sendMobileOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setErrors((prev) => ({ ...prev, mobile: "Enter a valid 10-digit mobile number before sending OTP" }));
      return;
    }
    setMobileOtp((prev) => ({ ...prev, sending: true }));
    try {
      const res = await fetch("http://localhost:8081/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: formData.mobile, type: "PHONE_VERIFICATION" })
      });
      const data = await res.json();
      setMobileOtp((prev) => ({ ...prev, sending: false }));
      if (res.ok && data.success) {
        setMobileOtp((prev) => ({ ...prev, sent: true, verified: false, value: "" }));
        setErrors((prev) => ({ ...prev, mobile: "" }));
        startResendTimer(setMobileOtp, mobileTimerRef);
        toast.success(`Verification code sent to +91 ${formData.mobile}`);
      } else {
        if (res.status === 409 || data.message?.toLowerCase().includes("already registered") || data.message?.toLowerCase().includes("already exists")) {
          setErrors((prev) => ({ ...prev, mobile: "Mobile phone number is already registered with another account." }));
          toast.error("Mobile phone number is already registered with another account.");
        } else {
          toast.error(data.message || "Failed to send phone OTP.");
        }
      }
    } catch (err) {
      setMobileOtp((prev) => ({ ...prev, sending: false }));
      toast.error("Backend server offline. Could not send phone OTP.");
    }
  };

  // Live Backend HTTP Call: Verify Phone OTP
  const verifyMobileOtp = async () => {
    if (!/^\d{6}$/.test(mobileOtp.value)) {
      setErrors((prev) => ({ ...prev, mobileOtp: "Enter the 6-digit code" }));
      return;
    }
    setMobileOtp((prev) => ({ ...prev, verifying: true }));
    try {
      const res = await fetch("http://localhost:8081/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: formData.mobile, otpCode: mobileOtp.value, type: "PHONE_VERIFICATION" })
      });
      const data = await res.json();
      setMobileOtp((prev) => ({ ...prev, verifying: false }));
      if (res.ok && data.success) {
        setMobileOtp((prev) => ({ ...prev, verified: true }));
        setErrors((prev) => ({ ...prev, mobileOtp: "" }));
        toast.success("Mobile number verified successfully!");
      } else {
        setErrors((prev) => ({ ...prev, mobileOtp: data.message || "Invalid OTP code" }));
      }
    } catch (err) {
      setMobileOtp((prev) => ({ ...prev, verifying: false }));
      setErrors((prev) => ({ ...prev, mobileOtp: "Backend server offline. OTP verification failed." }));
    }
  };

  const [locating, setLocating] = useState(false);

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location access is not supported in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const geo = await res.json();
          const detectedStateRaw = geo.principalSubdivision || geo.principalSubdivisionCode || "";
          const matchedState = INDIAN_STATES.find(
            (s) => s.toLowerCase() === String(detectedStateRaw).toLowerCase()
          );

          if (!matchedState) {
            toast.error("Couldn't auto-detect your state precisely. Please select it manually.");
            setLocating(false);
            return;
          }

          const districts = getDistricts(matchedState);
          const detectedDistrictRaw = geo.locality || geo.city || "";
          const matchedDistrict = districts.find(
            (d) => d.toLowerCase() === String(detectedDistrictRaw).toLowerCase()
          ) || "";

          const cities = matchedDistrict ? getCities(matchedState, matchedDistrict) : [];
          const detectedCity = geo.city || geo.locality || "";
          const matchedCity = cities.find(
            (c) => c.toLowerCase() === String(detectedCity).toLowerCase()
          ) || cities[0] || "";

          const detectedPincode = geo.postcode || geo.principalSubdivisionCode || "";
          const validPincode = /^\d{6}$/.test(String(detectedPincode).trim()) ? String(detectedPincode).trim() : "";

          setFormData((prev) => ({
            ...prev,
            state: matchedState,
            district: matchedDistrict || prev.district,
            city: matchedCity || prev.city,
            pincode: validPincode || prev.pincode,
          }));
          setErrors((prev) => ({ ...prev, state: "", district: "", city: "", pincode: "" }));
          toast.success(
            matchedDistrict
              ? `Location detected: ${matchedDistrict}, ${matchedState}${validPincode ? ` (${validPincode})` : ''}`
              : `State detected: ${matchedState}. Please pick your district.`
          );
        } catch (err) {
          toast.error("Couldn't detect your location. Please select it manually.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast("Location permission denied — manual selection available.", { icon: "📍" });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    );
  };

  const districtOptions = useMemo(() => getDistricts(formData.state), [formData.state]);
  const cityOptions = useMemo(() => getCities(formData.state, formData.district), [formData.state, formData.district]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let nextValue = type === "checkbox" ? checked : value;

    if (name === "pincode") nextValue = String(nextValue).replace(/\D/g, "").slice(0, 6);
    if (name === "mobile") nextValue = String(nextValue).replace(/\D/g, "").slice(0, 10);

    if (name === "email" && emailOtp.verified) {
      setEmailOtp({ sent: false, verified: false, value: "", sending: false, verifying: false, timer: 0 });
    }
    if (name === "mobile" && mobileOtp.verified) {
      setMobileOtp({ sent: false, verified: false, value: "", sending: false, verifying: false, timer: 0 });
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: nextValue };
      if (name === "state") { next.district = ""; next.city = ""; }
      else if (name === "district") { next.city = ""; }
      else if (name === "profession" && value !== "Other") { next.professionOther = ""; }
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleProfessionSelect = (value) => {
    setFormData((prev) => ({
      ...prev,
      profession: value,
      professionOther: value === "Other" ? prev.professionOther : "",
    }));
    if (errors.profession) setErrors((prev) => ({ ...prev, profession: "" }));
  };

  const handleGenderSelect = (value) => {
    setFormData((prev) => ({ ...prev, gender: value }));
    if (errors.gender) setErrors((prev) => ({ ...prev, gender: "" }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) newErrors.email = "Enter a valid email address";
      if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
      else if (!/^[6-9]\d{9}$/.test(formData.mobile)) newErrors.mobile = "Enter a valid 10-digit Indian mobile number";
      
      if (!newErrors.email && !emailOtp.verified) newErrors.emailOtp = "Please verify your email address";
    }

    if (currentStep === 2) {
      if (!formData.dob) newErrors.dob = "Date of birth is required";
      if (!formData.gender) newErrors.gender = "Please select a gender";
      if (!formData.profession) newErrors.profession = "Please select a profession";
    }

    if (currentStep === 3) {
      if (!formData.state) newErrors.state = "Please select a state";
      if (!formData.district) newErrors.district = "Please select a district";
      if (!formData.city) newErrors.city = "Please select a city";
      if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) newErrors.pincode = "Pincode must be exactly 6 digits";
      if (!formData.password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(formData.password)) {
        newErrors.password = "Min 8 chars with uppercase, lowercase, number & special character";
      }
      if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = "Passwords do not match";
      if (!formData.agree) newErrors.agree = "You must agree to continue";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((prev) => Math.min(prev + 1, 3));
  };

  const previousStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Live Backend HTTP Call: Registration & Automatic Login Flow
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:8081/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.mobile.trim(),
          password: formData.password,
          dob: formData.dob || null,
          gender: formData.gender || null,
          profession: formData.profession === "Other" ? (formData.professionOther || "OTHER") : formData.profession,
          state: formData.state || null,
          district: formData.district || null,
          city: formData.city || null,
          pincode: formData.pincode || null
        })
      });

      const resData = await response.json();
      setIsSubmitting(false);

      if (response.ok && resData.success) {
        toast.success("Account registered successfully! Logging in...");
        login("user", {
          name: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          profession: formData.profession === "Other" ? (formData.professionOther || "OTHER") : formData.profession,
          state: formData.state,
          district: formData.district,
          city: formData.city,
          pincode: formData.pincode,
          lang: "English",
        });
        navigate("/user");
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: resData.message || "Registration failed. Please check your data and try again."
        }));
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrors((prev) => ({
        ...prev,
        submit: "Backend server offline. Registration failed."
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-gray-50">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[420px] flex-col justify-between bg-gov-blue text-white p-10">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <span className="text-xl font-bold tracking-wide">INFOSEVA</span>
          </div>

          <h1 className="text-3xl font-bold leading-snug mb-4">
            Join thousands of informed citizens
          </h1>

          <p className="text-white/80 leading-relaxed mb-10">
            Create your account to access public information search, RTI drafting, and scheme discovery tools.
          </p>

          <ul className="space-y-4">
            {[
              "Free to use for all Indian citizens",
              "Search 10,000+ public records",
              "AI-assisted RTI draft generation",
              "Track all your drafts and bookmarks",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <CheckCircle size={18} className="text-green-300 shrink-0" />
                <span className="text-white/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/60 border-t border-white/10 pt-4">
          Government of India &middot; RTI Act 2005
        </p>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-xl">
          {/* Step Indicator */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex-1 flex items-center">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      step > item ? "bg-green-500 text-white" : step === item ? "bg-gov-blue text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > item ? <CheckCircle size={20} /> : item}
                  </div>
                  {item !== 3 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${step > item ? "bg-gov-blue" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-3 text-sm font-medium text-gray-500">
              {STEP_LABELS.map((label, idx) => (
                <span key={label} className={step === idx + 1 ? "text-gov-blue font-semibold" : ""}>{label}</span>
              ))}
            </div>

            <p className="text-right text-xs text-gray-400 mt-2">Step {step} of 3</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}>
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Create Your Account</h2>
                      <p className="text-gray-500 text-sm mt-1">Start your journey with INFOSEVA — free for all Indian citizens</p>
                    </div>

                    <Field label="Full Name" icon={User} name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. Priya Sharma" error={errors.fullName} />
                    <Field label="Email Address" icon={Mail} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="yourname@example.com" error={errors.email} />

                    <OtpVerifyBlock channel="email" target={formData.email} otp={emailOtp} setOtp={setEmailOtp} onSend={sendEmailOtp} onVerify={verifyEmailOtp} error={errors.emailOtp} />

                    <div>
                      <label htmlFor="reg-mobile" className="block text-sm font-semibold text-gray-700 mb-2">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex">
                        <span className="flex items-center gap-1 px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-sm font-medium text-gray-600">IN +91</span>
                        <div className="relative flex-1">
                          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input id="reg-mobile" type="tel" inputMode="numeric" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="98XXXXXXXX" maxLength={10} className="input-field w-full pl-11 rounded-l-none" />
                        </div>
                      </div>
                      {errors.mobile && <ErrorText>{errors.mobile}</ErrorText>}
                    </div>

                    <div className="pt-4">
                      <button type="button" onClick={nextStep} className="btn-primary w-full py-3">Continue &gt;</button>
                    </div>

                    <p className="text-center text-sm text-gray-600">
                      Already have an account? <Link to="/login" className="font-semibold text-gov-blue hover:underline">Sign In</Link>
                    </p>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Tell Us About Yourself</h2>
                      <p className="text-gray-500 text-sm mt-1">This helps us personalise your INFOSEVA experience</p>
                    </div>

                    <div>
                      <label htmlFor="reg-dob" className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input id="reg-dob" type="date" name="dob" value={formData.dob} onChange={handleChange} max={MAX_DOB} className="input-field w-full pl-11" />
                      </div>
                      {errors.dob && <ErrorText>{errors.dob}</ErrorText>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-3 gap-3">
                        {["Male", "Female", "Other"].map((g) => (
                          <button key={g} type="button" onClick={() => handleGenderSelect(g)} className={`py-3 rounded-xl border text-sm font-medium transition-all ${formData.gender === g ? "border-gov-blue bg-gov-blue-50 text-gov-blue" : "border-gray-300 text-gray-600 hover:border-gov-blue/50"}`}>{g}</button>
                        ))}
                      </div>
                      {errors.gender && <ErrorText>{errors.gender}</ErrorText>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Profession <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 gap-3">
                        {PROFESSIONS.map(({ value, label, icon: Icon }) => (
                          <button key={value} type="button" onClick={() => handleProfessionSelect(value)} className={`flex items-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium text-left transition-all ${formData.profession === value ? "border-gov-blue bg-gov-blue-50 text-gov-blue" : "border-gray-300 text-gray-600 hover:border-gov-blue/50"}`}>
                            <Icon size={18} className="shrink-0" />
                            {label}
                          </button>
                        ))}
                      </div>
                      {errors.profession && <ErrorText>{errors.profession}</ErrorText>}
                    </div>

                    <div className="flex justify-between pt-4">
                      <button type="button" onClick={previousStep} className="btn-secondary px-8 py-3">&larr; Back</button>
                      <button type="button" onClick={nextStep} className="btn-primary px-8 py-3">Continue &gt;</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Complete Registration</h2>
                      <p className="text-gray-500 text-sm mt-1">Almost there — just a few more details</p>
                    </div>

                    <button type="button" onClick={useCurrentLocation} disabled={locating} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gov-blue/30 bg-gov-blue-50 text-gov-blue font-semibold py-3 hover:bg-gov-blue-100 transition-colors disabled:opacity-60">
                      {locating ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
                      {locating ? "Detecting your location…" : "Use Current Location"}
                    </button>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="reg-state" className="block text-sm font-semibold text-gray-700 mb-2">State <span className="text-red-500">*</span></label>
                        <select id="reg-state" name="state" value={formData.state} onChange={handleChange} className="input-field w-full pl-4">
                          <option value="">Select your state</option>
                          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.state && <ErrorText>{errors.state}</ErrorText>}
                      </div>

                      <div>
                        <label htmlFor="reg-district" className="block text-sm font-semibold text-gray-700 mb-2">District <span className="text-red-500">*</span></label>
                        <select id="reg-district" name="district" value={formData.district} onChange={handleChange} disabled={!formData.state} className="input-field w-full pl-4 disabled:bg-gray-100">
                          <option value="">{formData.state ? "Select your district" : "Select state first"}</option>
                          {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {errors.district && <ErrorText>{errors.district}</ErrorText>}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-city" className="block text-sm font-semibold text-gray-700 mb-2">City / Main Area <span className="text-red-500">*</span></label>
                      <select id="reg-city" name="city" value={formData.city} onChange={handleChange} disabled={!formData.district} className="input-field w-full pl-4 disabled:bg-gray-100">
                        <option value="">{formData.district ? "Select your city" : "Select district first"}</option>
                        {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.city && <ErrorText>{errors.city}</ErrorText>}
                    </div>

                    <div>
                      <label htmlFor="reg-pincode" className="block text-sm font-semibold text-gray-700 mb-2">Pincode <span className="text-red-500">*</span></label>
                      <input id="reg-pincode" type="text" inputMode="numeric" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="6-digit pincode" maxLength={6} className="input-field w-full pl-4" />
                      {errors.pincode && <ErrorText>{errors.pincode}</ErrorText>}
                    </div>

                    <PasswordField label="Password" name="password" value={formData.password} onChange={handleChange} show={showPassword} toggleShow={() => setShowPassword((p) => !p)} placeholder="Min. 8 characters" error={errors.password} />
                    <PasswordField label="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} show={showConfirmPassword} toggleShow={() => setShowConfirmPassword((p) => !p)} placeholder="Re-enter your password" error={errors.confirmPassword} />

                    <div>
                      <div className="flex items-start gap-3">
                        <input id="reg-agree" type="checkbox" name="agree" checked={formData.agree} onChange={handleChange} className="mt-1 accent-gov-blue" />
                        <label htmlFor="reg-agree" className="text-sm text-gray-600">
                          I agree to INFOSEVA's{" "}
                          <button type="button" onClick={() => setShowTerms(true)} className="text-gov-blue font-semibold hover:underline">
                            Terms of Service
                          </button>{" "}
                          and{" "}
                          <button type="button" onClick={() => setShowPrivacy(true)} className="text-gov-blue font-semibold hover:underline">
                            Privacy Policy
                          </button>.
                        </label>
                      </div>
                      {errors.agree && <ErrorText>{errors.agree}</ErrorText>}
                    </div>

                    {errors.submit && <ErrorText>{errors.submit}</ErrorText>}

                    <div className="flex justify-between pt-6">
                      <button type="button" onClick={previousStep} className="btn-secondary px-8 py-3">&larr; Back</button>
                      <button type="submit" disabled={isSubmitting} className="btn-primary px-10 py-3 flex items-center gap-2 disabled:opacity-60">
                        <CheckCircle size={18} />
                        {isSubmitting ? "Creating Account..." : "Create Account"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </div>
      </div>

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[80vh] flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Terms of Service</h3>
              <div className="overflow-y-auto text-xs text-gray-600 space-y-3 flex-1 pr-2">
                <p><strong>1. Acceptance of Terms:</strong> By registering an account on InfoSeva, you agree to comply with all applicable laws of India including the Right to Information Act, 2005.</p>
                <p><strong>2. Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account.</p>
                <p><strong>3. Use of RTI Portal:</strong> InfoSeva provides AI-assisted RTI query drafting and scheme discovery. Filings must contain truthful public information requests.</p>
                <p><strong>4. Verification Mandate:</strong> Both Email and Mobile Phone numbers must be verified via OTP prior to account activation.</p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button type="button" onClick={() => setShowTerms(false)} className="btn-primary px-5 py-2 text-xs font-semibold">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[80vh] flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Privacy Policy</h3>
              <div className="overflow-y-auto text-xs text-gray-600 space-y-3 flex-1 pr-2">
                <p><strong>1. Data Collection:</strong> We collect your name, email address, mobile number, date of birth, profession, and address solely for authenticating your RTI identity and customizing public service applications.</p>
                <p><strong>2. Encryption & Security:</strong> Passwords and OTP codes are stored securely using industry-standard cryptographic hashes (BCrypt & SHA-256).</p>
                <p><strong>3. Third-Party Sharing:</strong> InfoSeva does not sell or share personal citizen data with commercial third parties.</p>
                <p><strong>4. Geolocation Data:</strong> Geolocation coordinates are processed locally in your browser only when auto-detecting your district and state.</p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button type="button" onClick={() => setShowPrivacy(false)} className="btn-primary px-5 py-2 text-xs font-semibold">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OtpVerifyBlock({ channel, target, otp, setOtp, onSend, onVerify, error }) {
  const label = channel === "email" ? "Email" : "Mobile";

  if (otp.verified) {
    return (
      <div className="-mt-3 flex items-center justify-between text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0 text-green-600" />
          <span className="font-semibold">{label} Verified</span>
        </div>
        <span className="text-xs text-green-600 font-medium">✓ Verified via Backend</span>
      </div>
    );
  }

  if (!otp.sent) {
    return (
      <div className="-mt-3 flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-2.5">
        <span className="text-xs text-gray-600">Verification code required for registration</span>
        <button type="button" onClick={onSend} disabled={otp.sending} className="inline-flex items-center gap-1.5 text-xs font-bold text-gov-blue hover:underline disabled:opacity-60">
          {otp.sending && <Loader2 size={12} className="animate-spin" />}
          {otp.sending ? "Sending..." : `Send OTP`}
        </button>
      </div>
    );
  }

  return (
    <div className="-mt-2 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Enter 6-digit code sent to <strong>{target}</strong></span>
      </div>
      <div className="flex items-center gap-2">
        <input type="text" inputMode="numeric" maxLength={6} value={otp.value} onChange={(e) => setOtp((prev) => ({ ...prev, value: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="6-digit code" className="input-field flex-1 tracking-widest text-center font-semibold text-sm" />
        <button type="button" onClick={onVerify} disabled={otp.verifying} className="btn-primary px-5 py-2.5 text-xs font-semibold whitespace-nowrap disabled:opacity-60">
          {otp.verifying ? <Loader2 size={14} className="animate-spin" /> : "Verify OTP"}
        </button>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={onSend} disabled={otp.timer > 0 || otp.sending} className="text-xs font-semibold text-gov-blue disabled:text-gray-400 hover:underline">
          {otp.timer > 0 ? `Resend OTP in ${otp.timer}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}

function ErrorText({ children }) {
  return <p className="text-xs text-red-500 mt-1.5">{children}</p>;
}

function Field({ label, icon: Icon, type = "text", name, value, onChange, placeholder, maxLength, error }) {
  const id = `reg-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">{label} <span className="text-red-500">*</span></label>
      <div className="relative">
        {Icon && <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />}
        <input id={id} type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} className={`input-field w-full ${Icon ? "pl-11" : ""}`} />
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function PasswordField({ label, name, value, onChange, show, toggleShow, placeholder, error }) {
  const id = `reg-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">{label} <span className="text-red-500">*</span></label>
      <div className="relative">
        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input id={id} type={show ? "text" : "password"} name={name} value={value} onChange={onChange} placeholder={placeholder} className="input-field w-full pl-11 pr-12" />
        <button type="button" onClick={toggleShow} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gov-blue">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
