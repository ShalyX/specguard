# Issue: CSV export for workspace orders

Add a CSV export function for the order-list screen.

- R1: Export only records belonging to the active workspace.
- R2: Respect the selected status filter. Export records matching the current view filters.
- R3: Empty exports contain the header row.
- R4: Quote CSV values and escape embedded quotation marks.

Existing context: the order-list screen passes its filters and current pagination in a Query object. Order totals and identifiers are supplied by trusted upstream code; this change does not process spreadsheet formulas or calculate totals.
