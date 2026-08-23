# 🏫 SmartSchool OS — School Admin Quick-Start Guide

> **For:** School principal / admin staff (no technical background needed)
> **Time to read:** 15 minutes
> **Time to onboard your school:** ~2 hours over 4 days
> **Support:** Reply to the WhatsApp message you got from us

---

## 👋 Welcome!

Namaste! SmartSchool OS ek school management app hai jisse aap apne school ka poora data — students, teachers, attendance, homework, fees, results — ek jagah manage kar sakte hain. Parents aur students ko bhi apna data mobile pe dikhega.

Yeh guide aapko **4 din mein** school setup karne mein madad karega. Roz 30 minute rakhiye, bas.

---

## 📱 App Kahan Milega?

**Web browser se (recommended for admin):**
```
https://smartschool-rdsw0eb9s-jangidarts3860-5453s-projects.vercel.app
```
Apne computer ka Chrome/Edge browser mein yeh URL kholein. Bookmark kar lein.

**Mobile pe (parents/students ke liye):**
Same URL mobile browser mein kholein. "Add to Home Screen" karein toh app jaisa install ho jayega.

---

## 📅 Day 1 — School Setup (30 min)

### Step 1: Login karein
- Browser mein URL kholein
- **Admin** tab select karein
- Email + Password daal ke login karein
- (Aapko humne pehle se email + magic link bheja hoga)

### Step 2: School profile bharein
Login ke baad aapko **Dashboard** dikhega. Top menu mein **Settings** → **School Profile** (INFO tab) pe click karein.

Yahan bharein:
- **School name** (English + Hindi both, agar chahiye)
- **Principal ka naam**
- **School ka address** (poora, with pincode)
- **Phone number** (whatsapp wala)
- **Email**
- **Logo** (agar h toh upload karein — image file, max 5MB)
- **Affiliation number** (agar CBSE/ICSE school ho)
- **Academic year** (e.g., "2026-2027")

💡 **Tip**: Logo upload karne pe report cards aur ID cards pe aapka logo aayega.

### Step 3: Branded color chunein (optional)
**Settings** → **Domain & White-Labeling** → Live preview mein color picker se apna school color chunein. App ka theme automatic change ho jayega.

✅ **Day 1 done!** School ka basic profile set ho gaya.

---

## 📅 Day 2 — Classes & Subjects (45 min)

### Step 1: Classes banayein
Top menu → **Academic Setup** (ya **Classes** section)

Har class add karein:
- **Class name**: e.g., "Class 1", "Class 2", "LKG", "UKG"
- **Section**: A, B, C (jo bhi ho)
- **Class teacher**: baad mein set karein (teacher add karne ke baad)

Example entries:
```
Class 1 - A
Class 1 - B
Class 2 - A
Class 2 - B
...
Class 10 - A
```

### Step 2: Subjects add karein
Same **Academic Setup** page → **Subjects** tab

- **Subject name**: e.g., "Hindi", "English", "Maths", "Science"
- **Class**: har subject ko class assign karein (ya "All Classes" chunein)
- **Max marks**: default 100, change kar sakte hain

### Step 3: Time slots set karein
**Academic Setup** → **Time Slots** tab

Apne school ka period schedule daalein:
- Period 1: 8:00 - 8:40
- Period 2: 8:40 - 9:20
- ... (jitne periods h)
- Lunch: 12:30 - 1:00
- Last period tak

Yeh timetable banane ke liye chahiye.

✅ **Day 2 done!** School ka academic structure ready h.

---

## 📅 Day 3 — Teachers (45 min)

### Step 1: Ek teacher add karein (test)
**Teachers** section → **Add Teacher** button

Form bharein:
- **Name** (poora naam)
- **Email** (unique — har teacher ka apna)
- **Phone** (10-digit, WhatsApp wala — ZAROORI hai invite ke liye)
- **Gender**
- **Qualification** (e.g., "B.Ed", "M.A. Hindi")
- **Class teacher of**: (optional, baad mein set kar sakte h)
- **Subjects**: comma-separated, e.g., "Hindi, Sanskrit"

**Save** pe click karein.

### Step 2: Invite automatic hoga
Jaise hi aap Save karenge:
- Teacher ka unique ID generate hoga (e.g., `TCH-2026-A7X9P-Q3`)
- Ek **temporary password** generate hoga
- **WhatsApp invite** khulega admin ke phone pe (aapke phone pe) — student/teacher ko forward karein

💡 **WhatsApp invite nahi khula?**
- Browser pe pop-up blocker check karein
- Settings → Communication Relays → "Enable WhatsApp invites" ON hona chahiye
- Teacher ke phone number sahi h (10 digits, with country code optional)

### Step 3: Baaki teachers add karein
Same process — 10 teachers ke liye 15-20 minute lagenge. Ek baar mein 5-10 add karein, fir break.

### Step 4: Teachers ko batayein
Teacher ko yeh 4 cheezein forward karein (WhatsApp pe):
1. **Teacher ID** (e.g., `TCH-2026-A7X9P-Q3`)
2. **Temporary password** (jo aapne dekha)
3. **App ka URL**: `https://smartschool-rdsw0eb9s-jangidarts3860-5453s-projects.vercel.app`
4. **Login steps**: Teacher tab → ID daalein → Password daalein → **"Set New Password"** wala screen aayega (pehli baar) → New password set karein → Dashboard khul jayega

✅ **Day 3 done!** Teachers ko invite ho gaya, woh login karke apna password set kar lenge.

---

## 📅 Day 4 — Students & Parents (60 min)

### Method A: Manual (chhoti classes, 1-30 students)
**Students** section → **Add Student**

Form bharein:
- **Name** (poora)
- **Student ID**: auto-generate hoga (e.g., `STU-2026-001`)
- **Class & Section**
- **Roll number**
- **Date of Birth** (parents ke liye zaroori — woh isi se login karenge)
- **Parent name**
- **Parent phone** (10-digit WhatsApp number — ZAROORI)
- **Address**
- **Photo** (optional, max 5MB)

Save karein → 4-digit PIN auto-generate hoga → WhatsApp pe parent ko forward karein.

### Method B: Bulk Import (zyada students, 30+)
**Onboarding Wizard** → **Step 2 (CSV Import)** ya **Students** → **Bulk Import** button

CSV file ka format (Excel mein bana sakte hain):
```csv
name,email,uniqueId,parentPhone,parentName,classId
Rahul Kumar,rahul@gmail.com,STU-2026-001,9876543210,Suresh Kumar,class-1-a
Priya Sharma,priya@gmail.com,STU-2026-002,9876543211,Ramesh Sharma,class-1-a
Amit Patel,amit@gmail.com,STU-2026-003,9876543212,Mahesh Patel,class-2-a
```

**Important columns:**
- `name` — student ka naam (required)
- `email` — unique, har student ka alag (required)
- `uniqueId` — student ID (required)
- `parentPhone` — 10-digit, parents ka WhatsApp number
- `parentName` — parents ka naam
- `classId` — class ki ID (e.g., `class-1-a`)

📋 **Tips:**
- Pehle 5-10 students add karein, fir test karein login
- Excel mein CSV file save karein: File → Save As → "CSV UTF-8"
- Upload karne ke baad PIN console mein dikhega — woh copy karke parents ko bhejein

### Parents ko inform karein
Parents ko yeh 4 cheezein bhejein:
1. **Student ID** (e.g., `STU-2026-001`)
2. **4-digit PIN**
3. **App URL**: `https://...vercel.app`
4. **Login steps**: Parent tab → Student ID daalein → Apna phone ka last 4 digit daalein → Login!

💡 **Parents ka phone wahi hona chahiye jo school ke paas registered hai.**

✅ **Day 4 done!** Students add ho gaye, parents ko invite ho gaya.

---

## 🗓️ Daily Use — Aage Kaise Karna Hai

### Roz subah (5 min):
- Dashboard kholein
- Check karein ki sab teachers ne attendance mark ki ya nahi
- Koi urgent notice ho toh **Announcements** → **New Notice** se bhejein

### Weekly (15 min):
- **Reports** section mein attendance aur fee report dekhein
- Defaulter list check karein (jo fees nahi di)
- Homework completion dekhein

### Monthly (30 min):
- **Reports** → **Fee Collection** download karein (PDF/Excel)
- **Reports** → **Attendance Report** download karein
- **Exams & Results** → Monthly test ke marks enter karein
- **Report Cards** generate karein (PDF, parents ko WhatsApp pe bhejein)

### Exam time (1-2 hours):
- **Exams** → **New Exam** → naam, class, subjects, dates daalein
- Teachers apne subject ke marks enter karenge (draft)
- Aap review karke **Publish** karein (students/parents ko dikhega tab)
- **Report Cards** → Class select karein → Auto-generate → Download

---

## 🆘 Common Problems & Solutions

### ❌ Teacher login nahi ho raha
- Check: Teacher ID sahi h? (case-sensitive: `TCH-2026-...`)
- Check: Temporary password sahi copy hua h? (kuch letter confuse hote h: 0/O, 1/l/I)
- **Solution**: Teacher list mein jayein → uss teacher pe click karein → **"Resend Invite"** button → naya password WhatsApp pe aayega

### ❌ Student login nahi ho raha
- Check: Student ID exact match h? (spaces, capitalization)
- Check: PIN 4 digit h? (lead zeros allowed h)
- **Solution**: Students list → student pe click → "Reset PIN" → naya PIN bhejein

### ❌ Parent login nahi ho raha
- Parent login = **Student ID + Phone ka last 4 digit**
- Check: Phone number school record se match karta h?
- **Solution**: Student profile mein parent phone update karein

### ❌ WhatsApp invite nahi khul raha
- Browser ka pop-up blocker check karein (top-right mein icon)
- Settings → Communication Relays → "Enable WhatsApp" ON h?
- Phone number sahi format mein h? (10 digits, no +91)

### ❌ Attendance mark nahi ho raha
- Internet connection check karein
- Class select karke date change karein (aaj ki date)
- Teacher assigned h is class ko? (Academic Setup mein)

### ❌ Report card PDF nahi ban raha
- Exam "Published" status mein h? (Draft se Publish karein)
- Sab subjects ke marks enter hue h? (kam se kam ek subject mein)
- Class select karke retry karein

### ❌ Fees record nahi dikh raha
- Student ka class select karein
- Fee category add karein (Fees → Settings → Fee Categories)
- **Month select karein** (dropdown se) — current month by default

### ❌ "Permission Denied" error
- User (teacher/student/parent) ko school ka member banayein
- Settings → Users mein role verify karein
- Browser refresh karein (Ctrl+R)

### ❌ Mobile pe app slow h
- WiFi pe try karein (3G pe slow hoga)
- Browser cache clear karein (Settings → Clear browsing data)
- Older phone pe "Lite Mode" try karein (agar available ho)

---

## 🔒 Security Tips

✅ **DO:**
- Apna password strong rakhein (8+ characters, mix of letters/numbers)
- Roz logout karein (specially shared computer pe)
- Kisi ko bhi apna password mat dein
- Student/teacher data sirf zarurat padne pe share karein

❌ **DON'T:**
- Public computer pe "Remember me" mat click karein
- WhatsApp pe student data screenshot mat bhejein (parents ke alawa)
- Apna phone ya computer chhod ke mat jayein jab app open ho

---

## 📞 Support Kaise Lein

### Bug report / Issue:
1. WhatsApp pe screenshot bhejein (jismein error dikhe)
2. Browser ka console log bhejein: F12 press karein → Console tab → screenshot
3. Ye info dein: Browser (Chrome/Safari), Device (laptop/phone), Problem kya hua

### Training / How-to:
- Yeh guide dobara padhein
- Ya WhatsApp pe "How to [kya karna hai]" message karein

### New feature request:
- WhatsApp pe likh ke bhejein — hum next update mein add karenge

---

## 📚 Quick Reference — Menu Map

| Kya karna hai | Kahan se |
|---|---|
| School ka naam/logo change | Settings → School Profile (INFO) |
| Teacher add karna | Teachers → Add Teacher |
| Student add karna | Students → Add Student |
| Attendance dekhna (admin) | Attendance → Select class → Date |
| Notice bhejna | Announcements → New Notice |
| Fees record | Fees → Select class → Student → Payment |
| Report card banana | Report Cards → Select class & exam → Generate |
| Backup lena | Settings → Security & Backups → Backup Now |
| Theme color change | Settings → Domain & White-Labeling |

---

## ✅ Day 1-4 Checklist

- [ ] Day 1: School profile bhara, logo upload kiya
- [ ] Day 2: Sab classes, subjects, time slots add kiye
- [ ] Day 3: Sab teachers add kiye, WhatsApp invites bhej diye
- [ ] Day 4: Sab students add kiye (manual ya CSV), parents ko PIN bhej diya
- [ ] Test: Ek teacher ne login karke attendance mark ki? ✓
- [ ] Test: Ek parent ne login karke homework dekha? ✓
- [ ] Test: Ek student ne login karke apna data dekha? ✓
- [ ] Test: Ek notice bheja aur dekha ki sabko dikha? ✓

Jab sab ✅ ho jaye, aapka school **officially live** h!

---

## 🎉 All the Best!

Aapka school ab digital h. Parents khush honge (transparency), teachers ka kaam aasaan hoga (no more register), aur aapko sab kuch ek jagah dikhega (dashboard).

**Koi bhi problem aaye, WhatsApp pe message karein — hum madad ke liye hamesha available hain.**

🙏 Dhanyavaad!

— SmartSchool OS Team
