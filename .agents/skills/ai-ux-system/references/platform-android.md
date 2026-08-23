# Android Platform Reference
Version: 2.1 | Updated: 2026-07-11

Use current Android guidance and native Compose/View behavior. Material 3 Expressive complements Android 16 and newer system styling, but brand and product needs still matter.

## Structure
- Prefer standard top app bars, navigation bars/rails, sheets, dialogs, snackbars, menus, and system pickers.
- Support predictive back and preserve app state when users leave and return.
- Handle system bars, cutouts, IME/keyboard, edge-to-edge layout, rotation, tablets, foldables, and window resizing.
- Choose navigation bar, rail, or drawer adaptively by available width and information architecture.

## Visual system
Material 3 supports color schemes, typography, shape, component, and motion schemes. Dynamic color can personalize eligible apps, but do not use it when regulatory status colors or brand requirements would become ambiguous. Material 3 Expressive is an option, not a mandate for playful motion or oversized shapes.

## Typography and interaction
- Use scalable `sp` text and support user font-size settings.
- Interactive targets should generally reserve at least 48Ã—48dp.
- Provide ripple/pressed feedback where platform-appropriate.
- Avoid gesture-only actions and tiny icon targets.

## Accessibility
Support TalkBack, Switch Access, Voice Access, font scaling, high-contrast text/settings where available, color correction, remove animations/animator scale, and clear content descriptions. Compose semantics must expose role, state, action, and relationships.

## Permissions
Use current runtime permission and privacy behavior. Ask in context, explain benefit before the system request, allow denial, and handle â€œdonâ€™t ask againâ€ with a clear Settings path only when needed. Avoid requesting broad SMS, call-log, contacts, accessibility-service, or overlay access unless the core feature and store policy genuinely permit it.

## Performance
Test budget Android devices, slow network, low memory, process death, battery saver, dark theme if supported, and offline recovery. Avoid expensive blur and excessive simultaneous animation.

## Financial and destructive actions
Show exact amount, destination, fees, and status. Prevent duplicate submission. Keep processing, success, pending, failed, and reversed states distinct. Use system biometrics securely.

## QA
Test phone, tablet/foldable widths, font scaling, TalkBack order, predictive back, keyboard, system navigation modes, dynamic color if supported, offline state, and process restoration.