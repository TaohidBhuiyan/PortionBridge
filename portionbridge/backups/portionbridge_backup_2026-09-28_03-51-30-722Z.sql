-- PortionBridge Database Backup
-- Generated: 2026-09-28T03:51:30.784Z
-- Database: portionbridge

SET FOREIGN_KEY_CHECKS = 0;

-- Table structure for achievement_definitions
DROP TABLE IF EXISTS `achievement_definitions`;
CREATE TABLE `achievement_definitions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `icon` varchar(50) NOT NULL,
  `role` enum('donor','volunteer','both') NOT NULL DEFAULT 'both',
  `criteria_type` enum('donations_count','pickups_count','rating_avg','streak') NOT NULL,
  `criteria_value` int(10) unsigned NOT NULL,
  `points` int(10) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_achievement_type` (`type`),
  KEY `idx_achievement_definitions_role` (`role`),
  KEY `idx_achievement_definitions_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table achievement_definitions
LOCK TABLES `achievement_definitions` WRITE;
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (1, 'first_donation', 'First Donation', 'Completed your first donation', 'gift', 'donor', 'donations_count', 1, 10, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (2, 'helping_hand', 'Helping Hand', 'Completed 5 donations', 'hand-heart', 'donor', 'donations_count', 5, 25, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (3, 'community_hero', 'Community Hero', 'Completed 10 donations', 'award', 'donor', 'donations_count', 10, 50, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (4, 'generous_giver', 'Generous Giver', 'Completed 25 donations', 'heart', 'donor', 'donations_count', 25, 100, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (5, 'legendary_donor', 'Legendary Donor', 'Completed 50 donations', 'crown', 'donor', 'donations_count', 50, 200, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (6, 'top_donor', 'Top Donor', 'Reached top 10 on donor leaderboard', 'trophy', 'donor', 'donations_count', 1, 150, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (7, 'first_pickup', 'First Pickup', 'Completed your first pickup', 'truck', 'volunteer', 'pickups_count', 1, 10, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (8, 'reliable_volunteer', 'Reliable Volunteer', 'Completed 5 pickups', 'shield-check', 'volunteer', 'pickups_count', 5, 25, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (9, 'dedicated_helper', 'Dedicated Helper', 'Completed 10 pickups', 'star', 'volunteer', 'pickups_count', 10, 50, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (10, 'super_volunteer', 'Super Volunteer', 'Completed 25 pickups', 'zap', 'volunteer', 'pickups_count', 25, 100, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (11, 'legendary_volunteer', 'Legendary Volunteer', 'Completed 50 pickups', 'crown', 'volunteer', 'pickups_count', 50, 200, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (12, 'top_volunteer', 'Top Volunteer', 'Reached top 10 on volunteer leaderboard', 'trophy', 'volunteer', 'pickups_count', 1, 150, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (13, 'five_star_hero', '5-Star Hero', 'Maintained 5.0 average rating with 10+ ratings', 'star', 'volunteer', 'rating_avg', 10, 100, 1, '2026-09-28 03:02:21');
INSERT INTO `achievement_definitions` (`id`, `type`, `name`, `description`, `icon`, `role`, `criteria_type`, `criteria_value`, `points`, `is_active`, `created_at`) VALUES (14, 'consistent_contributor', 'Consistent Contributor', 'Active for 30 days', 'calendar-check', 'both', 'streak', 30, 50, 1, '2026-09-28 03:02:21');
UNLOCK TABLES;

-- Table structure for audit_logs
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `metadata` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_user_id` (`user_id`),
  KEY `idx_audit_logs_action` (`action`),
  KEY `idx_audit_logs_created_at` (`created_at`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table audit_logs
LOCK TABLES `audit_logs` WRITE;
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (1, 2, 'user_login', '192.168.1.1', 'Mozilla/5.0', '{"success": true}', '2026-09-28 03:02:51');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (2, 5, 'donation_accepted', '192.168.1.2', 'Mozilla/5.0', '{"donation_id": 2}', '2026-09-28 03:02:51');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (3, 1, 'user_banned', '192.168.1.10', 'Mozilla/5.0', '{"target_user_id": 999}', '2026-09-28 03:02:51');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (4, 8, 'login_success', '127.0.0.1', 'Test Script', NULL, '2026-09-28 03:21:20');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (5, 8, 'login_success', '::1', 'curl/8.19.0', NULL, '2026-09-28 03:21:33');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (6, 8, 'login_success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, '2026-09-28 03:22:13');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (7, 10, 'login_success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, '2026-09-28 03:23:24');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (8, 9, 'login_success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, '2026-09-28 03:24:59');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (9, 9, 'login_success', '::1', 'curl/8.19.0', NULL, '2026-09-28 03:32:27');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (10, 10, 'login_success', '::1', 'curl/8.19.0', NULL, '2026-09-28 03:32:41');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (11, 8, 'login_success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, '2026-09-28 03:33:53');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (12, 10, 'login_success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, '2026-09-28 03:35:48');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (13, 8, 'user_banned', NULL, NULL, '{"targetUserId":"10","targetUserRole":"volunteer"}', '2026-09-28 03:43:00');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (14, 10, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '{"reason":"banned"}', '2026-09-28 03:43:28');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (15, 8, 'user_unbanned', NULL, NULL, '{"targetUserId":"10","targetUserRole":"volunteer"}', '2026-09-28 03:43:49');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`) VALUES (16, 10, 'login_success', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', NULL, '2026-09-28 03:44:05');
UNLOCK TABLES;

-- Table structure for chat_messages
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `donation_request_id` int(10) unsigned NOT NULL,
  `sender_id` int(10) unsigned NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_chat_donation_id` (`donation_request_id`),
  KEY `idx_chat_sender_id` (`sender_id`),
  KEY `idx_chat_created_at` (`created_at`),
  CONSTRAINT `fk_chat_donation` FOREIGN KEY (`donation_request_id`) REFERENCES `donation_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table chat_messages
LOCK TABLES `chat_messages` WRITE;
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (1, 2, 3, 'Hi, thanks for accepting! What time works for pickup?', 1, '2026-09-28 03:02:50');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (2, 2, 5, 'Hello! I can come by around 11 AM tomorrow.', 1, '2026-09-28 03:02:50');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (3, 2, 3, 'That works, see you then.', 0, '2026-09-28 03:02:50');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (4, 5, 2, 'Hi Sabbir, the lunch boxes are ready outside the gate.', 1, '2026-09-28 03:02:50');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (5, 5, 5, 'On my way, arriving in 10 minutes.', 1, '2026-09-28 03:02:50');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (6, 5, 2, 'Great, thank you so much!', 1, '2026-09-28 03:02:50');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (7, 6, 3, 'The blankets are packed in 3 boxes.', 1, '2026-09-28 03:02:50');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (8, 6, 6, 'Understood, bringing my van.', 1, '2026-09-28 03:02:50');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (9, 24, 10, 'Hello! I have accepted your donation request. I can pick it up this evening around 6 PM. Does that work for you?', 0, '2026-09-28 03:27:58');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (10, 24, 9, 'That sounds perfect! I will have everything ready by 5:30 PM. My address is Kurmitola, Dhaka - House 12, Road 5.', 0, '2026-09-28 03:27:58');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (11, 24, 10, 'Great! I have your location. I will call you when I am nearby. Thank you for the donation!', 0, '2026-09-28 03:27:58');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (12, 24, 9, 'You are welcome! Looking forward to your arrival.', 0, '2026-09-28 03:27:58');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (13, 25, 10, 'Hi! I can pick up the summer clothes tomorrow morning. Around 10 AM would be convenient.', 0, '2026-09-28 03:27:58');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (14, 25, 9, '10 AM works perfectly! The clothes are already packed and ready. Thank you for accepting.', 0, '2026-09-28 03:27:58');
INSERT INTO `chat_messages` (`id`, `donation_request_id`, `sender_id`, `message`, `is_read`, `created_at`) VALUES (15, 25, 10, 'No problem! Happy to help. See you tomorrow morning.', 0, '2026-09-28 03:27:58');
UNLOCK TABLES;

-- Table structure for donation_assignments
DROP TABLE IF EXISTS `donation_assignments`;
CREATE TABLE `donation_assignments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `donation_id` int(10) unsigned NOT NULL,
  `team_id` int(10) unsigned NOT NULL,
  `member_id` int(10) unsigned NOT NULL,
  `assigned_by` int(10) unsigned NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('assigned','in_progress','completed','cancelled') NOT NULL DEFAULT 'assigned',
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_donation_assignments` (`donation_id`,`member_id`),
  KEY `fk_donation_assignments_assigned_by` (`assigned_by`),
  KEY `idx_donation_assignments_donation` (`donation_id`),
  KEY `idx_donation_assignments_team` (`team_id`),
  KEY `idx_donation_assignments_member` (`member_id`),
  KEY `idx_donation_assignments_status` (`status`),
  CONSTRAINT `fk_donation_assignments_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_donation_assignments_donation` FOREIGN KEY (`donation_id`) REFERENCES `donation_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_donation_assignments_member` FOREIGN KEY (`member_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_donation_assignments_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table donation_assignments
LOCK TABLES `donation_assignments` WRITE;
INSERT INTO `donation_assignments` (`id`, `donation_id`, `team_id`, `member_id`, `assigned_by`, `assigned_at`, `status`, `completed_at`) VALUES (1, 2, 1, 7, 5, '2026-07-16 04:30:00', 'completed', '2026-07-16 06:00:00');
UNLOCK TABLES;

-- Table structure for donation_requests
DROP TABLE IF EXISTS `donation_requests`;
CREATE TABLE `donation_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `donor_id` int(10) unsigned NOT NULL,
  `volunteer_id` int(10) unsigned DEFAULT NULL,
  `assignment_mode` enum('individual','team') NOT NULL DEFAULT 'individual',
  `team_id` int(10) unsigned DEFAULT NULL,
  `assigned_member_id` int(10) unsigned DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `category` enum('food','clothes') NOT NULL,
  `food_type` enum('cooked','raw','packaged') DEFAULT NULL,
  `food_name` varchar(200) DEFAULT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `quantity_unit` enum('plate','box','packet','piece','kg','gram','liter') DEFAULT NULL,
  `number_of_servings` int(10) unsigned DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `ingredients` varchar(500) DEFAULT NULL,
  `allergens` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allergens`)),
  `storage_requirement` enum('room_temperature','refrigerated','frozen') DEFAULT NULL,
  `is_vegetarian` enum('vegetarian','non_vegetarian') DEFAULT NULL,
  `is_halal` enum('yes','no') DEFAULT NULL,
  `refrigeration_required` enum('yes','no') DEFAULT NULL,
  `clothing_category` enum('shirt','t_shirt','pants','jeans','jacket','sweater','saree','salwar_kameez','hijab','shoes','blanket','others') DEFAULT NULL,
  `gender` enum('male','female','unisex') DEFAULT NULL,
  `age_group` enum('baby','child','teen','adult','senior') DEFAULT NULL,
  `item_condition` enum('new','like_new','good','fair') DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `size` enum('xs','s','m','l','xl','xxl','free_size') DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `season` enum('summer','winter','rainy','all_season') DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `additional_notes` text DEFAULT NULL,
  `pickup_location` varchar(255) NOT NULL,
  `saved_address_id` int(10) unsigned DEFAULT NULL,
  `pickup_address_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`pickup_address_details`)),
  `pickup_time` datetime NOT NULL,
  `pickup_date` date NOT NULL,
  `pickup_time_slot` enum('morning','afternoon','evening') NOT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `contact_phone` varchar(20) NOT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `status` enum('pending','accepted','scheduled','on_the_way','picked_up','completed','cancelled') NOT NULL DEFAULT 'pending',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_donation_status` (`status`),
  KEY `idx_donation_category` (`category`),
  KEY `idx_donation_donor_id` (`donor_id`),
  KEY `idx_donation_volunteer_id` (`volunteer_id`),
  KEY `idx_donation_is_deleted` (`is_deleted`),
  KEY `idx_donation_pickup_location` (`pickup_location`),
  KEY `idx_donation_pickup_date` (`pickup_date`),
  KEY `idx_donation_saved_address_id` (`saved_address_id`),
  KEY `idx_donation_team_id` (`team_id`),
  KEY `idx_donation_assigned_member_id` (`assigned_member_id`),
  KEY `idx_donation_assignment_mode` (`assignment_mode`),
  CONSTRAINT `fk_donation_assigned_member` FOREIGN KEY (`assigned_member_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_donation_donor` FOREIGN KEY (`donor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_donation_saved_address` FOREIGN KEY (`saved_address_id`) REFERENCES `saved_addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_donation_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_donation_volunteer` FOREIGN KEY (`volunteer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_donation_quantity` CHECK (`quantity` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table donation_requests
LOCK TABLES `donation_requests` WRITE;
INSERT INTO `donation_requests` (`id`, `title`, `donor_id`, `volunteer_id`, `assignment_mode`, `team_id`, `assigned_member_id`, `accepted_at`, `category`, `food_type`, `food_name`, `quantity`, `quantity_unit`, `number_of_servings`, `description`, `ingredients`, `allergens`, `storage_requirement`, `is_vegetarian`, `is_halal`, `refrigeration_required`, `clothing_category`, `gender`, `age_group`, `item_condition`, `brand`, `size`, `color`, `season`, `photo`, `images`, `additional_notes`, `pickup_location`, `saved_address_id`, `pickup_address_details`, `pickup_time`, `pickup_date`, `pickup_time_slot`, `expiry_date`, `contact_phone`, `scheduled_at`, `completed_at`, `status`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (1, 'Cooked Rice Donation', 2, NULL, 'individual', NULL, NULL, NULL, 'food', NULL, NULL, 10, NULL, NULL, 'Cooked rice and curry for 10 people', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gulshan 1, Dhaka', NULL, NULL, '2026-07-15 12:00:00', '2026-07-14 18:00:00', 'evening', NULL, '01700000002', NULL, NULL, 'pending', 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `donation_requests` (`id`, `title`, `donor_id`, `volunteer_id`, `assignment_mode`, `team_id`, `assigned_member_id`, `accepted_at`, `category`, `food_type`, `food_name`, `quantity`, `quantity_unit`, `number_of_servings`, `description`, `ingredients`, `allergens`, `storage_requirement`, `is_vegetarian`, `is_halal`, `refrigeration_required`, `clothing_category`, `gender`, `age_group`, `item_condition`, `brand`, `size`, `color`, `season`, `photo`, `images`, `additional_notes`, `pickup_location`, `saved_address_id`, `pickup_address_details`, `pickup_time`, `pickup_date`, `pickup_time_slot`, `expiry_date`, `contact_phone`, `scheduled_at`, `completed_at`, `status`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (2, 'Winter Clothes Bundle', 3, 5, 'individual', NULL, NULL, NULL, 'clothes', NULL, NULL, 25, NULL, NULL, 'Winter clothes bundle, good condition', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Dhanmondi 27, Dhaka', NULL, NULL, '2026-07-16 04:00:00', '2026-07-15 18:00:00', 'morning', NULL, '01700000003', '2026-07-16 05:00:00', NULL, 'accepted', 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `donation_requests` (`id`, `title`, `donor_id`, `volunteer_id`, `assignment_mode`, `team_id`, `assigned_member_id`, `accepted_at`, `category`, `food_type`, `food_name`, `quantity`, `quantity_unit`, `number_of_servings`, `description`, `ingredients`, `allergens`, `storage_requirement`, `is_vegetarian`, `is_halal`, `refrigeration_required`, `clothing_category`, `gender`, `age_group`, `item_condition`, `brand`, `size`, `color`, `season`, `photo`, `images`, `additional_notes`, `pickup_location`, `saved_address_id`, `pickup_address_details`, `pickup_time`, `pickup_date`, `pickup_time_slot`, `expiry_date`, `contact_phone`, `scheduled_at`, `completed_at`, `status`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (3, 'Bakery Items', 4, 6, 'individual', NULL, NULL, NULL, 'food', NULL, NULL, 15, NULL, NULL, 'Bakery items, day-old bread and pastries', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Uttara Sector 7, Dhaka', NULL, NULL, '2026-07-14 03:00:00', '2026-07-13 18:00:00', 'morning', NULL, '01700000004', '2026-07-14 04:00:00', NULL, 'on_the_way', 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `donation_requests` (`id`, `title`, `donor_id`, `volunteer_id`, `assignment_mode`, `team_id`, `assigned_member_id`, `accepted_at`, `category`, `food_type`, `food_name`, `quantity`, `quantity_unit`, `number_of_servings`, `description`, `ingredients`, `allergens`, `storage_requirement`, `is_vegetarian`, `is_halal`, `refrigeration_required`, `clothing_category`, `gender`, `age_group`, `item_condition`, `brand`, `size`, `color`, `season`, `photo`, `images`, `additional_notes`, `pickup_location`, `saved_address_id`, `pickup_address_details`, `pickup_time`, `pickup_date`, `pickup_time_slot`, `expiry_date`, `contact_phone`, `scheduled_at`, `completed_at`, `status`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (4, 'Children Clothing', 2, 7, 'individual', NULL, NULL, NULL, 'clothes', NULL, NULL, 40, NULL, NULL, 'Children clothing, mixed sizes', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gulshan 2, Dhaka', NULL, NULL, '2026-07-13 08:00:00', '2026-07-12 18:00:00', 'afternoon', NULL, '01700000002', '2026-07-13 09:00:00', NULL, 'picked_up', 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `donation_requests` (`id`, `title`, `donor_id`, `volunteer_id`, `assignment_mode`, `team_id`, `assigned_member_id`, `accepted_at`, `category`, `food_type`, `food_name`, `quantity`, `quantity_unit`, `number_of_servings`, `description`, `ingredients`, `allergens`, `storage_requirement`, `is_vegetarian`, `is_halal`, `refrigeration_required`, `clothing_category`, `gender`, `age_group`, `item_condition`, `brand`, `size`, `color`, `season`, `photo`, `images`, `additional_notes`, `pickup_location`, `saved_address_id`, `pickup_address_details`, `pickup_time`, `pickup_date`, `pickup_time_slot`, `expiry_date`, `contact_phone`, `scheduled_at`, `completed_at`, `status`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (5, 'Lunch Boxes', 2, 5, 'individual', NULL, NULL, NULL, 'food', NULL, NULL, 20, NULL, NULL, 'Packed lunch boxes for shelter', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gulshan 1, Dhaka', NULL, NULL, '2026-07-10 06:00:00', '2026-07-09 18:00:00', 'afternoon', NULL, '01700000002', '2026-07-10 07:00:00', NULL, 'completed', 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `donation_requests` (`id`, `title`, `donor_id`, `volunteer_id`, `assignment_mode`, `team_id`, `assigned_member_id`, `accepted_at`, `category`, `food_type`, `food_name`, `quantity`, `quantity_unit`, `number_of_servings`, `description`, `ingredients`, `allergens`, `storage_requirement`, `is_vegetarian`, `is_halal`, `refrigeration_required`, `clothing_category`, `gender`, `age_group`, `item_condition`, `brand`, `size`, `color`, `season`, `photo`, `images`, `additional_notes`, `pickup_location`, `saved_address_id`, `pickup_address_details`, `pickup_time`, `pickup_date`, `pickup_time_slot`, `expiry_date`, `contact_phone`, `scheduled_at`, `completed_at`, `status`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (6, 'Winter Blankets', 3, 6, 'individual', NULL, NULL, NULL, 'clothes', NULL, NULL, 30, NULL, NULL, 'Blankets for winter relief', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Dhanmondi 15, Dhaka', NULL, NULL, '2026-07-08 10:00:00', '2026-07-07 18:00:00', 'afternoon', NULL, '01700000003', '2026-07-08 11:00:00', NULL, 'completed', 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `donation_requests` (`id`, `title`, `donor_id`, `volunteer_id`, `assignment_mode`, `team_id`, `assigned_member_id`, `accepted_at`, `category`, `food_type`, `food_name`, `quantity`, `quantity_unit`, `number_of_servings`, `description`, `ingredients`, `allergens`, `storage_requirement`, `is_vegetarian`, `is_halal`, `refrigeration_required`, `clothing_category`, `gender`, `age_group`, `item_condition`, `brand`, `size`, `color`, `season`, `photo`, `images`, `additional_notes`, `pickup_location`, `saved_address_id`, `pickup_address_details`, `pickup_time`, `pickup_date`, `pickup_time_slot`, `expiry_date`, `contact_phone`, `scheduled_at`, `completed_at`, `status`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (7, 'Fresh Vegetables', 4, 5, 'individual', NULL, NULL, NULL, 'food', NULL, NULL, 12, NULL, NULL, 'Fresh vegetables surplus from restaurant', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Uttara Sector 4, Dhaka', NULL, NULL, '2026-07-05 02:00:00', '2026-07-04 18:00:00', 'morning', NULL, '01700000004', '2026-07-05 03:00:00', NULL, 'completed', 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `donation_requests` (`id`, `title`, `donor_id`, `volunteer_id`, `assignment_mode`, `team_id`, `assigned_member_id`, `accepted_at`, `category`, `food_type`, `food_name`, `quantity`, `quantity_unit`, `number_of_servings`, `description`, `ingredients`, `allergens`, `storage_requirement`, `is_vegetarian`, `is_halal`, `refrigeration_required`, `clothing_category`, `gender`, `age_group`, `item_condition`, `brand`, `size`, `color`, `season`, `photo`, `images`, `additional_notes`, `pickup_location`, `saved_address_id`, `pickup_address_details`, `pickup_time`, `pickup_date`, `pickup_time_slot`, `expiry_date`, `contact_phone`, `scheduled_at`, `completed_at`, `status`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (8, 'Cancelled Items', 3, NULL, 'individual', NULL, NULL, NULL, 'clothes', NULL, NULL, 5, NULL, NULL, 'Cancelled by donor before acceptance', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Dhanmondi 32, Dhaka', NULL, NULL, '2026-07-12 04:00:00', '2026-07-11 18:00:00', 'morning', NULL, '01700000003', NULL, NULL, 'pending', 1, '2026-07-12 03:00:00', '2026-09-28 03:02:50', '2026-09-28 03:02:50');
UNLOCK TABLES;

-- Table structure for donation_status_history
DROP TABLE IF EXISTS `donation_status_history`;
CREATE TABLE `donation_status_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `donation_request_id` int(10) unsigned NOT NULL,
  `changed_by` int(10) unsigned DEFAULT NULL,
  `old_status` varchar(20) DEFAULT NULL,
  `new_status` varchar(20) NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_history_donation_id` (`donation_request_id`),
  KEY `idx_history_changed_by` (`changed_by`),
  KEY `idx_history_changed_at` (`changed_at`),
  CONSTRAINT `fk_history_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_history_donation` FOREIGN KEY (`donation_request_id`) REFERENCES `donation_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table donation_status_history
LOCK TABLES `donation_status_history` WRITE;
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (1, 1, 2, NULL, 'pending', '2026-09-28 03:02:50');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (2, 2, 3, NULL, 'accepted', '2026-09-28 03:02:50');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (3, 3, 4, NULL, 'on_the_way', '2026-09-28 03:02:50');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (4, 4, 2, NULL, 'picked_up', '2026-09-28 03:02:50');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (5, 5, 2, NULL, 'completed', '2026-09-28 03:02:50');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (6, 6, 3, NULL, 'completed', '2026-09-28 03:02:50');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (7, 7, 4, NULL, 'completed', '2026-09-28 03:02:50');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (8, 8, 3, NULL, 'pending', '2026-09-28 03:02:50');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (9, 9, 9, NULL, 'pending', '2026-09-28 03:23:16');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (10, 10, 9, NULL, 'pending', '2026-09-28 03:23:17');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (11, 11, 9, NULL, 'pending', '2026-09-28 03:23:54');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (12, 12, 9, NULL, 'pending', '2026-09-28 03:23:54');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (13, 13, 9, NULL, 'pending', '2026-09-28 03:23:54');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (14, 14, 9, NULL, 'pending', '2026-09-28 03:26:10');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (15, 15, 9, NULL, 'pending', '2026-09-28 03:26:10');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (16, 16, 9, NULL, 'pending', '2026-09-28 03:26:10');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (17, 17, 9, NULL, 'pending', '2026-09-28 03:26:10');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (18, 18, 9, NULL, 'pending', '2026-09-28 03:26:10');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (19, 19, 9, NULL, 'pending', '2026-09-28 03:26:10');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (20, 20, 9, NULL, 'pending', '2026-09-28 03:26:10');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (21, 21, 9, NULL, 'pending', '2026-09-28 03:26:10');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (22, 22, 9, NULL, 'completed', '2026-09-28 03:26:10');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (23, 23, 9, NULL, 'completed', '2026-09-28 03:26:10');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (24, 24, 9, NULL, 'accepted', '2026-09-28 03:27:58');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (25, 25, 9, NULL, 'accepted', '2026-09-28 03:27:58');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (26, 26, 11, NULL, 'pending', '2026-09-28 03:29:55');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (27, 27, 12, NULL, 'pending', '2026-09-28 03:29:55');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (28, 28, 13, NULL, 'pending', '2026-09-28 03:29:55');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (29, 29, 14, NULL, 'pending', '2026-09-28 03:29:55');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (30, 30, 15, NULL, 'pending', '2026-09-28 03:29:55');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (31, 31, 11, NULL, 'pending', '2026-09-28 03:38:24');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (32, 32, 12, NULL, 'pending', '2026-09-28 03:38:24');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (33, 33, 13, NULL, 'pending', '2026-09-28 03:38:24');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (34, 34, 14, NULL, 'pending', '2026-09-28 03:38:24');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (35, 35, 15, NULL, 'pending', '2026-09-28 03:38:24');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (36, 36, 9, NULL, 'pending', '2026-09-28 03:38:24');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (37, 37, 11, NULL, 'pending', '2026-09-28 03:38:24');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (38, 38, 12, NULL, 'pending', '2026-09-28 03:38:24');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (39, 39, 13, NULL, 'pending', '2026-09-28 03:38:24');
INSERT INTO `donation_status_history` (`id`, `donation_request_id`, `changed_by`, `old_status`, `new_status`, `changed_at`) VALUES (40, 40, 14, NULL, 'pending', '2026-09-28 03:38:24');
UNLOCK TABLES;

-- Table structure for email_verifications
DROP TABLE IF EXISTS `email_verifications`;
CREATE TABLE `email_verifications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email_verifications_token_hash` (`token_hash`),
  KEY `idx_email_verifications_user_id` (`user_id`),
  KEY `idx_email_verifications_expires_at` (`expires_at`),
  CONSTRAINT `fk_email_verifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table email_verifications
LOCK TABLES `email_verifications` WRITE;
INSERT INTO `email_verifications` (`id`, `user_id`, `token_hash`, `expires_at`, `is_used`, `created_at`) VALUES (1, 2, '$2b$10$abc123xyz456', '2026-08-30 12:00:00', 1, '2026-09-28 03:02:50');
INSERT INTO `email_verifications` (`id`, `user_id`, `token_hash`, `expires_at`, `is_used`, `created_at`) VALUES (2, 3, '$2b$10$def789uvw012', '2026-08-30 12:00:00', 1, '2026-09-28 03:02:50');
INSERT INTO `email_verifications` (`id`, `user_id`, `token_hash`, `expires_at`, `is_used`, `created_at`) VALUES (3, 4, '$2b$10$ghi345rst678', '2026-08-30 12:00:00', 1, '2026-09-28 03:02:50');
UNLOCK TABLES;

-- Table structure for notification_settings
DROP TABLE IF EXISTS `notification_settings`;
CREATE TABLE `notification_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `email_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `push_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `sms_notifications` tinyint(1) NOT NULL DEFAULT 0,
  `donation_updates` tinyint(1) NOT NULL DEFAULT 1,
  `chat_messages` tinyint(1) NOT NULL DEFAULT 1,
  `rating_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notification_settings_user_id` (`user_id`),
  CONSTRAINT `fk_notification_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table notification_settings
LOCK TABLES `notification_settings` WRITE;
INSERT INTO `notification_settings` (`id`, `user_id`, `email_notifications`, `push_notifications`, `sms_notifications`, `donation_updates`, `chat_messages`, `rating_notifications`, `created_at`, `updated_at`) VALUES (1, 1, 1, 1, 1, 1, 1, 1, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `notification_settings` (`id`, `user_id`, `email_notifications`, `push_notifications`, `sms_notifications`, `donation_updates`, `chat_messages`, `rating_notifications`, `created_at`, `updated_at`) VALUES (2, 2, 1, 1, 0, 1, 1, 1, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `notification_settings` (`id`, `user_id`, `email_notifications`, `push_notifications`, `sms_notifications`, `donation_updates`, `chat_messages`, `rating_notifications`, `created_at`, `updated_at`) VALUES (3, 3, 1, 1, 1, 1, 1, 1, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `notification_settings` (`id`, `user_id`, `email_notifications`, `push_notifications`, `sms_notifications`, `donation_updates`, `chat_messages`, `rating_notifications`, `created_at`, `updated_at`) VALUES (4, 4, 1, 1, 0, 1, 1, 1, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `notification_settings` (`id`, `user_id`, `email_notifications`, `push_notifications`, `sms_notifications`, `donation_updates`, `chat_messages`, `rating_notifications`, `created_at`, `updated_at`) VALUES (5, 5, 1, 1, 1, 1, 1, 1, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `notification_settings` (`id`, `user_id`, `email_notifications`, `push_notifications`, `sms_notifications`, `donation_updates`, `chat_messages`, `rating_notifications`, `created_at`, `updated_at`) VALUES (6, 6, 1, 1, 1, 1, 1, 1, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `notification_settings` (`id`, `user_id`, `email_notifications`, `push_notifications`, `sms_notifications`, `donation_updates`, `chat_messages`, `rating_notifications`, `created_at`, `updated_at`) VALUES (7, 7, 1, 1, 1, 1, 1, 1, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
UNLOCK TABLES;

-- Table structure for notification_templates
DROP TABLE IF EXISTS `notification_templates`;
CREATE TABLE `notification_templates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `message` varchar(500) NOT NULL,
  `created_by` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notification_templates_created_by` (`created_by`),
  CONSTRAINT `fk_notification_templates_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for notifications
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `type` enum('donation_created','volunteer_assigned','donation_accepted','pickup_scheduled','volunteer_on_the_way','pickup_completed','donation_cancelled','assignment_changed','new_message','status_updated','rating_received','report_filed','team_invitation_received','team_invitation_accepted','team_join_request_received','team_join_request_accepted','team_join_request_rejected','team_member_joined','team_member_left','team_leadership_transferred','team_member_promoted','team_member_removed','team_announcement','team_donation_assigned','team_donation_completed','admin_announcement') NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` varchar(500) NOT NULL,
  `related_id` int(10) unsigned DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_is_read` (`is_read`),
  KEY `idx_notifications_type` (`type`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table notifications
LOCK TABLES `notifications` WRITE;
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (1, 2, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #2.', 2, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (2, 4, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #3.', 3, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (3, 2, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #4.', 4, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (4, 2, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #5.', 5, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (5, 3, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #6.', 6, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (6, 4, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #7.', 7, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (7, 2, 'status_updated', 'Donation completed', 'Your donation request #5 has been marked completed.', 5, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (8, 5, 'status_updated', 'Pickup completed', 'Pickup for donation request #5 has been marked completed.', 5, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (9, 3, 'status_updated', 'Donation completed', 'Your donation request #6 has been marked completed.', 6, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (10, 6, 'status_updated', 'Pickup completed', 'Pickup for donation request #6 has been marked completed.', 6, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (11, 4, 'status_updated', 'Donation completed', 'Your donation request #7 has been marked completed.', 7, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (12, 5, 'status_updated', 'Pickup completed', 'Pickup for donation request #7 has been marked completed.', 7, 0, '2026-09-28 03:02:50');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (13, 9, 'donation_accepted', 'Donation Accepted', 'Mintu Volunteer has accepted your donation request "Rice and Lentils Distribution"', 24, 0, '2026-09-28 03:27:58');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (14, 9, 'donation_accepted', 'Donation Accepted', 'Mintu Volunteer has accepted your donation request "Summer Clothes Collection"', 25, 0, '2026-09-28 03:27:58');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (15, 10, 'new_message', 'New Message', 'Taohid Donor sent you a message regarding "Rice and Lentils Distribution"', 24, 0, '2026-09-28 03:27:58');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES (16, 9, 'new_message', 'New Message', 'Mintu Volunteer sent you a message regarding "Rice and Lentils Distribution"', 24, 0, '2026-09-28 03:27:58');
UNLOCK TABLES;

-- Table structure for password_history
DROP TABLE IF EXISTS `password_history`;
CREATE TABLE `password_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_password_history_user_id` (`user_id`),
  KEY `idx_password_history_created_at` (`created_at`),
  CONSTRAINT `fk_password_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table password_history
LOCK TABLES `password_history` WRITE;
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (1, 2, '$2b$10$oldhash123456', '2026-06-01 04:00:00');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (2, 3, '$2b$10$oldhash789012', '2026-06-05 08:00:00');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (3, 4, '$2b$10$oldhash345678', '2026-06-10 03:00:00');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (4, 8, '$2b$12$MgnMKzNWpg9HaX95sWmICuOXXcoQaM4PhxqYvXmD43pgTn0cHaXtm', '2026-09-28 03:09:59');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (5, 9, '$2b$12$WyhU14syOtn60lanl6uNHuVBxi8CR.L0VTBGmilrFvZEc6Hempm9y', '2026-09-28 03:23:16');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (6, 10, '$2b$12$0lgkkBbUWIQ5lrM.T4Q9t.g9ecEBArBRPHbfRLpHUGS20qBi6ixxe', '2026-09-28 03:23:16');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (7, 11, '$2b$12$0V23YLKif5vRed1f4j5Yz.BrawF0bKqnNsAZP1/.jVjCZJJE.g7u.', '2026-09-28 03:29:50');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (8, 12, '$2b$12$Z2VHZGwIP0BZa3LOvgiLiuzYA0pPn8ao/5BrFL3Xxmu96f19xAEju', '2026-09-28 03:29:50');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (9, 13, '$2b$12$Cf2cOOL3e1lVXKgBjTQyq.1Vd0CdB7pkMaAQGGubyGZMOOd.nvDB6', '2026-09-28 03:29:51');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (10, 14, '$2b$12$P9Q66mO6PL464qrA8IMsIuqnepB7OcO3gfPgeJCVKx6x9KInfW68m', '2026-09-28 03:29:51');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (11, 15, '$2b$12$//etgiQUpn36W979Ozk.pO2zwYD8GWmFvFtdUAa2qLMwfxBaPDl/.', '2026-09-28 03:29:52');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (12, 16, '$2b$12$bWbxdji0krzfiULA7rSSOuJ6VQIi6HfDFLN1KgYKeEbQE1zQSkMdO', '2026-09-28 03:29:53');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (13, 17, '$2b$12$cvfWLqBE/AsEDFgsbONXbugqO.nyV.ujV6Oo8JQ5OWLCe58vefFJe', '2026-09-28 03:29:53');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (14, 18, '$2b$12$ROCVbtu45yqgKjZA/Uj2WeHY6/ZeSa2zIQjs4pyw.oi7zqLj7gwHG', '2026-09-28 03:29:54');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (15, 19, '$2b$12$c4PevuPTu1qw/omxohfj3em0l3C4626ZQ5.LYq1YwiDoOoMDiwlC6', '2026-09-28 03:29:54');
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES (16, 20, '$2b$12$ysaFy4tFdSxykGNDyVxsLuXPTsAYg2hz2jUXj1Mf2EEjIu3D73BJm', '2026-09-28 03:29:55');
UNLOCK TABLES;

-- Table structure for password_resets
DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_password_resets_token` (`token`),
  KEY `idx_password_resets_user_id` (`user_id`),
  KEY `idx_password_resets_expires_at` (`expires_at`),
  CONSTRAINT `fk_password_resets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table password_resets
LOCK TABLES `password_resets` WRITE;
INSERT INTO `password_resets` (`id`, `user_id`, `token`, `expires_at`, `is_used`, `created_at`) VALUES (1, 2, 'reset_token_abc123', '2026-08-30 12:00:00', 0, '2026-09-28 03:02:51');
UNLOCK TABLES;

-- Table structure for ratings
DROP TABLE IF EXISTS `ratings`;
CREATE TABLE `ratings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `donation_request_id` int(10) unsigned NOT NULL,
  `rated_by` int(10) unsigned NOT NULL,
  `rated_user` int(10) unsigned NOT NULL,
  `stars` tinyint(3) unsigned NOT NULL,
  `comment` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rating_per_donation_rater` (`donation_request_id`,`rated_by`),
  KEY `idx_ratings_rated_user` (`rated_user`),
  KEY `idx_ratings_rated_by` (`rated_by`),
  CONSTRAINT `fk_ratings_donation` FOREIGN KEY (`donation_request_id`) REFERENCES `donation_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ratings_rated_by` FOREIGN KEY (`rated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ratings_rated_user` FOREIGN KEY (`rated_user`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_ratings_stars` CHECK (`stars` between 1 and 5),
  CONSTRAINT `chk_ratings_not_self` CHECK (`rated_by` <> `rated_user`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table ratings
LOCK TABLES `ratings` WRITE;
INSERT INTO `ratings` (`id`, `donation_request_id`, `rated_by`, `rated_user`, `stars`, `comment`, `created_at`) VALUES (1, 5, 2, 5, 5, 'Sabbir was very punctual and courteous.', '2026-09-28 03:02:50');
INSERT INTO `ratings` (`id`, `donation_request_id`, `rated_by`, `rated_user`, `stars`, `comment`, `created_at`) VALUES (2, 5, 5, 2, 5, 'Rahim had everything ready, smooth pickup.', '2026-09-28 03:02:50');
INSERT INTO `ratings` (`id`, `donation_request_id`, `rated_by`, `rated_user`, `stars`, `comment`, `created_at`) VALUES (3, 6, 3, 6, 4, 'Nusrat picked up on time, great communication.', '2026-09-28 03:02:50');
INSERT INTO `ratings` (`id`, `donation_request_id`, `rated_by`, `rated_user`, `stars`, `comment`, `created_at`) VALUES (4, 6, 6, 3, 5, 'Karim packed everything neatly.', '2026-09-28 03:02:50');
INSERT INTO `ratings` (`id`, `donation_request_id`, `rated_by`, `rated_user`, `stars`, `comment`, `created_at`) VALUES (5, 7, 4, 5, 5, 'Sabbir is always reliable!', '2026-09-28 03:02:50');
INSERT INTO `ratings` (`id`, `donation_request_id`, `rated_by`, `rated_user`, `stars`, `comment`, `created_at`) VALUES (6, 7, 5, 4, 4, 'Fatima had the vegetables well organized.', '2026-09-28 03:02:50');
INSERT INTO `ratings` (`id`, `donation_request_id`, `rated_by`, `rated_user`, `stars`, `comment`, `created_at`) VALUES (7, 22, 9, 10, 5, 'Excellent service! Very punctual and professional.', '2026-09-28 03:26:10');
INSERT INTO `ratings` (`id`, `donation_request_id`, `rated_by`, `rated_user`, `stars`, `comment`, `created_at`) VALUES (8, 23, 9, 10, 5, 'Excellent service! Very punctual and professional.', '2026-09-28 03:26:10');
UNLOCK TABLES;

-- Table structure for recurring_donations
DROP TABLE IF EXISTS `recurring_donations`;
CREATE TABLE `recurring_donations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `donor_id` int(10) unsigned NOT NULL,
  `title` varchar(150) NOT NULL,
  `category` enum('food','clothes') NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `quantity_unit` varchar(50) NOT NULL,
  `pickup_location` varchar(500) NOT NULL,
  `contact_phone` varchar(20) NOT NULL,
  `frequency` enum('daily','weekly','monthly') NOT NULL,
  `interval_value` tinyint(3) unsigned NOT NULL DEFAULT 1,
  `day_of_week` tinyint(3) unsigned DEFAULT NULL,
  `day_of_month` tinyint(3) unsigned DEFAULT NULL,
  `food_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`food_details`)),
  `clothing_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`clothing_details`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `next_occurrence` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_recurring_donations_donor` (`donor_id`),
  KEY `idx_recurring_donations_active` (`is_active`),
  KEY `idx_recurring_donations_next` (`next_occurrence`),
  CONSTRAINT `fk_recurring_donations_donor` FOREIGN KEY (`donor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_recurring_quantity` CHECK (`quantity` > 0),
  CONSTRAINT `chk_recurring_interval` CHECK (`interval_value` >= 1),
  CONSTRAINT `chk_recurring_day_of_week` CHECK (`day_of_week` is null or `day_of_week` <= 6),
  CONSTRAINT `chk_recurring_day_of_month` CHECK (`day_of_month` is null or `day_of_month` >= 1 and `day_of_month` <= 31),
  CONSTRAINT `chk_recurring_dates` CHECK (`end_date` is null or `end_date` >= `start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for refresh_tokens
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `is_revoked` tinyint(1) NOT NULL DEFAULT 0,
  `replaced_by_token_id` int(10) unsigned DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_refresh_tokens_token_hash` (`token_hash`),
  KEY `idx_refresh_tokens_user_id` (`user_id`),
  KEY `idx_refresh_tokens_is_revoked` (`is_revoked`),
  KEY `idx_refresh_tokens_expires_at` (`expires_at`),
  KEY `fk_refresh_tokens_replaced_by` (`replaced_by_token_id`),
  CONSTRAINT `fk_refresh_tokens_replaced_by` FOREIGN KEY (`replaced_by_token_id`) REFERENCES `refresh_tokens` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table refresh_tokens
LOCK TABLES `refresh_tokens` WRITE;
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (1, 2, '$2b$10$refreshtoken123', 'Mozilla/5.0', '192.168.1.1', 0, NULL, '2026-09-30 12:00:00', '2026-09-28 03:02:51');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (2, 5, '$2b$10$refreshtoken456', 'Mozilla/5.0', '192.168.1.2', 0, NULL, '2026-09-30 12:00:00', '2026-09-28 03:02:51');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (3, 8, 'e80dfdf03cd04f3129330973af7df3202b0f5db167d293799e4dc9e4fa0fc19f', 'Test Script', '127.0.0.1', 0, NULL, '2026-10-05 03:21:20', '2026-09-28 03:21:20');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (4, 8, 'aa0f6dac7336f1b32cec284dcbcc329aee576471de2e0ae1296ddc3243cacea1', 'curl/8.19.0', '::1', 0, NULL, '2026-10-05 03:21:33', '2026-09-28 03:21:33');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (5, 8, 'd04075a0e0cc2f32b019c9535e4a2ee2c55b79d872806a1738e8531a0e6e2dc7', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '::1', 0, NULL, '2026-10-05 03:22:13', '2026-09-28 03:22:13');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (6, 10, 'e4053bd10835076d84465b857cc9ecafb97273dc6ad321135e80e0763cec3b33', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '::1', 0, NULL, '2026-10-05 03:23:24', '2026-09-28 03:23:24');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (7, 9, '73e8497a3086d60482366d48315e5851fc0f4bf798e48a952158521a29e177cd', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '::1', 0, NULL, '2026-10-05 03:24:59', '2026-09-28 03:24:59');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (8, 9, '3f9cd1077f019f3018065d3fb71720f5aa60c72398d823b920c240b71ceca374', 'curl/8.19.0', '::1', 0, NULL, '2026-10-05 03:32:27', '2026-09-28 03:32:27');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (9, 10, '07b7f740a495a775d78321b16c9bbbe70e99c964e52d6ce92569b1e4690239dd', 'curl/8.19.0', '::1', 0, NULL, '2026-10-05 03:32:41', '2026-09-28 03:32:41');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (10, 8, '2cfa3d52b29a30bbe25d70a1ac116c2bb9e4d70c69f6ad3143f03b44b0e6385d', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '::1', 0, NULL, '2026-10-05 03:33:53', '2026-09-28 03:33:53');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (11, 10, '610b8495ff5d4ca73e5384de957bce5c3cc7332e70830ab1f46cb81ac0193ff2', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '::1', 0, NULL, '2026-10-05 03:35:48', '2026-09-28 03:35:48');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `is_revoked`, `replaced_by_token_id`, `expires_at`, `created_at`) VALUES (12, 10, '708d3e645c396f17ac5cd8d5d8a81940c8eca556dc675231ff00a3d44b7be170', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '::1', 0, NULL, '2026-10-05 03:44:05', '2026-09-28 03:44:05');
UNLOCK TABLES;

-- Table structure for reports
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reporter_id` int(10) unsigned NOT NULL,
  `reported_user_id` int(10) unsigned DEFAULT NULL,
  `reported_donation_id` int(10) unsigned DEFAULT NULL,
  `reason` varchar(500) NOT NULL,
  `details` text DEFAULT NULL,
  `resolution_notes` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `resolved_by` int(10) unsigned DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reports_reporter_donation` (`reporter_id`,`reported_donation_id`),
  KEY `idx_reports_reporter_id` (`reporter_id`),
  KEY `idx_reports_reported_user_id` (`reported_user_id`),
  KEY `idx_reports_reported_donation_id` (`reported_donation_id`),
  KEY `idx_reports_status` (`status`),
  KEY `idx_reports_resolved_by` (`resolved_by`),
  CONSTRAINT `fk_reports_reported_donation` FOREIGN KEY (`reported_donation_id`) REFERENCES `donation_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reports_reported_user` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reports_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reports_resolved_by` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_reports_target_present` CHECK (`reported_user_id` is not null or `reported_donation_id` is not null)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table reports
LOCK TABLES `reports` WRITE;
INSERT INTO `reports` (`id`, `reporter_id`, `reported_user_id`, `reported_donation_id`, `reason`, `details`, `resolution_notes`, `status`, `resolved_by`, `resolved_at`, `created_at`, `updated_at`) VALUES (1, 6, NULL, 1, 'Donation description does not match photo provided.', NULL, NULL, 'pending', NULL, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `reports` (`id`, `reporter_id`, `reported_user_id`, `reported_donation_id`, `reason`, `details`, `resolution_notes`, `status`, `resolved_by`, `resolved_at`, `created_at`, `updated_at`) VALUES (2, 5, 3, NULL, 'User was unresponsive after accepting pickup time.', NULL, NULL, 'pending', NULL, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
UNLOCK TABLES;

-- Table structure for saved_addresses
DROP TABLE IF EXISTS `saved_addresses`;
CREATE TABLE `saved_addresses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `label` enum('home','office','other','custom') NOT NULL,
  `custom_label` varchar(50) DEFAULT NULL,
  `full_address` varchar(500) NOT NULL,
  `division` varchar(100) NOT NULL,
  `district` varchar(100) NOT NULL,
  `area` varchar(100) NOT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `building_name` varchar(100) DEFAULT NULL,
  `floor` varchar(20) DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `delivery_instructions` varchar(500) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `contact_person_name` varchar(100) NOT NULL,
  `contact_phone` varchar(20) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_saved_addresses_user_id` (`user_id`),
  KEY `idx_saved_addresses_is_default` (`is_default`),
  CONSTRAINT `fk_saved_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_saved_addresses_custom_label` CHECK (`label` = 'custom' or `custom_label` is null)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table saved_addresses
LOCK TABLES `saved_addresses` WRITE;
INSERT INTO `saved_addresses` (`id`, `user_id`, `label`, `custom_label`, `full_address`, `division`, `district`, `area`, `postal_code`, `building_name`, `floor`, `landmark`, `delivery_instructions`, `latitude`, `longitude`, `contact_person_name`, `contact_phone`, `is_default`, `created_at`, `updated_at`) VALUES (1, 2, 'home', NULL, 'House 10, Road 5, Gulshan 1', 'Dhaka', 'Dhaka', 'Gulshan', '1212', 'Gulshan Heights', '3rd Floor', 'Near British American School', 'Ring bell twice', '23.78250000', '90.41250000', 'Rahim Uddin', '01700000002', 1, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `saved_addresses` (`id`, `user_id`, `label`, `custom_label`, `full_address`, `division`, `district`, `area`, `postal_code`, `building_name`, `floor`, `landmark`, `delivery_instructions`, `latitude`, `longitude`, `contact_person_name`, `contact_phone`, `is_default`, `created_at`, `updated_at`) VALUES (2, 2, 'office', NULL, 'Office 4B, Trade Center, Motijheel', 'Dhaka', 'Dhaka', 'Motijheel', '1000', 'AB Trade Center', '8th Floor', 'Near DMP Headquarters', 'Ask security for Rahim', '23.72500000', '90.41000000', 'Rahim Uddin', '01700000002', 0, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `saved_addresses` (`id`, `user_id`, `label`, `custom_label`, `full_address`, `division`, `district`, `area`, `postal_code`, `building_name`, `floor`, `landmark`, `delivery_instructions`, `latitude`, `longitude`, `contact_person_name`, `contact_phone`, `is_default`, `created_at`, `updated_at`) VALUES (3, 3, 'home', NULL, 'Flat 2A, Road 27, Dhanmondi', 'Dhaka', 'Dhaka', 'Dhanmondi', '1205', 'Dhanmondi Residential', '2nd Floor', 'Near Rabindra Sarobar', 'Call before arriving', '23.74600000', '90.38200000', 'Karim Ahmed', '01700000003', 1, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `saved_addresses` (`id`, `user_id`, `label`, `custom_label`, `full_address`, `division`, `district`, `area`, `postal_code`, `building_name`, `floor`, `landmark`, `delivery_instructions`, `latitude`, `longitude`, `contact_person_name`, `contact_phone`, `is_default`, `created_at`, `updated_at`) VALUES (4, 4, 'home', NULL, 'House 15, Sector 7, Uttara', 'Dhaka', 'Dhaka', 'Uttara', '1230', 'Uttara Residential', 'Ground Floor', 'Near Uttara Medical College', 'Leave at gate if no response', '23.87200000', '90.40000000', 'Fatima Begum', '01700000004', 1, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
UNLOCK TABLES;

-- Table structure for schema_migrations
DROP TABLE IF EXISTS `schema_migrations`;
CREATE TABLE `schema_migrations` (
  `id` varchar(100) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table schema_migrations
LOCK TABLES `schema_migrations` WRITE;
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('002_auth_security', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('003_donation_accept', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('004_donation_scheduled_status', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('005_complete_donation', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('006_status_flow_ratings_reports', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('012_google_auth_enhancements', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_013_service_areas_fix', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_014_admin_announcement_type', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_015_report_moderation_fields', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_016_donation_cancelled_status', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_017_leaderboard_opt_out', '2026-09-28 03:03:59');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_018_notification_templates', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_019_recurring_donations', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_020_volunteer_team_base_location', '2026-09-28 03:07:49');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_021_fix_volunteer_leaderboard_team_credits', '2026-09-28 03:08:15');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_022_volunteer_team_join_requests', '2026-09-28 03:08:41');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_023_team_join_request_notifications_and_constraint', '2026-09-28 03:08:41');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_024_add_is_deleted_to_donation_requests', '2026-09-28 03:08:41');
INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES ('migration_025_status_history_actor_attribution_fix', '2026-09-28 03:08:41');
UNLOCK TABLES;

-- Table structure for team_invitations
DROP TABLE IF EXISTS `team_invitations`;
CREATE TABLE `team_invitations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `team_id` int(10) unsigned NOT NULL,
  `invited_by` int(10) unsigned NOT NULL,
  `invited_user_id` int(10) unsigned NOT NULL,
  `invited_email` varchar(150) DEFAULT NULL,
  `status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
  `expires_at` datetime NOT NULL,
  `responded_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_team_invitations_pending` (`team_id`,`invited_user_id`,`status`),
  KEY `fk_team_invitations_invited_by` (`invited_by`),
  KEY `idx_team_invitations_team` (`team_id`),
  KEY `idx_team_invitations_invited_user` (`invited_user_id`),
  KEY `idx_team_invitations_status` (`status`),
  KEY `idx_team_invitations_expires_at` (`expires_at`),
  CONSTRAINT `fk_team_invitations_invited_by` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_invitations_invited_user` FOREIGN KEY (`invited_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_invitations_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table team_invitations
LOCK TABLES `team_invitations` WRITE;
INSERT INTO `team_invitations` (`id`, `team_id`, `invited_by`, `invited_user_id`, `invited_email`, `status`, `expires_at`, `responded_at`, `created_at`) VALUES (1, 1, 5, 6, 'nusrat.volunteer@example.com', 'declined', '2026-07-20 12:00:00', '2026-07-15 04:00:00', '2026-09-28 03:02:50');
INSERT INTO `team_invitations` (`id`, `team_id`, `invited_by`, `invited_user_id`, `invited_email`, `status`, `expires_at`, `responded_at`, `created_at`) VALUES (2, 2, 6, 7, 'tanvir.volunteer@example.com', 'pending', '2026-08-30 12:00:00', NULL, '2026-09-28 03:02:50');
UNLOCK TABLES;

-- Table structure for team_join_requests
DROP TABLE IF EXISTS `team_join_requests`;
CREATE TABLE `team_join_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `team_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `status` enum('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `message` varchar(255) DEFAULT NULL,
  `responded_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `pending_flag` tinyint(1) GENERATED ALWAYS AS (case when `status` = 'pending' then 1 else NULL end) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_team_join_requests_one_pending` (`team_id`,`user_id`,`pending_flag`),
  KEY `idx_team_join_requests_team` (`team_id`),
  KEY `idx_team_join_requests_user` (`user_id`),
  KEY `idx_team_join_requests_status` (`status`),
  CONSTRAINT `fk_team_join_requests_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_team_join_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for team_members
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE `team_members` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `team_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `role` enum('leader','member') NOT NULL DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_team_members_user` (`user_id`),
  KEY `idx_team_members_team` (`team_id`),
  KEY `idx_team_members_user` (`user_id`),
  KEY `idx_team_members_role` (`role`),
  CONSTRAINT `fk_team_members_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table team_members
LOCK TABLES `team_members` WRITE;
INSERT INTO `team_members` (`id`, `team_id`, `user_id`, `role`, `joined_at`) VALUES (1, 1, 5, 'leader', '2026-07-01 04:00:00');
INSERT INTO `team_members` (`id`, `team_id`, `user_id`, `role`, `joined_at`) VALUES (2, 1, 7, 'member', '2026-07-05 08:30:00');
INSERT INTO `team_members` (`id`, `team_id`, `user_id`, `role`, `joined_at`) VALUES (3, 2, 6, 'leader', '2026-07-02 03:00:00');
UNLOCK TABLES;

-- Table structure for teams
DROP TABLE IF EXISTS `teams`;
CREATE TABLE `teams` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `leader_id` int(10) unsigned NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `coverage_radius` decimal(10,2) DEFAULT NULL,
  `base_address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teams_leader` (`leader_id`),
  KEY `idx_teams_leader` (`leader_id`),
  KEY `idx_teams_location` (`latitude`,`longitude`),
  CONSTRAINT `fk_teams_leader` FOREIGN KEY (`leader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table teams
LOCK TABLES `teams` WRITE;
INSERT INTO `teams` (`id`, `name`, `description`, `leader_id`, `latitude`, `longitude`, `coverage_radius`, `base_address`, `created_at`, `updated_at`) VALUES (1, 'Dhaka Food Rescue Team', 'Focused on rescuing food from restaurants and events', 5, NULL, NULL, NULL, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `teams` (`id`, `name`, `description`, `leader_id`, `latitude`, `longitude`, `coverage_radius`, `base_address`, `created_at`, `updated_at`) VALUES (2, 'Community Helpers', 'General community support and donation coordination', 6, NULL, NULL, NULL, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
UNLOCK TABLES;

-- Table structure for top_donors
DROP TABLE IF EXISTS `top_donors`;
undefined;

-- Data for table top_donors
LOCK TABLES `top_donors` WRITE;
INSERT INTO `top_donors` (`user_id`, `donor_name`, `profile_photo`, `total_donations`, `completed_count`, `total_quantity_donated`, `average_rating`) VALUES (9, 'Taohid Donor', 'profiles\\profiles-1790565955502-19081051.jpg', 18, '2', '15', NULL);
INSERT INTO `top_donors` (`user_id`, `donor_name`, `profile_photo`, `total_donations`, `completed_count`, `total_quantity_donated`, `average_rating`) VALUES (3, 'Karim Ahmed', NULL, 2, '1', '30', '5.00');
INSERT INTO `top_donors` (`user_id`, `donor_name`, `profile_photo`, `total_donations`, `completed_count`, `total_quantity_donated`, `average_rating`) VALUES (2, 'Rahim Uddin', NULL, 3, '1', '20', '5.00');
INSERT INTO `top_donors` (`user_id`, `donor_name`, `profile_photo`, `total_donations`, `completed_count`, `total_quantity_donated`, `average_rating`) VALUES (4, 'Fatima Begum', NULL, 2, '1', '12', '4.00');
INSERT INTO `top_donors` (`user_id`, `donor_name`, `profile_photo`, `total_donations`, `completed_count`, `total_quantity_donated`, `average_rating`) VALUES (15, 'Jamal Hossain', NULL, 2, '0', '0', NULL);
INSERT INTO `top_donors` (`user_id`, `donor_name`, `profile_photo`, `total_donations`, `completed_count`, `total_quantity_donated`, `average_rating`) VALUES (14, 'Ayesha Khan', NULL, 3, '0', '0', NULL);
INSERT INTO `top_donors` (`user_id`, `donor_name`, `profile_photo`, `total_donations`, `completed_count`, `total_quantity_donated`, `average_rating`) VALUES (13, 'Karim Uddin', NULL, 3, '0', '0', NULL);
INSERT INTO `top_donors` (`user_id`, `donor_name`, `profile_photo`, `total_donations`, `completed_count`, `total_quantity_donated`, `average_rating`) VALUES (12, 'Fatima Begum', NULL, 3, '0', '0', NULL);
INSERT INTO `top_donors` (`user_id`, `donor_name`, `profile_photo`, `total_donations`, `completed_count`, `total_quantity_donated`, `average_rating`) VALUES (11, 'Rahim Ahmed', NULL, 3, '0', '0', NULL);
UNLOCK TABLES;

-- Table structure for top_volunteers
DROP TABLE IF EXISTS `top_volunteers`;
undefined;

-- Data for table top_volunteers
LOCK TABLES `top_volunteers` WRITE;
INSERT INTO `top_volunteers` (`user_id`, `volunteer_name`, `profile_photo`, `total_pickups`, `completed_count`, `average_rating`) VALUES (5, 'Sabbir Hossain', NULL, 3, '2', '5.00');
INSERT INTO `top_volunteers` (`user_id`, `volunteer_name`, `profile_photo`, `total_pickups`, `completed_count`, `average_rating`) VALUES (10, 'Mintu Volunteer', 'profiles\\profiles-1790566112417-434473402.jpg', 4, '2', '5.00');
INSERT INTO `top_volunteers` (`user_id`, `volunteer_name`, `profile_photo`, `total_pickups`, `completed_count`, `average_rating`) VALUES (6, 'Nusrat Jahan', NULL, 2, '1', '4.00');
INSERT INTO `top_volunteers` (`user_id`, `volunteer_name`, `profile_photo`, `total_pickups`, `completed_count`, `average_rating`) VALUES (7, 'Tanvir Islam', NULL, 1, '0', NULL);
UNLOCK TABLES;

-- Table structure for user_achievements
DROP TABLE IF EXISTS `user_achievements`;
CREATE TABLE `user_achievements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `achievement_type` varchar(50) NOT NULL,
  `achievement_name` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `unlocked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_achievement` (`user_id`,`achievement_type`),
  KEY `idx_user_achievements_user_id` (`user_id`),
  KEY `idx_user_achievements_type` (`achievement_type`),
  CONSTRAINT `fk_user_achievements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table user_achievements
LOCK TABLES `user_achievements` WRITE;
INSERT INTO `user_achievements` (`id`, `user_id`, `achievement_type`, `achievement_name`, `description`, `icon`, `unlocked_at`) VALUES (1, 2, 'first_donation', 'First Donation', 'Completed your first donation', 'gift', '2026-07-10 07:00:00');
INSERT INTO `user_achievements` (`id`, `user_id`, `achievement_type`, `achievement_name`, `description`, `icon`, `unlocked_at`) VALUES (2, 2, 'helping_hand', 'Helping Hand', 'Completed 5 donations', 'hand-heart', '2026-07-13 09:00:00');
INSERT INTO `user_achievements` (`id`, `user_id`, `achievement_type`, `achievement_name`, `description`, `icon`, `unlocked_at`) VALUES (3, 3, 'first_donation', 'First Donation', 'Completed your first donation', 'gift', '2026-07-08 11:00:00');
INSERT INTO `user_achievements` (`id`, `user_id`, `achievement_type`, `achievement_name`, `description`, `icon`, `unlocked_at`) VALUES (4, 4, 'first_donation', 'First Donation', 'Completed your first donation', 'gift', '2026-07-05 03:00:00');
INSERT INTO `user_achievements` (`id`, `user_id`, `achievement_type`, `achievement_name`, `description`, `icon`, `unlocked_at`) VALUES (5, 5, 'first_pickup', 'First Pickup', 'Completed your first pickup', 'truck', '2026-07-10 07:00:00');
INSERT INTO `user_achievements` (`id`, `user_id`, `achievement_type`, `achievement_name`, `description`, `icon`, `unlocked_at`) VALUES (6, 5, 'reliable_volunteer', 'Reliable Volunteer', 'Completed 5 pickups', 'shield-check', '2026-07-13 09:00:00');
INSERT INTO `user_achievements` (`id`, `user_id`, `achievement_type`, `achievement_name`, `description`, `icon`, `unlocked_at`) VALUES (7, 6, 'first_pickup', 'First Pickup', 'Completed your first pickup', 'truck', '2026-07-08 11:00:00');
INSERT INTO `user_achievements` (`id`, `user_id`, `achievement_type`, `achievement_name`, `description`, `icon`, `unlocked_at`) VALUES (8, 7, 'first_pickup', 'First Pickup', 'Completed your first pickup', 'truck', '2026-07-05 03:00:00');
UNLOCK TABLES;

-- Table structure for user_preferences
DROP TABLE IF EXISTS `user_preferences`;
CREATE TABLE `user_preferences` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `preferred_contact` enum('email','phone','both') NOT NULL DEFAULT 'email',
  `receive_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `preferred_pickup_time` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_preferences_user_id` (`user_id`),
  CONSTRAINT `fk_user_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table user_preferences
LOCK TABLES `user_preferences` WRITE;
INSERT INTO `user_preferences` (`id`, `user_id`, `preferred_contact`, `receive_notifications`, `preferred_pickup_time`, `created_at`, `updated_at`) VALUES (1, 2, 'email', 1, 'evening', '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `user_preferences` (`id`, `user_id`, `preferred_contact`, `receive_notifications`, `preferred_pickup_time`, `created_at`, `updated_at`) VALUES (2, 3, 'phone', 1, 'morning', '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `user_preferences` (`id`, `user_id`, `preferred_contact`, `receive_notifications`, `preferred_pickup_time`, `created_at`, `updated_at`) VALUES (3, 4, 'both', 1, 'afternoon', '2026-09-28 03:02:50', '2026-09-28 03:02:50');
UNLOCK TABLES;

-- Table structure for users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('donor','volunteer','admin') NOT NULL DEFAULT 'donor',
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `phone` varchar(20) DEFAULT NULL,
  `phone_verified` tinyint(1) NOT NULL DEFAULT 0,
  `address` varchar(255) DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other','prefer_not_to_say') DEFAULT NULL,
  `provider` varchar(20) DEFAULT NULL,
  `google_id` varchar(64) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `show_on_leaderboard` tinyint(1) NOT NULL DEFAULT 1,
  `is_banned` tinyint(1) NOT NULL DEFAULT 0,
  `failed_login_attempts` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `lock_until` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `last_user_agent` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_google_id` (`google_id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_deleted` (`is_deleted`),
  KEY `idx_users_is_banned` (`is_banned`),
  KEY `idx_users_lock_until` (`lock_until`),
  KEY `idx_users_email_verified` (`email_verified`),
  CONSTRAINT `chk_users_email_format` CHECK (`email` like '%_@__%.__%')
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table users
LOCK TABLES `users` WRITE;
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (1, 'Admin User', 'admin@portionbridge.com', '$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'admin', 1, '01700000001', 0, 'Dhaka, Bangladesh', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (2, 'Rahim Uddin', 'rahim.donor@example.com', '$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'donor', 1, '01700000002', 0, 'Gulshan, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (3, 'Karim Ahmed', 'karim.donor@example.com', '$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'donor', 1, '01700000003', 0, 'Dhanmondi, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (4, 'Fatima Begum', 'fatima.donor@example.com', '$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'donor', 1, '01700000004', 0, 'Uttara, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (5, 'Sabbir Hossain', 'sabbir.volunteer@example.com', '$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'volunteer', 1, '01700000005', 0, 'Mirpur, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (6, 'Nusrat Jahan', 'nusrat.volunteer@example.com', '$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'volunteer', 1, '01700000006', 0, 'Banani, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (7, 'Tanvir Islam', 'tanvir.volunteer@example.com', '$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'volunteer', 1, '01700000007', 0, 'Mohammadpur, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (8, 'Taohid Bhuiyan', 'taohid_admin@gmail.com', '$2b$12$MgnMKzNWpg9HaX95sWmICuOXXcoQaM4PhxqYvXmD43pgTn0cHaXtm', 'admin', 1, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, '2026-09-28 03:33:53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 0, NULL, '2026-09-28 03:09:59', '2026-09-28 03:33:53');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (9, 'Taohid Donor', 'tauhidtbm2@gmail.com', '$2b$12$WyhU14syOtn60lanl6uNHuVBxi8CR.L0VTBGmilrFvZEc6Hempm9y', 'donor', 1, '01939954398', 0, 'Kurmitola, Dhaka', 'profiles\\profiles-1790565955502-19081051.jpg', NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, '2026-09-28 03:32:27', '::1', 'curl/8.19.0', 0, NULL, '2026-09-28 03:23:16', '2026-09-28 03:32:27');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (10, 'Mintu Volunteer', 'mintumohammad15678@gmail.com', '$2b$12$0lgkkBbUWIQ5lrM.T4Q9t.g9ecEBArBRPHbfRLpHUGS20qBi6ixxe', 'volunteer', 1, '01700000000', 0, 'Dhaka, Bangladesh', 'profiles\\profiles-1790566112417-434473402.jpg', NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, '2026-09-28 03:44:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', 0, NULL, '2026-09-28 03:23:16', '2026-09-28 03:44:05');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (11, 'Rahim Ahmed', 'rahim.ahmed@gmail.com', '$2b$12$0V23YLKif5vRed1f4j5Yz.BrawF0bKqnNsAZP1/.jVjCZJJE.g7u.', 'donor', 1, '01812345678', 0, 'Dhanmondi, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:29:49', '2026-09-28 03:29:49');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (12, 'Fatima Begum', 'fatima.begum@yahoo.com', '$2b$12$Z2VHZGwIP0BZa3LOvgiLiuzYA0pPn8ao/5BrFL3Xxmu96f19xAEju', 'donor', 1, '01687654321', 0, 'Gulshan, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:29:50', '2026-09-28 03:29:50');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (13, 'Karim Uddin', 'karim.uddin@hotmail.com', '$2b$12$Cf2cOOL3e1lVXKgBjTQyq.1Vd0CdB7pkMaAQGGubyGZMOOd.nvDB6', 'donor', 1, '01523456789', 0, 'Mirpur, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:29:51', '2026-09-28 03:29:51');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (14, 'Ayesha Khan', 'ayesha.khan@gmail.com', '$2b$12$P9Q66mO6PL464qrA8IMsIuqnepB7OcO3gfPgeJCVKx6x9KInfW68m', 'donor', 1, '01734567890', 0, 'Uttara, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:29:51', '2026-09-28 03:29:51');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (15, 'Jamal Hossain', 'jamal.hossain@yahoo.com', '$2b$12$//etgiQUpn36W979Ozk.pO2zwYD8GWmFvFtdUAa2qLMwfxBaPDl/.', 'donor', 1, '01945678901', 0, 'Mohammadpur, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:29:52', '2026-09-28 03:29:52');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (16, 'Salim Rahman', 'salim.rahman@gmail.com', '$2b$12$bWbxdji0krzfiULA7rSSOuJ6VQIi6HfDFLN1KgYKeEbQE1zQSkMdO', 'volunteer', 1, '01856789012', 0, 'Bashundhara, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:29:53', '2026-09-28 03:29:53');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (17, 'Nasreen Akter', 'nasreen.akter@yahoo.com', '$2b$12$cvfWLqBE/AsEDFgsbONXbugqO.nyV.ujV6Oo8JQ5OWLCe58vefFJe', 'volunteer', 1, '01667890123', 0, 'Banani, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:29:53', '2026-09-28 03:29:53');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (18, 'Rafiq Islam', 'rafiq.islam@hotmail.com', '$2b$12$ROCVbtu45yqgKjZA/Uj2WeHY6/ZeSa2zIQjs4pyw.oi7zqLj7gwHG', 'volunteer', 1, '01578901234', 0, 'Paltan, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:29:54', '2026-09-28 03:29:54');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (19, 'Sultana Parvin', 'sultana.parvin@gmail.com', '$2b$12$c4PevuPTu1qw/omxohfj3em0l3C4626ZQ5.LYq1YwiDoOoMDiwlC6', 'volunteer', 1, '01789012345', 0, 'Motijheel, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:29:54', '2026-09-28 03:29:54');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `email_verified`, `phone`, `phone_verified`, `address`, `profile_photo`, `date_of_birth`, `gender`, `provider`, `google_id`, `profile_picture`, `show_on_leaderboard`, `is_banned`, `failed_login_attempts`, `lock_until`, `last_login_at`, `last_login_ip`, `last_user_agent`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`) VALUES (20, 'Habibur Rahman', 'habib.rahman@yahoo.com', '$2b$12$ysaFy4tFdSxykGNDyVxsLuXPTsAYg2hz2jUXj1Mf2EEjIu3D73BJm', 'volunteer', 1, '01990123456', 0, 'Siddiqueganj, Dhaka', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, NULL, NULL, NULL, NULL, 0, NULL, '2026-09-28 03:29:55', '2026-09-28 03:29:55');
UNLOCK TABLES;

-- Table structure for volunteer_profiles
DROP TABLE IF EXISTS `volunteer_profiles`;
CREATE TABLE `volunteer_profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `bio` text DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `availability` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`availability`)),
  `service_areas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`service_areas`)),
  `vehicle_type` enum('none','bicycle','motorcycle','car','van','truck') DEFAULT NULL,
  `total_pickups` int(10) unsigned NOT NULL DEFAULT 0,
  `rating` decimal(3,2) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_online` tinyint(1) NOT NULL DEFAULT 0,
  `last_location_update` timestamp NULL DEFAULT NULL,
  `coverage_radius` decimal(10,2) DEFAULT NULL,
  `base_address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_volunteer_profiles_user_id` (`user_id`),
  KEY `idx_volunteer_profiles_location` (`latitude`,`longitude`),
  KEY `idx_volunteer_profiles_is_online` (`is_online`),
  CONSTRAINT `fk_volunteer_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table volunteer_profiles
LOCK TABLES `volunteer_profiles` WRITE;
INSERT INTO `volunteer_profiles` (`id`, `user_id`, `bio`, `skills`, `availability`, `service_areas`, `vehicle_type`, `total_pickups`, `rating`, `latitude`, `longitude`, `is_online`, `last_location_update`, `coverage_radius`, `base_address`, `created_at`, `updated_at`) VALUES (1, 5, 'Passionate about reducing food waste and helping communities', '["driving", "communication", "time_management"]', '["weekends"]', '["Dhaka North", "Gulshan", "Banani"]', 'motorcycle', 3, '4.50', NULL, NULL, 0, NULL, NULL, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `volunteer_profiles` (`id`, `user_id`, `bio`, `skills`, `availability`, `service_areas`, `vehicle_type`, `total_pickups`, `rating`, `latitude`, `longitude`, `is_online`, `last_location_update`, `coverage_radius`, `base_address`, `created_at`, `updated_at`) VALUES (2, 6, 'Dedicated volunteer with experience in logistics', '["organization", "heavy_lifting", "customer_service"]', '["weekdays"]', '["Dhaka South", "Dhanmondi", "Uttara"]', 'van', 2, '4.00', NULL, NULL, 0, NULL, NULL, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `volunteer_profiles` (`id`, `user_id`, `bio`, `skills`, `availability`, `service_areas`, `vehicle_type`, `total_pickups`, `rating`, `latitude`, `longitude`, `is_online`, `last_location_update`, `coverage_radius`, `base_address`, `created_at`, `updated_at`) VALUES (3, 7, 'Environmental activist focused on sustainable practices', '["sustainability", "coordination", "teamwork"]', '["flexible"]', '["Mirpur", "Mohammadpur", "Pallabi"]', 'car', 2, '4.50', NULL, NULL, 0, NULL, NULL, NULL, '2026-09-28 03:02:50', '2026-09-28 03:02:50');
INSERT INTO `volunteer_profiles` (`id`, `user_id`, `bio`, `skills`, `availability`, `service_areas`, `vehicle_type`, `total_pickups`, `rating`, `latitude`, `longitude`, `is_online`, `last_location_update`, `coverage_radius`, `base_address`, `created_at`, `updated_at`) VALUES (4, 10, NULL, NULL, '["morning","afternoon","evening"]', '[{"area":"Dhaka","coordinates":{"lat":23.8103,"lng":90.4125}},{"area":"Mirpur","coordinates":{"lat":23.8223,"lng":90.3654}},{"area":"Uttara","coordinates":{"lat":23.8737,"lng":90.3928}}]', 'motorcycle', 0, NULL, '23.81030000', '90.41250000', 0, '2026-09-28 03:23:16', '5.00', 'Dhaka, Bangladesh', '2026-09-28 03:23:16', '2026-09-28 03:23:16');
INSERT INTO `volunteer_profiles` (`id`, `user_id`, `bio`, `skills`, `availability`, `service_areas`, `vehicle_type`, `total_pickups`, `rating`, `latitude`, `longitude`, `is_online`, `last_location_update`, `coverage_radius`, `base_address`, `created_at`, `updated_at`) VALUES (6, 16, NULL, NULL, '["morning","afternoon","evening"]', '[{"area":"Bashundhara","coordinates":{"lat":23.8123,"lng":90.4234}},{"area":"Gulshan","coordinates":{"lat":23.7823,"lng":90.4034}},{"area":"Banani","coordinates":{"lat":23.7923,"lng":90.4134}}]', 'car', 0, NULL, '23.81230000', '90.42340000', 0, '2026-09-28 03:29:55', '8.00', 'Bashundhara, Dhaka', '2026-09-28 03:29:55', '2026-09-28 03:29:55');
INSERT INTO `volunteer_profiles` (`id`, `user_id`, `bio`, `skills`, `availability`, `service_areas`, `vehicle_type`, `total_pickups`, `rating`, `latitude`, `longitude`, `is_online`, `last_location_update`, `coverage_radius`, `base_address`, `created_at`, `updated_at`) VALUES (8, 17, NULL, NULL, '["afternoon","evening"]', '[{"area":"Gulshan","coordinates":{"lat":23.7823,"lng":90.4034}},{"area":"Banani","coordinates":{"lat":23.7923,"lng":90.4134}}]', 'bicycle', 0, NULL, '23.78230000', '90.40340000', 0, '2026-09-28 03:29:55', '3.00', 'Gulshan, Dhaka', '2026-09-28 03:29:55', '2026-09-28 03:29:55');
INSERT INTO `volunteer_profiles` (`id`, `user_id`, `bio`, `skills`, `availability`, `service_areas`, `vehicle_type`, `total_pickups`, `rating`, `latitude`, `longitude`, `is_online`, `last_location_update`, `coverage_radius`, `base_address`, `created_at`, `updated_at`) VALUES (10, 18, NULL, NULL, '["morning","evening"]', '[{"area":"Paltan","coordinates":{"lat":23.7323,"lng":90.3934}},{"area":"Motijheel","coordinates":{"lat":23.7423,"lng":90.4034}},{"area":"Siddiqueganj","coordinates":{"lat":23.7523,"lng":90.4134}}]', 'motorcycle', 0, NULL, '23.73230000', '90.39340000', 0, '2026-09-28 03:29:55', '6.00', 'Paltan, Dhaka', '2026-09-28 03:29:55', '2026-09-28 03:29:55');
INSERT INTO `volunteer_profiles` (`id`, `user_id`, `bio`, `skills`, `availability`, `service_areas`, `vehicle_type`, `total_pickups`, `rating`, `latitude`, `longitude`, `is_online`, `last_location_update`, `coverage_radius`, `base_address`, `created_at`, `updated_at`) VALUES (12, 19, NULL, NULL, '["morning","afternoon"]', '[{"area":"Motijheel","coordinates":{"lat":23.7423,"lng":90.4034}}]', '', 0, NULL, '23.74230000', '90.40340000', 0, '2026-09-28 03:29:55', '2.00', 'Motijheel, Dhaka', '2026-09-28 03:29:55', '2026-09-28 03:29:55');
INSERT INTO `volunteer_profiles` (`id`, `user_id`, `bio`, `skills`, `availability`, `service_areas`, `vehicle_type`, `total_pickups`, `rating`, `latitude`, `longitude`, `is_online`, `last_location_update`, `coverage_radius`, `base_address`, `created_at`, `updated_at`) VALUES (14, 20, NULL, NULL, '["morning","afternoon","evening","night"]', '[{"area":"Siddiqueganj","coordinates":{"lat":23.7523,"lng":90.4134}},{"area":"Paltan","coordinates":{"lat":23.7323,"lng":90.3934}},{"area":"Motijheel","coordinates":{"lat":23.7423,"lng":90.4034}},{"area":"Gulshan","coordinates":{"lat":23.7823,"lng":90.4034}}]', 'motorcycle', 0, NULL, '23.75230000', '90.41340000', 0, '2026-09-28 03:29:55', '10.00', 'Siddiqueganj, Dhaka', '2026-09-28 03:29:55', '2026-09-28 03:29:55');
UNLOCK TABLES;

SET FOREIGN_KEY_CHECKS = 1;
-- Backup completed successfully
