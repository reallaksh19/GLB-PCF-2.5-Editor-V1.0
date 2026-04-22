# WI — Component Panel

## File
`js/ui/component-panel.js`

## Purpose
Renders domain-provided `PanelSection[]` into the `#viewer-side-panel` HTML element.
Knows nothing about specific component types — receives pre-structured sections from the domain.

---

## Exports
```javascript
export function renderPanel(sections: PanelSection[], container: HTMLElement): void
export function clearPanel(container: HTMLElement): void
```

## Types
```javascript
PanelSection = { title: string, rows: PanelRow[] }
PanelRow     = { label: string, value: string, highlight?: boolean }
```

---

## Behaviour

### `clearPanel(container)`
1. `container.innerHTML = ''`
2. `container.classList.add('empty')` — triggers the CSS `::after` "Click a component" message

### `renderPanel(sections, container)`
1. `container.classList.remove('empty')`
2. `container.innerHTML = ''`
3. For each section in `sections`:
   a. Skip section if `section.rows.length === 0`
   b. Create a `<div class="panel-section">` with:
      - `<div class="panel-section-title">{section.title}</div>`
      - A `<table class="panel-table">` with one `<tr>` per row:
        ```html
        <tr class="{highlight ? 'row-highlight' : ''}">
          <td class="panel-label">{row.label}</td>
          <td class="panel-value">{row.value || '—'}</td>
        </tr>
        ```
   c. Append section div to `container`

---

## CSS Classes Required
These must exist in `css/app.css` or be injected inline:
```css
.panel-section        { margin-bottom: 12px; }
.panel-section-title  { font-weight: 600; color: var(--amber); margin-bottom: 4px; font-size: 11px; text-transform: uppercase; }
.panel-table          { width: 100%; border-collapse: collapse; }
.panel-table td       { padding: 2px 0; vertical-align: top; }
.panel-label          { color: var(--text-muted, #64748b); width: 45%; padding-right: 6px; }
.panel-value          { color: var(--text-primary, #e8eaf0); word-break: break-all; }
.row-highlight td     { color: var(--amber, #f59e0b); }
```

If these classes are missing from `app.css`, inject them via a `<style>` tag in renderPanel.

---

## Dependencies
```
(none — pure DOM manipulation)
```

---

## Test Criteria
1. `renderPanel([{ title:'Common', rows:[{label:'ID',value:'comp_0'}] }], el)` → section visible
2. `clearPanel(el)` → container empty, "Click a component" placeholder shows
3. Empty section (rows=[]) → section not rendered
4. Row with `highlight: true` → row text amber/gold colour
5. Row with `value: ''` → shows `—` (em dash)
