import type { GrantFormData } from '@/type';
import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@packages/base/components/ui/select';

const TOKENS = [
  { value: 'DOT', label: 'DOT' },
  { value: 'KSM', label: 'KSM' },
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
];

export function GrantFundingForm({
  formData,
  setFormData,
}: {
  formData: GrantFormData;
  setFormData: (cb: (prev: GrantFormData) => GrantFormData) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-400">
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
            value={formData.minAmount}
            onChange={(e) =>
              setFormData((f) => ({ ...f, minAmount: e.target.value }))
            }
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        <div>
          <Label htmlFor="maxAmount">Maximum Amount</Label>
          <Input
            id="maxAmount"
            type="number"
            value={formData.maxAmount}
            onChange={(e) =>
              setFormData((f) => ({ ...f, maxAmount: e.target.value }))
            }
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="totalFunds">Total Available Funds</Label>
          <Input
            id="totalFunds"
            type="number"
            value={formData.totalFunds}
            onChange={(e) =>
              setFormData((f) => ({ ...f, totalFunds: e.target.value }))
            }
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        <div>
          <Label htmlFor="token">Token</Label>
          <Select
            value={formData.token}
            onValueChange={(value) =>
              setFormData((f) => ({ ...f, token: value }))
            }
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
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
