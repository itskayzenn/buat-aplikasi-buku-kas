// js/components.js - Utility and Helper functions for Buku Kas

const Utils = {
  // Format Number to Indonesian Rupiah (e.g. 1500000 -> Rp 1.500.000)
  formatRupiah(amount, withPrefix = true) {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return withPrefix ? 'Rp 0' : '0';
    }
    const num = Math.round(Number(amount));
    const formatted = new Intl.NumberFormat('id-ID').format(Math.abs(num));
    const sign = num < 0 ? '-' : '';
    return withPrefix ? `${sign}Rp ${formatted}` : `${sign}${formatted}`;
  },

  // Parse formatted string back to raw number
  parseRupiah(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    const cleanStr = str.toString().replace(/[^0-9-]/g, '');
    const val = parseInt(cleanStr, 10);
    return isNaN(val) ? 0 : val;
  },

  // Format Date string (YYYY-MM-DD) to Indonesian formatted date
  formatDateIndo(dateStr, includeDay = false) {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      
      const options = {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      };
      if (includeDay) {
        options.weekday = 'long';
      }
      return new Intl.DateTimeFormat('id-ID', options).format(date);
    } catch (e) {
      return dateStr;
    }
  },

  // Format Date & Time (YYYY-MM-DDTHH:mm or ISO)
  formatDateTimeIndo(dateTimeStr) {
    if (!dateTimeStr) return '-';
    try {
      const d = new Date(dateTimeStr);
      if (isNaN(d.getTime())) return dateTimeStr;
      const datePart = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timePart = d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${datePart}, ${timePart}`;
    } catch (e) {
      return dateTimeStr;
    }
  },

  // Get today's date formatted as YYYY-MM-DD
  getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Get current time formatted as HH:mm
  getCurrentTimeString() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  },

  // Generate unique ID
  generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
  },

  // Sanitize string to prevent HTML injection
  sanitizeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Check debt due date status
  getDebtStatus(debt) {
    const remaining = Number(debt.amount) - Number(debt.paidAmount || 0);
    if (remaining <= 0) {
      return { status: 'lunas', label: 'Lunas', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' };
    }
    
    if (!debt.dueDate) {
      return { status: 'aktif', label: 'Belum Lunas', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' };
    }

    const todayStr = this.getTodayString();
    if (debt.dueDate < todayStr) {
      return { status: 'lewat', label: 'Jatuh Tempo!', badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 animate-pulse' };
    } else if (debt.dueDate === todayStr) {
      return { status: 'hari_ini', label: 'Jatuh Tempo Hari Ini', badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' };
    }

    return { status: 'aktif', label: 'Belum Lunas', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' };
  },

  // WhatsApp Reminder Generator
  buildWhatsAppUrl(debt, businessProfile) {
    if (!debt.phone) return '';
    let phone = debt.phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    } else if (!phone.startsWith('62')) {
      phone = '62' + phone;
    }

    const sisa = Number(debt.amount) - Number(debt.paidAmount || 0);
    const toko = businessProfile.name || 'Usaha Kami';
    const dueDateFormatted = debt.dueDate ? Utils.formatDateIndo(debt.dueDate, true) : 'secepatnya';

    let message = '';
    const noteText = debt.note || debt.description || 'Transaksi Usaha';
    if (debt.type === 'piutang') {
      // Pelanggan berhutang ke kita
      message = `Halo Kak *${debt.personName}*,\n\nSalam dari *${toko}* 🙏\nMengingatkan kembali catatan tagihan belanja dengan rincian:\n\n` +
        `• *Keterangan*: ${noteText}\n` +
        `• *Total Tagihan*: ${Utils.formatRupiah(debt.amount)}\n` +
        `• *Sudah Dibayar*: ${Utils.formatRupiah(debt.paidAmount || 0)}\n` +
        `• *Sisa yang Harus Dibayar*: *${Utils.formatRupiah(sisa)}*\n` +
        `• *Jatuh Tempo*: ${dueDateFormatted}\n\n` +
        `Pembayaran dapat ditransfer atau tunai langsung. Mohon konfirmasi jika sudah melakukan pembayaran ya Kak.\nTerima kasih banyak atas kerjasamanya! 😊`;
    } else {
      // Kita berhutang ke supplier/orang
      message = `Halo Kak *${debt.personName}*,\n\nIni catatan konfirmasi hutang/kewajiban dari *${toko}*:\n\n` +
        `• *Keterangan*: ${noteText}\n` +
        `• *Sisa Tagihan*: *${Utils.formatRupiah(sisa)}*\n` +
        `• *Jatuh Tempo*: ${dueDateFormatted}\n\n` +
        `Kami jadwalkan pelunasan sebelum jatuh tempo. Terima kasih! 🙏`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  },

  // WhatsApp Digital Receipt Generator
  buildReceiptWhatsAppUrl(tx, businessProfile, walletName = 'Kas Tunai', customerPhone = '') {
    const toko = businessProfile.name || 'Buku Kas';
    const alamat = businessProfile.address ? `${businessProfile.address}\n` : '';
    const telp = businessProfile.phone ? `Telp/WA: ${businessProfile.phone}\n` : '';
    const tgl = Utils.formatDateIndo(tx.date, true);
    const tipeLabel = tx.type === 'in' ? 'BUKTI PEMBAYARAN / PENERIMAAN' : 'BUKTI PENGELUARAN KAS';

    let message = `🧾 *${tipeLabel}*\n` +
      `*${toko.toUpperCase()}*\n` +
      alamat + telp +
      `------------------------------------\n` +
      `No. Ref: #${tx.id.toUpperCase().substring(0, 10)}\n` +
      `Waktu: ${tgl}, ${tx.time || ''}\n` +
      `Metode: ${walletName}\n` +
      `Kategori: ${tx.category}\n` +
      `Keterangan: ${tx.note || '-'}\n` +
      `------------------------------------\n` +
      `*TOTAL: ${Utils.formatRupiah(tx.amount)}*\n` +
      `Status: *BERHASIL / LUNAS*\n` +
      `------------------------------------\n` +
      `${businessProfile.notes || 'Terima kasih atas kepercayaan Anda!'}\n` +
      `_Dicatat via Buku Kas Pintar_`;

    let cleanPhone = (customerPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone) {
      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
      else if (!cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone;
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  },

  // Toast notification
  toastTimeout: null,
  showToast(message, type = 'success') {
    const toastEl = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toastEl || !toastMsg) return;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    let iconHtml = '';
    let bgClasses = 'bg-slate-900 text-white dark:bg-white dark:text-slate-900';

    if (type === 'success') {
      iconHtml = '<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i>';
    } else if (type === 'error') {
      iconHtml = '<i data-lucide="alert-circle" class="w-5 h-5 text-rose-400"></i>';
    } else if (type === 'info') {
      iconHtml = '<i data-lucide="info" class="w-5 h-5 text-sky-400"></i>';
    }

    toastIcon.innerHTML = iconHtml;
    toastMsg.textContent = message;

    toastEl.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    toastEl.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');

    if (window.lucide) {
      window.lucide.createIcons();
    }

    this.toastTimeout = setTimeout(() => {
      toastEl.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
      toastEl.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
    }, 3500);
  },

  // Trigger celebration confetti
  triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }
};
