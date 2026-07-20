(() => {
  const sixMonthsFrom = (source = new Date()) => {
    const result = new Date(source);
    const originalDay = result.getDate();

    result.setDate(1);
    result.setMonth(result.getMonth() + 6);

    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(originalDay, lastDay));
    result.setHours(23, 59, 59, 999);

    return result;
  };

  const toDateInputValue = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const expiryInput = document.querySelector('#clientExpiry');
  if (!expiryInput) return;

  const syncExpiry = () => {
    expiryInput.value = toDateInputValue(sixMonthsFrom());
  };

  syncExpiry();
  document.querySelector('#createClientForm')?.addEventListener('reset', syncExpiry);
})();
