using System.ComponentModel.DataAnnotations;

namespace Api.Web.Controllers
{
    public class FileViewModel
    {
        [Required]
        public int Size { get; set; }

        public string Hash { get; set; }

        [Required]
        public string Filename { get; set; }

        [Required]
        public string ContentType { get; set; }
    }
}