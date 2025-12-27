import { computed, ref } from 'vue';
import type { Paper, PaperAnalytics, PaperFilters, PaperListResponse, PaperStatus } from '@/types/papers';
import { mockPapers, mockReviews, mockPaperAnalytics } from '@/mocks/papers';

export const usePapers = (eventId: string) => {
  const papers = ref<Paper[]>(mockPapers);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const page = ref(1);
  const perPage = ref(10);

  const getAllPapers = async (filters?: PaperFilters): Promise<PaperListResponse> => {
    loading.value = true;
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      let filtered = [...papers.value];

      // Apply filters
      if (filters?.status) {
        filtered = filtered.filter(p => p.current_status === filters.status);
      }
      if (filters?.topic_id) {
        filtered = filtered.filter(p => p.topic.topic_id === filters.topic_id);
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          p =>
            p.title.toLowerCase().includes(searchLower) ||
            p.abstract.toLowerCase().includes(searchLower) ||
            p.authors.some(a => a.name.toLowerCase().includes(searchLower)),
        );
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / perPage.value);
      const startIndex = (page.value - 1) * perPage.value;
      const paginatedPapers = filtered.slice(startIndex, startIndex + perPage.value);

      return {
        papers: paginatedPapers,
        total,
        page: page.value,
        per_page: perPage.value,
        total_pages: totalPages,
      };
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch papers';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getPaperDetails = async (paperId: string): Promise<Paper | null> => {
    loading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return papers.value.find(p => p.paper_id === paperId) || null;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch paper details';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getReviewsForPaper = async (paperId: string) => {
    loading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockReviews.filter(r => r.paper_id === paperId);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch reviews';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const submitAbstract = async (data: Partial<Paper>): Promise<any> => {
    loading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newPaper: Paper = {
        ...data as Paper,
        paper_id: `paper-${Date.now()}`,
        current_status: 'abstract_submitted',
        current_phase: 'abstract',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // For mock purposes, we don't persist to the ref here unless we want it to stay during the session
      return { success: true, paper: newPaper };
    } catch (err: any) {
      error.value = err.message || 'Failed to submit abstract';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uploadFullPaper = async (paperId: string, file: File): Promise<any> => {
    loading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Full paper uploaded successfully' };
    } catch (err: any) {
      error.value = err.message || 'Failed to upload full paper';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const changePaperStatus = async (paperId: string, status: PaperStatus): Promise<void> => {
    loading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const paper = papers.value.find(p => p.paper_id === paperId);
      if (paper) {
        paper.current_status = status;
        paper.updated_at = new Date().toISOString();
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to change status';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const bulkChangePaperStatus = async (paperIds: string[], status: PaperStatus): Promise<void> => {
    loading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      paperIds.forEach(id => {
        const paper = papers.value.find(p => p.paper_id === id);
        if (paper) {
          paper.current_status = status;
          paper.updated_at = new Date().toISOString();
        }
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to bulk change status';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const assignReviewer = async (paperId: string, reviewerId: string): Promise<void> => {
    loading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Mock logic: find paper and add reviewer if not already there
      const paper = papers.value.find(p => p.paper_id === paperId);
      if (paper) {
        // This is mock, we just log it or simulate for this session
        console.log('Mock: Assigned reviewer', { paperId, reviewerId });
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to assign reviewer';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const removePaperReviewer = async (paperId: string, reviewerId: string): Promise<void> => {
    loading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('Mock: Removed reviewer', { paperId, reviewerId });
    } catch (err: any) {
      error.value = err.message || 'Failed to remove reviewer';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getPaperAnalytics = async (): Promise<PaperAnalytics> => {
    loading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      return mockPaperAnalytics;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch analytics';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    papers: computed(() => papers.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    page,
    perPage,
    getAllPapers,
    getPaperDetails,
    getReviewsForPaper,
    submitAbstract,
    uploadFullPaper,
    changePaperStatus,
    bulkChangePaperStatus,
    assignReviewer,
    removePaperReviewer,
    getPaperAnalytics,
  };
};
