namespace Api.Web.Services
{
    public class FileBlock : FileItem
    {
        public byte[] Block { get; set; }

        public int Id { get; set; }

        public int Offset { get; set; }
    }
}