
import React from 'react';
import { Input } from '@/components/ui/input';

interface ColorPickerInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ColorPickerInput: React.FC<ColorPickerInputProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
      />
      <div className="relative">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 p-0 border-0 cursor-pointer"
        />
      </div>
    </div>
  );
};
