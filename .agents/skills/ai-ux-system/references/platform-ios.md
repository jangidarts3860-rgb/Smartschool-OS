# iOS Platform Reference
Version: 2.1 | Updated: 2026-07-11

Use current Apple Human Interface Guidelines and native components as primary authority. This file gives durable principles, not a substitute for current official documentation.

## Structure
- Use standard navigation stacks, tab bars, sheets, alerts, menus, and system controls when they fit.
- Preserve predictable back navigation and interactive edge-swipe behavior.
- Respect safe areas, Dynamic Island/notch regions, home indicator, keyboard, and device rotation.
- Use sheets for contextual tasks; use full screen only when focus or security requires it.

## Current visual behavior
Modern Apple platforms use dynamic materials including Liquid Glass in system controls and navigation. Standard SwiftUI/UIKit/AppKit components inherit current appearance automatically. Do not manually apply translucent glass everywhere. Custom material must preserve readability, hierarchy, contrast, and Reduce Transparency behavior.

## Typography and content
- Prefer Dynamic Type and semantic text styles.
- Support large accessibility sizes without clipping or horizontal scrolling for primary content.
- Use concise labels and familiar SF Symbols where available.
- Localize dates, currency, plurals, and right-to-left behavior where relevant.

## Interaction
- Minimum comfortable touch target is generally 44Ã—44pt.
- Use system gestures consistently and provide visible alternatives for hidden gestures.
- Give immediate pressed-state feedback.
- Use haptics only for meaningful selection, confirmation, warning, or boundary feedback.

## Accessibility
Support VoiceOver, Dynamic Type, Bold Text, Increase Contrast, Reduce Transparency, Reduce Motion, Switch Control, Voice Control, and Full Keyboard Access where relevant.

## Privacy and permissions
Use purpose strings that explain real benefit. Ask permission in context, before the system prompt, and provide a usable denied state. Never imply that permission is mandatory when the feature can degrade gracefully.

## Financial and destructive actions
Show exact amount, account, consequence, and confirmation. Use biometric authentication only through approved system APIs. Never imitate an OS permission or authentication dialog.

## QA
Test small and large iPhones, light/dark appearance if supported, Dynamic Type, keyboard, landscape where applicable, offline and interrupted states, VoiceOver order, and current iOS SDK behavior.