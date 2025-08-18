# **App Name**: MotionFlow

## Core Features:

- Dual User Roles: Admin and client user roles with role-based dashboard routing after login.
- Secure Authentication: Secure user authentication via Firebase Authentication.
- Admin Dashboard: Admin dashboard with overview of total revenue, active projects, total clients, and pending payments.
- Project Management: Admin project management including data tables, search/sort, project creation, updates, and payment tracking.
- Client Management: Admin client management with detailed client info and project history.
- Settings: Admin settings to configure API keys for Nextcloud and payment gateways.
- Client Portal: Client portal with project cards, video previews, payment options, and file downloads with expiry.
- Admin Panel - Client Management: Manage all clients and assign projects.
- Admin Panel - Project Creation: Create new projects with title, description, preview video link, final downloadable video, expiry date, payment status and order ID.
- Admin Panel - Video Management: Upload, download, and manage videos using Nextcloud WebDAV API.
- Admin Panel - Nextcloud Credentials: Add/edit/delete Nextcloud credentials.
- Admin Panel - bKash Credentials: Add/edit/delete bKash API credentials.
- Admin Panel - PipraPay Credentials: Add/edit/delete PipraPay API credentials.
- Admin Panel - Reporting: See project/payment reports per client.
- Admin Panel - Automation: Automated deletion of expired projects from Nextcloud using a scheduled cron job.
- Admin Panel - Notifications: Admin notifications when clients make payments.
- Client Portal - Registration/Login: Clients can register/login.
- Client Portal - Project View: See only their assigned projects.
- Client Portal - Video Preview: Preview video via streaming (Nextcloud embed).
- Client Portal - Video Download: Download final video only after payment is confirmed.
- Client Portal - Expiry Handling: Expired projects should show “Expired” and restrict download.
- Client Portal - Payment Integration: Payment handled via bKash or PipraPay with secure verification.
- Payments - Gateway Integration: bKash and PipraPay integration (sandbox & production mode).
- Payments - Status Update: Automatic update of project payment status on successful payment.
- Payments - Access Control: Download link unlock only after verified payment.
- Security - Authentication: JWT-based login with role-based access (Admin/Client).
- Security - Authorization: Only assigned clients can see their projects.
- Security - Input Handling: Sanitize all inputs, secure file links (prevent direct access).
- Security - Credentials: Use environment variables for API credentials.

## Style Guidelines:

- Primary color: Deep Indigo (#3F51B5) to convey professionalism and trust.
- Background color: Light Gray (#F5F5F5), to provide a clean and modern backdrop for the content.
- Accent color: Teal (#009688) to draw attention to key actions and elements.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines, 'Inter' (sans-serif) for body.
- Use minimalist line icons from a consistent set for navigation and actions.
- Responsive grid layout to ensure optimal viewing across devices. Card-based design for project summaries.
- Subtle transitions and animations for feedback on interactions (e.g., button presses, loading states).