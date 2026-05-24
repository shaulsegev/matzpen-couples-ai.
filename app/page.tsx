import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4" dir="rtl">
      <div className="max-w-2xl text-center space-y-6">
        
        {/* אלמנט הלוגו המרכזי */}
        <div className="flex justify-center mb-4">
          <img 
            src="/logo.png" 
            alt="לוגו מצפן" 
            className="w-40 h-40 object-contain opacity-95"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-blue-900">
            מצפן
          </h1>
          <p className="text-xl text-slate-600 font-medium">
            לנווט את הקשר למקום בטוח
          </p>
        </div>
        
        <p className="text-slate-500 text-lg leading-relaxed">
          פלטפורמת גישור חכמה ודיסקרטית המאפשרת לשני בני הזוג להשמיע את קולם בסביבה בטוחה, לזהות פערים בתקשורת, ולייצר בהירות להמשך הדרך.
        </p>

        <div className="flex gap-4 justify-center pt-8">
          <Link 
            href="/auth" 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
          >
            יצירת תהליך חדש
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-8 text-sm text-slate-400">
      </footer>
    </main>
  );
}