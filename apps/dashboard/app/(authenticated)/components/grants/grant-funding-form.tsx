import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@packages/base/components/ui/select';
import { useFormContext } from 'react-hook-form';

const TOKENS = [
  { value: 'DOT', label: 'DOT' },
  { value: 'KSM', label: 'KSM' },
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
];

export function GrantFundingForm() {
  const { register, setValue, watch } = useFormContext();
  const token = watch('token');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
        <p className="text-blue-400 text-sm">
          Funding information is optional. Leave blank if funding amounts are
          not predetermined.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minAmount">Minimum Amount</Label>
          <Input
            id="minAmount"
            type="number"
            {...register('minAmount')}
            className="border-white/10 bg-white/5 text-white"
          />
        </div>
        <div>
          <Label htmlFor="maxAmount">Maximum Amount</Label>
          <Input
            id="maxAmount"
            type="number"
            {...register('maxAmount')}
            className="border-white/10 bg-white/5 text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="totalFunds">Total Available Funds</Label>
          <Input
            id="totalFunds"
            type="number"
            {...register('totalFunds')}
            className="border-white/10 bg-white/5 text-white"
          />
        </div>
        <div>
          <Label htmlFor="token">Token</Label>
          <Select
            value={token}
            onValueChange={(value) => setValue('token', value)}
          >
            <SelectTrigger className="border-white/10 bg-white/5 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-900">
              {TOKENS.map((token) => (
                <SelectItem
                  key={token.value}
                  value={token.value}
                  className="text-white"
                >
                  {token.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
