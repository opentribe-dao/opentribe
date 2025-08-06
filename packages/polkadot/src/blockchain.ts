import { ApiPromise, WsProvider } from '@polkadot/api';
import type { NetworkName } from './types';
import { NETWORK_CONFIG } from './address';

// WebSocket endpoints for different networks
const WS_ENDPOINTS: Record<NetworkName, string[]> = {
  polkadot: [
    'wss://rpc.polkadot.io',
    'wss://polkadot-rpc.dwellir.com',
    'wss://polkadot.api.onfinality.io/public-ws',
  ],
  kusama: [
    'wss://kusama-rpc.polkadot.io',
    'wss://kusama-rpc.dwellir.com',
    'wss://kusama.api.onfinality.io/public-ws',
  ],
  westend: [
    'wss://westend-rpc.polkadot.io',
    'wss://westend-rpc.dwellir.com',
  ],
};

/**
 * Polkadot blockchain client for verifying transactions
 */
export class PolkadotClient {
  private api: ApiPromise | null = null;
  private network: NetworkName;
  private wsEndpoint: string;

  constructor(network: NetworkName = 'polkadot', customEndpoint?: string) {
    this.network = network;
    this.wsEndpoint = customEndpoint || WS_ENDPOINTS[network][0];
  }

  /**
   * Connect to the blockchain
   */
  async connect(): Promise<void> {
    if (this.api?.isConnected) return;

    const provider = new WsProvider(this.wsEndpoint);
    this.api = await ApiPromise.create({ provider });
    await this.api.isReady;
  }

  /**
   * Disconnect from the blockchain
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
  }

  /**
   * Get extrinsic details by hash
   */
  async getExtrinsic(extrinsicHash: string): Promise<{
    success: boolean;
    blockNumber?: number;
    timestamp?: number;
    events?: any[];
    error?: string;
  }> {
    try {
      await this.connect();
      if (!this.api) throw new Error('API not connected');

      // Query the extrinsic
      const extrinsic = await this.api.query.system.extrinsicData(extrinsicHash);
      
      if (!extrinsic || extrinsic.isEmpty) {
        return { success: false, error: 'Extrinsic not found' };
      }

      // Get block hash where the extrinsic was included
      const blockHash = await this.api.query.system.blockHash(extrinsicHash);
      const signedBlock = await this.api.rpc.chain.getBlock(blockHash);
      
      // Get events for this block
      const apiAt = await this.api.at(blockHash);
      const events = await apiAt.query.system.events();

      // Find events related to this extrinsic
      const extrinsicIndex = signedBlock.block.extrinsics.findIndex(
        (ex) => ex.hash.toString() === extrinsicHash
      );

      const extrinsicEvents = events.filter(({ phase }) =>
        phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(extrinsicIndex)
      );

      // Check if the extrinsic was successful
      const success = extrinsicEvents.some(({ event }) =>
        this.api!.events.system.ExtrinsicSuccess.is(event)
      );

      // Get block timestamp
      const timestamp = await apiAt.query.timestamp.now();

      return {
        success,
        blockNumber: signedBlock.block.header.number.toNumber(),
        timestamp: timestamp.toNumber(),
        events: extrinsicEvents.map(({ event }) => event.toJSON()),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify a balance transfer by checking the events
   */
  async verifyTransfer(params: {
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
    try {
      await this.connect();
      if (!this.api) throw new Error('API not connected');

      const extrinsicData = await this.getExtrinsic(params.extrinsicHash);
      
      if (!extrinsicData.success || !extrinsicData.events) {
        return {
          verified: false,
          error: extrinsicData.error || 'Failed to get extrinsic data',
        };
      }

      // Look for Transfer events
      const transferEvent = extrinsicData.events.find((event: any) => 
        event.section === 'balances' && event.method === 'Transfer'
      );

      if (!transferEvent) {
        return {
          verified: false,
          error: 'No transfer event found in extrinsic',
        };
      }

      // Extract transfer details
      const [from, to, amount] = transferEvent.data as [string, string, string];

      // Verify the transfer matches expected values
      const isFromMatch = from.toLowerCase() === params.expectedFrom.toLowerCase();
      const isToMatch = to.toLowerCase() === params.expectedTo.toLowerCase();
      const isAmountMatch = amount.toString() === params.expectedAmount;

      if (!isFromMatch || !isToMatch || !isAmountMatch) {
        return {
          verified: false,
          error: 'Transfer details do not match expected values',
          details: {
            actualFrom: from,
            actualTo: to,
            actualAmount: amount.toString(),
            blockNumber: extrinsicData.blockNumber!,
            timestamp: extrinsicData.timestamp!,
            fee: '0', // Would need to calculate from events
          },
        };
      }

      return {
        verified: true,
        details: {
          actualFrom: from,
          actualTo: to,
          actualAmount: amount.toString(),
          blockNumber: extrinsicData.blockNumber!,
          timestamp: extrinsicData.timestamp!,
          fee: '0', // Would need to calculate from events
        },
      };
    } catch (error) {
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current block number
   */
  async getCurrentBlock(): Promise<number> {
    await this.connect();
    if (!this.api) throw new Error('API not connected');

    const header = await this.api.rpc.chain.getHeader();
    return header.number.toNumber();
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
    if (!this.api) throw new Error('API not connected');

    const { data: balance } = await this.api.query.system.account(address);
    
    return {
      free: balance.free.toString(),
      reserved: balance.reserved.toString(),
      frozen: balance.frozen.toString(),
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
    if (!this.api) throw new Error('API not connected');

    const unsubscribe = await this.api.query.system.events((events) => {
      events.forEach((record) => {
        const { event } = record;
        
        // Check if this is a transfer event
        if (this.api!.events.balances.Transfer.is(event)) {
          const [from, to, amount] = event.data;
          
          // Check if the address is involved
          if (from.toString() === address || to.toString() === address) {
            callback({
              from: from.toString(),
              to: to.toString(),
              amount: amount.toString(),
            });
          }
        }
      });
    });

    return unsubscribe;
  }

  /**
   * Get a formatted Subscan URL for viewing the transaction
   */
  getExtrinsicUrl(extrinsicHash: string): string {
    return `${NETWORK_CONFIG[this.network].subscanUrl}/extrinsic/${extrinsicHash}`;
  }

  /**
   * Get a formatted Subscan URL for viewing an address
   */
  getAddressUrl(address: string): string {
    return `${NETWORK_CONFIG[this.network].subscanUrl}/account/${address}`;
  }
}