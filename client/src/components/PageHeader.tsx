import { ReactNode } from "react";

interface PageHeaderProps {
  breadcrumb?: ReactNode;
  quickActions?: ReactNode;
  children: ReactNode;
}

export function PageHeader({ breadcrumb, quickActions, children }: PageHeaderProps) {
  return <div breadcrumb={breadcrumb} quickActions={quickActions}>{children}</div>;
}
