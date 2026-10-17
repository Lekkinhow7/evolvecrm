Outer frame for every admin page — keeps all desktop features reachable on mobile via the drawer.

```jsx
<AppShell drawerOpen={open} onDrawerClose={()=>setOpen(false)} sidebar={<Sidebar … />}>
  <Topbar onToggleSidebar={()=> isMobile ? setOpen(true) : setCollapsed(c=>!c)} … />
  <PageHeader … />
  {content}
</AppShell>
```

- Desktop toggle collapses the sidebar to an 84px rail; mobile toggle opens the drawer.
