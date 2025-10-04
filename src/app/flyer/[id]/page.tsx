"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";


type QR = { id: string; imageUrl: string | null };
type Link = { id: string; slug: string; qr: QR | null };
type CampaignMeta = { name: string; isPaid: boolean; buyLink: string | null };
type DynamicField = { name: string; type: string; required?: boolean };
type FlyerForm = { id: string; name: string; fields: DynamicField[] };
type FormResponse = { id: string; data: Record<string, string>; createdAt: string };

type Flyer = {
  id: string;
  title: string;
  description?: string;
  assetType: "IMAGE" | "VIDEO" | "PDF";
  links: Link[];
  campaign: CampaignMeta;
  form?: FlyerForm;
  displayUrl?: string | null;
  coverUrl?: string | null;

  // ✅ Add these fields
  unlocked: boolean;
  cdnUrl?: string | null;
};


export default function FlyerViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [flyer, setFlyer] = useState<Flyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [responses, setResponses] = useState<FormResponse[]>([]);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [mobile, setMobile] = useState("");
  const [operator, setOperator] = useState("airtel");
  const [bearer, setBearer] = useState<"merchant" | "customer">("merchant");
  const [otp, setOtp] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [currentPaymentRef, setCurrentPaymentRef] = useState("");

  const shareUrl = useMemo(() => (typeof window !== "undefined" ? window.location.href : ""), []);
  

  // ------------------- Fetch Flyer & Polling -------------------
  useEffect(() => {
    if (!id) return;
    let intervalId: NodeJS.Timeout;

    const fetchFlyer = async () => {
      try {
        const r = await fetch(`/api/flyers/${id}`);
        if (!r.ok) throw new Error("Failed to fetch flyer");
        const data: Flyer = await r.json();
        setFlyer(data);
        setIsPaid(data.unlocked);

        if (data.form && (!formData || Object.keys(formData).length === 0)) {
          const initialForm: Record<string, any> = {};
          data.form.fields.forEach((f) => (initialForm[f.name] = ""));
          setFormData(initialForm);

          const resR = await fetch(`/api/forms/${data.form.id}/responses`);
          if (resR.ok) setResponses(await resR.json());
        }
      } catch (err) {
        console.error("❌ Failed to load flyer:", err);
      } finally {
        setLoading(false); // ✅ Always hide loader
      }
    };

    fetchFlyer();

    intervalId = setInterval(() => {
      if (!isPaid) fetchFlyer();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [id, isPaid]);


  // ------------------- Form Handlers -------------------
  const handleFormChange = (name: string, value: string) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const submitForm = async () => {
    if (!flyer?.form) return;
    const res = await fetch(`/api/forms/${flyer.form.id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: formData }),
    });
    if (res.ok) {
      alert("Form submitted successfully!");
      const reset: Record<string, string> = {};
      flyer.form.fields.forEach((f) => (reset[f.name] = ""));
      setFormData(reset);
      const resR = await fetch(`/api/forms/${flyer.form.id}/responses`);
      if (resR.ok) setResponses(await resR.json());
    }
  };

  // ------------------- Sharing & Subscribe -------------------
  const doShare = async (network: "whatsapp" | "twitter" | "facebook" | "linkedin") => {
    const text = encodeURIComponent(flyer?.title ?? "Check this out!");
    const url = encodeURIComponent(shareUrl);
    const map = {
      whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    } as const;

    window.open(map[network], "_blank", "noopener,noreferrer");
    fetch(`/api/flyers/${id}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "SHARE" }),
    }).catch(() => { });
  };

  const doSubscribe = async () => {
    if (!email) return;
    const r = await fetch(`/api/flyers/${id}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (r.ok) {
      setEmail("");
      alert("Subscribed. Thank you!");
    }
  };

  const doFeedback = async () => {
    const r = await fetch(`/api/flyers/${id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    if (r.ok) {
      setComment("");
      alert("Feedback submitted. Thank you!");
    }
  };

  const doBuy = () => setShowPaymentForm(true);

  // ------------------- Payment Handlers -------------------
  const submitPaymentForm = async () => {
    if (!flyer) return;
    setPaymentLoading(true);

    try {
      let phone = mobile.trim();
      if (phone.startsWith("0")) phone = "+260" + phone.slice(1);
      else if (!phone.startsWith("+")) phone = "+260" + phone;

      const res = await fetch(`/api/flyers/${flyer.id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, operator }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || "Payment initiation failed");
      }

      const data = await res.json();
      setCurrentPaymentRef(data.reference);

      // Wait longer for user to respond on mobile
      await new Promise((resolve) => setTimeout(resolve, 6000));

      const eventSource = new EventSource(`/api/payments/stream?reference=${data.reference}`);
      eventSource.onmessage = (event) => {
        const update = JSON.parse(event.data);
        switch (update.status) {
          case "SUCCESS":
            alert("✅ Payment successful!");
            setIsPaid(true);
            eventSource.close();
            break;
          case "FAILED":
            alert("❌ Payment failed");
            eventSource.close();
            break;
          case "otp-required":
            setShowOtpForm(true);
            break;
          case "pay-offline":
            alert("ℹ️ Please authorize on your mobile.");
            break;
        }
      };
    } catch (e: any) {
      console.error("Payment error:", e);
      alert(e.message || "Payment failed. Please try again.");
    } finally {
      setPaymentLoading(false);
      setShowPaymentForm(false);
    }
  };

  const submitOtpForm = async () => {
    try {
      const res = await fetch(`/api/flyers/${flyer?.id}/purchase/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: currentPaymentRef, otp }),
      });
      const data = await res.json();

      if (data.status === "SUCCESS") {
        setIsPaid(true);
        setShowOtpForm(false);
        alert("Payment successful! Flyer unlocked.");
      } else {
        alert("OTP verification failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      alert("OTP submission failed.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-950 text-white">
        <p className="text-lg animate-pulse">Loading flyer…</p>
      </div>
    );

  if (!flyer)
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-950 text-white">
        <p className="text-lg">Flyer not found.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-white/10 grid place-items-center"></div>
          <div>
            <h1 className="text-white text-xl font-semibold">{flyer.campaign.name}</h1>
            <p className="text-white/60 text-sm">{flyer.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => doShare("twitter")}
            className="px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
          >
            Share
          </button>
          {flyer.campaign.isPaid && !isPaid && (
            <button
              onClick={doBuy}
              disabled={paymentLoading}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {paymentLoading ? "Processing…" : "Buy"}
            </button>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <main className="mx-auto max-w-6xl px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Asset Preview */}
        {/* Asset Preview */}
        <section className="md:col-span-2 rounded-3xl bg-white shadow-xl overflow-hidden min-h-[60vh] grid place-items-center p-4">
          {flyer.assetType === "IMAGE" && (
            <img
              src={flyer.displayUrl ?? flyer.coverUrl ?? undefined}
              alt={flyer.title}
              className="w-full h-full object-contain"
            />
          )}

          {flyer.assetType === "VIDEO" && (
            <video
              src={flyer.displayUrl ?? ""}
              controls
              className="w-full h-full object-contain"
            />
          )}

          {flyer.assetType === "PDF" && (
            <>
              {flyer.campaign.isPaid && !isPaid ? (
                // Locked PDF: show cover
                flyer.coverUrl ? (
                  <img
                    src={flyer.coverUrl}
                    alt={`${flyer.title} cover`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-center text-gray-500">
                    This PDF is for sale. Please buy to preview.
                  </p>
                )
              ) : (
                // Unlocked PDF: preview inline
                <>
                  <iframe
                    src={`/api/flyers/${flyer.id}/pdf`}
                    className="w-full h-[80vh]"
                    title="PDF Preview"
                  />
                  {/* Download Button */}
                  <a
                    href={`/api/flyers/${flyer.id}/pdf`}
                    download={`${flyer.title}.pdf`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 mt-4 inline-block"
                  >
                    Download PDF
                  </a>
                </>
              )}
            </>
          )}
        </section>


        {/* Right Rail */}
        <aside className="space-y-6">
          {/* QR Code */}
          {flyer.links[0]?.qr?.imageUrl && (
            <div className="rounded-3xl bg-white shadow-xl p-6 flex flex-col items-center">
              <p className="text-sm text-neutral-600 mb-3">Scan QR</p>
              <img
                src={flyer.links[0].qr.imageUrl}
                alt="QR Code"
                className="w-40 h-40 object-contain"
              />
              <p className="text-xs text-neutral-500 mt-3 break-all text-center">{shareUrl}</p>
            </div>
          )}

          {/* Form */}
          {flyer.form && (
            <div className="rounded-3xl bg-white shadow-xl p-6">
              <h3 className="font-semibold mb-3">{flyer.form.name}</h3>
              {flyer.form.fields.map((f) => (
                <div key={f.name} className="mb-3">
                  <label className="block text-sm text-neutral-800 mb-1">{f.name}</label>
                  <input
                    type={f.type}
                    value={formData[f.name] ?? ""}
                    onChange={(e) => handleFormChange(f.name, e.target.value)}
                    required={f.required}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              ))}
              <button
                onClick={submitForm}
                className="mt-2 w-full px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Submit Form
              </button>
            </div>
          )}

          {/* Subscribe */}
          <div className="rounded-3xl bg-white shadow-xl p-6">
            <h3 className="font-semibold mb-3">Subscribe</h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                onClick={doSubscribe}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white"
              >
                Join
              </button>
            </div>
          </div>

          {/* Feedback */}
          <div className="rounded-3xl bg-white shadow-xl p-6">
            <h3 className="font-semibold mb-3">Feedback</h3>
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`size-8 rounded-full grid place-items-center border ${n <= rating ? "bg-yellow-400" : "bg-neutral-100"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think?"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900 min-h-[90px]"
            />
            <button
              onClick={doFeedback}
              className="mt-3 w-full px-4 py-2 rounded-xl bg-neutral-900 text-white"
            >
              Submit
            </button>
          </div>
        </aside>
      </main>

      {/* Payment & OTP Modals */}
      {paymentLoading && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center text-white">
          <p className="text-lg animate-pulse">
            Processing payment… Please confirm on your phone
          </p>
        </div>
      )}

      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-4">Enter Payment Details</h2>
            <input
              type="text"
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full mb-3 rounded-xl border border-neutral-300 px-3 py-2"
            />
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full mb-3 rounded-xl border border-neutral-300 px-3 py-2"
            >
              <option value="airtel">Airtel</option>
              <option value="mtn">MTN</option>
              <option value="zamtel">Zamtel</option>
            </select>
            <select
              value={bearer}
              onChange={(e) =>
                setBearer(e.target.value as "merchant" | "customer")
              }
              className="w-full mb-3 rounded-xl border border-neutral-300 px-3 py-2"
            >
              <option value="merchant">Merchant</option>
              <option value="customer">Customer</option>
            </select>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="px-4 py-2 rounded-xl bg-neutral-200 text-black"
              >
                Cancel
              </button>
              <button
                onClick={submitPaymentForm}
                disabled={paymentLoading}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {paymentLoading ? "Processing…" : "Pay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showOtpForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-4">Enter OTP</h2>
            <input
              type="text"
              placeholder="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full mb-3 rounded-xl border border-neutral-300 px-3 py-2"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowOtpForm(false)}
                className="px-4 py-2 rounded-xl bg-neutral-200 text-black"
              >
                Cancel
              </button>
              <button
                onClick={submitOtpForm}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
              >
                Submit OTP
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-10 text-center text-white/50 text-sm">
        Powered by Onix-Ads
      </footer>
    </div>
  );
}
