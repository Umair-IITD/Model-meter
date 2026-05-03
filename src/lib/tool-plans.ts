import type { ToolId } from './schemas';

export interface PlanOption {
  planId: string;
  planName: string;
}

export const TOOL_NAMES: Record<ToolId, string> = {
  'cursor': 'Cursor',
  'github-copilot': 'GitHub Copilot',
  'claude': 'Claude',
  'chatgpt': 'ChatGPT',
  'anthropic-api': 'Anthropic API',
  'openai-api': 'OpenAI API',
  'gemini-api': 'Gemini API',
  'windsurf': 'Windsurf',
};

export const TOOL_PLANS: Record<ToolId, PlanOption[]> = {
  'cursor': [
    { planId: 'hobby', planName: 'Hobby (Free)' },
    { planId: 'pro', planName: 'Pro ($20/mo)' },
    { planId: 'pro-plus', planName: 'Pro+ ($60/mo)' },
    { planId: 'ultra', planName: 'Ultra ($200/mo)' },
    { planId: 'business', planName: 'Business ($40/seat/mo)' },
  ],
  'github-copilot': [
    { planId: 'free', planName: 'Free' },
    { planId: 'pro', planName: 'Pro ($10/mo)' },
    { planId: 'pro-plus', planName: 'Pro+ ($39/mo)' },
    { planId: 'business', planName: 'Business ($19/seat/mo)' },
    { planId: 'enterprise', planName: 'Enterprise ($39/seat/mo)' },
  ],
  'claude': [
    { planId: 'free', planName: 'Free' },
    { planId: 'pro', planName: 'Pro ($20/mo)' },
    { planId: 'max-5x', planName: 'Max 5x ($100/mo)' },
    { planId: 'max-20x', planName: 'Max 20x ($200/mo)' },
    { planId: 'team', planName: 'Team ($25/seat/mo)' },
    { planId: 'enterprise', planName: 'Enterprise (custom)' },
  ],
  'chatgpt': [
    { planId: 'free', planName: 'Free' },
    { planId: 'go', planName: 'Go ($8/mo)' },
    { planId: 'plus', planName: 'Plus ($20/mo)' },
    { planId: 'pro-100', planName: 'Pro ($100/mo)' },
    { planId: 'pro-200', planName: 'Pro ($200/mo)' },
    { planId: 'business', planName: 'Business ($25–30/seat/mo)' },
  ],
  'anthropic-api': [
    { planId: 'haiku', planName: 'Haiku (cheapest)' },
    { planId: 'sonnet', planName: 'Sonnet (standard)' },
    { planId: 'opus', planName: 'Opus (flagship)' },
  ],
  'openai-api': [
    { planId: 'nano', planName: 'GPT-4.1 Nano (cheapest)' },
    { planId: 'mini', planName: 'GPT-5.4 Mini' },
    { planId: 'standard', planName: 'GPT-5.4 (standard)' },
    { planId: 'flagship', planName: 'GPT-5.5 (flagship)' },
  ],
  'gemini-api': [
    { planId: 'flash-lite', planName: 'Flash-Lite (cheapest)' },
    { planId: 'pro-2-5', planName: 'Gemini 2.5 Pro' },
    { planId: 'pro-3-1', planName: 'Gemini 3.1 Pro' },
  ],
  'windsurf': [
    { planId: 'free', planName: 'Free' },
    { planId: 'pro', planName: 'Pro ($20/mo)' },
    { planId: 'max', planName: 'Max ($200/mo)' },
    { planId: 'teams', planName: 'Teams ($40/seat/mo)' },
  ],
};

export const TOOL_IDS = Object.keys(TOOL_PLANS) as ToolId[];

export function getToolName(toolId: string): string {
  return TOOL_NAMES[toolId as ToolId] ?? toolId;
}

export function getPlanName(toolId: string, planId: string): string {
  const plans = TOOL_PLANS[toolId as ToolId] ?? [];
  return plans.find((p) => p.planId === planId)?.planName ?? planId;
}
