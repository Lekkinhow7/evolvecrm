Pill action button — one primary (ink) per view, pair it with a secondary (white) for the alternative action.

```jsx
<Button variant="secondary">Export</Button>
<Button>Create task</Button>
<Button variant="accent-outline" size="sm">Learn more</Button>
```

- Page header pattern: [secondary "Export"] [primary "Create task"], right-aligned.
- Modal footer: [secondary "Cancel"] [primary "Save"].
- In dark theme, primary automatically becomes cyan (token swap).
- Labels are sentence case, verb-first, 1–2 words.
