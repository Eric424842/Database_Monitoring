# PostgreSQL Dashboard - UI Overview

## 📋 Tổng Quan

Dashboard PostgreSQL được xây dựng với React + TypeScript, sử dụng **inline styles** (không dùng CSS framework) để tạo giao diện hiện đại, sạch sẽ và dễ sử dụng.

---

## 🗂️ Cấu Trúc Thư Mục UI Components

```
PostGre_24EndPoints_Setting/
├── client/
│   └── src/
│       ├── Dashboard.tsx              # Component chính, orchestrate các sections
│       ├── App.tsx                    # App component wrapper
│       ├── main.tsx                   # Entry point
│       ├── types.ts                   # TypeScript type definitions
│       ├── index.css                  # Global CSS styles
│       ├── App.css                    # App-specific styles
│       ├── contexts/                  # React Context providers
│       │   ├── DatabaseConnectionContext.tsx  # Database connection context
│       │   └── SettingsContext.tsx            # Settings context
│       │
│       ├── hooks/                     # Custom React hooks
│       │   ├── useDashboardData.ts    # Hook fetch data từ API
│       │   ├── useAutoRefresh.ts      # Hook auto-refresh với anti-throttle
│       │   ├── usePreset.ts           # Hook quản lý preset (localStorage)
│       │   └── useDatabaseConnections.ts  # Hook quản lý database connections
│       │
│       ├── components/                # UI Components
│       │   ├── cards/                # Metric cards (nhóm theo tab)
│       │   │   ├── Sessions/         # Tab Sessions metrics (6 cards)
│       │   │   │   ├── ActiveWaitingSessionsCard.tsx
│       │   │   │   ├── OldestIdleTransactionCard.tsx
│       │   │   │   ├── LongRunningCard.tsx
│       │   │   │   ├── WaitEventsCard.tsx
│       │   │   │   ├── TpsRollbackRateCard.tsx
│       │   │   │   └── PerDbCacheHitCard.tsx
│       │   │   ├── Locks/            # Tab Locks & Blocking metrics (6 cards)
│       │   │   │   ├── DeadlocksCard.tsx
│       │   │   │   ├── LocksCard.tsx
│       │   │   │   ├── LockSummaryCard.tsx
│       │   │   │   ├── WaitByLockModeCard.tsx
│       │   │   │   ├── LockOverviewPerDBCard.tsx
│       │   │   │   └── BlockedSessionsCard.tsx
│       │   │   ├── Performance/      # Tab Performance metrics (4 cards)
│       │   │   │   ├── IndexUsageCard.tsx
│       │   │   │   ├── SeqVsIdxScansCard.tsx
│       │   │   │   └── TableSizesCard.tsx
│       │   │   └── Maintenance/      # Tab Maintenance metrics (2 cards)
│       │   │       ├── AutovacuumCard.tsx
│       │   │       └── DeadTuplesAutovacuumCard.tsx
│       │   │
│       │   ├── panel/                # Panel components (full-width panels)
│       │   │   └── AdvicePanel.tsx   # Advice & recommendations panel
│       │   │
│       │   ├── sections/             # Section components (full sections)
│       │   │   ├── OverviewSection.tsx      # Overview section với 4 cards
│       │   │   └── TempIOAndCheckpointSection.tsx  # Temp IO & Checkpoint section
│       │   │
│       │   └── ui/                   # UI utility components
│       │       ├── Dashboard/        # Dashboard-specific components
│       │       │   ├── DashboardHeader.tsx      # Header với controls
│       │       │   └── MetricsTabs.tsx          # Tab navigation system
│       │       ├── Layout/           # Layout/Page components
│       │       │   └── DatabaseSelector.tsx     # Selector chọn database
│       │       ├── Modals/           # Modal components
│       │       │   ├── AddDatabaseForm.tsx      # Form thêm database connection
│       │       │   └── SettingsModal.tsx        # Settings modal component
│       │       └── Shared/           # Shared/Reusable UI components
│       │           ├── ErrorDisplay.tsx         # Error display component
│       │           └── MetricTooltip.tsx        # Tooltip component cho metrics
│       │
│       └── utils/                    # Utility functions
│           ├── styles.ts             # Style constants (th, td, cardStyle, etc.)
│           ├── formatters.ts         # Format helpers (dates, numbers, percents)
│           ├── export.ts             # Export utilities (CSV, JSON, clipboard)
│           ├── i18n.ts               # Internationalization utilities
│           └── themeStyles.ts        # Theme styling utilities
│
└── [server files không liên quan đến UI]
```

### Mô Tả Các Thư Mục:

#### 📁 `contexts/`
React Context providers để chia sẻ state toàn cục:
- **DatabaseConnectionContext**: Quản lý database connection hiện tại và danh sách connections
- **SettingsContext**: Quản lý settings/toàn cục của ứng dụng

#### 📁 `hooks/`
Custom React hooks để quản lý state và side effects:
- **useDashboardData**: Fetch tất cả data từ API, quản lý loading/error states
- **useAutoRefresh**: Tự động refresh data theo interval, có anti-throttle
- **usePreset**: Lưu/load preset từ localStorage (minSec, auto-refresh settings)
- **useDatabaseConnections**: Quản lý database connections (thêm, xóa, chọn connection)

#### 📁 `components/cards/`
Metric cards - hiển thị metrics dạng card với table, được nhóm theo tab:
- **Sessions/** (6 cards): ActiveWaitingSessions, OldestIdleTransaction, LongRunning, WaitEvents, TpsRollbackRate, PerDbCacheHit
- **Locks/** (6 cards): Deadlocks, Locks, LockSummary, WaitByLockMode, LockOverviewPerDB, BlockedSessions
- **Performance/** (4 cards): Cache Hit % (compact), IndexUsage, SeqVsIdxScans, TableSizes
- **WALCheckpointIO/** (4 cards): WALThroughput, Checkpoints, TempFiles, DatabaseSizes
- **Maintenance/** (2 cards): Autovacuum, DeadTuplesAutovacuum
- Mỗi card tương ứng với một metric/endpoint
- Có export buttons (CSV/JSON) nếu cần
- Có tooltip và badge cảnh báo
- Style: border, border-radius, padding

#### 📁 `components/panel/`
Panel components - full-width panels:
- **AdvicePanel**: Hiển thị recommendations dựa trên metrics

#### 📁 `components/sections/`
Section components - full sections với multiple cards:
- **OverviewSection**: Section tổng quan với 4 cards (grid layout)
- **TempIOAndCheckpointSection**: Section hiển thị Temp IO và Checkpoint metrics
- **Lưu ý**: LongRunningSection đã được chuyển thành LongRunningCard trong cards/Sessions/

#### 📁 `components/ui/`
UI utility components - được tổ chức theo chức năng:
- **Dashboard/**: Components dành cho Dashboard
  - **DashboardHeader**: Header với title, controls, buttons
  - **MetricsTabs**: Tab navigation system (4 tabs) với grid layout responsive
- **Layout/**: Layout/Page components
  - **DatabaseSelector**: Selector chọn database connection (màn hình đầu tiên)
- **Modals/**: Modal components
  - **AddDatabaseForm**: Form để thêm database connection mới
  - **SettingsModal**: Modal component cho settings (theme, language)
- **Shared/**: Shared/Reusable UI components
  - **ErrorDisplay**: Component hiển thị lỗi
  - **MetricTooltip**: Tooltip component với icon "?" và popup

#### 📁 `utils/`
Utility functions:
- **styles.ts**: Style constants được dùng chung (th, td, cardStyle, sectionStyle)
- **formatters.ts**: Format functions (formatDate, formatDuration, formatPercent, formatBytes)
- **export.ts**: Export functions (exportToCSV, exportToJSON, copyToClipboard)
- **i18n.ts**: Internationalization utilities (translation functions)
- **themeStyles.ts**: Theme styling utilities (dark/light mode support)

### Component Hierarchy:

```
Dashboard (main)
├── DashboardHeader
│   ├── Min Seconds Input
│   ├── Auto-refresh Toggle & Interval
│   └── Refresh Button
│
├── ErrorDisplay (if error)
│
├── OverviewSection
│   ├── Alerts Bar (if alerts)
│   └── Grid Cards (4)
│       ├── Connections Card (+ MetricTooltip)
│       ├── Connection Usage Card (+ MetricTooltip + Badge)
│       ├── Cache Hit Card (+ MetricTooltip + Badge)
│       └── Stability Card (+ MetricTooltip + Badge)
│
├── MetricsTabs
│   ├── Tab Navigation (6 tabs)
│   └── Tab Content
│       ├── Tab: Sessions (👥)
│       │   ├── ActiveWaitingSessionsCard
│       │   ├── OldestIdleTransactionCard
│       │   ├── LongRunningCard (có export buttons)
│       │   ├── WaitEventsCard
│       │   ├── TpsRollbackRateCard
│       │   └── PerDbCacheHitCard
│       │
│       ├── Tab: Locks & Blocking (🔒)
│       │   ├── DeadlocksCard
│       │   ├── LocksCard
│       │   ├── LockSummaryCard
│       │   ├── WaitByLockModeCard
│       │   ├── LockOverviewPerDBCard
│       │   └── BlockedSessionsCard
│       │       ├── Export Buttons
│       │       └── Table (+ Copy Full buttons)
│       │
│       ├── Tab: Performance (⚡)
│       │   ├── Cache Hit % Card
│       │   ├── IndexUsageCard
│       │   ├── SeqVsIdxScansCard
│       │   │   ├── Export Buttons
│       │   │   └── Table
│       │   └── TableSizesCard
│       │       ├── Export Buttons
│       │       └── Table
│       │
│       ├── Tab: Maintenance (🧹)
│       │   ├── AutovacuumCard
│       │   └── TempIOAndCheckpointSection
│       │       └── DeadTuplesAutovacuumCard
│       │
│       ├── Tab: WAL / Checkpoint / I/O (💾)
│       │   ├── WALThroughputCard
│       │   ├── CheckpointsCard
│       │   ├── TempFilesCard (50% width)
│       │   └── DatabaseSizesCard (50% width)
│       │
│       └── Tab: Phát Hiện Vấn Đề (🔍) - **Tab mặc định**
│           └── ProblemDetectionTab
│               ├── Filtering Tabs (All, Read-Path, Write-Path)
│               ├── Loading State
│               ├── Error State
│               └── Problems List (grouped by priority)
│                   ├── High Priority (red)
│                   ├── Medium Priority (orange)
│                   ├── Low Priority (yellow)
│                   └── Info Priority (blue)
```

### Data Flow:

```
API (server)
    ↓
useDashboardData hook
    ↓
Dashboard component
    ↓
├── OverviewSection (overview, connectionUsage, deadlocks)
└── MetricsTabs (tất cả metrics + Problem Detection)
```

### State Management:

- **Local State**: useState trong các components
- **Custom Hooks**: 
  - useDashboardData: quản lý data fetching
  - usePreset: localStorage cho preset
  - useAutoRefresh: quản lý auto-refresh interval

---

## 🎨 Layout Tổng Quan

### Cấu Trúc Chính

```
┌─────────────────────────────────────────────────┐
│  Dashboard Header (Fixed)                       │
│  - Title, Controls, Auto-refresh                │
├─────────────────────────────────────────────────┤
│  Overview Section (Grid Cards)                  │
│  - Connections, Cache Hit, Connection Usage      │
├─────────────────────────────────────────────────┤
│  Metrics Tabs (6 tabs)                          │
│  ┌───────────────────────────────────────────┐ │
│  │ Phát Hiện Vấn Đề | Sessions | Locks | ... │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │         Tab Content (Cards/Tables)        │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Container
- **Max Width:** 1200px
- **Padding:** 16px
- **Margin:** 0 auto (centered)
- **Font:** system-ui, sans-serif

---

## 🎯 Dashboard Header

### Vị Trí: Top của page

### Components:
1. **Title:** "PostgreSQL Dashboard" (24px, bold)
2. **Controls Container** (flex, gap: 12px):
   - **Min Seconds Input**
     - Label: "Min seconds:"
     - Input: number, min=1, width=90px
     - Border: 1px solid #ddd, border-radius: 4px
   
   - **Auto-refresh Toggle**
     - Checkbox + label "Auto-refresh"
     - Background: #e3f2fd (enabled) / #f7f7f7 (disabled)
     - Dropdown interval: 10s / 30s / 60s (chỉ hiện khi enabled)
     - Border: 1px solid #ddd, border-radius: 8px
   
   - **Refresh Button**
     - Background: #f7f7f7
     - Border: 1px solid #ddd
     - Border-radius: 8px

### Style:
- **Display:** flex
- **Justify-content:** space-between
- **Align-items:** center
- **Margin-bottom:** 16px

---

## 📊 Overview Section

### Vị Trí: Ngay sau header

### Layout: Grid (auto-fit, minmax(280px, 1fr)), gap: 16px

### Cards (4 cards):

#### 1. 🔌 Connections Card
- **Title:** "Connections" với tooltip (?)
- **Content:** Danh sách connections by state
  - Format: `state: count`
  - Border-bottom: dashed #f0f0f0 giữa các dòng
  - Footer: "Tổng: X | Active: Y"

#### 2. 📈 Connection Usage Card
- **Title:** "Connection Usage" với badge cảnh báo (nếu > 80%)
  - Badge: "⚠ High" (orange) hoặc "🔴 High" (red nếu > 90%)
- **Content:**
  - Value: 28px, bold (ví dụ: "25.0%")
  - Label: 13px, gray (ví dụ: "25 / 100 connections")

#### 3. 💾 Cache Hit Card
- **Title:** "Cache Hit" với badge cảnh báo (nếu < 95%)
  - Badge: "⚠ Low" (orange) hoặc "🔴 Low" (red nếu < 90%)
- **Content:**
  - Value: 28px, bold (ví dụ: "99.5%")
  - Label: "Hiệu suất cache"

#### 4. 🔒 Stability Card
- **Title:** "Stability" với badge "🔴 Alert" nếu có deadlocks
- **Content:**
  - Label: "Deadlocks"
  - Value: 20px, bold
  - Color: #c62828 (nếu > 0) hoặc #4caf50 (nếu = 0)

### Alerts Bar (nếu có cảnh báo):
- **Background:** #fff3cd
- **Border:** 1px solid #ffc107
- **Padding:** 12px
- **Border-radius:** 8px
- **Content:** "⚠ Cảnh báo:" + các badge alerts

### Card Style:
- **Border:** 1px solid #e0e0e0
- **Border-radius:** 12px
- **Padding:** 16px
- **Background:** #fff
- **Box-shadow:** 0 1px 3px rgba(0,0,0,0.1)

---

## 📑 Metrics Tabs System

### Vị Trí: Sau Overview Section

### Tab Navigation:
- **Layout:** flex, gap: 8px
- **Border-bottom:** 2px solid #e0e0e0
- **Tabs:** 6 tabs với icons (theo thứ tự hiển thị)
  1. 👥 Sessions
  2. 🔒 Locks & Blocking
  3. ⚡ Performance
  4. 🧹 Maintenance
  5. 💾 WAL / Checkpoint / I/O
  6. 🔍 Phát Hiện Vấn Đề (Problem Detection) - **Tab mặc định (active khi load)**

### Tab Button Style:
- **Padding:** 12px 20px
- **Font-size:** 14px
- **Active:**
  - Font-weight: 600
  - Color: #1976d2
  - Border-bottom: 3px solid #1976d2
- **Inactive:**
  - Font-weight: 400
  - Color: #666
  - Border-bottom: 3px solid transparent
- **Border-radius:** 4px 4px 0 0 (top corners)
- **Transition:** all 0.2s

### Tab Content:
- **Padding:** 16px 0
- **Layout:** Grid layout với responsive design
  - `display: "grid"`
  - `gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))"`
  - `gap: 16px`
  - Tự động điều chỉnh số cột theo màn hình (responsive)
  - Cards có thể chiếm 1 cột (50%) hoặc full width (100%) tùy vào `gridColumn`

---

## 📋 Tab: Sessions 👥

### Layout:
- **Grid Layout:** Tất cả cards chiếm 100% width (full width)
- Mỗi card được bọc trong `div` với `gridColumn: "1 / -1"`

### Components (theo thứ tự):

#### 1. Active vs Waiting Sessions Card
- **Title:** "Active vs Waiting Sessions" với tooltip
- **Layout:** Grid 4 columns (Active, Waiting, Idle, Total)
- **Display:** Số lượng sessions với màu sắc cảnh báo (⚠ nếu waiting > 0)

#### 2. Oldest Idle-in-Transaction Card
- **Title:** "Oldest Idle-in-Transaction (top 10)" với tooltip
- **Table:**
  - Columns: Database, PID, User, State, Idle Duration, Current Query
  - Hiển thị message "✓ Không có session..." nếu không có data

#### 3. Long-running Queries Card
- **Title:** "Long-running queries (≥ Xs)" với tooltip
- **Export Buttons:** 📥 CSV, 📥 JSON (chỉ hiện khi có data)
- **Table:**
  - Columns: PID, User, DB, State, Duration (s), Started At, Query
  - Query column: max-width 500px, code style, word-break
  - Overflow-x: auto

#### 4. Wait Events Card
- **Title:** "Wait Events (top 20)" với tooltip
- **Table:**
  - Columns: PID, User, DB, State, Wait Event Type, Wait Event, Duration, Sample Query
  - Overflow-x: auto

#### 5. TPS & Rollback Rate Card
- **Title:** "TPS & Rollback Rate" với tooltip
- **Table:**
  - Columns: Database, Commits, Rollbacks, TPS, Rollback %, Stats Reset
  - Cảnh báo (⚠) nếu Rollback % > 5%

#### 6. Per-DB Cache Hit % Card
- **Title:** "Per-Database Cache Hit %" với tooltip
- **Table:**
  - Columns: Database, Cache Hit %, Blocks Hit, Blocks Read
  - Cảnh báo (⚠ Low) nếu Cache Hit % < 95%

---

## 🔒 Tab: Locks & Blocking

### Layout:
- **Grid Layout:** Grid 2 cột responsive
- **Card nhỏ (50% width):** DeadlocksCard, LocksCard, LockSummaryCard
- **Card lớn (100% width):** WaitByLockModeCard, LockOverviewPerDBCard, BlockedSessionsCard (bọc trong `gridColumn: "1 / -1"`)

### Components (theo thứ tự):

#### 1. Deadlocks Card
- **Title:** "Deadlocks" với badge "🔴 Alert" nếu > 0
- **Table:** datname, deadlocks
- **Width:** 50% (1 cột trong grid)

#### 2. Locks Card
- **Title:** "Locks by Mode"
- **Table:** mode, count
- **Width:** 50% (1 cột trong grid)

#### 3. Lock Summary Card
- **Title:** "Lock Summary (Granted vs Waiting)"
- **Table:** mode, granted, waiting
- **Width:** 50% (1 cột trong grid)

#### 4. Wait by Lock Mode Card
- **Title:** "Wait by Lock Mode" với badge "⚠ Waiting" nếu có waiting locks
- **Table:**
  - Columns: Lock Type, Mode, Waiting, Held
  - Cảnh báo (⚠) nếu Waiting > 0
- **Width:** 100% (full width)

#### 5. Lock Overview per Database Card
- **Title:** "Lock Overview per Database" với badge "⚠ Waiting" nếu có waiting locks
- **Table:**
  - Columns: Database, Waiting, Held, Total
  - Hiển thị % waiting trong Total nếu có waiting locks
  - Cảnh báo (⚠) nếu Waiting Locks > 0
- **Width:** 100% (full width)

#### 6. Blocked Sessions Card
- **Title:** "Blocked Sessions (top 20)" với badge "⚠ High"
- **Export Buttons:** 📥 CSV, 📥 JSON
- **Table:**
  - Columns: Blocked PID, Blocked User, Blocking PID, Blocking User, Blocked State, Blocking State, Duration, Blocked Query, Blocking Query
  - Query columns: max-width 300px
  - "Copy Full" button nếu query > 150 chars
- **Width:** 100% (full width)

---

## ⚡ Tab: Performance

### Layout:
- **Grid Layout:** Grid 2 cột responsive
- **Cache Hit % Card:** 100% width, compact layout (flex ngang: title bên trái, value bên phải)
- **Database Sizes Card:** 100% width, compact (padding giảm, chỉ hiển thị database đang connect)
- **Index Usage Card:** 100% width
- **Các card khác:** 100% width

### Components (theo thứ tự):

#### 1. Cache Hit % Card
- **Title:** "Cache Hit %"
- **Layout:** Flex ngang (title bên trái, value bên phải)
- **Value:** 32px, bold (ví dụ: "99.5%")
- **Width:** 100% (full width)
- **Style:** Compact với padding 12px 16px

#### 2. Index Usage Card
- **Title:** "Index Usage (top 10)" với badge "⚠ Low" nếu usage < 50%
- **Table:** schemaname, relname, idx_scan, seq_scan, idx_usage (%)
- **Width:** 100% (full width)

#### 3. Sequential vs Index Scans Card
- **Title:** "Sequential vs Index Scans (top 20)"
- **Export Buttons:** 📥 CSV, 📥 JSON
- **Table:** schemaname, relname, seq_scan, idx_scan, idx_usage_percent, n_live_tup

#### 4. Table Sizes Card
- **Title:** "Table Sizes (top 10)"
- **Export Buttons:** 📥 CSV, 📥 JSON
- **Table:** schemaname, relname, total_size, table_size, index_size

---

## 💾 Tab: WAL / Checkpoint / I/O

### Layout:
- **Grid Layout:** Grid responsive
- **WAL Throughput & Checkpoints:** 100% width (full width)
- **Temp Files & Database Sizes:** 50% width mỗi card (cùng 1 hàng)

### Components (theo thứ tự):

#### 1. WAL Throughput Card
- **Title:** "WAL Throughput (PG13+)" với tooltip
- **Table:** Metric, Value (key-value format)
- **Fields:** WAL Records, WAL FPI, WAL Bytes, WAL Bytes/sec, Stats Reset
- **Width:** 100% (full width)

#### 2. Checkpoints Card
- **Title:** "Checkpoints & bgwriter" với tooltip
- **Table:** Metric, Value (key-value format)
- **Fields:** Timed Checkpoints, Requested Checkpoints, Checkpoints Done, Write Time (ms), Sync Time (ms), Buffers Written, SLRU Written, Stats Reset
- **Width:** 100% (full width)

#### 3. Temp Files Card
- **Title:** "Temp Files / Bytes per DB" với tooltip
- **Table:** Database, Temp Files, Temp Bytes
- **Filter:** Chỉ hiển thị database đang connect (filter theo `currentDatabase`)
- **Width:** 50% (cùng hàng với Database Sizes)

#### 4. Database Sizes Card
- **Title:** "Database Sizes (đối chiếu tăng trưởng)" với tooltip
- **Table:** Database, Size
- **Filter:** Chỉ hiển thị database đang connect (filter theo `currentDatabase`)
- **Width:** 50% (cùng hàng với Temp Files)

---

## 🧹 Tab: Maintenance

### Components (theo thứ tự):

#### 1. Autovacuum Card
- **Title:** "Autovacuum & Dead Tuples (top 10)"
- **Table:** schemaname, relname, n_live_tup, n_dead_tup, last_autovacuum, last_vacuum

#### 2. TempIOAndCheckpoint Section
- **Sub-components:**
  - **Dead Tuples & Autovacuum Count Card**
    - Title: "Dead Tuples & Autovacuum Count"
    - Table: schema, table, dead_percent, autovacuum_count, vacuum_count
    - Columns alignment: Dead %, AutoVac Count, Vacuum Count are center-aligned

---

## 🔍 Tab: Phát Hiện Vấn Đề (Problem Detection)

### Vị Trí: Tab cuối cùng trong MetricsTabs (mặc định active khi load)

### Layout:
- **Full Width:** Card chiếm 100% width
- **Filtering Tabs:** 3 tabs để lọc vấn đề theo đường dẫn (All, Read-Path, Write-Path)
- **Grouped by Priority:** Hiển thị theo mức độ ưu tiên

### Components:

#### 1. Problem Detection Tab
- **Title:** "🔍 Phát Hiện Vấn Đề"
- **Data Source:** `/api/problems?minSec={minSec}`
- **Auto-refresh:** Tự động refresh khi dashboard refresh

#### 2. Filtering Tabs (Path Filter)
- **Layout:** Flex container với border-bottom
- **Tabs:**
  1. **All** (📊): Hiển thị tất cả vấn đề (Read-Path + Write-Path + Neutral)
  2. **Read-Path** (📖): Chỉ hiển thị vấn đề liên quan đến đọc (cache, index, read I/O...)
  3. **Write-Path** (✍️): Chỉ hiển thị vấn đề liên quan đến ghi (locks, WAL, autovacuum...)
- **Tab Style:**
  - **Active:** Font-weight 600, color primary blue, border-bottom 3px solid
  - **Inactive:** Font-weight 400, color secondary gray, border-bottom transparent
  - **Badge Count:** Hiển thị số lượng vấn đề cho mỗi tab (chỉ hiện khi > 0)
  - **Hover Effect:** Color thay đổi khi hover (inactive tabs)

#### 3. Problems List (Grouped by Priority)
- **High Priority (🔴 Red)**
  - Background: #ffebee
  - Border: 1px solid #c62828
  - Color: #c62828
  
- **Medium Priority (🟠 Orange)**
  - Background: #fff3e0
  - Border: 1px solid #e65100
  - Color: #e65100
  
- **Low Priority (🟡 Yellow)**
  - Background: #fffde7
  - Border: 1px solid #f57f17
  - Color: #f57f17
  
- **Info Priority (🔵 Blue)**
  - Background: #e3f2fd
  - Border: 1px solid #1976d2
  - Color: #1976d2

#### 3. Problem Card Structure:
- **Category Badge:** Hiển thị danh mục (Connection, Performance, etc.)
- **Title:** Tên vấn đề (bold)
- **Message:** Mô tả chi tiết
- **Action:** Gợi ý hành động
- **Current Value & Threshold:** Hiển thị giá trị hiện tại và ngưỡng
- **Detected At:** Thời điểm phát hiện

#### 4. Empty State:
- **Message:** "✓ Không có vấn đề nào được phát hiện"
- **Style:** Color: #4caf50, font-size: 14px

#### 5. Loading State:
- **Message:** "Đang phân tích..."
- **Style:** Color: #666

#### 6. Error State:
- **Message:** Hiển thị lỗi từ API
- **Style:** Color: #c62828

---

## 🎨 Màu Sắc & Style Guide

### Màu Chính:
- **Primary Blue:** #1976d2
- **Success Green:** #4caf50, #2e7d32
- **Error Red:** #d32f2f, #c62828
- **Warning Orange:** #f57c00, #e65100
- **Info Blue:** #2196f3

### Background Colors:
- **Card Background:** #fff
- **Disabled Background:** #f7f7f7
- **Enabled Auto-refresh:** #e3f2fd
- **Success Button:** #e8f5e9
- **Info Panel:** #e3f2fd
- **Warning Panel:** #fff3cd
- **Error Panel:** #ffebee
- **Light Gray:** #fafafa, #f5f5f5

### Border Colors:
- **Default:** #e0e0e0, #eee
- **Dashed:** #f0f0f0
- **Input:** #ddd, #ccc

### Text Colors:
- **Primary:** #333
- **Secondary:** #666
- **Tertiary:** #888, #999

### Border Radius:
- **Cards:** 12px
- **Buttons:** 8px (large), 6px (small), 4px (badges)
- **Input:** 4px

### Typography:
- **H1:** 24px, bold (600-700)
- **H2:** 18px, bold (600)
- **H3:** 16px, bold (600)
- **Body:** 14px
- **Small:** 12px, 13px
- **Large Value:** 28px, 36px (metrics)

### Spacing:
- **Gap (flex/grid):** 8px, 12px, 16px
- **Padding:**
  - Cards: 16px
  - Buttons: 8px 12px (large), 6px 12px (small)
  - Inputs: 6px 8px
- **Margin:**
  - Section: 24px (top)
  - Card: 16px (bottom)

---

## 🔧 Component Styles

### Table Styles:

#### Table Header (th):
```css
border-bottom: 1px solid #eee
padding: 12px 0
font-weight: 600
```

#### Table Cell (td):
```css
padding: 12px 0
border-bottom: 1px dashed #f0f0f0
vertical-align: top
```

#### Table Container:
```css
width: 100%
border-collapse: collapse
overflow-x: auto (container)
min-width: 800px-1200px (tùy table)
```

### Card Style:
```css
border: 1px solid #eee
border-radius: 12px
padding: 16px
```

### Badge Styles:

#### Alert Badge (Red):
```css
background: #ffebee
color: #c62828
padding: 4px 8px
border-radius: 4px
font-size: 12px
font-weight: 600
```

#### Warning Badge (Orange):
```css
background: #fff3e0
color: #e65100
padding: 4px 8px
border-radius: 4px
font-size: 12px
font-weight: 600
```

### Button Styles:

#### Primary Button:
```css
padding: 8px 12px
border: 1px solid #ddd
border-radius: 8px
cursor: pointer
background: #f7f7f7
font-weight: 500
```

#### Export CSV Button:
```css
padding: 6px 12px
border: 1px solid #4caf50
border-radius: 6px
background: #e8f5e9
color: #2e7d32
font-size: 13px
font-weight: 500
```

#### Export JSON Button:
```css
padding: 6px 12px
border: 1px solid #2196f3
border-radius: 6px
background: #e3f2fd
color: #1976d2
font-size: 13px
font-weight: 500
```

---

## 💡 Metric Tooltip

### Vị Trí: Icon "?" bên cạnh metric title

### Style:
- **Icon:**
  - Size: 18x18px
  - Border-radius: 50%
  - Border: 1px solid #2196f3
  - Background: #e3f2fd
  - Color: #2196f3
  - Font-weight: bold
  - Cursor: help

### Tooltip Popup:
- **Position:** absolute, bottom: 100%, centered
- **Background:** #fff
- **Border:** 1px solid #ddd
- **Border-radius:** 8px
- **Box-shadow:** 0 4px 12px rgba(0,0,0,0.15)
- **Min-width:** 280px
- **Max-width:** 350px
- **Padding:** 12px
- **Font-size:** 13px
- **Line-height:** 1.6
- **Z-index:** 1000

### Content Structure:
1. **Title:** Bold, 14px, margin-bottom: 6px
2. **Description:** Gray, margin-bottom: 8px
3. **Good Value:** Green (#4caf50), bold
4. **Warning Value:** Orange (#f57c00), bold
5. **Additional Info:** Gray, small, border-top

### Arrow:
- Bottom triangle (rotated square) với border

---

## 🎯 Tính Năng Tương Tác

### 1. Auto-refresh
- **Toggle:** Checkbox
- **Interval Dropdown:** 10s / 30s / 60s (chỉ hiện khi enabled)
- **Visual Feedback:** Background thay đổi khi enabled
- **Behavior:** Tự động refresh khi tab active (Page Visibility API)

### 2. Manual Refresh
- **Button:** "Refresh"
- **Action:** Reload tất cả data

### 3. Export
- **Formats:** CSV (UTF-8 BOM), JSON
- **Sections có Export:**
  - Long-running queries
  - Blocked Sessions
  - Sequential vs Index Scans
  - Table Sizes

### 5. Copy Full Query
- **Button:** "Copy Full" (chỉ hiện khi query > 150 chars)
- **Action:** Copy toàn bộ query vào clipboard
- **Feedback:** Alert message

### 6. Tab Navigation
- **Click:** Chuyển tab
- **Visual:** Border-bottom active, font-weight change
- **Default Tab:** "Phát Hiện Vấn Đề" (Problem Detection) là tab mặc định khi load dashboard
- **Thứ tự tabs:** Sessions → Locks & Blocking → Performance → Maintenance → WAL/Checkpoint/I/O → Phát Hiện Vấn Đề

### 7. Problem Detection
- **Filtering Tabs:** 3 tabs (All, Read-Path, Write-Path) để lọc vấn đề theo đường dẫn
- **Auto-refresh:** Tự động refresh khi dashboard refresh
- **Grouping:** Hiển thị theo mức độ ưu tiên (High → Medium → Low)
- **Problem Count:** Badge hiển thị số lượng vấn đề cho mỗi tab
- **Tooltip:** Giải thích chi tiết về từng vấn đề
- **Action Suggestions:** Mỗi vấn đề có gợi ý hành động cụ thể
- **Path Classification:** Mỗi vấn đề được phân loại theo đường dẫn (read/write/neutral)

---

## 📱 Responsive Design

### Grid Layout System:
- **Tab Content Grid:** 
  - `display: "grid"`
  - `gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))"`
  - `gap: 16px`
  - Tự động điều chỉnh số cột theo màn hình:
    - Màn hình lớn (1600px+) → 4 cột
    - Màn hình vừa (1200px) → 3 cột
    - Màn hình nhỏ (800px) → 2 cột
    - Màn hình rất nhỏ (600px) → 1 cột
- **Card Width Control:**
  - Card nhỏ: Tự động chiếm 1 cột (50% trong grid 2 cột)
  - Card lớn: Bọc trong `div` với `gridColumn: "1 / -1"` để chiếm 100% width

### Layout:
- **Overview Grid:** auto-fit, minmax(280px, 1fr) - tự động wrap
- **Tab Buttons:** flex-wrap - wrap khi không đủ chỗ
- **Header Controls:** flex-wrap - wrap khi không đủ chỗ

### Tables:
- **Overflow-x:** auto - scroll ngang khi cần
- **Min-width:** Đảm bảo table không bị nén quá nhỏ

### Max Container Width:
- **1200px** - giới hạn độ rộng tối đa, centered

---

## 🔍 Error Display

### Component: ErrorDisplay

### Style:
- **Background:** #f8d7da
- **Border:** 1px solid #dc3545
- **Border-radius:** 8px
- **Padding:** 16px
- **Color:** #721c24
- **Margin:** 16px 0

### Content:
- **Title:** "❌ Error"
- **Message:** Error message từ API
- **Details:** Error details (nếu có)

---

## 🎨 Visual Indicators

### Loading State:
- **Text:** "Loading…"
- **Style:** Simple paragraph, color: #666

### Empty State:
- **Text:** "Không có..." (tùy section)
- **Style:** Color: #666, font-size: 13px

### Badge Colors:
- **🔴 High/Critical:** Red (#c62828, #d32f2f)
- **⚠ Warning:** Orange (#e65100, #f57c00)
- **✅ Good:** Green (#4caf50, #2e7d32)
- **🔵 Info:** Blue (#1976d2)

---

## 📝 Notes

- Tất cả styles được inline trong components (không dùng CSS file riêng)
- Sử dụng TypeScript types cho tất cả props
- Responsive với CSS Grid và Flexbox
- **Grid Layout System:** Tất cả tabs sử dụng grid layout với `repeat(auto-fit, minmax(400px, 1fr))` để tự động responsive
- **Card Width Control:** Sử dụng `gridColumn: "1 / -1"` để điều chỉnh width của cards (50% hoặc 100%)
- **DatabaseSizesCard:** Filter chỉ hiển thị database đang connect (truyền `currentDatabase` prop từ Dashboard)
- Tooltip sử dụng hover state (onMouseEnter/Leave)
- Export sử dụng Blob API và download
- Auto-refresh có anti-throttle (không refresh khi đang loading)
- **UI Components Organization:** Components trong `ui/` được tổ chức theo chức năng: Dashboard/, Layout/, Modals/, Shared/
- **Problem Detection Tab:** 
  - Tự động refresh khi dashboard refresh
  - Hiển thị vấn đề từ Problem Analyzer backend
  - **Filtering Tabs:** 3 tabs (All, Read-Path, Write-Path) để lọc vấn đề theo đường dẫn
  - **Path Classification:** Mỗi vấn đề có field `path` ("read" | "write" | "neutral")
  - **Problem Count Badge:** Hiển thị số lượng vấn đề cho mỗi tab

---

**Tạo ngày:** 2024  
**Dự án:** PostgreSQL Dashboard  
**Tech Stack:** React + TypeScript + Vite

