# ⚡ LeadFlow CRM

A simple multi-user **Customer Relationship Management (CRM)** web application built using HTML, CSS, and JavaScript.
It allows teams to manage leads, track progress, and analyze performance with role-based access.

---

## 🚀 Features

### 🔐 Authentication

* User Login & Registration
* Role-based access:

  * **Admin** → Full access
  * **Sales Rep** → Limited to assigned leads
* Demo accounts available for testing

---

### 👥 Lead Management

* Add, edit, and delete leads
* Assign leads to sales reps (Admin only)
* Track lead status:

  * New
  * Contacted
  * Converted
* Add notes and follow-ups

---

### 📊 Analytics Dashboard

* Conversion funnel
* Leads by source
* Performance by sales reps (Admin only)
* Recent activity tracking

---

### 🔎 Filters & Search

* Search by name, email, or company
* Filter by:

  * Status
  * Source
  * Assigned rep
* Sort leads by date or name

---

### 👤 User Management (Admin Only)

* View all registered users
* Remove sales reps
* Track leads assigned per user

---

## 🧪 Demo Accounts

Use these credentials to test the app:

```
Admin:
Username: admin
Password: admin123

Sales:
Username: sales1
Password: sales123
```

---

## ⚠️ Important Note

If login fails with demo accounts:

1. Open browser console (F12)
2. Run:

```
localStorage.clear();
```

3. Refresh the page

---

## 🛠️ Tech Stack

* HTML5
* CSS3
* Vanilla JavaScript
* LocalStorage (for data persistence)

---

## 📁 Project Structure

```
/project-folder
│── index.html
│── style.css
│── script.js
```

---

## 🔒 Admin Access

To register as an admin, use the secret key:

```
LEADFLOW2024
```

---

## 💡 Future Improvements

* Backend integration (Node.js / Express)
* Database (MongoDB / MySQL)
* Authentication with JWT
* Password encryption
* Real-time updates

---

## 📌 How to Run

1. Download or clone the project
2. Open `index.html` in your browser
3. Start using the CRM

---

## 🙌 Author

Built for learning and project development purposes.

---
