import { useEffect } from 'react';
import { Bot, X, RotateCcw, Sparkles, Cpu } from 'lucide-react';
import { useAgent } from '../../context/AgentContext.jsx';
import AgentChat from './AgentChat.jsx';

export default function AgentWidget() {
  const { open, openAgent, closeAgent, resetChat, useLlm, toggleUseLlm } = useAgent();

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') closeAgent();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeAgent]);

  return (
    <>
      <button
        type="button"
        className={`agent-fab ${open ? 'agent-fab--hidden' : ''}`}
        onClick={openAgent}
        aria-label="Open Expense Agent"
        title="Expense Agent"
      >
        <Bot size={24} />
      </button>

      {open ? (
        <section className="agent-widget" role="dialog" aria-label="Expense Agent">
          <header className="agent-widget__header">
            <span className="agent-widget__title">
              <Bot size={18} /> Expense Agent
              <small className={`agent-mode ${useLlm ? 'agent-mode--ai' : ''}`}>
                {useLlm ? 'AI' : 'Basic'}
              </small>
            </span>
            <span className="agent-widget__actions">
              <button
                type="button"
                className="icon-btn"
                onClick={toggleUseLlm}
                aria-label={useLlm ? 'Switch to basic agent' : 'Switch to AI agent'}
                title={
                  useLlm
                    ? 'AI mode (Ollama) is on. Click to use the basic agent.'
                    : 'Basic mode. Click to use the AI (Ollama) agent.'
                }
              >
                {useLlm ? <Sparkles size={16} /> : <Cpu size={16} />}
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={resetChat}
                aria-label="New chat"
                title="New chat"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={closeAgent}
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </span>
          </header>
          <AgentChat />
        </section>
      ) : null}
    </>
  );
}
