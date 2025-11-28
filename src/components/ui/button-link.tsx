
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonLinkProps extends ButtonProps {
  to: string;
  children: React.ReactNode;
}

const ButtonLink = ({ 
  to, 
  children, 
  className,
  ...props 
}: ButtonLinkProps) => {
  return (
    <Button
      asChild
      className={cn('transition-all', className)}
      {...props}
    >
      <Link to={to}>
        {children}
      </Link>
    </Button>
  );
};

export { ButtonLink };
