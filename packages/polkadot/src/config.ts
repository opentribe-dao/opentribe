export const NETWORKS = {
  polkadot: {
    name: "Polkadot",
    ss58Format: 0,
    decimals: 10,
    symbol: "DOT",
    subscanUrl: "https://polkadot.subscan.io",
    wsEndpoints: [
      "wss://rpc.polkadot.io",
      "wss://polkadot-rpc.dwellir.com",
      "wss://polkadot.api.onfinality.io/public-ws",
    ],
    subscanAPIUrl: "https://polkadot.api.subscan.io",
  },
  kusama: {
    name: "Kusama",
    ss58Format: 2,
    decimals: 12,
    symbol: "KSM",
    subscanUrl: "https://kusama.subscan.io",
    wsEndpoints: [
      "wss://kusama-rpc.polkadot.io",
      "wss://kusama-rpc.dwellir.com",
      "wss://kusama.api.onfinality.io/public-ws",
    ],
    subscanAPIUrl: "https://kusama.api.subscan.io",
  },
  westend: {
    name: "Westend",
    ss58Format: 42,
    decimals: 12,
    symbol: "WND",
    subscanUrl: "https://westend.subscan.io",
    wsEndpoints: [
      "wss://westend-rpc.polkadot.io",
      "wss://westend-rpc.dwellir.com",
    ],
    subscanAPIUrl: "https://westend.api.subscan.io",
  },
} as const;

export type NetworkName = keyof typeof NETWORKS;
