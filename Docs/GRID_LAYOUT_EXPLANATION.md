# Giải Thích: Grid Layout và Spread Operator

## 📐 Phần 1: CSS Grid Layout

### Grid là gì?

CSS Grid là hệ thống layout 2 chiều, chia container thành **lưới** với các **cột** và **hàng**.

```typescript
display: "grid"  // Bật Grid Layout
```

### So sánh các layout:

| Layout | Đặc điểm | Khi nào dùng |
|--------|----------|--------------|
| **Block** | Xếp dọc, mỗi phần tử 100% width | Layout đơn giản |
| **Flexbox** | 1 chiều (ngang/dọc) | Menu, buttons |
| **Grid** | 2 chiều (ngang + dọc) | Dashboard, cards |

---

## 🔧 `gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))"`

### Cú pháp đầy đủ:

```typescript
gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))"
```

### Phân tích từng phần:

#### 1. `repeat()` - Lặp lại pattern
```typescript
repeat(số_lần, pattern)
```
- Tạo nhiều cột với cùng pattern
- Ví dụ: `repeat(3, "1fr")` = `"1fr 1fr 1fr"`

#### 2. `auto-fit` - Tự động điều chỉnh số cột
- Grid tự tính số cột có thể fit vào container
- Tự động thêm/bớt cột khi resize màn hình

**Ví dụ:**
```
Container: 1200px, Min column: 400px
→ 1200 ÷ 400 = 3 cột

Khi resize:
- 800px → 2 cột
- 1600px → 4 cột
```

#### 3. `minmax(400px, 1fr)` - Kích thước cột
- **`400px`** (min): Cột tối thiểu 400px
- **`1fr`** (max): Chia đều không gian còn lại

**Ví dụ:**
```
Container: 1200px, Gap: 16px
→ Không gian: 1200 - 32 = 1168px
→ 1168 ÷ 400 = 2.92 → 2 cột
→ Mỗi cột: 1168 ÷ 2 = 584px
```

---

## 📏 `gridColumn: "1 / -1"` - Chiếm 100% width

### Grid Column Lines:

```
|     |     |     |
|  1  |  2  |  3  |
|     |     |     |
^     ^     ^     ^
1     2     3     4
```

- Grid có các **đường viền (lines)** đánh số từ 1
- Cột 1 nằm giữa line 1 và line 2

### `"1 / -1"` nghĩa là gì?

```typescript
gridColumn: "1 / -1"
```

- **`1`**: Bắt đầu từ line 1 (cột đầu tiên)
- **`-1`**: Kết thúc ở line -1 (cột cuối cùng)
- **Kết quả**: Chiếm **tất cả các cột** = 100% width

### Ví dụ:

```typescript
// Card nhỏ: chiếm 1 cột (50%)
<div style={cardStyle}>
  <DeadlocksCard />
</div>

// Card lớn: chiếm tất cả cột (100%)
<div style={{ gridColumn: "1 / -1" }}>
  <BlockedSessionsCard />
</div>
```

**Layout:**
```
┌─────────┬─────────┐
│ Deadlocks│ Locks   │  ← 2 cột, mỗi cột 50%
├─────────┴─────────┤
│ Blocked Sessions │  ← 1 cột, 100% width
└───────────────────┘
```

---

## 📱 Responsive Behavior

Grid tự động điều chỉnh số cột theo màn hình:

| Màn hình | Container | Số cột | Layout |
|----------|-----------|--------|--------|
| Lớn | 1600px | 4 cột | `┌─┬─┬─┬─┐` |
| Vừa | 1200px | 3 cột | `┌─┬─┬─┐` |
| Nhỏ | 800px | 2 cột | `┌─┬─┐` |
| Rất nhỏ | 600px | 1 cột | `┌─┐` |

**Công thức:**
```
Số cột = floor((Container width - gaps) / min_column_width)
```

---

## 🎨 Tại sao dùng Grid?

### ✅ Ưu điểm:

1. **Responsive tự động** - Không cần media queries
2. **Linh hoạt** - Dễ điều chỉnh width từng card
3. **Clean code** - Không cần tính toán thủ công
4. **Maintainable** - Dễ thêm/bớt card

### So sánh:

#### ❌ Cách cũ (không dùng Grid):
```typescript
<div style={{ width: "50%" }}>Card 1</div>
<div style={{ width: "50%" }}>Card 2</div>
// Vấn đề: Không responsive, phải dùng media queries
```

#### ✅ Cách mới (dùng Grid):
```typescript
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" }}>
  <div>Card 1</div>  // Tự động 50%
  <div style={{ gridColumn: "1 / -1" }}>Card 2</div>  // 100%
</div>
// Ưu điểm: Responsive tự động, không cần tính toán
```

---

## 📊 Tóm tắt Grid Properties

| Thuộc tính | Giá trị | Ý nghĩa |
|------------|---------|---------|
| `display` | `"grid"` | Bật Grid Layout |
| `gridTemplateColumns` | `"repeat(auto-fit, minmax(400px, 1fr))"` | Tự động tạo cột, min 400px |
| `gap` | `16` | Khoảng cách giữa các cột (16px) |
| `gridColumn` | `"1 / -1"` | Chiếm từ cột đầu đến cột cuối (100%) |

---

## 🎨 Phần 2: Spread Operator và Merge Styles

### 📝 Vấn đề: Thay đổi style mà không mất style cũ

#### ❌ Cách SAI:

```typescript
// TRƯỚC
<th style={th}>Wait Event Type</th>
// th = { borderBottom: "1px solid #eee", padding: "12px 0", fontWeight: 600 }

// SAU (SAI) - Mất style
<th style={{ textAlign: "center" }}>Wait Event Type</th>
// Kết quả: Chỉ có textAlign, MẤT borderBottom, padding, fontWeight!
```

#### ✅ Cách ĐÚNG:

```typescript
// SAU (ĐÚNG) - Giữ nguyên style + thêm textAlign
<th style={{ ...th, textAlign: "center" }}>Wait Event Type</th>
// Kết quả: Có đầy đủ borderBottom, padding, fontWeight + textAlign: center
```

---

### 🔍 Spread Operator (`...`) là gì?

**Spread operator** (`...`) copy tất cả thuộc tính từ object vào object mới.

**Ví dụ:**

```typescript
// Giả sử th = { borderBottom: "1px solid #eee", padding: "12px 0", fontWeight: 600 }

{ ...th, textAlign: "center" }

// Tương đương với:
{
  borderBottom: "1px solid #eee",  // Copy từ th
  padding: "12px 0",               // Copy từ th
  fontWeight: 600,                 // Copy từ th
  textAlign: "center"              // Thêm mới
}
```

---

### 📊 So Sánh 3 Cách Viết

| Cách viết | Kết quả | Giải thích |
|-----------|---------|------------|
| `style={th}` | Căn trái | Dùng nguyên `th`, không có `textAlign` |
| `style={{ ...th, textAlign: "center" }}` | **Căn giữa** | Copy `th` + thêm `textAlign` ✅ |
| `style={{ textAlign: "center" }}` | Căn giữa nhưng **mất style** | Chỉ có `textAlign`, mất các style khác ❌ |

---

### ⚠️ Thứ Tự Quan Trọng!

Thuộc tính **đứng sau** sẽ **ghi đè** thuộc tính **đứng trước**.

```typescript
// Giả sử th = { textAlign: "left", padding: "12px 0" }

// ✅ ĐÚNG - textAlign ghi đè
{ ...th, textAlign: "center" }
// → { textAlign: "center", padding: "12px 0" }

// ❌ SAI - th ghi đè textAlign
{ textAlign: "center", ...th }
// → { textAlign: "left", padding: "12px 0" }
```

**Quy tắc:** Luôn đặt `...th` **trước**, thuộc tính mới **sau**

---

### 💡 Ví Dụ Thực Tế

**File: `utils/styles.ts`**
```typescript
export const th = {
  borderBottom: "1px solid #eee",
  padding: "12px 0",
  fontWeight: 600,
  // Không có textAlign
};
```

**Component:**
```typescript
// TRƯỚC
<th style={th}>Wait Event Type</th>
// → Text căn trái, có border, padding, fontWeight

// SAU
<th style={{ ...th, textAlign: "center" }}>Wait Event Type</th>
// → Text căn giữa, vẫn có border, padding, fontWeight ✅
```

---

### 🎯 Nhiều Thuộc Tính Cùng Lúc

```typescript
// Thêm textAlign và color cùng lúc
<th style={{ ...th, textAlign: "center", color: "#333" }}>Wait Event Type</th>

// Kết quả:
{
  ...th,                    // Copy tất cả từ th
  textAlign: "center",      // Thêm mới
  color: "#333"             // Thêm mới
}
```

---

### 🔄 Nested Objects

Nếu object có nested properties, cần spread từng level:

```typescript
// Giả sử style = { base: { padding: "10px" }, color: "red" }

// ❌ SAI - Mất padding
style={{ ...style, base: { textAlign: "center" } }}

// ✅ ĐÚNG - Giữ nguyên padding
style={{ ...style, base: { ...style.base, textAlign: "center" } }}
```

---

## 📊 Tóm Tắt Spread Operator

| Khái niệm | Giải thích |
|-----------|------------|
| **Spread Operator** | `...object` - Copy tất cả thuộc tính |
| **Merge Styles** | `{ ...th, textAlign: "center" }` - Copy + thêm mới |
| **Thứ tự** | Thuộc tính sau ghi đè thuộc tính trước |
| **Lợi ích** | Giữ nguyên style cũ + thêm style mới |

**Trước:** `style={th}` → Text căn trái

**Sau:** `style={{ ...th, textAlign: "center" }}` → Text căn giữa, giữ nguyên style cũ

---

## ✅ Kết Luận

### Grid Layout
- ✅ Responsive tự động
- ✅ Dễ điều chỉnh width
- ✅ Code sạch và maintainable

### Spread Operator
- ✅ Merge styles an toàn
- ✅ Giữ nguyên style cũ
- ✅ Thêm style mới dễ dàng
- ✅ Không mất dữ liệu

---

## 🔍 Debug Grid trong Browser

1. Mở **DevTools** (F12)
2. Chọn element có `display: grid`
3. Xem **Grid overlay** (grid lines)
4. Kiểm tra **computed styles**

**Công thức tính số cột:**
```
Số cột = floor((Container width - gaps) / min_column_width)
```
