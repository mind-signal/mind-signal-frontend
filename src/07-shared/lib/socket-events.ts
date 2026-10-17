import type { EmotivMetrics } from '@/07-shared/api';
import type { AnalysisTier } from '@/07-shared/types';

/**
 * 백엔드 Socket.io 이벤트의 payload와 ack 타입을 한곳에 모은 모듈임.
 * 이벤트 이름과 payload 타입의 대응은 ServerEventPayloads에 정의함.
 */

/**
 * eeg-live 소켓 이벤트 페이로드 구조 정의함
 */
export interface EegLivePayload {
  sessionId: string;
  data: EmotivMetrics;
}

/**
 * measurement-complete 소켓 이벤트 페이로드 구조 정의함.
 * 세션 단위 emit은 sessionId를, DUAL_2PC room emit은 groupId를 실어 보냄.
 */
export interface MeasurementCompletePayload {
  sessionId?: string;
  groupId?: string;
}

/**
 * dual-session-ready 이벤트 페이로드 구조 정의함 (PLAN L150)
 */
export interface DualSessionReadyPayload {
  groupId: string;
  timestamp_ms: number;
}

/**
 * dual-session-failed 이벤트 페이로드 구조 정의함 (PLAN L151)
 */
export interface DualSessionFailedPayload {
  groupId: string;
  error: string;
}

/**
 * stimulus_start 이벤트 페이로드 구조 정의함 (PLAN L152)
 */
export interface StimulusStartPayload {
  groupId: string;
  timestamp_ms: number;
}

/**
 * WavePower 구조 — aligned_pair 페이로드에서 사용함 (PLAN L303-309)
 */
export interface WavePower {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

/**
 * 한 subject의 한 시점 샘플 — waves(대역 파워)와 metrics(EMOTIV 지표 6종).
 * metrics는 구버전 BE 프레임에서 없을 수 있어 optional임.
 */
export interface SubjectSample {
  waves: WavePower;
  metrics?: EmotivMetrics;
}

/**
 * aligned_pair 이벤트 페이로드 구조 정의함 (PLAN L153, v8 H-1)
 * subject_0 키 사용 금지 — subject_1/subject_2 1-based 통일
 */
export interface AlignedPairPayload {
  groupId: string;
  timestamp_ms: number;
  subject_1: SubjectSample | null;
  subject_2: SubjectSample | null;
}

export type StreamHealthStatus = 'healthy' | 'stale' | 'disconnected';
export type StreamHealthSource = 'backend' | 'engine';

/**
 * 서버 stream-health 이벤트 데이터 규격 정의함.
 */
export interface StreamHealthAlert {
  groupId: string;
  subjectIndex: number;
  status: StreamHealthStatus;
  source?: StreamHealthSource;
  silentMs?: number;
  recovered?: boolean;
}

/**
 * analysis-status 이벤트 페이로드 구조 정의함
 */
export interface AnalysisStatusPayload {
  groupId: string;
  tier: AnalysisTier;
  message: string;
}

/**
 * join-room ack 응답 구조 정의함 (PLAN L276)
 */
export interface JoinRoomAck {
  ok: boolean;
  groupId?: string;
  error?: string;
}

/**
 * join-operator-room ack 응답 구조 정의함
 */
export interface JoinOperatorRoomAck {
  ok: boolean;
  error?: string;
}

/** 서버가 보내는 이벤트 이름과 payload 타입의 대응표임 */
export interface ServerEventPayloads {
  'eeg-live': EegLivePayload;
  aligned_pair: AlignedPairPayload;
  'measurement-complete': MeasurementCompletePayload;
  'dual-session-ready': DualSessionReadyPayload;
  'dual-session-failed': DualSessionFailedPayload;
  stimulus_start: StimulusStartPayload;
  'stream-health': StreamHealthAlert;
  'analysis-status': AnalysisStatusPayload;
}
