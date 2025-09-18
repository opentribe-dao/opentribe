import { formatBalance } from "dedot/utils";
import { NETWORKS, type NetworkName } from "./config";

export function formatTokenAmount(
  amount: string | number | bigint,
  network: NetworkName = "polkadot"
): string {
  const { decimals, symbol } = NETWORKS[network];
  return formatBalance(amount, { decimals, symbol });
}
