White 24px-radius card with title + meta pill — wraps every chart, table and list.

```jsx
<Panel title="Tasks closed per day" meta={<Badge tone="neutral">7 days</Badge>}>
  <BarChart data={days} />
</Panel>
```

- Title is a noun phrase, sentence case. Meta pill = period or "live"/"now".
- Use variant="tint" for a section that groups other cards (e.g. "Status at a glance").
