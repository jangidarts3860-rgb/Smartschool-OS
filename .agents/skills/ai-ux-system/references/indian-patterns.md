# India Market Patterns — UX for Bharat

> Mobile-first, Tier 2/3 optimized, trust-first, bilingual-ready patterns.
> Version: 3.0 | Updated: 2026-07-12

---

## Market Reality

| Metric | Value | Implication |
|--------|-------|-------------|
| Mobile Traffic | 85%+ | Mobile-first ALWAYS |
| Android Share | 95%+ | Optimize for budget Android (2GB RAM, 720p) |
| Network | 4G dominant, 2G/3G fallback | Offline-first, skeleton screens, <100KB critical path |
| Languages | 22 official, 100+ spoken | Hindi + English minimum, regional for Tier 2/3 |
| Literacy | ~77% overall, lower digital | Icon + text, voice, simple flows |
| Payment | UPI 75%+ of digital | UPI-first, never card-only |
| Trust | Low for new apps | Social proof, badges, transparency |

---

## Tier-Based Design Strategy

### Tier 1 (Metros: Delhi, Mumbai, Bangalore, etc.)
- English comfortable
- High-end devices (iPhone, flagship Android)
- 5G/strong 4G
- Can handle density, advanced features

### Tier 2 (State capitals, 1M+ pop)
- Bilingual (Hindi + English)
- Mid-range Android (6-8GB RAM)
- 4G mostly reliable
- Need Hindi labels, voice support

### Tier 3 (Small towns, <1M pop)
- Hindi/regional primary
- Budget Android (2-4GB RAM, 720p)
- Patchy network, frequent offline
- Voice, icons, minimal text, offline-first
- Larger touch targets (56px)

---

## UPI Payment Flow (Critical)

### Standard UPI Flow
```
[Amount Screen] → [UPI App Selector] → [UPI App Opens] → [PIN Entry] → [Success/Fail] → [App Returns]
```

### UPI App Selector (Bottom Sheet)
```
┌─────────────────────────────────────┐
│  Pay ₹1,299                          │
│  ─────────────────────────────────  │
│  📱 Google Pay        @okaxis       │
│  📱 PhonePe           @ybl          │
│  📱 Paytm             @paytm        │
│  📱 BHIM UPI          @upi          │
│  📱 Amazon Pay        @apl          │
│  📱 WhatsApp Pay      @icici        │
│  ─────────────────────────────────  │
│  [Show All Apps ▼]                  │
│  [Enter UPI ID Manually]            │
└─────────────────────────────────────┘
```

### UPI Flow Rules
- [ ] **Amount visible BEFORE app selection** — never hide
- [ ] **App logos + @handle** — user recognizes by logo
- [ ] **Installed apps FIRST** — detect via `canOpenURL` / PackageManager
- [ ] **Fallback: "Enter UPI ID manually"** — for edge cases
- [ ] **Deep link back to your app** — `your-app://upi-result?status=success&txnId=...`
- [ ] **Success screen**: "₹1,299 paid to Merchant" + Order ID + "Track Order" CTA
- [ ] **Failure screen**: Specific error ("Insufficient balance", "Wrong PIN", "Timeout") + "Retry" + "Contact Support"
- [ ] **Timeout handling**: 30s → "Payment pending" → poll status → don't leave user hanging

### UPI Intent URLs
```kotlin
// Android
val uri = Uri.parse("upi://pay").buildUpon()
  .appendQueryParameter("pa", "merchant@upi")
  .appendQueryParameter("pn", "Merchant Name")
  .appendQueryParameter("am", "1299")
  .appendQueryParameter("cu", "INR")
  .appendQueryParameter("tn", "Order #12345")
  .build()

// iOS
let url = "upi://pay?pa=merchant@upi&pn=Merchant%20Name&am=1299&cu=INR&tn=Order%20%2312345"
```

---

## Bilingual Layout (Hindi + English)

### Text Expansion Rules
| Language | Expansion Factor | Line Height |
|----------|------------------|-------------|
| English | 1.0x (base) | 1.5 |
| Hindi | 1.3-1.5x | 1.6-1.8 |
| Tamil/Telugu | 1.4-1.6x | 1.7 |
| Bengali | 1.3-1.5x | 1.6 |

### Layout Patterns

#### Pattern 1: Side-by-Side (Wide Screens)
```
[English Label          ] [Hindi Label          ]
[Input Field                         ]
```

#### Pattern 2: Stacked (Mobile — Default)
```
[English Label]
[Hindi Label - smaller, muted]
[Input Field]
```

#### Pattern 3: Toggle (Settings)
```
Language: [English ▼]  →  [हिंदी ▼]
```

### Implementation Rules
- [ ] **Never auto-translate** — human-verified Hindi only
- [ ] **Technical terms stay English**: OTP, UPI, PIN, KYC, KYC, App, Login, Settings, Notification
- [ ] **Action/emotional copy in Hindi**: "भुगतान करें" not "Pay ₹1,299"
- [ ] **Numbers**: Indian format `₹1,23,456` (lakhs/crores)
- [ ] **Date**: DD/MM/YYYY (not MM/DD/YYYY)
- [ ] **Font**: Noto Sans Devanagari Variable (Google Fonts, free)
- [ ] **Line height**: Hindi 1.6x minimum
- [ ] **Test at 200% zoom** — Hindi wraps differently

### Copy Examples
| English | Hindi (Devanagari) | Hinglish (Romanized) |
|---------|-------------------|---------------------|
| Pay ₹1,299 | ₹1,299 चुकाएं | ₹1,299 chukayein |
| Enter OTP | OTP दर्ज करें | OTP darj karein |
| Verify Phone | फ़ोन वेरिफ़ाई करें | Phone verify karein |
| Add Address | पता जोड़ें | Address jodein |
| Track Order | ऑर्डर ट्रैक करें | Order track karein |
| Something went wrong | कुछ गड़बड़ हुई | Kuch gadbad hui |

---

## Trust Signals (Non-Negotiable for Fintech/Commerce)

### Placement Map
| Screen | Trust Signals Required |
|--------|------------------------|
| Onboarding | "50L+ users", "4.7★", "RBI Licensed", Bank logos |
| Login/OTP | "Secured by 256-bit encryption", "OTP auto-read" |
| KYC | "Government verified", "Data encrypted", "2 min process" |
| Payment | UPI app logos, "₹1L+ insured", "Secure payment gateway" |
| Checkout | "Easy returns", "COD available", "Original products" |
| Profile | "Verified" badge, "Joined Jan 2024", "12 orders" |
| Support | "24/7 chat", "Call back in 5 min", "WhatsApp support" |

### Trust Badge Component
```tsx
// Inline (payment screen)
<TrustBadge 
  icons={['upi', 'lock', 'shield']}
  text="Secured by UPI • 256-bit encryption"
  size="sm"
/>

// Card (onboarding)
<TrustBadgeCard
  items={[
    { icon: 'users', text: '50L+ happy customers' },
    { icon: 'star', text: '4.7★ on Play Store' },
    { icon: 'certificate', text: 'RBI Licensed NBFC' },
    { icon: 'bank', text: 'Partner: HDFC, ICICI, SBI' }
  ]}
/>
```

### Social Proof Patterns
| Pattern | Use Case |
|---------|----------|
| "12,345 people bought this today" | Product page (scarcity + social) |
| "Ramesh from Delhi saved ₹2,400" | Landing page (relatable) |
| "Verified buyer • 3 days ago" | Reviews (authenticity) |
| "Trusted by 50L+ families" | Onboarding (scale) |

---

## Offline-First Patterns

### Network States
```tsx
// Banner (persistent, non-dismissible for offline)
<NetworkBanner 
  status="offline" 
  message="You're offline. Changes will sync when connected."
  actionLabel="Retry"
  onAction={retrySync}
/>

// Inline (form submission)
<Button disabled={isOffline} loading={isSubmitting}>
  {isOffline ? 'Save Offline' : 'Submit'}
</Button>
```

### Offline Strategies
| Feature | Strategy |
|---------|----------|
| Forms | Save locally (IndexedDB/AsyncStorage) → sync on reconnect |
| Cart | Persist locally → merge on login |
| Images | Cache viewed images (Service Worker / Picasso / Kingfisher) |
| Content | Pre-fetch critical screens on WiFi |
| Payments | Queue locally → process when online (with user consent) |
| Search | Cache recent searches → show cached results + "Search online" |

### Sync Indicator
```tsx
// Top bar indicator
<SyncStatus 
  status="syncing" // idle | syncing | failed | offline
  lastSynced="2 min ago"
  pendingCount={3}
/>
```

---

## Voice & Accessibility (Tier 2/3)

### Voice Input
- [ ] **Search**: Mic icon in search bar → Speech-to-text
- [ ] **Forms**: Mic next to each text field
- [ ] **Language**: Detect Hindi/English automatically
- [ ] **Fallback**: "Tap to type" if voice fails

### Read Aloud (TTS)
- [ ] **Product descriptions**: "Listen" button
- [ ] **OTP**: "Your OTP is 1 2 3 4 5 6"
- [ ] **Errors**: Read error message aloud
- [ ] **Success**: "Payment of ₹1,299 successful"

### Implementation
```tsx
// Web Speech API
const speak = (text: string, lang = 'hi-IN') => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
};

// Android: TextToSpeech
// iOS: AVSpeechSynthesizer
```

---

## Number & Currency Formatting (Indian)

### Numbering System
```
International: 1,000,000 = 1 Million
Indian:        10,00,000 = 10 Lakh
Indian:        1,00,00,000 = 1 Crore
```

### Implementation
```tsx
const formatINR = (amount: number, options = {}) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  }).format(amount);
};

// Output: "₹1,23,456"
```

### Compact Notation
```tsx
const formatCompactINR = (amount: number) => {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(1)}Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount}`;
};

// Output: "₹1.2L", "₹5.5Cr", "₹45K"
```

---

## Date & Time

### Format
| Context | Format | Example |
|---------|--------|---------|
| Date display | DD/MM/YYYY | 15/01/2024 |
| Date input | DD/MM/YYYY | 15/01/2024 |
| Date + Time | DD/MM/YYYY, hh:mm A | 15/01/2024, 02:34 PM |
| Relative | "2 घंटे पहले" / "2 hours ago" | Auto-switch by language |
| OTP Expiry | "Expires in 02:30" | Countdown timer |

---

## Keyboard & Input Optimization

### Keyboard Types per Field
| Field | iOS | Android | Web `inputmode` |
|-------|-----|---------|-----------------|
| Phone | `phonePad` | `PHONE` | `tel` |
| OTP | `numberPad` | `NUMBER` | `numeric` |
| Amount | `decimalPad` | `NUMBER_DECIMAL` | `decimal` |
| Email | `emailAddress` | `TEXT_EMAIL_ADDRESS` | `email` |
| UPI ID | `emailAddress` | `TEXT_EMAIL_ADDRESS` | `text` |
| Name | `default` | `TEXT_PERSON_NAME` | `text` |
| Address | `default` | `TEXT_POSTAL_ADDRESS` | `text` |

### Autocomplete Attributes
```html
<!-- Phone -->
<input autocomplete="tel" inputmode="tel="phone" />

<!-- OTP -->
<input autocomplete="one-time-code" inputmode="numeric" />

<!-- Address -->
<input autocomplete="address-line1" />
<input autocomplete="address-level2" />  <!-- City -->
<input autocomplete="address-level1" />  <!-- State -->
<input autocomplete="postal-code" />

<!-- Payment -->
<input autocomplete="cc-number" />
<input autocomplete="cc-exp" />
<input autocomplete="cc-csc" />
<input autocomplete="cc-name" />
```

---

## App Size & Performance (Budget Android)

### Targets
| Metric | Target |
|--------|--------|
| App Install Size | <50MB (APK), <30MB (AAB) |
| Cold Start | <2s (3s max) |
| Memory (Runtime) | <150MB |
| 60fps Scroll | 100% (no jank) |
| Network (Critical Path) | <100KB compressed |

### Techniques
- **Code Splitting**: Dynamic imports for non-critical screens
- **Image Optimization**: WebP (Web), WebP/HEIC (Android), HEIC (iOS)
- **Lazy Load**: Images, heavy components, non-critical screens
- **Caching**: Service Worker (Web), DiskLruCache (Android), URLCache (iOS)
- **Tree Shaking**: Remove unused code
- **Dynamic Delivery**: Play Feature Delivery / App Bundles

---

## Testing Checklist for India

### Device Lab (Minimum)
| Device | Spec | Purpose |
|--------|------|---------|
| iPhone SE (2022) | 4.7", 64GB | iOS small screen |
| iPhone 14 Pro | 6.1", Dynamic Island | iOS flagship |
| Redmi Note 12 | 6.67", 4GB RAM, 720p | **Tier 2 Android** |
| Samsung Galaxy A14 | 6.6", 4GB RAM | Budget Samsung |
| JioPhone Next | 5.45", 2GB RAM, 720p | **Tier 3 Ultra-budget** |
| Tablet (Lenovo Tab M10) | 10", 4GB | Tablet layout |

### Network Simulation
| Profile | Down | Up | Latency | Use For |
|---------|------|-----|---------|---------|
| 4G Fast | 20 Mbps | 10 Mbps | 20ms | Happy path |
| 4G Typical | 5 Mbps | 2 Mbps | 50ms | Real-world |
| 3G | 1.5 Mbps | 750 Kbps | 100ms | Fallback |
| 2G/Edge | 250 Kbps | 50 Kbps | 300ms | Stress test |
| Offline | 0 | 0 | ∞ | Offline flows |
| Flaky | 1 Mbps | 500 Kbps | 200ms + 10% loss | Real India |

### Language Testing
- [ ] English (default)
- [ ] Hindi (Devanagari)
- [ ] Hinglish (Romanized Hindi)
- [ ] Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia (if supported)

### Accessibility Testing
- [ ] TalkBack / VoiceOver full flow
- [ ] Switch Control / Voice Access
- [ ] Font size: Smallest → Largest (AX5)
- [ ] Color inversion / Grayscale
- [ ] Reduce motion ON

---

## Compliance & Legal (India)

### Data
- [ ] DPDP Act 2023 compliant (consent, purpose limitation, retention)
- [ ] Data localization (if required by sector)
- [ ] Right to erasure flow

### Payments
- [ ] NPCI UPI guidelines followed
- [ ] RBI KYC/AML for wallet/banking
- [ ] PCI DSS if handling cards

### Accessibility
- [ ] RPWD Act 2016 (government apps: WCAG 2.1 AA mandatory)
- [ ] Private sector: Strongly recommended

### Content
- [ ] No prohibited content (IT Act 2000)
- [ ] Grievance officer contact visible
- [ ] Terms in Hindi + English