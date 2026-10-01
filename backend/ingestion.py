"""
Module A: High-Throughput Ingestion & Normalization Engine
Uses DuckDB 1.1+ to stream, normalize, and index 2M+ records in under 60 seconds.
"""

import os
import time
import hashlib
import psutil
import duckdb

BANK_IFSC_MAP = {
    "SBIN": "State Bank of India",
    "HDFC": "HDFC Bank",
    "ICIC": "ICICI Bank",
    "UTIB": "Axis Bank",
    "PUNB": "Punjab National Bank",
    "BARB": "Bank of Baroda",
    "KKBK": "Kotak Mahindra Bank",
    "CBIN": "Central Bank of India",
    "UBIO": "Union Bank of India",
    "INDB": "IndusInd Bank"
}

class IngestionEngine:
    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        self.conn = duckdb.connect(database=self.db_path)
        self.conn.execute("SET threads TO 8;")
        self.conn.execute("SET max_memory = '8GB';")
        self.conn.execute("SET preserve_insertion_order = false;")
        self.is_loaded = False
        self.dataset_hash = None
        self.total_rows = 0
        self.ingest_duration = 0.0
        self.peak_ram_mb = 0.0
        self.csv_path = None

    def calculate_file_sha256(self, filepath: str) -> str:
        hasher = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                hasher.update(chunk)
        return hasher.hexdigest()

    def ingest_csv(self, csv_path: str):
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Dataset not found at: {csv_path}")

        self.csv_path = csv_path
        start_time = time.time()
        start_ram = psutil.Process().memory_info().rss / (1024 * 1024)

        # 1. Compute SHA-256 for Section 63 BSA evidentiary integrity
        print(f"[INGESTION] Calculating SHA-256 hash for {csv_path}...")
        self.dataset_hash = self.calculate_file_sha256(csv_path)

        # 2. Create Quarantine Table for Rejected Rows
        self.conn.execute("""
            CREATE OR REPLACE TABLE rejected_rows (
                raw_row_id BIGINT,
                transaction_id VARCHAR,
                reason VARCHAR,
                rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 3. Vectorized Streaming Ingestion into DuckDB
        print(f"[INGESTION] Streaming records into DuckDB...")
        self.conn.execute(f"""
            CREATE OR REPLACE TABLE raw_transactions AS
            SELECT 
                Transaction_ID,
                Sender_Account,
                Receiver_Account,
                Sender_IFSC,
                Receiver_IFSC,
                Amount::DOUBLE AS Amount,
                Timestamp::TIMESTAMP AS Timestamp,
                Payment_Mode,
                Narration,
                IP_Address,
                Device_Type,
                -- Derived Entities & Anomaly Tags
                SUBSTRING(Sender_IFSC, 1, 4) AS Sender_Bank_Code,
                SUBSTRING(Receiver_IFSC, 1, 4) AS Receiver_Bank_Code,
                CASE 
                    WHEN IP_Address LIKE '185.%' OR IP_Address LIKE '194.%' THEN 1 
                    ELSE 0 
                END AS is_suspicious_ip,
                CASE 
                    WHEN Device_Type IN ('Web_Emulator', 'Linux_Script') THEN 1 
                    ELSE 0 
                END AS is_automated_client,
                CASE 
                    WHEN REGEXP_MATCHES(LOWER(Narration), '.*(p2p|usdt|crypto|commission|settle|binance|telegram|refund|bonus).*') THEN 1 
                    ELSE 0 
                END AS is_scam_narration
            FROM read_csv_auto('{csv_path}', header=True);
        """)

        # 4. Create Indexes for Sub-Second Multi-Hop Traversal
        print("[INGESTION] Building B-Tree indexes on sender, receiver, and timestamps...")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_sender ON raw_transactions(Sender_Account);")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_receiver ON raw_transactions(Receiver_Account);")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_ts ON raw_transactions(Timestamp);")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_tx_id ON raw_transactions(Transaction_ID);")

        # 5. Extract Unique Accounts Directory
        self.conn.execute("""
            CREATE OR REPLACE TABLE unique_accounts AS
            SELECT DISTINCT 
                account_id,
                bank_code,
                CASE 
                    WHEN bank_code = 'SBIN' THEN 'State Bank of India'
                    WHEN bank_code = 'HDFC' THEN 'HDFC Bank'
                    WHEN bank_code = 'ICIC' THEN 'ICICI Bank'
                    WHEN bank_code = 'UTIB' THEN 'Axis Bank'
                    WHEN bank_code = 'PUNB' THEN 'Punjab National Bank'
                    WHEN bank_code = 'BARB' THEN 'Bank of Baroda'
                    WHEN bank_code = 'KKBK' THEN 'Kotak Mahindra Bank'
                    WHEN bank_code = 'CBIN' THEN 'Central Bank of India'
                    WHEN bank_code = 'UBIO' THEN 'Union Bank of India'
                    WHEN bank_code = 'INDB' THEN 'IndusInd Bank'
                    ELSE 'Other Commercial Bank'
                END AS bank_name
            FROM (
                SELECT Sender_Account AS account_id, Sender_Bank_Code AS bank_code FROM raw_transactions
                UNION
                SELECT Receiver_Account AS account_id, Receiver_Bank_Code AS bank_code FROM raw_transactions
            );
        """)

        end_time = time.time()
        end_ram = psutil.Process().memory_info().rss / (1024 * 1024)
        
        self.ingest_duration = round(end_time - start_time, 2)
        self.peak_ram_mb = round(end_ram - start_ram, 2)
        self.total_rows = self.conn.execute("SELECT COUNT(*) FROM raw_transactions").fetchone()[0]
        self.is_loaded = True

        print(f"[INGESTION COMPLETE] {self.total_rows:,} rows loaded in {self.ingest_duration}s! RAM: {self.peak_ram_mb} MB")
        return {
            "status": "success",
            "total_rows": self.total_rows,
            "duration_seconds": self.ingest_duration,
            "peak_ram_mb": self.peak_ram_mb,
            "sha256": self.dataset_hash,
            "unique_accounts": self.conn.execute("SELECT COUNT(*) FROM unique_accounts").fetchone()[0]
        }

    def search_account(self, account_id: str):
        if not self.is_loaded:
            raise ValueError("No dataset loaded yet.")

        acc_info = self.conn.execute("""
            SELECT account_id, bank_name, bank_code FROM unique_accounts WHERE account_id = ?
        """, [account_id]).fetchone()

        if not acc_info:
            return None

        incoming = self.conn.execute("""
            SELECT Transaction_ID, Sender_Account, Sender_IFSC, Amount, Timestamp, Payment_Mode, Narration, IP_Address, Device_Type
            FROM raw_transactions WHERE Receiver_Account = ? ORDER BY Timestamp ASC LIMIT 50
        """, [account_id]).fetchall()

        outgoing = self.conn.execute("""
            SELECT Transaction_ID, Receiver_Account, Receiver_IFSC, Amount, Timestamp, Payment_Mode, Narration, IP_Address, Device_Type
            FROM raw_transactions WHERE Sender_Account = ? ORDER BY Timestamp ASC LIMIT 50
        """, [account_id]).fetchall()

        total_credits = self.conn.execute("SELECT COALESCE(SUM(Amount), 0.0) FROM raw_transactions WHERE Receiver_Account = ?", [account_id]).fetchone()[0]
        total_debits = self.conn.execute("SELECT COALESCE(SUM(Amount), 0.0) FROM raw_transactions WHERE Sender_Account = ?", [account_id]).fetchone()[0]

        return {
            "account_id": acc_info[0],
            "bank_name": acc_info[1],
            "bank_code": acc_info[2],
            "total_credits": round(total_credits, 2),
            "total_debits": round(total_debits, 2),
            "net_retention": round(total_credits - total_debits, 2),
            "incoming_tx_count": len(incoming),
            "outgoing_tx_count": len(outgoing),
            "incoming": [
                {"tx_id": r[0], "sender": r[1], "ifsc": r[2], "amount": r[3], "timestamp": str(r[4]), "mode": r[5], "narration": r[6], "ip": r[7], "device": r[8]}
                for r in incoming
            ],
            "outgoing": [
                {"tx_id": r[0], "receiver": r[1], "ifsc": r[2], "amount": r[3], "timestamp": str(r[4]), "mode": r[5], "narration": r[6], "ip": r[7], "device": r[8]}
                for r in outgoing
            ]
        }
