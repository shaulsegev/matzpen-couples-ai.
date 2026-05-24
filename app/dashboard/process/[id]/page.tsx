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
        
        {/* כפתור חזרה נפרד וממוקם מעל */}
        <div className="flex justify-center mb-6">
          <button onClick={() => router.push("/dashboard")} className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
            ← חזרה ללוח בקרה
          </button>
        </div>

        {/* לוגו */}
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="מצפן" className="w-40 h-40 object-contain opacity-90" />
        </div>

        <header className="mb-12 border-b border-stone-200 pb-10 text-center">
          <h1 className="text-4xl font-light text-slate-800 mb-3 tracking-tight">חדר הגישור: {process.topic}</h1>
          <p className="text-slate-500 font-light">הצלבת הגרסאות הושלמה. לפניכם תובנות שנכתבו עבורכם ברגישות.</p>
        </header>

        {aiResponse && (
          <div className="space-y-10">
            {/* ... שאר תוכן הדף נשאר ללא שינוי ... */}
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
            
            {/* ... המשך הדף ... */}
          </div>
        )}
      </div>
    </div>
  );
}