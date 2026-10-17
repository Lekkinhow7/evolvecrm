Month calendar inside a Panel titled "September 2026" with a neutral count Badge ("9 tasks").

```jsx
<Calendar year={2026} month={8} selected={9} markers={{3:true,15:true,22:true}} onSelect={setDay} />
<Calendar year={2026} month={8} cells={{1:'cyan',2:'lime',13:'ring'}} cellHeight={40} />
```

- Dot markers = tasks on that day; cells = shift plan. Weekends render muted unless filled.
