Dialog for viewing/editing one record or one day — title + context subtitle, InfoTiles, ModalSections, Cancel/Save.

```jsx
<Modal open={open} onClose={close} title="Medical record book" subtitle="Medical section" art="assets/icons-3d/records-files.png"
  footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button>Save</Button></>}>
  <ModalSection title="Document"> <TextField label="Number" defaultValue="Medical Book No. 77-0421" /> </ModalSection>
</Modal>
```

- Day view: lead={<div className="at-modal__date">9</div>} plain, title "Wednesday, September 9", subtitle "4 tasks · today", ScheduleItems in body.
