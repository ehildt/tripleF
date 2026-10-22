import { getApiUrl } from '@/api/api-url';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';

/**
 * Cancel a running harness request by id. Posts to the backend cancel
 * endpoint and reports success/failure through the toast facade. Used by the
 * exchange header's cancel action; kept next to its only consumer.
 */
export function useAbortJob() {
  async function abortJob(requestId: string): Promise<boolean> {
    const toast = useToast();

    try {
      const res = await fetch(getApiUrl('/api/v1/harness/cancel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn('Abort failed:', text);
        toast.error(i18n.global.t('toast.failedCancelRequest'));
        return false;
      }

      const data = await res.json();
      const success = data.success ?? false;
      if (success) toast.info(i18n.global.t('toast.requestCancelled'));
      else toast.error(i18n.global.t('toast.failedCancelRequest'));
      return success;
    } catch (err) {
      console.error('Failed to abort job:', err);
      toast.error(i18n.global.t('toast.failedCancelRequest'));
      return false;
    }
  }

  return { abortJob };
}
