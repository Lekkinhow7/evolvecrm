Trend over time (output, throughput). One series only — compare with a tooltip chip, not extra lines.

```jsx
<AreaChart data={[17650,18050,18120,18040,17900,18300,18480,18350]} min={17600} max={18600} activeIndex={3}
  labels={['Mon','','Tue','Wed','Thu','Fri','Sat','Sun']}
  renderTooltip={(v)=><ChartTooltip variant="line" title="Wed, 30 Aug" label="Output" value={v.toLocaleString('ru-RU')} unit="units" />} />
```
