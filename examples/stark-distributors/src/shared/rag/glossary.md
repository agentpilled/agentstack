# stark-distributors — Internal glossary

> SKU naming conventions, customer aliases, abbreviations the team uses.

## SKU format

`<family>-<size>-<grade>`

| Family code | Family name |
|---|---|
| `BLT` | Bolt |
| `NUT` | Nut |
| `WSH` | Washer (flat) |
| `LWS` | Lock washer |
| `SCR` | Screw |
| `STD` | Stud |
| `THR` | Threaded rod |

Size formats:
- Metric: `M<diameter>-<length>` (e.g. `M8-25` = 8mm diameter, 25mm length)
- Imperial: `<fraction>-<length>` (e.g. `3/8-1.5` = 3/8" diameter, 1.5" length)

Grades: `12.9`, `10.9`, `8.8` (metric); `Gr5`, `Gr8` (imperial); `SS-304`, `SS-316` (stainless).

Example SKUs: `BLT-M8-25-12.9`, `NUT-3/8-Gr5`, `WSH-M10-SS-316`.

## Customer aliases

| Internal name | Aliases used in conversation |
|---|---|
| Acme Auto Repair | "Acme", "Acme shop" |
| North Pacific Fleet | "NPF", "North Pacific", "the fleet" |
| Central Manufacturing | "Central", "CMI" |

When a query uses an alias, normalize to the internal name before calling tools.

## Abbreviations

| Term | Meaning |
|---|---|
| WH | Warehouse |
| OS | Open shipment |
| CT | Committed total (WH + OS) |
| EOQ | End-of-quarter (used in reorder discussions) |
| BO | Backorder (item below 0 — owed to a customer) |
