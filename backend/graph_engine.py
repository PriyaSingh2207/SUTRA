"""
Module B: High-Speed Graph Traversal Engine
Executes multi-hop BFS money trail searches (< 2s) and extracts connected syndicate subgraphs.
"""

import time
from collections import deque
from typing import Dict, List, Set, Any

class GraphEngine:
    def __init__(self, ingestion_engine):
        self.ingestion = ingestion_engine

    def trace_victim_trail(self, victim_account_id: str, max_hops: int = 4):
        """
        Computes downstream money trail up to 4 hops deep from victim_account_id.
        Returns nodes, edges, layer assignments, and execution latency.
        """
        start_time = time.time()
        conn = self.ingestion.conn
        
        # Verify victim exists
        victim_check = conn.execute("SELECT COUNT(*) FROM raw_transactions WHERE Sender_Account = ?", [victim_account_id]).fetchone()[0]
        if victim_check == 0:
            return {"status": "error", "message": f"Victim account {victim_account_id} not found in transactions."}

        # BFS state
        visited_nodes: Set[str] = {victim_account_id}
        queue = deque([(victim_account_id, 0, None)])  # (account_id, current_hop, parent_time)
        
        nodes_dict: Dict[str, Dict[str, Any]] = {}
        edges_list: List[Dict[str, Any]] = []
        
        # Add L0 Victim node
        v_bank = conn.execute("SELECT bank_name FROM unique_accounts WHERE account_id = ?", [victim_account_id]).fetchone()
        nodes_dict[victim_account_id] = {
            "id": victim_account_id,
            "bank": v_bank[0] if v_bank else "Unknown Bank",
            "layer": "L0_VICTIM",
            "hop": 0
        }

        while queue:
            curr_acc, curr_hop, parent_time = queue.popleft()
            if curr_hop >= max_hops:
                continue

            time_filter = f"AND Timestamp >= '{parent_time}'" if parent_time else ""
            query = f"""
                SELECT 
                    Transaction_ID,
                    Receiver_Account,
                    Amount,
                    Timestamp,
                    Payment_Mode,
                    Narration,
                    IP_Address,
                    Device_Type,
                    is_suspicious_ip,
                    is_automated_client,
                    is_scam_narration,
                    Receiver_Bank_Code
                FROM raw_transactions
                WHERE Sender_Account = ? {time_filter}
                ORDER BY Timestamp ASC
                LIMIT 25;
            """
            out_txs = conn.execute(query, [curr_acc]).fetchall()

            for tx in out_txs:
                tx_id, recv_acc, amount, ts, mode, narr, ip, dev, is_proxy, is_script, is_scam, bank_code = tx
                next_hop = curr_hop + 1
                
                layer_tag = "L1_COLLECTOR" if next_hop == 1 else ("L2_DISTRIBUTOR" if next_hop == 2 else "L3_TERMINAL")
                
                if recv_acc not in nodes_dict:
                    acc_info = conn.execute("SELECT bank_name FROM unique_accounts WHERE account_id = ?", [recv_acc]).fetchone()
                    nodes_dict[recv_acc] = {
                        "id": recv_acc,
                        "bank": acc_info[0] if acc_info else bank_code,
                        "layer": layer_tag,
                        "hop": next_hop
                    }
                    if recv_acc not in visited_nodes:
                        visited_nodes.add(recv_acc)
                        queue.append((recv_acc, next_hop, str(ts)))

                edges_list.append({
                    "id": tx_id,
                    "source": curr_acc,
                    "target": recv_acc,
                    "amount": round(amount, 2),
                    "timestamp": str(ts),
                    "timestamp_epoch": int(ts.timestamp()),
                    "payment_mode": mode,
                    "narration": narr,
                    "ip": ip,
                    "device": dev,
                    "is_scam": bool(is_scam or is_proxy or is_script)
                })

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        print(f"[GRAPH TRACE] 4-hop money trail for {victim_account_id} executed in {elapsed_ms}ms ({len(nodes_dict)} nodes, {len(edges_list)} edges)")

        return {
            "status": "success",
            "victim_account": victim_account_id,
            "latency_ms": elapsed_ms,
            "total_nodes": len(nodes_dict),
            "total_edges": len(edges_list),
            "nodes": list(nodes_dict.values()),
            "edges": edges_list
        }

    def isolate_syndicate_ring(self, suspect_account_id: str, radius_hops: int = 2):
        """
        Isolates weakly connected syndicate around suspect_account_id for export.
        """
        conn = self.ingestion.conn
        visited_nodes: Set[str] = {suspect_account_id}
        queue = deque([(suspect_account_id, 0)])
        
        edges: List[Dict[str, Any]] = []
        nodes: Dict[str, Dict[str, Any]] = {}
        
        while queue:
            curr_acc, curr_dist = queue.popleft()
            if curr_dist >= radius_hops:
                continue
                
            adjacent_txs = conn.execute("""
                SELECT Transaction_ID, Sender_Account, Receiver_Account, Amount, Timestamp, Payment_Mode, Narration, IP_Address, Device_Type, is_scam_narration
                FROM raw_transactions
                WHERE Sender_Account = ? OR Receiver_Account = ?
                LIMIT 40;
            """, [curr_acc, curr_acc]).fetchall()
            
            for tx in adjacent_txs:
                tx_id, s_acc, r_acc, amt, ts, mode, narr, ip, dev, is_scam = tx
                other_acc = r_acc if s_acc == curr_acc else s_acc
                
                if other_acc not in visited_nodes:
                    visited_nodes.add(other_acc)
                    queue.append((other_acc, curr_dist + 1))
                    
                edges.append({
                    "id": tx_id,
                    "source": s_acc,
                    "target": r_acc,
                    "amount": round(amt, 2),
                    "timestamp": str(ts),
                    "timestamp_epoch": int(ts.timestamp()),
                    "payment_mode": mode,
                    "narration": narr,
                    "ip": ip,
                    "device": dev,
                    "is_scam": bool(is_scam)
                })

        for nid in visited_nodes:
            b_info = conn.execute("SELECT bank_name FROM unique_accounts WHERE account_id = ?", [nid]).fetchone()
            nodes[nid] = {
                "id": nid,
                "bank": b_info[0] if b_info else "Commercial Bank",
                "layer": "SUSPECT_MULE" if nid == suspect_account_id else "SYNDICATE_MEMBER"
            }

        return {
            "status": "success",
            "ring_center": suspect_account_id,
            "nodes": list(nodes.values()),
            "edges": edges
        }
