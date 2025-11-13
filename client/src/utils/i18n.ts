// src/utils/i18n.ts
// Internationalization utility - dịch text theo language

import { useSettings } from "../contexts/SettingsContext";

type Translations = {
  vi: Record<string, string>;
  en: Record<string, string>;
};

const translations: Translations = {
  vi: {
    // Database Selector
    "select_database": "Chọn database để bắt đầu giám sát",
    "database_list": "Danh sách Database",
    "add_database": "Add Database",
    "connect": "Connect",
    "delete": "Xóa",
    "connecting": "Đang kết nối...",
    "no_databases": "Chưa có database nào được lưu.",
    "add_first_database": "Thêm Database đầu tiên",
    "last_used": "Sử dụng lần cuối:",
    
    // Settings
    "settings": "Settings",
    "theme": "Theme",
    "language": "Language",
    "light": "Light",
    "dark": "Dark",
    "system": "System",
    "vietnamese": "Tiếng Việt",
    "english": "English",
    "close": "Đóng",
    "theme_system_desc": "Sử dụng theme của hệ thống",
    "theme_light_desc": "Theme sáng",
    "theme_dark_desc": "Theme tối",
    "lang_vi_desc": "Giao diện tiếng Việt",
    "lang_en_desc": "English interface",
    
    // Add Database Form
    "add_database_connection": "Thêm Database Connection",
    "display_name": "Tên hiển thị",
    "display_name_hint": "(Tên hiển thị trong danh sách, khác với Database name)",
    "display_name_placeholder": "Sẽ tự động điền khi bạn nhập Database name",
    "host": "Host",
    "port": "Port",
    "user": "User",
    "password": "Password",
    "database_name": "Database Name",
    "database_name_hint": "(Tên database thực tế trong PostgreSQL)",
    "connect_and_save": "Connect & Save",
    "connecting_label": "Đang kết nối...",
    
    // Dashboard
    "postgresql_dashboard": "PostgreSQL Dashboard",
    "refresh": "Refresh",
    "min_seconds": "Min seconds:",
    "auto_refresh": "Auto-refresh",
    "snapshot_now": "Snapshot Now",
    "snapshot_tooltip": "Chụp snapshot các chỉ số hiện tại",
    "refresh_tooltip": "Refresh data manually",
    "change_database": "Đổi Database",
    "overview_dashboard": "Overview Dashboard",
    "currently_connected": "Đang kết nối:",
    
    // Overview Section
    "connections": "Connections",
    "connection_usage": "Connection Usage",
    "cache_hit": "Cache Hit",
    "stability": "Stability",
    "total": "Tổng",
    "active": "Active",
    "no_connections": "Không có connection.",
    "cache_performance": "Hiệu suất cache",
    "deadlocks": "Deadlocks",
    
    // Tabs
    "sessions": "Sessions",
    "locks_blocking": "Locks & Blocking",
    "performance": "Performance",
    "maintenance": "Maintenance",
    
    // Cards
    "index_usage": "Index Usage",
    "long_running_queries": "Long-running queries",
    "lock_summary": "Lock Summary",
    "blocked_sessions": "Blocked Sessions",
    "deadlocks_card": "Deadlocks",
    "autovacuum": "Autovacuum",
    "temp_io": "Temp I/O",
    "checkpoint": "Checkpoint",
    "seq_vs_idx_scans": "Seq vs Index Scans",
    "table_sizes": "Table Sizes",
    "database_sizes": "Database Sizes",
    
    // Tooltip labels
    "tooltip_good_value": "✓ Giá trị tốt:",
    "tooltip_warning": "⚠ Cảnh báo:",
    
    // Tooltip content - Connections
    "tooltip_connections_title": "Connections by State",
    "tooltip_connections_desc": "Số lượng kết nối PostgreSQL theo trạng thái",
    "tooltip_connections_good": "Active connections hợp lý",
    "tooltip_connections_warn": "Quá nhiều idle in transaction - Cần kiểm tra",
    
    // Tooltip content - Connection Usage
    "tooltip_connection_usage_title": "Connection Usage",
    "tooltip_connection_usage_desc": "Tỷ lệ phần trăm kết nối đang sử dụng so với max_connections",
    "tooltip_connection_usage_good": "< 80% - An toàn",
    "tooltip_connection_usage_warn": "> 80% - Cảnh báo | > 90% - Nguy hiểm",
    "tooltip_connection_usage_info": "Gần đạt max_connections sẽ không thể tạo thêm kết nối mới.",
    
    // Tooltip content - Cache Hit
    "tooltip_cache_hit_title": "Cache Hit Percentage",
    "tooltip_cache_hit_desc": "Tỷ lệ đọc dữ liệu từ shared_buffers (cache) thay vì phải đọc từ disk",
    "tooltip_cache_hit_good": "> 95% - Cache hoạt động tốt",
    "tooltip_cache_hit_warn": "< 95% - Cần kiểm tra shared_buffers hoặc workload",
    "tooltip_cache_hit_info": "Giá trị thấp cho thấy nhiều query phải đọc từ disk, làm chậm hiệu suất.",
    
    // Tooltip content - Deadlocks/Stability
    "tooltip_stability_title": "System Stability",
    "tooltip_stability_desc": "Deadlocks",
    "tooltip_stability_good": "Deadlocks = 0",
    "tooltip_stability_warn": "Có deadlocks",
    "tooltip_stability_info": "Deadlocks cho thấy vấn đề về locking và có thể làm chậm database.",
    
    // Tooltip content - Index Usage
    "tooltip_index_usage_title": "Index Usage Percentage",
    "tooltip_index_usage_desc": "Tỷ lệ sử dụng index scan so với sequential scan. Sequential scan quét toàn bộ bảng nên chậm hơn index scan.",
    "tooltip_index_usage_good": "> 80% - Index được sử dụng tốt",
    "tooltip_index_usage_warn": "< 50% - Nhiều sequential scan, cần tạo index",
    "tooltip_index_usage_info": "Index Usage = idx_scan / (idx_scan + seq_scan) * 100%. Giá trị thấp cho thấy query chưa tối ưu.",
    
    // Tooltip content - Long Running
    "tooltip_long_running_title": "Long-running Queries",
    "tooltip_long_running_desc": "Các queries đang chạy lâu hơn ngưỡng được chỉ định. Query chạy lâu có thể làm chậm database và tốn tài nguyên.",
    "tooltip_long_running_good": "0 queries - Không có query dài",
    "tooltip_long_running_warn": "> 0 queries - Cần kiểm tra và tối ưu",
    "tooltip_long_running_info": "Query chạy lâu có thể do thiếu index, query chưa tối ưu, hoặc lock conflict. Nên kiểm tra execution plan và xem xét kill nếu cần.",
    
    // Add Database Form errors
    "error_host_required": "Vui lòng nhập host",
    "error_user_required": "Vui lòng nhập user",
    "error_database_required": "Vui lòng nhập database name",
    "error_password_required": "Vui lòng nhập password",
    "error_connection_failed": "Không thể kết nối đến database. Vui lòng kiểm tra lại thông tin.",
    "error_connection_test": "Lỗi khi thêm database.",
    
    // Database Selector
    "enter_password": "Nhập password để kết nối:",
    "confirm_delete": "Bạn có chắc muốn xóa connection này?",
    "cannot_connect": "Không thể kết nối:",
    "please_enter_password": "Vui lòng nhập lại password để kết nối.",
    
    // Export
    "export_csv": "Export to CSV",
    "export_json": "Export to JSON",
    
    // Common
    "loading": "Đang tải...",
    "error": "Lỗi",
    "save": "Lưu",
    "high": "High",
    "low": "Low",
    "waiting": "Waiting",
    "alert": "Alert",
  },
  en: {
    // Database Selector
    "select_database": "Select a database to start monitoring",
    "database_list": "Database List",
    "add_database": "Add Database",
    "connect": "Connect",
    "delete": "Delete",
    "connecting": "Connecting...",
    "no_databases": "No databases saved yet.",
    "add_first_database": "Add First Database",
    "last_used": "Last used:",
    
    // Settings
    "settings": "Settings",
    "theme": "Theme",
    "language": "Language",
    "light": "Light",
    "dark": "Dark",
    "system": "System",
    "vietnamese": "Vietnamese",
    "english": "English",
    "close": "Close",
    "theme_system_desc": "Use system theme",
    "theme_light_desc": "Light theme",
    "theme_dark_desc": "Dark theme",
    "lang_vi_desc": "Vietnamese interface",
    "lang_en_desc": "English interface",
    
    // Add Database Form
    "add_database_connection": "Add Database Connection",
    "display_name": "Display Name",
    "display_name_hint": "(Display name in list, different from Database name)",
    "display_name_placeholder": "Will auto-fill when you enter Database name",
    "host": "Host",
    "port": "Port",
    "user": "User",
    "password": "Password",
    "database_name": "Database Name",
    "database_name_hint": "(Actual database name in PostgreSQL)",
    "cancel": "Cancel",
    "connect_and_save": "Connect & Save",
    "connecting_label": "Connecting...",
    
    // Dashboard
    "postgresql_dashboard": "PostgreSQL Dashboard",
    "refresh": "Refresh",
    "min_seconds": "Min seconds:",
    "auto_refresh": "Auto-refresh",
    "snapshot_now": "Snapshot Now",
    "snapshot_tooltip": "Capture snapshot of current metrics",
    "refresh_tooltip": "Refresh data manually",
    "change_database": "Change Database",
    "overview_dashboard": "Overview Dashboard",
    "currently_connected": "Currently connected:",
    
    // Overview Section
    "connections": "Connections",
    "connection_usage": "Connection Usage",
    "cache_hit": "Cache Hit",
    "stability": "Stability",
    "total": "Total",
    "active": "Active",
    "no_connections": "No connections.",
    "cache_performance": "Cache performance",
    "deadlocks": "Deadlocks",
    
    // Tabs
    "sessions": "Sessions",
    "locks_blocking": "Locks & Blocking",
    "performance": "Performance",
    "maintenance": "Maintenance",
    
    // Cards
    "index_usage": "Index Usage",
    "long_running_queries": "Long-running queries",
    "lock_summary": "Lock Summary",
    "blocked_sessions": "Blocked Sessions",
    "deadlocks_card": "Deadlocks",
    "autovacuum": "Autovacuum",
    "temp_io": "Temp I/O",
    "checkpoint": "Checkpoint",
    "seq_vs_idx_scans": "Seq vs Index Scans",
    "table_sizes": "Table Sizes",
    "database_sizes": "Database Sizes",
    
    // Tooltip labels
    "tooltip_good_value": "✓ Good value:",
    "tooltip_warning": "⚠ Warning:",
    
    // Tooltip content - Connections
    "tooltip_connections_title": "Connections by State",
    "tooltip_connections_desc": "Number of PostgreSQL connections by state",
    "tooltip_connections_good": "Active connections are reasonable",
    "tooltip_connections_warn": "Too many idle in transaction - Check needed",
    
    // Tooltip content - Connection Usage
    "tooltip_connection_usage_title": "Connection Usage",
    "tooltip_connection_usage_desc": "Percentage of connections in use compared to max_connections",
    "tooltip_connection_usage_good": "< 80% - Safe",
    "tooltip_connection_usage_warn": "> 80% - Warning | > 90% - Dangerous",
    "tooltip_connection_usage_info": "When approaching max_connections, new connections cannot be created.",
    
    // Tooltip content - Cache Hit
    "tooltip_cache_hit_title": "Cache Hit Percentage",
    "tooltip_cache_hit_desc": "Percentage of data reads from shared_buffers (cache) instead of disk",
    "tooltip_cache_hit_good": "> 95% - Cache working well",
    "tooltip_cache_hit_warn": "< 95% - Check shared_buffers or workload",
    "tooltip_cache_hit_info": "Low values indicate many queries must read from disk, slowing performance.",
    
    // Tooltip content - Deadlocks/Stability
    "tooltip_stability_title": "System Stability",
    "tooltip_stability_desc": "Deadlocks",
    "tooltip_stability_good": "Deadlocks = 0",
    "tooltip_stability_warn": "Deadlocks present",
    "tooltip_stability_info": "Deadlocks indicate locking issues and can slow down the database.",
    
    // Tooltip content - Index Usage
    "tooltip_index_usage_title": "Index Usage Percentage",
    "tooltip_index_usage_desc": "Ratio of index scans to sequential scans. Sequential scans read entire tables and are slower than index scans.",
    "tooltip_index_usage_good": "> 80% - Index usage is good",
    "tooltip_index_usage_warn": "< 50% - Many sequential scans, need to create indexes",
    "tooltip_index_usage_info": "Index Usage = idx_scan / (idx_scan + seq_scan) * 100%. Low values indicate queries are not optimized.",
    
    // Tooltip content - Long Running
    "tooltip_long_running_title": "Long-running Queries",
    "tooltip_long_running_desc": "Queries running longer than the specified threshold. Long queries can slow down the database and consume resources.",
    "tooltip_long_running_good": "0 queries - No long queries",
    "tooltip_long_running_warn": "> 0 queries - Need to check and optimize",
    "tooltip_long_running_info": "Long queries may be due to missing indexes, unoptimized queries, or lock conflicts. Should check execution plan and consider killing if needed.",
    
    // Add Database Form errors
    "error_host_required": "Please enter host",
    "error_user_required": "Please enter user",
    "error_database_required": "Please enter database name",
    "error_password_required": "Please enter password",
    "error_connection_failed": "Cannot connect to database. Please check the information.",
    "error_connection_test": "Error adding database.",
    
    // Database Selector
    "enter_password": "Enter password to connect:",
    "confirm_delete": "Are you sure you want to delete this connection?",
    "cannot_connect": "Cannot connect:",
    "please_enter_password": "Please enter password again to connect.",
    
    // Export
    "export_csv": "Export to CSV",
    "export_json": "Export to JSON",
    
    // Common
    "loading": "Loading...",
    "error": "Error",
    "save": "Save",
    "high": "High",
    "low": "Low",
    "waiting": "Waiting",
    "alert": "Alert",
  },
};

export function useTranslation() {
  const { settings } = useSettings();
  const t = (key: string): string => {
    return translations[settings.language][key] || key;
  };
  return { t, language: settings.language };
}

// Hook standalone để dùng ngoài component
export function getTranslation(language: "vi" | "en", key: string): string {
  return translations[language][key] || key;
}

