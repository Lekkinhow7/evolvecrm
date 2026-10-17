KPI card for the 4-up row under the page header — pixel-font number, tiny label, optional unit.

```jsx
<StatCard variant="ink" label="Overdue" value="1" unit="needs action" />
<StatCard label="Due today" value="3" />
<StatCard label="In progress" value="7" />
<StatCard variant="lime" label="Closed this week" value="14" />
```

- Row rhythm from the source: one ink (what needs action) + whites + one cyan or lime accent.
- Keep value short (≤ 6 chars). Decimal comma is allowed ("0,18").
