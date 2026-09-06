-- Close quiz → Strategy Matrix goal bridge for remaining quiz ids.
-- App resolution uses LEGACY_GOAL_MAP in code; keep DB map in sync for client_map_legacy_goal RPC.

UPDATE public.training_goal_legacy_map
SET
  canonical_id = 'TONED_ARMS_UPPER_BODY',
  mapping_status = 'MAPPED',
  notes = 'Female quiz chest/upper tone → TONED_ARMS_UPPER_BODY'
WHERE legacy_id = 'tone';

UPDATE public.training_goal_legacy_map
SET
  canonical_id = 'POSTURE_TONED_BACK',
  mapping_status = 'MAPPED',
  notes = 'Female quiz healthy/athletic → POSTURE_TONED_BACK'
WHERE legacy_id = 'fit';

UPDATE public.training_goal_legacy_map
SET
  canonical_id = 'FITNESS_ENERGY',
  mapping_status = 'MAPPED',
  notes = 'Male quiz fitness → FITNESS_ENERGY'
WHERE legacy_id = 'fitness'
  AND (canonical_id IS NULL OR mapping_status = 'LEGACY_UNMAPPED');
