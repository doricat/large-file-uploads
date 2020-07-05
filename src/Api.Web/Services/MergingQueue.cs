using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

namespace Api.Web.Services
{
    public class MergingQueue
    {
        private readonly SemaphoreSlim _signal = new SemaphoreSlim(0);
        private readonly ConcurrentQueue<FileItem> _workItems = new ConcurrentQueue<FileItem>();

        public void QueueWorkItem(FileItem item)
        {
            _workItems.Enqueue(item);
            _signal.Release();
        }

        public async Task<FileItem> DequeueAsync(CancellationToken cancellationToken)
        {
            await _signal.WaitAsync(cancellationToken);
            _workItems.TryDequeue(out var item);

            return item;
        }
    }
}