// js/store.js - State management & LocalStorage persistence for Buku Kas

const STORAGE_KEYS = {
  ACTIVE_BOOK_ID: 'bukukas_active_book_id',
  BOOKS: 'bukukas_books',
  DATA_PREFIX: 'bukukas_data_'
};

const DEFAULT_WALLETS = [
  { id: 'w_cash', name: 'Kas Tunai', type: 'cash', initialBalance: 0 },
  { id: 'w_bca', name: 'Bank BCA', type: 'bank', initialBalance: 0 },
  { id: 'w_bri', name: 'Bank BRI', type: 'bank', initialBalance: 0 },
  { id: 'w_mandiri', name: 'Bank Mandiri', type: 'bank', initialBalance: 0 },
  { id: 'w_gopay', name: 'GoPay / QRIS', type: 'ewallet', initialBalance: 0 },
  { id: 'w_dana', name: 'DANA', type: 'ewallet', initialBalance: 0 }
];

const DEFAULT_CATEGORIES = {
  in: [
    { id: 'cat_in_1', name: 'Penjualan Produk', icon: 'shopping-bag', color: '#10b981' },
    { id: 'cat_in_2', name: 'Pendapatan Jasa', icon: 'wrench', color: '#06b6d4' },
    { id: 'cat_in_3', name: 'Modal Usaha', icon: 'coins', color: '#3b82f6' },
    { id: 'cat_in_4', name: 'Pelunasan Piutang', icon: 'user-check', color: '#8b5cf6' },
    { id: 'cat_in_5', name: 'Bonus & Komisi', icon: 'award', color: '#ec4899' },
    { id: 'cat_in_6', name: 'Pemasukan Lain-lain', icon: 'plus-circle', color: '#64748b' }
  ],
  out: [
    { id: 'cat_out_1', name: 'Belanja Stok / Bahan', icon: 'package', color: '#f43f5e' },
    { id: 'cat_out_2', name: 'Gaji Karyawan', icon: 'users', color: '#ea580c' },
    { id: 'cat_out_3', name: 'Sewa Tempat / Ruko', icon: 'home', color: '#d97706' },
    { id: 'cat_out_4', name: 'Listrik, Air & Internet', icon: 'zap', color: '#eab308' },
    { id: 'cat_out_5', name: 'Transportasi & Pengiriman', icon: 'truck', color: '#0284c7' },
    { id: 'cat_out_6', name: 'Operasional & Perlengkapan', icon: 'tool', color: '#7c3aed' },
    { id: 'cat_out_7', name: 'Makan & Konsumsi', icon: 'coffee', color: '#be185d' },
    { id: 'cat_out_8', name: 'Pengeluaran Pribadi / Prive', icon: 'user', color: '#475569' },
    { id: 'cat_out_9', name: 'Pengeluaran Lain-lain', icon: 'minus-circle', color: '#64748b' }
  ]
};

const DEFAULT_BOOK = {
  id: 'book_default',
  name: 'Toko Berkah Usaha',
  type: 'umkm',
  createdAt: new Date().toISOString(),
  profile: {
    name: 'Toko Berkah Usaha',
    owner: 'H. Budi Santoso',
    phone: '081298765432',
    address: 'Jl. Ahmad Yani No. 88, Surabaya',
    notes: 'Terima kasih atas kunjungan & kepercayaan Anda!'
  }
};

const Store = {
  activeBookId: null,
  books: [],
  currentData: {
    transactions: [],
    debts: [],
    wallets: JSON.parse(JSON.stringify(DEFAULT_WALLETS)),
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
    profile: JSON.parse(JSON.stringify(DEFAULT_BOOK.profile))
  },

  init() {
    this.loadBooks();
    if (this.books.length === 0) {
      this.books = [DEFAULT_BOOK];
      this.saveBooks();
    }

    const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_BOOK_ID);
    if (savedActiveId && this.books.find(b => b.id === savedActiveId)) {
      this.activeBookId = savedActiveId;
    } else {
      this.activeBookId = this.books[0].id;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BOOK_ID, this.activeBookId);
    }

    this.loadBookData(this.activeBookId);

    // If active book has no transactions, populate with demo data initially
    if (this.currentData.transactions.length === 0 && this.currentData.debts.length === 0) {
      this.loadSampleData(false); // populate quietly
    }
  },

  loadBooks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
      this.books = data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load books', e);
      this.books = [];
    }
  },

  saveBooks() {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(this.books));
  },

  getActiveBook() {
    return this.books.find(b => b.id === this.activeBookId) || this.books[0];
  },

  switchBook(bookId) {
    const book = this.books.find(b => b.id === bookId);
    if (!book) return false;
    this.activeBookId = bookId;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BOOK_ID, bookId);
    this.loadBookData(bookId);
    return true;
  },

  createBook(name, type = 'umkm', owner = '') {
    const newBook = {
      id: 'book_' + Date.now().toString(36),
      name: name.trim(),
      type: type,
      createdAt: new Date().toISOString(),
      profile: {
        name: name.trim(),
        owner: owner.trim() || 'Pemilik Toko',
        phone: '',
        address: '',
        notes: 'Terima kasih atas kerjasamanya!'
      }
    };
    this.books.push(newBook);
    this.saveBooks();
    
    // Initialize data for new book
    const initialData = {
      transactions: [],
      debts: [],
      wallets: JSON.parse(JSON.stringify(DEFAULT_WALLETS)),
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
      profile: newBook.profile
    };
    localStorage.setItem(STORAGE_KEYS.DATA_PREFIX + newBook.id, JSON.stringify(initialData));
    
    this.switchBook(newBook.id);
    return newBook;
  },

  deleteBook(bookId) {
    if (this.books.length <= 1) {
      return { success: false, message: 'Tidak dapat menghapus satu-satunya buku kas.' };
    }
    this.books = this.books.filter(b => b.id !== bookId);
    this.saveBooks();
    localStorage.removeItem(STORAGE_KEYS.DATA_PREFIX + bookId);

    if (this.activeBookId === bookId) {
      this.switchBook(this.books[0].id);
    }
    return { success: true };
  },

  loadBookData(bookId) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DATA_PREFIX + bookId);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.currentData = {
          transactions: parsed.transactions || [],
          debts: parsed.debts || [],
          wallets: parsed.wallets || JSON.parse(JSON.stringify(DEFAULT_WALLETS)),
          categories: parsed.categories || JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
          profile: parsed.profile || JSON.parse(JSON.stringify(DEFAULT_BOOK.profile))
        };
      } else {
        const activeBook = this.getActiveBook();
        this.currentData = {
          transactions: [],
          debts: [],
          wallets: JSON.parse(JSON.stringify(DEFAULT_WALLETS)),
          categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
          profile: activeBook ? activeBook.profile : JSON.parse(JSON.stringify(DEFAULT_BOOK.profile))
        };
        this.saveCurrentData();
      }
    } catch (e) {
      console.error('Failed to load current data', e);
    }
  },

  saveCurrentData() {
    if (!this.activeBookId) return;
    try {
      localStorage.setItem(STORAGE_KEYS.DATA_PREFIX + this.activeBookId, JSON.stringify(this.currentData));
      // Also sync active book profile with books meta list
      const bookIdx = this.books.findIndex(b => b.id === this.activeBookId);
      if (bookIdx >= 0) {
        this.books[bookIdx].name = this.currentData.profile.name;
        this.books[bookIdx].profile = this.currentData.profile;
        this.saveBooks();
      }
    } catch (e) {
      console.error('Failed to save data to localStorage', e);
    }
  },

  // --- Transactions Operations ---
  addTransaction(tx) {
    const newTx = {
      id: tx.id || Utils.generateId(),
      bookId: this.activeBookId,
      type: tx.type, // 'in' or 'out'
      amount: Number(tx.amount) || 0,
      category: tx.category || (tx.type === 'in' ? 'Penjualan Produk' : 'Operasional & Perlengkapan'),
      walletId: tx.walletId || 'w_cash',
      date: tx.date || Utils.getTodayString(),
      time: tx.time || Utils.getCurrentTimeString(),
      note: tx.note ? tx.note.trim() : '',
      receiptDataUrl: tx.receiptDataUrl || null,
      createdAt: new Date().toISOString()
    };

    this.currentData.transactions.unshift(newTx);
    this.saveCurrentData();
    return newTx;
  },

  updateTransaction(id, updatedFields) {
    const idx = this.currentData.transactions.findIndex(t => t.id === id);
    if (idx >= 0) {
      this.currentData.transactions[idx] = {
        ...this.currentData.transactions[idx],
        ...updatedFields,
        amount: Number(updatedFields.amount !== undefined ? updatedFields.amount : this.currentData.transactions[idx].amount),
        updatedAt: new Date().toISOString()
      };
      this.saveCurrentData();
      return this.currentData.transactions[idx];
    }
    return null;
  },

  deleteTransaction(id) {
    const idx = this.currentData.transactions.findIndex(t => t.id === id);
    if (idx >= 0) {
      const removed = this.currentData.transactions.splice(idx, 1)[0];
      this.saveCurrentData();
      return removed;
    }
    return null;
  },

  // --- Debts Operations (Hutang / Piutang) ---
  addDebt(debt) {
    const newDebt = {
      id: debt.id || Utils.generateId(),
      bookId: this.activeBookId,
      type: debt.type, // 'piutang' (pelanggan hutang ke kita) or 'hutang' (kita hutang ke supplier)
      personName: debt.personName ? debt.personName.trim() : 'Tanpa Nama',
      phone: debt.phone ? debt.phone.trim() : '',
      amount: Number(debt.amount) || 0,
      paidAmount: Number(debt.paidAmount) || 0,
      date: debt.date || Utils.getTodayString(),
      dueDate: debt.dueDate || '',
      note: debt.note ? debt.note.trim() : '',
      payments: debt.payments || [], // [{ id, date, amount, note, walletId }]
      createdAt: new Date().toISOString()
    };

    this.currentData.debts.unshift(newDebt);
    this.saveCurrentData();
    return newDebt;
  },

  updateDebt(id, updatedFields) {
    const idx = this.currentData.debts.findIndex(d => d.id === id);
    if (idx >= 0) {
      this.currentData.debts[idx] = {
        ...this.currentData.debts[idx],
        ...updatedFields,
        amount: Number(updatedFields.amount !== undefined ? updatedFields.amount : this.currentData.debts[idx].amount),
        updatedAt: new Date().toISOString()
      };
      this.saveCurrentData();
      return this.currentData.debts[idx];
    }
    return null;
  },

  deleteDebt(id) {
    const idx = this.currentData.debts.findIndex(d => d.id === id);
    if (idx >= 0) {
      const removed = this.currentData.debts.splice(idx, 1)[0];
      this.saveCurrentData();
      return removed;
    }
    return null;
  },

  recordDebtPayment(debtId, paymentAmount, walletId = 'w_cash', paymentDate = null, paymentNote = '') {
    const debt = this.currentData.debts.find(d => d.id === debtId);
    if (!debt) return null;

    const amt = Number(paymentAmount) || 0;
    if (amt <= 0) return null;

    debt.paidAmount = (Number(debt.paidAmount) || 0) + amt;
    if (!debt.payments) debt.payments = [];
    
    const pDate = paymentDate || Utils.getTodayString();
    debt.payments.push({
      id: Utils.generateId(),
      amount: amt,
      date: pDate,
      note: paymentNote.trim() || 'Pembayaran angsuran',
      walletId: walletId
    });

    // Also automatically create corresponding cashbook transaction!
    // If Piutang paid: Cash comes IN to our business
    // If Hutang paid: Cash goes OUT to supplier
    const txType = debt.type === 'piutang' ? 'in' : 'out';
    const txCategory = debt.type === 'piutang' ? 'Pelunasan Piutang' : 'Operasional & Perlengkapan';
    const txNote = `${debt.type === 'piutang' ? 'Terima pelunasan dari' : 'Bayar hutang ke'} ${debt.personName}${paymentNote ? ' - ' + paymentNote : ''}`;

    this.addTransaction({
      type: txType,
      amount: amt,
      category: txCategory,
      walletId: walletId,
      date: pDate,
      time: Utils.getCurrentTimeString(),
      note: txNote
    });

    this.saveCurrentData();
    return debt;
  },

  // --- Wallets ---
  addWallet(name, type = 'bank', initialBalance = 0) {
    const newWallet = {
      id: 'w_' + Date.now().toString(36),
      name: name.trim(),
      type: type,
      initialBalance: Number(initialBalance) || 0
    };
    this.currentData.wallets.push(newWallet);
    this.saveCurrentData();
    return newWallet;
  },

  transferFunds(fromWalletId, toWalletId, amount, note = '', date = null) {
    const fromW = this.currentData.wallets.find(w => w.id === fromWalletId);
    const toW = this.currentData.wallets.find(w => w.id === toWalletId);
    if (!fromW || !toW || fromWalletId === toWalletId) return null;

    const amt = Number(amount) || 0;
    if (amt <= 0) return null;

    const txDate = date || Utils.getTodayString();
    const time = Utils.getCurrentTimeString();
    const customNote = note ? ` (${note.trim()})` : '';

    // 1. Catat kas keluar dari dompet asal
    const outTx = this.addTransaction({
      type: 'out',
      amount: amt,
      category: 'Transfer Kas / Rekening',
      walletId: fromWalletId,
      date: txDate,
      time: time,
      note: `Pindah dana ke ${toW.name}${customNote}`
    });

    // 2. Catat kas masuk ke dompet tujuan
    const inTx = this.addTransaction({
      type: 'in',
      amount: amt,
      category: 'Transfer Kas / Rekening',
      walletId: toWalletId,
      date: txDate,
      time: time,
      note: `Terima pindah dana dari ${fromW.name}${customNote}`
    });

    return { outTx, inTx };
  },

  deleteWallet(walletId) {
    if (this.currentData.wallets.length <= 1) {
      return { success: false, message: 'Harus ada minimal satu dompet/rekening kas.' };
    }
    this.currentData.wallets = this.currentData.wallets.filter(w => w.id !== walletId);
    this.saveCurrentData();
    return { success: true };
  },

  // --- Categories ---
  addCategory(type, name, icon = 'tag', color = '#10b981') {
    if (!this.currentData.categories[type]) return null;
    const newCat = {
      id: 'cat_' + type + '_' + Date.now().toString(36),
      name: name.trim(),
      icon: icon,
      color: color
    };
    this.currentData.categories[type].push(newCat);
    this.saveCurrentData();
    return newCat;
  },

  deleteCategory(type, catId) {
    if (!this.currentData.categories[type]) return false;
    this.currentData.categories[type] = this.currentData.categories[type].filter(c => c.id !== catId);
    this.saveCurrentData();
    return true;
  },

  // --- Metrics and Financial Calculations ---
  calculateSummary(filteredTransactions = null) {
    const txs = filteredTransactions || this.currentData.transactions;
    let totalIn = 0;
    let totalOut = 0;

    txs.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'in') {
        totalIn += amt;
      } else if (t.type === 'out') {
        totalOut += amt;
      }
    });

    const net = totalIn - totalOut;

    // Calculate Debts
    let totalPiutang = 0;
    let totalHutang = 0;

    this.currentData.debts.forEach(d => {
      const remaining = Math.max(0, (Number(d.amount) || 0) - (Number(d.paidAmount) || 0));
      if (d.type === 'piutang') {
        totalPiutang += remaining;
      } else if (d.type === 'hutang') {
        totalHutang += remaining;
      }
    });

    return {
      totalIn,
      totalOut,
      net,
      totalPiutang,
      totalHutang,
      txCount: txs.length
    };
  },

  calculateWalletBalances() {
    const balances = {};
    this.currentData.wallets.forEach(w => {
      balances[w.id] = Number(w.initialBalance) || 0;
    });

    this.currentData.transactions.forEach(t => {
      const wId = t.walletId || 'w_cash';
      if (balances[wId] === undefined) {
        balances[wId] = 0;
      }
      const amt = Number(t.amount) || 0;
      if (t.type === 'in') {
        balances[wId] += amt;
      } else {
        balances[wId] -= amt;
      }
    });

    return balances;
  },

  // Load realistic Indonesian UMKM sample data
  loadSampleData(overwrite = true) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    const d = (dayOffset, hour = 10, min = 15) => {
      const target = new Date(year, month, day - dayOffset, hour, min);
      const yStr = target.getFullYear();
      const mStr = String(target.getMonth() + 1).padStart(2, '0');
      const dStr = String(target.getDate()).padStart(2, '0');
      const hStr = String(target.getHours()).padStart(2, '0');
      const minStr = String(target.getMinutes()).padStart(2, '0');
      return {
        date: `${yStr}-${mStr}-${dStr}`,
        time: `${hStr}:${minStr}`
      };
    };

    const futureDate = (daysAhead) => {
      const target = new Date(year, month, day + daysAhead);
      const yStr = target.getFullYear();
      const mStr = String(target.getMonth() + 1).padStart(2, '0');
      const dStr = String(target.getDate()).padStart(2, '0');
      return `${yStr}-${mStr}-${dStr}`;
    };

    const sampleTxs = [
      {
        id: 'tx_s1',
        bookId: this.activeBookId,
        type: 'in',
        amount: 850000,
        category: 'Penjualan Produk',
        walletId: 'w_cash',
        ...d(0, 9, 30),
        note: 'Penjualan paket sembako 5 kardus (Ibu Rina)',
        receiptDataUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_s2',
        bookId: this.activeBookId,
        type: 'in',
        amount: 1450000,
        category: 'Penjualan Produk',
        walletId: 'w_bca',
        ...d(0, 11, 45),
        note: 'Pesanan grosir beras 50kg & minyak goreng (Resto Sedap)',
        receiptDataUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_s3',
        bookId: this.activeBookId,
        type: 'out',
        amount: 250000,
        category: 'Operasional & Perlengkapan',
        walletId: 'w_cash',
        ...d(0, 14, 10),
        note: 'Beli plastik kresek, nota kasir, dan isolasi box',
        receiptDataUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_s4',
        bookId: this.activeBookId,
        type: 'in',
        amount: 620000,
        category: 'Penjualan Produk',
        walletId: 'w_gopay',
        ...d(1, 15, 20),
        note: 'Pembayaran QRIS dari pelanggan eceran sore',
        receiptDataUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_s5',
        bookId: this.activeBookId,
        type: 'out',
        amount: 3200000,
        category: 'Belanja Stok / Bahan',
        walletId: 'w_bca',
        ...d(1, 10, 0),
        note: 'Kulakan stok gula pasir 2 karung & telur 5 peti ke Agen Utama',
        receiptDataUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_s6',
        bookId: this.activeBookId,
        type: 'in',
        amount: 450000,
        category: 'Pelunasan Piutang',
        walletId: 'w_cash',
        ...d(2, 13, 0),
        note: 'Pak Joko bayar cicilan kasbon sembako',
        receiptDataUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_s7',
        bookId: this.activeBookId,
        type: 'out',
        amount: 380000,
        category: 'Listrik, Air & Internet',
        walletId: 'w_mandiri',
        ...d(2, 16, 45),
        note: 'Bayar tagihan listrik PLN dan WiFi Indihome toko',
        receiptDataUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_s8',
        bookId: this.activeBookId,
        type: 'in',
        amount: 1950000,
        category: 'Penjualan Produk',
        walletId: 'w_cash',
        ...d(3, 11, 15),
        note: 'Penjualan harian akhir pekan toko ramai',
        receiptDataUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_s9',
        bookId: this.activeBookId,
        type: 'out',
        amount: 1200000,
        category: 'Gaji Karyawan',
        walletId: 'w_cash',
        ...d(4, 17, 30),
        note: 'Gaji mingguan 2 staf penjaga toko (Bagas & Siti)',
        receiptDataUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_s10',
        bookId: this.activeBookId,
        type: 'in',
        amount: 5000000,
        category: 'Modal Usaha',
        walletId: 'w_bri',
        ...d(5, 8, 30),
        note: 'Suntikan modal tambahan ekspansi etalase baru',
        receiptDataUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_s11',
        bookId: this.activeBookId,
        type: 'out',
        amount: 85000,
        category: 'Transportasi & Pengiriman',
        walletId: 'w_cash',
        ...d(6, 12, 0),
        note: 'Bensin motor kurir pengantaran barang ke pelanggan',
        receiptDataUrl: null,
        createdAt: new Date().toISOString()
      }
    ];

    const sampleDebts = [
      {
        id: 'debt_s1',
        bookId: this.activeBookId,
        type: 'piutang',
        personName: 'Warung Bu Siti',
        phone: '081234567890',
        amount: 750000,
        paidAmount: 250000,
        date: d(3).date,
        dueDate: futureDate(4),
        note: 'Ambil minyak goreng 2 kardus & mie instan 3 dus',
        payments: [
          {
            id: 'pay_1',
            amount: 250000,
            date: d(1).date,
            note: 'Cicilan ke-1 tunai',
            walletId: 'w_cash'
          }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'debt_s2',
        bookId: this.activeBookId,
        type: 'piutang',
        personName: 'Pak Hendra (Katering)',
        phone: '085712345678',
        amount: 1200000,
        paidAmount: 0,
        date: d(5).date,
        dueDate: futureDate(1),
        note: 'Bahan pokok pesanan katering pernikahan',
        payments: [],
        createdAt: new Date().toISOString()
      },
      {
        id: 'debt_s3',
        bookId: this.activeBookId,
        type: 'hutang',
        personName: 'CV Distributor Beras Makmur',
        phone: '082199887766',
        amount: 2500000,
        paidAmount: 1000000,
        date: d(7).date,
        dueDate: futureDate(7),
        note: 'Faktur Pengiriman Beras Rojo Lele 20 karung (Fak-889)',
        payments: [
          {
            id: 'pay_2',
            amount: 1000000,
            date: d(2).date,
            note: 'DP Pembayaran via BCA',
            walletId: 'w_bca'
          }
        ],
        createdAt: new Date().toISOString()
      }
    ];

    if (overwrite) {
      this.currentData.transactions = sampleTxs;
      this.currentData.debts = sampleDebts;
      this.currentData.profile = {
        name: 'Toko Berkah Usaha',
        owner: 'H. Budi Santoso',
        phone: '081298765432',
        address: 'Jl. Ahmad Yani No. 88, Surabaya',
        notes: 'Terima kasih atas kunjungan & kepercayaan Anda!'
      };
      this.saveCurrentData();
    } else {
      // only if empty
      if (this.currentData.transactions.length === 0) {
        this.currentData.transactions = sampleTxs;
      }
      if (this.currentData.debts.length === 0) {
        this.currentData.debts = sampleDebts;
      }
      this.saveCurrentData();
    }
  },

  // Export full database to JSON file
  exportBackupJson() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      activeBookId: this.activeBookId,
      books: this.books,
      data: {}
    };

    this.books.forEach(b => {
      const raw = localStorage.getItem(STORAGE_KEYS.DATA_PREFIX + b.id);
      if (raw) {
        backup.data[b.id] = JSON.parse(raw);
      }
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_BukuKas_${Utils.getTodayString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Import JSON backup
  importBackupJson(jsonString) {
    try {
      const backup = JSON.parse(jsonString);
      if (!backup.books || !backup.data) {
        return { success: false, message: 'Format file cadangan tidak valid.' };
      }

      this.books = backup.books;
      this.saveBooks();

      Object.keys(backup.data).forEach(bookId => {
        localStorage.setItem(STORAGE_KEYS.DATA_PREFIX + bookId, JSON.stringify(backup.data[bookId]));
      });

      this.activeBookId = backup.activeBookId || this.books[0].id;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BOOK_ID, this.activeBookId);
      this.loadBookData(this.activeBookId);

      return { success: true };
    } catch (e) {
      console.error('Import error', e);
      return { success: false, message: 'Gagal memproses file JSON: ' + e.message };
    }
  },

  // Reset all current book data
  resetActiveBookData() {
    this.currentData = {
      transactions: [],
      debts: [],
      wallets: JSON.parse(JSON.stringify(DEFAULT_WALLETS)),
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
      profile: JSON.parse(JSON.stringify(DEFAULT_BOOK.profile))
    };
    this.saveCurrentData();
  }
};
