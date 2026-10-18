import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import type { AnalysisResultResponse } from '@/07-shared/api/analysis';
import type { AnalysisStatusPayload } from '@/07-shared/lib/socket-events';

/**
 * 결과 화면 ABORTED 처리 검증함 (SESSION-W008, FE #97 리뷰).
 * - 세션 조회가 실패해도 결과 조회 404 의 ABORTED 로 재측정 안내를 띄움
 * - ABORTED 확정 뒤 늦게 도착한 폴링 성공 응답이 화면을 덮지 않음
 */

const { mockGetResult, mockCheckStatus, socketHandlers } = vi.hoisted(() => ({
  mockGetResult: vi.fn(),
  mockCheckStatus: vi.fn(),
  socketHandlers: {} as Record<string, (payload: unknown) => void>,
}));

vi.mock('@/07-shared/api/analysis', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/07-shared/api/analysis')>()),
  analysisApi: { getResult: mockGetResult, getMyResults: vi.fn() },
}));

vi.mock('@/07-shared/api/session', () => ({
  default: { checkSessionStatus: mockCheckStatus },
}));

vi.mock('@/07-shared/lib/socket-client', () => ({
  getSocket: () => ({
    emit: vi.fn(),
    on: (event: string, handler: (payload: unknown) => void) => {
      socketHandlers[event] = handler;
    },
    off: vi.fn(),
  }),
}));

// 폴링 간격만 줄임
vi.mock('@/07-shared/constants/experiment', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/07-shared/constants/experiment')
  >()),
  POLLING_INTERVAL_MS: 20,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('html2canvas', () => ({ default: vi.fn() }));

import Results from './results';

const GROUP_ID = 'group-1';

/** 백엔드 결과 조회 404 응답을 담은 AxiosError 생성함 */
function notFound(tier: string | null) {
  return new AxiosError('Not Found', '404', undefined, undefined, {
    status: 404,
    statusText: 'Not Found',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { status: 'fail', message: '분석 결과를 찾을 수 없습니다.', tier },
  });
}

function renderResults() {
  return render(
    <Results
      theme="light"
      isLoggedIn
      setIsLoggedIn={vi.fn()}
      setCurrentPage={vi.fn()}
      openAuthModal={vi.fn()}
      groupId={GROUP_ID}
    />
  );
}

describe('Results ABORTED 처리 (SESSION-W008)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckStatus.mockResolvedValue({ data: { data: { sessions: [] } } });
  });

  it('세션 조회가 실패해도 결과 조회 404 tier ABORTED 면 재측정 안내를 띄움', async () => {
    mockGetResult.mockRejectedValue(notFound('ABORTED'));
    mockCheckStatus.mockRejectedValue(new Error('network'));

    renderResults();

    expect(await screen.findByText('분석 불가')).toBeInTheDocument();
    expect(
      screen.queryByText('일시적 오류가 발생했습니다.')
    ).not.toBeInTheDocument();
  });

  it('ABORTED 가 아니면 세션 조회 실패는 기존처럼 일반 오류로 처리함', async () => {
    mockGetResult.mockRejectedValue(notFound(null));
    mockCheckStatus.mockRejectedValue(new Error('network'));

    renderResults();

    expect(
      await screen.findByText('일시적 오류가 발생했습니다.')
    ).toBeInTheDocument();
  });

  it('ABORTED 확정 뒤 늦게 도착한 폴링 성공 응답은 화면을 덮지 않음', async () => {
    let resolvePoll!: (res: AnalysisResultResponse) => void;
    mockGetResult
      .mockRejectedValueOnce(notFound(null))
      .mockImplementationOnce(() => new Promise((r) => (resolvePoll = r)))
      .mockRejectedValue(notFound(null));

    renderResults();
    // 폴링 요청이 나갈 때까지 기다림
    await waitFor(() =>
      expect(mockGetResult.mock.calls.length).toBeGreaterThanOrEqual(2)
    );

    const abort: AnalysisStatusPayload = {
      groupId: GROUP_ID,
      tier: 'ABORTED',
      message: '분석에 실패했습니다.',
    };
    act(() => socketHandlers['analysis-status'](abort));
    await act(async () => {
      resolvePoll({
        status: 'success',
        data: {
          groupId: GROUP_ID,
          matchingScore: 80,
          synchronyScore: null,
          yScore: null,
          aiComment: '',
          markdown: '',
          user1Name: null,
          user2Name: null,
          isBTI: false,
          metricsMean: null,
          wavesMean: null,
          tier: 'VALID',
        },
      });
    });

    expect(screen.getByText('분석 불가')).toBeInTheDocument();
  });

  it('초기 조회 대기 중 소켓 ABORTED 뒤 성공 응답이 와도 재측정 안내를 유지함', async () => {
    let resolveFirst!: (res: AnalysisResultResponse) => void;
    mockGetResult.mockImplementationOnce(
      () => new Promise((r) => (resolveFirst = r))
    );

    renderResults();
    await waitFor(() => expect(mockGetResult).toHaveBeenCalledTimes(1));

    const abort: AnalysisStatusPayload = {
      groupId: GROUP_ID,
      tier: 'ABORTED',
      message: '분석에 실패했습니다.',
    };
    act(() => socketHandlers['analysis-status'](abort));
    await act(async () => {
      resolveFirst({
        status: 'success',
        data: {
          groupId: GROUP_ID,
          matchingScore: 80,
          synchronyScore: null,
          yScore: null,
          aiComment: '',
          markdown: '',
          user1Name: null,
          user2Name: null,
          isBTI: false,
          metricsMean: null,
          wavesMean: null,
          tier: 'VALID',
        },
      });
    });

    expect(screen.getByText('분석 불가')).toBeInTheDocument();
  });
});
