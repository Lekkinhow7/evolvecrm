Long-range activity map ("Entry map", 13 weeks+). Red = days with deviations; always show the Legend.

```jsx
<Heatmap weeks={weeks} months={[{label:'Oct',col:0},{label:'Nov',col:4}]} />
<Legend items={[{label:'No events',shape:'dot',color:'var(--slate-150)'},{label:'Planned',shape:'dot',color:'#C3E8F1'},{label:'Done',shape:'dot',color:'#5DBDD5'},{label:'With deviations',shape:'dot',color:'var(--red-500)'}]} />
```
