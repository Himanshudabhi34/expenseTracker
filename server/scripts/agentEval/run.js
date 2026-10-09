import 'dotenv/config';

process.env.MONGODB_URI =
  process.env.AGENT_EVAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/daily_expense_tracker_eval';

const { connectDB, disconnectDB } = await import('../../src/config/db.js');
const mongoose = (await import('mongoose')).default;
const User = (await import('../../src/models/User.js')).default;
const Category = (await import('../../src/models/Category.js')).default;
const Transaction = (await import('../../src/models/Transaction.js')).default;
const config = (await import('../../src/config/env.js')).default;
const { DEFAULT_CATEGORIES } = await import('../../src/config/constants.js');
const { addMonths } = await import('../../src/utils/dateRange.js');
const { handleAgentMessage } = await import('../../src/agents/agent.js');
const { isOllamaAvailable } = await import('../../src/agents/llmAgent/ollamaClient.js');
const { EVAL_CASES } = await import('./cases.js');
const { scoreCase } = await import('./scoring.js');

function resolveModes() {
  const args = process.argv.slice(2);
  if (args.includes('--both')) return ['llm', 'rules'];
  if (args.includes('--rules')) return ['rules'];
  return ['llm'];
}

async function seed() {
  await Category.deleteMany({ userId: null });
  await Category.insertMany(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, isDefault: true, isActive: true, userId: null }))
  );

  const categories = await Category.find({ userId: null }).lean();
  const byName = (name) => categories.find((c) => c.name === name);

  const passwordHash = await User.hashPassword('password123');
  const main = await User.create({
    name: 'Eval Main',
    email: `eval-main-${Date.now()}@test.com`,
    passwordHash,
  });
  const empty = await User.create({
    name: 'Eval Empty',
    email: `eval-empty-${Date.now()}@test.com`,
    passwordHash,
  });

  const now = new Date();
  const lastMonth = addMonths(now, -1, main.timezone);

  await Transaction.insertMany([
    { userId: main._id, type: 'expense', amountMinor: 45000, categoryId: byName('Food & Dining')._id, description: 'Dinner', transactionDate: now, paymentMethod: 'upi', currency: main.currency },
    { userId: main._id, type: 'expense', amountMinor: 120000, categoryId: byName('Travel & Fuel')._id, description: 'Petrol', transactionDate: now, paymentMethod: 'cash', currency: main.currency },
    { userId: main._id, type: 'expense', amountMinor: 30000, categoryId: byName('Groceries')._id, description: 'Groceries', transactionDate: now, paymentMethod: 'upi', currency: main.currency },
    { userId: main._id, type: 'income', amountMinor: 5000000, categoryId: byName('Salary')._id, description: 'Salary', transactionDate: now, paymentMethod: 'bank_transfer', currency: main.currency },
    { userId: main._id, type: 'expense', amountMinor: 100000, categoryId: byName('Groceries')._id, description: 'Last month groceries', transactionDate: lastMonth, paymentMethod: 'cash', currency: main.currency },
  ]);

  return { seed: main, empty };
}

function printReport(mode, rows) {
  const groups = new Map();
  for (const row of rows) {
    const group = groups.get(row.requirement) || { pass: 0, total: 0 };
    group.total += 1;
    if (row.pass) group.pass += 1;
    groups.set(row.requirement, group);
  }

  console.log(`\n=== Mode: ${mode}${mode === 'llm' ? ` (${config.ollamaModel})` : ' (rule-based)'} ===\n`);
  console.log(`${'Requirement'.padEnd(30)}Pass / Total`);
  for (const [requirement, group] of groups) {
    console.log(`${requirement.padEnd(30)}${group.pass} / ${group.total}`);
  }

  const pass = rows.filter((row) => row.pass).length;
  const percent = rows.length ? Math.round((pass / rows.length) * 1000) / 10 : 0;
  console.log('-'.repeat(44));
  console.log(`${'TOTAL'.padEnd(30)}${pass} / ${rows.length}  (${percent}%)`);

  const failures = rows.filter((row) => !row.pass);
  if (failures.length) {
    console.log('\nFailures:');
    for (const failure of failures) {
      console.log(`\n- [${failure.id}] "${failure.input}"`);
      console.log(`    reply: ${failure.reply}`);
      for (const check of failure.checks.filter((c) => !c.ok)) {
        console.log(`    x ${check.name}: ${check.detail}`);
      }
    }
  }
}

async function runMode(mode, users) {
  const useLlm = mode === 'llm';
  const rows = [];

  for (const evalCase of EVAL_CASES) {
    const user = users[evalCase.scope || 'seed'];
    let result;
    try {
      result = await handleAgentMessage({
        userId: user._id,
        message: evalCase.input,
        timeZone: user.timezone,
        currency: user.currency,
        useLlm,
      });
    } catch (err) {
      result = { kind: 'error', reply: `ERROR: ${err.message}`, data: {} };
    }
    rows.push({
      ...scoreCase(evalCase, result, mode),
      input: evalCase.input,
      reply: result.reply,
    });
  }

  printReport(mode, rows);
  return rows;
}

async function main() {
  const modes = resolveModes();
  await connectDB();
  await mongoose.connection.dropDatabase();

  if (modes.includes('llm')) {
    const available = await isOllamaAvailable({ force: true });
    if (!available) {
      console.warn(
        `\n[warning] Ollama is not reachable at ${config.ollamaBaseUrl}. ` +
          'LLM cases will fail. Install/start Ollama or run with --rules.\n'
      );
    }
  }

  try {
    const users = await seed();
    const allRows = [];
    for (const mode of modes) {
      allRows.push(...(await runMode(mode, users)));
    }
    if (modes.length > 1) {
      const pass = allRows.filter((row) => row.pass).length;
      console.log(`\nCombined: ${pass} / ${allRows.length}`);
    }
  } finally {
    await mongoose.connection.dropDatabase();
    await disconnectDB();
  }
}

await main();
