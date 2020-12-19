using System;
using Microsoft.EntityFrameworkCore;

namespace Api.Web.Data
{
    public class FileDbContext : DbContext
    {
        public FileDbContext(DbContextOptions<FileDbContext> options) : base(options)
        {
        }

        public DbSet<FileMetadata> Files { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<FileMetadata>(builder =>
            {
                builder.ToTable("files");

                builder.HasKey(x => x.Id);

                builder.Property(x => x.Id).HasColumnType("text").HasColumnName("id").IsRequired()
                    .HasConversion(x => x.ToString(), x => Guid.Parse(x));
                builder.Property(x => x.Filename).HasColumnType("text").HasColumnName("filename").HasMaxLength(255).IsRequired();
                builder.Property(x => x.RawName).HasColumnType("text").HasColumnName("raw_name").HasMaxLength(255).IsRequired();
                builder.Property(x => x.ContentType).HasColumnType("text").HasColumnName("content_type").HasMaxLength(50).IsRequired();
                builder.Property(x => x.Size).HasColumnType("integer").HasColumnName("size").IsRequired();
                builder.Property(x => x.Hash).HasColumnType("text").HasColumnName("hash");
                builder.Property(x => x.FilledSize).HasColumnType("integer").HasColumnName("filled_size").IsRequired();
                builder.Property(x => x.CreatedAt).HasColumnType("text").HasColumnName("created_at").IsRequired()
                    .HasConversion(x => x.ToString("O"), x => DateTime.Parse(x));
            });
        }
    }
}