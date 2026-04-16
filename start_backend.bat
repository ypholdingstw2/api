@echo off
cd /d C:\Shares\Coding\EqWizard_03
call venv\Scripts\activate
cd backend
python manage.py runserver
pause