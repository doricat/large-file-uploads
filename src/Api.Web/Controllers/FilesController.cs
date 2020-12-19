using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Api.Web.Data;
using Api.Web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Api.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly ILogger<FilesController> _logger;
        private readonly MergingQueue _mergingQueue;
        private readonly FileDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _memoryCache;

        public FilesController(ILogger<FilesController> logger,
            MergingQueue mergingQueue,
            FileDbContext dbContext,
            IConfiguration configuration,
            IMemoryCache memoryCache)
        {
            _logger = logger;
            _mergingQueue = mergingQueue;
            _dbContext = dbContext;
            _configuration = configuration;
            _memoryCache = memoryCache;
        }

        public async Task<IActionResult> Get()
        {
            var files = await _dbContext.Files.Where(x => x.State == FileState.Merged).ToListAsync();
            return Ok(files);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get([FromRoute] Guid id)
        {
            var file = await _dbContext.Files
                .FirstOrDefaultAsync(x => x.Id == id && x.State == FileState.Merged, HttpContext.RequestAborted);
            if (file == null)
            {
                return NotFound();
            }

            var path = file.Filename.StartsWith(".") ? Path.GetFullPath(file.Filename) : file.Filename;
            return PhysicalFile(path, file.ContentType);
        }

        [HttpPost("{connectionId}")]
        public async Task<IActionResult> Post([FromRoute] string connectionId, [FromBody] FileViewModel model)
        {
            var fileId = Guid.NewGuid();
            var filename = Path.Combine(_configuration.GetValue<string>("RootDirectory"),
                Path.GetRandomFileName()).Replace("\\", "/");
            _dbContext.Files.Add(new FileMetadata
            {
                Id = fileId,
                RawName = model.Filename,
                Filename = filename,
                Size = model.Size,
                CreatedAt = DateTime.Now,
                ContentType = model.ContentType,
                State = FileState.Uploading,
                Hash = model.Hash,
                FilledSize = 0
            });
            await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

            _mergingQueue.QueueWorkItem(new Services.FileInfo
            {
                FileId = fileId,
                Size = model.Size,
                Filename = filename
            });

            _memoryCache.Set(fileId, connectionId);

            return Created($"/files/{fileId}", new {Id = fileId});
        }

        [HttpPatch("{id}")]
        public IActionResult Patch([FromRoute] Guid id, [FromBody] FileBlockViewModel model)
        {
            var block = Convert.FromBase64String(model.FileStream);

            _mergingQueue.QueueWorkItem(new FileBlock
            {
                FileId = id,
                Id = model.Id,
                Block = block,
                Offset = model.Offset
            });

            return Accepted();
        }
    }
}