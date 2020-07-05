using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Api.Web.Data;
using Api.Web.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Api.Web.Services
{
    public class MergingService : BackgroundService
    {
        private readonly ILogger<MergingService> _logger;
        private readonly MergingQueue _mergingQueue;
        private readonly IServiceProvider _serviceProvider;
        private readonly IHubContext<NotificationHub, INotificationClient> _hubContext;
        private readonly IMemoryCache _memoryCache;

        public MergingService(ILogger<MergingService> logger,
            MergingQueue mergingQueue,
            IServiceProvider serviceProvider,
            IHubContext<NotificationHub, INotificationClient> hubContext,
            IMemoryCache memoryCache)
        {
            _logger = logger;
            _mergingQueue = mergingQueue;
            _serviceProvider = serviceProvider;
            _hubContext = hubContext;
            _memoryCache = memoryCache;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var item = await _mergingQueue.DequeueAsync(stoppingToken);

                if (item is FileInfo fileInfo)
                {
                    using (var file = File.Create(fileInfo.Filename))
                    {
                        var bytes = new byte[fileInfo.Size];
                        await file.WriteAsync(bytes, 0, bytes.Length, stoppingToken);

                        _logger.LogInformation("创建文件: {filename}", fileInfo.Filename);
                    }
                }
                else if (item is FileBlock fileBlock)
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetService<FileDbContext>();
                        var file = await dbContext.Files.FirstOrDefaultAsync(x => x.Id == fileBlock.FileId, stoppingToken);
                        if (file == null)
                        {
                            continue;
                        }

                        int fileSize;
                        using (var fileStream = File.Open(file.Filename, FileMode.Open, FileAccess.ReadWrite))
                        {
                            fileStream.Seek(fileBlock.Offset, SeekOrigin.Begin);
                            await fileStream.WriteAsync(fileBlock.Block, 0, fileBlock.Block.Length, stoppingToken);
                            _logger.LogInformation("填充文件: {filename}, {offset}, {length}", file.Filename, fileBlock.Offset, fileBlock.Block.Length);
                            fileSize = (int) fileStream.Length;
                        }

                        var notificationModel = new BlockViewModel
                        {
                            BlockId = fileBlock.Id
                        };
                        if (fileBlock.Offset + fileBlock.Block.Length == fileSize)
                        {
                            file.State = FileState.Merged;
                            dbContext.Entry(file).State = EntityState.Modified;
                            await dbContext.SaveChangesAsync(stoppingToken);
                            notificationModel.Last = true;
                        }
                        
                        if (_memoryCache.TryGetValue(fileBlock.FileId, out string connectionId))
                        {
                            var client = _hubContext.Clients.Client(connectionId);
                            await client.ReceiveBlockId(notificationModel);
                        }
                    }
                }
            }
        }
    }
}