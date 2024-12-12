ZoomCreatives CRM
ZoomCreatives CRM is a customer relationship management system designed to assist clients with various services such as visa inquiries (including Japan visa services), appointment management, and general customer interactions. The system supports multiple user roles, including users, admins, and superadmins, each with a distinct set of functionalities and dashboards.

Built with the MERN stack, ZoomCreatives CRM offers a responsive and modern platform that helps businesses streamline their operations and improve client communication.

Features
User Dashboard:
Submit visa inquiries (including Japan visa inquiries).
Book and manage appointments with ease.
Track the status of submitted inquiries and appointments.
Receive notifications for updates and responses.

Admin Dashboard:
Manage and respond to client inquiries (Visa, Japan visa, etc.).
View and manage appointments submitted by users.
Update the status of inquiries and appointments.
Notify clients about updates regarding their inquiries.

Superadmin Dashboard:
Full access to all features of the Admin dashboard.
Manage users, admins, and superadmins.
Configure and manage system-wide settings (roles, permissions, etc.).

Visa Inquiries:
Clients can inquire about visa-related services, including specific details about Japan visa processing.
Admins can review and respond to inquiries efficiently.

Appointment Management:
Clients can schedule appointments for various services.
Admins can view and manage these appointments, ensuring smooth scheduling and service delivery.

Real-Time Notifications:
Clients receive notifications regarding the status of their visa inquiries and appointments.
Admins get real-time alerts when a new inquiry or appointment is submitted.

Multi-Role Support:
Different access levels for users (client), admins, and superadmins ensure data security and role-specific features.
Tech Stack

Frontend:
React
Zustand (for state management)
React Hook Form (for handling forms and validations)

Backend:
Node.js
Express.js

Database:
MongoDB (NoSQL database)

Authentication:
JWT (JSON Web Tokens)

Other Tools:
bcryptjs (for password encryption)
dotenv (for environment variable management)
cors (to handle cross-origin requests)

Installation
Prerequisites
Before starting, make sure you have the following installed on your machine:

Node.js (version 14 or higher)
MongoDB (can be local or use MongoDB Atlas)
NPM or Yarn package manager
Setup

Clone the repository to your local machine:
git clone https://github.com/suniel1921/zoomcreatives-crm.git

Navigate into the project directory:
cd zoomcreatives-crm
Install dependencies for both the frontend and backend:

For the backend:

cd backend
npm install
For the frontend:

cd frontend
npm install
Create an .env file in both the frontend and backend folders with the following variables:

Backend .env Example:

MONGODB_URI=mongodb://localhost:27017/zoomcreatives
JWT_SECRET=your_jwt_secret_key
PORT=5000
Frontend .env Example:

REACT_APP_API_URL=http://localhost:5000/api
Start both the frontend and backend servers:

For the backend:
cd backend
npm run dev

For the frontend:
cd frontend
npm start
The application will be running at http://localhost:3000 (Frontend) and http://localhost:5000 (Backend).

Usage
For Users:

Visit the user dashboard after creating an account or logging in.
Submit inquiries related to visas or other services.
Book and manage appointments and track their statuses.
For Admins:

Log in to the admin dashboard to manage user inquiries.
Approve, reject, or respond to inquiries and manage appointments.
Send notifications to users based on their inquiries and appointments.
For Superadmins:

Full access to all admin features.
Manage users and assign roles (Admin/Superadmin).
Configure system-wide settings and permissions.
Contributing
We welcome contributions to improve this project! To contribute:

Fork this repository.
Create a new branch (git checkout -b feature/your-feature).
Make your changes and commit them (git commit -am 'Add feature').
Push to your branch (git push origin feature/your-feature).
Create a pull request.


License
This project is licensed under the MIT License - see the LICENSE file for details.