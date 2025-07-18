# 🍽️ Canteen Management System

A modern full-stack web application to manage and automate meal booking and delivery in a college canteen. Built using **Next.js**, **Flask**, and **MySQL**, this system simplifies the process for students to book meals and for canteen admins to manage and serve them efficiently.

---

## 🧩 Features

### 👨‍🎓 Student Interface
- 🔐 **Login with JWT authentication**
- 📅 **Book meals** (breakfast, lunch, dinner)
- 🔁 **Cancel bookings** anytime before the meal
- 🧾 **View order history** (/orders page)
- 🧠 **OTP-based meal collection**
- ⏱️ **Live feedback after booking/cancellation**

### 🧑‍🍳 Canteen Admin Interface
- **Dashboard** with all orders separated by meal
- **Show/hide sections** dynamically
- **Confirm meal serving** using OTP
- **Statistics page**:
  - Monthly food consumption for each meal
  - Weekly consumption
  - Average daily and monthly trends
  - All data represented using bar/line graphs

---

## ⚙️ Tech Stack

### Frontend
- **Next.js 15+**
- **Tailwind CSS**
- **Chart.js** (via `react-chartjs-2`)
- **Fetch API** for all requests (No Axios)

### Backend
- **Flask**
- **JWT Authentication**
- **MySQL** (via MySQL Connector)

---

## Getting Started

### frontend setup
cd frontend
npm install
npm run dev

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
