import { describe, it, expect } from 'vitest';
import type { AnalysisResultData } from '@/07-shared/api/analysis';
import { resolveTier } from './resolve-tier';

/** 등급 판정에 쓰는 필드만 채운 응답 data 생성함 */
function data(fields: Partial<AnalysisResultData>): AnalysisResultData {
  return {
    groupId: 'g',
    matchingScore: 0,
    synchronyScore: null,
    yScore: null,
    aiComment: '',
    markdown: '',
    user1Name: null,
    user2Name: null,
    isBTI: false,
    metricsMean: null,
    wavesMean: null,
    ...fields,
  };
}

describe('resolveTier — 응답 등급 우선, 없을 때만 추측 (SESSION-W008)', () => {
  it('응답 tier 가 있으면 추측과 달라도 그것을 씀', () => {
    expect(resolveTier(data({ tier: 'VALID', isBTI: true }), 2)).toBe('VALID');
    expect(resolveTier(data({ tier: 'PARTIAL', isBTI: false }), 2)).toBe(
      'PARTIAL'
    );
  });

  it('tier 가 null 이면 isBTI 와 세션 수로 PARTIAL 을 추측함', () => {
    expect(resolveTier(data({ tier: null, isBTI: true }), 2)).toBe('PARTIAL');
  });

  it('tier 가 없고 DUAL 결과면 VALID 로 추측함', () => {
    expect(resolveTier(data({ isBTI: false }), 2)).toBe('VALID');
  });

  it('legacy SEQUENTIAL 결과는 isBTI 여도 VALID 로 둠', () => {
    expect(
      resolveTier(data({ isBTI: true, analysis_mode: 'SEQUENTIAL' }), 2)
    ).toBe('VALID');
  });
});
