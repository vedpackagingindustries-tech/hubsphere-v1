import React, { useState } from 'react';
import { 
  AlertCircle, FolderOpen, Search, X, ChevronRight, Bell, Info, CheckCircle2, AlertTriangle, HelpCircle, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';

// ==========================================
// COLOR SYSTEM REFERENCE (TAILWIND UTILITIES)
// ==========================================
// Primary: bg-blue-600, text-blue-600, border-blue-200
// Secondary: bg-slate-50, text-slate-800
// Success: bg-emerald-500, text-emerald-500
// Warning: bg-amber-500, text-amber-500
// Danger: bg-red-500, text-red-500
// Info: bg-cyan-500, text-cyan-500

// ==========================================
// PREMIUM CARD
// ==========================================
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  id?: string;
  className?: string;
  hoverable?: boolean;
  glass?: boolean;
}

export const Card = ({ children, id, className = '', hoverable = true, glass = false, ...props }: CardProps) => {
  const shadowClass = hoverable 
    ? 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 ease-out border-slate-200 hover:border-blue-500/20' 
    : 'shadow-[0_2px_12px_rgba(0,0,0,0.03)] border-slate-100';

  const backgroundClass = glass 
    ? 'bg-white/80 backdrop-blur-md border border-white/40' 
    : 'bg-white border';

  return (
    <div
      id={id}
      className={`rounded-2xl p-6 ${backgroundClass} ${shadowClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const PremiumCard = Card;

// ==========================================
// PREMIUM BUTTON
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  id?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'warning' | 'info' | 'royal';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({
  children,
  id,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  icon,
  onClick,
  type = 'button',
  ...props
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-md shadow-blue-500/10',
    secondary: 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 focus:ring-slate-400',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-400 shadow-md shadow-emerald-500/10',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 shadow-md shadow-red-500/10',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-400 shadow-md shadow-amber-500/10',
    info: 'bg-cyan-500 hover:bg-cyan-600 text-white focus:ring-cyan-400 shadow-md shadow-cyan-500/10',
    royal: 'bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-500 shadow-md shadow-violet-500/10',
    ghost: 'bg-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
  };

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span className="font-semibold">{children}</span>
    </button>
  );
};

export const PremiumButton = Button;

// ==========================================
// PREMIUM INPUT
// ==========================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  className?: string;
  type?: string;
  value?: any;
  defaultValue?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  floating?: boolean;
}

export const Input = ({
  id,
  label,
  error,
  helperText,
  containerClassName = '',
  className = '',
  type = 'text',
  value,
  onChange,
  placeholder,
  floating = false,
  defaultValue,
  onFocus,
  onBlur,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value || !!defaultValue);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    if (onBlur) onBlur(e);
  };

  const borderClass = error 
    ? 'border-red-500 focus:ring-red-200' 
    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100/60';

  if (floating) {
    return (
      <div className={`relative w-full ${containerClassName}`}>
        <div className="relative flex items-center">
          <input
            id={id}
            type={type}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full bg-white text-slate-900 border rounded-xl px-4 py-3.5 text-sm transition-all focus:outline-none focus:ring-4 ${borderClass} pt-6 pb-2 ${className}`}
            {...props}
          />
          <label
            htmlFor={id}
            className={`absolute left-4 transition-all duration-200 pointer-events-none uppercase tracking-wider text-[10px] font-bold ${
              isFocused || hasValue || value
                ? 'top-2 text-blue-600'
                : 'top-1/2 -translate-y-1/2 text-slate-400 text-xs'
            }`}
          >
            {label}
          </label>
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full bg-white text-slate-900 border ${borderClass} rounded-xl px-4 py-3.5 text-sm transition-all shadow-sm focus:outline-none focus:ring-4 ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-400 font-medium">{helperText}</p>
      )}
    </div>
  );
};

export const PremiumInput = Input;

// ==========================================
// PREMIUM SEARCH
// ==========================================
export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  containerClassName?: string;
  className?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PremiumSearch = ({ onSearch, containerClassName = '', className = '', placeholder, onChange, ...props }: SearchProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) onSearch(e.target.value);
    if (onChange) onChange(e);
  };

  return (
    <div className={`relative flex items-center w-full ${containerClassName}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 transition-all ${className}`}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
};

// ==========================================
// PREMIUM BADGE
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  id?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'royal';
  className?: string;
}

export const Badge = ({ children, id, variant = 'default', className = '', ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    royal: 'bg-violet-50 text-violet-700 border-violet-100',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const PremiumBadge = Badge;

// ==========================================
// PREMIUM KPI CARD
// ==========================================
export interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export const StatCard = ({ id, title, value, icon, trend, subtitle, className = '', variant }: StatCardProps) => {
  const activeBorder = variant ? `border-l-4 border-l-${variant}` : '';

  return (
    <Card id={id} hoverable className={`flex flex-col justify-between ${activeBorder} ${className}`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        </div>
        {icon && (
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 shadow-sm shrink-0">
            {icon}
          </div>
        )}
      </div>
      
      {(trend || subtitle) && (
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100/80">
          {trend && (
            <span className={`text-xs font-bold flex items-center gap-0.5 ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> : <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />}
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-400 font-semibold">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
};

export const PremiumKPICard = StatCard;

// ==========================================
// PREMIUM EMPTY STATE
// ==========================================
export interface EmptyStateProps {
  id?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ id, title, description, action, icon, className = '' }: EmptyStateProps) => {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-200 rounded-2xl bg-white ${className}`}
    >
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400 mb-4 shadow-sm shrink-0">
        {icon || <FolderOpen className="w-8 h-8 text-slate-400" />}
      </div>
      <h3 className="text-base font-black text-slate-800 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed font-medium">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export const PremiumEmptyState = EmptyState;

// ==========================================
// PREMIUM SKELETON LOADER
// ==========================================
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = ({ className = '', variant = 'rectangular' }: SkeletonProps) => {
  const shapes = {
    text: 'h-4 w-2/3 rounded-lg',
    circular: 'h-12 w-12 rounded-full',
    rectangular: 'h-24 w-full rounded-2xl',
  };

  return (
    <div className={`animate-pulse bg-slate-100 border border-slate-50 ${shapes[variant]} ${className}`} />
  );
};

export const PremiumLoadingSkeleton = Skeleton;

export const SkeletonLoader = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 p-5 border border-slate-100 rounded-2xl bg-white shadow-sm animate-pulse">
          <Skeleton variant="circular" className="shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/4 h-5" />
            <Skeleton variant="text" className="w-1/2 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// PREMIUM TABLE
// ==========================================
export interface TableColumn<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  id?: string;
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  className?: string;
  bulkActions?: React.ReactNode;
  pagination?: React.ReactNode;
}

export function Table<T>({ id, data, columns, onRowClick, emptyState, className = '', bulkActions, pagination }: TableProps<T>) {
  return (
    <div id={id} className={`bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col ${className}`}>
      {bulkActions && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 items-center">
          {bulkActions}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 sticky top-0 z-10">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-all duration-150 group ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/50'}`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-6 py-4.5 text-xs text-slate-700 font-medium ${col.className || ''}`}>
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {emptyState || (
                    <EmptyState 
                      title="No records found" 
                      description="We couldn't find any documents or records matches this scope." 
                    />
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          {pagination}
        </div>
      )}
    </div>
  );
}

export const PremiumTable = Table;

// ==========================================
// PREMIUM MODAL
// ==========================================
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  id?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  footer?: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children, id, size = 'md', footer }: ModalProps) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <div id={id} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className={`bg-white border border-slate-200 rounded-3xl w-full ${sizes[size]} overflow-hidden shadow-2xl flex flex-col my-8`}>
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 h-8 w-8 rounded-full flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-16rem)] text-xs text-slate-600 leading-relaxed font-medium">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const PremiumModal = Modal;

// ==========================================
// PREMIUM DRAWER
// ==========================================
export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

export const PremiumDrawer = ({ isOpen, onClose, title, children, id, size = 'md', footer }: DrawerProps) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div id={id} className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className={`bg-white border-l border-slate-200 h-full w-full ${sizes[size]} shadow-2xl flex flex-col`}>
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <h3 className="text-base font-black text-slate-800 tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 h-8 w-8 rounded-full flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-600 leading-relaxed font-medium">
          {children}
        </div>
        {footer && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// PREMIUM BREADCRUMB
// ==========================================
export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const PremiumBreadcrumb = ({ items, className = '' }: BreadcrumbProps) => {
  return (
    <nav className={`flex items-center space-x-1.5 text-xs text-slate-400 ${className}`}>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" />}
          <button
            type="button"
            onClick={item.onClick}
            disabled={item.active || !item.onClick}
            className={`font-semibold hover:text-blue-600 transition-colors ${
              item.active ? 'text-slate-800 cursor-default' : 'cursor-pointer'
            }`}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

// ==========================================
// PREMIUM NOTIFICATIONS
// ==========================================
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  timestamp?: string;
  read?: boolean;
}

export interface NotificationsProps {
  notifications: NotificationItem[];
  onDismiss?: (id: string) => void;
  onClearAll?: () => void;
  onMarkAllAsRead?: () => void;
}

export const PremiumNotifications = ({ 
  notifications, 
  onDismiss, 
  onClearAll, 
  onMarkAllAsRead 
}: NotificationsProps) => {
  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    danger: <AlertCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Alert Center</h4>
        </div>
        <div className="flex gap-3">
          {onMarkAllAsRead && (
            <button 
              onClick={onMarkAllAsRead} 
              className="text-[10px] text-blue-600 hover:underline font-bold"
            >
              Mark read
            </button>
          )}
          {onClearAll && (
            <button 
              onClick={onClearAll} 
              className="text-[10px] text-slate-500 hover:underline font-bold"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            No unread notifications present.
          </div>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className={`p-4 flex gap-3 transition-colors ${item.read ? 'opacity-70 bg-white' : 'bg-slate-50/30'}`}>
              <div className="shrink-0 mt-0.5">{iconMap[item.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{item.message}</p>
                {item.timestamp && <p className="text-[9px] text-slate-400 mt-1 font-semibold">{item.timestamp}</p>}
              </div>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(item.id)}
                  className="shrink-0 text-slate-300 hover:text-slate-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
