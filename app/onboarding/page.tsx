"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);
  const [checkingBypass, setCheckingBypass] = useState(true);
  
  const [formData, setFormData] = useState({
    gender: "",
    partner_gender: "",
    status: "",
    years_together: "",
    has_children: "false",
    conflict_pattern: ""
  });

  useEffect(() => {
    const handleAutoBypass = async () => {
      const returnToken = sessionStorage.getItem("returnToJoin");
      
      // אם המשתמש הוא היוצר הראשי (אין לו אסימון הצטרפות), נציג לו את הטופס כרגיל
      if (!returnToken) {
        setCheckingBypass(false);
        return;
      }

      // אם זה בן זוג שהוזמן, נייצר לו פרופיל שקוף ונעביר אותו מיד לחדר
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        try {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", session.user.id)
            .single();

          if (!existingProfile) {
            await supabase.from("profiles").insert({
              id: session.user.id,
              gender: "partner",
              partner_gender: "creator",
              status: "invited",
              years_together: 0,
              has_children: false,
              conflict_pattern: "unknown"
            });
          }
          
          sessionStorage.removeItem("returnToJoin");
          router.push(`/join/${returnToken}`);
        } catch (error) {
          console.error("שגיאה ביצירת פרופיל אוטומטי:", error);
          setCheckingBypass(false);
        }
      } else {
        setCheckingBypass(false);
      }
    };

    handleAutoBypass();
  }, [router, supabase]);

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

      const { error } = await supabase.from("profiles").insert({
        id: session.user.id,
        gender: formData.gender,
        partner_gender: formData.partner_gender,
        status: formData.status,
        years_together: formData.years_together ? Number(formData.years_together) : null,
        has_children: formData.has_children === "true",
        conflict_pattern: formData.conflict_pattern
      });

      if (error) throw error;

      router.push("/dashboard");
    } catch (error: any) {
      console.error("שגיאה בשמירת הפרופיל:", error.message);
      alert("אירעה שגיאה בשמירת הנתונים. אנא נסה שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (checkingBypass) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">מכין מרחב מאובטח...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-right" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          הגדרת פרופיל זוגי
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          כדי שנוכל להתאים עבורך את תהליך הגישור בצורה המדויקת ביותר.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">המגדר שלי</label>
                <select name="gender" required onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <option value="">בחר...</option>
                  <option value="male">גבר</option>
                  <option value="female">אישה</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מגדר הצד השני</label>
                <select name="partner_gender" required onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <option value="">בחר...</option>
                  <option value="male">גבר</option>
                  <option value="female">אישה</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס הקשר</label>
                <select name="status" required onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <option value="">בחר...</option>
                  <option value="dating">יוצאים</option>
                  <option value="living_together">גרים יחד</option>
                  <option value="married">נשואים</option>
                  <option value="separated">פרודים</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כמה שנים יחד?</label>
                <input type="number" step="0.5" min="0" name="years_together" required onChange={handleChange} placeholder="לדוגמה: 3.5" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">האם יש ילדים משותפים?</label>
              <select name="has_children" required onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option value="false">לא</option>
                <option value="true">כן</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">כשמתחיל קונפליקט, הנטייה הטבעית שלי היא לרוב:</label>
              <select name="conflict_pattern" required onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option value="">בחר דפוס...</option>
                <option value="withdraw">להתכנס ולשתוק</option>
                <option value="explode">להתפרץ ולהרים קול</option>
                <option value="fix">לנסות לפתור הכל מיד עכשיו</option>
                <option value="escape">להתרחק פיזית מהמקום</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {submitting ? "שומר נתונים..." : "שמור פרופיל והיכנס למערכת"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}