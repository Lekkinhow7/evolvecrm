Icon-only control for chrome actions — sidebar collapse («), theme toggle, modal close, notifications.

```jsx
<IconButton icon="chevrons-left" label="Collapse menu" />
<IconButton icon="sun" label="Switch theme" round />
<IconButton icon="bell" label="Notifications" variant="tile" dot />
```

- Always pass label (used for aria-label + tooltip).
- tile = the bell / logout pair at the bottom of the sidebar.
