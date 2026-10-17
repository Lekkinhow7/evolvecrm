Operational log table — place inside a Panel with a SearchInput + ChipGroup toolbar above.

```jsx
<DataTable chevron
  columns={[{key:'date',label:'Date'},{key:'op',label:'Operation'},{key:'qty',label:'Quantity',numeric:true},
    {key:'status',label:'Status',render:v=><Badge>{v}</Badge>}]}
  rows={rows} onRowClick={open} />
```

- Dates DD.MM.YYYY; quantities with thin-space thousands ("318 000"); document IDs in caps (BATCH-4412-09).
