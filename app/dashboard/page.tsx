"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface Process {
  id: string;
  topic: string;
  creator_emotion: string;
  status: string;
  invite_token: string;
  created_at: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUserAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth");
        return;
      }

      // נטרול לולאה, זיהוי הגעה מקישור שותף והפניה מיידית חזרה לטופס הקליטה
      const returnToken = sessionStorage.getItem("returnToJoin");
      if (returnToken) {
        sessionStorage.removeItem("returnToJoin");
        router.push(`/join/${returnToken}`);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        router.push("/onboarding");
        return;
      }

      const { data: fetchedProcesses, error: processesError } = await supabase
        .from("processes")
        .select("id, topic, creator_emotion, status, invite_token, created_at")
        .or(`creator_id.eq.${session.user.id},partner_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false });

      if (processesError) {
        console.error("שגיאה במשיכת נתונים:", processesError);
      } else if (fetchedProcesses) {
        setProcesses(fetchedProcesses);
      }

      const displayName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "אורח";
      setUserName(displayName);
      setLoading(false);
    };
    
    checkUserAndData();
  }, [router, supabase]);

  const translateEmotion = (emotion: string) => {
    const emotions: { [key: string]: string } = {
      anger: "כעס / תסכול",
      sadness: "עצב / פגיעות",
      fear: "חרדה / חוסר אונים",
      distance: "ריחוק / ניתוק",
      exhaustion: "שחיקה / עייפות"
    };
    return emotions[emotion] || emotion;
  };

  // שליחה ישירה לווטסאפ עם קישור דינמי וטקסט מובנה
  const sendViaWhatsApp = (token: string, topic: string) => {
    const link = `${window.location.origin}/join/${token}`;
    const message = `היי, פתחתי עבורנו מרחב גישור דיגיטלי ומאובטח בנושא: "${topic}".\nהמרחב נועד לתת מקום שווה לזווית של שנינו. אשמח שתיכנס/י ותכתוב/תכתבי את החוויה שלך כאן:\n${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = confirm("האם אתה בטוח שברצונך למחוק תהליך זה? הפעולה היא סופית ובלתי הפיכה.");
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from("processes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProcesses(processes.filter((proc) => proc.id !== id));
    } catch (error: any) {
      console.error("Error deleting process:", error.message);
      alert("מחיקת התהליך נכשלה, אנא נסה שוב.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xl text-gray-600">טוען נתונים...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-right" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">שלום, {userName}</h1>
            <p className="text-gray-600">השולחן העגול לפתרון קונפליקטים וגישור זוגי מונחה בינה מלאכותית.</p>
          </div>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/auth");
            }}
            className="text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 px-4 py-2 rounded-lg transition-colors"
          >
            התנתקות
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-dashed border-blue-300 flex flex-col justify-between h-56">
            <div>
              <h2 className="text-xl font-semibold mb-2 text-blue-600">פתח קונפליקט חדש</h2>
              <p className="text-gray-500 text-sm">הזן את הצד שלך והזמן את הצד השני לשיח מאובטח ומתווך.</p>
            </div>
            <button onClick={() => router.push("/dashboard/new")} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full font-medium text-center text-sm">
              התחל כעת
            </button>
          </div>

          {processes.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2 flex items-center justify-center text-gray-400">
              טרם פתחת תהליכי גישור במערכת.
            </div>
          ) : (
            processes.map((proc) => (
              <div key={proc.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-56 hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">{new Date(proc.created_at).toLocaleDateString("he-IL")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${proc.status === 'pending_partner' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700'}`}>
                      {proc.status === 'pending_partner' ? 'ממתין לצד השני' : 'פעיל'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{proc.topic}</h3>
                  <span className="inline-block text-xs text-gray-500 mb-2">הרגש שלך: {translateEmotion(proc.creator_emotion)}</span>
                </div>
                
                <div className="space-y-2">
                  {proc.status === 'pending_partner' ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => sendViaWhatsApp(proc.invite_token, proc.topic)}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex-1 font-medium text-center text-xs flex items-center justify-center gap-1 shadow-sm"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        וואטסאפ
                      </button>
                      <button 
                        onClick={() => handleDelete(proc.id)}
                        className="bg-red-50 text-red-600 border border-red-100 px-3 py-2 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors font-medium text-center text-xs"
                      >
                        מחק
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => router.push(`/dashboard/process/${proc.id}`)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full font-medium text-center text-xs"
                    >
                      כניסה לחדר הגישור
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}