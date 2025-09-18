import { NETWORKS, type NetworkName } from "./config";

type SubscanResponse<T> = {
  code: number;
  message: string;
  data?: T;
};

export class SubscanClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(network: NetworkName, apiKey: string) {
    this.baseUrl = NETWORKS[network].subscanAPIUrl;
    this.apiKey = apiKey;
  }

  private async postJson<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
      throw new Error(`Subscan HTTP ${res.status}`);
    }
    const json = (await res.json()) as SubscanResponse<T>;
    if (json.code !== 0 || !json.data) {
      throw new Error(`Subscan error: ${json.message}`);
    }
    return json.data;
  }

  // https://support.subscan.io/api-4224608 (Block detail)
  async getBlockDetail(params: {
    block_hash?: string;
    block_num?: number;
    block_timestamp?: number;
    only_head?: boolean;
  }): Promise<{
    block_num: number;
    block_timestamp: number;
    events: Array<{
      event_index: string;
      extrinsic_hash?: string;
      module_id: string;
      event_id: string;
      params: string;
    }>;
    extrinsics: Array<{
      extrinsic_hash: string;
      call_module: string;
      call_module_function: string;
      success: boolean;
      fee?: string;
    }>;
  }> {
    return await this.postJson("/api/scan/block", params);
  }

  // Extrinsic detail (part of Subscan docs under extrinsic)
  async getExtrinsicDetail(hash: string): Promise<{
    block_num: number;
    block_timestamp: number;
    extrinsic_index: string;
    account_id?: string;
    call_module: string;
    call_module_function: string;
    extrinsic_hash: string;
    success: boolean;
    fee?: string;
  }> {
    return await this.postJson("/api/scan/extrinsic", { hash });
  }
}
