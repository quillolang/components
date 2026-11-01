# Quillo UI

877 UI components for [Quillo](https://quillolang.org), each one `.qwe` file you
copy into your program: layout, typography, buttons, forms, sign-in, date pickers,
dialogs, navigation, tables, cards, media, commerce, finance (banking, loans,
co-operatives, forex), news (story headers, live blogs, election results, fact checks),
travel (flight search, seat maps, fare calendars, hotels, itineraries), blogging (post
headers, series, archives, a publish panel), a JSON table that exports to nine
formats, marketing, dashboard, social and scheduling pieces, 67 charts from bar
charts to candlesticks and a stock chart, 100 smart components that do real work in the
browser (a CSV importer, a spreadsheet, a cron builder, settling a group's debts, a
critical path, statistics), and 200 for phones and tablets, with real gestures, the
on-screen keyboard, safe areas and the phone's own hardware. They
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
use quillo-ui.qwe

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
import ui/theme.qwe use theme_css
import ui/button.qwe use Button
import ui/modal.qwe use Modal

route GET / = <html><head><style>{theme_css}</style></head><body class="ui-root">...</body></html>
```

Every component says what it takes from the others with `import` lines at its top:
`button.qwe` starts with `import ui/theme.qwe use ui_cls`, so the files it names come along
too, in a `ui/` folder beside your main file. They need a Quillo that has `import`, the
release after 0.6. `quillo-ui.qwe` has no such lines, being one file.

**With git.** Clone it, or add it as a submodule and keep it up to date:

```sh
git submodule add https://github.com/quillolang/components vendor/quillo-ui
```

```quillo
use vendor/quillo-ui/quillo-ui.qwe
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

877 components in 21 groups: 610 for pages, forms, apps, finance, news, travel and blogging, 200 for phones and tablets, and 67 charts,
from bar and line charts to candlesticks, an order book and a stock chart.

| Group | Components |
|---|---|
| Layout (36) | ActionBar, AppShell, AspectRatio, BentoGrid, BrowserFrame, Card, Carousel, Center, Cluster, Collapsible, Columns, Container, Cover, Divider, Dock, Fieldset, Footer, Grid, Inset, Masonry, MasterDetail, Navbar, PageHeader, Panel, Reel, ResizableBox, ScrollArea, Section, SidebarLayout, Spacer, Splitter, Stack, StackedLayout, Sticky, Switcher, Toolbar |
| Typography (26) | Abbr, Blockquote, BulletList, Callout, Caption, CheckList, CitationBuilder, DropCap, Eyebrow, Footnote, GradientText, Heading, InlineCode, Kbd, Lead, LineClamp, Link, Mark, MarkdownView, OrderedList, Prose, Pullquote, ReadMore, Text, TextCompare, Truncate |
| Actions (20) | BookmarkButton, Button, ButtonGroup, CopyButton, DownloadButton, DropdownMenu, Fab, FollowButton, IconButton, LikeButton, LoadMoreButton, MenuBar, PrintButton, ReactionPicker, ShareButton, SpeedDial, SplitButton, ThemeToggle, ToggleButton, VoteButtons |
| Forms (101) | AddressForm, AmountInput, AuthForm, Autocomplete, AutosaveForm, AvatarUpload, BarcodeInput, BirthdayInput, BranchingSurvey, CardInput, CharacterCounter, Checkbox, CheckboxCards, ChecklistInput, ChipGroup, CodeEditor, ColorContrast, ColorPicker, ColorSwatches, Combobox, ConsentCheckbox, ContactForm, ContactPaste, CountryPicker, CronBuilder, CurrencyInput, DatePicker, DateRangePicker, DateTimeInput, DependentSelect, DirtyFormGuard, DurationInput, EmailInput, EmailTypoInput, EmojiPicker, ExpressionInput, FileDrop, FileUpload, FilterBar, FontPicker, Form, FormActions, FormBuilder, FormField, FormRow, FormSummary, FormWizard, FuzzySelect, GuestPicker, IbanInput, IconPicker, ImagePicker, InlineEdit, KeyValueEditor, LanguagePicker, LikertScale, MarkdownEditor, MaskedInput, MentionInput, MinMaxInput, MonthPicker, MultiSelect, NaturalDateInput, NewsletterForm, NpsInput, NumberInput, OtpInput, PaletteBuilder, PasswordGenerator, PasswordInput, PasswordStrength, PhoneInput, Poll, ProfileForm, QuantityInput, RadioCards, RadioGroup, RangeSlider, Rating, RecurrencePicker, RegexTester, RichTextEditor, RuleForm, SearchInput, Select, SignaturePad, Slider, SlugInput, SortableList, Switch, TagInput, TextArea, TextField, TimeInput, TimeSlots, TimezonePicker, TransferList, UrlInput, UsernameInput, WeekPicker, YearPicker |
| Feedback (28) | Alert, Badge, Banner, Coachmark, ConnectionStatus, CookieConsent, Countdown, EmptyState, ErrorPage, InlineMessage, LoadingDots, LoadingOverlay, Meter, NewBadge, Notices, NotificationDot, Progress, ProgressRing, ResultPage, SaveStatus, Skeleton, SkeletonTable, SkeletonText, Snackbar, Spinner, StatusDot, Tooltip, UploadProgress |
| Overlays (20) | AlertDialog, ChatWidget, CommandPalette, ConfirmButton, Drawer, Flyout, FullscreenModal, HoverCard, Lightbox, Modal, NotificationCenter, Popover, PromptDialog, QuickView, SearchOverlay, ShareSheet, Sheet, ShortcutsDialog, SpotlightTour, Toast |
| Navigation (36) | Accordion, AlphabetIndex, BackToTop, BottomNav, Breadcrumbs, CollapsibleNav, ContextMenu, DirectoryNav, FilterTabs, FooterNav, IconTabs, JumpLinks, LanguageSwitcher, LinkList, MegaMenu, Menu, MobileNav, NavLink, NavSearch, NotificationBell, Pager, Pagination, ProgressNav, ScrollTabs, Scrollspy, SegmentedControl, SideNav, SitemapList, SkipLink, Steps, Subnav, TableOfContents, Tabs, TreeView, UserMenu, VerticalTabs |
| Data (84) | ActivityFeed, ArticleCard, AuditLog, Avatar, AvatarStack, Barcode, BoardingPass, BulkEditor, Changelog, ChatThread, CodeBlock, ComparisonTable, ContactCard, CsvImporter, CsvTable, DataGrid, DataList, DataProfiler, DataTable, DescriptionList, DiffView, DuplicateFinder, EditableTable, EmailPreview, ExpandableTable, FeedItem, FileList, FilePreview, FlowSteps, FolderGrid, FormulaGrid, GroupSummary, GroupedTable, IdCard, Invoice, JsonExportTable, JsonQuery, JsonTable, JsonViewer, KanbanBoard, KpiCard, Leaderboard, ListGroup, LogExplorer, LogViewer, MapView, MatchHighlight, MetricTrend, MilestoneList, MonthCalendar, NewsList, NotificationList, OrgChart, PivotTable, PriceBreakdown, ProfileCard, ProgressList, PropertyGrid, QrCode, QueryBuilder, RankingList, RatingSummary, Receipt, RecordCard, RecordMerger, ReviewCard, ReviewList, Roadmap, SchemaInferrer, Scorecard, SearchList, SelectableTable, Stat, StatGroup, Tag, TagCloud, TeamCard, TerminalOutput, TestimonialCard, Ticket, Timeline, TreeTable, VirtualList, VirtualTable |
| Charts (67) | AreaChart, BarChart, BollingerChart, BoxPlot, BrushChart, BubbleChart, BulletChart, BumpChart, CalendarHeatmap, CandlestickChart, ChartAdvisor, ChordDiagram, ComboChart, DepthChart, DonutChart, DotPlot, FunnelChart, GanttChart, GaugeChart, GroupedBarChart, HeatmapChart, HeikinAshiChart, Histogram, HorizontalBarChart, InteractiveLineChart, LineBreakChart, LineChart, LiveCandles, LollipopChart, MacdChart, MarimekkoChart, MarketHeatmap, NetworkGraph, OhlcChart, OrderBook, ParallelCoordinates, ParetoChart, PieChart, PnlChart, PolarAreaChart, PortfolioAllocation, PriceTicker, RadarChart, RadialBarChart, RangeChart, RealtimeChart, RenkoChart, RsiChart, SankeyChart, ScatterChart, SlopeChart, SmallMultiples, Sparkline, StackedBarChart, StepChart, StockChart, StreamGraph, SunburstChart, SymbolCard, TradeFeed, Treemap, TrendForecast, ViolinPlot, VolumeProfile, WaffleChart, Watchlist, WaterfallChart |
| Media (24) | AudioPlayer, CameraCapture, CoverImage, EmbedFrame, Figure, FileIcon, Icon, IconGrid, Image, ImageCompare, ImageCrop, ImageGallery, ImageHotspots, LogoCloud, Marquee, MediaCard, PdfViewer, Playlist, Thumbnail, Ticker, VideoPlayer, VolumeControl, YouTubeEmbed, ZoomImage |
| Commerce (35) | AddressCard, BestCoupon, BoxPacker, BundleBuilder, CartItem, CartSummary, CheckoutSteps, CouponInput, DeliveryEstimate, DiscountBadge, FreeShippingMeter, MarginCalc, MiniCart, OrderHistory, OrderTracker, PaymentMethods, PlanAdvisor, PlanToggle, Price, PriceTag, PricingCard, PricingTable, ProductCard, ProductConfigurator, ProductGallery, ProductGrid, ProrationCalc, ShippingOptions, SizeAdvisor, StockStatus, SubscriptionCard, TrustBadges, UnitPriceCompare, VariantPicker, WishlistButton |
| Finance (50) | AccountCard, AccountDetails, AccountPicker, AmortizationTable, AssemblyNotice, BankStatement, BillList, BillSplitter, BreakEvenCalc, BudgetPlanner, CardControls, CashCount, ChequeView, CollateralList, CompoundCalc, CoopBallot, CreditScore, CrossRates, CurrencyConverter, CurrencyPairCard, CurrencyStrength, CurrencyWallet, DebtPayoff, DividendStatement, FxPositions, FxQuoteTicket, FxRateTable, InvoiceBuilder, LoanApplicationSteps, LoanCalculator, LoanCommitteeQueue, LoanEligibility, LoanOffers, LoanSummary, MemberCard, MembershipApplication, PatronageRefundCalc, PayeeList, PaymentHistory, RateAlerts, RefinanceCalc, RemittanceQuote, RepaymentSchedule, SavingsGoal, SettleUp, ShareCapitalLedger, ShareCertificate, TaxBrackets, TransactionList, TransferForm |
| News (17) | AdSlot, ArticleHeader, BreakingNews, CorrectionNotice, ElectionResults, ExtractiveSummary, FactCheck, GiftArticle, HeadlineAnalyzer, KeyPoints, LiveBlog, MatchScore, NewsQuiz, PaywallMeter, SeatChart, SectionFront, WeatherStrip |
| Travel (16) | BaggageSelector, CarRentalCard, EntryRequirements, FareCalendar, FareOptions, FlightResult, FlightSearch, FlightStatus, HotelCard, LayoverTimeline, PackingList, RoomPicker, SeatMap, TourCard, TripBudget, TripItinerary |
| Blogging (19) | AuthorBio, Blogroll, ClapButton, FeedSubscribe, KeywordExtractor, PostArchive, PostHeader, PostStats, PostUpdates, PublishPanel, ReadabilityMeter, ReaderSettings, RelatedPosts, SeoAudit, SeoPreview, SeriesNav, ShareLinks, Sidenote, TextLint |
| Marketing (18) | AbTestCalc, AnnouncementBar, BlogList, CtaSection, Faq, FaqFinder, FeatureGrid, FeatureList, FunnelAnalyzer, Hero, HowItWorks, MailMerge, SampleSizeCalc, SocialLinks, StatsBand, TeamGrid, Testimonials, UtmBuilder |
| Dashboard (22) | AccessChecker, AlertRuleBuilder, AnomalyFinder, ApiKeyField, AutoInsights, CloudCostEstimator, CohortTable, DangerZone, DashboardGrid, DecisionMatrix, OnboardingChecklist, PermissionsMatrix, QuickActions, QuotaBar, RiskMatrix, ServerStatus, SessionList, SettingsSection, SloCalculator, TokenList, UsageMeter, Widget |
| Social (16) | ChatInput, Comment, CommentThread, Hashtag, MessageBubble, PostCard, PostComposer, ProfileHeader, RankedVote, Reactions, ReplyBox, StoryRing, TeamBalancer, TournamentBracket, TypingIndicator, UserBadge |
| Scheduling (23) | AgendaList, AvailabilityGrid, BookingSummary, BusinessDaysCalc, CriticalPath, DayView, EventCard, HabitTracker, OpeningHours, RelativeTime, RoundRobin, ShiftPlanner, SlotFinder, SpacedRepetition, SprintPlanner, Stopwatch, Timer, TimesheetGrid, TimezoneOverlap, WeekView, WorkloadView, WorldClock, YearCalendar |
| Mobile (200) | ActionSheet, ActivityRings, AdaptiveDialog, AlertInbox, AlphaRailList, AmountPad, AnchoredPopover, AppTabBar, ApprovalQueue, AssetLookup, BalanceCard, BatteryBadge, BillReminders, BoardingPassCard, BookSpread, BottomAppBar, BottomSheet, CalendarSheet, CardStack, CartSheet, ChatScreen, CheckoutSheet, CoachOverlay, CommentSheet, CompassDial, ComposerBar, ConfirmWithPin, ConflictSheet, ContactList, ContextPreview, ConversationList, DataSaverToggle, DateWheels, DefectReport, DevicePreview, DocumentCapture, DoubleTapLike, DownloadsList, DraftKeeper, DragBetweenPanes, DragReorder, EdgeDrawer, EmptyScreen, ErrorScreen, ExpandingRow, FilterChipsBar, FilterSheet, FocusTimer, FolderBrowser, ForceUpdate, FullscreenPicker, GalleryPicker, GeofenceStatus, GestureTutorial, GroupedList, HandwrittenNote, HapticButton, HoverCursorRow, InAppBanner, InfiniteFeed, InspectionForm, InspectorPanel, KeepAwakeToggle, KeyboardAvoider, KeyboardBar, KeyboardHud, KioskScreen, LargeTitleBar, LiveLocation, LocationButton, LongPressMenu, MapSheet, MarkupOverlay, MentionTray, MeterReading, MiniPlayer, NavRail, NavStack, NearbyList, NetworkStatus, NoteEditor, NotifyPrompt, NowPlaying, NumberPad, OfflineQueue, OneTimeCode, OrderStatusCard, PageDots, PayCode, PaywallSheet, PeekSheet, PendingUploads, PermissionChecklist, PhoneShell, PhoneSignIn, PhotoCapture, PhotoEditor, PhotoEvidence, PhotoGridSelect, PickList, PinDropper, PinPad, PinchZoomImage, PodcastQueue, PosRegister, ProfileScreen, ProfileSetup, ProofOfDelivery, PullDownMenu, PullToRefresh, QrPayCard, QrScanner, QuickAddBar, QuickSettingsGrid, QuickTransfer, RatePrompt, ReactionBar, ReceiptShare, ReminderPicker, ResponsiveSplit, ResumeRefresh, RetryBanner, RotationLayout, RouteSteps, SafeArea, ScanCount, ScanToAdd, ScrubBar, SearchHeader, SeatPickerSheet, SelectionMode, SendMoneyFlow, SettingsList, ShakeDetector, SheetSelect, ShiftClock, ShortVideoFeed, SizeClassView, SleepChart, SleepTimerSheet, SlideOver, SlideToConfirm, SnapCarousel, SpendingRing, SpiritLevel, SplashScreen, SplitView, StackedModal, StatusTint, StepperRow, StickyBuyBar, StickySectionFeed, StorageMeter, StoryCapture, StoryViewer, StylusCanvas, SwipeBack, SwipeDeck, SwipeDismissList, SwipeKanban, SwipeReply, SwipeRow, SwipeTabs, SwipeToast, SwipeViewer, SyncStatusBar, SyncedLyrics, TableFloorPlan, TabletSidebar, TabletToolbar, TaskRow, TextSizeSetting, ThemeSheet, ThreeColumnView, TicketWallet, TimeWheels, TopAppBar, TorchToggle, TouchChart, TransactionFeed, TransitBoard, TripTimeline, UnreadMarker, UpdatePrompt, VariantSheet, VideoCapture, VoiceMessage, VoiceNoteList, VoiceRecorder, WalletCard, WaterTracker, WaveformView, WeekStrip, WeightTrend, WelcomeCarousel, WhatsNewSheet, WheelPicker, WidgetGrid, WorkOrderCard, WorkoutTimer |
| Utilities (19) | AdaptiveQuiz, Confetti, Draggable, GradeCalculator, HttpRequestBuilder, IdleTimer, InfiniteScroll, JsonFormatter, JwtInspector, KeyboardShortcuts, LazyLoad, LiveAnnouncer, OfflineBanner, ReadingTime, RecipeScaler, ScrollProgress, TranslationChecker, UnitConverter, UrlInspector |

### Finding one

Every component has a group and tags. A tag is a category that cuts across the groups:
`forms` is on every input and button, `chart` on every chart, `no-js` on every view that
adds no JavaScript and `interactive` on every component that runs in the browser. The
most used: `interactive` (504), `no-js` (370), `mobile` (211), `forms` (176), `tablet` (151), `data` (128), `smart` (100), `list` (84), `chart` (80), `commerce` (68), `input` (64), `navigation` (63), `layout` (59), `card` (57), `finance` (52), `gesture` (48), `media` (44), `dashboard` (42), `text` (39), `button` (38), `feedback` (38), `social` (37), `keyboard` (37), `marketing` (36), `table` (34), `typography` (32).

The gallery and [quillolang.org/components](https://quillolang.org/components/) search
them by name, summary and tag, and filter by group and tags (`/?q=date`,
`/?tag=chart,trading`, `/?tag=finance,loans`); "/" goes to the search box.

### Files that need another

Each file starts with what it takes and an example. These need other files of the kit
beside them (their pages on the site list them in the download commands too):

- `bottom_sheet`, `card_stack`, `compass_dial`, `confirm_with_pin`, `document_capture`, `empty_screen`, `error_screen`, `form`, `haptic_button`, `live_location`, `location_button`, `notify_prompt`, `permission_checklist`, `photo_capture`, `photo_editor`, `photo_evidence`, `qr_scanner`, `scan_count`, `seat_picker_sheet`, `shake_detector`, `spirit_level`, `story_capture`, `text_size_setting`, `video_capture`, `voice_recorder`, `wallet_card`, `waveform_view`, `welcome_carousel`, `work_order_card` need `button.qwe`
- `article_card`, `blog_list`, `contact_card`, `contact_list`, `conversation_list`, `email_preview`, `feed_item`, `id_card`, `notification_list`, `org_chart`, `profile_card`, `review_card`, `team_card`, `team_grid`, `testimonial_card`, `testimonials` need `avatar.qwe`
- `balance_card`, `cart_item`, `cart_summary`, `discount_badge`, `mini_cart`, `order_history`, `price_tag`, `pricing_table`, `product_card`, `shipping_options`, `spending_ring`, `subscription_card`, `transaction_feed` need `price.qwe`
- `bill_reminders`, `cart_sheet`, `paywall_sheet`, `quick_transfer`, `receipt_share`, `scan_to_add`, `send_money_flow`, `sticky_buy_bar` need `button.qwe` and `price.qwe`
- `headline_analyzer`, `seo_audit`, `text_compare`, `text_lint`, `translation_checker` need `readability_meter.qwe`
- `action_sheet`, `adaptive_dialog`, `fullscreen_picker`, `stacked_modal` need `bottom_sheet.qwe` and `button.qwe`
- `defect_report`, `inspection_form`, `meter_reading`, `shift_clock` need `button.qwe` and `photo_evidence.qwe`
- `in_app_banner`, `peek_sheet`, `swipe_toast` need `bottom_sheet.qwe`
- `coach_overlay`, `force_update`, `profile_setup` need `button.qwe` and `welcome_carousel.qwe`
- `contact_paste`, `fuzzy_select`, `username_input` need `slug_input.qwe`
- `context_preview`, `pull_down_menu` need `action_sheet.qwe` and `bottom_sheet.qwe`
- `boarding_pass_card`, `ticket_wallet` need `barcode.qwe` and `qr_code.qwe`
- `checkout_sheet`, `variant_sheet` need `button.qwe`, `cart_sheet.qwe` and `price.qwe`
- `rate_prompt`, `whats_new_sheet` need `button.qwe`, `force_update.qwe` and `welcome_carousel.qwe`
- `pay_code`, `qr_pay_card` need `button.qwe`, `price.qwe` and `qr_code.qwe`
- `asset_lookup`, `pick_list` need `button.qwe` and `scan_count.qwe`
- `extractive_summary`, `keyword_extractor` need `copy_button.qwe` and `readability_meter.qwe`
- `icon_grid`, `quick_settings_grid` need `icon.qwe`
- `amount_pad`, `pin_pad` need `number_pad.qwe`
- `slot_finder`, `timezone_overlap` need `timezone_picker.qwe`
- `date_wheels`, `time_wheels` need `wheel_picker.qwe`
- `tablet_toolbar` needs `anchored_popover.qwe`
- `filter_sheet` needs `button.qwe` and `cart_sheet.qwe`
- `danger_zone` needs `button.qwe` and `confirm_button.qwe`
- `phone_sign_in` needs `button.qwe` and `phone_input.qwe`
- `proof_of_delivery` needs `button.qwe`, `photo_evidence.qwe`, `shift_clock.qwe` and `signature_pad.qwe`
- `palette_builder` needs `color_contrast.qwe`
- `comment_thread` needs `comment.qwe` and `reply_box.qwe`
- `comment_sheet` needs `composer_bar.qwe`
- `mention_tray` needs `composer_bar.qwe` and `fuzzy_select.qwe`
- `chat_screen` needs `composer_bar.qwe` and `message_bubble.qwe`
- `token_list` needs `confirm_button.qwe`
- `citation_builder` needs `copy_button.qwe`
- `speed_dial` needs `fab.qwe`
- `jwt_inspector` needs `json_formatter.qwe`
- `phone_shell` needs `keyboard_avoider.qwe`
- `read_more` needs `line_clamp.qwe`
- `search_list` needs `match_highlight.qwe`
- `unread_marker` needs `message_bubble.qwe`
- `nearby_list` needs `opening_hours.qwe`
- `pricing_card` needs `price_tag.qwe`
- `product_grid` needs `product_card.qwe`
- `rule_form` needs `regex_tester.qwe`
- `review_list` needs `review_card.qwe`
- `form_builder` needs `rule_form.qwe`
- `mini_player` needs `scrub_bar.qwe`
- `now_playing` needs `scrub_bar.qwe` and `sleep_timer_sheet.qwe`
- `handwritten_note` needs `stylus_canvas.qwe`
- `nav_stack` needs `swipe_back.qwe`
- `bottom_app_bar` needs `top_app_bar.qwe`

`map_view.qwe`, `map_sheet.qwe` and `pin_dropper.qwe` draw with [Leaflet](https://leafletjs.com),
which each takes with a `client` line, so a page loads it only where a map is shown. No other
file needs a library.

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
| 0 | 0.01 s | 0.01 s | 13 MB | 0.3 ms |
| 100 | 0.07 s | 0.14 s | 70 MB | 0.2 ms |
| 250 | 0.16 s | 0.32 s | 118 MB | 0.2 ms |
| 744 | 0.42 s | 1.09 s | 372 MB | 0.2 ms |
| 2976 | 1.89 s | 6.58 s | 1443 MB | 0.2 ms |

quillo 0.6.0 (378e64b, 2026-11-01), Apple M5, 16 GB, darwin arm64, 2026-11-01.
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
  an `import` line for each file it takes from, naming what it takes
  (`import ui/theme.qwe use ui_cls`), unquoted, and a `client` line for a browser library;
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
- For a phone or a tablet, the test's first line is `// mobile`, which runs it as a phone
  (390 by 844) and as a tablet (820 by 1180) with touch on, or `// tablet`, which runs it as a
  tablet upright and turned. Each size gets a tab of its own and the gallery shows only that
  component, at the device's full width. Real input comes from `tap`, `hold`, `drag`, `pinch`
  and `cdp`, which reaches Chrome itself (`Emulation.setGeolocationOverride`, say), and
  `device` says which it is. The page may not scroll sideways, and what can be pressed must be
  44 px each way, unless it has `data-small-target`. A demo that fills a screen puts it in a
  `<div.demo-phone>` or `<div.demo-tablet>`. These are Chrome's phone emulation: Safari's engine
  and a real phone are not tested.

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
