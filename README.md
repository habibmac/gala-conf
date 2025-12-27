# Conference Paper Management System - Implementation Plan

## Overview

**IMPORTANT: This will be implemented as a separate plugin (`galantis-conference`) for enterprise clients.**

Create academic conference management system for patklin.org (Patologi Klinik seminar):
- User registration with accommodation/transport add-ons
- Paper/abstract submission after registration
- Review workflow (future phase)
- Organizer paper management (future phase)

**Deployment:**
- Production: patklin.org (enterprise client)
- Development: patklin.test
- Main business (galanesia.com) unaffected

**Scale:** 800 users, ~200 paper submissions expected

**Architecture Decision:**
- **Backend:** `galantis-paper` - **Fully functional standalone plugin built from scratch**
  - Clean, modern REST API (100% new code)
  - Custom database schema with `wp_galantis_paper_*` prefix
  - Services layer (PaperService, ReviewService, EmailService, FileService)
  - **NO WP Admin pages** - all configuration via REST API
  - **NO dependency on WP Abstract Pro** (abandoned - poorly written)
- **Frontend:** Single Nuxt app `gala-science`
  - For registrants + reviewers (role-based routes)
- **Frontend:** `gala-conf` (fork of gala-eo)
  - For organizers/panitia (paper management + reviewer assignment + **event configuration**)

---

## Architecture Strategy

### Standalone Plugin Approach

```
Nuxt Frontend (gala-conf / gala-science)
    ↓ OAuth + REST API
Galantis Panel → galantis-paper plugin
    ↓ Custom Services
Custom Database Tables (wp_galantis_paper_*)
```

**Why Build from Scratch (NOT using WP Abstract Pro):**
1. ✅ **WP Abstract Pro is poorly written** - would need complete rewrite anyway
2. ✅ **Full control** - No dependency on abandoned/nulled plugin
3. ✅ **Modern architecture** - Clean services, REST-first design
4. ✅ **No WP Admin bloat** - Pure REST API, frontend manages everything
5. ✅ **Enterprise-ready** - Built specifically for Galanesia's needs

**Key Decisions:**
1. **Build standalone plugin** - galantis-paper is 100% custom code
2. **Single checkout flow** - Ticket + accommodation + transport in one payment
3. **Registration-gated submissions** - Must have approved ticket before paper submission
4. **REST API for everything** - No WP admin pages, all config from frontend
5. **Initial scope: Author role** - Reviewer/organizer roles in future phases

---

## Database Schema (100% Custom - No WP Abstract Pro)

**Naming Convention:** All tables use `wp_galantis_paper_*` prefix

### 1. Core Submissions Table: `wp_galantis_paper_submissions`

Stores core metadata for each submission.

```sql
CREATE TABLE wp_galantis_paper_submissions (
    id bigint(20) unsigned AUTO_INCREMENT PRIMARY KEY,
    event_id bigint(20) unsigned NOT NULL,
    reg_id bigint(20) unsigned NOT NULL COMMENT 'Event Espresso registration ID',
    user_id bigint(20) unsigned NOT NULL COMMENT 'WordPress user ID',
    topic_id int(11) unsigned NULL,

    title varchar(500) NOT NULL,
    authors JSON NOT NULL COMMENT '[{"name":"","email":"","affiliation":"","is_presenter":bool}]',
    keywords text NULL,
    presentation_preference ENUM('oral', 'poster', 'either') DEFAULT 'either',

    current_status varchar(50) DEFAULT 'draft',
    current_phase ENUM('abstract', 'full_paper') DEFAULT 'abstract',

    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    KEY event_id (event_id),
    KEY reg_id (reg_id),
    KEY user_id (user_id),
    KEY topic_id (topic_id),
    FULLTEXT KEY search_text (title, keywords)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Abstracts Table: `wp_galantis_paper_abstracts`

Tracks abstract content and versions.

```sql
CREATE TABLE wp_galantis_paper_abstracts (
    id bigint(20) unsigned AUTO_INCREMENT PRIMARY KEY,
    submission_id bigint(20) unsigned NOT NULL,
    abstract_text text NOT NULL,
    status varchar(50) DEFAULT 'draft',
    version int(11) DEFAULT 1,
    submitted_at datetime NULL,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,

    KEY submission_id (submission_id),
    FOREIGN KEY (submission_id) REFERENCES wp_galantis_paper_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Full Papers Table: `wp_galantis_paper_full_papers`

Tracks full paper content and versions.

```sql
CREATE TABLE wp_galantis_paper_full_papers (
    id bigint(20) unsigned AUTO_INCREMENT PRIMARY KEY,
    submission_id bigint(20) unsigned NOT NULL,
    status varchar(50) DEFAULT 'pending',
    version int(11) DEFAULT 1,
    file_id bigint(20) unsigned NULL COMMENT 'FK to attachments table',
    submitted_at datetime NULL,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,

    KEY submission_id (submission_id),
    FOREIGN KEY (submission_id) REFERENCES wp_galantis_paper_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. Topics Table: `wp_galantis_paper_topics`

Conference paper categories/topics.

```sql
CREATE TABLE wp_galantis_paper_topics (
    id int(11) unsigned AUTO_INCREMENT PRIMARY KEY,
    event_id bigint(20) unsigned NOT NULL,
    name varchar(255) NOT NULL,
    description text NULL,
    display_order int(11) DEFAULT 0,
    is_active tinyint(1) DEFAULT 1,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,

    KEY event_id (event_id),
    KEY display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5. Attachments Table: `wp_galantis_paper_attachments`

File storage metadata (files stored in filesystem).

```sql
CREATE TABLE wp_galantis_paper_attachments (
    id bigint(20) unsigned AUTO_INCREMENT PRIMARY KEY,
    submission_id bigint(20) unsigned NOT NULL,
    attachment_type ENUM('abstract_file', 'full_paper', 'supplementary') NOT NULL,
    filename varchar(255) NOT NULL,
    original_filename varchar(255) NOT NULL,
    file_path varchar(500) NOT NULL COMMENT 'Relative path from /wp-content/uploads/papers/',
    mime_type varchar(100) NOT NULL,
    file_size bigint(20) unsigned NOT NULL COMMENT 'Bytes',
    uploaded_by bigint(20) unsigned NOT NULL,
    uploaded_at datetime DEFAULT CURRENT_TIMESTAMP,

    KEY submission_id (submission_id),
    KEY attachment_type (attachment_type),

    FOREIGN KEY (submission_id) REFERENCES wp_galantis_paper_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6. Reviews Table: `wp_galantis_paper_reviews`

Reviewer feedback per phase and version. Enables multiple reviews for the same submission phase.

```sql
CREATE TABLE wp_galantis_paper_reviews (
    id bigint(20) unsigned AUTO_INCREMENT PRIMARY KEY,
    submission_id bigint(20) unsigned NOT NULL,
    reviewer_id bigint(20) unsigned NOT NULL,
    phase ENUM('abstract', 'full_paper') NOT NULL,
    version int(11) NOT NULL,

    -- Ratings
    quality_score tinyint(1) NULL COMMENT '1-5 scale',
    relevance_score tinyint(1) NULL COMMENT '1-5 scale',
    originality_score tinyint(1) NULL COMMENT '1-5 scale',

    -- Recommendation
    recommendation ENUM('accept', 'minor_revision', 'major_revision', 'reject') NOT NULL,
    comments text NOT NULL COMMENT 'Visible to Author',
    confidential_notes text NULL COMMENT 'Only visible to organizers',

    submitted_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    KEY submission_id (submission_id),
    KEY reviewer_id (reviewer_id),
    KEY phase (phase),

    UNIQUE KEY unique_review (submission_id, reviewer_id, phase, version),
    FOREIGN KEY (submission_id) REFERENCES wp_galantis_paper_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 7. Reviewer Assignments: `wp_galantis_paper_reviewer_assignments`

Which reviewers are assigned to which papers.

```sql
CREATE TABLE wp_galantis_paper_reviewer_assignments (
    id bigint(20) unsigned AUTO_INCREMENT PRIMARY KEY,
    submission_id bigint(20) unsigned NOT NULL,
    reviewer_id bigint(20) unsigned NOT NULL,
    assigned_by bigint(20) unsigned NOT NULL COMMENT 'Organizer who assigned',
    assigned_at datetime DEFAULT CURRENT_TIMESTAMP,

    KEY submission_id (submission_id),
    KEY reviewer_id (reviewer_id),

    UNIQUE KEY unique_assignment (submission_id, reviewer_id),
    FOREIGN KEY (submission_id) REFERENCES wp_galantis_paper_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8. Comments Table: `wp_galantis_paper_comments`

Communication thread for each submission, supporting internal/external notes.

```sql
CREATE TABLE wp_galantis_paper_comments (
    id bigint(20) unsigned AUTO_INCREMENT PRIMARY KEY,
    submission_id bigint(20) unsigned NOT NULL,
    user_id bigint(20) unsigned NOT NULL,
    comment_text text NOT NULL,
    visibility ENUM('public', 'internal_reviewer', 'internal_organizer') DEFAULT 'public',
    created_at datetime DEFAULT CURRENT_TIMESTAMP,

    KEY submission_id (submission_id),
    FOREIGN KEY (submission_id) REFERENCES wp_galantis_paper_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 9. Event Configuration: `wp_galantis_paper_event_config`

**NO WP Admin pages** - All configuration via REST API, managed from gala-conf frontend.

```sql
CREATE TABLE wp_galantis_paper_event_config (
    id bigint(20) unsigned AUTO_INCREMENT PRIMARY KEY,
    event_id bigint(20) unsigned NOT NULL COMMENT 'Event Espresso event ID',

    -- Paper submission settings
    allow_paper_submissions tinyint(1) DEFAULT 1,
    require_full_paper tinyint(1) DEFAULT 1 COMMENT 'If false, abstract-only conference',
    max_submissions_per_user int(11) DEFAULT 3,

    -- Deadlines (stored as JSON for flexibility)
    deadlines JSON NOT NULL COMMENT '{
        "abstract_deadline": "2025-03-01 23:59:59",
        "abstract_revision_deadline": "2025-03-08 23:59:59",
        "full_paper_deadline": "2025-04-15 23:59:59",
        "full_paper_revision_deadline": "2025-04-22 23:59:59"
    }',

    -- File upload restrictions
    max_file_size_mb int(11) DEFAULT 10,
    allowed_file_types JSON DEFAULT '["pdf","docx","doc"]',

    -- Submission guidelines (Markdown format)
    abstract_guidelines text NULL,
    full_paper_guidelines text NULL,

    -- Presentation options
    allow_oral_presentation tinyint(1) DEFAULT 1,
    allow_poster_presentation tinyint(1) DEFAULT 1,

    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 10. Status History: `wp_galantis_paper_status_history`

Track all status changes for audit trail and transparency.

```sql
CREATE TABLE wp_galantis_paper_status_history (
    id bigint(20) unsigned AUTO_INCREMENT PRIMARY KEY,
    submission_id bigint(20) unsigned NOT NULL,
    phase ENUM('abstract', 'full_paper') NOT NULL,
    old_status varchar(50),
    new_status varchar(50) NOT NULL,
    changed_by bigint(20) unsigned NOT NULL,
    reviewer_notes text,
    changed_at datetime DEFAULT CURRENT_TIMESTAMP,

    KEY submission_id (submission_id),
    KEY changed_at (changed_at),

    FOREIGN KEY (submission_id) REFERENCES wp_galantis_paper_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Summary: 10 Custom Tables

All using `wp_galantis_paper_*` prefix:

1. ✅ `wp_galantis_paper_submissions` - Core metadata
2. ✅ `wp_galantis_paper_abstracts` - Abstract content & versions
3. ✅ `wp_galantis_paper_full_papers` - Full paper status & versions
4. ✅ `wp_galantis_paper_topics` - Categories/topics per event
5. ✅ `wp_galantis_paper_attachments` - File metadata
6. ✅ `wp_galantis_paper_reviews` - Multi-reviewer feedback
7. ✅ `wp_galantis_paper_reviewer_assignments` - Reviewer assignments
8. ✅ `wp_galantis_paper_comments` - Internal/External discussion
9. ✅ `wp_galantis_paper_event_config` - Event settings
10. ✅ `wp_galantis_paper_status_history` - Audit trail

---

## REST API Endpoints

All endpoints under `/wp-json/galantis/v1/`

### Two-Phase Submission Workflow

**Phase 1: Abstract Submission**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/event/{id}/papers/abstracts` | POST | Submit new abstract (text only) |
| `/event/{id}/papers/abstracts` | GET | List user's abstracts |
| `/event/{id}/papers/abstracts/{id}` | GET | View abstract details |
| `/event/{id}/papers/abstracts/{id}` | PUT | Update abstract (**ONLY if status is draft or abstract_revision**) |
| `/event/{id}/papers/abstracts/{id}` | DELETE | Delete abstract (**ONLY if status is draft**) |
| `/event/{id}/papers/abstracts/{id}/resubmit` | POST | Resubmit abstract after revision (**changes status to abstract_submitted**) |
| `/event/{id}/papers/abstracts/{id}/status` | GET | Check if can submit full paper |

**Phase 2: Full Paper Submission (Only if abstract approved)**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/event/{id}/papers/{id}/full-paper` | POST | Upload full paper PDF (only if abstract approved + deadline not passed) |
| `/event/{id}/papers/{id}/full-paper` | PUT | Replace full paper (**ONLY if status is full_paper_revision**) |
| `/event/{id}/papers/{id}/full-paper` | GET | Download full paper |
| `/event/{id}/papers/{id}/full-paper/resubmit` | POST | Resubmit full paper after revision |
| `/event/{id}/papers/{id}/full-paper/attachments` | POST | Upload supplementary files |
| `/event/{id}/papers/{id}/full-paper/attachments/{att_id}` | GET | Download attachment |

### Supporting Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/event/{id}/papers/topics` | GET | Get available topics |
| `/event/{id}/papers/guidelines` | GET | Get submission rules |
| `/event/{id}/papers/deadlines` | GET | Get all deadlines |
| `/event/{id}/papers/{id}/history` | GET | Get status change history |

### Committee/Admin Configuration Endpoints (NO WP Admin!)

**Event Configuration:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/event/{id}/papers/config` | GET | Get event paper settings |
| `/event/{id}/papers/config` | PUT | Update event settings (deadlines, file limits, etc.) |
| `/event/{id}/papers/config/topics` | POST | Create new topic |
| `/event/{id}/papers/config/topics/{topic_id}` | PUT | Update topic |
| `/event/{id}/papers/config/topics/{topic_id}` | DELETE | Delete topic |
| `/event/{id}/papers/config/guidelines` | PUT | Update submission guidelines (Markdown) |

### Registration Extensions

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/event/{id}/registrations/check-paper-eligibility` | GET | Check if user can submit abstract |

### Example: Submit Abstract (Phase 1)

```http
POST /wp-json/galantis/v1/event/evt_abc123/papers/abstracts
Authorization: Bearer {token}
Content-Type: application/json

{
    "title": "Machine Learning for Event Management",
    "abstract": "This paper explores the application of ML algorithms...",
    "topic_id": 5,
    "keywords": "ML, Events, AI",
    "authors": [
        {"name": "John Doe", "email": "john@example.com", "affiliation": "MIT", "is_presenter": true}
    ],
    "presentation_preference": "oral"
}

Response:
{
    "success": true,
    "data": {
        "abstract_id": 123,
        "status": "abstract_submitted",
        "message": "Abstract submitted successfully. You'll be notified when it's reviewed."
    }
}
```

### Example: Upload Full Paper (Phase 2 - Only if abstract approved)

```http
POST /wp-json/galantis/v1/event/evt_abc123/papers/123/full-paper
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
    "full_paper": File.pdf,  // Max 10MB
    "supplementary_files": [Data.xlsx, Figures.zip]  // Optional
}

Response:
{
    "success": true,
    "data": {
        "paper_id": 123,
        "status": "full_paper_submitted",
        "files": [
            {"type": "full_paper", "filename": "ML_Event_Management.pdf", "size": "2.5 MB"},
            {"type": "supplementary", "filename": "Data.xlsx", "size": "500 KB"}
        ],
        "message": "Full paper uploaded successfully and is now under review."
    }
}
```

---

## Payment Integration

### Accommodation & Transport: Use Existing Surcharge System

**Already implemented in galantis-panel:**
- Configure via admin panel: `/wp-admin/admin.php?page=galantis-panel-surcharges`
- Links to Event Espresso questions
- Automatically adds to Midtrans payment

**Configuration Example:**
```php
[
    {
        "qst_id": 45,  // "Accommodation Package" question
        "name": "Hotel Accommodation",
        "unit_price": 300,
        "enabled": true
    },
    {
        "qst_id": 47,  // "Airport Shuttle" question
        "name": "Shuttle Service",
        "unit_price": 50,
        "enabled": true
    }
]
```

**User Flow:**
1. Select event ticket ($500)
2. Answer questions: Accommodation ($300), Shuttle ($50)
3. Midtrans checkout: Total = $850
4. Single payment, single transaction

**No new code needed** - leverage existing system.

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Database schema + Basic paper submission API

**Tasks:**
1. ~~Install WP Abstract Pro~~ **❌ ABANDONED - Building from scratch**
2. Create database migration: `inc/Database/DatabaseManager.php`
   - Create all 7 tables with `wp_galantis_paper_*` prefix
   - Add indexes and foreign keys
3. Create REST endpoint: `inc/REST/Endpoints/PaperSubmissions.php`
4. Create services layer:
   - `inc/Services/PaperService.php` - Business logic
   - `inc/Services/FileService.php` - File upload/download
   - `inc/Services/EmailService.php` - Notifications
5. Create helpers:
   - `inc/Helpers/PaperAuthorizationHelper.php` - Permission checks
   - `inc/Helpers/PaperValidator.php` - Input validation
6. Register endpoint in `inc/Bootstrap.php`

**Deliverables:**
- All 7 database tables created
- POST `/event/{id}/papers/abstracts` - Submit abstract
- GET `/event/{id}/papers/abstracts` - List abstracts
- GET `/event/{id}/papers/abstracts/{id}` - View details
- File upload working (filesystem storage, PDF/DOCX)

**Testing:**
- Postman API testing
- Permission checks (must have registration)
- File upload (1MB, 5MB, 10MB)
- Database integrity (foreign keys, cascades)

---

### Phase 2: Full CRUD & Checkout (Weeks 3-4)

**Goal:** Complete paper management + accommodation checkout

**Tasks:**
1. Implement PUT `/event/{id}/papers/{paper_id}` - Update paper
2. Implement DELETE `/event/{id}/papers/{paper_id}` - Delete paper
3. Add GET `/event/{id}/papers/topics` - Get topics
4. Add GET `/event/{id}/papers/guidelines` - Get submission rules
5. Configure surcharges for accommodation/transport
6. Link WPA events to EE events (admin UI or manual meta)
7. Implement email notifications (use WPA email system)

**Deliverables:**
- Full CRUD operations
- Accommodation in checkout flow
- Email confirmations working

**Testing:**
- End-to-end: Register → Pay → Submit paper
- Edit/delete with permission checks
- Email delivery

---

### Phase 3: Nuxt Frontend (Weeks 5-6)

**Goal:** User-facing UI for paper submission

**Tasks:**
1. Create `composables/usePapers.ts` - API client
2. Create `components/papers/PaperSubmissionForm.vue` - Form with file upload
3. Create `components/papers/PaperList.vue` - Dashboard
4. Create `components/papers/PaperCard.vue` - Paper item display
5. Create `pages/events/[slug]/papers/index.vue` - Main page
6. Create `pages/events/[slug]/papers/submit.vue` - Submission page
7. Create `pages/events/[slug]/papers/[id].vue` - Detail page
8. Extend checkout with accommodation selector
9. Add eligibility checks (banners, validation)

**Deliverables:**
- Functional paper submission form
- Papers dashboard showing submissions
- Enhanced registration checkout
- Mobile-responsive UI

**Testing:**
- Cross-browser (Chrome, Safari, Firefox)
- Mobile responsiveness
- File upload progress
- Form validation

---

### Phase 4: Testing & Production (Week 7)

**Goal:** Production-ready deployment

**Tasks:**
1. Performance optimization (DB indexes, caching)
2. Security hardening (input sanitization, file validation)
3. Error handling improvements
4. Load testing (800 concurrent users)
5. Documentation (API docs, admin guide, user guide)
6. Backup strategy for files and database

**Deliverables:**
- Performance benchmarks passed
- Security audit complete
- Documentation complete
- Production deployment checklist

---

### Phase 5: Future Enhancements (Post-MVP)

**Not in initial scope - designed for later:**

**Reviewer Role (2-3 weeks):**
- GET `/event/{id}/reviews/assigned` - Papers to review
- POST `/event/{id}/papers/{paper_id}/reviews` - Submit review
- Review dashboard in Nuxt
- Email reminders for pending reviews

**Organizer/Panitia Role (3-4 weeks):**
- GET `/event/{id}/papers/all` - All submissions (filtered)
- POST `/event/{id}/papers/{paper_id}/assign-reviewers` - Assign reviewers
- PUT `/event/{id}/papers/{paper_id}/status` - Change status
- Bulk operations (accept/reject multiple)
- Export to PDF/Excel
- Analytics dashboard

---

## Critical Files to Create/Modify

### Backend (galantis-panel)

1. **`inc/Database/DatabaseManager.php`** (MODIFY)
   - Add migration methods for all 7 tables:
     - `create_paper_submissions_table()`
     - `create_paper_topics_table()`
     - `create_paper_attachments_table()`
     - `create_paper_reviews_table()`
     - `create_paper_reviewer_assignments_table()`
     - `create_paper_event_config_table()`
     - `create_paper_status_history_table()`
   - Call in plugin activation hook
   - Add version tracking for future migrations

2. **`inc/REST/Endpoints/PaperSubmissions.php`** (NEW)
   - Main REST endpoint class for two-phase workflow
   - Extends base REST class
   - Abstract CRUD methods (Phase 1)
   - Full paper upload methods (Phase 2)
   - File upload handling with type distinction
   - Status transition validation

3. **`inc/REST/Endpoints/PaperConfig.php`** (NEW)
   - Event configuration endpoints (NO WP Admin!)
   - Committee can manage settings from gala-conf
   - Topics CRUD
   - Deadlines management
   - Guidelines editor

4. **`inc/Services/PaperService.php`** (NEW)
   - Business logic for paper submissions
   - Status transitions
   - Validation rules
   - Database operations via wpdb

5. **`inc/Services/FileService.php`** (NEW)
   - File upload to `/wp-content/uploads/papers/{event_id}/{submission_id}/`
   - File validation (type, size)
   - Metadata storage in wp_galantis_paper_attachments
   - Download URL generation

4. **`inc/Helpers/PaperAuthorizationHelper.php`** (NEW)
   - `canUserSubmitAbstract()` - Check registration + abstract deadline
   - `canUserEditAbstract()` - **ONLY if status is 'draft' or 'abstract_revision'** (NO editing after submitted)
   - `canUserResubmitAbstract()` - Allow resubmission when status is 'abstract_revision'
   - `canUserSubmitFullPaper()` - Check if abstract is approved + full paper deadline not passed
   - `canUserResubmitFullPaper()` - Allow resubmission when status is 'full_paper_revision'
   - `canUserAccessPaper()` - Ownership validation
   - `isDeadlinePassed()` - **Strict deadline enforcement - NO extensions**
   - `getApplicableDeadline()` - Get current deadline based on status

6. **`inc/Helpers/PaperValidator.php`** (NEW)
   - Input validation for submissions
   - File type/size validation
   - Authors array validation
   - Deadline checks

7. **`inc/Services/EmailService.php`** (NEW)
   - Send confirmation emails
   - Status change notifications
   - Deadline reminders
   - Uses WordPress wp_mail()

8. **`inc/Bootstrap.php`** (MODIFY)
   - Register PaperSubmissions endpoint
   - Register PaperConfig endpoint
   - Load services on init

### Frontend (gala-eo)

7. **`composables/usePapers.ts`** (NEW)
   - API client functions
   - TypeScript interfaces

8. **`components/papers/PaperSubmissionForm.vue`** (NEW)
   - Main submission form
   - File uploader with progress
   - Multi-author management

9. **`components/papers/PaperList.vue`** (NEW)
   - Papers dashboard
   - Status badges
   - Quick actions

10. **`pages/events/[slug]/papers/index.vue`** (NEW)
    - Main papers page
    - Eligibility checks
    - List user submissions

---

## Key Technical Decisions & Trade-offs

### 1. ~~WP Abstract Pro Integration~~ → Build from Scratch
**Decision:** ❌ ABANDONED WP Abstract Pro, ✅ Build standalone plugin
**Rationale:**
- WP Abstract Pro is poorly written (HTML-heavy, outdated architecture)
- Would need complete rewrite anyway
- Full control over features, database schema, API design
- No dependency on abandoned/nulled plugin
**Result:** 100% custom code, modern architecture, enterprise-ready

### 2. Checkout Flow: Single vs Separate
**Decision:** Single checkout (ticket + add-ons)
**Rationale:** Better UX, lower fees, simpler reconciliation
**Trade-off:** Cannot add accommodation after registration

### 3. File Storage: Filesystem ONLY
**Decision:** ALL files to filesystem (`/wp-content/uploads/papers/{event_id}/{submission_id}/`)
**Rationale:**
- NO database bloat (200 papers × 2MB would = 400MB in DB)
- Fast backups (exclude uploads directory)
- Better performance
- Easy migration to CDN/S3 later
**Implementation:** Store only metadata in `wp_galantis_paper_attachments` table

### 4. Event Configuration: WP Admin vs REST API
**Decision:** ✅ REST API only, ❌ NO WP Admin pages
**Rationale:**
- Committee manages everything from gala-conf frontend
- Consistent UX (no switching to WP admin)
- Modern headless architecture
- Settings stored in `wp_galantis_paper_event_config` table
**Implementation:** All config endpoints under `/event/{id}/papers/config`

### 5. Scalability: 800 Users
**Strategy:** DB indexes, API caching (5min), pagination (100/page), rate limiting
**Expected Load:** 200 papers × 2MB = 400MB storage, <1000 API calls/hour
**Verdict:** Sufficient for MVP, monitor and optimize as needed

---

## User Flow: Complete Journey (Two-Phase Workflow)

```
1. User Registration
   POST /galantis/v1/auth/register
   → WordPress user created
   → OAuth token issued

2. Event Registration + Checkout
   Browse event → Select ticket
   → Answer accommodation/transport questions
   → POST /galantis/v1/event/{id}/tickets/{ticket_id}/register
   → Midtrans payment ($850 = $500 ticket + $300 hotel + $50 shuttle)
   → Payment webhook → Registration approved

3. Abstract Submission Eligibility Check
   GET /galantis/v1/event/{id}/registrations/check-paper-eligibility
   → Validates: has approved registration, abstract deadline not passed
   → Returns: can_submit_abstract: true, abstract_deadline: "2025-03-01"

4. Submit Abstract (Phase 1)
   POST /galantis/v1/event/{id}/papers/abstracts
   → Submits title, abstract text, authors, keywords
   → NO full paper file yet
   → Stores in wp_galantis_paper_submissions
   → Links to Event Espresso registration
   → Status: "abstract_submitted"
   → Sends confirmation email to author

5. Abstract Review (Organizer/Reviewer Action)
   → Reviewers evaluate abstract
   → Decision: approve / request revision / reject
   → Status updated: "abstract_approved" | "abstract_revision" | "abstract_rejected"
   → Email notification sent to author

6. Full Paper Submission (Phase 2 - Only if abstract approved)
   GET /galantis/v1/event/{id}/papers/abstracts/{id}/status
   → Returns: abstract_status: "abstract_approved", can_submit_full_paper: true

   POST /galantis/v1/event/{id}/papers/{id}/full-paper
   → Uploads full paper PDF (max 10MB)
   → Optional: supplementary files
   → Status: "full_paper_submitted"
   → Sends confirmation email

7. Full Paper Review (Organizer/Reviewer Action)
   → Reviewers evaluate full paper
   → Decision: accept / request revision / reject
   → Status: "full_paper_accepted" | "full_paper_revision" | "full_paper_rejected"
   → Email notification sent to author

8. View Submissions & History
   GET /galantis/v1/event/{id}/papers/abstracts
   → Lists user's abstracts with current status

   GET /galantis/v1/event/{id}/papers/{id}/history
   → Shows status history: when abstract submitted, reviewed, full paper uploaded, etc.
   → Shows reviewer notes/feedback
```

### Deadline Management

**STRICT ENFORCEMENT - NO EXCEPTIONS:**
- If user misses full paper deadline after abstract approval → Paper NOT published
- No manual extensions allowed
- System automatically locks submissions after deadline passes

```
Timeline Example:
├─ Jan 15: Conference announced, registration opens
├─ Mar 01: Abstract submission deadline ⏰ (STRICT - submissions locked after)
├─ Mar 08: Abstract revision deadline ⏰ (if requested - STRICT)
├─ Mar 15: Abstract review complete, authors notified
├─ Apr 15: Full paper submission deadline ⏰ (STRICT - even if abstract was approved)
├─ Apr 22: Full paper revision deadline ⏰ (if requested - STRICT)
├─ May 01: Final acceptance notifications
└─ Jun 15: Conference date

EXAMPLE SCENARIO - Missed Deadline:
- User's abstract approved on Mar 15
- Full paper deadline is Apr 15
- User uploads full paper on Apr 20 ❌
- System REJECTS: "Deadline passed. Paper will not be published."
- NO exceptions - user should have uploaded on time
```

---

## Success Metrics

**MVP Complete When:**
- [ ] User can register with accommodation/transport in single checkout
- [ ] **Phase 1: User can submit abstract after registration (text only)**
- [ ] **Organizer can review abstracts and approve/reject**
- [ ] **Phase 2: User can upload full paper PDF (only if abstract approved)**
- [ ] **Organizer can review full papers and accept/reject**
- [ ] User can upload PDF files (up to 10MB) for full paper
- [ ] User can upload supplementary files (figures, data)
- [ ] User can view submission status and history in Nuxt dashboard
- [ ] User can edit abstract (if status is draft or revision_requested)
- [ ] Email notifications sent on submission and status changes
- [ ] **Deadlines enforced: abstract deadline, full paper deadline**
- [ ] **Status history tracked for audit trail**
- [ ] System handles 800 users, 200 submissions
- [ ] API response time <500ms (90th percentile)
- [ ] File uploads complete <10s for 5MB files
- [ ] Zero security vulnerabilities in audit

---

## Next Steps

1. **Review & Approve Plan** - Stakeholder sign-off
2. **Environment Setup**
   - Copy WP Abstract Pro to `/wp-content/plugins/wpabstracts_pro`
   - Activate plugin on development site
   - Create test Event Espresso event
3. **Phase 1 Kickoff** - Start with database + REST endpoints
4. **Create API Test Suite** - Postman collection for testing
5. **Set Up Tracking** - Project board for task management

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| ~~WP Abstract Pro breaks~~ | ✅ NO LONGER A RISK - Built from scratch |
| Building from scratch takes longer | Clear spec, reuse existing galantis-panel patterns, 2-week buffer |
| File uploads fail on shared hosting | Filesystem storage with fallback to uploads; CDN option ready |
| 800 users exceed server capacity | Load testing before launch; DB indexes; caching; scaling plan |
| Payment integration issues | Test with Midtrans sandbox; rollback procedure ready |
| Security vulnerabilities | Input sanitization audit; file type validation; rate limiting; CSRF tokens |
| Data loss on paper deletion | Foreign key CASCADE deletes; soft delete with 30-day recovery (Phase 2) |

---

## Plugin Structure

```
wp-content/plugins/galantis-panel/
├── inc/
│   ├── Database/
│   │   └── DatabaseManager.php           (+ 7 new migration methods)
│   │
│   ├── REST/Endpoints/
│   │   ├── PaperSubmissions.php          (NEW - abstract/full paper CRUD)
│   │   └── PaperConfig.php               (NEW - event configuration)
│   │
│   ├── Services/
│   │   ├── PaperService.php              (NEW - business logic)
│   │   ├── FileService.php               (NEW - file upload/download)
│   │   └── EmailService.php              (NEW - notifications)
│   │
│   ├── Helpers/
│   │   ├── PaperAuthorizationHelper.php  (NEW - permissions)
│   │   └── PaperValidator.php            (NEW - input validation)
│   │
│   └── Bootstrap.php                      (MODIFY - register endpoints)
│
└── uploads/papers/                        (NEW - file storage)
    └── {event_id}/
        └── {submission_id}/
            ├── full_paper.pdf
            ├── figures.zip
            └── data.xlsx
```

**No WP Abstract Pro dependency** - 100% custom, modern, maintainable code.
