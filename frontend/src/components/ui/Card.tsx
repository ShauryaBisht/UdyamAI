import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'elevated' | 'interactive' | 'accent' | 'demo' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'card-sm' | 'card' | 'card-lg' | 'card-xl';
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'lg',
  rounded = 'card-lg',
  className = '',
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-[#161B22] shadow-subtle border border-[#E7E7E7] dark:border-[#2B313C]',
    flat: 'bg-white dark:bg-[#161B22] border border-[#E7E7E7] dark:border-[#2B313C]',
    elevated: 'bg-white dark:bg-[#161B22] shadow-app border border-[#E7E7E7] dark:border-[#2B313C]',
    interactive:
      'bg-white dark:bg-[#161B22] shadow-subtle hover:shadow-md border border-[#E7E7E7] dark:border-[#2B313C] hover:border-primary/40 transition-all duration-200 cursor-pointer',
    accent: 'bg-primary-50/50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/50 shadow-subtle',
    demo: 'bg-indigo-50/50 dark:bg-indigo-950/20 border border-dashed border-indigo-200 dark:border-indigo-900/50 shadow-subtle',
    gradient: 'glow-mesh-card border border-[#E7E7E7] dark:border-[#2B313C] shadow-subtle',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10',
  };

  const roundedStyles = {
    'card-sm': 'rounded-xl',
    card: 'rounded-2xl',
    'card-lg': 'rounded-3xl',
    'card-xl': 'rounded-[28px]',
  };

  return (
    <div
      className={`relative overflow-hidden text-foreground ${roundedStyles[rounded]} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs sm:text-sm text-foreground-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-6 pt-4 border-t border-[#EFEFEF] flex items-center justify-between gap-4 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
