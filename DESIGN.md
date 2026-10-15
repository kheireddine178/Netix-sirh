# HRFlow Design System

## Overview
HRFlow is a people-focused, warm-professional design system built for HR platforms and employee management systems. It balances approachability with the professionalism required for sensitive workplace data. The warm purple palette and rounded forms convey trust and care, while clean layouts keep complex org structures and workflows easy to navigate.

---

## Colors
- **Primary** (#4F46E5): Indigo Moderne — Primary actions, nav accents
- **Secondary** (#059669): Émeraude — Gains, Net à payer, approved status
- **Tertiary** (#F59E0B): Ambre — Alerts, badges, warmth
- **Background** (#F8FAFC): Page background
- **Surface** (#FFFFFF): Cards, modals, odoo sheets
- **Success** (#059669): Approved, completed
- **Warning** (#D97706): Pending review
- **Error** (#EF4444): Rejected, failed
- **Info** (#2563EB): Informational banners

## Typography
- **Headline Font**: Lexend
- **Body Font**: DM Sans
- **Mono Font**: Roboto Mono

- **h1**: 32px bold, 40px line height. Page titles.
- **h2**: 24px semibold, 32px line height. Section headings.
- **h3**: 20px semibold, 28px line height. Card headings.
- **h4**: 16px semibold, 24px line height. Subsection headings.
- **body**: 14px regular, 22px line height. General content.
- **small**: 12px regular, 18px line height. Captions, metadata.
- **mono**: 13px regular, 20px line height. Employee IDs, codes.

---

## Spacing
Base unit: **8px**
- **xs**: 4px — Tight gaps, icon padding
- **sm**: 8px — Inline spacing
- **md**: 16px — Component internal padding
- **lg**: 24px — Section gaps
- **xl**: 32px — Card padding
- **2xl**: 48px — Page section spacing
- **3xl**: 64px — Layout margins

## Border Radius
- **None** (0px): —
- **sm** (4px): Chips, small elements
- **md** (8px): Buttons, cards, inputs
- **lg** (12px): Modals, panels
- **full** (9999px): Avatars, pills

## Elevation
Subtle shadows to maintain a warm, approachable feel.
- **sm**: 1px offset, 2px blur, #000000 at 5%. Inputs, chips.
- **md**: 2px offset, 8px blur, #000000 at 8%. Cards, dropdowns.
- **lg**: 4px offset, 16px blur, #000000 at 10%. Modals, elevated.
- **focus**: 3px ring #4F46E5 at 25%. Focus ring.

## Components

### Buttons
#### Variants
- **Primary**: #4F46E5 fill, #FFFFFF text, no border, #4338CA fill (hover).
- **Secondary**: Transparent fill, #4F46E5 text, 1px #4F46E5 border, #EEF2FF fill (hover).
- **Ghost**: Transparent fill, #6B7280 text, no border, #F3F4F6 fill (hover).
- **Destructive**: #EF4444 fill, #FFFFFF text, no border, #DC2626 fill (hover).
#### Sizes
Sizes: sm (6px 12px, 12px, 32px), md (8px 16px, 14px, 40px), lg (10px 24px, 16px, 48px).
#### Disabled State
0.5 opacity, disabled cursor. No hover or focus effects.

### Cards
- **Default**: #FFFFFF fill, 1px #E5E7EB border, sm shadow, 8px radius.
- **Elevated**: #FFFFFF fill, no border, md shadow, 8px radius.
24px padding.
- Cards use `surface-raised` background on hover.

### Inputs
- **Default**: #E5E7EB border, #FFFFFF fill, no shadow.
- **Hover**: #818CF8 border, #FFFFFF fill, no shadow.
- **Focus**: #4F46E5 border, #FFFFFF fill, focus ring shadow.
- **Error**: #EF4444 border, #FEF2F2 fill, no shadow.
- **Disabled**: #E5E7EB border, #F9FAFB fill, no shadow.
40px, padding: 8px 12px, radius: 8px tall, DM Sans 500, 14px, `text-primary`, 4px bottom margin **label**, DM Sans 400, 12px, `text-tertiary`, 4px margin-top; error uses `error` color **helper text**.

### Chips
- **Filter**: #EEF2FF fill, #4F46E5 text, 1px #4F46E5 border, pill shape.
- **Status**: varies fill, varies text, no border, pill shape.
Status chip semantic mapping:
bg #FFFBEB, text #D97706 pending. bg #FEF2F2, text #EF4444 inactive. Active: bg #ECFDF5, text #059669.

### Lists
DM Sans 400 14px. 48px row height, 12px/16px padding, 1px #E5E7EB divider. Hover: background #EEF2FF. Selected: background #E0E7FF, left border 3px #4F46E5.

### Checkboxes
18px square, radius: 4px. Unchecked: border 2px #D1D5DB, background white. Checked: background #4F46E5, border #4F46E5, white checkmark. Indeterminate: background #4F46E5, white dash. Disabled: 50% opacity. Labels in 8px gap DM Sans 400 14px.

### Radio Buttons
18px circle. Unchecked: border 2px #D1D5DB, background white. Selected: border 2px #4F46E5, inner dot 10px #4F46E5. Disabled: 50% opacity. Labels in 8px gap DM Sans 400 14px.

---

## Do's and Don'ts
1. **Do** use warm, people-centric language in labels (e.g., "Team Members" not "Users").
2. **Do** pair indigo primary with emerald for status and progress to keep the palette balanced.
3. **Do** use avatars and initials in list rows to humanize data.
4. **Don't** use destructive red for non-critical actions — reserve it for irreversible operations.
5. **Don't** place more than two primary buttons in a single view.
6. **Do** maintain generous whitespace around employee profile cards.
7. **Don't** use bright tertiary orange for large surfaces — limit it to badges and small accents.
8. **Do** provide clear loading and empty states for org charts and team lists.
9. **Don't** display sensitive employee data (salary, SSN) without explicit reveal interactions.
10. **Do** ensure all form flows have progress indicators for multi-step processes.
