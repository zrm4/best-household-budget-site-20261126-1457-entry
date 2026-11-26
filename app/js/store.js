const STORAGE_KEY = 'hearth-ledger-v1';

const CATEGORIES = [
  'Groceries',
  'Rent',
  'Utilities',
  'Transport',
  'Dining Out',
  'Health',
  'Entertainment',
  'Kids',
  'Savings',
  'Other'
];

function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function seedTransactions() {
  const transactions = [];
  const baseDate = new Date('2026-06-01');
  const payees = {
    'Groceries': ['Trader Joe\'s', 'Whole Foods', 'Safeway', 'Costco', 'Local Market'],
    'Rent': ['Oakwood Apartments'],
    'Utilities': ['Comcast', 'PG&E', 'City Water', 'Verizon'],
    'Transport': ['Shell', 'Chevron', 'BP', 'Exxon', '76'],
    'Dining Out': ['Chipotle', 'Local Bistro', 'Pizza Place', 'Thai Kitchen', 'Burger Joint', 'Sushi Spot'],
    'Health': ['CVS', 'Walgreens', 'Kaiser Pharmacy', 'Dental Clinic', 'Vision Center'],
    'Entertainment': ['Netflix', 'Spotify', 'AMC Theaters', 'Steam', 'Local Concert'],
    'Kids': ['Sunshine Daycare', 'Target', 'Old Navy', 'Pediatrician', 'Swim Lessons'],
    'Savings': ['Vanguard', 'High-Yield Savings', 'IRA Contribution'],
    'Other': ['Amazon', 'Home Depot', 'Best Buy', 'Post Office', 'UPS']
  };

  const amounts = {
    'Groceries': () => -(45 + Math.random() * 120),
    'Rent': () => -1650,
    'Utilities': () => -(50 + Math.random() * 100),
    'Transport': () => -(35 + Math.random() * 50),
    'Dining Out': () => -(15 + Math.random() * 60),
    'Health': () => -(20 + Math.random() * 150),
    'Entertainment': () => -(10 + Math.random() * 80),
    'Kids': () => -(30 + Math.random() * 200),
    'Savings': () => -(200 + Math.random() * 300),
    'Other': () => -(10 + Math.random() * 120)
  };

  let txnId = 0;

  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const month = new Date(baseDate);
    month.setMonth(month.getMonth() + monthOffset);

    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

    const incomeCount = 2;
    for (let i = 0; i < incomeCount; i++) {
      const day = i === 0 ? 1 : 15;
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      transactions.push({
        id: `txn-${++txnId}`,
        date: localDateStr(date),
        payee: 'Employer Payroll',
        amount: 2425,
        category: 'Income',
        type: 'income',
        notes: 'Bi-weekly paycheck'
      });
    }

    const expenseCategories = CATEGORIES.filter(c => c !== 'Savings');
    expenseCategories.forEach(cat => {
      const txnCount = cat === 'Rent' ? 1 : Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < txnCount; i++) {
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        const date = new Date(month.getFullYear(), month.getMonth(), day);
        const payeeList = payees[cat] || ['Misc'];
        const payee = payeeList[Math.floor(Math.random() * payeeList.length)];
        const amount = amounts[cat] ? amounts[cat]() : -(10 + Math.random() * 100);
        transactions.push({
          id: `txn-${++txnId}`,
          date: localDateStr(date),
          payee,
          amount: Math.round(amount * 100) / 100,
          category: cat,
          type: 'expense',
          notes: ''
        });
      }
    });

    const savingsTxnCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < savingsTxnCount; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const payeeList = payees['Savings'];
      const payee = payeeList[Math.floor(Math.random() * payeeList.length)];
      const amount = -(300 + Math.random() * 400);
      transactions.push({
        id: `txn-${++txnId}`,
        date: localDateStr(date),
        payee,
        amount: Math.round(amount * 100) / 100,
        category: 'Savings',
        type: 'expense',
        notes: 'Automatic transfer'
      });
    }

    if (monthOffset === 0) {
      const refundDate = new Date(month.getFullYear(), month.getMonth(), 20);
      transactions.push({
        id: `txn-${++txnId}`,
        date: localDateStr(refundDate),
        payee: 'Costco Return',
        amount: 89.99,
        category: 'Groceries',
        type: 'income',
        notes: 'Returned item'
      });
    }
    if (monthOffset === 2) {
      const refundDate = new Date(month.getFullYear(), month.getMonth(), 14);
      transactions.push({
        id: `txn-${++txnId}`,
        date: localDateStr(refundDate),
        payee: 'Amazon Refund',
        amount: 45.50,
        category: 'Other',
        type: 'income',
        notes: 'Wrong size'
      });
    }
  }

  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  return transactions;
}

function seedBudgets() {
  return {
    'Groceries': 650,
    'Rent': 1650,
    'Utilities': 320,
    'Transport': 280,
    'Dining Out': 300,
    'Health': 200,
    'Entertainment': 150,
    'Kids': 500,
    'Savings': 800,
    'Other': 150
  };
}

function seedBills() {
  return [
    { id: 'bill-1', name: 'Rent', amount: 1650, dueDay: 1, category: 'Rent', paid: false },
    { id: 'bill-2', name: 'Comcast Internet', amount: 89, dueDay: 12, category: 'Utilities', paid: false },
    { id: 'bill-3', name: 'Netflix', amount: 15.49, dueDay: 18, category: 'Entertainment', paid: false }
  ];
}

function seedGoals() {
  return [
    { id: 'goal-1', name: 'Emergency Fund', target: 9000, saved: 4320, created: '2025-01-15' },
    { id: 'goal-2', name: 'Maui Trip', target: 3200, saved: 1150, created: '2026-03-01' },
    { id: 'goal-3', name: 'New Washer', target: 1400, saved: 620, created: '2026-06-10' }
  ];
}

function getDefaultState() {
  return {
    transactions: seedTransactions(),
    budgets: seedBudgets(),
    bills: seedBills(),
    goals: seedGoals()
  };
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        transactions: parsed.transactions || seedTransactions(),
        budgets: parsed.budgets || seedBudgets(),
        bills: parsed.bills || seedBills(),
        goals: parsed.goals || seedGoals()
      };
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }
  return getDefaultState();
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

let state = loadState();

function getState() {
  return {
    transactions: [...state.transactions],
    budgets: { ...state.budgets },
    bills: [...state.bills],
    goals: [...state.goals]
  };
}

function addTransaction(txn) {
  const newTxn = {
    id: generateId(),
    date: txn.date,
    payee: txn.payee,
    amount: Number(txn.amount),
    category: txn.category,
    type: txn.type || (txn.amount >= 0 ? 'income' : 'expense'),
    notes: txn.notes || ''
  };
  state.transactions.push(newTxn);
  state.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveState(state);
  return newTxn;
}

function deleteTransaction(id) {
  const idx = state.transactions.findIndex(t => t.id === id);
  if (idx !== -1) {
    state.transactions.splice(idx, 1);
    saveState(state);
    return true;
  }
  return false;
}

function updateTransaction(id, updates) {
  const idx = state.transactions.findIndex(t => t.id === id);
  if (idx !== -1) {
    state.transactions[idx] = { ...state.transactions[idx], ...updates };
    state.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveState(state);
    return state.transactions[idx];
  }
  return null;
}

function setBudget(category, amount) {
  state.budgets[category] = Number(amount);
  saveState(state);
  return state.budgets;
}

function addGoal(goal) {
  const newGoal = {
    id: generateId(),
    name: goal.name,
    target: Number(goal.target),
    saved: Number(goal.saved) || 0,
    created: goal.created || new Date().toISOString().split('T')[0]
  };
  state.goals.push(newGoal);
  saveState(state);
  return newGoal;
}

function contributeGoal(id, amount) {
  const goal = state.goals.find(g => g.id === id);
  if (goal) {
    goal.saved = Math.min(goal.target, goal.saved + Number(amount));
    saveState(state);
    return goal;
  }
  return null;
}

function toggleBillPaid(id) {
  const bill = state.bills.find(b => b.id === id);
  if (bill) {
    bill.paid = !bill.paid;
    saveState(state);
    return bill;
  }
  return null;
}

function monthSummary(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const monthTxns = state.transactions.filter(t => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });

  const income = monthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = monthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const net = income - expenses;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  return { income, expenses, net, savingsRate, transactions: monthTxns };
}

function categoryTotals(monthStr) {
  const { transactions } = monthSummary(monthStr);
  const totals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount);
  });
  return totals;
}

function upcomingBills(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  return state.bills.map(bill => {
    const dueDate = new Date(year, month - 1, bill.dueDay);
    if (dueDate.getMonth() !== month - 1) {
      const nextMonth = new Date(year, month, bill.dueDay);
      return { ...bill, dueDate: localDateStr(nextMonth) };
    }
    return { ...bill, dueDate: localDateStr(dueDate) };
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function init() {
  state = loadState();
  return getState();
}

export const store = {
  init,
  getState,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  setBudget,
  addGoal,
  contributeGoal,
  toggleBillPaid,
  monthSummary,
  categoryTotals,
  upcomingBills
};