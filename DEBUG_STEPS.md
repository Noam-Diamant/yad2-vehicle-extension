# שלבי Debug - פתרון בעיות

## בעיה 1: פתיחת Developer Tools

אם F12 לא עובד, נסה:

### שיטות חלופיות:
1. **Ctrl + Shift + I** (Windows)
2. **קליק ימני על הדף → "בדוק"** (Inspect Element)
3. **תפריט Chrome → ⋮ → כלים נוספים → כלי מפתח**
4. **Ctrl + Shift + J** (פותח ישר ל-Console)

### אם עדיין לא עובד:
- בדוק אם יש תוכנה חוסמת (אנטי-וירוס, תוכנות אבטחה)
- נסה בדפדפן אחר (Edge, Firefox)
- הפעל מחדש את הדפדפן

## בעיה 2: Debug Information לא מופיע

אם ה-popup ריק או לא מציג debug info:

1. **רענן את התוסף:**
   - לך ל-`chrome://extensions/`
   - מצא את התוסף
   - לחץ על אייקון הרענון 🔄

2. **נקה את ה-Cache:**
   - Developer Tools → Application → Storage → Clear storage
   - או רענן את הדף

3. **בדוק Console:**
   - פתח Developer Tools
   - לך ל-Console tab
   - חפש הודעות שגיאה

## בעיה 3: חילוץ נתונים לא עובד

אם הנתונים לא מחולצים:

1. **בדוק שהתוסף רץ:**
   - Console → חפש "Starting vehicle data extraction..."
   - אם אין הודעה כזו, התוסף לא רץ

2. **בדוק את הדף:**
   - ודא שאתה בדף Bidspirit
   - ודא שהדף נטען לחלוטין

3. **הרץ Debug Script ידנית:**
   - Console → העתק והדבק את הקוד מ-debug-content.js
   - לחץ Enter
   - בדוק את התוצאות

## שלבי בדיקה מהירים:

1. ✅ פתח Developer Tools (F12 או Ctrl+Shift+I)
2. ✅ לך ל-Console tab
3. ✅ רענן את הדף
4. ✅ לחץ על אייקון התוסף
5. ✅ בדוק הודעות ב-Console
6. ✅ בדוק מה מופיע ב-popup

## אם עדיין לא עובד:

1. **העתק את כל התוכן של debug-content.js**
2. **הדבק ב-Console**
3. **לחץ Enter**
4. **העתק את כל הפלט והעבר לי**

זה יעזור לי להבין בדיוק איפה הבעיה!



