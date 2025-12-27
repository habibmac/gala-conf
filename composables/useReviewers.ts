import { computed, ref } from 'vue';
import type { Reviewer, ReviewerWorkload } from '@/types/papers';
import { mockReviewers, mockReviewerWorkload } from '@/mocks/papers';

export const useReviewers = (eventId: string) => {
  const reviewers = ref<Reviewer[]>(mockReviewers);
  const workload = ref<ReviewerWorkload[]>(mockReviewerWorkload);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const getReviewers = async (): Promise<Reviewer[]> => {
    loading.value = true;
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return mockReviewers;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch reviewers';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getReviewerWorkload = async (): Promise<ReviewerWorkload[]> => {
    loading.value = true;
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return mockReviewerWorkload;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch reviewer workload';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getReviewerById = async (reviewerId: string): Promise<Reviewer | null> => {
    loading.value = true;
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));

      return mockReviewers.find(r => r.user_id === reviewerId) || null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch reviewer';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const addReviewer = async (reviewer: Reviewer): Promise<void> => {
    loading.value = true;
    try {
      // TODO: Real API call
      console.log('TODO: Add reviewer API call', reviewer);
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add reviewer';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateReviewer = async (reviewerId: string, data: Partial<Reviewer>): Promise<void> => {
    loading.value = true;
    try {
      // TODO: Real API call
      console.log('TODO: Update reviewer API call', { reviewerId, data });
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update reviewer';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const removeReviewer = async (reviewerId: string): Promise<void> => {
    loading.value = true;
    try {
      // TODO: Real API call
      console.log('TODO: Remove reviewer API call', { reviewerId });
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove reviewer';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    reviewers: computed(() => reviewers.value),
    workload: computed(() => workload.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    getReviewers,
    getReviewerWorkload,
    getReviewerById,
    addReviewer,
    updateReviewer,
    removeReviewer,
  };
};
