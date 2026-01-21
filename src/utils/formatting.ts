export const formatPrice = (num: number): string => {
  if (num === 0 || num === null || num === undefined) {
    return '';
  }
  
  const rounded = Math.round(num * 10000) / 10000;
  
  const str = rounded.toString();
  if (str.includes('.')) {
    const parts = str.split('.');
    const decimal = parts[1];
    if (decimal.length <= 2) {
      return str;
    } else {
      return rounded.toFixed(4);
    }
  }
  
  return str;
};

export const formatDecimal = formatPrice;

export const parseNumberInput = (value: string): number => {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const epochDate = new Date('1970-01-01T00:00:00.000Z');
  
  if (date.getTime() === epochDate.getTime()) {
    return '';
  }
  
  return date.toLocaleDateString('pl-PL');
};