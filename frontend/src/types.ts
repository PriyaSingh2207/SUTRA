export interface NodeEntity {
  id: string;
  bank: string;
  layer: 'L0_VICTIM' | 'L1_COLLECTOR' | 'L2_DISTRIBUTOR' | 'L3_TERMINAL' | 'SUSPECT_MULE' | 'SYNDICATE_MEMBER' | 'BENIGN';
  hop?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface LinkEntity {
  id: string;
  source: string | any;
  target: string | any;
  amount: number;
  timestamp: string;
  timestamp_epoch: number;
  payment_mode: string;
  narration: string;
  ip: string;
  device: string;
  is_scam: boolean;
}

export interface AccountProfile {
  account_id: string;
  bank_name: string;
  bank_code: string;
  total_credits: number;
  total_debits: number;
  net_retention: number;
  incoming_tx_count: number;
  outgoing_tx_count: number;
  incoming: any[];
  outgoing: any[];
}

export interface MuleCandidate {
  account_id: string;
  bank_name: string;
  in_degree: number;
  out_degree: number;
  total_credits: number;
  total_debits: number;
  pass_through_ratio: number;
  mule_risk_index: number;
  s_vel: number;
  s_topo: number;
  s_infra: number;
  s_narr: number;
  reason_codes: string[];
}

export interface SystemStatus {
  is_loaded: boolean;
  total_rows: number;
  ingest_duration_seconds: number;
  peak_ram_mb: number;
  dataset_hash: string | null;
  csv_path: string | null;
}
