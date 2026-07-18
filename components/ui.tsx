import React from 'react';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    const baseClass = "px-4 py-2 rounded font-medium text-sm transition-colors";
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
      danger: "bg-red-600 text-white hover:bg-red-700",
    };
    return <button ref={ref} className={`${baseClass} ${variants[variant]} ${className}`} {...props} />;
  }
);
Button.displayName = 'Button';

export const Card = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-white rounded-lg shadow border border-gray-200 overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

export const Badge = ({ className = '', children, variant = 'default' }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'success' | 'warning' | 'danger' }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border ${className}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const EyebrowLabel = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={`block text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`} {...props}>
    {children}
  </span>
);
