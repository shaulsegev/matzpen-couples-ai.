"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";

interface ProcessData {
  id: string;
  topic: string;
  creator_id: string;
  partner_id: string;
  creator_perspective: string;
  partner_perspective: string;
  creator_emotion: string;
  partner_emotion: string;
  status: string;
  ai_response: string | null;
  creator_commitment: string | null;
  partner_commitment: string | null;
  created_at: string;
}

export default function ProcessRoom() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [process, setProcess] = useState<ProcessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [commitment, setCommitment] = useState("");
  const [savingCommitment, setSavingCommitment] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementText, setRefinementText] = useState("");

  const fetchProcessData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/auth"); return; }
    const { data, error } = await supabase.from("processes").select("*").eq("id", params.id).single();
    if (error || !data) { router.push("/dashboard"); return; }
    setProcess(data);
    setIsCreator(session.user.id === data.creator_id);
    if (data.ai_response) setAiResponse(data.ai_response);
    setLoading(false);
  };

  useEffect(() => { fetchProcessData(); }, [params.id]);

  const handleSaveCommitment = async () => {
    if (!commitment.trim()) return;
    setSavingCommitment(true);
    const updateData = isCreator ? { creator_commitment: commitment } : { partner_commitment: commitment };
    const { error } = await supabase.from("processes").update(updateData).eq("id", params.id);
    if (!error) fetchProcessData();
    setSavingCommitment(false);
  };

  const handleAnalyze = async (refinement?: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/mediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: process?.topic,
          myPerspective: isCreator ? process?.creator_perspective : process?.partner_perspective,
          myEmotion: isCreator ? process?.creator_emotion : process?.partner_emotion,
          partnerPerspective: isCreator ? process?.partner_perspective : process?.creator_perspective,
          partnerEmotion: isCreator ? process?.partner_emotion : process?.creator_emotion,
          refinement: refinement || null
        })
      });
      const data = await res.json();
      await supabase.from("processes").update({ ai_response: data.result }).eq("id", params.id);
      setAiResponse(data.result);
    } catch (error) { alert("שגיאה בניתוח."); } finally { setAnalyzing(false); }
  };

  const parseSections = (text: string) => {
    const getTagContent = (tag: string) => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
      const match = text.match(regex);
      return match ? match[1].trim() : "";
    };
    return { shared: getTagContent("shared"), creator: getTagContent("creator"), partner: getTagContent("partner") };
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <p key={i} className="mb-4">
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    ));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50">מכין את מרחב הגישור...</div>;
  if (!process) return null;

  const sections = aiResponse ? parseSections(aiResponse) : { shared: "", creator: "", partner: "" };
  const myCommitment = isCreator ? process.creator_commitment : process.partner_commitment;
  const partnerCommitment = isCreator ? process.partner_commitment : process.creator_commitment;
  const myPersonalInstructions = isCreator ? sections.creator : sections.partner;

  return (
    <div className="min-h-screen bg-stone-50 p-8 text-right" dir="rtl">
      <div className="max-w-4xl mx-auto pb-20">
        <button onClick={() => router.push("/dashboard")} className="text-slate-400 hover:text-slate-600 mb-8 transition-colors">← חזרה ללוח בקרה</button>

        {/* לוגו */}
        <div className="flex justify-center mb-8">
        <img src="/logo.png" alt="מצפן" className="w-24 h-24 object-contain opacity-90" />
        </div>

        <header className="mb-12 border-b border-stone-200 pb-10 text-center">
          <h1 className="text-4xl font-light text-slate-800 mb-3 tracking-tight">חדר הגישור: {process.topic}</h1>
          <p className="text-slate-500 font-light">הצלבת הגרסאות הושלמה. לפניכם תובנות שנכתבו עבורכם ברגישות.</p>
        </header>

        {aiResponse && (
          <div className="space-y-10">
            <div className="bg-white p-10 rounded-3xl shadow-lg shadow-slate-100 border border-slate-100">
              <h2 className="text-2xl font-medium text-slate-700 mb-8 flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-indigo-300 rounded-full"></span>
                תמונת המצב המשותפת
              </h2>
              <div className="text-slate-600 leading-loose text-lg font-light">{renderFormattedText(sections.shared)}</div>
            </div>

            <div className="bg-stone-100 p-10 rounded-3xl border border-stone-200">
              <h3 className="text-xl font-medium text-slate-800 mb-6">המשימה האישית שלך</h3>
              <div className="text-slate-700 leading-loose text-base font-light">{renderFormattedText(myPersonalInstructions)}</div>
            </div>

            <div className="mt-8">
              {!isRefining ? (
                <button onClick={() => setIsRefining(true)} className="text-indigo-400 font-medium hover:underline text-sm transition-all">
                  + בקש דיוק או הבהרה מהמגשר
                </button>
              ) : (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h4 className="font-medium text-slate-800 mb-4">מה תרצה לדייק?</h4>
                  <textarea className="w-full border border-slate-200 p-4 rounded-2xl mb-4 text-sm" placeholder="כתוב מה מרגיש לא מדויק..." onChange={(e) => setRefinementText(e.target.value)} />
                  <div className="flex gap-4">
                    <button onClick={() => { handleAnalyze(refinementText); setIsRefining(false); }} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-medium text-sm hover:bg-slate-900">שלח לדיוק מחדש</button>
                    <button onClick={() => setIsRefining(false)} className="text-slate-400 text-sm">ביטול</button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-lg shadow-slate-100 border border-slate-100 mt-12">
              <h2 className="text-2xl font-medium text-slate-800 mb-8">סיכום הסכמות לשינוי</h2>
              {!myCommitment ? (
                <div className="space-y-6">
                  <textarea className="w-full border border-slate-200 rounded-2xl p-5 h-28 bg-stone-50 text-sm" placeholder="אני מתחייב ש..." onChange={(e) => setCommitment(e.target.value)} />
                  <button onClick={handleSaveCommitment} disabled={savingCommitment} className="bg-indigo-400 text-white px-10 py-4 rounded-2xl font-medium text-sm hover:bg-indigo-500 transition-all shadow-md">{savingCommitment ? "שומר..." : "נעל התחייבות"}</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100"><p className="text-indigo-900 italic font-light">"{myCommitment}"</p></div>
                  <div className={`p-8 rounded-3xl border ${partnerCommitment ? 'bg-stone-100' : 'bg-stone-50 border-stone-100'}`}>
                    <p className="text-slate-500 font-light">{partnerCommitment ? `"${partnerCommitment}"` : "ממתין להתחייבות השני..."}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!aiResponse && (
          <div className="bg-slate-800 text-white p-12 rounded-3xl text-center shadow-2xl">
            <h3 className="text-3xl font-light mb-6">מרחב הגישור ממתין לניתוח</h3>
            <button onClick={() => handleAnalyze()} disabled={analyzing} className="bg-indigo-400 px-10 py-4 rounded-2xl font-medium hover:bg-indigo-500 transition-all">
              {analyzing ? "מגשר..." : "התחל ניתוח קונפליקט משותף"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}