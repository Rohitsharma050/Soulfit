--
-- PostgreSQL database dump
--

\restrict u36Et1CEURM8nxvHN8MCCAVOT4ifNUOpoVHVmpQNSbLVJa7RO07SHUrMA5o02xU

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: update_timestamp_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_timestamp_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: articles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    excerpt text,
    content text NOT NULL,
    cover_image text,
    category character varying(100),
    author_name character varying(150),
    reading_time integer DEFAULT 5,
    status character varying(30) DEFAULT 'DRAFT'::character varying NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_article_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PUBLISHED'::character varying, 'ARCHIVED'::character varying])::text[])))
);


ALTER TABLE public.articles OWNER TO postgres;

--
-- Name: TABLE articles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.articles IS 'Reflections, wisdom guides, and published dispatches by Soulfit Guidance';


--
-- Name: availability_overrides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability_overrides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultation_type_id uuid,
    override_date date NOT NULL,
    is_available boolean DEFAULT false NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    reason character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_override_hours CHECK (((is_available = false) OR ((start_time IS NOT NULL) AND (end_time IS NOT NULL) AND (end_time > start_time))))
);


ALTER TABLE public.availability_overrides OWNER TO postgres;

--
-- Name: availability_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultation_type_id uuid,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    break_start time without time zone,
    break_end time without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT availability_rules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT chk_availability_times CHECK ((end_time > start_time)),
    CONSTRAINT chk_break_times CHECK ((((break_start IS NULL) AND (break_end IS NULL)) OR ((break_start IS NOT NULL) AND (break_end IS NOT NULL) AND (break_end > break_start) AND (break_start >= start_time) AND (break_end <= end_time))))
);


ALTER TABLE public.availability_rules OWNER TO postgres;

--
-- Name: consultation_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultation_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(150) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    duration_minutes integer DEFAULT 60 NOT NULL,
    buffer_minutes integer DEFAULT 15 NOT NULL,
    price_display character varying(50) DEFAULT 'Complimentary Sanctuary Guidance'::character varying,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_buffer_non_negative CHECK ((buffer_minutes >= 0)),
    CONSTRAINT chk_duration_positive CHECK ((duration_minutes > 0))
);


ALTER TABLE public.consultation_types OWNER TO postgres;

--
-- Name: consultations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    full_name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    pillar_interest character varying(100) NOT NULL,
    goals text,
    slot_start timestamp with time zone,
    slot_end timestamp with time zone,
    timezone character varying(100) DEFAULT 'UTC'::character varying,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    consultation_type_id uuid,
    booking_reference character varying(32),
    idempotency_key character varying(64),
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    rescheduled_from_id uuid,
    CONSTRAINT chk_consultation_slot_range CHECK ((((slot_start IS NULL) AND (slot_end IS NULL)) OR (slot_end > slot_start))),
    CONSTRAINT chk_consultation_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'CANCELLED'::character varying, 'COMPLETED'::character varying, 'RESCHEDULED'::character varying])::text[])))
);


ALTER TABLE public.consultations OWNER TO postgres;

--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    subject character varying(200),
    message text NOT NULL,
    status character varying(30) DEFAULT 'NEW'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_contact_status CHECK (((status)::text = ANY ((ARRAY['NEW'::character varying, 'READ'::character varying, 'RESOLVED'::character varying, 'ARCHIVED'::character varying])::text[])))
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- Name: TABLE contact_messages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.contact_messages IS 'Sanctuary direct inquiries submitted by clients';


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schema_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schema_migrations_id_seq OWNER TO postgres;

--
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schema_migrations_id_seq OWNED BY public.schema_migrations.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(150) NOT NULL,
    title character varying(200) NOT NULL,
    category character varying(100),
    short_description text NOT NULL,
    description text,
    image_url text,
    icon_name character varying(100),
    offerings jsonb DEFAULT '[]'::jsonb,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: TABLE services; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.services IS 'The 5 core wellness pillars and offerings of The Harmony Project';


--
-- Name: subscribers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    consent boolean DEFAULT false NOT NULL,
    subscribed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    unsubscribed_at timestamp with time zone,
    unsubscribe_token_hash character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.subscribers OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    google_id character varying(255),
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    avatar text,
    role character varying(20) DEFAULT 'USER'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    password_hash character varying(255),
    auth_provider character varying(50) DEFAULT 'local'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    CONSTRAINT chk_user_role CHECK (((role)::text = ANY ((ARRAY['USER'::character varying, 'ADMIN'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.password_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.password_hash IS 'Bcrypt salted password hash for local credentials';


--
-- Name: COLUMN users.auth_provider; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.auth_provider IS 'Identity provider: local, google, or comma-separated hybrid';


--
-- Name: COLUMN users.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.is_active IS 'Account activation status for access revocation';


--
-- Name: COLUMN users.last_login_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.last_login_at IS 'Timestamp of the most recent successful login';


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.articles (id, title, slug, excerpt, content, cover_image, category, author_name, reading_time, status, published_at, created_at, updated_at) FROM stdin;
efebd616-6964-400f-a237-1fdeb6384294	Why 20 Minutes of Postural Alignment Beats 2 Hours of Mindless Cardio	postural-alignment-vs-cardio	How structural spinal integrity and breath rhythm reprogram your nervous system out of perpetual fight-or-flight into sustainable restorative vitality.	In the modern pursuit of fitness, intensity is often confused with efficacy. We watch busy professionals push through two hours of grueling cardio, running on caffeine and elevated cortisol, only to finish more exhausted, inflamed, and neurologically depleted than when they started.\n\nAt Soulfit, our practice reveals an entirely different truth: when your nervous system is trapped in chronic fight-or-flight, high-impact cardiovascular strain signals further danger to your adrenal glands.\n\nConversely, twenty minutes of deliberate, breath-synchronized somatic postural alignment accomplishes three critical biological resets:\n1. Decompression of the vagal nerve along the cervical and thoracic spine.\n2. Diaphragmatic down-regulation, lowering baseline resting heart rate and systemic inflammation.\n3. Restoring the pelvic floor and spinal alignment so everyday movements feel effortless rather than fatiguing.\n\nLasting physical vitality is not forged in exhaustion. It is cultured in restoration.	https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80	SOULFIT RESTORATION	Soulfit Guidance	5	PUBLISHED	2026-11-01 13:30:00+05:30	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
245555a4-97d7-4ad7-9308-2f8541f4e24a	The Northeast Water Corner: Why Clutter Here Clouded Your Focus	northeast-water-corner-vastu	Discover how ancient Vastu texts mapped mental clarity directly to the water-dominated Ishanya quadrant, and how subtle spatial clearing resolves cognitive fog.	In classical Vastu Shastra, the Northeast quadrant (Ishanya) is governed by the Water element and represents the crown of spatial consciousness. It is the direction through which subtle cosmic and solar magnetic currents enter a dwelling or office space.\n\nWhen the Northeast is blocked by heavy metal cabinetry, accumulated clutter, dead storage, or stagnant waste, the energetic resonance of the space becomes dense and stagnant. Residents frequently report:\n- Persistent brain fog that resists sleep and nutritional fixes.\n- Difficulty making decisive career transitions.\n- Disrupted sleep architecture and emotional heaviness.\n\nBy applying non-invasive Vastu harmonizing—clearing heavy clutter, introducing clean running water or reflective elements, and allowing unimpeded morning light—the spatial pressure on your subconscious mind lifts, allowing natural cognitive focus to return.	https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80	VASTU PRINCIPLES	Soulfit Guidance	7	PUBLISHED	2026-10-20 13:30:00+05:30	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
e5fb6a6c-7c80-4233-986e-142b99d7e228	Inflammation in the Gut Is Anxiety in the Mind	gut-inflammation-mind-anxiety	How repairing the enteric nervous system through targeted seed broths and seasonal Ritucharya restores serene emotional states without punitive dieting.	The enteric nervous system—often called the 'second brain'—contains over 500 million neurons and produces more than 90 percent of the body's serotonin. When modern eating consists of hyper-processed foods, rapid meal ingestion between meetings, and inflammatory seed oils, the intestinal lining experiences micro-inflammation.\n\nThis cellular irritation communicates directly to the brain via the vagus nerve, manifesting as:\n- Restless anxiety and racing thoughts without clear psychological triggers.\n- Low threshold for frustration and afternoon fatigue crashes.\n- Disrupted restorative REM sleep.\n\nThrough Food as Medicine and Ayurvedic seasonal eating (Ritucharya), we treat food as bio-fuel. By introducing warm cumin-fennel infusions, soothing whole grains, and restorative healthy fats, we soothe intestinal lining inflammation. When the gut achieves peace, the mind follows.	https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80	FOOD AS MEDICINE	Soulfit Guidance	6	PUBLISHED	2026-10-05 13:30:00+05:30	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
\.


--
-- Data for Name: availability_overrides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability_overrides (id, consultation_type_id, override_date, is_available, start_time, end_time, reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: availability_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability_rules (id, consultation_type_id, day_of_week, start_time, end_time, break_start, break_end, is_active, created_at, updated_at) FROM stdin;
6b524a74-250e-42e4-8caa-3fd65ba994c4	\N	1	09:00:00	18:00:00	13:00:00	14:00:00	t	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
e43e4b64-3ea5-4c26-a5b8-a33f8d2ca74e	\N	2	09:00:00	18:00:00	13:00:00	14:00:00	t	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
9f69d6c7-886f-4814-99cb-24547d3d550d	\N	3	09:00:00	18:00:00	13:00:00	14:00:00	t	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
2ce0fd58-c1ab-4541-9477-ae1e886f99e3	\N	4	09:00:00	18:00:00	13:00:00	14:00:00	t	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
3efd30b3-c32f-4dcb-b1fc-33cf5b71da7c	\N	5	09:00:00	18:00:00	13:00:00	14:00:00	t	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
ab4cc478-6674-4848-81d6-8bc07d05ec2d	\N	6	09:00:00	17:00:00	13:00:00	14:00:00	t	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
d7e5f966-0dc1-4bb5-a59b-20e16c3d5fc6	\N	0	09:00:00	17:00:00	\N	\N	f	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
\.


--
-- Data for Name: consultation_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consultation_types (id, slug, name, description, duration_minutes, buffer_minutes, price_display, is_active, display_order, created_at, updated_at) FROM stdin;
a64777b0-537a-42d8-af4a-43374fb981b5	yoga-wellness	Restorative Yoga Therapy & Physical Alignment	Personalized 1-on-1 restorative yoga guidance focusing on rest, calm, physical vitality, and management of conditions including PCOD, diabetes, and hypertension, as well as prenatal/postnatal care.	60	15	Complimentary Initial Sanctuary Session	t	1	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
8bcd0a62-3455-4f39-9500-ba68a2ec942b	vastu-architecture	Vastu & Five Elements Spatial Assessment	Comprehensive analysis of home or workspace directional geometry, subtle energy pathways, and five-element harmonization.	60	15	Complimentary Sanctuary Guidance	t	2	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
39844333-52c7-4c3e-a2e4-22ffa00039f8	astrology-cosmic	Cosmic Blueprint & Astrology Consultation	Natal chart decoding, planetary timing insights, and cosmic life cycle alignment for career, health, and personal evolution.	45	15	Complimentary Sanctuary Guidance	t	3	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
97bad696-9efd-41a7-a63e-041436da78df	corporate-wellbeing	Corporate Wellbeing Strategy Session	Tailored consultation for organizations seeking sustainable team vitality, ergonomics, mental clarity, and executive stress mitigation.	45	15	Tailored Executive Program	t	4	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
95426d41-c854-4376-ab2b-ccbf04e4d45b	food-medicine	Holistic Nutrition & Food as Medicine	Nutritional harmony assessment, seasonal eating practices, and cellular nourishment rooted in ancient restorative wisdom.	45	15	Cellular Vitality Guidance	t	5	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
\.


--
-- Data for Name: consultations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consultations (id, user_id, full_name, email, phone, pillar_interest, goals, slot_start, slot_end, timezone, status, created_at, updated_at, consultation_type_id, booking_reference, idempotency_key, cancelled_at, cancellation_reason, rescheduled_from_id) FROM stdin;
10bcd94f-9a9b-4f99-8c72-8491661273dd	6374c459-390a-40f8-9944-0752b04b6858	test	ram@email.com		Corporate Wellbeing Strategy Session	\N	2026-12-18 15:00:00+05:30	2026-12-18 15:45:00+05:30	Asia/Kolkata	CONFIRMED	2026-11-18 19:54:25.505138+05:30	2026-11-18 19:56:07.222758+05:30	97bad696-9efd-41a7-a63e-041436da78df	HP-2026-630F37	b03fe5f3-9994-4ee9-874d-4f4bed07fc5f	\N	\N	\N
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_messages (id, name, email, phone, subject, message, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_migrations (id, name, applied_at) FROM stdin;
1	001_initial_schema.sql	2026-11-18 12:42:27.462037+05:30
2	002_expand_schema.sql	2026-11-18 12:42:31.703509+05:30
3	003_auth_schema.sql	2026-11-18 12:42:31.830377+05:30
4	004_consultation_booking_schema.sql	2026-11-18 12:42:31.851212+05:30
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, slug, title, category, short_description, description, image_url, icon_name, offerings, is_featured, is_active, display_order, created_at, updated_at) FROM stdin;
b9b72ff2-7ab6-45bc-b943-2304bb4cf8a9	yoga-wellness	Rest, Calm & Energy for Everyday Life	Restorative Yoga & Condition Care	Restorative yoga offering rest, calm and energy for everyday life, at home or at work, with personalized solutions for all ages 10 and above.	Soulfit is the home of restorative yoga: rest, calm and energy for everyday life, at home or at work. With over more than decade of experiences in the yoga industry, we specializes in offering a wide range of yoga services, including sessions for weight loss, mental well being, and management of physical conditions such as PCOD, Hypertension, Diabetes etc. We also provide specialized programs such as prenatal yoga, postnatal yoga, and fertility yoga, ensuring that every stage of life is supported through the power of yoga. Our target audience includes individuals aged 10 and above, regardless of gender or age, who are looking for effective and personalized yoga solutions. We pride ourselves on our team of highly experienced and patient yoga instructors who bring a wealth of knowledge and expertise to every session.	https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80	Activity	["Restorative Yoga for Everyday Rest, Calm & Energy", "Weight Loss & Mental Well-Being Sessions", "Physical Condition Management (PCOD, Hypertension, Diabetes)", "Prenatal, Postnatal & Fertility Yoga Support", "Tailored Solutions for Ages 10 and Above (All Genders)", "Experienced and Patient Instructor-Led Sessions"]	t	t	1	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
744e7d2d-402f-4b57-91c3-4c5b73f8f926	vastu	Five Elements & Spatial Geometry	Spatial Geometry & Balance	Aligning living and working spaces with natural directional energies and the five elements to cultivate mental clarity and peaceful living.	Your physical environment directly conditions your state of mind. Through traditional Vastu principles and spatial geometry, we analyze elemental orientations to eliminate energetic friction without invasive destruction.	https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80	Compass	["Comprehensive Home & Apartment Spatial Analysis", "Elemental Zoning (Earth, Water, Fire, Air, Space)", "Northeast (Ishanya) Water & Clarity Restoration", "Office, Studio & Executive Workspace Calibration", "Non-Invasive Remedial Balancing & Geometry Harmonization"]	f	t	2	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
b9665d42-c5e9-462d-ba48-a680674496fa	astrology	Cosmic Blueprint & Conscious Timing	Cosmic Wisdom & Transits	Unpack your planetary blueprint and transit cycles to navigate career, personal crossroads, and life transitions with conscious timing.	Astrology at The Harmony Project is not fatalistic prediction; it is cosmic understanding. By studying planetary placements and energetic cycles, we help you understand your unique strengths, natural rhythms, and optimal windows for decisive action.	https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80	Moon	["Natal Birth Chart & Elemental Temperament Reading", "Planetary Transits (Gochar) & Mahadasha Cycle Analysis", "Strategic Decision Timing for Career & Life Shifts", "Remedial Lifestyle & Meditative Cosmic Alignments"]	f	t	3	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
12e2793c-8a89-40a6-b890-039fdd20c067	corporate-wellbeing	Holistic Wellness for Organizations	Organizational Harmony	Workplace restorative programs, stress reduction workshops, and executive wellness designed for sustainable team performance.	Burnout is not a personal failure; it is a structural imbalance. We design bespoke corporate wellness sessions that integrate restorative movement, mindful breathing between meetings, and ergonomic self-care.	https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80	Building2	["Signature Restorative Breathwork & Calm Sessions", "Desk-Bound Restorative Movement & Spine Alignment", "Corporate Nutrition & Sustained Energy Workshops", "Executive Stress Reduction & Nervous System Recovery", "Workplace Self-Care & Personal Vitality Seminars"]	f	t	4	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
f0a4c8cd-8ae7-4ca2-a736-dc52d5f3b357	food-as-medicine	Systemic Nourishment & Cellular Bio-Fuel	Cellular Vitality & Bio-Fuel	Nutritional wisdom grounded in cellular health, anti-inflammatory whole foods, and Ayurvedic seasonal rhythms (Ritucharya).	Every meal communicates directly with your body. We discard punitive dieting in favor of bio-available, seasonal nourishment that restores digestive fire (Agni), heals the gut, and dissolves inflammation.	https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80	Apple	["Nutritional & Systemic Nourishment Assessment", "Ritucharya (Seasonal & Circadian Eating Synchronization)", "Anti-Inflammatory Gut-Biome Restoration Protocols", "Mindful Food Preparation & Bio-Availability Practices"]	f	t	5	2026-11-18 12:42:43.553488+05:30	2026-11-18 12:42:43.553488+05:30
\.


--
-- Data for Name: subscribers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscribers (id, email, consent, subscribed_at, unsubscribed_at, unsubscribe_token_hash, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, google_id, name, email, avatar, role, created_at, updated_at, password_hash, auth_provider, is_active, last_login_at) FROM stdin;
2f1831cb-af3d-4cc5-9cf7-dbc7bed9e6d0	\N	Rohit Sharma	rohitsharmasa120111@gmail.com	\N	USER	2026-11-18 12:49:05.40945+05:30	2026-11-18 12:49:55.567183+05:30	$2b$12$8YX0EV1BgD1PdKGw1/dAV.OUjtLsAFmqLcU45uZPd5e.NNfkB/ULG	local	t	2026-11-18 12:49:55.567183+05:30
7a808d21-72fc-4d0c-b855-c7b63fa25759	\N	Vite Proxy User	vite.proxy@example.com	\N	USER	2026-11-18 12:50:39.849715+05:30	2026-11-18 12:50:39.849715+05:30	$2b$12$pP/b/I1yVjuYtvOoXE.pEOQWUezuGAiPy.DQgwtrOaiy9CwbCOLvu	local	t	\N
6374c459-390a-40f8-9944-0752b04b6858	\N	test	ram@email.com	\N	USER	2026-11-18 19:51:46.234892+05:30	2026-11-18 20:02:54.46341+05:30	$2b$12$lanwmniUFa6s./rIZb0jKefeBJ8UCKkn9TYBkwhUyvsz/MzXcVhHm	local	t	2026-11-18 20:02:54.46341+05:30
\.


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schema_migrations_id_seq', 4, true);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: articles articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_slug_key UNIQUE (slug);


--
-- Name: availability_overrides availability_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_overrides
    ADD CONSTRAINT availability_overrides_pkey PRIMARY KEY (id);


--
-- Name: availability_rules availability_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_rules
    ADD CONSTRAINT availability_rules_pkey PRIMARY KEY (id);


--
-- Name: consultation_types consultation_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_types
    ADD CONSTRAINT consultation_types_pkey PRIMARY KEY (id);


--
-- Name: consultation_types consultation_types_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_types
    ADD CONSTRAINT consultation_types_slug_key UNIQUE (slug);


--
-- Name: consultations consultations_booking_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_booking_reference_key UNIQUE (booking_reference);


--
-- Name: consultations consultations_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: consultations consultations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_name_key UNIQUE (name);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: services services_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_slug_key UNIQUE (slug);


--
-- Name: subscribers subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_email_key UNIQUE (email);


--
-- Name: subscribers subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_articles_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_articles_category ON public.articles USING btree (category);


--
-- Name: idx_articles_published_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_articles_published_at ON public.articles USING btree (published_at DESC) WHERE ((status)::text = 'PUBLISHED'::text);


--
-- Name: idx_articles_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_articles_slug ON public.articles USING btree (slug);


--
-- Name: idx_articles_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_articles_status ON public.articles USING btree (status);


--
-- Name: idx_availability_overrides_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_availability_overrides_date ON public.availability_overrides USING btree (override_date);


--
-- Name: idx_availability_overrides_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_availability_overrides_type ON public.availability_overrides USING btree (consultation_type_id);


--
-- Name: idx_availability_rules_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_availability_rules_active ON public.availability_rules USING btree (is_active);


--
-- Name: idx_availability_rules_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_availability_rules_day ON public.availability_rules USING btree (day_of_week);


--
-- Name: idx_availability_rules_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_availability_rules_type ON public.availability_rules USING btree (consultation_type_id);


--
-- Name: idx_consultation_types_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultation_types_active ON public.consultation_types USING btree (is_active);


--
-- Name: idx_consultation_types_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultation_types_order ON public.consultation_types USING btree (display_order);


--
-- Name: idx_consultation_types_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultation_types_slug ON public.consultation_types USING btree (slug);


--
-- Name: idx_consultations_active_range; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_active_range ON public.consultations USING btree (slot_start, slot_end) WHERE ((status)::text = ANY ((ARRAY['CONFIRMED'::character varying, 'PENDING'::character varying])::text[]));


--
-- Name: idx_consultations_booking_ref; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_booking_ref ON public.consultations USING btree (booking_reference);


--
-- Name: idx_consultations_idempotency; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_idempotency ON public.consultations USING btree (idempotency_key);


--
-- Name: idx_consultations_pillar; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_pillar ON public.consultations USING btree (pillar_interest);


--
-- Name: idx_consultations_slot_start; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_slot_start ON public.consultations USING btree (slot_start);


--
-- Name: idx_consultations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_status ON public.consultations USING btree (status);


--
-- Name: idx_consultations_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_type_id ON public.consultations USING btree (consultation_type_id);


--
-- Name: idx_consultations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_user_id ON public.consultations USING btree (user_id);


--
-- Name: idx_consultations_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_user_status ON public.consultations USING btree (user_id, status);


--
-- Name: idx_contact_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contact_messages_created_at ON public.contact_messages USING btree (created_at DESC);


--
-- Name: idx_contact_messages_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contact_messages_email ON public.contact_messages USING btree (email);


--
-- Name: idx_contact_messages_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contact_messages_status ON public.contact_messages USING btree (status);


--
-- Name: idx_services_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_active ON public.services USING btree (is_active);


--
-- Name: idx_services_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_category ON public.services USING btree (category);


--
-- Name: idx_services_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_order ON public.services USING btree (display_order);


--
-- Name: idx_services_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_slug ON public.services USING btree (slug);


--
-- Name: idx_subscribers_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscribers_active ON public.subscribers USING btree (subscribed_at) WHERE (unsubscribed_at IS NULL);


--
-- Name: idx_subscribers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscribers_email ON public.subscribers USING btree (email);


--
-- Name: idx_users_auth_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_auth_provider ON public.users USING btree (auth_provider);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_google_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_google_id ON public.users USING btree (google_id);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: articles trg_articles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: availability_overrides trg_availability_overrides_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_availability_overrides_updated_at BEFORE UPDATE ON public.availability_overrides FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: availability_rules trg_availability_rules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_availability_rules_updated_at BEFORE UPDATE ON public.availability_rules FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: consultation_types trg_consultation_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_consultation_types_updated_at BEFORE UPDATE ON public.consultation_types FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: consultations trg_consultations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: contact_messages trg_contact_messages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_contact_messages_updated_at BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: services trg_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: subscribers trg_subscribers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_subscribers_updated_at BEFORE UPDATE ON public.subscribers FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: availability_overrides availability_overrides_consultation_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_overrides
    ADD CONSTRAINT availability_overrides_consultation_type_id_fkey FOREIGN KEY (consultation_type_id) REFERENCES public.consultation_types(id) ON DELETE CASCADE;


--
-- Name: availability_rules availability_rules_consultation_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_rules
    ADD CONSTRAINT availability_rules_consultation_type_id_fkey FOREIGN KEY (consultation_type_id) REFERENCES public.consultation_types(id) ON DELETE CASCADE;


--
-- Name: consultations consultations_consultation_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_consultation_type_id_fkey FOREIGN KEY (consultation_type_id) REFERENCES public.consultation_types(id) ON DELETE RESTRICT;


--
-- Name: consultations consultations_rescheduled_from_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_rescheduled_from_id_fkey FOREIGN KEY (rescheduled_from_id) REFERENCES public.consultations(id) ON DELETE SET NULL;


--
-- Name: consultations consultations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict u36Et1CEURM8nxvHN8MCCAVOT4ifNUOpoVHVmpQNSbLVJa7RO07SHUrMA5o02xU

