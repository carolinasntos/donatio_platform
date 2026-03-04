-- ==========================================
-- UMA CONFIG
-- ==========================================
CREATE TABLE uma_config (
    id SERIAL PRIMARY KEY,
    year INT NOT NULL,
    daily_value_mxn DECIMAL(10,2) NOT NULL,
    annual_value_mxn DECIMAL(12,2),

    threshold_identification_uma INT DEFAULT 1605,
    threshold_notice_uma INT DEFAULT 3210,

    is_active BOOLEAN DEFAULT TRUE,
    source TEXT,
    notes TEXT
);

-- ==========================================
-- ORGANIZATIONS
-- ==========================================
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,

    name TEXT NOT NULL,
    rfc TEXT NOT NULL,

    moral_type TEXT CHECK (moral_type IN (
        'Asociación Civil',
        'Sociedad Civil',
        'Fundación',
        'Instituto',
        'Otro'
    )),

    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,

    phone TEXT,
    email TEXT,

    legal_rep_name TEXT,
    legal_rep_rfc TEXT,

    status TEXT DEFAULT 'active'
        CHECK (status IN ('active','inactive','suspended')),

    plan TEXT DEFAULT 'trial'
        CHECK (plan IN ('trial','basic','professional','enterprise')),

    logo_url TEXT,

    uma_config_id INT REFERENCES uma_config(id),

    risk_profile TEXT DEFAULT 'low'
        CHECK (risk_profile IN ('low','medium','high')),

    notes TEXT
);

-- ==========================================
-- DONORS
-- ==========================================
CREATE TABLE donors (
    id SERIAL PRIMARY KEY,

    organization_id INT NOT NULL
        REFERENCES organizations(id),

    donor_type TEXT DEFAULT 'fisica'
        CHECK (donor_type IN ('fisica','moral')),

    full_name TEXT NOT NULL,

    rfc TEXT,
    curp TEXT,
    birth_date DATE,

    nationality TEXT DEFAULT 'Mexicana',

    country_of_incorporation TEXT,
    incorporation_date DATE,

    activity TEXT,

    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'México',

    phone TEXT,
    email TEXT,

    legal_rep_name TEXT,
    legal_rep_rfc TEXT,
    legal_rep_curp TEXT,
    legal_rep_birth_date DATE,
    legal_rep_id_authority TEXT,
    legal_rep_id_number TEXT,

    beneficial_owner_exists BOOLEAN DEFAULT FALSE,
    beneficial_owner_name TEXT,
    beneficial_owner_rfc TEXT,

    pep_flag BOOLEAN DEFAULT FALSE,
    reputation_flag BOOLEAN DEFAULT FALSE,
    reputation_notes TEXT,

    risk_level TEXT DEFAULT 'low'
        CHECK (risk_level IN ('low','medium','high','critical')),

    compliance_status TEXT DEFAULT 'incomplete'
        CHECK (compliance_status IN (
            'ok',
            'identification_required',
            'notice_required',
            'blocked',
            'incomplete'
        )),

    kyc_complete BOOLEAN DEFAULT FALSE,

    portal_user_email TEXT,

    status TEXT DEFAULT 'pending'
        CHECK (status IN ('active','blocked','pending'))
);

-- ==========================================
-- DONOR DOCUMENTS
-- ==========================================
CREATE TABLE donor_documents (
    id SERIAL PRIMARY KEY,

    donor_id INT NOT NULL
        REFERENCES donors(id),

    organization_id INT NOT NULL
        REFERENCES organizations(id),

    document_type TEXT NOT NULL
        CHECK (document_type IN (
            'acta_constitutiva',
            'comprobante_domicilio',
            'poder_representante',
            'identificacion_representante',
            'cedula_fiscal',
            'constancia_dueno_beneficiario',
            'identificacion_dueno_beneficiario',
            'otro'
        )),

    document_name TEXT,
    file_url TEXT,

    upload_date DATE,
    expiry_date DATE,

    is_verified BOOLEAN DEFAULT FALSE,
    verified_by TEXT,
    verified_date DATE,

    notes TEXT,

    version INT DEFAULT 1,

    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending','valid','expired','rejected'))
);

-- ==========================================
-- COMPLIANCE CASES
-- ==========================================
CREATE TABLE compliance_cases (
    id SERIAL PRIMARY KEY,

    organization_id INT NOT NULL
        REFERENCES organizations(id),

    donor_id INT NOT NULL
        REFERENCES donors(id),

    case_type TEXT DEFAULT 'aviso_sat'
        CHECK (case_type IN ('identification','aviso_sat')),

    threshold_triggered TEXT
        CHECK (threshold_triggered IN ('identification','notice')),

    threshold_uma DECIMAL(10,2),
    accumulated_mxn DECIMAL(12,2),
    accumulated_uma DECIMAL(12,2),

    trigger_date DATE NOT NULL,
    deadline_date DATE,

    status TEXT DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'in_preparation',
            'captured_sat',
            'presented',
            'closed',
            'overdue'
        )),

    sat_folio TEXT,
    evidence_url TEXT,

    presented_date DATE,

    notes TEXT,
    assigned_to TEXT,
    appleseed_notes TEXT,

    risk_evaluation_done BOOLEAN DEFAULT FALSE,
    template_generated BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- DONATIONS
-- ==========================================
CREATE TABLE donations (
    id SERIAL PRIMARY KEY,

    organization_id INT NOT NULL
        REFERENCES organizations(id),

    donor_id INT NOT NULL
        REFERENCES donors(id),

    amount_mxn DECIMAL(12,2) NOT NULL,
    amount_uma DECIMAL(12,4),

    donation_date DATE NOT NULL,

    payment_method TEXT NOT NULL
        CHECK (payment_method IN (
            'transferencia',
            'cheque',
            'tarjeta',
            'efectivo',
            'otro'
        )),

    description TEXT,
    reference TEXT,
    receipt_url TEXT,

    accumulated_6m_at_donation DECIMAL(12,2),
    accumulated_uma_6m DECIMAL(12,2),

    threshold_triggered TEXT DEFAULT 'none'
        CHECK (threshold_triggered IN ('none','identification','notice')),

    is_manual_entry BOOLEAN DEFAULT FALSE,
    entry_notes TEXT,

    status TEXT DEFAULT 'registered'
        CHECK (status IN ('registered','blocked','cancelled')),

    compliance_case_id INT
        REFERENCES compliance_cases(id)
);

-- ==========================================
-- ALERTS
-- ==========================================
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,

    organization_id INT NOT NULL
        REFERENCES organizations(id),

    donor_id INT REFERENCES donors(id),
    donation_id INT REFERENCES donations(id),

    compliance_case_id INT
        REFERENCES compliance_cases(id),

    alert_type TEXT NOT NULL
        CHECK (alert_type IN (
            'cash_detected',
            'incomplete_info',
            'notice_overdue',
            'risk_evaluation_pending',
            'reputation_flag',
            'threshold_identification',
            'threshold_notice',
            'document_expired',
            'aviso_deadline_approaching'
        )),

    severity TEXT DEFAULT 'medium'
        CHECK (severity IN ('low','medium','high','critical')),

    title TEXT NOT NULL,
    description TEXT,

    status TEXT DEFAULT 'active'
        CHECK (status IN ('active','acknowledged','resolved','dismissed')),

    acknowledged_by TEXT,
    acknowledged_date TIMESTAMP,
    resolved_date TIMESTAMP,

    auto_generated BOOLEAN DEFAULT TRUE
);

-- ==========================================
-- SUPPORT TICKETS
-- ==========================================
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,

    organization_id INT
        REFERENCES organizations(id),

    compliance_case_id INT
        REFERENCES compliance_cases(id),

    donor_id INT
        REFERENCES donors(id),

    title TEXT NOT NULL,
    description TEXT NOT NULL,

    category TEXT DEFAULT 'compliance'
        CHECK (category IN ('compliance','technical','billing','general')),

    priority TEXT DEFAULT 'medium'
        CHECK (priority IN ('low','medium','high','urgent')),

    status TEXT DEFAULT 'open'
        CHECK (status IN (
            'open',
            'in_progress',
            'pending_osc',
            'resolved',
            'closed'
        )),

    assigned_to TEXT,

    notes JSONB,

    resolved_date TIMESTAMP
);

-- ==========================================
-- AUDIT LOG
-- ==========================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,

    organization_id INT
        REFERENCES organizations(id),

    user_email TEXT,
    user_role TEXT,

    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,

    description TEXT,
    ip_address TEXT,

    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
