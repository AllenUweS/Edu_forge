-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: exam_editor_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add user',4,'add_user'),(14,'Can change user',4,'change_user'),(15,'Can delete user',4,'delete_user'),(16,'Can view user',4,'view_user'),(17,'Can add content type',5,'add_contenttype'),(18,'Can change content type',5,'change_contenttype'),(19,'Can delete content type',5,'delete_contenttype'),(20,'Can view content type',5,'view_contenttype'),(21,'Can add session',6,'add_session'),(22,'Can change session',6,'change_session'),(23,'Can delete session',6,'delete_session'),(24,'Can view session',6,'view_session'),(25,'Can add exam paper',7,'add_exampaper'),(26,'Can change exam paper',7,'change_exampaper'),(27,'Can delete exam paper',7,'delete_exampaper'),(28,'Can view exam paper',7,'view_exampaper'),(29,'Can add exam page',8,'add_exampage'),(30,'Can change exam page',8,'change_exampage'),(31,'Can delete exam page',8,'delete_exampage'),(32,'Can view exam page',8,'view_exampage'),(33,'Can add uploaded image',9,'add_uploadedimage'),(34,'Can change uploaded image',9,'change_uploadedimage'),(35,'Can delete uploaded image',9,'delete_uploadedimage'),(36,'Can view uploaded image',9,'view_uploadedimage'),(37,'Can add question',10,'add_question'),(38,'Can change question',10,'change_question'),(39,'Can delete question',10,'delete_question'),(40,'Can view question',10,'view_question'),(41,'Can add option',11,'add_option'),(42,'Can change option',11,'change_option'),(43,'Can delete option',11,'delete_option'),(44,'Can view option',11,'view_option'),(45,'Can add question equation',12,'add_questionequation'),(46,'Can change question equation',12,'change_questionequation'),(47,'Can delete question equation',12,'delete_questionequation'),(48,'Can view question equation',12,'view_questionequation'),(49,'Can add symbol',13,'add_symbol'),(50,'Can change symbol',13,'change_symbol'),(51,'Can delete symbol',13,'delete_symbol'),(52,'Can view symbol',13,'view_symbol'),(53,'Can add option equation',14,'add_optionequation'),(54,'Can change option equation',14,'change_optionequation'),(55,'Can delete option equation',14,'delete_optionequation'),(56,'Can view option equation',14,'view_optionequation');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(4,'auth','user'),(5,'contenttypes','contenttype'),(8,'editor','exampage'),(7,'editor','exampaper'),(11,'editor','option'),(14,'editor','optionequation'),(10,'editor','question'),(12,'editor','questionequation'),(13,'editor','symbol'),(9,'editor','uploadedimage'),(6,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-08-26 08:18:01.689244'),(2,'auth','0001_initial','2026-08-26 08:18:02.447370'),(3,'admin','0001_initial','2026-08-26 08:18:02.622066'),(4,'admin','0002_logentry_remove_auto_add','2026-08-26 08:18:02.630822'),(5,'admin','0003_logentry_add_action_flag_choices','2026-08-26 08:18:02.642936'),(6,'contenttypes','0002_remove_content_type_name','2026-08-26 08:18:02.812373'),(7,'auth','0002_alter_permission_name_max_length','2026-08-26 08:18:02.901534'),(8,'auth','0003_alter_user_email_max_length','2026-08-26 08:18:02.936042'),(9,'auth','0004_alter_user_username_opts','2026-08-26 08:18:02.942508'),(10,'auth','0005_alter_user_last_login_null','2026-08-26 08:18:03.009996'),(11,'auth','0006_require_contenttypes_0002','2026-08-26 08:18:03.014000'),(12,'auth','0007_alter_validators_add_error_messages','2026-08-26 08:18:03.021223'),(13,'auth','0008_alter_user_username_max_length','2026-08-26 08:18:03.096922'),(14,'auth','0009_alter_user_last_name_max_length','2026-08-26 08:18:03.171918'),(15,'auth','0010_alter_group_name_max_length','2026-08-26 08:18:03.192094'),(16,'auth','0011_update_proxy_permissions','2026-08-26 08:18:03.201902'),(17,'auth','0012_alter_user_first_name_max_length','2026-08-26 08:18:03.278555'),(18,'editor','0001_initial','2026-08-26 08:18:03.453423'),(19,'editor','0002_question_option_questionequation_symbol_and_more','2026-08-26 08:18:04.042652'),(20,'editor','0003_question_linked_page','2026-08-26 08:18:04.112427'),(21,'sessions','0001_initial','2026-08-26 08:18:04.151368');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `editor_exampage`
--

DROP TABLE IF EXISTS `editor_exampage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `editor_exampage` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `page_number` int unsigned NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exam_paper_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `editor_exampage_exam_paper_id_217b4a29_fk_editor_exampaper_id` (`exam_paper_id`),
  CONSTRAINT `editor_exampage_exam_paper_id_217b4a29_fk_editor_exampaper_id` FOREIGN KEY (`exam_paper_id`) REFERENCES `editor_exampaper` (`id`),
  CONSTRAINT `editor_exampage_chk_1` CHECK ((`page_number` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `editor_exampage`
--

LOCK TABLES `editor_exampage` WRITE;
/*!40000 ALTER TABLE `editor_exampage` DISABLE KEYS */;
INSERT INTO `editor_exampage` VALUES (2,1,'<p>hgehgh&nbsp;</p><span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_556gMlt.png\" draggable=\"true\" style=\"width: 190px;\"><span class=\"resize-handle\"></span></span>&nbsp;',1),(5,1,'<p><span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_lMdtG94.png\" draggable=\"true\" style=\"width: 540px;\"><span class=\"resize-handle\"></span></span><p style=\"text-align: center;\">&nbsp;Contains nothing</p></p>',2),(18,1,'<span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/dashboard_analysis.jpg.png\" draggable=\"true\"><span class=\"resize-handle\"></span></span>&nbsp;<span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/dashboard_analysis_oQW7BCY.jpg.png\" draggable=\"true\"><span class=\"resize-handle\"></span></span>&nbsp;',4),(66,1,'<p>A conducting loop of finite resistance lies on the x-y plane. There is a constant magnetic field in the z-direction. The area of the loop varies with time t, as&nbsp;<span class=\"mord mathnormal\">A&nbsp;</span><span class=\"mspace\"></span><span class=\"mrel\">=&nbsp;</span><span class=\"mspace\"></span><span class=\"mord\"><span class=\"mord mathnormal\">A</span><span class=\"msupsub\"><span class=\"vlist-t vlist-t2\"><span class=\"vlist-r\"><span class=\"vlist\"><span class=\"pstrut\"></span><span class=\"sizing reset-size6 size3 mtight\"><span class=\"mord mtight\">0</span></span></span><span class=\"vlist-s\">​&nbsp;</span></span><span class=\"vlist-r\"><span class=\"vlist\"></span></span></span></span></span><span class=\"mopen\">(&nbsp;</span><span class=\"mord\">1</span><span class=\"mspace\"></span><span class=\"mbin\">+</span><span class=\"mspace\"></span><span class=\"mop\">sin&nbsp;</span><span class=\"mspace\"></span><span class=\"mord mathnormal\">t&nbsp;</span><span class=\"mclose\">) in appropriate units. The figure that correctly indicates the qualitative behaviour of the power P dissipated in the loop as a function of time.</span></p><p><span class=\"mclose\"><span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_WdBvlXK.png\" draggable=\"true\" style=\"width: 255px;\"><span class=\"resize-handle\"></span></span>&nbsp;</span></p><span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_xnSWoxA.png\" draggable=\"true\" style=\"width: 260px;\"><span class=\"resize-handle\"></span></span>&nbsp;<p><span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_Pud0YWs.png\" draggable=\"true\" style=\"width: 252px;\"><span class=\"resize-handle\"></span></span>&nbsp;</p><p><span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_BQBQ8EZ.png\" draggable=\"true\" style=\"width: 254px;\"><span class=\"resize-handle\"></span></span>&nbsp;</p>',3),(76,1,'<p><br></p>',6),(77,1,'<p><br></p>',7),(78,2,'<div class=\"synced-question\" data-question-id=\"2\"><div class=\"synced-question-header\">Q1. </div><div class=\"synced-question-text\">A particle is moving with a velocity of <span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mn>20</mn><mtext> </mtext><mtext>m/s</mtext></mrow><annotation encoding=\"application/x-tex\">20\\,\\text{m/s}</annotation></semantics></math></span>. If its kinetic energy is <span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mn>400</mn><mtext> </mtext><mtext>J</mtext></mrow><annotation encoding=\"application/x-tex\">400\\,\\text{J}</annotation></semantics></math></span>, what is the mass of the particle?</div><div class=\"synced-options\"><div class=\"synced-option\"><span class=\"option-label\">A)</span> 1 kg</div><div class=\"synced-option\"><span class=\"option-label\">B)</span> 2 kg</div><div class=\"synced-option\"><span class=\"option-label\">C)</span> 3 kg</div><div class=\"synced-option\"><span class=\"option-label\">D)</span> 4 kg</div></div></div>',7),(79,1,'A particle is moving with a velocity of <span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mn>20</mn><mtext> </mtext><mtext>m/s</mtext></mrow><annotation encoding=\"application/x-tex\">20\\,\\text{m/s}</annotation></semantics></math></span>. If its kinetic energy is <span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mn>400</mn><mtext> </mtext><mtext>J</mtext></mrow><annotation encoding=\"application/x-tex\">400\\,\\text{J}</annotation></semantics></math></span>, what is the mass of the particle?<p><strong data-start=\"162\" data-end=\"168\">A)</strong> 1 kg<br data-start=\"173\" data-end=\"176\">\n<strong data-start=\"176\" data-end=\"182\">B)</strong> 2 kg<br data-start=\"187\" data-end=\"190\" data-is-only-node=\"\">\n<strong data-start=\"190\" data-end=\"196\">C)</strong> 3 kg<br data-start=\"201\" data-end=\"204\">\n<strong data-start=\"204\" data-end=\"210\">D)</strong> 4 kg</p>',5),(80,1,'<p><br></p>',8),(81,1,'<p><br></p>',9),(82,2,'<div class=\"synced-question\"><div class=\"synced-question-header\">Q1. </div><div class=\"synced-question-text\">Test after save fix</div><div class=\"synced-options\"><div class=\"synced-option\"><span class=\"option-label\">A)</span> 1</div><div class=\"synced-option\"><span class=\"option-label\">B)</span> 2</div><div class=\"synced-option\"><span class=\"option-label\">C)</span> 3</div><div class=\"synced-option\"><span class=\"option-label\">D)</span> 4</div></div></div>',1),(83,3,'<div class=\"synced-question\"><div class=\"synced-question-header\">Q2. </div><div class=\"synced-question-text\">Final verification test</div><div class=\"synced-options\"><div class=\"synced-option\"><span class=\"option-label\">A)</span> 1</div><div class=\"synced-option\"><span class=\"option-label\">B)</span> 2</div><div class=\"synced-option\"><span class=\"option-label\">C)</span> 3</div><div class=\"synced-option\"><span class=\"option-label\">D)</span> 4</div></div></div>',1),(84,1,'<p><br></p>',10),(85,2,'<div class=\"synced-question\"><div class=\"synced-question-header\">Q1. </div><div class=\"synced-question-text\">A particle is moving in a straight line with constant acceleration. Its velocity changes from <strong data-start=\"126\" data-end=\"146\">10 m/s to 30 m/s</strong> in <strong data-start=\"150\" data-end=\"163\">5 seconds</strong>. What is the acceleration of the particle?</div><div class=\"synced-options\"><div class=\"synced-option\"><span class=\"option-label\">A)</span> &nbsp;2 m/s²</div><div class=\"synced-option\"><span class=\"option-label\">B)</span> &nbsp;4 m/s²</div><div class=\"synced-option\"><span class=\"option-label\">C)</span> &nbsp;5 m/s²</div><div class=\"synced-option\"><span class=\"option-label\">D)</span> &nbsp;8 m/s²</div></div></div>',10),(86,3,'<div class=\"synced-question\"><div class=\"synced-question-header\">Q2. </div><div class=\"synced-question-text\">A conducting loop of finite resistance lies on the x-y plane. There is a constant magnetic field in the z direction. The area of&nbsp; the loop varies with time t, as A=A0(1 + sin t) in appropriate units. The figure that correctly indicates the qualitative behaviour of the power P dissipated in the loop as a function of time is</div><div class=\"synced-options\"><div class=\"synced-option\"><span class=\"option-label\">A)</span> <span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_vKkrYTO.png\" draggable=\"true\"><span class=\"resize-handle\"></span></span></div><div class=\"synced-option\"><span class=\"option-label\">B)</span> <span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_GDQA3ya.png\" draggable=\"true\"><span class=\"resize-handle\"></span></span></div><div class=\"synced-option\"><span class=\"option-label\">C)</span> <span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_xYyrV5s.png\" draggable=\"true\"><span class=\"resize-handle\"></span></span></div><div class=\"synced-option\"><span class=\"option-label\">D)</span> <span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_Tx3Zwp5.png\" draggable=\"true\"><span class=\"resize-handle\"></span></span></div></div></div>',10);
/*!40000 ALTER TABLE `editor_exampage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `editor_exampaper`
--

DROP TABLE IF EXISTS `editor_exampaper`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `editor_exampaper` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `editor_exampaper`
--

LOCK TABLES `editor_exampaper` WRITE;
/*!40000 ALTER TABLE `editor_exampaper` DISABLE KEYS */;
INSERT INTO `editor_exampaper` VALUES (1,'Untitled Exam','2026-08-25 09:15:42.131000','2026-08-25 09:15:49.381000'),(2,'Untitled Exam','2026-08-25 11:23:53.345000','2026-08-25 11:24:06.667000'),(3,'Untitled Exam','2026-08-25 11:35:37.850000','2026-08-25 12:17:41.951000'),(4,'Untitled Exam','2026-08-25 11:53:24.644000','2026-08-25 11:54:34.652000'),(5,'Untitled Exam','2026-08-26 05:20:02.401000','2026-08-26 05:42:29.646000'),(6,'Untitled Exam','2026-08-26 05:30:18.777000','2026-08-26 05:30:18.777000'),(7,'Untitled Exam','2026-08-26 05:40:35.534000','2026-08-26 05:40:35.534000'),(8,'Untitled Exam','2026-08-26 05:59:27.320000','2026-08-26 05:59:27.320000'),(9,'Untitled Exam','2026-08-26 06:01:52.078000','2026-08-26 06:01:52.078000'),(10,'Untitled Exam','2026-08-26 06:21:31.827000','2026-08-26 06:21:31.827000');
/*!40000 ALTER TABLE `editor_exampaper` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `editor_option`
--

DROP TABLE IF EXISTS `editor_option`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `editor_option` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `label` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_text` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `editor_option_question_id_label_afab7311_uniq` (`question_id`,`label`),
  KEY `editor_opti_questio_0f8c2b_idx` (`question_id`,`label`),
  CONSTRAINT `editor_option_question_id_92faa9fd_fk_editor_question_id` FOREIGN KEY (`question_id`) REFERENCES `editor_question` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `editor_option`
--

LOCK TABLES `editor_option` WRITE;
/*!40000 ALTER TABLE `editor_option` DISABLE KEYS */;
INSERT INTO `editor_option` VALUES (9,'A','1 kg',1),(10,'B','2 kg',1),(11,'C','3 kg',1),(12,'D','4 kg',1),(13,'A','1 kg',2),(14,'B','2 kg',2),(15,'C','3 kg',2),(16,'D','4 kg',2),(17,'A','1',4),(18,'B','2',4),(19,'C','3',4),(20,'D','4',4),(21,'A','1',5),(22,'B','2',5),(23,'C','3',5),(24,'D','4',5),(29,'A','&nbsp;2 m/s²',6),(30,'B','&nbsp;4 m/s²',6),(31,'C','&nbsp;5 m/s²',6),(32,'D','&nbsp;8 m/s²',6),(41,'A','<span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_vKkrYTO.png\" draggable=\"true\"><span class=\"resize-handle\"></span></span>',7),(42,'B','<span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_GDQA3ya.png\" draggable=\"true\"><span class=\"resize-handle\"></span></span>',7),(43,'C','<span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_xYyrV5s.png\" draggable=\"true\"><span class=\"resize-handle\"></span></span>',7),(44,'D','<span class=\"img-wrap\" contenteditable=\"false\"><img src=\"http://127.0.0.1:8000/media/exam_images/image_Tx3Zwp5.png\" draggable=\"true\"><span class=\"resize-handle\"></span></span>',7);
/*!40000 ALTER TABLE `editor_option` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `editor_optionequation`
--

DROP TABLE IF EXISTS `editor_optionequation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `editor_optionequation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `latex` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `placeholder` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` int unsigned NOT NULL,
  `option_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `editor_optionequation_option_id_placeholder_97bd959a_uniq` (`option_id`,`placeholder`),
  KEY `editor_opti_option__f00120_idx` (`option_id`,`position`),
  CONSTRAINT `editor_optionequation_option_id_565d7b2d_fk_editor_option_id` FOREIGN KEY (`option_id`) REFERENCES `editor_option` (`id`),
  CONSTRAINT `editor_optionequation_chk_1` CHECK ((`position` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `editor_optionequation`
--

LOCK TABLES `editor_optionequation` WRITE;
/*!40000 ALTER TABLE `editor_optionequation` DISABLE KEYS */;
/*!40000 ALTER TABLE `editor_optionequation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `editor_question`
--

DROP TABLE IF EXISTS `editor_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `editor_question` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `question_number` int unsigned NOT NULL,
  `question_text` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `exam_paper_id` bigint NOT NULL,
  `linked_page_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `editor_question_exam_paper_id_question_number_3b933b02_uniq` (`exam_paper_id`,`question_number`),
  UNIQUE KEY `linked_page_id` (`linked_page_id`),
  KEY `editor_ques_exam_pa_237590_idx` (`exam_paper_id`,`question_number`),
  CONSTRAINT `editor_question_exam_paper_id_1f802a1d_fk_editor_exampaper_id` FOREIGN KEY (`exam_paper_id`) REFERENCES `editor_exampaper` (`id`),
  CONSTRAINT `editor_question_linked_page_id_ef75a8fe_fk_editor_exampage_id` FOREIGN KEY (`linked_page_id`) REFERENCES `editor_exampage` (`id`),
  CONSTRAINT `editor_question_chk_1` CHECK ((`question_number` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `editor_question`
--

LOCK TABLES `editor_question` WRITE;
/*!40000 ALTER TABLE `editor_question` DISABLE KEYS */;
INSERT INTO `editor_question` VALUES (1,1,'A particle is moving with a velocity of 20 m/s20\\,\\text{m/s}. If its kinetic energy is 400 J400\\,\\text{J}, what is the mass of the particle?','2026-08-26 05:30:57.563000','2026-08-26 05:31:02.254000',6,NULL),(2,1,'A particle is moving with a velocity of <span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mn>20</mn><mtext> </mtext><mtext>m/s</mtext></mrow><annotation encoding=\"application/x-tex\">20\\,\\text{m/s}</annotation></semantics></math></span>. If its kinetic energy is <span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mn>400</mn><mtext> </mtext><mtext>J</mtext></mrow><annotation encoding=\"application/x-tex\">400\\,\\text{J}</annotation></semantics></math></span>, what is the mass of the particle?','2026-08-26 05:41:24.516000','2026-08-26 05:41:24.578000',7,78),(4,1,'Test after save fix','2026-08-26 06:19:21.081000','2026-08-26 06:19:21.125000',1,82),(5,2,'Final verification test','2026-08-26 06:20:43.304000','2026-08-26 06:20:43.350000',1,83),(6,1,'A particle is moving in a straight line with constant acceleration. Its velocity changes from <strong data-start=\"126\" data-end=\"146\">10 m/s to 30 m/s</strong> in <strong data-start=\"150\" data-end=\"163\">5 seconds</strong>. What is the acceleration of the particle?','2026-08-26 06:22:25.799000','2026-08-26 06:22:26.956000',10,85),(7,2,'A conducting loop of finite resistance lies on the x-y plane. There is a constant magnetic field in the z direction. The area of&nbsp; the loop varies with time t, as A=A0(1 + sin t) in appropriate units. The figure that correctly indicates the qualitative behaviour of the power P dissipated in the loop as a function of time is','2026-08-26 06:26:16.641000','2026-08-26 06:28:02.514000',10,86);
/*!40000 ALTER TABLE `editor_question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `editor_questionequation`
--

DROP TABLE IF EXISTS `editor_questionequation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `editor_questionequation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `latex` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `placeholder` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` int unsigned NOT NULL,
  `question_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `editor_questionequation_question_id_placeholder_c5c6c36c_uniq` (`question_id`,`placeholder`),
  KEY `editor_ques_questio_21a90c_idx` (`question_id`,`position`),
  CONSTRAINT `editor_questionequat_question_id_598d7cb3_fk_editor_qu` FOREIGN KEY (`question_id`) REFERENCES `editor_question` (`id`),
  CONSTRAINT `editor_questionequation_chk_1` CHECK ((`position` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `editor_questionequation`
--

LOCK TABLES `editor_questionequation` WRITE;
/*!40000 ALTER TABLE `editor_questionequation` DISABLE KEYS */;
/*!40000 ALTER TABLE `editor_questionequation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `editor_symbol`
--

DROP TABLE IF EXISTS `editor_symbol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `editor_symbol` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `exam_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latex` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `search_tags` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_favorite` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `editor_symb_categor_7ccca5_idx` (`category`),
  KEY `editor_symb_exam_ty_cb5258_idx` (`exam_type`),
  KEY `editor_symb_is_favo_3df9ce_idx` (`is_favorite`)
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `editor_symbol`
--

LOCK TABLES `editor_symbol` WRITE;
/*!40000 ALTER TABLE `editor_symbol` DISABLE KEYS */;
INSERT INTO `editor_symbol` VALUES (1,'greek','all','\\alpha','Alpha (α)','alpha,greek,letter',0),(2,'greek','all','\\beta','Beta (β)','beta,greek,letter',0),(3,'greek','all','\\gamma','Gamma (γ)','gamma,greek,letter',0),(4,'greek','all','\\delta','Delta (δ)','delta,greek,letter',0),(5,'greek','all','\\theta','Theta (θ)','theta,greek,angle',0),(6,'greek','all','\\lambda','Lambda (λ)','lambda,greek,wavelength',0),(7,'greek','all','\\mu','Mu (μ)','mu,greek,coefficient,friction',0),(8,'greek','all','\\pi','Pi (π)','pi,greek,constant',0),(9,'greek','all','\\rho','Rho (ρ)','rho,greek,density',0),(10,'greek','all','\\sigma','Sigma (σ)','sigma,greek,stress',0),(11,'greek','all','\\phi','Phi (φ)','phi,greek,angle',0),(12,'greek','all','\\omega','Omega (ω)','omega,greek,angular,frequency',0),(13,'greek','all','\\Delta','Capital Delta (Δ)','delta,greek,change',0),(14,'greek','all','\\Sigma','Capital Sigma (Σ)','sigma,greek,sum',0),(15,'greek','all','\\Omega','Capital Omega (Ω)','omega,greek,resistance,ohm',0),(16,'greek','all','\\Gamma','Capital Gamma (Γ)','gamma,greek',0),(17,'greek','all','\\Lambda','Capital Lambda (Λ)','lambda,greek',0),(18,'greek','all','\\Phi','Capital Phi (Φ)','phi,greek,flux',0),(19,'greek','all','\\Psi','Capital Psi (Ψ)','psi,greek,wavefunction',0),(20,'math-ops','all','\\pm','Plus-minus (±)','plus,minus,operator,uncertainty',0),(21,'math-ops','all','\\mp','Minus-plus (∓)','minus,plus,operator',0),(22,'math-ops','all','\\times','Multiply (×)','multiply,times,operator,cross',0),(23,'math-ops','all','\\div','Divide (÷)','divide,operator,division',0),(24,'math-ops','all','\\ast','Asterisk (*)','asterisk,multiply,operator',0),(25,'math-ops','all','\\star','Star (★)','star,operator',0),(26,'math-ops','all','\\circ','Circle (∘)','circle,degree,composition',0),(27,'math-ops','all','\\cdot','Dot (·)','dot,multiply,operator',0),(28,'math-ops','all','\\le','Less or equal (≤)','less,equal,inequality',0),(29,'math-ops','all','\\ge','Greater or equal (≥)','greater,equal,inequality',0),(30,'math-ops','all','\\ne','Not equal (≠)','not,equal,inequality',0),(31,'math-ops','all','\\approx','Approximately (≈)','approximately,equal',0),(32,'math-ops','all','\\equiv','Equivalent (≡)','equivalent,identity',0),(33,'math-ops','all','\\sim','Similar (∼)','similar,wave',0),(34,'math-ops','all','\\propto','Proportional (∝)','proportional,directly',0),(35,'math-ops','all','\\infty','Infinity (∞)','infinity,limit',0),(36,'math-ops','all','\\nabla','Nabla (∇)','nabla,gradient,del,vector',0),(37,'math-ops','all','\\partial','Partial (∂)','partial,derivative',0),(38,'math-ops','all','\\vert','Absolute (|)','absolute,determinant',0),(39,'math-ops','all','\\Vert','Double Absolute (‖)','absolute,norm',0),(40,'math-ops','all','\\lfloor\\rfloor','Floor (⌊x⌋)','floor,function',0),(41,'math-ops','all','\\lceil\\rceil','Ceiling (⌈x⌉)','ceiling,function',0),(42,'fractions','all','\\frac{a}{b}','Fraction (a/b)','fraction,division',0),(43,'fractions','all','\\dfrac{a}{b}','Display Fraction','fraction,display',0),(44,'fractions','all','\\sqrt{x}','Square Root','root,square,radical',0),(45,'fractions','all','\\sqrt[n]{x}','Nth Root','root,nth,radical',0),(46,'fractions','all','\\cfrac{a}{b}','Continued Fraction','fraction,continued',0),(47,'powers','all','x^{2}','Square (x²)','power,square,exponent',0),(48,'powers','all','x^{3}','Cube (x³)','power,cube,exponent',0),(49,'powers','all','x^{n}','Power (xⁿ)','power,exponent',0),(50,'powers','all','x^{-1}','Inverse (x⁻¹)','inverse,negative,exponent',0),(51,'powers','all','e^{x}','Exponential (eˣ)','exponential,exponent,e',0),(52,'powers','all','10^{x}','Base 10 (10ˣ)','power,logarithm,base10',0),(53,'powers','all','2^{x}','Base 2 (2ˣ)','power,binary',0),(54,'powers','all','a^{b}','General Power','power,exponent',0),(55,'powers','all','x_{1}','Subscript (x₁)','subscript,index',0),(56,'powers','all','x_{n}','General Subscript','subscript,index',0),(57,'calculus','jee','\\int','Integral (∫)','integral,calculus,antiderivative',0),(58,'calculus','jee','\\int_{a}^{b}','Definite Integral','integral,definite,limits',0),(59,'calculus','jee','\\oint','Closed Integral (∮)','integral,closed,loop',0),(60,'calculus','jee','\\iint','Double Integral (∬)','integral,double,area',0),(61,'calculus','jee','\\iiint','Triple Integral (∭)','integral,triple,volume',0),(62,'calculus','jee','\\lim_{x \\to a}','Limit','limit,calculus',0),(63,'calculus','jee','\\lim_{x \\to \\infty}','Limit at Infinity','limit,infinity',0),(64,'calculus','jee','\\frac{d}{dx}','Derivative (d/dx)','derivative,differentiation',0),(65,'calculus','jee','\\frac{dy}{dx}','Derivative (dy/dx)','derivative,differentiation',0),(66,'calculus','jee','f\'(x)','Prime Derivative','derivative,prime,newton',0),(67,'calculus','jee','f\'\'(x)','Second Derivative','derivative,second,acceleration',0),(68,'calculus','jee','\\frac{\\partial f}{\\partial x}','Partial Derivative','partial,derivative',0),(69,'calculus','jee','\\nabla f','Gradient','gradient,nabla,vector',0),(70,'calculus','jee','\\nabla \\cdot \\vec{F}','Divergence','divergence,vector,nabla',0),(71,'calculus','jee','\\nabla \\times \\vec{F}','Curl','curl,vector,nabla',0),(72,'calculus','jee','\\sum','Summation (∑)','sum,sigma,summation',0),(73,'calculus','jee','\\sum_{i=1}^{n}','Summation with Limits','sum,sigma,limits',0),(74,'calculus','jee','\\prod','Product (∏)','product,pi,multiplication',0),(75,'calculus','jee','\\prod_{i=1}^{n}','Product with Limits','product,limits',0),(76,'vectors','jee','\\vec{a}','Vector (a⃗)','vector,arrow,notation',0),(77,'vectors','jee','\\vec{AB}','Vector AB','vector,position',0),(78,'vectors','jee','\\hat{i}','Unit Vector i','vector,unit,x-axis',0),(79,'vectors','jee','\\hat{j}','Unit Vector j','vector,unit,y-axis',0),(80,'vectors','jee','\\hat{k}','Unit Vector k','vector,unit,z-axis',0),(81,'vectors','jee','\\hat{n}','Unit Normal','vector,unit,normal',0),(82,'vectors','jee','\\vec{a} \\cdot \\vec{b}','Dot Product','dot,product,scalar',0),(83,'vectors','jee','\\vec{a} \\times \\vec{b}','Cross Product','cross,product,vector',0),(84,'vectors','jee','|\\vec{a}|','Magnitude','magnitude,norm,length',0),(85,'vectors','jee','\\begin{bmatrix} x \\\\ y \\\\ z \\end{bmatrix}','Column Vector','matrix,column,vector',0),(86,'vectors','jee','\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}','2x2 Matrix','matrix,determinant',0),(87,'vectors','jee','\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}','Determinant |A|','determinant,matrix',0),(88,'vectors','jee','\\begin{bmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{bmatrix}','3x3 Matrix','matrix,3x3',0),(89,'trig','all','\\sin\\theta','Sine theta','sin,trigonometry',0),(90,'trig','all','\\cos\\theta','Cosine theta','cos,trigonometry',0),(91,'trig','all','\\tan\\theta','Tangent theta','tan,trigonometry',0),(92,'trig','all','\\csc\\theta','Cosecant theta','csc,cosecant,trig',0),(93,'trig','all','\\sec\\theta','Secant theta','sec,trigonometry',0),(94,'trig','all','\\cot\\theta','Cotangent theta','cot,trigonometry',0),(95,'trig','all','\\sin^{-1}\\theta','Arcsine','arcsin,inverse,trig',0),(96,'trig','all','\\cos^{-1}\\theta','Arccosine','arccos,inverse,trig',0),(97,'trig','all','\\tan^{-1}\\theta','Arctangent','arctan,inverse,trig',0),(98,'trig','all','\\sinh x','Hyperbolic Sine','sinh,hyperbolic',0),(99,'trig','all','\\cosh x','Hyperbolic Cosine','cosh,hyperbolic',0),(100,'trig','all','\\tanh x','Hyperbolic Tangent','tanh,hyperbolic',0),(101,'trig','all','\\sin 2\\theta','Sine Double Angle','sin,double,angle',0),(102,'trig','all','\\cos 2\\theta','Cosine Double Angle','cos,double,angle',0),(103,'trig','all','\\sin^{2}\\theta','Sine Squared','sin,squared,identity',0),(104,'trig','all','\\cos^{2}\\theta','Cosine Squared','cos,squared,identity',0),(105,'phys','all','\\vec{F} = m\\vec{a}','Newton\'s Second Law','newton,force,physics',0),(106,'phys','all','\\vec{p} = m\\vec{v}','Momentum','momentum,velocity,physics',0),(107,'phys','all','K = \\frac{1}{2}mv^{2}','Kinetic Energy','kinetic,energy,physics',0),(108,'phys','all','U = mgh','Potential Energy','potential,energy,gravity',0),(109,'phys','all','E = mc^{2}','Mass-Energy','energy,einstein,relativity',0),(110,'phys','all','F = \\frac{Gm_{1}m_{2}}{r^{2}}','Gravitational Force','gravity,newton,force',0),(111,'phys','all','F = k\\frac{q_{1}q_{2}}{r^{2}}','Coulomb\'s Law','coulomb,electric,force',0),(112,'phys','all','V = IR','Ohm\'s Law','ohm,voltage,current',0),(113,'phys','all','P = VI','Electric Power','power,voltage,current',0),(114,'phys','all','\\lambda = \\frac{h}{p}','de Broglie Wavelength','wavelength,quantum,physics',0),(115,'phys','all','E = h\\nu','Photon Energy','energy,photon,quantum',0),(116,'phys','all','\\vec{B} = \\mu_{0}\\vec{H}','Magnetic Field','magnetic,field,permeability',0),(117,'phys','all','\\Phi = BA\\cos\\theta','Magnetic Flux','flux,magnetic,physics',0),(118,'phys','all','\\varepsilon = -\\frac{d\\Phi}{dt}','Faraday\'s Law','faraday,emf,induction',0),(119,'phys','all','v = f\\lambda','Wave Equation','wave,velocity,frequency',0),(120,'phys','all','n = \\frac{c}{v}','Refractive Index','refraction,light,optics',0),(121,'chem','neet','H_{2}O','Water','water,chemistry,H2O',0),(122,'chem','neet','CO_{2}','Carbon Dioxide','co2,chemistry,dioxide',0),(123,'chem','neet','O_{2}','Oxygen','oxygen,chemistry,O2',0),(124,'chem','neet','N_{2}','Nitrogen','nitrogen,chemistry,N2',0),(125,'chem','neet','H_{2}','Hydrogen','hydrogen,chemistry,H2',0),(126,'chem','neet','Cl_{2}','Chlorine','chlorine,chemistry,halogen',0),(127,'chem','neet','NaCl','Sodium Chloride','salt,chemistry,nacl',0),(128,'chem','neet','HCl','Hydrochloric Acid','acid,chemistry,hcl',0),(129,'chem','neet','H_{2}SO_{4}','Sulfuric Acid','acid,sulfuric,chemistry',0),(130,'chem','neet','HNO_{3}','Nitric Acid','acid,nitric,chemistry',0),(131,'chem','neet','NaOH','Sodium Hydroxide','base,naoh,chemistry',0),(132,'chem','neet','KOH','Potassium Hydroxide','base,koh,chemistry',0),(133,'chem','neet','NH_{3}','Ammonia','ammonia,chemistry',0),(134,'chem','neet','CH_{4}','Methane','methane,alkane,chemistry',0),(135,'chem','neet','C_{2}H_{6}','Ethane','ethane,alkane,chemistry',0),(136,'chem','neet','C_{6}H_{12}O_{6}','Glucose','glucose,carbohydrate,chemistry',0),(137,'chem','neet','C_{12}H_{22}O_{11}','Sucrose','sucrose,sugar,chemistry',0),(138,'chem','neet','CaCO_{3}','Calcium Carbonate','calcium,carbonate,chemistry',0),(139,'chem','neet','Ca(OH)_{2}','Calcium Hydroxide','calcium,lime,chemistry',0),(140,'chem-reac','neet','2H_{2} + O_{2} \\rightarrow 2H_{2}O','Water Formation','reaction,water,combustion',0),(141,'chem-reac','neet','N_{2} + 3H_{2} \\rightleftharpoons 2NH_{3}','Haber Process','ammonia,reaction,haber',0),(142,'chem-reac','neet','CaCO_{3} \\rightarrow CaO + CO_{2}','Lime Formation','calcium,decomposition,chemistry',0),(143,'chem-reac','neet','Zn + 2HCl \\rightarrow ZnCl_{2} + H_{2}','Zinc + Acid','zinc,reaction,displacement',0),(144,'chem-reac','neet','CH_{4} + 2O_{2} \\rightarrow CO_{2} + 2H_{2}O','Methane Combustion','methane,combustion,chemistry',0),(145,'chem-reac','neet','H^{+} + OH^{-} \\rightarrow H_{2}O','Neutralization','neutralization,acid,base',0),(146,'chem-reac','neet','Fe + CuSO_{4} \\rightarrow FeSO_{4} + Cu','Displacement','iron,copper,reaction',0),(147,'chem-reac','neet','2Na + 2H_{2}O \\rightarrow 2NaOH + H_{2}','Sodium + Water','sodium,reaction,hydrogen',0),(148,'units','all','m','Meter (m)','meter,length,si',0),(149,'units','all','kg','Kilogram (kg)','kilogram,mass,si',0),(150,'units','all','s','Second (s)','second,time,si',0),(151,'units','all','A','Ampere (A)','ampere,current,si',0),(152,'units','all','K','Kelvin (K)','kelvin,temperature,si',0),(153,'units','all','mol','Mole (mol)','mole,amount,si',0),(154,'units','all','cd','Candela (cd)','candela,light,si',0),(155,'units','all','m/s','Velocity (m/s)','velocity,speed,unit',0),(156,'units','all','m/s^{2}','Acceleration (m/s²)','acceleration,unit,physics',0),(157,'units','all','N','Newton (N)','newton,force,unit',0),(158,'units','all','J','Joule (J)','joule,energy,unit',0),(159,'units','all','W','Watt (W)','watt,power,unit',0),(160,'units','all','Pa','Pascal (Pa)','pascal,pressure,unit',0),(161,'units','all','Hz','Hertz (Hz)','hertz,frequency,unit',0),(162,'units','all','\\Omega','Ohm (Ω)','ohm,resistance,unit',0),(163,'units','all','V','Volt (V)','volt,voltage,unit',0),(164,'units','all','C','Coulomb (C)','coulomb,charge,unit',0),(165,'units','all','F','Farad (F)','farad,capacitance,unit',0),(166,'units','all','T','Tesla (T)','tesla,magnetic,unit',0),(167,'units','all','Wb','Weber (Wb)','weber,flux,unit',0),(168,'units','all','cal','Calorie (cal)','calorie,heat,energy',0),(169,'units','all','eV','Electron Volt (eV)','electronvolt,energy,physics',0),(170,'units','all','Å','Angstrom (Å)','angstrom,length,atomic',0),(171,'sets','jee','\\in','Element Of (∈)','element,member,set',0),(172,'sets','jee','\\notin','Not Element Of (∉)','element,not,member',0),(173,'sets','jee','\\subset','Subset (⊂)','subset,set,contained',0),(174,'sets','jee','\\subseteq','Subset Or Equal (⊆)','subset,equal,set',0),(175,'sets','jee','\\supset','Superset (⊃)','superset,set,contains',0),(176,'sets','jee','\\cup','Union (∪)','union,set,or',0),(177,'sets','jee','\\cap','Intersection (∩)','intersection,set,and',0),(178,'sets','jee','\\emptyset','Empty Set (∅)','empty,null,set',0),(179,'sets','jee','\\mathbb{R}','Real Numbers (ℝ)','real,numbers,set',0),(180,'sets','jee','\\mathbb{Z}','Integers (ℤ)','integers,set',0),(181,'sets','jee','\\mathbb{N}','Natural Numbers (ℕ)','natural,numbers,set',0),(182,'sets','jee','\\mathbb{Q}','Rational Numbers (ℚ)','rational,numbers,set',0),(183,'sets','jee','\\mathbb{C}','Complex Numbers (ℂ)','complex,numbers,set',0),(184,'sets','jee','\\forall','For All (∀)','for,all,quantifier',0),(185,'sets','jee','\\exists','Exists (∃)','exists,there,quantifier',0),(186,'sets','jee','\\therefore','Therefore (∴)','therefore,logic',0),(187,'sets','jee','\\because','Because (∵)','because,reason,logic',0),(188,'sets','jee','\\implies','Implies (⇒)','implies,logic,arrow',0),(189,'sets','jee','\\iff','If and Only If (⇔)','iff,logic,equivalent',0),(190,'misc','all','\\degree','Degree (°)','degree,angle,temperature',0),(191,'misc','all','\\angle','Angle (∠)','angle,geometry',0),(192,'misc','all','\\perp','Perpendicular (⊥)','perpendicular,geometry',0),(193,'misc','all','\\parallel','Parallel (∥)','parallel,geometry',0),(194,'misc','all','\\cong','Congruent (≅)','congruent,geometry',0),(195,'misc','all','\\sim','Similar (~)','similar,geometry',0),(196,'misc','all','\\triangle','Triangle (△)','triangle,geometry',0),(197,'misc','all','\\square','Square (□)','square,geometry',0),(198,'misc','all','\\circ','Circle (∘)','circle,geometry',0),(199,'misc','all','\\dots','Ellipsis (…)','ellipsis,continuation',0),(200,'misc','all','\\cdots','Centered Ellipsis (⋯)','ellipsis,centered',0);
/*!40000 ALTER TABLE `editor_symbol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `editor_uploadedimage`
--

DROP TABLE IF EXISTS `editor_uploadedimage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `editor_uploadedimage` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `image` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `exam_paper_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `editor_uploadedimage_exam_paper_id_bd98f89b_fk_editor_ex` (`exam_paper_id`),
  CONSTRAINT `editor_uploadedimage_exam_paper_id_bd98f89b_fk_editor_ex` FOREIGN KEY (`exam_paper_id`) REFERENCES `editor_exampaper` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `editor_uploadedimage`
--

LOCK TABLES `editor_uploadedimage` WRITE;
/*!40000 ALTER TABLE `editor_uploadedimage` DISABLE KEYS */;
INSERT INTO `editor_uploadedimage` VALUES (1,'exam_images/image_556gMlt.png','2026-08-25 09:15:20.791000',1),(2,'exam_images/image_lMdtG94.png','2026-08-25 11:05:45.302000',2),(3,'exam_images/dashboard_analysis.jpg.png','2026-08-25 11:54:19.020000',4),(4,'exam_images/dashboard_analysis_oQW7BCY.jpg.png','2026-08-25 11:54:27.971000',4),(5,'exam_images/image_WdBvlXK.png','2026-08-25 12:14:53.177000',3),(6,'exam_images/image_xnSWoxA.png','2026-08-25 12:15:36.000000',3),(7,'exam_images/image_iDBqSUm.png','2026-08-25 12:16:12.051000',3),(8,'exam_images/image_Pud0YWs.png','2026-08-25 12:16:20.534000',3),(9,'exam_images/image_qpo33mw.png','2026-08-25 12:16:42.991000',3),(10,'exam_images/image_BQBQ8EZ.png','2026-08-25 12:17:26.278000',3),(11,'exam_images/image_c26ufPx.png','2026-08-26 05:22:52.785000',5),(12,'exam_images/image_7VYYoS2.png','2026-08-26 05:50:01.529000',3),(13,'exam_images/image_on4TfGd.png','2026-08-26 05:50:22.056000',3),(14,'exam_images/image_oeLYa3Y.png','2026-08-26 05:50:42.182000',3),(15,'exam_images/image_YYeiBd3.png','2026-08-26 05:50:56.201000',3),(16,'exam_images/image_ok634lD.png','2026-08-26 05:51:09.982000',3),(17,'exam_images/image_97bSsR3.png','2026-08-26 05:59:58.275000',8),(18,'exam_images/image_wGPWWpU.png','2026-08-26 06:00:10.503000',8),(19,'exam_images/image_d0AUmzJ.png','2026-08-26 06:00:19.891000',8),(20,'exam_images/image_JEUKCsj.png','2026-08-26 06:00:29.059000',8),(21,'exam_images/image_Tx3Zwp5.png','2026-08-26 06:25:13.796000',10),(22,'exam_images/image_vKkrYTO.png','2026-08-26 06:25:31.878000',10),(23,'exam_images/image_GDQA3ya.png','2026-08-26 06:25:42.735000',10),(24,'exam_images/image_xYyrV5s.png','2026-08-26 06:25:51.729000',10);
/*!40000 ALTER TABLE `editor_uploadedimage` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-26 14:05:07
