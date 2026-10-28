# Quillo UI

491 UI components for [Quillo](https://quillolang.org), each one `.qwe` file you
copy into your program: layout, typography, buttons, forms, sign-in, date pickers,
dialogs, navigation, tables, cards, media, commerce, marketing, dashboard, social and
scheduling pieces, and 65 charts from bar charts to candlesticks and a stock chart. They
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

491 components in 16 groups: 426 for pages, forms and apps, and 65 charts,
from bar and line charts to candlesticks, an order book and a stock chart.

| Group | Components |
|---|---|
| Layout (36) | ActionBar, AppShell, AspectRatio, BentoGrid, BrowserFrame, Card, Carousel, Center, Cluster, Collapsible, Columns, Container, Cover, Divider, Dock, Fieldset, Footer, Grid, Inset, Masonry, MasterDetail, Navbar, PageHeader, Panel, Reel, ResizableBox, ScrollArea, Section, SidebarLayout, Spacer, Splitter, Stack, StackedLayout, Sticky, Switcher, Toolbar |
| Typography (24) | Abbr, Blockquote, BulletList, Callout, Caption, CheckList, DropCap, Eyebrow, Footnote, GradientText, Heading, InlineCode, Kbd, Lead, LineClamp, Link, Mark, MarkdownView, OrderedList, Prose, Pullquote, ReadMore, Text, Truncate |
| Actions (20) | BookmarkButton, Button, ButtonGroup, CopyButton, DownloadButton, DropdownMenu, Fab, FollowButton, IconButton, LikeButton, LoadMoreButton, MenuBar, PrintButton, ReactionPicker, ShareButton, SpeedDial, SplitButton, ThemeToggle, ToggleButton, VoteButtons |
| Forms (81) | AddressForm, AuthForm, Autocomplete, AvatarUpload, BirthdayInput, CardInput, CharacterCounter, Checkbox, CheckboxCards, ChecklistInput, ChipGroup, CodeEditor, ColorPicker, ColorSwatches, Combobox, ConsentCheckbox, ContactForm, CountryPicker, CurrencyInput, DatePicker, DateRangePicker, DateTimeInput, DependentSelect, DurationInput, EmailInput, EmojiPicker, FileDrop, FileUpload, FilterBar, FontPicker, Form, FormActions, FormField, FormRow, FormSummary, FormWizard, GuestPicker, IconPicker, ImagePicker, InlineEdit, KeyValueEditor, LanguagePicker, LikertScale, MarkdownEditor, MaskedInput, MentionInput, MinMaxInput, MonthPicker, MultiSelect, NewsletterForm, NpsInput, NumberInput, OtpInput, PasswordInput, PasswordStrength, PhoneInput, Poll, ProfileForm, QuantityInput, RadioCards, RadioGroup, RangeSlider, Rating, RecurrencePicker, RichTextEditor, SearchInput, Select, SignaturePad, Slider, SortableList, Switch, TagInput, TextArea, TextField, TimeInput, TimeSlots, TimezonePicker, TransferList, UrlInput, WeekPicker, YearPicker |
| Feedback (28) | Alert, Badge, Banner, Coachmark, ConnectionStatus, CookieConsent, Countdown, EmptyState, ErrorPage, InlineMessage, LoadingDots, LoadingOverlay, Meter, NewBadge, Notices, NotificationDot, Progress, ProgressRing, ResultPage, SaveStatus, Skeleton, SkeletonTable, SkeletonText, Snackbar, Spinner, StatusDot, Tooltip, UploadProgress |
| Overlays (20) | AlertDialog, ChatWidget, CommandPalette, ConfirmButton, Drawer, Flyout, FullscreenModal, HoverCard, Lightbox, Modal, NotificationCenter, Popover, PromptDialog, QuickView, SearchOverlay, ShareSheet, Sheet, ShortcutsDialog, SpotlightTour, Toast |
| Navigation (36) | Accordion, AlphabetIndex, BackToTop, BottomNav, Breadcrumbs, CollapsibleNav, ContextMenu, DirectoryNav, FilterTabs, FooterNav, IconTabs, JumpLinks, LanguageSwitcher, LinkList, MegaMenu, Menu, MobileNav, NavLink, NavSearch, NotificationBell, Pager, Pagination, ProgressNav, ScrollTabs, Scrollspy, SegmentedControl, SideNav, SitemapList, SkipLink, Steps, Subnav, TableOfContents, Tabs, TreeView, UserMenu, VerticalTabs |
| Data (72) | ActivityFeed, ArticleCard, AuditLog, Avatar, AvatarStack, Barcode, BoardingPass, Changelog, ChatThread, CodeBlock, ComparisonTable, ContactCard, CsvTable, DataGrid, DataList, DataTable, DescriptionList, DiffView, EditableTable, EmailPreview, ExpandableTable, FeedItem, FileList, FilePreview, FlowSteps, FolderGrid, GroupedTable, IdCard, Invoice, JsonTable, JsonViewer, KanbanBoard, KpiCard, Leaderboard, ListGroup, LogViewer, MapView, MatchHighlight, MetricTrend, MilestoneList, MonthCalendar, NewsList, NotificationList, OrgChart, PivotTable, PriceBreakdown, ProfileCard, ProgressList, PropertyGrid, QrCode, RankingList, RatingSummary, Receipt, RecordCard, ReviewCard, ReviewList, Roadmap, Scorecard, SearchList, SelectableTable, Stat, StatGroup, Tag, TagCloud, TeamCard, TerminalOutput, TestimonialCard, Ticket, Timeline, TreeTable, VirtualList, VirtualTable |
| Charts (65) | AreaChart, BarChart, BollingerChart, BoxPlot, BrushChart, BubbleChart, BulletChart, BumpChart, CalendarHeatmap, CandlestickChart, ChordDiagram, ComboChart, DepthChart, DonutChart, DotPlot, FunnelChart, GanttChart, GaugeChart, GroupedBarChart, HeatmapChart, HeikinAshiChart, Histogram, HorizontalBarChart, InteractiveLineChart, LineBreakChart, LineChart, LiveCandles, LollipopChart, MacdChart, MarimekkoChart, MarketHeatmap, NetworkGraph, OhlcChart, OrderBook, ParallelCoordinates, ParetoChart, PieChart, PnlChart, PolarAreaChart, PortfolioAllocation, PriceTicker, RadarChart, RadialBarChart, RangeChart, RealtimeChart, RenkoChart, RsiChart, SankeyChart, ScatterChart, SlopeChart, SmallMultiples, Sparkline, StackedBarChart, StepChart, StockChart, StreamGraph, SunburstChart, SymbolCard, TradeFeed, Treemap, ViolinPlot, VolumeProfile, WaffleChart, Watchlist, WaterfallChart |
| Media (24) | AudioPlayer, CameraCapture, CoverImage, EmbedFrame, Figure, FileIcon, Icon, IconGrid, Image, ImageCompare, ImageCrop, ImageGallery, ImageHotspots, LogoCloud, Marquee, MediaCard, PdfViewer, Playlist, Thumbnail, Ticker, VideoPlayer, VolumeControl, YouTubeEmbed, ZoomImage |
| Commerce (25) | AddressCard, CartItem, CartSummary, CheckoutSteps, CouponInput, DeliveryEstimate, DiscountBadge, MiniCart, OrderHistory, OrderTracker, PaymentMethods, PlanToggle, Price, PriceTag, PricingCard, PricingTable, ProductCard, ProductGallery, ProductGrid, ShippingOptions, StockStatus, SubscriptionCard, TrustBadges, VariantPicker, WishlistButton |
| Marketing (12) | AnnouncementBar, BlogList, CtaSection, Faq, FeatureGrid, FeatureList, Hero, HowItWorks, SocialLinks, StatsBand, TeamGrid, Testimonials |
| Dashboard (13) | ApiKeyField, DangerZone, DashboardGrid, OnboardingChecklist, PermissionsMatrix, QuickActions, QuotaBar, ServerStatus, SessionList, SettingsSection, TokenList, UsageMeter, Widget |
| Social (13) | ChatInput, Comment, CommentThread, Hashtag, MessageBubble, PostCard, PostComposer, ProfileHeader, Reactions, ReplyBox, StoryRing, TypingIndicator, UserBadge |
| Scheduling (12) | AgendaList, AvailabilityGrid, BookingSummary, DayView, EventCard, OpeningHours, RelativeTime, Stopwatch, Timer, WeekView, WorldClock, YearCalendar |
| Utilities (10) | Confetti, Draggable, IdleTimer, InfiniteScroll, KeyboardShortcuts, LazyLoad, LiveAnnouncer, OfflineBanner, ReadingTime, ScrollProgress |

### Finding one

Every component has a group and tags. A tag is a category that cuts across the groups:
`forms` is on every input and button, `chart` on every chart, `no-js` on every view that
adds no JavaScript and `interactive` on every component that runs in the browser. The
most used: `no-js` (310), `interactive` (172), `forms` (123), `data` (114), `chart` (65), `input` (60), `list` (55), `navigation` (50), `layout` (48), `commerce` (40), `button` (36), `card` (36), `dashboard` (36), `social` (35), `feedback` (35), `text` (34), `media` (33), `marketing` (30), `user` (29), `typography` (28), `status` (26), `link` (26), `image` (26), `page` (25).

The gallery and [quillolang.org/components](https://quillolang.org/components/) search
them by name, summary and tag, and filter by group and tags (`/?q=date`,
`/?tag=chart,trading`); "/" goes to the search box.

### Files that need another

Each file starts with what it takes and an example. These need other files of the kit
beside them (their pages on the site list them in the download commands too):

- `article_card`, `blog_list`, `contact_card`, `email_preview`, `feed_item`, `id_card`, `notification_list`, `org_chart`, `profile_card`, `review_card`, `team_card`, `team_grid`, `testimonial_card`, `testimonials` need `avatar.qwe`
- `cart_item`, `cart_summary`, `discount_badge`, `mini_cart`, `order_history`, `price_tag`, `pricing_table`, `product_card`, `shipping_options`, `subscription_card` need `price.qwe`
- `review_list` needs `avatar.qwe` and `review_card.qwe`
- `form` needs `button.qwe`
- `danger_zone` needs `button.qwe` and `confirm_button.qwe`
- `comment_thread` needs `comment.qwe` and `reply_box.qwe`
- `token_list` needs `confirm_button.qwe`
- `speed_dial` needs `fab.qwe`
- `icon_grid` needs `icon.qwe`
- `read_more` needs `line_clamp.qwe`
- `search_list` needs `match_highlight.qwe`
- `pricing_card` needs `price.qwe` and `price_tag.qwe`
- `product_grid` needs `price.qwe` and `product_card.qwe`

`map_view.qwe` draws with [Leaflet](https://leafletjs.com), which the page loads (the two
tags are in the file). No other file needs a library.

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

## Size and speed

What a program pays for the components it holds, whether or not a page shows them.
Measured with `node scripts/bench.mjs`, which loads the kit's components into one program,
then the kit several times over (renamed) as a stand-in for a large app:

<!-- bench -->
| Components in one program | `quillo check` | Start-up | Memory, running | A page |
|---|---|---|---|---|
| 0 | 0.01 s | 0.03 s | 12 MB | 0.3 ms |
| 100 | 0.03 s | 0.08 s | 36 MB | 0.2 ms |
| 250 | 0.08 s | 0.21 s | 85 MB | 0.3 ms |
| 456 | 0.14 s | 0.36 s | 143 MB | 0.3 ms |
| 1824 | 0.59 s | 1.64 s | 546 MB | 0.2 ms |

quillo 0.5.0 (2cd134f, 2026-10-28), Apple M5, 16 GB, darwin arm64, 2026-10-28.
<!-- /bench -->

- **Visitors pay only for what a page shows.** A page carries the components it shows and
  their styles, whatever the program holds: about 1.5 KB of script, gzipped, for a page
  with a button and a switch.
- **The server holds what the program declares.** Start-up and memory grow in a straight
  line, about 1 ms and 0.3 MB a component, once per process (each `--watch` reload,
  `--instances` copy and service copy is one). Serving pages stays fast at any size.
- **The leanest app takes the files it uses.** `quillo-ui.qwe` is the whole kit in one
  `use`; picking files into `ui/` (each component's page on the site gives the commands,
  with the files it needs) keeps a process to what the app shows.

## Writing one

Each component is three files, named by its slug (`data_table`):

- `ui/<slug>.qwe`: a comment saying what it is, an example and what each prop does;
  `let <slug>_css = css`...``; then the `view` or `component`, whose body starts with
  `style global <slug>_css`.
- `demos/<slug>.qwe`: `view <Name>Demo()` showing it, and a line adding it to the
  gallery: `ui_gallery = ui_gallery | push({ slug, name, group, summary, tags, demo })`.
  `tags` are two to six lowercase words people search and filter by (see
  [Finding one](#finding-one)); build.sh refuses an entry without them.
- Its CSS classes start with `ui-` and a prefix no other file uses (`ui-cover-image-`
  beside Cover's `ui-cover-`): two files styling one class break each other on a page
  that shows both. A file may style another's class inside its own
  (`.ui-speed-dial > .ui-fab`), not on its own.
- `tests/<slug>.js`: what [`tests/browser.mjs`](tests/browser.mjs) runs in the
  gallery page to check it: it returns nothing when it works, or what went wrong.

Then:

```sh
scripts/build.sh            # makes quillo-ui.qwe and demos.qwe from ui/ and demos/
scripts/test.sh [slug...]   # no class styled by two files, quillo check, then each test in headless Chrome
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
