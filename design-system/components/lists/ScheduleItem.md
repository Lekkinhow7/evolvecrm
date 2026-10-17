Agenda row for a day view; TaskCard is the compact kanban variant with the same left bar.

```jsx
<ScheduleItem time="09:00" title="Take swabs, R-207" subtitle="Microbiological control" tone="success" badge="Due today" badgeTone="info" />
<ScheduleItem time="14:00" title="Renew the medical check" subtitle="Personnel" tone="danger" badge="Overdue" />
<TaskCard title="Pressure P-2" subtitle="Parameter check" tone="info" />
```

- Bar colour = category state; badge = workflow state. Both may differ.
