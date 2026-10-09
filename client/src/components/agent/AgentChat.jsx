import { useEffect, useRef, useState } from 'react';
import { Bot, Send, User, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { agentApi } from '../../api/resources.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAgent } from '../../context/AgentContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../common/index.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

const EXAMPLES = [
  'Spent ₹250 on dinner yesterday',
  'How much did I spend this month?',
  'Which category has the highest expenses?',
  'How much budget do I have left?',
];

export default function AgentChat() {
  const { user } = useAuth();
  const { messages, setMessages, useLlm } = useAgent();
  const toast = useToast();
  const currency = user?.currency || 'INR';

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  function buildHistory() {
    return messages
      .filter((m) => m.text)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
  }

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const history = buildHistory();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: content }]);
    setLoading(true);
    try {
      const data = await agentApi.send({
        message: content,
        timezone: user?.timezone,
        history,
        useLlm,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: data.reply,
          kind: data.kind,
          draft: data.draft,
          sourceMessage: content,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'agent', text: `Sorry, something went wrong: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDraft(message, index) {
    setLoading(true);
    try {
      const data = await agentApi.send({
        message: message.sourceMessage,
        confirm: true,
        draft: message.draft,
      });
      setMessages((prev) => {
        const next = prev.filter((_, i) => i !== index);
        next.push({ role: 'agent', text: data.reply, kind: 'saved' });
        return next;
      });
      toast.success('Transaction saved');
    } catch (err) {
      toast.error(err.message || 'Could not save');
    } finally {
      setLoading(false);
    }
  }

  function discardDraft(index) {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  }

  const showExamples = messages.length === 1 && !loading;

  return (
    <>
      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role === 'user' ? 'chat-msg--user' : ''}`}>
            <span className={`chat-avatar ${m.role === 'user' ? 'chat-avatar--user' : ''}`}>
              {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="chat-bubble">{m.text}</div>
              {m.draft ? (
                <div className="draft-card">
                  <div className="draft-row">
                    <span>Amount</span>
                    <strong>
                      {m.draft.amount != null ? formatCurrency(m.draft.amount, currency) : '—'}
                    </strong>
                  </div>
                  <div className="draft-row">
                    <span>Type</span>
                    <strong style={{ textTransform: 'capitalize' }}>{m.draft.type}</strong>
                  </div>
                  <div className="draft-row">
                    <span>Category</span>
                    <strong>{m.draft.categoryName}</strong>
                  </div>
                  <div className="draft-row">
                    <span>Description</span>
                    <strong>{m.draft.description}</strong>
                  </div>
                  <div className="draft-row">
                    <span>Date</span>
                    <strong>
                      {m.draft.transactionDate
                        ? formatDate(m.draft.transactionDate)
                        : formatDate(new Date())}
                    </strong>
                  </div>
                  <div className="draft-row">
                    <span>Payment</span>
                    <strong style={{ textTransform: 'capitalize' }}>
                      {String(m.draft.paymentMethod).replace('_', ' ')}
                    </strong>
                  </div>
                  <div className="draft-actions">
                    <Button
                      size="sm"
                      icon={Check}
                      onClick={() => confirmDraft(m, i)}
                      disabled={loading}
                    >
                      Confirm &amp; save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={X}
                      onClick={() => discardDraft(i)}
                      disabled={loading}
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {showExamples ? (
          <div className="agent-suggestions">
            {EXAMPLES.map((ex) => (
              <button key={ex} className="chip" onClick={() => send(ex)} disabled={loading}>
                <Sparkles size={13} /> {ex}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="chat-msg">
            <span className="chat-avatar">
              <Bot size={16} />
            </span>
            <div className="chat-bubble flex">
              <Loader2 size={15} className="spin" /> Thinking…
            </div>
          </div>
        ) : null}
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="input"
          placeholder="e.g. Spent ₹250 on dinner yesterday"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" icon={Send} disabled={loading || !input.trim()}>
          Send
        </Button>
      </form>
    </>
  );
}
