# HR Harmony Suite - Employee Management System

## 📋 Overview

HR Harmony Suite is a comprehensive Human Resource Management System designed for hotel and hospitality businesses. It provides tools for employee management, recruitment, attendance tracking, payroll processing, and performance evaluation.

## ✨ Features

### 👥 Employee Management
- Complete employee directory with search and filters
- Employee profiles with personal, employment, and contact information
- Archive and restore functionality
- Role-based access control (Admin, HR, Manager, Accountant, Employee)
- Export employee data

### 📋 Recruitment Pipeline
- Job posting management with department and category
- Applicant tracking with pipeline stages
- Interview scheduling with HR interviewers
- Training assignment and tracking
- New hire onboarding with completion progress
- Automatic employee creation from completed onboarding

### ⏱️ Attendance & Timekeeping
- Live attendance dashboard with real-time stats
- Clock in/out functionality with shift-based late detection
- Attendance history with filters
- Excel/CSV bulk import
- Leave request submission and approval workflow
- Leave balance tracking and automatic accrual

### 💰 Payroll Management
- Pay period creation (semi-monthly/monthly)
- Automated payslip generation
- Statutory deductions (SSS, PhilHealth, Pag-IBIG, withholding tax)
- Payslip PDF download and email delivery
- Payroll summary by department
- Audit trail for all payroll actions
- Bulk email payslips

### 📊 Performance Evaluation
- Custom evaluation form builder (Likert scale + open-ended questions)
- Assign evaluators (HR users only)
- Evaluation submission and tracking
- Analytics dashboard with charts and response summaries
- Auto-close evaluations after deadline

### 🔐 Security & Roles
- **Admin**: Full system access
- **HR**: Recruitment, attendance, leave management, evaluations
- **Manager**: Team attendance, leave approvals
- **Accountant**: Payroll processing
- **Employee**: Self-service (attendance, leave requests, payslips)

## 🛠️ Tech Stack

### Backend
- **Framework**: Laravel 10.x
- **Database**: SQLite (development) / MySQL (production)
- **Authentication**: Laravel Sanctum
- **PDF Generation**: DomPDF
- **Email**: SMTP (Gmail/Mailtrip)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Hooks
- **HTTP Client**: Fetch API with auth wrapper

## 📁 Project Structure

```
hr-harmony-suite/
├── backend/                 # Laravel backend
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/ # API controllers
│   │   ├── Models/          # Eloquent models
│   │   └── Services/        # Business logic
│   ├── database/
│   │   ├── migrations/      # Database schema
│   │   └── seeders/         # Test data
│   └── routes/
│       └── api.php          # API routes
│
├── src/                     # React frontend
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   ├── types/               # TypeScript definitions
│   └── lib/                 # Utility functions
│
└── public/                  # Static assets
```

## 🚀 Installation

### Prerequisites
- PHP 8.1+
- Composer
- Node.js 18+
- NPM or Yarn

### Backend Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd hr-harmony-suite/backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database with test data
php artisan db:seed

# Start the backend server
php artisan serve
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd ../

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration

Create `.env` file in backend directory:

```env
APP_NAME="HR Harmony Suite"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
# or use MySQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=hr_harmony
# DB_USERNAME=root
# DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@hrharmony.com
MAIL_FROM_NAME="HR Harmony Suite"
```

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hrharmony.com | Admin@1234 |
| HR | hr@hrharmony.com | Hr@12345 |
| Accountant | accountant@hrharmony.com | Account@1 |
| Manager | manager@hrharmony.com | Manager@1 |
| Employee | employee@hrharmony.com | Employee@1 |

## 📱 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees |
| GET | `/api/employees/{id}` | Get employee details |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/{id}` | Update employee |
| DELETE | `/api/employees/{id}` | Archive employee |
| POST | `/api/employees/{id}/restore` | Restore archived |
| DELETE | `/api/employees/{id}/purge` | Permanent delete |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/clock-in` | Clock in |
| POST | `/api/attendance/clock-out` | Clock out |
| GET | `/api/attendance/live-status` | Today's stats |
| GET | `/api/attendance/export` | Export CSV |
| POST | `/api/attendance/import` | Bulk import |

### Payroll
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll-periods` | List periods |
| POST | `/api/payroll-periods` | Create period |
| POST | `/api/payslips/compute-all` | Generate payslips |
| POST | `/api/payslips/approve-all/{period}` | Bulk approve |
| POST | `/api/payslips/bulk-send-email` | Email all |
| GET | `/api/payslips/{id}/pdf` | Download payslip |

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
php artisan test
```

### Run Frontend Tests
```bash
npm run test
```

## 📦 Deployment

### Build for Production

```bash
# Frontend build
npm run build

# Backend production optimizations
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Production Requirements
- Web server (Apache/Nginx)
- PHP 8.1+ with extensions: BCMath, Ctype, JSON, MBString, OpenSSL, PDO, Tokenizer, XML
- MySQL 5.7+ or PostgreSQL 10+
- Composer
- Node.js (for asset compilation)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## 👨‍💻 Developer

**Annika Lois Dumalogdog**
- Email: [your-email@example.com]
- GitHub: [@your-username]

## 🙏 Acknowledgments

- Laravel community
- React community
- shadcn/ui for components
- Hotel industry partners for requirements feedback

---

## 🆘 Support

For issues or questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Contact the development team
3. Refer to API documentation in `/backend/docs`

## 📊 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| PHP | 8.1 | 8.2+ |
| MySQL | 5.7 | 8.0+ |
| Node.js | 18.x | 20.x |
| RAM | 2GB | 4GB |
| Storage | 1GB | 5GB |

## 🔄 Update History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-04 | Initial release |
| 1.1.0 | 2024-05 | Added payroll system |
| 1.2.0 | 2024-06 | Added performance evaluations |

---

**CSE17 project**
# memo-choreo
