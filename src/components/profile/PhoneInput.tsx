import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ChevronDown, Check } from 'lucide-react';
import { COUNTRIES, DEFAULT_COUNTRY, findCountry, type Country } from '@/lib/countryCodes';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  countryCode: string | null | undefined;
  number: string | null | undefined;
  onChange: (countryCode: string, number: string) => void;
}

export const PhoneInput = ({ countryCode, number, onChange }: PhoneInputProps) => {
  const [open, setOpen] = useState(false);
  const country: Country = useMemo(
    () => findCountry(countryCode) ?? DEFAULT_COUNTRY,
    [countryCode],
  );
  const sorted = useMemo(
    () => [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 px-3 gap-2 font-mono"
          >
            <span className="text-base leading-none">{country.flag}</span>
            <span className="text-sm">{country.dial}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Tafuta nchi..." />
            <CommandList>
              <CommandEmpty>Hakuna nchi</CommandEmpty>
              <CommandGroup>
                {sorted.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.dial}`}
                    onSelect={() => {
                      onChange(c.dial, number ?? '');
                      setOpen(false);
                    }}
                    className="gap-2"
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="flex-1 text-sm">{c.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">{c.dial}</span>
                    <Check
                      className={cn(
                        'h-4 w-4',
                        c.dial === country.dial ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        inputMode="numeric"
        placeholder="712 345 678"
        value={number ?? ''}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^\d\s-]/g, '').slice(0, 20);
          onChange(country.dial, cleaned);
        }}
        className="flex-1"
      />
    </div>
  );
};
