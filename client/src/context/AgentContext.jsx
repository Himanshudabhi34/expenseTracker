import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const AgentContext = createContext(null);

export const AGENT_WELCOME = {
  role: 'agent',
  text: 'Hi! I am your expense agent. Tell me about a transaction in plain English and I will draft it for you, or ask me a question about your spending, income, budgets and goals.\n\nTry: "Spent ₹250 on dinner yesterday" or "How much did I spend this month?"',
};

function storageKey(userId) {
  return `det_agent_chat_${userId || 'guest'}`;
}

function llmKey(userId) {
  return `det_agent_use_llm_${userId || 'guest'}`;
}

function loadMessages(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    // ignore malformed storage
  }
  return [AGENT_WELCOME];
}

function loadUseLlm(userId) {
  try {
    const raw = localStorage.getItem(llmKey(userId));
    if (raw !== null) return JSON.parse(raw) !== false;
  } catch {
    // ignore malformed storage
  }
  return true;
}

export function AgentProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadMessages(userId));
  const [useLlm, setUseLlm] = useState(() => loadUseLlm(userId));

  useEffect(() => {
    setMessages(loadMessages(userId));
    setUseLlm(loadUseLlm(userId));
  }, [userId]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(messages));
    } catch {
      // ignore quota / serialization errors
    }
  }, [messages, userId]);

  useEffect(() => {
    try {
      localStorage.setItem(llmKey(userId), JSON.stringify(useLlm));
    } catch {
      // ignore quota errors
    }
  }, [useLlm, userId]);

  const openAgent = useCallback(() => setOpen(true), []);
  const closeAgent = useCallback(() => setOpen(false), []);
  const toggleAgent = useCallback(() => setOpen((v) => !v), []);
  const resetChat = useCallback(() => setMessages([AGENT_WELCOME]), []);
  const toggleUseLlm = useCallback(() => setUseLlm((v) => !v), []);

  const value = useMemo(
    () => ({
      open,
      openAgent,
      closeAgent,
      toggleAgent,
      messages,
      setMessages,
      resetChat,
      useLlm,
      setUseLlm,
      toggleUseLlm,
    }),
    [open, openAgent, closeAgent, toggleAgent, messages, resetChat, useLlm, toggleUseLlm]
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used within an AgentProvider');
  return ctx;
}

export default AgentContext;
