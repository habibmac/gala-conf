Special Attendee System & Self Check-in Screen
Overview
The Special Attendee System enhances event management by providing staff with immediate visual indicators and contextual information about attendees during check-in. Combined with the Self Check-in Screen, this creates a comprehensive solution for both staff-operated and attendee-operated registration workflows.
Special Attendee System
Purpose
Event organizers often need to provide differentiated service to specific attendees - VIPs who require special protocol, attendees with pre-arranged appointments, or guests with special accommodation needs. The challenge is ensuring front-line staff immediately recognize these attendees during the hectic check-in process.
Core Functionality
VIP Status Identification

Leverages Event Espresso's "admin only" custom field system
Event organizers can mark attendees as VIP through a checkbox question
Question ID is configurable per event (staging vs production environments)
Provides immediate visual recognition during scanning

Staff Notes System

Separate from VIP status - any attendee can have staff notes
Uses Event Espresso's textarea "admin only" question
Contextual information for staff (table assignments, dietary needs, appointments)
Pre-event planning tool for staff coordination

Real-World Use Cases
Government/Corporate Events
VIP: ✓
Notes: "KEPALA KANTOR KPP PRATAMA MALANG UTARA 2022 - Round Table 1"

Immediate recognition of high-ranking officials
Protocol requirements clearly displayed
Seating assignments visible to staff

Sports Events
VIP: ✗
Notes: "Meeting with Race Director at 2 PM - Booth 5"

Pre-scheduled appointments tracked
Staff can direct attendees appropriately
No special protocol needed, just information

Wedding Events
VIP: ✓
Notes: "Bride's family - Front row seating, vegetarian meal"

Family hierarchy recognition
Special accommodation requirements
Combined status and logistics info

Technical Architecture
Question-Based Configuration

Each event configures two question IDs:

VIP checkbox question (admin only)
Notes textarea question (admin only)

Flexible across different Event Espresso installations
No custom database tables - uses existing EE infrastructure

Display Priority Logic
javascriptVIP + Notes = "VIP with special instructions"
VIP only = "VIP treatment"
Notes only = "Tracked attendee"
Neither = "Regular attendee"
Self Check-in Screen
Purpose
Many events benefit from self-service check-in stations that reduce staff workload while providing attendees with immediate feedback. However, different event types require different presentation styles and messaging.
Event-Specific Adaptation
Dynamic Welcome Messages
The system automatically generates appropriate Indonesian welcome messages based on Event Espresso's event category:

Sport Events: "Selamat datang kepada para peserta" (Welcome participants)
Wedding Events: "Selamat datang kepada para undangan" (Welcome guests)
Conference Events: "Selamat datang kepada para peserta" (Welcome participants)
Default: "Selamat datang kepada para tamu" (Welcome guests)

Event Branding Integration

Uses event logo as full-screen background
No additional configuration required
Professional appearance matching event identity

User Experience Flow
Standby State

Event logo background with subtle overlay
Clear instructions in Indonesian
Hidden input field captures barcode scanner data
Clean, distraction-free interface

Success State

Large welcome message with attendee name
Ticket type confirmation
VIP treatment for special attendees (crown icon, extended display)
Auto-reset to standby after appropriate duration

VIP Enhancement
Special attendees receive differentiated treatment:

Extended display time (8 seconds vs 5 seconds)
Visual crown indicator
Special welcome messaging
Staff notes displayed if relevant

Technical Implementation
Scanner Integration

Hidden input field with autofocus captures barcode data
Works with standard USB barcode scanners
No special software or drivers required
Seamless transition from scan to display

Event Data Integration

Fetches event logo from existing API endpoints
Uses Event Espresso category data automatically
No additional event configuration required
Graceful fallback for missing data

Integration Benefits
Staff Efficiency

Immediate visual recognition reduces decision time
Pre-event planning through notes system
Consistent information across all staff members
Reduced protocol errors for VIP handling

Attendee Experience

Professional, branded check-in experience
Immediate confirmation of successful registration
Special recognition for VIP attendees
Appropriate cultural messaging (Indonesian)

Event Management

Scalable solution for events of 600-1300+ attendees
Works with existing Event Espresso infrastructure
No additional hardware requirements beyond tablets/screens
Flexible configuration for different event types

Operational Scenarios
Staff-Operated Stations

5 laptops with barcode scanners for staff use
Enhanced scanner interface shows special attendee information
Staff can add notes during event through registration details
Real-time updates across all stations

Self-Service Stations

Dedicated tablet/screen facing attendees
Simplified interface focused on welcome experience
Professional presentation with event branding
Reduced staff workload for routine check-ins

Hybrid Implementation

Some stations staff-operated for complex cases
Some stations self-service for routine attendees
VIP attendees can use either - will receive appropriate treatment
Flexible deployment based on event needs and staffing

This system transforms the traditional check-in process from a basic data lookup into a comprehensive attendee management and customer service tool, while maintaining simplicity for both staff and attendees.

Special Attendee System + Self Check-in
Phase 1: Event Configuration System
1.1 Backend - Event Settings Storage
Objective: Store VIP and Notes question IDs per event
Tasks:

Add event meta fields for question IDs configuration
Create API endpoint to save/retrieve these settings
Add validation to ensure question IDs exist and are admin-only

Implementation:
php// Event meta keys:
// '\_galantis_vip_question_id'
// '\_galantis_notes_question_id'

// API: PUT /event/{eventId}/special-attendee-config
1.2 Frontend - Event Settings UI
Objective: Admin interface to configure question IDs
Tasks:

Find existing event settings/admin interface
Add VIP and Notes question ID selection dropdowns
Populate dropdowns with admin-only questions from current event
Save configuration via API

Files to check:

Look for event admin/settings pages in project knowledge
Check existing dropdown/select patterns for questions

Phase 2: Backend API Enhancement
2.1 Question Answer Lookup System
Objective: Retrieve both VIP status and notes from question answers
Tasks:

Create helper function to get question answer by reg_id + question_id
Modify scanner APIs to include special attendee data
Handle cases where questions aren't configured or have no answers

API Modifications:
php// Enhance these existing endpoints:
// GET /event/{eventId}/scanner/lookup
// POST /event/{eventId}/scanner/checkin
// GET /event/{eventId}/registration/{regId}

// Add special_attendee object to all registration responses
2.2 Registration Details API
Objective: Support saving notes via registration details page
Tasks:

Create API endpoint to save answer to notes question
Validate user permissions for editing
Handle creating new answers vs updating existing ones

New Endpoint:
php// PUT /event/{eventId}/registration/{regId}/notes
Phase 3: Frontend Registration Details Enhancement
3.1 Notes Interface
Objective: Add notes editing to existing registration details page
Tasks:

Find existing registration details Vue component
Add textarea field for notes with save button
Load existing notes value on page load
Handle save/loading/error states with toast notifications
Show VIP status indicator if configured

Files to locate:
bash# Search for registration details component
components/**/RegistrationDetails.vue
pages/**/registration/[regId].vue
Phase 4: Scanner Interface Enhancement
4.1 Special Attendee Display
Objective: Show VIP badges and notes in scanner results
Tasks:

Modify scanner success display to show special attendee info
Add visual treatments (badges, colors) for VIP status
Display notes prominently for staff attention
Update scanner TypeScript types

Files to modify:
bash# Check existing scanner components
components/\*_/Scanner_.vue
types/scanner.d.ts
4.2 Scanner Logic Enhancement
Objective: Handle special attendee data in scan results
Tasks:

Update scan result handling to parse special_attendee object
Add different display states for combinations:

VIP + Notes
VIP only
Notes only
Regular attendee

Phase 5: Self Check-in Page
5.1 New Self Check-in Route
Objective: Create attendee-facing check-in page
Tasks:

Create route: /event/[eventId]/checkin
Create new Vue page component
Implement hidden input for barcode scanners
Add event logo as full-screen background
Implement category-based welcome text

New Files:
bashpages/event/[eventId]/checkin.vue
5.2 Self Check-in Logic
Objective: Handle scanning and display for attendees
Tasks:

Connect to existing check-in API endpoints
Show success state with attendee name and ticket
Display VIP treatment if applicable (crown, special message)
Auto-reset to standby after 5-8 seconds
Handle barcode scanner input seamlessly

Integration:

Use existing scanner/checkin API
Reuse existing registration data types
Follow existing error handling patterns

5.3 Event Data Integration
Objective: Use event logo and category for branding
Tasks:

Fetch event data including logo URL and category
Implement Indonesian welcome text mapping by category
Handle missing logo gracefully
Ensure responsive design for different screen sizes

Phase 6: TypeScript Types and Integration
6.1 Type Definitions
Objective: Add proper TypeScript support
Tasks:

Add special attendee types to existing interfaces
Update scanner response types
Add self check-in page types
Verify all API response structures match types

Types to check/extend:
bashtypes/registration.d.ts
types/scanner.d.ts
types/events.d.ts
6.2 API Integration Testing
Objective: Ensure all parts work together
Tasks:

Test question answer lookup with different configurations
Verify scanner displays work with all special attendee combinations
Test self check-in page with various event types
Validate API responses match TypeScript interfaces

Technical Implementation Details
Event Configuration API:
typescriptinterface SpecialAttendeeConfig {
vip_question_id: number | null;
notes_question_id: number | null;
}
Special Attendee Response:
typescriptinterface SpecialAttendeeData {
is_vip: boolean;
notes: string | null;
display_priority: 'normal' | 'tracked' | 'vip';
has_special_treatment: boolean;
}
Welcome Text Categories:
typescriptconst welcomeTextMap = {
'sport': 'Selamat datang kepada para peserta',
'wedding': 'Selamat datang kepada para undangan',
'conference': 'Selamat datang kepada para peserta',
'default': 'Selamat datang kepada para tamu'
};
Success Criteria
Phase 1-2 Complete:

Can configure VIP and notes question IDs per event
API returns special attendee data based on question answers

Phase 3-4 Complete:

Can edit notes in registration details page
Scanner shows VIP badges and notes appropriately

Phase 5-6 Complete:

Self check-in page works with barcode scanners
Shows event branding and appropriate welcome messages
VIP attendees get special treatment display

---

⏺ Backend Summary: VIP/Notes & Telegram Notifications

✅ Completed Backend Features

1. Event Configuration System

- File: inc/Backend/Endpoints/EventsMeta.php
- Features:
  - Toggle VIP functionality per event
  - Set question IDs for VIP identification and Notes
  - Configure Telegram notification recipients per event
  - CMB2 integration for WordPress admin

2. Special Attendee Data System

- File: inc/Helpers/SpecialAttendeeHelper.php
- Features:
  - Retrieves VIP status from Event Espresso question answers
  - Handles notes from question responses
  - Returns structured data: is_vip, display_priority, special_treatment, notes

3. Enhanced Scanner APIs

- File: inc/DataProviders/ScannerData.php
- Features:
  - Added special_attendee object to all registration responses
  - Automatic VIP notification triggers on check-in
  - Dual notification system (Telegram + WhatsApp)

4. Notes Management API

- File: inc/REST/Endpoints/Registrations.php
- Endpoint: POST /registrations/{id}/notes
- Features:
  - Save/update notes for registrations
  - Links to configured notes question ID

5. Telegram Bot System

- Files:
  - inc/Services/TelegramBotHandler.php - Bot commands & webhook handling
  - inc/Services/TelegramEventNotifier.php - Rich notifications with buttons
- Features:
  - Interactive commands: /start, /id, /help
  - Staff registration via chat messages
  - Automated VIP check-in alerts
  - Admin notification system

6. Admin Configuration

- File: src/pages/General.tsx
- Features:
  - Telegram bot token configuration
  - Webhook setup button
  - Bot testing functionality

📋 Frontend Integration Checklist

Event Management Screen

- Add "Special Attendee Configuration" card
- VIP toggle with conditional question ID input
- Notes configuration section
- "Event Notifications" card with Telegram chat ID management

Scanner Interface Updates

- Display VIP indicators in registration lists
- Show special treatment flags
- Handle special_attendee object in responses
- Display notes field with edit capability

API Integration Points

// Registration response now includes:
{
"special_attendee": {
"is_vip": boolean,
"display_priority": boolean,
"special_treatment": boolean,
"notes": string
}
}

// Save notes endpoint:
POST /wp-json/galantis/v1/registrations/{id}/notes
{ "notes": "Updated notes text" }

Required Frontend Components

1. VIP Badge Component - Visual indicator for VIP attendees
2. Notes Editor - Inline editing for registration notes
3. Telegram Chat Management - Add/remove chat IDs for events
4. Special Treatment Flags - Visual indicators for special handling

🔧 Configuration Flow for Users

1. Admin Setup: Configure Telegram bot token in General Settings
2. Event Setup: Enable VIP/Notes, set question IDs, add notification recipients
3. Staff Onboarding: Staff message bot to get chat IDs
4. Live Usage: VIP check-ins trigger automatic notifications
