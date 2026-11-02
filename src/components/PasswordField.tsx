'use client';

import { useState } from 'react';

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-[13px] text-label-2 mb-1 px-1" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl bg-card px-3.5 py-2.5 text-[17px] text-label outline-none ring-1 ring-sep focus:ring-2 focus:ring-tint pr-16"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 px-3.5 text-[14px] font-medium text-tint"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
