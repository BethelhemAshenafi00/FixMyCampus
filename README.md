# FixMyCampus — FixMyCampus

## Team Members & Responsibilities

* Bethelhem Ashenafi — Team Lead & Pitch
* Mekdes Adamu and Miheretab Fikadu — Frontend Developer
* Hailab Tesfaye — Backend Developer
* Gtachew Mesafent — Database & Full-Stack Developer
* Biruk Nigatu — QA & Testing

## Tech Stack Used

* Frontend: Angular 22
* Backend: ASP.NET Core Web API .NET 10
* Database: EF Core with PostgreSQL

## How to Run Locally

### Backend Setup

1. cd backend
2. dotnet restore
3. dotnet ef database update
4. dotnet run

### Frontend Setup

1. cd frontend
2. npm install
3. ng serve

## Test Accounts & Demo Credentials
                UserName = "admin",
                Email = "admin@fix.com",
                PasswordHash = "admin123",
                UserRole = UserRole.Admin.ToString()
            
                UserName = "technician",
                Email = "technician@fix.com",
                PasswordHash = "technician123",
                UserRole = UserRole.Technician.ToString()
        
        
                UserName = "student",
                Email = "student@fix.com",
                PasswordHash = "student123",
                UserRole = UserRole.User.ToString()
            


## Working Features




## Known Limitations & Bugs
