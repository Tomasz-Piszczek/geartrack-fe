export const formatDecimal = (num: number): string => {
  if (num === Math.floor(num)) {
    return num.toFixed(2);
  }
  const str = num.toFixed(4);
  return parseFloat(str).toString();
};