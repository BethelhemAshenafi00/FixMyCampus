namespace BackendApi.Domain.Entities
{
    public class Report
    {
        public int Id { get; set; }
        public string Title { get; set; }= string.Empty;
        public string Description { get; set; }=string.Empty;
        public string Category { get; set; }=string.Empty;
        public string Status { get; set; }=string.Empty;
    }
}