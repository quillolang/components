# Quillo UI

108 UI components for [Quillo](https://quillolang.org), each one `.qwe` file you
copy into your program: buttons, forms, sign-in, date pickers, dialogs, tabs, editable
and virtual tables, a JSON table, charts, a map, a payment card, toasts and more. They
come with their styles, follow the system's light or dark theme, and work with the
keyboard and screen readers. Most are views that need no JavaScript at all; the rest
are components that run in the browser.

See them all at [quillolang.org/components](https://quillolang.org/components/), or
run the gallery here:

```sh
scripts/build.sh && quillo run gallery.qwe --watch     # then open http://localhost:8080
```

## Getting them

**The whole kit, one file.** [`quillo-ui.qwe`](quillo-ui.qwe) has every component and
`ui_css`, the theme every page needs (and the styles of `notify` and `ask`). Each
component brings its own CSS (`style global` in its body), which Quillo sends only to
the pages that show it, as a sheet the browser keeps:

```sh
curl -O https://quillolang.org/components/quillo-ui.qwe
```

```quillo
use "quillo-ui.qwe"

route GET / =
    <html>
        <head><style>{ui_css}</style></head>
        <body class="ui-root">
            <Button href="/start">Get started</Button>
        </body>
    </html>
```

**Only what you use.** Each component is its own file in [`ui/`](ui), and every one
needs [`ui/theme.qwe`](ui/theme.qwe). Put `theme_css` in the page's style; each component
brings its own:

```sh
mkdir -p ui && cd ui
curl -O https://quillolang.org/components/ui/theme.qwe
curl -O https://quillolang.org/components/ui/button.qwe
curl -O https://quillolang.org/components/ui/modal.qwe
```

```quillo
use "ui/theme.qwe"
use "ui/button.qwe"
use "ui/modal.qwe"

route GET / = <html><head><style>{theme_css}</style></head><body class="ui-root">...</body></html>
```

They need a Quillo with `style global` (0.5.0 from 2026-10-28 on).

**With git.** Clone it, or add it as a submodule and keep it up to date:

```sh
git submodule add https://github.com/quillolang/components vendor/quillo-ui
```

```quillo
use "vendor/quillo-ui/quillo-ui.qwe"
```

`use` paths count from the folder of the program's main file, wherever the `use` is.

## Theming

Every colour, font and radius is a CSS variable set in `theme.qwe` (`--ui-accent`,
`--ui-bg`, `--ui-fg`, `--ui-border`, `--ui-radius`, ...). Set them again after the kit's
styles to make it yours:

```css
:root { --ui-accent: #0a7d55; --ui-radius: 4px; --ui-font: "IBM Plex Sans", sans-serif; }
```

The theme follows the system's light or dark setting. `class="ui-dark"` or
`class="ui-light"` on any element fixes it there. `class="ui-root"` on `<body>` sets the
page's font, background and colour too.

## The components

| Group | Components |
|---|---|
| Layout | Container, Stack, Grid, Card, Divider, Navbar, AppShell, Splitter, Carousel, Toolbar, ActionBar |
| Actions | Button, IconButton, ButtonGroup, CopyButton, DropdownMenu, SplitButton, ToggleButton |
| Forms | TextField, TextArea, Select, Checkbox, RadioGroup, Switch, Slider, NumberInput, SearchInput, PasswordInput, FileDrop, TagInput, Combobox, AuthForm, DatePicker, DateRangePicker, TimeInput, ColorPicker, RangeSlider, Rating, OtpInput, MultiSelect, InlineEdit, ChipGroup, FileUpload, FilterBar, TransferList, KeyValueEditor, TimeSlots, GuestPicker, CardInput |
| Feedback | Alert, Badge, Spinner, Progress, Skeleton, EmptyState, Tooltip, Notices, Banner, Meter, ProgressRing, Countdown, StatusDot |
| Overlays | Modal, Drawer, Popover, ConfirmButton, CommandPalette, Lightbox, Sheet, HoverCard |
| Navigation | Tabs, Breadcrumbs, Pagination, Steps, Accordion, SegmentedControl, SideNav, TreeView, TableOfContents, ContextMenu, BackToTop |
| Data | Avatar, DataTable, Stat, Timeline, DescriptionList, Tag, Sparkline, EditableTable, VirtualTable, VirtualList, SearchList, MatchHighlight, FileList, JsonViewer, JsonTable, KanbanBoard, DiffView, CodeBlock, ChatThread, AvatarStack, BarChart, LineChart, DonutChart, CalendarHeatmap, MapView, MonthCalendar, PriceBreakdown |

Some files bring a companion: `AccordionItem`, `AvatarGroup`, `CarouselSlide`,
`CheckboxGroup`, `DescriptionItem`, `DismissibleAlert`, `SkeletonCard`, `Tab`, `TabBar`,
`ToggleButtonGroup`, `ToolbarGroup`, `ToolbarSeparator` and `ToolbarSpacer`. Each file
starts with what it takes and an example. One file needs another: `search_list.qwe`
uses `match_highlight.qwe`. One needs a library: `map_view.qwe` draws with
[Leaflet](https://leafletjs.com), which the page loads (the two tags are in the file).

## How they work

- **Views first.** A component with nothing to remember is a `view`, built on what the
  browser already does: `<details>` for an accordion, `<dialog>` for a modal, the
  `popover` attribute for menus, CSS for tabs and tooltips. A view adds nothing to the
  page's script.
- **Forms work without JavaScript.** Every field is a real `<input>`, `<select>` or
  `<textarea>` with a `name`, so a plain `<form method="post">` sends it to a route.
- **Callbacks inside your components.** Props such as `on_change` take a function. A
  component placed straight in a page gets its props from the server, as data, so
  callbacks work when the kit's component is inside one of your own:

  ```quillo
  component Settings() {
      state dark = false
      <Switch label="Dark mode" checked={dark} on_change={(on) => { dark = on }}/>
  }
  ```
- **Names.** Everything a file declares starts with its name (`modal_css`,
  `Modal`), and its CSS classes with `ui-`, so files never clash with each other or
  with your program.
- **Styles travel with them.** Each component's body starts with `style global
  <file>_css`: a page is sent the CSS of the components it shows (and of those it can
  come to show in the browser), not the whole kit's. `global` keeps the selectors as
  written, so a rule may style what you pass in (`.ui-card-body > :first-child`).

## Writing one

Each component is three files, named by its slug (`data_table`):

- `ui/<slug>.qwe`: a comment saying what it is, an example and what each prop does;
  `let <slug>_css = css`...``; then the `view` or `component`, whose body starts with
  `style global <slug>_css`.
- `demos/<slug>.qwe`: `view <Name>Demo()` showing it, and a line adding it to the
  gallery: `ui_gallery = ui_gallery | push({ slug, name, group, summary, demo })`.
- `tests/<slug>.js`: what [`tests/browser.mjs`](tests/browser.mjs) runs in the
  gallery page to check it: it returns nothing when it works, or what went wrong.

Then:

```sh
scripts/build.sh            # makes quillo-ui.qwe and demos.qwe from ui/ and demos/
scripts/test.sh [slug...]   # quillo check, then each test in headless Chrome
```

The tests need Node 22 or later and Chrome (`CHROME` names another browser binary).

A few things Quillo holds you to:

- A component placed directly in a page cannot take HTML props or functions from the
  server; `children` it can. Give such a component data props, and HTML as `children`.
- A view cannot take `@click`: give it an `on_click` prop and put that on its element.
- A function is called with exactly the arguments it declares: `on_click()` takes
  none, so call it with none, and document what each callback is given.
- `for` is a keyword (use `field` for a label's `for`), and props cannot have dashes
  (`label` becomes `aria-label`). `view` is a keyword too.
- A variable or prop named like a builtin hides it where it is seen: a `max` prop
  hides `max()`, and `let int = ...` or `let any = ...` does not mean what it says
  afterwards. Give them other names (`limit`, `count`).

## License

MIT, as Quillo is.
