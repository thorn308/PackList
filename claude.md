# Trip Packing App — CLAUDE.md

## Project Overview
A trip packing list app that helps users plan and pack for trips with smart,
contextual packing lists organized by trip type.

## Tech Stack
- Frontend: React (functional components + hooks)
- Styling: Tailwind CSS
- State: useState / useReducer, or Zustand for complex state
- Storage: localStorage for persistence (no backend)
- AI: Anthropic API (claude-sonnet-4-6) for smart list generation

## Core Features
- Trip creation (destination, dates, trip type: backpacking, beach, business, ski, etc.)
- AI-generated packing lists based on trip type, duration, and weather
- Custom item management (add, edit, remove, check off)
- Category organization (clothing, gear, toiletries, documents, electronics)
- Packing progress tracking (e.g., "14 of 32 items packed")
- Saved list templates for reuse

## Code Standards
- Functional components only, no class components
- Descriptive variable and function names
- Comment non-obvious logic
- Always handle loading, empty, and error states
- Never use HTML `<form>` tags — use onClick/onChange handlers instead
- Keep components modular and single-responsibility

## Anthropic API Usage
- Model: claude-sonnet-4-6
- Always set max_tokens: 1024
- No API key in code — it is handled by the environment

## Dev Commands
- `npm install` — install dependencies
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — lint check

## Working Style
- Scaffold structure first, fill in details after
- Confirm approach before writing large code blocks
- Ask if scope is ambiguous
- Prefer iterative builds over big-bang implementations