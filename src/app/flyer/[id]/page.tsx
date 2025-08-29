"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type QR = { id: string; imageUrl: string | null };
type Link = { id: string; slug: string; qr: QR | null };
type CampaignMeta = { name: string; isPaid: boolean; buyLink: string | null };

type Flyer = {
  id: string;
  title: string;
  description?: string;
  cdnUrl: string | null;
  assetType: "IMAGE" | "VIDEO" | "PDF";
  links: Link[];
  campaign: CampaignMeta;
};

export default function FlyerViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [flyer, setFlyer] = useState<Flyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");

  const shareUrl = useMemo(() => typeof window !== "undefined" ? window.location.href : "", []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await fetch(`/api/flyers/${id}`);
        if (!r.ok) throw new Error("Failed to fetch flyer");
        const data: Flyer = await r.json();
        setFlyer(data);

        // Track unique VIEW (server deduped)
        fetch(`/api/flyers/${id}/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "VIEW" }),
        }).catch(() => {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const doShare = async (network: "whatsapp" | "twitter" | "facebook" | "linkedin") => {
    const text = encodeURIComponent(`${flyer?.title ?? "Check this out!"}`);
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
    }).catch(() => {});
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

  const doBuy = async () => {
    fetch(`/api/flyers/${id}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "BUY" }),
    }).catch(() => {});
    if (flyer?.campaign.buyLink) window.open(flyer.campaign.buyLink, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-950 text-white">
        <p className="text-lg animate-pulse">Loading flyer…</p>
      </div>
    );
  }
  if (!flyer) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-950 text-white">
        <p className="text-lg">Flyer not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-white/10 grid place-items-center">🅾️</div>
          <div>
            <h1 className="text-white text-xl font-semibold">{flyer.campaign.name}</h1>
            <p className="text-white/60 text-sm">{flyer.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => doShare("twitter")} className="px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20">Share</button>
          {flyer.campaign.isPaid && (
            <button onClick={doBuy} className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600">
              Buy
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Asset */}
        <section className="md:col-span-2 rounded-3xl bg-white shadow-xl overflow-hidden min-h-[60vh] grid place-items-center p-4">
          {flyer.assetType === "IMAGE" && flyer.cdnUrl && (
            <img
              src={flyer.cdnUrl}
              alt={flyer.title}
              className="w-full h-full object-contain"
              onError={() => console.error("Failed to load asset:", flyer.cdnUrl)}
            />
          )}
          {flyer.assetType === "VIDEO" && flyer.cdnUrl && (
            <video src={flyer.cdnUrl} controls className="w-full h-full object-contain" />
          )}
          {flyer.assetType === "PDF" && flyer.cdnUrl && (
            <iframe src={flyer.cdnUrl} className="w-full h-[80vh]" />
          )}
        </section>

        {/* Right rail */}
        <aside className="space-y-6">
          {/* QR */}
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

          {/* Share */}
          <div className="rounded-3xl bg-white shadow-xl p-6">
            <h3 className="font-semibold mb-3">Share</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => doShare("whatsapp")} className="px-3 py-2 rounded-xl bg-neutral-900 text-white">WhatsApp</button>
              <button onClick={() => doShare("twitter")} className="px-3 py-2 rounded-xl bg-neutral-900 text-white">X / Twitter</button>
              <button onClick={() => doShare("facebook")} className="px-3 py-2 rounded-xl bg-neutral-900 text-white">Facebook</button>
              <button onClick={() => doShare("linkedin")} className="px-3 py-2 rounded-xl bg-neutral-900 text-white">LinkedIn</button>
            </div>
          </div>

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
              <button onClick={doSubscribe} className="px-4 py-2 rounded-xl bg-neutral-900 text-white">Join</button>
            </div>
          </div>

          {/* Feedback */}
          <div className="rounded-3xl bg-white shadow-xl p-6">
            <h3 className="font-semibold mb-3">Feedback</h3>
            <div className="flex items-center gap-2 mb-3">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`size-8 rounded-full grid place-items-center border ${n<=rating ? "bg-yellow-400" : "bg-neutral-100"}`}
                >{n}</button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e)=>setComment(e.target.value)}
              placeholder="What did you think?"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900 min-h-[90px]"
            />
            <button onClick={doFeedback} className="mt-3 w-full px-4 py-2 rounded-xl bg-neutral-900 text-white">Submit</button>
          </div>
        </aside>
      </main>

      <footer className="py-10 text-center text-white/50 text-sm">
        Powered by Onix-Ads
      </footer>
    </div>
  );
}
