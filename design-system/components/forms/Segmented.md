Small pill switch with an ink active thumb — the topbar language toggle, or 2–3 option view switches.

```jsx
<Segmented options={['PT', 'EN']} value={lang} onChange={setLang} />
<Segmented variant="text" size="sm" options={['Week', 'Month']} value={v} onChange={setV} />
```

- For filtering table data use ChipGroup instead.
