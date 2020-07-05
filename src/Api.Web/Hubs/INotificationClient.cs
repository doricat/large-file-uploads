using System.Threading.Tasks;

namespace Api.Web.Hubs
{
    public interface INotificationClient
    {
        Task ReceiveBlockId(BlockViewModel message);
    }
}