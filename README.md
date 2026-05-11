# ⚡ LeadFlow CRM

A role-based Customer Relationship Management (CRM) web app to manage leads, track conversions, and analyze performance.

---

## 🌐 Live Demo

👉 https://kalpana6497-cmd.github.io/FUTURE_FS_02/

---

## 🔐 Demo Login

| Role      | Username | Password   |
| --------- | -------- | ---------- |
| Admin     | `admin`  | `admin123` |
| Sales Rep | `sales1` | `sales123` |
| Sales Rep | `sales2` | `sales456` |

---

## 📝 Registering a New Account

* **Sales Rep** → Anyone can register freely
* **Admin** → Requires secret key: `LEADFLOW2024`

---

## ⚠️ If Login Doesn't Work

This app uses browser storage. If demo login fails:

1. Press **F12**
2. Go to **Console**
3. Run:

   ```js
   localStorage.clear()
   ```
4. Refresh the page

---

## 🚀 Features

* 🔑 Login & Registration system
* 👤 Role-based access (Admin / Sales)
* 📋 Lead management (Add, Edit, Delete)
* 📝 Notes & follow-ups
* 📊 Analytics dashboard
* 🔍 Filters & search
* 👥 User management (Admin only)

---

## 🛠️ Tech Stack

* HTML
* CSS
* JavaScript
* LocalStorage

---

## 📌 How It Works

* Data is stored in browser using LocalStorage
* Admin can see all leads
* Sales reps see only assigned leads

---

## 📁 Files

* index.html
* style.css
* script.js

---

## 💡 Future Improvements

* Backend (Node.js / Express)
* Database integration
* Secure authentication
* Cloud deployment

---

## 🙌 Acknowledgment

Built as part of my **Full Stack Web Development Internship at Future Interns**.
