'use client';
import { useEffect, useState } from 'react';
import { COUNTRIES, countryOf } from '@/lib/countries';
import { formatMoney, hoursSince, rateStr, stayLength } from '@/lib/fx-rates';
import { countryForm } from '@/lib/quick';
import { useStore } from '@/lib/store';
import { Icon } from './Icon';
import { Empty } from './ui';

/** The country you're in, its currency, and today's USD rate: what the rest of the app uses for local equivalents. */
export function useLocal() {
  const { s, fx } = useStore();
  const country = countryOf(s.country);
  const rate = country && country.cur !== 'USD' ? fx.rates[country.cur] : undefined;
  return { country, rate, code: country?.cur, local: (usd: number) => (rate && country ? formatMoney(country.cur, usd * rate) : null) };
}

const trim = (n: number) => (Number.isFinite(n) ? String(Math.round(n * 100) / 100) : '');
const dateLabel = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function FxCard() {
  const store = useStore();
  const { s, fx, refreshFx } = store;
  const { country: c, rate } = useLocal();
  const [conv, setConv] = useState<{ side: 'usd' | 'loc'; text: string }>({ side: 'usd', text: '100' });
  const [all, setAll] = useState(false);
  // a new country means a new currency: start the converter fresh
  useEffect(() => setConv({ side: 'usd', text: '100' }), [c?.code]);
  const stay = s.stays.find((y) => !y.end);
  const past = s.stays.filter((y) => y.end).slice().reverse();
  const num = parseFloat(conv.text);
  const usdVal = conv.side === 'usd' ? conv.text : rate && Number.isFinite(num) ? trim(num / rate) : '';
  const locVal = conv.side === 'loc' ? conv.text : rate && Number.isFinite(num) ? trim(num * rate) : '';
  const stale = fx.status !== 'none' && hoursSince(fx.fetchedAt) > 48;

  return (
    <div className="card fx" style={{ marginBottom: 16 }}>
      <h3>Where you are &amp; exchange rate
        <button className="btn sm" onClick={() => countryForm(store)}><Icon n="bx-map" /> {c ? 'Change country' : 'Set country'}</button>
      </h3>

      {!c ? (
        <Empty>Pick the country you&apos;re staying in. LifeOS will follow its exchange rate against USD and convert for you.</Empty>
      ) : (
        <>
          <div className="fxhead">
            <span className="ctag">{c.code}</span>
            <div className="grow">
              <b>{c.name}</b>
              <div className="small muted">{stay ? `Since ${dateLabel(stay.start)} · ${stayLength(stay.start)}` : c.cur}</div>
            </div>
            {c.cur === 'USD' ? (
              <div className="fxrate"><b>USD</b><div className="small muted">Your primary currency</div></div>
            ) : (
              <div className="fxrate">
                <b>{rate ? `1 USD = ${rateStr(rate)} ${c.cur}` : 'Rate unavailable'}</b>
                <div className="small muted">{rate ? `1 ${c.cur} = ${rateStr(1 / rate)} USD` : 'Check your connection'}</div>
              </div>
            )}
          </div>

          {c.cur !== 'USD' && rate && (
            <div className="conv">
              <label><span>USD</span><input inputMode="decimal" value={usdVal} onChange={(e) => setConv({ side: 'usd', text: e.target.value })} aria-label="Amount in USD" /></label>
              <Icon n="bx-transfer-alt" />
              <label><span>{c.cur}</span><input inputMode="decimal" value={locVal} onChange={(e) => setConv({ side: 'loc', text: e.target.value })} aria-label={`Amount in ${c.cur}`} /></label>
            </div>
          )}
        </>
      )}

      <div className={`fxstatus ${fx.status}`}>
        <Icon n={fx.status === 'live' ? 'bxs-check-circle' : fx.status === 'cached' ? 'bx-wifi-off' : 'bx-error-circle'} />
        <span>
          {fx.status === 'live' && <>Live market rates, updated {fx.updated ? new Date(fx.updated).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'today'}.</>}
          {fx.status === 'cached' && <>Offline. Showing rates saved {Math.round(hoursSince(fx.fetchedAt))}h ago{stale ? ', so they may be out of date' : ''}.</>}
          {fx.status === 'none' && <>Couldn&apos;t load exchange rates.</>}
        </span>
        <button className="btn ghost sm" onClick={() => refreshFx()}><Icon n="bx-refresh" /> Refresh</button>
      </div>
      <div className="small muted fxnote">
        These are daily mid-market rates. A bureau, M-Pesa or ATM usually gives a little less, and in some countries the street rate differs a lot from the official one. When you log a transaction you can enter the rate you actually got.
        {' '}Rates by <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Exchange Rate API</a>.
      </div>

      {past.length > 0 && (
        <div className="stays">
          <div className="small muted lab">Places you&apos;ve stayed</div>
          {past.slice(0, 6).map((y) => {
            const pc = countryOf(y.country);
            return (
              <div className="item" key={y.id}>
                <span className="ctag sm">{y.country}</span>
                <span className="t">{pc?.name ?? y.country}<span className="small muted"> · {dateLabel(y.start)} – {y.end && dateLabel(y.end)}</span></span>
                <span className="small muted">{stayLength(y.start, y.end)}</span>
              </div>
            );
          })}
        </div>
      )}

      <button className="linkbtn" onClick={() => setAll((v) => !v)}>
        <Icon n={all ? 'bx-chevron-up' : 'bx-chevron-down'} /> {all ? 'Hide' : 'Show'} rates for all East African currencies
      </button>
      {all && (
        <div className="ratelist">
          {COUNTRIES.filter((x) => x.cur !== 'USD').map((x) => (
            <div className={`item ${x.code === s.country ? 'cur' : ''}`} key={x.code}>
              <span className="ctag sm">{x.code}</span>
              <span className="t">{x.name}</span>
              <span className="small">{fx.rates[x.cur] ? `1 USD = ${rateStr(fx.rates[x.cur])} ${x.cur}` : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
