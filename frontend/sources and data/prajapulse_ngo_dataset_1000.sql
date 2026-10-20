-- PrajaPulse NGO Dataset — 1,000 synthetic demo rows
-- MySQL 8.0+ | UTF-8 | deterministic seed | generated 2026-10-17
-- IMPORTANT: All records are synthetic/demo data, not verified real-world NGO or citizen records.
-- Evidence paths and hashes are placeholders. No real files, credentials, payments, or private documents are included.
-- This is a proposed standalone schema based on PrajaPulse_NGO_Login_Features.pdf.
-- Integrate with the existing PrajaPulse schema before production; reuse canonical citizen/issue/auth tables where they already exist.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS organizations (
 organization_id VARCHAR(16) PRIMARY KEY, name VARCHAR(180) NOT NULL UNIQUE, mission_category VARCHAR(40) NOT NULL,
 description TEXT, city VARCHAR(80) NOT NULL, state VARCHAR(80) NOT NULL, service_area VARCHAR(80),
 operational_capacity INT NOT NULL DEFAULT 0, verification_status ENUM('verified','pending','needs_correction','suspended') NOT NULL,
 public_email VARCHAR(180), public_phone VARCHAR(30), website_url VARCHAR(255), public_profile_enabled TINYINT(1) NOT NULL DEFAULT 1,
 created_at DATE NOT NULL, data_source VARCHAR(30) NOT NULL DEFAULT 'synthetic_demo',
 INDEX idx_org_mission_location (mission_category, state, city), INDEX idx_org_verification (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS organization_memberships (
 membership_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, member_ref VARCHAR(16) NOT NULL UNIQUE,
 display_name VARCHAR(120) NOT NULL, email VARCHAR(180) NOT NULL UNIQUE,
 role ENUM('owner','ngo_administrator','campaign_manager','field_coordinator','volunteer_coordinator','evidence_submitter','finance_compliance_officer','read_only_member') NOT NULL,
 membership_status ENUM('active','invited','revoked') NOT NULL, joined_at DATE NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id), INDEX idx_member_role (role,membership_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS organization_verification_applications (
 application_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, demo_registration_ref VARCHAR(40) NOT NULL UNIQUE,
 application_status ENUM('submitted','under_review','approved','correction_requested','rejected') NOT NULL,
 submitted_at DATE NOT NULL, reviewed_at DATE, reviewer_notes TEXT, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS organization_capabilities (
 capability_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, capability_category VARCHAR(40) NOT NULL,
 coverage_city VARCHAR(80) NOT NULL, coverage_state VARCHAR(80) NOT NULL, approval_status ENUM('approved','pending','rejected') NOT NULL,
 capacity INT NOT NULL, data_source VARCHAR(30) NOT NULL, FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
 INDEX idx_capability (capability_category,coverage_state,coverage_city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS civic_issues (
 issue_id VARCHAR(16) PRIMARY KEY, title VARCHAR(220) NOT NULL, category VARCHAR(50) NOT NULL,
 urgency ENUM('low','medium','high','critical') NOT NULL,
 issue_status ENUM('reported','community_validated','under_review','assigned','in_progress','awaiting_government','resolved','reopened') NOT NULL,
 city VARCHAR(80) NOT NULL, state VARCHAR(80) NOT NULL, locality VARCHAR(80), latitude DECIMAL(9,6), longitude DECIMAL(9,6),
 reported_at DATE NOT NULL, description TEXT, citizen_ref VARCHAR(16), citizen_details_permitted TINYINT(1) NOT NULL DEFAULT 0,
 data_source VARCHAR(30) NOT NULL, INDEX idx_issue_filter (category,urgency,issue_status,state,city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ngo_issue_associations (
 association_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, issue_id VARCHAR(16) NOT NULL,
 association_status ENUM('interested','assessment_proposed','assistance_offered','referred','declined','supporting') NOT NULL,
 priority ENUM('low','medium','high') NOT NULL, notes TEXT, updated_at DATE NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id), FOREIGN KEY (issue_id) REFERENCES civic_issues(issue_id),
 UNIQUE KEY uq_org_issue (organization_id,issue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS campaigns (
 campaign_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, title VARCHAR(220) NOT NULL, campaign_type VARCHAR(50) NOT NULL,
 objectives TEXT, city VARCHAR(80) NOT NULL, state VARCHAR(80) NOT NULL, locality VARCHAR(80), start_date DATE NOT NULL, end_date DATE NOT NULL,
 volunteer_capacity INT NOT NULL, campaign_status ENUM('draft','pending_review','active','paused','completed','cancelled') NOT NULL,
 volunteer_registration_status ENUM('open','closed') NOT NULL, requires_review TINYINT(1) NOT NULL DEFAULT 0, safety_instructions TEXT,
 data_source VARCHAR(30) NOT NULL, FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
 INDEX idx_campaign_status_dates (campaign_status,start_date,end_date), INDEX idx_campaign_location (state,city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS campaign_issue_links (
 link_id VARCHAR(16) PRIMARY KEY, campaign_id VARCHAR(16) NOT NULL, issue_id VARCHAR(16) NOT NULL,
 link_type ENUM('primary','related') NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id), FOREIGN KEY (issue_id) REFERENCES civic_issues(issue_id),
 UNIQUE KEY uq_campaign_issue (campaign_id,issue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS campaign_partners (
 campaign_partner_id VARCHAR(16) PRIMARY KEY, campaign_id VARCHAR(16) NOT NULL, partner_organization_id VARCHAR(16) NOT NULL,
 partner_role VARCHAR(40) NOT NULL, partnership_status ENUM('invited','accepted','declined','withdrawn') NOT NULL,
 responsibility_scope TEXT, data_source VARCHAR(30) NOT NULL, FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id),
 FOREIGN KEY (partner_organization_id) REFERENCES organizations(organization_id), UNIQUE KEY uq_campaign_partner (campaign_id,partner_organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS campaign_tasks (
 task_id VARCHAR(16) PRIMARY KEY, campaign_id VARCHAR(16) NOT NULL, title VARCHAR(220) NOT NULL,
 task_status ENUM('not_started','in_progress','blocked','completed') NOT NULL, assigned_member_ref VARCHAR(16),
 start_date DATE, due_date DATE, notes TEXT, safety_flag TINYINT(1) NOT NULL DEFAULT 0, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id), INDEX idx_task_status_due (task_status,due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS volunteer_registrations (
 registration_id VARCHAR(16) PRIMARY KEY, campaign_id VARCHAR(16) NOT NULL, volunteer_ref VARCHAR(16) NOT NULL,
 display_name VARCHAR(120) NOT NULL, demo_email VARCHAR(180) NOT NULL UNIQUE,
 application_status ENUM('pending','accepted','declined','withdrawn','waitlisted') NOT NULL,
 participant_type VARCHAR(40), consent_recorded TINYINT(1) NOT NULL DEFAULT 0, applied_at DATE NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id), UNIQUE KEY uq_volunteer_campaign (volunteer_ref,campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attendance_records (
 attendance_id VARCHAR(16) PRIMARY KEY, registration_id VARCHAR(16) NOT NULL,
 attendance_status ENUM('present','absent','late','excused') NOT NULL, hours DECIMAL(4,1) NOT NULL, recorded_at DATE NOT NULL,
 notes TEXT, data_source VARCHAR(30) NOT NULL, FOREIGN KEY (registration_id) REFERENCES volunteer_registrations(registration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS evidence_records (
 evidence_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, campaign_id VARCHAR(16), task_id VARCHAR(16), issue_id VARCHAR(16),
 evidence_type ENUM('photo','document','measurement','observation') NOT NULL, private_storage_path VARCHAR(255) NOT NULL,
 content_hash VARCHAR(80) NOT NULL UNIQUE, submitted_at DATE NOT NULL,
 evidence_status ENUM('submitted','supported','partially_supported','correction_requested','disputed','unverified') NOT NULL,
 metadata_notes TEXT, version_label VARCHAR(20) NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id), FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id),
 FOREIGN KEY (task_id) REFERENCES campaign_tasks(task_id), FOREIGN KEY (issue_id) REFERENCES civic_issues(issue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS verification_reviews (
 review_id VARCHAR(16) PRIMARY KEY, evidence_id VARCHAR(16) NOT NULL, reviewer_ref VARCHAR(16) NOT NULL,
 decision ENUM('supported','partially_supported','correction_requested','disputed','unverified') NOT NULL,
 rationale TEXT, reviewed_at DATE NOT NULL, conflict_flag TINYINT(1) NOT NULL DEFAULT 0, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (evidence_id) REFERENCES evidence_records(evidence_id), INDEX idx_review_decision (decision,reviewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS field_operations (
 field_operation_id VARCHAR(16) PRIMARY KEY, campaign_id VARCHAR(16) NOT NULL, task_id VARCHAR(16) NOT NULL,
 coordinator_member_ref VARCHAR(16), scheduled_date DATE NOT NULL, operation_status ENUM('scheduled','in_progress','completed','blocked') NOT NULL,
 measurement_type VARCHAR(50) NOT NULL, measured_value DECIMAL(10,2) NOT NULL, measurement_unit VARCHAR(20) NOT NULL,
 field_notes TEXT, data_source VARCHAR(30) NOT NULL, FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id),
 FOREIGN KEY (task_id) REFERENCES campaign_tasks(task_id), INDEX idx_field_status_date (operation_status,scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS impact_measurements (
 measurement_id VARCHAR(16) PRIMARY KEY, campaign_id VARCHAR(16) NOT NULL, organization_id VARCHAR(16) NOT NULL,
 metric_name VARCHAR(60) NOT NULL, planned_value DECIMAL(12,2) NOT NULL, metric_unit VARCHAR(20) NOT NULL,
 delivered_value DECIMAL(12,2) NOT NULL, verification_status ENUM('unverified','partially_verified','verified') NOT NULL,
 evidence_id VARCHAR(16), measured_at DATE NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id), FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
 FOREIGN KEY (evidence_id) REFERENCES evidence_records(evidence_id), INDEX idx_impact_metric (metric_name,verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contribution_records (
 contribution_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, campaign_id VARCHAR(16) NOT NULL,
 contribution_type VARCHAR(60) NOT NULL, contribution_status ENUM('pending_verification','verified','rejected','reversed') NOT NULL,
 quantity DECIMAL(12,2) NOT NULL, unit VARCHAR(30) NOT NULL, recorded_at DATE NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id), FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id),
 INDEX idx_contribution_status (contribution_status,recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recognition_records (
 recognition_id VARCHAR(16) PRIMARY KEY, contribution_id VARCHAR(16) NOT NULL, organization_id VARCHAR(16) NOT NULL,
 recognition_type VARCHAR(60) NOT NULL, recognition_status ENUM('eligible','issued','pending_review','revoked') NOT NULL,
 demo_certificate_ref VARCHAR(40), issued_at DATE NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (contribution_id) REFERENCES contribution_records(contribution_id), FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS follow_up_checks (
 follow_up_id VARCHAR(16) PRIMARY KEY, campaign_id VARCHAR(16) NOT NULL, issue_id VARCHAR(16) NOT NULL,
 due_date DATE NOT NULL, follow_up_status ENUM('scheduled','completed','overdue','cancelled') NOT NULL,
 observation TEXT, recurrence_flag TINYINT(1) NOT NULL DEFAULT 0, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id), FOREIGN KEY (issue_id) REFERENCES civic_issues(issue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS government_coordination_requests (
 coordination_request_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, issue_id VARCHAR(16) NOT NULL, campaign_id VARCHAR(16),
 department_name VARCHAR(100) NOT NULL, request_type ENUM('assistance','inspection','official_response','dependency_blocker') NOT NULL,
 request_status ENUM('submitted','acknowledged','in_progress','responded','closed','rejected') NOT NULL,
 submitted_at DATE NOT NULL, responded_at DATE, request_details TEXT, demo_reference VARCHAR(40) NOT NULL UNIQUE, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id), FOREIGN KEY (issue_id) REFERENCES civic_issues(issue_id),
 FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS partnership_requests (
 partnership_request_id VARCHAR(16) PRIMARY KEY, requesting_organization_id VARCHAR(16) NOT NULL, target_organization_id VARCHAR(16) NOT NULL,
 campaign_id VARCHAR(16), request_type VARCHAR(50) NOT NULL, request_status ENUM('pending','accepted','declined','withdrawn') NOT NULL,
 requested_at DATE NOT NULL, scope_notes TEXT, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (requesting_organization_id) REFERENCES organizations(organization_id), FOREIGN KEY (target_organization_id) REFERENCES organizations(organization_id),
 FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resource_requests (
 resource_request_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, campaign_id VARCHAR(16), resource_category VARCHAR(60) NOT NULL,
 quantity INT NOT NULL, quantity_unit VARCHAR(30) NOT NULL, location_city VARCHAR(80) NOT NULL, deadline DATE NOT NULL,
 request_status ENUM('open','matched','partially_fulfilled','fulfilled','cancelled','disputed') NOT NULL,
 record_kind ENUM('request','offer') NOT NULL, intended_use TEXT, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id), FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resource_offers (
 resource_offer_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, resource_category VARCHAR(60) NOT NULL,
 quantity INT NOT NULL, quantity_unit VARCHAR(30) NOT NULL, location_city VARCHAR(80) NOT NULL,
 offer_status ENUM('available','reserved','delivered','withdrawn') NOT NULL, available_until DATE NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS community_resources (
 resource_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, campaign_id VARCHAR(16), content_type VARCHAR(50) NOT NULL,
 title VARCHAR(220) NOT NULL, body TEXT, publication_status ENUM('draft','published','under_review','archived') NOT NULL,
 public_visible TINYINT(1) NOT NULL DEFAULT 0, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id), FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS community_feedback (
 feedback_id VARCHAR(16) PRIMARY KEY, campaign_id VARCHAR(16) NOT NULL, organization_id VARCHAR(16) NOT NULL, rating TINYINT NOT NULL,
 feedback_type ENUM('positive','suggestion','concern','safeguarding') NOT NULL, feedback_text TEXT,
 feedback_status ENUM('new','reviewed','actioned','closed') NOT NULL, submitted_at DATE NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id), FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
 CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
 notification_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, recipient_member_ref VARCHAR(16),
 event_type VARCHAR(60) NOT NULL, title VARCHAR(220) NOT NULL, related_reference VARCHAR(40), is_read TINYINT(1) NOT NULL DEFAULT 0,
 created_at DATE NOT NULL, data_source VARCHAR(30) NOT NULL, FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
 INDEX idx_notification_unread (organization_id,is_read,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS complaints_and_disputes (
 case_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, campaign_id VARCHAR(16), case_type VARCHAR(60) NOT NULL,
 severity ENUM('low','medium','high','critical') NOT NULL, case_status ENUM('open','under_review','awaiting_response','resolved','dismissed') NOT NULL,
 restricted_summary TEXT, opened_at DATE NOT NULL, demo_case_reference VARCHAR(40) NOT NULL UNIQUE, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id), FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_events (
 audit_event_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, actor_member_ref VARCHAR(16), action_type VARCHAR(60) NOT NULL,
 object_type VARCHAR(50) NOT NULL, object_reference VARCHAR(40) NOT NULL, occurred_at DATE NOT NULL, event_summary TEXT, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id), INDEX idx_audit_org_date (organization_id,occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_assistance_records (
 ai_record_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, issue_id VARCHAR(16), capability_type VARCHAR(60) NOT NULL,
 confidence_score DECIMAL(4,2) NOT NULL, output_kind VARCHAR(40) NOT NULL, output_summary TEXT,
 review_status ENUM('pending_review','accepted','dismissed','needs_revision') NOT NULL, generated_at DATE NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id), FOREIGN KEY (issue_id) REFERENCES civic_issues(issue_id),
 CHECK (confidence_score BETWEEN 0 AND 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS public_impact_profiles (
 profile_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, public_title VARCHAR(220) NOT NULL, mission_category VARCHAR(40) NOT NULL,
 public_visible TINYINT(1) NOT NULL, public_contact_method VARCHAR(80), impact_summary TEXT,
 publication_status ENUM('draft','published','under_review') NOT NULL, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS compliance_documents (
 compliance_document_id VARCHAR(16) PRIMARY KEY, organization_id VARCHAR(16) NOT NULL, document_type VARCHAR(60) NOT NULL,
 private_storage_path VARCHAR(255) NOT NULL, document_status ENUM('pending','approved','expiring','expired','rejected') NOT NULL,
 submitted_at DATE NOT NULL, expiry_date DATE, demo_document_reference VARCHAR(40) NOT NULL UNIQUE, data_source VARCHAR(30) NOT NULL,
 FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dataset_quality_events (
 quality_event_id VARCHAR(16) PRIMARY KEY, data_source VARCHAR(30) NOT NULL, event_type VARCHAR(60) NOT NULL,
 event_description TEXT, occurred_at DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Seed data: exactly 1,000 rows across 30 feature-oriented tables.

INSERT INTO `organizations` (organization_id,name,mission_category,description,city,state,service_area,operational_capacity,verification_status,public_email,public_phone,website_url,public_profile_enabled,created_at,data_source) VALUES
('ORG0001','Green Collective Lucknow Demo 01','sanitation','Synthetic demo organization for sanitation in Lucknow.','Lucknow','Uttar Pradesh','Ward 02',17,'pending','contact-001@example.org','+91-9000000001','https://demo-001.example.org',1,'2025-01-08','synthetic_demo'),
('ORG0002','Sahyog Trust Kanpur Demo 02','environment','Synthetic demo organization for environment in Kanpur.','Kanpur','Uttar Pradesh','Ward 03',24,'needs_correction','contact-002@example.org','+91-9000000002','https://demo-002.example.org',1,'2025-01-15','synthetic_demo'),
('ORG0003','Jan Initiative Varanasi Demo 03','education','Synthetic demo organization for education in Varanasi.','Varanasi','Uttar Pradesh','Ward 04',31,'suspended','contact-003@example.org','+91-9000000003','https://demo-003.example.org',1,'2025-01-22','synthetic_demo'),
('ORG0004','Udaan Network Pune Demo 04','health','Synthetic demo organization for health in Pune.','Pune','Maharashtra','Ward 05',38,'verified','contact-004@example.org','+91-9000000004','https://demo-004.example.org',1,'2025-01-29','synthetic_demo'),
('ORG0005','Seva Foundation Nagpur Demo 05','accessibility','Synthetic demo organization for accessibility in Nagpur.','Nagpur','Maharashtra','Ward 06',45,'pending','contact-005@example.org','+91-9000000005','https://demo-005.example.org',0,'2025-02-05','synthetic_demo'),
('ORG0006','Community Collective Patna Demo 06','welfare','Synthetic demo organization for welfare in Patna.','Patna','Bihar','Ward 07',52,'needs_correction','contact-006@example.org','+91-9000000006','https://demo-006.example.org',1,'2025-02-12','synthetic_demo'),
('ORG0007','Green Trust Gaya Demo 07','disaster_relief','Synthetic demo organization for disaster relief in Gaya.','Gaya','Bihar','Ward 08',59,'suspended','contact-007@example.org','+91-9000000007','https://demo-007.example.org',1,'2025-02-19','synthetic_demo'),
('ORG0008','Sahyog Initiative Chennai Demo 08','community_support','Synthetic demo organization for community support in Chennai.','Chennai','Tamil Nadu','Ward 09',66,'verified','contact-008@example.org','+91-9000000008','https://demo-008.example.org',1,'2025-02-26','synthetic_demo'),
('ORG0009','Jan Network Coimbatore Demo 09','sanitation','Synthetic demo organization for sanitation in Coimbatore.','Coimbatore','Tamil Nadu','Ward 10',73,'pending','contact-009@example.org','+91-9000000009','https://demo-009.example.org',1,'2025-03-05','synthetic_demo'),
('ORG0010','Udaan Foundation Bengaluru Demo 10','environment','Synthetic demo organization for environment in Bengaluru.','Bengaluru','Karnataka','Ward 01',80,'needs_correction','contact-010@example.org','+91-9000000010','https://demo-010.example.org',0,'2025-03-12','synthetic_demo'),
('ORG0011','Seva Collective Jaipur Demo 11','education','Synthetic demo organization for education in Jaipur.','Jaipur','Rajasthan','Ward 02',87,'suspended','contact-011@example.org','+91-9000000011','https://demo-011.example.org',1,'2025-03-19','synthetic_demo'),
('ORG0012','Community Trust Bhopal Demo 12','health','Synthetic demo organization for health in Bhopal.','Bhopal','Madhya Pradesh','Ward 03',94,'verified','contact-012@example.org','+91-9000000012','https://demo-012.example.org',1,'2025-03-26','synthetic_demo'),
('ORG0013','Green Initiative Lucknow Demo 13','accessibility','Synthetic demo organization for accessibility in Lucknow.','Lucknow','Uttar Pradesh','Ward 04',11,'pending','contact-013@example.org','+91-9000000013','https://demo-013.example.org',1,'2025-04-02','synthetic_demo'),
('ORG0014','Sahyog Network Kanpur Demo 14','welfare','Synthetic demo organization for welfare in Kanpur.','Kanpur','Uttar Pradesh','Ward 05',18,'needs_correction','contact-014@example.org','+91-9000000014','https://demo-014.example.org',1,'2025-04-09','synthetic_demo'),
('ORG0015','Jan Foundation Varanasi Demo 15','disaster_relief','Synthetic demo organization for disaster relief in Varanasi.','Varanasi','Uttar Pradesh','Ward 06',25,'suspended','contact-015@example.org','+91-9000000015','https://demo-015.example.org',0,'2025-04-16','synthetic_demo'),
('ORG0016','Udaan Collective Pune Demo 16','community_support','Synthetic demo organization for community support in Pune.','Pune','Maharashtra','Ward 07',32,'verified','contact-016@example.org','+91-9000000016','https://demo-016.example.org',1,'2025-04-23','synthetic_demo'),
('ORG0017','Seva Trust Nagpur Demo 17','sanitation','Synthetic demo organization for sanitation in Nagpur.','Nagpur','Maharashtra','Ward 08',39,'pending','contact-017@example.org','+91-9000000017','https://demo-017.example.org',1,'2025-04-30','synthetic_demo'),
('ORG0018','Community Initiative Patna Demo 18','environment','Synthetic demo organization for environment in Patna.','Patna','Bihar','Ward 09',46,'needs_correction','contact-018@example.org','+91-9000000018','https://demo-018.example.org',1,'2025-05-07','synthetic_demo'),
('ORG0019','Green Network Gaya Demo 19','education','Synthetic demo organization for education in Gaya.','Gaya','Bihar','Ward 10',53,'suspended','contact-019@example.org','+91-9000000019','https://demo-019.example.org',1,'2025-05-14','synthetic_demo'),
('ORG0020','Sahyog Foundation Chennai Demo 20','health','Synthetic demo organization for health in Chennai.','Chennai','Tamil Nadu','Ward 01',60,'verified','contact-020@example.org','+91-9000000020','https://demo-020.example.org',0,'2025-05-21','synthetic_demo'),
('ORG0021','Jan Collective Coimbatore Demo 21','accessibility','Synthetic demo organization for accessibility in Coimbatore.','Coimbatore','Tamil Nadu','Ward 02',67,'pending','contact-021@example.org','+91-9000000021','https://demo-021.example.org',1,'2025-05-28','synthetic_demo'),
('ORG0022','Udaan Trust Bengaluru Demo 22','welfare','Synthetic demo organization for welfare in Bengaluru.','Bengaluru','Karnataka','Ward 03',74,'needs_correction','contact-022@example.org','+91-9000000022','https://demo-022.example.org',1,'2025-06-04','synthetic_demo'),
('ORG0023','Seva Initiative Jaipur Demo 23','disaster_relief','Synthetic demo organization for disaster relief in Jaipur.','Jaipur','Rajasthan','Ward 04',81,'suspended','contact-023@example.org','+91-9000000023','https://demo-023.example.org',1,'2025-06-11','synthetic_demo'),
('ORG0024','Community Network Bhopal Demo 24','community_support','Synthetic demo organization for community support in Bhopal.','Bhopal','Madhya Pradesh','Ward 05',88,'verified','contact-024@example.org','+91-9000000024','https://demo-024.example.org',1,'2025-06-18','synthetic_demo'),
('ORG0025','Green Foundation Lucknow Demo 25','sanitation','Synthetic demo organization for sanitation in Lucknow.','Lucknow','Uttar Pradesh','Ward 06',95,'pending','contact-025@example.org','+91-9000000025','https://demo-025.example.org',0,'2025-06-25','synthetic_demo'),
('ORG0026','Sahyog Collective Kanpur Demo 26','environment','Synthetic demo organization for environment in Kanpur.','Kanpur','Uttar Pradesh','Ward 07',12,'needs_correction','contact-026@example.org','+91-9000000026','https://demo-026.example.org',1,'2025-07-02','synthetic_demo'),
('ORG0027','Jan Trust Varanasi Demo 27','education','Synthetic demo organization for education in Varanasi.','Varanasi','Uttar Pradesh','Ward 08',19,'suspended','contact-027@example.org','+91-9000000027','https://demo-027.example.org',1,'2025-07-09','synthetic_demo'),
('ORG0028','Udaan Initiative Pune Demo 28','health','Synthetic demo organization for health in Pune.','Pune','Maharashtra','Ward 09',26,'verified','contact-028@example.org','+91-9000000028','https://demo-028.example.org',1,'2025-07-16','synthetic_demo'),
('ORG0029','Seva Network Nagpur Demo 29','accessibility','Synthetic demo organization for accessibility in Nagpur.','Nagpur','Maharashtra','Ward 10',33,'pending','contact-029@example.org','+91-9000000029','https://demo-029.example.org',1,'2025-07-23','synthetic_demo'),
('ORG0030','Community Foundation Patna Demo 30','welfare','Synthetic demo organization for welfare in Patna.','Patna','Bihar','Ward 01',40,'needs_correction','contact-030@example.org','+91-9000000030','https://demo-030.example.org',0,'2025-07-30','synthetic_demo');

INSERT INTO `organization_verification_applications` (application_id,organization_id,demo_registration_ref,application_status,submitted_at,reviewed_at,reviewer_notes,data_source) VALUES
('VER00001','ORG0001','DEMO-REG-00001','under_review','2025-01-06',NULL,'Synthetic verification note 1; no real document attached.','synthetic_demo'),
('VER00002','ORG0002','DEMO-REG-00002','approved','2025-01-11','2025-01-18','Synthetic verification note 2; no real document attached.','synthetic_demo'),
('VER00003','ORG0003','DEMO-REG-00003','correction_requested','2025-01-16',NULL,'Synthetic verification note 3; no real document attached.','synthetic_demo'),
('VER00004','ORG0004','DEMO-REG-00004','rejected','2025-01-21','2025-01-28','Synthetic verification note 4; no real document attached.','synthetic_demo'),
('VER00005','ORG0005','DEMO-REG-00005','submitted','2025-01-26',NULL,'Synthetic verification note 5; no real document attached.','synthetic_demo'),
('VER00006','ORG0006','DEMO-REG-00006','under_review','2025-01-31','2025-02-07','Synthetic verification note 6; no real document attached.','synthetic_demo'),
('VER00007','ORG0007','DEMO-REG-00007','approved','2025-02-05',NULL,'Synthetic verification note 7; no real document attached.','synthetic_demo'),
('VER00008','ORG0008','DEMO-REG-00008','correction_requested','2025-02-10','2025-02-17','Synthetic verification note 8; no real document attached.','synthetic_demo'),
('VER00009','ORG0009','DEMO-REG-00009','rejected','2025-02-15',NULL,'Synthetic verification note 9; no real document attached.','synthetic_demo'),
('VER00010','ORG0010','DEMO-REG-00010','submitted','2025-02-20','2025-02-27','Synthetic verification note 10; no real document attached.','synthetic_demo'),
('VER00011','ORG0011','DEMO-REG-00011','under_review','2025-02-25',NULL,'Synthetic verification note 11; no real document attached.','synthetic_demo'),
('VER00012','ORG0012','DEMO-REG-00012','approved','2025-03-02','2025-03-09','Synthetic verification note 12; no real document attached.','synthetic_demo'),
('VER00013','ORG0013','DEMO-REG-00013','correction_requested','2025-03-07',NULL,'Synthetic verification note 13; no real document attached.','synthetic_demo'),
('VER00014','ORG0014','DEMO-REG-00014','rejected','2025-03-12','2025-03-19','Synthetic verification note 14; no real document attached.','synthetic_demo'),
('VER00015','ORG0015','DEMO-REG-00015','submitted','2025-03-17',NULL,'Synthetic verification note 15; no real document attached.','synthetic_demo'),
('VER00016','ORG0016','DEMO-REG-00016','under_review','2025-03-22','2025-03-29','Synthetic verification note 16; no real document attached.','synthetic_demo'),
('VER00017','ORG0017','DEMO-REG-00017','approved','2025-03-27',NULL,'Synthetic verification note 17; no real document attached.','synthetic_demo'),
('VER00018','ORG0018','DEMO-REG-00018','correction_requested','2025-04-01','2025-04-08','Synthetic verification note 18; no real document attached.','synthetic_demo'),
('VER00019','ORG0019','DEMO-REG-00019','rejected','2025-04-06',NULL,'Synthetic verification note 19; no real document attached.','synthetic_demo'),
('VER00020','ORG0020','DEMO-REG-00020','submitted','2025-04-11','2025-04-18','Synthetic verification note 20; no real document attached.','synthetic_demo'),
('VER00021','ORG0021','DEMO-REG-00021','under_review','2025-04-16',NULL,'Synthetic verification note 21; no real document attached.','synthetic_demo'),
('VER00022','ORG0022','DEMO-REG-00022','approved','2025-04-21','2025-04-28','Synthetic verification note 22; no real document attached.','synthetic_demo'),
('VER00023','ORG0023','DEMO-REG-00023','correction_requested','2025-04-26',NULL,'Synthetic verification note 23; no real document attached.','synthetic_demo'),
('VER00024','ORG0024','DEMO-REG-00024','rejected','2025-05-01','2025-05-08','Synthetic verification note 24; no real document attached.','synthetic_demo'),
('VER00025','ORG0025','DEMO-REG-00025','submitted','2025-05-06',NULL,'Synthetic verification note 25; no real document attached.','synthetic_demo'),
('VER00026','ORG0026','DEMO-REG-00026','under_review','2025-05-11','2025-05-18','Synthetic verification note 26; no real document attached.','synthetic_demo'),
('VER00027','ORG0027','DEMO-REG-00027','approved','2025-05-16',NULL,'Synthetic verification note 27; no real document attached.','synthetic_demo'),
('VER00028','ORG0028','DEMO-REG-00028','correction_requested','2025-05-21','2025-05-28','Synthetic verification note 28; no real document attached.','synthetic_demo'),
('VER00029','ORG0029','DEMO-REG-00029','rejected','2025-05-26',NULL,'Synthetic verification note 29; no real document attached.','synthetic_demo'),
('VER00030','ORG0030','DEMO-REG-00030','submitted','2025-05-31','2025-06-07','Synthetic verification note 30; no real document attached.','synthetic_demo');

INSERT INTO `organization_capabilities` (capability_id,organization_id,capability_category,coverage_city,coverage_state,approval_status,capacity,data_source) VALUES
('CAP00001','ORG0001','sanitation','Lucknow','Uttar Pradesh','approved',8,'synthetic_demo'),
('CAP00002','ORG0002','environment','Kanpur','Uttar Pradesh','pending',11,'synthetic_demo'),
('CAP00003','ORG0003','education','Varanasi','Uttar Pradesh','pending',14,'synthetic_demo'),
('CAP00004','ORG0004','health','Pune','Maharashtra','pending',17,'synthetic_demo'),
('CAP00005','ORG0005','accessibility','Nagpur','Maharashtra','approved',20,'synthetic_demo'),
('CAP00006','ORG0006','welfare','Patna','Bihar','pending',23,'synthetic_demo'),
('CAP00007','ORG0007','disaster_relief','Gaya','Bihar','pending',26,'synthetic_demo'),
('CAP00008','ORG0008','community_support','Chennai','Tamil Nadu','pending',29,'synthetic_demo'),
('CAP00009','ORG0009','sanitation','Coimbatore','Tamil Nadu','approved',32,'synthetic_demo'),
('CAP00010','ORG0010','environment','Bengaluru','Karnataka','pending',35,'synthetic_demo'),
('CAP00011','ORG0011','education','Jaipur','Rajasthan','pending',38,'synthetic_demo'),
('CAP00012','ORG0012','health','Bhopal','Madhya Pradesh','pending',41,'synthetic_demo'),
('CAP00013','ORG0013','accessibility','Lucknow','Uttar Pradesh','approved',44,'synthetic_demo'),
('CAP00014','ORG0014','welfare','Kanpur','Uttar Pradesh','pending',47,'synthetic_demo'),
('CAP00015','ORG0015','disaster_relief','Varanasi','Uttar Pradesh','pending',50,'synthetic_demo'),
('CAP00016','ORG0016','community_support','Pune','Maharashtra','pending',53,'synthetic_demo'),
('CAP00017','ORG0017','sanitation','Nagpur','Maharashtra','approved',6,'synthetic_demo'),
('CAP00018','ORG0018','environment','Patna','Bihar','pending',9,'synthetic_demo'),
('CAP00019','ORG0019','education','Gaya','Bihar','pending',12,'synthetic_demo'),
('CAP00020','ORG0020','health','Chennai','Tamil Nadu','pending',15,'synthetic_demo'),
('CAP00021','ORG0021','accessibility','Coimbatore','Tamil Nadu','approved',18,'synthetic_demo'),
('CAP00022','ORG0022','welfare','Bengaluru','Karnataka','pending',21,'synthetic_demo'),
('CAP00023','ORG0023','disaster_relief','Jaipur','Rajasthan','pending',24,'synthetic_demo'),
('CAP00024','ORG0024','community_support','Bhopal','Madhya Pradesh','pending',27,'synthetic_demo'),
('CAP00025','ORG0025','sanitation','Lucknow','Uttar Pradesh','approved',30,'synthetic_demo'),
('CAP00026','ORG0026','environment','Kanpur','Uttar Pradesh','pending',33,'synthetic_demo'),
('CAP00027','ORG0027','education','Varanasi','Uttar Pradesh','pending',36,'synthetic_demo'),
('CAP00028','ORG0028','health','Pune','Maharashtra','pending',39,'synthetic_demo'),
('CAP00029','ORG0029','accessibility','Nagpur','Maharashtra','approved',42,'synthetic_demo'),
('CAP00030','ORG0030','welfare','Patna','Bihar','pending',45,'synthetic_demo');

INSERT INTO `public_impact_profiles` (profile_id,organization_id,public_title,mission_category,public_visible,public_contact_method,impact_summary,publication_status,data_source) VALUES
('PIP00001','ORG0001','Green Collective Lucknow Demo 01 — demo impact profile','sanitation',1,'public contact form only','Evidence-linked impact summary placeholder for Lucknow.','published','synthetic_demo'),
('PIP00002','ORG0002','Sahyog Trust Kanpur Demo 02 — demo impact profile','environment',1,'public contact form only','Evidence-linked impact summary placeholder for Kanpur.','under_review','synthetic_demo'),
('PIP00003','ORG0003','Jan Initiative Varanasi Demo 03 — demo impact profile','education',1,'public contact form only','Evidence-linked impact summary placeholder for Varanasi.','draft','synthetic_demo'),
('PIP00004','ORG0004','Udaan Network Pune Demo 04 — demo impact profile','health',0,'public contact form only','Evidence-linked impact summary placeholder for Pune.','published','synthetic_demo'),
('PIP00005','ORG0005','Seva Foundation Nagpur Demo 05 — demo impact profile','accessibility',1,'public contact form only','Evidence-linked impact summary placeholder for Nagpur.','under_review','synthetic_demo'),
('PIP00006','ORG0006','Community Collective Patna Demo 06 — demo impact profile','welfare',1,'public contact form only','Evidence-linked impact summary placeholder for Patna.','draft','synthetic_demo'),
('PIP00007','ORG0007','Green Trust Gaya Demo 07 — demo impact profile','disaster_relief',1,'public contact form only','Evidence-linked impact summary placeholder for Gaya.','published','synthetic_demo'),
('PIP00008','ORG0008','Sahyog Initiative Chennai Demo 08 — demo impact profile','community_support',0,'public contact form only','Evidence-linked impact summary placeholder for Chennai.','under_review','synthetic_demo'),
('PIP00009','ORG0009','Jan Network Coimbatore Demo 09 — demo impact profile','sanitation',1,'public contact form only','Evidence-linked impact summary placeholder for Coimbatore.','draft','synthetic_demo'),
('PIP00010','ORG0010','Udaan Foundation Bengaluru Demo 10 — demo impact profile','environment',1,'public contact form only','Evidence-linked impact summary placeholder for Bengaluru.','published','synthetic_demo'),
('PIP00011','ORG0011','Seva Collective Jaipur Demo 11 — demo impact profile','education',1,'public contact form only','Evidence-linked impact summary placeholder for Jaipur.','under_review','synthetic_demo'),
('PIP00012','ORG0012','Community Trust Bhopal Demo 12 — demo impact profile','health',0,'public contact form only','Evidence-linked impact summary placeholder for Bhopal.','draft','synthetic_demo'),
('PIP00013','ORG0013','Green Initiative Lucknow Demo 13 — demo impact profile','accessibility',1,'public contact form only','Evidence-linked impact summary placeholder for Lucknow.','published','synthetic_demo'),
('PIP00014','ORG0014','Sahyog Network Kanpur Demo 14 — demo impact profile','welfare',1,'public contact form only','Evidence-linked impact summary placeholder for Kanpur.','under_review','synthetic_demo'),
('PIP00015','ORG0015','Jan Foundation Varanasi Demo 15 — demo impact profile','disaster_relief',1,'public contact form only','Evidence-linked impact summary placeholder for Varanasi.','draft','synthetic_demo'),
('PIP00016','ORG0016','Udaan Collective Pune Demo 16 — demo impact profile','community_support',0,'public contact form only','Evidence-linked impact summary placeholder for Pune.','published','synthetic_demo'),
('PIP00017','ORG0017','Seva Trust Nagpur Demo 17 — demo impact profile','sanitation',1,'public contact form only','Evidence-linked impact summary placeholder for Nagpur.','under_review','synthetic_demo'),
('PIP00018','ORG0018','Community Initiative Patna Demo 18 — demo impact profile','environment',1,'public contact form only','Evidence-linked impact summary placeholder for Patna.','draft','synthetic_demo'),
('PIP00019','ORG0019','Green Network Gaya Demo 19 — demo impact profile','education',1,'public contact form only','Evidence-linked impact summary placeholder for Gaya.','published','synthetic_demo'),
('PIP00020','ORG0020','Sahyog Foundation Chennai Demo 20 — demo impact profile','health',0,'public contact form only','Evidence-linked impact summary placeholder for Chennai.','under_review','synthetic_demo'),
('PIP00021','ORG0021','Jan Collective Coimbatore Demo 21 — demo impact profile','accessibility',1,'public contact form only','Evidence-linked impact summary placeholder for Coimbatore.','draft','synthetic_demo'),
('PIP00022','ORG0022','Udaan Trust Bengaluru Demo 22 — demo impact profile','welfare',1,'public contact form only','Evidence-linked impact summary placeholder for Bengaluru.','published','synthetic_demo'),
('PIP00023','ORG0023','Seva Initiative Jaipur Demo 23 — demo impact profile','disaster_relief',1,'public contact form only','Evidence-linked impact summary placeholder for Jaipur.','under_review','synthetic_demo'),
('PIP00024','ORG0024','Community Network Bhopal Demo 24 — demo impact profile','community_support',0,'public contact form only','Evidence-linked impact summary placeholder for Bhopal.','draft','synthetic_demo'),
('PIP00025','ORG0025','Green Foundation Lucknow Demo 25 — demo impact profile','sanitation',1,'public contact form only','Evidence-linked impact summary placeholder for Lucknow.','published','synthetic_demo'),
('PIP00026','ORG0026','Sahyog Collective Kanpur Demo 26 — demo impact profile','environment',1,'public contact form only','Evidence-linked impact summary placeholder for Kanpur.','under_review','synthetic_demo'),
('PIP00027','ORG0027','Jan Trust Varanasi Demo 27 — demo impact profile','education',1,'public contact form only','Evidence-linked impact summary placeholder for Varanasi.','draft','synthetic_demo'),
('PIP00028','ORG0028','Udaan Initiative Pune Demo 28 — demo impact profile','health',0,'public contact form only','Evidence-linked impact summary placeholder for Pune.','published','synthetic_demo'),
('PIP00029','ORG0029','Seva Network Nagpur Demo 29 — demo impact profile','accessibility',1,'public contact form only','Evidence-linked impact summary placeholder for Nagpur.','under_review','synthetic_demo'),
('PIP00030','ORG0030','Community Foundation Patna Demo 30 — demo impact profile','welfare',1,'public contact form only','Evidence-linked impact summary placeholder for Patna.','draft','synthetic_demo');

INSERT INTO `compliance_documents` (compliance_document_id,organization_id,document_type,private_storage_path,document_status,submitted_at,expiry_date,demo_document_reference,data_source) VALUES
('COD00001','ORG0001','policy','private-demo/document-00001.pdf','approved','2025-01-07','2026-01-07','DEMO-DOC-00001','synthetic_demo'),
('COD00002','ORG0002','insurance','private-demo/document-00002.pdf','expiring','2025-01-13','2026-01-13','DEMO-DOC-00002','synthetic_demo'),
('COD00003','ORG0003','safety_plan','private-demo/document-00003.pdf','expired','2025-01-19','2026-01-19','DEMO-DOC-00003','synthetic_demo'),
('COD00004','ORG0004','training_certificate','private-demo/document-00004.pdf','rejected','2025-01-25','2026-01-25','DEMO-DOC-00004','synthetic_demo'),
('COD00005','ORG0005','registration_proof','private-demo/document-00005.pdf','pending','2025-01-31','2026-01-31','DEMO-DOC-00005','synthetic_demo'),
('COD00006','ORG0006','policy','private-demo/document-00006.pdf','approved','2025-02-06','2026-02-06','DEMO-DOC-00006','synthetic_demo'),
('COD00007','ORG0007','insurance','private-demo/document-00007.pdf','expiring','2025-02-12','2026-02-12','DEMO-DOC-00007','synthetic_demo'),
('COD00008','ORG0008','safety_plan','private-demo/document-00008.pdf','expired','2025-02-18','2026-02-18','DEMO-DOC-00008','synthetic_demo'),
('COD00009','ORG0009','training_certificate','private-demo/document-00009.pdf','rejected','2025-02-24','2026-02-24','DEMO-DOC-00009','synthetic_demo'),
('COD00010','ORG0010','registration_proof','private-demo/document-00010.pdf','pending','2025-03-02','2026-03-02','DEMO-DOC-00010','synthetic_demo'),
('COD00011','ORG0011','policy','private-demo/document-00011.pdf','approved','2025-03-08','2026-03-08','DEMO-DOC-00011','synthetic_demo'),
('COD00012','ORG0012','insurance','private-demo/document-00012.pdf','expiring','2025-03-14','2026-03-14','DEMO-DOC-00012','synthetic_demo'),
('COD00013','ORG0013','safety_plan','private-demo/document-00013.pdf','expired','2025-03-20','2026-03-20','DEMO-DOC-00013','synthetic_demo'),
('COD00014','ORG0014','training_certificate','private-demo/document-00014.pdf','rejected','2025-03-26','2026-03-26','DEMO-DOC-00014','synthetic_demo'),
('COD00015','ORG0015','registration_proof','private-demo/document-00015.pdf','pending','2025-04-01','2026-04-01','DEMO-DOC-00015','synthetic_demo'),
('COD00016','ORG0016','policy','private-demo/document-00016.pdf','approved','2025-04-07','2026-04-07','DEMO-DOC-00016','synthetic_demo'),
('COD00017','ORG0017','insurance','private-demo/document-00017.pdf','expiring','2025-04-13','2026-04-13','DEMO-DOC-00017','synthetic_demo'),
('COD00018','ORG0018','safety_plan','private-demo/document-00018.pdf','expired','2025-04-19','2026-04-19','DEMO-DOC-00018','synthetic_demo'),
('COD00019','ORG0019','training_certificate','private-demo/document-00019.pdf','rejected','2025-04-25','2026-04-25','DEMO-DOC-00019','synthetic_demo'),
('COD00020','ORG0020','registration_proof','private-demo/document-00020.pdf','pending','2025-05-01','2026-05-01','DEMO-DOC-00020','synthetic_demo'),
('COD00021','ORG0021','policy','private-demo/document-00021.pdf','approved','2025-05-07','2026-05-07','DEMO-DOC-00021','synthetic_demo'),
('COD00022','ORG0022','insurance','private-demo/document-00022.pdf','expiring','2025-05-13','2026-05-13','DEMO-DOC-00022','synthetic_demo'),
('COD00023','ORG0023','safety_plan','private-demo/document-00023.pdf','expired','2025-05-19','2026-05-19','DEMO-DOC-00023','synthetic_demo'),
('COD00024','ORG0024','training_certificate','private-demo/document-00024.pdf','rejected','2025-05-25','2026-05-25','DEMO-DOC-00024','synthetic_demo'),
('COD00025','ORG0025','registration_proof','private-demo/document-00025.pdf','pending','2025-05-31','2026-05-31','DEMO-DOC-00025','synthetic_demo'),
('COD00026','ORG0026','policy','private-demo/document-00026.pdf','approved','2025-06-06','2026-06-06','DEMO-DOC-00026','synthetic_demo'),
('COD00027','ORG0027','insurance','private-demo/document-00027.pdf','expiring','2025-06-12','2026-06-12','DEMO-DOC-00027','synthetic_demo'),
('COD00028','ORG0028','safety_plan','private-demo/document-00028.pdf','expired','2025-06-18','2026-06-18','DEMO-DOC-00028','synthetic_demo'),
('COD00029','ORG0029','training_certificate','private-demo/document-00029.pdf','rejected','2025-06-24','2026-06-24','DEMO-DOC-00029','synthetic_demo'),
('COD00030','ORG0030','registration_proof','private-demo/document-00030.pdf','pending','2025-06-30','2026-06-30','DEMO-DOC-00030','synthetic_demo');

INSERT INTO `organization_memberships` (membership_id,organization_id,member_ref,display_name,email,role,membership_status,joined_at,data_source) VALUES
('MBR00001','ORG0001','MEM0001','Aarav Singh','member-0001@example.org','owner','invited','2025-01-10','synthetic_demo'),
('MBR00002','ORG0002','MEM0002','Aditi Das','member-0002@example.org','ngo_administrator','revoked','2025-01-19','synthetic_demo'),
('MBR00003','ORG0003','MEM0003','Ananya Kumar','member-0003@example.org','campaign_manager','active','2025-01-28','synthetic_demo'),
('MBR00004','ORG0004','MEM0004','Arjun Gupta','member-0004@example.org','field_coordinator','invited','2025-02-06','synthetic_demo'),
('MBR00005','ORG0005','MEM0005','Diya Khan','member-0005@example.org','volunteer_coordinator','revoked','2025-02-15','synthetic_demo'),
('MBR00006','ORG0006','MEM0006','Ishaan Sharma','member-0006@example.org','evidence_submitter','active','2025-02-24','synthetic_demo'),
('MBR00007','ORG0007','MEM0007','Kavya Singh','member-0007@example.org','finance_compliance_officer','invited','2025-03-05','synthetic_demo'),
('MBR00008','ORG0008','MEM0008','Meera Das','member-0008@example.org','read_only_member','revoked','2025-03-14','synthetic_demo'),
('MBR00009','ORG0009','MEM0009','Neel Kumar','member-0009@example.org','owner','active','2025-03-23','synthetic_demo'),
('MBR00010','ORG0010','MEM0010','Priya Gupta','member-0010@example.org','ngo_administrator','invited','2025-04-01','synthetic_demo'),
('MBR00011','ORG0011','MEM0011','Rahul Khan','member-0011@example.org','campaign_manager','revoked','2025-04-10','synthetic_demo'),
('MBR00012','ORG0012','MEM0012','Riya Sharma','member-0012@example.org','field_coordinator','active','2025-04-19','synthetic_demo'),
('MBR00013','ORG0013','MEM0013','Sana Singh','member-0013@example.org','volunteer_coordinator','invited','2025-04-28','synthetic_demo'),
('MBR00014','ORG0014','MEM0014','Vikram Das','member-0014@example.org','evidence_submitter','revoked','2025-05-07','synthetic_demo'),
('MBR00015','ORG0015','MEM0015','Zoya Kumar','member-0015@example.org','finance_compliance_officer','active','2025-05-16','synthetic_demo'),
('MBR00016','ORG0016','MEM0016','Aarav Gupta','member-0016@example.org','read_only_member','invited','2025-05-25','synthetic_demo'),
('MBR00017','ORG0017','MEM0017','Aditi Khan','member-0017@example.org','owner','revoked','2025-06-03','synthetic_demo'),
('MBR00018','ORG0018','MEM0018','Ananya Sharma','member-0018@example.org','ngo_administrator','active','2025-06-12','synthetic_demo'),
('MBR00019','ORG0019','MEM0019','Arjun Singh','member-0019@example.org','campaign_manager','invited','2025-06-21','synthetic_demo'),
('MBR00020','ORG0020','MEM0020','Diya Das','member-0020@example.org','field_coordinator','revoked','2025-06-30','synthetic_demo'),
('MBR00021','ORG0021','MEM0021','Ishaan Kumar','member-0021@example.org','volunteer_coordinator','active','2025-07-09','synthetic_demo'),
('MBR00022','ORG0022','MEM0022','Kavya Gupta','member-0022@example.org','evidence_submitter','invited','2025-07-18','synthetic_demo'),
('MBR00023','ORG0023','MEM0023','Meera Khan','member-0023@example.org','finance_compliance_officer','revoked','2025-07-27','synthetic_demo'),
('MBR00024','ORG0024','MEM0024','Neel Sharma','member-0024@example.org','read_only_member','active','2025-08-05','synthetic_demo'),
('MBR00025','ORG0025','MEM0025','Priya Singh','member-0025@example.org','owner','invited','2025-08-14','synthetic_demo'),
('MBR00026','ORG0026','MEM0026','Rahul Das','member-0026@example.org','ngo_administrator','revoked','2025-08-23','synthetic_demo'),
('MBR00027','ORG0027','MEM0027','Riya Kumar','member-0027@example.org','campaign_manager','active','2025-09-01','synthetic_demo'),
('MBR00028','ORG0028','MEM0028','Sana Gupta','member-0028@example.org','field_coordinator','invited','2025-09-10','synthetic_demo'),
('MBR00029','ORG0029','MEM0029','Vikram Khan','member-0029@example.org','volunteer_coordinator','revoked','2025-09-19','synthetic_demo'),
('MBR00030','ORG0030','MEM0030','Zoya Sharma','member-0030@example.org','evidence_submitter','active','2025-09-28','synthetic_demo');

INSERT INTO `civic_issues` (issue_id,title,category,urgency,issue_status,city,state,locality,latitude,longitude,reported_at,description,citizen_ref,citizen_details_permitted,data_source) VALUES
('ISS00001','Demo waste management concern #001','waste_management','medium','community_validated','Pune','Maharashtra','Ward 02',26.513,80.117,'2025-01-03','Synthetic issue description 001; verify before action.','CIT00001',0,'synthetic_demo'),
('ISS00002','Demo road safety concern #002','road_safety','high','under_review','Gaya','Bihar','Ward 03',26.526,80.134,'2025-01-05','Synthetic issue description 002; verify before action.','CIT00002',0,'synthetic_demo'),
('ISS00003','Demo water supply concern #003','water_supply','critical','assigned','Bengaluru','Karnataka','Ward 04',26.539,80.151,'2025-01-07','Synthetic issue description 003; verify before action.','CIT00003',0,'synthetic_demo'),
('ISS00004','Demo drainage concern #004','drainage','low','in_progress','Lucknow','Uttar Pradesh','Ward 05',26.552,80.168,'2025-01-09','Synthetic issue description 004; verify before action.','CIT00004',0,'synthetic_demo'),
('ISS00005','Demo street lighting concern #005','street_lighting','medium','awaiting_government','Pune','Maharashtra','Ward 06',26.565,80.185,'2025-01-11','Synthetic issue description 005; verify before action.','CIT00005',0,'synthetic_demo'),
('ISS00006','Demo public health concern #006','public_health','high','resolved','Gaya','Bihar','Ward 07',26.578,80.202,'2025-01-13','Synthetic issue description 006; verify before action.','CIT00006',0,'synthetic_demo'),
('ISS00007','Demo accessibility concern #007','accessibility','critical','reopened','Bengaluru','Karnataka','Ward 08',26.591,80.219,'2025-01-15','Synthetic issue description 007; verify before action.','CIT00007',0,'synthetic_demo'),
('ISS00008','Demo green space concern #008','green_space','low','reported','Lucknow','Uttar Pradesh','Ward 09',26.604,80.236,'2025-01-17','Synthetic issue description 008; verify before action.','CIT00008',0,'synthetic_demo'),
('ISS00009','Demo education access concern #009','education_access','medium','community_validated','Pune','Maharashtra','Ward 10',26.617,80.253,'2025-01-19','Synthetic issue description 009; verify before action.','CIT00009',0,'synthetic_demo'),
('ISS00010','Demo animal welfare concern #010','animal_welfare','high','under_review','Gaya','Bihar','Ward 01',26.63,80.27,'2025-01-21','Synthetic issue description 010; verify before action.','CIT00010',0,'synthetic_demo'),
('ISS00011','Demo waste management concern #011','waste_management','critical','assigned','Bengaluru','Karnataka','Ward 02',26.643,80.287,'2025-01-23','Synthetic issue description 011; verify before action.','CIT00011',0,'synthetic_demo'),
('ISS00012','Demo road safety concern #012','road_safety','low','in_progress','Lucknow','Uttar Pradesh','Ward 03',26.656,80.304,'2025-01-25','Synthetic issue description 012; verify before action.','CIT00012',0,'synthetic_demo'),
('ISS00013','Demo water supply concern #013','water_supply','medium','awaiting_government','Pune','Maharashtra','Ward 04',26.669,80.321,'2025-01-27','Synthetic issue description 013; verify before action.','CIT00013',0,'synthetic_demo'),
('ISS00014','Demo drainage concern #014','drainage','high','resolved','Gaya','Bihar','Ward 05',26.682,80.338,'2025-01-29','Synthetic issue description 014; verify before action.','CIT00014',0,'synthetic_demo'),
('ISS00015','Demo street lighting concern #015','street_lighting','critical','reopened','Bengaluru','Karnataka','Ward 06',26.695,80.355,'2025-01-31','Synthetic issue description 015; verify before action.','CIT00015',0,'synthetic_demo'),
('ISS00016','Demo public health concern #016','public_health','low','reported','Lucknow','Uttar Pradesh','Ward 07',26.708,80.372,'2025-02-02','Synthetic issue description 016; verify before action.','CIT00016',0,'synthetic_demo'),
('ISS00017','Demo accessibility concern #017','accessibility','medium','community_validated','Pune','Maharashtra','Ward 08',26.721,80.389,'2025-02-04','Synthetic issue description 017; verify before action.','CIT00017',0,'synthetic_demo'),
('ISS00018','Demo green space concern #018','green_space','high','under_review','Gaya','Bihar','Ward 09',26.734,80.406,'2025-02-06','Synthetic issue description 018; verify before action.','CIT00018',0,'synthetic_demo'),
('ISS00019','Demo education access concern #019','education_access','critical','assigned','Bengaluru','Karnataka','Ward 10',26.747,80.423,'2025-02-08','Synthetic issue description 019; verify before action.','CIT00019',0,'synthetic_demo'),
('ISS00020','Demo animal welfare concern #020','animal_welfare','low','in_progress','Lucknow','Uttar Pradesh','Ward 01',26.76,80.44,'2025-02-10','Synthetic issue description 020; verify before action.','CIT00020',0,'synthetic_demo'),
('ISS00021','Demo waste management concern #021','waste_management','medium','awaiting_government','Pune','Maharashtra','Ward 02',26.773,80.457,'2025-02-12','Synthetic issue description 021; verify before action.','CIT00021',0,'synthetic_demo'),
('ISS00022','Demo road safety concern #022','road_safety','high','resolved','Gaya','Bihar','Ward 03',26.786,80.474,'2025-02-14','Synthetic issue description 022; verify before action.','CIT00022',0,'synthetic_demo'),
('ISS00023','Demo water supply concern #023','water_supply','critical','reopened','Bengaluru','Karnataka','Ward 04',26.799,80.491,'2025-02-16','Synthetic issue description 023; verify before action.','CIT00023',0,'synthetic_demo'),
('ISS00024','Demo drainage concern #024','drainage','low','reported','Lucknow','Uttar Pradesh','Ward 05',26.812,80.508,'2025-02-18','Synthetic issue description 024; verify before action.','CIT00024',0,'synthetic_demo'),
('ISS00025','Demo street lighting concern #025','street_lighting','medium','community_validated','Pune','Maharashtra','Ward 06',26.825,80.525,'2025-02-20','Synthetic issue description 025; verify before action.','CIT00025',0,'synthetic_demo'),
('ISS00026','Demo public health concern #026','public_health','high','under_review','Gaya','Bihar','Ward 07',26.838,80.542,'2025-02-22','Synthetic issue description 026; verify before action.','CIT00026',0,'synthetic_demo'),
('ISS00027','Demo accessibility concern #027','accessibility','critical','assigned','Bengaluru','Karnataka','Ward 08',26.851,80.559,'2025-02-24','Synthetic issue description 027; verify before action.','CIT00027',0,'synthetic_demo'),
('ISS00028','Demo green space concern #028','green_space','low','in_progress','Lucknow','Uttar Pradesh','Ward 09',26.864,80.576,'2025-02-26','Synthetic issue description 028; verify before action.','CIT00028',0,'synthetic_demo'),
('ISS00029','Demo education access concern #029','education_access','medium','awaiting_government','Pune','Maharashtra','Ward 10',26.877,80.593,'2025-02-28','Synthetic issue description 029; verify before action.','CIT00029',0,'synthetic_demo'),
('ISS00030','Demo animal welfare concern #030','animal_welfare','high','resolved','Gaya','Bihar','Ward 01',26.89,80.61,'2025-03-02','Synthetic issue description 030; verify before action.','CIT00030',0,'synthetic_demo'),
('ISS00031','Demo waste management concern #031','waste_management','critical','reopened','Bengaluru','Karnataka','Ward 02',26.903,80.627,'2025-03-04','Synthetic issue description 031; verify before action.','CIT00031',0,'synthetic_demo'),
('ISS00032','Demo road safety concern #032','road_safety','low','reported','Lucknow','Uttar Pradesh','Ward 03',26.916,80.644,'2025-03-06','Synthetic issue description 032; verify before action.','CIT00032',0,'synthetic_demo'),
('ISS00033','Demo water supply concern #033','water_supply','medium','community_validated','Pune','Maharashtra','Ward 04',26.929,80.661,'2025-03-08','Synthetic issue description 033; verify before action.','CIT00033',0,'synthetic_demo'),
('ISS00034','Demo drainage concern #034','drainage','high','under_review','Gaya','Bihar','Ward 05',26.942,80.678,'2025-03-10','Synthetic issue description 034; verify before action.','CIT00034',0,'synthetic_demo'),
('ISS00035','Demo street lighting concern #035','street_lighting','critical','assigned','Bengaluru','Karnataka','Ward 06',26.955,80.1,'2025-03-12','Synthetic issue description 035; verify before action.','CIT00035',0,'synthetic_demo'),
('ISS00036','Demo public health concern #036','public_health','low','in_progress','Lucknow','Uttar Pradesh','Ward 07',26.968,80.117,'2025-03-14','Synthetic issue description 036; verify before action.','CIT00036',0,'synthetic_demo'),
('ISS00037','Demo accessibility concern #037','accessibility','medium','awaiting_government','Pune','Maharashtra','Ward 08',26.981,80.134,'2025-03-16','Synthetic issue description 037; verify before action.','CIT00037',0,'synthetic_demo'),
('ISS00038','Demo green space concern #038','green_space','high','resolved','Gaya','Bihar','Ward 09',26.994,80.151,'2025-03-18','Synthetic issue description 038; verify before action.','CIT00038',0,'synthetic_demo'),
('ISS00039','Demo education access concern #039','education_access','critical','reopened','Bengaluru','Karnataka','Ward 10',27.007,80.168,'2025-03-20','Synthetic issue description 039; verify before action.','CIT00039',0,'synthetic_demo'),
('ISS00040','Demo animal welfare concern #040','animal_welfare','low','reported','Lucknow','Uttar Pradesh','Ward 01',26.5,80.185,'2025-03-22','Synthetic issue description 040; verify before action.','CIT00040',0,'synthetic_demo'),
('ISS00041','Demo waste management concern #041','waste_management','medium','community_validated','Pune','Maharashtra','Ward 02',26.513,80.202,'2025-03-24','Synthetic issue description 041; verify before action.','CIT00041',0,'synthetic_demo'),
('ISS00042','Demo road safety concern #042','road_safety','high','under_review','Gaya','Bihar','Ward 03',26.526,80.219,'2025-03-26','Synthetic issue description 042; verify before action.','CIT00042',0,'synthetic_demo'),
('ISS00043','Demo water supply concern #043','water_supply','critical','assigned','Bengaluru','Karnataka','Ward 04',26.539,80.236,'2025-03-28','Synthetic issue description 043; verify before action.','CIT00043',0,'synthetic_demo'),
('ISS00044','Demo drainage concern #044','drainage','low','in_progress','Lucknow','Uttar Pradesh','Ward 05',26.552,80.253,'2025-03-30','Synthetic issue description 044; verify before action.','CIT00044',0,'synthetic_demo'),
('ISS00045','Demo street lighting concern #045','street_lighting','medium','awaiting_government','Pune','Maharashtra','Ward 06',26.565,80.27,'2025-04-01','Synthetic issue description 045; verify before action.','CIT00045',0,'synthetic_demo'),
('ISS00046','Demo public health concern #046','public_health','high','resolved','Gaya','Bihar','Ward 07',26.578,80.287,'2025-04-03','Synthetic issue description 046; verify before action.','CIT00046',0,'synthetic_demo'),
('ISS00047','Demo accessibility concern #047','accessibility','critical','reopened','Bengaluru','Karnataka','Ward 08',26.591,80.304,'2025-04-05','Synthetic issue description 047; verify before action.','CIT00047',0,'synthetic_demo'),
('ISS00048','Demo green space concern #048','green_space','low','reported','Lucknow','Uttar Pradesh','Ward 09',26.604,80.321,'2025-04-07','Synthetic issue description 048; verify before action.','CIT00048',0,'synthetic_demo'),
('ISS00049','Demo education access concern #049','education_access','medium','community_validated','Pune','Maharashtra','Ward 10',26.617,80.338,'2025-04-09','Synthetic issue description 049; verify before action.','CIT00049',0,'synthetic_demo'),
('ISS00050','Demo animal welfare concern #050','animal_welfare','high','under_review','Gaya','Bihar','Ward 01',26.63,80.355,'2025-04-11','Synthetic issue description 050; verify before action.','CIT00050',0,'synthetic_demo'),
('ISS00051','Demo waste management concern #051','waste_management','critical','assigned','Bengaluru','Karnataka','Ward 02',26.643,80.372,'2025-04-13','Synthetic issue description 051; verify before action.','CIT00051',0,'synthetic_demo'),
('ISS00052','Demo road safety concern #052','road_safety','low','in_progress','Lucknow','Uttar Pradesh','Ward 03',26.656,80.389,'2025-04-15','Synthetic issue description 052; verify before action.','CIT00052',0,'synthetic_demo'),
('ISS00053','Demo water supply concern #053','water_supply','medium','awaiting_government','Pune','Maharashtra','Ward 04',26.669,80.406,'2025-04-17','Synthetic issue description 053; verify before action.','CIT00053',0,'synthetic_demo'),
('ISS00054','Demo drainage concern #054','drainage','high','resolved','Gaya','Bihar','Ward 05',26.682,80.423,'2025-04-19','Synthetic issue description 054; verify before action.','CIT00054',0,'synthetic_demo'),
('ISS00055','Demo street lighting concern #055','street_lighting','critical','reopened','Bengaluru','Karnataka','Ward 06',26.695,80.44,'2025-04-21','Synthetic issue description 055; verify before action.','CIT00055',0,'synthetic_demo'),
('ISS00056','Demo public health concern #056','public_health','low','reported','Lucknow','Uttar Pradesh','Ward 07',26.708,80.457,'2025-04-23','Synthetic issue description 056; verify before action.','CIT00056',0,'synthetic_demo'),
('ISS00057','Demo accessibility concern #057','accessibility','medium','community_validated','Pune','Maharashtra','Ward 08',26.721,80.474,'2025-04-25','Synthetic issue description 057; verify before action.','CIT00057',0,'synthetic_demo'),
('ISS00058','Demo green space concern #058','green_space','high','under_review','Gaya','Bihar','Ward 09',26.734,80.491,'2025-04-27','Synthetic issue description 058; verify before action.','CIT00058',0,'synthetic_demo'),
('ISS00059','Demo education access concern #059','education_access','critical','assigned','Bengaluru','Karnataka','Ward 10',26.747,80.508,'2025-04-29','Synthetic issue description 059; verify before action.','CIT00059',0,'synthetic_demo'),
('ISS00060','Demo animal welfare concern #060','animal_welfare','low','in_progress','Lucknow','Uttar Pradesh','Ward 01',26.76,80.525,'2025-05-01','Synthetic issue description 060; verify before action.','CIT00060',0,'synthetic_demo'),
('ISS00061','Demo waste management concern #061','waste_management','medium','awaiting_government','Pune','Maharashtra','Ward 02',26.773,80.542,'2025-05-03','Synthetic issue description 061; verify before action.','CIT00061',0,'synthetic_demo'),
('ISS00062','Demo road safety concern #062','road_safety','high','resolved','Gaya','Bihar','Ward 03',26.786,80.559,'2025-05-05','Synthetic issue description 062; verify before action.','CIT00062',0,'synthetic_demo'),
('ISS00063','Demo water supply concern #063','water_supply','critical','reopened','Bengaluru','Karnataka','Ward 04',26.799,80.576,'2025-05-07','Synthetic issue description 063; verify before action.','CIT00063',0,'synthetic_demo'),
('ISS00064','Demo drainage concern #064','drainage','low','reported','Lucknow','Uttar Pradesh','Ward 05',26.812,80.593,'2025-05-09','Synthetic issue description 064; verify before action.','CIT00064',0,'synthetic_demo'),
('ISS00065','Demo street lighting concern #065','street_lighting','medium','community_validated','Pune','Maharashtra','Ward 06',26.825,80.61,'2025-05-11','Synthetic issue description 065; verify before action.','CIT00065',0,'synthetic_demo'),
('ISS00066','Demo public health concern #066','public_health','high','under_review','Gaya','Bihar','Ward 07',26.838,80.627,'2025-05-13','Synthetic issue description 066; verify before action.','CIT00066',0,'synthetic_demo'),
('ISS00067','Demo accessibility concern #067','accessibility','critical','assigned','Bengaluru','Karnataka','Ward 08',26.851,80.644,'2025-05-15','Synthetic issue description 067; verify before action.','CIT00067',0,'synthetic_demo'),
('ISS00068','Demo green space concern #068','green_space','low','in_progress','Lucknow','Uttar Pradesh','Ward 09',26.864,80.661,'2025-05-17','Synthetic issue description 068; verify before action.','CIT00068',0,'synthetic_demo'),
('ISS00069','Demo education access concern #069','education_access','medium','awaiting_government','Pune','Maharashtra','Ward 10',26.877,80.678,'2025-05-19','Synthetic issue description 069; verify before action.','CIT00069',0,'synthetic_demo'),
('ISS00070','Demo animal welfare concern #070','animal_welfare','high','resolved','Gaya','Bihar','Ward 01',26.89,80.1,'2025-05-21','Synthetic issue description 070; verify before action.','CIT00070',0,'synthetic_demo'),
('ISS00071','Demo waste management concern #071','waste_management','critical','reopened','Bengaluru','Karnataka','Ward 02',26.903,80.117,'2025-05-23','Synthetic issue description 071; verify before action.','CIT00071',0,'synthetic_demo'),
('ISS00072','Demo road safety concern #072','road_safety','low','reported','Lucknow','Uttar Pradesh','Ward 03',26.916,80.134,'2025-05-25','Synthetic issue description 072; verify before action.','CIT00072',0,'synthetic_demo'),
('ISS00073','Demo water supply concern #073','water_supply','medium','community_validated','Pune','Maharashtra','Ward 04',26.929,80.151,'2025-05-27','Synthetic issue description 073; verify before action.','CIT00073',0,'synthetic_demo'),
('ISS00074','Demo drainage concern #074','drainage','high','under_review','Gaya','Bihar','Ward 05',26.942,80.168,'2025-05-29','Synthetic issue description 074; verify before action.','CIT00074',0,'synthetic_demo'),
('ISS00075','Demo street lighting concern #075','street_lighting','critical','assigned','Bengaluru','Karnataka','Ward 06',26.955,80.185,'2025-05-31','Synthetic issue description 075; verify before action.','CIT00075',0,'synthetic_demo'),
('ISS00076','Demo public health concern #076','public_health','low','in_progress','Lucknow','Uttar Pradesh','Ward 07',26.968,80.202,'2025-06-02','Synthetic issue description 076; verify before action.','CIT00076',0,'synthetic_demo'),
('ISS00077','Demo accessibility concern #077','accessibility','medium','awaiting_government','Pune','Maharashtra','Ward 08',26.981,80.219,'2025-06-04','Synthetic issue description 077; verify before action.','CIT00077',0,'synthetic_demo'),
('ISS00078','Demo green space concern #078','green_space','high','resolved','Gaya','Bihar','Ward 09',26.994,80.236,'2025-06-06','Synthetic issue description 078; verify before action.','CIT00078',0,'synthetic_demo'),
('ISS00079','Demo education access concern #079','education_access','critical','reopened','Bengaluru','Karnataka','Ward 10',27.007,80.253,'2025-06-08','Synthetic issue description 079; verify before action.','CIT00079',0,'synthetic_demo'),
('ISS00080','Demo animal welfare concern #080','animal_welfare','low','reported','Lucknow','Uttar Pradesh','Ward 01',26.5,80.27,'2025-06-10','Synthetic issue description 080; verify before action.','CIT00080',0,'synthetic_demo'),
('ISS00081','Demo waste management concern #081','waste_management','medium','community_validated','Pune','Maharashtra','Ward 02',26.513,80.287,'2025-06-12','Synthetic issue description 081; verify before action.','CIT00081',0,'synthetic_demo'),
('ISS00082','Demo road safety concern #082','road_safety','high','under_review','Gaya','Bihar','Ward 03',26.526,80.304,'2025-06-14','Synthetic issue description 082; verify before action.','CIT00082',0,'synthetic_demo'),
('ISS00083','Demo water supply concern #083','water_supply','critical','assigned','Bengaluru','Karnataka','Ward 04',26.539,80.321,'2025-06-16','Synthetic issue description 083; verify before action.','CIT00083',0,'synthetic_demo'),
('ISS00084','Demo drainage concern #084','drainage','low','in_progress','Lucknow','Uttar Pradesh','Ward 05',26.552,80.338,'2025-06-18','Synthetic issue description 084; verify before action.','CIT00084',0,'synthetic_demo'),
('ISS00085','Demo street lighting concern #085','street_lighting','medium','awaiting_government','Pune','Maharashtra','Ward 06',26.565,80.355,'2025-06-20','Synthetic issue description 085; verify before action.','CIT00085',0,'synthetic_demo'),
('ISS00086','Demo public health concern #086','public_health','high','resolved','Gaya','Bihar','Ward 07',26.578,80.372,'2025-06-22','Synthetic issue description 086; verify before action.','CIT00086',0,'synthetic_demo'),
('ISS00087','Demo accessibility concern #087','accessibility','critical','reopened','Bengaluru','Karnataka','Ward 08',26.591,80.389,'2025-06-24','Synthetic issue description 087; verify before action.','CIT00087',0,'synthetic_demo'),
('ISS00088','Demo green space concern #088','green_space','low','reported','Lucknow','Uttar Pradesh','Ward 09',26.604,80.406,'2025-06-26','Synthetic issue description 088; verify before action.','CIT00088',0,'synthetic_demo'),
('ISS00089','Demo education access concern #089','education_access','medium','community_validated','Pune','Maharashtra','Ward 10',26.617,80.423,'2025-06-28','Synthetic issue description 089; verify before action.','CIT00089',0,'synthetic_demo'),
('ISS00090','Demo animal welfare concern #090','animal_welfare','high','under_review','Gaya','Bihar','Ward 01',26.63,80.44,'2025-06-30','Synthetic issue description 090; verify before action.','CIT00090',0,'synthetic_demo'),
('ISS00091','Demo waste management concern #091','waste_management','critical','assigned','Bengaluru','Karnataka','Ward 02',26.643,80.457,'2025-07-02','Synthetic issue description 091; verify before action.','CIT00091',0,'synthetic_demo'),
('ISS00092','Demo road safety concern #092','road_safety','low','in_progress','Lucknow','Uttar Pradesh','Ward 03',26.656,80.474,'2025-07-04','Synthetic issue description 092; verify before action.','CIT00092',0,'synthetic_demo'),
('ISS00093','Demo water supply concern #093','water_supply','medium','awaiting_government','Pune','Maharashtra','Ward 04',26.669,80.491,'2025-07-06','Synthetic issue description 093; verify before action.','CIT00093',0,'synthetic_demo'),
('ISS00094','Demo drainage concern #094','drainage','high','resolved','Gaya','Bihar','Ward 05',26.682,80.508,'2025-07-08','Synthetic issue description 094; verify before action.','CIT00094',0,'synthetic_demo'),
('ISS00095','Demo street lighting concern #095','street_lighting','critical','reopened','Bengaluru','Karnataka','Ward 06',26.695,80.525,'2025-07-10','Synthetic issue description 095; verify before action.','CIT00095',0,'synthetic_demo'),
('ISS00096','Demo public health concern #096','public_health','low','reported','Lucknow','Uttar Pradesh','Ward 07',26.708,80.542,'2025-07-12','Synthetic issue description 096; verify before action.','CIT00096',0,'synthetic_demo'),
('ISS00097','Demo accessibility concern #097','accessibility','medium','community_validated','Pune','Maharashtra','Ward 08',26.721,80.559,'2025-07-14','Synthetic issue description 097; verify before action.','CIT00097',0,'synthetic_demo'),
('ISS00098','Demo green space concern #098','green_space','high','under_review','Gaya','Bihar','Ward 09',26.734,80.576,'2025-07-16','Synthetic issue description 098; verify before action.','CIT00098',0,'synthetic_demo'),
('ISS00099','Demo education access concern #099','education_access','critical','assigned','Bengaluru','Karnataka','Ward 10',26.747,80.593,'2025-07-18','Synthetic issue description 099; verify before action.','CIT00099',0,'synthetic_demo'),
('ISS00100','Demo animal welfare concern #100','animal_welfare','low','in_progress','Lucknow','Uttar Pradesh','Ward 01',26.76,80.61,'2025-07-20','Synthetic issue description 100; verify before action.','CIT00100',0,'synthetic_demo');

INSERT INTO `campaigns` (campaign_id,organization_id,title,campaign_type,objectives,city,state,locality,start_date,end_date,volunteer_capacity,campaign_status,volunteer_registration_status,requires_review,safety_instructions,data_source) VALUES
('CAM00001','ORG0001','Awareness Campaign 001','awareness','Improve drainage outcomes through a documented intervention.','Lucknow','Uttar Pradesh','Ward 02','2025-02-04','2025-02-09',8,'pending_review','closed',0,'Demo safety instructions for campaign 001.','synthetic_demo'),
('CAM00002','ORG0002','Assessment Campaign 002','assessment','Improve accessibility outcomes through a documented intervention.','Kanpur','Uttar Pradesh','Ward 03','2025-02-08','2025-02-13',11,'active','open',0,'Demo safety instructions for campaign 002.','synthetic_demo'),
('CAM00003','ORG0003','Training Campaign 003','training','Improve animal welfare outcomes through a documented intervention.','Varanasi','Uttar Pradesh','Ward 04','2025-02-12','2025-02-17',14,'paused','closed',0,'Demo safety instructions for campaign 003.','synthetic_demo'),
('CAM00004','ORG0004','Community Support Campaign 004','community_support','Improve water supply outcomes through a documented intervention.','Pune','Maharashtra','Ward 05','2025-02-16','2025-02-21',17,'completed','open',1,'Demo safety instructions for campaign 004.','synthetic_demo'),
('CAM00005','ORG0005','Tree Planting Campaign 005','tree_planting','Improve public health outcomes through a documented intervention.','Nagpur','Maharashtra','Ward 06','2025-02-20','2025-02-25',20,'cancelled','closed',0,'Demo safety instructions for campaign 005.','synthetic_demo'),
('CAM00006','ORG0006','Accessibility Audit Campaign 006','accessibility_audit','Improve education access outcomes through a documented intervention.','Patna','Bihar','Ward 07','2025-02-24','2025-03-01',23,'draft','open',0,'Demo safety instructions for campaign 006.','synthetic_demo'),
('CAM00007','ORG0007','Cleanup Campaign 007','cleanup','Improve road safety outcomes through a documented intervention.','Gaya','Bihar','Ward 08','2025-02-28','2025-03-05',26,'pending_review','closed',0,'Demo safety instructions for campaign 007.','synthetic_demo'),
('CAM00008','ORG0008','Awareness Campaign 008','awareness','Improve street lighting outcomes through a documented intervention.','Chennai','Tamil Nadu','Ward 09','2025-03-04','2025-03-09',29,'active','open',1,'Demo safety instructions for campaign 008.','synthetic_demo'),
('CAM00009','ORG0009','Assessment Campaign 009','assessment','Improve green space outcomes through a documented intervention.','Coimbatore','Tamil Nadu','Ward 10','2025-03-08','2025-03-13',32,'paused','closed',0,'Demo safety instructions for campaign 009.','synthetic_demo'),
('CAM00010','ORG0010','Training Campaign 010','training','Improve waste management outcomes through a documented intervention.','Bengaluru','Karnataka','Ward 01','2025-03-12','2025-03-17',35,'completed','open',0,'Demo safety instructions for campaign 010.','synthetic_demo'),
('CAM00011','ORG0011','Community Support Campaign 011','community_support','Improve drainage outcomes through a documented intervention.','Jaipur','Rajasthan','Ward 02','2025-03-16','2025-03-21',38,'cancelled','closed',0,'Demo safety instructions for campaign 011.','synthetic_demo'),
('CAM00012','ORG0012','Tree Planting Campaign 012','tree_planting','Improve accessibility outcomes through a documented intervention.','Bhopal','Madhya Pradesh','Ward 03','2025-03-20','2025-03-25',41,'draft','open',1,'Demo safety instructions for campaign 012.','synthetic_demo'),
('CAM00013','ORG0013','Accessibility Audit Campaign 013','accessibility_audit','Improve animal welfare outcomes through a documented intervention.','Lucknow','Uttar Pradesh','Ward 04','2025-03-24','2025-03-29',44,'pending_review','closed',0,'Demo safety instructions for campaign 013.','synthetic_demo'),
('CAM00014','ORG0014','Cleanup Campaign 014','cleanup','Improve water supply outcomes through a documented intervention.','Kanpur','Uttar Pradesh','Ward 05','2025-03-28','2025-04-02',47,'active','open',0,'Demo safety instructions for campaign 014.','synthetic_demo'),
('CAM00015','ORG0015','Awareness Campaign 015','awareness','Improve public health outcomes through a documented intervention.','Varanasi','Uttar Pradesh','Ward 06','2025-04-01','2025-04-06',5,'paused','closed',0,'Demo safety instructions for campaign 015.','synthetic_demo'),
('CAM00016','ORG0016','Assessment Campaign 016','assessment','Improve education access outcomes through a documented intervention.','Pune','Maharashtra','Ward 07','2025-04-05','2025-04-10',8,'completed','open',1,'Demo safety instructions for campaign 016.','synthetic_demo'),
('CAM00017','ORG0017','Training Campaign 017','training','Improve road safety outcomes through a documented intervention.','Nagpur','Maharashtra','Ward 08','2025-04-09','2025-04-14',11,'cancelled','closed',0,'Demo safety instructions for campaign 017.','synthetic_demo'),
('CAM00018','ORG0018','Community Support Campaign 018','community_support','Improve street lighting outcomes through a documented intervention.','Patna','Bihar','Ward 09','2025-04-13','2025-04-18',14,'draft','open',0,'Demo safety instructions for campaign 018.','synthetic_demo'),
('CAM00019','ORG0019','Tree Planting Campaign 019','tree_planting','Improve green space outcomes through a documented intervention.','Gaya','Bihar','Ward 10','2025-04-17','2025-04-22',17,'pending_review','closed',0,'Demo safety instructions for campaign 019.','synthetic_demo'),
('CAM00020','ORG0020','Accessibility Audit Campaign 020','accessibility_audit','Improve waste management outcomes through a documented intervention.','Chennai','Tamil Nadu','Ward 01','2025-04-21','2025-04-26',20,'active','open',1,'Demo safety instructions for campaign 020.','synthetic_demo'),
('CAM00021','ORG0021','Cleanup Campaign 021','cleanup','Improve drainage outcomes through a documented intervention.','Coimbatore','Tamil Nadu','Ward 02','2025-04-25','2025-04-30',23,'paused','closed',0,'Demo safety instructions for campaign 021.','synthetic_demo'),
('CAM00022','ORG0022','Awareness Campaign 022','awareness','Improve accessibility outcomes through a documented intervention.','Bengaluru','Karnataka','Ward 03','2025-04-29','2025-05-04',26,'completed','open',0,'Demo safety instructions for campaign 022.','synthetic_demo'),
('CAM00023','ORG0023','Assessment Campaign 023','assessment','Improve animal welfare outcomes through a documented intervention.','Jaipur','Rajasthan','Ward 04','2025-05-03','2025-05-08',29,'cancelled','closed',0,'Demo safety instructions for campaign 023.','synthetic_demo'),
('CAM00024','ORG0024','Training Campaign 024','training','Improve water supply outcomes through a documented intervention.','Bhopal','Madhya Pradesh','Ward 05','2025-05-07','2025-05-12',32,'draft','open',1,'Demo safety instructions for campaign 024.','synthetic_demo'),
('CAM00025','ORG0025','Community Support Campaign 025','community_support','Improve public health outcomes through a documented intervention.','Lucknow','Uttar Pradesh','Ward 06','2025-05-11','2025-05-16',35,'pending_review','closed',0,'Demo safety instructions for campaign 025.','synthetic_demo'),
('CAM00026','ORG0026','Tree Planting Campaign 026','tree_planting','Improve education access outcomes through a documented intervention.','Kanpur','Uttar Pradesh','Ward 07','2025-05-15','2025-05-20',38,'active','open',0,'Demo safety instructions for campaign 026.','synthetic_demo'),
('CAM00027','ORG0027','Accessibility Audit Campaign 027','accessibility_audit','Improve road safety outcomes through a documented intervention.','Varanasi','Uttar Pradesh','Ward 08','2025-05-19','2025-05-24',41,'paused','closed',0,'Demo safety instructions for campaign 027.','synthetic_demo'),
('CAM00028','ORG0028','Cleanup Campaign 028','cleanup','Improve street lighting outcomes through a documented intervention.','Pune','Maharashtra','Ward 09','2025-05-23','2025-05-28',44,'completed','open',1,'Demo safety instructions for campaign 028.','synthetic_demo'),
('CAM00029','ORG0029','Awareness Campaign 029','awareness','Improve green space outcomes through a documented intervention.','Nagpur','Maharashtra','Ward 10','2025-05-27','2025-06-01',47,'cancelled','closed',0,'Demo safety instructions for campaign 029.','synthetic_demo'),
('CAM00030','ORG0030','Assessment Campaign 030','assessment','Improve waste management outcomes through a documented intervention.','Patna','Bihar','Ward 01','2025-05-31','2025-06-05',5,'draft','open',0,'Demo safety instructions for campaign 030.','synthetic_demo'),
('CAM00031','ORG0001','Training Campaign 031','training','Improve drainage outcomes through a documented intervention.','Lucknow','Uttar Pradesh','Ward 02','2025-06-04','2025-06-09',8,'pending_review','closed',0,'Demo safety instructions for campaign 031.','synthetic_demo'),
('CAM00032','ORG0002','Community Support Campaign 032','community_support','Improve accessibility outcomes through a documented intervention.','Kanpur','Uttar Pradesh','Ward 03','2025-06-08','2025-06-13',11,'active','open',1,'Demo safety instructions for campaign 032.','synthetic_demo'),
('CAM00033','ORG0003','Tree Planting Campaign 033','tree_planting','Improve animal welfare outcomes through a documented intervention.','Varanasi','Uttar Pradesh','Ward 04','2025-06-12','2025-06-17',14,'paused','closed',0,'Demo safety instructions for campaign 033.','synthetic_demo'),
('CAM00034','ORG0004','Accessibility Audit Campaign 034','accessibility_audit','Improve water supply outcomes through a documented intervention.','Pune','Maharashtra','Ward 05','2025-06-16','2025-06-21',17,'completed','open',0,'Demo safety instructions for campaign 034.','synthetic_demo'),
('CAM00035','ORG0005','Cleanup Campaign 035','cleanup','Improve public health outcomes through a documented intervention.','Nagpur','Maharashtra','Ward 06','2025-06-20','2025-06-25',20,'cancelled','closed',0,'Demo safety instructions for campaign 035.','synthetic_demo'),
('CAM00036','ORG0006','Awareness Campaign 036','awareness','Improve education access outcomes through a documented intervention.','Patna','Bihar','Ward 07','2025-06-24','2025-06-29',23,'draft','open',1,'Demo safety instructions for campaign 036.','synthetic_demo'),
('CAM00037','ORG0007','Assessment Campaign 037','assessment','Improve road safety outcomes through a documented intervention.','Gaya','Bihar','Ward 08','2025-06-28','2025-07-03',26,'pending_review','closed',0,'Demo safety instructions for campaign 037.','synthetic_demo'),
('CAM00038','ORG0008','Training Campaign 038','training','Improve street lighting outcomes through a documented intervention.','Chennai','Tamil Nadu','Ward 09','2025-07-02','2025-07-07',29,'active','open',0,'Demo safety instructions for campaign 038.','synthetic_demo'),
('CAM00039','ORG0009','Community Support Campaign 039','community_support','Improve green space outcomes through a documented intervention.','Coimbatore','Tamil Nadu','Ward 10','2025-07-06','2025-07-11',32,'paused','closed',0,'Demo safety instructions for campaign 039.','synthetic_demo'),
('CAM00040','ORG0010','Tree Planting Campaign 040','tree_planting','Improve waste management outcomes through a documented intervention.','Bengaluru','Karnataka','Ward 01','2025-07-10','2025-07-15',35,'completed','open',1,'Demo safety instructions for campaign 040.','synthetic_demo'),
('CAM00041','ORG0011','Accessibility Audit Campaign 041','accessibility_audit','Improve drainage outcomes through a documented intervention.','Jaipur','Rajasthan','Ward 02','2025-07-14','2025-07-19',38,'cancelled','closed',0,'Demo safety instructions for campaign 041.','synthetic_demo'),
('CAM00042','ORG0012','Cleanup Campaign 042','cleanup','Improve accessibility outcomes through a documented intervention.','Bhopal','Madhya Pradesh','Ward 03','2025-07-18','2025-07-23',41,'draft','open',0,'Demo safety instructions for campaign 042.','synthetic_demo'),
('CAM00043','ORG0013','Awareness Campaign 043','awareness','Improve animal welfare outcomes through a documented intervention.','Lucknow','Uttar Pradesh','Ward 04','2025-07-22','2025-07-27',44,'pending_review','closed',0,'Demo safety instructions for campaign 043.','synthetic_demo'),
('CAM00044','ORG0014','Assessment Campaign 044','assessment','Improve water supply outcomes through a documented intervention.','Kanpur','Uttar Pradesh','Ward 05','2025-07-26','2025-07-31',47,'active','open',1,'Demo safety instructions for campaign 044.','synthetic_demo'),
('CAM00045','ORG0015','Training Campaign 045','training','Improve public health outcomes through a documented intervention.','Varanasi','Uttar Pradesh','Ward 06','2025-07-30','2025-08-04',5,'paused','closed',0,'Demo safety instructions for campaign 045.','synthetic_demo'),
('CAM00046','ORG0016','Community Support Campaign 046','community_support','Improve education access outcomes through a documented intervention.','Pune','Maharashtra','Ward 07','2025-08-03','2025-08-08',8,'completed','open',0,'Demo safety instructions for campaign 046.','synthetic_demo'),
('CAM00047','ORG0017','Tree Planting Campaign 047','tree_planting','Improve road safety outcomes through a documented intervention.','Nagpur','Maharashtra','Ward 08','2025-08-07','2025-08-12',11,'cancelled','closed',0,'Demo safety instructions for campaign 047.','synthetic_demo'),
('CAM00048','ORG0018','Accessibility Audit Campaign 048','accessibility_audit','Improve street lighting outcomes through a documented intervention.','Patna','Bihar','Ward 09','2025-08-11','2025-08-16',14,'draft','open',1,'Demo safety instructions for campaign 048.','synthetic_demo'),
('CAM00049','ORG0019','Cleanup Campaign 049','cleanup','Improve green space outcomes through a documented intervention.','Gaya','Bihar','Ward 10','2025-08-15','2025-08-20',17,'pending_review','closed',0,'Demo safety instructions for campaign 049.','synthetic_demo'),
('CAM00050','ORG0020','Awareness Campaign 050','awareness','Improve waste management outcomes through a documented intervention.','Chennai','Tamil Nadu','Ward 01','2025-08-19','2025-08-24',20,'active','open',0,'Demo safety instructions for campaign 050.','synthetic_demo'),
('CAM00051','ORG0021','Assessment Campaign 051','assessment','Improve drainage outcomes through a documented intervention.','Coimbatore','Tamil Nadu','Ward 02','2025-08-23','2025-08-28',23,'paused','closed',0,'Demo safety instructions for campaign 051.','synthetic_demo'),
('CAM00052','ORG0022','Training Campaign 052','training','Improve accessibility outcomes through a documented intervention.','Bengaluru','Karnataka','Ward 03','2025-08-27','2025-09-01',26,'completed','open',1,'Demo safety instructions for campaign 052.','synthetic_demo'),
('CAM00053','ORG0023','Community Support Campaign 053','community_support','Improve animal welfare outcomes through a documented intervention.','Jaipur','Rajasthan','Ward 04','2025-08-31','2025-09-05',29,'cancelled','closed',0,'Demo safety instructions for campaign 053.','synthetic_demo'),
('CAM00054','ORG0024','Tree Planting Campaign 054','tree_planting','Improve water supply outcomes through a documented intervention.','Bhopal','Madhya Pradesh','Ward 05','2025-09-04','2025-09-09',32,'draft','open',0,'Demo safety instructions for campaign 054.','synthetic_demo'),
('CAM00055','ORG0025','Accessibility Audit Campaign 055','accessibility_audit','Improve public health outcomes through a documented intervention.','Lucknow','Uttar Pradesh','Ward 06','2025-09-08','2025-09-13',35,'pending_review','closed',0,'Demo safety instructions for campaign 055.','synthetic_demo'),
('CAM00056','ORG0026','Cleanup Campaign 056','cleanup','Improve education access outcomes through a documented intervention.','Kanpur','Uttar Pradesh','Ward 07','2025-09-12','2025-09-17',38,'active','open',1,'Demo safety instructions for campaign 056.','synthetic_demo'),
('CAM00057','ORG0027','Awareness Campaign 057','awareness','Improve road safety outcomes through a documented intervention.','Varanasi','Uttar Pradesh','Ward 08','2025-09-16','2025-09-21',41,'paused','closed',0,'Demo safety instructions for campaign 057.','synthetic_demo'),
('CAM00058','ORG0028','Assessment Campaign 058','assessment','Improve street lighting outcomes through a documented intervention.','Pune','Maharashtra','Ward 09','2025-09-20','2025-09-25',44,'completed','open',0,'Demo safety instructions for campaign 058.','synthetic_demo'),
('CAM00059','ORG0029','Training Campaign 059','training','Improve green space outcomes through a documented intervention.','Nagpur','Maharashtra','Ward 10','2025-09-24','2025-09-29',47,'cancelled','closed',0,'Demo safety instructions for campaign 059.','synthetic_demo'),
('CAM00060','ORG0030','Community Support Campaign 060','community_support','Improve waste management outcomes through a documented intervention.','Patna','Bihar','Ward 01','2025-09-28','2025-10-03',5,'draft','open',1,'Demo safety instructions for campaign 060.','synthetic_demo'),
('CAM00061','ORG0001','Tree Planting Campaign 061','tree_planting','Improve drainage outcomes through a documented intervention.','Lucknow','Uttar Pradesh','Ward 02','2025-10-02','2025-10-07',8,'pending_review','closed',0,'Demo safety instructions for campaign 061.','synthetic_demo'),
('CAM00062','ORG0002','Accessibility Audit Campaign 062','accessibility_audit','Improve accessibility outcomes through a documented intervention.','Kanpur','Uttar Pradesh','Ward 03','2025-10-06','2025-10-11',11,'active','open',0,'Demo safety instructions for campaign 062.','synthetic_demo'),
('CAM00063','ORG0003','Cleanup Campaign 063','cleanup','Improve animal welfare outcomes through a documented intervention.','Varanasi','Uttar Pradesh','Ward 04','2025-10-10','2025-10-15',14,'paused','closed',0,'Demo safety instructions for campaign 063.','synthetic_demo'),
('CAM00064','ORG0004','Awareness Campaign 064','awareness','Improve water supply outcomes through a documented intervention.','Pune','Maharashtra','Ward 05','2025-10-14','2025-10-19',17,'completed','open',1,'Demo safety instructions for campaign 064.','synthetic_demo'),
('CAM00065','ORG0005','Assessment Campaign 065','assessment','Improve public health outcomes through a documented intervention.','Nagpur','Maharashtra','Ward 06','2025-10-18','2025-10-23',20,'cancelled','closed',0,'Demo safety instructions for campaign 065.','synthetic_demo'),
('CAM00066','ORG0006','Training Campaign 066','training','Improve education access outcomes through a documented intervention.','Patna','Bihar','Ward 07','2025-10-22','2025-10-27',23,'draft','open',0,'Demo safety instructions for campaign 066.','synthetic_demo'),
('CAM00067','ORG0007','Community Support Campaign 067','community_support','Improve road safety outcomes through a documented intervention.','Gaya','Bihar','Ward 08','2025-10-26','2025-10-31',26,'pending_review','closed',0,'Demo safety instructions for campaign 067.','synthetic_demo'),
('CAM00068','ORG0008','Tree Planting Campaign 068','tree_planting','Improve street lighting outcomes through a documented intervention.','Chennai','Tamil Nadu','Ward 09','2025-10-30','2025-11-04',29,'active','open',1,'Demo safety instructions for campaign 068.','synthetic_demo'),
('CAM00069','ORG0009','Accessibility Audit Campaign 069','accessibility_audit','Improve green space outcomes through a documented intervention.','Coimbatore','Tamil Nadu','Ward 10','2025-11-03','2025-11-08',32,'paused','closed',0,'Demo safety instructions for campaign 069.','synthetic_demo'),
('CAM00070','ORG0010','Cleanup Campaign 070','cleanup','Improve waste management outcomes through a documented intervention.','Bengaluru','Karnataka','Ward 01','2025-11-07','2025-11-12',35,'completed','open',0,'Demo safety instructions for campaign 070.','synthetic_demo');

INSERT INTO `campaign_issue_links` (link_id,campaign_id,issue_id,link_type,data_source) VALUES
('CIL00001','CAM00001','ISS00004','primary','synthetic_demo'),
('CIL00002','CAM00002','ISS00007','primary','synthetic_demo'),
('CIL00003','CAM00003','ISS00010','primary','synthetic_demo'),
('CIL00004','CAM00004','ISS00013','primary','synthetic_demo'),
('CIL00005','CAM00005','ISS00016','primary','synthetic_demo'),
('CIL00006','CAM00006','ISS00019','primary','synthetic_demo'),
('CIL00007','CAM00007','ISS00022','primary','synthetic_demo'),
('CIL00008','CAM00008','ISS00025','primary','synthetic_demo'),
('CIL00009','CAM00009','ISS00028','primary','synthetic_demo'),
('CIL00010','CAM00010','ISS00031','primary','synthetic_demo'),
('CIL00011','CAM00011','ISS00034','primary','synthetic_demo'),
('CIL00012','CAM00012','ISS00037','primary','synthetic_demo'),
('CIL00013','CAM00013','ISS00040','primary','synthetic_demo'),
('CIL00014','CAM00014','ISS00043','primary','synthetic_demo'),
('CIL00015','CAM00015','ISS00046','primary','synthetic_demo'),
('CIL00016','CAM00016','ISS00049','primary','synthetic_demo'),
('CIL00017','CAM00017','ISS00052','primary','synthetic_demo'),
('CIL00018','CAM00018','ISS00055','primary','synthetic_demo'),
('CIL00019','CAM00019','ISS00058','primary','synthetic_demo'),
('CIL00020','CAM00020','ISS00061','primary','synthetic_demo'),
('CIL00021','CAM00021','ISS00064','primary','synthetic_demo'),
('CIL00022','CAM00022','ISS00067','primary','synthetic_demo'),
('CIL00023','CAM00023','ISS00070','primary','synthetic_demo'),
('CIL00024','CAM00024','ISS00073','primary','synthetic_demo'),
('CIL00025','CAM00025','ISS00076','primary','synthetic_demo'),
('CIL00026','CAM00026','ISS00079','primary','synthetic_demo'),
('CIL00027','CAM00027','ISS00082','primary','synthetic_demo'),
('CIL00028','CAM00028','ISS00085','primary','synthetic_demo'),
('CIL00029','CAM00029','ISS00088','primary','synthetic_demo'),
('CIL00030','CAM00030','ISS00091','primary','synthetic_demo'),
('CIL00031','CAM00031','ISS00094','primary','synthetic_demo'),
('CIL00032','CAM00032','ISS00097','primary','synthetic_demo'),
('CIL00033','CAM00033','ISS00100','primary','synthetic_demo'),
('CIL00034','CAM00034','ISS00003','primary','synthetic_demo'),
('CIL00035','CAM00035','ISS00006','primary','synthetic_demo'),
('CIL00036','CAM00036','ISS00009','primary','synthetic_demo'),
('CIL00037','CAM00037','ISS00012','primary','synthetic_demo'),
('CIL00038','CAM00038','ISS00015','primary','synthetic_demo'),
('CIL00039','CAM00039','ISS00018','primary','synthetic_demo'),
('CIL00040','CAM00040','ISS00021','primary','synthetic_demo'),
('CIL00041','CAM00041','ISS00024','primary','synthetic_demo'),
('CIL00042','CAM00042','ISS00027','primary','synthetic_demo'),
('CIL00043','CAM00043','ISS00030','primary','synthetic_demo'),
('CIL00044','CAM00044','ISS00033','primary','synthetic_demo'),
('CIL00045','CAM00045','ISS00036','primary','synthetic_demo'),
('CIL00046','CAM00046','ISS00039','primary','synthetic_demo'),
('CIL00047','CAM00047','ISS00042','primary','synthetic_demo'),
('CIL00048','CAM00048','ISS00045','primary','synthetic_demo'),
('CIL00049','CAM00049','ISS00048','primary','synthetic_demo'),
('CIL00050','CAM00050','ISS00051','primary','synthetic_demo'),
('CIL00051','CAM00051','ISS00054','primary','synthetic_demo'),
('CIL00052','CAM00052','ISS00057','primary','synthetic_demo'),
('CIL00053','CAM00053','ISS00060','primary','synthetic_demo'),
('CIL00054','CAM00054','ISS00063','primary','synthetic_demo'),
('CIL00055','CAM00055','ISS00066','primary','synthetic_demo'),
('CIL00056','CAM00056','ISS00069','primary','synthetic_demo'),
('CIL00057','CAM00057','ISS00072','primary','synthetic_demo'),
('CIL00058','CAM00058','ISS00075','primary','synthetic_demo'),
('CIL00059','CAM00059','ISS00078','primary','synthetic_demo'),
('CIL00060','CAM00060','ISS00081','primary','synthetic_demo'),
('CIL00061','CAM00061','ISS00084','primary','synthetic_demo'),
('CIL00062','CAM00062','ISS00087','primary','synthetic_demo'),
('CIL00063','CAM00063','ISS00090','primary','synthetic_demo'),
('CIL00064','CAM00064','ISS00093','primary','synthetic_demo'),
('CIL00065','CAM00065','ISS00096','primary','synthetic_demo'),
('CIL00066','CAM00066','ISS00099','primary','synthetic_demo'),
('CIL00067','CAM00067','ISS00002','primary','synthetic_demo'),
('CIL00068','CAM00068','ISS00005','primary','synthetic_demo'),
('CIL00069','CAM00069','ISS00008','primary','synthetic_demo'),
('CIL00070','CAM00070','ISS00011','primary','synthetic_demo');

INSERT INTO `ngo_issue_associations` (association_id,organization_id,issue_id,association_status,priority,notes,updated_at,data_source) VALUES
('NIA00001','ORG0001','ISS00003','assessment_proposed','medium','Synthetic NGO issue assessment 1.','2025-01-04','synthetic_demo'),
('NIA00002','ORG0002','ISS00005','assistance_offered','high','Synthetic NGO issue assessment 2.','2025-01-07','synthetic_demo'),
('NIA00003','ORG0003','ISS00007','referred','low','Synthetic NGO issue assessment 3.','2025-01-10','synthetic_demo'),
('NIA00004','ORG0004','ISS00009','declined','medium','Synthetic NGO issue assessment 4.','2025-01-13','synthetic_demo'),
('NIA00005','ORG0005','ISS00011','supporting','high','Synthetic NGO issue assessment 5.','2025-01-16','synthetic_demo'),
('NIA00006','ORG0006','ISS00013','interested','low','Synthetic NGO issue assessment 6.','2025-01-19','synthetic_demo'),
('NIA00007','ORG0007','ISS00015','assessment_proposed','medium','Synthetic NGO issue assessment 7.','2025-01-22','synthetic_demo'),
('NIA00008','ORG0008','ISS00017','assistance_offered','high','Synthetic NGO issue assessment 8.','2025-01-25','synthetic_demo'),
('NIA00009','ORG0009','ISS00019','referred','low','Synthetic NGO issue assessment 9.','2025-01-28','synthetic_demo'),
('NIA00010','ORG0010','ISS00021','declined','medium','Synthetic NGO issue assessment 10.','2025-01-31','synthetic_demo'),
('NIA00011','ORG0011','ISS00023','supporting','high','Synthetic NGO issue assessment 11.','2025-02-03','synthetic_demo'),
('NIA00012','ORG0012','ISS00025','interested','low','Synthetic NGO issue assessment 12.','2025-02-06','synthetic_demo'),
('NIA00013','ORG0013','ISS00027','assessment_proposed','medium','Synthetic NGO issue assessment 13.','2025-02-09','synthetic_demo'),
('NIA00014','ORG0014','ISS00029','assistance_offered','high','Synthetic NGO issue assessment 14.','2025-02-12','synthetic_demo'),
('NIA00015','ORG0015','ISS00031','referred','low','Synthetic NGO issue assessment 15.','2025-02-15','synthetic_demo'),
('NIA00016','ORG0016','ISS00033','declined','medium','Synthetic NGO issue assessment 16.','2025-02-18','synthetic_demo'),
('NIA00017','ORG0017','ISS00035','supporting','high','Synthetic NGO issue assessment 17.','2025-02-21','synthetic_demo'),
('NIA00018','ORG0018','ISS00037','interested','low','Synthetic NGO issue assessment 18.','2025-02-24','synthetic_demo'),
('NIA00019','ORG0019','ISS00039','assessment_proposed','medium','Synthetic NGO issue assessment 19.','2025-02-27','synthetic_demo'),
('NIA00020','ORG0020','ISS00041','assistance_offered','high','Synthetic NGO issue assessment 20.','2025-03-02','synthetic_demo'),
('NIA00021','ORG0021','ISS00043','referred','low','Synthetic NGO issue assessment 21.','2025-03-05','synthetic_demo'),
('NIA00022','ORG0022','ISS00045','declined','medium','Synthetic NGO issue assessment 22.','2025-03-08','synthetic_demo'),
('NIA00023','ORG0023','ISS00047','supporting','high','Synthetic NGO issue assessment 23.','2025-03-11','synthetic_demo'),
('NIA00024','ORG0024','ISS00049','interested','low','Synthetic NGO issue assessment 24.','2025-03-14','synthetic_demo'),
('NIA00025','ORG0025','ISS00051','assessment_proposed','medium','Synthetic NGO issue assessment 25.','2025-03-17','synthetic_demo'),
('NIA00026','ORG0026','ISS00053','assistance_offered','high','Synthetic NGO issue assessment 26.','2025-03-20','synthetic_demo'),
('NIA00027','ORG0027','ISS00055','referred','low','Synthetic NGO issue assessment 27.','2025-03-23','synthetic_demo'),
('NIA00028','ORG0028','ISS00057','declined','medium','Synthetic NGO issue assessment 28.','2025-03-26','synthetic_demo'),
('NIA00029','ORG0029','ISS00059','supporting','high','Synthetic NGO issue assessment 29.','2025-03-29','synthetic_demo'),
('NIA00030','ORG0030','ISS00061','interested','low','Synthetic NGO issue assessment 30.','2025-04-01','synthetic_demo');

INSERT INTO `campaign_partners` (campaign_partner_id,campaign_id,partner_organization_id,partner_role,partnership_status,responsibility_scope,data_source) VALUES
('CPR00001','CAM00004','ORG0013','partner','accepted','Demo partner responsibilities 1.','synthetic_demo'),
('CPR00002','CAM00007','ORG0018','partner','declined','Demo partner responsibilities 2.','synthetic_demo'),
('CPR00003','CAM00010','ORG0023','partner','withdrawn','Demo partner responsibilities 3.','synthetic_demo'),
('CPR00004','CAM00013','ORG0028','partner','invited','Demo partner responsibilities 4.','synthetic_demo'),
('CPR00005','CAM00016','ORG0003','partner','accepted','Demo partner responsibilities 5.','synthetic_demo'),
('CPR00006','CAM00019','ORG0008','partner','declined','Demo partner responsibilities 6.','synthetic_demo'),
('CPR00007','CAM00022','ORG0013','partner','withdrawn','Demo partner responsibilities 7.','synthetic_demo'),
('CPR00008','CAM00025','ORG0018','partner','invited','Demo partner responsibilities 8.','synthetic_demo'),
('CPR00009','CAM00028','ORG0023','partner','accepted','Demo partner responsibilities 9.','synthetic_demo'),
('CPR00010','CAM00031','ORG0028','partner','declined','Demo partner responsibilities 10.','synthetic_demo'),
('CPR00011','CAM00034','ORG0003','partner','withdrawn','Demo partner responsibilities 11.','synthetic_demo'),
('CPR00012','CAM00037','ORG0008','partner','invited','Demo partner responsibilities 12.','synthetic_demo'),
('CPR00013','CAM00040','ORG0013','partner','accepted','Demo partner responsibilities 13.','synthetic_demo'),
('CPR00014','CAM00043','ORG0018','partner','declined','Demo partner responsibilities 14.','synthetic_demo'),
('CPR00015','CAM00046','ORG0023','partner','withdrawn','Demo partner responsibilities 15.','synthetic_demo');

INSERT INTO `campaign_tasks` (task_id,campaign_id,title,task_status,assigned_member_ref,start_date,due_date,notes,safety_flag,data_source) VALUES
('TSK00001','CAM00003','Task 001: community outreach','in_progress','MEM0002','2025-01-24','2025-01-29','Demo task notes 1.',0,'synthetic_demo'),
('TSK00002','CAM00005','Task 002: material distribution','blocked','MEM0003','2025-01-27','2025-02-01','Demo task notes 2.',0,'synthetic_demo'),
('TSK00003','CAM00007','Task 003: cleanup','completed','MEM0004','2025-01-30','2025-02-04','Demo task notes 3.',0,'synthetic_demo'),
('TSK00004','CAM00009','Task 004: documentation','not_started','MEM0005','2025-02-02','2025-02-07','Demo task notes 4.',0,'synthetic_demo'),
('TSK00005','CAM00011','Task 005: follow-up','in_progress','MEM0006','2025-02-05','2025-02-10','Demo task notes 5.',0,'synthetic_demo'),
('TSK00006','CAM00013','Task 006: site inspection','blocked','MEM0007','2025-02-08','2025-02-13','Demo task notes 6.',0,'synthetic_demo'),
('TSK00007','CAM00015','Task 007: community outreach','completed','MEM0008','2025-02-11','2025-02-16','Demo task notes 7.',0,'synthetic_demo'),
('TSK00008','CAM00017','Task 008: material distribution','not_started','MEM0009','2025-02-14','2025-02-19','Demo task notes 8.',0,'synthetic_demo'),
('TSK00009','CAM00019','Task 009: cleanup','in_progress','MEM0010','2025-02-17','2025-02-22','Demo task notes 9.',1,'synthetic_demo'),
('TSK00010','CAM00021','Task 010: documentation','blocked','MEM0011','2025-02-20','2025-02-25','Demo task notes 10.',0,'synthetic_demo'),
('TSK00011','CAM00023','Task 011: follow-up','completed','MEM0012','2025-02-23','2025-02-28','Demo task notes 11.',0,'synthetic_demo'),
('TSK00012','CAM00025','Task 012: site inspection','not_started','MEM0013','2025-02-26','2025-03-03','Demo task notes 12.',0,'synthetic_demo'),
('TSK00013','CAM00027','Task 013: community outreach','in_progress','MEM0014','2025-03-01','2025-03-06','Demo task notes 13.',0,'synthetic_demo'),
('TSK00014','CAM00029','Task 014: material distribution','blocked','MEM0015','2025-03-04','2025-03-09','Demo task notes 14.',0,'synthetic_demo'),
('TSK00015','CAM00031','Task 015: cleanup','completed','MEM0016','2025-03-07','2025-03-12','Demo task notes 15.',0,'synthetic_demo'),
('TSK00016','CAM00033','Task 016: documentation','not_started','MEM0017','2025-03-10','2025-03-15','Demo task notes 16.',0,'synthetic_demo'),
('TSK00017','CAM00035','Task 017: follow-up','in_progress','MEM0018','2025-03-13','2025-03-18','Demo task notes 17.',0,'synthetic_demo'),
('TSK00018','CAM00037','Task 018: site inspection','blocked','MEM0019','2025-03-16','2025-03-21','Demo task notes 18.',1,'synthetic_demo'),
('TSK00019','CAM00039','Task 019: community outreach','completed','MEM0020','2025-03-19','2025-03-24','Demo task notes 19.',0,'synthetic_demo'),
('TSK00020','CAM00041','Task 020: material distribution','not_started','MEM0021','2025-03-22','2025-03-27','Demo task notes 20.',0,'synthetic_demo'),
('TSK00021','CAM00043','Task 021: cleanup','in_progress','MEM0022','2025-03-25','2025-03-30','Demo task notes 21.',0,'synthetic_demo'),
('TSK00022','CAM00045','Task 022: documentation','blocked','MEM0023','2025-03-28','2025-04-02','Demo task notes 22.',0,'synthetic_demo'),
('TSK00023','CAM00047','Task 023: follow-up','completed','MEM0024','2025-03-31','2025-04-05','Demo task notes 23.',0,'synthetic_demo'),
('TSK00024','CAM00049','Task 024: site inspection','not_started','MEM0025','2025-04-03','2025-04-08','Demo task notes 24.',0,'synthetic_demo'),
('TSK00025','CAM00051','Task 025: community outreach','in_progress','MEM0026','2025-04-06','2025-04-11','Demo task notes 25.',0,'synthetic_demo'),
('TSK00026','CAM00053','Task 026: material distribution','blocked','MEM0027','2025-04-09','2025-04-14','Demo task notes 26.',0,'synthetic_demo'),
('TSK00027','CAM00055','Task 027: cleanup','completed','MEM0028','2025-04-12','2025-04-17','Demo task notes 27.',1,'synthetic_demo'),
('TSK00028','CAM00057','Task 028: documentation','not_started','MEM0029','2025-04-15','2025-04-20','Demo task notes 28.',0,'synthetic_demo'),
('TSK00029','CAM00059','Task 029: follow-up','in_progress','MEM0030','2025-04-18','2025-04-23','Demo task notes 29.',0,'synthetic_demo'),
('TSK00030','CAM00061','Task 030: site inspection','blocked','MEM0001','2025-04-21','2025-04-26','Demo task notes 30.',0,'synthetic_demo'),
('TSK00031','CAM00063','Task 031: community outreach','completed','MEM0002','2025-04-24','2025-04-29','Demo task notes 31.',0,'synthetic_demo'),
('TSK00032','CAM00065','Task 032: material distribution','not_started','MEM0003','2025-04-27','2025-05-02','Demo task notes 32.',0,'synthetic_demo'),
('TSK00033','CAM00067','Task 033: cleanup','in_progress','MEM0004','2025-04-30','2025-05-05','Demo task notes 33.',0,'synthetic_demo'),
('TSK00034','CAM00069','Task 034: documentation','blocked','MEM0005','2025-05-03','2025-05-08','Demo task notes 34.',0,'synthetic_demo'),
('TSK00035','CAM00001','Task 035: follow-up','completed','MEM0006','2025-05-06','2025-05-11','Demo task notes 35.',0,'synthetic_demo'),
('TSK00036','CAM00003','Task 036: site inspection','not_started','MEM0007','2025-05-09','2025-05-14','Demo task notes 36.',1,'synthetic_demo'),
('TSK00037','CAM00005','Task 037: community outreach','in_progress','MEM0008','2025-05-12','2025-05-17','Demo task notes 37.',0,'synthetic_demo'),
('TSK00038','CAM00007','Task 038: material distribution','blocked','MEM0009','2025-05-15','2025-05-20','Demo task notes 38.',0,'synthetic_demo'),
('TSK00039','CAM00009','Task 039: cleanup','completed','MEM0010','2025-05-18','2025-05-23','Demo task notes 39.',0,'synthetic_demo'),
('TSK00040','CAM00011','Task 040: documentation','not_started','MEM0011','2025-05-21','2025-05-26','Demo task notes 40.',0,'synthetic_demo'),
('TSK00041','CAM00013','Task 041: follow-up','in_progress','MEM0012','2025-05-24','2025-05-29','Demo task notes 41.',0,'synthetic_demo'),
('TSK00042','CAM00015','Task 042: site inspection','blocked','MEM0013','2025-05-27','2025-06-01','Demo task notes 42.',0,'synthetic_demo'),
('TSK00043','CAM00017','Task 043: community outreach','completed','MEM0014','2025-05-30','2025-06-04','Demo task notes 43.',0,'synthetic_demo'),
('TSK00044','CAM00019','Task 044: material distribution','not_started','MEM0015','2025-06-02','2025-06-07','Demo task notes 44.',0,'synthetic_demo'),
('TSK00045','CAM00021','Task 045: cleanup','in_progress','MEM0016','2025-06-05','2025-06-10','Demo task notes 45.',1,'synthetic_demo'),
('TSK00046','CAM00023','Task 046: documentation','blocked','MEM0017','2025-06-08','2025-06-13','Demo task notes 46.',0,'synthetic_demo'),
('TSK00047','CAM00025','Task 047: follow-up','completed','MEM0018','2025-06-11','2025-06-16','Demo task notes 47.',0,'synthetic_demo'),
('TSK00048','CAM00027','Task 048: site inspection','not_started','MEM0019','2025-06-14','2025-06-19','Demo task notes 48.',0,'synthetic_demo'),
('TSK00049','CAM00029','Task 049: community outreach','in_progress','MEM0020','2025-06-17','2025-06-22','Demo task notes 49.',0,'synthetic_demo'),
('TSK00050','CAM00031','Task 050: material distribution','blocked','MEM0021','2025-06-20','2025-06-25','Demo task notes 50.',0,'synthetic_demo'),
('TSK00051','CAM00033','Task 051: cleanup','completed','MEM0022','2025-06-23','2025-06-28','Demo task notes 51.',0,'synthetic_demo'),
('TSK00052','CAM00035','Task 052: documentation','not_started','MEM0023','2025-06-26','2025-07-01','Demo task notes 52.',0,'synthetic_demo'),
('TSK00053','CAM00037','Task 053: follow-up','in_progress','MEM0024','2025-06-29','2025-07-04','Demo task notes 53.',0,'synthetic_demo'),
('TSK00054','CAM00039','Task 054: site inspection','blocked','MEM0025','2025-07-02','2025-07-07','Demo task notes 54.',1,'synthetic_demo'),
('TSK00055','CAM00041','Task 055: community outreach','completed','MEM0026','2025-07-05','2025-07-10','Demo task notes 55.',0,'synthetic_demo'),
('TSK00056','CAM00043','Task 056: material distribution','not_started','MEM0027','2025-07-08','2025-07-13','Demo task notes 56.',0,'synthetic_demo'),
('TSK00057','CAM00045','Task 057: cleanup','in_progress','MEM0028','2025-07-11','2025-07-16','Demo task notes 57.',0,'synthetic_demo'),
('TSK00058','CAM00047','Task 058: documentation','blocked','MEM0029','2025-07-14','2025-07-19','Demo task notes 58.',0,'synthetic_demo'),
('TSK00059','CAM00049','Task 059: follow-up','completed','MEM0030','2025-07-17','2025-07-22','Demo task notes 59.',0,'synthetic_demo'),
('TSK00060','CAM00051','Task 060: site inspection','not_started','MEM0001','2025-07-20','2025-07-25','Demo task notes 60.',0,'synthetic_demo'),
('TSK00061','CAM00053','Task 061: community outreach','in_progress','MEM0002','2025-07-23','2025-07-28','Demo task notes 61.',0,'synthetic_demo'),
('TSK00062','CAM00055','Task 062: material distribution','blocked','MEM0003','2025-07-26','2025-07-31','Demo task notes 62.',0,'synthetic_demo'),
('TSK00063','CAM00057','Task 063: cleanup','completed','MEM0004','2025-07-29','2025-08-03','Demo task notes 63.',1,'synthetic_demo'),
('TSK00064','CAM00059','Task 064: documentation','not_started','MEM0005','2025-08-01','2025-08-06','Demo task notes 64.',0,'synthetic_demo'),
('TSK00065','CAM00061','Task 065: follow-up','in_progress','MEM0006','2025-08-04','2025-08-09','Demo task notes 65.',0,'synthetic_demo'),
('TSK00066','CAM00063','Task 066: site inspection','blocked','MEM0007','2025-08-07','2025-08-12','Demo task notes 66.',0,'synthetic_demo'),
('TSK00067','CAM00065','Task 067: community outreach','completed','MEM0008','2025-08-10','2025-08-15','Demo task notes 67.',0,'synthetic_demo'),
('TSK00068','CAM00067','Task 068: material distribution','not_started','MEM0009','2025-08-13','2025-08-18','Demo task notes 68.',0,'synthetic_demo'),
('TSK00069','CAM00069','Task 069: cleanup','in_progress','MEM0010','2025-08-16','2025-08-21','Demo task notes 69.',0,'synthetic_demo'),
('TSK00070','CAM00001','Task 070: documentation','blocked','MEM0011','2025-08-19','2025-08-24','Demo task notes 70.',0,'synthetic_demo'),
('TSK00071','CAM00003','Task 071: follow-up','completed','MEM0012','2025-08-22','2025-08-27','Demo task notes 71.',0,'synthetic_demo'),
('TSK00072','CAM00005','Task 072: site inspection','not_started','MEM0013','2025-08-25','2025-08-30','Demo task notes 72.',1,'synthetic_demo'),
('TSK00073','CAM00007','Task 073: community outreach','in_progress','MEM0014','2025-08-28','2025-09-02','Demo task notes 73.',0,'synthetic_demo'),
('TSK00074','CAM00009','Task 074: material distribution','blocked','MEM0015','2025-08-31','2025-09-05','Demo task notes 74.',0,'synthetic_demo'),
('TSK00075','CAM00011','Task 075: cleanup','completed','MEM0016','2025-09-03','2025-09-08','Demo task notes 75.',0,'synthetic_demo'),
('TSK00076','CAM00013','Task 076: documentation','not_started','MEM0017','2025-09-06','2025-09-11','Demo task notes 76.',0,'synthetic_demo'),
('TSK00077','CAM00015','Task 077: follow-up','in_progress','MEM0018','2025-09-09','2025-09-14','Demo task notes 77.',0,'synthetic_demo'),
('TSK00078','CAM00017','Task 078: site inspection','blocked','MEM0019','2025-09-12','2025-09-17','Demo task notes 78.',0,'synthetic_demo'),
('TSK00079','CAM00019','Task 079: community outreach','completed','MEM0020','2025-09-15','2025-09-20','Demo task notes 79.',0,'synthetic_demo'),
('TSK00080','CAM00021','Task 080: material distribution','not_started','MEM0021','2025-09-18','2025-09-23','Demo task notes 80.',0,'synthetic_demo');

INSERT INTO `volunteer_registrations` (registration_id,campaign_id,volunteer_ref,display_name,demo_email,application_status,participant_type,consent_recorded,applied_at,data_source) VALUES
('VREG00001','CAM00004','VOL00001','Aditi Patel','volunteer-00001@example.org','accepted','community_member',1,'2025-02-03','synthetic_demo'),
('VREG00002','CAM00007','VOL00002','Ananya Kumar','volunteer-00002@example.org','declined','professional',1,'2025-02-06','synthetic_demo'),
('VREG00003','CAM00010','VOL00003','Arjun Nair','volunteer-00003@example.org','withdrawn','student',1,'2025-02-09','synthetic_demo'),
('VREG00004','CAM00013','VOL00004','Diya Sharma','volunteer-00004@example.org','waitlisted','community_member',1,'2025-02-12','synthetic_demo'),
('VREG00005','CAM00016','VOL00005','Ishaan Patel','volunteer-00005@example.org','pending','professional',1,'2025-02-15','synthetic_demo'),
('VREG00006','CAM00019','VOL00006','Kavya Kumar','volunteer-00006@example.org','accepted','student',1,'2025-02-18','synthetic_demo'),
('VREG00007','CAM00022','VOL00007','Meera Nair','volunteer-00007@example.org','declined','community_member',1,'2025-02-21','synthetic_demo'),
('VREG00008','CAM00025','VOL00008','Neel Sharma','volunteer-00008@example.org','withdrawn','professional',1,'2025-02-24','synthetic_demo'),
('VREG00009','CAM00028','VOL00009','Priya Patel','volunteer-00009@example.org','waitlisted','student',1,'2025-02-27','synthetic_demo'),
('VREG00010','CAM00031','VOL00010','Rahul Kumar','volunteer-00010@example.org','pending','community_member',1,'2025-03-02','synthetic_demo'),
('VREG00011','CAM00034','VOL00011','Riya Nair','volunteer-00011@example.org','accepted','professional',0,'2025-03-05','synthetic_demo'),
('VREG00012','CAM00037','VOL00012','Sana Sharma','volunteer-00012@example.org','declined','student',1,'2025-03-08','synthetic_demo'),
('VREG00013','CAM00040','VOL00013','Vikram Patel','volunteer-00013@example.org','withdrawn','community_member',1,'2025-03-11','synthetic_demo'),
('VREG00014','CAM00043','VOL00014','Zoya Kumar','volunteer-00014@example.org','waitlisted','professional',1,'2025-03-14','synthetic_demo'),
('VREG00015','CAM00046','VOL00015','Aarav Nair','volunteer-00015@example.org','pending','student',1,'2025-03-17','synthetic_demo'),
('VREG00016','CAM00049','VOL00016','Aditi Sharma','volunteer-00016@example.org','accepted','community_member',1,'2025-03-20','synthetic_demo'),
('VREG00017','CAM00052','VOL00017','Ananya Patel','volunteer-00017@example.org','declined','professional',1,'2025-03-23','synthetic_demo'),
('VREG00018','CAM00055','VOL00018','Arjun Kumar','volunteer-00018@example.org','withdrawn','student',1,'2025-03-26','synthetic_demo'),
('VREG00019','CAM00058','VOL00019','Diya Nair','volunteer-00019@example.org','waitlisted','community_member',1,'2025-03-29','synthetic_demo'),
('VREG00020','CAM00061','VOL00020','Ishaan Sharma','volunteer-00020@example.org','pending','professional',1,'2025-04-01','synthetic_demo'),
('VREG00021','CAM00064','VOL00021','Kavya Patel','volunteer-00021@example.org','accepted','student',1,'2025-04-04','synthetic_demo'),
('VREG00022','CAM00067','VOL00022','Meera Kumar','volunteer-00022@example.org','declined','community_member',0,'2025-04-07','synthetic_demo'),
('VREG00023','CAM00070','VOL00023','Neel Nair','volunteer-00023@example.org','withdrawn','professional',1,'2025-04-10','synthetic_demo'),
('VREG00024','CAM00003','VOL00024','Priya Sharma','volunteer-00024@example.org','waitlisted','student',1,'2025-04-13','synthetic_demo'),
('VREG00025','CAM00006','VOL00025','Rahul Patel','volunteer-00025@example.org','pending','community_member',1,'2025-04-16','synthetic_demo'),
('VREG00026','CAM00009','VOL00026','Riya Kumar','volunteer-00026@example.org','accepted','professional',1,'2025-04-19','synthetic_demo'),
('VREG00027','CAM00012','VOL00027','Sana Nair','volunteer-00027@example.org','declined','student',1,'2025-04-22','synthetic_demo'),
('VREG00028','CAM00015','VOL00028','Vikram Sharma','volunteer-00028@example.org','withdrawn','community_member',1,'2025-04-25','synthetic_demo'),
('VREG00029','CAM00018','VOL00029','Zoya Patel','volunteer-00029@example.org','waitlisted','professional',1,'2025-04-28','synthetic_demo'),
('VREG00030','CAM00021','VOL00030','Aarav Kumar','volunteer-00030@example.org','pending','student',1,'2025-05-01','synthetic_demo'),
('VREG00031','CAM00024','VOL00031','Aditi Nair','volunteer-00031@example.org','accepted','community_member',1,'2025-05-04','synthetic_demo'),
('VREG00032','CAM00027','VOL00032','Ananya Sharma','volunteer-00032@example.org','declined','professional',1,'2025-05-07','synthetic_demo'),
('VREG00033','CAM00030','VOL00033','Arjun Patel','volunteer-00033@example.org','withdrawn','student',0,'2025-05-10','synthetic_demo'),
('VREG00034','CAM00033','VOL00034','Diya Kumar','volunteer-00034@example.org','waitlisted','community_member',1,'2025-05-13','synthetic_demo'),
('VREG00035','CAM00036','VOL00035','Ishaan Nair','volunteer-00035@example.org','pending','professional',1,'2025-05-16','synthetic_demo'),
('VREG00036','CAM00039','VOL00036','Kavya Sharma','volunteer-00036@example.org','accepted','student',1,'2025-05-19','synthetic_demo'),
('VREG00037','CAM00042','VOL00037','Meera Patel','volunteer-00037@example.org','declined','community_member',1,'2025-05-22','synthetic_demo'),
('VREG00038','CAM00045','VOL00038','Neel Kumar','volunteer-00038@example.org','withdrawn','professional',1,'2025-05-25','synthetic_demo'),
('VREG00039','CAM00048','VOL00039','Priya Nair','volunteer-00039@example.org','waitlisted','student',1,'2025-05-28','synthetic_demo'),
('VREG00040','CAM00051','VOL00040','Rahul Sharma','volunteer-00040@example.org','pending','community_member',1,'2025-05-31','synthetic_demo'),
('VREG00041','CAM00054','VOL00041','Riya Patel','volunteer-00041@example.org','accepted','professional',1,'2025-06-03','synthetic_demo'),
('VREG00042','CAM00057','VOL00042','Sana Kumar','volunteer-00042@example.org','declined','student',1,'2025-06-06','synthetic_demo'),
('VREG00043','CAM00060','VOL00043','Vikram Nair','volunteer-00043@example.org','withdrawn','community_member',1,'2025-06-09','synthetic_demo'),
('VREG00044','CAM00063','VOL00044','Zoya Sharma','volunteer-00044@example.org','waitlisted','professional',0,'2025-06-12','synthetic_demo'),
('VREG00045','CAM00066','VOL00045','Aarav Patel','volunteer-00045@example.org','pending','student',1,'2025-06-15','synthetic_demo'),
('VREG00046','CAM00069','VOL00046','Aditi Kumar','volunteer-00046@example.org','accepted','community_member',1,'2025-06-18','synthetic_demo'),
('VREG00047','CAM00002','VOL00047','Ananya Nair','volunteer-00047@example.org','declined','professional',1,'2025-06-21','synthetic_demo'),
('VREG00048','CAM00005','VOL00048','Arjun Sharma','volunteer-00048@example.org','withdrawn','student',1,'2025-06-24','synthetic_demo'),
('VREG00049','CAM00008','VOL00049','Diya Patel','volunteer-00049@example.org','waitlisted','community_member',1,'2025-06-27','synthetic_demo'),
('VREG00050','CAM00011','VOL00050','Ishaan Kumar','volunteer-00050@example.org','pending','professional',1,'2025-06-30','synthetic_demo'),
('VREG00051','CAM00014','VOL00051','Kavya Nair','volunteer-00051@example.org','accepted','student',1,'2025-07-03','synthetic_demo'),
('VREG00052','CAM00017','VOL00052','Meera Sharma','volunteer-00052@example.org','declined','community_member',1,'2025-07-06','synthetic_demo'),
('VREG00053','CAM00020','VOL00053','Neel Patel','volunteer-00053@example.org','withdrawn','professional',1,'2025-07-09','synthetic_demo'),
('VREG00054','CAM00023','VOL00054','Priya Kumar','volunteer-00054@example.org','waitlisted','student',1,'2025-07-12','synthetic_demo'),
('VREG00055','CAM00026','VOL00055','Rahul Nair','volunteer-00055@example.org','pending','community_member',0,'2025-07-15','synthetic_demo'),
('VREG00056','CAM00029','VOL00056','Riya Sharma','volunteer-00056@example.org','accepted','professional',1,'2025-07-18','synthetic_demo'),
('VREG00057','CAM00032','VOL00057','Sana Patel','volunteer-00057@example.org','declined','student',1,'2025-07-21','synthetic_demo'),
('VREG00058','CAM00035','VOL00058','Vikram Kumar','volunteer-00058@example.org','withdrawn','community_member',1,'2025-07-24','synthetic_demo'),
('VREG00059','CAM00038','VOL00059','Zoya Nair','volunteer-00059@example.org','waitlisted','professional',1,'2025-07-27','synthetic_demo'),
('VREG00060','CAM00041','VOL00060','Aarav Sharma','volunteer-00060@example.org','pending','student',1,'2025-07-30','synthetic_demo'),
('VREG00061','CAM00044','VOL00061','Aditi Patel','volunteer-00061@example.org','accepted','community_member',1,'2025-08-02','synthetic_demo'),
('VREG00062','CAM00047','VOL00062','Ananya Kumar','volunteer-00062@example.org','declined','professional',1,'2025-08-05','synthetic_demo'),
('VREG00063','CAM00050','VOL00063','Arjun Nair','volunteer-00063@example.org','withdrawn','student',1,'2025-08-08','synthetic_demo'),
('VREG00064','CAM00053','VOL00064','Diya Sharma','volunteer-00064@example.org','waitlisted','community_member',1,'2025-08-11','synthetic_demo'),
('VREG00065','CAM00056','VOL00065','Ishaan Patel','volunteer-00065@example.org','pending','professional',1,'2025-08-14','synthetic_demo');

INSERT INTO `attendance_records` (attendance_id,registration_id,attendance_status,hours,recorded_at,notes,data_source) VALUES
('ATT00001','VREG00001','absent',1.5,'2025-03-06','Demo attendance record 1.','synthetic_demo'),
('ATT00002','VREG00002','late',2.0,'2025-03-10','Demo attendance record 2.','synthetic_demo'),
('ATT00003','VREG00003','excused',2.5,'2025-03-14','Demo attendance record 3.','synthetic_demo'),
('ATT00004','VREG00004','present',3.0,'2025-03-18','Demo attendance record 4.','synthetic_demo'),
('ATT00005','VREG00005','absent',3.5,'2025-03-22','Demo attendance record 5.','synthetic_demo'),
('ATT00006','VREG00006','late',4.0,'2025-03-26','Demo attendance record 6.','synthetic_demo'),
('ATT00007','VREG00007','excused',4.5,'2025-03-30','Demo attendance record 7.','synthetic_demo'),
('ATT00008','VREG00008','present',1.0,'2025-04-03','Demo attendance record 8.','synthetic_demo'),
('ATT00009','VREG00009','absent',1.5,'2025-04-07','Demo attendance record 9.','synthetic_demo'),
('ATT00010','VREG00010','late',2.0,'2025-04-11','Demo attendance record 10.','synthetic_demo'),
('ATT00011','VREG00011','excused',2.5,'2025-04-15','Demo attendance record 11.','synthetic_demo'),
('ATT00012','VREG00012','present',3.0,'2025-04-19','Demo attendance record 12.','synthetic_demo'),
('ATT00013','VREG00013','absent',3.5,'2025-04-23','Demo attendance record 13.','synthetic_demo'),
('ATT00014','VREG00014','late',4.0,'2025-04-27','Demo attendance record 14.','synthetic_demo'),
('ATT00015','VREG00015','excused',4.5,'2025-05-01','Demo attendance record 15.','synthetic_demo'),
('ATT00016','VREG00016','present',1.0,'2025-05-05','Demo attendance record 16.','synthetic_demo'),
('ATT00017','VREG00017','absent',1.5,'2025-05-09','Demo attendance record 17.','synthetic_demo'),
('ATT00018','VREG00018','late',2.0,'2025-05-13','Demo attendance record 18.','synthetic_demo'),
('ATT00019','VREG00019','excused',2.5,'2025-05-17','Demo attendance record 19.','synthetic_demo'),
('ATT00020','VREG00020','present',3.0,'2025-05-21','Demo attendance record 20.','synthetic_demo'),
('ATT00021','VREG00021','absent',3.5,'2025-05-25','Demo attendance record 21.','synthetic_demo'),
('ATT00022','VREG00022','late',4.0,'2025-05-29','Demo attendance record 22.','synthetic_demo'),
('ATT00023','VREG00023','excused',4.5,'2025-06-02','Demo attendance record 23.','synthetic_demo'),
('ATT00024','VREG00024','present',1.0,'2025-06-06','Demo attendance record 24.','synthetic_demo'),
('ATT00025','VREG00025','absent',1.5,'2025-06-10','Demo attendance record 25.','synthetic_demo');

INSERT INTO `evidence_records` (evidence_id,organization_id,campaign_id,task_id,issue_id,evidence_type,private_storage_path,content_hash,submitted_at,evidence_status,metadata_notes,version_label,data_source) VALUES
('EVD00001','ORG0003','CAM00003','TSK00004','ISS00005','document','private-demo/evidence-00001.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000001','2025-03-16','supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00002','ORG0005','CAM00005','TSK00007','ISS00009','measurement','private-demo/evidence-00002.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000002','2025-03-20','partially_supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00003','ORG0007','CAM00007','TSK00010','ISS00013','observation','private-demo/evidence-00003.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000003','2025-03-24','correction_requested','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00004','ORG0009','CAM00009','TSK00013','ISS00017','photo','private-demo/evidence-00004.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000004','2025-03-28','disputed','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00005','ORG0011','CAM00011','TSK00016','ISS00021','document','private-demo/evidence-00005.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000005','2025-04-01','unverified','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00006','ORG0013','CAM00013','TSK00019','ISS00025','measurement','private-demo/evidence-00006.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000006','2025-04-05','submitted','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00007','ORG0015','CAM00015','TSK00022','ISS00029','observation','private-demo/evidence-00007.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000007','2025-04-09','supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00008','ORG0017','CAM00017','TSK00025','ISS00033','photo','private-demo/evidence-00008.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000008','2025-04-13','partially_supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00009','ORG0019','CAM00019','TSK00028','ISS00037','document','private-demo/evidence-00009.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000009','2025-04-17','correction_requested','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00010','ORG0021','CAM00021','TSK00031','ISS00041','measurement','private-demo/evidence-00010.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000010','2025-04-21','disputed','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00011','ORG0023','CAM00023','TSK00034','ISS00045','observation','private-demo/evidence-00011.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000011','2025-04-25','unverified','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00012','ORG0025','CAM00025','TSK00037','ISS00049','photo','private-demo/evidence-00012.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000012','2025-04-29','submitted','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00013','ORG0027','CAM00027','TSK00040','ISS00053','document','private-demo/evidence-00013.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000013','2025-05-03','supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00014','ORG0029','CAM00029','TSK00043','ISS00057','measurement','private-demo/evidence-00014.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000014','2025-05-07','partially_supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00015','ORG0001','CAM00031','TSK00046','ISS00061','observation','private-demo/evidence-00015.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000015','2025-05-11','correction_requested','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00016','ORG0003','CAM00033','TSK00049','ISS00065','photo','private-demo/evidence-00016.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000016','2025-05-15','disputed','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00017','ORG0005','CAM00035','TSK00052','ISS00069','document','private-demo/evidence-00017.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000017','2025-05-19','unverified','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00018','ORG0007','CAM00037','TSK00055','ISS00073','measurement','private-demo/evidence-00018.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000018','2025-05-23','submitted','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00019','ORG0009','CAM00039','TSK00058','ISS00077','observation','private-demo/evidence-00019.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000019','2025-05-27','supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00020','ORG0011','CAM00041','TSK00061','ISS00081','photo','private-demo/evidence-00020.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000020','2025-05-31','partially_supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00021','ORG0013','CAM00043','TSK00064','ISS00085','document','private-demo/evidence-00021.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000021','2025-06-04','correction_requested','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00022','ORG0015','CAM00045','TSK00067','ISS00089','measurement','private-demo/evidence-00022.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000022','2025-06-08','disputed','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00023','ORG0017','CAM00047','TSK00070','ISS00093','observation','private-demo/evidence-00023.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000023','2025-06-12','unverified','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00024','ORG0019','CAM00049','TSK00073','ISS00097','photo','private-demo/evidence-00024.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000024','2025-06-16','submitted','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00025','ORG0021','CAM00051','TSK00076','ISS00001','document','private-demo/evidence-00025.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000025','2025-06-20','supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00026','ORG0023','CAM00053','TSK00079','ISS00005','measurement','private-demo/evidence-00026.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000026','2025-06-24','partially_supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00027','ORG0025','CAM00055','TSK00002','ISS00009','observation','private-demo/evidence-00027.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000027','2025-06-28','correction_requested','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00028','ORG0027','CAM00057','TSK00005','ISS00013','photo','private-demo/evidence-00028.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000028','2025-07-02','disputed','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00029','ORG0029','CAM00059','TSK00008','ISS00017','document','private-demo/evidence-00029.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000029','2025-07-06','unverified','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00030','ORG0001','CAM00061','TSK00011','ISS00021','measurement','private-demo/evidence-00030.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000030','2025-07-10','submitted','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00031','ORG0003','CAM00063','TSK00014','ISS00025','observation','private-demo/evidence-00031.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000031','2025-07-14','supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00032','ORG0005','CAM00065','TSK00017','ISS00029','photo','private-demo/evidence-00032.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000032','2025-07-18','partially_supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00033','ORG0007','CAM00067','TSK00020','ISS00033','document','private-demo/evidence-00033.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000033','2025-07-22','correction_requested','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00034','ORG0009','CAM00069','TSK00023','ISS00037','measurement','private-demo/evidence-00034.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000034','2025-07-26','disputed','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00035','ORG0001','CAM00001','TSK00026','ISS00041','observation','private-demo/evidence-00035.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000035','2025-07-30','unverified','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00036','ORG0003','CAM00003','TSK00029','ISS00045','photo','private-demo/evidence-00036.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000036','2025-08-03','submitted','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00037','ORG0005','CAM00005','TSK00032','ISS00049','document','private-demo/evidence-00037.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000037','2025-08-07','supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00038','ORG0007','CAM00007','TSK00035','ISS00053','measurement','private-demo/evidence-00038.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000038','2025-08-11','partially_supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00039','ORG0009','CAM00009','TSK00038','ISS00057','observation','private-demo/evidence-00039.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000039','2025-08-15','correction_requested','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00040','ORG0011','CAM00011','TSK00041','ISS00061','photo','private-demo/evidence-00040.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000040','2025-08-19','disputed','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00041','ORG0013','CAM00013','TSK00044','ISS00065','document','private-demo/evidence-00041.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000041','2025-08-23','unverified','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00042','ORG0015','CAM00015','TSK00047','ISS00069','measurement','private-demo/evidence-00042.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000042','2025-08-27','submitted','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00043','ORG0017','CAM00017','TSK00050','ISS00073','observation','private-demo/evidence-00043.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000043','2025-08-31','supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00044','ORG0019','CAM00019','TSK00053','ISS00077','photo','private-demo/evidence-00044.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000044','2025-09-04','partially_supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00045','ORG0021','CAM00021','TSK00056','ISS00081','document','private-demo/evidence-00045.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000045','2025-09-08','correction_requested','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00046','ORG0023','CAM00023','TSK00059','ISS00085','measurement','private-demo/evidence-00046.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000046','2025-09-12','disputed','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00047','ORG0025','CAM00025','TSK00062','ISS00089','observation','private-demo/evidence-00047.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000047','2025-09-16','unverified','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00048','ORG0027','CAM00027','TSK00065','ISS00093','photo','private-demo/evidence-00048.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000048','2025-09-20','submitted','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00049','ORG0029','CAM00029','TSK00068','ISS00097','document','private-demo/evidence-00049.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000049','2025-09-24','supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00050','ORG0001','CAM00031','TSK00071','ISS00001','measurement','private-demo/evidence-00050.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000050','2025-09-28','partially_supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00051','ORG0003','CAM00033','TSK00074','ISS00005','observation','private-demo/evidence-00051.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000051','2025-10-02','correction_requested','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00052','ORG0005','CAM00035','TSK00077','ISS00009','photo','private-demo/evidence-00052.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000052','2025-10-06','disputed','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00053','ORG0007','CAM00037','TSK00080','ISS00013','document','private-demo/evidence-00053.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000053','2025-10-10','unverified','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00054','ORG0009','CAM00039','TSK00003','ISS00017','measurement','private-demo/evidence-00054.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000054','2025-10-14','submitted','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo'),
('EVD00055','ORG0011','CAM00041','TSK00006','ISS00021','observation','private-demo/evidence-00055.bin','sha256-demo-0000000000000000000000000000000000000000000000000000000000000055','2025-10-18','supported','Placeholder metadata only; no actual photo/document included.','v1','synthetic_demo');

INSERT INTO `verification_reviews` (review_id,evidence_id,reviewer_ref,decision,rationale,reviewed_at,conflict_flag,data_source) VALUES
('REV00001','EVD00003','REVUSR00001','partially_supported','Demo reviewer rationale 1.','2025-03-27',0,'synthetic_demo'),
('REV00002','EVD00005','REVUSR00002','correction_requested','Demo reviewer rationale 2.','2025-04-01',0,'synthetic_demo'),
('REV00003','EVD00007','REVUSR00003','disputed','Demo reviewer rationale 3.','2025-04-06',0,'synthetic_demo'),
('REV00004','EVD00009','REVUSR00004','unverified','Demo reviewer rationale 4.','2025-04-11',0,'synthetic_demo'),
('REV00005','EVD00011','REVUSR00005','supported','Demo reviewer rationale 5.','2025-04-16',0,'synthetic_demo'),
('REV00006','EVD00013','REVUSR00006','partially_supported','Demo reviewer rationale 6.','2025-04-21',0,'synthetic_demo'),
('REV00007','EVD00015','REVUSR00007','correction_requested','Demo reviewer rationale 7.','2025-04-26',0,'synthetic_demo'),
('REV00008','EVD00017','REVUSR00008','disputed','Demo reviewer rationale 8.','2025-05-01',0,'synthetic_demo'),
('REV00009','EVD00019','REVUSR00009','unverified','Demo reviewer rationale 9.','2025-05-06',0,'synthetic_demo'),
('REV00010','EVD00021','REVUSR00010','supported','Demo reviewer rationale 10.','2025-05-11',0,'synthetic_demo'),
('REV00011','EVD00023','REVUSR00011','partially_supported','Demo reviewer rationale 11.','2025-05-16',0,'synthetic_demo'),
('REV00012','EVD00025','REVUSR00012','correction_requested','Demo reviewer rationale 12.','2025-05-21',0,'synthetic_demo'),
('REV00013','EVD00027','REVUSR00013','disputed','Demo reviewer rationale 13.','2025-05-26',1,'synthetic_demo'),
('REV00014','EVD00029','REVUSR00014','unverified','Demo reviewer rationale 14.','2025-05-31',0,'synthetic_demo'),
('REV00015','EVD00031','REVUSR00015','supported','Demo reviewer rationale 15.','2025-06-05',0,'synthetic_demo'),
('REV00016','EVD00033','REVUSR00016','partially_supported','Demo reviewer rationale 16.','2025-06-10',0,'synthetic_demo'),
('REV00017','EVD00035','REVUSR00017','correction_requested','Demo reviewer rationale 17.','2025-06-15',0,'synthetic_demo'),
('REV00018','EVD00037','REVUSR00018','disputed','Demo reviewer rationale 18.','2025-06-20',0,'synthetic_demo'),
('REV00019','EVD00039','REVUSR00019','unverified','Demo reviewer rationale 19.','2025-06-25',0,'synthetic_demo'),
('REV00020','EVD00041','REVUSR00020','supported','Demo reviewer rationale 20.','2025-06-30',0,'synthetic_demo'),
('REV00021','EVD00043','REVUSR00021','partially_supported','Demo reviewer rationale 21.','2025-07-05',0,'synthetic_demo'),
('REV00022','EVD00045','REVUSR00022','correction_requested','Demo reviewer rationale 22.','2025-07-10',0,'synthetic_demo'),
('REV00023','EVD00047','REVUSR00023','disputed','Demo reviewer rationale 23.','2025-07-15',0,'synthetic_demo'),
('REV00024','EVD00049','REVUSR00024','unverified','Demo reviewer rationale 24.','2025-07-20',0,'synthetic_demo'),
('REV00025','EVD00051','REVUSR00025','supported','Demo reviewer rationale 25.','2025-07-25',0,'synthetic_demo');

INSERT INTO `field_operations` (field_operation_id,campaign_id,task_id,coordinator_member_ref,scheduled_date,operation_status,measurement_type,measured_value,measurement_unit,field_notes,data_source) VALUES
('FLD00001','CAM00003','TSK00004','MEM0002','2025-04-06','in_progress','waste_collection',12,'items','Synthetic field note 1.','synthetic_demo'),
('FLD00002','CAM00005','TSK00007','MEM0003','2025-04-11','completed','tree_count',19,'trees','Synthetic field note 2.','synthetic_demo'),
('FLD00003','CAM00007','TSK00010','MEM0004','2025-04-16','blocked','people_reached',26,'people','Synthetic field note 3.','synthetic_demo'),
('FLD00004','CAM00009','TSK00013','MEM0005','2025-04-21','scheduled','sites_audited',33,'sites','Synthetic field note 4.','synthetic_demo'),
('FLD00005','CAM00011','TSK00016','MEM0006','2025-04-26','in_progress','site_inspection',40,'kg','Synthetic field note 5.','synthetic_demo'),
('FLD00006','CAM00013','TSK00019','MEM0007','2025-05-01','completed','waste_collection',47,'items','Synthetic field note 6.','synthetic_demo'),
('FLD00007','CAM00015','TSK00022','MEM0008','2025-05-06','blocked','tree_count',54,'trees','Synthetic field note 7.','synthetic_demo'),
('FLD00008','CAM00017','TSK00025','MEM0009','2025-05-11','scheduled','people_reached',61,'people','Synthetic field note 8.','synthetic_demo'),
('FLD00009','CAM00019','TSK00028','MEM0010','2025-05-16','in_progress','sites_audited',68,'sites','Synthetic field note 9.','synthetic_demo'),
('FLD00010','CAM00021','TSK00031','MEM0011','2025-05-21','completed','site_inspection',75,'kg','Synthetic field note 10.','synthetic_demo'),
('FLD00011','CAM00023','TSK00034','MEM0012','2025-05-26','blocked','waste_collection',82,'items','Synthetic field note 11.','synthetic_demo'),
('FLD00012','CAM00025','TSK00037','MEM0013','2025-05-31','scheduled','tree_count',89,'trees','Synthetic field note 12.','synthetic_demo'),
('FLD00013','CAM00027','TSK00040','MEM0014','2025-06-05','in_progress','people_reached',96,'people','Synthetic field note 13.','synthetic_demo'),
('FLD00014','CAM00029','TSK00043','MEM0015','2025-06-10','completed','sites_audited',103,'sites','Synthetic field note 14.','synthetic_demo'),
('FLD00015','CAM00031','TSK00046','MEM0016','2025-06-15','blocked','site_inspection',110,'kg','Synthetic field note 15.','synthetic_demo'),
('FLD00016','CAM00033','TSK00049','MEM0017','2025-06-20','scheduled','waste_collection',117,'items','Synthetic field note 16.','synthetic_demo'),
('FLD00017','CAM00035','TSK00052','MEM0018','2025-06-25','in_progress','tree_count',124,'trees','Synthetic field note 17.','synthetic_demo'),
('FLD00018','CAM00037','TSK00055','MEM0019','2025-06-30','completed','people_reached',11,'people','Synthetic field note 18.','synthetic_demo'),
('FLD00019','CAM00039','TSK00058','MEM0020','2025-07-05','blocked','sites_audited',18,'sites','Synthetic field note 19.','synthetic_demo'),
('FLD00020','CAM00041','TSK00061','MEM0021','2025-07-10','scheduled','site_inspection',25,'kg','Synthetic field note 20.','synthetic_demo'),
('FLD00021','CAM00043','TSK00064','MEM0022','2025-07-15','in_progress','waste_collection',32,'items','Synthetic field note 21.','synthetic_demo'),
('FLD00022','CAM00045','TSK00067','MEM0023','2025-07-20','completed','tree_count',39,'trees','Synthetic field note 22.','synthetic_demo'),
('FLD00023','CAM00047','TSK00070','MEM0024','2025-07-25','blocked','people_reached',46,'people','Synthetic field note 23.','synthetic_demo'),
('FLD00024','CAM00049','TSK00073','MEM0025','2025-07-30','scheduled','sites_audited',53,'sites','Synthetic field note 24.','synthetic_demo'),
('FLD00025','CAM00051','TSK00076','MEM0026','2025-08-04','in_progress','site_inspection',60,'kg','Synthetic field note 25.','synthetic_demo');

INSERT INTO `impact_measurements` (measurement_id,campaign_id,organization_id,metric_name,planned_value,metric_unit,delivered_value,verification_status,evidence_id,measured_at,data_source) VALUES
('IMP00001','CAM00004','ORG0004','volunteers_participated',17,'people',10,'partially_verified','EVD00003','2025-04-17','synthetic_demo'),
('IMP00002','CAM00007','ORG0007','sites_inspected',24,'sites',15,'verified','EVD00005','2025-04-23','synthetic_demo'),
('IMP00003','CAM00010','ORG0010','people_reached',31,'people',20,'unverified','EVD00007','2025-04-29','synthetic_demo'),
('IMP00004','CAM00013','ORG0013','trees_planted',38,'trees',25,'partially_verified','EVD00009','2025-05-05','synthetic_demo'),
('IMP00005','CAM00016','ORG0016','waste_collected',45,'kg',30,'verified','EVD00011','2025-05-11','synthetic_demo'),
('IMP00006','CAM00019','ORG0019','volunteers_participated',52,'people',35,'unverified','EVD00013','2025-05-17','synthetic_demo'),
('IMP00007','CAM00022','ORG0022','sites_inspected',59,'sites',40,'partially_verified','EVD00015','2025-05-23','synthetic_demo'),
('IMP00008','CAM00025','ORG0025','people_reached',66,'people',45,'verified','EVD00017','2025-05-29','synthetic_demo'),
('IMP00009','CAM00028','ORG0028','trees_planted',73,'trees',50,'unverified','EVD00019','2025-06-04','synthetic_demo'),
('IMP00010','CAM00031','ORG0001','waste_collected',80,'kg',55,'partially_verified','EVD00021','2025-06-10','synthetic_demo'),
('IMP00011','CAM00034','ORG0004','volunteers_participated',87,'people',60,'verified','EVD00023','2025-06-16','synthetic_demo'),
('IMP00012','CAM00037','ORG0007','sites_inspected',94,'sites',65,'unverified','EVD00025','2025-06-22','synthetic_demo'),
('IMP00013','CAM00040','ORG0010','people_reached',101,'people',70,'partially_verified','EVD00027','2025-06-28','synthetic_demo'),
('IMP00014','CAM00043','ORG0013','trees_planted',108,'trees',75,'verified','EVD00029','2025-07-04','synthetic_demo'),
('IMP00015','CAM00046','ORG0016','waste_collected',15,'kg',80,'unverified','EVD00031','2025-07-10','synthetic_demo'),
('IMP00016','CAM00049','ORG0019','volunteers_participated',22,'people',85,'partially_verified','EVD00033','2025-07-16','synthetic_demo'),
('IMP00017','CAM00052','ORG0022','sites_inspected',29,'sites',90,'verified','EVD00035','2025-07-22','synthetic_demo'),
('IMP00018','CAM00055','ORG0025','people_reached',36,'people',5,'unverified','EVD00037','2025-07-28','synthetic_demo'),
('IMP00019','CAM00058','ORG0028','trees_planted',43,'trees',10,'partially_verified','EVD00039','2025-08-03','synthetic_demo'),
('IMP00020','CAM00061','ORG0001','waste_collected',50,'kg',15,'verified','EVD00041','2025-08-09','synthetic_demo'),
('IMP00021','CAM00064','ORG0004','volunteers_participated',57,'people',20,'unverified','EVD00043','2025-08-15','synthetic_demo'),
('IMP00022','CAM00067','ORG0007','sites_inspected',64,'sites',25,'partially_verified','EVD00045','2025-08-21','synthetic_demo'),
('IMP00023','CAM00070','ORG0010','people_reached',71,'people',30,'verified','EVD00047','2025-08-27','synthetic_demo'),
('IMP00024','CAM00003','ORG0003','trees_planted',78,'trees',35,'unverified','EVD00049','2025-09-02','synthetic_demo'),
('IMP00025','CAM00006','ORG0006','waste_collected',85,'kg',40,'partially_verified','EVD00051','2025-09-08','synthetic_demo');

INSERT INTO `contribution_records` (contribution_id,organization_id,campaign_id,contribution_type,contribution_status,quantity,unit,recorded_at,data_source) VALUES
('CON00001','ORG0003','CAM00003','volunteer_coordination','verified',14,'contribution_units','2025-04-28','synthetic_demo'),
('CON00002','ORG0005','CAM00005','verified_cleanup','rejected',27,'contribution_units','2025-05-05','synthetic_demo'),
('CON00003','ORG0007','CAM00007','community_training','reversed',40,'contribution_units','2025-05-12','synthetic_demo'),
('CON00004','ORG0009','CAM00009','partner_support','pending_verification',53,'contribution_units','2025-05-19','synthetic_demo'),
('CON00005','ORG0011','CAM00011','campaign_delivery','verified',66,'contribution_units','2025-05-26','synthetic_demo'),
('CON00006','ORG0013','CAM00013','volunteer_coordination','rejected',79,'contribution_units','2025-06-02','synthetic_demo'),
('CON00007','ORG0015','CAM00015','verified_cleanup','reversed',92,'contribution_units','2025-06-09','synthetic_demo'),
('CON00008','ORG0017','CAM00017','community_training','pending_verification',5,'contribution_units','2025-06-16','synthetic_demo'),
('CON00009','ORG0019','CAM00019','partner_support','verified',18,'contribution_units','2025-06-23','synthetic_demo'),
('CON00010','ORG0021','CAM00021','campaign_delivery','rejected',31,'contribution_units','2025-06-30','synthetic_demo'),
('CON00011','ORG0023','CAM00023','volunteer_coordination','reversed',44,'contribution_units','2025-07-07','synthetic_demo'),
('CON00012','ORG0025','CAM00025','verified_cleanup','pending_verification',57,'contribution_units','2025-07-14','synthetic_demo'),
('CON00013','ORG0027','CAM00027','community_training','verified',70,'contribution_units','2025-07-21','synthetic_demo'),
('CON00014','ORG0029','CAM00029','partner_support','rejected',83,'contribution_units','2025-07-28','synthetic_demo'),
('CON00015','ORG0001','CAM00031','campaign_delivery','reversed',96,'contribution_units','2025-08-04','synthetic_demo'),
('CON00016','ORG0003','CAM00033','volunteer_coordination','pending_verification',9,'contribution_units','2025-08-11','synthetic_demo'),
('CON00017','ORG0005','CAM00035','verified_cleanup','verified',22,'contribution_units','2025-08-18','synthetic_demo'),
('CON00018','ORG0007','CAM00037','community_training','rejected',35,'contribution_units','2025-08-25','synthetic_demo'),
('CON00019','ORG0009','CAM00039','partner_support','reversed',48,'contribution_units','2025-09-01','synthetic_demo'),
('CON00020','ORG0011','CAM00041','campaign_delivery','pending_verification',61,'contribution_units','2025-09-08','synthetic_demo'),
('CON00021','ORG0013','CAM00043','volunteer_coordination','verified',74,'contribution_units','2025-09-15','synthetic_demo'),
('CON00022','ORG0015','CAM00045','verified_cleanup','rejected',87,'contribution_units','2025-09-22','synthetic_demo'),
('CON00023','ORG0017','CAM00047','community_training','reversed',100,'contribution_units','2025-09-29','synthetic_demo'),
('CON00024','ORG0019','CAM00049','partner_support','pending_verification',13,'contribution_units','2025-10-06','synthetic_demo'),
('CON00025','ORG0021','CAM00051','campaign_delivery','verified',26,'contribution_units','2025-10-13','synthetic_demo');

INSERT INTO `recognition_records` (recognition_id,contribution_id,organization_id,recognition_type,recognition_status,demo_certificate_ref,issued_at,data_source) VALUES
('REC00001','CON00001','ORG0003','public_recognition','issued','DEMO-CERT-00001','2025-05-09','synthetic_demo'),
('REC00002','CON00002','ORG0005','case_study_candidate','pending_review',NULL,'2025-05-17','synthetic_demo'),
('REC00003','CON00003','ORG0007','collaboration_badge','revoked',NULL,'2025-05-25','synthetic_demo'),
('REC00004','CON00004','ORG0009','certificate','eligible',NULL,'2025-06-02','synthetic_demo'),
('REC00005','CON00005','ORG0011','public_recognition','issued','DEMO-CERT-00005','2025-06-10','synthetic_demo'),
('REC00006','CON00006','ORG0013','case_study_candidate','pending_review',NULL,'2025-06-18','synthetic_demo'),
('REC00007','CON00007','ORG0015','collaboration_badge','revoked',NULL,'2025-06-26','synthetic_demo'),
('REC00008','CON00008','ORG0017','certificate','eligible',NULL,'2025-07-04','synthetic_demo'),
('REC00009','CON00009','ORG0019','public_recognition','issued','DEMO-CERT-00009','2025-07-12','synthetic_demo'),
('REC00010','CON00010','ORG0021','case_study_candidate','pending_review',NULL,'2025-07-20','synthetic_demo'),
('REC00011','CON00011','ORG0023','collaboration_badge','revoked',NULL,'2025-07-28','synthetic_demo'),
('REC00012','CON00012','ORG0025','certificate','eligible',NULL,'2025-08-05','synthetic_demo'),
('REC00013','CON00013','ORG0027','public_recognition','issued','DEMO-CERT-00013','2025-08-13','synthetic_demo'),
('REC00014','CON00014','ORG0029','case_study_candidate','pending_review',NULL,'2025-08-21','synthetic_demo'),
('REC00015','CON00015','ORG0001','collaboration_badge','revoked',NULL,'2025-08-29','synthetic_demo');

INSERT INTO `follow_up_checks` (follow_up_id,campaign_id,issue_id,due_date,follow_up_status,observation,recurrence_flag,data_source) VALUES
('FUP00001','CAM00003','ISS00004','2025-06-09','completed','Demo follow-up observation 1.',0,'synthetic_demo'),
('FUP00002','CAM00005','ISS00007','2025-06-18','overdue','Demo follow-up observation 2.',0,'synthetic_demo'),
('FUP00003','CAM00007','ISS00010','2025-06-27','cancelled','Demo follow-up observation 3.',0,'synthetic_demo'),
('FUP00004','CAM00009','ISS00013','2025-07-06','scheduled','Demo follow-up observation 4.',0,'synthetic_demo'),
('FUP00005','CAM00011','ISS00016','2025-07-15','completed','Demo follow-up observation 5.',1,'synthetic_demo'),
('FUP00006','CAM00013','ISS00019','2025-07-24','overdue','Demo follow-up observation 6.',0,'synthetic_demo'),
('FUP00007','CAM00015','ISS00022','2025-08-02','cancelled','Demo follow-up observation 7.',0,'synthetic_demo'),
('FUP00008','CAM00017','ISS00025','2025-08-11','scheduled','Demo follow-up observation 8.',0,'synthetic_demo'),
('FUP00009','CAM00019','ISS00028','2025-08-20','completed','Demo follow-up observation 9.',0,'synthetic_demo'),
('FUP00010','CAM00021','ISS00031','2025-08-29','overdue','Demo follow-up observation 10.',1,'synthetic_demo'),
('FUP00011','CAM00023','ISS00034','2025-09-07','cancelled','Demo follow-up observation 11.',0,'synthetic_demo'),
('FUP00012','CAM00025','ISS00037','2025-09-16','scheduled','Demo follow-up observation 12.',0,'synthetic_demo'),
('FUP00013','CAM00027','ISS00040','2025-09-25','completed','Demo follow-up observation 13.',0,'synthetic_demo'),
('FUP00014','CAM00029','ISS00043','2025-10-04','overdue','Demo follow-up observation 14.',0,'synthetic_demo'),
('FUP00015','CAM00031','ISS00046','2025-10-13','cancelled','Demo follow-up observation 15.',1,'synthetic_demo');

INSERT INTO `government_coordination_requests` (coordination_request_id,organization_id,issue_id,campaign_id,department_name,request_type,request_status,submitted_at,responded_at,request_details,demo_reference,data_source) VALUES
('GCR00001','ORG0003','ISS00004','CAM00003','Public Works Department','inspection','acknowledged','2025-05-17',NULL,'Demo coordination request 1; not sent to a real department.','DEMO-REF-00001','synthetic_demo'),
('GCR00002','ORG0005','ISS00007','CAM00005','Water Supply Department','official_response','in_progress','2025-05-23',NULL,'Demo coordination request 2; not sent to a real department.','DEMO-REF-00002','synthetic_demo'),
('GCR00003','ORG0007','ISS00010','CAM00007','Health Department','dependency_blocker','responded','2025-05-29','2025-06-03','Demo coordination request 3; not sent to a real department.','DEMO-REF-00003','synthetic_demo'),
('GCR00004','ORG0009','ISS00013','CAM00009','Education Department','assistance','closed','2025-06-04',NULL,'Demo coordination request 4; not sent to a real department.','DEMO-REF-00004','synthetic_demo'),
('GCR00005','ORG0011','ISS00016','CAM00011','Environment Department','inspection','rejected','2025-06-10',NULL,'Demo coordination request 5; not sent to a real department.','DEMO-REF-00005','synthetic_demo'),
('GCR00006','ORG0013','ISS00019','CAM00013','Social Welfare Department','official_response','submitted','2025-06-16','2025-06-21','Demo coordination request 6; not sent to a real department.','DEMO-REF-00006','synthetic_demo'),
('GCR00007','ORG0015','ISS00022','CAM00015','Municipal Corporation','dependency_blocker','acknowledged','2025-06-22',NULL,'Demo coordination request 7; not sent to a real department.','DEMO-REF-00007','synthetic_demo'),
('GCR00008','ORG0017','ISS00025','CAM00017','Public Works Department','assistance','in_progress','2025-06-28',NULL,'Demo coordination request 8; not sent to a real department.','DEMO-REF-00008','synthetic_demo'),
('GCR00009','ORG0019','ISS00028','CAM00019','Water Supply Department','inspection','responded','2025-07-04','2025-07-09','Demo coordination request 9; not sent to a real department.','DEMO-REF-00009','synthetic_demo'),
('GCR00010','ORG0021','ISS00031','CAM00021','Health Department','official_response','closed','2025-07-10',NULL,'Demo coordination request 10; not sent to a real department.','DEMO-REF-00010','synthetic_demo'),
('GCR00011','ORG0023','ISS00034','CAM00023','Education Department','dependency_blocker','rejected','2025-07-16',NULL,'Demo coordination request 11; not sent to a real department.','DEMO-REF-00011','synthetic_demo'),
('GCR00012','ORG0025','ISS00037','CAM00025','Environment Department','assistance','submitted','2025-07-22','2025-07-27','Demo coordination request 12; not sent to a real department.','DEMO-REF-00012','synthetic_demo'),
('GCR00013','ORG0027','ISS00040','CAM00027','Social Welfare Department','inspection','acknowledged','2025-07-28',NULL,'Demo coordination request 13; not sent to a real department.','DEMO-REF-00013','synthetic_demo'),
('GCR00014','ORG0029','ISS00043','CAM00029','Municipal Corporation','official_response','in_progress','2025-08-03',NULL,'Demo coordination request 14; not sent to a real department.','DEMO-REF-00014','synthetic_demo'),
('GCR00015','ORG0001','ISS00046','CAM00031','Public Works Department','dependency_blocker','responded','2025-08-09','2025-08-14','Demo coordination request 15; not sent to a real department.','DEMO-REF-00015','synthetic_demo'),
('GCR00016','ORG0003','ISS00049','CAM00033','Water Supply Department','assistance','closed','2025-08-15',NULL,'Demo coordination request 16; not sent to a real department.','DEMO-REF-00016','synthetic_demo'),
('GCR00017','ORG0005','ISS00052','CAM00035','Health Department','inspection','rejected','2025-08-21',NULL,'Demo coordination request 17; not sent to a real department.','DEMO-REF-00017','synthetic_demo'),
('GCR00018','ORG0007','ISS00055','CAM00037','Education Department','official_response','submitted','2025-08-27','2025-09-01','Demo coordination request 18; not sent to a real department.','DEMO-REF-00018','synthetic_demo'),
('GCR00019','ORG0009','ISS00058','CAM00039','Environment Department','dependency_blocker','acknowledged','2025-09-02',NULL,'Demo coordination request 19; not sent to a real department.','DEMO-REF-00019','synthetic_demo'),
('GCR00020','ORG0011','ISS00061','CAM00041','Social Welfare Department','assistance','in_progress','2025-09-08',NULL,'Demo coordination request 20; not sent to a real department.','DEMO-REF-00020','synthetic_demo');

INSERT INTO `partnership_requests` (partnership_request_id,requesting_organization_id,target_organization_id,campaign_id,request_type,request_status,requested_at,scope_notes,data_source) VALUES
('PAR00001','ORG0001','ORG0011','CAM00003','joint_campaign','accepted','2025-05-26','Demo partnership scope 1.','synthetic_demo'),
('PAR00002','ORG0002','ORG0018','CAM00005','resource_sharing','declined','2025-05-31','Demo partnership scope 2.','synthetic_demo'),
('PAR00003','ORG0003','ORG0025','CAM00007','expertise','withdrawn','2025-06-05','Demo partnership scope 3.','synthetic_demo'),
('PAR00004','ORG0004','ORG0002','CAM00009','collaboration','pending','2025-06-10','Demo partnership scope 4.','synthetic_demo'),
('PAR00005','ORG0005','ORG0009','CAM00011','joint_campaign','accepted','2025-06-15','Demo partnership scope 5.','synthetic_demo'),
('PAR00006','ORG0006','ORG0016','CAM00013','resource_sharing','declined','2025-06-20','Demo partnership scope 6.','synthetic_demo'),
('PAR00007','ORG0007','ORG0023','CAM00015','expertise','withdrawn','2025-06-25','Demo partnership scope 7.','synthetic_demo'),
('PAR00008','ORG0008','ORG0030','CAM00017','collaboration','pending','2025-06-30','Demo partnership scope 8.','synthetic_demo'),
('PAR00009','ORG0009','ORG0007','CAM00019','joint_campaign','accepted','2025-07-05','Demo partnership scope 9.','synthetic_demo'),
('PAR00010','ORG0010','ORG0014','CAM00021','resource_sharing','declined','2025-07-10','Demo partnership scope 10.','synthetic_demo'),
('PAR00011','ORG0011','ORG0021','CAM00023','expertise','withdrawn','2025-07-15','Demo partnership scope 11.','synthetic_demo'),
('PAR00012','ORG0012','ORG0028','CAM00025','collaboration','pending','2025-07-20','Demo partnership scope 12.','synthetic_demo'),
('PAR00013','ORG0013','ORG0005','CAM00027','joint_campaign','accepted','2025-07-25','Demo partnership scope 13.','synthetic_demo'),
('PAR00014','ORG0014','ORG0012','CAM00029','resource_sharing','declined','2025-07-30','Demo partnership scope 14.','synthetic_demo'),
('PAR00015','ORG0015','ORG0019','CAM00031','expertise','withdrawn','2025-08-04','Demo partnership scope 15.','synthetic_demo'),
('PAR00016','ORG0016','ORG0026','CAM00033','collaboration','pending','2025-08-09','Demo partnership scope 16.','synthetic_demo'),
('PAR00017','ORG0017','ORG0003','CAM00035','joint_campaign','accepted','2025-08-14','Demo partnership scope 17.','synthetic_demo'),
('PAR00018','ORG0018','ORG0010','CAM00037','resource_sharing','declined','2025-08-19','Demo partnership scope 18.','synthetic_demo'),
('PAR00019','ORG0019','ORG0017','CAM00039','expertise','withdrawn','2025-08-24','Demo partnership scope 19.','synthetic_demo'),
('PAR00020','ORG0020','ORG0024','CAM00041','collaboration','pending','2025-08-29','Demo partnership scope 20.','synthetic_demo');

INSERT INTO `resource_requests` (resource_request_id,organization_id,campaign_id,resource_category,quantity,quantity_unit,location_city,deadline,request_status,record_kind,intended_use,data_source) VALUES
('RSR00001','ORG0004','CAM00003','waste_bags',4,'people','Pune','2025-06-17','matched','request','Demo intended use 1; no payments or financial marketplace.','synthetic_demo'),
('RSR00002','ORG0007','CAM00005','transport',7,'sets','Gaya','2025-06-24','partially_fulfilled','request','Demo intended use 2; no payments or financial marketplace.','synthetic_demo'),
('RSR00003','ORG0010','CAM00007','first_aid_kits',10,'hours','Bengaluru','2025-07-01','fulfilled','request','Demo intended use 3; no payments or financial marketplace.','synthetic_demo'),
('RSR00004','ORG0013','CAM00009','venue_space',13,'units','Lucknow','2025-07-08','cancelled','request','Demo intended use 4; no payments or financial marketplace.','synthetic_demo'),
('RSR00005','ORG0016','CAM00011','volunteers',16,'people','Pune','2025-07-15','disputed','request','Demo intended use 5; no payments or financial marketplace.','synthetic_demo'),
('RSR00006','ORG0019','CAM00013','water_filters',19,'sets','Gaya','2025-07-22','open','request','Demo intended use 6; no payments or financial marketplace.','synthetic_demo'),
('RSR00007','ORG0022','CAM00015','accessibility_ramps',22,'hours','Bengaluru','2025-07-29','matched','request','Demo intended use 7; no payments or financial marketplace.','synthetic_demo'),
('RSR00008','ORG0025','CAM00017','training_materials',25,'units','Lucknow','2025-08-05','partially_fulfilled','request','Demo intended use 8; no payments or financial marketplace.','synthetic_demo'),
('RSR00009','ORG0028','CAM00019','protective_equipment',28,'people','Pune','2025-08-12','fulfilled','request','Demo intended use 9; no payments or financial marketplace.','synthetic_demo'),
('RSR00010','ORG0001','CAM00021','gloves',31,'sets','Lucknow','2025-08-19','cancelled','request','Demo intended use 10; no payments or financial marketplace.','synthetic_demo'),
('RSR00011','ORG0004','CAM00023','waste_bags',34,'hours','Pune','2025-08-26','disputed','request','Demo intended use 11; no payments or financial marketplace.','synthetic_demo'),
('RSR00012','ORG0007','CAM00025','transport',37,'units','Gaya','2025-09-02','open','request','Demo intended use 12; no payments or financial marketplace.','synthetic_demo'),
('RSR00013','ORG0010','CAM00027','first_aid_kits',40,'people','Bengaluru','2025-09-09','matched','request','Demo intended use 13; no payments or financial marketplace.','synthetic_demo'),
('RSR00014','ORG0013','CAM00029','venue_space',43,'sets','Lucknow','2025-09-16','partially_fulfilled','request','Demo intended use 14; no payments or financial marketplace.','synthetic_demo'),
('RSR00015','ORG0016','CAM00031','volunteers',46,'hours','Pune','2025-09-23','fulfilled','request','Demo intended use 15; no payments or financial marketplace.','synthetic_demo'),
('RSR00016','ORG0019','CAM00033','water_filters',49,'units','Gaya','2025-09-30','cancelled','request','Demo intended use 16; no payments or financial marketplace.','synthetic_demo'),
('RSR00017','ORG0022','CAM00035','accessibility_ramps',52,'people','Bengaluru','2025-10-07','disputed','request','Demo intended use 17; no payments or financial marketplace.','synthetic_demo'),
('RSR00018','ORG0025','CAM00037','training_materials',55,'sets','Lucknow','2025-10-14','open','request','Demo intended use 18; no payments or financial marketplace.','synthetic_demo'),
('RSR00019','ORG0028','CAM00039','protective_equipment',58,'hours','Pune','2025-10-21','matched','request','Demo intended use 19; no payments or financial marketplace.','synthetic_demo'),
('RSR00020','ORG0001','CAM00041','gloves',61,'units','Lucknow','2025-10-28','partially_fulfilled','request','Demo intended use 20; no payments or financial marketplace.','synthetic_demo');

INSERT INTO `resource_offers` (resource_offer_id,organization_id,resource_category,quantity,quantity_unit,location_city,offer_status,available_until,data_source) VALUES
('RSO00001','ORG0003','first_aid_kits',6,'people','Varanasi','reserved','2025-07-08','synthetic_demo'),
('RSO00002','ORG0005','water_filters',11,'sets','Nagpur','delivered','2025-07-16','synthetic_demo'),
('RSO00003','ORG0007','protective_equipment',16,'hours','Gaya','withdrawn','2025-07-24','synthetic_demo'),
('RSO00004','ORG0009','transport',21,'units','Coimbatore','available','2025-08-01','synthetic_demo'),
('RSO00005','ORG0011','volunteers',26,'people','Jaipur','reserved','2025-08-09','synthetic_demo'),
('RSO00006','ORG0013','training_materials',31,'sets','Lucknow','delivered','2025-08-17','synthetic_demo'),
('RSO00007','ORG0015','waste_bags',36,'hours','Varanasi','withdrawn','2025-08-25','synthetic_demo'),
('RSO00008','ORG0017','venue_space',41,'units','Nagpur','available','2025-09-02','synthetic_demo'),
('RSO00009','ORG0019','accessibility_ramps',46,'people','Gaya','reserved','2025-09-10','synthetic_demo'),
('RSO00010','ORG0021','gloves',1,'sets','Coimbatore','delivered','2025-09-18','synthetic_demo');

INSERT INTO `community_resources` (resource_id,organization_id,campaign_id,content_type,title,body,publication_status,public_visible,data_source) VALUES
('CRS00001','ORG0001','CAM00003','educational_material','Demo community resource 001','Review before publication; synthetic content for campaign CAM00003.','published',1,'synthetic_demo'),
('CRS00002','ORG0002','CAM00005','training','Demo community resource 002','Review before publication; synthetic content for campaign CAM00005.','under_review',1,'synthetic_demo'),
('CRS00003','ORG0003','CAM00007','resource_directory','Demo community resource 003','Review before publication; synthetic content for campaign CAM00007.','archived',1,'synthetic_demo'),
('CRS00004','ORG0004','CAM00009','progress_update','Demo community resource 004','Review before publication; synthetic content for campaign CAM00009.','draft',0,'synthetic_demo'),
('CRS00005','ORG0005','CAM00011','announcement','Demo community resource 005','Review before publication; synthetic content for campaign CAM00011.','published',1,'synthetic_demo'),
('CRS00006','ORG0006','CAM00013','educational_material','Demo community resource 006','Review before publication; synthetic content for campaign CAM00013.','under_review',1,'synthetic_demo'),
('CRS00007','ORG0007','CAM00015','training','Demo community resource 007','Review before publication; synthetic content for campaign CAM00015.','archived',1,'synthetic_demo'),
('CRS00008','ORG0008','CAM00017','resource_directory','Demo community resource 008','Review before publication; synthetic content for campaign CAM00017.','draft',0,'synthetic_demo'),
('CRS00009','ORG0009','CAM00019','progress_update','Demo community resource 009','Review before publication; synthetic content for campaign CAM00019.','published',1,'synthetic_demo'),
('CRS00010','ORG0010','CAM00021','announcement','Demo community resource 010','Review before publication; synthetic content for campaign CAM00021.','under_review',1,'synthetic_demo'),
('CRS00011','ORG0011','CAM00023','educational_material','Demo community resource 011','Review before publication; synthetic content for campaign CAM00023.','archived',1,'synthetic_demo'),
('CRS00012','ORG0012','CAM00025','training','Demo community resource 012','Review before publication; synthetic content for campaign CAM00025.','draft',0,'synthetic_demo'),
('CRS00013','ORG0013','CAM00027','resource_directory','Demo community resource 013','Review before publication; synthetic content for campaign CAM00027.','published',1,'synthetic_demo'),
('CRS00014','ORG0014','CAM00029','progress_update','Demo community resource 014','Review before publication; synthetic content for campaign CAM00029.','under_review',1,'synthetic_demo'),
('CRS00015','ORG0015','CAM00031','announcement','Demo community resource 015','Review before publication; synthetic content for campaign CAM00031.','archived',1,'synthetic_demo'),
('CRS00016','ORG0016','CAM00033','educational_material','Demo community resource 016','Review before publication; synthetic content for campaign CAM00033.','draft',0,'synthetic_demo'),
('CRS00017','ORG0017','CAM00035','training','Demo community resource 017','Review before publication; synthetic content for campaign CAM00035.','published',1,'synthetic_demo'),
('CRS00018','ORG0018','CAM00037','resource_directory','Demo community resource 018','Review before publication; synthetic content for campaign CAM00037.','under_review',1,'synthetic_demo'),
('CRS00019','ORG0019','CAM00039','progress_update','Demo community resource 019','Review before publication; synthetic content for campaign CAM00039.','archived',1,'synthetic_demo'),
('CRS00020','ORG0020','CAM00041','announcement','Demo community resource 020','Review before publication; synthetic content for campaign CAM00041.','draft',0,'synthetic_demo');

INSERT INTO `community_feedback` (feedback_id,campaign_id,organization_id,rating,feedback_type,feedback_text,feedback_status,submitted_at,data_source) VALUES
('FBK00001','CAM00004','ORG0001',2,'suggestion','Synthetic community feedback 1.','reviewed','2025-07-17','synthetic_demo'),
('FBK00002','CAM00007','ORG0002',3,'concern','Synthetic community feedback 2.','actioned','2025-07-24','synthetic_demo'),
('FBK00003','CAM00010','ORG0003',4,'safeguarding','Synthetic community feedback 3.','closed','2025-07-31','synthetic_demo'),
('FBK00004','CAM00013','ORG0004',5,'positive','Synthetic community feedback 4.','new','2025-08-07','synthetic_demo'),
('FBK00005','CAM00016','ORG0005',1,'suggestion','Synthetic community feedback 5.','reviewed','2025-08-14','synthetic_demo'),
('FBK00006','CAM00019','ORG0006',2,'concern','Synthetic community feedback 6.','actioned','2025-08-21','synthetic_demo'),
('FBK00007','CAM00022','ORG0007',3,'safeguarding','Synthetic community feedback 7.','closed','2025-08-28','synthetic_demo'),
('FBK00008','CAM00025','ORG0008',4,'positive','Synthetic community feedback 8.','new','2025-09-04','synthetic_demo'),
('FBK00009','CAM00028','ORG0009',5,'suggestion','Synthetic community feedback 9.','reviewed','2025-09-11','synthetic_demo'),
('FBK00010','CAM00031','ORG0010',1,'concern','Synthetic community feedback 10.','actioned','2025-09-18','synthetic_demo'),
('FBK00011','CAM00034','ORG0011',2,'safeguarding','Synthetic community feedback 11.','closed','2025-09-25','synthetic_demo'),
('FBK00012','CAM00037','ORG0012',3,'positive','Synthetic community feedback 12.','new','2025-10-02','synthetic_demo'),
('FBK00013','CAM00040','ORG0013',4,'suggestion','Synthetic community feedback 13.','reviewed','2025-10-09','synthetic_demo'),
('FBK00014','CAM00043','ORG0014',5,'concern','Synthetic community feedback 14.','actioned','2025-10-16','synthetic_demo'),
('FBK00015','CAM00046','ORG0015',1,'safeguarding','Synthetic community feedback 15.','closed','2025-10-23','synthetic_demo');

INSERT INTO `notifications` (notification_id,organization_id,recipient_member_ref,event_type,title,related_reference,is_read,created_at,data_source) VALUES
('NTF00001','ORG0001','MEM0002','campaign_update','Demo notification 1','DEMO-REF-00001',0,'2025-07-23','synthetic_demo'),
('NTF00002','ORG0002','MEM0003','volunteer_change','Demo notification 2','DEMO-REF-00002',0,'2025-07-26','synthetic_demo'),
('NTF00003','ORG0003','MEM0004','evidence_review','Demo notification 3','DEMO-REF-00003',1,'2025-07-29','synthetic_demo'),
('NTF00004','ORG0004','MEM0005','government_response','Demo notification 4','DEMO-REF-00004',0,'2025-08-01','synthetic_demo'),
('NTF00005','ORG0005','MEM0006','partner_invitation','Demo notification 5','DEMO-REF-00005',0,'2025-08-04','synthetic_demo'),
('NTF00006','ORG0006','MEM0007','resource_update','Demo notification 6','DEMO-REF-00006',1,'2025-08-07','synthetic_demo'),
('NTF00007','ORG0007','MEM0008','follow_up','Demo notification 7','DEMO-REF-00007',0,'2025-08-10','synthetic_demo'),
('NTF00008','ORG0008','MEM0009','security_alert','Demo notification 8','DEMO-REF-00008',0,'2025-08-13','synthetic_demo'),
('NTF00009','ORG0009','MEM0010','verification_update','Demo notification 9','DEMO-REF-00009',1,'2025-08-16','synthetic_demo'),
('NTF00010','ORG0010','MEM0011','campaign_update','Demo notification 10','DEMO-REF-00010',0,'2025-08-19','synthetic_demo'),
('NTF00011','ORG0011','MEM0012','volunteer_change','Demo notification 11','DEMO-REF-00011',0,'2025-08-22','synthetic_demo'),
('NTF00012','ORG0012','MEM0013','evidence_review','Demo notification 12','DEMO-REF-00012',1,'2025-08-25','synthetic_demo'),
('NTF00013','ORG0013','MEM0014','government_response','Demo notification 13','DEMO-REF-00013',0,'2025-08-28','synthetic_demo'),
('NTF00014','ORG0014','MEM0015','partner_invitation','Demo notification 14','DEMO-REF-00014',0,'2025-08-31','synthetic_demo'),
('NTF00015','ORG0015','MEM0016','resource_update','Demo notification 15','DEMO-REF-00015',1,'2025-09-03','synthetic_demo');

INSERT INTO `complaints_and_disputes` (case_id,organization_id,campaign_id,case_type,severity,case_status,restricted_summary,opened_at,demo_case_reference,data_source) VALUES
('CDS00001','ORG0001','CAM00003','safety_incident','medium','under_review','Restricted synthetic case summary 1.','2025-08-08','CASE-DEMO-00001','synthetic_demo'),
('CDS00002','ORG0002','CAM00005','attribution_dispute','high','awaiting_response','Restricted synthetic case summary 2.','2025-08-17','CASE-DEMO-00002','synthetic_demo'),
('CDS00003','ORG0003','CAM00007','evidence_appeal','critical','resolved','Restricted synthetic case summary 3.','2025-08-26','CASE-DEMO-00003','synthetic_demo'),
('CDS00004','ORG0004','CAM00009','restriction_appeal','low','dismissed','Restricted synthetic case summary 4.','2025-09-04','CASE-DEMO-00004','synthetic_demo'),
('CDS00005','ORG0005','CAM00011','complaint','medium','open','Restricted synthetic case summary 5.','2025-09-13','CASE-DEMO-00005','synthetic_demo'),
('CDS00006','ORG0006','CAM00013','safety_incident','high','under_review','Restricted synthetic case summary 6.','2025-09-22','CASE-DEMO-00006','synthetic_demo'),
('CDS00007','ORG0007','CAM00015','attribution_dispute','critical','awaiting_response','Restricted synthetic case summary 7.','2025-10-01','CASE-DEMO-00007','synthetic_demo'),
('CDS00008','ORG0008','CAM00017','evidence_appeal','low','resolved','Restricted synthetic case summary 8.','2025-10-10','CASE-DEMO-00008','synthetic_demo'),
('CDS00009','ORG0009','CAM00019','restriction_appeal','medium','dismissed','Restricted synthetic case summary 9.','2025-10-19','CASE-DEMO-00009','synthetic_demo'),
('CDS00010','ORG0010','CAM00021','complaint','high','open','Restricted synthetic case summary 10.','2025-10-28','CASE-DEMO-00010','synthetic_demo'),
('CDS00011','ORG0011','CAM00023','safety_incident','critical','under_review','Restricted synthetic case summary 11.','2025-11-06','CASE-DEMO-00011','synthetic_demo'),
('CDS00012','ORG0012','CAM00025','attribution_dispute','low','awaiting_response','Restricted synthetic case summary 12.','2025-11-15','CASE-DEMO-00012','synthetic_demo'),
('CDS00013','ORG0013','CAM00027','evidence_appeal','medium','resolved','Restricted synthetic case summary 13.','2025-11-24','CASE-DEMO-00013','synthetic_demo'),
('CDS00014','ORG0014','CAM00029','restriction_appeal','high','dismissed','Restricted synthetic case summary 14.','2025-12-03','CASE-DEMO-00014','synthetic_demo'),
('CDS00015','ORG0015','CAM00031','complaint','critical','open','Restricted synthetic case summary 15.','2025-12-12','CASE-DEMO-00015','synthetic_demo');

INSERT INTO `audit_events` (audit_event_id,organization_id,actor_member_ref,action_type,object_type,object_reference,occurred_at,event_summary,data_source) VALUES
('AUD00001','ORG0001','MEM0002','member_invited','membership','DEMO-OBJ-00001','2025-08-13','Demo audit event 1; no credentials or secrets.','synthetic_demo'),
('AUD00002','ORG0002','MEM0003','role_changed','campaign','DEMO-OBJ-00002','2025-08-17','Demo audit event 2; no credentials or secrets.','synthetic_demo'),
('AUD00003','ORG0003','MEM0004','campaign_published','evidence','DEMO-OBJ-00003','2025-08-21','Demo audit event 3; no credentials or secrets.','synthetic_demo'),
('AUD00004','ORG0004','MEM0005','evidence_submitted','review','DEMO-OBJ-00004','2025-08-25','Demo audit event 4; no credentials or secrets.','synthetic_demo'),
('AUD00005','ORG0005','MEM0006','review_decision','resource','DEMO-OBJ-00005','2025-08-29','Demo audit event 5; no credentials or secrets.','synthetic_demo'),
('AUD00006','ORG0006','MEM0007','resource_updated','appeal','DEMO-OBJ-00006','2025-09-02','Demo audit event 6; no credentials or secrets.','synthetic_demo'),
('AUD00007','ORG0007','MEM0008','appeal_submitted','organization','DEMO-OBJ-00007','2025-09-06','Demo audit event 7; no credentials or secrets.','synthetic_demo'),
('AUD00008','ORG0008','MEM0009','organization_updated','membership','DEMO-OBJ-00008','2025-09-10','Demo audit event 8; no credentials or secrets.','synthetic_demo'),
('AUD00009','ORG0009','MEM0010','member_invited','campaign','DEMO-OBJ-00009','2025-09-14','Demo audit event 9; no credentials or secrets.','synthetic_demo'),
('AUD00010','ORG0010','MEM0011','role_changed','evidence','DEMO-OBJ-00010','2025-09-18','Demo audit event 10; no credentials or secrets.','synthetic_demo'),
('AUD00011','ORG0011','MEM0012','campaign_published','review','DEMO-OBJ-00011','2025-09-22','Demo audit event 11; no credentials or secrets.','synthetic_demo'),
('AUD00012','ORG0012','MEM0013','evidence_submitted','resource','DEMO-OBJ-00012','2025-09-26','Demo audit event 12; no credentials or secrets.','synthetic_demo'),
('AUD00013','ORG0013','MEM0014','review_decision','appeal','DEMO-OBJ-00013','2025-09-30','Demo audit event 13; no credentials or secrets.','synthetic_demo'),
('AUD00014','ORG0014','MEM0015','resource_updated','organization','DEMO-OBJ-00014','2025-10-04','Demo audit event 14; no credentials or secrets.','synthetic_demo'),
('AUD00015','ORG0015','MEM0016','appeal_submitted','membership','DEMO-OBJ-00015','2025-10-08','Demo audit event 15; no credentials or secrets.','synthetic_demo'),
('AUD00016','ORG0016','MEM0017','organization_updated','campaign','DEMO-OBJ-00016','2025-10-12','Demo audit event 16; no credentials or secrets.','synthetic_demo'),
('AUD00017','ORG0017','MEM0018','member_invited','evidence','DEMO-OBJ-00017','2025-10-16','Demo audit event 17; no credentials or secrets.','synthetic_demo'),
('AUD00018','ORG0018','MEM0019','role_changed','review','DEMO-OBJ-00018','2025-10-20','Demo audit event 18; no credentials or secrets.','synthetic_demo'),
('AUD00019','ORG0019','MEM0020','campaign_published','resource','DEMO-OBJ-00019','2025-10-24','Demo audit event 19; no credentials or secrets.','synthetic_demo'),
('AUD00020','ORG0020','MEM0021','evidence_submitted','appeal','DEMO-OBJ-00020','2025-10-28','Demo audit event 20; no credentials or secrets.','synthetic_demo');

INSERT INTO `ai_assistance_records` (ai_record_id,organization_id,issue_id,capability_type,confidence_score,output_kind,output_summary,review_status,generated_at,data_source) VALUES
('AIH00001','ORG0003','ISS00004','duplicate_detection',0.51,'flag','AI demo output 1; human review required and not a verified finding.','accepted','2025-08-25','synthetic_demo'),
('AIH00002','ORG0005','ISS00007','campaign_assistant',0.52,'draft','AI demo output 2; human review required and not a verified finding.','dismissed','2025-08-31','synthetic_demo'),
('AIH00003','ORG0007','ISS00010','evidence_assistance',0.53,'recommendation','AI demo output 3; human review required and not a verified finding.','needs_revision','2025-09-06','synthetic_demo'),
('AIH00004','ORG0009','ISS00013','impact_report',0.54,'suggestion','AI demo output 4; human review required and not a verified finding.','pending_review','2025-09-12','synthetic_demo'),
('AIH00005','ORG0011','ISS00016','chatbot_support',0.55,'flag','AI demo output 5; human review required and not a verified finding.','accepted','2025-09-18','synthetic_demo'),
('AIH00006','ORG0013','ISS00019','follow_up_recommendation',0.56,'draft','AI demo output 6; human review required and not a verified finding.','dismissed','2025-09-24','synthetic_demo'),
('AIH00007','ORG0015','ISS00022','issue_matching',0.57,'recommendation','AI demo output 7; human review required and not a verified finding.','needs_revision','2025-09-30','synthetic_demo'),
('AIH00008','ORG0017','ISS00025','duplicate_detection',0.58,'suggestion','AI demo output 8; human review required and not a verified finding.','pending_review','2025-10-06','synthetic_demo'),
('AIH00009','ORG0019','ISS00028','campaign_assistant',0.59,'flag','AI demo output 9; human review required and not a verified finding.','accepted','2025-10-12','synthetic_demo'),
('AIH00010','ORG0021','ISS00031','evidence_assistance',0.6,'draft','AI demo output 10; human review required and not a verified finding.','dismissed','2025-10-18','synthetic_demo'),
('AIH00011','ORG0023','ISS00034','impact_report',0.61,'recommendation','AI demo output 11; human review required and not a verified finding.','needs_revision','2025-10-24','synthetic_demo'),
('AIH00012','ORG0025','ISS00037','chatbot_support',0.62,'suggestion','AI demo output 12; human review required and not a verified finding.','pending_review','2025-10-30','synthetic_demo'),
('AIH00013','ORG0027','ISS00040','follow_up_recommendation',0.63,'flag','AI demo output 13; human review required and not a verified finding.','accepted','2025-11-05','synthetic_demo'),
('AIH00014','ORG0029','ISS00043','issue_matching',0.64,'draft','AI demo output 14; human review required and not a verified finding.','dismissed','2025-11-11','synthetic_demo'),
('AIH00015','ORG0001','ISS00046','duplicate_detection',0.65,'recommendation','AI demo output 15; human review required and not a verified finding.','needs_revision','2025-11-17','synthetic_demo'),
('AIH00016','ORG0003','ISS00049','campaign_assistant',0.66,'suggestion','AI demo output 16; human review required and not a verified finding.','pending_review','2025-11-23','synthetic_demo'),
('AIH00017','ORG0005','ISS00052','evidence_assistance',0.67,'flag','AI demo output 17; human review required and not a verified finding.','accepted','2025-11-29','synthetic_demo'),
('AIH00018','ORG0007','ISS00055','impact_report',0.68,'draft','AI demo output 18; human review required and not a verified finding.','dismissed','2025-12-05','synthetic_demo'),
('AIH00019','ORG0009','ISS00058','chatbot_support',0.69,'recommendation','AI demo output 19; human review required and not a verified finding.','needs_revision','2025-12-11','synthetic_demo'),
('AIH00020','ORG0011','ISS00061','follow_up_recommendation',0.7,'suggestion','AI demo output 20; human review required and not a verified finding.','pending_review','2025-12-17','synthetic_demo'),
('AIH00021','ORG0013','ISS00064','issue_matching',0.71,'flag','AI demo output 21; human review required and not a verified finding.','accepted','2025-12-23','synthetic_demo'),
('AIH00022','ORG0015','ISS00067','duplicate_detection',0.72,'draft','AI demo output 22; human review required and not a verified finding.','dismissed','2025-12-29','synthetic_demo'),
('AIH00023','ORG0017','ISS00070','campaign_assistant',0.73,'recommendation','AI demo output 23; human review required and not a verified finding.','needs_revision','2026-01-04','synthetic_demo'),
('AIH00024','ORG0019','ISS00073','evidence_assistance',0.74,'suggestion','AI demo output 24; human review required and not a verified finding.','pending_review','2026-01-10','synthetic_demo'),
('AIH00025','ORG0021','ISS00076','impact_report',0.75,'flag','AI demo output 25; human review required and not a verified finding.','accepted','2026-01-16','synthetic_demo');

SET FOREIGN_KEY_CHECKS = 1;

-- Validation summary: total seeded rows across all populated tables.
SELECT SUM(row_count) AS total_seeded_rows
FROM (
SELECT COUNT(*) AS row_count FROM `organizations`
UNION ALL
SELECT COUNT(*) AS row_count FROM `organization_verification_applications`
UNION ALL
SELECT COUNT(*) AS row_count FROM `organization_capabilities`
UNION ALL
SELECT COUNT(*) AS row_count FROM `public_impact_profiles`
UNION ALL
SELECT COUNT(*) AS row_count FROM `compliance_documents`
UNION ALL
SELECT COUNT(*) AS row_count FROM `organization_memberships`
UNION ALL
SELECT COUNT(*) AS row_count FROM `civic_issues`
UNION ALL
SELECT COUNT(*) AS row_count FROM `campaigns`
UNION ALL
SELECT COUNT(*) AS row_count FROM `campaign_issue_links`
UNION ALL
SELECT COUNT(*) AS row_count FROM `ngo_issue_associations`
UNION ALL
SELECT COUNT(*) AS row_count FROM `campaign_partners`
UNION ALL
SELECT COUNT(*) AS row_count FROM `campaign_tasks`
UNION ALL
SELECT COUNT(*) AS row_count FROM `volunteer_registrations`
UNION ALL
SELECT COUNT(*) AS row_count FROM `attendance_records`
UNION ALL
SELECT COUNT(*) AS row_count FROM `evidence_records`
UNION ALL
SELECT COUNT(*) AS row_count FROM `verification_reviews`
UNION ALL
SELECT COUNT(*) AS row_count FROM `field_operations`
UNION ALL
SELECT COUNT(*) AS row_count FROM `impact_measurements`
UNION ALL
SELECT COUNT(*) AS row_count FROM `contribution_records`
UNION ALL
SELECT COUNT(*) AS row_count FROM `recognition_records`
UNION ALL
SELECT COUNT(*) AS row_count FROM `follow_up_checks`
UNION ALL
SELECT COUNT(*) AS row_count FROM `government_coordination_requests`
UNION ALL
SELECT COUNT(*) AS row_count FROM `partnership_requests`
UNION ALL
SELECT COUNT(*) AS row_count FROM `resource_requests`
UNION ALL
SELECT COUNT(*) AS row_count FROM `resource_offers`
UNION ALL
SELECT COUNT(*) AS row_count FROM `community_resources`
UNION ALL
SELECT COUNT(*) AS row_count FROM `community_feedback`
UNION ALL
SELECT COUNT(*) AS row_count FROM `notifications`
UNION ALL
SELECT COUNT(*) AS row_count FROM `complaints_and_disputes`
UNION ALL
SELECT COUNT(*) AS row_count FROM `audit_events`
UNION ALL
SELECT COUNT(*) AS row_count FROM `ai_assistance_records`
) AS counts;
