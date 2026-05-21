"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";

export default function JoinProcess() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [processInfo, setProcessInfo] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  
  const [partnerPerspective, setPartnerPerspective] = useState("");
  const [partnerEmotion, setPartnerEmotion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchProcess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      const { data: processData, error } = await supabase
        .from("processes")
        .select("id, topic, creator_id, status")
        .eq("invite_token", params.token)
        .single();

      if (error || !processData) {
        alert("הקישור אינו תקין או שפג תוקפו.");
        router.push("/");
        return;
      }

      if (processData.status !== "pending_partner") {
        alert("תהליך זה כבר פעיל וסגור להצטרפות.");
        router.push("/");
        return;
      }

      setProcessInfo(processData);
      setLoading(false);
    };

    checkAuthAndFetchProcess();
  }, [params.token, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (session?.user?.id === processInfo.creator_id) {
      alert("אינך יכול להצטרף כבן זוג לתהליך שאתה בעצמך פתחת.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("processes")
        .update({
          partner_id: session.user.id,
          partner_perspective: partnerPerspective,
          partner_emotion: partnerEmotion,
          status: "active"
        })
        .eq("id", processInfo.id);

      if (error) throw error;

      router.push(`/dashboard/process/${processInfo.id}`);
    } catch (error) {
      console.error("Error joining process:", error);
      alert("אירעה שגיאה בשמירת הנתונים.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">מאתר את חדר הגישור...</div>;
  }

  // מסך חסימה חכם למשתמשים שאינם מחוברים
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-right" dir="rtl">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">הזמנה לגישור זוגי</h1>
          <p className="text-gray-600 mb-6">
            הוזמנת להצטרף למרחב דיגיטלי בטוח בנושא:<br/>
            <strong className="text-blue-700 text-lg mt-2 inline-block">&quot;{processInfo.topic}&quot;</strong>
          </p>
          <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-lg mb-6 text-sm font-medium">
            כדי לשמור על דיסקרטיות מלאה, עליך להתחבר או ליצור חשבון קצרצר לפני שתוכל לכתוב את הזווית שלך.
          </div>
          <button 
            onClick={() => {
              sessionStorage.setItem("returnToJoin", params.token as string);
              router.push("/auth");
            }}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            מעבר לעמוד ההתחברות / הרשמה
          </button>
        </div>
      </div>
    );
  }

  // הטופס עצמו שמוצג לאחר התחברות
  return (
    <div className="min-h-screen bg-gray-50 p-8 text-right" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">הזמנה לגישור זוגי</span>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">בן/בת הזוג מזמינים אותך לשיח</h1>
          <p className="text-gray-600">
            הצטרפת למרחב הגישור הדיגיטלי בנושא: <strong className="text-black">&quot;{processInfo.topic}&quot;</strong>. 
            החלק שלך יישמר חסוי לחלוטין, הצד השני לא יוכל לראות מה כתבת. המערכת תבצע הצלבה עיוורת בלבד.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div>
            <label className="block text-gray-800 font-semibold mb-2">איך אתה חווה את המצב מהזווית המלאה שלך?</label>
            <textarea 
              required
              rows={6}
              disabled={submitting}
              placeholder="כתוב בצורה חופשית וכנה את התחושות והצד שלך בסיטואציה..."
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              onChange={(e) => setPartnerPerspective(e.target.value)}
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-800 font-semibold mb-2">מהו הרגש הדומיננטי ביותר אצלך כרגע בתוך הקונפליקט?</label>
            <select 
              required
              disabled={submitting}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              onChange={(e) => setPartnerEmotion(e.target.value)}
            >
              <option value="">בחר רגש מתוך הרשימה...</option>
              <option value="anger">כעס / תסכול</option>
              <option value="sadness">עצב / פגיעות</option>
              <option value="fear">חרדה / חוסר אונים</option>
              <option value="distance">ריחוק / ניתוק</option>
              <option value="exhaustion">שחיקה / עייפות</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 text-white font-bold py-3.5 rounded-lg hover:bg-green-700 transition-colors mt-4 shadow-sm disabled:bg-green-400"
          >
            {submitting ? "מעדכן ומכין מרחב גישור..." : "נעל נתונים ושלח לניתוח גישור משותף"}
          </button>
        </form>
      </div>
    </div>
  );
}