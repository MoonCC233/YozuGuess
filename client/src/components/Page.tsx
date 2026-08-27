import { ReactNode } from 'react';

interface PageProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export default function Page({ title, icon, children }: PageProps) {
  return (
    <div className="page">
      <div className="page-header">
        {icon && <span className="page-header-icon">{icon}</span>}
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
