using System.ComponentModel.DataAnnotations;

namespace Api.Web.Controllers
{
    public class FileBlockViewModel
    {
        [Required]
        public string FileStream { get; set; }

        [Required]
        public int Id { get; set; }

        [Required]
        public int Offset { get; set; }

        /*[Required]
        public string Hash { get; set; }*/
    }
}