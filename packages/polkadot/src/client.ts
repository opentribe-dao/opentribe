import type { KusamaApi, PolkadotApi } from "@dedot/chaintypes";
import { DedotClient, WsProvider } from "dedot";
import type { NetworkName } from "./config";
import { NETWORKS } from "./config";

/**
 * Polkadot blockchain client for verifying transactions
 */
export class Client {
  private client: DedotClient | null = null;
  private network: NetworkName;
  private wsEndpoint: string;

  constructor(network: NetworkName = "polkadot", customEndpoint?: string) {
    this.network = network;
    this.wsEndpoint = customEndpoint || NETWORKS[network].wsEndpoints[0];
  }

  private static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  private static toAddressString(
    value: unknown,
    ss58Prefix: number
  ): string | null {
    if (Client.isObject(value)) {
      const maybeAddrFn = (value as { address?: (p: number) => string })
        .address;
      if (typeof maybeAddrFn === "function") {
        return maybeAddrFn(ss58Prefix);
      }
    }
    if (typeof value === "string") {
      return value;
    }
    return null;
  }

  private static extractTransferParams(
    data: unknown,
    ss58Prefix: number
  ): { from: string; to: string; amount: string } | null {
    // Object shape: { from, to, amount }
    if (Client.isObject(data)) {
      const from = Client.toAddressString(
        (data as Record<string, unknown>).from,
        ss58Prefix
      );
      const to = Client.toAddressString(
        (data as Record<string, unknown>).to,
        ss58Prefix
      );
      const amountVal = (data as Record<string, unknown>).amount;
      const amount =
        typeof amountVal === "string" || typeof amountVal === "number"
          ? String(amountVal)
          : null;
      if (from && to && amount) {
        return { from, to, amount };
      }
      return null;
    }
    // Array shape: [from, to, amount]
    if (Array.isArray(data)) {
      const [f, t, a] = data as unknown[];
      const from = Client.toAddressString(f, ss58Prefix);
      const to = Client.toAddressString(t, ss58Prefix);
      const amount =
        typeof a === "string" || typeof a === "number" ? String(a) : null;
      if (from && to && amount) {
        return { from, to, amount };
      }
      return null;
    }
    return null;
  }

  /**
   * Connect to the blockchain
   */
  async connect(): Promise<void> {
    if (this.client) {
      return;
    }
    const provider = new WsProvider(this.wsEndpoint);
    // Use concrete chain APIs when known; assign to non-generic client field
    if (this.network === "polkadot") {
      this.client = (await DedotClient.new<PolkadotApi>({
        provider,
        cacheMetadata: true,
      })) as unknown as DedotClient;
    } else if (this.network === "kusama") {
      this.client = (await DedotClient.new<KusamaApi>({
        provider,
        cacheMetadata: true,
      })) as unknown as DedotClient;
    } else {
      // Westend or others fall back to generic substrate api
      this.client = await DedotClient.new({ provider, cacheMetadata: true });
    }
  }

  /**
   * Disconnect from the blockchain
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  /**
   * Get extrinsic details by hash
   */
  async getExtrinsic(_extrinsicHash: string): Promise<{
    success: boolean;
    blockNumber?: number;
    timestamp?: number;
    events?: unknown[];
    error?: string;
  }> {
    // Dedot does not expose direct extrinsic-by-hash lookup; this typically requires an indexer.
    // We return a clear unsupported message to callers.
    await this.connect();
    return {
      success: false,
      error:
        "Extrinsic lookup by hash not supported via RPC; use an indexer (e.g. Subscan) or maintain block tracking.",
    };
  }

  /**
   * Verify a balance transfer by checking the events
   */
  async verifyTransfer(_params: {
    extrinsicHash: string;
    expectedFrom: string;
    expectedTo: string;
    expectedAmount: string;
  }): Promise<{
    verified: boolean;
    details?: {
      actualFrom: string;
      actualTo: string;
      actualAmount: string;
      blockNumber: number;
      timestamp: number;
      fee: string;
    };
    error?: string;
  }> {
    // With RPC only, verifying by hash is unsupported here. Keep method for API parity.
    await this.connect();
    return {
      verified: false,
      error: "Verification by extrinsic hash requires an indexer service.",
    };
  }

  /**
   * Get current block number
   */
  async getCurrentBlock(): Promise<number> {
    await this.connect();
    if (!this.client) {
      throw new Error("Client not connected");
    }
    type ClientLike = {
      query: { system: { number: () => Promise<number | string> } };
    };
    const c = this.client as unknown as ClientLike;
    const number = await c.query.system.number();
    return Number(number as unknown as string | number);
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<{
    free: string;
    reserved: string;
    frozen: string;
  }> {
    await this.connect();
    if (!this.client) {
      throw new Error("Client not connected");
    }
    type ClientLike = {
      query: {
        system: {
          account: (addr: string) => Promise<{
            data: {
              free: { toString(): string };
              reserved: { toString(): string };
              frozen: { toString(): string };
            };
          }>;
        };
      };
    };
    const c = this.client as unknown as ClientLike;
    const account = await c.query.system.account(address);
    return {
      free: account.data.free.toString(),
      reserved: account.data.reserved.toString(),
      frozen: account.data.frozen.toString(),
    };
  }

  /**
   * Subscribe to new transfers for an address
   */
  async subscribeToTransfers(
    address: string,
    callback: (transfer: { from: string; to: string; amount: string }) => void
  ): Promise<() => void> {
    await this.connect();
    if (!this.client) {
      throw new Error("Client not connected");
    }
    type ClientLike = {
      events: {
        balances: {
          Transfer: {
            watch: (
              cb: (
                events: Array<{
                  palletEvent: { data: unknown };
                }>
              ) => void
            ) => Promise<() => void>;
          };
        };
      };
      consts: { system: { ss58Prefix: number } };
    };
    const c = this.client as unknown as ClientLike;
    const ss58Prefix = c.consts.system.ss58Prefix;
    const unsub = await c.events.balances.Transfer.watch(
      (events: Array<{ palletEvent: { data: unknown } }>) => {
        for (const ev of events) {
          const out = Client.extractTransferParams(
            ev.palletEvent?.data,
            ss58Prefix
          );
          if (out && (out.from === address || out.to === address)) {
            callback(out);
          }
        }
      }
    );
    return unsub as () => void;
  }

  /**
   * Get a formatted Subscan URL for viewing the transaction
   */
  getExtrinsicUrl(extrinsicHash: string): string {
    return `${NETWORKS[this.network].subscanUrl}/extrinsic/${extrinsicHash}`;
  }

  /**
   * Get a formatted Subscan URL for viewing an address
   */
  getAddressUrl(address: string): string {
    return `${NETWORKS[this.network].subscanUrl}/account/${address}`;
  }
}
