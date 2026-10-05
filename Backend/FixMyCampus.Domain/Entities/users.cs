namespace FixMyCampus.Domain.Entities
{
    public class Users
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
    
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
    }
}