# Design System MASTER

This is the global source of truth for the project's design language, based on the **UI/UX Pro Max v2.0** intelligence.

## Core Identity
- **Product Category**: SaaS / Enterprise ERP
- **Style Priority**: Soft UI Evolution + Minimalism
- **Color Mood**: Trust Blue + Healthcare Green

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary (Trust Blue) | `#2563EB` | Primary actions, branding |
| Success (Health Green) | `#059669` | Success states, conversion |
| Surface | `#F8FAFC` | Main background (slate-50) |
| Text Main | `#0F172A` | Primary text (slate-900) |
| Text Muted | `#475569` | Secondary text (slate-600) |
| Border | `#E2E8F0` | Default borders (slate-200) |

## Typography
- **Primary Font**: `Plus Jakarta Sans` / `Inter`
- **Scale**:
    - `H1`: 2.25rem (Bold)
    - `H2`: 1.875rem (Semibold)
    - `Body`: 1rem (Regular)
    - `Muted`: 0.875rem (Regular)

## Component Rules

### Buttons
- **Shape**: Rounded (8px / `rounded-lg`)
- **Transitions**: `transition-all duration-200`
- **Hover**: Subtle lift or darker shade

### Cards
- **Background**: `bg-white`
- **Border**: `1px solid #E2E8F0`
- **Shadow**: `shadow-sm` on rest, `shadow-md` on hover
- **Interactions**: `cursor-pointer` for navigable cards

## Interaction Guidelines
- **Smooth transitions**: Use 150-250ms for all hover/state changes.
- **No emoji icons**: Exclusively use **Lucide React** or **Heroicons**.
- **Respect Motion**: Check `prefers-reduced-motion` for complex transitions.

## Pre-Delivery Checklist
- [ ] No emojis as icons.
- [ ] Contrast ratio > 4.5:1.
- [ ] All clickable elements have `cursor-pointer`.
- [ ] Responsive at 375px (Mobile).
