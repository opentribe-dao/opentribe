import { describe, expect, test } from 'vitest';
import {
  productionSeedGrants,
  productionSeedOrganization,
  productionSeedRfps,
} from '../production-seed-data';

describe('production seed data', () => {
  test('contains exactly three open grants for Web3 Foundation', () => {
    expect(productionSeedOrganization.slug).toBe('web3-foundation');
    expect(productionSeedGrants).toHaveLength(3);
    expect(productionSeedGrants.map((grant) => grant.status)).toEqual([
      'OPEN',
      'OPEN',
      'OPEN',
    ]);
  });

  test('contains exactly one open rfp linked to the zk grant', () => {
    expect(productionSeedRfps).toHaveLength(1);
    expect(productionSeedRfps[0]).toMatchObject({
      slug: '000-privacy-os',
      grantSlug: 'kusama-zk-bounty',
      status: 'OPEN',
    });
  });

  test('uses the expected apply urls and source urls for all grants and the rfp', () => {
    expect(productionSeedGrants.map((grant) => grant.applicationUrl)).toEqual([
      'https://formstr.app/i/kusama-pop',
      'https://puffy-xylophone-2a5.notion.site/95b593191de28385bf208189cec1887b',
      'https://ksmart.notion.site',
    ]);

    expect(productionSeedGrants[0].resources[0]?.url).toBe(
      'https://k51qzi5uqu5dk1h0t1ofq49oww8ykmcnsxl1h3m0d41pb58eog9f9yjjwxnnwh.ipns.dweb.link/'
    );
    expect(productionSeedGrants[2].resources[0]?.url).toBe(
      'https://art.ksm.vision/#participate'
    );
    expect(productionSeedRfps[0].resources[0]?.url).toBe(
      'https://zk.kusama.vision/rfps/#000-privacy-os'
    );
  });
});
