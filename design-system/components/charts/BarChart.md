Daily/weekly capsule bars — use for workload, completion, closures. Hover shows the ink tooltip.

```jsx
<BarChart max={6} yTicks={['6','4','2','0']} activeIndex={1}
  data={[{label:'Mon',total:2.9},{label:'Tue',total:5,tooltip:{title:'Tuesday, 08.09',value:'5',unit:'tasks closed',chip:'+1.7 vs average'}},
         {label:'Sun',value:1.9,tone:'lime'}]} />
```

- total only = hatched bar (planned); total + value = progress against plan; empty = no data day.
