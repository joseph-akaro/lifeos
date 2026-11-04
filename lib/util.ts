export const uid = () => Math.random().toString(36).slice(2, 9);
export const pad = (n: number) => String(n).padStart(2, '0');
export const dstr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => dstr(new Date());
export const addDays = (s: string, n: number) => {
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return dstr(d);
};
export const monthOf = (s: string) => s.slice(0, 7);
export const addMonths = (m: string, n: number) => {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
export const monthName = (m: string) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
};
export const mondayOf = (s: string) => addDays(s, -((new Date(s + 'T00:00:00').getDay() + 6) % 7));
export const hm = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ' ' + pad(min % 60) + 'm' : ''}` : `${min}m`;
export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
