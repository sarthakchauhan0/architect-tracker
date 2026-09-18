import confetti from 'canvas-confetti';

export const formatCurrency = (amount: number, symbol: string = '₹'): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0`;
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol}${formatted}`;
};

export const formatDate = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(dateInput);
  }
};

export const triggerConfetti = () => {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#d97706', '#f59e0b', '#10b981', '#38bdf8', '#8b5cf6'],
    });
  } catch (err) {
    console.warn('Confetti error:', err);
  }
};
