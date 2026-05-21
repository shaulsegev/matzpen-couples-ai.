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
  
  // States עבור מנגנון הדיוק
  const [isRefining, setIsRefining] = useState(false);
  const [refinementText, setRefinementText] = useState("");

  const fetchProcessData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth");
      return;
    }

    const { data, error } = await supabase.from("processes").select("*").eq("id", params.id).single();
    if (error || !data) {
      router.push("/dashboard");
      return;
    }

    setProcess(data);
    setIsCreator(session.user.id === data.creator_id);
    if (data.ai_response) setAiResponse(data.ai_response);
    setLoading(false);
  };

  useEffect(() => {
    fetchProcessData();
  }, [params.id]);

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
    } catch (error) {
      alert("שגיאה בניתוח.");
    } finally {
      setAnalyzing(false);
    }
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
      <p key={i} className="mb-2">
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold text-gray-950">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    ));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">טוען חדר גישור...</div>;
  if (!process) return null;

  const sections = aiResponse ? parseSections(aiResponse) : { shared: "", creator: "", partner: "" };
  const myCommitment = isCreator ? process.creator_commitment : process.partner_commitment;
  const partnerCommitment = isCreator ? process.partner_commitment : process.creator_commitment;
  const myPersonalInstructions = isCreator ? sections.creator : sections.partner;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-right" dir="rtl">
      <div className="max-w-4xl mx-auto pb-20">
        <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-gray-700 mb-6 text-sm">← חזרה ללוח בקרה</button>

        <header className="mb-10 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-900">{process.topic}</h1>
        </header>

        {aiResponse && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100">
              <h2 className="text-xl font-bold text-green-800 mb-4">תמונת המצב המשותפת</h2>
              <div className="text-gray-700 leading-relaxed text-base">{renderFormattedText(sections.shared)}</div>
            </div>

            <div className="bg-blue-50 p-8 rounded-2xl border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-3">המשימה האישית שלך</h3>
              <div className="text-gray-800 text-sm leading-relaxed">{renderFormattedText(myPersonalInstructions)}</div>
            </div>

            {/* מנגנון הדיוק החדש */}
            <div className="mt-8">
              {!isRefining ? (
                <button onClick={() => setIsRefining(true)} className="text-blue-600 font-bold hover:underline text-sm">
                  + בקש דיוק או הבהרה מהמגשר
                </button>
              ) : (
                <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3">מה תרצה לדייק?</h4>
                  <textarea 
                    className="w-full border p-3 rounded-lg mb-4 text-sm"
                    placeholder="כתוב מה מרגיש לא מדויק או מה תרצה שהמגשר יבהיר..."
                    onChange={(e) => setRefinementText(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button onClick={() => { handleAnalyze(refinementText); setIsRefining(false); }} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm">שלח לדיוק מחדש</button>
                    <button onClick={() => setIsRefining(false)} className="text-gray-500 text-sm">ביטול</button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">סיכום הסכמות לשינוי</h2>
              {!myCommitment ? (
                <div className="space-y-4">
                  <textarea className="w-full border rounded-xl p-4 h-24 bg-gray-50 text-sm" placeholder="אני מתחייב ש..." onChange={(e) => setCommitment(e.target.value)} />
                  <button onClick={handleSaveCommitment} disabled={savingCommitment} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold text-sm">{savingCommitment ? "שומר..." : "נעל התחייבות"}</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-6 rounded-xl border border-green-100"><p className="text-green-900 italic">"{myCommitment}"</p></div>
                  <div className={`p-6 rounded-xl border ${partnerCommitment ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <p className="text-gray-600">{partnerCommitment ? `"${partnerCommitment}"` : "ממתין להתחייבות השני..."}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!aiResponse && (
          <div className="bg-gray-900 text-white p-10 rounded-2xl text-center">
            <h3 className="text-2xl font-bold mb-4">מוכנים לצאת לדרך?</h3>
            <button onClick={() => handleAnalyze()} disabled={analyzing} className="bg-blue-600 px-8 py-3 rounded-lg font-bold">
              {analyzing ? "מגשר..." : "התחל ניתוח קונפליקט משותף"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}