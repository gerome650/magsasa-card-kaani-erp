# KaAni Schema v1 - Anonymous-First Farmer Profiles

**Purpose:** Support BSP-friendly pseudonymous workflow (anonymous first → identity link later) for KaAni recommendations.

## Tables

### `farmer_profiles`
**Purpose:** Store agronomic and economic context without PII (anonymous-first design).

**Key Fields:**
- `farmer_profile_id` (CHAR(36), PK): UUIDv4 identifier
- `created_by_user_id` (INT, indexed): Optional creator tracking
- Location: `province`, `municipality`, `barangay` (composite index)
- `crop_primary` (VARCHAR, indexed): Main crop type
- Agronomic: `average_yield`, `soil_type`, `irrigation_type`, `farm_size`
- Economic: `inputs` (JSON), `prices` (JSON)
- `additional_context` (JSON): Flexible metadata
- `created_at`, `updated_at`: Timestamps

**Design Rationale:** No farmer name or PII required. Profile can exist independently and be linked to identity later via `identity_links`.

### `kaani_recommendations`
**Purpose:** Store KaAni AI recommendations tied to farmer profiles.

**Key Fields:**
- `id` (INT, PK): Auto-increment identifier
- `farmer_profile_id` (CHAR(36), FK to `farmer_profiles` ON DELETE RESTRICT, indexed): Links to anonymous profile
- `recommendation_text` (TEXT): Recommendation content
- `recommendation_type` (VARCHAR): Category/type of recommendation
- `status` (VARCHAR): Recommendation status
- `created_at`, `updated_at`: Timestamps

**Design Rationale:** Recommendations are tied to profiles, not identities. Enables recommendations before identity linking. Foreign key uses ON DELETE RESTRICT to prevent orphaned recommendations.

### `identity_links`
**Purpose:** Map anonymous profiles to partner-based identities with consent metadata.

**Key Fields:**
- `id` (INT, PK): Auto-increment identifier
- `farmer_profile_id` (CHAR(36), FK to `farmer_profiles` ON DELETE RESTRICT, indexed): Anonymous profile
- `partner` (ENUM: 'card_mri', 'marketplace', 'other', indexed): Partner organization type
- `partner_farmer_ref` (VARCHAR(255), indexed): Partner's reference ID for the farmer
- `link_method` (ENUM: 'Manual', 'API', 'Import', 'Bulk'): How the link was established
- Consent metadata:
  - `consent_obtained` (INT, default 0): Consent flag (0=false, 1=true)
  - `consent_text_version` (VARCHAR): Version of consent text used
  - `consent_timestamp` (TIMESTAMP): When consent was obtained
  - `consent_actor_user_id` (INT): User who obtained consent
- `created_at`, `updated_at`: Timestamps

**Design Rationale:** Partner-based mapping (not user_id) enables BSP-friendly pseudonymous workflows. Identity linking separated with explicit consent tracking fields. Foreign key uses ON DELETE RESTRICT to prevent orphaned links. Unique constraint on (farmer_profile_id, partner, partner_farmer_ref) ensures one link per partner reference per profile.

### `conversations` (updated)
**Optional Enhancement:** Added nullable `farmer_profile_id` (CHAR(36), indexed) to link conversations to profiles without enforcement.

## Anonymous-First Workflow

1. **Create Profile:** User creates anonymous `farmer_profile` (no name/PII required)
2. **Get Recommendations:** KaAni generates recommendations based on profile agronomic/economic data
3. **Link Identity (Later):** User optionally links profile to identity via `identity_links` with consent

This design enables pseudonymous recommendations while maintaining BSP-friendly data posture (PII separation, consent tracking).

