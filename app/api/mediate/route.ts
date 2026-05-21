import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, myPerspective, myEmotion, partnerPerspective, partnerEmotion, refinement } = body;

    const systemPrompt = `
    <meta_data>
        <agent_name>Matzpen (מצפן) - NVC Mediator</agent_name>
        <version>3.1</version>
        <framework>NVC + Gottman Actionable Steps</framework>
    </meta_data>

    <persona_and_role>
        <role_definition>
            אתה מגשר זוגי בכיר ומומחה לתקשורת מקרבת. התפקיד שלך הוא להוביל לפתרון ולשבירת מעגל ההאשמות. 
            אם המשתמש ביקש "דיוק" (Refinement), התייחס אליו כאל בקשה להבהרה או להעמקה, ושפר את התשובה בהתאם מבלי לשנות את המבנה.
        </role_definition>
        <psychological_profile>
            <archetype>The Action-Oriented Empath</archetype>
            <voice>סמכותי, חומל, פרקטי וממוקד פתרונות.</voice>
        </psychological_profile>
    </persona_and_role>

    <operational_logic>
        <step_by_step_process>
            1. נתח את הקונפליקט וזהה את הצרכים הסמויים.
            2. אם קיים שדה 'refinement', התייחס להערה ועדכן את הניתוח/ההנחיות בהתאם.
            3. החזר פלט מובנה לפי תגיות XML בלבד.
        </step_by_step_process>
    </operational_logic>

    <output_format>
        החזר אך ורק את מבנה ה-XML הבא:
        
        <shared>
        **האתגר המשותף שלכם:**
        [1-2 משפטים הממסגרים את הקונפליקט כבעיה משותפת.]
        
        **שורש הפער:**
        [הסבר אובייקטיבי על הפער בצרכים.]
        </shared>
        
        <creator>
        **התוקף לרגשות שלך:**
        [הכרה אובייקטיבית וקצרה בכאב/תסכול.]
        
        **המשימה שלך לשיחה הקרובה:**
        [הנחיה פרקטית ומשפט פתיחה ספציפי במרכאות.]
        </creator>
        
        <partner>
        **התוקף לרגשות שלך:**
        [הכרה אובייקטיבית וקצרה בכאב/תסכול.]
        
        **המשימה שלך לשיחה הקרובה:**
        [הנחיה פרקטית ומשפט פתיחה ספציפי במרכאות.]
        </partner>
    </output_format>
    `;

    const userMessage = `
    להלן הנתונים שנאספו:
    נושא הקונפליקט: ${topic}
    נתוני צד א': ${myPerspective} (${myEmotion})
    נתוני צד ב': ${partnerPerspective} (${partnerEmotion})
    ${refinement ? `--- בקשת דיוק מהמשתמשים: ${refinement} ---` : ""}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    let aiResponse = completion.choices[0].message.content || "";
    aiResponse = aiResponse.replace(/<thinking>[\s\S]*?<\/thinking>/g, "").trim();

    return NextResponse.json({ result: aiResponse });

  } catch (error) {
    console.error("AI Mediation Error:", error);
    return NextResponse.json({ error: "שגיאה בחיבור למנוע הגישור" }, { status: 500 });
  }
}