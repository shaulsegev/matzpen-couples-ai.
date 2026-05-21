"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function NewProcessQuestionnaire() {
  const router = useRouter();
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    creatorPerspective: "",
    creatorEmotion: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("החיבור פג, אנא התחבר מחדש");
        router.push("/auth");
        return;
      }

      const { error } = await supabase.from("processes").insert({
        creator_id: session.user.id,
        topic: formData.topic,
        creator_perspective: formData.creatorPerspective,
        creator_emotion: formData.creatorEmotion,
        status: "pending_partner"
      });

      if (error) throw error;

      router.push("/dashboard");
    } catch (error: any) {
      console.error("שגיאה בשמירת התהליך:", error.message);
      alert("שמירת הנתונים נכשלה, אנא נסה שוב");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-right" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => router.push("/dashboard")}
          className="text-gray-500 hover:text-gray-800 mb-6 font-medium text-sm transition-colors"
          disabled={submitting}
        >
          חזרה ללוח הבקרה
        </button>
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">תחילת תהליך גישור זוגי</h1>
          <p className="text-gray-600">הקול שלך הוא הצעד הראשון. מלא את חלקך בקונפליקט, ולאחר מכן המערכת תפיק קישור הזמנה מאובטח עבור הצד השני.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
          
          <div>
            <label className="block text-gray-800 font-semibold mb-2">מהו האירוע או הנושא הספציפי שעליו הקונפליקט?</label>
            <input 
              type="text" 
              name="topic"
              required
              disabled={submitting}
              placeholder="לדוגמה: הוויכוח על סידור הבית אתמול בערב, או ההוצאה הכספית בסוף השבוע..."
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              onChange={handleChange}
            />
            <p className="text-sm text-gray-500 mt-2 font-medium">
              שים לב: זהו המשפט היחיד שיוצג לבן/בת הזוג בהזמנה. נסח אותו כאירוע עובדתי וברור, ללא האשמות.
            </p>
          </div>

          <div>
            <label className="block text-gray-800 font-semibold mb-2">איך אתה חווה את המצב מהזווית שלך?</label>
            <textarea 
              name="creatorPerspective"
              required
              rows={5}
              disabled={submitting}
              placeholder="תאר את העובדות, המחשבות והתסכולים שלך בצורה הכנה ביותר..."
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              onChange={handleChange}
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-800 font-semibold mb-2">מהו הרגש הדומיננטי ביותר שאתה מרגיש כרגע?</label>
            <select 
              name="creatorEmotion"
              required
              disabled={submitting}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              onChange={handleChange}
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
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition-colors mt-4 shadow-sm disabled:bg-blue-400"
          >
            {submitting ? "מייצר תהליך וקוד הזמנה..." : "שמור נתונים והפק קישור הזמנה לבת/בן הזוג"}
          </button>
        </form>
      </div>
    </div>
  );
}