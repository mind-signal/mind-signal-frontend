import axios from 'axios';
import type { AnalysisTier } from '@/07-shared/types';
import { api } from './base';

/** 분석 결과 응답 타입 정의함 */
export interface AnalysisResultData {
  groupId: string;
  matchingScore: number;
  synchronyScore: number | null;
  yScore: number | null;
  aiComment: string;
  markdown: string;
  user1Name: string | null;
  user2Name: string | null;
  isBTI: boolean;
  /** 백엔드가 저장한 등급임. 판정 전이거나 구버전 백엔드면 null 또는 없음 */
  tier?: AnalysisTier | null;
  metricsMean: Record<string, number> | null;
  wavesMean: Record<string, number> | null;
  /** 분석 파이프라인 이름표. SEQUENTIAL 은 과거 문서에만 남는 legacy 값임 */
  analysis_mode?: 'DUAL' | 'SEQUENTIAL' | 'BTI';
  /** 유사도 특징 벡터 — legacy SEQUENTIAL 문서에만 존재함 */
  similarity_features?: Record<string, unknown>;
}

export interface AnalysisResultResponse {
  status: 'success' | 'fail';
  data: AnalysisResultData;
}

/** 내 실험 결과 목록 항목 타입 정의함 */
export interface MyResultItem {
  groupId: string;
  matchingScore: number;
  user1Name: string | null;
  user2Name: string | null;
  createdAt: string | null;
}

/** 내 실험 결과 목록 응답 타입 정의함 */
export interface MyResultsResponse {
  status: string;
  data: MyResultItem[];
}

/**
 * 분석 결과 조회 실패(404) 본문의 등급 반환함.
 * ABORTED 처럼 결과가 없는 그룹도 백엔드가 등급을 실어 보냄 (SESSION-W008)
 */
export function tierFromError(err: unknown): AnalysisTier | null {
  if (!axios.isAxiosError<{ tier?: AnalysisTier | null }>(err)) return null;
  return err.response?.data?.tier ?? null;
}

/** 분석 결과 조회 API 정의함 */
export const analysisApi = {
  /** groupId로 분석 결과 조회함 */
  getResult: (groupId: string) =>
    api
      .get<AnalysisResultResponse>(`/analysis/${groupId}`)
      .then((res) => res.data),

  /** 내 실험 결과 목록 조회함 */
  getMyResults: () =>
    api.get<MyResultsResponse>('/analysis/my').then((res) => res.data),
};
