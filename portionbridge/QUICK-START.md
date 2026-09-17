# PortionBridge Quick Start Guide

## 🚀 সবচেয়ে সহজ উপায় - এক ক্লিকে সার্ভার চালু করুন

### পদ্ধতি ১: START-RELIABLE.bat (সবচেয়ে reliable)
```bash
START-RELIABLE.bat
```

এটি করবে:
- ✅ আগের সব node processes বন্ধ করবে (conflict avoid)
- ✅ Backend server চালু করবে (port 5000)
- ✅ Frontend server চালু করবে (port 5173)
- ✅ অটোমেটিক browser খুলবে

### পদ্ধতি ২: PowerShell Script
```powershell
.\start.ps1
```

### পদ্ধতি ৩: Manual Startup
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

## 🛑 সার্ভার বন্ধ করতে

### সবচেয়ে সহজ উপায়:
```bash
stop-improved.bat
```

অথবা যে দুটো command window খুলেছে সেগুলো বন্ধ করুন।

## 🌐 Access URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api/v1
- **API Documentation:** http://localhost:5000/api-docs

## ⚠️ সমস্যা হলে কী করবেন

### "localhost refused to connect" এলে:

1. **Ports চেক করুন:**
```bash
netstat -ano | findstr :5000
netstat -ano | findstr :5173
```

2. **সব node processes বন্ধ করুন:**
```bash
taskkill /F /IM node.exe
```

3. **আবার START-RELIABLE.bat চালান**

### Database connection error:

1. MySQL/XAMPP চালু আছে কিনা চেক করুন
2. server/.env এ DB configuration চেক করুন

### Port already in use:

```bash
# কোন process port 5000 ব্যবহার করছে দেখুন
netstat -ano | findstr :5000

# সেই process kill করুন (PID দিয়ে)
taskkill /PID <PID> /F
```

## 📋 Environment Setup

প্রথমবার চালানোর আগে:
```bash
setup-env.bat
```

এটি আপনাকে Brevo API key এবং Google OAuth setup করতে help করবে।

## 🎯 Daily Workflow

1. **শুরুতে:** `START-RELIABLE.bat` চালান
2. **কাজ করুন:** http://localhost:5173 এ কাজ করুন
3. **শেষে:** `stop-improved.bat` চালান অথবা windows বন্ধ করুন

## 🔧 Advanced Options

### শুধু backend চালু করতে:
```bash
cd server
npm run dev
```

### শুধু frontend চালু করতে:
```bash
cd client  
npm run dev
```

### Production build:
```bash
# Frontend build
cd client
npm run build

# Backend production mode
cd server
NODE_ENV=production npm start
```

## 📝 Notes

- সবসময় `portionbridge` ফোল্ডার থেকে scripts চালান
- .env file কখনো delete করবেন না
- Development mode এ email verification auto-bypass হয়
- API docs দেখতে http://localhost:5000/api-docs খুলুন
