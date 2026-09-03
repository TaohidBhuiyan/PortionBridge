@echo off
echo Setting up PortionBridge Database...
echo.

echo Checking MySQL connection...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1;" 2>&1
if %errorlevel% neq 0 (
    echo MySQL connection failed. Please check XAMPP MySQL status.
    pause
    exit /b 1
)

echo MySQL connection successful!
echo.

echo Creating portionbridge database if not exists...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS portionbridge;"

echo Importing main schema...
"C:\xampp\mysql\bin\mysql.exe" -u root portionbridge < "C:\Users\HP\Desktop\PortionBridge\portionbridge\database\main_schema.sql"

echo Importing triggers...
"C:\xampp\mysql\bin\mysql.exe" -u root portionbridge < "C:\Users\HP\Desktop\PortionBridge\portionbridge\database\triggers.sql"

echo Importing dummy data (optional)...
"C:\xampp\mysql\bin\mysql.exe" -u root portionbridge < "C:\Users\HP\Desktop\PortionBridge\portionbridge\database\dummy_data.sql"

echo.
echo Database setup completed!
pause