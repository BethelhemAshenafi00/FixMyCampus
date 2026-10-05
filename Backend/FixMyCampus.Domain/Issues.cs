namespace BackendApi.Domain.Entities
{
    public class Issues
    {
        public int Id { get; set; }
        public string Title { get; set; }= string.Empty;
        public string Description { get; set; }=string.Empty;
        public string Category { get; set; }=string.Empty;
        public string ReporterId { get; set; }=string.Empty;
        
        public theStatus Status { get; set; }=theStatus.New;
        public thePriority Priority { get; set; }=thePriority.Low;
        public DateTime CreatedAt { get; set; }=DateTime.Now;
    }
}
