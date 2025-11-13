# Hướng Dẫn Chạy Hệ Thống - PostgreSQL Dashboard

> 📖 Hướng dẫn cách chạy hệ thống và giải thích các file markdown trong `Docs/`.

---

## 🔧 Yêu Cầu Hệ Thống

- **Node.js**: 18+ (khuyến nghị 20+)
- **PostgreSQL**: 12+ (khuyến nghị 13+)
- **npm**: Để cài đặt dependencies

**Kiểm tra:**
```bash
node --version  # v18.x.x+
psql --version  # PostgreSQL 12.x+
```

---

## 📦 Cài Đặt Dependencies

### Server Packages

```bash
cd server && npm install
```

**Dependencies chính:**
- `express` - Web framework cho API
- `pg` - PostgreSQL client
- `node-cron` - Scheduler cho Problem Analyzer
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Load environment variables

**DevDependencies:**
- `typescript` - TypeScript compiler
- `ts-node-dev` - Development server với hot reload
- `@types/*` - TypeScript type definitions

### Client Packages

```bash
cd client && npm install
```

**Dependencies chính:**
- `react` - UI framework
- `react-dom` - React DOM renderer

**DevDependencies:**
- `vite` - Build tool và dev server
- `typescript` - TypeScript compiler
- `@vitejs/plugin-react` - Vite plugin cho React
- `eslint` - Code linter

---

## 🗄️ Cấu Hình Database

### 1. Tạo File `.env` trong `server/`

```env
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=your_database
ENABLE_PROBLEM_SCHEDULER=false
```

### 2. Setup Schema (Tùy chọn - Chỉ cần nếu dùng Problem Storage)

```bash
psql -U your_username -d your_database -f Docs/MONITORING_SETUP_AND_QUERIES.sql
```

---

## 🚀 Chạy Hệ Thống

### Cách 1: Chạy Riêng Lẻ (2 terminals)

**Terminal 1 - Server:**
```bash
cd server && npm run dev
# Server: http://localhost:8080
```

**Terminal 2 - Client:**
```bash
cd client && npm run dev
# Client: http://localhost:5180
```

### Cách 2: Script (PowerShell - Windows)

Tạo `start-dev.ps1`:
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"
```

Chạy: `.\start-dev.ps1`

---

## 🌐 Truy Cập Dashboard

1. Mở browser: **http://localhost:5180**
2. **Nếu có `.env`**: Tự động load connection
3. **Nếu không có `.env`**: Nhập thông tin kết nối (Host, Port, User, Password, Database)
4. Dashboard hiển thị:
   - Overview Section (4 cards)
   - 6 Tabs: Phát Hiện Vấn Đề, Sessions, Locks, Performance, Maintenance, WAL/I/O

---

## 📚 Giải Thích Các File Markdown trong Docs

| File | Mục Đích | Khi Nào Đọc |
|------|----------|-------------|
| **`PROJECT_OVERVIEW.md`** | Tổng quan dự án, 27 endpoints, 24 metrics, architecture | ✅ Lần đầu làm quen, hiểu tổng quan |
| **`UI_OVERVIEW.md`** | UI/UX, component structure, layout, styling                  | ✅ Làm việc với frontend, thêm/sửa component |
| **`METRICS_LIST.md`** | Chi tiết 24 metrics, nguồn dữ liệu, các trường              | ✅ Hiểu metric cụ thể, thêm metric mới |
| **`PROBLEM_ANALYZER_GUIDE.md`** | Problem Analyzer, 24 rules, trigger system        | ✅ Hiểu cách phát hiện vấn đề, thêm/sửa rule |
| **`PROBLEM_STORAGE_GUIDE.md`** | Lưu problems vào database, UPSERT, triggers        | ✅ Setup Problem Storage, debug UPSERT |
| **`GRID_LAYOUT_EXPLANATION.md`** | CSS Grid Layout, Spread Operator                 | ✅ Làm việc với UI layout, merge styles |
| **`MONITORING_SETUP_AND_QUERIES.sql`** | SQL setup schema, queries hữu ích          | ✅ Setup database schema, query problems |
| **`GETTING_STARTED.md`** | Hướng dẫn chạy hệ thống (file này)                       | ✅ Lần đầu setup, troubleshooting |

---

## 🔧 Troubleshooting

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| **Cannot connect to database** | `.env` sai hoặc PostgreSQL chưa chạy | Kiểm tra `.env`, test: `psql -U user -d db` |
| **Port 8080/5180 already in use** | Port bị chiếm | Kill process hoặc đổi port |
| **Permission denied** | User không có quyền đọc system views | `GRANT SELECT ON pg_stat_activity TO user;` |
| **Scheduler không lưu problems** | Schema chưa setup | Chạy `MONITORING_SETUP_AND_QUERIES.sql` |
| **Dashboard không hiển thị dữ liệu** | API lỗi hoặc connection sai | Test API: `curl http://localhost:8080/api/health` |
| **Problem Analyzer không phát hiện** | Không có vấn đề hoặc rule chưa trigger | Đọc `PROBLEM_ANALYZER_GUIDE.md` |

---

## 📝 Tóm Tắt

**Các bước chạy hệ thống:**
1. Cài Node.js 18+ và PostgreSQL 12+
2. `cd server && npm install` và `cd client && npm install`
3. Tạo `server/.env` với thông tin database
4. (Tùy chọn) Chạy `MONITORING_SETUP_AND_QUERIES.sql` nếu dùng Problem Storage
5. `cd server && npm run dev` (port 8080)
6. `cd client && npm run dev` (port 5180)
7. Truy cập: http://localhost:5180

---

**Tạo ngày:** 2024 | **Dự án:** PostgreSQL Dashboard

