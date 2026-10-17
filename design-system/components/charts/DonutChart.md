Part-to-whole status split (≤ 5 segments) with a Legend of dots + counts beneath.

```jsx
<DonutChart value="25" label="total tasks" segments={[
  {value:14,color:'var(--ink-800)'},{value:7,color:'var(--cyan-500)'},{value:3,color:'var(--lime-500)'},{value:1,color:'var(--red-500)'}]} />
```

- Segment colour order: ink (closed) · cyan (in progress) · lime (due today) · red (overdue).
