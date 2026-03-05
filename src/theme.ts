/**
 * Shared design system for Azure AI Gateway
 *
 * Black + Indigo palette — modern, enterprise-grade, universally appealing.
 * Every page imports from here. No more per-file color definitions.
 */
import type { CSSProperties } from 'react'

/* ═══════════════════════════════════════════════════════════════════════
   COLOR PALETTE
   ═══════════════════════════════════════════════════════════════════════ */

export const colors = {
  // Backgrounds
  bg: '#0A0A0A',
  bgRaised: '#111111',
  card: '#161616',
  cardHover: '#1C1C1C',
  surface: '#1E1E1E',

  // Borders
  border: 'rgba(129, 140, 248, 0.12)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',

  // Indigo accent family
  gold: '#818CF8',
  goldBright: '#A5B4FC',
  goldDim: '#6366F1',
  goldMuted: 'rgba(129, 140, 248, 0.15)',
  goldSubtle: 'rgba(129, 140, 248, 0.08)',

  // Text
  text: '#E8E8E8',
  textSecondary: '#999',
  textDim: '#666',
  textGold: '#818CF8',

  // Semantic
  green: '#4ADE80',
  greenDim: '#1A3A2A',
  red: '#EF4444',
  redDim: '#3D1A1A',
  amber: '#F59E0B',
  amberDim: '#3D2800',
  blue: '#60A5FA',
  blueDim: '#1A2D4D',
  purple: '#A78BFA',
  purpleDim: '#2D1A4D',
  cyan: '#22D3EE',
  cyanDim: '#0A2E36',

  // Provider colors
  azure: '#4F6BED',
  anthropic: '#D4875E',
  google: '#34A853',
  aws: '#FF9900',
  selfHosted: '#A78BFA',
} as const

/* ═══════════════════════════════════════════════════════════════════════
   SHARED STYLE OBJECTS
   ═══════════════════════════════════════════════════════════════════════ */

export const card: CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: 16,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.25)',
}

export const sectionTitle: CSSProperties = {
  color: colors.text,
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 12,
}

export const thStyle: CSSProperties = {
  textAlign: 'left' as const,
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 600,
  color: colors.textSecondary,
  borderBottom: `1px solid ${colors.border}`,
  whiteSpace: 'nowrap' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.3px',
}

export const tdStyle: CSSProperties = {
  padding: '10px 12px',
  fontSize: 13,
  color: colors.text,
  borderBottom: `1px solid ${colors.borderSubtle}`,
}

export const primaryBtn: CSSProperties = {
  backgroundColor: colors.gold,
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 6,
  padding: '7px 18px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export const secondaryBtn: CSSProperties = {
  backgroundColor: 'transparent',
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  padding: '7px 18px',
  fontWeight: 500,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export const dangerBtn: CSSProperties = {
  backgroundColor: colors.red,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '7px 18px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export const selectStyle: CSSProperties = {
  backgroundColor: colors.bgRaised,
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  padding: '7px 12px',
  fontSize: 13,
  fontFamily: 'inherit',
}

export const inputStyle: CSSProperties = {
  backgroundColor: colors.bgRaised,
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  padding: '7px 12px',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

/** Badge / pill factory */
export function badge(
  bg: string,
  fg: string,
  extra?: CSSProperties,
): CSSProperties {
  return {
    display: 'inline-block',
    backgroundColor: bg,
    color: fg,
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    ...extra,
  }
}

/** Status dot */
export function statusDot(color: string): CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: color,
    display: 'inline-block',
    flexShrink: 0,
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

export const tabBar: CSSProperties = {
  display: 'flex',
  gap: 2,
  marginBottom: 20,
  borderBottom: `1px solid ${colors.border}`,
  paddingBottom: 0,
}

export function tab(active: boolean): CSSProperties {
  return {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? colors.gold : colors.textSecondary,
    backgroundColor: active ? colors.goldSubtle : 'transparent',
    border: 'none',
    borderBottom: active ? `2px solid ${colors.gold}` : '2px solid transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   STANDARD TERMINOLOGY
   ═══════════════════════════════════════════════════════════════════════

   Use these consistently across all pages:

   - "Consumer"      — any identity that calls the gateway (user or service)
   - "Namespace"     — governance boundary / multi-tenant isolation unit
   - "Credential"    — any secret used to authenticate to a backend provider
   - "Policy"        — a governance rule (runtime or design-time)
   - "Guardrail"     — a safety-specific policy (RAI, PII, content safety)
   - "Asset"         — any registered model, tool, agent, or MCP server
   - "Provider"      — backend AI service (Azure OpenAI, Anthropic, etc.)

   ═══════════════════════════════════════════════════════════════════════ */
