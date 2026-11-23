// js/charts.js - Chart visualizations for Buku Kas

const ChartsManager = {
  cashflowChart: null,
  categoryChart: null,

  isDarkMode() {
    return document.documentElement.classList.contains('dark');
  },

  getChartColors() {
    const isDark = this.isDarkMode();
    return {
      textColor: isDark ? '#94a3b8' : '#64748b',
      gridColor: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 0.8)',
      tooltipBg: isDark ? '#1e293b' : '#0f172a',
      incomeColor: '#10b981',
      incomeBg: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
      expenseColor: '#f43f5e',
      expenseBg: isDark ? 'rgba(244, 63, 94, 0.3)' : 'rgba(244, 63, 94, 0.2)'
    };
  },

  // Render Cashflow Trend Chart (Last 7 or 14 days or filtered period)
  renderCashflowChart(transactions, days = 7) {
    const canvas = document.getElementById('cashflow-chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.cashflowChart) {
      this.cashflowChart.destroy();
    }

    const colors = this.getChartColors();

    // Generate date map
    const dateMap = {};
    const today = new Date();
    
    // Sort transactions chronologically
    const sorted = [...transactions].sort((a, b) => (a.date > b.date ? 1 : -1));

    // Determine dates to show
    let labelDates = [];
    if (days > 0) {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const yStr = d.getFullYear();
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const dStr = String(d.getDate()).padStart(2, '0');
        const key = `${yStr}-${mStr}-${dStr}`;
        labelDates.push(key);
        dateMap[key] = { in: 0, out: 0, label: `${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })}` };
      }
    } else {
      // All unique dates in transactions
      sorted.forEach(t => {
        if (!dateMap[t.date]) {
          const parts = t.date.split('-');
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          labelDates.push(t.date);
          dateMap[t.date] = { in: 0, out: 0, label: `${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })}` };
        }
      });
    }

    // Populate data
    sorted.forEach(t => {
      if (dateMap[t.date]) {
        if (t.type === 'in') {
          dateMap[t.date].in += Number(t.amount) || 0;
        } else {
          dateMap[t.date].out += Number(t.amount) || 0;
        }
      }
    });

    const labels = labelDates.map(k => dateMap[k].label);
    const inData = labelDates.map(k => dateMap[k].in);
    const outData = labelDates.map(k => dateMap[k].out);

    const ctx = canvas.getContext('2d');
    this.cashflowChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Uang Masuk',
            data: inData,
            backgroundColor: colors.incomeColor,
            borderRadius: 6,
            maxBarThickness: 28
          },
          {
            label: 'Uang Keluar',
            data: outData,
            backgroundColor: colors.expenseColor,
            borderRadius: 6,
            maxBarThickness: 28
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: colors.textColor,
              font: { family: 'inherit', size: 12, weight: '500' },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${Utils.formatRupiah(context.raw)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: colors.textColor,
              font: { size: 11 }
            }
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { size: 11 },
              callback: function(value) {
                if (value >= 1000000) return (value / 1000000) + ' Jt';
                if (value >= 1000) return (value / 1000) + ' Rb';
                return value;
              }
            }
          }
        }
      }
    });
  },

  // Render Category Breakdown Chart (Doughnut Chart)
  renderCategoryChart(transactions, type = 'out') {
    const canvas = document.getElementById('category-chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const filtered = transactions.filter(t => t.type === type);
    const catMap = {};

    filtered.forEach(t => {
      const cat = t.category || 'Lainnya';
      catMap[cat] = (catMap[cat] || 0) + (Number(t.amount) || 0);
    });

    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const labels = entries.map(e => e[0]);
    const data = entries.map(e => e[1]);

    const palette = [
      '#f43f5e', '#ea580c', '#eab308', '#10b981', '#06b6d4', 
      '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#14b8a6'
    ];

    const colors = this.getChartColors();
    const ctx = canvas.getContext('2d');

    if (labels.length === 0) {
      // Empty state
      this.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Belum Ada Data'],
          datasets: [{
            data: [1],
            backgroundColor: ['#e2e8f0']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          }
        }
      });
      return;
    }

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: palette.slice(0, labels.length),
          borderWidth: 2,
          borderColor: this.isDarkMode() ? '#0f172a' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.textColor,
              font: { family: 'inherit', size: 11 },
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percent = Math.round((context.raw / total) * 100);
                return ` ${context.label}: ${Utils.formatRupiah(context.raw)} (${percent}%)`;
              }
            }
          }
        }
      }
    });
  },

  // Refresh charts on theme toggle or data change
  refresh(transactions) {
    this.renderCashflowChart(transactions, 7);
    this.renderCategoryChart(transactions, 'out');
  }
};
