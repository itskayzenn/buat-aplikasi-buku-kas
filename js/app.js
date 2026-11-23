// js/app.js - Main Application Controller for Buku Kas Pintar

const App = {
  activeTab: 'dashboard',
  currentPeriod: 'this_month',
  customStartDate: '',
  customEndDate: '',
  hideBalance: false,
  activeDebtSubTab: 'piutang', // 'piutang' or 'hutang'
  debtStatusFilter: 'all', // 'all', 'unpaid', 'overdue', 'paid'
  txTypeFilter: 'all', // 'all', 'in', 'out'
  txCategoryFilter: 'all',
  txWalletFilter: 'all',
  txSearchQuery: '',
  debtSearchQuery: '',
  currentReceiptTx: null,
  pendingDeleteAction: null,

  init() {
    // 1. Initialize Store
    Store.init();

    // 2. Load preferences
    this.initTheme();
    this.initPreferences();

    // 3. Setup UI event handlers
    this.setupEventListeners();

    // 4. Update Header Books Dropdown & Profile
    this.renderBookSelector();

    // 5. Setup default dates for datepickers
    const today = Utils.getTodayString();
    document.querySelectorAll('.input-today').forEach(el => {
      if (!el.value) el.value = today;
    });

    // 6. Initial render
    this.switchTab('dashboard');

    // 7. Refresh Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  initTheme() {
    const savedTheme = localStorage.getItem('bukukas_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('bukukas_theme', isDark ? 'dark' : 'light');
    if (this.activeTab === 'dashboard') {
      this.renderDashboardCharts();
    }
    if (window.lucide) window.lucide.createIcons();
  },

  initPreferences() {
    this.hideBalance = localStorage.getItem('bukukas_hide_balance') === 'true';
    this.updateBalanceVisibility();
  },

  toggleHideBalance() {
    this.hideBalance = !this.hideBalance;
    localStorage.setItem('bukukas_hide_balance', this.hideBalance);
    this.updateBalanceVisibility();
  },

  updateBalanceVisibility() {
    const balanceEls = document.querySelectorAll('.privacy-balance');
    const iconEye = document.getElementById('btn-toggle-eye');
    
    balanceEls.forEach(el => {
      if (this.hideBalance) {
        el.dataset.realText = el.dataset.realText || el.textContent;
        el.textContent = '••••••••';
      } else {
        if (el.dataset.realText) {
          el.textContent = el.dataset.realText;
        }
      }
    });

    if (iconEye) {
      iconEye.setAttribute('data-lucide', this.hideBalance ? 'eye-off' : 'eye');
      if (window.lucide) window.lucide.createIcons();
    }
  },

  // --- Navigation & Tabs ---
  switchTab(tabName) {
    this.activeTab = tabName;

    // Update Top Desktop Nav tabs
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      const target = btn.getAttribute('data-tab-target');
      if (target === tabName) {
        btn.classList.add('bg-emerald-600', 'text-white', 'shadow-sm');
        btn.classList.remove('text-slate-600', 'hover:bg-slate-100', 'dark:text-slate-300', 'dark:hover:bg-slate-800');
      } else {
        btn.classList.remove('bg-emerald-600', 'text-white', 'shadow-sm');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100', 'dark:text-slate-300', 'dark:hover:bg-slate-800');
      }
    });

    // Update Mobile Bottom Nav
    document.querySelectorAll('[data-mobile-tab-target]').forEach(btn => {
      const target = btn.getAttribute('data-mobile-tab-target');
      if (target === tabName) {
        btn.classList.add('text-emerald-600', 'dark:text-emerald-400');
        btn.classList.remove('text-slate-400', 'dark:text-slate-500');
      } else {
        btn.classList.remove('text-emerald-600', 'dark:text-emerald-400');
        btn.classList.add('text-slate-400', 'dark:text-slate-500');
      }
    });

    // Show active tab view
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.add('hidden');
    });
    const activeView = document.getElementById(`view-${tabName}`);
    if (activeView) {
      activeView.classList.remove('hidden');
    }

    // Render content for selected tab
    switch (tabName) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'transactions':
        this.renderTransactions();
        break;
      case 'debts':
        this.renderDebts();
        break;
      case 'reports':
        this.renderReports();
        break;
      case 'wallets':
        this.renderWallets();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
  },

  // --- Book Kas Switcher & Manager ---
  renderBookSelector() {
    const activeBook = Store.getActiveBook();
    const nameEl = document.getElementById('current-book-name');
    const badgeEl = document.getElementById('current-book-type');
    if (nameEl) nameEl.textContent = activeBook.name;
    if (badgeEl) badgeEl.textContent = activeBook.type.toUpperCase();

    // Render dropdown items
    const listEl = document.getElementById('books-dropdown-list');
    if (listEl) {
      listEl.innerHTML = Store.books.map(b => `
        <button onclick="App.selectBook('${b.id}')" class="w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition ${b.id === Store.activeBookId ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}">
          <div class="flex items-center space-x-2 truncate">
            <i data-lucide="${b.type === 'personal' ? 'user' : 'store'}" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">${Utils.sanitizeHtml(b.name)}</span>
          </div>
          ${b.id === Store.activeBookId ? '<i data-lucide="check" class="w-4 h-4 text-emerald-600 shrink-0"></i>' : ''}
        </button>
      `).join('');
    }
    if (window.lucide) window.lucide.createIcons();
  },

  selectBook(bookId) {
    Store.switchBook(bookId);
    this.toggleBookDropdown(false);
    this.renderBookSelector();
    this.switchTab(this.activeTab);
    Utils.showToast(`Buku kas dialihkan ke: ${Store.getActiveBook().name}`, 'info');
  },

  toggleBookDropdown(forceState = null) {
    const dropdown = document.getElementById('books-dropdown');
    if (!dropdown) return;
    if (forceState !== null) {
      if (forceState) dropdown.classList.remove('hidden');
      else dropdown.classList.add('hidden');
    } else {
      dropdown.classList.toggle('hidden');
    }
  },

  openNewBookModal() {
    this.toggleBookDropdown(false);
    document.getElementById('new-book-form').reset();
    this.openModal('modal-new-book');
  },

  saveNewBook(e) {
    e.preventDefault();
    const name = document.getElementById('new-book-name').value;
    const type = document.getElementById('new-book-type').value;
    const owner = document.getElementById('new-book-owner').value;

    if (!name.trim()) {
      Utils.showToast('Nama buku kas wajib diisi.', 'error');
      return;
    }

    const book = Store.createBook(name, type, owner);
    this.closeModal('modal-new-book');
    this.renderBookSelector();
    this.switchTab('dashboard');
    Utils.showToast(`Buku kas "${book.name}" berhasil dibuat!`, 'success');
  },

  // --- Date Range Filter Helper ---
  getFilteredTransactions(period = this.currentPeriod, customStart = this.customStartDate, customEnd = this.customEndDate) {
    const allTxs = Store.currentData.transactions;
    if (period === 'all') return allTxs;

    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    const formatDate = (dateObj) => {
      const yr = dateObj.getFullYear();
      const mo = String(dateObj.getMonth() + 1).padStart(2, '0');
      const da = String(dateObj.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    };

    let startStr = '';
    let endStr = formatDate(today);

    if (period === 'today') {
      startStr = endStr;
    } else if (period === 'yesterday') {
      const yesterday = new Date(y, m, d - 1);
      startStr = formatDate(yesterday);
      endStr = startStr;
    } else if (period === '7days') {
      const past7 = new Date(y, m, d - 6);
      startStr = formatDate(past7);
    } else if (period === 'this_month') {
      const firstDay = new Date(y, m, 1);
      startStr = formatDate(firstDay);
    } else if (period === 'last_month') {
      const firstDayLastMonth = new Date(y, m - 1, 1);
      const lastDayLastMonth = new Date(y, m, 0);
      startStr = formatDate(firstDayLastMonth);
      endStr = formatDate(lastDayLastMonth);
    } else if (period === 'this_year') {
      startStr = `${y}-01-01`;
    } else if (period === 'custom') {
      startStr = customStart || '2000-01-01';
      endStr = customEnd || '2099-12-31';
    }

    return allTxs.filter(t => t.date >= startStr && t.date <= endStr);
  },

  setPeriodFilter(period) {
    this.currentPeriod = period;

    // Update active pill UI in dashboard
    document.querySelectorAll('.period-pill').forEach(btn => {
      if (btn.dataset.period === period) {
        btn.classList.add('bg-emerald-600', 'text-white', 'shadow-sm');
        btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('bg-emerald-600', 'text-white', 'shadow-sm');
        btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      }
    });

    const customDateBox = document.getElementById('dashboard-custom-dates');
    if (customDateBox) {
      if (period === 'custom') customDateBox.classList.remove('hidden');
      else customDateBox.classList.add('hidden');
    }

    this.renderDashboard();
  },

  applyCustomDashboardDates() {
    const s = document.getElementById('dash-start-date').value;
    const e = document.getElementById('dash-end-date').value;
    if (!s || !e) {
      Utils.showToast('Harap pilih tanggal mulai dan selesai.', 'error');
      return;
    }
    this.customStartDate = s;
    this.customEndDate = e;
    this.renderDashboard();
  },

  // --- Dashboard Tab Rendering ---
  renderDashboard() {
    const txs = this.getFilteredTransactions();
    const summary = Store.calculateSummary(txs);
    const allTimeSummary = Store.calculateSummary(Store.currentData.transactions);

    // Update Banner & Cards
    const totalBalanceEl = document.getElementById('dash-total-balance');
    const incomeEl = document.getElementById('dash-period-income');
    const expenseEl = document.getElementById('dash-period-expense');
    const netEl = document.getElementById('dash-period-net');
    const piutangEl = document.getElementById('dash-total-piutang');
    const hutangEl = document.getElementById('dash-total-hutang');
    const txCountEl = document.getElementById('dash-tx-count');

    // Total Kas Bersih (All-time net cash)
    if (totalBalanceEl) {
      totalBalanceEl.textContent = Utils.formatRupiah(allTimeSummary.net);
      totalBalanceEl.dataset.realText = Utils.formatRupiah(allTimeSummary.net);
    }
    if (incomeEl) incomeEl.textContent = Utils.formatRupiah(summary.totalIn);
    if (expenseEl) expenseEl.textContent = Utils.formatRupiah(summary.totalOut);
    if (netEl) {
      netEl.textContent = Utils.formatRupiah(summary.net);
      if (summary.net >= 0) {
        netEl.className = 'text-xl font-bold text-emerald-600 dark:text-emerald-400';
      } else {
        netEl.className = 'text-xl font-bold text-rose-600 dark:text-rose-400';
      }
    }
    if (piutangEl) piutangEl.textContent = Utils.formatRupiah(allTimeSummary.totalPiutang);
    if (hutangEl) hutangEl.textContent = Utils.formatRupiah(allTimeSummary.totalHutang);
    if (txCountEl) txCountEl.textContent = `${summary.txCount} Transaksi`;

    // Render Quick Wallets Bar
    this.renderDashboardWallets();

    // Render Recent Transactions
    this.renderDashboardRecentTransactions();

    // Render Charts
    this.renderDashboardCharts();

    this.updateBalanceVisibility();
    if (window.lucide) window.lucide.createIcons();
  },

  renderDashboardWallets() {
    const container = document.getElementById('dash-wallets-list');
    if (!container) return;

    const balances = Store.calculateWalletBalances();
    const wallets = Store.currentData.wallets;

    container.innerHTML = wallets.map(w => {
      const bal = balances[w.id] !== undefined ? balances[w.id] : w.initialBalance;
      let icon = 'wallet';
      let iconColor = 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400';
      if (w.type === 'bank') {
        icon = 'landmark';
        iconColor = 'text-blue-600 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400';
      } else if (w.type === 'ewallet') {
        icon = 'smartphone';
        iconColor = 'text-purple-600 bg-purple-100 dark:bg-purple-950/60 dark:text-purple-400';
      }

      return `
        <div class="min-w-[190px] flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center space-x-3.5 hover:border-emerald-400 transition cursor-pointer" onclick="App.openTransferModal('${w.id}')">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconColor}">
            <i data-lucide="${icon}" class="w-5 h-5"></i>
          </div>
          <div class="truncate">
            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">${Utils.sanitizeHtml(w.name)}</p>
            <p class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate privacy-balance" data-real-text="${Utils.formatRupiah(bal)}">${Utils.formatRupiah(bal)}</p>
          </div>
        </div>
      `;
    }).join('');
  },

  renderDashboardRecentTransactions() {
    const listEl = document.getElementById('dash-recent-transactions');
    if (!listEl) return;

    const recent = Store.currentData.transactions.slice(0, 5);
    if (recent.length === 0) {
      listEl.innerHTML = `
        <div class="py-12 text-center text-slate-400 dark:text-slate-500">
          <i data-lucide="receipt" class="w-12 h-12 mx-auto stroke-1 mb-2"></i>
          <p class="text-sm">Belum ada transaksi di buku kas ini.</p>
          <button onclick="App.openTransactionModal('in')" class="mt-3 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
            + Catat Transaksi Pertama
          </button>
        </div>
      `;
      return;
    }

    const walletsMap = {};
    Store.currentData.wallets.forEach(w => { walletsMap[w.id] = w.name; });

    listEl.innerHTML = recent.map(t => {
      const isIn = t.type === 'in';
      const wName = walletsMap[t.walletId] || 'Kas Tunai';
      return `
        <div class="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition border-b border-slate-100 dark:border-slate-800/80 last:border-none">
          <div class="flex items-center space-x-3.5 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIn ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}">
              <i data-lucide="${isIn ? 'arrow-down-left' : 'arrow-up-right'}" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">${Utils.sanitizeHtml(t.note || t.category)}</p>
              <div class="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px] font-medium">${Utils.sanitizeHtml(t.category)}</span>
                <span>•</span>
                <span>${Utils.sanitizeHtml(wName)}</span>
                <span>•</span>
                <span>${Utils.formatDateIndo(t.date)}</span>
              </div>
            </div>
          </div>
          <div class="text-right shrink-0 pl-3">
            <p class="text-sm font-bold ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
              ${isIn ? '+' : '-'}${Utils.formatRupiah(t.amount)}
            </p>
            <div class="flex items-center justify-end space-x-1.5 mt-1">
              <button onclick="App.openReceiptModal('${t.id}')" title="Lihat Struk" class="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1">
                <i data-lucide="receipt" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="App.openTransactionModal('edit', '${t.id}')" title="Edit" class="text-slate-400 hover:text-blue-600 p-1">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderDashboardCharts() {
    const txs = this.getFilteredTransactions();
    ChartsManager.refresh(txs);
  },

  // --- Transactions Tab Rendering ---
  renderTransactions() {
    // Populate Category filter dropdown
    this.populateTxCategoryFilterDropdown();

    // Populate Wallet filter dropdown
    this.populateTxWalletFilterDropdown();

    let txs = [...Store.currentData.transactions];

    // Filter by type
    if (this.txTypeFilter !== 'all') {
      txs = txs.filter(t => t.type === this.txTypeFilter);
    }

    // Filter by category
    if (this.txCategoryFilter !== 'all') {
      txs = txs.filter(t => t.category === this.txCategoryFilter);
    }

    // Filter by wallet
    if (this.txWalletFilter !== 'all') {
      txs = txs.filter(t => t.walletId === this.txWalletFilter);
    }

    // Search query
    if (this.txSearchQuery.trim()) {
      const q = this.txSearchQuery.toLowerCase();
      txs = txs.filter(t => 
        (t.note && t.note.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        String(t.amount).includes(q)
      );
    }

    // Update filter counters
    const txSummary = Store.calculateSummary(txs);
    const filterInfoEl = document.getElementById('tx-filter-summary');
    if (filterInfoEl) {
      filterInfoEl.innerHTML = `
        <span class="font-bold text-slate-800 dark:text-slate-200">${txs.length}</span> transaksi ditemukan:
        <span class="text-emerald-600 font-semibold ml-2">Masuk: +${Utils.formatRupiah(txSummary.totalIn)}</span>
        <span class="text-rose-600 font-semibold ml-2">Keluar: -${Utils.formatRupiah(txSummary.totalOut)}</span>
      `;
    }

    const container = document.getElementById('transactions-grouped-list');
    if (!container) return;

    if (txs.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <i data-lucide="search-x" class="w-14 h-14 mx-auto stroke-1 mb-3"></i>
          <h4 class="text-base font-semibold text-slate-700 dark:text-slate-300">Tidak ada transaksi yang sesuai</h4>
          <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter tipe transaksi.</p>
          <button onclick="App.resetTxFilters()" class="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition">
            Reset Semua Filter
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Group transactions by date
    const grouped = {};
    txs.forEach(t => {
      if (!grouped[t.date]) grouped[t.date] = [];
      grouped[t.date].push(t);
    });

    // Sort dates descending
    const sortedDates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));
    const walletsMap = {};
    Store.currentData.wallets.forEach(w => { walletsMap[w.id] = w.name; });

    const todayStr = Utils.getTodayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yr = yesterday.getFullYear();
    const mo = String(yesterday.getMonth() + 1).padStart(2, '0');
    const da = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yr}-${mo}-${da}`;

    let html = '';
    sortedDates.forEach(dateKey => {
      const dayTxs = grouped[dateKey];
      let dateHeaderLabel = Utils.formatDateIndo(dateKey, true);
      if (dateKey === todayStr) {
        dateHeaderLabel = `Hari Ini • ${Utils.formatDateIndo(dateKey)}`;
      } else if (dateKey === yesterdayStr) {
        dateHeaderLabel = `Kemarin • ${Utils.formatDateIndo(dateKey)}`;
      }

      let dayIn = 0;
      let dayOut = 0;
      dayTxs.forEach(t => {
        if (t.type === 'in') dayIn += Number(t.amount) || 0;
        else dayOut += Number(t.amount) || 0;
      });

      html += `
        <div class="mb-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
          <!-- Group Date Header -->
          <div class="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold">
            <div class="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
              <span>${dateHeaderLabel}</span>
            </div>
            <div class="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
              ${dayIn > 0 ? `<span class="text-emerald-600 dark:text-emerald-400">+${Utils.formatRupiah(dayIn)}</span>` : ''}
              ${dayOut > 0 ? `<span class="text-rose-600 dark:text-rose-400">-${Utils.formatRupiah(dayOut)}</span>` : ''}
            </div>
          </div>

          <!-- Transactions in this Date -->
          <div class="divide-y divide-slate-100 dark:divide-slate-800">
      `;

      dayTxs.forEach(t => {
        const isIn = t.type === 'in';
        const wName = walletsMap[t.walletId] || 'Kas Tunai';
        const hasReceipt = Boolean(t.receiptDataUrl);

        html += `
          <div class="p-4 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
            <div class="flex items-center space-x-3.5 min-w-0 pr-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isIn ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}">
                <i data-lucide="${isIn ? 'arrow-down-left' : 'arrow-up-right'}" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center space-x-2">
                  <p class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">${Utils.sanitizeHtml(t.note || t.category)}</p>
                  ${hasReceipt ? `<span onclick="App.previewReceiptImage('${t.id}')" title="Ada Foto Struk" class="cursor-pointer bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center space-x-1"><i data-lucide="image" class="w-3 h-3"></i><span>Foto</span></span>` : ''}
                </div>
                <div class="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span class="bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-700 dark:text-slate-300">${Utils.sanitizeHtml(t.category)}</span>
                  <span>•</span>
                  <span>${Utils.sanitizeHtml(wName)}</span>
                  <span>•</span>
                  <span>${t.time || ''}</span>
                </div>
              </div>
            </div>

            <!-- Amount and Actions -->
            <div class="text-right shrink-0">
              <p class="text-base font-bold ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                ${isIn ? '+' : '-'}${Utils.formatRupiah(t.amount)}
              </p>
              <div class="flex items-center justify-end space-x-1 mt-1.5">
                <button onclick="App.openReceiptModal('${t.id}')" title="Nota / Struk Digital" class="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  <i data-lucide="receipt" class="w-4 h-4"></i>
                </button>
                <button onclick="App.openTransactionModal('edit', '${t.id}')" title="Ubah Transaksi" class="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick="App.confirmDelete('transaction', '${t.id}')" title="Hapus Transaksi" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  },

  populateTxCategoryFilterDropdown() {
    const el = document.getElementById('tx-filter-category');
    if (!el) return;
    const currentVal = el.value;

    const allCats = [
      ...Store.currentData.categories.in.map(c => ({ ...c, type: 'in' })),
      ...Store.currentData.categories.out.map(c => ({ ...c, type: 'out' }))
    ];

    // unique categories
    const seen = new Set();
    const unique = [];
    allCats.forEach(c => {
      if (!seen.has(c.name)) {
        seen.add(c.name);
        unique.push(c);
      }
    });

    el.innerHTML = '<option value="all">Semua Kategori</option>' + unique.map(c => 
      `<option value="${c.name}" ${c.name === currentVal ? 'selected' : ''}>${c.name}</option>`
    ).join('');
  },

  populateTxWalletFilterDropdown() {
    const el = document.getElementById('tx-filter-wallet');
    if (!el) return;
    const currentVal = el.value;

    el.innerHTML = '<option value="all">Semua Dompet / Rekening</option>' + Store.currentData.wallets.map(w => 
      `<option value="${w.id}" ${w.id === currentVal ? 'selected' : ''}>${w.name}</option>`
    ).join('');
  },

  handleTxFilterChange() {
    this.txTypeFilter = document.getElementById('tx-filter-type').value;
    this.txCategoryFilter = document.getElementById('tx-filter-category').value;
    this.txWalletFilter = document.getElementById('tx-filter-wallet').value;
    this.txSearchQuery = document.getElementById('tx-search-input').value;
    this.renderTransactions();
  },

  resetTxFilters() {
    document.getElementById('tx-filter-type').value = 'all';
    document.getElementById('tx-filter-category').value = 'all';
    document.getElementById('tx-filter-wallet').value = 'all';
    document.getElementById('tx-search-input').value = '';
    this.txTypeFilter = 'all';
    this.txCategoryFilter = 'all';
    this.txWalletFilter = 'all';
    this.txSearchQuery = '';
    this.renderTransactions();
  },

  // --- Debts (Hutang & Piutang) Tab Rendering ---
  switchDebtSubTab(subTab) {
    this.activeDebtSubTab = subTab;
    document.querySelectorAll('[data-debt-subtab]').forEach(btn => {
      if (btn.getAttribute('data-debt-subtab') === subTab) {
        btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm', 'font-bold');
        btn.classList.remove('text-slate-500', 'dark:text-slate-400');
      } else {
        btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm', 'font-bold');
        btn.classList.add('text-slate-500', 'dark:text-slate-400');
      }
    });

    this.renderDebts();
  },

  setDebtStatusFilter(status) {
    this.debtStatusFilter = status;
    document.querySelectorAll('.debt-status-pill').forEach(btn => {
      if (btn.dataset.status === status) {
        btn.classList.add('bg-emerald-600', 'text-white');
        btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('bg-emerald-600', 'text-white');
        btn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      }
    });
    this.renderDebts();
  },

  renderDebts() {
    const summary = Store.calculateSummary();
    const piutangHeader = document.getElementById('debt-summary-piutang');
    const hutangHeader = document.getElementById('debt-summary-hutang');
    if (piutangHeader) piutangHeader.textContent = Utils.formatRupiah(summary.totalPiutang);
    if (hutangHeader) hutangHeader.textContent = Utils.formatRupiah(summary.totalHutang);

    let debts = Store.currentData.debts.filter(d => d.type === this.activeDebtSubTab);

    // Filter by status
    if (this.debtStatusFilter === 'unpaid') {
      debts = debts.filter(d => (Number(d.amount) - Number(d.paidAmount || 0)) > 0);
    } else if (this.debtStatusFilter === 'paid') {
      debts = debts.filter(d => (Number(d.amount) - Number(d.paidAmount || 0)) <= 0);
    } else if (this.debtStatusFilter === 'overdue') {
      const today = Utils.getTodayString();
      debts = debts.filter(d => {
        const remaining = Number(d.amount) - Number(d.paidAmount || 0);
        return remaining > 0 && d.dueDate && d.dueDate < today;
      });
    }

    // Search query
    if (this.debtSearchQuery.trim()) {
      const q = this.debtSearchQuery.toLowerCase();
      debts = debts.filter(d => 
        (d.personName && d.personName.toLowerCase().includes(q)) ||
        (d.note && d.note.toLowerCase().includes(q)) ||
        (d.phone && d.phone.includes(q))
      );
    }

    const container = document.getElementById('debts-card-list');
    if (!container) return;

    if (debts.length === 0) {
      const isPiutang = this.activeDebtSubTab === 'piutang';
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <i data-lucide="${isPiutang ? 'user-check' : 'check-circle-2'}" class="w-14 h-14 mx-auto stroke-1 mb-3 text-emerald-500"></i>
          <h4 class="text-base font-semibold text-slate-700 dark:text-slate-300">
            ${isPiutang ? 'Tidak ada catatan piutang' : 'Tidak ada catatan hutang'}
          </h4>
          <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            ${isPiutang ? 'Semua pelanggan sudah lunas atau belum ada catatan piutang baru.' : 'Toko tidak memiliki kewajiban hutang aktif.'}
          </p>
          <button onclick="App.openDebtModal('${this.activeDebtSubTab}')" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition">
            + Catat ${isPiutang ? 'Piutang Baru' : 'Hutang Baru'}
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const business = Store.currentData.profile;

    container.innerHTML = debts.map(d => {
      const total = Number(d.amount) || 0;
      const paid = Number(d.paidAmount) || 0;
      const remaining = Math.max(0, total - paid);
      const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;
      const isLunas = remaining === 0;
      const statusInfo = Utils.getDebtStatus(d);
      const isPiutang = d.type === 'piutang';
      const waUrl = Utils.buildWhatsAppUrl(d, business);

      return `
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <!-- Header: Name, Type, Status Badge -->
            <div class="flex items-start justify-between">
              <div class="min-w-0 pr-2">
                <div class="flex items-center space-x-2">
                  <h4 class="text-base font-bold text-slate-900 dark:text-slate-100 truncate">${Utils.sanitizeHtml(d.personName)}</h4>
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusInfo.badgeClass}">
                    ${statusInfo.label}
                  </span>
                </div>
                ${d.phone ? `<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-1"><i data-lucide="phone" class="w-3 h-3"></i><span>${Utils.sanitizeHtml(d.phone)}</span></p>` : ''}
              </div>
              <div class="dropdown relative">
                <button onclick="App.openDebtModal('edit', '${d.id}')" title="Ubah Data" class="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <i data-lucide="edit" class="w-4 h-4"></i>
                </button>
                <button onclick="App.confirmDelete('debt', '${d.id}')" title="Hapus" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Notes & Dates -->
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2.5 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 line-clamp-2">
              ${Utils.sanitizeHtml(d.note || 'Tidak ada catatan tambahan')}
            </p>

            <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span class="block text-[11px] text-slate-400">Tanggal Catat:</span>
                <span class="font-medium text-slate-700 dark:text-slate-300">${Utils.formatDateIndo(d.date)}</span>
              </div>
              <div>
                <span class="block text-[11px] text-slate-400">Jatuh Tempo:</span>
                <span class="font-medium ${statusInfo.status === 'lewat' ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}">
                  ${d.dueDate ? Utils.formatDateIndo(d.dueDate) : 'Tidak disetel'}
                </span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-4">
              <div class="flex justify-between items-center text-xs mb-1.5">
                <span class="text-slate-500">Terbayar (${percent}%)</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">${Utils.formatRupiah(paid)} / ${Utils.formatRupiah(total)}</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div class="h-2.5 rounded-full transition-all duration-500 ${isLunas ? 'bg-emerald-500' : 'bg-emerald-600'}" style="width: ${percent}%"></div>
              </div>
            </div>

            <!-- Remaining Amount -->
            <div class="mt-4 p-3 rounded-xl ${isLunas ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white'} flex items-center justify-between">
              <span class="text-xs font-medium">${isLunas ? 'Status Hutang:' : 'Sisa Tagihan:'}</span>
              <span class="text-base font-extrabold ${isLunas ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                ${isLunas ? 'LUNAS ✨' : Utils.formatRupiah(remaining)}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            ${!isLunas ? `
              <button onclick="App.openDebtPaymentModal('${d.id}')" class="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>Bayar Cicilan</span>
              </button>
            ` : `
              <button onclick="App.openDebtPaymentModal('${d.id}')" class="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5">
                <i data-lucide="history" class="w-4 h-4"></i>
                <span>Riwayat Bayar (${d.payments ? d.payments.length : 0})</span>
              </button>
            `}

            ${waUrl ? `
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer" title="Kirim Pengingat WhatsApp" class="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl transition flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <i data-lucide="message-square" class="w-4 h-4"></i>
              </a>
            ` : ''}

            ${d.payments && d.payments.length > 0 && !isLunas ? `
              <button onclick="App.openDebtHistoryModal('${d.id}')" title="Riwayat Cicilan" class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition">
                <i data-lucide="history" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  // --- Reports & Export Tab Rendering ---
  renderReports() {
    const reportPeriod = document.getElementById('report-period-select')?.value || 'this_month';
    const sCustom = document.getElementById('report-custom-start')?.value || '';
    const eCustom = document.getElementById('report-custom-end')?.value || '';

    const txs = this.getFilteredTransactions(reportPeriod, sCustom, eCustom);
    const summary = Store.calculateSummary(txs);

    // Update Report Summary Cards
    const rIn = document.getElementById('report-total-in');
    const rOut = document.getElementById('report-total-out');
    const rNet = document.getElementById('report-total-net');
    const rMargin = document.getElementById('report-net-margin');

    if (rIn) rIn.textContent = Utils.formatRupiah(summary.totalIn);
    if (rOut) rOut.textContent = Utils.formatRupiah(summary.totalOut);
    if (rNet) {
      rNet.textContent = Utils.formatRupiah(summary.net);
      rNet.className = summary.net >= 0 ? 'text-2xl font-black text-emerald-600 dark:text-emerald-400' : 'text-2xl font-black text-rose-600 dark:text-rose-400';
    }
    if (rMargin) {
      const margin = summary.totalIn > 0 ? Math.round((summary.net / summary.totalIn) * 100) : 0;
      rMargin.textContent = `${margin}%`;
    }

    // Render Category Breakdown Table
    this.renderReportsCategoryBreakdown(txs);
  },

  renderReportsCategoryBreakdown(transactions) {
    const tableBody = document.getElementById('report-category-tbody');
    if (!tableBody) return;

    const catMap = {};
    let totalExpense = 0;
    let totalIncome = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      const key = `${t.type}_${t.category}`;
      if (!catMap[key]) {
        catMap[key] = {
          name: t.category,
          type: t.type,
          count: 0,
          total: 0
        };
      }
      catMap[key].count += 1;
      catMap[key].total += amt;

      if (t.type === 'in') totalIncome += amt;
      else totalExpense += amt;
    });

    const list = Object.values(catMap).sort((a, b) => b.total - a.total);

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-slate-400">Tidak ada transaksi dalam periode laporan ini.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = list.map(item => {
      const base = item.type === 'in' ? totalIncome : totalExpense;
      const percent = base > 0 ? Math.round((item.total / base) * 100) : 0;
      const isIn = item.type === 'in';

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b border-slate-100 dark:border-slate-800">
          <td class="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">${Utils.sanitizeHtml(item.name)}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${isIn ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}">
              ${isIn ? 'Pemasukan' : 'Pengeluaran'}
            </span>
          </td>
          <td class="py-3 px-4 text-center text-slate-600 dark:text-slate-400">${item.count}x</td>
          <td class="py-3 px-4 text-right font-bold ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
            ${isIn ? '+' : '-'}${Utils.formatRupiah(item.total)}
          </td>
          <td class="py-3 px-4 text-right text-slate-600 dark:text-slate-400 font-semibold">${percent}%</td>
        </tr>
      `;
    }).join('');
  },

  handleReportPeriodChange() {
    const val = document.getElementById('report-period-select').value;
    const customBox = document.getElementById('report-custom-dates');
    if (customBox) {
      if (val === 'custom') customBox.classList.remove('hidden');
      else customBox.classList.add('hidden');
    }
    this.renderReports();
  },

  // Export Transactions as Clean CSV File (Excel friendly)
  exportCsv() {
    const txs = Store.currentData.transactions;
    if (txs.length === 0) {
      Utils.showToast('Tidak ada transaksi untuk diekspor.', 'error');
      return;
    }

    const walletsMap = {};
    Store.currentData.wallets.forEach(w => { walletsMap[w.id] = w.name; });

    let csvContent = '\uFEFF'; // UTF-8 BOM so Excel opens accents & rupiah properly
    csvContent += 'ID;Tanggal;Waktu;Tipe;Kategori;Nominal;Dompet / Rekening;Keterangan\n';

    txs.forEach(t => {
      const typeLabel = t.type === 'in' ? 'Pemasukan' : 'Pengeluaran';
      const wName = walletsMap[t.walletId] || 'Kas Tunai';
      const cleanNote = (t.note || '').replace(/;/g, ',').replace(/\n/g, ' ');
      csvContent += `${t.id};${t.date};${t.time || ''};${typeLabel};${t.category};${t.amount};${wName};"${cleanNote}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_BukuKas_${Store.getActiveBook().name.replace(/\s+/g, '_')}_${Utils.getTodayString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    Utils.showToast('Laporan CSV berhasil diunduh!', 'success');
  },

  // Prepare and open Browser Print Preview for formal Financial Statement
  printFinancialReport() {
    const profile = Store.currentData.profile;
    const txs = this.getFilteredTransactions();
    const summary = Store.calculateSummary(txs);
    const walletsMap = {};
    Store.currentData.wallets.forEach(w => { walletsMap[w.id] = w.name; });

    const container = document.getElementById('printable-report-area');
    if (!container) return;

    container.innerHTML = `
      <div class="p-8 max-w-4xl mx-auto bg-white text-slate-900 font-sans">
        <!-- Header -->
        <div class="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-black uppercase tracking-tight">${Utils.sanitizeHtml(profile.name)}</h1>
            <p class="text-xs text-slate-600 mt-1">${Utils.sanitizeHtml(profile.address || 'Alamat Usaha')}</p>
            <p class="text-xs text-slate-600">Kontak: ${Utils.sanitizeHtml(profile.phone || '-')} | Pemilik: ${Utils.sanitizeHtml(profile.owner || '-')}</p>
          </div>
          <div class="text-right">
            <h2 class="text-lg font-bold text-slate-800">LAPORAN KEUANGAN KAS</h2>
            <p class="text-xs text-slate-500 mt-1">Dicetak pada: ${Utils.formatDateTimeIndo(new Date().toISOString())}</p>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="border border-slate-200 p-3 rounded">
            <span class="text-xs text-slate-500 uppercase block font-semibold">Total Pemasukan</span>
            <span class="text-lg font-bold text-emerald-600">+${Utils.formatRupiah(summary.totalIn)}</span>
          </div>
          <div class="border border-slate-200 p-3 rounded">
            <span class="text-xs text-slate-500 uppercase block font-semibold">Total Pengeluaran</span>
            <span class="text-lg font-bold text-rose-600">-${Utils.formatRupiah(summary.totalOut)}</span>
          </div>
          <div class="border border-slate-200 p-3 rounded bg-slate-50">
            <span class="text-xs text-slate-500 uppercase block font-semibold">Arus Kas Bersih (Surplus)</span>
            <span class="text-lg font-black ${summary.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${Utils.formatRupiah(summary.net)}</span>
          </div>
        </div>

        <!-- Ledger Table -->
        <h3 class="text-sm font-bold uppercase tracking-wider mb-2">Rincian Buku Kas</h3>
        <table class="w-full text-xs border-collapse border border-slate-300 mb-8">
          <thead>
            <tr class="bg-slate-100 text-left font-bold border-b border-slate-300">
              <th class="p-2 border border-slate-300">Tgl & Jam</th>
              <th class="p-2 border border-slate-300">Keterangan</th>
              <th class="p-2 border border-slate-300">Kategori</th>
              <th class="p-2 border border-slate-300">Rekening</th>
              <th class="p-2 border border-slate-300 text-right">Pemasukan</th>
              <th class="p-2 border border-slate-300 text-right">Pengeluaran</th>
            </tr>
          </thead>
          <tbody>
            ${txs.map(t => `
              <tr class="border-b border-slate-200">
                <td class="p-2 border border-slate-300 whitespace-nowrap">${t.date} ${t.time || ''}</td>
                <td class="p-2 border border-slate-300">${Utils.sanitizeHtml(t.note || '-')}</td>
                <td class="p-2 border border-slate-300">${Utils.sanitizeHtml(t.category)}</td>
                <td class="p-2 border border-slate-300">${Utils.sanitizeHtml(walletsMap[t.walletId] || 'Kas')}</td>
                <td class="p-2 border border-slate-300 text-right font-medium text-emerald-700">${t.type === 'in' ? Utils.formatRupiah(t.amount) : '-'}</td>
                <td class="p-2 border border-slate-300 text-right font-medium text-rose-700">${t.type === 'out' ? Utils.formatRupiah(t.amount) : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Signatures -->
        <div class="grid grid-cols-2 gap-8 text-center text-xs mt-12 pt-6">
          <div>
            <p class="text-slate-500 mb-16">Dibuat oleh (Kasir / Bag. Keuangan):</p>
            <p class="font-bold border-t border-slate-400 pt-1 inline-block min-w-[180px]">${Utils.sanitizeHtml(profile.owner || 'Kasir Usaha')}</p>
          </div>
          <div>
            <p class="text-slate-500 mb-16">Mengetahui (Pimpinan / Pemilik Usaha):</p>
            <p class="font-bold border-t border-slate-400 pt-1 inline-block min-w-[180px]">${Utils.sanitizeHtml(profile.owner || 'Pemilik Toko')}</p>
          </div>
        </div>
      </div>
    `;

    window.print();
  },

  // --- Wallets Tab Rendering ---
  renderWallets() {
    const balances = Store.calculateWalletBalances();
    const wallets = Store.currentData.wallets;
    const allTimeSummary = Store.calculateSummary();

    const totalKasEl = document.getElementById('wallets-total-all');
    if (totalKasEl) totalKasEl.textContent = Utils.formatRupiah(allTimeSummary.net);

    const listEl = document.getElementById('wallets-grid');
    if (!listEl) return;

    listEl.innerHTML = wallets.map(w => {
      const bal = balances[w.id] !== undefined ? balances[w.id] : w.initialBalance;
      let icon = 'wallet';
      let typeLabel = 'Kas Tunai';
      let iconBg = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400';

      if (w.type === 'bank') {
        icon = 'landmark';
        typeLabel = 'Rekening Bank';
        iconBg = 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400';
      } else if (w.type === 'ewallet') {
        icon = 'smartphone';
        typeLabel = 'E-Wallet / QRIS';
        iconBg = 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400';
      }

      return `
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:border-emerald-400 transition flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}">
                <i data-lucide="${icon}" class="w-6 h-6"></i>
              </div>
              ${wallets.length > 1 ? `
                <button onclick="App.confirmDelete('wallet', '${w.id}')" title="Hapus Dompet" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>

            <div class="mt-4">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">${typeLabel}</span>
              <h4 class="text-lg font-bold text-slate-900 dark:text-slate-100">${Utils.sanitizeHtml(w.name)}</h4>
              <p class="text-2xl font-black text-slate-900 dark:text-white mt-1 privacy-balance" data-real-text="${Utils.formatRupiah(bal)}">${Utils.formatRupiah(bal)}</p>
            </div>
          </div>

          <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button onclick="App.openTransferModal('${w.id}')" class="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-emerald-200 dark:border-emerald-800">
              <i data-lucide="arrow-left-right" class="w-3.5 h-3.5"></i>
              <span>Pindah Kas</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.updateBalanceVisibility();
    if (window.lucide) window.lucide.createIcons();
  },

  // --- Settings Tab Rendering ---
  renderSettings() {
    const profile = Store.currentData.profile;

    document.getElementById('setting-name').value = profile.name || '';
    document.getElementById('setting-owner').value = profile.owner || '';
    document.getElementById('setting-phone').value = profile.phone || '';
    document.getElementById('setting-address').value = profile.address || '';
    document.getElementById('setting-notes').value = profile.notes || '';

    // Render Categories
    this.renderCategorySettings();
  },

  saveProfileSettings(e) {
    e.preventDefault();
    Store.currentData.profile = {
      name: document.getElementById('setting-name').value.trim() || 'Buku Kas Usaha',
      owner: document.getElementById('setting-owner').value.trim(),
      phone: document.getElementById('setting-phone').value.trim(),
      address: document.getElementById('setting-address').value.trim(),
      notes: document.getElementById('setting-notes').value.trim()
    };
    Store.saveCurrentData();
    this.renderBookSelector();
    Utils.showToast('Profil usaha & toko berhasil disimpan!', 'success');
  },

  renderCategorySettings() {
    const inContainer = document.getElementById('setting-cats-in');
    const outContainer = document.getElementById('setting-cats-out');
    if (!inContainer || !outContainer) return;

    inContainer.innerHTML = Store.currentData.categories.in.map(c => `
      <div class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-medium">
        <div class="flex items-center space-x-2">
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${c.color || '#10b981'}"></span>
          <span class="text-slate-800 dark:text-slate-200">${Utils.sanitizeHtml(c.name)}</span>
        </div>
        ${Store.currentData.categories.in.length > 1 ? `
          <button onclick="App.deleteCategory('in', '${c.id}')" title="Hapus Kategori" class="text-slate-400 hover:text-rose-600 p-1">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        ` : ''}
      </div>
    `).join('');

    outContainer.innerHTML = Store.currentData.categories.out.map(c => `
      <div class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-medium">
        <div class="flex items-center space-x-2">
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${c.color || '#f43f5e'}"></span>
          <span class="text-slate-800 dark:text-slate-200">${Utils.sanitizeHtml(c.name)}</span>
        </div>
        ${Store.currentData.categories.out.length > 1 ? `
          <button onclick="App.deleteCategory('out', '${c.id}')" title="Hapus Kategori" class="text-slate-400 hover:text-rose-600 p-1">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        ` : ''}
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  addNewCategory(type) {
    const inputEl = document.getElementById(`new-cat-name-${type}`);
    if (!inputEl) return;
    const name = inputEl.value.trim();
    if (!name) {
      Utils.showToast('Nama kategori tidak boleh kosong', 'error');
      return;
    }

    Store.addCategory(type, name);
    inputEl.value = '';
    this.renderCategorySettings();
    Utils.showToast(`Kategori "${name}" berhasil ditambahkan!`, 'success');
  },

  deleteCategory(type, catId) {
    Store.deleteCategory(type, catId);
    this.renderCategorySettings();
    Utils.showToast('Kategori berhasil dihapus.', 'info');
  },

  // Load Indonesian Sample Data
  loadSampleData() {
    Store.loadSampleData(true);
    this.renderBookSelector();
    this.switchTab('dashboard');
    Utils.triggerConfetti();
    Utils.showToast('Data demo UMKM Toko Berkah Usaha berhasil dimuat!', 'success');
  },

  // Reset Book Data
  resetBookData() {
    Store.resetActiveBookData();
    this.switchTab('dashboard');
    Utils.showToast('Data buku kas telah dikosongkan.', 'info');
  },

  // --- Modals Controller ---
  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }
    if (window.lucide) window.lucide.createIcons();
  },

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  },

  // --- Modal: Transaction Add / Edit ---
  openTransactionModal(typeOrMode = 'in', txId = null) {
    const form = document.getElementById('tx-form');
    form.reset();

    document.getElementById('tx-edit-id').value = '';
    document.getElementById('tx-receipt-data').value = '';
    document.getElementById('tx-receipt-preview-box').classList.add('hidden');

    const titleEl = document.getElementById('tx-modal-title');
    const submitBtn = document.getElementById('tx-submit-btn');

    if (typeOrMode === 'edit' && txId) {
      const tx = Store.currentData.transactions.find(t => t.id === txId);
      if (!tx) return;

      titleEl.textContent = 'Ubah Catatan Transaksi';
      submitBtn.textContent = 'Simpan Perubahan';
      document.getElementById('tx-edit-id').value = tx.id;
      document.getElementById('tx-amount').value = tx.amount;
      document.getElementById('tx-date').value = tx.date;
      document.getElementById('tx-time').value = tx.time || Utils.getCurrentTimeString();
      document.getElementById('tx-note').value = tx.note || '';

      this.setTxModalType(tx.type, false);
      this.populateTxCategorySelect(tx.type, tx.category);
      this.populateTxWalletSelect(tx.walletId);

      if (tx.receiptDataUrl) {
        document.getElementById('tx-receipt-data').value = tx.receiptDataUrl;
        document.getElementById('tx-receipt-img').src = tx.receiptDataUrl;
        document.getElementById('tx-receipt-preview-box').classList.remove('hidden');
      }
    } else {
      titleEl.textContent = 'Catat Transaksi Kas';
      submitBtn.textContent = 'Simpan Transaksi';
      document.getElementById('tx-date').value = Utils.getTodayString();
      document.getElementById('tx-time').value = Utils.getCurrentTimeString();

      const initialType = typeOrMode === 'out' ? 'out' : 'in';
      this.setTxModalType(initialType, false);
      this.populateTxCategorySelect(initialType);
      this.populateTxWalletSelect();
    }

    this.openModal('modal-transaction');
  },

  setTxModalType(type, triggerCategoryUpdate = true) {
    document.getElementById('tx-type').value = type;
    const btnIn = document.getElementById('btn-type-in');
    const btnOut = document.getElementById('btn-type-out');

    if (type === 'in') {
      btnIn.className = 'flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white shadow-sm flex items-center justify-center space-x-1.5 transition';
      btnOut.className = 'flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center space-x-1.5 transition';
    } else {
      btnOut.className = 'flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white shadow-sm flex items-center justify-center space-x-1.5 transition';
      btnIn.className = 'flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center space-x-1.5 transition';
    }

    if (triggerCategoryUpdate) {
      this.populateTxCategorySelect(type);
    }
  },

  populateTxCategorySelect(type, selectedCategory = null) {
    const select = document.getElementById('tx-category');
    if (!select) return;

    const cats = Store.currentData.categories[type] || [];
    select.innerHTML = cats.map(c => `
      <option value="${c.name}" ${c.name === selectedCategory ? 'selected' : ''}>${c.name}</option>
    `).join('');
  },

  populateTxWalletSelect(selectedWalletId = null) {
    const select = document.getElementById('tx-wallet');
    if (!select) return;

    const wallets = Store.currentData.wallets;
    select.innerHTML = wallets.map(w => `
      <option value="${w.id}" ${w.id === selectedWalletId ? 'selected' : ''}>${w.name}</option>
    `).join('');
  },

  addQuickAmount(addedValue) {
    const input = document.getElementById('tx-amount');
    const current = Number(input.value) || 0;
    input.value = current + addedValue;
  },

  handleReceiptUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Utils.showToast('Ukuran foto maksimal 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('tx-receipt-data').value = e.target.result;
      document.getElementById('tx-receipt-img').src = e.target.result;
      document.getElementById('tx-receipt-preview-box').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  },

  removeReceiptImage() {
    document.getElementById('tx-receipt-data').value = '';
    document.getElementById('tx-receipt-file').value = '';
    document.getElementById('tx-receipt-preview-box').classList.add('hidden');
  },

  saveTransaction(e) {
    e.preventDefault();
    const editId = document.getElementById('tx-edit-id').value;
    const type = document.getElementById('tx-type').value;
    const amount = Number(document.getElementById('tx-amount').value);
    const category = document.getElementById('tx-category').value;
    const walletId = document.getElementById('tx-wallet').value;
    const date = document.getElementById('tx-date').value;
    const time = document.getElementById('tx-time').value;
    const note = document.getElementById('tx-note').value;
    const receiptDataUrl = document.getElementById('tx-receipt-data').value || null;

    if (!amount || amount <= 0) {
      Utils.showToast('Nominal transaksi harus lebih dari 0.', 'error');
      return;
    }

    if (!date) {
      Utils.showToast('Tanggal transaksi wajib diisi.', 'error');
      return;
    }

    if (editId) {
      Store.updateTransaction(editId, {
        type, amount, category, walletId, date, time, note, receiptDataUrl
      });
      Utils.showToast('Catatan transaksi berhasil diperbarui!', 'success');
    } else {
      Store.addTransaction({
        type, amount, category, walletId, date, time, note, receiptDataUrl
      });
      Utils.showToast(`Berhasil mencatat ${type === 'in' ? 'pemasukan' : 'pengeluaran'} ${Utils.formatRupiah(amount)}!`, 'success');
      if (type === 'in' && amount >= 500000) {
        Utils.triggerConfetti();
      }
    }

    this.closeModal('modal-transaction');
    if (this.activeTab === 'dashboard') this.renderDashboard();
    else if (this.activeTab === 'transactions') this.renderTransactions();
    else if (this.activeTab === 'wallets') this.renderWallets();
    else if (this.activeTab === 'reports') this.renderReports();
  },

  // --- Modal: Debt Add / Edit ---
  openDebtModal(typeOrMode = 'piutang', debtId = null) {
    const form = document.getElementById('debt-form');
    form.reset();
    document.getElementById('debt-edit-id').value = '';

    const titleEl = document.getElementById('debt-modal-title');
    const submitBtn = document.getElementById('debt-submit-btn');

    if (typeOrMode === 'edit' && debtId) {
      const debt = Store.currentData.debts.find(d => d.id === debtId);
      if (!debt) return;

      titleEl.textContent = 'Ubah Catatan Hutang / Piutang';
      submitBtn.textContent = 'Simpan Perubahan';
      document.getElementById('debt-edit-id').value = debt.id;
      document.getElementById('debt-person-name').value = debt.personName;
      document.getElementById('debt-phone').value = debt.phone || '';
      document.getElementById('debt-amount').value = debt.amount;
      document.getElementById('debt-date').value = debt.date;
      document.getElementById('debt-due-date').value = debt.dueDate || '';
      document.getElementById('debt-note').value = debt.note || '';

      this.setDebtModalType(debt.type);
    } else {
      const isPiutang = typeOrMode === 'piutang';
      titleEl.textContent = isPiutang ? 'Catat Piutang (Uang di Pelanggan)' : 'Catat Hutang (Kewajiban Toko)';
      submitBtn.textContent = 'Simpan Catatan';
      document.getElementById('debt-date').value = Utils.getTodayString();
      this.setDebtModalType(isPiutang ? 'piutang' : 'hutang');
    }

    this.openModal('modal-debt');
  },

  setDebtModalType(type) {
    document.getElementById('debt-type').value = type;
    const btnP = document.getElementById('btn-debt-type-piutang');
    const btnH = document.getElementById('btn-debt-type-hutang');

    if (type === 'piutang') {
      btnP.className = 'flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white shadow-sm flex items-center justify-center space-x-1.5 transition';
      btnH.className = 'flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center space-x-1.5 transition';
    } else {
      btnH.className = 'flex-1 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white shadow-sm flex items-center justify-center space-x-1.5 transition';
      btnP.className = 'flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center space-x-1.5 transition';
    }
  },

  saveDebt(e) {
    e.preventDefault();
    const editId = document.getElementById('debt-edit-id').value;
    const type = document.getElementById('debt-type').value;
    const personName = document.getElementById('debt-person-name').value;
    const phone = document.getElementById('debt-phone').value;
    const amount = Number(document.getElementById('debt-amount').value);
    const date = document.getElementById('debt-date').value;
    const dueDate = document.getElementById('debt-due-date').value;
    const note = document.getElementById('debt-note').value;

    if (!personName.trim()) {
      Utils.showToast('Nama pihak/pelanggan wajib diisi.', 'error');
      return;
    }

    if (!amount || amount <= 0) {
      Utils.showToast('Nominal hutang harus lebih dari 0.', 'error');
      return;
    }

    if (editId) {
      Store.updateDebt(editId, {
        type, personName, phone, amount, date, dueDate, note
      });
      Utils.showToast('Catatan hutang/piutang berhasil diperbarui!', 'success');
    } else {
      Store.addDebt({
        type, personName, phone, amount, date, dueDate, note
      });
      Utils.showToast(`Berhasil mencatat ${type === 'piutang' ? 'piutang' : 'hutang'} ${Utils.formatRupiah(amount)}!`, 'success');
    }

    this.closeModal('modal-debt');
    this.renderDebts();
    if (this.activeTab === 'dashboard') this.renderDashboard();
  },

  // --- Modal: Debt Payment / Cicilan ---
  openDebtPaymentModal(debtId) {
    const debt = Store.currentData.debts.find(d => d.id === debtId);
    if (!debt) return;

    const remaining = Math.max(0, Number(debt.amount) - Number(debt.paidAmount || 0));

    document.getElementById('debt-pay-id').value = debt.id;
    document.getElementById('debt-pay-name').textContent = debt.personName;
    document.getElementById('debt-pay-total').textContent = Utils.formatRupiah(debt.amount);
    document.getElementById('debt-pay-remaining').textContent = Utils.formatRupiah(remaining);
    document.getElementById('debt-pay-amount').value = remaining > 0 ? remaining : '';
    document.getElementById('debt-pay-date').value = Utils.getTodayString();
    document.getElementById('debt-pay-note').value = remaining <= 0 ? 'Pelunasan tambahan' : 'Cicilan pelunasan';

    // Populate wallets
    const select = document.getElementById('debt-pay-wallet');
    select.innerHTML = Store.currentData.wallets.map(w => `
      <option value="${w.id}">${w.name}</option>
    `).join('');

    this.openModal('modal-debt-payment');
  },

  saveDebtPayment(e) {
    e.preventDefault();
    const debtId = document.getElementById('debt-pay-id').value;
    const amount = Number(document.getElementById('debt-pay-amount').value);
    const walletId = document.getElementById('debt-pay-wallet').value;
    const date = document.getElementById('debt-pay-date').value;
    const note = document.getElementById('debt-pay-note').value;

    if (!amount || amount <= 0) {
      Utils.showToast('Nominal pembayaran harus lebih dari 0.', 'error');
      return;
    }

    const updated = Store.recordDebtPayment(debtId, amount, walletId, date, note);
    if (!updated) {
      Utils.showToast('Gagal memproses pembayaran.', 'error');
      return;
    }

    const remaining = Math.max(0, Number(updated.amount) - Number(updated.paidAmount || 0));
    if (remaining === 0) {
      Utils.triggerConfetti();
      Utils.showToast(`Hutang/piutang ${updated.personName} TELAH LUNAS! 🎉`, 'success');
    } else {
      Utils.showToast(`Pembayaran sebesar ${Utils.formatRupiah(amount)} berhasil dicatat! Sisa: ${Utils.formatRupiah(remaining)}`, 'success');
    }

    this.closeModal('modal-debt-payment');
    this.renderDebts();
    if (this.activeTab === 'dashboard') this.renderDashboard();
    else if (this.activeTab === 'transactions') this.renderTransactions();
  },

  // --- Modal: Debt Payment History ---
  openDebtHistoryModal(debtId) {
    const debt = Store.currentData.debts.find(d => d.id === debtId);
    if (!debt) return;

    document.getElementById('debt-history-title').textContent = `Riwayat Pembayaran - ${debt.personName}`;
    const listEl = document.getElementById('debt-history-list');

    const walletsMap = {};
    Store.currentData.wallets.forEach(w => { walletsMap[w.id] = w.name; });

    if (!debt.payments || debt.payments.length === 0) {
      listEl.innerHTML = `
        <div class="py-8 text-center text-slate-400">
          <p class="text-sm">Belum ada riwayat pembayaran untuk catatan ini.</p>
        </div>
      `;
    } else {
      listEl.innerHTML = debt.payments.map((p, idx) => `
        <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Pembayaran #${idx + 1}</span>
              <span class="text-[11px] text-slate-400">• ${Utils.formatDateIndo(p.date)}</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">${Utils.sanitizeHtml(p.note || 'Pembayaran')}</p>
            <span class="inline-block mt-1 text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
              ${Utils.sanitizeHtml(walletsMap[p.walletId] || 'Kas Tunai')}
            </span>
          </div>
          <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400">+${Utils.formatRupiah(p.amount)}</p>
        </div>
      `).join('');
    }

    this.openModal('modal-debt-history');
  },

  // --- Modal: Transfer Antar Dompet ---
  openTransferModal(sourceWalletId = null) {
    const fromSelect = document.getElementById('transfer-from-wallet');
    const toSelect = document.getElementById('transfer-to-wallet');

    const wallets = Store.currentData.wallets;
    const renderOpts = (selectedId) => wallets.map(w => `
      <option value="${w.id}" ${w.id === selectedId ? 'selected' : ''}>${w.name}</option>
    `).join('');

    fromSelect.innerHTML = renderOpts(sourceWalletId || wallets[0].id);
    // pick second wallet if exists
    const toDefault = wallets.length > 1 ? (wallets[1].id === sourceWalletId ? wallets[0].id : wallets[1].id) : wallets[0].id;
    toSelect.innerHTML = renderOpts(toDefault);

    document.getElementById('transfer-amount').value = '';
    document.getElementById('transfer-date').value = Utils.getTodayString();
    document.getElementById('transfer-note').value = '';

    this.openModal('modal-transfer');
  },

  saveTransfer(e) {
    e.preventDefault();
    const fromW = document.getElementById('transfer-from-wallet').value;
    const toW = document.getElementById('transfer-to-wallet').value;
    const amount = Number(document.getElementById('transfer-amount').value);
    const date = document.getElementById('transfer-date').value;
    const note = document.getElementById('transfer-note').value;

    if (fromW === toW) {
      Utils.showToast('Dompet asal dan tujuan tidak boleh sama.', 'error');
      return;
    }

    if (!amount || amount <= 0) {
      Utils.showToast('Nominal transfer harus lebih dari 0.', 'error');
      return;
    }

    const res = Store.transferFunds(fromW, toW, amount, note, date);
    if (!res) {
      Utils.showToast('Gagal memproses transfer.', 'error');
      return;
    }

    this.closeModal('modal-transfer');
    Utils.showToast(`Transfer sebesar ${Utils.formatRupiah(amount)} berhasil!`, 'success');
    if (this.activeTab === 'wallets') this.renderWallets();
    else if (this.activeTab === 'dashboard') this.renderDashboard();
    else if (this.activeTab === 'transactions') this.renderTransactions();
  },

  // --- Modal: Add New Wallet ---
  openNewWalletModal() {
    document.getElementById('new-wallet-form').reset();
    this.openModal('modal-new-wallet');
  },

  saveNewWallet(e) {
    e.preventDefault();
    const name = document.getElementById('new-wallet-name').value;
    const type = document.getElementById('new-wallet-type').value;
    const initialBalance = Number(document.getElementById('new-wallet-balance').value) || 0;

    if (!name.trim()) {
      Utils.showToast('Nama dompet/rekening wajib diisi.', 'error');
      return;
    }

    Store.addWallet(name, type, initialBalance);
    this.closeModal('modal-new-wallet');
    this.renderWallets();
    Utils.showToast(`Dompet "${name}" berhasil ditambahkan!`, 'success');
  },

  // --- Modal: Digital Receipt & Thermal Print ---
  openReceiptModal(txId) {
    const tx = Store.currentData.transactions.find(t => t.id === txId);
    if (!tx) return;

    this.currentReceiptTx = tx;
    const profile = Store.currentData.profile;
    const walletsMap = {};
    Store.currentData.wallets.forEach(w => { walletsMap[w.id] = w.name; });
    const wName = walletsMap[tx.walletId] || 'Kas Tunai';

    document.getElementById('receipt-store-name').textContent = profile.name;
    document.getElementById('receipt-store-address').textContent = profile.address || 'Indonesia';
    document.getElementById('receipt-store-phone').textContent = profile.phone ? `Telp: ${profile.phone}` : '';
    document.getElementById('receipt-ref').textContent = `#${tx.id.toUpperCase().substring(0, 8)}`;
    document.getElementById('receipt-datetime').textContent = `${Utils.formatDateIndo(tx.date)}, ${tx.time || ''}`;
    document.getElementById('receipt-cashier').textContent = profile.owner || 'Kasir';
    document.getElementById('receipt-wallet').textContent = wName;
    document.getElementById('receipt-desc').textContent = tx.note || tx.category;
    document.getElementById('receipt-category').textContent = tx.category;
    document.getElementById('receipt-type-label').textContent = tx.type === 'in' ? 'PEMBAYARAN DITERIMA' : 'PENGELUARAN KAS';
    document.getElementById('receipt-amount').textContent = Utils.formatRupiah(tx.amount);
    document.getElementById('receipt-notes-footer').textContent = profile.notes || 'Terima kasih atas kunjungan & kerjasamanya!';

    this.openModal('modal-receipt');
  },

  printReceipt() {
    window.print();
  },

  shareReceiptWhatsApp() {
    if (!this.currentReceiptTx) return;
    const profile = Store.currentData.profile;
    const walletsMap = {};
    Store.currentData.wallets.forEach(w => { walletsMap[w.id] = w.name; });
    const wName = walletsMap[this.currentReceiptTx.walletId] || 'Kas Tunai';

    const phone = prompt('Masukkan nomor WhatsApp pelanggan (opsional, kosongkan untuk pilih kontak nanti):', '');
    const url = Utils.buildReceiptWhatsAppUrl(this.currentReceiptTx, profile, wName, phone || '');
    window.open(url, '_blank');
  },

  // --- Modal: Receipt Image Preview ---
  previewReceiptImage(txId) {
    const tx = Store.currentData.transactions.find(t => t.id === txId);
    if (!tx || !tx.receiptDataUrl) return;

    document.getElementById('preview-modal-img').src = tx.receiptDataUrl;
    document.getElementById('preview-modal-caption').textContent = `${tx.note || tx.category} - ${Utils.formatRupiah(tx.amount)}`;
    this.openModal('modal-receipt-preview');
  },

  // --- Modal: Delete Confirm ---
  confirmDelete(entityType, entityId) {
    this.pendingDeleteAction = { type: entityType, id: entityId };
    const descEl = document.getElementById('delete-modal-desc');

    if (entityType === 'transaction') {
      descEl.textContent = 'Apakah Anda yakin ingin menghapus catatan transaksi ini? Saldo dompet akan disesuaikan kembali.';
    } else if (entityType === 'debt') {
      descEl.textContent = 'Apakah Anda yakin ingin menghapus catatan hutang/piutang ini?';
    } else if (entityType === 'wallet') {
      descEl.textContent = 'Apakah Anda yakin ingin menghapus dompet/rekening ini?';
    }

    this.openModal('modal-confirm-delete');
  },

  executeDelete() {
    if (!this.pendingDeleteAction) return;
    const { type, id } = this.pendingDeleteAction;

    if (type === 'transaction') {
      Store.deleteTransaction(id);
      Utils.showToast('Transaksi berhasil dihapus.', 'info');
      if (this.activeTab === 'transactions') this.renderTransactions();
      else if (this.activeTab === 'dashboard') this.renderDashboard();
      else if (this.activeTab === 'wallets') this.renderWallets();
    } else if (type === 'debt') {
      Store.deleteDebt(id);
      Utils.showToast('Catatan hutang/piutang berhasil dihapus.', 'info');
      this.renderDebts();
      if (this.activeTab === 'dashboard') this.renderDashboard();
    } else if (type === 'wallet') {
      const res = Store.deleteWallet(id);
      if (res.success) {
        Utils.showToast('Dompet berhasil dihapus.', 'info');
        this.renderWallets();
        if (this.activeTab === 'dashboard') this.renderDashboard();
      } else {
        Utils.showToast(res.message, 'error');
      }
    }

    this.pendingDeleteAction = null;
    this.closeModal('modal-confirm-delete');
  },

  // --- Setup Global Event Listeners ---
  setupEventListeners() {
    // Close modal on escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(modal => {
          modal.classList.add('hidden');
        });
        document.body.classList.remove('overflow-hidden');
      }
    });

    // Close books dropdown on click outside
    window.addEventListener('click', (e) => {
      const dropdown = document.getElementById('books-dropdown');
      const trigger = document.getElementById('books-dropdown-btn');
      if (dropdown && !dropdown.contains(e.target) && trigger && !trigger.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });

    // File input for import backup
    const importInput = document.getElementById('import-backup-input');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const res = Store.importBackupJson(evt.target.result);
          if (res.success) {
            Utils.triggerConfetti();
            Utils.showToast('Cadangan data berhasil dipulihkan!', 'success');
            App.renderBookSelector();
            App.switchTab('dashboard');
          } else {
            Utils.showToast(res.message, 'error');
          }
        };
        reader.readAsText(file);
      });
    }
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
