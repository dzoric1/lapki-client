import { ComponentProps, forwardRef } from 'react';

import { twMerge } from 'tailwind-merge';

interface TextInputProps extends ComponentProps<'input'> {
  label: string;
  isElse: boolean;
  error?: boolean;
  errorMessage: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, isElse, error, errorMessage, ...props }, ref) => {
    return (
      <label className={twMerge('mx-1 flex flex-col', error && 'text-red-500', isElse && 'hidden')}>
        {label}
        <input
          className={twMerge(
            'w-[250px] max-w-[250px] rounded border bg-transparent px-2 py-1 outline-none transition-colors placeholder:font-normal',
            error && 'border-red-500 placeholder:text-red-500',
            !error && 'border-neutral-200 text-neutral-50 focus:border-neutral-50'
          )}
          ref={ref}
          {...props}
          maxLength={20}
        />
        <p className="min-h-[24px] text-[14px] text-red-500">{errorMessage}</p>
      </label>
    );
  }
);
