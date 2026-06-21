# MS HRMS — Employee Profile Module

## User Manual | Version 1.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Who Uses This Module](#2-who-uses-this-module)
3. [Getting Started — Logging In](#3-getting-started--logging-in)
4. [My Profile — For All Employees](#4-my-profile--for-all-employees)
   - 4.1 Viewing Your Profile
   - 4.2 Profile Completion Ring
   - 4.3 Uploading Your Profile Photo
   - 4.4 Editing Your Personal Information
   - 4.5 Submitting a Change Request
5. [Employees Section — For HR & Admin](#5-employees-section--for-hr--admin)
   - 5.1 Viewing the Employee Directory
   - 5.2 Creating a New Employee
   - 5.3 Editing an Employee Profile
   - 5.4 Uploading Employee Documents
   - 5.5 KYC Verification
   - 5.6 Generating Letters
6. [Change Requests — For HR & Admin](#6-change-requests--for-hr--admin)
   - 6.1 Reviewing Profile Update Requests
   - 6.2 Reviewing Document Verification Requests
   - 6.3 Approving or Rejecting a Request
7. [Document Types Reference](#7-document-types-reference)
8. [Frequently Asked Questions](#8-frequently-asked-questions)
9. [Support Contact](#9-support-contact)

---

## 1. Overview

The **Employee Profile Module** is the central hub for all employee information in MS HRMS. It covers:

- Complete employee profiles (personal, contact, bank, and emergency information)
- Secure document storage (ID proofs, bank proofs, education certificates)
- KYC (Know Your Customer) verification workflow
- Auto-generated employment letters
- A controlled change-request system so employees can propose profile updates that HR reviews before applying

This module ensures employee data is always accurate, verified, and audit-ready.

---

## 2. Who Uses This Module

| Role         | What They Can Do                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Employee** | View their own profile, upload a profile photo, submit change requests                                                  |
| **HR**       | Create and edit all employee profiles, upload and verify documents, generate letters, approve or reject change requests |
| **Admin**    | Full access — everything HR can do, plus permission management                                                          |
| **Manager**  | View employee directory (read only, based on permissions set by admin)                                                  |
| **Accounts** | View only — as configured by admin                                                                                      |

> **Note:** What each role can see and do is controlled by the Permissions module. If a menu item or button is not visible to you, it means your role does not have access to it. Contact your system administrator.

---

## 3. Getting Started — Logging In

1. Open your browser and go to the MS HRMS URL provided by your system administrator.
2. Enter your **Email** and **Password**.
3. Click **Login**.
4. You will land on the **Dashboard**, which shows a summary of the system.
5. Use the **left sidebar** to navigate between modules.

> If you have forgotten your password, click **Forgot password?** on the login page and follow the instructions sent to your email.

---

## 4. My Profile — For All Employees

Every user (regardless of role) has a **My Profile** section where they can view their own information.

### 4.1 Viewing Your Profile

1. In the left sidebar, click **My Profile**.
2. Your profile page opens showing:
   - Profile photo (or your initials if no photo is uploaded)
   - Personal details (name, email, phone, address, date of birth, gender)
   - Emergency contact details
   - Bank account details
   - KYC documents uploaded by HR

### 4.2 Profile Completion Ring

At the top of your profile you will see a **circular progress ring** showing your profile completion percentage (e.g., 0%, 45%, 100%).

- The ring turns **amber** when completion is below 60%
- It turns **blue** when between 60–99%
- It turns **green** when the profile is 100% complete

Below the ring, a list of **Missing fields** is shown so you know exactly what information is incomplete. You cannot edit most of these fields directly — you must submit a **Change Request** (see Section 4.5) and HR will apply the update after review.

### 4.3 Uploading Your Profile Photo

You can upload your own profile photo directly without waiting for HR.

1. Go to **My Profile**.
2. Click on the circle showing your initials (or your current photo) at the top of the page.
3. A camera icon appears when you hover over it.
4. Click it — a file picker opens.
5. Select a photo from your computer (JPEG, PNG, or WebP format; maximum 5 MB).
6. The photo uploads automatically and your profile updates immediately.

> Your photo is stored securely and is only visible to users within the system.

### 4.4 Editing Your Personal Information

Employees can view their own data but **cannot directly edit** most fields. This protects data integrity — all changes go through an approval workflow. See Section 4.5 below.

### 4.5 Submitting a Change Request

If your personal details have changed (for example, phone number, address, or bank account), you submit a **Change Request**:

1. Go to **My Profile**.
2. Scroll to the field you want to update (e.g., Phone number).
3. Edit the value in the input field.
4. Click **Submit for approval** (or the save button next to that section).
5. A request is sent to HR for review.
6. You will be notified when HR approves or rejects the change.
7. Once approved, your profile is updated automatically.

> Changes are **not applied immediately** — they go to HR for review first. This ensures accuracy and prevents unauthorized data changes.

---

## 5. Employees Section — For HR & Admin

HR and Admin users have access to the full **Employees** section, which shows every employee in the system.

### 5.1 Viewing the Employee Directory

1. In the left sidebar, click **Employees**.
2. A list of all employees is shown on the left panel, with a search bar at the top.
3. Type a name or email in the search box to filter the list.
4. Click on any employee name to open their full profile on the right panel.

### 5.2 Creating a New Employee

1. Go to **Employees**.
2. Click the **New employee** button (top right of the page).
3. The form clears on the right panel.
4. Fill in the required fields:
   - **Name** (full name)
   - **Email** (must be unique; this becomes their login email)
   - **Role** (Employee, Manager, HR, Accounts, Admin)
   - **Department**
   - **Designation / Job title**
   - **Date of joining**
5. Fill in optional fields as available (phone, address, date of birth, gender, emergency contact, bank details).
6. Click **Save employee**.
7. The system creates the employee account and sends a **password setup email** to their email address automatically.

> The new employee can log in only after they set their password via the link in the email.

### 5.3 Editing an Employee Profile

1. Go to **Employees** and select the employee from the list.
2. Update any field in the form on the right.
3. Click **Save employee**.
4. A success notification confirms the save.

HR and Admin can edit all fields directly without going through the change-request process.

### 5.4 Uploading Employee Documents

Each employee profile has a **Documents** section for storing identity proofs and certificates.

1. Select the employee in the Employees list.
2. Scroll down to the **Documents** tab on their profile.
3. Click **Upload document**.
4. Fill in:
   - **Document type** (e.g., Aadhaar card, PAN card, Bank proof, Education certificate)
   - **File** — click to browse and select the file (PDF, JPEG, PNG)
5. Click **Upload**.
6. The document appears in the list with a **Pending** verification status.

> Documents are stored securely. Only authorized roles can view or download them.

**Viewing a document:**

- In the document list, click the **View** (↗) button next to any document to open it in a new browser tab.

**Deleting a document:**

- Click the **Delete** button next to the document.
- Confirm the deletion. This action cannot be undone.

### 5.5 KYC Verification

After uploading documents, HR must mark them as **KYC Verified** to confirm the employee's identity is confirmed.

1. Select the employee.
2. In the Documents section, find the document you want to verify.
3. Click **Verify** next to that document.
4. The document status changes from **Pending** to **Verified** with a green badge.

If a document is incorrect or expired:

1. Click **Reject** next to the document.
2. The status changes to **Rejected**.
3. You can then delete it and ask the employee to re-submit.

The **Profile Completion Ring** percentage increases as required fields are filled and documents are verified.

### 5.6 Generating Letters

MS HRMS can auto-generate standard employment letters for employees.

1. Select the employee.
2. Scroll to the **Letters** section of their profile.
3. Choose the letter type from the dropdown:
   - **Offer Letter**
   - **Experience Letter**
   - **Salary Certificate**
   - _(and others as configured)_
4. Click **Generate letter**.
5. The letter is generated using the employee's current profile data and downloaded as a PDF automatically.

> Letters use the company details configured in the **Settings** module. Make sure your company name, address, and logo are set up before generating letters.

---

## 6. Change Requests — For HR & Admin

When an employee submits a change request (profile update or document upload), it appears in the **Change Requests** section for HR to review.

### 6.1 Reviewing Profile Update Requests

1. In the left sidebar, click **Change Requests**.
2. The page opens on the **Profile Updates** tab.
3. Each card shows:
   - Employee name
   - Which field they want to change
   - Current value → Requested new value
   - Date submitted
4. Review the information carefully.

### 6.2 Reviewing Document Verification Requests

1. In the Change Requests page, click the **Document Verification** tab.
2. Each card shows a document that an employee uploaded and is requesting verification of.
3. Click the **↗ View** button on a card to open the document in a new browser tab and inspect it before deciding.

### 6.3 Approving or Rejecting a Request

**To approve:**

1. Review the request (and view the document if applicable).
2. Click **Approve**.
3. A green success toast notification confirms the action.
4. The employee's profile is updated immediately (for profile changes) or the document is marked Verified (for document requests).

**To reject:**

1. Click **Reject**.
2. Enter a reason for rejection in the dialog (optional but recommended).
3. Click **Confirm reject**.
4. The request is closed. The employee can submit a new request with corrected information.

> All approvals and rejections are logged in the system's **Audit Logs** for compliance tracking.

---

## 7. Document Types Reference

| Document              | Description                                  | Required for KYC |
| --------------------- | -------------------------------------------- | ---------------- |
| Aadhaar card          | Government-issued national ID (India)        | Yes              |
| PAN card              | Permanent Account Number — tax identity      | Yes              |
| Bank proof            | Cancelled cheque or bank passbook front page | Yes              |
| Education certificate | Degree / diploma certificate                 | Recommended      |
| Profile photo         | Employee photograph                          | Recommended      |

Additional document types can be configured by Admin under **Settings → Master Data**.

---

## 8. Frequently Asked Questions

**Q: I submitted a change request but my profile still shows old data. Why?**
A: Change requests go to HR for approval first. Your profile updates only after HR approves the request. You can check the status by going to My Profile — if the old value is still showing, it is pending approval.

**Q: I cannot see the Employees menu in the sidebar.**
A: The Employees module visibility is controlled by your role permissions. If you need access, ask your system administrator to enable it for your role in the Permissions module.

**Q: The profile photo I uploaded is not showing.**
A: Make sure the image is JPEG, PNG, or WebP format and under 5 MB. If the upload succeeds (you see a toast notification), try refreshing the page.

**Q: I generated a letter but the company name is wrong.**
A: The letter pulls company details from Settings. Ask your system administrator to update the company name, address, and other details in **Settings → General**.

**Q: Can I see who approved or rejected a change request?**
A: Yes. Go to **Audit Logs** in the sidebar. Every approval and rejection is recorded with the actor's name, date, and time.

**Q: A document shows as "Rejected" — what does the employee need to do?**
A: The employee should re-upload the correct document from My Profile → Documents. The rejected document can be deleted before uploading a fresh one.

**Q: Can two employees have the same email address?**
A: No. Email addresses must be unique across the system. Each email is the employee's login identity.

---

## 9. Support Contact

For technical issues, login problems, or permission changes, contact your system administrator or the development team.

| Contact              | Details                      |
| -------------------- | ---------------------------- |
| System Administrator | _(your internal IT contact)_ |
| Development Support  | com                          |
| Software             | Platform                     |
| Module Version       | Employee Profile v1.0        |

---

_This document covers the Employee Profile module as delivered. Features may be updated in future releases. Always refer to the latest version of this manual provided by the development team._

---

**Date:** June 2026
