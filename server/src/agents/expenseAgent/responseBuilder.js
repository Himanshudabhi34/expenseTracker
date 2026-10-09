import { formatMinor, toMinor } from '../../utils/currency.js';

function money(value, currency = 'INR') {
  return formatMinor(toMinor(value || 0), currency);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Builds the confirmation draft for a parsed natural-language entry.
 * Includes the suggested category and flags any missing fields.
 */
export function buildEntryDraft(parsed, category, { currency = 'INR' } = {}) {
  const lines = [];
  if (parsed.missing.length > 0) {
    lines.push(
      `I could not confidently detect: ${parsed.missing.join(', ')}. Please review and fill it in.`
    );
  } else {
    lines.push('Here is what I understood. Please confirm to save it:');
  }

  lines.push('');
  if (parsed.amount !== null) {
    lines.push(`• Amount: ${money(parsed.amount, currency)}`);
  } else {
    lines.push('• Amount: (not detected)');
  }
  lines.push(`• Type: ${parsed.type === 'income' ? 'Income' : 'Expense'}`);
  lines.push(
    `• Category: ${category?.name || 'Other'}${category?.confidence === 'low' ? ' (suggested)' : ''}`
  );
  lines.push(`• Description: ${parsed.description}`);
  lines.push(
    `• Date: ${parsed.date ? formatDate(parsed.date) : '(not detected — defaults to today)'}`
  );
  lines.push(`• Payment method: ${parsed.paymentMethod.replace('_', ' ')}`);

  return {
    reply: lines.join('\n'),
    draft: {
      type: parsed.type,
      amount: parsed.amount,
      categoryId: category?.id || null,
      categoryName: category?.name || 'Other',
      description: parsed.description,
      transactionDate: parsed.date,
      paymentMethod: parsed.paymentMethod,
      currency,
      confidence: category?.confidence || 'low',
      missing: parsed.missing,
    },
  };
}

export function buildSavedResponse(transaction, { currency = 'INR' } = {}) {
  const categoryName = transaction.categoryId?.name || 'Other';
  return `Saved! ${transaction.type === 'income' ? 'Income' : 'Expense'} of ${money(
    transaction.amountMinor / 100,
    currency
  )} (${categoryName}) recorded on ${formatDate(transaction.transactionDate)}.`;
}

/**
 * Turns a queryExecutor result into a human-friendly answer.
 * Never fabricates totals: when there are no records, it says so explicitly.
 */
export function buildAnswer(result, { currency = 'INR' } = {}) {
  const { intent } = result;

  switch (intent) {
    case 'daily_expense':
    case 'period_expense':
    case 'monthly_expense':
      if (!result.hasData) {
        return { reply: `You have no expenses recorded for ${result.period}.`, data: result };
      }
      return {
        reply: `You spent ${money(result.total, currency)} in ${result.period} across ${result.count} transaction${
          result.count === 1 ? '' : 's'
        }.`,
        data: result,
      };

    case 'income_total':
      if (!result.hasData) {
        return { reply: `You have no income recorded for ${result.period}.`, data: result };
      }
      return {
        reply: `You received ${money(result.total, currency)} in ${result.period} across ${result.count} transaction${
          result.count === 1 ? '' : 's'
        }.`,
        data: result,
      };

    case 'category_spending':
      if (!result.resolved) {
        return {
          reply: result.categoryName
            ? `I could not find a category matching "${result.categoryName}". Try one of your existing categories.`
            : 'Which category would you like to check? For example, "How much did I spend on petrol this month?"',
          data: result,
        };
      }
      if (result.count === 0) {
        return {
          reply: `You have no ${result.category} expenses recorded in ${result.period}.`,
          data: result,
        };
      }
      return {
        reply: `You spent ${money(result.total, currency)} on ${result.category} in ${result.period}.`,
        data: result,
      };

    case 'top_categories': {
      if (!result.hasData) {
        return { reply: `You have no expenses recorded in ${result.period}.`, data: result };
      }
      const list = result.categories
        .map((c, i) => `${i + 1}. ${c.name} — ${money(c.total, currency)}`)
        .join('\n');
      return {
        reply: `Here are your top spending categories in ${result.period}:\n${list}`,
        data: result,
      };
    }

    case 'largest_transaction':
      if (!result.hasData) {
        return { reply: `You have no expenses recorded in ${result.period}.`, data: result };
      }
      return {
        reply: `Your largest expense in ${result.period} was ${money(
          result.transaction.amount,
          currency
        )} on ${result.transaction.description} (${result.transaction.category}) on ${formatDate(
          result.transaction.date
        )}.`,
        data: result,
      };

    case 'month_comparison': {
      const dir = result.expenseChangePercent > 0 ? 'more' : 'less';
      const absPct = Math.abs(result.expenseChangePercent);
      return {
        reply: `In ${result.currentLabel} you spent ${money(
          result.current.expense,
          currency
        )} vs ${money(result.previous.expense, currency)} in ${result.previousLabel} — ${
          absPct === 0 ? 'about the same' : `${absPct}% ${dir}`
        }.\nIncome: ${money(result.current.income, currency)} in ${result.currentLabel} vs ${money(
          result.previous.income,
          currency
        )} in ${result.previousLabel}.`,
        data: result,
      };
    }

    case 'budget_status': {
      if (!result.hasBudgets) {
        return {
          reply: 'You have not set any budgets yet. You can create one from the Budgets page.',
          data: result,
        };
      }
      const list = result.budgets
        .map(
          (b) =>
            `• ${b.name}: ${money(b.spent, currency)} of ${money(b.amount, currency)} used (${b.percent}%), ${money(
              b.remaining,
              currency
            )} left`
        )
        .join('\n');
      return { reply: `Here is your budget status for ${result.period}:\n${list}`, data: result };
    }

    case 'savings_goals': {
      if (!result.hasGoals) {
        return {
          reply: 'You have no saving goals yet. Create one from the Goals page.',
          data: result,
        };
      }
      const list = result.goals
        .map(
          (g) =>
            `• ${g.name}: ${money(g.currentAmount, currency)} of ${money(g.targetAmount, currency)} (${g.progressPercent}%)`
        )
        .join('\n');
      return { reply: `Your saving goals:\n${list}`, data: result };
    }

    case 'help':
      return {
        reply: [
          'I can help you with two things:',
          '',
          '1. Record an expense or income, e.g. "Spent ₹250 on dinner yesterday."',
          '2. Answer questions, e.g.:',
          '   • How much did I spend today?',
          '   • What is my total spending this month?',
          '   • How much did I spend on petrol?',
          '   • Which category has the highest expenses?',
          '   • Show my largest expense this month.',
          '   • Compare this month with last month.',
          '   • How much income did I receive this month?',
          '   • How much budget do I have left?',
        ].join('\n'),
        data: result,
      };

    default:
      return {
        reply:
          'I did not quite understand that. You can record a transaction (e.g. "Spent ₹150 on lunch") or ask a question (e.g. "How much did I spend this month?"). Type "help" to see examples.',
        data: result,
      };
  }
}

export default { buildEntryDraft, buildSavedResponse, buildAnswer };
