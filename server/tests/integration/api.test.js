import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/daily_expense_tracker_test';
process.env.JWT_SECRET = 'integration_test_secret';
process.env.LLM_ENABLED = 'false';

const { connectDB, disconnectDB } = await import('../../src/config/db.js');
const { createApp } = await import('../../src/app.js');
const mongoose = (await import('mongoose')).default;
const Category = (await import('../../src/models/Category.js')).default;
const { DEFAULT_CATEGORIES } = await import('../../src/config/constants.js');
const request = (await import('supertest')).default;

let app;
let agent;

async function registerUser(email = 'user@test.com') {
  const res = await agent
    .post('/api/v1/auth/register')
    .send({ name: 'Test User', email, password: 'password123' });
  return res;
}

async function categoryIdFor(name) {
  const res = await agent.get('/api/v1/categories');
  return res.body.data.categories.find((c) => c.name === name)._id;
}

before(async () => {
  await connectDB();
  app = createApp();
  await Category.deleteMany({ userId: null });
  await Category.insertMany(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, isDefault: true, isActive: true, userId: null }))
  );
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDB();
});

beforeEach(async () => {
  await mongoose.connection.collection('users').deleteMany({});
  await mongoose.connection.collection('transactions').deleteMany({});
  await mongoose.connection.collection('budgets').deleteMany({});
  await mongoose.connection.collection('goals').deleteMany({});
  agent = request.agent(app);
});

describe('health', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'ok');
  });

  test('unknown route returns 404', async () => {
    const res = await request(app).get('/api/v1/nope');
    assert.equal(res.status, 404);
  });
});

describe('auth', () => {
  test('registers a user and returns a scoped profile', async () => {
    const res = await registerUser();
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.email, 'user@test.com');
    assert.equal(res.body.data.user.passwordHash, undefined);

    const me = await agent.get('/api/v1/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, 'user@test.com');
  });

  test('rejects duplicate email', async () => {
    await registerUser();
    const res = await registerUser();
    assert.equal(res.status, 409);
  });

  test('rejects weak payloads with validation error', async () => {
    const res = await agent
      .post('/api/v1/auth/register')
      .send({ name: 'x', email: 'bad', password: 'short' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.message, 'Validation failed');
  });

  test('blocks protected routes without a session', async () => {
    const res = await request(app).get('/api/v1/transactions');
    assert.equal(res.status, 401);
  });

  test('updates profile preferences', async () => {
    await registerUser();
    const res = await agent.patch('/api/v1/users/me').send({ currency: 'USD', name: 'Renamed' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.currency, 'USD');
    assert.equal(res.body.data.user.name, 'Renamed');
  });
});

describe('transactions', () => {
  test('full CRUD lifecycle with pagination', async () => {
    await registerUser();
    const categoryId = await categoryIdFor('Food & Dining');

    const create = await agent.post('/api/v1/transactions').send({
      type: 'expense',
      amount: 150,
      categoryId,
      description: 'Lunch',
      transactionDate: '2026-10-09',
      paymentMethod: 'upi',
    });
    assert.equal(create.status, 201);
    assert.equal(create.body.data.transaction.amountMinor, 15000);
    const id = create.body.data.transaction._id;

    const list = await agent.get('/api/v1/transactions?limit=10');
    assert.equal(list.status, 200);
    assert.equal(list.body.data.items.length, 1);
    assert.equal(list.body.data.pagination.total, 1);

    const update = await agent.patch(`/api/v1/transactions/${id}`).send({ amount: 200 });
    assert.equal(update.body.data.transaction.amountMinor, 20000);

    const remove = await agent.delete(`/api/v1/transactions/${id}`);
    assert.equal(remove.status, 200);

    const after = await agent.get('/api/v1/transactions');
    assert.equal(after.body.data.items.length, 0);
  });

  test('filters by type and search', async () => {
    await registerUser();
    const food = await categoryIdFor('Food & Dining');
    const salary = await categoryIdFor('Salary');

    await agent.post('/api/v1/transactions').send({
      type: 'expense',
      amount: 100,
      categoryId: food,
      description: 'Coffee',
      transactionDate: '2026-10-09',
    });
    await agent.post('/api/v1/transactions').send({
      type: 'income',
      amount: 40000,
      categoryId: salary,
      description: 'October Salary',
      transactionDate: '2026-10-01',
    });

    const income = await agent.get('/api/v1/transactions?type=income');
    assert.equal(income.body.data.items.length, 1);

    const search = await agent.get('/api/v1/transactions?search=coffee');
    assert.equal(search.body.data.items.length, 1);
    assert.equal(search.body.data.items[0].description, 'Coffee');
  });

  test('isolates data between users', async () => {
    const agentA = request.agent(app);
    await agentA
      .post('/api/v1/auth/register')
      .send({ name: 'User A', email: 'a@test.com', password: 'password123' });
    const catA = (await agentA.get('/api/v1/categories')).body.data.categories[0]._id;
    await agentA.post('/api/v1/transactions').send({
      type: 'expense',
      amount: 50,
      categoryId: catA,
      description: 'A only',
      transactionDate: '2026-10-09',
    });

    const agentB = request.agent(app);
    await agentB
      .post('/api/v1/auth/register')
      .send({ name: 'User B', email: 'b@test.com', password: 'password123' });
    const listB = await agentB.get('/api/v1/transactions');
    assert.equal(listB.body.data.items.length, 0);
  });
});

describe('dashboard, budgets and reports', () => {
  test('dashboard aggregates totals on the backend', async () => {
    await registerUser();
    const categoryId = await categoryIdFor('Travel & Fuel');
    await agent.post('/api/v1/transactions').send({
      type: 'expense',
      amount: 500,
      categoryId,
      description: 'Petrol',
      transactionDate: new Date().toISOString(),
    });

    const res = await agent.get('/api/v1/dashboard/summary');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.monthExpense, 500);
    assert.equal(res.body.data.highestCategory.name, 'Travel & Fuel');
  });

  test('budget threshold notifications are emitted only once per period', async () => {
    await registerUser();
    await agent.post('/api/v1/budgets').send({ name: 'Monthly', amount: 1000 });
    const categoryId = await categoryIdFor('Shopping');
    await agent.post('/api/v1/transactions').send({
      type: 'expense',
      amount: 850,
      categoryId,
      description: 'Shoes',
      transactionDate: new Date().toISOString(),
    });

    const first = await agent.get('/api/v1/notifications');
    const firstBudgetNotes = first.body.data.notifications.filter((n) =>
      n.type.startsWith('budget_')
    );
    assert.ok(firstBudgetNotes.some((n) => n.data.threshold === 80));

    // Loading the dashboard (and re-fetching) must not duplicate the alert.
    await agent.get('/api/v1/dashboard/summary');
    const second = await agent.get('/api/v1/notifications');
    const repeated = second.body.data.notifications.filter(
      (n) => n.type.startsWith('budget_') && n.data.threshold === 80
    );
    assert.equal(repeated.length, 1);
  });

  test('csv export protects against formula injection', async () => {
    await registerUser();
    const categoryId = await categoryIdFor('Other');
    await agent.post('/api/v1/transactions').send({
      type: 'expense',
      amount: 10,
      categoryId,
      description: '=1+1',
      transactionDate: '2026-10-09',
    });
    const res = await agent.get('/api/v1/reports/export.csv');
    assert.equal(res.status, 200);
    assert.match(res.text, /'=1\+1/);
  });

  test('rejects a budget with invalid amount', async () => {
    await registerUser();
    const res = await agent.post('/api/v1/budgets').send({ name: 'Bad', amount: -5 });
    assert.equal(res.status, 400);
  });
});

describe('goals', () => {
  test('creates a goal and tracks contributions', async () => {
    await registerUser();
    const create = await agent
      .post('/api/v1/goals')
      .send({ name: 'New phone', targetAmount: 20000 });
    assert.equal(create.status, 201);
    assert.equal(create.body.data.goal.progressPercent, 0);
    const id = create.body.data.goal.id;

    const updated = await agent.patch(`/api/v1/goals/${id}`).send({ contribution: 5000 });
    assert.equal(updated.body.data.goal.currentAmount, 5000);
    assert.equal(updated.body.data.goal.progressPercent, 25);
  });
});

describe('expense agent', () => {
  test('parses a natural-language entry into a draft, then saves on confirm', async () => {
    await registerUser();
    const draftRes = await agent
      .post('/api/v1/agent/message')
      .send({ message: 'Spent ₹250 on dinner yesterday' });
    assert.equal(draftRes.status, 200);
    assert.equal(draftRes.body.data.kind, 'draft');
    assert.equal(draftRes.body.data.draft.amount, 250);
    assert.equal(draftRes.body.data.draft.categoryName, 'Food & Dining');

    const confirmRes = await agent.post('/api/v1/agent/message').send({
      message: 'Spent ₹250 on dinner yesterday',
      confirm: true,
      draft: draftRes.body.data.draft,
    });
    assert.equal(confirmRes.body.data.kind, 'saved');

    const list = await agent.get('/api/v1/transactions');
    assert.equal(list.body.data.items.length, 1);
    assert.equal(list.body.data.items[0].amountMinor, 25000);
  });

  test('answers questions from real records and never invents totals', async () => {
    await registerUser();

    const empty = await agent
      .post('/api/v1/agent/message')
      .send({ message: 'How much did I spend this month?' });
    assert.match(empty.body.data.reply, /no expenses/i);

    const categoryId = await categoryIdFor('Food & Dining');
    await agent.post('/api/v1/transactions').send({
      type: 'expense',
      amount: 300,
      categoryId,
      description: 'Dinner',
      transactionDate: new Date().toISOString(),
    });

    const answer = await agent
      .post('/api/v1/agent/message')
      .send({ message: 'How much did I spend this month?' });
    assert.equal(answer.body.data.kind, 'answer');
    assert.equal(answer.body.data.data.total, 300);

    const categoryAnswer = await agent
      .post('/api/v1/agent/message')
      .send({ message: 'How much did I spend on food this month?' });
    assert.equal(categoryAnswer.body.data.data.total, 300);
  });

  test('help intent returns guidance', async () => {
    await registerUser();
    const res = await agent.post('/api/v1/agent/message').send({ message: 'help' });
    assert.match(res.body.data.reply, /record an expense or income/i);
  });
});
