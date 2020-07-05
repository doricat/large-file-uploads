using System;

namespace Api.Web.Data
{
    public class FileMetadata
    {
        public Guid Id { get; set; }

        public string Filename { get; set; }

        public string RawName { get; set; }

        public string ContentType { get; set; }

        public int Size { get; set; }

        public FileState State { get; set; }

        public string Hash { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}