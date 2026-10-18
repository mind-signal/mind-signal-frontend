import type { AnalysisResultData } from '@/07-shared/api/analysis';
import type { AnalysisTier } from '@/07-shared/types';

/**
 * 결과 화면 등급 결정함. 백엔드가 저장한 tier 를 먼저 쓰고, 없을 때만
 * isBTI 와 세션 수로 추측함 (SESSION-W008).
 *
 * @param data - 분석 결과 응답 data
 * @param sessionCount - 그룹 세션 수
 * @returns 화면에 쓸 등급 반환
 */
export function resolveTier(
  data: AnalysisResultData,
  sessionCount: number
): AnalysisTier {
  if (data.tier) return data.tier;
  // isBTI인데 원래 DUAL이었으면 PARTIAL. SEQUENTIAL 결과는 tier 오탐 방지를
  // 위해 제외함 — analysis_mode 에 과거 문서의 SEQUENTIAL 값이 legacy 로 남음
  return data.isBTI && sessionCount >= 2 && data.analysis_mode !== 'SEQUENTIAL'
    ? 'PARTIAL'
    : 'VALID';
}
