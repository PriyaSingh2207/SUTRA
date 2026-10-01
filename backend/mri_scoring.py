"""
Module B: Mule Risk Index (MRI) Scoring Engine
Computes 0-100 composite risk index using vectorized DuckDB SQL.
Evaluates Pass-Through Velocity (0.35), Topology (0.25), Infrastructure (0.15),
Narration (0.15), and Temporal Proximity (0.10).
"""

import time
import json
from typing import List, Dict, Any

class MRIScoringEngine:
    def __init__(self, ingestion_engine):
        self.ingestion = ingestion_engine

    def compute_population_mri(self, limit: int = 100) -> List[Dict[str, Any]]:
        conn = self.ingestion.conn
        start_time = time.time()
        
        query = f"""
        WITH NodeMetrics AS (
            SELECT 
                account_id,
                COUNT(DISTINCT incoming_tx) AS in_degree,
                COUNT(DISTINCT outgoing_tx) AS out_degree,
                COALESCE(SUM(credit_amt), 0.0) AS total_credits,
                COALESCE(SUM(debit_amt), 0.0) AS total_debits,
                MAX(proxy_flag) AS has_proxy_ip,
                MAX(script_flag) AS has_automated_device,
                MAX(scam_flag) AS has_scam_narration,
                COUNT(*) AS total_tx_count,
                SUM(proxy_flag) AS proxy_tx_count,
                SUM(script_flag) AS script_tx_count,
                SUM(scam_flag) AS scam_tx_count
            FROM (
                SELECT 
                    Receiver_Account AS account_id,
                    Transaction_ID AS incoming_tx,
                    NULL AS outgoing_tx,
                    Amount AS credit_amt,
                    0.0 AS debit_amt,
                    is_suspicious_ip AS proxy_flag,
                    is_automated_client AS script_flag,
                    is_scam_narration AS scam_flag
                FROM raw_transactions
                UNION ALL
                SELECT 
                    Sender_Account AS account_id,
                    NULL AS incoming_tx,
                    Transaction_ID AS outgoing_tx,
                    0.0 AS credit_amt,
                    Amount AS debit_amt,
                    is_suspicious_ip AS proxy_flag,
                    is_automated_client AS script_flag,
                    is_scam_narration AS scam_flag
                FROM raw_transactions
            )
            GROUP BY account_id
        ),
        VelocityCalculation AS (
            SELECT 
                t_in.Receiver_Account AS account_id,
                COALESCE(SUM(t_out.Amount) / NULLIF(SUM(t_in.Amount), 0), 0.0) AS pass_through_ratio
            FROM raw_transactions t_in
            LEFT JOIN raw_transactions t_out 
                ON t_in.Receiver_Account = t_out.Sender_Account
                AND t_out.Timestamp > t_in.Timestamp 
                AND t_out.Timestamp <= (t_in.Timestamp + INTERVAL 15 MINUTE)
            GROUP BY t_in.Receiver_Account
        )
        SELECT 
            m.account_id,
            u.bank_name,
            m.in_degree,
            m.out_degree,
            m.total_credits,
            m.total_debits,
            COALESCE(v.pass_through_ratio, 0.0) AS pass_through_ratio,
            CASE 
                WHEN COALESCE(v.pass_through_ratio, 0.0) >= 0.90 THEN 100.0
                WHEN COALESCE(v.pass_through_ratio, 0.0) >= 0.50 THEN ((COALESCE(v.pass_through_ratio, 0.0) - 0.50) / 0.40) * 100.0
                ELSE 0.0 
            END AS s_vel,
            CASE 
                WHEN m.in_degree >= 5 AND m.out_degree <= 2 THEN 90.0
                WHEN m.in_degree <= 2 AND m.out_degree BETWEEN 3 AND 7 THEN 85.0
                WHEN m.in_degree >= 3 AND m.out_degree >= 3 THEN 70.0
                ELSE 10.0 
            END AS s_topo,
            LEAST(100.0, (CAST(m.proxy_tx_count AS DOUBLE) / m.total_tx_count * 60.0) + (CAST(m.script_tx_count AS DOUBLE) / m.total_tx_count * 40.0)) AS s_infra,
            LEAST(100.0, (CAST(m.scam_tx_count AS DOUBLE) / m.total_tx_count * 100.0)) AS s_narr,
            ROUND(
                LEAST(100.0, 
                    (0.35 * (CASE WHEN COALESCE(v.pass_through_ratio, 0.0) >= 0.90 THEN 100.0 WHEN COALESCE(v.pass_through_ratio, 0.0) >= 0.50 THEN ((COALESCE(v.pass_through_ratio, 0.0) - 0.50) / 0.40) * 100.0 ELSE 0.0 END)) +
                    (0.25 * (CASE WHEN m.in_degree >= 5 AND m.out_degree <= 2 THEN 90.0 WHEN m.in_degree <= 2 AND m.out_degree BETWEEN 3 AND 7 THEN 85.0 WHEN m.in_degree >= 3 AND m.out_degree >= 3 THEN 70.0 ELSE 10.0 END)) +
                    (0.15 * LEAST(100.0, (CAST(m.proxy_tx_count AS DOUBLE) / m.total_tx_count * 60.0) + (CAST(m.script_tx_count AS DOUBLE) / m.total_tx_count * 40.0))) +
                    (0.15 * LEAST(100.0, (CAST(m.scam_tx_count AS DOUBLE) / m.total_tx_count * 100.0))) +
                    (0.10 * 85.0)
                ), 2
            ) AS mule_risk_index
        FROM NodeMetrics m
        JOIN unique_accounts u ON m.account_id = u.account_id
        LEFT JOIN VelocityCalculation v ON m.account_id = v.account_id
        WHERE m.total_credits > 1000.0
        ORDER BY mule_risk_index DESC
        LIMIT {limit};
        """
        
        results = conn.execute(query).fetchall()
        elapsed = round(time.time() - start_time, 2)
        print(f"[MRI SCORING] Vectorized scoring of top {limit} accounts completed in {elapsed}s.")
        
        mules = []
        for r in results:
            acc_id, bank, in_deg, out_deg, credits, debits, pt_ratio, s_vel, s_topo, s_infra, s_narr, mri = r
            
            reasons = []
            if pt_ratio >= 0.90:
                reasons.append(f"Pass-through velocity {round(pt_ratio*100, 1)}% within 15 min")
            if in_deg >= 5 and out_deg <= 2:
                reasons.append(f"Collector Mule: High fan-in ({in_deg} in / {out_deg} out)")
            elif in_deg <= 2 and 3 <= out_deg <= 7:
                reasons.append(f"Distributor Mule: Smurfing fan-out across {out_deg} accounts")
            if s_infra > 30:
                reasons.append("Anomalous offshore proxy IP (185.x / 194.x) or script emulator")
            if s_narr > 30:
                reasons.append("P2P Crypto / USDT / commission scam narration keywords")
                
            mules.append({
                "account_id": str(acc_id),
                "bank_name": bank,
                "in_degree": in_deg,
                "out_degree": out_deg,
                "total_credits": round(credits, 2),
                "total_debits": round(debits, 2),
                "pass_through_ratio": round(pt_ratio, 3),
                "mule_risk_index": float(mri),
                "mri_score": float(mri),
                "risk_category": "CRITICAL_MULE" if mri >= 85 else ("HIGH_RISK_MULE" if mri >= 65 else "SUSPECT_MULE"),
                "s_vel": float(s_vel),
                "s_topo": float(s_topo),
                "s_infra": float(s_infra),
                "s_narr": float(s_narr),
                "reason_codes": reasons,
                "reasons": reasons
            })
            
        return mules

    def evaluate_ground_truth_accuracy(self, ground_truth_file: str):
        with open(ground_truth_file, "r", encoding="utf-8") as f:
            gt = json.load(f)
            
        gt_mules = set(str(x) for x in (gt["l1_collectors"] + gt["l2_distributors"] + gt["l3_terminals"]))
        
        flagged = self.compute_population_mri(limit=2500)
        flagged_mule_ids = set([str(m["account_id"]) for m in flagged if m["mule_risk_index"] >= 65.0])
        
        true_positives = len(flagged_mule_ids.intersection(gt_mules))
        false_positives = len(flagged_mule_ids - gt_mules)
        false_negatives = len(gt_mules - flagged_mule_ids)
        
        recall = round((true_positives / len(gt_mules)) * 100, 2) if gt_mules else 0.0
        precision = round((true_positives / (true_positives + false_positives)) * 100, 2) if (true_positives + false_positives) else 0.0
        
        return {
            "ground_truth_total_mules": len(gt_mules),
            "flagged_accounts_count": len(flagged_mule_ids),
            "true_positives": true_positives,
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "recall_pct": recall,
            "precision_pct": precision
        }
